import {
    Injectable,
    UnauthorizedException,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { EmailService } from '../email/email.service';
import {
    LoginDto,
    RegisterDto,
    ForgotPasswordDto,
    ResetPasswordDto,
    RefreshTokenDto,
    ChangePasswordDto,
} from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private emailService: EmailService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (user && (await bcrypt.compare(pass, user.password))) {
            const { password, resetToken, resetTokenExpiry, refreshToken, ...result } = user;
            return result;
        }
        return null;
    }

    private generateTokens(user: any) {
        const payload = { email: user.email, sub: user.id, role: user.role };

        const accessToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_SECRET'),
            expiresIn: 900, // 15 minutes
        });

        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET') || this.configService.get<string>('JWT_SECRET'),
            expiresIn: 604800, // 7 days
        });

        return { accessToken, refreshToken };
    }

    async login(loginDto: LoginDto) {
        const user = await this.validateUser(loginDto.email, loginDto.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const tokens = this.generateTokens(user);

        // Store refresh token hash
        const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: refreshTokenHash },
        });

        return {
            access_token: tokens.accessToken,
            refresh_token: tokens.refreshToken,
            user,
        };
    }

    async register(registerDto: RegisterDto) {
        // Check if user already exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email: registerDto.email },
        });

        if (existingUser) {
            throw new BadRequestException('Email already registered');
        }

        const hashedPassword = await bcrypt.hash(registerDto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                email: registerDto.email,
                password: hashedPassword,
                firstName: registerDto.firstName,
                lastName: registerDto.lastName,
                phone: registerDto.phone,
            },
        });

        const { password, resetToken, resetTokenExpiry, refreshToken, ...result } = user;

        // Send welcome email
        await this.emailService.sendWelcome(user.email, user.firstName);

        return result;
    }

    async refreshToken(refreshTokenDto: RefreshTokenDto) {
        try {
            // Verify the refresh token
            const payload = this.jwtService.verify(refreshTokenDto.refreshToken, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET') || this.configService.get<string>('JWT_SECRET'),
            });

            // Find user
            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
            });

            if (!user || !user.refreshToken) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            // Verify stored refresh token
            const isValid = await bcrypt.compare(refreshTokenDto.refreshToken, user.refreshToken);
            if (!isValid) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            // Generate new tokens (rotation)
            const tokens = this.generateTokens(user);

            // Update stored refresh token
            const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
            await this.prisma.user.update({
                where: { id: user.id },
                data: { refreshToken: refreshTokenHash },
            });

            const { password, resetToken, resetTokenExpiry, refreshToken: _, ...userResult } = user;

            return {
                access_token: tokens.accessToken,
                refresh_token: tokens.refreshToken,
                user: userResult,
            };
        } catch (error) {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }
    }

    async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: forgotPasswordDto.email },
        });

        // Don't reveal if user exists or not
        if (!user) {
            return { message: 'If the email exists, a reset link has been sent' };
        }

        // Generate reset token
        const resetToken = uuidv4();
        const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Store reset token
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetTokenExpiry,
            },
        });

        // Send reset email
        await this.emailService.sendPasswordReset(user.email, resetToken, user.firstName);

        return { message: 'If the email exists, a reset link has been sent' };
    }

    async resetPassword(resetPasswordDto: ResetPasswordDto) {
        const user = await this.prisma.user.findFirst({
            where: {
                resetToken: resetPasswordDto.token,
                resetTokenExpiry: { gt: new Date() },
            },
        });

        if (!user) {
            throw new BadRequestException('Invalid or expired reset token');
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);

        // Update password and clear reset token
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
                refreshToken: null, // Invalidate all sessions
            },
        });

        return { message: 'Password reset successfully' };
    }

    async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(
            changePasswordDto.currentPassword,
            user.password,
        );

        if (!isCurrentPasswordValid) {
            throw new BadRequestException('Current password is incorrect');
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

        await this.prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                refreshToken: null, // Invalidate all refresh tokens
            },
        });

        return { message: 'Password changed successfully' };
    }

    async logout(userId: string) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshToken: null },
        });

        return { message: 'Logged out successfully' };
    }

    async getProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { address: true },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const { password, resetToken, resetTokenExpiry, refreshToken, ...result } = user;
        return result;
    }
}


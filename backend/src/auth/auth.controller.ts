import {
    Body,
    Controller,
    Post,
    Get,
    Param,
    HttpCode,
    HttpStatus,
    UseGuards,
    Req,
    Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import {
    LoginDto,
    RegisterDto,
    ForgotPasswordDto,
    ResetPasswordDto,
    RefreshTokenDto,
    ChangePasswordDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './jwt.strategy';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @HttpCode(HttpStatus.OK)
    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
        return this.authService.refreshToken(refreshTokenDto);
    }

    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
        return this.authService.forgotPassword(forgotPasswordDto);
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
        return this.authService.resetPassword(resetPasswordDto);
    }

    @Post('change-password')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async changePassword(@Body() changePasswordDto: ChangePasswordDto, @Req() req: any) {
        const userId = req.user.sub || req.user.id;
        return this.authService.changePassword(userId, changePasswordDto);
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async logout(@Req() req: any) {
        const userId = req.user.sub || req.user.id;
        return this.authService.logout(userId);
    }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    async getProfile(@Req() req: any) {
        const userId = req.user.sub || req.user.id;
        return this.authService.getProfile(userId);
    }

    // ==================== GOOGLE OAUTH ====================

    /**
     * Initiate Google OAuth login
     * GET /auth/google
     */
    @Get('google')
    @UseGuards(AuthGuard('google'))
    async googleAuth() {
        // Passport handles the redirect
    }

    /**
     * Google OAuth callback
     * GET /auth/google/callback
     */
    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    async googleAuthCallback(@Req() req: any, @Res() res: any) {
        // User is in req.user after successful Google auth
        const tokens = await this.authService.generateTokensForOAuth(req.user);

        // Redirect to frontend with tokens (or return JSON)
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
        res.redirect(`${frontendUrl}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`);
    }

    // ==================== EMAIL VERIFICATION ====================

    /**
     * Send verification email
     * POST /auth/send-verification
     */
    @Post('send-verification')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async sendVerificationEmail(@Req() req: any) {
        const userId = req.user.sub || req.user.id;
        return this.authService.sendVerificationEmail(userId);
    }

    /**
     * Verify email with token
     * GET /auth/verify-email/:token
     */
    @Get('verify-email/:token')
    async verifyEmail(@Param('token') token: string) {
        return this.authService.verifyEmail(token);
    }
}


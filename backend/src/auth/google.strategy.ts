import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
    ) {
        super({
            clientID: configService.get<string>('GOOGLE_CLIENT_ID') || '',
            clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || '',
            callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') || 'http://localhost:3000/auth/google/callback',
            scope: ['email', 'profile'],
        });
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: Profile,
    ): Promise<any> {
        const { id, emails, name, photos } = profile;
        const email = emails?.[0]?.value;

        if (!email) {
            throw new UnauthorizedException('No email found in Google profile');
        }

        // Check if user exists with Google ID
        let user = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { googleId: id },
                    { email },
                ],
            },
        });

        if (user) {
            // Update Google ID if not set
            if (!user.googleId) {
                user = await this.prisma.user.update({
                    where: { id: user.id },
                    data: {
                        googleId: id,
                        authProvider: 'google',
                        emailVerified: true,
                        avatar: photos?.[0]?.value || user.avatar,
                    },
                });
            }
        } else {
            // Create new user
            user = await this.prisma.user.create({
                data: {
                    email,
                    googleId: id,
                    firstName: name?.givenName || 'User',
                    lastName: name?.familyName || '',
                    authProvider: 'google',
                    emailVerified: true,
                    avatar: photos?.[0]?.value,
                },
            });
        }

        return user;
    }
}


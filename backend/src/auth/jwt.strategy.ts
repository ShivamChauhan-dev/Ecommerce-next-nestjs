import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(config: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: config.get<string>('JWT_SECRET') || 'super-secret-key-change-this',
        });
    }

    async validate(payload: any) {
        return { userId: payload.sub, id: payload.sub, email: payload.email, role: payload.role, sub: payload.sub };
    }
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') { }

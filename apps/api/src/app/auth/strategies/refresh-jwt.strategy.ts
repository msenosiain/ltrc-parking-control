import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

interface JwtPayload {
  sub: string;
  [key: string]: unknown;
}

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refresh'),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(
        'GOOGLE_AUTH_REFRESH_JWT_SECRET',
        'super-secret-key',
      ),
    });
  }

  async validate(payload: JwtPayload) {
    const googleId = String(payload.sub);
    return await this.usersService.findOneByGoogleId(googleId);
  }
}

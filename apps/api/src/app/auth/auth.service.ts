import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/schemas/user.schema';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateJwt(user: User) {
    const payload = this.buildJWTPayload(user);
    const refreshSecret = this.configService.get<string>(
      'GOOGLE_AUTH_REFRESH_JWT_SECRET',
      'super-secret-key',
    );

    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, {
        secret: refreshSecret,
        expiresIn: '1d',
      }),
    };
  }

  refreshToken(user: User) {
    const payload = this.buildJWTPayload(user);

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  private buildJWTPayload(user: User) {
    return {
      sub: user.googleId,
      email: user.email,
      name: user.name,
      lastName: user.lastName,
      roles: user.roles,
    };
  }
}

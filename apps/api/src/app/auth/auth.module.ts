import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { GoogleStrategy } from './strategies/google.strategy';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { RefreshJwtStrategy } from './strategies/refresh-jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        // Prefer a dedicated AUTH_JWT_SECRET. For backward compatibility,
        // fall back to GOOGLE_AUTH_JWT_SECRET if AUTH_JWT_SECRET is not set.
        // Do NOT use a hard-coded weak default in production.
        const secret =
          configService.get<string>('AUTH_JWT_SECRET') ||
          configService.get<string>('GOOGLE_AUTH_JWT_SECRET');

        if (!secret) {
          // Fail fast so deployment/configurations without a secret are obvious.
          throw new Error(
            'Missing JWT secret: please set AUTH_JWT_SECRET (or GOOGLE_AUTH_JWT_SECRET)',
          );
        }

        return {
          secret,
          signOptions: { expiresIn: '1h' },
        };
      },
    }),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [GoogleStrategy, JwtStrategy, RefreshJwtStrategy, AuthService],
})
export class AuthModule {}

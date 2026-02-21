import { Module } from '@nestjs/common';
import { MembersModule } from './members/members.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AccessLogModule } from './access-log/access-log.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ParkingModule } from './parking/parking.module';
import * as Joi from 'joi';
import { join } from 'path';

export const configSchema = Joi.object({
  API_PORT: Joi.number().integer().required(),
  API_GLOBAL_PREFIX: Joi.string().required(),
  API_CORS_ALLOWED_ORIGINS: Joi.string().required(),
  MONGODB_URI: Joi.string().required(),
  ACCESS_LOG_THRESHOLD: Joi.number().integer().required(),
  GOOGLE_AUTH_CLIENT_ID: Joi.string().allow('').optional(),
  GOOGLE_AUTH_CLIENT_SECRET: Joi.string().allow('').optional(),
  GOOGLE_AUTH_REDIRECT_URL: Joi.string().allow('').optional(),
  GOOGLE_AUTH_ALLOWED_DOMAIN: Joi.string().allow('').optional(),
  GOOGLE_AUTH_CALLBACK_URL: Joi.string().allow('').optional(),
  GOOGLE_AUTH_JWT_SECRET: Joi.string().allow('').optional(),
  GOOGLE_AUTH_REFRESH_JWT_SECRET: Joi.string().allow('').optional(),
  PARKING_SPACES: Joi.number().required(),
  AUTH_JWT_SECRET: Joi.string().optional(),
  AUTH_REFRESH_JWT_SECRET: Joi.string().optional(),
});

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        '.env',                                         // Archivo unificado en la raíz
        join(__dirname, '..', '..', '.env'),           // Fallback para estructura de build
        join(process.cwd(), 'apps', 'api', '.env'),    // Legacy path
      ],
      validationSchema: configSchema,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>(
          'MONGODB_URI',
          'mongodb://localhost:27017/ltrc-parking-control',
        ),
      }),
    }),
    MembersModule,
    AccessLogModule,
    AuthModule,
    UsersModule,
    ParkingModule,
  ],
})
export class AppModule {}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseExceptionFilter } from './app/common/filters/mongoose-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  Logger.log('Enabling CORS');
  const corsAllowedOrigins = configService.get('API_CORS_ALLOWED_ORIGINS', '');
  const corsAllowedOriginsArray = corsAllowedOrigins
    .split(',')
    .map((item: string) => item.trim());
  app.enableCors({ origin: corsAllowedOriginsArray, credentials: true });

  Logger.log('Adding global prefix');
  const globalPrefix = configService.get<string>('API_GLOBAL_PREFIX', '/api');
  app.setGlobalPrefix(globalPrefix);

  app.useGlobalFilters(new MongooseExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  const port = configService.get<number>('API_PORT') || 3000;
  await app.listen(port);

  Logger.log(`Listening at http://localhost:${port}${globalPrefix}`);
}

bootstrap();

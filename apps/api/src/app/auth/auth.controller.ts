import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { RefreshJwtAuthGuard } from './guards/refresh-jwt-auth.guard';
import { User } from '../users/schemas/user.schema';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(): Promise<void> {
    // Passport handles the redirect flow; method intentionally no-op
    return;
  }

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const user = (req as unknown as { user?: User }).user;
    const token = await this.authService.generateJwt(user as User);
    const callbackUrl = this.configService.get<string>(
      'GOOGLE_AUTH_CALLBACK_URL',
      'http://localhost:4200/auth/callback',
    );
    res.redirect(
      `${callbackUrl}?access_token=${token.access_token}&refresh_token=${token.refresh_token}`,
    );
  }

  @UseGuards(RefreshJwtAuthGuard)
  @Post('refresh')
  async refreshTokens(@Req() req: Request) {
    const user = (req as unknown as { user?: User }).user;
    return this.authService.refreshToken(user as User);
  }
}

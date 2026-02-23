import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { User } from '../../users/schemas/user.schema';

type GoogleProfile = {
  id: string;
  emails?: Array<{ value: string }>;
  name?: { givenName?: string; familyName?: string };
};

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly allowedDomain: string;

  constructor(
    private usersService: UsersService,
    configService: ConfigService,
  ) {
    // Read raw redirect URL and API_GLOBAL_PREFIX from config and normalize to avoid duplicated prefix segments
    const rawRedirect = configService.get<string>(
      'GOOGLE_AUTH_REDIRECT_URL',
      'http://localhost:3000/api/v1/auth/google/redirect',
    );
    const apiGlobalPrefix = String(configService.get<string>('API_GLOBAL_PREFIX', '/api/v1'));

    let callbackURL: string;
    try {
      const isAbsolute = /^https?:\/\//i.test(rawRedirect);

      // Normalize prefix to a single segment without leading/trailing slashes (e.g. 'api/v1')
      const segment = apiGlobalPrefix.replace(/^\/+/g, '').replace(/\/+$/g, '');
      const terminal = 'auth/google/redirect';

      // If no prefix configured, just use the terminal path (absolute or relative as provided)
      const desiredPath = segment ? `/${segment}/${terminal}` : `/${terminal}`;

      // Collapse repeated groups like '/api/v1/api/v1' -> '/api/v1'
      const collapsedPath = desiredPath.replace(new RegExp(`(/${segment})+`, 'g'), `/${segment}`);

      if (isAbsolute) {
        const url = new URL(rawRedirect);
        url.pathname = collapsedPath;
        callbackURL = url.toString();
      } else {
        callbackURL = collapsedPath;
      }
    } catch (e) {
      // If parsing fails, fall back to the raw value (safe default)
      callbackURL = rawRedirect;
    }

    super({
      clientID: configService.get<string>('GOOGLE_AUTH_CLIENT_ID') || 'dummy',
      clientSecret: configService.get<string>('GOOGLE_AUTH_CLIENT_SECRET') || 'dummy',
      callbackURL,
      scope: ['email', 'profile'],
    });
    this.allowedDomain = configService.get<string>('GOOGLE_AUTH_ALLOWED_DOMAIN', '');
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    const p = profile as unknown as GoogleProfile;
    const { id, name, emails } = p;
    const email = emails?.[0]?.value;
    const domain = email?.split('@')[1] ?? '';

    // Restrict to your Google Workspace domain
    if (domain !== this.allowedDomain) {
      return done(new Error('Unauthorized domain'), false);
    }

    let user: User | null = await this.usersService.findOneByGoogleId(id as string);

    if (!user) {
      user = await this.usersService.create({
        email: emails?.[0]?.value,
        googleId: id as string,
        name: name?.givenName,
        lastName: name?.familyName,
      } as Partial<User>);
    }
    done(null, user);
  }
}

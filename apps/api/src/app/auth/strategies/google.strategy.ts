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
  private allowedDomain: string;

  constructor(
    private usersService: UsersService,
    configService: ConfigService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_AUTH_CLIENT_ID') || '',
      clientSecret: configService.get<string>('GOOGLE_AUTH_CLIENT_SECRET') || '',
      callbackURL: configService.get<string>(
        'GOOGLE_AUTH_REDIRECT_URL',
        'http://localhost:3000/api/auth/google/redirect',
      ),
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

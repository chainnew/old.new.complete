import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import AppleStrategy from 'passport-apple';
import { db } from '../database/connection';
import jwt from 'jsonwebtoken';

export interface OAuthProfile {
  provider: 'google' | 'github' | 'apple';
  providerId: string;
  email: string;
  name?: string;
  avatar?: string;
}

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const oauthProfile: OAuthProfile = {
            provider: 'google',
            providerId: profile.id,
            email: profile.emails?.[0]?.value || '',
            name: profile.displayName,
            avatar: profile.photos?.[0]?.value,
          };
          return done(null, oauthProfile);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );
}

// GitHub OAuth Strategy
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/api/auth/github/callback',
        scope: ['user:email'],
      },
      async (accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          const oauthProfile: OAuthProfile = {
            provider: 'github',
            providerId: profile.id,
            email: profile.emails?.[0]?.value || profile.email || '',
            name: profile.displayName || profile.username,
            avatar: profile.photos?.[0]?.value || profile.avatar_url,
          };
          return done(null, oauthProfile);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );
}

// Apple OAuth Strategy
if (process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID) {
  passport.use(
    new AppleStrategy(
      {
        clientID: process.env.APPLE_CLIENT_ID,
        teamID: process.env.APPLE_TEAM_ID,
        keyID: process.env.APPLE_KEY_ID,
        privateKeyString: process.env.APPLE_PRIVATE_KEY || '',
        callbackURL: process.env.APPLE_CALLBACK_URL || 'http://localhost:3000/api/auth/apple/callback',
        scope: ['email', 'name'],
        passReqToCallback: false,
      } as any,
      async (accessToken: string, refreshToken: string, idToken: any, profile: any, done: any) => {
        try {
          const oauthProfile: OAuthProfile = {
            provider: 'apple',
            providerId: profile.id || idToken.sub,
            email: profile.email || idToken.email || '',
            name: profile.name?.firstName ? `${profile.name.firstName} ${profile.name.lastName || ''}`.trim() : undefined,
          };
          return done(null, oauthProfile);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );
}

// Serialize user for session (optional, mainly for OAuth flow)
passport.serializeUser((user: any, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  done(null, user);
});

/**
 * Find or create user from OAuth profile
 */
export async function findOrCreateOAuthUser(profile: OAuthProfile): Promise<{ user: any; token: string; isNewUser: boolean }> {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // Check if user exists with this OAuth provider
    const existingOAuth = await client.query(
      'SELECT * FROM oauth_providers WHERE provider = $1 AND provider_user_id = $2',
      [profile.provider, profile.providerId]
    );

    if (existingOAuth.rows.length > 0) {
      // User exists, get their details
      const userId = existingOAuth.rows[0].user_id;
      const userResult = await client.query(
        'SELECT id, email, full_name, avatar_url, created_at FROM users WHERE id = $1',
        [userId]
      );

      await client.query('COMMIT');

      const user = userResult.rows[0];
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      return { user, token, isNewUser: false };
    }

    // Check if user exists with the same email
    let userId: string;
    let isNewUser = false;

    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [profile.email]
    );

    if (existingUser.rows.length > 0) {
      // Link OAuth to existing user
      userId = existingUser.rows[0].id;
    } else {
      // Create new user
      const newUser = await client.query(
        `INSERT INTO users (email, full_name, avatar_url, email_verified)
         VALUES ($1, $2, $3, true)
         RETURNING id`,
        [profile.email, profile.name, profile.avatar]
      );
      userId = newUser.rows[0].id;
      isNewUser = true;
    }

    // Create OAuth provider link
    await client.query(
      `INSERT INTO oauth_providers (user_id, provider, provider_user_id, provider_email)
       VALUES ($1, $2, $3, $4)`,
      [userId, profile.provider, profile.providerId, profile.email]
    );

    await client.query('COMMIT');

    // Get complete user details
    const userResult = await client.query(
      'SELECT id, email, full_name, avatar_url, created_at FROM users WHERE id = $1',
      [userId]
    );

    const user = userResult.rows[0];
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    return { user, token, isNewUser };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export default passport;

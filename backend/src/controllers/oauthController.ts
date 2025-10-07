import { Request, Response, NextFunction } from 'express';
import { findOrCreateOAuthUser, OAuthProfile } from '../config/oauth';

/**
 * Handle OAuth callback
 */
export async function handleOAuthCallback(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = req.user as OAuthProfile;

    if (!profile) {
      throw new Error('OAuth authentication failed');
    }

    const { user, token, isNewUser } = await findOrCreateOAuthUser(profile);

    // Determine redirect URL based on environment
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUrl = `${frontendUrl}/auth/callback?token=${token}&isNewUser=${isNewUser}`;

    // Redirect to frontend with token
    res.redirect(redirectUrl);

  } catch (error) {
    console.error('OAuth callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/error?message=OAuth authentication failed`);
  }
}

/**
 * Initiate OAuth flow (handled by passport middleware)
 */
export function initiateOAuth(req: Request, res: Response) {
  // This is handled by passport.authenticate middleware
  // Just here for type consistency
}

/**
 * Get available OAuth providers
 */
export function getOAuthProviders(req: Request, res: Response) {
  const providers = [];

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push({
      name: 'google',
      displayName: 'Google',
      authUrl: '/api/auth/google',
    });
  }

  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    providers.push({
      name: 'github',
      displayName: 'GitHub',
      authUrl: '/api/auth/github',
    });
  }

  if (process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID) {
    providers.push({
      name: 'apple',
      displayName: 'Apple',
      authUrl: '/api/auth/apple',
    });
  }

  res.json({ providers });
}

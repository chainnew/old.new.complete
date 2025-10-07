# OAuth Quick Start (5 Minutes)

Get Google and GitHub OAuth working in 5 minutes.

## 1. Install Dependencies (30 seconds)

```bash
cd backend
npm install
```

## 2. Update Database Schema (30 seconds)

```bash
# Apply the OAuth schema changes
psql -U postgres -d oldnew_dev -f src/database/schema.sql
```

Or manually:
```sql
-- Make password optional for OAuth users
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Add OAuth fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- Create OAuth providers table
CREATE TABLE IF NOT EXISTS oauth_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    provider_email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_user_id)
);
```

## 3. Get Google OAuth Credentials (2 minutes)

1. Go to https://console.cloud.google.com/
2. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth Client ID**
3. Application type: **Web application**
4. Authorized redirect URIs: `http://localhost:3000/api/auth/google/callback`
5. Copy **Client ID** and **Client Secret**

## 4. Get GitHub OAuth Credentials (2 minutes)

1. Go to https://github.com/settings/developers
2. **OAuth Apps** → **New OAuth App**
3. Callback URL: `http://localhost:3000/api/auth/github/callback`
4. Copy **Client ID** and **Client Secret**

## 5. Update Backend .env (30 seconds)

```bash
cd backend
cp .env.example .env
```

Edit `.env` and add:

```bash
# Session
SESSION_SECRET=my-super-secret-session-key-12345

# Frontend
FRONTEND_URL=http://localhost:5173

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback
```

## 6. Start Backend (10 seconds)

```bash
cd backend
npm run dev
```

## 7. Start Frontend (10 seconds)

```bash
cd doco-new.old.new
npm run dev
```

## 8. Test OAuth (30 seconds)

1. Open http://localhost:5173
2. Go to login page
3. You should see **Google** and **GitHub** login buttons
4. Click one to test the OAuth flow

## Done! 🎉

You now have Google and GitHub OAuth working!

## What Was Created

**Backend:**
- [backend/src/config/oauth.ts](backend/src/config/oauth.ts) - OAuth provider configuration
- [backend/src/controllers/oauthController.ts](backend/src/controllers/oauthController.ts) - OAuth endpoints
- Updated [backend/src/routes/index.ts](backend/src/routes/index.ts) - OAuth routes
- Updated [backend/src/server.ts](backend/src/server.ts) - Passport middleware
- Updated [backend/src/database/schema.sql](backend/src/database/schema.sql) - OAuth tables

**Frontend:**
- [doco-new.old.new/src/components/OAuthButtons.tsx](doco-new.old.new/src/components/OAuthButtons.tsx) - OAuth UI buttons
- [doco-new.old.new/src/components/AuthCallback.tsx](doco-new.old.new/src/components/AuthCallback.tsx) - Callback handler

## API Endpoints

```
GET  /api/auth/providers          - List available OAuth providers
GET  /api/auth/google             - Start Google OAuth
GET  /api/auth/google/callback    - Google callback
GET  /api/auth/github             - Start GitHub OAuth
GET  /api/auth/github/callback    - GitHub callback
```

## Frontend Usage

```tsx
import OAuthButtons from './components/OAuthButtons';

function LoginPage() {
  return (
    <div>
      <OAuthButtons />
    </div>
  );
}
```

## Troubleshooting

**"Redirect URI mismatch"**
- Check callback URLs match exactly (including port :3000)

**OAuth buttons don't appear**
- Make sure backend is running
- Check browser console for errors
- Verify VITE_API_BASE_URL in frontend .env

**User not created**
- Check database schema was applied
- Check backend logs for errors

## Next Steps

- See [OAUTH_SETUP.md](OAUTH_SETUP.md) for Apple OAuth setup
- See [OAUTH_SETUP.md](OAUTH_SETUP.md) for production deployment
- Customize OAuth button styling in OAuthButtons.tsx

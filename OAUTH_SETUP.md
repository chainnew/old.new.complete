# OAuth Authentication Setup Guide

This guide walks you through setting up Google, Apple, and GitHub OAuth authentication for your Old.New backend.

## Overview

The OAuth implementation allows users to sign in with:
- **Google** - Most common, easy to set up
- **GitHub** - Great for developer-focused apps
- **Apple** - Required for iOS apps, more complex setup

## Prerequisites

- Backend server running (Node.js/Express)
- PostgreSQL database with OAuth schema migrated
- Frontend running at your specified URL

---

## 1. Google OAuth Setup

### Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen if prompted:
   - User Type: External
   - App name: Old.New
   - User support email: your-email@example.com
   - Developer contact: your-email@example.com
6. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: Old.New Backend
   - Authorized redirect URIs:
     - Development: `http://localhost:3000/api/auth/google/callback`
     - Production: `https://yourdomain.com/api/auth/google/callback`
7. Copy your **Client ID** and **Client Secret**

### Add to Backend .env

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```

---

## 2. GitHub OAuth Setup

### Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** → **New OAuth App**
3. Fill in the details:
   - Application name: Old.New
   - Homepage URL: `http://localhost:5173` (dev) or your production URL
   - Authorization callback URL:
     - Development: `http://localhost:3000/api/auth/github/callback`
     - Production: `https://yourdomain.com/api/auth/github/callback`
4. Click **Register application**
5. Copy your **Client ID**
6. Click **Generate a new client secret** and copy it

### Add to Backend .env

```bash
# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback
```

---

## 3. Apple OAuth Setup

⚠️ **Note:** Apple OAuth is more complex and requires:
- Apple Developer Account ($99/year)
- Registered domain
- Service ID, Team ID, Key ID

### Create Apple Sign In

1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Create an **App ID**:
   - Select **App IDs**
   - Click **+** to create new
   - Description: Old.New
   - Bundle ID: com.yourcompany.oldnew
   - Enable **Sign in with Apple**
4. Create a **Services ID**:
   - Select **Services IDs**
   - Click **+**
   - Description: Old.New Web
   - Identifier: com.yourcompany.oldnew.web
   - Enable **Sign in with Apple**
   - Configure:
     - Primary App ID: Select your App ID
     - Domains: `yourdomain.com`
     - Return URLs: `https://yourdomain.com/api/auth/apple/callback`
5. Create a **Key**:
   - Select **Keys**
   - Click **+**
   - Name: Old.New Sign In Key
   - Enable **Sign in with Apple**
   - Configure: Select your Primary App ID
   - Download the `.p8` key file (you can only download once!)
   - Note the **Key ID**
6. Get your **Team ID**:
   - Found in top right of developer portal
   - Or under Membership details

### Add to Backend .env

```bash
# Apple OAuth
APPLE_CLIENT_ID=com.yourcompany.oldnew.web
APPLE_TEAM_ID=YOUR_TEAM_ID
APPLE_KEY_ID=YOUR_KEY_ID
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_CONTENT\n-----END PRIVATE KEY-----"
APPLE_CALLBACK_URL=https://yourdomain.com/api/auth/apple/callback
```

**Note:** For the private key, you can either:
- Paste the entire content (with `\n` for line breaks)
- Or reference a file path and update the oauth.ts to read from file

---

## 4. Common Configuration

### Session Secret

Add a secure session secret to your backend .env:

```bash
SESSION_SECRET=your-super-secret-random-string-change-this
```

Generate a strong secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Frontend URL

Specify your frontend URL for OAuth redirects:

```bash
FRONTEND_URL=http://localhost:5173
```

### Complete Backend .env Example

```bash
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/oldnew

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-jwt-secret

# Session
SESSION_SECRET=your-session-secret

# Frontend
FRONTEND_URL=http://localhost:5173

# xAI Grok
XAI_API_KEY=your-xai-api-key
XAI_MODEL=grok-4-fast-reasoning-20251001

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback

# Apple OAuth (optional)
APPLE_CLIENT_ID=com.yourcompany.oldnew.web
APPLE_TEAM_ID=YOUR_TEAM_ID
APPLE_KEY_ID=YOUR_KEY_ID
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
APPLE_CALLBACK_URL=https://yourdomain.com/api/auth/apple/callback
```

---

## 5. Database Migration

Run the migration to add the OAuth providers table:

```bash
cd backend
npm run migrate
```

Or manually apply the schema changes:

```sql
-- Add optional password for OAuth users
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
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_user_id)
);
```

---

## 6. Frontend Integration

### Add OAuth Buttons to Login Page

```tsx
import OAuthButtons from '../components/OAuthButtons';

function LoginPage() {
  return (
    <div>
      <h1>Sign In</h1>

      {/* Traditional email/password login */}
      <form>
        {/* ... your login form ... */}
      </form>

      {/* OAuth buttons */}
      <OAuthButtons />
    </div>
  );
}
```

### Add Auth Callback Route

In your React Router setup:

```tsx
import AuthCallback from './components/AuthCallback';

function App() {
  return (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallback />} />
      {/* ... other routes ... */}
    </Routes>
  );
}
```

---

## 7. Testing OAuth Flow

1. **Start Backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend:**
   ```bash
   cd doco-new.old.new
   npm run dev
   ```

3. **Test OAuth:**
   - Navigate to login page
   - Click on an OAuth provider button (Google/GitHub/Apple)
   - Complete OAuth flow on provider's site
   - You should be redirected back with a token
   - Check that user is created in database

4. **Verify Database:**
   ```sql
   -- Check users table
   SELECT id, email, full_name, email_verified FROM users;

   -- Check OAuth providers
   SELECT user_id, provider, provider_email FROM oauth_providers;
   ```

---

## 8. API Endpoints

### Get Available Providers
```
GET /api/auth/providers
```

Returns list of configured OAuth providers.

### Initiate OAuth Flow
```
GET /api/auth/google
GET /api/auth/github
GET /api/auth/apple
```

Redirects to OAuth provider for authentication.

### OAuth Callback (handled automatically)
```
GET /api/auth/google/callback
GET /api/auth/github/callback
POST /api/auth/apple/callback
```

Processes OAuth response and redirects to frontend with token.

---

## 9. Production Deployment

### Update Callback URLs

1. **Google Console:**
   - Add production callback URL
   - Update authorized origins

2. **GitHub Settings:**
   - Update callback URL to production domain

3. **Apple Developer:**
   - Update Service ID domains and return URLs
   - Requires verified domain ownership

### Environment Variables

Update production .env with:
- Production frontend URL
- Production callback URLs
- Secure session secret
- HTTPS callback URLs (required for production)

### Security Checklist

- ✅ Use HTTPS in production
- ✅ Set secure session cookies (`secure: true`)
- ✅ Use strong SESSION_SECRET
- ✅ Verify domain ownership for Apple
- ✅ Keep OAuth secrets secure (never commit to git)
- ✅ Enable CORS only for your frontend domain
- ✅ Set proper token expiration times

---

## 10. Troubleshooting

### "Redirect URI mismatch" Error

- Double-check callback URLs match exactly in OAuth console
- Include port number for localhost (`:3000`)
- Check for trailing slashes

### "OAuth provider not configured" Error

- Verify environment variables are loaded
- Check .env file is in correct location
- Restart backend server after adding credentials

### User Not Created in Database

- Check database connection
- Verify schema migration ran successfully
- Check backend logs for errors

### Token Not Stored in Frontend

- Check browser console for errors
- Verify AuthCallback component is mounted
- Check localStorage for token

---

## Support

For OAuth-specific issues:
- **Google:** [OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- **GitHub:** [OAuth Apps Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- **Apple:** [Sign in with Apple](https://developer.apple.com/sign-in-with-apple/)

---

## Summary

You've now configured OAuth authentication! Users can sign in with:

✅ **Google** - Fastest to set up, most user-friendly
✅ **GitHub** - Great for developer tools
✅ **Apple** - Required for iOS, more complex setup

Each provider creates or links to an existing user account based on email address.

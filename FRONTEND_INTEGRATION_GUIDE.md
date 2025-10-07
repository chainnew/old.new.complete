# Frontend Integration Guide

Complete guide to integrating the Old.New backend with the React frontend.

## ✅ What's Been Done

I've integrated the complete backend API with your React frontend!

### Created Files

1. **`src/lib/api.ts`** - Complete API client
   - Authentication (register, login, logout)
   - Document operations (upload, classify, analyze, enhance, export)
   - Health check
   - Token management
   - File download helper

2. **`src/hooks/useDocumentEnhancement.ts`** - React hooks for document processing
   - `useDocumentEnhancement()` - Complete workflow with progress tracking
   - `useDocumentExport()` - Export documents to various formats
   - `useDocumentList()` - List user's documents

3. **`src/hooks/useAuth.ts`** - Authentication hook
   - Login/Register/Logout
   - User state management
   - Auto-load user on mount

4. **`src/components/DocumentEnhancementDemo.tsx`** - Complete demo component
   - Full workflow demonstration
   - File upload
   - Enhancement level selection
   - Results display
   - Export to all formats

5. **`.env` and `.env.example`** - Environment configuration
   - Backend API URL configuration

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd doco-new.old.new
npm install
```

### 2. Configure Backend URL

The `.env` file is already configured to point to `http://localhost:3000/api`.

For production, update `.env`:
```bash
VITE_API_BASE_URL=https://your-production-api.com/api
```

### 3. Start Both Servers

Terminal 1 - Backend:
```bash
cd ../backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd doco-new.old.new
npm run dev
```

## 📚 Usage Examples

### Basic Document Enhancement

```typescript
import { useDocumentEnhancement } from './hooks/useDocumentEnhancement';

function MyComponent() {
  const { processDocument, isLoading, enhancement, progress } = useDocumentEnhancement();

  const handleUpload = async (file: File) => {
    try {
      const result = await processDocument(file, 'professional', {
        industry: 'technology',
        audience: 'professionals',
        tone: 'professional'
      });
      console.log('Enhancement complete!', result);
    } catch (error) {
      console.error('Failed:', error);
    }
  };

  return (
    <div>
      {isLoading && <p>{progress.message}</p>}
      {enhancement && <p>Made {enhancement.summary.totalChanges} changes!</p>}
    </div>
  );
}
```

### Authentication

```typescript
import { useAuth } from './hooks/useAuth';

function LoginForm() {
  const { login, register, logout, isAuthenticated, user } = useAuth();

  const handleLogin = async (email: string, password: string) => {
    const result = await login(email, password);
    if (result.success) {
      console.log('Logged in!', user);
    }
  };

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Welcome {user?.firstName}!</p>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <button onClick={() => handleLogin('test@example.com', 'password')}>
          Login
        </button>
      )}
    </div>
  );
}
```

### Export Document

```typescript
import { useDocumentExport } from './hooks/useDocumentEnhancement';

function ExportButton({ documentId }: { documentId: string }) {
  const { exportDocument, isExporting } = useDocumentExport();

  const handleExport = async (format: 'docx' | 'latex' | 'html' | 'txt') => {
    await exportDocument(documentId, format, `my-document.${format}`, {
      title: 'My Enhanced Document',
      author: 'John Doe'
    });
  };

  return (
    <div>
      <button onClick={() => handleExport('docx')} disabled={isExporting}>
        Export to DOCX
      </button>
      <button onClick={() => handleExport('latex')} disabled={isExporting}>
        Export to LaTeX
      </button>
    </div>
  );
}
```

### Using the Demo Component

```typescript
// In your App.tsx or router
import DocumentEnhancementDemo from './components/DocumentEnhancementDemo';

function App() {
  return (
    <div>
      <DocumentEnhancementDemo />
    </div>
  );
}
```

## 🔌 API Reference

### Authentication API

```typescript
import { authAPI } from './lib/api';

// Register
const result = await authAPI.register(email, password, firstName, lastName);

// Login
const result = await authAPI.login(email, password);

// Get profile
const result = await authAPI.getProfile();

// Logout
authAPI.logout();

// Check if authenticated
const isAuth = authAPI.isAuthenticated();
```

### Documents API

```typescript
import { documentsAPI } from './lib/api';

// Upload
const result = await documentsAPI.upload(file);
// Returns: { documentId, text, metadata, structure }

// Classify
const result = await documentsAPI.classify(documentId);
// Returns: { type, confidence, industry, audience, tone }

// Analyze
const result = await documentsAPI.analyze(documentId);
// Returns: { readabilityScore, clarityScore, strengths, weaknesses, suggestions }

// Enhance
const result = await documentsAPI.enhance(documentId, {
  level: 'professional',
  industry: 'technology',
  audience: 'investors',
  tone: 'professional',
  specialInstructions: 'Focus on ROI'
});
// Returns: { enhancedText, changes, summary, cost, tokensUsed }

// Export
const result = await documentsAPI.export(documentId, 'docx', 'My Doc', 'Author');
// Returns: Blob (file download)

// Get document details
const result = await documentsAPI.getDocument(documentId);

// List documents
const result = await documentsAPI.listDocuments(20, 0);
```

### Workflow API (Simplified)

```typescript
import { workflowAPI } from './lib/api';

// Complete workflow in one call
const result = await workflowAPI.processDocument(
  file,
  'professional',
  {
    industry: 'technology',
    audience: 'investors',
    tone: 'professional'
  }
);

// Returns everything:
// {
//   documentId,
//   originalText,
//   metadata,
//   classification: { type, confidence, ... },
//   analysis: { readabilityScore, ... },
//   enhancement: { enhancedText, changes, ... }
// }
```

## 🎨 Integration with Existing Components

### Update App.tsx

Add a route for the demo:

```typescript
import DocumentEnhancementDemo from './components/DocumentEnhancementDemo';

function App() {
  const [view, setView] = useState<'landing' | 'demo'>('landing');

  if (view === 'demo') {
    return <DocumentEnhancementDemo />;
  }

  return (
    <div>
      {/* Your existing landing page */}
      <button onClick={() => setView('demo')}>
        Try Document Enhancement
      </button>
    </div>
  );
}
```

### Replace Supabase Calls

Find and replace Supabase edge function calls:

**Before:**
```typescript
const response = await fetch(
  `${supabaseUrl}/functions/v1/document-enhancer`,
  {
    headers: {
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text, level })
  }
);
```

**After:**
```typescript
import { documentsAPI } from '../lib/api';

// Upload first
const { data: upload } = await documentsAPI.upload(file);

// Then enhance
const { data: enhancement } = await documentsAPI.enhance(upload.documentId, {
  level: 'professional'
});
```

## 🔐 Authentication Flow

### Protected Routes

```typescript
import { useAuth } from './hooks/useAuth';

function ProtectedComponent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Please login to continue</div>;
  }

  return <div>Protected content</div>;
}
```

### Login/Register Forms

```typescript
import { useAuth } from './hooks/useAuth';
import { useState } from 'react';

function AuthForm() {
  const { login, register, error, isLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLogin) {
      await login(email, password);
    } else {
      await register(email, password);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit" disabled={isLoading}>
        {isLogin ? 'Login' : 'Register'}
      </button>
      <button type="button" onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? 'Need an account?' : 'Have an account?'}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
```

## 📊 Progress Tracking

The `useDocumentEnhancement` hook provides real-time progress:

```typescript
const { progress, isLoading } = useDocumentEnhancement();

// progress.step can be:
// - 'idle'
// - 'uploading'
// - 'classifying'
// - 'analyzing'
// - 'enhancing'
// - 'complete'

// progress.message contains a user-friendly message
```

Example progress indicator:

```typescript
function ProgressIndicator() {
  const { progress, isLoading } = useDocumentEnhancement();

  if (!isLoading) return null;

  const steps = ['uploading', 'classifying', 'analyzing', 'enhancing'];
  const currentIndex = steps.indexOf(progress.step);

  return (
    <div>
      <p>{progress.message}</p>
      <div className="progress-bar">
        {steps.map((step, i) => (
          <div
            key={step}
            className={i <= currentIndex ? 'active' : 'inactive'}
          >
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 🎯 Enhancement Levels

Three tiers available:

### Quick ($5)
```typescript
await documentsAPI.enhance(documentId, {
  level: 'quick'
});
// ~2-3K tokens, ~$0.001-0.002
// Grammar, spelling, basic improvements
```

### Professional ($15)
```typescript
await documentsAPI.enhance(documentId, {
  level: 'professional',
  industry: 'technology',
  audience: 'investors',
  tone: 'professional'
});
// ~4-7K tokens, ~$0.003-0.005
// All Quick + tone, structure, industry terms
```

### Premium ($30)
```typescript
await documentsAPI.enhance(documentId, {
  level: 'premium',
  industry: 'finance',
  tone: 'formal',
  specialInstructions: 'Focus on ROI metrics and data-driven insights'
});
// ~8-15K tokens, ~$0.006-0.015
// All Professional + deep restructure, strategic insights
```

## 📤 Export Formats

Export enhanced documents to multiple formats:

```typescript
// DOCX (Microsoft Word)
await exportDocument(documentId, 'docx', 'resume.docx');

// LaTeX (publication-ready)
await exportDocument(documentId, 'latex', 'paper.tex', {
  title: 'Research Paper',
  author: 'John Doe'
});

// HTML (web-ready)
await exportDocument(documentId, 'html', 'document.html');

// TXT (plain text)
await exportDocument(documentId, 'txt', 'document.txt');
```

## 🐛 Error Handling

All API calls return `{ data, error }`:

```typescript
const result = await documentsAPI.upload(file);

if (result.error) {
  console.error('Upload failed:', result.error);
  // Handle error
  return;
}

// Success - use result.data
console.log('Document ID:', result.data.documentId);
```

With hooks:

```typescript
const { processDocument, error } = useDocumentEnhancement();

try {
  await processDocument(file, 'professional');
} catch (err) {
  // Error is also available in the error state
  console.error('Enhancement failed:', error);
}
```

## 🔄 Complete Workflow Example

```typescript
import { useState } from 'react';
import { useDocumentEnhancement, useDocumentExport } from './hooks/useDocumentEnhancement';

function CompleteWorkflow() {
  const [file, setFile] = useState<File | null>(null);
  const enhancement = useDocumentEnhancement();
  const exporter = useDocumentExport();

  const handleProcess = async () => {
    if (!file) return;

    try {
      // Process document (upload -> classify -> analyze -> enhance)
      const result = await enhancement.processDocument(file, 'professional', {
        industry: 'technology',
        audience: 'professionals',
        tone: 'professional'
      });

      console.log('Enhancement complete!', result);

      // Optionally export immediately
      if (result.documentId) {
        await exporter.exportDocument(result.documentId, 'docx', 'enhanced.docx');
      }
    } catch (error) {
      console.error('Workflow failed:', error);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button onClick={handleProcess} disabled={enhancement.isLoading}>
        {enhancement.isLoading ? enhancement.progress.message : 'Enhance Document'}
      </button>

      {enhancement.enhancement && (
        <div>
          <h3>Results:</h3>
          <p>Changes: {enhancement.enhancement.summary.totalChanges}</p>
          <p>Cost: ${enhancement.enhancement.cost.toFixed(6)}</p>

          <button onClick={() => exporter.exportDocument(enhancement.documentId!, 'docx', 'enhanced.docx')}>
            Export DOCX
          </button>
        </div>
      )}
    </div>
  );
}
```

## 🚀 Next Steps

1. **Try the Demo**
   ```bash
   npm run dev
   ```
   Visit the DocumentEnhancementDemo component

2. **Integrate with Your UI**
   - Replace Supabase calls with the new API
   - Use the provided hooks for state management
   - Customize the UI components

3. **Add Authentication**
   - Implement login/register forms
   - Protect routes that require auth
   - Show user profile

4. **Production Deployment**
   - Update `.env` with production API URL
   - Build: `npm run build`
   - Deploy dist folder

## 📞 Support

- **Backend API Docs**: [../backend/API_REFERENCE.md](../backend/API_REFERENCE.md)
- **Backend Setup**: [../backend/README.md](../backend/README.md)
- **Architecture**: [../ARCHITECTURE.md](../ARCHITECTURE.md)

---

**Your frontend is now fully integrated with the backend!** 🎉

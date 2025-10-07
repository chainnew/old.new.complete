import { Router } from 'express';
import passport from 'passport';
import { authController } from '../controllers/authController';
import { documentController } from '../controllers/documentController';
import { aiController } from '../controllers/aiController';
import * as oauthController from '../controllers/oauthController';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
router.post('/auth/register', authController.register.bind(authController));
router.post('/auth/login', authController.login.bind(authController));
router.get('/auth/profile', authenticateToken, authController.getProfile.bind(authController));

// OAuth routes
router.get('/auth/providers', oauthController.getOAuthProviders);

// Google OAuth
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/auth/error' }),
  oauthController.handleOAuthCallback
);

// GitHub OAuth
router.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/auth/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: '/auth/error' }),
  oauthController.handleOAuthCallback
);

// Apple OAuth
router.get('/auth/apple', passport.authenticate('apple'));
router.post('/auth/apple/callback',
  passport.authenticate('apple', { session: false, failureRedirect: '/auth/error' }),
  oauthController.handleOAuthCallback
);

// Document routes
router.post(
  '/documents/upload',
  optionalAuth,
  upload.single('file'),
  documentController.upload.bind(documentController)
);

router.post(
  '/documents/:documentId/classify',
  optionalAuth,
  documentController.classify.bind(documentController)
);

router.post(
  '/documents/:documentId/analyze',
  optionalAuth,
  documentController.analyze.bind(documentController)
);

router.post(
  '/documents/:documentId/enhance',
  optionalAuth,
  documentController.enhance.bind(documentController)
);

router.get(
  '/documents/:documentId/export',
  optionalAuth,
  documentController.export.bind(documentController)
);

router.get(
  '/documents/:documentId',
  optionalAuth,
  documentController.getDocument.bind(documentController)
);

router.get(
  '/documents',
  authenticateToken,
  documentController.listDocuments.bind(documentController)
);

// AI routes
router.post('/ai/chat', optionalAuth, aiController.streamChat);
router.post('/ai/suggestions', optionalAuth, aiController.getSuggestions);
router.post('/ai/grammar', optionalAuth, aiController.grammarCheck);

// LaTeX backend removed - now using HTML/CSS visual rendering

export default router;

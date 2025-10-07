import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../database/connection';
import { config } from '../config';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

export class AuthController {
  /**
   * Register new user
   */
  async register(req: Request, res: Response) {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Check if user already exists
      const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);

      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'User already exists' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const userId = uuidv4();
      await db.query(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, role)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, email, passwordHash, firstName || null, lastName || null, 'user']
      );

      // Generate JWT
      const token = jwt.sign(
        { userId, email, role: 'user' },
        config.jwt.secret
      );

      logger.info('User registered', { userId, email });

      res.status(201).json({
        userId,
        email,
        firstName,
        lastName,
        token,
      });
    } catch (error) {
      logger.error('Registration failed', { error });
      res.status(500).json({ error: 'Registration failed' });
    }
  }

  /**
   * Login user
   */
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Find user
      const result = await db.query(
        'SELECT id, email, password_hash, first_name, last_name, role, is_active FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = result.rows[0];

      if (!user.is_active) {
        return res.status(403).json({ error: 'Account is disabled' });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password_hash);

      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        config.jwt.secret
      );

      logger.info('User logged in', { userId: user.id, email });

      res.json({
        userId: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        token,
      });
    } catch (error) {
      logger.error('Login failed', { error });
      res.status(500).json({ error: 'Login failed' });
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(req: any, res: Response) {
    try {
      const userId = req.user.userId;

      const result = await db.query(
        'SELECT id, email, first_name, last_name, role, created_at FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      logger.error('Failed to get profile', { error });
      res.status(500).json({ error: 'Failed to get profile' });
    }
  }
}

export const authController = new AuthController();

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { dbRun, dbAll, dbGet } from '../database.js';
import { authenticateToken, JWT_SECRET } from './auth.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only images are allowed!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB Limit
});

// Create Post Endpoint
router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { content, audience } = req.body;
    const userId = req.user.id;

    if (!content && !req.file) {
      return res.status(400).json({ error: 'Post must contain either text or an image.' });
    }

    const postId = Math.random().toString(36).substring(2, 14);
    let mediaUrl = null;

    if (req.file) {
      mediaUrl = `/uploads/${req.file.filename}`;
    }

    const audienceVal = audience === 'private' ? 'private' : 'public';

    await dbRun(
      'INSERT INTO posts (id, user_id, content, audience, media_url) VALUES (?, ?, ?, ?, ?)',
      [postId, userId, content || '', audienceVal, mediaUrl]
    );

    // Fetch the new post back along with user details
    const newPost = await dbGet(
      `SELECT posts.*, users.name as user_name, users.email as user_email
       FROM posts
       JOIN users ON posts.user_id = users.id
       WHERE posts.id = ?`,
      [postId]
    );

    res.status(201).json(newPost);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Retrieve Posts Feed
router.get('/', async (req, res) => {
  try {
    // Optionally fetch token to show current user's own private posts
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let userId = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch {
        // Invalid token is ignored, feed falls back to public-only
      }
    }

    let posts;
    if (userId) {
      posts = await dbAll(
        `SELECT posts.*, users.name as user_name, users.email as user_email
         FROM posts
         JOIN users ON posts.user_id = users.id
         WHERE posts.audience = 'public' OR posts.user_id = ?
         ORDER BY posts.created_at DESC`,
        [userId]
      );
    } else {
      posts = await dbAll(
        `SELECT posts.*, users.name as user_name, users.email as user_email
         FROM posts
         JOIN users ON posts.user_id = users.id
         WHERE posts.audience = 'public'
         ORDER BY posts.created_at DESC`
      );
    }

    res.json(posts);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

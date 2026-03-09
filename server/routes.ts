import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

const JWT_SECRET = process.env.SESSION_SECRET || 'fallback_secret';
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Ensure the client can access the uploads
const upload = multer({ dest: UPLOADS_DIR });

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  app.use(cookieParser());
  app.use('/uploads', express.static(UPLOADS_DIR));

  // --- Auth Middleware ---
  const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  };

  const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };

  const requireCandidate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.user?.role !== 'CANDIDATE') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };

  // --- AUTH ROUTES ---
  app.post(api.auth.login.path, async (req, res) => {
    try {
      const { email, password } = api.auth.login.input.parse(req.body);
      const user = await storage.getUserByEmail(email);
      
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
      res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
      res.json({ id: user.id, email: user.email, role: user.role });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  });

  app.post(api.auth.logout.path, (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
  });

  app.get(api.auth.me.path, authenticate, async (req, res) => {
    const user = await storage.getUser(req.user.id);
    if (!user) return res.status(401).json({ message: 'User not found' });
    res.json({ id: user.id, email: user.email, role: user.role });
  });

  // --- ADMIN ROUTES ---
  app.post(api.admin.candidates.create.path, authenticate, requireAdmin, async (req, res) => {
    try {
      const input = api.admin.candidates.create.input.parse(req.body);
      const hashedPassword = await bcrypt.hash(input.password, 10);
      
      const user = await storage.createUser({
        email: input.email,
        password: hashedPassword,
        role: 'CANDIDATE'
      });

      const profile = await storage.createProfile({
        ...input.profile,
        userId: user.id
      });

      res.status(201).json({ user, profile });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else {
        res.status(500).json({ message: 'Failed to create candidate' });
      }
    }
  });

  app.get(api.admin.candidates.list.path, authenticate, requireAdmin, async (req, res) => {
    const candidates = await storage.getAllCandidates();
    res.json(candidates);
  });

  app.get(api.admin.candidates.get.path, authenticate, requireAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    const user = await storage.getUser(id);
    if (!user || user.role !== 'CANDIDATE') return res.status(404).json({ message: 'Candidate not found' });
    
    const profile = await storage.getProfileByUserId(id);
    const tasks = await storage.getTasksByCandidate(id);
    const attendance = await storage.getAttendanceLogsByCandidate(id);
    
    res.json({ user, profile, tasks, attendance });
  });

  app.put(api.admin.candidates.update.path, authenticate, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = api.admin.candidates.update.input.parse(req.body);
      const updated = await storage.updateProfile(id, updates);
      res.json(updated);
    } catch (error) {
      res.status(400).json({ message: 'Invalid input' });
    }
  });

  app.post(api.admin.tasks.create.path, authenticate, requireAdmin, async (req, res) => {
    try {
      const input = api.admin.tasks.create.input.parse(req.body);
      
      const task = await storage.createTask({
        title: input.title,
        description: input.description,
        deadline: new Date(input.deadline)
      });

      for (const candidateId of input.candidateIds) {
        await storage.assignTask(task.id, candidateId);
      }

      res.status(201).json(task);
    } catch (error: any) {
      console.error('Task creation error:', error.message, error.errors || '');
      res.status(400).json({ message: 'Invalid input', error: error.message });
    }
  });

  app.get(api.admin.tasks.list.path, authenticate, requireAdmin, async (req, res) => {
    const tasks = await storage.getAllTasks();
    // Also fetch submissions for each task to get the status
    const tasksWithSubmissions = await Promise.all(tasks.map(async (t) => {
      const submissions = await storage.getSubmissionsByTask(t.id);
      return { ...t, submissions };
    }));
    res.json(tasksWithSubmissions);
  });

  app.put(api.admin.tasks.review.path, authenticate, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id); // submission id
      const { approvalStatus, adminComment } = api.admin.tasks.review.input.parse(req.body);
      
      const updated = await storage.updateSubmissionStatus(id, approvalStatus, adminComment);
      
      // Update task status if needed
      await storage.updateTaskStatus(updated.taskId, approvalStatus);
      
      // Notify candidate
      await storage.createNotification(updated.candidateId, `Task submission ${approvalStatus}`);
      
      res.json(updated);
    } catch (error) {
      res.status(400).json({ message: 'Invalid input' });
    }
  });

  app.get(api.admin.attendance.list.path, authenticate, requireAdmin, async (req, res) => {
    const logs = await storage.getAttendanceLogs();
    res.json(logs);
  });

  // --- CANDIDATE ROUTES ---
  app.get(api.candidate.profile.get.path, authenticate, requireCandidate, async (req, res) => {
    const profile = await storage.getProfileByUserId(req.user.id);
    res.json(profile || {});
  });

  app.put(api.candidate.profile.update.path, authenticate, requireCandidate, async (req, res) => {
    try {
      const updates = api.candidate.profile.update.input.parse(req.body);
      const updated = await storage.updateProfile(req.user.id, updates);
      res.json(updated);
    } catch (error) {
      res.status(400).json({ message: 'Invalid input' });
    }
  });

  app.post(api.candidate.profile.upload.path, authenticate, requireCandidate, upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    res.json({ url: `/uploads/${req.file.filename}` });
  });

  app.get(api.candidate.tasks.list.path, authenticate, requireCandidate, async (req, res) => {
    const tasks = await storage.getTasksByCandidate(req.user.id);
    res.json(tasks);
  });

  app.post(api.candidate.tasks.submit.path, authenticate, requireCandidate, upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const taskId = parseInt(req.params.id);
    const { latitude, longitude } = req.body;

    const fileBuffer = fs.readFileSync(req.file.path);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    const hex = hashSum.digest('hex');

    const submission = await storage.createSubmission({
      taskId,
      candidateId: req.user.id,
      fileUrl: `/uploads/${req.file.filename}`,
      fileHash: hex,
      fileType: req.file.mimetype,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      approvalStatus: 'SUBMITTED'
    });

    await storage.updateTaskStatus(taskId, 'SUBMITTED');

    // Notify admins
    const admins = await db.select().from(schema.users).where(eq(schema.users.role, 'ADMIN'));
    for (const admin of admins) {
      await storage.createNotification(admin.id, `New submission for task ${taskId}`);
    }

    res.status(201).json(submission);
  });

  app.post(api.candidate.attendance.mark.path, authenticate, requireCandidate, upload.single('photo'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No photo uploaded' });
    const { latitude, longitude } = req.body;

    const record = await storage.markAttendance({
      candidateId: req.user.id,
      photoUrl: `/uploads/${req.file.filename}`,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null
    });

    res.status(201).json(record);
  });

  app.get(api.candidate.attendance.list.path, authenticate, requireCandidate, async (req, res) => {
    const logs = await storage.getAttendanceLogsByCandidate(req.user.id);
    res.json(logs);
  });

  app.get(api.candidate.notifications.list.path, authenticate, async (req, res) => {
    const notifications = await storage.getNotifications(req.user.id);
    res.json(notifications);
  });

  return httpServer;
}

// Add Express Request type definition for the user object
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

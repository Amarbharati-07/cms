import { users, candidateProfiles, tasks, assignedTasks, submissions, attendance, notifications } from "@shared/schema";
import type { User, InsertUser, CandidateProfile, InsertCandidateProfile, Task, InsertTask, Submission, InsertSubmission, Attendance, InsertAttendance, Notification } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, inArray } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getAllCandidates(): Promise<any[]>;
  
  getProfileByUserId(userId: number): Promise<CandidateProfile | undefined>;
  createProfile(profile: InsertCandidateProfile): Promise<CandidateProfile>;
  updateProfile(userId: number, profile: Partial<InsertCandidateProfile>): Promise<CandidateProfile | undefined>;
  
  createTask(task: InsertTask): Promise<Task>;
  assignTask(taskId: number, userId: number): Promise<void>;
  getAllTasks(): Promise<Task[]>;
  getTasksByCandidate(userId: number): Promise<Task[]>;
  getTaskById(id: number): Promise<Task | undefined>;
  updateTaskStatus(id: number, status: any): Promise<void>;
  
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  getSubmissionsByTask(taskId: number): Promise<Submission[]>;
  updateSubmissionStatus(id: number, status: any, comment?: string): Promise<Submission>;
  
  markAttendance(record: InsertAttendance): Promise<Attendance>;
  getAttendanceLogs(): Promise<Attendance[]>;
  getAttendanceLogsByCandidate(userId: number): Promise<Attendance[]>;
  
  createNotification(userId: number, message: string): Promise<Notification>;
  getNotifications(userId: number): Promise<Notification[]>;
  markNotificationRead(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async getAllCandidates(): Promise<any[]> {
    const candidates = await db.select({
      user: users,
      profile: candidateProfiles,
    })
    .from(users)
    .leftJoin(candidateProfiles, eq(users.id, candidateProfiles.userId))
    .where(eq(users.role, 'CANDIDATE'));
    
    return candidates.map(c => ({ ...c.user, profile: c.profile }));
  }

  async getProfileByUserId(userId: number): Promise<CandidateProfile | undefined> {
    const [profile] = await db.select().from(candidateProfiles).where(eq(candidateProfiles.userId, userId));
    return profile;
  }

  async createProfile(profile: InsertCandidateProfile): Promise<CandidateProfile> {
    const [created] = await db.insert(candidateProfiles).values(profile).returning();
    return created;
  }

  async updateProfile(userId: number, profileUpdates: Partial<InsertCandidateProfile>): Promise<CandidateProfile | undefined> {
    const [updated] = await db.update(candidateProfiles)
      .set(profileUpdates)
      .where(eq(candidateProfiles.userId, userId))
      .returning();
    return updated;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [created] = await db.insert(tasks).values(task).returning();
    return created;
  }

  async assignTask(taskId: number, userId: number): Promise<void> {
    await db.insert(assignedTasks).values({ taskId, userId });
    await this.createNotification(userId, `New task assigned`);
  }

  async getAllTasks(): Promise<Task[]> {
    return await db.select().from(tasks).orderBy(desc(tasks.createdAt));
  }

  async getTasksByCandidate(userId: number): Promise<Task[]> {
    const assigned = await db.select({ task: tasks })
      .from(assignedTasks)
      .innerJoin(tasks, eq(assignedTasks.taskId, tasks.id))
      .where(eq(assignedTasks.userId, userId));
    return assigned.map(a => a.task);
  }

  async getTaskById(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async updateTaskStatus(id: number, status: any): Promise<void> {
    await db.update(tasks).set({ status }).where(eq(tasks.id, id));
  }

  async createSubmission(submission: InsertSubmission): Promise<Submission> {
    const [created] = await db.insert(submissions).values(submission).returning();
    return created;
  }

  async getSubmissionsByTask(taskId: number): Promise<Submission[]> {
    return await db.select().from(submissions).where(eq(submissions.taskId, taskId));
  }

  async updateSubmissionStatus(id: number, status: any, comment?: string): Promise<Submission> {
    const [updated] = await db.update(submissions)
      .set({ approvalStatus: status, adminComment: comment })
      .where(eq(submissions.id, id))
      .returning();
    return updated;
  }

  async markAttendance(record: InsertAttendance): Promise<Attendance> {
    const [created] = await db.insert(attendance).values(record).returning();
    return created;
  }

  async getAttendanceLogs(): Promise<Attendance[]> {
    return await db.select().from(attendance).orderBy(desc(attendance.timestamp));
  }

  async getAttendanceLogsByCandidate(userId: number): Promise<Attendance[]> {
    return await db.select().from(attendance).where(eq(attendance.candidateId, userId)).orderBy(desc(attendance.timestamp));
  }

  async createNotification(userId: number, message: string): Promise<Notification> {
    const [created] = await db.insert(notifications).values({ userId, message }).returning();
    return created;
  }

  async getNotifications(userId: number): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async markNotificationRead(id: number): Promise<void> {
    await db.update(notifications).set({ read: true }).where(eq(notifications.id, id));
  }
}

export const storage = new DatabaseStorage();
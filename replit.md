# FieldTrack - Project Documentation

## Project Overview
FieldTrack is a full-stack web application for managing field candidates, their attendance, and task assignments. It features role-based access (Admin and Candidate) with geolocation-tagged submissions and attendance logs.

## Technology Stack
- **Frontend**: React 18.3 with Vite, TypeScript, TailwindCSS
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL (Replit's built-in persistent database)
- **ORM**: Drizzle ORM
- **Authentication**: JWT-based with bcrypt password hashing
- **File Upload**: Multer for storing files locally

## Project Structure
```
├── client/                 # React frontend
│   └── src/
│       ├── pages/         # Page components
│       ├── components/    # Reusable UI components
│       └── lib/          # Utilities and React Query setup
├── server/               # Express backend
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Database layer (Drizzle ORM)
│   └── db.ts             # Database connection
├── shared/               # Shared code
│   ├── schema.ts         # Database schema & Zod validators
│   └── routes.ts         # Route definitions
└── seed.ts              # Database seeding script (UPSERT logic)
```

## Database Schema
- **users**: Auth & role management
- **candidateProfiles**: Extended candidate information
- **tasks**: Task definitions and deadlines
- **assignedTasks**: Task assignments to candidates
- **submissions**: Task submissions with geolocation
- **attendance**: Attendance logs with geolocation
- **notifications**: User notifications

## Running the Application
```bash
# Install dependencies (already done)
npm install

# Start development server (port 5000)
npm run dev

# Push schema to database
npm run db:push

# Seed database with 21 test users
npx tsx seed.ts

# Type checking
npm check

# Build for production
npm run build

# Start production server
npm start
```

## Seeding Test Data
The seed.ts script creates 21 permanent users:
- **1 Admin**: admin@fieldtrack.com / Admin@123
- **20 Candidates**: candidate1@fieldtrack.com through candidate20@fieldtrack.com / Pass@1234

Features:
- UPSERT logic prevents duplicates on re-runs
- Data persists across server restarts
- Run with: `npx tsx seed.ts`

## Authentication
- JWT tokens stored in HTTP-only cookies
- Token expiration: 1 day
- Roles: ADMIN, CANDIDATE

## Key Endpoints
### Auth
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Admin Routes
- `GET /api/admin/candidates` - List all candidates
- `POST /api/admin/candidates` - Create new candidate
- `GET /api/admin/tasks` - List all tasks
- `POST /api/admin/tasks` - Create new task

### Candidate Routes
- `GET /api/candidate/profile` - Get candidate profile
- `PATCH /api/candidate/profile` - Update profile
- `GET /api/candidate/tasks` - Get assigned tasks

## Environment Variables
```
NODE_ENV=development|production
PORT=5000
SESSION_SECRET=<jwt-secret>
DATABASE_URL=<postgres-connection-string>
```

## File Uploads
- Uploaded files stored in `/uploads` directory
- Served as static files via Express
- Used for profile photos, resumes, and submission evidence

## Data Persistence
- PostgreSQL on Replit is fully persistent
- Database survives server restarts
- No data is deleted on application startup
- Seed script uses UPSERT to prevent duplicate data

## Development Notes
- HMR enabled for frontend in development mode
- Vite configured as middleware for hot reloading
- Backend uses tsx for TypeScript execution
- All API responses validated with Zod

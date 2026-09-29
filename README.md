# Client Project Dashboard

A real-time internal SaaS dashboard designed for software development agencies. Built with React, Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, Socket.IO, Redis, and BullMQ.

---

## Table of Contents

1. [Live Demo](#live-demo)
2. [Project Overview](#project-overview)
3. [Key Features](#key-features)
4. [Technology Stack](#technology-stack)
5. [System Architecture](#system-architecture)
6. [Repository Structure](#repository-structure)
7. [Database Schema & Indexes](#database-schema--indexes)
8. [Authentication & Security](#authentication--security)
9. [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
10. [Real-Time Activity Feed & Socket.IO Architecture](#real-time-activity-feed--socketio-architecture)
11. [Missed Activity Catch-Up Strategy](#missed-activity-catch-up-strategy)
12. [Notifications Architecture](#notifications-architecture)
13. [Background Job Architecture (BullMQ + Redis)](#background-job-architecture-bullmq--redis)
14. [API Reference](#api-reference)
15. [Local Setup & Development](#local-setup--development)
16. [Docker Setup](#docker-setup)
17. [Test Credentials](#test-credentials)
18. [Architectural Decisions & Rationale](#architectural-decisions--rationale)
19. [Explanation](#explanation)
20. [Known Limitations](#known-limitations)

---

## Live Demo

- **Live Application**: https://client-project-dashboard-kz14r9mh5-krixhhh12-3823s-projects.vercel.app/dashboard
- **GitHub Repository**: https://github.com/krixhhh/client-project-dashboard

---

## Project Overview

The **Client Project Dashboard** facilitates team coordination, client tracking, and project management across three distinct agency roles:

- **Admins**: Manage users, clients, projects, global tasks, online team presence, and inspect global activity feeds.
- **Project Managers**: Manage owned projects, assign developers to tasks, track team progress, receive review alerts, and monitor project activity feeds.
- **Developers**: View assigned tasks, update task status (To Do → In Progress → In Review → Done), and receive direct assignment/activity notifications.

---

## Key Features

- **JWT Authentication with HttpOnly Cookie**: Access tokens stored in client memory; refresh tokens stored securely in `HttpOnly`, `SameSite=Lax` cookies with rotation and revocation tracking.
- **API-Level RBAC Enforcement**: Ownership and role checks enforced at the database query layer, preventing unauthorized direct resource access via URL endpoint tampering.
- **Real-Time Role-Filtered Activity Feed**: Socket.IO WebSockets broadcast task updates and activity logs exclusively to authorized server-side rooms (`admin`, `project:<id>`, `user:<id>`).
- **Missed Activity Catch-Up**: Offline users fetch the 20 most recent relevant events directly from PostgreSQL upon reconnection, with frontend deduplication by Activity ID.
- **Overdue Task Automation**: BullMQ and Redis background workers periodically scan incomplete tasks past due date, updating status and notifying team members automatically.
- **URL-Based Task Filtering**: Task filtering by status, priority, due date range, and search parameters synced directly to browser URL query strings.
- **Live User Presence Tracking**: Server-side Socket.IO connection manager tracks active team members online in real time.

---

## Technology Stack

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **Routing**: React Router v6
- **Server State Management**: TanStack Query (React Query)
- **WebSocket Client**: Socket.IO Client
- **UI Components & Icons**: Lucide React + Custom CSS Design System

### Backend
- **Runtime**: Node.js + Express + TypeScript (Strict Mode)
- **ORM**: Prisma ORM
- **Database**: PostgreSQL (with PGlite WASM engine fallback for zero-dependency execution)
- **WebSocket Server**: Socket.IO Server
- **Validation**: Zod schema validation
- **Authentication**: JWT (`jsonwebtoken`) + bcryptjs

### Background Jobs & Caching
- **Queue System**: BullMQ
- **In-Memory Store**: Redis

### Containerization & Tooling
- **Docker Compose**: Containerized PostgreSQL, Redis, Backend, and Frontend

---

## System Architecture

```
                                +-------------------+
                                |    React Client   |
                                +---------+---------+
                                          |
                      HTTP / REST API     |     WebSockets (Socket.IO)
                     (with JWT Cookie)    |     (Authenticated via Token)
                                          v
                                +---------+---------+
                                |  Express Server   |
                                +----+----+----+----+
                                     |    |    |
        +----------------------------+    |    +----------------------------+
        |                                 |                                 |
        v                                 v                                 v
+-------+-------+                 +-------+-------+                 +-------+-------+
|  Prisma ORM   |                 | Socket.IO Room|                 | BullMQ Worker |
|  PostgreSQL   |                 | Server Engine |                 | (Redis Queue) |
+---------------+                 +---------------+                 +---------------+
```

---

## Repository Structure

```
/
├── docker-compose.yml
├── .env.example
├── .env
├── README.md
├── client/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css
│       ├── types/
│       ├── lib/        # api.ts, socket.ts, queryClient.ts
│       ├── context/    # AuthContext, SocketContext
│       ├── components/ # Common, Tasks, Projects, Clients, Activity
│       ├── pages/      # Login, Dashboard, Projects, Tasks, Activity, Notifications, Clients, Users
│       └── router/     # AppRouter, ProtectedRoute
└── server/
    ├── package.json
    ├── tsconfig.json
    ├── prisma/         # schema.prisma, seed.ts
    └── src/
        ├── app.ts
        ├── server.ts
        ├── config/     # database.ts, env.ts, redis.ts
        ├── services/   # auth, project, task, activity, notification, dashboard
        ├── middleware/ # auth, rbac, validation, error
        ├── websocket/  # socket.server.ts
        ├── jobs/       # overdueTask.job.ts
        └── routes/     # auth, project, task, activity, notification, dashboard, client, user
```

---

## Database Schema & Indexes

PostgreSQL schema managed via Prisma ORM with key relational entities:

- **User**: `id`, `name`, `email`, `passwordHash`, `role` (`ADMIN`, `PROJECT_MANAGER`, `DEVELOPER`), `lastSeenAt`.
  - Indexes: `@@index([role])`, `@@index([email])`
- **Client**: `id`, `name`, `contactEmail`, `contactPhone`, `company`.
  - Index: `@@index([name])`
- **Project**: `id`, `name`, `description`, `clientId`, `projectManagerId`.
  - Indexes: `@@index([projectManagerId])`, `@@index([clientId])`, `@@index([createdAt])`
- **Task**: `id`, `projectId`, `title`, `description`, `developerId`, `status`, `priority`, `dueDate`, `isOverdue`.
  - Indexes: `@@index([projectId])`, `@@index([developerId])`, `@@index([status])`, `@@index([priority])`, `@@index([dueDate])`, `@@index([projectId, status])`, `@@index([developerId, status])`
- **ActivityLog**: `id`, `projectId`, `taskId`, `actorId`, `action`, `oldValue`, `newValue`, `message`, `createdAt`.
  - Indexes: `@@index([projectId])`, `@@index([actorId])`, `@@index([createdAt])`, `@@index([projectId, createdAt])`
- **Notification**: `id`, `recipientId`, `type`, `title`, `message`, `relatedProjectId`, `relatedTaskId`, `isRead`, `createdAt`, `readAt`.
  - Indexes: `@@index([recipientId])`, `@@index([recipientId, isRead])`, `@@index([createdAt])`
- **RefreshToken**: `id`, `token`, `userId`, `expiresAt`, `revokedAt`.
  - Indexes: `@@index([userId])`, `@@index([token])`

---

## Authentication & Security

1. **Password Hashing**: Passwords stored using `bcrypt` with 10 salt rounds.
2. **Access Token**: Short-lived JWT (15 minutes) passed in the `Authorization: Bearer <token>` header. Token kept only in memory (`AuthContext` state).
3. **Refresh Token**: Long-lived JWT (7 days) stored in an `HttpOnly`, `SameSite=Lax` cookie. Refresh tokens are tracked in PostgreSQL for rotation and instant revocation on logout.
4. **Cookie Security**: Configured with `httpOnly: true`, `sameSite: 'lax'`, and `secure: process.env.NODE_ENV === 'production'`.

---

## Role-Based Access Control (RBAC)

RBAC is enforced strictly on backend service queries:

- **ADMIN**: Access to all endpoints, global feeds, client management, user management, and all projects/tasks.
- **PROJECT_MANAGER**: Access restricted to owned projects (`projectManagerId == user.id`) and tasks within those projects. Accessing another PM's project yields HTTP 403.
- **DEVELOPER**: Access restricted exclusively to tasks assigned to them (`developerId == user.id`). Accessing another developer's task yields HTTP 403.

---

## Real-Time Activity Feed & Socket.IO Architecture

Socket.IO connections are authenticated during handshake via JWT access token. Users are placed into server-controlled rooms:

- `admin`: Joined only by Admin users. Receives all global activity events.
- `project:<projectId>`: Joined by PMs managing that project, or developers assigned to tasks in that project (validated on room join request).
- `user:<userId>`: Joined by individual users for direct notifications and assigned task activities.

When a task status updates or a task is created, `emitActivity()` emits the event to `admin`, `project:<id>`, and `user:<developerId>` rooms simultaneously.

---

## Missed Activity Catch-Up Strategy

When an offline user reconnects:
1. The client issues `GET /api/activity?limit=20`.
2. The backend filters activities directly in PostgreSQL based on the user's role and permissions.
3. The frontend merges DB-fetched activities with incoming Socket.IO events, deduplicating records by `Activity.id` to prevent double-rendering.

---

## Notifications Architecture

Notifications are saved in PostgreSQL whenever:
- A developer is assigned to a task (`TASK_ASSIGNED`).
- A developer moves a task to `IN_REVIEW` (`TASK_IN_REVIEW` -> notifies PM).
- A task becomes overdue (`TASK_OVERDUE`).

The backend emits `notification.created` and updated `notification.unreadCount` to the user's Socket.IO room. Unread badges update instantly in the UI.

---

## Background Job Architecture (BullMQ + Redis)

Overdue task detection operates via a BullMQ worker:
- **Queue**: `overdue-task-processing` backed by Redis.
- **Schedule**: Repeatable job running every 60 seconds.
- **Execution**: Queries incomplete tasks where `dueDate < NOW()` and `isOverdue == false`. Updates `isOverdue: true`, creates an `ActivityLog` entry, emits Socket.IO activity events, and creates database notifications.

---

## API Reference

| Method | Endpoint | Description | Allowed Roles |
|---|---|---|---|
| `POST` | `/api/auth/login` | Authenticate user & issue tokens | Public |
| `POST` | `/api/auth/refresh` | Refresh access token via cookie | Public |
| `POST` | `/api/auth/logout` | Revoke session & clear cookie | Authenticated |
| `GET` | `/api/auth/me` | Fetch current user context | Authenticated |
| `GET` | `/api/dashboard/admin` | Global admin metrics & online users | ADMIN |
| `GET` | `/api/dashboard/project-manager` | PM project summary & due tasks | ADMIN, PM |
| `GET` | `/api/dashboard/developer` | Developer assigned task metrics | ALL |
| `GET` | `/api/projects` | List projects (scoped) | ALL |
| `POST` | `/api/projects` | Create new project | ADMIN, PM |
| `GET` | `/api/projects/:id` | Get project details (scoped) | ALL |
| `PATCH` | `/api/projects/:id` | Update project details | ADMIN, PM (Owner) |
| `GET` | `/api/tasks` | List & filter tasks (scoped) | ALL |
| `POST` | `/api/tasks` | Create task | ADMIN, PM |
| `PATCH` | `/api/tasks/:id/status` | Update task status | ALL (Assigned/Owner) |
| `GET` | `/api/activity` | Recent 20 relevant activities | ALL |
| `GET` | `/api/notifications` | User notifications & unread count | ALL |
| `PATCH` | `/api/notifications/:id/read` | Mark single notification read | ALL |

---

## Local Setup & Development

### Prerequisites
- Node.js (v18+)
- npm (v9+)
- Redis (installed locally or via Docker)

### Installation & Run Steps

1. **Install Dependencies**:
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env` in the root directory.

3. **Database Migration & Seed**:
   ```bash
   cd server
   npx prisma db push
   npx prisma db seed
   ```

4. **Start Backend Server**:
   ```bash
   cd server
   npm run dev
   ```

5. **Start Frontend Application**:
   ```bash
   cd client
   npm run dev
   ```

6. Open `http://localhost:5173` in your browser.

---

## Docker Setup

Start the entire containerized application using Docker Compose:

```bash
docker-compose up --build
```

Services exposed:
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`

---

## Test Credentials

All seeded accounts use the password: `password123`

| Role | Name | Email | Scope |
|---|---|---|---|
| **Admin** | Sarah Connor | `admin@example.com` | Full System Access |
| **Project Manager** | Alex Rivera | `pm1@example.com` | Projects 1 & 2 Manager |
| **Project Manager** | Morgan Chen | `pm2@example.com` | Project 3 Manager |
| **Developer** | Ravi Kumar | `developer1@example.com` | Assigned Tasks Only |
| **Developer** | Elena Rostova | `developer2@example.com` | Assigned Tasks Only |
| **Developer** | David Kim | `developer3@example.com` | Assigned Tasks Only |
| **Developer** | Sophia Patel | `developer4@example.com` | Assigned Tasks Only |

---

## Architectural Decisions & Rationale

- **Socket.IO over SSE/Polling**: Socket.IO provides full-duplex communication with built-in room management, auto-reconnection, and room-scoped security necessary for multi-role live activity broadcasting.
- **BullMQ + Redis over setTimeout**: Background scheduled tasks require durability and multi-process execution safety to ensure overdue task scans run reliably across cluster instances.
- **HttpOnly Cookies for Refresh Tokens**: Storing refresh tokens in `HttpOnly` cookies eliminates XSS vulnerability risks associated with `localStorage`.
- **Database-Level RBAC Enforcement**: Role checks are performed directly in Prisma `where` clauses rather than relying on frontend component hiding, ensuring strict data isolation.

---

## Explanation

This client project dashboard provides real-time tracking for software agencies across three distinct user roles: Admins with full system visibility, Project Managers who control assigned projects, and Developers restricted to their assigned tasks. Data persistence is managed via PostgreSQL and Prisma ORM with role-based filtering enforced at the query layer.

Authentication uses short-lived JWT access tokens stored in client memory alongside long-lived refresh tokens stored in HttpOnly cookies with token rotation. Real-time activity feeds and unread notification badges are delivered using Socket.IO, where authenticated client sockets join server-controlled rooms (`admin`, `project:<id>`, `user:<id>`) based on verified user permissions. Offline clients reconnecting fetch the 20 most recent relevant events from PostgreSQL, deduplicating records by Activity ID.

Background task scheduling is handled by a BullMQ worker backed by Redis, running a repeatable job every 60 seconds that flags overdue tasks and dispatches real-time alerts. Frontend task views sync search, status, and due-date filters directly with URL query parameters for bookmarkable states. The production application is deployed with the React frontend hosted on Vercel and the Node.js Express backend on Render, connecting to managed PostgreSQL and Redis instances.

---

## Known Limitations

- **Redis Dependency**: The background worker requires Redis to run scheduled BullMQ jobs. If Redis is unavailable, the backend logs a warning while continuing API operations.
- **Single DB Node Connection**: Database queries are configured for a single primary PostgreSQL connection pool rather than read-replica splitting.

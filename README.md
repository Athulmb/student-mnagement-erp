# BMN ACADEMY – STUDENT MANAGEMENT PORTAL

Production-ready enterprise Student Management Portal for BMN Academy featuring a unified common login gateway for both Administrators and Students, multi-role dashboard routing, strict admissions approval workflows, academic course & batch management, and relational PostgreSQL database architecture.

---

## 1. Architecture Overview

The system is engineered as two completely decoupled applications interacting over secure REST APIs:

```
studentportal/
├── backend/                  # NestJS TypeScript REST API & Prisma Engine
│   ├── prisma/
│   │   ├── schema.prisma     # Relational schema (User, Course, Class, etc.)
│   │   ├── migrations/       # SQL migration history
│   │   └── seed.ts           # Administrative initial seed script
│   ├── src/
│   │   ├── activity-logs/    # Admin audit logging module
│   │   ├── admin/            # Dashboard stats, approvals, & student controls
│   │   ├── announcements/    # Academy broadcast communications
│   │   ├── auth/             # Common authentication, JWT & Refresh tokens
│   │   ├── classes/          # Class cohort batches & scheduling
│   │   ├── common/           # Guards, Decorators, Filters, Interceptors
│   │   ├── courses/          # Academic curriculum tracks
│   │   ├── prisma/           # Prisma client provider service
│   │   ├── students/         # Student portal APIs & profile endpoints
│   │   ├── users/            # User query helper service
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env
│   └── .env.example
├── frontend/                 # Next.js (App Router) + Tailwind CSS + shadcn/ui
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/       # Public common login & student registration
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── admin/        # Admin SaaS console routes
│   │   │   │   ├── dashboard/
│   │   │   │   ├── approvals/
│   │   │   │   ├── students/
│   │   │   │   ├── classes/
│   │   │   │   ├── announcements/
│   │   │   │   ├── activities/
│   │   │   │   └── settings/
│   │   │   ├── student/      # Student learner portal routes
│   │   │   │   ├── dashboard/
│   │   │   │   ├── my-class/
│   │   │   │   ├── my-course/
│   │   │   │   ├── schedule/
│   │   │   │   ├── materials/
│   │   │   │   ├── announcements/
│   │   │   │   └── my-profile/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/       # Layouts, Dialogs, Toasts, Badges, Tables
│   │   ├── lib/              # Centralized Axios client & AuthContext
│   │   └── providers/        # TanStack Query & Toast providers
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── .env.local
│   └── .env.example
└── README.md
```

---

## 2. Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Navy Blue SaaS Theme)
- **Icons**: Lucide React
- **Forms & Validation**: React Hook Form + Zod
- **API Client**: Axios (Centralized interceptor, automatic token refresh, withCredentials)
- **Server State**: TanStack React Query

### Backend
- **Framework**: NestJS 10
- **Language**: TypeScript
- **Database ORM**: Prisma ORM 5
- **Database Engine**: PostgreSQL
- **Authentication**: JWT Access Token + Refresh Token (HttpOnly Cookies & Bearer Auth)
- **Password Security**: bcrypt (10 salt rounds)
- **Input Validation**: class-validator & class-transformer
- **API Documentation**: Swagger / OpenAPI
- **Rate Limiting**: @nestjs/throttler

---

## 3. Key Completed Features

### 1. Single Common Login Portal (`/login`)
- Common authentication entrance for both **Administrators** and **Students**.
- Automatic role-based routing:
  - `ADMIN` $\rightarrow$ Redirects automatically to `/admin/dashboard`.
  - `APPROVED STUDENT` $\rightarrow$ Redirects automatically to `/student/dashboard`.
  - `PENDING STUDENT` $\rightarrow$ Displays a clear awaiting approval status card. Does not allow dashboard entry.
  - `REJECTED STUDENT` $\rightarrow$ Displays an application notice with administrator justification reason.
  - `SUSPENDED STUDENT` $\rightarrow$ Displays an institutional suspension alert.
  - Invalid credentials display explicit error messages.
- Remembers sessions via secure refresh tokens and HttpOnly cookies.

### 2. Student Registration (`/register`)
- Full Name, Email, Phone, Password, Confirm Password, Target Course Selection (dynamically loaded from DB), and Optional Background Information.
- Automatically assigns role `STUDENT` and status `PENDING` in the database.
- Prevents client-side role tampering.
- Success confirmation banner instructing applicant of the pending administrator approval.

### 3. Admin Dashboard (`/admin/dashboard`)
- Real-time statistics: Total Students, Pending Approvals, Approved Students, Rejected Students, Total Classes, and Courses.
- Recent student registration feed with status badges.
- Pending applications quick action widget with inline **Approve** and **Reject** buttons.
- Real-time admin activity log trail and course distribution breakdown.

### 4. Student Approval Management (`/admin/approvals`)
- Table displaying all pending student registrations.
- **View Details**: Full applicant profile, selected course, and background statement.
- **Approve**: Confirmation modal $\rightarrow$ calls `/admin/students/:id/approve` $\rightarrow$ updates status from `PENDING` to `APPROVED`, records approval timestamp and admin ID, enables student login eligibility, updates dashboard statistics, and notifies with toast.
- **Reject**: Rejection modal with mandatory justification $\rightarrow$ calls `/admin/students/:id/reject` $\rightarrow$ updates status to `REJECTED`, stores rejection note, prevents login, invalidates active sessions.

### 5. All Students Management (`/admin/students`)
- Server-side paginated and filtered student directory.
- Instant search by Name, Email, or Phone.
- Multi-filter by Account Status (`APPROVED`, `PENDING`, `REJECTED`, `SUSPENDED`) and Course.
- Modals for viewing full profile, assigning class batches, and updating account lifecycle status.

### 6. Classes and Courses Management (`/admin/classes`)
- Create, edit, and delete class cohort batches.
- Delete guard: Prevents deleting classes that have active enrolled students.
- View enrolled students in any class with one-click unenrollment.
- Course catalog management (create, view student & class metrics).

### 7. Student Dashboard & Learning Portal (`/student/dashboard`)
- Completely decoupled learner experience with dedicated student navigation.
- Personalized greeting: *"Welcome back, [Student Name]! Welcome to BMN Academy. Continue your learning journey."*
- Unassigned class handling: When student is approved but not yet placed into a class batch, displays:
  > *"Your registration has been approved. Your class will be assigned by the admin shortly."*
- Displays assigned batch, lead instructor, start date, schedule, course details, and announcements.
- **My Class** (`/student/my-class`): Detailed batch timetable, instructor, and term dates.
- **My Course** (`/student/my-course`): Curriculum overview and certified learning tracks.
- **Class Schedule** (`/student/schedule`): Weekly lecture timetable.
- **Study Materials** (`/student/materials`): Handbooks, lecture slides, and starter resources.
- **My Profile** (`/student/my-profile`): View student ID, credentials, and update permitted contact details.

---

## 4. Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/student_portal?schema=public"
JWT_ACCESS_SECRET="bmn_academy_super_secret_jwt_access_token_key_2026_secured"
JWT_REFRESH_SECRET="bmn_academy_super_secret_jwt_refresh_token_key_2026_secured"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=3001
FRONTEND_URL="http://localhost:3000"
NODE_ENV="development"
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 5. Startup & Execution Commands

### Prerequisites
- Node.js (v18+)
- PostgreSQL (Listening on configured port)
- pnpm or npm

### Initial Database Setup & Seed
```bash
# 1. Navigate to backend
cd backend

# 2. Install dependencies
pnpm install

# 3. Synchronize database schema & generate Prisma Client
npx prisma db push
npx prisma generate

# 4. Run Admin & Curriculum Seed script
npx ts-node prisma/seed.ts
```

### Starting the Applications

#### Start Backend Server
```bash
cd backend
# Development mode with hot reload
pnpm start:dev

# Or production mode
pnpm build
pnpm start:prod
```
Backend runs at: **`http://localhost:3001`**  
Swagger API Docs: **`http://localhost:3001/api/docs`**

#### Start Frontend Application
```bash
cd frontend
# Development mode
pnpm dev

# Or production build & start
pnpm build
pnpm start
```
Frontend runs at: **`http://localhost:3000`**

---

## 6. Seed Credentials for Testing

| Role | Email | Password | Status | Default Destination |
| :--- | :--- | :--- | :--- | :--- |
| **System Admin** | `admin@bmnacademy.com` | `Admin@123456` | `APPROVED` | `/admin/dashboard` |
| **Test Student (Approved)** | `alice@example.com` | `Password123!` | `APPROVED` | `/student/dashboard` |
| **New Student (Self Register)** | Register via `/register` | Custom | `PENDING` | Awaiting Admin Approval |

---

## 7. API Endpoints Reference

### Authentication
- `POST /auth/register` – Public student registration (auto-assigned `PENDING` status).
- `POST /auth/login` – Common login endpoint for Admin and Students.
- `POST /auth/refresh` – Issues renewed access tokens via refresh token or HttpOnly cookie.
- `POST /auth/logout` – Invalidation of session and cookie clearance.
- `GET /auth/profile` – Current authenticated user profile.

### Admin Operations
- `GET /admin/dashboard` – Metrics, registration trends, and activity log overview.
- `GET /admin/students` – Server-side paginated list with search, status, and course filters.
- `GET /admin/students/pending` – Pending applicant queue.
- `GET /admin/students/:id` – Detailed student record with class assignments.
- `PATCH /admin/students/:id/approve` – Approval of pending student.
- `PATCH /admin/students/:id/reject` – Rejection with mandatory justification.
- `PATCH /admin/students/:id/status` – Status update (`APPROVED`, `SUSPENDED`, `REJECTED`).
- `POST /admin/students/:id/assign-class` – Assignment of approved student to a class batch.
- `DELETE /admin/students/:id/classes/:classId` – Removal of student from class.
- `GET /admin/classes/:id/students` – List students enrolled in a class batch.
- `GET /admin/activity-logs` – Historical admin action audit trail.

### Classes & Courses
- `POST /courses`, `GET /courses`, `PATCH /courses/:id`, `DELETE /courses/:id`
- `POST /classes`, `GET /classes`, `GET /classes/:id`, `PATCH /classes/:id`, `DELETE /classes/:id`

### Student Operations
- `GET /student/dashboard` – Personalized student dashboard with class status.
- `GET /student/my-class` – Assigned class batch timetable and instructor info.
- `GET /student/my-profile` – Student profile information.
- `PATCH /student/my-profile` – Update permitted profile details.

### Announcements
- `POST /announcements`, `GET /announcements`, `PATCH /announcements/:id`, `DELETE /announcements/:id`

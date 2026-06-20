================================================================================
  EVEREST VIEW SECONDARY BOARDING SCHOOL — ERP SYSTEM
  School Management System (ERP)
================================================================================

  Tech Stack: Next.js 16 · React 19 · MongoDB/Mongoose · NextAuth v4
              Tailwind CSS 4 · eSewa Payment Gateway · Cypress · Zod
  Location:   Mechinagar-7, Jhapa, Nepal

================================================================================
TABLE OF CONTENTS
================================================================================

  1. Overview
  2. Features
  3. User Roles
  4. Getting Started
  5. Environment Variables
  6. Project Structure
  7. API Endpoints
  8. Database Models
  9. Authentication
  10. Deployment
  11. License

================================================================================
1. OVERVIEW
================================================================================

  A comprehensive School Management ERP built for Everest View Secondary Boarding
  School. The system supports three user roles (Owner, Teacher, Student) with
  role-specific dashboards for managing academics, attendance, fees, exams,
  assignments, and communications.

  Features Nepali date (Bikram Sambat) support throughout and integrates with
  the eSewa payment gateway for online fee collection.

================================================================================
2. FEATURES
================================================================================

  Student Management
    - Add/edit/delete students with auto-generated IDs and roll numbers
    - Student profiles with father details, DOB, address
    - Active/graduated status tracking
    - Bulk promotion to next grade with fee sync (carries forward unpaid balance as previousDue)

  Teacher Management
    - Add/edit/delete teachers with unique teacher IDs
    - Class assignment management

  Class Scheduling
    - Create/manage schedules per subject, teacher, grade, section
    - Time and room assignment

  Attendance
    - Daily attendance marking (Present/Absent) per grade/section
    - Future-date prevention
    - Automatic notifications to students
    - Attendance statistics

  Assignments
    - Teachers create assignments with due dates and file attachments
    - Students submit work with file uploads
    - Teachers grade with feedback
    - Status tracking: submitted / graded / returned

  Examinations
    - Exam creation with date, subject, grade, status
    - Term-based exam routines per grade
    - Subject-level details (date, full marks, pass marks)
    - Question paper upload (multi-image with preview/print)

  Marks & Results
    - Per-student marks entry per class per exam type
    - Marksheet view for students
    - Upsert logic (create or update)

  Lesson Planning
    - Weekly lesson plans with topic, objectives, activities, materials
    - Draft/published workflow

  Fee Management
    - Fee structure per grade with terms and categories
    - Per-student fee tracking (total, paid, due, scholarship, previousDue)
    - Auto-sync fees on grade promotion and fee structure changes
    - Cash payment recording by Owner
    - Payment history
    - Previous balance carry-forward on promotion

  eSewa Payment Gateway
    - Online fee payment via eSewa
    - HMAC-SHA256 signature generation
    - Transaction verification and callback handling
    - Sandbox/test mode support

  Notices & Announcements
    - Create notices with title, content, images
    - Target by audience (all, teacher, student) and grade
    - Expiry dates
    - Email notifications to subscribers via Nodemailer
    - Unsubscribe support

  In-App Notifications
    - Auto-generated on attendance marking, assignment events, notice creation
    - Read/unread tracking with mark-all-read

  Promotion / Graduation
    - Bulk promote students to next grade
    - Auto-graduate Grade 12 students
    - Fee sync, old marks cleanup, roll number reset

  Dashboard Analytics
    - Owner: student/teacher counts, revenue, attendance %, grade distribution
    - Teacher: attendance %, assignment completion %, exam stats
    - Student: personalized dashboard

  System Health
    - CPU, memory, heap, uptime, MongoDB status monitoring

  Security
    - Input validation via Zod on all mutation API routes
    - Middleware-based route protection with role access control
    - Client-side auth redirect on every protected page
    - Secure, httpOnly session cookies (Secure flag in production)

  Public Pages
    - Landing page with hero, features, virtual tour, team, contact
    - Privacy Policy, Terms & Conditions, Cookie Policy
    - Custom 404 page

  Nepali Date Support
    - Full Bikram Sambat (BS) date conversion
    - BS month names and calendar utilities
    - NepaliDatePicker integration

================================================================================
3. USER ROLES
================================================================================

  ADMIN    — Full system admin (login: Administrator)
             Manages: teachers, students, fees, classes, exams, notices,
             marks, attendance, promotion, reports, system health

  TEACHER  — Academic staff
             Manages: assignments, attendance, marks, exams, lesson plans
             Views: students, notices

  STUDENT  — Enrolled student
             Views: dashboard, assignments, fees, marksheet, routine
             Actions: submit assignments, pay fees via eSewa

================================================================================
4. GETTING STARTED
================================================================================

  Prerequisites:
    - Node.js 18+
    - npm
    - MongoDB Atlas (or local MongoDB) instance

  Installation:

    1. Clone the repository
       git clone <repo-url>
       cd erp-school

    2. Install dependencies
       npm install

    3. Configure environment
       Copy the .env file and update with your values (see section 5)

    4. Start the development server
       npm run dev

    5. Open http://localhost:3000 in your browser

  Default Admin Account (role: Administrator):
    Email:    owner@erp.com
    Password: password

  Build for production:
    npm run build
    npm start

  Run tests:
    npm run lint
    npx cypress run

================================================================================
5. ENVIRONMENT VARIABLES
================================================================================

  Create a .env file in the project root with the following variables:

  ┌─────────────────────────────┬──────────────────────────────────────────────┐
  │ Variable                    │ Description                                  │
  ├─────────────────────────────┼──────────────────────────────────────────────┤
  │ MONGODB_URI                 │ MongoDB connection string                    │
  │ NEXTAUTH_SECRET             │ JWT signing secret for NextAuth              │
  │ NEXTAUTH_URL                │ Application base URL                        │
  │ NEXT_PUBLIC_APP_URL         │ Public URL (for email links)                │
  │ EMAIL_HOST                  │ SMTP host (default: smtp.gmail.com)         │
  │ EMAIL_PORT                  │ SMTP port (default: 587)                    │
  │ EMAIL_USER                  │ SMTP username / sender email                │
  │ EMAIL_PASS                  │ SMTP password / app password                │
  │ ADMIN_EMAIL                 │ Contact form recipient email                │
  │ ESEWA_MERCHANT_CODE         │ eSewa merchant code (test: EPAYTEST)       │
  │ ESEWA_SECRET_KEY            │ eSewa secret key for HMAC signing          │
  │ ESEWA_GATEWAY_URL           │ eSewa payment form URL                     │
  │ ESEWA_STATUS_CHECK_URL      │ eSewa transaction status check URL         │
  └─────────────────────────────┴──────────────────────────────────────────────┘

  Note: In production, set NODE_ENV=production to enable Secure cookie flag.

================================================================================
6. PROJECT STRUCTURE
================================================================================

  erp-school/
  ├── public/                  # Static assets (images, etc.)
  ├── src/
  │   ├── app/
  │   │   ├── api/             # API route handlers
  │   │   │   ├── assignments/
  │   │   │   ├── attendance/
  │   │   │   ├── auth/
  │   │   │   ├── class-fees/
  │   │   │   ├── classes/
  │   │   │   ├── contact/
  │   │   │   ├── esewa/
  │   │   │   ├── exam-routines/
  │   │   │   ├── exams/
  │   │   │   ├── fees/
  │   │   │   ├── lessonplans/
  │   │   │   ├── marks/
  │   │   │   ├── me/
  │   │   │   ├── notices/
  │   │   │   ├── notifications/
  │   │   │   ├── owner/
  │   │   │   ├── students/
  │   │   │   ├── subscribe/
  │   │   │   ├── submissions/
  │   │   │   ├── system-health/
  │   │   │   ├── teacher/
  │   │   │   ├── teachers/
  │   │   │   └── unsubscribe/
  │   │   ├── login/           # Login page
  │   │   ├── owner/           # Owner dashboard pages
  │   │   ├── student/         # Student dashboard pages
  │   │   ├── teacher/         # Teacher dashboard pages
  │   │   ├── privacy/         # Privacy policy
  │   │   ├── terms/           # Terms & conditions
  │   │   ├── cookies/         # Cookie policy
  │   │   ├── layout.js        # Root layout
  │   │   ├── page.js          # Landing page
  │   │   ├── globals.css      # Global styles
  │   │   └── not-found.jsx    # 404 page
  │   ├── middleware.js         # Route protection (NextAuth withAuth)
  │   ├── lib/                 # Utilities
  │   │   ├── authOptions.js   # NextAuth configuration
  │   │   ├── mail.js          # Email sending (Nodemailer)
  │   │   ├── mongodb.js       # MongoDB connection
  │   │   ├── nepaliDate.js    # Nepali date utilities
  │   │   └── validate.js      # Zod schemas & validation
  │   ├── models/              # Mongoose models
  │   │   ├── Assignment.js
  │   │   ├── Attendance.js
  │   │   ├── ClassFee.js
  │   │   ├── ClassSchedule.js
  │   │   ├── Exam.js
  │   │   ├── ExamRoutine.js
  │   │   ├── LessonPlan.js
  │   │   ├── Mark.js
  │   │   ├── Notice.js
  │   │   ├── Notification.js
  │   │   ├── Payment.js
  │   │   ├── Student.js
  │   │   ├── Submission.js
  │   │   ├── Subscriber.js
  │   │   └── Teacher.js
  │   └── app/Providers.jsx    # Session provider wrapper
  ├── cypress/                 # End-to-end tests
  ├── .env                     # Environment variables (gitignored)
  ├── next.config.mjs          # Next.js configuration
  ├── tailwind.config.js       # Tailwind configuration
  ├── package.json
  └── README.txt               # This file

================================================================================
7. API ENDPOINTS
================================================================================

  AUTHENTICATION
    POST  /api/auth/signin             Sign in
    POST  /api/auth/signout            Sign out
    GET   /api/auth/session            Get current session

  USERS
    GET   /api/me                      Get current user profile
    GET   /api/students                List students (OWNER/TEACHER)
    POST  /api/students                Create student (OWNER)
    PATCH /api/students/[id]           Update student (OWNER)
    DELETE/api/students/[id]           Delete student (OWNER)
    PATCH /api/students/promote        Promote all students (OWNER)
    GET   /api/teachers                List teachers (OWNER)
    POST  /api/teachers                Create teacher (OWNER)
    PATCH /api/teachers/[id]           Update teacher (OWNER)
    DELETE/api/teachers/[id]           Delete teacher (OWNER)

  ACADEMICS
    GET   /api/classes                 List class schedules
    POST  /api/classes                 Create schedule (OWNER)
    DELETE/api/classes/[id]            Delete schedule (OWNER)
    GET   /api/marks                   Get marks
    POST  /api/marks                   Enter/upsert marks (TEACHER/OWNER)

  EXAMS
    GET   /api/exams                   List exams
    POST  /api/exams                   Create exam (OWNER/TEACHER)
    PATCH /api/exams?id=               Update exam (OWNER/TEACHER)
    DELETE/api/exams?id=               Delete exam (OWNER/TEACHER)
    GET   /api/exam-routines           List routines
    POST  /api/exam-routines           Create routine (OWNER)
    DELETE/api/exam-routines?grade=    Delete routine (OWNER)

  ASSIGNMENTS
    GET   /api/assignments             List assignments
    POST  /api/assignments             Create assignment (TEACHER)
    PATCH /api/assignments?id=         Update assignment (TEACHER)
    DELETE/api/assignments?id=         Delete assignment (TEACHER)
    GET   /api/submissions             List submissions
    POST  /api/submissions             Submit assignment (STUDENT)
    PATCH /api/submissions?id=         Grade submission (TEACHER)

  LESSON PLANS
    GET   /api/lessonplans             List lesson plans (TEACHER)
    POST  /api/lessonplans             Create lesson plan (TEACHER)
    DELETE/api/lessonplans/[id]        Delete lesson plan (TEACHER)

  ATTENDANCE
    GET   /api/attendance              Get attendance records
    POST  /api/attendance              Mark attendance (TEACHER/OWNER)

  FEES & PAYMENTS
    GET   /api/class-fees              List fee structures (OWNER)
    POST  /api/class-fees              Create fee structure (OWNER)
    PATCH /api/class-fees              Update fee structure (OWNER)
    DELETE/api/class-fees?grade=       Delete fee structure (OWNER)
    GET   /api/fees                    Get fee data (student or owner view)
    POST  /api/fees                    Record cash payment (OWNER)
    PATCH /api/fees?id=                Adjust student fee (OWNER)
    DELETE/api/fees?id=                Delete payment (OWNER)
    POST  /api/esewa/initiate          Initiate eSewa payment (STUDENT)
    GET   /api/esewa/success           Handle eSewa callback

  COMMUNICATIONS
    GET   /api/notices                 List notices
    POST  /api/notices                 Create notice (OWNER/TEACHER)
    DELETE/api/notices?id=             Delete notice
    GET   /api/notifications           List notifications
    PATCH /api/notifications           Mark as read
    POST  /api/contact                 Submit contact form (public)
    POST  /api/subscribe               Subscribe to newsletter
    GET   /api/unsubscribe             Unsubscribe from newsletter

  SYSTEM
    GET   /api/owner/stats             Owner dashboard stats (OWNER)
    GET   /api/teacher/stats           Teacher dashboard stats (TEACHER)
    GET   /api/system-health           System health check (OWNER)

================================================================================
8. DATABASE MODELS
================================================================================

  Student       — name, studentId, email, password, grade, section, fee fields,
                  status (active/graduated)
  Teacher       — name, email, teacherId, password, role
  Attendance    — date, grade, section, teacherId, students[]
  Assignment    — title, classId, dueDate, teacherId, fileUrl, status
  Submission    — assignmentId, studentId, fileUrl, grade, feedback, status
  ClassSchedule — teacherId, subject, grade, section, time, room
  ClassFee      — grade, terms[], totalFee
  Exam          — title, date, grade, subject, status, questionPaper
  ExamRoutine   — grade, terms[].subjects[]
  Mark          — studentId, classScheduleId, examType, marksObtained, totalMarks
  LessonPlan    — classScheduleId, teacherId, grade, subject, weekStart, topic
  Notice        — title, content, imageUrl, expiryDate, targetAudience, grade
  Notification  — recipientRole, recipientId, message, link, read
  Payment       — studentId, amount, method (cash/esewa), status, transactionId
  Subscriber    — email

================================================================================
9. AUTHENTICATION
================================================================================

  The system uses NextAuth.js v4 with the Credentials provider:

    - Login via email/ID + password
    - bcrypt hashing (with plain-text fallback for migration)
    - JWT session strategy
    - Hardcoded Admin account: owner@erp.com / password (role: Administrator)
    - Teachers login with teacherId or email
    - Students login with studentId or email
    - Route protection via middleware (src/middleware.js) with role-based access
    - Client-side redirect fallback on every protected page

================================================================================
10. DEPLOYMENT
================================================================================

  Recommended: Vercel + MongoDB Atlas

    1. Push code to GitHub
    2. Connect Vercel to the repository
    3. Set environment variables in Vercel dashboard
       (including NEXTAUTH_SECRET, MONGODB_URI, ESEWA keys, email config)
    4. Deploy

  The default eSewa credentials use sandbox (EPAYTEST). For production,
  update ESEWA_MERCHANT_CODE and ESEWA_SECRET_KEY with live credentials.

  Set NODE_ENV=production on the deployment platform to enable Secure
  session cookies (requires HTTPS).

================================================================================
11. LICENSE
================================================================================

  Proprietary — Everest View Secondary Boarding School

================================================================================
  Everest View Secondary Boarding School
  Mechinagar-7, Jhapa, Nepal
  Email: info@everestview.edu.np
================================================================================

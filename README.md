# CourseSpace — Frontend

Implementation of CSX4107 Web Application Development, Final Examination 1/2026.
Continues the supplied starter project. This repository contains the frontend application. The original two-project workspace structure is preserved locally; each application is also published separately for submission. When using this standalone repository, commands for this application run from its root. Commands for the other application run from its separate repository.

## Student information and submission

- Student name: Kaung Htike San
- Student ID: 6715133
- Backend repository: https://github.com/KaungHtikeSan-CD/csx4107-final-backend
- Frontend repository: https://github.com/KaungHtikeSan-CD/csx4107-final-frontend
- Deployed backend URL: [add backend URL]
- Deployed frontend URL: [add frontend URL]
- Screen and camera recording: [add recording link]

## Test credentials

Run the seed script once before testing. Usernames and emails are case-insensitive.

| Role | Username | Email | Password |
| --- | --- | --- | --- |
| Teacher | teacher1 | teacher1@coursespace.test | Teacher123! |
| Teacher | teacher2 | teacher2@coursespace.test | Teacher123! |
| Teacher | teacher3 | teacher3@coursespace.test | Teacher123! |
| Student | student1 | student1@coursespace.test | Student123! |
| Student | student2 | student2@coursespace.test | Student123! |
| Student | student3 | student3@coursespace.test | Student123! |

These are demonstration accounts, not personal credentials. Passwords are stored as bcrypt hashes. The login form has buttons to fill the first Student or Teacher credentials; the user must still sign in.

## Prerequisites

- Node.js 22.12+ (Node 24 recommended) and npm.
- MongoDB Atlas Free/M0 cluster or a local MongoDB server.
- MongoDB database user with read/write permission on the application database and a network access rule permitting the application server.

## Run locally

### 1. Backend (`next-backend/`)

```sh
cd next-backend
npm ci
cp .env.example .env.local
```

Edit `.env.local`:

- `MONGODB_URI`: your MongoDB connection string. URL-encode special characters in the database password.
- `MONGODB_DB`: `course_service` (or your chosen database name).
- `JWT_SECRET`: a random secret of at least 32 characters. Generate one using `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
- `FRONTEND_URL`: `http://localhost:5173`. Comma-separated exact origins are supported; no trailing slash is necessary.

```sh
npm run seed
npm run dev
```

The backend runs at `http://localhost:3000`. `GET /api/health` checks the MongoDB connection. Seeding is idempotent: it creates missing test users and demo courses without resetting existing records.

### 2. Frontend (`react-frontend/`, a second terminal)

```sh
# You are already in this repository root
npm ci
cp .env.example .env.local
npm run dev
```

Set `VITE_API_URL=http://localhost:3000` in `.env.local`. Visit `http://localhost:5173`.
The frontend uses HashRouter, so deep links such as `/#/courses` work without server rewrite rules.

### 3. Production builds

```sh
cd next-backend
npm run build
npm start
```

```sh
# You are already in this repository root
npm run build
npm run preview
```

Next.js uses webpack because Turbopack's CSS helper process is restricted in some local environments. Both are supported Next.js build modes.

## Testing walkthrough

1. Sign in as `teacher1`. Only that teacher's courses appear, including their cancelled course. Teacher2 and teacher3 have separate lists.
2. Create a course with a name, positive whole-day duration, multiple topics, nonnegative price, maximum students, and Open status.
3. Open its details. Edit it. The enrolled-student section is initially empty. An empty course can be deleted after confirmation.
4. Sign out. Sign in as `student2`. Browse the collection and search by part of the course name or teacher username. Cancelled courses do not appear.
5. Open an Open course with available seats and enroll. It appears in My learning. The Enroll control changes to You're enrolled. A duplicate API request receives 409.
6. Sign back in as the owning teacher. Course details show the student's username and email. Deletion is blocked, and maximum students cannot be reduced below the number enrolled.
7. Set the course to Close. Students can still view it, but enrollment is blocked. Set it to Cancel: it disappears from student lists and cannot be opened or enrolled in as a student.
8. The seeded Web foundations workshop has one seat, already occupied by student1. Other students can view it but cannot enroll. Modern React also begins with student1 enrolled.
9. Sign out and refresh. Protected pages require login, and direct unauthenticated API requests return 401.

### Automated integration tests

After a successful backend production build:

```sh
cd next-backend
npm run test:integration
```

The test suite starts an isolated, temporary real MongoDB server and a production Next.js server. It does not use or change the Atlas database. On its first run it downloads an official MongoDB binary. It verifies six logins, wrong credentials, role restrictions, forged headers, ownership, validation, partial-name search, student privacy, status restrictions, duplicate enrollment, last-seat races, concurrent duplicates, capacity updates, deletion constraints, CORS preflight, and logout revocation. Test servers are stopped afterward.

## API

All endpoints except login and health require `Authorization: Bearer <token>`. Responses use JSON and include a `message` for errors.

| Method | Endpoint | Behavior |
| --- | --- | --- |
| POST | /api/auth/login | `{login, password}` → `{user, token}` |
| POST | /api/auth/logout | Invalidates all existing tokens for the current account |
| GET | /api/user | Current user's safe profile |
| GET | /api/user/:user_id | Own profile only |
| GET | /api/course | Own courses for Teachers; non-cancelled courses for Students |
| GET | /api/course?q=text | Case-insensitive course/teacher substring filter |
| GET | /api/course?enrolled=true | Student's non-cancelled enrolled courses |
| POST | /api/course | Teacher creates course |
| GET | /api/course/:course_id | Authorized course details; owner gets enrolled students |
| PUT/PATCH | /api/course/:course_id | Owner updates full course details |
| DELETE | /api/course/:course_id | Owner deletes only when students array is empty |
| POST | /api/course/:course_id/enroll | Student enrolls, subject to status, uniqueness, and capacity |
| GET | /api/health | Backend and database connection status |

Course create/update body: `{name, duration, topics: [string], price, maxStudent, status: "Open" | "Close" | "Cancel"}`.
The authenticated teacher determines ownership; client-supplied owner and student fields are ignored.
401 = missing/expired login, 403 = wrong role or owner, 404 = missing/hidden course, 400 = invalid input, 409 = violated business rule.

## Implementation notes

- JWTs expire after 8 hours. A database token version revokes existing sessions on logout. Role and identity are read from the database on every protected request.
- The frontend stores the token in sessionStorage (survives refresh; scoped to the browser tab) and sends it as a bearer token. It does not depend on cross-site cookies, avoiding third-party cookie problems between separate Vercel projects.
- Enrollment is stored in the course document as student ObjectIds. A single MongoDB `findOneAndUpdate` checks Open status, available capacity, and absence of the current student, then adds the student atomically. No transaction/replica-set configuration is required for that write.
- Deletion checks an empty enrollment list within the delete operation. Capacity updates check enrollment count within the update operation. These checks remain valid during concurrent requests.
- Student responses never include other students' personal information or password hashes.
- Cancelled courses are hidden from all student course lists, including My learning. Existing enrollment records are retained; reopening the course restores visibility.
- All protected data responses use `Cache-Control: no-store`. CORS permits only the configured frontend origins.

## Deployment — two Vercel projects

Use the repository with a different Root Directory for each project, or import the backend and frontend as separate repositories. Do not deploy the repository root as a single Next.js application.

1. Push your completed source to your own GitHub repository.
2. Import the backend into Vercel with Root Directory `next-backend`, Framework Next.js, and Build Command `npm run build`.
3. Add backend environment variables `MONGODB_URI`, `MONGODB_DB`, and a securely generated `JWT_SECRET`. Set `FRONTEND_URL` to the frontend production origin when known. Never commit real environment files or credentials.
4. Deploy the backend. Ensure MongoDB Atlas network access permits connections from the deployment. Visit `/api/health`; it must report `database: connected`.
5. Import the frontend as a second Vercel project with Root Directory `.` for this standalone repository (`react-frontend` in the original combined workspace), Framework Vite, Build Command `npm run build`, Output Directory `dist`.
6. Set frontend `VITE_API_URL` to the deployed backend base URL, e.g. `https://your-backend.vercel.app` (without `/api`). Vite variables are embedded at build time, so redeploy after changing them.
7. Set backend `FRONTEND_URL` to the exact deployed frontend origin, e.g. `https://your-frontend.vercel.app`, and redeploy the backend.
8. Seed the deployed Atlas database by running `npm run seed` locally with `.env.local` pointing to that same database. There is no public seed endpoint.
9. Ensure both production deployments are accessible to the lecturer. Vercel Deployment Protection must not prevent the frontend from calling the backend or prevent grading.
10. Test login, create/update, enrollment, and logout at the live frontend URL. Fill the submission fields above and submit the links and recording.

## Exam requirement checklist

- [x] Existing starter structure and API routes retained
- [x] React frontend and Next.js backend
- [x] MongoDB persistence and six seeded test users
- [x] Authentication and backend role/ownership enforcement
- [x] Teacher CRUD, enrolled-student list, conditional deletion
- [x] Student catalog, partial course/teacher search, details, enrollment list
- [x] Open/Close/Cancel rules, capacity limits and duplicate prevention
- [x] Responsive interface, loading/error/empty states and session handling
- [x] Environment examples, seeding, test instructions, Vercel project configuration
- [ ] Both deployments verified and URLs recorded above
- [ ] Student information and recording link completed

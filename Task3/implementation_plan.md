# Implementation Plan - Online Quiz System Backend & Frontend

Build a robust, secure, and full-featured **Online Quiz System** backend application with Express.js and SQLite, accompanied by an interactive, modern web frontend application with a unique design aesthetic (Deep Cyber-Violet & Electric Cyan theme).

## Proposed Architecture

### Backend Stack
- **Runtime**: Node.js + Express.js
- **Database**: SQLite (via `sequelize` ORM or `sqlite3` driver) with auto-seeding sample data (Admin & User accounts, sample quizzes with timers and negative marking).
- **Authentication**: JWT (JSON Web Tokens) with role-based authorization middleware (`ADMIN` vs `USER`).
- **Security**: Password hashing via `bcryptjs`, CORS, input validation middleware, secure answer calculation.

### Database Schema Models
1. **User**: `id`, `name`, `email`, `password`, `role` (`ADMIN` | `USER`), `createdAt`, `updatedAt`
2. **Quiz**: `id`, `title`, `description`, `category`, `timeLimitMinutes`, `negativeMarking`, `passPercentage`, `isRandomized`, `isPublished`, `createdById`, `createdAt`
3. **Question**: `id`, `quizId`, `questionText`, `questionType` (`MULTIPLE_CHOICE` | `TRUE_FALSE`), `marks`, `negativeMarks`, `explanation`
4. **Option**: `id`, `questionId`, `optionText`, `isCorrect` (stripped in public attempt APIs for security)
5. **QuizAttempt**: `id`, `userId`, `quizId`, `score`, `totalMarks`, `percentage`, `passed`, `timeTakenSeconds`, `completedAt`
6. **AttemptAnswer**: `id`, `attemptId`, `questionId`, `selectedOptionId`, `isCorrect`, `marksAwarded`

### Key API Endpoints
- **Auth**:
  - `POST /api/auth/register` (Register new user/admin)
  - `POST /api/auth/login` (Login & return JWT token + role info)
  - `GET /api/auth/me` (Current user profile)
- **Quizzes (Admin & User)**:
  - `GET /api/quizzes` (List published quizzes for users, or all for admin)
  - `GET /api/quizzes/:id` (Get quiz details)
  - `POST /api/quizzes` (Admin: Create quiz with title, description, timer, negative marking, pass score)
  - `PUT /api/quizzes/:id` (Admin: Update quiz)
  - `DELETE /api/quizzes/:id` (Admin: Delete quiz)
- **Questions & Options (Admin)**:
  - `POST /api/quizzes/:id/questions` (Admin: Add question & options)
  - `PUT /api/questions/:id` (Admin: Edit question & options)
  - `DELETE /api/questions/:id` (Admin: Delete question)
- **Quiz Execution & Answer Submission**:
  - `GET /api/quizzes/:id/start` (User: Start quiz attempt, fetch questions without revealing correct options; supports randomized order/selection)
  - `POST /api/quizzes/:id/submit` (User: Submit answers, calculate score with negative marking, store attempt history)
- **Results, Leaderboard & Performance Stats**:
  - `GET /api/attempts/my-history` (User: View past quiz attempts)
  - `GET /api/attempts/:id/result` (Get specific attempt details & breakdown)
  - `GET /api/quizzes/:id/leaderboard` (Top performers for a quiz)
  - `GET /api/stats/user` (User overall stats: total quizzes taken, pass rate, average percentage, score chart data)
  - `GET /api/stats/admin` (Admin system-wide stats: total users, total attempts, top quizzes)
- **Bonus - Certificate Endpoint**:
  - `GET /api/attempts/:id/certificate` (Check eligibility and generate verification payload/certificate HTML/JSON)

### Frontend Design System & Theme
- **Color Palette (Unique Cyber Violet Theme)**:
  - Dark Midnight Background: `#0B0F19`
  - Card & Glass Surface: `#161F33` / `rgba(22, 31, 51, 0.75)` with backdrop-filter blur
  - Primary Accent: Electric Violet (`#7C3AED` to `#9333EA`)
  - Secondary Accent: Neon Cyan (`#06B6D4` / `#22D3EE`)
  - Success / Pass Accent: Emerald Glow (`#10B981`)
  - Warning / Danger Accent: Coral Rose (`#F43F5E`) & Amber (`#F59E0B`)
- **Key UI Views**:
  - **Auth View**: Sleek Login/Register tabbed interface with demo quick-login buttons (Admin / Student).
  - **Dashboard View**: Quiz Catalog with filters, search, badge tags for timers & negative marking.
  - **Quiz Player View**: Live full-screen quiz view with active countdown timer bar, question navigator, radio options, and automatic auto-submit when timer expires.
  - **Result & Certificate View**: Instant score summary breakdown (Correct, Incorrect, Unanswered, Marks deducted), performance feedback, and downloadable printable Certificate of Completion.
  - **Leaderboard & Analytics View**: Global and per-quiz leaderboards, visual chart bars for score progression.
  - **Admin Studio**: Modal / Panel to create quizzes, configure negative marking and timers, add dynamic questions & options.

## Verification Plan

### Automated Verification
- Write a automated verification script (`npm test` or `node scripts/test-api.js`) that hits all REST APIs end-to-end:
  - Registers Admin & User accounts.
  - Logs in and obtains JWT tokens.
  - Admin creates a Quiz with negative marking and timer limit.
  - Admin adds multiple Questions and Options.
  - User retrieves active quiz questions (confirming `isCorrect` field is NOT leaked).
  - User submits answers (testing positive marks, negative marks deduction, and calculation).
  - Checks score calculation, attempt record creation, leaderboard update, and certificate generation.

### Manual & UI Verification
- Run the server (`npm start`) on `http://localhost:3000`.
- Verify the interactive frontend application in browser:
  - Test Admin login and creation of a custom quiz.
  - Test Student login, taking quiz under timer, answer validation, immediate result display, and certificate generation.

## User Review Required
> [!IMPORTANT]
> The backend will be built with Node.js/Express and SQLite (file-based or memory DB with persistence), fully self-contained without requiring external database server installations.

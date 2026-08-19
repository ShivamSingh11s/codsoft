# Online Quiz System - Complete Walkthrough & Documentation

The **Online Quiz System** backend application and interactive Web Client application are fully implemented, tested, and operational.

## System Overview & Features

### 1. Database Architecture & Models
- **User**: Role-based access control (`ADMIN` vs `USER`), password hashing via `bcryptjs`.
- **Quiz**: Title, description, category, `timeLimitMinutes` (quiz timers), `negativeMarking` toggle, `negativeMarkValue` (deductions for wrong answers), `passPercentage`, and `isRandomized` (question/option shuffling).
- **Question & Option**: Supports multiple-choice and true/false questions, individual question marks, and explanations. Sanitized API responses ensure correct options are never leaked during quiz attempts.
- **QuizAttempt & AttemptAnswer**: Stores user score, total possible marks, calculated percentage, pass/fail status, time taken in seconds, and question-level answer breakdown.

### 2. REST API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/register` | Register a new User or Admin account | Public |
| `POST` | `/api/auth/login` | Authenticate credentials & return JWT | Public |
| `GET` | `/api/auth/me` | Fetch active user profile | Bearer JWT |
| `GET` | `/api/quizzes` | List available published quizzes | Public |
| `GET` | `/api/quizzes/:id` | Get quiz details | Public |
| `POST` | `/api/quizzes` | Create a new quiz with timer & negative marking | Admin |
| `PUT` | `/api/quizzes/:id` | Edit quiz parameters | Admin |
| `DELETE` | `/api/quizzes/:id` | Delete quiz & associated questions | Admin |
| `POST` | `/api/quizzes/:id/questions` | Add question & options | Admin |
| `PUT` | `/api/questions/:id` | Update question & options | Admin |
| `DELETE` | `/api/questions/:id` | Delete question | Admin |
| `GET` | `/api/quizzes/:id/start` | Start quiz attempt (Sanitized questions & optional shuffle) | Bearer JWT |
| `POST` | `/api/quizzes/:id/submit` | Submit answers & calculate score automatically | Bearer JWT |
| `GET` | `/api/attempts/my-history` | Fetch user attempt history | Bearer JWT |
| `GET` | `/api/attempts/:id/result` | Detailed attempt score breakdown & explanations | Bearer JWT |
| `GET` | `/api/attempts/:id/certificate` | Verify eligibility & return Certificate payload | Bearer JWT |
| `GET` | `/api/quizzes/:id/leaderboard` | Get top rankings for a specific quiz | Public |
| `GET` | `/api/stats/user` | User performance analytics (pass rate, score trend) | Bearer JWT |
| `GET` | `/api/stats/admin` | Platform statistics (total users, attempts, popular quizzes) | Admin |
| `GET` | `/api/docs` | Interactive JSON API documentation | Public |

### 3. Bonus Features Included
- ⏱️ **Countdown Timers**: Server and client enforce quiz duration limits. Dynamic pulse warning when time drops below 60 seconds, with automatic force-submission on expiration.
- ⚠️ **Negative Marking**: Automatic point deduction per wrong answer when enabled on a quiz (e.g. `-0.25` or `-0.5` points per incorrect option).
- 🔀 **Randomized Questions**: Shuffles question order and option choices for each student attempt.
- 🎓 **Official Certificate of Completion**: Users who meet or exceed the required `passPercentage` earn a verified Certificate with unique Certificate ID and printable/downloadable layout.
- 🎨 **Unique Aesthetic**: Cyber-Violet (`#7C3AED`) & Neon Cyan (`#06B6D4`) glassmorphism dark theme with Chart.js analytics graphs.

---

## Verification Results

### Automated E2E API Test Suite (`npm test`)

The full end-to-end API test suite ran successfully:

```
> online-quiz-system@1.0.0 test
> node test/api-test.js

 Starting Online Quiz System E2E API Verification Tests...

Database synced successfully.
Seeding initial data...
Created accounts:
 Admin: admin@quiz.com / admin123
 User: user@quiz.com / user123
Seed data successfully loaded.
====================================================
 Online Quiz System Server running on port 3000
 URL: http://localhost:3000
 API Documentation: http://localhost:3000/api/docs
====================================================
Test 1: GET /api/docs
✓ API Documentation endpoint operational.

Test 2: POST /api/auth/login (Admin)
✓ Admin login authenticated successfully.

Test 3: POST /api/auth/login (User)
✓ User login authenticated successfully.

Test 4: GET /api/quizzes
✓ Fetched 2 quizzes. First quiz: "Cybersecurity & Web Protocol Essentials"

Test 5: POST /api/quizzes (Admin Create Quiz)
✓ Created Quiz ID 3 with Negative Marking (-0.5) and 3 min timer.

Test 6: POST /api/quizzes/3/questions (Add Questions)
✓ Question added with correct option ID 22 and wrong option ID 21.

Test 7: GET /api/quizzes/3/start (User Start Quiz)
✓ Quiz started safely. Option answers verified sanitized!

Test 8: POST /api/quizzes/3/submit (Answer Submission)
✓ Submission successful! Score: 2/2 (Passed: true).

Test 9: GET /api/attempts/1/certificate
✓ Certificate generated: CERT-3-1-6482.

Test 10: GET /api/quizzes/3/leaderboard & GET /api/stats/user
✓ Leaderboard and User statistics verified successfully.

 All E2E API Verification Tests Passed 100% Successfully!
```

---

## How to Run the Application

1. **Start the Express Server**:
   ```bash
   npm start
   ```
2. **Access Web Application & API Docs**:
   - Web Client UI: `http://localhost:3000`
   - API Documentation: `http://localhost:3000/api/docs`

3. **Pre-configured Quick Demo Credentials**:
   - **Admin Account**: `admin@quiz.com` / `admin123`
   - **Student Account**: `user@quiz.com` / `user123`

# Centrexcel Business API Integration Guide

**Base URL:** `/api/v1`
**API Docs:** `/api/docs` (Swagger UI)

---

## Table of Contents

1. [Integration Order Overview](#integration-order-overview)
2. [Phase 1: Core Authentication](#phase-1-core-authentication)
3. [Phase 2: User Profile & Session Management](#phase-2-user-profile--session-management)
4. [Phase 3: Challenge Discovery](#phase-3-challenge-discovery)
5. [Phase 4: Team Management](#phase-4-team-management)
6. [Phase 5: Challenge Participation](#phase-5-challenge-participation)
7. [Phase 6: Submissions](#phase-6-submissions)
8. [Phase 7: Judge Features](#phase-7-judge-features)
9. [Phase 8: Admin/Sponsor Features](#phase-8-adminsponsor-features)
10. [Suggested Frontend Pages](#suggested-frontend-pages)
11. [Error Handling Reference](#error-handling-reference)

---

## Integration Order Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 1: Core Authentication (Must be first)                   │
│  - Signup, Login, OTP Verification, Password Reset              │
├─────────────────────────────────────────────────────────────────┤
│  PHASE 2: User Profile & Sessions                               │
│  - Get current user, Manage sessions, Logout                    │
├─────────────────────────────────────────────────────────────────┤
│  PHASE 3: Challenge Discovery (Public)                          │
│  - View all challenges, Live challenges, Upcoming challenges    │
├─────────────────────────────────────────────────────────────────┤
│  PHASE 4: Team Management                                       │
│  - Create team, Join team, Invite members                       │
├─────────────────────────────────────────────────────────────────┤
│  PHASE 5: Challenge Participation                               │
│  - Register for challenges (solo or team)                       │
├─────────────────────────────────────────────────────────────────┤
│  PHASE 6: Submissions                                           │
│  - Create, edit, upload files, finalize submissions             │
├─────────────────────────────────────────────────────────────────┤
│  PHASE 7: Judge Features                                        │
│  - View assigned challenges, Score submissions                  │
├─────────────────────────────────────────────────────────────────┤
│  PHASE 8: Admin/Sponsor Features                                │
│  - Create challenges, Invite judges, Assign judges              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Core Authentication

> **Priority: CRITICAL**
> Must be implemented first as all other features depend on authentication.

### 1.1 User Signup

**POST** `/auth/signup`

Registers a new user and sends OTP for email verification.

**Request:**
```json
{
  "email": "user@gmail.com",
  "password": "Test@123456",
  "name": "John Doe",
  "role": "participant",
  "mobile": "+919999999999",
  "organization": "Tech Corp",
  "skills": "React, Node.js, PostgreSQL",
  "domain": "Full Stack Development",
  "experienceSummary": "3 years of experience in web development",
  "socialLinks": {
    "linkedin": "https://linkedin.com/in/johndoe",
    "github": "https://github.com/johndoe"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Valid email address |
| password | string | Yes | Min 6 characters |
| name | string | Yes | User's full name |
| role | enum | Yes | `participant`, `sponsor`, `organizer` |
| mobile | string | No | Phone with country code |
| organization | string | No | Company/Institution name |
| skills | string | No | Comma-separated skills |
| domain | string | No | Area of expertise |
| experienceSummary | string | No | Brief experience description |
| socialLinks | object | No | LinkedIn, GitHub, etc. |

**Response (201):**
```json
{
  "message": "OTP sent successfully to your email",
  "expiresIn": 600
}
```

**Errors:**
| Code | Message | Reason |
|------|---------|--------|
| 400 | Validation failed | Invalid input data |
| 403 | Role not allowed for self-signup | Trying to signup as admin |
| 409 | User already exists | Email already registered |

---

### 1.2 Verify OTP

**POST** `/auth/verify-otp`

Verifies email with OTP and returns authentication tokens.

**Request:**
```json
{
  "email": "user@gmail.com",
  "code": "123456"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Registered email |
| code | string | Yes | Exactly 6 digits |

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@gmail.com",
    "name": "John Doe",
    "role": "participant"
  }
}
```

**Errors:**
| Code | Message | Reason |
|------|---------|--------|
| 401 | Invalid or expired OTP | Wrong code or expired |

---

### 1.3 Resend OTP

**POST** `/auth/resend-otp`

Resends OTP for verification (60-second cooldown).

**Request:**
```json
{
  "email": "user@gmail.com",
  "purpose": "email_verification"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Registered email |
| purpose | enum | Yes | `email_verification` or `password_reset` |

**Response (200):**
```json
{
  "message": "OTP sent successfully to your email",
  "expiresIn": 600
}
```

**Cooldown Response (409):**
```json
{
  "message": "Please wait 45 seconds before requesting a new OTP",
  "canResendIn": 45
}
```

---

### 1.4 User Login

**POST** `/auth/login`

Authenticates user with email and password.

**Request:**
```json
{
  "email": "user@gmail.com",
  "password": "Test@123456"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@gmail.com",
    "name": "John Doe",
    "role": "participant"
  }
}
```

**Errors:**
| Code | Message | Reason |
|------|---------|--------|
| 401 | Invalid password | Wrong password |
| 403 | Email not verified | User hasn't verified email |
| 404 | User not found | Email not registered |

---

### 1.5 Forgot Password

**POST** `/auth/forgot-password`

Initiates password reset by sending OTP.

**Request:**
```json
{
  "email": "user@gmail.com"
}
```

**Response (200):**
```json
{
  "message": "OTP sent successfully to your email",
  "expiresIn": 600
}
```

---

### 1.6 Reset Password

**POST** `/auth/reset-password`

Resets password using OTP.

**Request:**
```json
{
  "email": "user@gmail.com",
  "code": "123456",
  "newPassword": "NewPassword123"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Registered email |
| code | string | Yes | 6-digit OTP |
| newPassword | string | Yes | Min 8 chars, uppercase, lowercase, number |

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

**Response (200):**
```json
{
  "message": "Password reset successfully. Please login with your new password."
}
```

---

### 1.7 Refresh Token

**POST** `/auth/refresh-token`

Gets new access token using refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "accessToken": "new-access-token...",
  "refreshToken": "new-refresh-token..."
}
```

---

## Phase 2: User Profile & Session Management

> **Priority: HIGH**
> Needed for user dashboard and security features.

### 2.1 Get Current User

**GET** `/auth/me`

Returns the authenticated user's profile.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@gmail.com",
  "name": "John Doe",
  "role": "participant",
  "mobile": "+919999999999",
  "organization": "Tech Corp",
  "isEmailVerified": true,
  "isActive": true,
  "skills": ["React", "Node.js", "PostgreSQL"],
  "domain": "Full Stack Development",
  "experienceSummary": "3 years of experience in web development",
  "socialLinks": {
    "linkedin": "https://linkedin.com/in/johndoe",
    "github": "https://github.com/johndoe"
  },
  "createdAt": "2024-01-20T10:30:00.000Z"
}
```

---

### 2.2 Get Active Sessions

**GET** `/auth/sessions`

Returns all active login sessions for the user.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
[
  {
    "id": "session-uuid-1",
    "deviceInfo": "Chrome on Windows",
    "ipAddress": "192.168.1.1",
    "lastActive": "2024-01-20T10:30:00.000Z",
    "createdAt": "2024-01-15T08:00:00.000Z"
  },
  {
    "id": "session-uuid-2",
    "deviceInfo": "Safari on iPhone",
    "ipAddress": "192.168.1.2",
    "lastActive": "2024-01-19T15:00:00.000Z",
    "createdAt": "2024-01-18T12:00:00.000Z"
  }
]
```

---

### 2.3 Revoke Session

**DELETE** `/auth/sessions/:sessionId`

Logs out from a specific device/session.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "message": "Session revoked successfully"
}
```

---

### 2.4 Logout

**POST** `/auth/logout`

Logs out from current device.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

### 2.5 Logout All Devices

**POST** `/auth/logout-all`

Logs out from all devices.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "message": "Logged out from all devices"
}
```

---

## Phase 3: Challenge Discovery

> **Priority: HIGH**
> Core feature for browsing available challenges. All endpoints are public.

### 3.1 Get All Challenges

**GET** `/challenges`

Returns all challenges ordered by creation date.

**Response (200):**
```json
[
  {
    "id": "challenge-uuid-1",
    "title": "AI Innovation Challenge",
    "description": "Build an AI-powered solution...",
    "type": "free",
    "fee": 0,
    "startDate": "2024-02-01T00:00:00.000Z",
    "endDate": "2024-02-28T23:59:59.000Z",
    "submissionDeadline": "2024-02-25T23:59:59.000Z",
    "rewards": "Cash prizes worth $10,000",
    "maxTeamSize": 4,
    "status": "live",
    "problemStatementUrl": "uploads/problem-statement.pdf",
    "createdBy": "sponsor-uuid",
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| type | enum | `free`, `paid`, `startup_challenge` |
| status | enum | `draft`, `upcoming`, `live`, `closed`, `results_published` |

---

### 3.2 Get Live Challenges

**GET** `/challenges/live`

Returns only challenges with `status: "live"`.

**Response (200):** Same structure as above, filtered by live status.

---

### 3.3 Get Upcoming Challenges

**GET** `/challenges/upcoming`

Returns only challenges with `status: "upcoming"`.

**Response (200):** Same structure as above, filtered by upcoming status.

---

### 3.4 Get Challenge Details

**GET** `/challenges/:id`

Returns detailed information about a specific challenge.

**Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| id | UUID | Challenge ID |

**Response (200):**
```json
{
  "id": "challenge-uuid-1",
  "title": "AI Innovation Challenge",
  "description": "Build an AI-powered solution that solves real-world problems...",
  "type": "free",
  "fee": 0,
  "startDate": "2024-02-01T00:00:00.000Z",
  "endDate": "2024-02-28T23:59:59.000Z",
  "submissionDeadline": "2024-02-25T23:59:59.000Z",
  "rewards": "1st Place: $5,000\n2nd Place: $3,000\n3rd Place: $2,000",
  "maxTeamSize": 4,
  "status": "live",
  "problemStatementUrl": "uploads/ai-challenge-problem.pdf",
  "createdBy": "sponsor-uuid",
  "sponsor": {
    "id": "sponsor-uuid",
    "name": "Tech Corp",
    "organization": "Tech Corp Inc."
  },
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-20T12:00:00.000Z"
}
```

---

## Phase 4: Team Management

> **Priority: HIGH**
> Required for team-based challenge participation.
> **Roles:** PARTICIPANT only

### 4.1 Create Team

**POST** `/teams`

Creates a new team for a challenge.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request:**
```json
{
  "name": "Team Alpha",
  "challengeId": "challenge-uuid",
  "description": "A team of passionate developers"
}
```

**Response (201):**
```json
{
  "id": "team-uuid",
  "name": "Team Alpha",
  "description": "A team of passionate developers",
  "challengeId": "challenge-uuid",
  "leaderId": "user-uuid",
  "status": "active",
  "inviteCode": "ABC123XY",
  "inviteLink": "https://app.centrexcel.com/join/ABC123XY",
  "createdAt": "2024-01-20T10:30:00.000Z"
}
```

---

### 4.2 Get My Teams

**GET** `/teams/my`

Returns all teams the user belongs to.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
[
  {
    "id": "team-uuid-1",
    "name": "Team Alpha",
    "challengeId": "challenge-uuid-1",
    "leaderId": "user-uuid",
    "status": "active",
    "memberCount": 3,
    "challenge": {
      "id": "challenge-uuid-1",
      "title": "AI Innovation Challenge"
    }
  }
]
```

---

### 4.3 Get Team Details

**GET** `/teams/:id`

Returns detailed team information.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| id | UUID | Team ID |

**Response (200):**
```json
{
  "id": "team-uuid",
  "name": "Team Alpha",
  "description": "A team of passionate developers",
  "challengeId": "challenge-uuid",
  "leaderId": "user-uuid",
  "status": "active",
  "inviteCode": "ABC123XY",
  "inviteLink": "https://app.centrexcel.com/join/ABC123XY",
  "teamMembers": [
    {
      "id": "member-uuid-1",
      "userId": "user-uuid-1",
      "teamId": "team-uuid",
      "joinedAt": "2024-01-20T10:30:00.000Z",
      "user": {
        "id": "user-uuid-1",
        "name": "John Doe",
        "email": "john@example.com"
      }
    },
    {
      "id": "member-uuid-2",
      "userId": "user-uuid-2",
      "teamId": "team-uuid",
      "joinedAt": "2024-01-21T14:00:00.000Z",
      "user": {
        "id": "user-uuid-2",
        "name": "Jane Smith",
        "email": "jane@example.com"
      }
    }
  ],
  "createdAt": "2024-01-20T10:30:00.000Z",
  "updatedAt": "2024-01-21T14:00:00.000Z"
}
```

---

### 4.4 Invite Member to Team

**POST** `/teams/:id/invite`

Sends an invitation email to join the team.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| id | UUID | Team ID |

**Request:**
```json
{
  "email": "teammate@example.com"
}
```

**Response (200):**
```json
{
  "message": "Invitation sent successfully"
}
```

---

### 4.5 Join Team

**POST** `/teams/join`

Joins a team using an invite code.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request:**
```json
{
  "code": "ABC123XY"
}
```

**Response (200):**
```json
{
  "message": "Successfully joined the team",
  "team": {
    "id": "team-uuid",
    "name": "Team Alpha",
    "challengeId": "challenge-uuid"
  }
}
```

**Errors:**
| Code | Message | Reason |
|------|---------|--------|
| 400 | Team is full | Max team size reached |
| 404 | Invalid invite code | Code doesn't exist |
| 409 | Already a member | User is already in team |

---

## Phase 5: Challenge Participation

> **Priority: HIGH**
> Required for users to register for challenges.
> **Roles:** PARTICIPANT only

### 5.1 Register for Challenge

**POST** `/participations`

Registers for a challenge (solo or as a team).

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request (Solo):**
```json
{
  "challengeId": "challenge-uuid",
  "mode": "solo"
}
```

**Request (Team):**
```json
{
  "challengeId": "challenge-uuid",
  "mode": "team",
  "teamId": "team-uuid"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| challengeId | UUID | Yes | Challenge to register for |
| mode | enum | Yes | `solo` or `team` |
| teamId | UUID | Conditional | Required if mode is `team` |

**Response (201):**
```json
{
  "id": "participation-uuid",
  "challengeId": "challenge-uuid",
  "userId": "user-uuid",
  "teamId": null,
  "mode": "solo",
  "registeredAt": "2024-01-20T10:30:00.000Z"
}
```

**Errors:**
| Code | Message | Reason |
|------|---------|--------|
| 400 | Already registered | User/Team already registered |
| 400 | teamId required for team mode | Missing teamId |
| 404 | Challenge not found | Invalid challengeId |

---

### 5.2 Get My Participations

**GET** `/participations/my`

Returns all challenges the user has registered for.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
[
  {
    "id": "participation-uuid-1",
    "challengeId": "challenge-uuid-1",
    "userId": "user-uuid",
    "teamId": null,
    "mode": "solo",
    "registeredAt": "2024-01-20T10:30:00.000Z",
    "challenge": {
      "id": "challenge-uuid-1",
      "title": "AI Innovation Challenge",
      "status": "live",
      "submissionDeadline": "2024-02-25T23:59:59.000Z"
    }
  },
  {
    "id": "participation-uuid-2",
    "challengeId": "challenge-uuid-2",
    "userId": "user-uuid",
    "teamId": "team-uuid",
    "mode": "team",
    "registeredAt": "2024-01-22T14:00:00.000Z",
    "challenge": {
      "id": "challenge-uuid-2",
      "title": "Web3 Hackathon",
      "status": "upcoming",
      "submissionDeadline": "2024-03-15T23:59:59.000Z"
    },
    "team": {
      "id": "team-uuid",
      "name": "Team Alpha"
    }
  }
]
```

---

### 5.3 Get Participation Details

**GET** `/participations/:id`

Returns details of a specific participation.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| id | UUID | Participation ID |

**Response (200):**
```json
{
  "id": "participation-uuid",
  "challengeId": "challenge-uuid",
  "userId": "user-uuid",
  "teamId": "team-uuid",
  "mode": "team",
  "registeredAt": "2024-01-20T10:30:00.000Z",
  "challenge": {
    "id": "challenge-uuid",
    "title": "AI Innovation Challenge",
    "description": "...",
    "status": "live"
  },
  "team": {
    "id": "team-uuid",
    "name": "Team Alpha",
    "teamMembers": [...]
  }
}
```

---

## Phase 6: Submissions

> **Priority: HIGH**
> Core feature for submitting solutions to challenges.
> **Roles:** PARTICIPANT (create/edit), JUDGE/ADMIN (score)

### 6.1 Create Submission

**POST** `/submissions`

Creates a new submission (starts as draft).

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request:**
```json
{
  "challengeId": "challenge-uuid",
  "teamId": "team-uuid",
  "title": "AI-Powered Healthcare Solution",
  "idea": "Our idea leverages machine learning to predict patient outcomes...",
  "solution": "We built a comprehensive platform that integrates with existing hospital systems...",
  "isDraft": true,
  "links": [
    "https://github.com/team/project",
    "https://demo.ourproject.com",
    "https://youtube.com/watch?v=demo"
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| challengeId | UUID | Yes | Challenge being submitted to |
| teamId | UUID | No | Team ID (for team submissions) |
| title | string | Yes | Submission title |
| idea | string | Yes | Brief description of the idea |
| solution | string | Yes | Detailed solution description |
| isDraft | boolean | No | Default: true |
| links | string[] | No | GitHub, demo, video links |

**Response (201):**
```json
{
  "id": "submission-uuid",
  "challengeId": "challenge-uuid",
  "teamId": "team-uuid",
  "title": "AI-Powered Healthcare Solution",
  "idea": "Our idea leverages...",
  "solution": "We built a comprehensive...",
  "isDraft": true,
  "links": ["..."],
  "fileUrl": null,
  "score": null,
  "feedback": null,
  "createdAt": "2024-01-20T10:30:00.000Z"
}
```

---

### 6.2 Get My Submissions

**GET** `/submissions/my`

Returns all submissions by the current user.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
[
  {
    "id": "submission-uuid-1",
    "challengeId": "challenge-uuid-1",
    "title": "AI-Powered Healthcare Solution",
    "isDraft": false,
    "score": 85.5,
    "feedback": "Excellent implementation...",
    "createdAt": "2024-01-20T10:30:00.000Z",
    "challenge": {
      "id": "challenge-uuid-1",
      "title": "AI Innovation Challenge",
      "status": "results_published"
    }
  }
]
```

---

### 6.3 Get Submission Details

**GET** `/submissions/:id`

Returns detailed submission information.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| id | UUID | Submission ID |

**Response (200):**
```json
{
  "id": "submission-uuid",
  "challengeId": "challenge-uuid",
  "teamId": "team-uuid",
  "title": "AI-Powered Healthcare Solution",
  "idea": "Our idea leverages machine learning...",
  "solution": "We built a comprehensive platform...",
  "isDraft": false,
  "fileUrl": "uploads/submissions/submission-uuid.pdf",
  "links": [
    "https://github.com/team/project",
    "https://demo.ourproject.com"
  ],
  "score": 85.5,
  "feedback": "Excellent implementation with clear documentation.",
  "createdAt": "2024-01-20T10:30:00.000Z",
  "updatedAt": "2024-01-25T14:00:00.000Z"
}
```

---

### 6.4 Update Submission

**PATCH** `/submissions/:id`

Updates a draft submission.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| id | UUID | Submission ID |

**Request:**
```json
{
  "title": "Updated Title",
  "idea": "Updated idea description...",
  "solution": "Updated solution...",
  "links": ["https://github.com/updated-repo"]
}
```

**Response (200):** Updated submission object

**Errors:**
| Code | Message | Reason |
|------|---------|--------|
| 400 | Cannot edit finalized submission | isDraft is false |

---

### 6.5 Upload Submission File

**POST** `/submissions/:id/upload`

Uploads a PPT or PDF file for the submission.

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data
```

**Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| id | UUID | Submission ID |

**Request:** Form data with `file` field (binary)

**Accepted File Types:** `.pdf`, `.ppt`, `.pptx`

**Response (200):**
```json
{
  "fileUrl": "uploads/submissions/submission-uuid.pdf"
}
```

---

### 6.6 Finalize Submission

**PATCH** `/submissions/:id/final-submit`

Finalizes the submission (no more edits allowed).

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| id | UUID | Submission ID |

**Response (200):**
```json
{
  "id": "submission-uuid",
  "isDraft": false,
  "message": "Submission finalized successfully"
}
```

**Errors:**
| Code | Message | Reason |
|------|---------|--------|
| 400 | Submission deadline passed | Too late to submit |
| 400 | Already finalized | Already submitted |

---

### 6.7 Score Submission (Judge/Admin)

**POST** `/submissions/:id/score`

Scores a submission with feedback.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Roles:** `JUDGE`, `ADMIN`

**Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| id | UUID | Submission ID |

**Request:**
```json
{
  "score": 85.5,
  "feedback": "Excellent solution with innovative approach. The implementation is clean and well-documented. Consider adding more error handling for production use."
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| score | number | Yes | Score (0-100) |
| feedback | string | No | Written feedback |

**Response (200):**
```json
{
  "id": "submission-uuid",
  "score": 85.5,
  "feedback": "Excellent solution...",
  "scoredBy": "judge-uuid",
  "scoredAt": "2024-02-26T10:00:00.000Z"
}
```

---

## Phase 7: Judge Features

> **Priority: MEDIUM**
> Features for judges to evaluate submissions.
> **Roles:** JUDGE only (invited by SPONSOR/ADMIN)

### 7.1 Get Assigned Challenges

**GET** `/judge/challenges`

Returns challenges assigned to the current judge.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
[
  {
    "id": "challenge-uuid-1",
    "title": "AI Innovation Challenge",
    "status": "closed",
    "submissionDeadline": "2024-02-25T23:59:59.000Z",
    "totalSubmissions": 45,
    "scoredSubmissions": 12,
    "pendingSubmissions": 33
  }
]
```

---

### 7.2 Get Submissions to Judge

**GET** `/judge/submissions`

Returns all submissions for the judge's assigned challenges.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
[
  {
    "id": "submission-uuid-1",
    "title": "AI-Powered Healthcare Solution",
    "challengeId": "challenge-uuid-1",
    "teamId": "team-uuid",
    "isDraft": false,
    "score": null,
    "createdAt": "2024-01-20T10:30:00.000Z",
    "challenge": {
      "id": "challenge-uuid-1",
      "title": "AI Innovation Challenge"
    },
    "team": {
      "id": "team-uuid",
      "name": "Team Alpha"
    }
  }
]
```

---

## Phase 8: Admin/Sponsor Features

> **Priority: MEDIUM-LOW**
> Features for managing challenges and judges.
> **Roles:** SPONSOR, ADMIN

### 8.1 Create Challenge

**POST** `/challenges`

Creates a new challenge.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Roles:** `SPONSOR`, `ADMIN`

**Request:**
```json
{
  "title": "AI Innovation Challenge 2024",
  "description": "Build innovative AI solutions that solve real-world problems in healthcare, education, or sustainability.",
  "type": "free",
  "fee": 0,
  "startDate": "2024-02-01T00:00:00.000Z",
  "endDate": "2024-02-28T23:59:59.000Z",
  "submissionDeadline": "2024-02-25T23:59:59.000Z",
  "rewards": "1st Place: $5,000\n2nd Place: $3,000\n3rd Place: $2,000\nAll participants receive certificates",
  "maxTeamSize": 4,
  "status": "draft"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | Challenge title |
| description | string | Yes | Full description |
| type | enum | Yes | `free`, `paid`, `startup_challenge` |
| fee | number | Conditional | Required if type is `paid` |
| startDate | ISO date | Yes | Challenge start date |
| endDate | ISO date | Yes | Challenge end date |
| submissionDeadline | ISO date | Yes | Submission cutoff |
| rewards | string | No | Prize description |
| maxTeamSize | number | No | Max members per team |
| status | enum | No | Default: `draft` |

**Response (201):** Created challenge object

---

### 8.2 Update Challenge

**PATCH** `/challenges/:id`

Updates an existing challenge.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Roles:** `SPONSOR`, `ADMIN`

**Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| id | UUID | Challenge ID |

**Request:** Any fields from create (partial update)

**Response (200):** Updated challenge object

---

### 8.3 Delete Challenge

**DELETE** `/challenges/:id`

Deletes a challenge.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Roles:** `SPONSOR`, `ADMIN`

**Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| id | UUID | Challenge ID |

**Response (200):**
```json
{
  "message": "Challenge deleted successfully"
}
```

---

### 8.4 Upload Problem Statement

**POST** `/challenges/:id/problem-statement`

Uploads a problem statement PDF.

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data
```

**Roles:** `SPONSOR`, `ADMIN`

**Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| id | UUID | Challenge ID |

**Request:** Form data with `file` field (binary PDF)

**Response (200):**
```json
{
  "problemStatementUrl": "uploads/challenges/challenge-uuid-problem.pdf"
}
```

---

### 8.5 Publish Results

**POST** `/challenges/:id/publish-results`

Publishes the results for a challenge.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Roles:** `SPONSOR`, `ADMIN`

**Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| id | UUID | Challenge ID |

**Response (200):**
```json
{
  "message": "Results published successfully",
  "challenge": {
    "id": "challenge-uuid",
    "status": "results_published"
  }
}
```

---

### 8.6 Invite Judge

**POST** `/auth/invite`

Invites a new judge to the platform.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Roles:** `SPONSOR`, `ADMIN`

**Request:**
```json
{
  "email": "judge@example.com",
  "name": "Dr. Jane Smith",
  "role": "judge",
  "message": "We would be honored to have you as a judge for our AI Innovation Challenge!"
}
```

**Response (200):**
```json
{
  "message": "Invitation sent successfully",
  "inviteId": "invite-uuid"
}
```

---

### 8.7 Get Sent Invitations

**GET** `/auth/invites`

Returns all invitations sent by the current user.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Roles:** `SPONSOR`, `ADMIN`

**Response (200):**
```json
[
  {
    "id": "invite-uuid-1",
    "email": "judge1@example.com",
    "name": "Dr. Jane Smith",
    "role": "judge",
    "status": "pending",
    "createdAt": "2024-01-20T10:30:00.000Z",
    "expiresAt": "2024-01-27T10:30:00.000Z"
  },
  {
    "id": "invite-uuid-2",
    "email": "judge2@example.com",
    "name": "Prof. John Doe",
    "role": "judge",
    "status": "accepted",
    "createdAt": "2024-01-15T08:00:00.000Z",
    "acceptedAt": "2024-01-16T14:00:00.000Z"
  }
]
```

---

### 8.8 Revoke Invitation

**DELETE** `/auth/invites/:inviteId`

Revokes a pending invitation.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Roles:** `SPONSOR`, `ADMIN`

**Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| inviteId | UUID | Invitation ID |

**Response (200):**
```json
{
  "message": "Invitation revoked successfully"
}
```

---

### 8.9 Assign Judge to Challenge

**POST** `/admin/judges/assign`

Assigns a judge to evaluate a specific challenge.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Roles:** `ADMIN`

**Request:**
```json
{
  "judgeId": "judge-user-uuid",
  "challengeId": "challenge-uuid"
}
```

**Response (200):**
```json
{
  "message": "Judge assigned successfully",
  "assignment": {
    "id": "assignment-uuid",
    "judgeId": "judge-user-uuid",
    "challengeId": "challenge-uuid",
    "assignedAt": "2024-01-20T10:30:00.000Z"
  }
}
```

---

### 8.10 Judge Accept Invitation

**POST** `/auth/invite/accept`

Accepts an invitation and creates judge account.

**Request:**
```json
{
  "token": "invitation-token-from-email",
  "name": "Dr. Jane Smith",
  "password": "SecurePassword123",
  "organization": "MIT"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "new-user-uuid",
    "email": "judge@example.com",
    "name": "Dr. Jane Smith",
    "role": "judge"
  }
}
```

---

## Suggested Frontend Pages

Based on the API structure, here are the recommended pages to build:

### Public Pages (No Auth Required)

| Page | Route | Description | APIs Used |
|------|-------|-------------|-----------|
| **Landing Page** | `/` | Platform overview, featured challenges | `GET /challenges/live` |
| **Login** | `/login` | User login form | `POST /auth/login` |
| **Signup** | `/signup` | User registration form | `POST /auth/signup` |
| **OTP Verification** | `/verify-otp` | OTP input form | `POST /auth/verify-otp`, `POST /auth/resend-otp` |
| **Forgot Password** | `/forgot-password` | Password reset request | `POST /auth/forgot-password` |
| **Reset Password** | `/reset-password` | New password form | `POST /auth/reset-password` |
| **Challenges List** | `/challenges` | Browse all challenges | `GET /challenges`, `/challenges/live`, `/challenges/upcoming` |
| **Challenge Details** | `/challenges/:id` | Single challenge view | `GET /challenges/:id` |
| **Accept Invitation** | `/invite/accept` | Judge invitation acceptance | `GET /auth/invite/verify`, `POST /auth/invite/accept` |

### Participant Pages (Auth Required)

| Page | Route | Description | APIs Used |
|------|-------|-------------|-----------|
| **Dashboard** | `/dashboard` | Overview of participations, teams, submissions | `GET /auth/me`, `GET /participations/my`, `GET /teams/my` |
| **Profile** | `/profile` | User profile view/edit | `GET /auth/me` |
| **Profile Settings** | `/settings` | Account settings, sessions | `GET /auth/sessions`, `DELETE /auth/sessions/:id`, `POST /auth/logout-all` |
| **My Teams** | `/teams` | List user's teams | `GET /teams/my` |
| **Create Team** | `/teams/create` | Team creation form | `POST /teams` |
| **Team Details** | `/teams/:id` | Team view with members | `GET /teams/:id`, `POST /teams/:id/invite` |
| **Join Team** | `/teams/join` | Join via invite code | `POST /teams/join` |
| **My Participations** | `/participations` | List registered challenges | `GET /participations/my` |
| **Register for Challenge** | `/challenges/:id/register` | Registration form | `POST /participations` |
| **My Submissions** | `/submissions` | List all submissions | `GET /submissions/my` |
| **Create Submission** | `/submissions/create` | Submission form | `POST /submissions` |
| **Edit Submission** | `/submissions/:id/edit` | Edit draft submission | `GET /submissions/:id`, `PATCH /submissions/:id` |
| **Submission Details** | `/submissions/:id` | View submission with score | `GET /submissions/:id` |
| **Upload Submission File** | `/submissions/:id/upload` | File upload page | `POST /submissions/:id/upload` |

### Judge Pages (Auth Required - Judge Role)

| Page | Route | Description | APIs Used |
|------|-------|-------------|-----------|
| **Judge Dashboard** | `/judge` | Assigned challenges overview | `GET /judge/challenges` |
| **Submissions to Judge** | `/judge/submissions` | List submissions to evaluate | `GET /judge/submissions` |
| **Score Submission** | `/judge/submissions/:id` | Scoring interface | `GET /submissions/:id`, `POST /submissions/:id/score` |

### Sponsor Pages (Auth Required - Sponsor Role)

| Page | Route | Description | APIs Used |
|------|-------|-------------|-----------|
| **Sponsor Dashboard** | `/sponsor` | My challenges overview | `GET /challenges` (filtered) |
| **Create Challenge** | `/sponsor/challenges/create` | Challenge creation form | `POST /challenges` |
| **Edit Challenge** | `/sponsor/challenges/:id/edit` | Challenge edit form | `GET /challenges/:id`, `PATCH /challenges/:id` |
| **Upload Problem Statement** | `/sponsor/challenges/:id/problem` | PDF upload | `POST /challenges/:id/problem-statement` |
| **Invite Judges** | `/sponsor/judges/invite` | Judge invitation form | `POST /auth/invite` |
| **Manage Invitations** | `/sponsor/invitations` | View/revoke invitations | `GET /auth/invites`, `DELETE /auth/invites/:id` |
| **Publish Results** | `/sponsor/challenges/:id/results` | Results publishing | `POST /challenges/:id/publish-results` |

### Admin Pages (Auth Required - Admin Role)

| Page | Route | Description | APIs Used |
|------|-------|-------------|-----------|
| **Admin Dashboard** | `/admin` | Platform overview | All stats endpoints |
| **Manage Challenges** | `/admin/challenges` | All challenges CRUD | All challenge endpoints |
| **Assign Judges** | `/admin/judges/assign` | Judge assignment | `POST /admin/judges/assign` |
| **All Invitations** | `/admin/invitations` | Manage all invitations | `GET /auth/invites`, `DELETE /auth/invites/:id` |

---

## Error Handling Reference

### HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | Success | Request completed successfully |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input, validation failed |
| 401 | Unauthorized | Invalid/expired token or credentials |
| 403 | Forbidden | Role-based access denied |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists or state conflict |
| 500 | Server Error | Unexpected server error |

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "email",
      "message": "email must be a valid email address"
    }
  ]
}
```

### Token Refresh Flow

```
1. Make API request with accessToken
2. If 401 response with "Token expired":
   a. Call POST /auth/refresh-token with refreshToken
   b. Store new tokens
   c. Retry original request
3. If refresh fails (401):
   a. Clear stored tokens
   b. Redirect to login
```

---

## Authentication Headers

For all protected endpoints, include:

```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

For file uploads:

```
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data
```

---

## Rate Limiting

| Endpoint | Limit |
|----------|-------|
| `/auth/resend-otp` | 60 seconds cooldown |
| Other endpoints | No documented limits |

---

## Environment Variables

Ensure the frontend has access to:

```env
NEXT_PUBLIC_API_URL=https://api.centrexcel.com/api/v1
```

---

*Documentation generated for Centrexcel Business Backend v1.0*

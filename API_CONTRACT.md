# BuildBoard API Contract

Base URL: `http://localhost:5000/api`

All endpoints except `POST /auth/google` require a Bearer token in the `Authorization` header.

---

## Authentication

### POST /auth/google
**Auth:** Public

**Request:**
```json
{ "idToken": "string (Google OAuth id_token)" }
```

**Response (200):**
```json
{
  "token": "string (JWT)",
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "pictureUrl": "string | null",
    "role": "Employee | Manager | Admin"
  }
}
```

**Logic:**
- Verify Google id_token using Google.Apis.Auth with ClientId from config
- Reject 401 if email domain != AllowedDomain from config
- If email == SuperAdmin from config -> role = Admin (always)
- Otherwise: find or create user in DB with role = Employee
- Return signed JWT (HS256, 60 min expiry) with userId, email, name, pictureUrl, role

---

## Users

### GET /users
**Auth:** Admin only

**Response (200):**
```json
[
  {
    "_id": "string",
    "name": "string",
    "email": "string",
    "pictureUrl": "string | null",
    "role": "Employee | Manager | Admin",
    "lastActive": "ISO date string | null"
  }
]
```

### PATCH /users/:userId/role
**Auth:** Admin only

**Request:**
```json
{ "role": "Employee | Manager | Admin" }
```

**Response (200):**
```json
{ "message": "Role updated" }
```

### GET /users/me
**Auth:** Any authenticated user

**Response (200):**
```json
{
  "id": "string",
  "email": "string",
  "name": "string",
  "pictureUrl": "string",
  "role": "Employee | Manager | Admin",
  "totalPoints": 0,
  "ideasBuilt": 0,
  "onTimePercent": 0,
  "avgRating": 0.0,
  "badges": ["First Build", "Early Bird"],
  "pointsHistory": [
    {
      "ideaTitle": "string",
      "basePoints": 50,
      "complexityBonus": 20,
      "deliveryMultiplier": 1.25,
      "feedbackBonus": 50,
      "totalPoints": 112
    }
  ]
}
```

---

## Ideas

### GET /ideas
**Auth:** Any authenticated user

**Query params (all optional):**
- `status` — filter by status (e.g. `PendingApproval`)
- `category` — filter by category
- `size` — filter by size
- `projectType` — filter by POC or FullProduct

**Response (200):**
```json
[
  {
    "_id": "string",
    "title": "string",
    "description": "string",
    "category": "AI/ML | Automation | DevTools | UX | Infrastructure | Other",
    "projectType": "POC | FullProduct",
    "size": "Micro | Small | Medium | Large | XL | Enterprise | null",
    "complexity": "Low | Medium | High | Innovative | null",
    "status": "Draft | PendingApproval | Approved | BiddingOpen | BiddingClosed | Assigned | InProgress | Completed | Archived",
    "submittedBy": "string (userId)",
    "projectOwner": "string (name)",
    "expectedDeliveryDate": "ISO date string | null",
    "createdAt": "ISO date string"
  }
]
```

### POST /ideas
**Auth:** Any authenticated user

**Request:**
```json
{
  "title": "string (required)",
  "description": "string (required)",
  "category": "AI/ML | Automation | DevTools | UX | Infrastructure | Other",
  "projectType": "POC | FullProduct",
  "projectOwner": "string"
}
```

**Response (201):**
```json
{
  "_id": "string",
  "title": "string",
  "status": "PendingApproval",
  "createdAt": "ISO date string"
}
```

**Logic:** Status is automatically set to `PendingApproval`. Size and complexity are set later by the manager during approval.

### GET /ideas/:id
**Auth:** Members only (assigned team + projectOwner + approving manager + Admin). Return 403 for non-members.

**Response (200):**
```json
{
  "_id": "string",
  "title": "string",
  "description": "string",
  "category": "string",
  "projectType": "POC | FullProduct",
  "size": "Micro | Small | Medium | Large | XL | Enterprise | null",
  "complexity": "Low | Medium | High | Innovative | null",
  "status": "string",
  "submittedBy": "string",
  "projectOwner": "string",
  "approvedBy": "string | null",
  "expectedDeliveryDate": "ISO date string | null",
  "bidCutoffDate": "ISO date string | null",
  "estimatedHours": 40,
  "assignedTo": "string (userId) | null",
  "teamMembers": [
    { "userId": "string", "name": "string", "pictureUrl": "string | null" }
  ],
  "timeLogs": [
    { "hours": 3, "notes": "string", "userName": "string", "date": "ISO date string" }
  ],
  "comments": [
    { "text": "string", "userName": "string", "pictureUrl": "string | null", "createdAt": "ISO date string" }
  ]
}
```

**Response (403):**
```json
{ "message": "Access denied" }
```

### PATCH /ideas/:id/approve
**Auth:** Manager / Admin

**Request:**
```json
{
  "size": "Micro | Small | Medium | Large | XL | Enterprise",
  "complexity": "Low | Medium | High | Innovative",
  "bidCutoffDate": "ISO date string",
  "expectedDeliveryDate": "ISO date string"
}
```

**Response (200):**
```json
{ "message": "Idea approved", "status": "BiddingOpen" }
```

**Logic:** Set status to `BiddingOpen`. Record approvedBy as the current user.

### PATCH /ideas/:id/reject
**Auth:** Manager / Admin

**Request:**
```json
{ "comment": "string | null" }
```

**Response (200):**
```json
{ "message": "Idea rejected", "status": "Rejected" }
```

### PATCH /ideas/:id/complete
**Auth:** Assigned builder (team member)

**Request:** (empty body)

**Response (200):**
```json
{ "message": "Idea marked as completed", "status": "Completed" }
```

**Logic:** Only the assigned builder(s) can mark as complete. Changes status from `InProgress` to `Completed`.

---

## Bids

### POST /ideas/:id/bids
**Auth:** Any authenticated user

**Request:**
```json
{
  "mode": "solo | team",
  "teamMembers": ["string (name)"],
  "committedDeliveryDate": "ISO date string (required)",
  "approach": "string"
}
```

**Response (201):**
```json
{
  "_id": "string",
  "ideaId": "string",
  "mode": "solo | team",
  "committedDeliveryDate": "ISO date string",
  "status": "Pending",
  "createdAt": "ISO date string"
}
```

**Logic:** `teamMembers` is only relevant when mode is `team`. Each team member gets a `confirmationStatus: "Pending"`.

### GET /ideas/:ideaId/bids
**Auth:** Manager / Admin

**Response (200):**
```json
[
  {
    "_id": "string",
    "bidderName": "string",
    "committedDeliveryDate": "ISO date string",
    "performanceScore": 85,
    "mode": "solo | team",
    "approach": "string",
    "status": "Pending | Won | Active | Not Selected",
    "teamMembers": [
      { "name": "string", "confirmed": true }
    ]
  }
]
```

### GET /bids/mine
**Auth:** Any authenticated user

**Response (200):**
```json
[
  {
    "_id": "string",
    "ideaTitle": "string",
    "committedDeliveryDate": "ISO date string",
    "mode": "solo | team",
    "status": "Pending | Won | Active | Not Selected",
    "confirmationStatus": "Pending | Confirmed | Declined | null"
  }
]
```

**Note:** `confirmationStatus` is only present for team bids where the current user is a team member (not the lead). It's `null` for solo bids or the bid creator.

### PATCH /bids/:bidId/assign
**Auth:** Manager / Admin

**Request:** (empty body)

**Response (200):**
```json
{ "message": "Bid assigned" }
```

**Logic:** 
- Mark the selected bid as `Won` / `Active`
- Mark all other bids for the same idea as `Not Selected`
- Change idea status to `Assigned` then `InProgress`
- Set assignedTo and teamMembers on the idea

### PATCH /bids/:bidId/confirm
**Auth:** Team member of the bid

**Request:** (empty body)

**Response (200):**
```json
{ "message": "Participation confirmed" }
```

### PATCH /bids/:bidId/decline
**Auth:** Team member of the bid

**Request:** (empty body)

**Response (200):**
```json
{ "message": "Participation declined" }
```

---

## Time Logs

### POST /ideas/:id/timelogs
**Auth:** Assigned team members only

**Request:**
```json
{
  "hours": 3.5,
  "notes": "string"
}
```

**Response (201):**
```json
{
  "hours": 3.5,
  "notes": "string",
  "userName": "string",
  "date": "ISO date string"
}
```

---

## Comments

### POST /ideas/:id/comments
**Auth:** Members only (team + projectOwner + manager + Admin)

**Request:**
```json
{ "text": "string" }
```

**Response (201):**
```json
{
  "text": "string",
  "userName": "string",
  "pictureUrl": "string | null",
  "createdAt": "ISO date string"
}
```

---

## Feedback

### POST /ideas/:id/feedback
**Auth:** Manager / Admin

**Request:**
```json
{
  "rating": "Poor | Average | Good | Excellent",
  "comment": "string"
}
```

**Response (201):**
```json
{ "message": "Feedback submitted", "pointsAwarded": 112.5 }
```

**Logic:** This triggers the **Points Engine** (see below). After feedback is saved, calculate and award points to the builder(s).

---

## Analytics

### GET /analytics/overview
**Auth:** Any authenticated user

**Response (200):**
```json
{
  "openIdeas": 12,
  "inProgress": 5,
  "biddingOpen": 3,
  "completed": 8
}
```

### GET /analytics/dashboard
**Auth:** Manager / Admin

**Response (200):**
```json
{
  "totalIdeas": 28,
  "completed": 8,
  "onTimePercent": 75,
  "activeBuilders": 5,
  "ideasByCategory": [
    { "category": "AI/ML", "count": 5 },
    { "category": "Automation", "count": 8 }
  ],
  "hoursThisMonth": [
    { "name": "John", "hours": 24 },
    { "name": "Sara", "hours": 18 }
  ],
  "avgHoursBySize": [
    { "size": "Micro", "hours": 3 },
    { "size": "Small", "hours": 12 },
    { "size": "Medium", "hours": 30 },
    { "size": "Large", "hours": 60 }
  ],
  "pocCount": 15,
  "fullProductCount": 13,
  "teamBids": 10,
  "soloBids": 18,
  "earlyDeliveries": 4,
  "lateDeliveries": 2,
  "leaderboard": [
    { "name": "John", "points": 450 },
    { "name": "Sara", "points": 320 }
  ]
}
```

---

## Points Engine (Backend Logic)

Triggered automatically when `POST /ideas/:id/feedback` is called.

### Calculation:

```
Base Points (by size):
  Micro = 10, Small = 25, Medium = 50, Large = 100, XL = 200, Enterprise = 400

Complexity Bonus:
  Low = +0, Medium = +20, High = +50, Innovative = +100

Delivery Multiplier:
  Early (completedDate < expectedDeliveryDate) = base * 1.25
  On Time (completedDate == expectedDeliveryDate) = base * 1.0
  Late (completedDate > expectedDeliveryDate) = base * 0

Feedback Bonus:
  Excellent = +50, Good = +25, Average = +10, Poor = +0

Total = (base * deliveryMultiplier) + complexityBonus + feedbackBonus

Team bids: total is split equally among all confirmed team members.
```

### Example:
- Medium idea, High complexity, Early delivery, Excellent feedback
- Total = (50 * 1.25) + 50 + 50 = **162.5 pts** (solo)
- If team of 2: **81.25 pts each**

### Milestone:
- When any user crosses **2000 total points**, flag them for HR notification
- `GET /analytics/dashboard` leaderboard is used by Admin to see milestone-ready users

---

## Data Models (Reference)

```
User:       id, email, name, pictureUrl, role, totalPoints, performanceScore, createdAt
Idea:       id, title, description, category, projectType, size, complexity, status,
            submittedBy, projectOwner, approvedBy, assignedTo, bidCutoffDate,
            expectedDeliveryDate, estimatedHours, createdAt
Bid:        id, ideaId, bidType, leadUserId, committedDate, approachNote, status,
            isSelected, createdAt
BidMember:  id, bidId, userId, confirmed
TimeLog:    id, ideaId, userId, date, hoursLogged, notes
Comment:    id, ideaId, userId, message, createdAt
Feedback:   id, ideaId, managerId, rating, comment, createdAt
PointTransaction: id, userId, ideaId, basePoints, complexityBonus,
                  deliveryMultiplier, feedbackBonus, totalPoints, awardedAt
```

---

## Idea Status Flow

```
PendingApproval -> Approved/BiddingOpen (manager approves)
                -> Rejected (manager rejects)
BiddingOpen     -> BiddingClosed (bid cutoff date passes)
BiddingClosed   -> Assigned (manager assigns bid winner)
Assigned        -> InProgress (automatic after assignment)
InProgress      -> Completed (builder marks complete)
Completed       -> Archived (optional cleanup)
```

---

## Error Responses

All endpoints return errors in this format:

```json
{ "message": "Error description" }
```

Common status codes:
- `400` — Bad request / validation error
- `401` — Not authenticated / invalid token
- `403` — Not authorized (wrong role or not a project member)
- `404` — Resource not found
- `500` — Server error

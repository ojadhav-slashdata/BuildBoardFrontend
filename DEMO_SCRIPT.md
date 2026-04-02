# BuildBoard - Hackathon Demo Script (5 minutes)

## Elevator Pitch (30 seconds)
"BuildBoard is an internal innovation platform that turns employee ideas into executed projects through a transparent, gamified workflow. Think of it as Shark Tank meets Jira for your company's 20% innovation time."

---

## Demo Flow

### 1. Login (15 seconds)
- Open the app, click **Sign in with Google**
- Show: Clean login page with animated flow steps

### 2. Employee Dashboard (30 seconds)
- **Portal** loads with live stats: Open ideas, In Progress, Completed
- Point out: **Leaderboard** on the right (top contributors)
- Point out: **Live Activity feed** showing real idea movement
- "Every employee sees their innovation portfolio at a glance"

### 3. Submit an Idea (30 seconds)
- Click **Submit Idea** in sidebar
- Fill in: Title, Description, Category, Project Type (POC vs Full Product)
- Show: Business value tags, file upload
- Submit -> **Toast notification** confirms success
- "Any employee can submit an idea. No manager approval needed to start."

### 4. Manager Approval (30 seconds)
- Switch role to **Manager** (role switcher in navbar)
- Go to **Approvals**
- Show the pending idea, set Size (Medium), Complexity (High), Points
- **Approve** -> Toast confirms -> Bidding opens automatically
- "Managers set the parameters. The algorithm handles the rest."

### 5. Competitive Bidding (45 seconds)
- Switch back to **Employee**
- Go to **Browse Ideas** -> Show the approved idea open for bidding
- Click **Place a Bid** -> Choose Solo mode, set delivery date, write approach
- Submit bid -> Toast confirms
- Switch to **Manager** -> **Bid Dashboard**
- Show the **Bid Ranking Algorithm** animation (40% delivery rate, 35% rating, 25% completion)
- "Bids are ranked transparently by performance, not politics"
- Click **Auto-Assign** -> Best bid wins automatically

### 6. Project Workspace (45 seconds)
- Go to **Projects** -> Open the active project
- Show **project name at top**, status badge (In Progress)
- **Board tab**: Kanban with tasks across Todo/In Progress/In Review/Done
- **Chat tab**: Point out the **Live** indicator -> Send a message
- "Real-time collaboration. No need for Slack or external tools."
- **Requirements tab**: Must have / Should have / Nice to have
- **Resources tab**: Figma, GitHub, Docs links

### 7. Completion & Rewards (45 seconds)
- Show a completed project
- Switch to Manager -> Give **Feedback** (Excellent rating)
- "Points are auto-calculated: base + complexity bonus x delivery multiplier + rating"
- Switch to Employee -> Go to **Profile**
- Show: Points earned, badges, on-time %, average rating
- Go to **Marketplace**
- Show: **Lifetime earned vs Available** points
- Browse reward tiers (Tier 1-4)
- **Redeem** a Tier 1 reward -> Toast confirms -> "HR notified automatically"
- "Real incentives drive real participation"

### 8. Executive View (30 seconds)
- Switch to Manager -> **Analytics**
- Show: Category breakdown, delivery health, top performers
- Go to **Executive Dashboard**
- Show: Monthly trends, portfolio metrics
- "Leadership gets full visibility into innovation ROI"

---

## Key Differentiators to Mention

1. **Transparent Algorithm** - No black box. Everyone sees how bids are ranked
2. **End-to-End Platform** - Idea to reward in one tool. No tool-switching
3. **Gamification That Works** - Points expire (12 months), creating urgency. Tiered rewards feel achievable
4. **Real-time Collaboration** - Live chat via Supabase Realtime
5. **Self-Documenting** - Employee Guide explains the full system. No training needed
6. **Role-Based Experience** - Each role (Employee/Manager/Admin) has a tailored view

---

## If Judges Ask...

**"How is this different from Jira?"**
Jira manages work. BuildBoard manages innovation — from ideation through gamified execution to tangible rewards. The bidding system ensures the best builders work on the best ideas.

**"Does this scale?"**
Built on Supabase (PostgreSQL), React, and Express. Row-level security, JWT auth, role-based access. Enterprise-ready architecture.

**"What about AI?"**
The transparent ranking algorithm is our AI — it removes human bias from project assignment. Future: AI-powered idea deduplication and category suggestion.

**"Who is this for?"**
Any company with 50+ employees that wants to formalize innovation time. Especially relevant for tech companies with 20% time policies.

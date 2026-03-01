# Claw Dealership - Design Document

> AI Agent / OpenClaw Alternative Directory
> Version: 1.0
> Date: 2026-03-01

---

## 1. Project Overview

### Mission
Create a centralized directory for discovering and comparing open-source AI agents in the OpenClaw ecosystem.

### Target Users
- Developers looking for AI agent solutions
- Hobbyists seeking hardware-specific agents (ESP32, Pi)
- Enterprises evaluating secure/local options
- Creators launching new alternatives

---

## 2. Tech Stack

| Layer | Technology | Rationale |
|-------|------------|------------|
| Framework | Next.js 14 (App Router) | Familiar, simple, well-supported |
| Styling | Tailwind CSS | Already configured |
| Database | SQLite (better-sqlite3) | File-based, simple, production-ready |
| Auth | NextAuth.js + GitHub | Prevents spam, simple setup |
| Deployment | GCP/AWS | User handles |

---

## 3. Data Model

### Alternative

```typescript
{
  id: string;           // UUID
  name: string;         // e.g., "Nanobot"
  slug: string;         // URL-friendly, e.g., "nanobot"
  description: string;  // 1-2 sentence tagline
  fullDescription?: string;

  // Repository
  githubUrl: string;
  stars?: number;       // Fetched from GitHub API
  language: string;     // Python, Rust, TypeScript, Go, etc.

  // Categorization
  category: string;     // popular, security, lightweight, enterprise, hardware
  security: string;    // sandboxed, workspace-isolation, minimal-permissions, standard
  deployment: string[];// local, cloud, docker, serverless, desktop, embedded
  hardware: string[];   // x86_64, arm64, esp32, raspberry-pi, risc-v, cloud-only
  useCases: string[];  // personal, enterprise, development, automation, research

  features: string[];   // ["MCP support", "CLI interface", "API", etc.]

  // Metadata
  submittedBy: string; // GitHub username
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
}
```

### User

```typescript
{
  id: string;
  githubId: string;
  username: string;
  avatar: string;
  role: "user" | "admin";
}
```

---

## 4. Filter Dimensions

| Filter | Options |
|--------|---------|
| Language | Python, Rust, TypeScript, Go, C, Zig, Other |
| Hardware | x86_64, ARM64, ESP32, Raspberry Pi, RISC-V, Cloud-only |
| Security | Sandboxed, Workspace Isolation, Minimal Permissions, Standard |
| Deployment | Local, Cloud, Docker, Serverless, Desktop, Embedded |
| Use Case | Personal, Enterprise, Development, Automation, Research |
| Category | Popular, Security, Lightweight, Enterprise, Hardware |

---

## 5. Pages

| Route | Purpose |
|-------|---------|
| `/` | Home - hero, search, featured, filter sidebar, directory grid |
| `/alternatives/[slug]` | Detail page - full specs, features, GitHub link |
| `/submit` | Submission form (auth required) |
| `/login` | GitHub OAuth sign-in |

---

## 6. Features

### Home Page
- Hero section with search bar
- Featured alternatives section
- Filter sidebar (collapsible on mobile)
- Grid display of alternatives with cards
- Cards show: name, description, language badge, stars

### Detail Page
- Full metadata display
- GitHub link with stars
- All filter tags
- Feature list

### Submit Flow
1. User clicks "Submit" → redirected to login if not authenticated
2. After GitHub OAuth, return to submit form
3. Form fields: name, description, GitHub URL, language, categories
4. Auto-fetch stars from GitHub API on URL input
5. Submit → saved as "pending" status
6. Show success message

### Auth
- GitHub OAuth via NextAuth
- Required for submission
- Session via JWT
- User model stores: GitHub ID, username, avatar

---

## 7. MVP Scope

### Build
- [ ] SQLite database with schema
- [ ] NextAuth GitHub authentication
- [ ] Home page with search and filters
- [ ] Alternative detail pages
- [ ] Submit form (protected)
- [ ] GitHub API integration for stars

### Later
- Release announcements page
- User dashboard
- Admin moderation queue
- Additional alternatives data

---

## 8. Out of Scope

- User ratings/reviews
- Comparison tool
- Newsletter
- Public API
- Email notifications

These can be added after MVP gains traction.

---

*Last updated: 2026-03-01*

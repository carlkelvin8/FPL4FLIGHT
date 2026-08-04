# FPL4FLIGHT — Project Management Template

> Copy this entire page into Notion (Ctrl+A → Ctrl+C → Paste in Notion). The tables will auto-convert to Notion databases.

---

## 🎯 Project Overview

| Property | Value |
|----------|-------|
| Project | FPL4FLIGHT |
| Description | Aviation flight planning & pilot tools mobile app, admin dashboard, and marketing website |
| Tech Stack | React Native (Expo SDK 54), Next.js (Admin), HTML/CSS (Landing Page), Supabase |
| Package | `io.pilotforms.app` |
| Platforms | Android, iOS (future), Web (admin + landing) |
| Status | In Development |
| Owner | Carl Manahan |

---

## 📱 Products

| Product | Tech | Status | Priority |
|---------|------|--------|----------|
| Mobile App | React Native / Expo Router | Active Development | P0 |
| Admin Dashboard | Next.js / Tailwind | Active Development | P1 |
| Landing Page / Website | HTML / CSS / JS | Needs Build | P1 |

---

## 🏗️ Architecture

```
FPL4FLIGHT/
├── apps/
│   ├── mobile/        → React Native (Expo SDK 54)
│   ├── admin/         → Next.js admin panel
│   └── website/       → Landing page (static)
├── packages/
│   └── shared/        → Shared types & utilities
└── supabase/          → Database, Auth, Storage, Edge Functions
```

---

# 📋 MOBILE APP — Backlog

## 🔴 Sprint Board

| ID | Title | Status | Priority | Assignee | Sprint | Labels |
|----|-------|--------|----------|----------|--------|--------|
| MOB-001 | App crashes on Infinix Smart 9 (XOS ROM) | To Do | 🔴 Critical | — | Sprint 3 | Bug, Android |
| MOB-002 | Add USB debugging crash logs from real device | To Do | 🔴 Critical | — | Sprint 3 | Debug |
| MOB-003 | Background location tracking notification | To Do | 🟠 High | — | Sprint 3 | Feature, Live-Track |
| MOB-004 | Implement push notification handling (foreground/background) | To Do | 🟠 High | — | Sprint 3 | Feature, Notifications |
| MOB-005 | Add pull-to-refresh on AIP documents screen | To Do | 🟡 Medium | — | Sprint 4 | UX |
| MOB-006 | Chat: Add image preview modal on tap | To Do | 🟡 Medium | — | Sprint 4 | Feature, Chat |
| MOB-007 | Chat: Message search debounce (300ms) | To Do | 🟡 Medium | — | Sprint 4 | Performance, Chat |
| MOB-008 | Logbook: Export as CSV | To Do | 🟡 Medium | — | Sprint 4 | Feature, Export |
| MOB-009 | Weight & Balance: Save configurations per aircraft | To Do | 🟡 Medium | — | Sprint 5 | Feature, W&B |
| MOB-010 | Live-track: Save & export completed tracks (GPX) | To Do | 🟡 Medium | — | Sprint 5 | Feature, Live-Track |
| MOB-011 | Dark mode support | To Do | 🟢 Low | — | Sprint 6 | UI, Theming |
| MOB-012 | Multi-language support (Filipino/English) | To Do | 🟢 Low | — | Sprint 6 | i18n |
| MOB-013 | Add haptic feedback to all interactive buttons | Done | 🟢 Low | Carl | Sprint 2 | UX |
| MOB-014 | iOS build setup & TestFlight | To Do | 🟢 Low | — | Sprint 7 | Platform, iOS |

---

## ✅ Completed (Mobile)

| ID | Title | Completed | Sprint |
|----|-------|-----------|--------|
| MOB-100 | Biometric lock enforcement on launch | ✅ Aug 4 | Sprint 2 |
| MOB-101 | Fix signOut hang (try/catch) | ✅ Aug 4 | Sprint 2 |
| MOB-102 | Fix stale closure in chat subscription | ✅ Aug 4 | Sprint 2 |
| MOB-103 | Auth failsafe increased to 5s | ✅ Aug 4 | Sprint 2 |
| MOB-104 | Copy-paste ternary bug in AuthRepository | ✅ Aug 4 | Sprint 2 |
| MOB-105 | XSS fix in PDF HTML generation (escapeHtml) | ✅ Aug 4 | Sprint 2 |
| MOB-106 | SQL wildcard injection fix in chat search | ✅ Aug 4 | Sprint 2 |
| MOB-107 | File upload size/type validation (10MB/25MB) | ✅ Aug 4 | Sprint 2 |
| MOB-108 | Offline sync retry_count + MAX_RETRIES=5 | ✅ Aug 4 | Sprint 2 |
| MOB-109 | WebView originWhitelist restricted | ✅ Aug 4 | Sprint 2 |
| MOB-110 | Data export now writes file + shares | ✅ Aug 4 | Sprint 2 |
| MOB-111 | Form submit validates required fields | ✅ Aug 4 | Sprint 2 |
| MOB-112 | All accessibility labels added | ✅ Aug 4 | Sprint 2 |
| MOB-113 | Type-safe Supabase row mappings | ✅ Aug 4 | Sprint 2 |
| MOB-114 | app.json fully configured | ✅ Aug 4 | Sprint 2 |
| MOB-115 | Chat error banner shown on send failure | ✅ Aug 4 | Sprint 2 |
| MOB-116 | FlightRepository update method | ✅ Aug 4 | Sprint 2 |
| MOB-117 | Duty tracker overnight shift fix | ✅ Aug 4 | Sprint 2 |
| MOB-118 | NOTAMs response validation | ✅ Aug 4 | Sprint 2 |
| MOB-119 | Chat polling reduced to 60s | ✅ Aug 4 | Sprint 2 |
| MOB-120 | Aircraft delete button visible | ✅ Aug 4 | Sprint 2 |
| MOB-121 | Flight-planning/navlog persistence (Supabase) | ✅ Aug 4 | Sprint 2 |
| MOB-122 | Live-track background location | ✅ Aug 4 | Sprint 2 |
| MOB-123 | ErrorBoundary theme tokens | ✅ Aug 4 | Sprint 2 |
| MOB-124 | Hidden tabs tabBarStyle display:none | ✅ Aug 4 | Sprint 2 |
| MOB-125 | CAAP PDF fillable form working | ✅ Aug 3 | Sprint 1 |
| MOB-126 | Pro features removed (free for all) | ✅ Aug 3 | Sprint 1 |

---

# 🖥️ ADMIN DASHBOARD — Backlog

| ID | Title | Status | Priority | Labels |
|----|-------|--------|----------|--------|
| ADM-001 | User management CRUD (list, search, suspend) | To Do | 🔴 Critical | Feature, Users |
| ADM-002 | Form submissions viewer (all users) | To Do | 🔴 Critical | Feature, Forms |
| ADM-003 | Analytics dashboard (signups, active users, forms/day) | To Do | 🟠 High | Feature, Analytics |
| ADM-004 | Push notification broadcast (send to all / segments) | To Do | 🟠 High | Feature, Notifications |
| ADM-005 | Template editor (create/edit form templates) | To Do | 🟠 High | Feature, Forms |
| ADM-006 | AIP document upload manager | To Do | 🟡 Medium | Feature, AIP |
| ADM-007 | Audit log viewer (who did what, when) | To Do | 🟡 Medium | Feature, Security |
| ADM-008 | Subscription/billing management | To Do | 🟡 Medium | Feature, Billing |
| ADM-009 | Chat moderation tools (delete/pin/ban) | To Do | 🟢 Low | Feature, Chat |
| ADM-010 | Organization management (teams, invites) | To Do | 🟢 Low | Feature, Teams |
| ADM-011 | Role-based access control (admin/manager/viewer) | To Do | 🟡 Medium | Security |
| ADM-012 | Export reports (CSV/PDF) | To Do | 🟢 Low | Feature, Export |

---

# 🌐 LANDING PAGE — Backlog

| ID | Title | Status | Priority | Labels |
|----|-------|--------|----------|--------|
| WEB-001 | Hero section with app screenshots + CTA | To Do | 🔴 Critical | Design, Landing |
| WEB-002 | Features section (6 key features with icons) | To Do | 🔴 Critical | Design, Landing |
| WEB-003 | Pricing section (Free / Pro / Team) | To Do | 🟠 High | Design, Landing |
| WEB-004 | Testimonials / Social proof section | To Do | 🟠 High | Design, Landing |
| WEB-005 | Download CTA + App Store / Play Store badges | To Do | 🟠 High | Design, Landing |
| WEB-006 | FAQ accordion section | To Do | 🟡 Medium | Design, Landing |
| WEB-007 | Contact form (email to support) | To Do | 🟡 Medium | Feature, Landing |
| WEB-008 | Mobile responsive design | To Do | 🔴 Critical | Design, Landing |
| WEB-009 | SEO meta tags + Open Graph | To Do | 🟡 Medium | SEO, Landing |
| WEB-010 | Cookie consent banner (GDPR) | To Do | 🟢 Low | Legal, Landing |
| WEB-011 | Blog section (aviation tips, app updates) | To Do | 🟢 Low | Content, Landing |
| WEB-012 | Privacy Policy page | To Do | 🟡 Medium | Legal |
| WEB-013 | Terms of Service page | To Do | 🟡 Medium | Legal |
| WEB-014 | Performance optimization (Lighthouse 90+) | To Do | 🟡 Medium | Performance |

---

# 🏷️ Labels

| Label | Color | Description |
|-------|-------|-------------|
| Bug | 🔴 Red | Something is broken |
| Feature | 🔵 Blue | New functionality |
| UX | 🟣 Purple | User experience improvement |
| Performance | 🟡 Yellow | Speed / memory optimization |
| Security | 🟠 Orange | Security hardening |
| Design | 🩷 Pink | Visual / UI design |
| SEO | 🟢 Green | Search engine optimization |
| Android | 🤖 Gray | Android-specific |
| iOS | 🍎 Gray | iOS-specific |
| Chat | 💬 Blue | Chat feature area |
| Forms | 📄 Blue | Forms/PDF feature area |
| Export | 📤 Teal | Data export feature |
| Legal | ⚖️ Gray | Legal/compliance |
| i18n | 🌐 Blue | Internationalization |

---

# 📅 Sprint Plan

| Sprint | Dates | Focus | Goal |
|--------|-------|-------|------|
| Sprint 1 | Jul 28 – Aug 3 | Core features + PDF | ✅ MVP functional |
| Sprint 2 | Aug 4 – Aug 10 | Polish + Security | ✅ Production-ready codebase |
| Sprint 3 | Aug 11 – Aug 17 | Real device stability + notifications | Crash-free on real hardware |
| Sprint 4 | Aug 18 – Aug 24 | Chat enhancements + exports | Rich chat experience |
| Sprint 5 | Aug 25 – Aug 31 | Advanced tools (W&B save, GPX) | Power user features |
| Sprint 6 | Sep 1 – Sep 7 | Landing page + dark mode | Public launch ready |
| Sprint 7 | Sep 8 – Sep 14 | iOS build + App Store submission | Multi-platform |

---

# 🐛 Bug Report Template

```
## Bug Report

**Title:** [Short description]
**Severity:** Critical / High / Medium / Low
**Platform:** Android / iOS / Web
**Device:** [Model, OS version]
**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Behavior:** 

**Actual Behavior:** 

**Screenshots/Logs:** 

**Possible Fix:** 
```

---

# ✨ Feature Request Template

```
## Feature Request

**Title:** [Short description]
**Product:** Mobile / Admin / Website
**Priority:** P0 / P1 / P2 / P3
**User Story:** As a [role], I want to [action] so that [benefit]

**Acceptance Criteria:**
- [ ] 
- [ ] 
- [ ] 

**Design Notes:** 

**Technical Notes:** 

**Dependencies:** 
```

---

# 📊 Status Definitions

| Status | Meaning |
|--------|---------|
| To Do | Not started, in backlog |
| In Progress | Actively being worked on |
| In Review | Code complete, needs review |
| Testing | Being tested on device |
| Done | Shipped and verified |
| Blocked | Can't proceed (dependency/issue) |

---

# 🔗 Quick Links

| Resource | URL |
|----------|-----|
| Supabase Dashboard | https://supabase.com/dashboard/project/tajflaaiezwlbkgyfnkh |
| GitHub Repo | [Your GitHub URL] |
| APK Download (Latest) | `/apk/fpl4flight-release.apk` |
| Figma Design | [Your Figma URL] |
| Play Store (future) | [Pending] |

---

*Template created: August 4, 2026*
*Last updated: August 4, 2026*

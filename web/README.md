# PenguLearn / ZeroShift — Modern Adaptive Learning Frontend

A modern, responsive, pixel-infused adaptive-learning web application built with **React**, **Vite**, **Tailwind CSS**, and **Lucide Icons**, centered around the beloved **Pengu** pixel mascot companion.

---

## 🌟 Visual Theme & Design System

- **Pixel Aesthetic**: Custom pixel headings and badges (`Pixelify Sans` & `Press Start 2P`), retro offset box shadows (`shadow-pixel`), discrete progress indicators, and pixel badges.
- **Readable Educational Body**: `Plus Jakarta Sans` for educational readability.
- **Color Palette**:
  - Background: `#F7F9FC`
  - Primary Surface: `#FFFFFF`
  - Primary Text: `#202938` | Secondary Text: `#667085`
  - Primary Blue: `#2563EB` | Soft Blue: `#EFF6FF`
  - Learning Green: `#22C55E` | Soft Green: `#ECFDF3`
  - Warning Yellow: `#F59E0B` | Soft Yellow: `#FFFBEB`
  - Error Red: `#EF4444` | Soft Red: `#FEF2F2`
  - Border: `#E5E7EB` & `#1E293B`
- **Mascot Companion**: Official pixel-art Pengu assets integrated across the experience:
  - `pengu-wave.png`: Welcoming hero, login, greetings
  - `pengu-teacher.png`: Syllabus guides, concept tutoring
  - `pengu-point.png`: Active prompts, question checkpoint, registration
  - `pengu-goal.png`: Milestones, test completion, streak goals
  - `pengu-peek.png`: Sidebar logo, navbar badges

---

## 🚀 Key User Flows & Routing

| Route | View | Description |
|---|---|---|
| `/register` | Registration Form | On success, **redirects directly to `/question`** (diagnostic onboarding). |
| `/login` | Login Form | On success, **redirects directly to `/dashboard`** (never shows question page). |
| `/question` | Onboarding Diagnostic | First-question experience for new learners with immediate adaptive BKT diagnosis. |
| `/dashboard` | Dashboard | Hero with customizable `PenguQuote`, Daily Login Calendar, Learning Progress, and spacious Learning Space. |
| `/syllabus` | Curriculum & Media | Infinite moving YouTube strip (pauses on hover) + two-column Reading Materials & External Websites. |
| `/mcqs` | MCQ Hub | Exactly two sections: **Attempted** & **Completed** test cards. |
| `/mcqs/test/:testId` | Dedicated Test Page | Opened in the **same tab** with countdown timer, question view, 1..N palette, modal confirmation, and score summary. |
| `/vscode-docs` | Coming Soon | Visible in sidebar, disabled with "Soon" badge. |
| `/profile` | Coming Soon | Visible in sidebar, disabled with "Soon" badge. |

---

## 🛠️ How to Run

From the `web/` folder:

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

To build for production:

```bash
npm run build
npm run preview
```

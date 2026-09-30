<p align="right">
  <strong>English</strong> | <a href="README.th.md">ไทย</a>
</p>

<div align="center">
  <img src="public/sharelogo.png" alt="SHARE-ED logo" width="140" />

  # SHARE-ED

  **A knowledge-sharing platform for learners at every level**

  [![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](package.json)
  [![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](package.json)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](package.json)
  [![Zustand](https://img.shields.io/badge/State-Zustand-433E38)](src/store)
</div>

SHARE-ED is a learning community web application for publishing, discovering, and exchanging educational resources. Users can create posts with images or PDF files, follow creators, interact with content, and unlock achievements in one platform.

## Table of Contents

- [Project Preview](#project-preview)
- [What Can SHARE-ED Do?](#what-can-share-ed-do)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Contributors](#contributors)
- [Commit Distribution](#commit-distribution)
- [License](#license)

## Project Preview

### Home Page

<p align="center">
  <img src="public/screenshots/home-page.png" alt="SHARE-ED home page" width="100%" />
</p>

### Login Page

<p align="center">
  <img src="public/screenshots/login-page.png" alt="SHARE-ED login page" width="100%" />
</p>

### Responsive Preview

<table>
  <tr>
    <th width="50%">Home — Mobile</th>
    <th width="50%">Login — Mobile</th>
  </tr>
  <tr>
    <td align="center">
      <img src="public/screenshots/home-mobile-fixed.png" alt="SHARE-ED home page on mobile" width="100%" />
    </td>
    <td align="center">
      <img src="public/screenshots/login-mobile.png" alt="SHARE-ED login page on mobile" width="100%" />
    </td>
  </tr>
</table>

## What Can SHARE-ED Do?

### Accounts and Profiles

- Register, sign in, verify email addresses, and reset passwords with Supabase Auth
- Edit personal information, profile pictures, background themes, and profile frames
- Add external-link widgets to user profiles
- Follow other users and view follower lists

### Content

- Create, edit, publish, and save posts as drafts
- Write content with a rich-text editor
- Attach cover images, additional images, and PDF files
- Search and filter posts by education level, category, and tag
- Browse recent posts on Home and popular posts on Trending

### Social and Realtime

- Like, bookmark, and comment on posts
- Report inappropriate content
- Receive realtime notifications through Socket.IO
- Track achievements, claim rewards, and equip profile frames

### Administration

- Manage user accounts and access roles
- Review reports and suspend, restore, or remove posts
- Manage achievements, milestones, and rewards

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) `^20.19.0` or `>=22.12.0`
- npm
- A running SHARE-ED Backend API
- A Supabase project for authentication

### 1. Install Dependencies

```bash
git clone https://github.com/siwakornkleebmekdev/share_ed_frontend.git
cd share_ed_frontend
npm install
```

### 2. Configure Environment Variables

Create `.env.local` inside `share_ed_frontend`:

```dotenv
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
VITE_DIRECT_UPLOAD_ENABLED=true
```

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Base URL of the Backend REST API |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Public anonymous key for Supabase |
| `VITE_DIRECT_UPLOAD_ENABLED` | Enables direct uploads to the configured storage provider |

### 3. Start the Development Server

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

### Common Commands

| Command | Description |
|---|---|
| `npm run dev` | Starts the Vite development server |
| `npm run build` | Creates a production build in `dist/` |
| `npm run lint` | Checks the codebase with Oxlint |
| `npm run preview` | Serves the production build locally |

### Run with Docker

Copy the example environment file and configure the project before building:

```bash
cp .env.example .env
docker compose up --build -d
```

On PowerShell, use `Copy-Item .env.example .env` instead of `cp`.

Open `http://localhost:5173`. Stop the container with:

```bash
docker compose down
```

If port `5173` is already in use, set `FRONTEND_PORT` to another port in `.env`.

## Project Structure

```text
share_ed_frontend/
├── public/                       # Static assets and branding
├── src/
│   ├── assets/                   # Images and UI media
│   ├── components/               # Reusable UI components
│   │   ├── admin/                # Administration components
│   │   ├── posts/                # Editor and upload workspace
│   │   ├── profile/              # Profile components
│   │   └── settings/             # Settings components
│   ├── constants/                # Application constants
│   ├── hooks/                    # Custom React hooks
│   ├── layouts/                  # Main, Settings, and Admin layouts
│   ├── pages/                    # Route-level pages
│   │   ├── admin/                # Administration pages
│   │   └── settings/             # User settings pages
│   ├── services/                 # API service layer
│   ├── store/                    # Zustand stores
│   ├── utils/                    # API, Socket, Storage, and helpers
│   ├── App.jsx                   # Routes and route guards
│   ├── App.css                   # Application-level styles
│   ├── index.css                 # Global styles
│   └── main.jsx                  # Application entry point
├── tests/                        # Frontend tests
├── index.html                    # HTML entry point
├── package.json                  # Scripts and dependencies
├── tailwind.config.js            # Tailwind configuration
├── vercel.json                   # Vercel deployment configuration
└── vite.config.js                # Vite configuration
```

## Tech Stack

<p align="center">
  <img
    src="https://skillicons.dev/icons?i=html,css,js,react,vite,tailwind,docker,git,github,githubactions,vscode,vercel,npm&amp;theme=light&amp;perline=7"
    alt="HTML, CSS, JavaScript, React, Vite, Tailwind CSS, Docker, Git, GitHub, GitHub Actions, Visual Studio Code, Vercel and npm"
  />
</p>

| Category | Technology |
|---|---|
| Core | React 19, React DOM 19, Vite 8 |
| Routing | React Router 8 |
| Styling | Tailwind CSS 4, PostCSS, Autoprefixer |
| Icons | Lucide React, React Icons |
| State Management | Zustand 5 |
| API | Axios, Supabase JavaScript SDK |
| Realtime | Socket.IO Client |
| Editor | React Quill New |
| Notifications | React Hot Toast, SweetAlert2 |
| Code Quality | Oxlint |
| Deployment | Vercel and Docker Compose configuration |

## Contributors

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/siwakornkleebmekdev">
        <img src="https://github.com/siwakornkleebmekdev.png?size=100" width="90" alt="siwakornkleebmekdev" /><br />
        <sub><b>siwakornkleebmekdev</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/kasuya21">
        <img src="https://github.com/kasuya21.png?size=100" width="90" alt="kasuya21" /><br />
        <sub><b>kasuya21</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/Kittipong001">
        <img src="https://github.com/Kittipong001.png?size=100" width="90" alt="Kittipong001" /><br />
        <sub><b>Kittipong001</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/eyejangg">
        <img src="https://github.com/eyejangg.png?size=100" width="90" alt="eyejangg" /><br />
        <sub><b>eyejangg</b></sub>
      </a>
    </td>
  </tr>
</table>

## Commit Distribution

Statistics from the Frontend Git history as of October 1, 2026. Multiple names and email addresses belonging to the same contributor are grouped together.

| Contributor | Commits | Share |
|---|---:|---:|
| `siwakornkleebmekdev` / Siwakorn | **153** | 53.1% |
| `kasuya21` / Thunva | **76** | 26.4% |
| `Kittipong001` / Kittipong | **36** | 12.5% |
| `eyejangg` | **23** | 8.0% |
| **Total** | **288** | **100%** |

> Commit counts may change after new commits, merges, or rebases.

## License

This repository currently does not specify a license for reusing or redistributing the source code. Please contact the development team before using it outside this project.

<div align="center">
  Made with 💙 by the SHARE-ED team
</div>

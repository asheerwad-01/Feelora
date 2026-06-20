<div align="center">

# Feelora

### A Spatial Music Universe

**Step inside your music. Every song becomes a star in your personal spatial universe.**

<img src="https://i.postimg.cc/8CRH77Ld/feelora2-vercel-app-(5).png" width="800"/>
<img src="https://i.postimg.cc/hGcm3p7h/feelora2-vercel-app-(6).png" width="800"/>
<img src="https://i.postimg.cc/VNKJZ18K/feelora2-vercel-app-(7).png" width="800"/>
<img src="https://i.postimg.cc/RqxhJZ7Q/feelora2-vercel-app-(8).png" width="800"/>

[![Live Demo](https://img.shields.io/badge/demo-feelora2.vercel.app-1ED760?style=for-the-badge&logo=vercel&logoColor=white)](https://feelora2.vercel.app)
[![Built with Spotify API](https://img.shields.io/badge/Powered%20by-Spotify%20Web%20API-1DB954?style=for-the-badge&logo=spotify&logoColor=white)](https://developer.spotify.com/documentation/web-api)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
[![GitHub](https://img.shields.io/badge/GitHub-asheerwad--01-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/asheerwad-01)

</div>

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Vision](#product-vision)
3. [Core Features](#core-features)
4. [Live Demo](#live-demo)
5. [System Architecture](#system-architecture)
6. [Technology Stack](#technology-stack)
7. [Spotify Integration](#spotify-integration)
8. [Getting Started](#getting-started)
9. [Environment Configuration](#environment-configuration)
10. [Project Structure](#project-structure)
11. [Performance & Optimization](#performance--optimization)
12. [Security & Privacy](#security--privacy)
13. [Accessibility](#accessibility)
14. [Roadmap](#roadmap)
15. [Contributing](#contributing)
16. [License](#license)
17. [Acknowledgments](#acknowledgments)
18. [Maintainer](#maintainer)
19. [Contact](#contact)

---

## Executive Summary

**Feelora** is a spatial computing experience for music discovery and personal listening history. Rather than presenting a user's library as a flat, scrollable list, Feelora renders each track as a navigable point of light within an explorable 3D universe — transforming passive browsing into active, spatial exploration.

The product connects directly to a listener's **Spotify** account, ingests their library and listening data, and procedurally generates a personalized, immersive environment using real-time **WebGL** rendering. The result is a music interface that treats a user's taste not as a list, but as a place.

Feelora is built as a lightweight, browser-native web application — no installs, no plugins — deployed on modern serverless infrastructure for global low-latency access.

> **At a glance**
> | | |
> |---|---|
> | **Category** | Music Discovery / Spatial Computing / Data Visualization |
> | **Primary Integration** | Spotify Web API |
> | **Rendering** | Real-time 3D via WebGL |
> | **Deployment** | Vercel (Edge Network) |
> | **Platform** | Web (desktop & mobile browsers) |
> | **Live URL** | [feelora2.vercel.app](https://feelora2.vercel.app) |

---

## Product Vision

Streaming platforms have solved access to music at scale, but the *interfaces* used to navigate personal libraries remain largely unchanged: rows, grids, and scrollable lists. Feelora's thesis is that a listener's relationship with their music is inherently spatial and emotional — certain songs feel closer to us, certain eras cluster together, certain moods orbit one another.

Feelora exists to explore an alternative interaction model:

- **From lists to landscapes** — music collections are spatialized rather than enumerated
- **From scrolling to navigating** — users move *through* their music rather than past it
- **From metadata to meaning** — visual proximity, scale, and motion are used to encode relationships between tracks, artists, and listening patterns

This is positioned as a companion experience to Spotify, layered on top of the official Web API, designed to deepen engagement with an existing library rather than replace core playback functionality.

---

## Core Features

### 🌌 Spatial Music Universe
Every track in a connected user's library is rendered as a star within a procedurally generated 3D space. Users fly, pan, and zoom through their own collection as a navigable environment rather than a static list.

### 🔗 Native Spotify Connection
Secure OAuth-based authentication connects directly to a user's Spotify account, pulling library, playlist, and listening data to populate their universe in real time.

### 🎨 Real-Time WebGL Rendering
A fully hardware-accelerated 3D rendering pipeline delivers smooth, responsive visuals directly in the browser, with no downloads or native installs required.

### 🌑 Cinematic, Distraction-Free Interface
A deliberately minimal, dark-themed UI (`#000000` base) keeps visual focus on the music universe itself, reducing interface chrome in favor of immersion.

### ⚡ Instant, Zero-Install Access
Delivered as a progressive web experience and deployed on Vercel's edge network for fast load times and global availability, directly from a browser.

### 📱 Cross-Device Experience
Designed to be responsive across desktop and mobile viewports, preserving the spatial metaphor regardless of screen size or input method (mouse, trackpad, or touch).

---

## Live Demo

Experience Feelora directly — no installation required:

**➡️ [https://feelora2.vercel.app](https://feelora2.vercel.app)**

To get the full experience, sign in with a Spotify account when prompted to populate your personal universe with your own library and listening data.

---

## System Architecture

Feelora follows a modern, serverless, edge-first architecture optimized for fast global delivery and minimal operational overhead.

```
┌──────────────────────────────────────────────────────────────────┐
│                            Client (Browser)                       │
│                                                                    │
│   ┌────────────────────┐        ┌────────────────────────────┐   │
│   │   UI / Application  │        │   WebGL Rendering Engine    │   │
│   │   Layer (React/Next)│◄──────►│   (3D Universe / Scene Graph)│   │
│   └─────────┬───────────┘        └────────────────────────────┘   │
│             │                                                      │
└─────────────┼──────────────────────────────────────────────────────┘
              │  HTTPS / OAuth 2.0
              ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Application Server (Edge/Serverless)           │
│                                                                    │
│   ┌────────────────────┐        ┌────────────────────────────┐   │
│   │  Auth & Session      │        │   API Layer                 │   │
│   │  Management          │        │   (data fetch, transform,   │   │
│   │  (Spotify OAuth 2.0) │        │    caching)                 │   │
│   └─────────┬────────────┘        └─────────────┬──────────────┘   │
│             │                                     │                 │
└─────────────┼─────────────────────────────────────┼─────────────────┘
              │                                     │
              ▼                                     ▼
   ┌─────────────────────┐                ┌──────────────────────┐
   │   Spotify Accounts    │                │   Spotify Web API     │
   │   Service (OAuth)     │                │   (library, playlists,│
   │                        │                │    listening data)    │
   └─────────────────────┘                └──────────────────────┘
```

**Design principles:**

- **Stateless by default** — session and token state are managed server-side with minimal persistent storage, reducing attack surface and operational complexity
- **Edge-deployed** — served via Vercel's global edge network to minimize latency regardless of user location
- **API-first** — all music data is sourced live from Spotify's Web API rather than mirrored or cached long-term, ensuring data freshness and respecting platform terms of use

---

## Technology Stack

> The following reflects the technology profile inferred from the production deployment. Maintainers should update this table to precisely match the implementation.

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js (React) | Application framework, routing, server-side rendering |
| **3D Rendering** | WebGL (Three.js / React Three Fiber) | Real-time spatial rendering of the music universe |
| **Styling** | CSS-in-JS / Tailwind CSS | UI styling and theming |
| **Authentication** | OAuth 2.0 (Spotify Accounts Service) | Secure user authentication and authorization |
| **Data Source** | Spotify Web API | Library, playlist, and listening history retrieval |
| **Hosting / Deployment** | Vercel | Edge-based hosting, CI/CD, preview deployments |
| **Language** | TypeScript / JavaScript | Application logic |
| **Package Management** | npm / yarn / pnpm | Dependency management |

---

## Spotify Integration

Feelora integrates with Spotify exclusively through the official, publicly documented **Spotify Web API** and **Spotify Accounts Service**, in line with Spotify's Developer Terms of Service.

**Integration overview:**

1. **Authentication** — Users authenticate via Spotify's OAuth 2.0 Authorization Code flow. Feelora never handles or stores raw Spotify credentials.
2. **Scopes requested** — Limited to the minimum required to read library, playlist, and listening data necessary to render the user's universe (e.g. `user-library-read`, `playlist-read-private`, `user-read-recently-played`).
3. **Data usage** — Retrieved data is used solely to render the user's personal session and is not sold, shared with third parties, or used for purposes beyond the product experience.
4. **Token handling** — Access and refresh tokens are managed securely server-side, with short-lived access tokens and standard refresh flows.

> **Note for reviewers:** This project is an independent application built on top of Spotify's public developer platform and is not affiliated with, maintained by, or endorsed by Spotify AB.

---

## Getting Started

### Prerequisites

Ensure the following are available in your development environment:

- **Node.js** v18 or later
- **npm**, **yarn**, or **pnpm**
- A registered application on the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) with valid Client ID and Client Secret

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/feelora.git
cd feelora

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
```

### Running Locally

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Building for Production

```bash
npm run build
npm run start
```

### Deploying

Feelora is designed for one-command deployment to Vercel:

```bash
vercel deploy --prod
```

---

## Environment Configuration

Create a `.env.local` file at the project root with the following variables:

```env
# Spotify Developer credentials
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# OAuth redirect target (must match Spotify Dashboard settings)
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/callback

# Session / token signing secret
NEXTAUTH_SECRET=your_random_secret_string

# Public base URL of the deployment
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

> Never commit `.env.local` or any file containing real credentials to version control.

---

## Project Structure

```
feelora/
├── app/                    # Application routes and pages
│   ├── api/                # Server-side API routes (auth, data fetching)
│   └── (universe)/         # Core spatial universe experience
├── components/             # Reusable UI components
├── lib/                    # Spotify client, auth helpers, utilities
├── scene/                  # WebGL / 3D scene construction and rendering logic
├── public/                 # Static assets
├── styles/                 # Global and component styles
├── .env.example             # Example environment configuration
├── next.config.js          # Next.js configuration
└── package.json
```

---

## Performance & Optimization

- **Edge delivery** via Vercel's global CDN minimizes time-to-first-byte for users worldwide
- **Code-splitting and lazy loading** of 3D assets to reduce initial bundle size
- **GPU-accelerated rendering** through WebGL to maintain smooth frame rates across desktop and mobile devices
- **Caching strategy** for non-sensitive, infrequently changing Spotify data to reduce redundant API calls and respect Spotify's rate limits

---

## Security & Privacy

- All authentication is handled via Spotify's official OAuth 2.0 flow — Feelora never sees or stores user passwords
- Tokens are stored securely and scoped to the minimum permissions required
- All network traffic is served over HTTPS
- No user listening data is sold or shared with third parties
- Users may revoke Feelora's access at any time via their [Spotify account permissions](https://www.spotify.com/account/apps/)

---

## Accessibility

Feelora aims to support:

- Keyboard-navigable controls for core interactions
- Sufficient color contrast within its dark UI theme
- Reduced-motion considerations for users sensitive to 3D motion environments

Accessibility is an ongoing area of investment; feedback and contributions in this area are especially welcome.

---

## Roadmap

| Status | Milestone |
|---|---|
| ✅ | Core spatial universe rendering |
| ✅ | Spotify OAuth integration |
| 🔄 | Playlist-level spatial clustering |
| 🔄 | Collaborative / shared universes |
| 🔲 | Mobile-native (iOS/Android) companion app |
| 🔲 | Audio-reactive visual effects during playback |
| 🔲 | Social sharing of personal universes |

---

## Contributing

Contributions are welcome and appreciated. To propose a change:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes with clear, descriptive messages
4. Open a pull request describing the change and its motivation

Please open an issue first for significant changes to discuss scope and approach before investing development time.

---

## License

This project is licensed under the **MIT License**. See the [`LICENSE`](LICENSE) file for full terms.

---

## Acknowledgments

- [Spotify Web API](https://developer.spotify.com/documentation/web-api) for music and listening data
- The WebGL and open-source 3D graphics community
- [Vercel](https://vercel.com) for hosting and edge deployment infrastructure

---

## Maintainer

<div align="center">

[![GitHub](https://img.shields.io/badge/GitHub-asheerwad--01-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/asheerwad-01)

</div>

This project is designed, developed, and maintained by **[@asheerwad-01](https://github.com/asheerwad-01)**.

## Contact

For questions, partnership inquiries, bug reports, or press, please reach out via:

- **GitHub Profile:** [github.com/asheerwad-01](https://github.com/asheerwad-01)
- **Instagram Profile:** [instagram.com/_asheerwad_](https://www.instagram.com/_asheerwad_)

<div align="center">

**Feelora** — *Your music, as a place you can explore.*

Built by [Asheerwad](https://github.com/asheerwad-01)

</div>

<p align="center">
  <img src="https://lyricsync.app/icons/logo-72.webp" alt="LyricSync Logo" width="72" />
</p>

# LyricSync

[![Build Status](https://img.shields.io/github/actions/workflow/status/WasanYang/LyricSync/main.yml?branch=master)](https://github.com/WasanYang/LyricSync/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-blue)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-cloud-orange)](https://firebase.google.com/)

A modern, multi-locale worship lyrics and setlist app for worship teams, musicians, and congregations. Built with Next.js, Firebase, and advanced UI/UX features.

---

## 📑 Table of Contents

- [Demo](#demo)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Environment Setup](#environment-setup)
- [Configuration](#configuration)
- [Installation](#installation)
- [Usage](#usage)
- [Deployment](#deployment)
- [Testing](#testing)
- [Internationalization (i18n)](#internationalization-i18n)
- [SEO & PWA](#seo--pwa)
- [Contributing](#contributing)
- [FAQ](#faq)
- [License](#license)
- [Acknowledgments](#acknowledgments)
- [Support](#support)

---

## 🚀 Demo

<p align="center">
  <img src="https://lyricsync.app/icons/logo-72.webp" alt="LyricSync Demo" width="120" />
</p>

Live: [lyricsync.app](https://lyricsync.app)

![Screenshot](https://lyricsync.app/icons/logo-1200x630.png)

> Try it now: [lyricsync.app](https://lyricsync.app)

## ✨ Features

- 🌍 Multi-locale support (i18n)
- 🔎 SEO-optimized pages
- ⚙️ Persistent UI settings (font size, highlight mode)
- 🔥 Real-time Firestore sync
- 📝 Setlist creation and sharing
- 🎸 Chord transposition
- ⏩ Auto-scrolling lyrics
- 🌙 Dark mode
- 📱 Mobile-first design

## 🏗️ Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Icons**: Lucide React
- **PWA**: @ducanh2912/next-pwa
- **Database**: IndexedDB (local) + Firebase Firestore (cloud)
- **Authentication**: Firebase Auth

## 🛠️ Environment Setup

- **Node.js**: v18+ recommended
- **Yarn** or **npm**
- **Firebase Project**: Set up in [Firebase Console](https://console.firebase.google.com/)

## ⚙️ Configuration

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 📦 Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/WasanYang/LyricSync.git
   cd LyricSync
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Run the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:9002](http://localhost:9002) in your browser

## 🚀 Deployment

Deploy easily to [Vercel](https://vercel.com/) (recommended) or your preferred hosting:

```bash
npm run build
npm start
```

## 🧑‍💻 Testing

Run unit and integration tests (if available):

```bash
npm test
```

## 🌐 Internationalization (i18n)

- Supports multiple locales (languages)
- Add new locales in `src/locales/`
- URL structure: `/[lang]/...` (e.g., `/en/`, `/th/`)

## 🕸️ SEO & PWA

- SEO metadata via Next.js App Router and custom `seo.ts`
- JSON-LD structured data for rich search results
- Installable PWA with offline support

## 📱 Usage

### For Worship Leaders

- Create setlists by adding songs and organizing them
- Use setlist player for seamless worship flow
- Share setlists with band members
- Transpose songs to match vocalists' keys

### For Musicians

- View lyrics with chords in real-time
- Transpose to preferred keys instantly
- Follow along with auto-scrolling lyrics
- Access songs offline during performances

### For Congregations

- Follow lyrics on personal devices
- Adjust font size for comfortable reading
- Use dark mode in low-light environments

## 🤝 Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to submit pull requests, report issues, or suggest features.

## ❓ FAQ

**Q: Why can't I see my setlists on another device?**
A: Make sure you are signed in with the same account and have internet access for sync.

**Q: How do I add a new language?**
A: Add your locale files to `src/locales/` and update the config.

**Q: Is LyricSync free?**
A: Yes, it's open-source and free for worship teams and congregations.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for worship teams and congregations worldwide
- Inspired by the need for better digital worship tools
- Special thanks to the open-source community

## 📞 Support

For support, questions, or feature requests, please open an issue on [GitHub](https://github.com/WasanYang/LyricSync/issues) or contact the development team.

---

**Made with ❤️ for the worship community**

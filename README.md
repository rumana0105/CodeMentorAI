# CodeMentorAI 🚀

An intelligent, futuristic coding mentorship platform that provides personalized learning experiences, AI-powered assistance, and real-time competitive coding environments. Built with React 19, TypeScript, Tailwind CSS, Framer Motion, and Firebase.

## 🌟 The Cyberpunk Overhaul (v2.0)

CodeMentorAI has recently undergone a massive architectural and UI overhaul to deliver a premium, esports-inspired SaaS experience featuring glassmorphism, neon gradients, and real-time telemetry.

### 🎯 Core Learning & Analytics
- **Adaptive Problem Sets**: 100+ coding problems across multiple difficulty levels.
- **AI-Powered Mentor**: Contextual hints and full code reviews powered by Google Gemini AI.
- **Behavioral Telemetry**: Tracks AI dependency vs. original thinking.
- **Premium PDF Generation**: Data-rich performance reports generated via Puppeteer and Chart.js, featuring AI-driven insights and topic-wise mastery graphs.

### 🏆 Competitive Programming (Battleground)
- **Global Multiplayer Arena**: Real-time coding duels inspired by LeetCode and Codeforces.
- **Live Matchmaking (Quick Match)**: Automatically finds waiting opponents or creates a public lobby.
- **Elo Ranking System**: Tracks Win/Loss ratios and updates your global standing.
- **Cyberpunk UI**: Neon glowing borders, holographic animated backgrounds, and dynamic matchmaking cards.

### 🏟️ Live Tournaments (Contests)
- **Real-Time Leaderboards**: Live participant tracking and dynamic rank movement based on time penalties and successful submissions.
- **Neon Timers**: Glowing, precision countdown timers tracking the exact seconds until the next "Uplink Window".
- **Contest History**: View upcoming, live, and archived tournaments.

### 👥 Global Developer Network (Community)
- **Discord/Reddit Hybrid Forum**: Interactive discussion boards for General, Problems, Career, and Showcase topics.
- **AI Moderator**: Integrated AI bot that synthesizes trending discussion topics for the community.
- **Realistic Seeding**: Fully populated with authentic developer threads, upvotes, and nested replies.

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Google Gemini API Key**
- **Firebase Project** (for authentication, real-time database, and hosting)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rumana0105/CodeMentorAI.git
   cd CodeMentorAI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   Create a `.env` file in the root directory:
   ```env
   # Gemini AI Configuration
   GEMINI_API_KEY=your_gemini_api_key_here
   
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Run the application**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000` (or the port specified by Vite).

## 🔧 Architecture & Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Framer Motion (motion/react)
- **Backend / PDF**: Express.js server (`server.ts`) with Puppeteer integration for generating PDF reports.
- **AI Integration**: Google Gemini (`@google/genai`)
- **State Management**: Zustand feature stores (e.g., `useBattleStore`)
- **Database & Auth**: Firebase Firestore (Real-time `onSnapshot` listeners) & Firebase Authentication
- **Code Editor**: Monaco Editor (`@monaco-editor/react`)
- **Charts**: Chart.js (Server-side rendering) & Recharts (Client-side)

## 📁 Project Structure

```text
CodeMentorAI/
├── src/
│   ├── components/          # React UI components (Battleground, Forum, ContestView, etc.)
│   ├── services/            # Firebase, Gemini, and Data Seeding logic
│   ├── stores/              # Zustand state management
│   ├── types.ts             # Global TypeScript interfaces
│   ├── constants.ts         # Mock data and static configuration
│   └── main.tsx             # Application entry point
├── server.ts                # Express backend for Code Execution & PDF Generation
├── firestore.rules          # Security rules for database access
├── package.json             # Project dependencies
└── README.md                
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/cyberpunk-update`)
3. Commit your changes (`git commit -m 'Add new neon animations'`)
4. Push to the branch (`git push origin feature/cyberpunk-update`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


# CodeMentorAI 🚀

An intelligent coding mentorship platform that provides personalized learning experiences, AI-powered assistance, and collaborative coding environments. Built with React, TypeScript, and Firebase.

## 🌟 Features

### 🎯 Core Learning Features
- **Adaptive Problem Sets**: 100+ coding problems across multiple difficulty levels
- **AI-Powered Hints**: Contextual hints powered by Google Gemini AI
- **Code Review System**: Automated code analysis and feedback
- **Real-time Collaboration**: Pair programming with live code synchronization
- **Interview Mode**: Simulated coding interviews with time constraints
- **Progress Tracking**: Detailed analytics and learning metrics

### 🛠️ Technical Features
- **Multi-language Support**: Python, JavaScript, TypeScript, C++, Java, Ruby, C
- **Live Code Editor**: Monaco editor with syntax highlighting
- **Execution Engine**: Run and test code in real-time
- **Debug Mode**: Step-by-step code debugging assistance
- **Version History**: Track code changes and restore snapshots
- **GitHub Integration**: Sync solutions to GitHub repositories

### 🏆 Competitive Programming
- **Battleground Mode**: Real-time coding battles
- **Contest Platform**: Host and participate in coding contests
- **Leaderboard System**: Global and friend leaderboards
- **Problem Categories**: Algorithms, Data Structures, System Design

### 👥 Community & Collaboration
- **Forum**: Discuss problems and share solutions
- **Chat Assistant**: AI-powered coding companion
- **Collaboration Rooms**: Real-time pair programming sessions
- **Profile System**: Track achievements and showcase skills

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Google Gemini API Key**
- **Firebase Project** (for authentication and database)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/CodeMentorAI.git
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
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

4. **Firebase Setup**
   
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password, Google Sign-In)
   - Set up Firestore Database
   - Configure Security Rules (use the provided `firestore.rules`)
   - Download service account key and place it in the project root

5. **Run the application**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

## 📁 Project Structure

```
CodeMentorAI/
├── src/
│   ├── components/          # React components
│   │   ├── AuthProvider.tsx    # Authentication context
│   │   ├── Layout.tsx         # Main layout component
│   │   ├── Dashboard.tsx      # User dashboard
│   │   ├── ProblemView.tsx     # Problem solving interface
│   │   ├── CodeEditor.tsx      # Code editor component
│   │   ├── Forum.tsx          # Discussion forum
│   │   └── ...                # Other UI components
│   ├── services/             # Backend services
│   │   ├── firebase.ts        # Firebase configuration
│   │   ├── gemini.ts          # AI integration
│   │   ├── db.ts              # Database operations
│   │   └── collabService.ts    # Real-time collaboration
│   ├── types.ts              # TypeScript type definitions
│   ├── constants.ts          # Application constants
│   ├── lib/                  # Utility functions
│   └── main.tsx              # Application entry point
├── public/                   # Static assets
├── firebase.rules           # Firestore security rules
├── package.json             # Dependencies and scripts
└── README.md                # This file
```

## 🔧 Configuration

### Firebase Security Rules

The application uses comprehensive Firestore security rules located in `firestore.rules`. These rules ensure:

- **User Authentication**: Only authenticated users can access data
- **Data Validation**: All writes must match predefined schemas
- **Access Control**: Users can only access their own data
- **Admin Privileges**: Admin users have elevated permissions

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini AI API key | Yes |
| `VITE_FIREBASE_API_KEY` | Firebase API key | Yes |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Yes |

## 🎯 Usage Guide

### For Learners

1. **Sign Up**: Create an account with email or Google
2. **Choose Problems**: Browse problems by difficulty or category
3. **Solve Problems**: Write code in the integrated editor
4. **Get Help**: Use AI hints when stuck
5. **Track Progress**: Monitor your learning journey

### For Interviewers

1. **Create Interview Rooms**: Set up coding interviews
2. **Monitor Candidates**: Track performance in real-time
3. **Review Solutions**: Analyze problem-solving approaches
4. **Provide Feedback**: Give structured evaluations

### For Collaborators

1. **Join Sessions**: Participate in pair programming
2. **Share Code**: Real-time code synchronization
3. **Communicate**: Built-in chat and video features
4. **Learn Together**: Collaborative problem solving

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview       # Preview production build
npm run lint          # Run TypeScript linting
npm run clean         # Clean build files
```

### Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Backend**: Express.js, Firebase
- **AI Integration**: Google Gemini API
- **Real-time**: Socket.io
- **Code Editor**: Monaco Editor
- **Charts**: Recharts
- **Authentication**: Firebase Auth

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow ESLint configuration
- Use Tailwind CSS for styling
- Write meaningful commit messages
- Add tests for new features

## 🔐 Security

- **Authentication**: Firebase Auth with email/password and OAuth
- **Data Validation**: Client and server-side validation
- **API Security**: Rate limiting and input sanitization
- **Secure Storage**: Encrypted data storage in Firestore

## 📊 Analytics & Monitoring

- **User Behavior Tracking**: Learning pattern analysis
- **Performance Metrics**: Code execution statistics
- **Engagement Analytics**: Feature usage tracking
- **Error Monitoring**: Real-time error reporting

## 🚀 Deployment

### Production Build

```bash
npm run build
```

### Environment Setup for Production

1. Set production environment variables
2. Configure Firebase for production
3. Set up domain and SSL
4. Deploy to your preferred hosting platform

### Supported Platforms

- **Vercel**: Recommended for React applications
- **Netlify**: Static site hosting
- **AWS**: Full stack deployment
- **Firebase Hosting**: Simple static hosting

## 🤝 Support

### Getting Help

- **Documentation**: Check this README and inline comments
- **Community**: Join our Discord server
- **Issues**: Report bugs on GitHub Issues
- **Email**: Contact support@codementorai.com

### FAQ

**Q: How do I reset my password?**
A: Use the "Forgot Password" link on the login page.

**Q: Can I use my own API keys?**
A: Yes, configure them in the `.env` file.

**Q: Is the code open source?**
A: Yes, check the license file for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** - For providing the AI capabilities
- **Firebase** - For authentication and database services
- **Monaco Editor** - For the excellent code editor
- **React Community** - For the amazing ecosystem

## 📈 Roadmap

### Upcoming Features

- [ ] Mobile application (React Native)
- [ ] Advanced AI tutoring system
- [ ] Corporate training modules
- [ ] Integration with IDEs (VS Code, IntelliJ)
- [ ] Machine learning-based problem recommendations
- [ ] Voice-controlled coding assistance

### Version History

- **v1.0.0** - Initial release with core features
- **v1.1.0** - Added collaboration features
- **v1.2.0** - Enhanced AI capabilities
- **v1.3.0** - Interview mode and analytics

---

Made with ❤️ by the CodeMentorAI Team

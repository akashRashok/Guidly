# Guidly

> A lightweight, production-ready homework feedback tool that helps students understand **why** their answers are wrong and helps teachers quickly see **where** students are confused.

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

## ✨ Features

### For Teachers
- 🎯 **Simple Assignment Creation** - Create topic-based homework with custom questions or templates
- 📊 **Misconception Visibility** - See which misconceptions are most common with AI-generated teaching recommendations
- 👥 **Student Tracking** - View completion status and identify struggling students
- 🎨 **Modern UI** - Clean sidebar-based interface with activity feed
- 🔍 **Misconception Suggestions** - Get AI-powered suggestions for relevant misconceptions during assignment creation

### For Students
- 🚀 **Low-Friction Access** - No account creation, just enter name and class code
- 💡 **Targeted Feedback** - AI-generated explanations when answers are incorrect
- 🎓 **Learning-Focused** - Contextual follow-up questions tailored to specific misconceptions
- 📱 **Simple Interface** - Clean, distraction-free design focused on learning

### Technical Highlights
- 🤖 **Local AI Processing** - Uses Ollama for privacy-first AI (no external API calls)
- 🔒 **Privacy-First** - All AI processing happens locally, no data sent to external services
- ⚡ **Fast & Reliable** - Deterministic-first approach with AI as intelligent fallback
- 🎯 **Production-Ready** - Fully functional without AI using static fallbacks

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- [Ollama](https://ollama.ai) (optional - for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/akashRashok/guidly.git
   cd guidly
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file:
   ```bash
   # Required
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here
   
   # Optional - AI Configuration
   OLLAMA_API_URL=http://localhost:11434
   OLLAMA_MODEL=mistral
   OLLAMA_ENABLED=true
   
   # Optional - Authentication Providers
   # GOOGLE_CLIENT_ID=your-google-client-id
   # GOOGLE_CLIENT_SECRET=your-google-client-secret
   # EMAIL_SERVER=smtp://user:pass@smtp.example.com:587
   # EMAIL_FROM=noreply@example.com
   ```

   Generate a secure secret:
   ```bash
   openssl rand -base64 32
   ```

4. **Set up the database**
   ```bash
   # Push database schema
   npm run db:push
   
   # Seed predefined misconceptions
   npm run db:seed
   ```

5. **Start Ollama (optional, for AI features)**
   ```bash
   # Install Ollama from https://ollama.ai
   ollama pull mistral
   ollama serve
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🤖 AI Configuration (Ollama)

Guidly uses [Ollama](https://ollama.ai) for local AI inference, providing:

- 🔒 **Privacy** - All AI processing happens locally
- 💰 **No API Costs** - No external API calls required
- 🌐 **Offline Support** - Works without internet connectivity
- 🎛️ **Full Control** - Choose your own model

### Supported Models

Recommended models (pick one):
- `mistral` - Fast, good quality (default, ~4GB)
- `llama3:8b` - Excellent quality, more resources (~4.7GB)
- `qwen2.5:7b` - Good multilingual support (~4.4GB)

### Setup

1. Install Ollama from [ollama.ai](https://ollama.ai/download)
2. Pull a model: `ollama pull mistral`
3. Start Ollama: `ollama serve` (runs in background)
4. Configure in `.env.local`:
   ```bash
   OLLAMA_API_URL=http://localhost:11434
   OLLAMA_MODEL=mistral
   OLLAMA_ENABLED=true
   ```

### Running Without AI

The system functions **fully without AI**. If Ollama is unavailable:
- Static explanations are used for misconception feedback
- Predefined misconception categories are still matched
- Teacher summaries use simple templates

Set `OLLAMA_ENABLED=false` to disable AI entirely.

## 📚 Documentation

- **[Product Overview](PRODUCT.md)** - Complete product philosophy and design principles
- **[Product Specifications](docs/PRODUCT.md)** - Detailed technical and feature documentation
- **[How to Use](docs/HOW_TO_USE.md)** - Comprehensive user guide for teachers and students
- **[Database Schema](docs/DATABASE.md)** - Database structure and relationships

## 🏗️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Database**: SQLite with [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: [NextAuth.js v5](https://next-auth.js.org/)
- **AI**: [Ollama](https://ollama.ai) (local LLM) - mistral, llama3, qwen2.5
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Language**: TypeScript

## 📖 Usage

### For Teachers

1. Sign in at `/login` (in development, any email works)
2. Create a new assignment from the dashboard
3. Select a topic and add questions (manual or from templates)
4. View common misconceptions for the selected topic
5. Share the generated link and class code with students
6. View results and misconceptions after students complete the assignment

### For Students

1. Open the homework link from your teacher
2. Enter your name and the class code
3. Answer questions one by one
4. If incorrect, read the AI-generated explanation and answer the follow-up question
5. Complete all questions to finish

## 🎯 Design Principles

Guidly succeeds by doing less and doing it well:

- ✅ **Focused on learning clarity** - Not grading efficiency
- ✅ **Conservative AI usage** - Falls back to static explanations when uncertain
- ✅ **No student accounts** - Low friction for students
- ✅ **Data isolation** - Student data exists only within single assignments
- ✅ **Minimal UI** - No dashboards, charts, or analytics
- ✅ **AI as fallback** - System works fully without AI
- ✅ **Privacy-first** - Local AI processing, no external dependencies

See [PRODUCT.md](PRODUCT.md) for complete design philosophy and constraints.

## 📁 Project Structure

```
guidly/
├── app/
│   ├── api/            # API routes (server-side only)
│   ├── assignments/    # Teacher assignment pages
│   ├── dashboard/      # Teacher dashboard
│   ├── homework/       # Student homework flow
│   └── login/          # Authentication pages
├── components/
│   └── layouts/        # Shared layout components (Sidebar, Header, etc.)
├── lib/
│   ├── db/             # Database schema and connection
│   ├── ai.ts           # AI integration (backward compatibility)
│   ├── llmService.ts   # Ollama LLM service module
│   ├── auth.ts         # NextAuth configuration
│   ├── misconceptions.ts  # Predefined misconceptions
│   └── utils.ts        # Utility functions
├── docs/               # Documentation
│   ├── PRODUCT.md      # Product specifications
│   ├── HOW_TO_USE.md   # User guide
│   └── DATABASE.md     # Database documentation
└── PRODUCT.md          # Product overview
```

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push schema to database
- `npm run db:seed` - Seed misconceptions
- `npm run db:studio` - Open Drizzle Studio (database GUI)

### Development Notes

- In development mode, authentication uses a simplified credentials provider (any email works, no password)
- The system is fully functional without Ollama - AI is optional
- First AI request may take 30+ seconds (model loading), subsequent requests are fast (~100ms)

## 🚢 Production Deployment

### Requirements

- Node.js 18+
- SQLite database file (or migrate to PostgreSQL for scale)
- Environment variables configured
- Persistent storage for database file
- Ollama running on accessible server (optional)

### Build

```bash
npm run build
npm start
```

### Environment Variables

Required:
- `NEXTAUTH_URL` - Your production URL
- `NEXTAUTH_SECRET` - Strong secret (use `openssl rand -base64 32`)

Optional:
- `OLLAMA_API_URL` - Ollama server URL (default: http://localhost:11434)
- `OLLAMA_MODEL` - Model to use (default: mistral)
- `OLLAMA_ENABLED` - Enable/disable AI (default: true)
- `EMAIL_SERVER` - For magic link authentication
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - For Google OAuth

## 🐛 Troubleshooting

### Common Issues

**Database locked error:**
- Ensure only one instance of the app is running
- SQLite doesn't support concurrent writes

**Authentication not working:**
- Check `NEXTAUTH_SECRET` is set
- Verify `NEXTAUTH_URL` matches your domain
- Check browser console for errors

**AI explanations not working:**
- Verify Ollama is running: `ollama serve`
- Check the model is pulled: `ollama list`
- Verify `OLLAMA_API_URL` is correct
- The system will use static fallbacks automatically

**Students can't access homework:**
- Verify assignment isn't closed
- Check link and class code are correct
- Ensure assignment exists in database

See [docs/HOW_TO_USE.md](docs/HOW_TO_USE.md) for more troubleshooting tips.

## 🤝 Contributing

Contributions are welcome! This is a focused MVP, so contributions should align with the product philosophy:

- ✅ Improve learning clarity
- ✅ Don't add unnecessary complexity
- ✅ Maintain the minimal, focused design
- ✅ Follow existing code style and patterns

### Contribution Guidelines

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your PR:
- Aligns with the product philosophy (see [PRODUCT.md](PRODUCT.md))
- Includes tests if applicable
- Updates documentation as needed
- Doesn't add unnecessary complexity

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- AI powered by [Ollama](https://ollama.ai)
- Database managed with [Drizzle ORM](https://orm.drizzle.team/)

## 📞 Support

- 📖 [Documentation](docs/)
- 🐛 [Report Issues](https://github.com/akashRashok/guidly/issues)
- 💬 [Discussions](https://github.com/akashRashok/guidly/discussions)

---

**Remember**: Guidly succeeds by doing less and doing it well. Any feature that doesn't directly improve misconception clarity is out of scope.

Made with ❤️ for teachers and students

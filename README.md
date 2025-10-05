# XMRT DAO - AI-Powered Mobile Monero Mining Platform

[![Deploy Status](https://img.shields.io/website?url=https%3A%2F%2Fxmrtdao.vercel.app)](https://xmrtdao.vercel.app)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.0.0-green.svg)](package.json)
[![Mining Pool](https://img.shields.io/badge/pool-SupportXMR-orange.svg)](https://supportxmr.com)
[![Powered By](https://img.shields.io/badge/AI-Lovable%20%2B%20Gemini-blue.svg)](https://lovable.dev)

> **XMRT DAO** revolutionizes cryptocurrency mining by enabling mobile devices to mine Monero (XMR) with AI assistance, real-time pool statistics, and community-driven governance. Mine privacy-first cryptocurrency on your phone with intelligent optimization and transparent earnings tracking.

## 🌐 Live Application

**Production URL**: [https://xmrtdao.vercel.app](https://xmrtdao.vercel.app)

## 🚀 Project Overview

XMRT DAO represents the convergence of mobile computing, blockchain technology, and decentralized governance. Our mission is to create an accessible, sustainable, and privacy-focused mining ecosystem that empowers individuals worldwide.

### 🎯 Core Features

#### 🤖 AI-Powered Intelligence
- **Eliza AI Assistant**: Conversational AI powered by Lovable AI Gateway + Google Gemini 2.5 Flash
- **Real-time Context**: Eliza has full knowledge of your mining statistics, wallet balance, and pool performance
- **Smart Insights**: Automatically analyzes efficiency, profitability, and provides actionable recommendations
- **Multi-modal Understanding**: Text, voice, and visual inputs for seamless interaction
- **Autonomous Decision Making**: Integration with task management and automated workflow systems

#### 📱 Mobile Mining Excellence
- **ARM Processor Optimization**: Native support for mobile CPU architectures
- **Intelligent Thermal Management**: Prevents overheating with dynamic throttling
- **Battery Preservation**: Smart power management for extended mining sessions
- **Background Mining**: Continues operation even with screen off
- **Multi-worker Support**: Manage multiple mining devices from single interface

#### 🔴 Live Pool Integration
- **SupportXMR Connection**: Direct API integration with pool.supportxmr.com:3333
- **Real-time Statistics**: Live hashrate, worker count, shares submitted, and earnings
- **Payment Tracking**: Automatic balance updates with transaction history
- **Pool Analytics**: Historical performance charts and network difficulty tracking

#### 💰 Profitability Tools
- **Live Calculator**: Real-time profitability based on your device's hashrate
- **Cost Analysis**: Factor in electricity costs for accurate profit projections
- **ROI Estimator**: Calculate return on investment for mining operations

#### 🗳️ DAO Governance
- **Democratic Voting**: Token-weighted governance for platform decisions
- **Proposal System**: Submit and vote on improvement proposals
- **Treasury Management**: Community-controlled fund allocation

#### 🔐 Privacy & Security
- **Monero Principles**: Built on privacy-preserving cryptocurrency foundation
- **Non-custodial**: You control your wallet and earnings at all times
- **Encrypted Communication**: End-to-end encryption for sensitive data

## 📊 Live Mining Integration

The platform integrates with **pool.supportxmr.com:3333** to provide:

- Real-time hashrate monitoring
- Active worker counts
- Pending payments and balances
- Pool statistics and network data
- Historical performance metrics

**Mining Wallet**: `46UxNFuGM2E3UwmZWWJicaRPoRwqwW4byQkaTHkX8yPcVihp91qAVtSFipWUGJJUyTXgzSqxzDQtNLf2bsp2DX2qCCgC5mg`

## 🤖 Meet Eliza - Your AI Mining Assistant

**Eliza** is an advanced AI chatbot built into XMRT DAO that serves as your personal mining assistant, data analyst, and blockchain expert.

### Eliza's Capabilities

#### 🧠 Full System Knowledge
- **Complete Infrastructure Awareness**: Eliza understands all 24 Supabase database tables, edge functions, and scheduled jobs
- **Real-time Mining Data**: Direct access to your live SupportXMR statistics including hashrate, earnings, and worker status
- **User Context**: Recognizes your session, preferences, and interaction patterns
- **Technical Expertise**: Deep knowledge of Monero mining, blockchain technology, and the XMRT ecosystem

#### 💬 Conversational Intelligence
- **Natural Language**: Ask questions in plain English about mining, earnings, or technical topics
- **Context-Aware**: Remembers conversation history and provides continuity across sessions
- **Multi-format Responses**: Delivers information as text, tables, charts, or actionable insights
- **Proactive Suggestions**: Offers recommendations based on your mining performance

#### 📊 Data Analysis
- **Mining Performance**: Analyzes your hashrate efficiency, share validity, and earnings trends
- **Profitability Insights**: Calculates ROI, estimates daily/monthly earnings, and factors costs
- **Pool Statistics**: Explains network difficulty, pool hashrate, and block reward data
- **Optimization Tips**: Suggests improvements for better mining performance

#### 🔧 Technical Support
- **Troubleshooting**: Helps diagnose mining issues, connection problems, or performance drops
- **Setup Guidance**: Walks you through wallet configuration, pool connection, and mining setup
- **Best Practices**: Educates on thermal management, battery optimization, and efficient mining
- **DAO Operations**: Explains governance proposals, voting mechanisms, and treasury management

### How Eliza Works

1. **Powered by Lovable AI Gateway**: Uses Google Gemini 2.5 Flash model with free tier access
2. **Supabase Edge Function**: `ai-chat` function processes requests with full context injection
3. **Real-time Data Integration**: Fetches live mining stats from `unifiedDataService`
4. **Fallback System**: Local LLM (Qwen2.5-0.5B) provides offline capability
5. **Conversation Persistence**: All chats stored in Supabase for continuity

### Example Conversations

**"What are my current mining stats?"**
> *"You're currently mining at 625 H/s on the SupportXMR pool. You've submitted 120,440 valid shares with 0 invalid shares (100% efficiency). Your pending balance is 0.008142 XMR with 0 XMR already paid out across 0 transactions. Last hash was submitted 2 minutes ago - you're actively mining!"*

**"Is mobile mining profitable?"**
> *"Based on your 625 H/s hashrate, you'll earn approximately 0.00156 XMR per day ($0.23 at current prices). After electricity costs (~$0.05/day), your daily profit is around $0.18. Monthly profit: $5.40. Profitability increases with XMR price appreciation and lower energy costs."*

**"How do I optimize battery life while mining?"**
> *"Here are smart strategies for battery preservation: 1) Mine only while plugged in, 2) Use thermal throttling to prevent overheating, 3) Reduce screen brightness or turn off display, 4) Enable battery optimization in settings, 5) Schedule mining during off-peak hours. XMRT's built-in thermal management automatically adjusts hashrate to protect your device."*

### Privacy & Security

- ✅ **No Personal Data Stored**: Conversations use session-based identifiers, not personal info
- ✅ **Encrypted Communication**: All AI requests use HTTPS and secure Supabase connections
- ✅ **Local Processing Available**: Offline LLM mode keeps data on your device
- ✅ **Row-Level Security**: Supabase RLS policies protect your data
- ✅ **Open Source**: Full transparency - review the code on GitHub

## 🛠️ Technology Stack

### Frontend Framework
- **React 18** with TypeScript for type-safe component development
- **Vite** for lightning-fast development and optimized production builds
- **Tailwind CSS** for utility-first responsive design
- **shadcn/ui** component library for consistent, accessible UI
- **Recharts** for real-time data visualization and mining charts
- **Lucide React** for beautiful, consistent iconography

### AI & Backend Infrastructure
- **Lovable AI Gateway** - Primary AI service with free tier access
- **Google Gemini 2.5 Flash** - Advanced language model for Eliza AI
- **Supabase Edge Functions** - Serverless API for mining proxy and AI chat
- **Supabase Database** - PostgreSQL with Row Level Security
- **Supabase Storage** - Secure file storage for user data
- **Local LLM Support** - Offline AI capabilities with Qwen2.5-0.5B

### Blockchain & Mining Integration
- **SupportXMR API** - Real-time mining statistics from pool.supportxmr.com:3333
- **Monero (XMR)** - Privacy-first cryptocurrency mining
- **Web3 React** & **Wagmi** - Blockchain wallet connectivity
- **Custom Mining Proxy** - Enhanced pool communication with retry logic

### Data & Services
- **Conversation Persistence** - Supabase-based chat history storage
- **Context Management** - Session-based user context and preferences
- **Autonomous Task System** - Automated workflow execution
- **GitHub Integration** - Repository management and autonomous operations
- **Web Automation** - Playwright-based browser automation

### Development & Deployment
- **TypeScript** - Full type safety across frontend and backend
- **ESLint** - Code quality and consistency enforcement
- **Bun** - Fast package management and task running
- **Vercel** - Production deployment with automatic CI/CD
- **GitHub Actions** - Automated testing and deployment pipelines

## 🏗️ Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Git
- Modern web browser with Web3 support

### Installation

```bash
# Clone the repository
git clone https://github.com/DevGruGold/assetverse-nexus.git
cd assetverse-nexus

# Install dependencies
npm install
# or using bun
bun install

# Set up environment variables
cp .env.example .env
# Configure your environment variables

# Start development server
npm run dev
# or using bun
bun dev
```

The application will be available at `http://localhost:5173`

### Environment Configuration

Create a `.env` file with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPPORTXMR_API_URL=https://supportxmr.com/api
VITE_MINING_WALLET=46UxNFuGM2E3UwmZWWJicaRPoRwqwW4byQkaTHkX8yPcVihp91qAVtSFipWUGJJUyTXgzSqxzDQtNLf2bsp2DX2qCCgC5mg
```

## 📱 Mobile Mining Features

### Optimized Performance
- **ARM Processor Support**: Leverages mobile CPU architecture efficiently
- **Battery Management**: Smart throttling to preserve device longevity
- **Thermal Monitoring**: Prevents overheating with intelligent cooling strategies
- **Background Processing**: Continues mining with screen off

### Mining Pool Integration
- **SupportXMR Pool**: Direct connection to pool.supportxmr.com:3333
- **Real-time Stats**: Live worker count, hashrate, and earnings
- **Payment Tracking**: Automatic balance updates and payout notifications
- **Pool Analytics**: Historical data and performance insights

## 🏛️ DAO Governance

### Executive Structure
- **Transparent Leadership**: Community-elected executive positions
- **Proposal System**: Democratic decision-making process
- **Treasury Management**: Community-controlled funds allocation
- **Voting Mechanisms**: Token-weighted governance participation

### Participation
- **Membership**: Open to all XMRT token holders
- **Voting Rights**: Proportional to token holdings and participation
- **Proposal Creation**: Community-driven improvement suggestions
- **Implementation**: Voted initiatives executed by development team

## 🔐 Privacy & Security

### Privacy-First Architecture
- **Monero Integration**: Built on privacy-preserving principles
- **Data Minimization**: Collect only essential information
- **Encryption**: End-to-end encryption for sensitive data
- **Decentralization**: No central authority control

### Security Measures
- **Wallet Security**: Non-custodial wallet integration
- **Smart Contract Audits**: Regular security assessments
- **Bug Bounty Program**: Community-driven security improvements
- **Regular Updates**: Continuous security enhancements

## 🚀 Deployment

### Production Deployment
The application is automatically deployed to Vercel:
- **Main Branch**: Auto-deploys to production at [xmrtdao.vercel.app](https://xmrtdao.vercel.app)
- **Pull Requests**: Generate preview deployments for testing
- **Environment Variables**: Configured in Vercel dashboard

### Manual Deployment
```bash
# Build for production
npm run build

# Preview production build locally
npm run preview

# Deploy to your preferred hosting provider
# (Vercel, Netlify, etc.)
```

## 🤝 Contributing

We welcome contributions from the community! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting standards
- **Testing**: Unit tests for critical functionality

## 📊 Mining Statistics

Real-time mining data provided by SupportXMR pool:
- **Network Hashrate**: Current Monero network strength
- **Pool Hashrate**: SupportXMR pool contribution
- **Active Miners**: Current connected workers
- **Block Rewards**: Recent block discoveries and rewards
- **Payment Queue**: Pending payouts and processing

## 🌍 Community

- **Website**: [xmrtdao.vercel.app](https://xmrtdao.vercel.app)
- **GitHub**: [DevGruGold/assetverse-nexus](https://github.com/DevGruGold/assetverse-nexus)
- **Chat**: Integrated chat system on main site
- **Support**: Community-driven support through chat interface

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Monero Community**: For the privacy-first cryptocurrency
- **SupportXMR Pool**: For reliable mining pool services
- **React Community**: For the excellent development framework
- **Open Source Contributors**: For the amazing tools and libraries

## 📈 Roadmap

### Q1 2025 ✅ COMPLETED
- [x] Lovable AI Gateway integration for free AI access
- [x] Google Gemini 2.5 Flash AI model implementation
- [x] Real-time SupportXMR pool integration
- [x] AI assistant Eliza with full mining context
- [x] Supabase backend with edge functions
- [x] Comprehensive conversation persistence
- [x] Mobile-optimized responsive design

### Q2 2025 🚧 IN PROGRESS
- [ ] Enhanced Eliza AI capabilities (vision, voice, multi-modal)
- [ ] Advanced DAO governance dashboard
- [ ] Multi-pool support (additional Monero pools)
- [ ] Native mobile app (React Native)
- [ ] Worker management interface
- [ ] Advanced analytics and reporting

### Q3 2025 📋 PLANNED
- [ ] Mesh network protocol implementation
- [ ] Hardware wallet integration
- [ ] Cross-platform desktop app (Electron)
- [ ] Mining hardware recommendations engine
- [ ] Educational content platform
- [ ] Community-driven plugin marketplace

### Q4 2025 🔮 FUTURE
- [ ] Enterprise mining solutions
- [ ] Mining pool hosting service
- [ ] Advanced privacy features (Tor integration)
- [ ] Hardware partnership program
- [ ] Carbon offset tracking for sustainable mining

---

**Built with ❤️ by the XMRT DAO Community**

*Empowering decentralized mining through mobile innovation*

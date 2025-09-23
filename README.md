# XMRT DAO - Decentralized Mobile Mining Ecosystem

[![Deploy Status](https://img.shields.io/website?url=https%3A%2F%2Fxmrtdao.vercel.app)](https://xmrtdao.vercel.app)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](package.json)

> **XMRT DAO** is a revolutionary decentralized autonomous organization focused on democratizing cryptocurrency mining through mobile devices and building a sustainable privacy-first mesh network.

## 🌐 Live Application

**Production URL**: [https://xmrtdao.vercel.app](https://xmrtdao.vercel.app)

## 🚀 Project Overview

XMRT DAO represents the convergence of mobile computing, blockchain technology, and decentralized governance. Our mission is to create an accessible, sustainable, and privacy-focused mining ecosystem that empowers individuals worldwide.

### 🎯 Core Features

- **📱 Mobile Mining Interface**: Optimized for ARM processors with battery and thermal management
- **🔴 Live Mining Statistics**: Real-time data from SupportXMR pool integration
- **🤖 AI-Powered Assistant**: Integrated chat interface for mining guidance and support
- **💰 Mining Calculator**: Accurate profitability calculations for mobile mining
- **🗳️ DAO Governance**: Decentralized decision-making platform
- **🔐 Privacy-First Design**: Built with Monero's privacy principles in mind

## 📊 Live Mining Integration

The platform integrates with **pool.supportxmr.com:3333** to provide:

- Real-time hashrate monitoring
- Active worker counts
- Pending payments and balances
- Pool statistics and network data
- Historical performance metrics

**Mining Wallet**: `46UxNFuGM2E3UwmZWWJicaRPoRwqwW4byQkaTHkX8yPcVihp91qAVtSFipWUGJJUyTXgzSqxzDQtNLf2bsp2DX2qCCgC5mg`

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for responsive design
- **shadcn/ui** components for consistent UI
- **Recharts** for data visualization

### Blockchain Integration
- **Web3 React** for wallet connectivity
- **Wagmi** for Ethereum interactions
- **Supabase** for data persistence
- **SupportXMR API** for live mining data

### Development Tools
- **ESLint** and **TypeScript** for code quality
- **Bun** for package management
- **Vercel** for deployment

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

### Q1 2025
- [ ] Enhanced mobile mining optimization
- [ ] Advanced DAO governance features
- [ ] Multi-pool support integration
- [ ] Mobile app development

### Q2 2025
- [ ] Mesh network protocol implementation
- [ ] Advanced privacy features
- [ ] Cross-platform compatibility
- [ ] Educational content platform

### Q3 2025
- [ ] Hardware partnership program
- [ ] Enterprise mining solutions
- [ ] Advanced analytics dashboard
- [ ] Community marketplace

---

**Built with ❤️ by the XMRT DAO Community**

*Empowering decentralized mining through mobile innovation*

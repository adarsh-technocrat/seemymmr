# seeMoreThanMMR

A privacy-focused web analytics platform that helps you understand your website visitors, track revenue attribution, and measure custom goals.

## Features

- 📊 **Comprehensive Analytics** - Track page views, sessions, unique visitors, and more
- 💰 **Revenue Attribution** - Link revenue to specific visitors and marketing campaigns
- 🎯 **Custom Goals** - Track any user action as a conversion goal
- 🔗 **Integrations** - Twitter/X, GitHub, Google Search Console
- 🛡️ **Privacy-First** - No cookies required, GDPR compliant
- ⚡ **Real-time** - Live visitor counts and updates
- 🔌 **API Access** - Full REST API for custom integrations

## Quick Start

### Installation

```bash
git clone https://github.com/adarsh-technocrat/seemymmr.git
cd seemymmr
pnpm install
```

### Environment Setup

Copy `.env.example` to `.env` and fill in your configuration:

```bash
cp .env.example .env
```

### Run Development Server

```bash
pnpm dev
```

Visit `http://localhost:3000` to see your application.

## Documentation

Documentation is built with [Mintlify](https://mintlify.com).

### Run Documentation Locally

```bash
pnpm docs:dev
```

Visit `http://localhost:3000` to view the documentation.

### Build Documentation

```bash
pnpm docs:build
```

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Documentation**: Mintlify

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   └── login/             # Auth pages
├── components/            # React components
├── db/                    # Database models
├── docs/                  # Documentation (Mintlify)
├── lib/                   # Utility libraries
├── utils/                 # Helper functions
└── mint.json              # Mintlify configuration
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Support

For support, email support@seemorethanmmr.com or open an issue on GitHub.

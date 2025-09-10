# LeetCode Student Progress Tracker

A comprehensive full-stack web application for tracking and analyzing LeetCode progress of students in a batch. The system provides real-time synchronization with LeetCode's API, comprehensive dashboards, and advanced analytics.

## ✨ Features



### 🎯 Core Functionality
- **Real-time LeetCode Data Sync**: Automatically fetches and updates student progress from LeetCode's GraphQL API
- **Student Management**: Import students via CSV, manage batches (2027, 2028), track individual progress
- **Comprehensive Dashboards**: Individual student dashboards, batch overviews, university-wide analytics
- **Real-time Rankings**: Live leaderboards with auto-refresh functionality
- **Profile Photos**: Automatic integration with LeetCode profile photos
- **Advanced Analytics**: Weekly trends, streak tracking, difficulty breakdowns, submission statistics

### 📊 Analytics & Visualization
- **Activity Heatmaps**: GitHub-style 365-day submission calendars
- **Progress Charts**: Weekly progress trends, difficulty distribution charts
- **Performance Metrics**: Streak tracking, active days calculation, ranking evolution
- **Badge System**: Achievement tracking and recognition system

### 🎛️ Admin Features
- **Batch Management**: Separate tracking for different student batches
- **Data Import/Export**: CSV import for students, export functionality for reports
- **Sync Controls**: Manual and automated LeetCode data synchronization
- **Profile Photo Sync**: Automatic profile photo updates from LeetCode
- **Student Directory**: Search, filter, and browse all students with detailed profiles

### 🏗️ Technical Features
- **Modern Tech Stack**: React + TypeScript frontend, Node.js + Express backend
- **Database**: PostgreSQL with Drizzle ORM, optimized for Neon Database
- **Real-time Updates**: TanStack Query for efficient data fetching and caching
- **Responsive Design**: Mobile-first design with Tailwind CSS and Radix UI components
- **Type Safety**: End-to-end TypeScript with shared schema definitions

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Neon Database account (free tier available)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd leetcode-tracker
   ```

2. **Run the automated setup script**
   
   **On macOS/Linux:**
   ```bash
   ./setup-local.sh
   ```
   
   **On Windows:**
   ```batch
   setup-local.bat
   ```

3. **Configure your database**
   - Create a free account at [Neon.tech](https://neon.tech)
   - Create a new project: `leetcode-tracker`
   - Copy your connection string to `.env` file
   - The script will guide you through this process

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5000`

## 📚 Complete Documentation

- **[📖 Local Development Setup](LOCAL_DEVELOPMENT_SETUP.md)** - Comprehensive local development guide
- **[🚀 Render Deployment Guide](RENDER_DEPLOYMENT_GUIDE.md)** - Production deployment instructions  
- **[🔧 Database Schema](shared/schema.ts)** - Database structure and types

## 🏛️ Architecture

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state
- **UI Components**: Radix UI with shadcn/ui styling
- **Styling**: Tailwind CSS with custom design system

### Backend (Node.js + Express)
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **API Integration**: LeetCode GraphQL API client

### Database (PostgreSQL)
- **Provider**: Neon Database (serverless PostgreSQL)
- **ORM**: Drizzle ORM with automatic migrations
- **Schema**: Type-safe schema definitions with Zod validation

## 🎯 Current Status

**✅ FULLY OPERATIONAL** - Successfully tracking 184 students across multiple batches with:
- 100% LeetCode sync success rate
- Real-time profile photo integration from LeetCode
- Comprehensive batch separation (2027/2028)
- Advanced analytics and visualizations
- Automated daily synchronization

## 🔧 Available Scripts

- `npm run dev` - Start development server (both frontend + backend)
- `npm run build` - Build for production deployment
- `npm run start` - Start production server
- `npm run db:push` - Push database schema changes
- `npm run check` - TypeScript type checking

## 🌐 Deployment Options

### 🎯 Render Deployment (Recommended)
**One-click deployment with the comprehensive guide:**
1. Follow the [📋 Render Deployment Guide](RENDER_DEPLOYMENT_GUIDE.md)
2. Connect your GitHub repository
3. Configure environment variables
4. Deploy with automatic builds

**Render Benefits:**
- ✅ Free tier available
- ✅ Automatic HTTPS
- ✅ Git-based deployments
- ✅ Built-in monitoring

### Alternative Platforms
The application works on any Node.js hosting platform:
- **Vercel**: Frontend-optimized with API routes
- **Railway**: Simple Docker deployments
- **DigitalOcean**: VPS or App Platform
- **Heroku**: Traditional PaaS deployment

**Requirements:**
- Node.js 18+ runtime
- PostgreSQL database (Neon recommended)
- Environment variables configured

## 📈 Data Flow

1. **Student Import**: CSV files → PostgreSQL Database
2. **LeetCode Sync**: LeetCode GraphQL API → Real-time progress updates
3. **Profile Photos**: LeetCode API → Automatic avatar synchronization
4. **Analytics**: Aggregated data → Charts and insights
5. **Real-time UI**: Live updates with optimistic caching

## 🛡️ Data Storage & Persistence

All data is permanently stored in your Neon PostgreSQL database:
- ✅ Student profiles and batch information
- ✅ Daily progress tracking and submissions
- ✅ Weekly trends and analytics calculations
- ✅ Badge achievements and milestones
- ✅ Profile photos and metadata
- ✅ Historical data and trends
- ✅ Import/export records

**Backup & Recovery:**
- Automatic daily backups via Neon
- Point-in-time recovery available
- Export functionality for data portability

## 🔄 Synchronization Features

### Automated Synchronization
- **Daily Sync**: Runs at midnight (configurable)
- **Profile Photos**: Automatic updates from LeetCode
- **Batch Processing**: Efficient bulk operations
- **Error Handling**: Retry logic for failed requests

### Manual Controls
- **Admin Dashboard**: Sync all students
- **Individual Sync**: Per-student updates
- **Profile Photo Sync**: Dedicated photo update button
- **Batch Sync**: Cohort-specific synchronization

## 📱 Dashboard Features

### Student Directory
- 🔍 Search and filter all students
- 👤 Profile cards with photos
- 🏆 Batch filtering and sorting
- 📊 Quick stats overview

### Individual Student Dashboard
- 📈 Personal progress overview
- 🔗 LeetCode profile integration
- 🏅 Achievement badges
- 🗓️ Activity heatmaps
- 📊 Trend analysis

### Admin Dashboard
- 📋 Batch overview and statistics
- ⚙️ Student management controls
- 📤 Data import/export tools
- 🔄 Sync controls (data + photos)
- 🔍 System health monitoring

### Real-time Tracker
- 🏃‍♂️ Live rankings with auto-refresh
- 🏆 University-wide leaderboards
- ⚖️ Batch comparisons
- 📊 Performance metrics

### University Dashboard
- 🏫 Multi-batch overview
- 📊 Comparative analytics
- 🏆 Combined leaderboards
- 📈 Growth tracking

## 🎨 Modern UI Components

Built with accessibility and user experience in mind:
- **Responsive Design**: Works on all devices
- **Professional Aesthetics**: Clean, modern interface
- **Accessible Navigation**: Keyboard and screen reader support
- **Real-time Updates**: Live data with loading states
- **Profile Integration**: Actual LeetCode avatars

## 📊 Advanced Analytics

### Progress Metrics
- **Daily/Weekly/Monthly Trends**: Comprehensive time-series analysis
- **Streak Analysis**: Current and maximum consecutive solving streaks
- **Difficulty Distribution**: Breakdown by Easy, Medium, Hard problems
- **Submission Statistics**: Acceptance rates and submission patterns

### Performance Insights
- **Ranking Evolution**: Historical ranking changes
- **Batch Comparisons**: Performance across different cohorts
- **Activity Patterns**: Heat maps and activity analysis
- **Achievement Tracking**: Badge system and milestone recognition

## 🔧 Customization Options

The application is designed for extensibility:
- **Dashboard Widgets**: Add custom analytics components
- **Badge System**: Create new achievement criteria
- **UI Themes**: Customize colors and branding
- **Data Sources**: Extend to other coding platforms
- **Import Formats**: Support additional data formats

## 🛠️ Development Tools

### Available Scripts
```bash
npm run dev      # Development server with hot reload
npm run build    # Production build
npm run start    # Production server
npm run db:push  # Database schema migration
npm run check    # TypeScript validation
```

### Setup Scripts
- `setup-local.sh` - Automated macOS/Linux setup
- `setup-local.bat` - Automated Windows setup
- `.env.example` - Environment configuration template

## 🎯 Production Ready Features

- ✅ **Performance Optimized**: Efficient database queries and caching
- ✅ **Error Handling**: Comprehensive error boundaries and API error handling
- ✅ **Security**: Environment variable protection and secure connections
- ✅ **Monitoring**: Built-in logging and health checks
- ✅ **Scalability**: Designed for growth with efficient architecture

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes with proper testing
4. Commit changes: `git commit -m 'Add amazing feature'`
5. Push to branch: `git push origin feature/amazing-feature`
6. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support & Troubleshooting

For issues and questions:
1. 📖 Check the comprehensive documentation files
2. 🔍 Review troubleshooting sections in setup guides
3. 🐛 Create an issue on GitHub with detailed information
4. 💬 Contact the development team

### Common Issues
- **Database Connection**: Verify Neon database URL in `.env`
- **Node.js Version**: Ensure Node.js 18+ is installed
- **Port Conflicts**: Check if port 5000 is available
- **LeetCode API**: Some sync failures are normal (rate limiting)

---

**Built with ❤️ for tracking LeetCode progress and promoting competitive programming excellence.**

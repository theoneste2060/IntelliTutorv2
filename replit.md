# IntelliTutor - AI-Powered Learning Platform

## Overview

IntelliTutor is a web-based educational platform designed to help students practice and improve using real NESA past exam questions. The system leverages AI to automatically extract questions from uploaded exam papers, generate model answers, and provide personalized feedback to students. The platform features a gamified learning experience with badges, progress tracking, and intelligent question recommendations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Build Tool**: Vite for development and production builds
- **PWA Features**: Service Worker, Web App Manifest, offline functionality, and app installation capabilities

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with JSON responses
- **File Uploads**: Multer middleware for handling PDF/image uploads
- **Session Management**: Express sessions with PostgreSQL storage

### Authentication System
- **Provider**: Simple credential-based authentication
- **Session Storage**: Express sessions with memory store
- **Strategy**: Passport.js with local strategy
- **Authorization**: Role-based access control (student/admin)
- **Credentials**: username: admin, password: admin123

## Key Components

### AI Services Layer
1. **OCR Service**: Processes uploaded PDF/image files to extract text content
2. **OpenAI Service**: Handles question extraction, model answer generation, and answer evaluation
3. **NLP Service**: Provides text similarity analysis using TF-IDF and semantic matching

### Data Management
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: SQLite for local development and production data storage
- **Migrations**: Direct SQL table creation in server/db.ts
- **Validation**: Zod schemas for data validation

### User Interface Components
1. **Dashboard**: Personalized student/admin dashboards with statistics
2. **Practice Interface**: One-question-at-a-time learning experience
3. **Admin Panel**: Question management and verification tools
4. **Progress Tracking**: Visual progress indicators and recommendations

## Data Flow

1. **Admin Workflow**:
   - Upload exam papers (PDF/images) → OCR processing → AI question extraction → Manual verification → Published questions

2. **Student Workflow**:
   - Login → Dashboard → Practice session → Answer submission → AI evaluation → Feedback display → Progress update

3. **AI Processing Pipeline**:
   - Document upload → OCR text extraction → OpenAI question parsing → Model answer generation → Storage with confidence scores

4. **Answer Evaluation**:
   - Student answer → TF-IDF similarity → Semantic analysis → Grammar check → Combined scoring → Personalized feedback

## External Dependencies

### Core Services
- **Neon Database**: Serverless PostgreSQL hosting
- **OpenAI API**: GPT-4 for question extraction and answer evaluation
- **Replit Auth**: Authentication and user management

### Development Tools
- **TypeScript**: Type safety across the entire stack
- **Vite**: Fast development server and build tool
- **Tailwind CSS**: Utility-first styling framework
- **Radix UI**: Accessible component primitives

### Runtime Dependencies
- **Express.js**: Web server framework
- **Drizzle ORM**: Database interface layer
- **TanStack Query**: Client-side data fetching and caching
- **Multer**: File upload handling
- **Passport.js**: Authentication middleware

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with Express API
- **Hot Reloading**: Both frontend and backend support hot reloading
- **Type Checking**: Continuous TypeScript compilation

### Production Build
- **Frontend**: Vite builds static assets to `dist/public`
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Environment**: NODE_ENV-based configuration switching

### Database Management
- **Schema**: Centralized in `shared/schema.ts` for type safety
- **Migrations**: Drizzle Kit handles schema changes
- **Connection**: Connection pooling with Neon serverless

### Configuration Requirements
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API access
- `SESSION_SECRET`: Session encryption key
- `REPL_ID`: Replit environment identifier
- `ISSUER_URL`: OpenID Connect provider URL

The application follows a monorepo structure with shared types and schemas, enabling full-stack type safety and efficient development workflows.

## Recent Changes

**January 24, 2025:**
- **Google OAuth Fixed**: Successfully resolved redirect URI mismatch issues and Google OAuth is now fully functional for student authentication
- **Admin Student Management**: Created comprehensive admin students page with performance analytics, search/sort functionality, and CSV export capabilities
- **Navigation Styling**: Updated navbar with professional dark theme (slate-900) instead of white background for better visual appeal
- **Migration to Replit Environment**: Successfully migrated project from Replit Agent to standard Replit environment
- **Homepage Enhancement**: Updated landing page hero section with educational background images for better visual appeal
- **Security Verification**: Confirmed proper client/server separation and secure architecture
- **Performance Optimization**: Verified all dependencies are properly installed and working
- **UI Improvements**: Enhanced hero section with layered background images and improved typography contrast
- Fixed duplicate function declaration error in AdminTable component (onViewQuestion)
- Added comprehensive question filtering system to practice page
- Implemented filter interface with Subject, Difficulty, Level, and Topic selection
- Created new API endpoints: `/api/questions/filters` and enhanced `/api/questions/next` with filter support
- Added storage methods: `getFilteredQuestions()` and `getAvailableFilters()`
- Enhanced question display to show level and topic information with badges
- Fixed TanStack Query v5 compatibility issues (removed deprecated onSuccess callbacks)
- Added collapsible filter interface with "Show/Hide Filters" toggle
- Implemented "Clear All" and "New Question" buttons for better user experience
- **Sliding Hero Images**: Added automatic slideshow with educational classroom images cycling every 5 seconds
- **Enhanced Text Readability**: Improved hero section text visibility with backdrop blur and dark overlays
- **Interactive Elements**: Added clickable slide indicators for manual image navigation
- **Progressive Web App (PWA)**: Converted application to PWA with offline capabilities, app installation, and native-like experience
  - Web App Manifest with icons, shortcuts, and app metadata
  - Service Worker for offline functionality and background sync
  - PWA Install Button in navigation for easy app installation
  - Update notifications when new versions are available
  - Offline storage for critical data and caching strategies
  - Background sync for offline answer submissions
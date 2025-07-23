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

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with JSON responses
- **File Uploads**: Multer middleware for handling PDF/image uploads
- **Session Management**: Express sessions with PostgreSQL storage

### Authentication System
- **Provider**: Replit Auth (OpenID Connect)
- **Session Storage**: PostgreSQL with connect-pg-simple
- **Strategy**: Passport.js with OpenID Connect strategy
- **Authorization**: Role-based access control (student/admin)

## Key Components

### AI Services Layer
1. **OCR Service**: Processes uploaded PDF/image files to extract text content
2. **OpenAI Service**: Handles question extraction, model answer generation, and answer evaluation
3. **NLP Service**: Provides text similarity analysis using TF-IDF and semantic matching

### Data Management
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (Neon serverless) for production data storage
- **Migrations**: Drizzle Kit for database schema management
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
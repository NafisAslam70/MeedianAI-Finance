# MeedianAI-Finances

## Overview

MeedianAI-Finances is a comprehensive school financial management system designed as a subdirectory of the larger MeedianAI-Flow ecosystem. The application provides role-based access to manage student fees, payments, transportation costs, and financial reporting for educational institutions. It handles complex fee structures for different student types (hostellers vs day scholars), tracks monthly collections, manages Excel-based data imports, and provides detailed financial analytics and reporting capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with Vite as the build tool and development server
- **UI System**: shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: TanStack React Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Charts**: Recharts for financial data visualization and trend analysis

### Backend Architecture
- **Runtime**: Node.js with Express.js framework for REST API endpoints
- **API Design**: RESTful endpoints following conventional patterns (/api/students, /api/payments, etc.)
- **Database Layer**: Drizzle ORM with TypeScript-first schema definitions
- **Authentication**: Shared authentication system with MeedianAI-Flow using role-based access control
- **File Processing**: Excel import functionality for bulk data operations

### Data Storage Architecture
- **Primary Database**: PostgreSQL via Neon serverless adapter
- **ORM**: Drizzle ORM for type-safe database operations and migrations
- **Schema Design**: Comprehensive schema covering students, classes, fee structures, payments, and transport fees
- **Shared Tables**: Leverages existing users and classes tables from the parent MeedianAI-Flow system
- **Migration Strategy**: Drizzle Kit for schema migrations stored in ./migrations directory

### Key Data Models
- **Students**: Core student information with hosteller/day scholar classification
- **Fee Structures**: Flexible fee configuration per class and student type
- **Payments**: Payment tracking with verification workflow
- **Transport Fees**: Van/transport fee management with route-based pricing
- **Financial Reports**: Aggregated reporting and analytics data

### Authentication & Authorization
- **Role System**: Inherits from MeedianAI-Flow with admin, team_manager, and member roles
- **Access Control**: Role-based permissions for different financial operations
- **Session Management**: Shared session system with the parent Flow application

## External Dependencies

### Database Services
- **Neon Database**: PostgreSQL hosting with serverless architecture
- **Connection Pooling**: Built-in connection management via Neon serverless adapter

### UI & Component Libraries
- **Radix UI**: Headless UI primitives for accessible component foundation
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Lucide React**: Icon library for consistent iconography
- **Recharts**: Chart library for financial data visualization

### Development & Build Tools
- **Vite**: Fast build tool and development server with HMR
- **TypeScript**: Full type safety across frontend and backend
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind integration

### Data Processing
- **Drizzle Kit**: Database migration and schema management tool
- **Zod**: Runtime type validation for form inputs and API data
- **Date-fns**: Date manipulation and formatting utilities

### Integration Points
- **MeedianAI-Flow**: Shared authentication, user management, and navigation
- **Excel Processing**: File upload and parsing capabilities for bulk data import
- **WhatsApp Integration**: Inherited from Flow app for fee reminder notifications (via Twilio)

### Production Infrastructure
- **Replit Platform**: Development and deployment environment with specialized plugins
- **Environment Configuration**: Secure environment variable management for database and API credentials
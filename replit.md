# Customer Dashboard & Admin Portal

## Overview

A full-stack web application providing a secure customer dashboard and admin portal for managing downloadable content with role-based access control. The system enables administrators to manage users, generate invite codes, and upload files, while customers can browse and download content based on their access permissions.

**Key Features:**
- User profile customization with avatar, Discord username, and bio
- Download history tracking for each user
- File categorization system (cheat, loader, tool, update, other)
- Real-time search and category filtering for downloads
- FAQ system with product-based organization and expandable solutions
- WebSocket integration for real-time updates across all features
- IP address tracking for admin security monitoring

**Expanded Features (November 2025):**
- **Analytics Dashboard**: Real-time charts showing download trends, file popularity, user growth, and platform statistics
- **Announcements System**: Admin-managed announcements with priority levels (info, warning, critical) displayed as banners
- **Notifications Center**: Bell icon with dropdown showing recent user activities and system notifications
- **Favorites System**: Heart button on download cards allowing users to favorite files for quick access
- **Tags System**: Color-coded file tags for enhanced organization and filtering
- **Collections System**: Group related files into curated collections for better discovery
- **Audit Logging**: Comprehensive tracking of all admin actions for security and compliance
- **File Versioning**: Backend support for tracking file version history (UI pending)
- **File Comments**: Backend support for user comments on files (UI pending)
- **Bulk Upload**: API endpoints for uploading multiple files at once (UI pending)
- **File Expiration**: Backend support for time-limited file access (UI pending)

**Tech Stack:**
- Frontend: React with TypeScript, Vite, TanStack Query, Wouter routing
- Backend: Express.js with TypeScript
- Database: PostgreSQL (via Neon serverless)
- ORM: Drizzle ORM
- UI: shadcn/ui components with Tailwind CSS (Material Design-influenced)
- Authentication: Passport.js with express-session

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Component Structure:**
- Single-page application with client-side routing using Wouter
- Protected routes requiring authentication for all non-auth pages
- Component library based on shadcn/ui with Radix UI primitives
- Responsive layout with collapsible sidebar navigation
- Theme support (light/dark mode) with localStorage persistence

**State Management:**
- TanStack Query for server state management and caching
- React Context for authentication state (`AuthProvider`)
- Form state managed via react-hook-form with Zod validation

**Key Design Patterns:**
- Protected route wrapper for authenticated pages
- Centralized API client with credential-based authentication
- Query key-based cache invalidation after mutations
- Toast notifications for user feedback

### Backend Architecture

**Application Structure:**
- Express.js server with TypeScript in ESNext module format
- Session-based authentication using Passport.js LocalStrategy
- PostgreSQL session store for persistence
- File upload handling via Multer with disk storage
- Route-based authorization middleware (`requireAuth`, `requireRole`)

**Security Measures:**
- Password hashing using scrypt with random salts
- Timing-safe password comparison
- Filename sanitization for uploads (prevents path traversal)
- Session cookies with 7-day expiration
- Role-based access control (admin, moderator, customer)

**API Design:**
- RESTful endpoints under `/api` prefix
- JSON request/response format
- Error handling with appropriate HTTP status codes
- Request logging middleware for API calls

### Database Schema

**Core Tables:**

1. **users** - User accounts with authentication and profile data
   - Fields: id (UUID), username, password (hashed), role, avatar, discordUsername, bio, lastIpAddress, isActive, timestamps
   - Supports invite-based registration via inviteCodeId reference
   - Profile fields allow user customization and personalization

2. **inviteCodes** - Invitation system for controlled registration
   - Fields: id (UUID), code, role, isUsed, createdById, usedById, timestamps
   - Tracks code creator and usage

3. **downloadFiles** - Downloadable content management with categorization
   - Fields: id (UUID), name, description, filename, fileSize, version, category (enum), allowedRoles (array), uploadedById, timestamps
   - Role-based file access via allowedRoles array
   - Category system for organizing files: cheat, loader, tool, update, other

4. **downloadHistory** - Audit trail for file downloads
   - Tracks user download activity for analytics

5. **faqProducts** - FAQ product categories
   - Fields: id (UUID), name, description, displayOrder, timestamps
   - Unique product names for organizing FAQ items

6. **faqItems** - Individual FAQ entries with issues and solutions
   - Fields: id (UUID), productId (FK to faqProducts), issue, solutions (text array), displayOrder, timestamps
   - Foreign key relationship with CASCADE delete ensures data integrity
   - Multiple solutions per FAQ item supported via array field

**New Feature Tables (November 2025):**

7. **announcements** - System-wide announcements for users
   - Fields: id (UUID), title, message, type (info/warning/critical), isActive, createdById, timestamps
   - Displayed as banners to customers, fully managed by admins

8. **notifications** - User notification system
   - Fields: id (UUID), userId, title, message, type, isRead, createdAt
   - Supports real-time delivery via WebSocket

9. **favorites** - User-favorited files
   - Fields: id (UUID), userId, fileId, timestamps
   - Enables quick access to frequently used files

10. **fileTags** - Organizational tags for files
    - Fields: id (UUID), name, color, timestamps
    - Color-coded labels for enhanced file organization

11. **fileTagAssignments** - Many-to-many relationship between files and tags
    - Fields: id (UUID), fileId, tagId, timestamps

12. **fileCollections** - Curated groups of related files
    - Fields: id (UUID), name, description, createdById, timestamps
    - Allows admins to create themed file bundles

13. **collectionFiles** - Files within collections
    - Fields: id (UUID), collectionId, fileId, displayOrder, timestamps

14. **fileVersions** - Version history for files
    - Fields: id (UUID), fileId, versionNumber, filename, fileSize, uploadedById, timestamps
    - Tracks complete version history with rollback capability

15. **fileComments** - User comments on files
    - Fields: id (UUID), fileId, userId, comment, timestamps
    - Enables user feedback and discussion (backend ready, UI pending)

16. **auditLog** - Comprehensive admin action tracking
    - Fields: id (UUID), userId, action, entity, entityId, details (JSON), ipAddress, timestamp
    - Full security and compliance audit trail

**Relationships:**
- Users → InviteCodes (via inviteCodeId)
- InviteCodes → Users (creator via createdById, user via usedById)
- DownloadFiles → Users (uploader via uploadedById)
- DownloadHistory → Users and DownloadFiles
- FaqProducts → FaqItems (one-to-many)
- FaqItems → FaqProducts (via productId with CASCADE delete)
- Announcements → Users (creator via createdById)
- Notifications → Users (via userId)
- Favorites → Users and DownloadFiles
- FileTags → FileTagAssignments → DownloadFiles (many-to-many)
- FileCollections → CollectionFiles → DownloadFiles (many-to-many)
- FileVersions → DownloadFiles (via fileId)
- FileComments → Users and DownloadFiles
- AuditLog → Users (via userId)

### Authentication & Authorization

**Authentication Flow:**
1. User submits credentials via login form
2. Passport LocalStrategy verifies username/password
3. Session established with PostgreSQL-backed store
4. User object serialized to session
5. Subsequent requests authenticated via session cookie

**Authorization Levels:**
- **Customer**: Access to dashboard and downloads
- **Moderator**: Customer permissions (potentially file management)
- **Admin**: Full system access including user/invite/file management

**Registration Requirements:**
- Valid invite code required
- Invite code determines initial user role
- Code marked as used upon successful registration

### File Management System

**Upload Process:**
1. Admin uploads file via multipart/form-data
2. Multer saves to `/uploads` directory with sanitized filename
3. Metadata stored in database with role-based permissions and category
4. Original filename preserved in metadata

**Edit Process:**
1. Admin clicks edit button on file in management table
2. Edit dialog pre-fills with current file details (name, description, version, category)
3. Admin updates desired fields including category
4. Changes saved via PATCH request
5. Real-time broadcast updates all connected clients

**Download Process:**
1. User requests file download
2. Backend verifies user role against file's allowedRoles
3. File streamed as blob response
4. Download recorded in history table
5. Frontend triggers browser download via blob URL

**Storage:**
- Files stored in local filesystem under `/uploads`
- 500MB file size limit
- Filename sanitization prevents directory traversal attacks
- File metadata (category, name, description, version) editable post-upload

### FAQ System

**Customer View:**
1. Navigate to FAQ page from sidebar
2. Select product from dropdown (e.g., "Roblox External")
3. View FAQ items in expandable accordion format
4. Each item shows issue with collapsible solutions
5. Real-time updates via WebSocket when FAQ content changes

**Admin Management:**
- Full admin UI at `/admin/faq` for managing FAQ content
- Two-column layout: Products list (left) + FAQ items list (right)
- Create, edit, delete products with modal dialogs
- Create, edit, delete FAQ items with modal dialogs
- Dynamic solutions field (add/remove multiple solutions per item)
- Click product to select it and view/manage its items
- Form validation with Zod schemas
- Cascade delete warning when deleting products (also deletes all associated items)
- Real-time WebSocket broadcasts ensure all clients see changes immediately

**Data Structure:**
- Products organize FAQ items by category (e.g., game cheats, tools)
- Each FAQ item has one issue and one or more solutions
- Display order controls presentation sequence
- Foreign key relationship ensures data integrity (cascade delete)

**Seeded Content:**
- "Roblox External" product with 5 common issues
- Issues cover driver loading, detection, DLL dependencies, ESP positioning, and antivirus blocking
- Solutions provide step-by-step fixes with detailed instructions

### Design System

**Typography:**
- Primary font: Inter
- Monospace font: Roboto Mono (for codes/technical content)
- Hierarchy: 2xl (titles) → xl (sections) → base (body) → sm (labels) → xs (captions)

**Layout:**
- Two-column layout: Fixed 16rem sidebar + flexible main content
- Responsive breakpoint collapses to single column on mobile
- Spacing based on Tailwind scale (2, 4, 6, 8, 12, 16, 24)
- Container max-width: 7xl (admin), 6xl (customer)

**Component Patterns:**
- Card-based content organization with elevation shadows
- Badge system for role visualization
- Data tables for user/file/invite management
- Modal dialogs for create/edit actions
- Toasts for success/error feedback

## External Dependencies

**Database:**
- Neon Serverless PostgreSQL (via @neondatabase/serverless)
- WebSocket support for serverless connections
- Connection pooling via pg.Pool

**Session Storage:**
- PostgreSQL session store (connect-pg-simple)
- 7-day session expiration
- Secure cookie configuration

**File Storage:**
- Local filesystem storage via Multer
- Upload directory: `./uploads`
- No cloud storage integration (files stored locally)

**UI Components:**
- Radix UI primitives for accessible component foundation
- shadcn/ui design system (New York style variant)
- Tailwind CSS for styling with custom HSL color variables

**Authentication:**
- Passport.js with LocalStrategy
- Scrypt for password hashing (Node.js crypto module)
- express-session for session management

**Validation:**
- Zod schemas for data validation
- drizzle-zod for database schema validation
- react-hook-form integration with @hookform/resolvers

**Development:**
- Vite for build tooling and dev server
- Replit-specific plugins for development environment
- ESBuild for server-side bundling in production
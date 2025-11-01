# Design Guidelines: Customer Dashboard & Admin Portal

## Design Approach

**System Selected:** Material Design with Fluent Design influences
**Justification:** This dashboard-heavy application requires clear information hierarchy, robust data tables, and efficient workflows. Material Design provides excellent patterns for complex interfaces while maintaining visual clarity.

## Typography System

**Font Family:** Inter (primary), Roboto Mono (code/technical elements)

**Hierarchy:**
- Page Titles: 2xl, semi-bold (Dashboard heading, "User Management")
- Section Headers: xl, medium (Card titles, "Recent Downloads")
- Body Text: base, regular (Table content, descriptions)
- Labels: sm, medium (Form labels, status badges)
- Captions: xs, regular (Helper text, timestamps)
- Code/Invite Keys: sm, mono (Invite codes display)

## Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16, 24
- Micro spacing (within components): 2, 4
- Component spacing: 6, 8
- Section spacing: 12, 16, 24

**Grid System:**
- Container max-width: 7xl for admin views, 6xl for customer dashboard
- Two-column admin layout: Sidebar (260px fixed) + Main content (flex-1)
- Responsive breakpoint: Stack to single column below lg

## Core Layout Structure

### Navigation Sidebar (Admin/Customer)
- Fixed left sidebar with full viewport height
- Logo/brand at top (h-16)
- Navigation items with icons and labels
- User profile section at bottom
- Role badge display under username
- Logout button clearly visible

### Main Content Area
- Top navigation bar (h-16) with breadcrumbs and user menu
- Content padding: p-6 to p-8
- Cards with elevation for distinct sections
- Sticky headers for long scrolling tables

## Component Library

### Authentication Pages (Login/Register)

**Layout:**
- Centered card layout (max-w-md) on full viewport
- Split layout option: Left side = branding/illustration (hidden on mobile), Right side = form
- Form card with generous padding (p-8)
- Logo centered above form
- Single column form inputs with consistent spacing (mb-6)

**Registration Form:**
- Username field
- Password field (with show/hide toggle)
- Invite Code field (emphasized with distinct styling)
- Submit button (full width)
- Link to login page

**Login Form:**
- Username field
- Password field (with show/hide toggle)
- "Remember me" checkbox
- Submit button (full width)
- Link to registration

### Customer Dashboard

**Hero Section:**
- Welcome message with user's name (text-2xl)
- Quick stats cards in grid (2 columns on desktop, 1 on mobile):
  - Active downloads count
  - Last login date
  - Account status
  - Role display

**Downloads Section:**
- Section header with icon
- Grid of download cards (2 columns desktop, 1 mobile)
- Each card includes:
  - File icon (large, top)
  - File name (bold)
  - File size and version
  - Description text
  - Primary download button (full width within card)
  - Last updated timestamp
- Cards have consistent height, elevated appearance

### Admin Dashboard

**Overview Section:**
- Stats grid (4 columns desktop, 2 tablet, 1 mobile):
  - Total users
  - Active invite codes
  - Downloads this month
  - Pending approvals
- Each stat card: Large number (text-3xl), label below, icon top-right

**Quick Actions Section:**
- Horizontal button group or card grid:
  - Generate invite code
  - Create new user
  - Manage roles
  - View logs

### User Management Interface

**Table Layout:**
- Search bar and filters at top (flex row on desktop)
- Action buttons (Add User, Bulk Actions) aligned right
- Responsive data table:
  - Columns: Avatar | Username | Email | Role | Status | Last Active | Actions
  - Row actions dropdown (three-dot menu)
  - Inline role badge with distinct styling per role
  - Hover state for entire row
- Pagination controls at bottom
- Mobile: Convert to card list with stacked information

**User Details Modal/Panel:**
- Slide-in panel from right (lg screens) or modal (mobile)
- User avatar and name at top
- Tabbed interface:
  - Profile info
  - Role & Permissions
  - Activity log
  - Downloads history
- Action buttons footer (Save, Cancel)

### Invite Code Management

**Code List View:**
- Table or card grid showing:
  - Code value (monospace, copy button)
  - Assigned role
  - Created date
  - Used/Unused status
  - Redeemed by (if used)
  - Expiration date
- Generate new code button (prominent, top-right)
- Bulk operations (Delete unused, Export list)

**Code Generation Modal:**
- Simple centered modal (max-w-lg)
- Select role dropdown
- Optional expiration date picker
- Generate button
- Display generated code with copy functionality
- Success state with animation

### File Management Interface

**File Grid/List:**
- Toggle view (grid/list) in header
- Grid view: Cards with file preview, name, size, upload date
- List view: Table with columns for all metadata
- Upload area at top (drag-drop zone with dashed border)
- Each file entry shows:
  - File type icon
  - Name (editable inline)
  - Size and format
  - Upload date
  - Role access restrictions
  - Download count
  - Actions (Edit, Delete, Download)

**File Upload Modal:**
- Drag-drop zone (large, centered)
- Or click to browse
- Progress bar during upload
- Role access selection checkboxes
- Description field
- Version number input

## Form Elements

**Standard Inputs:**
- Full width within containers
- Label above input (text-sm, medium)
- Input height: h-12
- Border with subtle radius
- Focus state with ring
- Helper text below (text-xs)
- Error states with message

**Buttons:**
- Primary: Solid fill, medium weight text, h-12, rounded
- Secondary: Outlined, same height
- Destructive: Distinct treatment for delete actions
- Icon buttons: Square, h-10 w-10 for table actions

**Select Dropdowns:**
- Match input styling
- Custom arrow icon
- Dropdown menu with elevation
- Search for long lists

**Role Badges:**
- Compact pill shape
- Icon + text
- Different visual treatment per role (Admin, Moderator, Customer)
- Used inline in tables and headers

## Data Display

**Tables:**
- Header row with medium weight text
- Zebra striping for long tables
- Cell padding: px-4 py-3
- Sortable columns with arrow indicators
- Row actions always visible on mobile, hover-reveal on desktop
- Empty states with helpful illustration and CTA

**Cards:**
- Elevation for depth
- Padding: p-6
- Rounded corners (rounded-lg)
- Header section with title and optional actions
- Content section with appropriate spacing
- Footer section for actions when needed

**Status Indicators:**
- Dot indicators for online/offline
- Badge pills for states (Active, Pending, Banned)
- Progress bars for uploads/downloads
- Loading spinners for async operations

## Responsive Behavior

**Breakpoints:**
- Mobile first approach
- md: 768px (sidebar collapses to hamburger)
- lg: 1024px (full sidebar visible)
- xl: 1280px (optimal dashboard layout)

**Mobile Adaptations:**
- Hamburger menu for navigation
- Single column layouts
- Touch-friendly hit areas (min 44px)
- Tables convert to stacked cards
- Modals become full-screen on mobile
- Floating action button for primary actions

## Animations

**Use Sparingly:**
- Modal/panel slide-in transitions (300ms)
- Hover state transitions (150ms)
- Success confirmation micro-animations
- Loading state skeletons
- No page transition effects
- No scroll-triggered animations

## Images

**No large hero images required** - this is a utility dashboard application.

**Icons:**
- Use Heroicons for all interface icons
- Consistent size: w-5 h-5 for navigation, w-6 h-6 for cards
- File type icons in download cards
- User avatars (circular, default to initials if no image)

**Illustrations:**
- Empty states only: Simple, minimal illustrations
- Error states: Friendly but professional
- Success confirmations: Subtle icon animations
# Frontend Redesign Brief - AWS Config Drift Detector

## 🎯 Project Overview

You are redesigning the frontend UI/UX for an AWS Config Drift Detection system. This is a production tool that monitors AWS resources (EC2 instances, Security Groups) for configuration changes, detects drift from a baseline, and alerts teams via Slack.

**Current Status**: The system is fully functional with a basic UI deployed at https://config-drift-detector.vercel.app/

**Your Mission**: Transform the basic functional UI into a modern, polished, professional AWS-style dashboard that DevOps teams will love using.

---

## 📋 CRITICAL FIRST STEPS

### Before You Start Designing, You MUST:

1. **Read CLAUDE.md** - Contains essential rules about documentation and workflow
   - Location: `/CLAUDE.md`
   - This file explains how to work on this project properly

2. **Read the documentation to understand the system**:
   - `/README.md` - Project overview and features
   - `/docs/architecture.md` - System architecture and data flow
   - `/memory-bank/project-goals.md` - Vision and success criteria
   - `/memory-bank/progress.md` - Current deployment status

3. **Explore the current codebase**:
   - `/frontend/src/app/` - Current page implementations
   - `/frontend/src/components/` - Current components
   - `/frontend/src/lib/` - Utility functions and Supabase client

4. **Understand the data model**:
   - `/docs/api.md` - Supabase schema and data structures
   - `/backend/src/shared/types.ts` - TypeScript type definitions

**Why this matters**: The documentation contains critical context about how the system works, what data is available, and architectural constraints you must work within.

---

## 🎨 Design Requirements

### Design Philosophy

Create a dashboard that feels like:
- **AWS Console** - Professional, enterprise-grade, trustworthy
- **Modern SaaS** - Clean, minimalist, uncluttered
- **DevOps Tool** - Information-dense but scannable, action-oriented

### Visual Identity

#### Color Palette - Modern AWS-Inspired

**Primary Brand Colors:**
- AWS Orange: `#FF9900` (primary accent, CTAs, highlights)
- AWS Blue: `#232F3E` (primary dark, headers, navigation)
- Cloud Blue: `#4A90E2` (secondary accent, info states)

**Semantic Colors:**
- Critical: `#E53E3E` (bright red for critical drift)
- High: `#DD6B20` (orange for high severity)
- Medium: `#ECC94B` (amber for medium severity)
- Low: `#48BB78` (green for low severity)
- Success: `#38A169` (green for success states)
- Info: `#4299E1` (blue for informational)

**Neutral Palette (Light Mode):**
- Background: `#F7FAFC` (off-white)
- Surface: `#FFFFFF` (white)
- Surface Elevated: `#FFFFFF` with shadow
- Border: `#E2E8F0` (light gray)
- Text Primary: `#1A202C` (almost black)
- Text Secondary: `#718096` (medium gray)
- Text Tertiary: `#A0AEC0` (light gray)

**Neutral Palette (Dark Mode):**
- Background: `#0F1419` (deep dark blue)
- Surface: `#1A202C` (dark gray-blue)
- Surface Elevated: `#2D3748` (lighter gray-blue)
- Border: `#2D3748` (dark border)
- Text Primary: `#F7FAFC` (off-white)
- Text Secondary: `#CBD5E0` (light gray)
- Text Tertiary: `#718096` (medium gray)

#### Typography

- **Headings**: Inter (900, 700, 600 weights)
- **Body**: Inter (400, 500 weights)
- **Monospace**: JetBrains Mono (for IDs, timestamps, JSON)

#### Spacing System

Use consistent 4px base unit:
- `xs: 4px`, `sm: 8px`, `md: 16px`, `lg: 24px`, `xl: 32px`, `2xl: 48px`

#### Components Style

- **Cards**: Subtle shadow, rounded corners (8px), clean borders
- **Buttons**: Rounded (6px), clear hover states, loading states
- **Tables**: Alternating row colors, hover states, sortable headers
- **Badges**: Pill-shaped, solid backgrounds for severity, clear contrast
- **Icons**: Use Lucide React icons (consistent with AWS style)

---

## 🏗️ Pages & Components to Redesign

### 1. Dashboard Page (`/`)

**Current State**: Basic summary cards and a simple table

**Redesign Goals**:
- Hero section with real-time drift overview
- Summary metrics in visually appealing cards with icons
- Recent drifts with severity indicators
- Quick actions (refresh baseline, acknowledge all, etc.)
- Auto-refresh indicator showing countdown to next poll

**Key Metrics to Display**:
- Total drifts detected (all time)
- Unacknowledged drifts by severity (CRITICAL, HIGH, MEDIUM, LOW)
- Last snapshot timestamp
- Last baseline timestamp
- Next scheduled snapshot countdown

**Visual Enhancements**:
- Use AWS-style metric cards with icon, number, label, and trend indicator
- Add sparkline charts for drift trends over time
- Color-code severity with the defined palette
- Add smooth transitions and hover effects
- Include empty states with helpful messaging

### 2. Drifts Page (`/drifts`)

**Current State**: Basic filterable table

**Redesign Goals**:
- Advanced filtering UI (severity, resource type, date range, change type)
- Sortable columns with clear indicators
- Expandable rows showing diff details
- Bulk actions (acknowledge multiple, export to CSV)
- Pagination or infinite scroll
- Search functionality

**Table Enhancements**:
- Add resource type icons (EC2 instance icon, security group shield, etc.)
- Color-coded severity badges
- Timestamp relative formatting ("2 hours ago") with hover for absolute time
- Diff viewer with syntax highlighting for JSON
- Action buttons (view details, acknowledge, ignore)

**Filters Panel**:
- Collapsible sidebar or top bar with filter chips
- Date range picker
- Multi-select dropdowns for severity and resource type
- "Apply" and "Clear all" buttons
- Show active filter count

### 3. Baselines Page (`/baselines`)

**Current State**: Simple info display and resource breakdown table

**Redesign Goals**:
- Visual baseline metadata card
- Resource breakdown with icons and counts
- "Set new baseline" action button
- Baseline history (if we add this feature)
- JSON viewer for full baseline with syntax highlighting

**Visual Enhancements**:
- Use timeline UI for baseline history
- Resource type icons next to counts
- Add "last updated" indicator
- Include actions: "Update baseline", "Download JSON", "View changes"

---

## 🔧 Required Features

### Theme Switcher

**Requirement**: Add a theme toggle (Light/Dark mode) with system preference detection

**Implementation Details**:
- Toggle button in the top navigation bar (sun/moon icon)
- Use Next.js `next-themes` package for theme management
- Persist user preference in localStorage
- Smooth transition animations between themes
- Auto-detect system preference on first visit
- Both light and dark modes must be fully designed and polished

**UI Placement**: Top-right corner of navigation bar

### Navigation

**Current State**: Basic links

**Redesign Goals**:
- Sticky top navigation bar with AWS-style logo area
- Clear active state indicators
- Responsive mobile menu (hamburger)
- User profile placeholder (future: auth)
- Real-time status indicator (green dot if system is healthy)

**Navigation Items**:
- Dashboard (Home icon)
- Drifts (Alert icon)
- Baselines (Database icon)
- Settings (future - Gear icon)

### AWS Branding

**Logo Usage**:
- Create an AWS-inspired logo for the app (do NOT use actual AWS logo - create a similar style)
- Logo should suggest: monitoring, drift, configuration, cloud
- Suggested name display: "AWS Config Drift Detector" or "Config Guardian"
- Use AWS color palette (orange + dark blue)
- Include small AWS cloud iconography reference (but DO NOT copy AWS trademarked logos exactly)

**Logo Placement**:
- Top-left of navigation bar
- Larger version in empty states
- Favicon (create a simple icon version)

**Legal Note**: You can draw inspiration from AWS design language, but do not use actual AWS trademarked logos or copyrighted assets. Create original designs that have a similar professional aesthetic.

---

## 🎯 Key UX Improvements

### 1. Loading States
- Skeleton loaders for tables and cards (no spinners)
- Smooth fade-in animations when data loads
- Optimistic UI updates where possible

### 2. Empty States
- Friendly illustrations or icons
- Clear messaging: "No drifts detected yet"
- Helpful actions: "Take your first snapshot" button (even if not functional yet)

### 3. Error States
- Toast notifications for errors (top-right)
- Inline error messages in forms
- Retry buttons with exponential backoff

### 4. Real-time Updates
- Visual indicator showing "Refreshing..." during poll
- Smooth list animations when new drifts appear
- Timestamp showing "Updated 3 seconds ago"

### 5. Accessibility
- ARIA labels on all interactive elements
- Keyboard navigation support (Tab, Enter, Escape)
- Focus indicators with proper contrast
- Screen reader friendly (test with VoiceOver/NVDA)

### 6. Responsive Design
- Mobile-first approach
- Breakpoints: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`
- Touch-friendly tap targets (44x44px minimum)
- Collapsible filters/sidebar on mobile

### 7. Microinteractions
- Button hover/active states
- Card hover lift effect (subtle)
- Smooth page transitions
- Badge pulse animation for new drifts
- Success checkmark animations

---

## 🛠️ Technical Implementation

### Tech Stack (Do Not Change)
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Database**: Supabase (already configured)
- **Deployment**: Vercel

### Component Library Considerations

You can use:
- **Headless UI** by Tailwind Labs (for accessible components)
- **Radix UI** (for accessible primitives)
- **Tailwind UI components** (if you have access)

Do NOT use:
- Material UI (doesn't match AWS aesthetic)
- Ant Design (too opinionated)
- Bootstrap (outdated)

### Files You'll Modify

**Pages**:
- `frontend/src/app/page.tsx` (Dashboard)
- `frontend/src/app/drifts/page.tsx` (Drifts table)
- `frontend/src/app/baselines/page.tsx` (Baselines)
- `frontend/src/app/layout.tsx` (Root layout with navigation)

**New Components** (create in `frontend/src/components/`):
- `navigation.tsx` - Top nav bar with theme switcher
- `metric-card.tsx` - Reusable metric display card
- `drift-table.tsx` - Enhanced table with filters (upgrade existing)
- `severity-badge.tsx` - Styled severity indicator
- `diff-viewer.tsx` - JSON diff display
- `empty-state.tsx` - Reusable empty state component
- `loading-skeleton.tsx` - Skeleton loader components
- `theme-toggle.tsx` - Light/dark mode switcher

**Styling**:
- `frontend/src/styles/globals.css` - Add theme CSS variables
- `frontend/tailwind.config.ts` - Extend with custom colors

**New Dependencies** (add to `frontend/package.json`):
- `next-themes` - Theme management
- `@headlessui/react` or `@radix-ui/react-*` - Accessible components
- `lucide-react` - Icons (if not already installed)
- `date-fns` - Date formatting

---

## 📊 Data You Have Access To

### Drift Event Object
```typescript
{
  id: string
  account_id: string
  resource_id: string
  resource_type: 'EC2' | 'SecurityGroup'
  change_type: 'ADDED' | 'REMOVED' | 'MODIFIED'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  detected_at: string (ISO timestamp)
  acknowledged: boolean
  previous_state: object | null
  current_state: object | null
}
```

### Baseline Object
```typescript
{
  id: string
  account_id: string
  created_at: string
  snapshot: {
    accountId: string
    region: string
    timestamp: string
    resources: Array<{
      type: 'EC2' | 'SecurityGroup'
      id: string
      // ... other AWS resource properties
    }>
  }
}
```

### Supabase Client Usage
```typescript
// In components
import { supabase } from '@/lib/supabase-client'

// Fetch drifts with filters
const { data, error } = await supabase
  .from('drift_events')
  .select('*')
  .eq('severity', 'CRITICAL')
  .order('detected_at', { ascending: false })
```

---

## ✅ Acceptance Criteria

Your redesign is complete when:

1. **Visual Design**:
   - [ ] All pages have a cohesive AWS-inspired design
   - [ ] Light and dark themes are fully implemented
   - [ ] Colors follow the defined palette
   - [ ] Typography is consistent and readable
   - [ ] Spacing is consistent using the 4px system

2. **Functionality**:
   - [ ] Theme switcher works and persists preference
   - [ ] All existing features still work (no regressions)
   - [ ] Filters and sorting work correctly
   - [ ] Mobile responsive on all screen sizes
   - [ ] Loading states show during data fetches
   - [ ] Empty states show when no data exists

3. **UX**:
   - [ ] Navigation is intuitive and accessible
   - [ ] Interactions are smooth with animations
   - [ ] Error states are handled gracefully
   - [ ] Hover states and focus indicators are clear
   - [ ] Auto-refresh works and is visually indicated

4. **Code Quality**:
   - [ ] TypeScript compiles with no errors
   - [ ] No console warnings or errors
   - [ ] Components are reusable and well-organized
   - [ ] Tailwind classes are used efficiently (no inline styles)
   - [ ] Code follows existing patterns in the codebase

5. **Documentation**:
   - [ ] Update `/docs/frontend-design.md` with design decisions
   - [ ] Update `/memory-bank/decisions.log.md` with ADRs
   - [ ] Update `/memory-bank/progress.md` with completed redesign
   - [ ] Add component documentation in code comments

---

## 🚀 Suggested Implementation Order

### Phase 1: Foundation (Day 1)
1. Read all documentation (CLAUDE.md, README, architecture docs)
2. Explore current codebase and understand data flow
3. Set up theme switcher infrastructure (next-themes)
4. Define Tailwind theme extensions (colors, spacing)
5. Create reusable component library (badges, cards, buttons)

### Phase 2: Navigation & Layout (Day 1-2)
1. Redesign navigation bar with theme toggle
2. Update layout.tsx with new navigation
3. Create logo/branding
4. Implement responsive mobile menu

### Phase 3: Dashboard Page (Day 2-3)
1. Redesign metric cards with icons
2. Add recent drifts section
3. Implement loading and empty states
4. Add auto-refresh indicator

### Phase 4: Drifts Page (Day 3-4)
1. Enhance table with better styling
2. Add filters panel with multi-select
3. Implement expandable rows with diff viewer
4. Add pagination or infinite scroll

### Phase 5: Baselines Page (Day 4)
1. Redesign baseline info cards
2. Add resource breakdown with icons
3. Implement JSON viewer with syntax highlighting

### Phase 6: Polish & Testing (Day 5)
1. Add microinteractions and animations
2. Test responsive design on multiple devices
3. Test accessibility with keyboard and screen readers
4. Fix any bugs or visual inconsistencies
5. Update documentation

---

## 💡 Inspiration & References

**Design Inspiration**:
- AWS Console (console.aws.amazon.com)
- Datadog Dashboard (https://app.datadoghq.com)
- Vercel Dashboard (vercel.com/dashboard)
- Linear App (linear.app)
- Stripe Dashboard (dashboard.stripe.com)

**AWS Design Language**:
- Study AWS Cloudscape Design System (but don't use it directly - too complex)
- AWS Console's clean, information-dense layouts
- Professional, enterprise-grade feel

**Color Palette Tools**:
- Use the defined color palette above
- Test contrast ratios with WebAIM Contrast Checker
- Ensure WCAG AA compliance minimum

---

## 🎓 Learning Resources

If you need help with:
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Next.js App Router**: https://nextjs.org/docs/app
- **Headless UI**: https://headlessui.com/
- **Radix UI**: https://www.radix-ui.com/
- **next-themes**: https://github.com/pacocoursey/next-themes
- **Lucide Icons**: https://lucide.dev/

---

## ⚠️ Important Reminders

1. **Read CLAUDE.md first** - It contains critical workflow rules
2. **Read all documentation** - Don't guess how things work
3. **Test on multiple devices** - Ensure responsive design works
4. **Update documentation** - After making changes, update docs
5. **Commit frequently** - Make atomic commits with clear messages
6. **No secrets in code** - Keep all env vars in .env.local
7. **Follow accessibility standards** - This is a professional tool
8. **Dark mode is not optional** - Both themes must be fully designed

---

## 📝 Deliverables

When you're done, the project should have:

1. **Redesigned Frontend**:
   - All pages redesigned with new UI
   - Theme switcher working
   - Responsive on all devices
   - Accessible and polished

2. **Updated Documentation**:
   - `/docs/frontend-design.md` - Design decisions and component guide
   - `/memory-bank/decisions.log.md` - ADRs for design choices
   - `/memory-bank/progress.md` - Updated with redesign completion
   - Component documentation in code

3. **Updated Dependencies**:
   - `package.json` with new dependencies
   - `package-lock.json` committed

4. **Git Commits**:
   - Clear, atomic commits throughout
   - No co-authored-by lines
   - Documentation updates committed with code

---

## 🤝 Questions?

If you're unsure about anything:
1. Check the documentation first
2. Look for similar patterns in existing code
3. Ask the user for clarification if truly ambiguous

**Remember**: This is a production tool for DevOps teams. Quality, polish, and professionalism matter. Take your time, read the docs, and create something beautiful.

Good luck! 🚀

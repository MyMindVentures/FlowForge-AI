# FlowForge AI Feature List

This list reflects the current app surface in the codebase, grouped by product area. It includes routed features, embedded capabilities, admin/internal tools, and the new feedback loop.

## 1. Access And Onboarding

### Implemented
- Splash screen
- Authentication screen
- Email and password login
- Magic-link login
- One-time code login
- OAuth login via Google, GitHub, and Microsoft/Azure
- Default login profile quick-picks
- Storytelling onboarding flow
- Onboarding setup flow
- Role selection
- Role-based access control for Architect, Builder, and Admin

### Planned Or Partial
- MFA enrollment and challenge flows
- SMS auth fallback
- WebAuthn support
- SAML SSO
- Device trust and enterprise session controls

## 2. Global App Navigation

### Implemented
- Projects dashboard
- Workspace shortcut to the active project
- Alerts and notifications area
- AI agents area
- User settings
- Admin area for admins only

## 3. Project Management

### Implemented
- Projects grid view
- Project search
- Project status filtering
- Create project flow
- Edit project flow
- Duplicate project flow
- Archive project flow
- Delete project flow
- Favorite project toggle
- Auto-selection of the FlowForge AI system project for admins
- Project workspace hub
- Project settings
- Project metadata editing
- Project members management
- GitHub repository linking in project settings

## 4. Workspace Modules

### Implemented
- AI ideation module
- Knowledge base module
- Project roadmap module
- App architecture module
- Feature backlog module
- Asset library module
- Marketing kit module
- Project settings module

## 5. Feature Ideation And Backlog

### Implemented
- AI ideation chat
- Suggestion generation for new features
- Save suggested feature into backlog
- Backlog listing
- Backlog search
- Backlog status grouping and filtering
- Create new feature from backlog
- Navigate from backlog to ideation and feature detail

### Planned Or Partial
- Stronger guided progression from ideation to implementation
- More automated AI orchestration between ideation stages

## 6. Feature Detail And Delivery Flow

### Implemented
- Feature detail screen
- Feature overview editing
- Concept thinker section
- Builder brief section
- Coding prompt generation surface
- UI design prompt generation surface
- Discussion/comments section
- Audit section
- Visuals section
- UI architecture linkage section
- Open feature chat from feature detail
- Update feature status
- Feature lock and unlock
- Feature archive flow
- Inline feature editing
- Copy content to clipboard helpers
- AI-assisted field generation
- UI impact analysis generation
- Feature integrity status tracking

### Embedded Collaboration Capabilities
- Role-typed comments
- Comment types for questions, decisions, and definitions
- Feature audit history

## 7. Feature Chat

### Implemented
- Feature-specific AI chat
- Ideation-mode AI chat for creating new features
- Save AI suggestions into backlog
- Back navigation between feature chat and feature detail

## 8. Roadmap And Versioning

### Implemented
- Roadmap screen
- Version creation
- Version editing
- Feature-to-version linking
- Release planning structure
- Version goals and date ranges

## 9. Knowledge And Documentation

### Implemented
- Project knowledge base
- Manual documentation view
- AI-generated documentation view
- App vision storage
- PRD-style project documentation
- Technical architecture notes
- UX strategy notes

### Planned Or Partial
- Richer project-level PRD automation across the full product lifecycle

## 10. Marketing Support

### Implemented
- Marketing kit screen
- AI-generated taglines
- AI-generated value propositions
- AI-generated pitch narrative
- Marketing copy generation support

## 11. UI Architecture And Design System

### Implemented
- UI architecture screen
- UI pages registry
- UI components registry
- UI layouts registry
- Style system management
- Page-to-feature relationships
- Component-to-feature relationships
- Layout configuration support
- Style system visualization support
- Integrity tracking for pages, components, and layouts

### Planned Or Partial
- Deeper page detail flows across pages, components, and layouts
- Stronger style-system-to-implementation linkage

## 12. Asset Management

### Implemented
- Asset library screen
- Add asset flow
- Delete asset flow
- Asset tagging
- AI-generated tags
- Link assets to features

## 13. Notifications

### Implemented
- Notifications screen
- Notification list UI
- Time-based notification display

### Planned Or Partial
- Full persistence and user notification preferences workflow

## 14. User Settings

### Implemented
- Profile summary card
- Role display
- Role change entry point
- Theme display
- Default AI model display
- In-app feedback submission panel
- Attach current project context to feedback
- Recent feedback submissions list for the current user

## 15. Feedback Loop

### Implemented
- Persistent feedback storage in Supabase
- Feedback categories: bug, feature, UX, and other
- Feedback subject and detail capture
- Optional project-linked feedback context
- Recent-submissions history for the current user
- Audit log entry on feedback submission
- Admin feedback inbox
- Admin feedback filtering by status
- Admin status transitions: new, reviewed, planned, resolved

## 16. AI Agents And AI Governance

### Implemented
- AI agents screen
- Agent action placeholders and launch controls
- Model routing screen in admin
- Prompt templates screen in admin
- LLM functions management
- Enable and disable LLM functions
- Create and edit LLM functions
- Delete LLM functions
- Test LLM functions
- API key management screen
- AI usage log screen
- AI error log screen
- Project-level AI function collection
- Global admin AI function collection
- Audit tracking for AI operations

### Backend And Service Capabilities
- Task-based AI function routing
- Retry and fallback handling
- Token and latency logging
- Error capture for AI calls

## 17. Admin Control Center

### Implemented
- Admin-only route guard
- Admin overview dashboard
- Full PRD view
- Tasklist view
- Audit findings view
- Readiness checks view
- Model routing view
- Prompt templates view
- Functions view
- API keys view
- System audit logs view
- Feedback inbox view
- Scan code action
- Sync-to-database action
- Production readiness test action
- FlowForge AI project auto-selection for admin workflow

### Planned Or Partial
- Deeper command-center automation and predictive operational insights

## 18. Sync, Integrity, And Audit

### Implemented
- Realtime data subscriptions via Supabase abstraction
- Sync status indicator in layout
- Online, syncing, synced, offline, and error states
- Codebase sync analysis
- Reverse sync from codebase manifest to database model
- Integrity status tracking across entities
- Audit logging across auth, project, feature, AI, and feedback events
- Project-scoped audit logs
- Global admin audit logs
- Readiness checks and findings persistence

### Planned Or Partial
- Fully dynamic codebase scanning instead of manifest-driven heuristics
- More accurate sync-state detection against actual code changes

## 19. Data And Access Foundations

### Implemented
- Supabase-backed auth integration
- Supabase-backed realtime data access
- Row-level security model across project data
- Project access checks
- Admin checks
- Current app user resolution
- Multi-collection CRUD abstraction for app entities

## 20. Summary By Status

### Routed User-Facing Features
- Splash
- Auth
- Storytelling
- Onboarding
- Role Selection
- Projects Dashboard
- Workspace Hub
- Ideation
- Backlog
- Feature Detail
- Feature Chat
- Roadmap
- Knowledge Base
- Marketing Kit
- Asset Library
- Project Settings
- UI Architecture
- Notifications
- AI Agents
- Settings
- Admin

### Embedded Or Internal Features
- Feature locking
- Feature archiving
- Comments and collaboration metadata
- Audit findings
- Readiness checks
- LLM function governance
- Prompt template management
- Usage and error logs
- Feedback inbox triage
- Sync and integrity analysis

### Planned Or Incomplete Areas
- Enterprise auth hardening
- Dynamic codebase scanning
- Stronger ideation-to-build orchestration
- Richer page and layout detail flows
- More advanced admin command-center automation

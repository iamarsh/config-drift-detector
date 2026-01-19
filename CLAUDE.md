# Claude AI Assistant Guidelines

This document contains rules and guidelines for AI assistants working on this project.

## Core Rules

### 1. Always Read Documentation First

Before making ANY changes to the codebase, you MUST:

1. **Read the project README** at `/README.md` to understand the project structure and goals
2. **Read the memory bank** files to understand project context:
   - `/memory-bank/project-goals.md` - Vision and success criteria
   - `/memory-bank/architecture.md` - System architecture and design decisions
   - `/memory-bank/progress.md` - Current status, completed tasks, and pending work
   - `/memory-bank/decisions.log.md` - Architectural Decision Records (ADRs)
3. **Read relevant documentation** in `/docs/`:
   - `architecture.md` - System diagrams and component interactions
   - `setup.md` - Local development setup
   - `deployment.md` - Production deployment guide
   - `api.md` - Supabase schema and Lambda APIs
4. **Read the plan file** if one exists at `~/.claude/plans/` to understand the current implementation strategy

**Why this matters**: The documentation contains critical context about:
- Design decisions and why they were made
- Known issues and their solutions
- Deployment configurations and credentials structure
- Testing requirements and patterns

### 2. Always Update Documentation After Changes

After making ANY significant change to the codebase, you MUST update the relevant documentation:

1. **Update memory-bank files**:
   - Add new decisions to `decisions.log.md` with ADR format
   - Update `progress.md` with completed tasks and new pending items
   - Update `architecture.md` if architectural patterns change

2. **Update docs/** if:
   - API endpoints or database schema change → Update `api.md`
   - Deployment process changes → Update `deployment.md`
   - New setup steps required → Update `setup.md`
   - Architecture changes → Update `architecture.md`

3. **Update README.md** if:
   - New features are added
   - Installation steps change
   - Project goals or scope change

**Commit changes together**: When you update documentation, commit those changes along with the code changes in the same commit. Documentation is code.

### 3. Git Commit Guidelines

- **Never add co-authored-by lines**: Do not add "Co-Authored-By: Claude <noreply@anthropic.com>" to commits
- **Write clear commit messages**: Follow the format `type: description`
  - Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `style`, `perf`
  - Example: `feat: add dark mode toggle to dashboard`
- **Commit early and often**: Make atomic commits that represent a single logical change
- **Include documentation changes**: Always commit documentation updates with code changes

### 4. Code Quality Standards

- **TypeScript strict mode**: All code must compile with `strict: true`
- **No security vulnerabilities**: Check for SQL injection, XSS, CSRF, command injection, etc.
- **Error handling**: Always handle errors gracefully with proper logging
- **Testing**: Write tests for new features and bug fixes
- **No placeholder values**: Never commit actual secrets or credentials

### 5. Environment Variables

- **Never commit secrets**: All secrets go in `.env.local` (which is gitignored)
- **Update .env.example**: When adding new env vars, update `.env.example` with placeholders
- **Document in setup.md**: Add instructions for obtaining the env var value

### 6. Frontend Development Rules

- **Read existing components**: Before creating new components, check if similar ones exist
- **Follow existing patterns**: Match the code style, file structure, and naming conventions
- **Accessibility**: Use semantic HTML, ARIA labels, and keyboard navigation
- **Responsive design**: All UI must work on mobile, tablet, and desktop
- **Performance**: Optimize images, use lazy loading, minimize bundle size

### 7. Backend Development Rules

- **AWS SDK v3**: Always use the modular AWS SDK v3 (not v2)
- **Structured logging**: Use Pino logger, never console.log in Lambda functions
- **IAM least privilege**: Request minimal permissions needed
- **Idempotency**: Lambda functions should be idempotent when possible
- **Timeout handling**: Set appropriate timeouts and handle them gracefully

### 8. Deployment Rules

- **Test locally first**: Always test changes locally before deploying
- **Review GitHub Actions logs**: Check CI/CD output for errors
- **Incremental deployments**: Deploy backend and frontend separately
- **Monitor after deploy**: Check CloudWatch Logs and Vercel logs after deployment

## Project-Specific Context

### Technology Stack
- **Backend**: Node.js 20.x, TypeScript, AWS Lambda, Serverless Framework
- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Storage**: AWS S3
- **CI/CD**: GitHub Actions, Vercel
- **Monitoring**: CloudWatch Logs, Pino structured logging

### Key Files to Know
- `backend/serverless.yml` - Lambda deployment configuration
- `backend/src/shared/types.ts` - Core TypeScript types
- `backend/src/shared/utils.ts` - Drift computation logic
- `frontend/src/lib/supabase-client.ts` - Database client
- `.github/workflows/` - CI/CD pipelines

### Current System State
- **Status**: Production deployment complete
- **Backend**: 3 Lambda functions running on EventBridge schedules
- **Frontend**: Live at https://config-drift-detector.vercel.app/
- **Next Phase**: UI redesign and UX improvements

## Questions Before Proceeding

If you're unsure about:
1. **Architecture decisions** → Read `memory-bank/decisions.log.md` and `docs/architecture.md`
2. **How to implement a feature** → Read existing code patterns in the same module
3. **Deployment issues** → Read `docs/deployment.md` and check GitHub Actions logs
4. **User requirements** → Ask the user for clarification

## Emergency Contacts

If something is broken in production:
1. Check CloudWatch Logs: `/aws/lambda/config-drift-detector-prod-*`
2. Check Vercel deployment logs
3. Review recent commits for changes
4. Check memory-bank/progress.md for known issues

---

**Remember**: Documentation is your friend. Read first, code second, update docs third.

# AI Rules for Bioflux.ai Development

## Tech Stack Overview

- **React 18** with TypeScript for the frontend framework
- **Vite** as the build tool and development server
- **Supabase** as the backend (database, auth, storage)
- **Tailwind CSS** for styling and design system
- **React Router** for client-side routing and navigation
- **React Query (TanStack Query)** for server state management and caching
- **shadcn/ui** component library built on Radix UI primitives
- **Framer Motion** for animations and transitions
- **Lucide React** for consistent iconography

## Library Usage Rules

### State Management
- **Use React Query** for all server state (API calls, Supabase queries)
- **Use React State** for local component state
- **Use Context API** for global app state (auth, theme)
- **Avoid Redux/Zustand** - not needed for this app's complexity

### UI Components
- **Always use shadcn/ui components** as the base (Button, Card, Input, etc.)
- **Customize with Tailwind classes** for styling variants
- **Use Radix UI primitives** only when creating new components
- **Follow existing component patterns** in the codebase

### Styling
- **Use Tailwind CSS classes** for all styling needs
- **Follow the existing color scheme** (black/dark backgrounds, cyan/orange/green accents)
- **Use responsive design** with Tailwind's responsive prefixes (sm:, md:, lg:)
- **Avoid inline styles** and CSS-in-JS libraries

### Forms & Validation
- **Use React Hook Form** for complex forms with validation
- **Use Zod schemas** for type-safe validation
- **Leverage shadcn/ui form components** (Form, FormField, etc.)
- **Keep form state local** to components unless global sharing is needed

### Data Fetching
- **Use React Query hooks** for all Supabase operations
- **Implement proper error handling** with try-catch blocks
- **Use optimistic updates** for better UX where appropriate
- **Cache data appropriately** using React Query's caching mechanisms

### Authentication
- **Use the existing AuthContext** for all auth operations
- **Leverage Supabase Auth** for user management
- **Protect routes** using ProtectedRoute and ProtectedClientRoute components
- **Handle auth state changes** gracefully with proper loading states

### File Organization
- **Keep components in src/components/** - one file per component
- **Pages go in src/pages/** for route-level components
- **Hooks go in src/hooks/** for reusable logic
- **Types go in src/types/** for TypeScript interfaces
- **Follow the existing folder structure** and naming conventions

### Performance
- **Use React.memo** for expensive components that don't need to re-render
- **Implement proper loading states** for all async operations
- **Lazy load routes** if the app grows significantly
- **Optimize images** and use appropriate formats

### Code Quality
- **Use TypeScript** for all new code - maintain type safety
- **Follow existing code patterns** and conventions
- **Write clear, descriptive variable and function names**
- **Add comments** for complex logic but keep code self-documenting

### Testing
- **Write unit tests** for complex utility functions
- **Test components** that contain business logic
- **Use React Testing Library** for component testing
- **Focus on user behavior** rather than implementation details

## Development Workflow

1. **Create feature branches** from main for new features
2. **Write components** following the established patterns
3. **Test thoroughly** before submitting PRs
4. **Use meaningful commit messages**
5. **Keep PRs focused** and reasonably sized
6. **Request code reviews** for significant changes

## Supabase Integration Rules

- **Use the Supabase client** from src/integrations/supabase/client
- **Follow RLS policies** - don't bypass security
- **Handle connection errors** gracefully
- **Use type-safe queries** with the generated Database types
- **Optimize queries** to avoid unnecessary data fetching

## Animation & UX Rules

- **Use Framer Motion** for page transitions and micro-interactions
- **Keep animations subtle** and purposeful
- **Respect user preferences** for reduced motion
- **Ensure animations don't hinder accessibility**
- **Use consistent easing** and timing functions

## Security Guidelines

- **Never expose sensitive data** in the frontend
- **Validate all user inputs** on both client and server
- **Use HTTPS** for all API calls
- **Implement proper error boundaries**
- **Keep dependencies updated** and scan for vulnerabilities
# Multi-Tenant Event SaaS Application

A comprehensive multi-tenant event management platform with three user roles: Super Admin, Tenant (Organization), and User (End User/Staff/Attendee).

## Tech Stack

### Frontend
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- Zustand (State Management)
- Light/Dark Theme Support

### Backend
- Node.js
- Express.js
- PostgreSQL
- Prisma ORM
- JWT Authentication
- Stripe Integration

## Project Structure

```
├── backend/          # Express.js API server
├── frontend/         # Next.js application
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. Install all dependencies:
```bash
npm run install:all
```

2. Set up environment variables:
- Copy `.env.example` to `.env` in both `backend/` and `frontend/` directories
- Configure database connection, JWT secrets, and Stripe keys

3. Set up database:
```bash
cd backend
npx prisma migrate dev
npx prisma generate
npm run seed  # Creates a super admin user (admin@example.com / admin123)
```

4. Run development servers:
```bash
npm run dev
```

This will start:
- Backend API on `http://localhost:5000`
- Frontend app on `http://localhost:3000`

## Default Super Admin Credentials

After running the seed script:
- Email: `admin@example.com`
- Password: `admin123`

**Important:** Change these credentials in production!

## Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/event_saas?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV=development
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"
FRONTEND_URL="http://localhost:3000"
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL="http://localhost:5000"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"
```

## User Roles

### Super Admin
- Manage all tenants
- Assign plans & usage limits
- Platform-wide analytics
- Billing management
- Global settings

### Tenant (Organization)
- Manage organization profile
- Create and manage events
- Configure tickets & registrations
- Manage attendees and users
- View reports and billing

### User (End User/Staff/Attendee)
- Register for events
- View event details
- Attend events
- Check-in (if permitted)
- View tickets and submit feedback

## License

MIT

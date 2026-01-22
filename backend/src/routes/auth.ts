import express from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient, UserRole } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, firstName, lastName, tenantId, role } = req.body;

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // If tenantId is provided, verify tenant exists
      if (tenantId) {
        const tenant = await prisma.tenant.findUnique({
          where: { id: tenantId },
        });

        if (!tenant) {
          return res.status(400).json({ error: 'Tenant not found' });
        }
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: role || UserRole.ATTENDEE,
          tenantId: tenantId || null,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          tenantId: true,
        },
      });

      // Generate token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      });

      res.status(201).json({
        user,
        token,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          tenant: true,
        },
      });

      // Check if user exists
      if (!user) {
        return res.status(401).json({ error: 'Account not found. This account may have been deleted.' });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(403).json({ error: 'Your account has been deactivated. Please contact your administrator.' });
      }

      // Check if tenant exists and is active (if user belongs to a tenant)
      if (user.tenantId) {
        if (!user.tenant) {
          return res.status(403).json({ error: 'Your organization account has been deleted. Please contact support.' });
        }
        
        if (user.tenant.status === 'SUSPENDED') {
          return res.status(403).json({ error: 'Your organization account has been suspended. Please contact your administrator or support.' });
        }
        
        if (user.tenant.status === 'INACTIVE') {
          return res.status(403).json({ error: 'Your organization account is inactive. Please contact support.' });
        }
      }

      // Verify password
      const isValid = await comparePassword(password, user.password);

      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      });

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          tenantId: user.tenantId,
          tenant: user.tenant ? {
            id: user.tenant.id,
            name: user.tenant.name,
            slug: user.tenant.slug,
            logo: user.tenant.logo,
            primaryColor: user.tenant.primaryColor,
            secondaryColor: user.tenant.secondaryColor,
          } : null,
        },
        token,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Tenant Registration (creates tenant + admin user)
router.post(
  '/tenant/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('tenantName').trim().notEmpty(),
    body('tenantSlug').trim().matches(/^[a-z0-9-]+$/),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, firstName, lastName, tenantName, tenantSlug, domain } = req.body;

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Check if tenant slug exists
      const existingTenant = await prisma.tenant.findUnique({
        where: { slug: tenantSlug },
      });

      if (existingTenant) {
        return res.status(400).json({ error: 'Organization slug already exists' });
      }

      // Create Stripe customer (optional, can be done later)
      let stripeCustomerId: string | null = null;
      try {
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
          apiVersion: '2023-10-16',
        });
        const customer = await stripe.customers.create({
          email,
          name: tenantName,
          metadata: { tenantSlug },
        });
        stripeCustomerId = customer.id;
      } catch (error) {
        console.error('Stripe customer creation failed:', error);
      }

      // Create tenant
      const tenant = await prisma.tenant.create({
        data: {
          name: tenantName,
          slug: tenantSlug,
          domain,
          planType: 'FREE',
          maxEvents: 10,
          maxUsers: 5,
          maxAttendees: 100,
          stripeCustomerId,
          settings: {
            create: {},
          },
        },
      });

      // Create admin user for tenant
      const hashedPassword = await hashPassword(password);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: UserRole.TENANT_ADMIN,
          tenantId: tenant.id,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          tenantId: true,
        },
      });

      // Generate token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      });

      res.status(201).json({
        user: {
          ...user,
          tenant: {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
          },
        },
        token,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            primaryColor: true,
            secondaryColor: true,
            planType: true,
          },
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        tenantId: true,
        tenant: true,
        createdAt: true,
      },
    });

    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

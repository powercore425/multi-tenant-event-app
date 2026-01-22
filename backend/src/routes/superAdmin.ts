import express from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient, PlanType, TenantStatus } from '@prisma/client';
import { authenticate, requireSuperAdmin, AuthRequest } from '../middleware/auth';
import Stripe from 'stripe';

const router = express.Router();
const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

router.use(authenticate);
router.use(requireSuperAdmin);

// Get all tenants
router.get('/tenants', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { slug: { contains: search as string, mode: 'insensitive' } },
        { domain: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              users: true,
              events: true,
            },
          },
        },
      }),
      prisma.tenant.count({ where }),
    ]);

    res.json({
      tenants,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single tenant
router.get('/tenants/:id', async (req, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.params.id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        },
        settings: true,
        _count: {
          select: {
            events: true,
            users: true,
          },
        },
      },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.json({ tenant });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create tenant
router.post(
  '/tenants',
  [
    body('name').trim().notEmpty(),
    body('slug').trim().matches(/^[a-z0-9-]+$/),
    body('email').isEmail(),
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

      const {
        name,
        slug,
        domain,
        email,
        password,
        firstName,
        lastName,
        planType,
        maxEvents,
        maxUsers,
        maxAttendees,
      } = req.body;

      // Check if slug exists
      const existingTenant = await prisma.tenant.findUnique({
        where: { slug },
      });

      if (existingTenant) {
        return res.status(400).json({ error: 'Slug already exists' });
      }

      // Create Stripe customer
      let stripeCustomerId: string | null = null;
      try {
        const customer = await stripe.customers.create({
          email,
          name,
          metadata: { tenantSlug: slug },
        });
        stripeCustomerId = customer.id;
      } catch (error) {
        console.error('Stripe customer creation failed:', error);
      }

      // Create tenant
      const tenant = await prisma.tenant.create({
        data: {
          name,
          slug,
          domain,
          planType: planType || PlanType.FREE,
          maxEvents: maxEvents || 10,
          maxUsers: maxUsers || 5,
          maxAttendees: maxAttendees || 100,
          stripeCustomerId,
          settings: {
            create: {},
          },
        },
      });

      // Create admin user for tenant
      const { hashPassword } = await import('../utils/password');
      const hashedPassword = await hashPassword(password);

      await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: 'TENANT_ADMIN',
          tenantId: tenant.id,
        },
      });

      res.status(201).json({ tenant });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Update tenant
router.put('/tenants/:id', async (req, res) => {
  try {
    const {
      name,
      domain,
      status,
      planType,
      maxEvents,
      maxUsers,
      maxAttendees,
      primaryColor,
      secondaryColor,
    } = req.body;

    const tenant = await prisma.tenant.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(domain !== undefined && { domain }),
        ...(status && { status }),
        ...(planType && { planType }),
        ...(maxEvents !== undefined && { maxEvents }),
        ...(maxUsers !== undefined && { maxUsers }),
        ...(maxAttendees !== undefined && { maxAttendees }),
        ...(primaryColor && { primaryColor }),
        ...(secondaryColor && { secondaryColor }),
      },
    });

    res.json({ tenant });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Suspend tenant
router.post('/tenants/:id/suspend', async (req, res) => {
  try {
    const tenant = await prisma.tenant.update({
      where: { id: req.params.id },
      data: { status: TenantStatus.SUSPENDED },
    });

    res.json({ tenant });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Activate tenant
router.post('/tenants/:id/activate', async (req, res) => {
  try {
    const tenant = await prisma.tenant.update({
      where: { id: req.params.id },
      data: { status: TenantStatus.ACTIVE },
    });

    res.json({ tenant });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete tenant
router.delete('/tenants/:id', async (req, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.params.id },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Delete Stripe customer if exists
    if (tenant.stripeCustomerId) {
      try {
        await stripe.customers.del(tenant.stripeCustomerId);
      } catch (error) {
        console.error('Stripe customer deletion failed:', error);
      }
    }

    await prisma.tenant.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Tenant deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Platform analytics
router.get('/analytics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where: any = {};
    const registrationWhere: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      registrationWhere.registeredAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
        registrationWhere.registeredAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
        registrationWhere.registeredAt.lte = new Date(endDate as string);
      }
    }

    const [
      totalTenants,
      activeTenants,
      suspendedTenants,
      inactiveTenants,
      totalUsers,
      usersByRole,
      totalEvents,
      eventsByStatus,
      totalRegistrations,
      registrationsByStatus,
      tenantsByPlan,
      tenantsByStatus,
      recentTenants,
      topTenantsByEvents,
      topTenantsByUsers,
    ] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: TenantStatus.ACTIVE } }),
      prisma.tenant.count({ where: { status: TenantStatus.SUSPENDED } }),
      prisma.tenant.count({ where: { status: TenantStatus.INACTIVE } }),
      prisma.user.count({ where: { role: { not: 'SUPER_ADMIN' } } }),
      prisma.user.groupBy({
        by: ['role'],
        where: { role: { not: 'SUPER_ADMIN' } },
        _count: true,
      }),
      prisma.event.count(where),
      prisma.event.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      prisma.registration.count(registrationWhere),
      prisma.registration.groupBy({
        by: ['status'],
        where: registrationWhere,
        _count: true,
      }),
      prisma.tenant.groupBy({
        by: ['planType'],
        _count: true,
      }),
      prisma.tenant.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.tenant.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          planType: true,
          createdAt: true,
          _count: {
            select: {
              users: true,
              events: true,
            },
          },
        },
      }),
      prisma.tenant.findMany({
        take: 5,
        orderBy: {
          events: {
            _count: 'desc',
          },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          planType: true,
          _count: {
            select: {
              events: true,
              users: true,
            },
          },
        },
      }),
      prisma.tenant.findMany({
        take: 5,
        orderBy: {
          users: {
            _count: 'desc',
          },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          planType: true,
          _count: {
            select: {
              users: true,
              events: true,
            },
          },
        },
      }),
    ]);

    res.json({
      totalTenants,
      activeTenants,
      suspendedTenants,
      inactiveTenants,
      totalUsers,
      usersByRole,
      totalEvents,
      eventsByStatus,
      totalRegistrations,
      registrationsByStatus,
      tenantsByPlan,
      tenantsByStatus,
      recentTenants,
      topTenantsByEvents,
      topTenantsByUsers,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get usage logs
router.get('/logs', async (req, res) => {
  try {
    const { page = 1, limit = 50, tenantId, eventType } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (eventType) where.eventType = eventType;

    const [logs, total] = await Promise.all([
      prisma.usageLog.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),
      prisma.usageLog.count({ where }),
    ]);

    res.json({
      logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

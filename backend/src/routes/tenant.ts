import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient, UserRole } from '@prisma/client';
import { authenticate, requireTenantAdmin, requireTenantUser, AuthRequest } from '../middleware/auth';
import { hashPassword } from '../utils/password';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);
router.use(requireTenantUser);

// Get tenant profile (read-only for tenant users, full access for admins)
router.get('/profile', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(403).json({ error: 'No tenant associated' });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: req.user.tenantId },
      include: {
        settings: true,
        _count: {
          select: {
            users: true,
            events: true,
            invoices: true,
          },
        },
      },
    });

    res.json({ tenant });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update tenant profile (admin only)
router.put('/profile', requireTenantAdmin, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(403).json({ error: 'No tenant associated' });
    }

    const {
      name,
      logo,
      primaryColor,
      secondaryColor,
      domain,
      allowPublicEvents,
      requireApproval,
      emailNotifications,
      customDomain,
    } = req.body;

    const tenant = await prisma.tenant.update({
      where: { id: req.user.tenantId },
      data: {
        ...(name && { name }),
        ...(logo !== undefined && { logo }),
        ...(primaryColor && { primaryColor }),
        ...(secondaryColor && { secondaryColor }),
        ...(domain !== undefined && { domain }),
        settings: {
          update: {
            ...(allowPublicEvents !== undefined && { allowPublicEvents }),
            ...(requireApproval !== undefined && { requireApproval }),
            ...(emailNotifications !== undefined && { emailNotifications }),
            ...(customDomain !== undefined && { customDomain }),
          },
        },
      },
      include: {
        settings: true,
      },
    });

    res.json({ tenant });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get tenant users (admin only)
router.get('/users', requireTenantAdmin, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(403).json({ error: 'No tenant associated' });
    }

    const users = await prisma.user.findMany({
      where: { 
        tenantId: req.user.tenantId,
        role: { not: 'TENANT_ADMIN' }, // Exclude tenant admins
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ users });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Invite user (admin only)
router.post(
  '/users',
  requireTenantAdmin,
  [
    body('email').isEmail().normalizeEmail(),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('role').isIn(['TENANT_ADMIN', 'TENANT_USER']),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req: AuthRequest, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.user?.tenantId) {
        return res.status(403).json({ error: 'No tenant associated' });
      }

      const { email, firstName, lastName, role, password } = req.body;

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Check tenant user limit
      const tenant = await prisma.tenant.findUnique({
        where: { id: req.user.tenantId },
      });

      const userCount = await prisma.user.count({
        where: { tenantId: req.user.tenantId },
      });

      if (tenant && userCount >= tenant.maxUsers) {
        return res.status(400).json({ error: 'User limit reached' });
      }

      // Hash the provided password
      const hashedPassword = await hashPassword(password);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role,
          tenantId: req.user.tenantId,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
        },
      });

      res.status(201).json({
        user,
        message: 'User created successfully',
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Update user (admin only)
router.put('/users/:userId', requireTenantAdmin, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(403).json({ error: 'No tenant associated' });
    }

    const { firstName, lastName, role, isActive } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        id: req.params.userId,
        tenantId: req.user.tenantId,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.params.userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(role && { role }),
        ...(isActive !== undefined && { isActive }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    res.json({ user: updatedUser });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user (admin only)
router.delete('/users/:userId', requireTenantAdmin, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(403).json({ error: 'No tenant associated' });
    }

    const user = await prisma.user.findFirst({
      where: {
        id: req.params.userId,
        tenantId: req.user.tenantId,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    await prisma.user.delete({
      where: { id: req.params.userId },
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get tenant analytics
router.get('/analytics', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(403).json({ error: 'No tenant associated' });
    }

    const { startDate, endDate } = req.query;

    // Build where clause for events
    const eventWhere: any = { tenantId: req.user.tenantId };
    
    // Build where clause for registrations (through events)
    const registrationWhere: any = {
      event: {
        tenantId: req.user.tenantId,
      },
    };

    if (startDate || endDate) {
      registrationWhere.registeredAt = {};
      if (startDate) registrationWhere.registeredAt.gte = new Date(startDate as string);
      if (endDate) registrationWhere.registeredAt.lte = new Date(endDate as string);
    }

    const [
      totalEvents,
      publishedEvents,
      totalRegistrations,
      totalAttendees,
      totalRevenue,
      eventsByStatus,
    ] = await Promise.all([
      prisma.event.count({ where: eventWhere }),
      prisma.event.count({
        where: { ...eventWhere, status: 'PUBLISHED' },
      }),
      prisma.registration.count({ where: registrationWhere }),
      prisma.registration.count({
        where: {
          ...registrationWhere,
          status: { in: ['CONFIRMED', 'CHECKED_IN'] },
        },
      }),
      prisma.registration.aggregate({
        where: {
          ...registrationWhere,
          paymentStatus: 'paid',
        },
        _sum: {
          amountPaid: true,
        },
      }),
      prisma.event.groupBy({
        by: ['status'],
        where: eventWhere,
        _count: true,
      }),
    ]);

    res.json({
      totalEvents,
      publishedEvents,
      totalRegistrations,
      totalAttendees,
      totalRevenue: totalRevenue._sum.amountPaid || 0,
      eventsByStatus,
    });
  } catch (error: any) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get invoices
router.get('/invoices', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(403).json({ error: 'No tenant associated' });
    }

    const invoices = await prisma.invoice.findMany({
      where: { tenantId: req.user.tenantId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ invoices });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

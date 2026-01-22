import express from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient, EventStatus } from '@prisma/client';
import { authenticate, requireTenantUser, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Public: Get published events
router.get('/public', async (req, res) => {
  try {
    const { tenantSlug, page = 1, limit = 20, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      status: status || 'PUBLISHED',
      isPublic: true,
    };

    if (tenantSlug) {
      const tenant = await prisma.tenant.findUnique({
        where: { slug: tenantSlug as string },
      });
      if (tenant) {
        where.tenantId = tenant.id;
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { startDate: 'asc' },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              primaryColor: true,
            },
          },
          tickets: {
            where: { status: 'AVAILABLE' },
            select: {
              id: true,
              name: true,
              price: true,
              quantity: true,
              sold: true,
            },
          },
          _count: {
            select: {
              registrations: true,
            },
          },
        },
      }),
      prisma.event.count({ where }),
    ]);

    res.json({
      events,
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

// Public: Get single event
router.get('/public/:slug', async (req, res) => {
  try {
    const { tenantSlug } = req.query;

    const where: any = {
      slug: req.params.slug,
      status: 'PUBLISHED',
      isPublic: true,
    };

    if (tenantSlug) {
      const tenant = await prisma.tenant.findUnique({
        where: { slug: tenantSlug as string },
      });
      if (tenant) {
        where.tenantId = tenant.id;
      }
    }

    const event = await prisma.event.findFirst({
      where,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            primaryColor: true,
            secondaryColor: true,
          },
        },
        tickets: {
          where: { status: 'AVAILABLE' },
          orderBy: { price: 'asc' },
        },
        agenda: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            registrations: true,
            feedback: true,
          },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ event });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Protected routes
router.use(authenticate);
router.use(requireTenantUser);

// Get tenant events
router.get('/', async (req: AuthRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(403).json({ error: 'No tenant associated' });
    }

    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { tenantId: req.user.tenantId };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { startDate: 'asc' },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          tickets: true,
          _count: {
            select: {
              registrations: true,
            },
          },
        },
      }),
      prisma.event.count({ where }),
    ]);

    res.json({
      events,
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

// Get single event
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(403).json({ error: 'No tenant associated' });
    }

    const event = await prisma.event.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.user.tenantId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        tickets: {
          orderBy: { price: 'asc' },
        },
        agenda: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            registrations: true,
            checkIns: true,
            feedback: true,
          },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ event });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create event
router.post(
  '/',
  [
    body('title').trim().notEmpty(),
    body('slug').trim().matches(/^[a-z0-9-]+$/),
    body('startDate').isISO8601(),
    body('endDate').isISO8601(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.user?.tenantId) {
        return res.status(403).json({ error: 'No tenant associated' });
      }

      // Check event limit
      const tenant = await prisma.tenant.findUnique({
        where: { id: req.user.tenantId },
      });

      const eventCount = await prisma.event.count({
        where: { tenantId: req.user.tenantId },
      });

      if (tenant && eventCount >= tenant.maxEvents) {
        return res.status(400).json({ error: 'Event limit reached' });
      }

      // Check if slug exists for this tenant
      const existingEvent = await prisma.event.findUnique({
        where: {
          tenantId_slug: {
            tenantId: req.user.tenantId,
            slug: req.body.slug,
          },
        },
      });

      if (existingEvent) {
        return res.status(400).json({ error: 'Event slug already exists' });
      }

      const {
        title,
        description,
        slug,
        image,
        startDate,
        endDate,
        timezone,
        location,
        locationType,
        onlineUrl,
        status,
        isPublic,
        maxAttendees,
      } = req.body;

      const event = await prisma.event.create({
        data: {
          title,
          description,
          slug,
          image,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          timezone: timezone || 'UTC',
          location,
          locationType: locationType || 'onsite',
          onlineUrl,
          status: status || EventStatus.DRAFT,
          isPublic: isPublic !== undefined ? isPublic : true,
          maxAttendees,
          tenantId: req.user.tenantId,
          createdById: req.user.id,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      res.status(201).json({ event });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Update event
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(403).json({ error: 'No tenant associated' });
    }

    const event = await prisma.event.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.user.tenantId,
      },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const {
      title,
      description,
      slug,
      image,
      startDate,
      endDate,
      timezone,
      location,
      locationType,
      onlineUrl,
      status,
      isPublic,
      maxAttendees,
    } = req.body;

    const updatedEvent = await prisma.event.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(slug && { slug }),
        ...(image !== undefined && { image }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(timezone && { timezone }),
        ...(location !== undefined && { location }),
        ...(locationType && { locationType }),
        ...(onlineUrl !== undefined && { onlineUrl }),
        ...(status && { status }),
        ...(isPublic !== undefined && { isPublic }),
        ...(maxAttendees !== undefined && { maxAttendees }),
      },
    });

    res.json({ event: updatedEvent });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete event
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(403).json({ error: 'No tenant associated' });
    }

    const event = await prisma.event.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.user.tenantId,
      },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    await prisma.event.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Event deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create ticket
router.post(
  '/:eventId/tickets',
  [
    body('name').trim().notEmpty(),
    body('price').isFloat({ min: 0 }),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.user?.tenantId) {
        return res.status(403).json({ error: 'No tenant associated' });
      }

      const event = await prisma.event.findFirst({
        where: {
          id: req.params.eventId,
          tenantId: req.user.tenantId,
        },
      });

      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      const {
        name,
        description,
        price,
        quantity,
        saleStartDate,
        saleEndDate,
        status,
      } = req.body;

      const ticket = await prisma.ticket.create({
        data: {
          name,
          description,
          price: parseFloat(price),
          quantity,
          saleStartDate: saleStartDate ? new Date(saleStartDate) : null,
          saleEndDate: saleEndDate ? new Date(saleEndDate) : null,
          status: status || 'AVAILABLE',
          eventId: req.params.eventId,
        },
      });

      res.status(201).json({ ticket });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Update ticket
router.put('/:eventId/tickets/:ticketId', async (req: AuthRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(403).json({ error: 'No tenant associated' });
    }

    const ticket = await prisma.ticket.findFirst({
      where: {
        id: req.params.ticketId,
        event: {
          id: req.params.eventId,
          tenantId: req.user.tenantId,
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const {
      name,
      description,
      price,
      quantity,
      saleStartDate,
      saleEndDate,
      status,
    } = req.body;

    const updatedTicket = await prisma.ticket.update({
      where: { id: req.params.ticketId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(quantity !== undefined && { quantity }),
        ...(saleStartDate !== undefined && {
          saleStartDate: saleStartDate ? new Date(saleStartDate) : null,
        }),
        ...(saleEndDate !== undefined && {
          saleEndDate: saleEndDate ? new Date(saleEndDate) : null,
        }),
        ...(status && { status }),
      },
    });

    res.json({ ticket: updatedTicket });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete ticket
router.delete('/:eventId/tickets/:ticketId', async (req: AuthRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(403).json({ error: 'No tenant associated' });
    }

    const ticket = await prisma.ticket.findFirst({
      where: {
        id: req.params.ticketId,
        event: {
          id: req.params.eventId,
          tenantId: req.user.tenantId,
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    await prisma.ticket.delete({
      where: { id: req.params.ticketId },
    });

    res.json({ message: 'Ticket deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

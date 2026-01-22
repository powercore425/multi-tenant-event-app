import express from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient, RegistrationStatus } from '@prisma/client';
import { authenticate, requireTenantUser, AuthRequest } from '../middleware/auth';
import Stripe from 'stripe';

const router = express.Router();
const prisma = new PrismaClient();
// Initialize Stripe only if key is provided
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    })
  : null;

// Public: Register for event
router.post(
  '/',
  [
    body('eventId').notEmpty(),
    body('ticketId').notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((err: any) => err.msg || err.message || 'Validation error');
        return res.status(400).json({ 
          error: errorMessages[0] || 'Validation failed',
          errors: errors.array() 
        });
      }

      const { eventId, ticketId, email, firstName, lastName, phone, userId } = req.body;

      // Get event and ticket
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          tickets: true,
          tenant: true,
        },
      });

      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      if (event.status !== 'PUBLISHED') {
        return res.status(400).json({ error: 'Event is not available for registration' });
      }

      const ticket = event.tickets.find((t) => t.id === ticketId);

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      if (ticket.status !== 'AVAILABLE') {
        return res.status(400).json({ error: 'Ticket is not available' });
      }

      // Check ticket quantity
      if (ticket.quantity !== null && ticket.sold >= ticket.quantity) {
        return res.status(400).json({ error: 'Ticket is sold out' });
      }

      // Check sale dates
      const now = new Date();
      if (ticket.saleStartDate && now < ticket.saleStartDate) {
        return res.status(400).json({ error: 'Ticket sales have not started' });
      }
      if (ticket.saleEndDate && now > ticket.saleEndDate) {
        return res.status(400).json({ error: 'Ticket sales have ended' });
      }

      // Check max attendees
      if (event.maxAttendees) {
        const registrationCount = await prisma.registration.count({
          where: {
            eventId,
            status: { in: ['CONFIRMED', 'CHECKED_IN'] },
          },
        });

        if (registrationCount >= event.maxAttendees) {
          return res.status(400).json({ error: 'Event is full' });
        }
      }

      // Check if user is already registered for this event
      if (userId) {
        const existingRegistration = await prisma.registration.findFirst({
          where: {
            eventId,
            userId,
            status: { notIn: ['CANCELLED'] },
          },
        });

        if (existingRegistration) {
          return res.status(400).json({ error: 'You are already registered for this event' });
        }
      } else {
        // Check by email if no userId
        const existingRegistration = await prisma.registration.findFirst({
          where: {
            eventId,
            email,
            status: { notIn: ['CANCELLED'] },
          },
        });

        if (existingRegistration) {
          return res.status(400).json({ error: 'This email is already registered for this event' });
        }
      }

      // Create registration
      let paymentIntentId: string | null = null;
      let amountPaid: number | null = null;

      // If ticket has a price, create Stripe payment intent
      if (ticket.price > 0) {
        if (!stripe) {
          console.error('Stripe is not configured. Cannot process paid tickets.');
          return res.status(500).json({ error: 'Payment processing is not available. Please contact support.' });
        }
        
        try {
          const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(parseFloat(ticket.price.toString()) * 100), // Convert to cents
            currency: 'usd',
            metadata: {
              eventId,
              ticketId,
              email,
            },
          });

          paymentIntentId = paymentIntent.id;
        } catch (error: any) {
          console.error('Stripe payment intent creation failed:', error);
          return res.status(500).json({ 
            error: error.message || 'Payment processing failed. Please try again or contact support.' 
          });
        }
      } else {
        // Free ticket - auto confirm
        amountPaid = 0;
      }

      const registration = await prisma.registration.create({
        data: {
          eventId,
          ticketId,
          userId: userId || null,
          email,
          firstName,
          lastName,
          phone,
          status: ticket.price > 0 ? 'PENDING' : 'CONFIRMED',
          paymentStatus: ticket.price > 0 ? 'pending' : 'paid',
          paymentIntentId,
          amountPaid: amountPaid !== null ? amountPaid : null,
          confirmedAt: ticket.price === 0 ? new Date() : null,
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              startDate: true,
              endDate: true,
            },
          },
          ticket: {
            select: {
              id: true,
              name: true,
              price: true,
            },
          },
        },
      });

      // Update ticket sold count
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { sold: { increment: 1 } },
      });

      // Get client secret if payment intent exists
      let clientSecret: string | null = null;
      if (paymentIntentId && stripe) {
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
          clientSecret = paymentIntent.client_secret;
        } catch (error) {
          console.error('Failed to retrieve payment intent:', error);
          // Don't fail the registration if we can't get client secret
        }
      }

      res.status(201).json({
        registration,
        clientSecret,
        message: ticket.price > 0 
          ? 'Registration created. Please complete payment to confirm.' 
          : 'Registration confirmed successfully!',
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to create registration. Please try again.' 
      });
    }
  }
);

// Confirm payment (webhook or manual)
router.post('/:id/confirm-payment', async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment intent ID required' });
    }

    if (!stripe) {
      return res.status(500).json({ error: 'Payment processing is not available' });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    const registration = await prisma.registration.update({
      where: { id: req.params.id },
      data: {
        status: 'CONFIRMED',
        paymentStatus: 'paid',
        amountPaid: paymentIntent.amount / 100,
        confirmedAt: new Date(),
      },
      include: {
        event: true,
        ticket: true,
      },
    });

    res.json({ registration });
  } catch (error: any) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ error: error.message || 'Failed to confirm payment' });
  }
});

// Protected routes
router.use(authenticate);

// Get user registrations
router.get('/my-registrations', async (req: AuthRequest, res) => {
  try {
    const registrations = await prisma.registration.findMany({
      where: { userId: req.user!.id },
      include: {
        event: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        ticket: true,
        checkIns: true,
      },
      orderBy: { registeredAt: 'desc' },
    });

    res.json({ registrations });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single registration
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const registration = await prisma.registration.findFirst({
      where: {
        id: req.params.id,
        ...(req.user!.role !== 'SUPER_ADMIN' && { userId: req.user!.id }),
      },
      include: {
        event: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        ticket: true,
        checkIns: true,
      },
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    res.json({ registration });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Tenant routes
router.use(requireTenantUser);

// Get event registrations
router.get('/event/:eventId', async (req: AuthRequest, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(403).json({ error: 'No tenant associated' });
    }

    const { page = 1, limit = 50, status, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Verify event belongs to tenant
    const event = await prisma.event.findFirst({
      where: {
        id: req.params.eventId,
        tenantId: req.user.tenantId,
      },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const where: any = { eventId: req.params.eventId };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [registrations, total] = await Promise.all([
      prisma.registration.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { registeredAt: 'desc' },
        include: {
          ticket: true,
          checkIns: true,
        },
      }),
      prisma.registration.count({ where }),
    ]);

    res.json({
      registrations,
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

// Update registration status
router.put(
  '/:id/status',
  [body('status').isIn(['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CANCELLED'])],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.user?.tenantId) {
        return res.status(403).json({ error: 'No tenant associated' });
      }

      const { status } = req.body;

      const registration = await prisma.registration.findFirst({
        where: {
          id: req.params.id,
          event: {
            tenantId: req.user.tenantId,
          },
        },
      });

      if (!registration) {
        return res.status(404).json({ error: 'Registration not found' });
      }

      const updatedRegistration = await prisma.registration.update({
        where: { id: req.params.id },
        data: { status },
      });

      res.json({ registration: updatedRegistration });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Check-in attendee
router.post(
  '/:id/check-in',
  [body('notes').optional()],
  async (req: AuthRequest, res) => {
    try {
      if (!req.user?.tenantId) {
        return res.status(403).json({ error: 'No tenant associated' });
      }

      const registration = await prisma.registration.findFirst({
        where: {
          id: req.params.id,
          event: {
            tenantId: req.user.tenantId,
          },
        },
      });

      if (!registration) {
        return res.status(404).json({ error: 'Registration not found' });
      }

      if (registration.status !== 'CONFIRMED') {
        return res.status(400).json({ error: 'Registration must be confirmed to check in' });
      }

      // Check if already checked in
      const existingCheckIn = await prisma.checkIn.findFirst({
        where: {
          registrationId: req.params.id,
        },
      });

      if (existingCheckIn) {
        return res.status(400).json({ error: 'Already checked in' });
      }

      const checkIn = await prisma.checkIn.create({
        data: {
          registrationId: req.params.id,
          eventId: registration.eventId,
          checkedInById: req.user.id,
          notes: req.body.notes,
        },
      });

      // Update registration status
      await prisma.registration.update({
        where: { id: req.params.id },
        data: { status: 'CHECKED_IN' },
      });

      res.status(201).json({ checkIn });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;

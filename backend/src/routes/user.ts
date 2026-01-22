import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

// Submit feedback
router.post(
  '/feedback',
  [
    body('eventId').notEmpty(),
    body('rating').isInt({ min: 1, max: 5 }),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { eventId, registrationId, rating, comment } = req.body;

      // Verify event exists
      const event = await prisma.event.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      // If registrationId provided, verify it belongs to user
      if (registrationId) {
        const registration = await prisma.registration.findFirst({
          where: {
            id: registrationId,
            userId: req.user!.id,
            eventId,
          },
        });

        if (!registration) {
          return res.status(404).json({ error: 'Registration not found' });
        }
      }

      const feedback = await prisma.feedback.create({
        data: {
          eventId,
          registrationId: registrationId || null,
          userId: req.user!.id,
          rating: parseInt(rating),
          comment,
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      res.status(201).json({ feedback });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get user feedback
router.get('/feedback', async (req: AuthRequest, res: Response) => {
  try {
    const feedback = await prisma.feedback.findMany({
      where: { userId: req.user!.id },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ feedback });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put(
  '/profile',
  [
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    body('email').optional().isEmail().normalizeEmail(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { firstName, lastName, email } = req.body;

      // If email is being changed, check if it's available
      if (email && email !== req.user!.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          return res.status(400).json({ error: 'Email already in use' });
        }
      }

      const user = await prisma.user.update({
        where: { id: req.user!.id },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(email && { email }),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          tenantId: true,
          createdAt: true,
        },
      });

      res.json({ user });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Change password
router.put(
  '/password',
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 }),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { currentPassword, newPassword } = req.body;

      // Get user with password
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify current password
      const { comparePassword } = await import('../utils/password');
      const isValid = await comparePassword(currentPassword, user.password);

      if (!isValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      const { hashPassword } = await import('../utils/password');
      const hashedPassword = await hashPassword(newPassword);

      await prisma.user.update({
        where: { id: req.user!.id },
        data: { password: hashedPassword },
      });

      res.json({ message: 'Password updated successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;

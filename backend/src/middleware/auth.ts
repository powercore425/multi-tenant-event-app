import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    tenantId?: string | null;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
      role: UserRole;
      tenantId?: string | null;
    };

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        tenantId: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

export const requireSuperAdmin = requireRole(UserRole.SUPER_ADMIN);
export const requireTenantAdmin = requireRole(UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN);
export const requireTenantUser = requireRole(
  UserRole.TENANT_ADMIN,
  UserRole.TENANT_USER,
  UserRole.SUPER_ADMIN
);

// Middleware to ensure user belongs to tenant
export const requireTenantAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Super admin can access any tenant
  if (req.user.role === UserRole.SUPER_ADMIN) {
    return next();
  }

  // For tenant users, ensure they belong to the tenant
  const tenantId = req.params.tenantId || req.body.tenantId || req.query.tenantId;

  if (tenantId && req.user.tenantId !== tenantId) {
    return res.status(403).json({ error: 'Access denied to this tenant' });
  }

  next();
};

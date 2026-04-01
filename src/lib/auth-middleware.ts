/**
 * SignalX — Admin Authentication Middleware
 * Used by all /api/admin/* routes
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashSessionToken } from '@/lib/crypto'
import type { AdminRole } from '@/types'

interface AdminContext {
  id:      string
  name:    string
  email:   string
  role:    AdminRole
  region:  string | null
  country: string | null
}

/**
 * Verify admin session and return admin context.
 * Returns null if not authenticated or unauthorized role.
 */
export async function requireAdmin(
  req: NextRequest,
  allowedRoles?: AdminRole[]
): Promise<AdminContext | null> {
  try {
    // Extract session token from cookie or Authorization header
    const rawToken = 
      req.cookies.get('sx_session')?.value ||
      req.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!rawToken) return null
    
    const hashedToken = hashSessionToken(rawToken)
    
    // Find valid session
    const session = await prisma.adminSession.findFirst({
      where: {
        token:     hashedToken,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true, region: true, country: true, active: true }
        }
      }
    })
    
    if (!session || !session.user.active) return null
    
    // Role-based access
    if (allowedRoles && !allowedRoles.includes(session.user.role as AdminRole)) {
      return null
    }
    
    return {
      id:      session.user.id,
      name:    session.user.name,
      email:   session.user.email,
      role:    session.user.role as AdminRole,
      region:  session.user.region,
      country: session.user.country ?? null,
    }
    
  } catch {
    return null
  }
}

/**
 * Next.js Middleware for route protection.
 * Applied to /admin/* paths.
 */
export async function verifyAdminCookie(req: NextRequest): Promise<boolean> {
  const rawToken = req.cookies.get('sx_session')?.value
  if (!rawToken) return false
  
  const hashed = hashSessionToken(rawToken)
  const count  = await prisma.adminSession.count({
    where: {
      token:     hashed,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    }
  })
  
  return count > 0
}

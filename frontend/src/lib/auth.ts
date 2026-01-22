import { cookies } from 'next/headers'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'TENANT_USER' | 'ATTENDEE'
  tenantId?: string | null
  tenant?: {
    id: string
    name: string
    slug: string
    logo?: string | null
    primaryColor?: string | null
    secondaryColor?: string | null
  } | null
}

export interface Session {
  user: User
  token: string
}

export async function getServerSession(): Promise<Session | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    return null
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return {
      user: data.user,
      token,
    }
  } catch (error) {
    return null
  }
}

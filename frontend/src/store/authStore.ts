import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

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

interface AuthState {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  updateUser: (user: User) => void
  clearAuth: () => void
  isAuthenticated: () => boolean
  isSuperAdmin: () => boolean
  isTenantAdmin: () => boolean
  isTenantUser: () => boolean
}

const storage = typeof window !== 'undefined' 
  ? createJSONStorage(() => localStorage)
  : undefined

const authStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        set({ user, token })
        // Store token in cookie for server-side access
        if (typeof document !== 'undefined') {
          document.cookie = `token=${token}; path=/; max-age=604800; SameSite=Lax`
        }
      },
      updateUser: (user) => {
        set((state) => ({ ...state, user }))
      },
      clearAuth: () => {
        set({ user: null, token: null })
        if (typeof document !== 'undefined') {
          document.cookie = 'token=; path=/; max-age=0'
        }
      },
      isAuthenticated: () => !!get().user && !!get().token,
      isSuperAdmin: () => get().user?.role === 'SUPER_ADMIN',
      isTenantAdmin: () => get().user?.role === 'TENANT_ADMIN',
      isTenantUser: () => {
        const role = get().user?.role
        return role === 'TENANT_ADMIN' || role === 'TENANT_USER'
      },
    }),
    {
      name: 'auth-storage',
      storage: storage as any,
      skipHydration: false,
    }
  )
)

export const useAuthStore = authStore

// Helper selectors that are always safe to use
export const useIsAuthenticated = () => useAuthStore((state) => !!(state.user && state.token))

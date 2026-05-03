import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User as SupabaseUser, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { User } from '@/types'

interface AuthContextValue {
  session: Session | null
  supabaseUser: SupabaseUser | null
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error?: string }>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchUserProfile = async (authUserId: string) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', authUserId)
      .is('deleted_at', null)
      .single()
    setUser(data as User | null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setSupabaseUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id).finally(() => setIsLoading(false))
      } else {
        setIsLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setSupabaseUser(session?.user ?? null)
      if (session?.user) {
        await fetchUserProfile(session.user.id)
      } else {
        setUser(null)
      }
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return {}
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) return { error: error.message }
    return {}
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        supabaseUser,
        user,
        isLoading,
        isAuthenticated: !!session && !!user,
        signIn,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { AuthContext } from './authContextValue'
import { supabase } from '../lib/supabase'
import { normalizeRole } from '../lib/roles'

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({ session: null, user: null, profile: null, loading: true, profileError: null })
  const [registrationPending, setRegistrationPending] = useState(() => {
    try {
      return window.sessionStorage.getItem('ida-registration-pending') === 'true'
    } catch {
      return false
    }
  })
  const profileRequestId = useRef(0)

  const markRegistrationPending = useCallback(() => {
    try {
      window.sessionStorage.setItem('ida-registration-pending', 'true')
    } catch {
      // The pending state still applies for this render if storage is blocked.
    }
    setRegistrationPending(true)
  }, [])

  const clearRegistrationPending = useCallback(() => {
    try {
      window.sessionStorage.removeItem('ida-registration-pending')
    } catch {
      // Authentication state remains authoritative if storage is blocked.
    }
    setRegistrationPending(false)
  }, [])

  const readProfile = useCallback(async (session, active = () => true) => {
    const requestId = ++profileRequestId.current
    if (!session?.user) {
      if (active() && requestId === profileRequestId.current) setAuth({ session: null, user: null, profile: null, loading: false, profileError: null })
      return
    }
    if (active()) setAuth((current) => ({ ...current, session, user: session.user, loading: true, profileError: null }))
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
      if (error) {
        console.error('[IDA] Erreur de lecture du profil Supabase', {
          stage: 'profile',
          userId: session.user.id,
          profileFound: false,
          message: error.message,
          code: error.code ?? null,
          status: error.status ?? null,
        })
      } else if (!data) {
        console.warn('[IDA] Auth réussie mais aucun profil associé à auth.users.id', {
          stage: 'profile',
          userId: session.user.id,
          profileFound: false,
        })
      } else {
        console.info('[IDA] Profil Supabase chargé', {
          stage: 'profile',
          userId: session.user.id,
          profileFound: true,
        })
      }
      if (active() && requestId === profileRequestId.current) setAuth({ session, user: session.user, profile: data ?? null, loading: false, profileError: error })
    } catch (error) {
      console.error('[IDA] Exception pendant la lecture du profil Supabase', {
        stage: 'profile',
        userId: session.user.id,
        profileFound: false,
        message: error?.message ?? String(error),
        code: error?.code ?? null,
        status: error?.status ?? null,
      })
      if (active() && requestId === profileRequestId.current) setAuth({ session, user: session.user, profile: null, loading: false, profileError: error })
    }
  }, [])

  useEffect(() => {
    let mounted = true
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user || event === 'SIGNED_OUT') clearRegistrationPending()
      queueMicrotask(() => {
        if (mounted) void readProfile(session, () => mounted)
      })
    })
    return () => { mounted = false; subscription.unsubscribe() }
  }, [clearRegistrationPending, readProfile])

  const refreshProfile = useCallback(async () => {
    const session = auth.session
    if (!session?.user) return
    const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
    setAuth((current) => {
      if (current.user?.id !== session.user.id) return current
      return { ...current, profile: data ?? null, profileError: error ?? null }
    })
  }, [auth.session])

  const activeUserId = auth.session?.user?.id

  useEffect(() => {
    if (!activeUserId) return undefined
    let active = true
    const refreshIfActive = () => {
      if (active && document.visibilityState === 'visible') {
        void refreshProfile().catch((error) => console.error('[IDA] Actualisation du profil impossible.', error))
      }
    }
    const interval = window.setInterval(refreshIfActive, 15_000)
    window.addEventListener('focus', refreshIfActive)
    document.addEventListener('visibilitychange', refreshIfActive)
    return () => {
      active = false
      window.clearInterval(interval)
      window.removeEventListener('focus', refreshIfActive)
      document.removeEventListener('visibilitychange', refreshIfActive)
    }
  }, [activeUserId, refreshProfile])
  const role = normalizeRole(auth.profile?.role)

  return (
    <AuthContext.Provider value={{
      ...auth,
      registrationPending,
      markRegistrationPending,
      clearRegistrationPending,
      role,
      isMember: Boolean(auth.user),
      isLeader: role === 'leader',
      isAdmin: ['admin', 'administrator'].includes(role),
      isFounder: ['founder', 'fondateur'].includes(role),
      isAdminOrFounder: ['admin', 'founder'].includes(role),
      isLeaderOrAbove: ['leader', 'admin', 'founder'].includes(role),
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
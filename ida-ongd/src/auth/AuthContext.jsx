import { useCallback, useEffect, useRef, useState } from 'react'
import { AuthContext } from './authContextValue'
import { supabase } from '../lib/supabase'
import { normalizeRole } from '../lib/roles'

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({ session: null, user: null, profile: null, loading: true, profileError: null })
  const profileRequestId = useRef(0)

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
      if (active() && requestId === profileRequestId.current) setAuth({ session, user: session.user, profile: null, loading: false, profileError: error })
    }
  }, [])

  useEffect(() => {
    let mounted = true
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      queueMicrotask(() => {
        if (mounted) void readProfile(session, () => mounted)
      })
    })
    return () => { mounted = false; subscription.unsubscribe() }
  }, [readProfile])

  const refreshProfile = useCallback(async () => {
    if (auth.session) await readProfile(auth.session)
  }, [auth.session, readProfile])
  const role = normalizeRole(auth.profile?.role)

  return (
    <AuthContext.Provider value={{
      ...auth,
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
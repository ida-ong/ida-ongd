import { useCallback, useEffect, useState } from 'react'
import { AuthContext } from './authContextValue'
import { supabase } from '../lib/supabase'
import { normalizeRole } from '../lib/roles'

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({ session: null, user: null, profile: null, loading: true, profileError: null })

  const readProfile = useCallback(async (session, active = () => true) => {
    if (!session?.user) {
      if (active()) setAuth({ session: null, user: null, profile: null, loading: false, profileError: null })
      return
    }
    if (active()) setAuth((current) => ({ ...current, session, user: session.user, loading: true, profileError: null }))
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
      if (active()) setAuth({ session, user: session.user, profile: data ?? null, loading: false, profileError: error })
    } catch (error) {
      if (active()) setAuth({ session, user: session.user, profile: null, loading: false, profileError: error })
    }
  }, [])

  useEffect(() => {
    let mounted = true
    const updateSession = (session) => { void readProfile(session, () => mounted) }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => updateSession(session))
    void supabase.auth.getSession()
      .then(({ data: { session } }) => updateSession(session))
      .catch((error) => {
        console.error('[IDA] Impossible de restaurer la session Supabase.', error)
        if (mounted) setAuth({ session: null, user: null, profile: null, loading: false, profileError: error })
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
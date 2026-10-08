import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { canManageQueue } from '@/lib/owner-access';

const OwnerContext = createContext({ userId: null as string | null, isOwner: false, refresh: async () => {} });
export function useOwner() { return useContext(OwnerContext); }
export function OwnerSession({ children }: { children: ReactNode }) {
  const [access, setAccess] = useState({ userId: null as string | null, isOwner: false });
  const queryClient = useQueryClient();
  const router = useRouter();
  async function refresh() {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) { setAccess({ userId: null, isOwner: false }); return; }
    const { data: role, error: roleError } = await supabase.rpc('has_role', { _user_id: data.user.id, _role: 'admin' });
    setAccess({ userId: data.user.id, isOwner: canManageQueue(data.user.id, !roleError && role ? 'admin' : null) });
  }
  useEffect(() => {
    void refresh();
    const { data: listener } = supabase.auth.onAuthStateChange(event => {
      if (!['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED'].includes(event)) return;
      if (event === 'SIGNED_OUT') setAccess({ userId: null, isOwner: false });
      else setTimeout(() => { void refresh(); }, 0);
      void router.invalidate();
      if (event !== 'SIGNED_OUT') void queryClient.invalidateQueries();
    });
    return () => listener.subscription.unsubscribe();
  }, [queryClient, router]);
  return <OwnerContext.Provider value={{ ...access, refresh }}>{children}</OwnerContext.Provider>;
}
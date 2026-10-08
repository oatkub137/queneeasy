import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { LockKeyhole, LogOut } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useOwner } from '@/components/owner-session';
import { ownerEmail } from '@/lib/owner-access';

export function OwnerLogin() {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { isOwner, refresh } = useOwner();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  async function login(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const result = await supabase.auth.signInWithPassword({ email: ownerEmail(username), password });
      if (result.error || !result.data.user) throw new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      const { data: owner, error: roleError } = await supabase.rpc('has_role', { _user_id: result.data.user.id, _role: 'admin' });
      if (roleError || !owner) { await supabase.auth.signOut(); throw new Error('บัญชีนี้ไม่มีสิทธิ์เจ้าของร้าน'); }
      await refresh(); setPassword(''); setOpen(false); await navigate({ to: '/queue' });
    } catch (error) { setError(error instanceof Error ? error.message : 'เข้าสู่ระบบไม่สำเร็จ'); }
    finally { setBusy(false); }
  }
  async function logout() {
    await queryClient.cancelQueries(); queryClient.clear(); await supabase.auth.signOut();
    await navigate({ to: '/', replace: true }); toast.success('ออกจากระบบแล้ว');
  }
  return <><Button className="owner-entry" variant="outline" onClick={() => isOwner ? void logout() : setOpen(true)}>{isOwner ? <LogOut /> : <LockKeyhole />}{isOwner ? 'ออกจากระบบเจ้าของร้าน' : 'เข้าสู่ระบบเจ้าของร้าน'}</Button><Dialog open={open} onOpenChange={value => { setOpen(value); setError(''); if (!value) setPassword(''); }}><DialogContent><DialogHeader><DialogTitle>เข้าสู่ระบบเจ้าของร้าน</DialogTitle><DialogDescription>CheckQueue Airiix.</DialogDescription></DialogHeader><form className="grid gap-4" onSubmit={login}><label className="grid gap-2 text-sm">ชื่อผู้ใช้<Input autoComplete="username" required value={username} onChange={e => setUsername(e.target.value)} /></label><label className="grid gap-2 text-sm">รหัสผ่าน<Input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></label>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button disabled={busy} type="submit"><LockKeyhole />{busy ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}</Button></form></DialogContent></Dialog></>;
}
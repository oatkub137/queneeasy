import { supabase } from '@/integrations/supabase/client';

export async function listQueue() {
  const { data, error } = await supabase
    .from('commissions')
    .select('id,queue_no,contact,type,program,scale,status,note,created_at')
    .order('queue_no')
    .order('created_at');
  if (error) throw new Error('ไม่สามารถโหลดคิวได้');
  return (data ?? []).map(row => ({ ...row, user_id: '' }));
}

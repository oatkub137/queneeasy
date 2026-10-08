import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { useOwner } from '@/components/owner-session';
import { queueQuery } from '@/lib/queue-query';
import { Check, CheckCheck, Clock3, Download, LogOut, Heart, ListOrdered, Plus, Search, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ShopHeader } from '@/components/shop-header';
import { QueueCell } from '@/components/queue-cell';
import { choices, filterQueue, makeCommission, parseSavedQueue, type Commission, type ChoiceField } from '@/lib/queue';

export const Route = createFileRoute('/queue')({
  loader: ({ context }) => context.queryClient.ensureQueryData(queueQuery),
  errorComponent: () => <><ShopHeader /><main className="queue-main"><p role="alert">โหลดคิวไม่สำเร็จ กรุณาลองใหม่อีกครั้ง</p><Button onClick={() => window.location.reload()}>ลองใหม่</Button></main></>,
  head: () => ({ meta: [
    { title: 'คิวงานของฉัน — Airiix Studio' },
    { name: 'description', content: 'จัดการคิวงานวาด เปลี่ยนประเภทงาน ขนาด และสถานะในตารางของ Airiix Studio' },
    { property: 'og:title', content: 'คิวงานของฉัน — Airiix Studio' },
    { property: 'og:description', content: 'จัดการคิวงานวาดและติดตามสถานะงานในที่เดียว' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: QueuePage,
});

function QueuePage() {
  const { data: rows } = useSuspenseQuery(queueQuery);
  const { isOwner, userId } = useOwner();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('ทั้งหมด');
  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState<Commission | null>(null);
  const [busyIds, setBusyIds] = useState(new Set<string>());
  const [adding, setAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Commission | null>(null);
  const [saveState, setSaveState] = useState('');
  const visible = filterQueue(rows, search, tab);
  async function reloadQueue() { await queryClient.invalidateQueries({ queryKey: queueQuery.queryKey }); }
  async function update(row: Commission, patch: Partial<Commission>) {
    if (!isOwner) return;
    setBusyIds(ids => new Set(ids).add(row.id));
    try {
      const { data, error } = await supabase.from('commissions').update(patch).eq('id', row.id).select('id');
      if (error || !data?.length) throw new Error();
      await reloadQueue(); setSaveState('บันทึกแล้ว');
    } catch { toast.error('บันทึกไม่สำเร็จ'); }
    finally { setBusyIds(ids => { const next = new Set(ids); next.delete(row.id); return next; }); }
  }
  function openAdd() { if (!isOwner) return; setDraft(makeCommission(Math.max(0, ...rows.map(r => r.queue_no)) + 1)); setAddOpen(true); }
  async function add(event: React.FormEvent) {
    event.preventDefault(); if (!draft || !isOwner || !userId) return;
    setAdding(true);
    try {
      const { error } = await supabase.from('commissions').insert({ ...draft, user_id: userId });
      if (error) throw error;
      await reloadQueue(); setAddOpen(false); toast.success('เพิ่มคิวงานแล้ว');
    } catch { toast.error('เพิ่มคิวไม่สำเร็จ'); } finally { setAdding(false); }
  }
  async function remove() {
    if (!deleteTarget || !isOwner) return;
    setBusyIds(ids => new Set(ids).add(deleteTarget.id));
    try {
      const { data, error } = await supabase.from('commissions').delete().eq('id', deleteTarget.id).select('id');
      if (error || !data?.length) throw new Error();
      await reloadQueue(); setDeleteTarget(null); toast.success('ลบคิวแล้ว');
    } catch { toast.error('ลบคิวไม่สำเร็จ'); }
    finally { setBusyIds(new Set()); }
  }
  async function importLocal() {
    if (!isOwner || !userId || adding) return;
    setAdding(true);
    try {
      const raw = localStorage.getItem('airiix-queue-v1');
      if (!raw) { toast.error('ไม่มีคิวเดิมในเครื่องนี้'); return; }
      const local = parseSavedQueue(raw).filter(row => !rows.some(saved => saved.id === row.id));
      if (!local.length) { toast.success('คิวเดิมอยู่ในตารางแล้ว'); return; }
      const { error } = await supabase.from('commissions').insert(local.map(row => ({ ...row, user_id: userId })));
      if (error) throw error;
      await reloadQueue(); toast.success('นำเข้าคิวเดิมแล้ว');
    } catch { toast.error('นำเข้าคิวไม่สำเร็จ'); } finally { setAdding(false); }
  }
  async function logout() {
    await queryClient.cancelQueries(); queryClient.clear(); await supabase.auth.signOut();
    await navigate({ to: '/', replace: true });
  }
  function exportCsv() {
    const csv = [['Q', 'Contact', 'Type', 'Program', 'Scale', 'Status', 'Note'], ...visible.map(r => [r.queue_no, r.contact, r.type, r.program, r.scale, r.status, r.note])].map(row => row.map(v => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = 'airiix-queue.csv'; a.click(); URL.revokeObjectURL(url);
  }
  const stats = [
    { label: 'คิวทั้งหมด', count: rows.length, icon: ListOrdered, tone: 'normal' },
    { label: 'กำลังทำ', count: rows.filter(r => r.status === 'กำลังทำ').length, icon: Sparkles, tone: 'working' },
    { label: 'รอคิว', count: rows.filter(r => r.status === 'รอคิว').length, icon: Clock3, tone: 'waiting' },
    { label: 'ส่งแล้ว', count: rows.filter(r => r.status === 'ส่งแล้ว').length, icon: CheckCheck, tone: 'done' },
  ];
  return <><ShopHeader>{isOwner && <Button variant="ghost" size="icon" aria-label="ออกจากระบบเจ้าของร้าน" title="ออกจากระบบเจ้าของร้าน" onClick={logout}><LogOut /></Button>}</ShopHeader>
    <main className="queue-main"><div className="page-heading"><div><div className="eyebrow">สอบถามเกี่ยวกับคิวงานได้ตลอดเลยค่ะ</div><h1>คิวงานของฉัน <span className="text-primary">♡</span></h1><p className="text-sm text-muted-foreground">เค้าตั้งใจทำทุกงานให้ดีที่สุด รออย่างใจเย็นน้าาา</p></div><div className="flex flex-wrap gap-2">{isOwner && <><Button variant="outline" onClick={importLocal} disabled={adding}>นำเข้าคิวเดิม</Button><Button onClick={openAdd} className="mt-4" disabled={adding}><Plus />เพิ่มคิว</Button></>}</div></div>
      <div className="stats">{stats.map(stat => <div className="stat" key={stat.label}><div className="stat-top"><span>{stat.label}</span><span className={`stat-icon tone-${stat.tone}`}><stat.icon size={17} /></span></div><div className="stat-number">{String(stat.count).padStart(2, '0')}<span className="ml-2 text-xs font-normal text-muted-foreground">งาน</span></div></div>)}</div>
      <div className="toolbar"><div className="queue-tabs">{['ทั้งหมด', ...choices.status].map(value => <Button key={value} variant="ghost" aria-pressed={tab === value} onClick={() => setTab(value)}>{value}<span className="text-[10px] opacity-70">{value === 'ทั้งหมด' ? rows.length : rows.filter(r => r.status === value).length}</span></Button>)}</div><div className="flex items-center gap-2"><div className="search-wrap"><Search size={17} /><Input aria-label="ค้นหาคิวงาน" placeholder="ค้นหาชื่อลูกค้าหรือหมายเหตุ…" value={search} onChange={e => setSearch(e.target.value)} /></div><Button variant="outline" size="icon" title="ส่งออก CSV" aria-label="ส่งออก CSV" onClick={exportCsv}><Download /></Button></div></div>
      <div className="queue-table-wrap"><table className="queue-table"><thead><tr><th>Q</th><th>CONTACT / ลูกค้า</th><th>TYPE / ประเภท</th><th>Coverage / งาน</th><th>Char Style / รูปแบบ</th><th>STATUS / สถานะ</th><th>NOTE / หมายเหตุ</th>{isOwner && <th><span className="sr-only">ลบ</span></th>}</tr></thead><tbody>{visible.map(row => <tr key={row.id}><td className="text-muted-foreground font-medium">{String(row.queue_no).padStart(2, '0')}</td><td><EditableText key={`${row.id}-contact-${row.contact}`} value={row.contact} label={`ลูกค้า คิว ${row.queue_no}`} disabled={!isOwner || busyIds.has(row.id)} onSave={value => update(row, { contact: value })} /></td>{(['type', 'program', 'scale', 'status'] as ChoiceField[]).map(field => <td key={field}><QueueCell field={field} value={row[field]} label={`${field} คิว ${row.queue_no}`} disabled={!isOwner || busyIds.has(row.id)} onChange={value => update(row, { [field]: value })} /></td>)}<td><EditableText key={`${row.id}-note-${row.note}`} value={row.note} label={`หมายเหตุ คิว ${row.queue_no}`} placeholder="—" disabled={!isOwner || busyIds.has(row.id)} onSave={value => update(row, { note: value })} /></td>{isOwner && <td><Button variant="ghost" size="icon" aria-label={`ลบคิว ${row.queue_no}`} title="ลบคิว" onClick={() => setDeleteTarget(row)} disabled={!isOwner || busyIds.has(row.id)}><Trash2 className="text-muted-foreground" /></Button></td>}</tr>)}{visible.length === 0 && <tr><td colSpan={isOwner ? 8 : 7} className="text-center text-muted-foreground">{search || tab !== 'ทั้งหมด' ? 'ไม่พบคิวที่ค้นหา' : 'ยังไม่มีคิวงาน'}</td></tr>}</tbody></table></div>
      <div className="queue-bottom"><span>แสดง {visible.length} จาก {rows.length} คิว</span>{isOwner && <span className="save-state"><Check size={14} />{saveState || 'คิวงานที่แชร์กับลูกค้า'}</span>}</div><div className="mt-12 flex justify-center gap-2 text-[11px] text-muted-foreground"><Heart size={12} />AIRIIX STUDIO · MADE WITH LOVE</div>
    </main>
    <Dialog open={addOpen && isOwner} onOpenChange={setAddOpen}><DialogContent><DialogHeader><DialogTitle>เพิ่มคิวงานใหม่</DialogTitle><DialogDescription>คิวที่ {draft?.queue_no} · Airiix Studio</DialogDescription></DialogHeader>{draft && <form onSubmit={add} className="grid gap-4"><label className="grid gap-2 text-sm">ชื่อลูกค้า<Input required value={draft.contact} onChange={e => setDraft({ ...draft, contact: e.target.value })} placeholder="ชื่อหรือช่องทางติดต่อ" /></label><div className="grid grid-cols-2 gap-4">{(['type', 'program', 'scale', 'status'] as ChoiceField[]).map((field, i) => <label key={field} className="grid gap-2 text-sm">{['ประเภทคิว', 'รูปแบบงาน', 'ขนาด', 'สถานะ'][i]}<QueueCell field={field} value={draft[field]} label={`เพิ่ม ${field}`} onChange={value => setDraft({ ...draft, [field]: value })} /></label>)}</div><label className="grid gap-2 text-sm">หมายเหตุ<Input value={draft.note} onChange={e => setDraft({ ...draft, note: e.target.value })} placeholder="รายละเอียดเพิ่มเติม" /></label><Button type="submit" disabled={adding}><Plus />{adding ? 'กำลังบันทึก…' : 'เพิ่มคิวงาน'}</Button></form>}</DialogContent></Dialog>
    <Dialog open={!!deleteTarget && isOwner} onOpenChange={open => { if (!open) setDeleteTarget(null); }}><DialogContent><DialogHeader><DialogTitle>ลบคิวงานนี้?</DialogTitle><DialogDescription>คิว {deleteTarget?.queue_no} · {deleteTarget?.contact}</DialogDescription></DialogHeader><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setDeleteTarget(null)}>ยกเลิก</Button><Button variant="destructive" disabled={!!deleteTarget && busyIds.has(deleteTarget.id)} onClick={remove}><Trash2 />ลบคิวงาน</Button></div></DialogContent></Dialog>
  </>;
}
function EditableText({ value, label, placeholder, disabled, onSave }: { value: string; label: string; placeholder?: string; disabled?: boolean; onSave: (value: string) => void }) {
  const [text, setText] = useState(value);
  if (disabled) return <span>{value || placeholder}</span>;
  return <input className="cell-input" aria-label={label} value={text} placeholder={placeholder} disabled={disabled} onChange={e => setText(e.target.value)} onBlur={() => { if (text !== value) onSave(text); }} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') { setText(value); e.currentTarget.blur(); } }} />;
}
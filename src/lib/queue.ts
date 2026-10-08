import type { Database } from '@/integrations/supabase/types';

export type Commission = Database['public']['Tables']['commissions']['Row'];
export const choices = {
  type: ['คิวปกติ', 'คิวเร่ง'],
  program: ['Ych', 'เต็มตัว', 'หัว-สะโพก', 'หัว-เอว', 'ลงสี', 'ตัดเส้น'],
  scale: ['จิบิ', 'เด็กประถม', 'ปกติ', 'ขตต', 'กาว', 'ชีท'],
  status: ['กำลังทำ', 'รอคิว', 'ส่งแล้ว'],
} as const;
export type ChoiceField = keyof typeof choices;
export function parseSavedQueue(raw: string): Commission[] {
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('Invalid queue');
  return parsed.map((value: unknown) => {
    if (!value || typeof value !== 'object') throw new Error('Invalid row');
    const row = value as Record<string, unknown>;
    if (typeof row['id'] !== 'string' || typeof row['contact'] !== 'string' || typeof row['queue_no'] !== 'number' || typeof row['note'] !== 'string') throw new Error('Invalid row');
    for (const field of ['type', 'program', 'scale', 'status'] as ChoiceField[]) {
      if (typeof row[field] !== 'string' || !(choices[field] as readonly string[]).includes(row[field])) throw new Error('Invalid choice');
    }
    return { id: row['id'], contact: row['contact'], queue_no: row['queue_no'], note: row['note'], user_id: '', created_at: typeof row['created_at'] === 'string' ? row['created_at'] : '', type: String(row['type']), program: String(row['program']), scale: String(row['scale']), status: String(row['status']) };
  });
}
export function makeCommission(queue_no: number, contact = ''): Commission {
  return { id: crypto.randomUUID(), user_id: '', queue_no, contact, type: 'คิวปกติ', program: 'เต็มตัว', scale: 'ปกติ', status: 'รอคิว', note: '', created_at: new Date().toISOString() };
}
export function demoQueue(): Commission[] {
  const names = ['Divaz Everett', 'Lucky XN', 'โมนี่ จ๋าน้ำ', 'Azio Yuri', 'Jaochan Chanyakorn', 'Nadia Kannika', 'Monica Miji', 'Thanaporn Sonpundi', 'Bé Xi', 'Chp mushroom', 'Ketsiree Chaisuwan', 'Kanyaphat Gj'];
  return names.map((name, i) => ({ ...makeCommission(i + 1, name), type: i % 4 === 1 ? 'คิวเร่ง' : 'คิวปกติ', program: choices.program[i % 6] ?? 'เต็มตัว', scale: choices.scale[i % 6] ?? 'ปกติ', status: i < 3 ? 'กำลังทำ' : i < 9 ? 'รอคิว' : 'ส่งแล้ว', note: i === 0 ? 'รอคอนเฟิร์มสเก็ตช์' : i === 3 ? 'ชุดตามเรฟลูกค้า' : '' }));
}
export function filterQueue(rows: Commission[], search: string, status: string) {
  return rows.filter(row => (status === 'ทั้งหมด' || row.status === status) && `${row.contact} ${row.note} ${row.queue_no}`.toLowerCase().includes(search.toLowerCase()));
}
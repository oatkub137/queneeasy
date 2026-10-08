import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { choices, type ChoiceField } from '@/lib/queue';

export function QueueCell({ field, value, label, disabled, onChange }: { field: ChoiceField; value: string; label: string; disabled?: boolean; onChange: (value: string) => void }) {
  const tone = field === 'status' ? value === 'กำลังทำ' ? 'working' : value === 'ส่งแล้ว' ? 'done' : 'waiting' : field === 'type' ? value === 'คิวเร่ง' ? 'urgent' : 'normal' : field === 'program' ? 'program' : 'scale';
  return <Select value={value} onValueChange={onChange} disabled={disabled ?? false}><SelectTrigger aria-label={label} className={`queue-select tone-${tone}`}><SelectValue /></SelectTrigger><SelectContent>{choices[field].map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select>;
}
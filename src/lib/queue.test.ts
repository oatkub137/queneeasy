import { describe, expect, it } from 'vitest';
import { choices, filterQueue, makeCommission, parseSavedQueue } from './queue';

describe('Screenshot queue choices', () => {
  it('restores queue edits without requiring an account', () => {
    const row = { ...makeCommission(7, 'Test'), status: 'ส่งแล้ว', user_id: '' };
    expect(parseSavedQueue(JSON.stringify([row]))).toEqual([row]);
    expect(() => parseSavedQueue(JSON.stringify([{ ...row, status: 'invalid' }]))).toThrow();
  });
  it('contains the two supplied queue types', () => { expect([...choices.type]).toEqual(['คิวปกติ', 'คิวเร่ง']); });
  it('contains all six supplied programs', () => { expect([...choices.program]).toEqual(['Ych', 'เต็มตัว', 'หัว-สะโพก', 'หัว-เอว', 'ลงสี', 'ตัดเส้น']); });
  it('contains all six supplied scales', () => { expect([...choices.scale]).toEqual(['จิบิ', 'เด็กประถม', 'ปกติ', 'ขตต', 'กาว', 'ชีท']); });
  it('contains exactly the three supplied statuses', () => { expect([...choices.status]).toEqual(['กำลังทำ', 'รอคิว', 'ส่งแล้ว']); });
  it('filters matching contacts by status', () => {
    const waiting = { ...makeCommission(1, 'Lucky XN'), status: 'รอคิว' };
    const done = { ...makeCommission(2, 'Lucky XN'), status: 'ส่งแล้ว' };
    expect(filterQueue([waiting, done], 'lucky', 'รอคิว')).toEqual([waiting]);
    expect(filterQueue([waiting, done], 'not here', 'ทั้งหมด')).toEqual([]);
  });
});
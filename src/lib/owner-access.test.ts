import { describe, expect, it } from 'vitest';
import { canManageQueue, ownerEmail } from './owner-access';
describe('Owner permissions', () => {
  it('prevents anonymous visitors from managing queue entries', () => { expect(canManageQueue(null, null)).toBe(false); expect(canManageQueue(null, 'admin')).toBe(false); });
  it('prevents signed-in non-owners from managing queue entries', () => { expect(canManageQueue('verified-user', 'user')).toBe(false); });
  it('allows verified administrators to manage queue entries', () => { expect(canManageQueue('verified-owner', 'admin')).toBe(true); });
  it('normalizes username login consistently', () => { expect(ownerEmail(' Shop_Owner ')).toBe('shop_owner@owner.airiix.local'); expect(ownerEmail('air305')).toBe('air305@owner.airiix.local'); expect(() => ownerEmail('invalid@email')).toThrow(); });
});
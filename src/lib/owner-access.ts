export function canManageQueue(verifiedUserId: string | null, role: string | null) {
  return Boolean(verifiedUserId) && role === 'admin';
}
export function ownerEmail(username: string) {
  const normalized = username.trim().toLowerCase();
  if (!/^[a-z0-9_-]{1,64}$/.test(normalized)) throw new Error('ชื่อผู้ใช้ไม่ถูกต้อง');
  return `${normalized}@owner.airiix.local`;
}
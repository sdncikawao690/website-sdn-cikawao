const ID_REGEX = /^[a-zA-Z0-9_-]+$/;
const NISN_REGEX = /^[0-9a-zA-Z-]+$/;
const TICKET_REGEX = /^[A-Z0-9-]+$/;

export const MAX_PHOTO_DATA_LEN = 250000;
export const MAX_DOC_DATA_LEN = 200000;
export const MAX_SILOKA_FILE_LEN = 350000;
export const MAX_LINK_LEN = 500;

export function sanitizeId(raw: string): string {
  const cleaned = raw.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  return (cleaned || `doc_${Date.now()}`).slice(0, 120);
}

export function generateSafeId(prefix: string): string {
  const cleanPrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 20) || 'item';
  const rand = Math.random().toString(36).slice(2, 8);
  return `${cleanPrefix}_${Date.now()}_${rand}`;
}

export function clampString(val: string, maxLen: number): string {
  return val.trim().slice(0, maxLen);
}

export function clampMediaUrl(val?: string, maxLen = MAX_PHOTO_DATA_LEN): string {
  const trimmed = (val || '').trim();
  if (!trimmed) return '';
  if (/^\s*javascript:/i.test(trimmed)) {
    throw new Error('URL media tidak valid.');
  }
  if (trimmed.length > maxLen) {
    throw new Error(
      `Ukuran media melebihi batas (${Math.round(maxLen / 1000)} KB). Gunakan gambar terkompresi atau tautan URL.`
    );
  }
  return trimmed;
}

export function clampNumber(val: number, min: number, max: number): number {
  if (Number.isNaN(val)) return min;
  return Math.min(max, Math.max(min, Math.round(val * 10) / 10));
}

export function assertLength(
  label: string,
  val: string,
  minLen: number,
  maxLen: number
): string {
  const trimmed = val.trim();
  if (trimmed.length < minLen) {
    throw new Error(`${label} minimal ${minLen} karakter.`);
  }
  if (trimmed.length > maxLen) {
    return trimmed.slice(0, maxLen);
  }
  return trimmed;
}

export function assertValidId(id: string): string {
  if (!ID_REGEX.test(id) || id.length > 128) {
    throw new Error('Format ID dokumen tidak valid.');
  }
  return id;
}

export function assertValidNisn(nisn: string): string {
  const cleaned = nisn.trim();
  if (!NISN_REGEX.test(cleaned) || cleaned.length < 4 || cleaned.length > 20) {
    throw new Error('NISN harus 4–20 karakter huruf/angka tanpa spasi.');
  }
  return cleaned;
}

export function assertValidTicketCode(code: string): string {
  const upper = code.trim().toUpperCase();
  if (!TICKET_REGEX.test(upper) || upper.length < 4 || upper.length > 30) {
    throw new Error('Kode tiket tidak valid.');
  }
  return upper;
}

export function normalizeNik(raw?: string): string {
  return (raw || '').replace(/\D/g, '').slice(0, 20);
}

async function sha256Hex(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const bytes = Array.from(new Uint8Array(hashBuffer));
  return bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Computes a deterministic SHA-256 hex digest from student full name alone
 * so visitors can search NISN by Name only without exposing PII.
 */
export async function computeNisnNameHash(fullName: string): Promise<string> {
  const cleanName = fullName.trim().toLowerCase().replace(/\s+/g, ' ');
  if (cleanName.length < 2) return '';
  return sha256Hex(`name|${cleanName}`);
}

/**
 * Computes a deterministic SHA-256 hex digest from student NIK alone
 * so visitors can search NISN by NIK only without exposing PII.
 */
export async function computeNisnNikHash(nik: string): Promise<string> {
  const cleanNik = normalizeNik(nik);
  if (cleanNik.length < 6) return '';
  return sha256Hex(`nik|${cleanNik}`);
}

export async function computeNisnLookupHash(
  fullName: string,
  nik: string
): Promise<string> {
  const cleanName = fullName.trim().toLowerCase().replace(/\s+/g, ' ');
  const cleanNik = normalizeNik(nik);
  return sha256Hex(`${cleanName}|${cleanNik}`);
}

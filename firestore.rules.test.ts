/**
 * Phase 0 Security Rules Verification Specification (Dirty Dozen)
 * Documents expected PERMISSION_DENIED outcomes for adversarial payloads against firestore.rules.
 */

export interface DirtyDozenCase {
  id: string;
  collection: string;
  operation: 'create' | 'update' | 'get' | 'list' | 'delete';
  description: string;
  expected: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_CASES: DirtyDozenCase[] = [
  {
    id: 'DD-01',
    collection: 'users',
    operation: 'create',
    description: 'Unverified token claiming bootstrapped admin email attempts write',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-02',
    collection: 'users',
    operation: 'create',
    description: 'Authenticated parent attempts self-registration with role: admin',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-03',
    collection: 'news',
    operation: 'create',
    description: 'Authenticated staff injects undeclared shadow field in news document',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-04',
    collection: 'students',
    operation: 'create',
    description: 'Invalid document ID containing special characters or >128 chars',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-05',
    collection: 'announcements',
    operation: 'create',
    description: 'Forged client-side createdAt timestamp not matching request.time',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-06',
    collection: 'students',
    operation: 'get',
    description: 'Parent reads another family student record without matching parentEmail',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-07',
    collection: 'siloka_tickets',
    operation: 'create',
    description: 'User submits SILOKA ticket with spoofed reporterUid != request.auth.uid',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-08',
    collection: 'siloka_tickets',
    operation: 'update',
    description: 'Non-admin user modifies ticket after status reached terminal Selesai',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-09',
    collection: 'pkks_items',
    operation: 'update',
    description: 'Non-admin user tries to alter PKKS achievedScore or status',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-10',
    collection: 'news',
    operation: 'create',
    description: 'Oversized news content (> 4000 chars) rejected by boundary guard',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-11',
    collection: 'students',
    operation: 'create',
    description: 'Invalid enum value for rombel (Kelas 9) rejected by schema validator',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-12',
    collection: 'admins',
    operation: 'create',
    description: 'Non-admin attempts to insert own UID into /admins collection',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-13',
    collection: 'academic_events',
    operation: 'create',
    description: 'Non-admin writes academic event or submits invalid YYYY-MM-DD date format',
    expected: 'PERMISSION_DENIED',
  },
];


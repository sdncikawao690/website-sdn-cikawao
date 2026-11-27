# Security Specification: SDN Cikawao Integrated School Portal

## 1. Data Invariants
1. **Admin Authority**: Only the bootstrapped verified principal/operator (`sdncikawao690@gmail.com` with `email_verified == true`) or UIDs present in `/admins/{uid}` possess `isAdmin()` privileges.
2. **PII Isolation**: Collections containing personal emails, phone numbers, or individual student academic grades (`/users`, `/students`, `/siloka_tickets`) are never publicly readable. Non-admin users can only access records explicitly linked to their verified `uid` or `email`.
3. **Immutable Ownership & Creation Timestamps**: `createdAt`, `authorUid` / `reporterUid` cannot be modified after document creation (`incoming().field == existing().field`).
4. **Server Temporal Integrity**: All `createdAt` writes on create and `updatedAt` writes on update must equal `request.time`.
5. **Terminal State Locking on SILOKA**: Once a `/siloka_tickets` document reaches `status == 'Selesai'`, non-admin users cannot reopen or modify it.
6. **Self-Role Escalation Prevention**: Non-admin users creating a `/users` profile are strictly restricted to `role == 'orangtua'` and `uid == request.auth.uid`, and cannot alter `role` or `status` on update.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unverified Admin Email Spoof**: `{ role: 'admin' }` sent with `email: 'sdncikawao690@gmail.com'` and `email_verified: false` -> `PERMISSION_DENIED`.
2. **Self-Promotion in `/users`**: Parent creates `/users/u1` with `{ role: 'admin', status: 'aktif', ... }` -> `PERMISSION_DENIED`.
3. **Ghost Shadow Field in `/news`**: Teacher writes `/news/n1` with extra field `{ isFeaturedHack: true }` -> `PERMISSION_DENIED`.
4. **Path Variable ID Poisoning**: Request to `/students/../../bad!id` or 200-char ID -> `PERMISSION_DENIED`.
5. **Client Timestamp Forgery**: Creating `/announcements/a1` with `createdAt: "2020-01-01T00:00:00Z"` instead of `request.time` -> `PERMISSION_DENIED`.
6. **Cross-Parent Student Snooping**: Parent A attempts `get` or `list` on `/students` belonging to Parent B -> `PERMISSION_DENIED`.
7. **SILOKA Author Spoofing**: User A creates `/siloka_tickets/t1` with `reporterUid: 'userB'` -> `PERMISSION_DENIED`.
8. **SILOKA Terminal Bypass**: Citizen attempts to update a ticket whose existing `status == 'Selesai'` -> `PERMISSION_DENIED`.
9. **PKKS Tampering by Non-Admin**: Parent or unauthenticated user attempts to update `/pkks_items/p1` -> `PERMISSION_DENIED`.
10. **Oversized String Exhaustion**: Creating `/news/n2` with `content` > 4000 chars or `title` > 160 chars -> `PERMISSION_DENIED`.
11. **Invalid Enum Injection**: Creating `/students/s1` with `rombel: 'Kelas 9'` or `gender: 'X'` -> `PERMISSION_DENIED`.
12. **Admin Marker Forgery**: Non-admin attempts to create `/admins/{myUid}` -> `PERMISSION_DENIED`.
13. **Academic Calendar Date & Privilege Spoofing**: Non-admin writes to `/academic_events/e1` or staff submits invalid date string `startDate: 'invalid-date'` -> `PERMISSION_DENIED`.


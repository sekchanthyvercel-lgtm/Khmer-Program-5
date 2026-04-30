# Security Specification for Firestore

## 1. Data Invariants
- Only authenticated users can access the `portal/data` document.
- The `portal/data` document is a monolithic object containing all app data.
- Access to the monolithic document effectively grants access to the entire application state.

## 2. The "Dirty Dozen" Payloads (for `portal/data`)
1. Unauthenticated reader access.
2. Unauthenticated writer access.
3. Authenticated reader of an invalid document path.
4. Authenticated writer of an invalid document path.
5. Authenticated writer with schema violation (e.g., field types mismatch).
6. Authenticated writer replacing the parent document ID without authorization.
7. Authenticated writer adding a ghost field.
8. Authenticated writer modifying a System-Only field.
9. Authenticated writer failing the relational check (if applicable).
10. Authenticated writer violating size/limit constraints.
11. Authenticated writer attempting to bypass terminal state rules.
12. Authenticated writer attempting an unauthorized "Update-Gap" (unallowed partial update).

## 3. Test Runner (firestore.rules.test.ts placeholder)
- Needs to verify all 12 payloads return `PERMISSION_DENIED`.

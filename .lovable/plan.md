

## Problem: Admin stuck on Client Portal

**Root cause**: Your user (`7d5b6c13-b3d4-4164-9098-88e87cf6b2bd`) has **no row** in the `user_roles` table. The query returns 0 rows (406 error with `.single()`), so `userRole` stays `null`. The app logic `isClientPortal = !userRole` treats you as a client.

Two things need to happen:

### 1. Insert your admin role in the database (migration)

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('7d5b6c13-b3d4-4164-9098-88e87cf6b2bd', 'admin');
```

### 2. Fix `useAuth.tsx` to handle missing roles gracefully

The `.single()` call throws a 406 when 0 rows are returned. Change the `user_roles` query to use `.maybeSingle()` instead, which returns `null` data without erroring. Also add a `roleLoading` state so the app doesn't render the wrong layout while the role is still being fetched.

**Changes in `src/hooks/useAuth.tsx`**:
- Replace `.single()` with `.maybeSingle()` on the `user_roles` query
- Add `roleLoading` to the loading state so the app waits for role data before deciding which layout to show
- When `roleResult.data` is null (no role), explicitly set `userRole` to `null`

**Changes in `src/App.tsx`**:
- In `AppRoutes`, also check that role loading is complete before rendering the portal vs internal layout (to prevent flash of wrong layout)

### Files to edit
- `src/hooks/useAuth.tsx` (fix `.single()` to `.maybeSingle()`, add role loading state)
- `src/App.tsx` (add loading guard in `AppRoutes`)
- New migration SQL to insert admin role for your user


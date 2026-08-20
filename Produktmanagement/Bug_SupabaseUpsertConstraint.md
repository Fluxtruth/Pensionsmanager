# Bug: Supabase Upsert Constraint

## Technical Overview
When executing `.upsert(payload, { onConflict: 'device_id' })` on the `connected_devices` table, Supabase returns the following error:
`"there is no unique or exclusion constraint matching the ON CONFLICT specification"`

PostgreSQL requires a unique index or unique constraint on the column specified in `ON CONFLICT`. The `connected_devices` table currently lacks a unique constraint on `device_id`.

## User Story
As a user or system process syncing devices, I need the device records to be successfully inserted or updated without database constraint errors so that multi-device syncing functions correctly.

## Acceptance Criteria
- A unique constraint is added to the `device_id` column in the `connected_devices` table.
- Upsert operations via the Supabase client succeed without the constraint error.
- A Supabase database migration file is provided for deployment.

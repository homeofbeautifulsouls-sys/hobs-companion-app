-- reserve_availability_slot: atomically reserves a slot only if it's genuinely still available,
-- closing a real race condition where two people could both successfully "reserve" the same
-- slot if their requests overlapped in time (the previous UPDATE ... WHERE id = ? had no check
-- on is_booked at all, so both would simply succeed).
--
-- The WHERE clause here is the entire fix: Postgres guarantees only one concurrent UPDATE can
-- ever match a row with is_booked = false, even under real concurrent load -- the second
-- request's WHERE clause simply won't match anymore once the first has committed, and it
-- correctly updates zero rows instead of double-booking.
create or replace function reserve_availability_slot(slot_id uuid, reserving_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  rows_affected int;
begin
  -- Since this runs as security definer (bypasses RLS), explicitly enforce that a caller can
  -- only ever reserve a slot as themselves -- otherwise a direct RPC call (bypassing the app's
  -- UI) could claim a slot on someone else's behalf by passing an arbitrary reserving_user_id.
  if auth.uid() is distinct from reserving_user_id then
    raise exception 'Forbidden: can only reserve a slot for yourself';
  end if;

  update expert_availability_slots
  set is_booked = true, booked_by = reserving_user_id
  where id = slot_id and is_booked = false;

  get diagnostics rows_affected = row_count;
  return rows_affected > 0;
end;
$$;

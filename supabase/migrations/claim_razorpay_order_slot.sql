-- claim_razorpay_order_slot: atomically claims the right to create a NEW Razorpay order for a
-- specific booking+purpose, closing the real race a prior fix only partially addressed.
--
-- The prior fix (checking for an existing outstanding order before creating a new one) helps
-- with a double-tap on the SAME already-in-flight order, but does nothing for two genuinely
-- simultaneous FIRST requests: both can see "no existing order", both proceed to call Razorpay,
-- both then try to save their own order_id -- one silently overwrites the other, orphaning it.
--
-- This closes that gap with an atomic test-and-set: only one concurrent caller can ever
-- successfully claim the "CREATING" sentinel for a given booking+purpose. The other gets told
-- to wait and re-check, rather than being allowed to independently create a second, competing
-- order for the same payment.
create or replace function claim_razorpay_order_slot(p_booking_id uuid, p_purpose text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  rows_affected int;
  col_name text;
begin
  col_name := case when p_purpose = 'booking_payment' then 'razorpay_order_id' else 'cancellation_razorpay_order_id' end;

  if col_name = 'razorpay_order_id' then
    update expert_bookings set razorpay_order_id = 'CREATING'
    where id = p_booking_id and (razorpay_order_id is null or razorpay_order_id = '');
  else
    update expert_bookings set cancellation_razorpay_order_id = 'CREATING'
    where id = p_booking_id and (cancellation_razorpay_order_id is null or cancellation_razorpay_order_id = '');
  end if;

  get diagnostics rows_affected = row_count;
  return rows_affected > 0;
end;
$$;

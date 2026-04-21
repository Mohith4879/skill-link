-- When a booking is cancelled, free its slot so it can be re-booked.
-- When a booking is rescheduled (slot_id changes), free the old slot and book the new one.

CREATE OR REPLACE FUNCTION public.handle_booking_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Cancellation: free the slot
  IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
    UPDATE public.time_slots
       SET status = 'available'
     WHERE id = NEW.slot_id;
  END IF;

  -- Reschedule: slot_id changed → free old, book new
  IF NEW.slot_id <> OLD.slot_id THEN
    UPDATE public.time_slots SET status = 'available' WHERE id = OLD.slot_id;
    UPDATE public.time_slots SET status = 'booked'    WHERE id = NEW.slot_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS booking_status_change ON public.bookings;
CREATE TRIGGER booking_status_change
AFTER UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.handle_booking_status_change();
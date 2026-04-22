-- ============== MESSAGES ==============
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL CHECK (length(trim(content)) > 0),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_booking ON public.messages(booking_id, created_at);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Helper: is the current user a participant in this booking?
CREATE OR REPLACE FUNCTION public.is_booking_participant(_booking_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.bookings
    WHERE id = _booking_id
      AND (student_id = _user_id OR tutor_id = _user_id)
  );
$$;

CREATE POLICY "Participants can view messages"
ON public.messages FOR SELECT
USING (public.is_booking_participant(booking_id, auth.uid()));

CREATE POLICY "Participants can send messages"
ON public.messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND public.is_booking_participant(booking_id, auth.uid())
);

CREATE POLICY "Participants can mark messages read"
ON public.messages FOR UPDATE
USING (public.is_booking_participant(booking_id, auth.uid()));

-- ============== NOTIFICATIONS ==============
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, created_at DESC);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users delete own notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id);

-- Allow the system (and authenticated users via triggers) to insert notifications
CREATE POLICY "Authenticated can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- ============== TRIGGERS: booking events → notifications ==============
CREATE OR REPLACE FUNCTION public.notify_on_booking_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tutor_name TEXT;
  student_name TEXT;
BEGIN
  SELECT full_name INTO tutor_name FROM public.profiles WHERE user_id = NEW.tutor_id;
  SELECT full_name INTO student_name FROM public.profiles WHERE user_id = NEW.student_id;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, type, title, body, link) VALUES
      (NEW.tutor_id,   'booking_created', 'New booking 🎉',     'New session booked by ' || COALESCE(student_name, 'a student'), '/dashboard'),
      (NEW.student_id, 'booking_created', 'Booking confirmed!', 'Your session with ' || COALESCE(tutor_name, 'your tutor') || ' is confirmed.', '/dashboard');
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
      INSERT INTO public.notifications (user_id, type, title, body, link) VALUES
        (NEW.tutor_id,   'booking_cancelled', 'Session cancelled', 'A session with ' || COALESCE(student_name, 'a student') || ' was cancelled.', '/dashboard'),
        (NEW.student_id, 'booking_cancelled', 'Session cancelled', 'Your session with ' || COALESCE(tutor_name, 'your tutor')  || ' was cancelled.', '/dashboard');
    ELSIF NEW.slot_id <> OLD.slot_id THEN
      INSERT INTO public.notifications (user_id, type, title, body, link) VALUES
        (NEW.tutor_id,   'booking_rescheduled', 'Session rescheduled', 'A session with ' || COALESCE(student_name, 'a student') || ' was moved.', '/dashboard'),
        (NEW.student_id, 'booking_rescheduled', 'Session rescheduled', 'Your session with ' || COALESCE(tutor_name, 'your tutor')  || ' was moved.', '/dashboard');
    ELSIF NEW.status = 'completed' AND OLD.status <> 'completed' THEN
      INSERT INTO public.notifications (user_id, type, title, body, link) VALUES
        (NEW.student_id, 'booking_completed', 'Session complete ✓', 'Don''t forget to leave a rating for ' || COALESCE(tutor_name, 'your tutor') || '.', '/dashboard');
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS booking_event_notify ON public.bookings;
CREATE TRIGGER booking_event_notify
AFTER INSERT OR UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.notify_on_booking_event();

-- ============== TRIGGERS: new message → notification ==============
CREATE OR REPLACE FUNCTION public.notify_on_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recipient UUID;
  sender_name TEXT;
BEGIN
  SELECT CASE WHEN b.student_id = NEW.sender_id THEN b.tutor_id ELSE b.student_id END
    INTO recipient
    FROM public.bookings b WHERE b.id = NEW.booking_id;

  SELECT full_name INTO sender_name FROM public.profiles WHERE user_id = NEW.sender_id;

  IF recipient IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (recipient, 'new_message', 'New message',
            COALESCE(sender_name, 'Someone') || ': ' || left(NEW.content, 80),
            '/dashboard');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS message_notify ON public.messages;
CREATE TRIGGER message_notify
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_message();

-- ============== REALTIME ==============
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
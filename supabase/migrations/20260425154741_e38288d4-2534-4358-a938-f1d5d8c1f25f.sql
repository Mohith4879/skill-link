-- Favorites: students bookmark tutors
CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  tutor_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, tutor_id)
);
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own favorites" ON public.favorites
  FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Users add own favorites" ON public.favorites
  FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Users delete own favorites" ON public.favorites
  FOR DELETE USING (auth.uid() = student_id);

CREATE INDEX idx_favorites_student ON public.favorites(student_id);
CREATE INDEX idx_favorites_tutor ON public.favorites(tutor_id);

-- Reports: report a user
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL,
  reported_id UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (reporter_id <> reported_id)
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own reports" ON public.reports
  FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "Users create own reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Blocks: block another user
CREATE TABLE public.blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID NOT NULL,
  blocked_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own blocks" ON public.blocks
  FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY "Users add own blocks" ON public.blocks
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "Users delete own blocks" ON public.blocks
  FOR DELETE USING (auth.uid() = blocker_id);

CREATE INDEX idx_blocks_blocker ON public.blocks(blocker_id);

-- Tutor verification badge
ALTER TABLE public.tutor_profiles
  ADD COLUMN verified BOOLEAN NOT NULL DEFAULT false;
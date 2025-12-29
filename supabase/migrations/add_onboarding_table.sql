-- Migration: Add onboarding progress tracking
-- Date: 2025-12-23
-- Description: Track onboarding completion for restaurant owners

-- Create onboarding_progress table
CREATE TABLE IF NOT EXISTS public.onboarding_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL UNIQUE REFERENCES public.restaurants(id) ON DELETE CASCADE,
  current_step integer NOT NULL DEFAULT 1,
  completed boolean NOT NULL DEFAULT false,
  steps_completed jsonb NOT NULL DEFAULT '[]'::jsonb,
  skipped boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT onboarding_progress_step_range CHECK (current_step BETWEEN 1 AND 7),
  CONSTRAINT onboarding_progress_steps_is_array CHECK (jsonb_typeof(steps_completed) = 'array')
);

-- Add updated_at trigger
CREATE TRIGGER trg_onboarding_progress_set_updated_at
BEFORE UPDATE ON public.onboarding_progress
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Create index
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_restaurant_id 
ON public.onboarding_progress(restaurant_id);

-- Enable RLS
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Owners can manage their own onboarding
CREATE POLICY onboarding_progress_owner_all
ON public.onboarding_progress
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.restaurants r
    WHERE r.id = onboarding_progress.restaurant_id
      AND r.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.restaurants r
    WHERE r.id = onboarding_progress.restaurant_id
      AND r.user_id = auth.uid()
  )
);

-- Add comment
COMMENT ON TABLE public.onboarding_progress IS 'Tracks onboarding wizard progress for restaurant owners';

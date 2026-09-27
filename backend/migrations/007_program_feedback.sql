CREATE TABLE IF NOT EXISTS public.program_feedback (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id uuid NOT NULL UNIQUE REFERENCES public.applications(id),
    user_id uuid NOT NULL REFERENCES public.profiles(id),
    rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
    message text NOT NULL CHECK (char_length(btrim(message)) BETWEEN 10 AND 2000),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','dismissed')),
    created_at timestamptz NOT NULL DEFAULT now(),
    reviewed_by uuid REFERENCES public.profiles(id)
);
REVOKE ALL ON public.program_feedback FROM public;

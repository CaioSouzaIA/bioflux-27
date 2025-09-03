
CREATE TABLE public.training_prescriptions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    form_response_id uuid NULL,
    file_path text NOT NULL,
    file_name text NOT NULL,
    status text NULL DEFAULT 'active'::text,
    created_at timestamp with time zone NULL DEFAULT now(),
    updated_at timestamp with time zone NULL DEFAULT now()
);

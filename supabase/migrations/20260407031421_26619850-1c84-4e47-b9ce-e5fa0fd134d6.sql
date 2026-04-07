
CREATE TABLE public.api_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL UNIQUE,
  api_key text NOT NULL DEFAULT '',
  api_url text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.api_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view api settings" ON public.api_settings
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert api settings" ON public.api_settings
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update api settings" ON public.api_settings
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete api settings" ON public.api_settings
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed default providers
INSERT INTO public.api_settings (provider, api_key, api_url) VALUES
  ('groq', '', 'https://api.groq.com/openai'),
  ('openrouter', '', 'https://openrouter.ai/api'),
  ('huggingface', '', 'https://api-inference.huggingface.co'),
  ('replicate', '', 'https://api.replicate.com');

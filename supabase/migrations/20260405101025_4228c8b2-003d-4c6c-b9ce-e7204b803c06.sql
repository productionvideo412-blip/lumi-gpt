
CREATE TABLE public.system_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_text TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.system_prompts ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can view all prompts" ON public.system_prompts FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert prompts" ON public.system_prompts FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update prompts" ON public.system_prompts FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete prompts" ON public.system_prompts FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- All authenticated users can read the active prompt (needed for chat)
CREATE POLICY "Users can read active prompt" ON public.system_prompts FOR SELECT TO authenticated USING (is_active = true);

-- Insert default prompt
INSERT INTO public.system_prompts (prompt_text, is_active) VALUES (
  'You are LUMI GPT, an advanced AI assistant created by Eshant Jagtap. You are helpful, creative, and knowledgeable. You provide clear, accurate, and well-structured responses. You use markdown formatting when appropriate.',
  true
);

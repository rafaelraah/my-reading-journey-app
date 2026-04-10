
CREATE TABLE public.usuarios (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL DEFAULT 'Leitor Mágico',
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view usuarios" ON public.usuarios FOR SELECT USING (true);
CREATE POLICY "Anyone can insert usuarios" ON public.usuarios FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update usuarios" ON public.usuarios FOR UPDATE USING (true);

-- Seed a default user
INSERT INTO public.usuarios (nome) VALUES ('Leitor Mágico');

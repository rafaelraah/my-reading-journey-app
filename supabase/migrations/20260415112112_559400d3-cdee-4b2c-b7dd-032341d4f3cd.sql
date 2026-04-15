
-- Add auth columns to usuarios
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS username text UNIQUE;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS password_hash text;

-- Insert default user rafael (password: Teste123 stored as plain text for simplicity)
INSERT INTO public.usuarios (nome, username, password_hash)
VALUES ('Rafael', 'rafael', 'Teste123')
ON CONFLICT DO NOTHING;

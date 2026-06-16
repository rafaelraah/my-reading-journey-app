
-- Clubes de Leitura
CREATE TABLE public.clubes_leitura (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  imagem_url text,
  categoria text,
  criador_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  livro_ativo_id uuid REFERENCES public.livros_globais(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.clubes_leitura TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clubes_leitura TO authenticated;
GRANT ALL ON public.clubes_leitura TO service_role;
ALTER TABLE public.clubes_leitura ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clubes select all" ON public.clubes_leitura FOR SELECT USING (true);
CREATE POLICY "clubes insert any" ON public.clubes_leitura FOR INSERT WITH CHECK (true);
CREATE POLICY "clubes update any" ON public.clubes_leitura FOR UPDATE USING (true);
CREATE POLICY "clubes delete any" ON public.clubes_leitura FOR DELETE USING (true);

-- Membros
CREATE TABLE public.clube_membros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clube_id uuid NOT NULL REFERENCES public.clubes_leitura(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pendente',
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(clube_id, usuario_id)
);
GRANT SELECT ON public.clube_membros TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clube_membros TO authenticated;
GRANT ALL ON public.clube_membros TO service_role;
ALTER TABLE public.clube_membros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "membros select all" ON public.clube_membros FOR SELECT USING (true);
CREATE POLICY "membros insert any" ON public.clube_membros FOR INSERT WITH CHECK (true);
CREATE POLICY "membros update any" ON public.clube_membros FOR UPDATE USING (true);
CREATE POLICY "membros delete any" ON public.clube_membros FOR DELETE USING (true);

-- Progresso por membro no livro ativo
CREATE TABLE public.clube_progresso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clube_id uuid NOT NULL REFERENCES public.clubes_leitura(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  livro_id uuid REFERENCES public.livros_globais(id) ON DELETE CASCADE,
  pagina_atual integer NOT NULL DEFAULT 0,
  percentual integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'quero_ler',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(clube_id, usuario_id, livro_id)
);
GRANT SELECT ON public.clube_progresso TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clube_progresso TO authenticated;
GRANT ALL ON public.clube_progresso TO service_role;
ALTER TABLE public.clube_progresso ENABLE ROW LEVEL SECURITY;
CREATE POLICY "progresso select all" ON public.clube_progresso FOR SELECT USING (true);
CREATE POLICY "progresso insert any" ON public.clube_progresso FOR INSERT WITH CHECK (true);
CREATE POLICY "progresso update any" ON public.clube_progresso FOR UPDATE USING (true);
CREATE POLICY "progresso delete any" ON public.clube_progresso FOR DELETE USING (true);

-- Posts do clube
CREATE TABLE public.clube_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clube_id uuid NOT NULL REFERENCES public.clubes_leitura(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  conteudo text NOT NULL,
  tipo text NOT NULL DEFAULT 'post',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.clube_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clube_posts TO authenticated;
GRANT ALL ON public.clube_posts TO service_role;
ALTER TABLE public.clube_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clube_posts select all" ON public.clube_posts FOR SELECT USING (true);
CREATE POLICY "clube_posts insert any" ON public.clube_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "clube_posts update any" ON public.clube_posts FOR UPDATE USING (true);
CREATE POLICY "clube_posts delete any" ON public.clube_posts FOR DELETE USING (true);

-- Comentários nos posts do clube
CREATE TABLE public.clube_comentarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.clube_posts(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  conteudo text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.clube_comentarios TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clube_comentarios TO authenticated;
GRANT ALL ON public.clube_comentarios TO service_role;
ALTER TABLE public.clube_comentarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clube_com select all" ON public.clube_comentarios FOR SELECT USING (true);
CREATE POLICY "clube_com insert any" ON public.clube_comentarios FOR INSERT WITH CHECK (true);
CREATE POLICY "clube_com update any" ON public.clube_comentarios FOR UPDATE USING (true);
CREATE POLICY "clube_com delete any" ON public.clube_comentarios FOR DELETE USING (true);

-- Storage bucket reuse: use existing book-covers for club covers too

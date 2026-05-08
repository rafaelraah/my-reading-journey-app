-- Repoint livro_eventos.livro_id FK to livros_globais
ALTER TABLE public.livro_eventos DROP CONSTRAINT IF EXISTS livro_eventos_livro_id_fkey;

-- Remove orphan rows that don't match livros_globais (legacy data referencing old livros table)
DELETE FROM public.livro_eventos WHERE livro_id NOT IN (SELECT id FROM public.livros_globais);

ALTER TABLE public.livro_eventos
  ADD CONSTRAINT livro_eventos_livro_id_fkey
  FOREIGN KEY (livro_id) REFERENCES public.livros_globais(id) ON DELETE CASCADE;
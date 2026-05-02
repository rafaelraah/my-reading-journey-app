-- ============================================================
-- 1) Protect password_hash on usuarios (column-level privileges)
-- ============================================================
-- Revoke broad SELECT first, then grant SELECT only on safe columns.
REVOKE SELECT ON public.usuarios FROM anon, authenticated;

GRANT SELECT (id, nome, username, avatar_url, created_at)
  ON public.usuarios TO anon, authenticated;

-- INSERT/UPDATE need the column for signup + (eventual) password change,
-- but those go through the existing "Anyone can insert/update usuarios" RLS policies.
GRANT INSERT, UPDATE ON public.usuarios TO anon, authenticated;

-- ============================================================
-- 2) Secure login function (SECURITY DEFINER)
-- ============================================================
CREATE OR REPLACE FUNCTION public.verify_user_credentials(
  p_username TEXT,
  p_password TEXT
)
RETURNS TABLE (
  id UUID,
  nome TEXT,
  username TEXT,
  avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.nome, u.username, u.avatar_url
  FROM public.usuarios u
  WHERE u.username = p_username
    AND u.password_hash = p_password
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_user_credentials(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_user_credentials(TEXT, TEXT) TO anon, authenticated;

-- ============================================================
-- 3) Lock down livros_globais writes (remove update/delete)
-- ============================================================
DROP POLICY IF EXISTS "Anyone can update global books" ON public.livros_globais;
DROP POLICY IF EXISTS "Anyone can delete global books" ON public.livros_globais;
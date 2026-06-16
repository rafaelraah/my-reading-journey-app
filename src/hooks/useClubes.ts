import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Clube {
  id: string;
  nome: string;
  descricao: string | null;
  imagem_url: string | null;
  categoria: string | null;
  criador_id: string;
  livro_ativo_id: string | null;
  created_at: string;
}

export interface ClubeMembro {
  id: string;
  clube_id: string;
  usuario_id: string;
  status: 'pendente' | 'aceito';
  is_admin: boolean;
  created_at: string;
  usuario?: { id: string; nome: string; username: string | null; avatar_url: string | null } | null;
}

export interface ClubeProgresso {
  id: string;
  clube_id: string;
  usuario_id: string;
  livro_id: string | null;
  pagina_atual: number;
  percentual: number;
  status: string;
  updated_at: string;
}

export interface ClubePost {
  id: string;
  clube_id: string;
  usuario_id: string;
  conteudo: string;
  tipo: string;
  created_at: string;
  autor?: { id: string; nome: string; username: string | null; avatar_url: string | null } | null;
}

export interface ClubeComentario {
  id: string;
  post_id: string;
  usuario_id: string;
  conteudo: string;
  created_at: string;
  autor?: { id: string; nome: string; username: string | null; avatar_url: string | null } | null;
}

const s: any = supabase;

export function useClubes() {
  const { user } = useAuth();
  const [myClubes, setMyClubes] = useState<Clube[]>([]);
  const [invites, setInvites] = useState<(ClubeMembro & { clube?: Clube | null })[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMine = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: memb } = await s
      .from('clube_membros')
      .select('clube_id, status, clubes_leitura:clube_id(*)')
      .eq('usuario_id', user.id);
    const accepted: Clube[] = [];
    const pending: any[] = [];
    (memb || []).forEach((m: any) => {
      if (!m.clubes_leitura) return;
      if (m.status === 'aceito') accepted.push(m.clubes_leitura);
      else if (m.status === 'pendente') pending.push({ ...m, clube: m.clubes_leitura });
    });
    setMyClubes(accepted);
    setInvites(pending);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchMine(); }, [fetchMine]);

  const createClube = useCallback(async (payload: { nome: string; descricao?: string; categoria?: string; imagem_url?: string | null }) => {
    if (!user) return { error: 'no user', clube: null as Clube | null };
    const { data, error } = await s.from('clubes_leitura').insert({
      nome: payload.nome,
      descricao: payload.descricao || null,
      categoria: payload.categoria || null,
      imagem_url: payload.imagem_url || null,
      criador_id: user.id,
    }).select().single();
    if (error) return { error: error.message, clube: null };
    // Add creator as accepted admin member
    await s.from('clube_membros').insert({
      clube_id: data.id, usuario_id: user.id, status: 'aceito', is_admin: true,
    });
    await fetchMine();
    return { error: null, clube: data as Clube };
  }, [user, fetchMine]);

  const inviteUser = useCallback(async (clubeId: string, clubeNome: string, targetUserId: string) => {
    if (!user) return { error: 'no user' };
    const { error } = await s.from('clube_membros').insert({
      clube_id: clubeId, usuario_id: targetUserId, status: 'pendente',
    });
    if (error) {
      if (error.code === '23505') return { error: 'Usuário já é membro ou foi convidado' };
      return { error: error.message };
    }
    const handle = user.username ? `@${user.username}` : user.nome;
    await s.from('notificacoes').insert({
      usuario_id: targetUserId,
      tipo: 'clube_invite',
      mensagem: `${handle} te convidou para o clube "${clubeNome}"`,
      actor_id: user.id,
    });
    return { error: null };
  }, [user]);

  const respondInvite = useCallback(async (membroId: string, accept: boolean, clubeId: string) => {
    if (accept) {
      await s.from('clube_membros').update({ status: 'aceito' }).eq('id', membroId);
      // notify other members
      if (user) {
        const { data: members } = await s.from('clube_membros').select('usuario_id').eq('clube_id', clubeId).eq('status', 'aceito').neq('usuario_id', user.id);
        const { data: clube } = await s.from('clubes_leitura').select('nome').eq('id', clubeId).single();
        for (const m of (members || [])) {
          await s.from('notificacoes').insert({
            usuario_id: m.usuario_id,
            tipo: 'clube_member',
            mensagem: `${user.nome} entrou no clube "${clube?.nome || ''}"`,
            actor_id: user.id,
          });
        }
      }
    } else {
      await s.from('clube_membros').delete().eq('id', membroId);
    }
    await fetchMine();
  }, [user, fetchMine]);

  return { myClubes, invites, loading, fetchMine, createClube, inviteUser, respondInvite };
}

export async function fetchClubeById(id: string): Promise<Clube | null> {
  const { data } = await s.from('clubes_leitura').select('*').eq('id', id).single();
  return data as Clube | null;
}

export async function fetchClubeMembros(clubeId: string): Promise<ClubeMembro[]> {
  const { data } = await s
    .from('clube_membros')
    .select('*, usuario:usuario_id(id, nome, username, avatar_url)')
    .eq('clube_id', clubeId)
    .order('created_at', { ascending: true });
  return (data || []) as ClubeMembro[];
}

export async function fetchClubeProgresso(clubeId: string, livroId: string | null): Promise<ClubeProgresso[]> {
  if (!livroId) return [];
  const { data } = await s
    .from('clube_progresso')
    .select('*')
    .eq('clube_id', clubeId)
    .eq('livro_id', livroId);
  return (data || []) as ClubeProgresso[];
}

export async function upsertProgresso(p: { clube_id: string; usuario_id: string; livro_id: string; pagina_atual: number; percentual: number; status: string }) {
  // Try update; if no row, insert
  const { data: existing } = await s.from('clube_progresso')
    .select('id')
    .eq('clube_id', p.clube_id).eq('usuario_id', p.usuario_id).eq('livro_id', p.livro_id)
    .maybeSingle();
  if (existing?.id) {
    await s.from('clube_progresso').update({
      pagina_atual: p.pagina_atual, percentual: p.percentual, status: p.status, updated_at: new Date().toISOString(),
    }).eq('id', existing.id);
  } else {
    await s.from('clube_progresso').insert(p);
  }
  // auto-post progress to club feed
  await s.from('clube_posts').insert({
    clube_id: p.clube_id, usuario_id: p.usuario_id, tipo: 'progresso',
    conteudo: `Atualizou o progresso: página ${p.pagina_atual} (${p.percentual}%) — ${p.status === 'lido' ? 'Finalizado' : p.status === 'lendo' ? 'Lendo' : 'Quero Ler'}`,
  });
}

export async function fetchClubePosts(clubeId: string): Promise<ClubePost[]> {
  const { data } = await s
    .from('clube_posts')
    .select('*, autor:usuario_id(id, nome, username, avatar_url)')
    .eq('clube_id', clubeId)
    .order('created_at', { ascending: false });
  return (data || []) as ClubePost[];
}

export async function createClubePost(clubeId: string, usuarioId: string, conteudo: string) {
  await s.from('clube_posts').insert({ clube_id: clubeId, usuario_id: usuarioId, conteudo, tipo: 'post' });
}

export async function fetchClubeComentarios(postId: string): Promise<ClubeComentario[]> {
  const { data } = await s
    .from('clube_comentarios')
    .select('*, autor:usuario_id(id, nome, username, avatar_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  return (data || []) as ClubeComentario[];
}

export async function createClubeComentario(postId: string, usuarioId: string, conteudo: string) {
  await s.from('clube_comentarios').insert({ post_id: postId, usuario_id: usuarioId, conteudo });
}

export async function setClubeBook(clubeId: string, livroId: string | null) {
  await s.from('clubes_leitura').update({ livro_ativo_id: livroId }).eq('id', clubeId);
  if (livroId) {
    const { data: members } = await s.from('clube_membros').select('usuario_id').eq('clube_id', clubeId).eq('status', 'aceito');
    const { data: clube } = await s.from('clubes_leitura').select('nome').eq('id', clubeId).single();
    const { data: book } = await s.from('livros_globais').select('titulo').eq('id', livroId).single();
    for (const m of (members || [])) {
      await s.from('notificacoes').insert({
        usuario_id: m.usuario_id, tipo: 'clube_book', livro_id: livroId,
        mensagem: `Novo livro no clube "${clube?.nome}": ${book?.titulo}`,
      });
    }
  }
}

export async function fetchUserClubes(userId: string): Promise<Clube[]> {
  const { data } = await s
    .from('clube_membros')
    .select('clubes_leitura:clube_id(*)')
    .eq('usuario_id', userId)
    .eq('status', 'aceito');
  return ((data || []) as any[]).map((m) => m.clubes_leitura).filter(Boolean);
}

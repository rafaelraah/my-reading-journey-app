import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UserProfile {
  id: string;
  nome: string;
  avatar_url: string | null;
  created_at: string;
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
    } else {
      setProfile(data as UserProfile);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateName = useCallback(async (nome: string) => {
    if (!profile) return;
    const { error } = await supabase
      .from('usuarios')
      .update({ nome })
      .eq('id', profile.id);

    if (error) {
      toast.error('Erro ao atualizar nome');
    } else {
      setProfile(prev => prev ? { ...prev, nome } : prev);
      toast.success('Nome atualizado!');
    }
  }, [profile]);

  const uploadAvatar = useCallback(async (file: File) => {
    if (!profile) return;
    const ext = file.name.split('.').pop();
    const fileName = `avatars/${profile.id}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('book-covers')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      toast.error('Erro ao fazer upload do avatar');
      return;
    }

    const { data } = supabase.storage
      .from('book-covers')
      .getPublicUrl(fileName);

    const avatar_url = `${data.publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase
      .from('usuarios')
      .update({ avatar_url })
      .eq('id', profile.id);

    if (updateError) {
      toast.error('Erro ao salvar avatar');
    } else {
      setProfile(prev => prev ? { ...prev, avatar_url } : prev);
      toast.success('Avatar atualizado!');
    }
  }, [profile]);

  return { profile, loading, updateName, uploadAvatar };
}

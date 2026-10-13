import { useState, useEffect, useCallback } from 'react';
import { supabase, Profile } from '../lib/supabase';
import { UserRole } from '../types';

interface AuthState {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    profile: null,
    loading: true,
    error: null,
  });

  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, kelas:kelas_id(id, nama)')
      .eq('id', userId)
      .single();

    if (error || !data) {
      setState({ profile: null, loading: false, error: 'Profil tidak ditemukan.' });
      return null;
    }

    const prof = { ...(data as Profile) };

    // Dynamic Homeroom Check: Is this teacher a Wali Kelas for any class?
    if (prof.role === 'guru') {
      try {
        const { data: homeroomClass } = await supabase
          .from('kelas')
          .select('id, nama')
          .eq('wali_kelas_id', userId)
          .order('nama', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (homeroomClass) {
          prof.is_wali_kelas = true;
          prof.wali_kelas = homeroomClass;
        } else {
          prof.is_wali_kelas = false;
          prof.wali_kelas = null;
        }

        // Dynamic Duty Check: Is this teacher on Guru Piket duty today?
        const hariMap: Record<number, string> = {
          0: 'Minggu', 1: 'Senin', 2: 'Selasa', 3: 'Rabu', 4: 'Kamis', 5: 'Jumat', 6: 'Sabtu'
        };
        const todayHari = hariMap[new Date().getDay()] || 'Senin';
        const savedPiket = localStorage.getItem('smkn1_jadwal_piket_v2');
        if (savedPiket) {
          try {
            const piketData = JSON.parse(savedPiket);
            const todayGurus: string[] = piketData[todayHari] || [];
            prof.is_guru_piket = todayGurus.includes(userId);
          } catch (e) {
            console.error('Error parsing piket schedule in auth:', e);
          }
        }
      } catch (err) {
        console.error('Error checking homeroom / duty status:', err);
      }
    }

    setState({ profile: prof, loading: false, error: null });
    return prof;
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setState({ profile: null, loading: false, error: null });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setState({ profile: null, loading: false, error: null });
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const login = useCallback(async (identifier: string, password: string): Promise<{ profile: Profile | null; error: string | null }> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    let finalUsername = identifier.trim();
    const cleanLower = finalUsername.toLowerCase();

    // Superadmin bypass / demo root fallback
    if (cleanLower === 'superadmin' || cleanLower === 'superadmin_sorong' || cleanLower === 'kepsek') {
      const superProfile: Profile = {
        id: 'superadmin-root-0',
        username: 'superadmin_sorong',
        nama: 'Superadmin SIAP (Kepala Sekolah)',
        role: 'superadmin' as any,
        is_sekretaris: false,
        kelas_id: null,
        must_change_password: false,
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      };
      setState({ profile: superProfile, loading: false, error: null });
      return { profile: superProfile, error: null };
    }

    // Admin TU bypass / demo fallback
    if (cleanLower === 'tu' || cleanLower === 'admin_demo' || cleanLower === 'admin') {
      const tuProfile: Profile = {
        id: 'admin-tu-root-0',
        username: 'admin_demo',
        nama: 'Administrator SMKN 1 (Tata Usaha)',
        role: 'operator' as any,
        is_sekretaris: false,
        kelas_id: null,
        must_change_password: false,
        avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      };
      setState({ profile: tuProfile, loading: false, error: null });
      return { profile: tuProfile, error: null };
    }

    // Resolve name or NISN or TU to username
    let { data: profileLookup } = await supabase
      .from('profiles')
      .select('username')
      .or(`username.ilike.${cleanLower},username.ilike.s${cleanLower}`)
      .limit(1)
      .maybeSingle();

    if (!profileLookup?.username) {
      const { data: exactName } = await supabase
        .from('profiles')
        .select('username')
        .ilike('nama', finalUsername)
        .limit(1)
        .maybeSingle();
      profileLookup = exactName;
    }

    if (!profileLookup?.username) {
      const { data: partialName } = await supabase
        .from('profiles')
        .select('username')
        .ilike('nama', `%${finalUsername}%`)
        .limit(1)
        .maybeSingle();
      profileLookup = partialName;
    }

    if (profileLookup?.username) {
      finalUsername = profileLookup.username;
    }

    const email = `${finalUsername}@smkn1sorong.sch.id`;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      const msg = `Gagal masuk (${error?.message || 'Tidak ada akses'}). Pastikan akun sudah dibuat.`;
      setState(prev => ({ ...prev, loading: false, error: msg }));
      return { profile: null, error: msg };
    }

    const profile = await loadProfile(data.user.id);
    return { profile, error: null };
  }, [loadProfile]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setState({ profile: null, loading: false, error: null });
  }, []);

  const changePassword = useCallback(async (newPassword: string): Promise<string | null> => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return error.message;

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await supabase.from('profiles').update({ must_change_password: false }).eq('id', session.user.id);
      await loadProfile(session.user.id);
    }
    return null;
  }, [loadProfile]);

  // Role mapping
  const resolveRole = (profile: Profile): UserRole => {
    if ((profile.role as string) === 'superadmin') return 'superadmin';
    if (profile.role === 'operator' || (profile.role as any) === 'admin') return 'operator';
    if (profile.role === 'guru_piket') return 'guru_piket';
    if (profile.role === 'wali_kelas') return 'wali_kelas';
    if (profile.role === 'guru') return 'guru';
    if (profile.is_sekretaris) return 'sekretaris';
    return 'siswa';
  };

  const userRole: UserRole | null = state.profile ? resolveRole(state.profile) : null;

  return {
    profile: state.profile,
    userRole,
    loading: state.loading,
    error: state.error,
    login,
    logout,
    changePassword,
    isLoggedIn: !!state.profile,
    mustChangePassword: state.profile?.must_change_password ?? false,
  };
}

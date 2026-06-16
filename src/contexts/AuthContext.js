import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Auth contra Supabase: signUp/signIn/signOut + perfil en public.users +
// (para fundaciones) row en public.organizaciones. El trigger
// handle_new_user del schema completa public.users cuando se crea un row
// en auth.users; este contexto solo hidrata el usuario y enriquece con
// organizacionId cuando aplica.

const AuthContext = createContext(null);

const normalizeEmail = (e) => e.trim().toLowerCase();

async function fetchProfile(userId, fallbackEmail) {
  const { data: profile, error } = await supabase
    .from('users')
    .select('id, email, nombre, role')
    .eq('id', userId)
    .maybeSingle();

  if (error || !profile) return null;

  let organizacionId = null;
  if (profile.role === 'fundacion') {
    const { data: org } = await supabase
      .from('organizaciones')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    organizacionId = org?.id ?? null;
  }

  return {
    id: profile.id,
    email: profile.email ?? fallbackEmail,
    nombre: profile.nombre,
    role: profile.role,
    organizacionId,
  };
}

function mapSignupError(error) {
  const msg = (error.message || '').toLowerCase();
  if (msg.includes('already') || msg.includes('exists') || msg.includes('registered')) {
    return 'Ya existe una cuenta con ese email.';
  }
  if (msg.includes('password')) {
    return 'La contraseña no cumple los requisitos del proveedor.';
  }
  return error.message || 'No se pudo crear la cuenta.';
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const hydrate = async (session) => {
      if (!mounted) return;
      if (session?.user) {
        const profile = await fetchProfile(session.user.id, session.user.email);
        if (mounted) setUser(profile);
      } else {
        setUser(null);
      }
    };

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      await hydrate(session);
      if (mounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        hydrate(session);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: normalizeEmail(email),
      password,
    });
    if (error) {
      return {
        ok: false,
        error:
          'No encontramos una cuenta con ese email y contraseña. Revisa que estén bien escritos e intenta de nuevo.',
      };
    }
    return { ok: true };
  };

  const signupNormal = async ({ email, password, nombre }) => {
    const { data, error } = await supabase.auth.signUp({
      email: normalizeEmail(email),
      password,
      options: { data: { role: 'normal', nombre: nombre.trim() } },
    });
    if (error) return { ok: false, error: mapSignupError(error) };
    if (!data.session) {
      return {
        ok: false,
        error:
          'La cuenta se creó pero el proveedor exige confirmar email. Desactiva "Confirm email" en Supabase Auth para que entre directo.',
      };
    }
    return { ok: true };
  };

  const signupFundacion = async ({
    email,
    password,
    nombre,
    comuna,
    descripcion,
    comunasOperacion,
    telefono,
    horario,
    banco,
  }) => {
    const { data, error } = await supabase.auth.signUp({
      email: normalizeEmail(email),
      password,
      options: { data: { role: 'fundacion', nombre: nombre.trim() } },
    });
    if (error) return { ok: false, error: mapSignupError(error) };
    if (!data.user || !data.session) {
      return {
        ok: false,
        error:
          'No se pudo crear la cuenta (¿"Confirm email" activado en Supabase?). Desactívalo y vuelve a intentar.',
      };
    }

    const { error: orgErr } = await supabase.from('organizaciones').insert({
      nombre: nombre.trim(),
      comuna: comuna.trim(),
      comunas_operacion: comunasOperacion,
      descripcion: descripcion.trim(),
      telefono: telefono.trim(),
      horario: horario.trim(),
      banco,
      user_id: data.user.id,
    });

    if (orgErr) {
      return {
        ok: false,
        error: `La cuenta se creó pero falló registrar la organización: ${orgErr.message}`,
      };
    }

    // Re-fetch para que el contexto tenga organizacionId disponible aunque el
    // listener de onAuthStateChange ya haya corrido antes del insert.
    const profile = await fetchProfile(data.user.id, data.user.email);
    setUser(profile);
    return { ok: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const editarPerfil = async ({ nombre }) => {
    if (!user) return { ok: false, error: 'No hay sesión activa.' };
    const nuevoNombre = nombre.trim();
    if (!nuevoNombre) {
      return { ok: false, error: 'El nombre no puede estar vacío.' };
    }

    const { error } = await supabase
      .from('users')
      .update({ nombre: nuevoNombre })
      .eq('id', user.id);

    if (error) return { ok: false, error: error.message };

    setUser((prev) => (prev ? { ...prev, nombre: nuevoNombre } : prev));
    return { ok: true };
  };

  const editarOrganizacion = async (updates) => {
    if (user?.role !== 'fundacion') {
      return { ok: false, error: 'Solo las fundaciones pueden editar su ficha.' };
    }
    if (!user.organizacionId) {
      return { ok: false, error: 'No encontramos tu organización.' };
    }

    // El form pasa `redes: undefined` cuando no hay ninguna; la columna acepta null.
    const payload = { ...updates };
    if (payload.redes === undefined) payload.redes = null;

    const { error } = await supabase
      .from('organizaciones')
      .update(payload)
      .eq('id', user.organizacionId);

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  };

  const eliminarCuenta = async () => {
    if (!user) return { ok: false, error: 'No hay sesión activa.' };
    const { error } = await supabase.rpc('delete_self');
    if (error) return { ok: false, error: error.message };
    await supabase.auth.signOut();
    return { ok: true };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        signupNormal,
        signupFundacion,
        editarPerfil,
        editarOrganizacion,
        eliminarCuenta,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}

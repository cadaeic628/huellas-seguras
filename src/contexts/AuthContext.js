import React, { createContext, useContext, useState } from 'react';
import { ORGANIZACIONES, USUARIOS_DEMO } from '../data/mockData';

// Auth mockeada: vive solo en memoria. Al recargar la app, vuelve al estado
// deslogueado y los usuarios creados durante la sesión se pierden, igual que el
// resto de la data (ver convención en CLAUDE.md). Cuando se migre a Supabase
// (Roadmap §1) esta lógica se reemplaza por llamadas al cliente.

const AuthContext = createContext(null);

let userIdSeq = 1000;
let orgIdSeq = 100;

const normalizeEmail = (e) => e.trim().toLowerCase();

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(USUARIOS_DEMO);
  const [user, setUser] = useState(null);

  const sessionFromRecord = (u) => ({
    id: u.id,
    email: u.email,
    nombre: u.nombre,
    role: u.role,
    organizacionId: u.organizacionId,
  });

  const login = (email, password) => {
    const record = users.find(
      (u) => normalizeEmail(u.email) === normalizeEmail(email) && u.password === password
    );
    if (!record) {
      // Mensaje genérico (no decimos si fue el email o la contraseña) para no
      // filtrar qué emails existen en el sistema.
      return {
        ok: false,
        error:
          'No encontramos una cuenta con ese email y contraseña. Revisa que estén bien escritos e intenta de nuevo.',
      };
    }
    setUser(sessionFromRecord(record));
    return { ok: true };
  };

  const emailTaken = (email) =>
    users.some((u) => normalizeEmail(u.email) === normalizeEmail(email));

  const signupNormal = ({ email, password, nombre }) => {
    if (emailTaken(email)) {
      return { ok: false, error: 'Ya existe una cuenta con ese email.' };
    }
    const record = {
      id: `USER-${++userIdSeq}`,
      email: email.trim(),
      password,
      nombre: nombre.trim(),
      role: 'normal',
    };
    setUsers((prev) => [...prev, record]);
    setUser(sessionFromRecord(record));
    return { ok: true };
  };

  const signupFundacion = ({
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
    if (emailTaken(email)) {
      return { ok: false, error: 'Ya existe una cuenta con ese email.' };
    }
    const orgId = `ORG-${String(++orgIdSeq).padStart(2, '0')}`;
    // ORGANIZACIONES se usa por importación directa desde otros screens;
    // mutamos el arreglo para que la nueva fundación aparezca en Donar y Foro
    // sin tener que rehidratar nada. Cuando exista DB esto desaparece.
    ORGANIZACIONES.push({
      id: orgId,
      nombre: nombre.trim(),
      comuna: comuna.trim(),
      comunasOperacion,
      descripcion: descripcion.trim(),
      telefono: telefono.trim(),
      horario: horario.trim(),
      banco,
    });

    const record = {
      id: `USER-${++userIdSeq}`,
      email: email.trim(),
      password,
      nombre: nombre.trim(),
      role: 'fundacion',
      organizacionId: orgId,
    };
    setUsers((prev) => [...prev, record]);
    setUser(sessionFromRecord(record));
    return { ok: true };
  };

  const logout = () => setUser(null);

  const editarPerfil = ({ nombre }) => {
    if (!user) return { ok: false, error: 'No hay sesión activa.' };
    const nuevoNombre = nombre.trim();
    if (!nuevoNombre) return { ok: false, error: 'El nombre no puede estar vacío.' };
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, nombre: nuevoNombre } : u))
    );
    setUser((prev) => ({ ...prev, nombre: nuevoNombre }));
    return { ok: true };
  };

  const editarOrganizacion = (updates) => {
    if (user?.role !== 'fundacion') {
      return { ok: false, error: 'Solo las fundaciones pueden editar su ficha.' };
    }
    const idx = ORGANIZACIONES.findIndex((o) => o.id === user.organizacionId);
    if (idx === -1) {
      return { ok: false, error: 'No encontramos tu organización.' };
    }
    // Mutación directa del arreglo (mismo patrón que signupFundacion). Forzamos
    // el re-render con un setUser idempotente para que la UI tome los cambios.
    ORGANIZACIONES[idx] = { ...ORGANIZACIONES[idx], ...updates };
    setUser((prev) => ({ ...prev }));
    return { ok: true };
  };

  const eliminarCuenta = () => {
    if (!user) return { ok: false, error: 'No hay sesión activa.' };
    setUsers((prev) => prev.filter((u) => u.id !== user.id));
    setUser(null);
    return { ok: true };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
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

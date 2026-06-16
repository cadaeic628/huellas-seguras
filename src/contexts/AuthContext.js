import React, { createContext, useContext, useState } from 'react';
import { ORGANIZACIONES, USUARIOS_DEMO } from '../data/mockData';

// Auth mockeada: vive solo en memoria. Al recargar la app, vuelve al estado
// deslogueado y los usuarios creados durante la sesión se pierden, igual que el
// resto de la data (ver convención en CLAUDE.md). Cuando se migre a Supabase
// (Roadmap §4) esta lógica se reemplaza por llamadas al cliente.

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
    if (!record) return { ok: false, error: 'Email o contraseña incorrectos.' };
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

  return (
    <AuthContext.Provider
      value={{ user, login, logout, signupNormal, signupFundacion }}
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

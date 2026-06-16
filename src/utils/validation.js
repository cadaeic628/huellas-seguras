// Validaciones puras (sin React) usadas por la pantalla de auth y formularios
// futuros. Cada validador devuelve un booleano simple; los formateadores
// reciben el texto crudo y devuelven el texto enmascarado para mostrar en el
// TextInput.

// --- Email ---
export const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

// --- Password: chequeo en tiempo real con 5 reglas ---
export const PASSWORD_RULES = [
  { id: 'len', label: 'Al menos 8 caracteres', test: (p) => p.length >= 8 },
  { id: 'lower', label: 'Una letra minúscula', test: (p) => /[a-z]/.test(p) },
  { id: 'upper', label: 'Una letra mayúscula', test: (p) => /[A-Z]/.test(p) },
  { id: 'num', label: 'Un número', test: (p) => /\d/.test(p) },
  {
    id: 'special',
    label: 'Un carácter especial (!@#$...)',
    test: (p) => /[^A-Za-z0-9]/.test(p),
  },
];

export const passwordChecks = (password) =>
  PASSWORD_RULES.map((r) => ({ id: r.id, label: r.label, ok: r.test(password) }));

export const isPasswordStrong = (password) =>
  PASSWORD_RULES.every((r) => r.test(password));

// --- RUT chileno: enmascarado como 12.345.678-9 + dígito verificador ---
export const formatRut = (input) => {
  const clean = (input || '').replace(/[^0-9kK]/g, '').toUpperCase();
  if (clean.length === 0) return '';
  if (clean.length === 1) return clean;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  const withDots = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${withDots}-${dv}`;
};

const computeDv = (body) => {
  let sum = 0;
  let factor = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const r = 11 - (sum % 11);
  if (r === 11) return '0';
  if (r === 10) return 'K';
  return String(r);
};

export const isValidRut = (rut) => {
  const clean = (rut || '').replace(/[^0-9kK]/g, '').toUpperCase();
  if (clean.length < 8) return false; // cuerpo >= 7 + dv
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  if (!/^\d+$/.test(body)) return false;
  return computeDv(body) === dv;
};

// --- Teléfono chileno: guardamos solo los 9 dígitos del número, el prefijo
// "+56" se muestra como label en la UI. El display agrupa como "9 XXXX XXXX".
export const formatPhoneDigits = (input) => {
  let digits = (input || '').replace(/\D/g, '');
  if (digits.startsWith('56')) digits = digits.slice(2);
  return digits.slice(0, 9);
};

export const formatPhoneDisplay = (digits) => {
  if (!digits) return '';
  let s = digits[0];
  if (digits.length > 1) s += ' ' + digits.slice(1, 5);
  if (digits.length > 5) s += ' ' + digits.slice(5, 9);
  return s;
};

export const isValidPhone = (digits) => /^9\d{8}$/.test(digits || '');

// --- Hora HH:MM con auto-formato ---
export const formatTime = (input) => {
  const digits = (input || '').replace(/\D/g, '').slice(0, 4);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
};

export const isValidTime = (s) => {
  const m = /^(\d{2}):(\d{2})$/.exec(s || '');
  if (!m) return false;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  return h >= 0 && h <= 23 && min >= 0 && min <= 59;
};

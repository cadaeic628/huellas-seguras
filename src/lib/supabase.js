// Cliente Supabase compartido. La URL y la anon key se leen desde
// `app.json` → `expo.extra`. La anon key es pública por diseño; nunca
// commitear la service_role.
//
// La sesión persiste en localStorage en web (default del SDK). En nativo
// sin AsyncStorage, vive en memoria — al recargar vuelve a deslogueado,
// que es el mismo comportamiento del mock anterior.

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};
const SUPABASE_URL = extra.SUPABASE_URL;
const SUPABASE_ANON_KEY = extra.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    '[supabase] Faltan SUPABASE_URL o SUPABASE_ANON_KEY en app.json -> expo.extra. ' +
      'Las llamadas al backend van a fallar hasta que se configuren.'
  );
}

export const supabase = createClient(SUPABASE_URL ?? '', SUPABASE_ANON_KEY ?? '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

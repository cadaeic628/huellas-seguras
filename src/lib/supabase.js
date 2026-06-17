// Cliente Supabase compartido. La URL y la anon key se leen desde
// `app.json` → `expo.extra`. La anon key es pública por diseño; nunca
// commitear la service_role.
//
// En web, el SDK detecta `window.localStorage` y persiste la sesión
// ahí automáticamente. En nativo (Android/iOS) le pasamos AsyncStorage
// para que la sesión sobreviva recargas (sin esto la sesión vive en
// memoria y se pierde al recargar).

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const extra = Constants.expoConfig?.extra ?? {};
const SUPABASE_URL = extra.SUPABASE_URL;
const SUPABASE_ANON_KEY = extra.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    '[supabase] Faltan SUPABASE_URL o SUPABASE_ANON_KEY en app.json -> expo.extra. ' +
      'Las llamadas al backend van a fallar hasta que se configuren.'
  );
}

// Importamos AsyncStorage solo en nativo. En web no lo necesitamos —
// el SDK ya usa localStorage por defecto — y queremos evitar que el
// módulo entre al bundle web.
let storage;
if (Platform.OS !== 'web') {
  // require para que el bundler de web pueda hacer dead-code elimination.
  storage = require('@react-native-async-storage/async-storage').default;
}

export const supabase = createClient(SUPABASE_URL ?? '', SUPABASE_ANON_KEY ?? '', {
  auth: {
    ...(storage ? { storage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

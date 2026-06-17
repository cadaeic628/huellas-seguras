# Guía para Claude Code

Este archivo lo lee Claude Code automáticamente al iniciar una sesión.
Su objetivo es que una sesión nueva pueda colaborar sin re-explorar todo el repo.

---

## Convenciones del proyecto

- **Stack**: Expo SDK 50, React Native 0.73, React 18.2, `@react-navigation/bottom-tabs` v6, Supabase (Postgres + Auth + Storage).
- **Datos**: 100% en Supabase. Auth, catálogo de animales, fundaciones, donaciones, foro, reportes y veterinarias viven en `public.*` (ver `supabase/schema.sql`).
- **Seed**: `supabase/seed.sql` es un seed mínimo (1 organización placeholder + 3 animales + 2 veterinarias). Borra los placeholders previos (`user_id is null`) antes de insertar, así que es seguro re-correrlo. Las fundaciones reales se registran vía signup desde la app y no las toca.
- **Cliente Supabase**: `src/lib/supabase.js` exporta `supabase`, leyendo URL y anon key desde `app.json` → `expo.extra`. En web usa `localStorage` (default del SDK) y en nativo `AsyncStorage` (cargado con `require` solo si `Platform.OS !== 'web'` para que no entre al bundle web).
- **Esquema DB**: vive en `supabase/schema.sql`. Es idempotente; al modificar tablas, RLS o RPCs, actualizar ese archivo y re-correrlo en el SQL Editor.
- **Versión del SDK**: `@supabase/supabase-js` está fijo en `2.45.6`. Versiones ≥ 2.50 introducen un import dinámico de `@opentelemetry/api` que Metro no resuelve y rompe el build de Vercel.
- **Colores**: SIEMPRE desde `src/constants/colors.js` (`COLORS.*`). Nunca hardcodear hex.
- **Iconos**: `@expo/vector-icons` (Ionicons). Para pares foco/no-foco usar `name` y `name-outline`.
- **Web vs nativo**: `expo-image-picker` en web cae a file picker. La cámara real en navegador vive en `src/components/WebCamera.web.js` (`getUserMedia`). El stub para nativo es `WebCamera.js`.
- **Estilos**: `StyleSheet.create({...})` al final del archivo (mismo patrón que `DonarScreen.js` y `ForoScreen.js`).
- **Layout en web**: cada pantalla limita su contenido con `width: '100%', maxWidth: <N>, alignSelf: 'center'` en el contentContainerStyle del ScrollView principal (720 para la mayoría, 900 para Mapa, 520 para Auth). Sin esto el contenido se estira full-width en monitores anchos.
- **Idioma**: comentarios y UI en español. Código y mensajes de commit en inglés.
- **Commits**: atómicos, sin firmar como Claude, sin `Co-Authored-By`. Formato `tipo(scope): mensaje`. Ej: `feat(foro): ...`, `data: ...`, `docs: ...`, `fix(animales): ...`.

## Estructura

```
App.js                       # NavigationContainer + 6 tabs (centro elevado: Reportar)
src/
  constants/
    colors.js                # COLORS
    santiago.js              # SANTIAGO_CENTER + COMUNAS_SANTIAGO
  utils/
    animalEstado.js          # getEstadoLabel + getEstadoColor
    imageSimilarity.js       # HSV + dHash matcher para ReportarScreen
  lib/
    supabase.js              # cliente compartido
  contexts/
    AuthContext.js           # useAuth() + signup/login/edit/eliminar
  components/                # Reutilizables (modal de ficha, cámara web, redes)
  screens/                   # Una pantalla por tab + AuthScreen
supabase/
  schema.sql                 # tablas, RLS, RPCs, storage policies
  seed.sql                   # seed mínimo (placeholders)
```

## Auth (Supabase)

- `src/contexts/AuthContext.js` expone `useAuth()` con `{ user, loading, login,
  logout, signupNormal, signupFundacion, editarPerfil, editarOrganizacion,
  eliminarCuenta }`. Todas las funciones son `async` y devuelven `{ ok, error }`.
  `loading` es `true` mientras se hidrata la sesión inicial.
- Sesión vía `supabase.auth`. Persiste en `localStorage` (web) o `AsyncStorage` (nativo).
- `App.js` envuelve todo en `<AuthProvider>` y `RootGate` muestra un splash
  mientras `loading`, `AuthScreen` si no hay sesión, o `MainNavigator` si la hay.
- Dos roles: `normal` y `fundacion`, guardados en `public.users.role`. El trigger
  `handle_new_user` del schema crea el row en `public.users` cuando
  `supabase.auth.signUp` inserta en `auth.users` (lee `role` y `nombre` desde
  `options.data` del signUp).
- Para fundaciones, `signupFundacion` hace `signUp` + insert en `organizaciones`
  con `user_id = auth.uid()`. El contexto enriquece el `user` con
  `organizacionId` consultando `organizaciones where user_id = uid`.
- `eliminarCuenta` invoca el RPC `delete_self` (SECURITY DEFINER, en
  `supabase/schema.sql`) porque la anon key no puede borrar `auth.users`.
- **Logout**: vive en el menú del header (`App.js` → `HeaderMenu`).
- **Gating de UI por rol**: leer `user.role` de `useAuth()`. Ejemplo:
  `ForoScreen.js` solo muestra el FAB de publicar si `user.role === 'fundacion'`.
  `PerfilScreen.js` ramifica la vista completa con un branch por rol.

## Veterinarias

Las veterinarias **no son usuarios de esta app**. Son entidades públicas que aparecen
en el mapa y los administra el equipo del proyecto vía SQL Editor (o service_role).
Tabla `public.veterinarias` con SELECT público y sin policies de escritura — solo
service_role puede tocarla. A futuro existirá una plataforma separada para
veterinarias; este repo no debe agregar registro ni login para ese rol.

## Trabajar con esta base

- Antes de tocar una pantalla, lee la pantalla análoga existente y respeta su patrón
  (cards, modales, FAB, chips). El estilo visual debe ser coherente.
- Para una feature nueva, agrega tablas/columnas en `supabase/schema.sql`, RLS si
  aplica, y consume vía el cliente. Cada pantalla mapea snake_case → camelCase con
  un helper local (`mapAnimalRow`, `mapOrgRow`, etc.) — no hay un mapper compartido
  porque cada pantalla pide subconjuntos distintos.
- Para flujos con formulario + adjuntos, copia el patrón de `PublishModal` de
  `ForoScreen.js`.
- Para mutaciones que la RLS estándar no cubre (ej: apadrinar un animal cuyo
  `update` está restringido a la fundación dueña), expón un RPC SECURITY
  DEFINER en `schema.sql` y llama con `supabase.rpc('nombre', { args })`. Ya
  existen `apadrinar`, `adoptar` y `delete_self`.

### Patrón para subir un archivo a Storage

Estrenado en `ForoScreen.js` (`uploadToForo`), reutilizado en `ReportarScreen.js`
(`uploadToReportes`). Para nuevos buckets sigue el mismo patrón:

1. `expo-image-picker` devuelve una URI (web `blob:`/`data:` o nativo `file:`).
2. `const blob = await (await fetch(uri)).blob();` — funciona en ambos lados.
3. Define un path con prefijo `<user_id>/...` para auditoría:
   `` `${userId}/${Date.now()}-foto.jpg` ``.
4. `await supabase.storage.from('<bucket>').upload(path, blob, { contentType: blob.type })`.
5. Guarda la URL pública: `supabase.storage.from('<bucket>').getPublicUrl(path).data.publicUrl`.
6. Persiste esa URL en la columna `_url` (`foto_url`, `comprobante_url`, etc.).

Las policies de `storage.objects` viven en `schema.sql` ("Storage: policies para los buckets de la app") y permiten escritura libre a `authenticated` en los 4 buckets (`avatars`, `animales`, `reportes`, `foro`). Para producción endurecer con checks de path.

### Realtime

Estrenado en `ForoScreen.js` para que las publicaciones nuevas aparezcan sin recargar:

```js
useEffect(() => {
  const channel = supabase
    .channel('foro_feed')
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'foro_posts' },
      () => { fetchFeed(); })  // re-fetch para resolver joins
    .subscribe();
  return () => supabase.removeChannel(channel);
}, [fetchFeed]);
```

Requiere habilitar la tabla en Supabase Dashboard → Database → Replication. La RLS
también aplica a realtime: el cliente solo recibe eventos de rows que podría leer
con SELECT normal.

---

# Roadmap (trabajo pendiente)

Solo queda un ítem opcional. Todo lo demás se completó.

## Actualizar Expo SDK + React Native

SDK 50 y RN 0.73 están deprecados. RN 0.73 tiene CVEs publicados. No es urgente
para taller, sí para producción real.

**Pasos** (incremental, un SDK por vez para no romper todo):
1. `npx expo install expo@^52 --fix` o seguir la guía oficial de upgrade.
2. Atender breaking changes de `@react-navigation/*` (v6 → v7) si toca.
3. Re-pinear `@supabase/supabase-js` a la última `2.4x.x` o verificar si Metro
   en SDK 52 ya respeta `webpackIgnore` (entonces se puede desfijar).
4. Probar bundling de web (que es donde más errores aparecen) antes de tocar
   nativo.

---

# Cómo dejar este archivo útil al cerrar una feature

Al terminar una feature:
1. Si introduce una **convención** nueva (formato, gating, layout), agregarla en
   "Convenciones del proyecto".
2. Si introduce un **patrón replicable** (Storage uploads, realtime, etc.),
   agregar una mini-sección en "Trabajar con esta base" con el patrón a copiar.
3. Si era un ítem del Roadmap, sacarlo. Si la feature introduce nueva deuda
   técnica que vale la pena recordar, agregar un nuevo ítem al Roadmap.

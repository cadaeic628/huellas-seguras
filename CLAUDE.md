# Guía para Claude Code

Este archivo lo lee Claude Code automáticamente al iniciar una sesión.
Su objetivo es que una sesión nueva pueda colaborar sin re-explorar todo el repo.

---

## Convenciones del proyecto

- **Stack**: Expo SDK 50, React Native 0.73, React 18.2, `@react-navigation/bottom-tabs` v6, Supabase (Postgres + Auth + Storage).
- **Datos**: Auth ya vive en Supabase. `src/data/mockData.js` aún contiene el catálogo seed para las pantallas que no se han migrado. La migración se hace pantalla por pantalla (ver Roadmap §1).
- **Cliente Supabase**: `src/lib/supabase.js` exporta `supabase`, leyendo URL y anon key desde `app.json` → `expo.extra`. La anon key es pública por diseño; la `service_role` NUNCA se commitea.
- **Esquema DB**: vive en `supabase/schema.sql`. Es idempotente; al modificar tablas, RLS o RPCs, actualizar ese archivo y re-correrlo en el SQL Editor.
- **Versión del SDK**: `@supabase/supabase-js` está fijo en `2.45.6`. Versiones ≥ 2.50 introducen un import dinámico de `@opentelemetry/api` que Metro no resuelve y rompe el build de Vercel.
- **Colores**: SIEMPRE desde `src/constants/colors.js` (`COLORS.*`). Nunca hardcodear hex.
- **Iconos**: `@expo/vector-icons` (Ionicons). Para pares foco/no-foco usar `name` y `name-outline`.
- **Imágenes externas**: Unsplash con `?w=...&h=...&fit=crop`. Hay helper `unsplash(id)` al inicio de `mockData.js`.
- **Web vs nativo**: `expo-image-picker` en web cae a file picker. La cámara real en navegador vive en `src/components/WebCamera.web.js` (`getUserMedia`). El stub para nativo es `WebCamera.js`.
- **Estilos**: `StyleSheet.create({...})` al final del archivo (mismo patrón que `DonarScreen.js` y `ForoScreen.js`).
- **Idioma**: comentarios y UI en español. Código y mensajes de commit en inglés.
- **Commits**: atómicos, sin firmar como Claude, sin `Co-Authored-By`. Formato `tipo(scope): mensaje`. Ej: `feat(foro): ...`, `data: ...`, `docs: ...`, `fix(animales): ...`.

## Estructura

```
App.js                   # NavigationContainer + 6 tabs (centro elevado: Reportar)
src/
  constants/colors.js    # COLORS
  data/mockData.js       # ORGANIZACIONES, ANIMALS, VETERINARIAS, ACTUALIZACIONES_FORO,
                         # DONACIONES, REPORTES_USUARIO, APADRINAMIENTOS_USUARIO,
                         # ADOPCIONES_USUARIO + helpers
  components/            # Reutilizables (modal de ficha, cámara web)
  screens/               # Una pantalla por tab
  utils/                 # Lógica pura sin React (matching de imágenes)
```

## Auth (Supabase)

- `src/contexts/AuthContext.js` expone `useAuth()` con `{ user, loading, login,
  logout, signupNormal, signupFundacion, editarPerfil, editarOrganizacion,
  eliminarCuenta }`. Todas las funciones son `async` y devuelven `{ ok, error }`.
  `loading` es `true` mientras se hidrata la sesión inicial.
- Sesión vía `supabase.auth`. En web persiste en `localStorage`; en nativo sin
  AsyncStorage vive en memoria — al recargar móvil vuelve a deslogueado (ver
  Roadmap §4 para fix).
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
en el mapa (y en la ficha de cada animal, vía `getVeterinariaCercana`). Sus datos
viven en `VETERINARIAS` de `mockData.js` (o en la tabla `veterinarias` cuando exista
DB) y los administra el equipo del proyecto, no un usuario logueado. A futuro existirá
una plataforma separada para veterinarias; este repo no debe agregar registro ni
login para ese rol.

## Trabajar con esta base

- Antes de tocar una pantalla, lee la pantalla análoga existente y respeta su patrón
  (cards, modales, FAB, chips). El estilo visual debe ser coherente.
- Para una feature nueva sobre datos ya migrados, agrega tablas/columnas en
  `supabase/schema.sql` y consume vía el cliente. Para pantallas aún no migradas
  (ver Roadmap §1), extiende `mockData.js`.
- Para flujos con formulario + adjuntos, copia el patrón de `PublishModal` de
  `ForoScreen.js`.

### Patrón para migrar una pantalla de `mockData.js` a Supabase

1. Reemplaza los imports de helpers (`getAnimalesDeOrganizacion`, etc.) por
   llamadas al cliente: `await supabase.from('animales').select(...).eq(...)`.
2. Carga en `useEffect` con un estado `loading` + `error`. Muestra
   `<ActivityIndicator>` mientras carga y un banner si falla.
3. Mapea nombres snake_case del DB a lo que la UI espera (ej:
   `comunas_operacion` → `comunasOperacion`, `foto_url` → `foto`). Hazlo en un
   helper local de la pantalla o en `src/lib/mappers.js` si se repite.
4. Para escrituras (insert/update/delete), tras la mutación re-fetch o
   actualiza el estado local de forma optimista.
5. Para imágenes que vienen de `expo-image-picker` (URI local), súbelas con
   `supabase.storage.from(<bucket>).upload(path, file)` y guarda la URL pública
   en la columna `_url` correspondiente. Buckets ya creados: `avatars`,
   `animales`, `reportes`, `foro`.
6. Para mutaciones que la RLS estándar no cubre (ej: apadrinar un animal cuyo
   `update` está restringido a la fundación dueña), expón un RPC SECURITY
   DEFINER en `schema.sql` y llama con `supabase.rpc('nombre', { args })`.

---

# Roadmap (trabajo pendiente)

Las secciones siguientes son **briefings autocontenidos** para que una sesión nueva
pueda implementar cada feature sin más contexto. Implementar **una a la vez** en
commits atómicos.

## 1. Migración de pantallas a Supabase

El setup (schema + cliente + RLS + Auth) ya está. Falta migrar las pantallas
que aún leen de `mockData.js`. Hacer **una por commit** y probar antes de
seguir. Cuando estén todas, borrar `mockData.js` en un commit de cierre.

**Hecho**:
- [x] `data: add supabase schema and client setup` — `supabase/schema.sql`
  idempotente con tablas, trigger `handle_new_user`, RLS, RPCs (`apadrinar`,
  `adoptar`, `delete_self`). Cliente en `src/lib/supabase.js`.
- [x] `chore(config): wire supabase project credentials` — `app.json` →
  `expo.extra` con URL y anon (publishable) key del proyecto.
- [x] `feat(auth): migrate AuthContext to supabase` — `AuthContext.js` usa
  `supabase.auth`. Splash de carga en `App.js` mientras hidrata la sesión.
- [x] `fix(deps): pin @supabase/supabase-js to 2.45.6` — evita import de OTEL
  que rompe Metro/Vercel.

**Pendiente** (orden sugerido):
- [ ] `feat(animales): load catalog from supabase` — `AnimalesScreen.js`.
  Filtros, ficha modal, llamadas a RPC `apadrinar` y `adoptar`. Antes de
  empezar, seedear ~5 organizaciones y ~10 animales en el Table Editor para
  tener qué mostrar (idealmente con UUIDs reales, no `'ORG-01'`).
- [ ] `feat(donar): load orgs from supabase` — `DonarScreen.js`. Persistir
  donaciones en la tabla `donaciones` con el `user_id` del que dona.
- [ ] `feat(foro): load posts + publishing + storage uploads` — `ForoScreen.js`.
  Lectura de `foro_posts` con sus `foro_post_animales`. El `PublishModal` sube
  foto/boleta al bucket `foro` antes de insertar el row. Este commit estrena
  el patrón de Storage que reutilizan los siguientes.
- [ ] `feat(reportar): persist reports with storage photos` —
  `ReportarScreen.js`. Sube la foto al bucket `reportes`, inserta en
  `reportes`. Mantener la lógica de matching de imágenes existente.
- [ ] `feat(perfil): load aggregates from supabase` — `PerfilScreen.js`.
  Reemplazar `getAnimalesApadrinadosPorUsuario`, `getDonacionesDeUsuario`, etc.
  por queries.
- [ ] `feat(mapa): load animales y veterinarias from supabase` —
  `MapaScreen.js`. Lectura de `animales` (con `lat`/`lng`) y `veterinarias`.
- [ ] `refactor: drop mockData fallback` — borrar `src/data/mockData.js` y
  cualquier import residual. Verificar que la app arranca solo con datos de
  Supabase.

**Notas**:
- Las cuentas demo (`maria@example.com`, etc.) viven solo como referencia
  histórica en commits viejos. Para probar hay que crearlas con signup real.
- Para reseedear datos rápido, escribir un script SQL en `supabase/seed.sql`
  (no commitearlo si tiene PII o datos pesados).

## 2. Bug: animales adoptados muestran "Quiero adoptar"

En `src/screens/AnimalesScreen.js`, los animales con `adoptado === true` (ej:
Pelusa HS-005, Misha HS-007) siguen mostrando el botón "¡Quiero adoptar!".

**Fix**:
- Si `animal.adoptado`, ocultar el botón "Quiero adoptar" y reemplazarlo por un
  pill verde no clickeable "Ya tiene hogar" (o similar).
- Si `animal.apadrinado`, el botón "Quiero apadrinar" debe deshabilitarse o
  reemplazarse por "Ya tiene padrino".
- Revisar consistencia: el filtro "Adoptados" hoy los deja ver, lo cual es
  correcto — el problema es solo el botón.

## 3. Headers alineados a la derecha

Hoy los títulos del header (`title` en cada `<Tab.Screen>`) están centrados por
defecto. Se quiere alinearlos a la derecha para que en una iteración futura quepa
un logo a la izquierda.

**Fix en `App.js`**:
```js
screenOptions={{
  headerTitleAlign: 'right',  // o usar headerTitle: () => <Text>...</Text>
  ...
}}
```

Si `headerTitleAlign: 'right'` no respeta el padding en web, usar
`headerTitle: (props) => <Text style={{...}}>{props.children}</Text>` con
`textAlign: 'right'` y `width: '100%'`. Cuando llegue el logo, reemplazar por
`headerLeft: () => <Image source={logo} />`.

## 4. Persistir sesión en móvil con AsyncStorage

Hoy en web la sesión persiste vía `localStorage` (default del SDK), pero en
Android/iOS no hay storage configurado y al recargar el usuario queda
deslogueado. Es UX aceptable mientras se desarrolla en web, no para producción
móvil.

**Fix**:
1. `npx expo install @react-native-async-storage/async-storage`.
2. En `src/lib/supabase.js`, importar y pasar al cliente:
   ```js
   import AsyncStorage from '@react-native-async-storage/async-storage';
   // ...
   createClient(URL, KEY, {
     auth: {
       storage: AsyncStorage,
       autoRefreshToken: true,
       persistSession: true,
       detectSessionInUrl: false,
     },
   });
   ```
3. En web el SDK detecta `window.localStorage` y lo prefiere; pasar
   `AsyncStorage` no rompe el caso web pero igual conviene gatear por
   `Platform.OS !== 'web'` para no cargar AsyncStorage en el bundle web.

## 5. Realtime: donaciones y foro_posts en vivo

Supabase Realtime ya viene con el SDK. Habilitar en las tablas que importa que
otros usuarios vean cambios sin recargar (foro, donaciones recibidas por la
fundación, animales nuevos en el catálogo).

**Pasos**:
1. En Supabase Dashboard → Database → Replication, habilitar las tablas
   relevantes (`foro_posts`, `donaciones`, `animales`).
2. En la pantalla que escucha, subscribirse:
   ```js
   useEffect(() => {
     const channel = supabase
       .channel('foro')
       .on('postgres_changes',
         { event: 'INSERT', schema: 'public', table: 'foro_posts' },
         (payload) => setPosts((prev) => [payload.new, ...prev]))
       .subscribe();
     return () => supabase.removeChannel(channel);
   }, []);
   ```
3. Recordar que el filtro RLS aplica también a realtime: el cliente solo
   recibe eventos de rows que podría leer con un SELECT normal.

## 6. Actualizar Expo SDK + React Native

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

Al terminar cualquier feature de este roadmap:
1. Mover la sección correspondiente fuera del Roadmap y resumirla en una línea
   en "Estado actual" si introduce una convención nueva.
2. Si la feature definió un patrón replicable (ej: cómo subir imágenes a Supabase,
   cómo escribir un screen con auth gating), agregar una mini-sección en
   "Trabajar con esta base" con el patrón a copiar.
3. Eliminar lo obsoleto: si el placeholder de auth desaparece, borrar
   "Estado actual de auth".

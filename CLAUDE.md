# Guía para Claude Code

Este archivo lo lee Claude Code automáticamente al iniciar una sesión.
Su objetivo es que una sesión nueva pueda colaborar sin re-explorar todo el repo.

---

## Convenciones del proyecto

- **Stack**: Expo SDK 50, React Native 0.73, React 18.2, `@react-navigation/bottom-tabs` v6. Sin backend (todavía — ver Roadmap).
- **Datos**: todo vive en `src/data/mockData.js`. Nada persiste — al recargar vuelve al catálogo inicial.
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

## Auth (mockeada, sin backend)

- `src/contexts/AuthContext.js` expone `useAuth()` con `{ user, login, logout,
  signupNormal, signupFundacion }`. La sesión vive en memoria; al recargar la app
  vuelve al estado deslogueado (igual que el resto de la data).
- `App.js` envuelve todo en `<AuthProvider>` y, vía `RootGate`, muestra
  `AuthScreen` si no hay sesión.
- Dos roles: `normal` y `fundacion`. Un usuario `fundacion` tiene
  `user.organizacionId` apuntando a `ORGANIZACIONES`. Al signup como fundación se
  inserta el registro nuevo en `ORGANIZACIONES` (mutación directa del arreglo —
  desaparece cuando se migre a Supabase).
- Cuentas demo: `maria@example.com / demo123` (normal), `refugio@example.com /
  demo123` y `huellitas@example.com / demo123` (fundaciones). Viven en
  `USUARIOS_DEMO` de `mockData.js`.
- **Logout**: vive en el tab "Mi perfil" (`PerfilScreen.js`).
- **Gating de UI por rol**: para ocultar/mostrar acciones según el rol, leer
  `user.role` de `useAuth()`. Ejemplo: `ForoScreen.js` solo muestra el FAB de
  publicar si `user.role === 'fundacion'`. `PerfilScreen.js` ramifica la vista
  completa con un branch por rol.

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
- Para una feature nueva, prefiere extender `mockData.js` con un nuevo array + helpers
  antes que crear un nuevo módulo de datos.
- Para flujos con formulario + adjuntos, copia el patrón de `PublishModal` de
  `ForoScreen.js`.

---

# Roadmap (trabajo pendiente)

Las secciones siguientes son **briefings autocontenidos** para que una sesión nueva
pueda implementar cada feature sin más contexto. Implementar **una a la vez** en
commits atómicos.

## 1. Persistencia real (base de datos)

**Recomendación**: **Supabase**. Razones: Postgres real, Auth + Storage + Realtime
incluidos, plan free generoso, SDK JS oficial que funciona en RN sin polyfills
especiales, código del backend abierto, sin lock-in. Alternativas: Firebase
(más fácil pero NoSQL y lock-in Google), backend propio Node+Postgres (mayor
control, más trabajo).

**Esquema propuesto** (tablas Supabase):

```
users            (id, email, role, nombre, avatar_url, created_at)
                 — role: 'normal' | 'fundacion'
organizaciones   (id, nombre, comuna, descripcion, telefono, horario,
                  comunas_operacion[], banco_jsonb, redes_jsonb,
                  user_id FK users)  -- la cuenta que la administra
veterinarias     (id, nombre, comuna, telefono, horario, lat, lng,
                  redes_jsonb)
                 -- entidad pública sin user_id; se administra fuera de la app
animales         (id, nombre, tipo, estado, zona, comuna, descripcion,
                  foto_url, organizacion_id FK, lat, lng,
                  apadrinado_por FK users NULL,
                  adoptado_por  FK users NULL,
                  ficha_jsonb, created_at)
reportes         (id, animal_id FK NULL, user_id FK, foto_url, ubicacion,
                  descripcion, estado, created_at)
                 -- animal_id NULL si es un animal nuevo no matcheado
donaciones       (id, user_id FK, organizacion_id FK, monto, comprobante_url NULL,
                  created_at)
foro_posts       (id, organizacion_id FK, titulo, descripcion, monto NULL,
                  foto_url NULL, boleta_url NULL, created_at)
foro_post_animales (post_id FK, animal_id FK)   -- N:M relación
```

**Pasos de implementación**:
1. Crear proyecto Supabase, habilitar Auth (email/password) y Storage (buckets
   `avatars`, `animales`, `reportes`, `foro`).
2. Crear las tablas con SQL (committear el script en `supabase/schema.sql`).
3. Aplicar **Row Level Security** (RLS) — la sesión es client-side, sin RLS
   cualquiera lee/escribe todo:
   - `animales`: cualquiera lee. Solo escribe el `user_id` de la organización dueña.
   - `donaciones`: cada usuario ve y crea solo las suyas.
   - `foro_posts`: cualquiera lee. Solo crea el `user_id` con rol `fundacion`.
4. `npm install @supabase/supabase-js`. Crear `src/lib/supabase.js` con cliente
   inicializado leyendo URL y anon key desde `app.json` → `expo.extra`.
5. Reemplazar imports de `mockData.js` por llamadas al cliente. Migrar pantalla
   por pantalla, no en un solo commit:
   - `data: add supabase schema and client setup`
   - `feat(animales): load catalog from supabase`
   - `feat(donar): load orgs from supabase` ...
6. Mantener un fallback a `mockData.js` solo si la sesión está deslogueada (modo
   demo). O eliminar el mock cuando todo esté migrado.
7. Las imágenes adjuntas (`expo-image-picker` retorna URI local) hay que subirlas
   a Supabase Storage antes de guardar el row — guardar la URL pública.
8. Variables sensibles: anon key va en `app.json` (es pública por diseño), nunca
   commitear la `service_role` key.

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

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
App.js                   # NavigationContainer + 5 tabs (centro elevado, sin labels)
src/
  constants/colors.js    # COLORS
  data/mockData.js       # ORGANIZACIONES, ANIMALS, VETERINARIAS, ACTUALIZACIONES_FORO + helpers
  components/            # Reutilizables (modal de ficha, cámara web)
  screens/               # Una pantalla por tab
  utils/                 # Lógica pura sin React (matching de imágenes)
```

## Estado actual de auth

**No hay auth real.** `ForoScreen.js` muestra un selector visible al usuario que simula
qué fundación está autenticada. Solo se usa para limitar el multi-select de animales
en el formulario de publicación. Cuando se implemente auth real (ver Roadmap §1), ese
selector se reemplaza por el rol del usuario logueado.

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

## 1. Auth real: login, signup, logout, 2 tipos de usuario

**Tipos**: `normal`, `fundacion`. (Las veterinarias no se registran — ver sección
"Veterinarias" arriba).

**UX esperado**:
- Al abrir la app sin sesión, mostrar pantalla de login (con tabs Login / Crear cuenta).
- En signup pedir tipo de cuenta. Si es `fundacion`, pedir datos extra (nombre,
  comuna, descripción, comunas de operación, datos bancarios, redes) y crear su
  registro en `ORGANIZACIONES` automáticamente.
- Botón "Cerrar sesión" en el tab "Mi perfil" (§3).
- El rol del usuario condiciona qué puede hacer:
  - `fundacion` → único que puede publicar en el Foro (eliminar el selector
    placeholder de `ForoScreen.js`).
  - `normal` → reportar animales, donar, ver foro, apadrinar.

**Implementación recomendada**: Supabase Auth (ver §4). Mientras tanto, si se quiere
mockear sin DB: un `AuthContext` con `useState` + `AsyncStorage` que guarda
`{ userId, role, organizacionId? }`.

**Archivos a tocar**:
- Crear `src/screens/AuthScreen.js`, `src/contexts/AuthContext.js`.
- `App.js`: envolver el navigator en `<AuthProvider>` y mostrar `AuthScreen` si no
  hay sesión.
- `ForoScreen.js`: quitar `FoundationSelector`; usar `useAuth()` para obtener
  `organizacionId`. Mostrar el FAB de publicar solo si rol es `fundacion`.

## 2. Redes sociales en fundaciones y veterinarias

Las fundaciones pueden editar sus redes desde "Mi perfil" (§3). Las redes de las
veterinarias quedan precargadas en `mockData.js` (o en la tabla `veterinarias`) y
no son editables desde la app — se ven solo como información pública.

Agregar a cada item de `ORGANIZACIONES` y `VETERINARIAS` un objeto opcional:

```js
redes: {
  instagram: '@refugioesperanza',     // opcional
  facebook: 'RefugioEsperanzaCL',     // opcional
  whatsapp: '+56987654321',           // opcional
  web: 'https://refugioesperanza.cl', // opcional
}
```

**UX**:
- En la tarjeta de Donar mostrar una fila de íconos clickeables (Ionicons:
  `logo-instagram`, `logo-facebook`, `logo-whatsapp`, `globe-outline`) bajo el
  header de la organización.
- En el callout / ficha de cada veterinaria del mapa mostrar la misma fila.
- Toque → `Linking.openURL` con la URL correspondiente (`https://instagram.com/{handle}`,
  `https://wa.me/{phone}`, etc.).
- Si la entidad no tiene redes, no mostrar la fila.

**Extensión opcional**: badge "Es un donante" en la tarjeta de Donar cuando el usuario
logueado ya haya hecho aportes a esa fundación. Requiere persistir el historial de
donaciones (§4) y leer del `AuthContext` (§1).

## 3. Tab "Mi perfil"

Nuevo tab (sexto) o reemplazo del actual de Donar dentro de un drawer. Si se agrega
como tab, el bottom bar pasa a 6 íconos: revisar tamaños en `App.js`.

**Propuesta de contenido por rol**:

**Usuario normal**:
- Header con foto/avatar (placeholder con iniciales) + nombre + email.
- Animales que apadrina (chips con foto pequeña, navega a la ficha).
- Animales que reportó (lista con fecha + estado).
- Historial de aportes (fecha + organización + monto).
- Botones: Editar datos, Cerrar sesión, Eliminar cuenta.

**Fundación**:
- Mismo header.
- Tarjeta editable con los datos públicos de la fundación (los que aparecen en
  `DonarScreen`: descripción, comuna, comunas de operación, horario, redes, datos
  bancarios, foto/logo).
- Resumen: total recibido en aportes, # animales en seguimiento, # posts en foro.
- Atajo: "Publicar nueva actualización" (lleva al modal de `ForoScreen`).
- Cerrar sesión.

**Archivos**: crear `src/screens/PerfilScreen.js`. Registrar tab en `App.js` con
ícono `person` / `person-outline`.

## 4. Persistencia real (base de datos)

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

## 5. Bug: animales adoptados muestran "Quiero adoptar"

En `src/screens/AnimalesScreen.js`, los animales con `adoptado === true` (ej:
Pelusa HS-005, Misha HS-007) siguen mostrando el botón "¡Quiero adoptar!".

**Fix**:
- Si `animal.adoptado`, ocultar el botón "Quiero adoptar" y reemplazarlo por un
  pill verde no clickeable "Ya tiene hogar" (o similar).
- Si `animal.apadrinado`, el botón "Quiero apadrinar" debe deshabilitarse o
  reemplazarse por "Ya tiene padrino".
- Revisar consistencia: el filtro "Adoptados" hoy los deja ver, lo cual es
  correcto — el problema es solo el botón.

## 6. Headers alineados a la derecha

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

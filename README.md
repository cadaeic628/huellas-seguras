# Huellas Seguras 🐾

App de demostración para una plataforma ciudadana de seguimiento de animales callejeros en Santiago de Chile. Construida en **React Native + Expo**, corre en **iOS, Android y Web** desde el mismo código fuente.

> Demo académica. Sin backend, sin Firebase, sin IA real. Todos los datos son ficticios.

## Demo en vivo

- **Web (Vercel)**: <https://huellas-seguras-dun.vercel.app/> ← reemplazar con la URL real del deploy
- **Repositorio**: <https://github.com/cadaeic628/huellas-seguras>
- **Móvil**: clonar el repo y abrir con Expo Go (ver "Cómo correr localmente").

## ¿Hay estado compartido?

**No.** La app es 100% cliente. Los datos (organizaciones, animales del catálogo, veterinarias) están hardcodeados en `src/data/mockData.js`. Lo que un usuario "reporta" o sube vive solo en `useState` de su pestaña: al recargar vuelve al catálogo inicial, y nadie ve los cambios de nadie. No hay base de datos, ni API, ni `AsyncStorage`.

## Stack

- **Expo SDK 50** + React Native 0.73 + React 18.2
- **react-navigation v6** — tab navigator inferior
- **expo-image-picker** — cámara/galería en nativo
- **expo-image-manipulator** + **upng-js** — pipeline de imagen para el matching
- **react-native-web** — el mismo código corre en navegador
- **@expo/vector-icons** (Ionicons)

## Estructura del proyecto

```
.
├── App.js                       # NavigationContainer + 5 tabs (centro elevado)
├── app.json                     # Configuración Expo
├── babel.config.js
├── package.json
└── src/
    ├── constants/
    │   └── colors.js            # Paleta de colores
    ├── data/
    │   └── mockData.js          # ORGANIZACIONES, ANIMALS, VETERINARIAS, ACTUALIZACIONES_FORO
    ├── components/
    │   ├── FichaAnimalModal.js  # Modal de detalle de animal
    │   ├── WebCamera.js         # Stub no-op para iOS/Android
    │   └── WebCamera.web.js     # Cámara getUserMedia para navegador
    ├── screens/
    │   ├── MapaScreen.js        # Tab 1: Mapa interactivo simulado
    │   ├── AnimalesScreen.js    # Tab 2: Catálogo con filtros
    │   ├── ReportarScreen.js    # Tab 3: Reporte con matching de imágenes (botón central elevado)
    │   ├── DonarScreen.js       # Tab 4: Organizaciones para donar
    │   └── ForoScreen.js        # Tab 5: Foro de fundaciones (rendición de cuentas)
    └── utils/
        └── imageSimilarity.js   # Matching de imágenes (sin IA)
```

## Cómo funciona el matching de imágenes ("IA simulada")

El botón "Reportar" **no usa ningún modelo entrenado**. Combina dos señales clásicas de computer vision sobre las fotos del catálogo, calculadas íntegramente en el cliente:

1. **dHash 16×16 (256 bits)** sobre la luminancia → captura estructura de bordes, robusto a cambios de brillo y escala.
2. **Histograma HSV ponderado al centro** (22 bins: 4 de gris + 18 de hue×sat) → captura color del sujeto. Pesa más el centro para que el sujeto domine sobre el fondo.

Score final: `0.60 × cosine(histogramas) + 0.40 × (1 − hamming/256)`.

Toda la implementación vive en `src/utils/imageSimilarity.js` y usa `expo-image-manipulator` + `upng-js` para decodificar las imágenes a píxeles sin depender del DOM (funciona igual en nativo y web).

## Cómo correr localmente

### Móvil (Expo Go)

```bash
npm install
npx expo start
```

1. Descarga **Expo Go** ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779)).
2. Asegúrate de que celular y computador estén en la **misma WiFi**.
3. Escanea el QR (Android: dentro de Expo Go; iOS: con la cámara nativa).

Si el QR no carga, presiona `s` en la terminal para modo **Tunnel** (más lento, pero atraviesa NATs y redes distintas).

### Web (local)

```bash
npm run web
# equivalente a: npx expo start --web
```

Abre `http://localhost:8081`. En web la cámara usa `WebCamera.web.js` (`getUserMedia`) porque `expo-image-picker` en navegador solo muestra el file picker.

## Cómo deployar a Vercel

La app exporta a sitio estático — no necesita servidor ni variables de entorno.

1. Genera el build local para validar antes de subir:
   ```bash
   npx expo export --platform web
   npx serve dist     # opcional, para verlo en http://localhost:3000
   ```
   Output: carpeta `dist/` (~5 MB). Ya está en `.gitignore`.

2. En **vercel.com/new** → Import del repo de GitHub. Framework **Other**, con:

   | Campo | Valor |
   |---|---|
   | Build Command | `npx expo export --platform web` |
   | Output Directory | `dist` |
   | Install Command | (default `npm install`) |
   | Environment Variables | ninguna |

3. Deploy.

Si el build falla en Vercel, fija **Node.js 20.x** en Settings → General y redeploy.

## Funcionalidades por pantalla

### Tab 1 — Mapa
- Mapa simulado con calles, marcadores de animales y veterinarias.
- Marcadores por color (verde = saludable, amarillo = observación, rojo = urgente).
- Toque sobre marcador → tarjeta con foto, nombre, ID, estado y acción.
- Botón flotante de donación.

### Tab 2 — Animales
- Catálogo en formato tarjeta con foto, nombre, ID, estado y zona.
- Filtros: Todos, Saludables, En observación, Urgentes, Apadrinados, Adoptados.
- Botones "¡Quiero adoptar!" y "Quiero apadrinar".
- Modal `FichaAnimalModal` con datos de la organización a cargo.

### Tab 3 — Reportar
- "Tomar foto" o "Subir foto" (cámara nativa en móvil, `getUserMedia`/file picker en web).
- Cálculo de hash perceptual de la foto y ranking de los animales más parecidos del catálogo (ver sección anterior).
- Opción "No es ninguno / Registrar animal nuevo".
- Formulario con ubicación, descripción, estado.
- **Importante**: el reporte no se guarda en ningún lado.

### Tab 4 — Donar
- Tarjetas por organización: nombre, comuna, descripción, horario, teléfono.
- Datos bancarios ficticios (banco, tipo cuenta, RUT, titular, email).

### Tab 5 — Foro de fundaciones
- Feed cronológico de actualizaciones publicadas por las fundaciones sobre cómo usan los aportes recibidos.
- Cada post puede incluir, todos opcionales: monto (CLP), foto, **boleta/factura** (abre en modal a pantalla completa) y 0+ animales del catálogo relacionados.
- Botón flotante "+" abre el formulario de publicación. Mientras no exista login, un selector simula qué fundación está autenticada y limita el multi-select de animales a los de esa fundación.
- Los posts publicados desde la UI viven en `useState` (no persisten).

## Barra inferior

Cinco íconos sin etiqueta. El central (Reportar) es un botón circular elevado siguiendo el patrón clásico de bottom bar con acción primaria. La lógica vive en `App.js` (componente local `CenterTabButton`).

## Personalizar

- **Datos**: editar `src/data/mockData.js`. Las fotos del catálogo vienen de Unsplash con tamaño fijo 400×400 (helper `unsplash(id)` al inicio del archivo).
- **Colores**: `src/constants/colors.js`.
- **Algoritmo de matching**: parámetros (pesos color/hash, σ del peso central, número de bins) están al principio de `src/utils/imageSimilarity.js`.

---

Hecho con cariño para la demostración del taller. 🐶🐱

an# Huellas Seguras 🐾

App móvil de demostración para la plataforma ciudadana de seguimiento de animales callejeros. Construida en **React Native + Expo**, lista para correr en **Expo Go** desde un celular real.

> Demo académica. Sin backend real, sin Firebase, sin IA real. Todos los datos son ficticios.

## Estructura del proyecto

```
.
├── App.js                       # Navegación inferior (4 tabs)
├── app.json                     # Configuración Expo
├── babel.config.js
├── package.json
└── src/
    ├── constants/
    │   └── colors.js            # Paleta de colores
    ├── data/
    │   └── mockData.js          # Animales, veterinarias y organizaciones ficticias
    └── screens/
        ├── MapaScreen.js        # Tab 1: Mapa interactivo simulado
        ├── AnimalesScreen.js    # Tab 2: Catálogo con filtros
        ├── ReportarScreen.js    # Tab 3: Reporte con "IA" simulada
        └── DonarScreen.js       # Tab 4: Organizaciones para donar
```

## Cómo ejecutar paso a paso

### 1. Instalar dependencias

Desde la raíz del proyecto, abre la terminal y ejecuta:

```bash
npm install
```

> Esto instalará Expo, React Navigation, vector icons y todas las librerías necesarias.

### 2. Iniciar Expo

```bash
npx expo start
```

Se abrirá una ventana del navegador con un **código QR** y verás opciones en la terminal.

### 3. Abrir en tu celular con Expo Go

1. Descarga **Expo Go** desde la tienda de tu celular:
   - **Android**: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - **iOS**: [App Store](https://apps.apple.com/app/expo-go/id982107779)

2. Asegúrate de que el celular y el computador estén en la **misma red WiFi**.

3. Abre Expo Go en el celular:
   - **Android**: pulsa "Scan QR code" y escanea el código.
   - **iOS**: usa la cámara nativa para escanear el QR y abre el enlace en Expo Go.

4. La app se cargará automáticamente en tu celular. ¡Listo!

### Consejos si algo no funciona

- Si el QR no carga, prueba presionar `s` en la terminal para cambiar a modo **Tunnel** (funciona aún con redes WiFi distintas, pero es más lento).
- Si las imágenes no aparecen, revisa que el celular tenga internet (las fotos vienen de URLs públicas: placedog.net y placekitten.com).
- Para reiniciar el bundler: presiona `r` en la terminal.

## Funcionalidades por pantalla

### Tab 1 — Mapa
- Mapa simulado con calles, marcadores de animales y veterinarias.
- Marcadores por color (verde = saludable, amarillo = observación, rojo = urgente).
- Leyenda visible.
- Toque sobre marcador → tarjeta con foto, nombre, ID, estado y acción.
- Botón flotante de donación.

### Tab 2 — Animales
- Catálogo en formato tarjeta con foto, nombre, ID, estado y zona.
- Filtros: Todos, Saludables, En observación, Urgentes, Apadrinados, Adoptados.
- Botones "¡Quiero adoptar!" y "Quiero apadrinar".
- Modal con datos de organización cercana.

### Tab 3 — Reportar
- Botón "Subir foto" que simula subida de imagen.
- "IA" simulada propone animales similares del catálogo.
- Opción "No es ninguno / Registrar animal nuevo".
- Formulario con ubicación, descripción, estado y envío.

### Tab 4 — Donar
- Tarjetas por organización: nombre, comuna, descripción.
- Botón "Ir a donar" con datos de contacto.

## Personalizar

- **Cambiar datos**: edita `src/data/mockData.js` para agregar más animales, veterinarias u organizaciones.
- **Cambiar colores**: edita `src/constants/colors.js`.
- **Cambiar imágenes**: reemplaza las URLs de `placedog.net` / `placekitten.com` por tus propias fotos.

---

Hecho con cariño para la demostración del taller. 🐶🐱

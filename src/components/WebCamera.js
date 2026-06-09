// Stub para nativo: en iOS/Android usamos expo-image-picker.launchCameraAsync,
// así que este componente queda como no-op. Metro elige automáticamente
// WebCamera.web.js cuando bundle para web.
export default function WebCamera() {
  return null;
}

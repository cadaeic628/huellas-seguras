import React, { Fragment, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../constants/colors';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  computeHash,
  precomputeCatalogHashes,
  rankBySimilarity,
} from '../utils/imageSimilarity';
import WebCamera from '../components/WebCamera';

// Mapea una row de `animales` (con join a `organizaciones`) al shape que
// usan el matcher visual y la UI de esta pantalla.
function mapAnimalRow(row) {
  const orgRow = row.organizaciones;
  return {
    id: row.id,
    nombre: row.nombre,
    tipo: row.tipo,
    estado: row.estado,
    zona: row.zona,
    comuna: row.comuna,
    foto: row.foto_url,
    organizacionId: row.organizacion_id,
    org: orgRow
      ? {
          id: orgRow.id,
          nombre: orgRow.nombre,
          telefono: orgRow.telefono,
        }
      : null,
  };
}

// Sube una URI local (web blob:/data:, native file:) al bucket `reportes`
// y devuelve la URL pública. Mismo patrón que `uploadToForo` (ver
// CLAUDE.md → "Patrón para subir un archivo a Storage").
async function uploadToReportes(uri, userId) {
  const res = await fetch(uri);
  const blob = await res.blob();
  const contentType = blob.type || 'image/jpeg';
  const ext = (contentType.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from('reportes')
    .upload(path, blob, { contentType });
  if (uploadError) throw uploadError;
  const { data } = supabase.storage.from('reportes').getPublicUrl(path);
  return data.publicUrl;
}

function SimilarCard({ animal, similarity, seleccionado, onSeleccionar }) {
  const [imgError, setImgError] = useState(false);
  const pct = Math.round((similarity ?? 0) * 100);
  return (
    <View
      style={[
        styles.similarCard,
        seleccionado && styles.similarCardActivo,
      ]}
    >
      {imgError ? (
        <View style={[styles.similarImage, styles.similarImagePlaceholder]}>
          <Ionicons name="paw" size={26} color={COLORS.primary} />
        </View>
      ) : (
        <Image
          source={{ uri: animal.foto }}
          style={styles.similarImage}
          onError={() => setImgError(true)}
        />
      )}
      <View style={styles.similarInfo}>
        <Text style={styles.similarName}>{animal.nombre}</Text>
        <Text style={styles.similarId} numberOfLines={1}>
          {animal.id.slice(0, 8)}
        </Text>
        <View style={styles.similarRow}>
          <Ionicons name="location-outline" size={12} color={COLORS.gray} />
          <Text style={styles.similarZona}>
            {animal.zona} ({animal.comuna})
          </Text>
        </View>
        {similarity != null && (
          <View style={styles.matchPill}>
            <Ionicons name="sparkles" size={11} color={COLORS.primary} />
            <Text style={styles.matchPillText}>{pct}% de parecido</Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        style={[styles.siButton, seleccionado && styles.siButtonActivo]}
        onPress={onSeleccionar}
      >
        <Text style={styles.siButtonText}>
          {seleccionado ? 'Seleccionado' : 'Sí, es este'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ReportarScreen() {
  const { user } = useAuth();

  const [catalogo, setCatalogo] = useState(null);
  const [catalogoError, setCatalogoError] = useState(null);
  const [catalogoListo, setCatalogoListo] = useState(false);

  const [paso, setPaso] = useState('inicio');
  const [animalSeleccionado, setAnimalSeleccionado] = useState(null);
  const [registrarNuevo, setRegistrarNuevo] = useState(false);
  const [ubicacion, setUbicacion] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [estado, setEstado] = useState('');

  const [fotoUri, setFotoUri] = useState(null);
  const [matches, setMatches] = useState([]); // [{animal, similarity, distance}]
  const [webCamVisible, setWebCamVisible] = useState(false);
  const [tipoCamara, setTipoCamara] = useState('back'); // 'back' | 'front'

  const [submitting, setSubmitting] = useState(false);

  // Drag & drop solo en web. La ref apunta al div del uploadBox (RN-web
  // devuelve el HTMLElement directo). Guardamos procesarFoto en una ref
  // para que el listener siempre llame a la versión más reciente sin
  // tener que re-suscribirse en cada render.
  const uploadBoxRef = useRef(null);
  const procesarFotoRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from('animales')
        .select(
          'id, nombre, tipo, estado, zona, comuna, foto_url, organizacion_id, organizaciones(id, nombre, telefono)'
        );
      if (!mounted) return;
      if (error) {
        setCatalogoError(error.message);
        setCatalogo([]);
        return;
      }
      const mapped = (data ?? []).map(mapAnimalRow);
      setCatalogo(mapped);
      try {
        await precomputeCatalogHashes(mapped);
      } catch (e) {
        console.warn('[Reportar] Error indexando catálogo:', e);
      }
      if (mounted) setCatalogoListo(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const reset = () => {
    setPaso('inicio');
    setAnimalSeleccionado(null);
    setRegistrarNuevo(false);
    setUbicacion('');
    setDescripcion('');
    setEstado('');
    setFotoUri(null);
    setMatches([]);
  };

  const procesarFoto = async (uri) => {
    if (!catalogo) return;
    setFotoUri(uri);
    setPaso('analizando');
    try {
      if (!catalogoListo) {
        await precomputeCatalogHashes(catalogo);
        setCatalogoListo(true);
      }
      const targetHash = await computeHash(uri);
      const top = rankBySimilarity(catalogo, targetHash, 3);
      setMatches(top);
      setPaso('resultado');
    } catch (e) {
      console.warn('[Reportar] Error procesando foto:', e);
      Alert.alert(
        'Error al analizar',
        'No pudimos procesar la imagen. Intenta de nuevo.'
      );
      setPaso('inicio');
    }
  };

  // Mantiene la ref apuntando al procesarFoto actual para que el handler
  // del drop (anclado a través de addEventListener) use el último closure.
  useEffect(() => {
    procesarFotoRef.current = procesarFoto;
  });

  // Listeners de drag & drop sobre el uploadBox. Solo en web y mientras
  // está en paso 'inicio'; antes el catálogo tiene que estar listo (sin
  // catálogo, procesarFoto bailea).
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (paso !== 'inicio') return;
    if (!catalogo) return;
    const el = uploadBoxRef.current;
    if (!el) return;

    const onDragOver = (e) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
      setIsDragOver(true);
    };
    const onDragLeave = (e) => {
      // dragleave también dispara al entrar a un hijo; chequea que
      // efectivamente se haya salido del uploadBox.
      if (!el.contains(e.relatedTarget)) setIsDragOver(false);
    };
    const onDrop = (e) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer?.files?.[0];
      if (!file) return;
      if (!file.type?.startsWith('image/')) {
        Alert.alert('Archivo no válido', 'Solo se aceptan imágenes.');
        return;
      }
      const url = URL.createObjectURL(file);
      procesarFotoRef.current?.(url);
    };

    el.addEventListener('dragover', onDragOver);
    el.addEventListener('dragleave', onDragLeave);
    el.addEventListener('drop', onDrop);
    return () => {
      el.removeEventListener('dragover', onDragOver);
      el.removeEventListener('dragleave', onDragLeave);
      el.removeEventListener('drop', onDrop);
    };
  }, [paso, catalogo]);

  const abrirCamara = async () => {
    if (!catalogo) return;
    // En web usamos nuestro modal con getUserMedia. expo-image-picker en web
    // NO abre la cámara real (cae al file picker).
    if (Platform.OS === 'web') {
      setWebCamVisible(true);
      return;
    }
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Permiso de cámara',
          'Necesitamos acceso a la cámara para reportar al animal.'
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: false,
        cameraType:
          tipoCamara === 'front'
            ? ImagePicker.CameraType.front
            : ImagePicker.CameraType.back,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.uri) return;
      await procesarFoto(asset.uri);
    } catch (e) {
      Alert.alert(
        'No se pudo abrir la cámara',
        'Tu dispositivo no permitió abrir la cámara. ¿Quieres elegir una foto de tu galería?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir galería', onPress: abrirGaleria },
        ]
      );
    }
  };

  const handleWebCapture = async (dataUrl) => {
    setWebCamVisible(false);
    await procesarFoto(dataUrl);
  };

  const abrirGaleria = async () => {
    if (!catalogo) return;
    try {
      if (Platform.OS !== 'web') {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert(
            'Permiso de fotos',
            'Necesitamos acceso a tu galería para usar una foto.'
          );
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: false,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.uri) return;
      await procesarFoto(asset.uri);
    } catch (e) {
      console.warn('[Reportar] Error abriendo galería:', e);
      Alert.alert('Error', 'No se pudo abrir la galería.');
    }
  };

  const handleSeleccionar = (animal) => {
    setAnimalSeleccionado(animal);
    setRegistrarNuevo(false);
  };

  const handleRegistrarNuevo = () => {
    setRegistrarNuevo(true);
    setAnimalSeleccionado(null);
  };

  const handleEnviar = async () => {
    if (submitting) return;
    if (!ubicacion.trim() || !descripcion.trim() || !estado.trim()) {
      Alert.alert('Faltan datos', 'Por favor completa todos los campos.');
      return;
    }
    if (!user) {
      Alert.alert('Sesión requerida', 'Debes iniciar sesión para reportar.');
      return;
    }
    setSubmitting(true);
    try {
      const fotoUrl = fotoUri ? await uploadToReportes(fotoUri, user.id) : null;
      const { error: insertError } = await supabase.from('reportes').insert({
        user_id: user.id,
        animal_id: animalSeleccionado?.id ?? null,
        foto_url: fotoUrl,
        ubicacion: ubicacion.trim(),
        descripcion: descripcion.trim(),
        estado_observado: estado,
      });
      if (insertError) throw insertError;

      let mensaje;
      if (animalSeleccionado) {
        const org = animalSeleccionado.org;
        mensaje = org
          ? `Gracias. Hemos vinculado tu avistamiento a ${animalSeleccionado.nombre}. Notificamos a ${org.nombre}${org.telefono ? ` (${org.telefono})` : ''} para coordinar la próxima visita.`
          : `Gracias. Hemos vinculado tu avistamiento a ${animalSeleccionado.nombre}.`;
      } else {
        mensaje =
          'Gracias. Hemos registrado un nuevo animal y notificado a la organización más cercana.';
      }
      Alert.alert('Reporte enviado', mensaje, [
        { text: 'Aceptar', onPress: reset },
      ]);
    } catch (err) {
      Alert.alert('No se pudo enviar', err.message || 'Error desconocido.');
    } finally {
      setSubmitting(false);
    }
  };

  const mejorPct =
    matches.length > 0 ? Math.round(matches[0].similarity * 100) : null;

  const catalogoCargando = catalogo == null;

  return (
    <Fragment>
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {catalogoError && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning-outline" size={16} color={COLORS.white} />
          <Text style={styles.errorBannerText}>
            No pudimos cargar el catálogo: {catalogoError}
          </Text>
        </View>
      )}

      {paso === 'inicio' && (
        <View
          ref={uploadBoxRef}
          style={[styles.uploadBox, isDragOver && styles.uploadBoxDragOver]}
        >
          <Ionicons name="camera" size={64} color={COLORS.primary} />
          <Text style={styles.uploadTitle}>
            {isDragOver ? 'Suelta la imagen aquí' : 'Reportar animal'}
          </Text>
          <Text style={styles.uploadSubtitle}>
            Toma una foto del animal que viste. Compararemos la imagen con
            nuestro catálogo usando un algoritmo de parecido visual.
          </Text>
          <View style={styles.camaraSelector}>
            <TouchableOpacity
              style={[
                styles.camaraOption,
                tipoCamara === 'back' && styles.camaraOptionActiva,
              ]}
              onPress={() => setTipoCamara('back')}
            >
              <Ionicons
                name="camera-reverse-outline"
                size={16}
                color={tipoCamara === 'back' ? COLORS.white : COLORS.primary}
              />
              <Text
                style={[
                  styles.camaraOptionText,
                  tipoCamara === 'back' && styles.camaraOptionTextActiva,
                ]}
              >
                Trasera
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.camaraOption,
                tipoCamara === 'front' && styles.camaraOptionActiva,
              ]}
              onPress={() => setTipoCamara('front')}
            >
              <Ionicons
                name="person-outline"
                size={16}
                color={tipoCamara === 'front' ? COLORS.white : COLORS.primary}
              />
              <Text
                style={[
                  styles.camaraOptionText,
                  tipoCamara === 'front' && styles.camaraOptionTextActiva,
                ]}
              >
                Frontal
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[
              styles.uploadButton,
              catalogoCargando && styles.buttonDisabled,
            ]}
            onPress={abrirCamara}
            disabled={catalogoCargando}
          >
            <Ionicons name="camera" size={20} color={COLORS.white} />
            <Text style={styles.uploadButtonText}>Abrir cámara</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              catalogoCargando && styles.buttonDisabled,
            ]}
            onPress={abrirGaleria}
            disabled={catalogoCargando}
          >
            <Ionicons name="images" size={18} color={COLORS.primary} />
            <Text style={styles.secondaryButtonText}>
              Elegir desde galería
            </Text>
          </TouchableOpacity>
          {catalogoCargando ? (
            <Text style={styles.indexHint}>Cargando catálogo…</Text>
          ) : !catalogoListo ? (
            <Text style={styles.indexHint}>
              Indexando catálogo en segundo plano…
            </Text>
          ) : Platform.OS === 'web' ? (
            <Text style={styles.indexHint}>
              …o arrastra una imagen aquí
            </Text>
          ) : null}
        </View>
      )}

      {paso === 'analizando' && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>
            Comparando con el catálogo…
          </Text>
          <Text style={styles.loadingHint}>
            Combinando histograma de color (HSV) y huella estructural
            (dHash 16×16) para buscar coincidencias.
          </Text>
        </View>
      )}

      {paso === 'resultado' && (
        <>
          <View style={styles.fotoSubidaBox}>
            {fotoUri && (
              <Image source={{ uri: fotoUri }} style={styles.fotoSubida} />
            )}
            <Text style={styles.fotoSubidaLabel}>
              Foto capturada · {matches.length} coincidencia
              {matches.length === 1 ? '' : 's'} en el catálogo
              {mejorPct != null ? ` · mejor: ${mejorPct}%` : ''}
            </Text>
          </View>

          <Text style={styles.preguntaTitle}>¿Reconoces a este animal?</Text>
          <Text style={styles.preguntaSubtitle}>
            Estas son las coincidencias visuales más cercanas:
          </Text>

          {matches.length === 0 && (
            <View style={styles.emptyMatches}>
              <Ionicons
                name="alert-circle-outline"
                size={22}
                color={COLORS.gray}
              />
              <Text style={styles.emptyMatchesText}>
                No encontramos parecidos suficientes. Puedes registrar al
                animal como nuevo.
              </Text>
            </View>
          )}

          {matches.map(({ animal, similarity }) => (
            <SimilarCard
              key={animal.id}
              animal={animal}
              similarity={similarity}
              seleccionado={animalSeleccionado?.id === animal.id}
              onSeleccionar={() => handleSeleccionar(animal)}
            />
          ))}

          <TouchableOpacity
            style={[
              styles.nuevoButton,
              registrarNuevo && styles.nuevoButtonActivo,
            ]}
            onPress={handleRegistrarNuevo}
          >
            <Ionicons name="add-circle" size={20} color={COLORS.white} />
            <Text style={styles.nuevoButtonText}>
              No es ninguno / Registrar animal nuevo
            </Text>
          </TouchableOpacity>

          {animalSeleccionado?.org && (
            <View style={styles.orgInfoBox}>
              <Ionicons name="business" size={18} color={COLORS.primary} />
              <Text style={styles.orgInfoText}>
                Este animal lo atiende:{' '}
                <Text style={styles.orgInfoBold}>
                  {animalSeleccionado.org.nombre}
                </Text>
              </Text>
            </View>
          )}

          {(animalSeleccionado || registrarNuevo) && (
            <View style={styles.formulario}>
              <Text style={styles.formTitle}>Detalles del avistamiento</Text>

              <Text style={styles.label}>Ubicación</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Manuel Montt 1234, Providencia"
                value={ubicacion}
                onChangeText={setUbicacion}
                placeholderTextColor={COLORS.gray}
                editable={!submitting}
              />

              <Text style={styles.label}>Descripción</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Describe al animal y la situación..."
                value={descripcion}
                onChangeText={setDescripcion}
                multiline
                placeholderTextColor={COLORS.gray}
                editable={!submitting}
              />

              <Text style={styles.label}>Estado observado</Text>
              <View style={styles.estadoRow}>
                {[
                  { key: 'saludable', label: 'Saludable' },
                  { key: 'observacion', label: 'Observación' },
                  { key: 'urgente', label: 'Urgente' },
                ].map((e) => (
                  <TouchableOpacity
                    key={e.key}
                    style={[
                      styles.estadoOption,
                      estado === e.key && styles.estadoOptionActivo,
                    ]}
                    onPress={() => setEstado(e.key)}
                    disabled={submitting}
                  >
                    <Text
                      style={[
                        styles.estadoOptionText,
                        estado === e.key && styles.estadoOptionTextActivo,
                      ]}
                    >
                      {e.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.enviarButton,
                  submitting && styles.buttonDisabled,
                ]}
                onPress={handleEnviar}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons name="send" size={18} color={COLORS.white} />
                    <Text style={styles.enviarButtonText}>Enviar reporte</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.resetButton} onPress={reset}>
            <Ionicons name="refresh" size={16} color={COLORS.gray} />
            <Text style={styles.resetButtonText}>Tomar otra foto</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
    <WebCamera
      visible={webCamVisible}
      initialFacing={tipoCamara}
      onCapture={handleWebCapture}
      onClose={() => setWebCamVisible(false)}
    />
    </Fragment>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E63946',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorBannerText: {
    color: COLORS.white,
    fontSize: 12,
    marginLeft: 6,
    flex: 1,
  },
  uploadBox: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  uploadBoxDragOver: {
    backgroundColor: '#E8F4F2',
    borderColor: COLORS.accent,
    borderStyle: 'solid',
  },
  uploadTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 12,
  },
  uploadSubtitle: {
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
    fontSize: 13,
  },
  uploadButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 14,
  },
  camaraSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 25,
    padding: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  camaraOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  camaraOptionActiva: {
    backgroundColor: COLORS.primary,
  },
  camaraOptionText: {
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: 5,
    fontSize: 12,
  },
  camaraOptionTextActiva: {
    color: COLORS.white,
  },
  secondaryButton: {
    marginTop: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 13,
  },
  indexHint: {
    marginTop: 12,
    color: COLORS.gray,
    fontSize: 11,
    fontStyle: 'italic',
  },
  buttonDisabled: { opacity: 0.5 },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  loadingHint: {
    marginTop: 4,
    color: COLORS.gray,
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  fotoSubidaBox: {
    alignItems: 'center',
    marginBottom: 16,
  },
  fotoSubida: {
    width: 160,
    height: 160,
    borderRadius: 12,
    backgroundColor: COLORS.lightGray,
  },
  fotoSubidaLabel: {
    marginTop: 6,
    color: COLORS.gray,
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  preguntaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  preguntaSubtitle: {
    color: COLORS.gray,
    fontSize: 13,
    marginBottom: 12,
  },
  emptyMatches: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  emptyMatchesText: {
    marginLeft: 8,
    color: COLORS.gray,
    fontSize: 13,
    flex: 1,
  },
  similarCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  similarCardActivo: {
    borderColor: COLORS.primary,
  },
  similarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.lightGray,
  },
  similarImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  similarInfo: {
    flex: 1,
    marginLeft: 12,
  },
  similarName: {
    fontWeight: 'bold',
    color: COLORS.text,
    fontSize: 15,
  },
  similarId: {
    color: COLORS.gray,
    fontSize: 12,
  },
  similarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  similarZona: {
    color: COLORS.gray,
    fontSize: 12,
    marginLeft: 3,
  },
  matchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  matchPillText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 11,
    marginLeft: 3,
  },
  siButton: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  siButtonActivo: {
    backgroundColor: COLORS.primary,
  },
  siButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 12,
  },
  nuevoButton: {
    backgroundColor: COLORS.accent,
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  nuevoButtonActivo: {
    backgroundColor: COLORS.primary,
  },
  nuevoButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 13,
  },
  orgInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  orgInfoText: {
    marginLeft: 8,
    color: COLORS.text,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  orgInfoBold: {
    fontWeight: 'bold',
  },
  formulario: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  label: {
    color: COLORS.text,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  estadoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  estadoOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    marginHorizontal: 3,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  estadoOptionActivo: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  estadoOptionText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
  },
  estadoOptionTextActivo: {
    color: COLORS.white,
  },
  enviarButton: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  enviarButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 14,
  },
  resetButton: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  resetButtonText: {
    marginLeft: 6,
    color: COLORS.gray,
    fontSize: 13,
    fontWeight: '600',
  },
});

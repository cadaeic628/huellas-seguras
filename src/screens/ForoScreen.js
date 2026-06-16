import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../constants/colors';
import {
  ACTUALIZACIONES_FORO,
  getOrganizacionById,
  getAnimalesDeOrganizacion,
  getAnimalById,
} from '../data/mockData';
import { useAuth } from '../contexts/AuthContext';

const currencyCLP = (n) =>
  '$' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

const formatearFecha = (iso) => {
  const meses = [
    'ene', 'feb', 'mar', 'abr', 'may', 'jun',
    'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
  ];
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${meses[m - 1]} ${y}`;
};

function AnimalChip({ animal }) {
  return (
    <View style={styles.animalChip}>
      <Ionicons name="paw" size={11} color={COLORS.primary} />
      <Text style={styles.animalChipText}>
        {animal.nombre} · {animal.zona}
      </Text>
    </View>
  );
}

function PostCard({ post, onAbrirBoleta }) {
  const org = getOrganizacionById(post.organizacionId);
  const animales = (post.animalesRelacionadosIds || [])
    .map(getAnimalById)
    .filter(Boolean);
  const [imgError, setImgError] = useState(false);

  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.orgIcon}>
          <Ionicons name="business" size={18} color={COLORS.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.orgName}>{org?.nombre ?? 'Fundación'}</Text>
          <Text style={styles.postDate}>{formatearFecha(post.fecha)}</Text>
        </View>
      </View>

      <Text style={styles.postTitle}>{post.titulo}</Text>
      <Text style={styles.postDescription}>{post.descripcion}</Text>

      {post.monto != null && (
        <View style={styles.amountBox}>
          <Ionicons name="cash-outline" size={14} color={COLORS.primary} />
          <Text style={styles.amountText}>{currencyCLP(post.monto)} CLP</Text>
        </View>
      )}

      {post.foto && !imgError && (
        <Image
          source={{ uri: post.foto }}
          style={styles.postPhoto}
          onError={() => setImgError(true)}
        />
      )}

      {post.boleta && (
        <TouchableOpacity
          style={styles.receiptButton}
          onPress={() => onAbrirBoleta(post)}
        >
          <Ionicons name="document-text-outline" size={16} color={COLORS.secondary} />
          <Text style={styles.receiptButtonText}>Ver boleta adjunta</Text>
        </TouchableOpacity>
      )}

      {animales.length > 0 && (
        <View style={styles.animalsBox}>
          <Text style={styles.animalsTitle}>Animales relacionados</Text>
          <View style={styles.animalsRow}>
            {animales.map((a) => (
              <AnimalChip key={a.id} animal={a} />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

async function pickImage() {
  if (Platform.OS !== 'web') {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería.');
      return null;
    }
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
  });
  if (result.canceled) return null;
  return result.assets?.[0]?.uri ?? null;
}

function PublishModal({ visible, fundacionId, onCancel, onPublish }) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [montoStr, setMontoStr] = useState('');
  const [foto, setFoto] = useState(null);
  const [boleta, setBoleta] = useState(null);
  const [animalesSel, setAnimalesSel] = useState([]);

  const animalesDisponibles = useMemo(
    () => getAnimalesDeOrganizacion(fundacionId),
    [fundacionId]
  );

  const reset = () => {
    setTitulo('');
    setDescripcion('');
    setMontoStr('');
    setFoto(null);
    setBoleta(null);
    setAnimalesSel([]);
  };

  const toggleAnimal = (id) => {
    setAnimalesSel((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handlePublish = () => {
    if (!titulo.trim() || !descripcion.trim()) {
      Alert.alert('Faltan datos', 'El título y la descripción son obligatorios.');
      return;
    }
    const monto = montoStr.trim()
      ? parseInt(montoStr.replace(/\D/g, ''), 10)
      : null;
    if (montoStr.trim() && Number.isNaN(monto)) {
      Alert.alert('Monto inválido', 'Ingresa solo números.');
      return;
    }
    onPublish({
      id: `POST-LOCAL-${Date.now()}`,
      organizacionId: fundacionId,
      fecha: new Date().toISOString().slice(0, 10),
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      ...(monto != null ? { monto } : {}),
      ...(foto ? { foto } : {}),
      ...(boleta ? { boleta } : {}),
      animalesRelacionadosIds: animalesSel,
    });
    reset();
  };

  const handleCancel = () => {
    reset();
    onCancel();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.publishCard}>
          <ScrollView contentContainerStyle={{ paddingBottom: 12 }}>
            <Text style={styles.publishTitle}>Nueva actualización</Text>
            <Text style={styles.publishHint}>
              Cuéntale a la comunidad cómo usaste los aportes recibidos.
            </Text>

            <Text style={styles.fieldLabel}>Título *</Text>
            <TextInput
              value={titulo}
              onChangeText={setTitulo}
              placeholder="Ej: Compra de 10 sacos de comida"
              style={styles.input}
              maxLength={80}
            />

            <Text style={styles.fieldLabel}>Descripción *</Text>
            <TextInput
              value={descripcion}
              onChangeText={setDescripcion}
              placeholder="Detalla qué se compró o financió"
              style={[styles.input, styles.inputMultiline]}
              multiline
              numberOfLines={4}
              maxLength={400}
            />

            <Text style={styles.fieldLabel}>Monto en CLP (opcional)</Text>
            <TextInput
              value={montoStr}
              onChangeText={setMontoStr}
              placeholder="150000"
              keyboardType="numeric"
              style={styles.input}
            />

            <View style={styles.attachRow}>
              <TouchableOpacity
                style={styles.attachBtn}
                onPress={async () => {
                  const uri = await pickImage();
                  if (uri) setFoto(uri);
                }}
              >
                <Ionicons
                  name={foto ? 'image' : 'image-outline'}
                  size={18}
                  color={foto ? COLORS.primary : COLORS.gray}
                />
                <Text
                  style={[
                    styles.attachBtnText,
                    foto && { color: COLORS.primary },
                  ]}
                >
                  {foto ? 'Foto adjunta' : 'Adjuntar foto'}
                </Text>
                {foto && (
                  <TouchableOpacity onPress={() => setFoto(null)} hitSlop={8}>
                    <Ionicons name="close-circle" size={16} color={COLORS.gray} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.attachBtn}
                onPress={async () => {
                  const uri = await pickImage();
                  if (uri) setBoleta(uri);
                }}
              >
                <Ionicons
                  name={boleta ? 'document-text' : 'document-text-outline'}
                  size={18}
                  color={boleta ? COLORS.secondary : COLORS.gray}
                />
                <Text
                  style={[
                    styles.attachBtnText,
                    boleta && { color: COLORS.secondary },
                  ]}
                >
                  {boleta ? 'Boleta adjunta' : 'Adjuntar boleta'}
                </Text>
                {boleta && (
                  <TouchableOpacity onPress={() => setBoleta(null)} hitSlop={8}>
                    <Ionicons name="close-circle" size={16} color={COLORS.gray} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>
              Animales relacionados (opcional)
            </Text>
            {animalesDisponibles.length === 0 ? (
              <Text style={styles.emptyHint}>
                Esta fundación no tiene animales en seguimiento.
              </Text>
            ) : (
              <View style={styles.animalsPicker}>
                {animalesDisponibles.map((a) => {
                  const active = animalesSel.includes(a.id);
                  return (
                    <TouchableOpacity
                      key={a.id}
                      style={[
                        styles.animalPickChip,
                        active && styles.animalPickChipActive,
                      ]}
                      onPress={() => toggleAnimal(a.id)}
                    >
                      <Ionicons
                        name={active ? 'checkmark-circle' : 'paw-outline'}
                        size={12}
                        color={active ? COLORS.white : COLORS.primary}
                      />
                      <Text
                        style={[
                          styles.animalPickChipText,
                          active && { color: COLORS.white },
                        ]}
                      >
                        {a.nombre}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalBtn, styles.modalBtnSecondary]}
              onPress={handleCancel}
            >
              <Text style={styles.modalBtnSecondaryText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, styles.modalBtnPrimary]}
              onPress={handlePublish}
            >
              <Ionicons name="send" size={14} color={COLORS.white} />
              <Text style={styles.modalBtnPrimaryText}>Publicar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ReceiptModal({ post, onClose }) {
  return (
    <Modal
      transparent
      visible={!!post}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.receiptOverlay}>
        <TouchableOpacity
          style={styles.receiptCloseBtn}
          onPress={onClose}
          hitSlop={10}
        >
          <Ionicons name="close" size={26} color={COLORS.white} />
        </TouchableOpacity>
        {post && (
          <>
            <Image
              source={{ uri: post.boleta }}
              style={styles.receiptImage}
              resizeMode="contain"
            />
            <Text style={styles.receiptCaption}>
              Boleta · {post.titulo}
            </Text>
          </>
        )}
      </View>
    </Modal>
  );
}

export default function ForoScreen() {
  const { user } = useAuth();
  const esFundacion = user?.role === 'fundacion';
  const fundacionId = user?.organizacionId;

  const [postsLocales, setPostsLocales] = useState([]);
  const [publishOpen, setPublishOpen] = useState(false);
  const [boletaPost, setBoletaPost] = useState(null);

  const feed = useMemo(() => {
    return [...postsLocales, ...ACTUALIZACIONES_FORO].sort((a, b) =>
      a.fecha < b.fecha ? 1 : -1
    );
  }, [postsLocales]);

  const handlePublish = (post) => {
    setPostsLocales((prev) => [post, ...prev]);
    setPublishOpen(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerBox}>
          <View style={styles.headerTitleRow}>
            <Ionicons name="chatbubbles" size={22} color={COLORS.primary} />
            <Text style={styles.headerTitle}>Foro de fundaciones</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Las fundaciones publican aquí cómo están usando los aportes
            recibidos. Tu donación se traduce en acciones concretas.
          </Text>
        </View>

        {feed.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onAbrirBoleta={setBoletaPost}
          />
        ))}

        {esFundacion && (
          <Text style={styles.footerNote}>
            Toca el botón "+" para publicar una nueva actualización de tu
            fundación.
          </Text>
        )}
      </ScrollView>

      {esFundacion && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setPublishOpen(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color={COLORS.white} />
        </TouchableOpacity>
      )}

      {esFundacion && (
        <PublishModal
          visible={publishOpen}
          fundacionId={fundacionId}
          onCancel={() => setPublishOpen(false)}
          onPublish={handlePublish}
        />
      )}

      <ReceiptModal post={boletaPost} onClose={() => setBoletaPost(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 100 },

  headerBox: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: 8,
  },
  headerSubtitle: {
    color: COLORS.gray,
    fontSize: 12,
    marginTop: 6,
    lineHeight: 17,
  },

  postCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  orgIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  orgName: { fontSize: 14, fontWeight: 'bold', color: COLORS.text },
  postDate: { fontSize: 11, color: COLORS.gray, marginTop: 1 },
  postTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 6,
  },
  postDescription: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
    marginBottom: 10,
  },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  amountText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginLeft: 6,
  },
  postPhoto: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: COLORS.lightGray,
  },
  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF2F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  receiptButtonText: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: '700',
    marginLeft: 6,
  },
  animalsBox: { marginTop: 4 },
  animalsTitle: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  animalsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  animalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  animalChipText: { fontSize: 11, color: COLORS.text, marginLeft: 4 },

  footerNote: {
    textAlign: 'center',
    color: COLORS.gray,
    fontStyle: 'italic',
    fontSize: 12,
    marginTop: 6,
  },

  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },

  // --- Publish modal ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  publishCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 18,
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
  },
  publishTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  publishHint: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  attachRow: { flexDirection: 'row', marginTop: 12, marginBottom: 4 },
  attachBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 6,
  },
  attachBtnText: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: '600',
    marginLeft: 6,
    marginRight: 4,
  },
  emptyHint: {
    fontSize: 12,
    color: COLORS.gray,
    fontStyle: 'italic',
    marginTop: 4,
  },
  animalsPicker: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  animalPickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 14,
    paddingHorizontal: 9,
    paddingVertical: 5,
    marginRight: 6,
    marginBottom: 6,
  },
  animalPickChipActive: { backgroundColor: COLORS.primary },
  animalPickChipText: {
    fontSize: 11,
    color: COLORS.text,
    fontWeight: '600',
    marginLeft: 4,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingTop: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  modalBtnPrimary: { backgroundColor: COLORS.primary },
  modalBtnPrimaryText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 6,
  },
  modalBtnSecondary: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  modalBtnSecondaryText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 13,
  },

  // --- Receipt modal ---
  receiptOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  receiptCloseBtn: {
    position: 'absolute',
    top: 30,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  receiptImage: { width: '100%', height: '80%' },
  receiptCaption: {
    color: COLORS.white,
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
});

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { supabase } from '../lib/supabase';
import { getEstadoLabel, getEstadoColor } from '../data/mockData';
import FichaAnimalModal from '../components/FichaAnimalModal';

const FILTROS = [
  { key: 'todos', label: 'Todos' },
  { key: 'saludable', label: 'Saludables' },
  { key: 'observacion', label: 'En observación' },
  { key: 'urgente', label: 'Urgentes' },
  { key: 'apadrinados', label: 'Apadrinados' },
  { key: 'adoptados', label: 'Adoptados' },
];

// Convierte una row de `animales` (con join a `organizaciones`) al shape
// camelCase que usan las cards y el FichaAnimalModal. Los booleans
// apadrinado/adoptado se derivan de las columnas *_por.
function mapAnimalRow(row) {
  const orgRow = row.organizaciones;
  const org = orgRow
    ? {
        id: orgRow.id,
        nombre: orgRow.nombre,
        comuna: orgRow.comuna,
        comunasOperacion: orgRow.comunas_operacion ?? [],
        descripcion: orgRow.descripcion,
        telefono: orgRow.telefono,
        horario: orgRow.horario,
        banco: orgRow.banco,
        redes: orgRow.redes,
      }
    : null;
  return {
    id: row.id,
    nombre: row.nombre,
    tipo: row.tipo,
    estado: row.estado,
    zona: row.zona,
    comuna: row.comuna,
    descripcion: row.descripcion,
    foto: row.foto_url,
    organizacionId: row.organizacion_id,
    lat: row.lat,
    lng: row.lng,
    apadrinado: row.apadrinado_por != null,
    adoptado: row.adoptado_por != null,
    ficha: row.ficha ?? {},
    org,
  };
}

function AnimalCard({ animal, onAccion, onVerFicha }) {
  const [imgError, setImgError] = useState(false);
  const org = animal.org;
  return (
    <View style={styles.card}>
      <TouchableOpacity activeOpacity={0.85} onPress={() => onVerFicha(animal)}>
        {imgError ? (
          <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
            <Ionicons name="paw" size={56} color={COLORS.primary} />
            <Text style={styles.placeholderText}>{animal.tipo}</Text>
          </View>
        ) : (
          <Image
            source={{ uri: animal.foto }}
            style={styles.cardImage}
            onError={() => setImgError(true)}
          />
        )}
      </TouchableOpacity>
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardName}>{animal.nombre}</Text>
        </View>
        <View
          style={[
            styles.estadoBadge,
            { backgroundColor: getEstadoColor(animal.estado) },
          ]}
        >
          <Text style={styles.estadoText}>{getEstadoLabel(animal.estado)}</Text>
        </View>
        <View style={styles.zonaRow}>
          <Ionicons name="location-outline" size={14} color={COLORS.gray} />
          <Text style={styles.zonaText}>
            {animal.zona} ({animal.comuna})
          </Text>
        </View>
        {org && (
          <View style={styles.orgRow}>
            <Ionicons name="business-outline" size={14} color={COLORS.primary} />
            <Text style={styles.orgText} numberOfLines={1}>
              A cargo de <Text style={styles.orgTextBold}>{org.nombre}</Text>
            </Text>
          </View>
        )}
        {(animal.apadrinado || animal.adoptado) && (
          <View style={styles.tagsRow}>
            {animal.apadrinado && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>Apadrinado</Text>
              </View>
            )}
            {animal.adoptado && (
              <View style={[styles.tag, { backgroundColor: COLORS.accent }]}>
                <Text style={styles.tagText}>Adoptado</Text>
              </View>
            )}
          </View>
        )}
        <TouchableOpacity
          style={styles.fichaButton}
          onPress={() => onVerFicha(animal)}
        >
          <Ionicons name="document-text-outline" size={15} color={COLORS.primary} />
          <Text style={styles.fichaButtonText}>Ver ficha completa</Text>
        </TouchableOpacity>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryAction]}
            onPress={() => onAccion(animal, 'adoptar')}
          >
            <Text style={styles.actionText}>¡Quiero adoptar!</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryAction]}
            onPress={() => onAccion(animal, 'apadrinar')}
          >
            <Text style={styles.actionText}>Quiero apadrinar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function AnimalesScreen() {
  const [filtro, setFiltro] = useState('todos');
  const [modalData, setModalData] = useState(null);
  const [fichaAnimal, setFichaAnimal] = useState(null);
  const [animales, setAnimales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error: fetchError } = await supabase
        .from('animales')
        .select('*, organizaciones(*)')
        .order('created_at', { ascending: false });
      if (!mounted) return;
      if (fetchError) {
        setError(fetchError.message);
      } else {
        setAnimales((data ?? []).map(mapAnimalRow));
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filtrarAnimales = () => {
    if (filtro === 'todos') return animales;
    if (filtro === 'apadrinados') return animales.filter((a) => a.apadrinado);
    if (filtro === 'adoptados') return animales.filter((a) => a.adoptado);
    return animales.filter((a) => a.estado === filtro);
  };

  const abrirModal = (animal, accion) => {
    setActionError(null);
    setModalData({ animal, accion, org: animal.org });
  };

  const cerrarModal = () => {
    if (submitting) return;
    setModalData(null);
    setActionError(null);
  };

  const confirmarAccion = async () => {
    if (!modalData) return;
    setSubmitting(true);
    setActionError(null);
    const rpcName = modalData.accion === 'adoptar' ? 'adoptar' : 'apadrinar';
    const { error: rpcError } = await supabase.rpc(rpcName, {
      animal: modalData.animal.id,
    });
    setSubmitting(false);
    if (rpcError) {
      setActionError(rpcError.message);
      return;
    }
    const field = modalData.accion === 'adoptar' ? 'adoptado' : 'apadrinado';
    setAnimales((prev) =>
      prev.map((a) =>
        a.id === modalData.animal.id ? { ...a, [field]: true } : a
      )
    );
    setModalData(null);
  };

  const animalesMostrados = filtrarAnimales();

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filtros */}
      <View style={styles.filtrosWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtrosContent}
        >
          {FILTROS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filtroChip,
                filtro === f.key && styles.filtroChipActivo,
              ]}
              onPress={() => setFiltro(f.key)}
            >
              <Text
                style={[
                  styles.filtroText,
                  filtro === f.key && styles.filtroTextActivo,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning-outline" size={16} color={COLORS.white} />
          <Text style={styles.errorBannerText}>
            No pudimos cargar el catálogo: {error}
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.lista}>
        {animalesMostrados.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="paw-outline" size={48} color={COLORS.gray} />
            <Text style={styles.emptyText}>
              No hay animales en esta categoría.
            </Text>
          </View>
        ) : (
          animalesMostrados.map((animal) => (
            <AnimalCard
              key={animal.id}
              animal={animal}
              onAccion={abrirModal}
              onVerFicha={setFichaAnimal}
            />
          ))
        )}
      </ScrollView>

      <Modal
        transparent
        visible={!!modalData}
        animationType="fade"
        onRequestClose={cerrarModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={cerrarModal}
        >
          <View
            style={styles.modalCard}
            onStartShouldSetResponder={() => true}
          >
            {modalData && (
              <>
                <Text style={styles.modalTitle}>
                  {modalData.accion === 'adoptar'
                    ? '¡Quieres adoptar a ' + modalData.animal.nombre + '!'
                    : '¡Quieres apadrinar a ' + modalData.animal.nombre + '!'}
                </Text>
                <Text style={styles.modalSub}>
                  Estos son los datos de la organización a cargo:
                </Text>
                {modalData.org && (
                  <View style={styles.modalOrgBox}>
                    <Text style={styles.modalOrgName}>
                      {modalData.org.nombre}
                    </Text>
                    <View style={styles.modalInfoRow}>
                      <Ionicons
                        name="location"
                        size={16}
                        color={COLORS.primary}
                      />
                      <Text style={styles.modalInfoText}>
                        {modalData.org.comuna}
                      </Text>
                    </View>
                    <View style={styles.modalInfoRow}>
                      <Ionicons name="call" size={16} color={COLORS.primary} />
                      <Text style={styles.modalInfoText}>
                        {modalData.org.telefono}
                      </Text>
                    </View>
                    <View style={styles.modalInfoRow}>
                      <Ionicons name="time" size={16} color={COLORS.primary} />
                      <Text style={styles.modalInfoText}>
                        {modalData.org.horario}
                      </Text>
                    </View>
                  </View>
                )}
                <Text style={styles.modalNota}>
                  Este animal se encuentra en la vía pública. La organización
                  puede orientarte sobre su historial y rutas habituales.
                </Text>
                {actionError && (
                  <Text style={styles.modalError}>{actionError}</Text>
                )}
                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    submitting && styles.buttonDisabled,
                  ]}
                  onPress={confirmarAccion}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.confirmButtonText}>
                      {modalData.accion === 'adoptar'
                        ? 'Confirmar adopción'
                        : 'Confirmar apadrinamiento'}
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={cerrarModal}
                  disabled={submitting}
                >
                  <Text style={styles.closeButtonText}>Cerrar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      <FichaAnimalModal
        animal={fichaAnimal}
        org={fichaAnimal?.org}
        visible={!!fichaAnimal}
        onClose={() => setFichaAnimal(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtrosWrapper: {
    backgroundColor: COLORS.white,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  filtrosContent: {
    paddingHorizontal: 10,
  },
  filtroChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: COLORS.lightGray,
    marginHorizontal: 4,
  },
  filtroChipActivo: {
    backgroundColor: COLORS.primary,
  },
  filtroText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  filtroTextActivo: {
    color: COLORS.white,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E63946',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  errorBannerText: {
    color: COLORS.white,
    fontSize: 12,
    marginLeft: 6,
    flex: 1,
  },
  lista: {
    padding: 12,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 14,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardImage: {
    width: '100%',
    height: 180,
    backgroundColor: COLORS.lightGray,
  },
  cardImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  placeholderText: {
    color: COLORS.gray,
    marginTop: 6,
    fontWeight: '600',
  },
  cardBody: {
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  estadoBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginVertical: 4,
  },
  estadoText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: 'bold',
  },
  zonaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  zonaText: {
    fontSize: 13,
    color: COLORS.gray,
    marginLeft: 4,
  },
  orgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  orgText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.text,
    marginLeft: 4,
  },
  orgTextBold: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  tagsRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  tag: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginRight: 6,
  },
  tagText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '600',
  },
  fichaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
  },
  fichaButtonText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 13,
    marginLeft: 5,
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  primaryAction: {
    backgroundColor: COLORS.primary,
  },
  secondaryAction: {
    backgroundColor: COLORS.secondary,
  },
  actionText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 13,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: COLORS.gray,
    marginTop: 10,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 22,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 6,
    textAlign: 'center',
  },
  modalSub: {
    fontSize: 13,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 12,
  },
  modalOrgBox: {
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 10,
  },
  modalOrgName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  modalInfoText: {
    marginLeft: 8,
    color: COLORS.text,
    fontSize: 13,
  },
  modalNota: {
    color: COLORS.text,
    fontSize: 12,
    marginTop: 14,
    lineHeight: 17,
    fontStyle: 'italic',
  },
  modalError: {
    color: '#E63946',
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  closeButton: {
    backgroundColor: 'transparent',
    paddingVertical: 10,
    marginTop: 6,
    alignItems: 'center',
  },
  closeButtonText: {
    color: COLORS.gray,
    fontWeight: '600',
    fontSize: 13,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

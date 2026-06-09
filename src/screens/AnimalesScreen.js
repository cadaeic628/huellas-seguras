import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import {
  ANIMALS,
  getEstadoLabel,
  getEstadoColor,
  getOrganizacionDeAnimal,
} from '../data/mockData';
import FichaAnimalModal from '../components/FichaAnimalModal';

const FILTROS = [
  { key: 'todos', label: 'Todos' },
  { key: 'saludable', label: 'Saludables' },
  { key: 'observacion', label: 'En observación' },
  { key: 'urgente', label: 'Urgentes' },
  { key: 'apadrinados', label: 'Apadrinados' },
  { key: 'adoptados', label: 'Adoptados' },
];

function AnimalCard({ animal, onAccion, onVerFicha }) {
  const [imgError, setImgError] = useState(false);
  const org = getOrganizacionDeAnimal(animal);
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
          <Text style={styles.cardId}>{animal.id}</Text>
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
        <View style={styles.orgRow}>
          <Ionicons name="business-outline" size={14} color={COLORS.primary} />
          <Text style={styles.orgText} numberOfLines={1}>
            A cargo de <Text style={styles.orgTextBold}>{org.nombre}</Text>
          </Text>
        </View>
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

  const filtrarAnimales = () => {
    if (filtro === 'todos') return ANIMALS;
    if (filtro === 'apadrinados') return ANIMALS.filter((a) => a.apadrinado);
    if (filtro === 'adoptados') return ANIMALS.filter((a) => a.adoptado);
    return ANIMALS.filter((a) => a.estado === filtro);
  };

  const abrirModal = (animal, accion) => {
    const org = getOrganizacionDeAnimal(animal);
    setModalData({ animal, accion, org });
  };

  const animalesMostrados = filtrarAnimales();

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
        onRequestClose={() => setModalData(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalData(null)}
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
                <Text style={styles.modalNota}>
                  Este animal se encuentra en la vía pública. La organización
                  puede orientarte sobre su historial y rutas habituales.
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalData(null)}
                >
                  <Text style={styles.closeButtonText}>Entendido</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      <FichaAnimalModal
        animal={fichaAnimal}
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
  cardId: {
    fontSize: 12,
    color: COLORS.gray,
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
  closeButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
});

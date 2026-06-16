import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Image,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import {
  getEstadoLabel,
  getEstadoColor,
  getOrganizacionDeAnimal,
} from '../data/mockData';

function Badge({ ok, labelTrue, labelFalse }) {
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: ok ? COLORS.healthy : COLORS.lightGray },
      ]}
    >
      <Ionicons
        name={ok ? 'checkmark-circle' : 'close-circle'}
        size={13}
        color={ok ? COLORS.white : COLORS.gray}
      />
      <Text
        style={[
          styles.badgeText,
          { color: ok ? COLORS.white : COLORS.gray },
        ]}
      >
        {ok ? labelTrue : labelFalse}
      </Text>
    </View>
  );
}

function DataRow({ icon, label, value }) {
  return (
    <View style={styles.dataRow}>
      <Ionicons name={icon} size={16} color={COLORS.primary} />
      <Text style={styles.dataLabel}>{label}:</Text>
      <Text style={styles.dataValue}>{value}</Text>
    </View>
  );
}

export default function FichaAnimalModal({ animal, org: orgProp, visible, onClose }) {
  const [imgError, setImgError] = useState(false);

  if (!animal) return null;
  const ficha = animal.ficha || {};
  // Pantallas ya migradas a Supabase pasan org como prop (viene del join).
  // El fallback al helper de mockData mantiene compat con MapaScreen y
  // PerfilScreen mientras no se migren (ver Roadmap §1).
  const org = orgProp ?? getOrganizacionDeAnimal(animal);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header con foto y cierre */}
          <View style={styles.header}>
            {imgError ? (
              <View style={[styles.headerImage, styles.imgPlaceholder]}>
                <Ionicons name="paw" size={50} color={COLORS.primary} />
              </View>
            ) : (
              <Image
                source={{ uri: animal.foto }}
                style={styles.headerImage}
                onError={() => setImgError(true)}
              />
            )}
            <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
              <Ionicons name="close" size={22} color={COLORS.white} />
            </TouchableOpacity>
            <View
              style={[
                styles.estadoChip,
                { backgroundColor: getEstadoColor(animal.estado) },
              ]}
            >
              <Text style={styles.estadoChipText}>
                {getEstadoLabel(animal.estado)}
              </Text>
            </View>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Identificación */}
            <Text style={styles.name}>{animal.nombre}</Text>
            <Text style={styles.subtitle}>
              {animal.tipo} · ID {animal.id}
            </Text>
            <View style={styles.zoneRow}>
              <Ionicons name="location" size={14} color={COLORS.gray} />
              <Text style={styles.zoneText}>
                {animal.zona} ({animal.comuna})
              </Text>
            </View>

            {/* Datos básicos */}
            <Text style={styles.sectionTitle}>Datos básicos</Text>
            <View style={styles.section}>
              {ficha.edad && (
                <DataRow icon="calendar-outline" label="Edad" value={ficha.edad} />
              )}
              {ficha.sexo && (
                <DataRow icon="male-female-outline" label="Sexo" value={ficha.sexo} />
              )}
              {ficha.raza && (
                <DataRow icon="ribbon-outline" label="Raza" value={ficha.raza} />
              )}
              {ficha.tamaño && (
                <DataRow icon="resize-outline" label="Tamaño" value={ficha.tamaño} />
              )}
              {ficha.peso && (
                <DataRow icon="speedometer-outline" label="Peso" value={ficha.peso} />
              )}
              {ficha.color && (
                <DataRow icon="color-palette-outline" label="Color" value={ficha.color} />
              )}
            </View>

            {/* Salud */}
            <Text style={styles.sectionTitle}>Salud</Text>
            <View style={styles.badgesRow}>
              <Badge
                ok={!!ficha.vacunado}
                labelTrue="Vacunado"
                labelFalse="Sin vacunar"
              />
              <Badge
                ok={!!ficha.esterilizado}
                labelTrue="Esterilizado"
                labelFalse="No esterilizado"
              />
              <Badge
                ok={!!ficha.desparasitado}
                labelTrue="Desparasitado"
                labelFalse="Sin desparasitar"
              />
              <Badge
                ok={!!ficha.microchip}
                labelTrue="Microchip"
                labelFalse="Sin chip"
              />
            </View>

            {/* Temperamento */}
            {ficha.temperamento && (
              <>
                <Text style={styles.sectionTitle}>Temperamento</Text>
                <Text style={styles.paragraph}>{ficha.temperamento}</Text>
              </>
            )}

            {/* Convivencia */}
            <Text style={styles.sectionTitle}>Convivencia</Text>
            <View style={styles.badgesRow}>
              <Badge
                ok={!!ficha.buenoConNiños}
                labelTrue="Bien con niños"
                labelFalse="No con niños"
              />
              <Badge
                ok={!!ficha.buenoConOtrosAnimales}
                labelTrue="Bien con animales"
                labelFalse="Mejor solo"
              />
            </View>

            {/* Historia */}
            {ficha.historia && (
              <>
                <Text style={styles.sectionTitle}>Historia</Text>
                <Text style={styles.paragraph}>{ficha.historia}</Text>
              </>
            )}

            {/* Rescate */}
            {ficha.fechaRescate && (
              <>
                <Text style={styles.sectionTitle}>Rescate</Text>
                <DataRow
                  icon="calendar-outline"
                  label="Fecha"
                  value={ficha.fechaRescate}
                />
              </>
            )}

            {/* Cuidados especiales */}
            {ficha.cuidadosEspeciales && (
              <>
                <Text style={styles.sectionTitle}>Cuidados especiales</Text>
                <Text style={styles.paragraph}>{ficha.cuidadosEspeciales}</Text>
              </>
            )}

            {/* Necesidades */}
            {ficha.necesidades && (
              <>
                <Text style={styles.sectionTitle}>¿Qué necesita?</Text>
                <Text style={styles.paragraph}>{ficha.necesidades}</Text>
              </>
            )}

            {/* Organización */}
            {org && (
              <>
                <Text style={styles.sectionTitle}>Organización a cargo</Text>
                <View style={styles.orgBox}>
                  <Text style={styles.orgName}>{org.nombre}</Text>
                  <View style={styles.orgRow}>
                    <Ionicons name="call-outline" size={14} color={COLORS.primary} />
                    <Text style={styles.orgText}>{org.telefono}</Text>
                  </View>
                  <View style={styles.orgRow}>
                    <Ionicons name="time-outline" size={14} color={COLORS.primary} />
                    <Text style={styles.orgText}>{org.horario}</Text>
                  </View>
                </View>
              </>
            )}
          </ScrollView>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Cerrar ficha</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    width: '100%',
    height: 180,
    backgroundColor: COLORS.lightGray,
    position: 'relative',
  },
  headerImage: { width: '100%', height: '100%' },
  imgPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  closeIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  estadoChip: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  estadoChipText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 12,
  },
  scroll: { flexGrow: 0 },
  scrollContent: { padding: 18, paddingBottom: 4 },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 2,
  },
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  zoneText: {
    fontSize: 13,
    color: COLORS.text,
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: { gap: 4 },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
    flexWrap: 'wrap',
  },
  dataLabel: {
    fontWeight: 'bold',
    color: COLORS.text,
    fontSize: 13,
    marginLeft: 6,
    marginRight: 4,
  },
  dataValue: {
    color: COLORS.text,
    fontSize: 13,
    flexShrink: 1,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  paragraph: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 19,
  },
  orgBox: {
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 10,
  },
  orgName: {
    fontWeight: 'bold',
    color: COLORS.text,
    fontSize: 14,
    marginBottom: 6,
  },
  orgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  orgText: {
    marginLeft: 6,
    color: COLORS.text,
    fontSize: 13,
  },
  closeButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    alignItems: 'center',
    margin: 14,
    borderRadius: 25,
  },
  closeButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
});

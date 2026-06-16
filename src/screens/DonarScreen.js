import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import {
  ORGANIZACIONES,
  getAnimalesDeOrganizacion,
} from '../data/mockData';
import RedesSocialesRow from '../components/RedesSocialesRow';

function copyToClipboard(text) {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => {});
    return true;
  }
  return false;
}

function BankRow({ label, value, copyable = true }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    if (copyToClipboard(value)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };
  return (
    <View style={styles.bankRow}>
      <Text style={styles.bankLabel}>{label}</Text>
      <View style={styles.bankValueRow}>
        <Text style={styles.bankValue} selectable>
          {value}
        </Text>
        {copyable && Platform.OS === 'web' && (
          <TouchableOpacity onPress={handleCopy} style={styles.copyBtn}>
            <Ionicons
              name={copied ? 'checkmark' : 'copy-outline'}
              size={14}
              color={copied ? COLORS.healthy : COLORS.primary}
            />
            <Text style={[styles.copyText, copied && { color: COLORS.healthy }]}>
              {copied ? 'Copiado' : 'Copiar'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function DonarScreen() {
  const [orgSeleccionada, setOrgSeleccionada] = useState(null);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerBox}>
        <Ionicons name="heart-circle" size={48} color={COLORS.accent} />
        <Text style={styles.headerTitle}>Tu ayuda hace la diferencia</Text>
        <Text style={styles.headerSubtitle}>
          Estas organizaciones trabajan a diario por los animales del catálogo.
          Toca "Ir a donar" para ver los datos bancarios.
        </Text>
      </View>

      {ORGANIZACIONES.map((org) => {
        const animales = getAnimalesDeOrganizacion(org.id);
        const urgentes = animales.filter((a) => a.estado === 'urgente').length;
        return (
          <View key={org.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconWrapper}>
                <Ionicons name="business" size={22} color={COLORS.white} />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>{org.nombre}</Text>
                <View style={styles.cardComunaRow}>
                  <Ionicons name="location-outline" size={13} color={COLORS.gray} />
                  <Text style={styles.cardComuna}>Sede: {org.comuna}</Text>
                </View>
              </View>
            </View>

            <RedesSocialesRow redes={org.redes} style={styles.redesRow} />

            <Text style={styles.cardDescripcion}>{org.descripcion}</Text>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{animales.length}</Text>
                <Text style={styles.statLabel}>Animales</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{org.comunasOperacion.length}</Text>
                <Text style={styles.statLabel}>Comunas</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, urgentes > 0 && { color: COLORS.urgent }]}>
                  {urgentes}
                </Text>
                <Text style={styles.statLabel}>Urgentes</Text>
              </View>
            </View>

            {animales.length > 0 && (
              <View style={styles.animalesBox}>
                <Text style={styles.animalesTitle}>En seguimiento ahora:</Text>
                <View style={styles.chipsRow}>
                  {animales.slice(0, 6).map((a) => (
                    <View key={a.id} style={styles.chip}>
                      <Ionicons name="paw" size={11} color={COLORS.primary} />
                      <Text style={styles.chipText}>
                        {a.nombre} · {a.zona}
                      </Text>
                    </View>
                  ))}
                  {animales.length > 6 && (
                    <View style={[styles.chip, { backgroundColor: COLORS.primary }]}>
                      <Text style={[styles.chipText, { color: COLORS.white }]}>
                        +{animales.length - 6} más
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            <View style={styles.comunasRow}>
              <Ionicons name="map-outline" size={13} color={COLORS.gray} />
              <Text style={styles.comunasText}>
                Opera en: {org.comunasOperacion.join(', ')}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.donarButton}
              onPress={() => setOrgSeleccionada(org)}
            >
              <Ionicons name="heart" size={18} color={COLORS.white} />
              <Text style={styles.donarButtonText}>Ir a donar</Text>
            </TouchableOpacity>
          </View>
        );
      })}

      <Text style={styles.footerNote}>
        Cada aporte ayuda a financiar alimento, esterilización y atención veterinaria.
      </Text>

      {/* Modal de datos bancarios */}
      <Modal
        transparent
        visible={!!orgSeleccionada}
        animationType="slide"
        onRequestClose={() => setOrgSeleccionada(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {orgSeleccionada && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalIconWrap}>
                    <Ionicons name="heart" size={26} color={COLORS.white} />
                  </View>
                  <Text style={styles.modalTitle}>
                    Datos para donar
                  </Text>
                  <Text style={styles.modalOrgName}>{orgSeleccionada.nombre}</Text>
                </View>

                <View style={styles.bankCard}>
                  <BankRow label="Banco" value={orgSeleccionada.banco.banco} />
                  <BankRow label="Tipo de cuenta" value={orgSeleccionada.banco.tipoCuenta} />
                  <BankRow label="N° de cuenta" value={orgSeleccionada.banco.numero} />
                  <BankRow label="RUT" value={orgSeleccionada.banco.rut} />
                  <BankRow label="Titular" value={orgSeleccionada.banco.titular} copyable={false} />
                  <BankRow label="Email comprobante" value={orgSeleccionada.banco.email} />
                </View>

                <View style={styles.tipBox}>
                  <Ionicons name="information-circle" size={16} color={COLORS.secondary} />
                  <Text style={styles.tipText}>
                    Envía el comprobante al email para que la organización pueda agradecerte
                    y enviarte un reporte de uso de tu aporte.
                  </Text>
                </View>

                <View style={styles.modalActions}>
                  {Platform.OS === 'web' && (
                    <TouchableOpacity
                      style={[styles.modalBtn, styles.modalBtnSecondary]}
                      onPress={() => {
                        const b = orgSeleccionada.banco;
                        const txt = `Donación a ${orgSeleccionada.nombre}\nBanco: ${b.banco}\nTipo: ${b.tipoCuenta}\nN° Cuenta: ${b.numero}\nRUT: ${b.rut}\nTitular: ${b.titular}\nEmail: ${b.email}`;
                        if (copyToClipboard(txt)) {
                          Alert.alert('Datos copiados', 'Todos los datos bancarios fueron copiados al portapapeles.');
                        }
                      }}
                    >
                      <Ionicons name="copy" size={16} color={COLORS.primary} />
                      <Text style={styles.modalBtnSecondaryText}>Copiar todo</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnPrimary]}
                    onPress={() => setOrgSeleccionada(null)}
                  >
                    <Text style={styles.modalBtnPrimaryText}>Cerrar</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 30 },
  headerBox: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 18,
    alignItems: 'center', marginBottom: 18,
  },
  headerTitle: {
    fontSize: 18, fontWeight: 'bold', color: COLORS.text,
    marginTop: 6, textAlign: 'center',
  },
  headerSubtitle: {
    color: COLORS.gray, fontSize: 13, textAlign: 'center',
    marginTop: 6, lineHeight: 18,
  },
  card: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 16, marginBottom: 14,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  iconWrapper: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  cardHeaderText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  cardComunaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  cardComuna: { fontSize: 12, color: COLORS.gray, marginLeft: 3 },
  redesRow: { marginBottom: 10 },
  cardDescripcion: { fontSize: 13, color: COLORS.text, marginBottom: 12, lineHeight: 18 },
  statsRow: {
    flexDirection: 'row', backgroundColor: COLORS.background,
    borderRadius: 10, padding: 10, marginBottom: 12,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
  statLabel: { fontSize: 11, color: COLORS.gray, fontWeight: '600' },
  animalesBox: { marginBottom: 12 },
  animalesTitle: { fontSize: 12, color: COLORS.gray, fontWeight: '600', marginBottom: 6 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background,
    borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, marginRight: 6, marginBottom: 6,
  },
  chipText: { fontSize: 11, color: COLORS.text, marginLeft: 4 },
  comunasRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  comunasText: {
    fontSize: 12, color: COLORS.gray, marginLeft: 4,
    flex: 1, fontStyle: 'italic',
  },
  donarButton: {
    backgroundColor: COLORS.accent, paddingVertical: 12, borderRadius: 25,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  donarButtonText: {
    color: COLORS.white, fontWeight: 'bold', fontSize: 14, marginLeft: 8,
  },
  footerNote: {
    textAlign: 'center', color: COLORS.gray,
    fontStyle: 'italic', fontSize: 12, marginTop: 10,
  },
  // --- Modal ---
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center', padding: 16,
  },
  modalCard: {
    backgroundColor: COLORS.white, borderRadius: 18, padding: 22,
    width: '100%', maxWidth: 440,
  },
  modalHeader: { alignItems: 'center', marginBottom: 12 },
  modalIconWrap: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.accent,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  modalTitle: { fontSize: 14, color: COLORS.gray, fontWeight: '600', textTransform: 'uppercase' },
  modalOrgName: {
    fontSize: 18, fontWeight: 'bold', color: COLORS.text,
    textAlign: 'center', marginTop: 4,
  },
  bankCard: {
    backgroundColor: COLORS.background, borderRadius: 12, padding: 14, marginTop: 8,
  },
  bankRow: { marginBottom: 10 },
  bankLabel: {
    fontSize: 11, color: COLORS.gray, fontWeight: '700',
    textTransform: 'uppercase', marginBottom: 2,
  },
  bankValueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bankValue: { fontSize: 14, color: COLORS.text, fontWeight: '600', flex: 1 },
  copyBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2 },
  copyText: { color: COLORS.primary, fontSize: 11, fontWeight: '600', marginLeft: 3 },
  tipBox: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#EAF2F7', borderRadius: 10, padding: 10, marginTop: 12,
  },
  tipText: {
    marginLeft: 6, color: COLORS.text, fontSize: 12,
    flex: 1, lineHeight: 17,
  },
  modalActions: { flexDirection: 'row', marginTop: 16 },
  modalBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 25,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 4,
  },
  modalBtnPrimary: { backgroundColor: COLORS.primary },
  modalBtnPrimaryText: { color: COLORS.white, fontWeight: 'bold', fontSize: 14 },
  modalBtnSecondary: {
    backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.primary,
  },
  modalBtnSecondaryText: {
    color: COLORS.primary, fontWeight: 'bold', fontSize: 13, marginLeft: 6,
  },
});

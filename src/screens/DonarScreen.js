import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import RedesSocialesRow from '../components/RedesSocialesRow';

function copyToClipboard(text) {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => {});
    return true;
  }
  return false;
}

// Convierte una row de `organizaciones` con join a `animales(...)` al shape
// camelCase que consume el resto del archivo. Los jsonb (`banco`, `redes`)
// ya vienen como objetos JS desde supabase-js, así que se pasan tal cual.
function mapOrgRow(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    comuna: row.comuna,
    comunasOperacion: row.comunas_operacion ?? [],
    descripcion: row.descripcion,
    telefono: row.telefono,
    horario: row.horario,
    banco: row.banco ?? {},
    redes: row.redes,
    animales: (row.animales ?? []).map((a) => ({
      id: a.id,
      nombre: a.nombre,
      estado: a.estado,
      zona: a.zona,
    })),
  };
}

function formatMonto(value) {
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
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
  const { user } = useAuth();
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orgSeleccionada, setOrgSeleccionada] = useState(null);
  const [montoInput, setMontoInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [donationError, setDonationError] = useState(null);
  const [donationOk, setDonationOk] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error: fetchError } = await supabase
        .from('organizaciones')
        .select('*, animales(id, nombre, estado, zona)')
        .order('created_at', { ascending: true });
      if (!mounted) return;
      if (fetchError) {
        setError(fetchError.message);
      } else {
        setOrgs((data ?? []).map(mapOrgRow));
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const abrirOrg = (org) => {
    setOrgSeleccionada(org);
    setMontoInput('');
    setDonationError(null);
    setDonationOk(false);
  };

  const cerrarModal = () => {
    if (submitting) return;
    setOrgSeleccionada(null);
    setMontoInput('');
    setDonationError(null);
    setDonationOk(false);
  };

  const registrarDonacion = async () => {
    if (!orgSeleccionada || !user) return;
    const monto = parseInt(montoInput.replace(/\D/g, ''), 10);
    if (!monto || monto <= 0) {
      setDonationError('Ingresa un monto válido en pesos.');
      return;
    }
    setSubmitting(true);
    setDonationError(null);
    const { error: insertError } = await supabase.from('donaciones').insert({
      user_id: user.id,
      organizacion_id: orgSeleccionada.id,
      monto,
    });
    setSubmitting(false);
    if (insertError) {
      setDonationError(insertError.message);
      return;
    }
    setDonationOk(true);
    setMontoInput('');
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

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

      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning-outline" size={16} color={COLORS.white} />
          <Text style={styles.errorBannerText}>
            No pudimos cargar las organizaciones: {error}
          </Text>
        </View>
      )}

      {orgs.map((org) => {
        const animales = org.animales;
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
              onPress={() => abrirOrg(org)}
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

      {/* Modal de datos bancarios + registro de aporte */}
      <Modal
        transparent
        visible={!!orgSeleccionada}
        animationType="slide"
        onRequestClose={cerrarModal}
      >
        <View style={styles.modalOverlay}>
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalCard}>
              {orgSeleccionada && (
                <>
                  <View style={styles.modalHeader}>
                    <View style={styles.modalIconWrap}>
                      <Ionicons name="heart" size={26} color={COLORS.white} />
                    </View>
                    <Text style={styles.modalTitle}>Datos para donar</Text>
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

                  <View style={styles.registroBox}>
                    <Text style={styles.registroTitle}>Registra tu aporte</Text>
                    <Text style={styles.registroSubtitle}>
                      Después de la transferencia, registra el monto para que aparezca en tu perfil.
                    </Text>
                    <View style={styles.montoInputWrap}>
                      <Text style={styles.montoPrefix}>$</Text>
                      <TextInput
                        value={montoInput}
                        onChangeText={(t) => setMontoInput(formatMonto(t))}
                        placeholder="0"
                        keyboardType="numeric"
                        style={styles.montoInput}
                        editable={!submitting && !donationOk}
                      />
                      <Text style={styles.montoSuffix}>CLP</Text>
                    </View>
                    {donationError && (
                      <Text style={styles.donationError}>{donationError}</Text>
                    )}
                    {donationOk && (
                      <View style={styles.donationOk}>
                        <Ionicons name="checkmark-circle" size={16} color={COLORS.healthy} />
                        <Text style={styles.donationOkText}>
                          ¡Gracias! Tu aporte quedó registrado.
                        </Text>
                      </View>
                    )}
                    {!donationOk && (
                      <TouchableOpacity
                        style={[
                          styles.registroButton,
                          submitting && styles.buttonDisabled,
                        ]}
                        onPress={registrarDonacion}
                        disabled={submitting}
                      >
                        {submitting ? (
                          <ActivityIndicator color={COLORS.white} />
                        ) : (
                          <>
                            <Ionicons name="checkmark" size={16} color={COLORS.white} />
                            <Text style={styles.registroButtonText}>Confirmar aporte</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
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
                      onPress={cerrarModal}
                    >
                      <Text style={styles.modalBtnPrimaryText}>Cerrar</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
  content: {
    padding: 16,
    paddingBottom: 30,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
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
  errorBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#E63946',
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 8, marginBottom: 14,
  },
  errorBannerText: {
    color: COLORS.white, fontSize: 12, marginLeft: 6, flex: 1,
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
    justifyContent: 'center', alignItems: 'center',
  },
  modalScroll: { width: '100%' },
  modalScrollContent: {
    flexGrow: 1, justifyContent: 'center',
    alignItems: 'center', padding: 16,
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
  registroBox: {
    backgroundColor: COLORS.background, borderRadius: 12,
    padding: 14, marginTop: 12,
  },
  registroTitle: {
    fontSize: 14, fontWeight: 'bold', color: COLORS.text, marginBottom: 4,
  },
  registroSubtitle: {
    fontSize: 12, color: COLORS.gray, marginBottom: 10, lineHeight: 16,
  },
  montoInputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.lightGray,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  montoPrefix: {
    fontSize: 16, color: COLORS.gray, fontWeight: 'bold', marginRight: 6,
  },
  montoInput: {
    flex: 1, fontSize: 16, color: COLORS.text,
    paddingVertical: Platform.OS === 'web' ? 6 : 4,
  },
  montoSuffix: {
    fontSize: 12, color: COLORS.gray, fontWeight: '600', marginLeft: 6,
  },
  donationError: {
    color: '#E63946', fontSize: 12, marginTop: 6,
  },
  donationOk: {
    flexDirection: 'row', alignItems: 'center', marginTop: 10,
  },
  donationOkText: {
    color: COLORS.healthy, fontSize: 13, marginLeft: 6, fontWeight: '600',
  },
  registroButton: {
    backgroundColor: COLORS.primary, paddingVertical: 11,
    borderRadius: 25, marginTop: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  registroButtonText: {
    color: COLORS.white, fontWeight: 'bold', fontSize: 14, marginLeft: 6,
  },
  buttonDisabled: { opacity: 0.6 },
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

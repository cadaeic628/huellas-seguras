import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';
import {
  getOrganizacionById,
  getAnimalesDeOrganizacion,
  getActualizacionesDeOrganizacion,
  getDonacionesDeOrganizacion,
  getDonacionesDeUsuario,
  getReportesDeUsuario,
  getAnimalesApadrinadosPorUsuario,
  getAnimalesAdoptadosPorUsuario,
  getAnimalById,
} from '../data/mockData';
import FichaAnimalModal from '../components/FichaAnimalModal';
import RedesSocialesRow from '../components/RedesSocialesRow';

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
const currencyCLP = (n) =>
  '$' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

const MESES = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

const formatearFecha = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MESES[m - 1]} ${y}`;
};

const iniciales = (nombre) => {
  if (!nombre) return '?';
  const partes = nombre.trim().split(/\s+/).slice(0, 2);
  return partes.map((p) => p[0]?.toUpperCase()).join('') || '?';
};

// ---------------------------------------------------------------------------
// Entry
// ---------------------------------------------------------------------------
export default function PerfilScreen({ navigation }) {
  const { user } = useAuth();
  if (!user) return null;
  return user.role === 'fundacion'
    ? <PerfilFundacion navigation={navigation} />
    : <PerfilNormal />;
}

// ---------------------------------------------------------------------------
// Header común
// ---------------------------------------------------------------------------
function PerfilHeader({ user, badge }) {
  return (
    <View style={styles.headerBox}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{iniciales(user.nombre)}</Text>
      </View>
      <Text style={styles.headerNombre}>{user.nombre}</Text>
      <Text style={styles.headerEmail}>{user.email}</Text>
      {badge && (
        <View style={styles.headerBadge}>
          <Ionicons name={badge.icon} size={12} color={COLORS.white} />
          <Text style={styles.headerBadgeText}>{badge.label}</Text>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Vista usuario normal
// ---------------------------------------------------------------------------
function PerfilNormal() {
  const { user, logout, editarPerfil, eliminarCuenta } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [fichaAnimal, setFichaAnimal] = useState(null);

  const apadrinados = useMemo(
    () => getAnimalesApadrinadosPorUsuario(user.id),
    [user.id]
  );
  const adoptados = useMemo(
    () => getAnimalesAdoptadosPorUsuario(user.id),
    [user.id]
  );
  const reportes = useMemo(() => getReportesDeUsuario(user.id), [user.id]);
  const aportes = useMemo(() => getDonacionesDeUsuario(user.id), [user.id]);
  const totalAportado = aportes.reduce((acc, d) => acc + d.monto, 0);

  const confirmarEliminar = () => {
    Alert.alert(
      'Eliminar cuenta',
      'Esta acción borrará tu cuenta y te cerrará la sesión. ¿Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => eliminarCuenta(),
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <PerfilHeader user={user} badge={{ icon: 'person', label: 'Persona' }} />

      <Section
        title="Animales que apadrinas"
        icon="heart-circle-outline"
        empty={apadrinados.length === 0
          ? 'Todavía no apadrinas a ningún animal. Cuando lo hagas, aparecerán aquí.'
          : null}
      >
        <View style={styles.chipsRow}>
          {apadrinados.map((a) => (
            <AnimalChip key={a.id} animal={a} onPress={() => setFichaAnimal(a)} />
          ))}
        </View>
      </Section>

      <Section
        title="Animales que adoptaste"
        icon="home-outline"
        empty={adoptados.length === 0
          ? 'Cuando completes una adopción, aparecerá aquí.'
          : null}
      >
        <View style={styles.chipsRow}>
          {adoptados.map((a) => (
            <AnimalChip key={a.id} animal={a} onPress={() => setFichaAnimal(a)} />
          ))}
        </View>
      </Section>

      <Section
        title="Animales que reportaste"
        icon="camera-outline"
        empty={reportes.length === 0
          ? 'Aún no has enviado reportes desde el tab "Reportar".'
          : null}
      >
        {reportes.map((r) => (
          <ReporteRow key={r.id} reporte={r} onAbrirAnimal={setFichaAnimal} />
        ))}
      </Section>

      <Section
        title="Historial de aportes"
        icon="cash-outline"
        right={
          aportes.length > 0 ? (
            <Text style={styles.totalText}>
              Total: {currencyCLP(totalAportado)}
            </Text>
          ) : null
        }
        empty={aportes.length === 0
          ? 'Cuando dones a una fundación desde el tab "Donar", quedará registrado aquí.'
          : null}
      >
        {aportes
          .slice()
          .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
          .map((d) => (
            <DonacionRow key={d.id} donacion={d} />
          ))}
      </Section>

      <View style={styles.actionsBox}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnPrimary]}
          onPress={() => setEditOpen(true)}
        >
          <Ionicons name="create-outline" size={18} color={COLORS.white} />
          <Text style={styles.actionBtnPrimaryText}>Editar datos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnSecondary]}
          onPress={logout}
        >
          <Ionicons name="log-out-outline" size={18} color={COLORS.primary} />
          <Text style={styles.actionBtnSecondaryText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnDanger]}
          onPress={confirmarEliminar}
        >
          <Ionicons name="trash-outline" size={18} color={COLORS.urgent} />
          <Text style={styles.actionBtnDangerText}>Eliminar cuenta</Text>
        </TouchableOpacity>
      </View>

      <EditarNombreModal
        visible={editOpen}
        nombreActual={user.nombre}
        onCancel={() => setEditOpen(false)}
        onSave={(nombre) => {
          const res = editarPerfil({ nombre });
          if (!res.ok) {
            Alert.alert('No se pudo guardar', res.error);
            return;
          }
          setEditOpen(false);
        }}
      />

      <FichaAnimalModal
        animal={fichaAnimal}
        visible={!!fichaAnimal}
        onClose={() => setFichaAnimal(null)}
      />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Vista fundación
// ---------------------------------------------------------------------------
function PerfilFundacion({ navigation }) {
  const { user, logout } = useAuth();
  const [editOpen, setEditOpen] = useState(false);

  const org = getOrganizacionById(user.organizacionId);
  const animalesSeguimiento = org ? getAnimalesDeOrganizacion(org.id) : [];
  const posts = org ? getActualizacionesDeOrganizacion(org.id) : [];
  const aportesRecibidos = org ? getDonacionesDeOrganizacion(org.id) : [];
  const totalRecibido = aportesRecibidos.reduce((a, d) => a + d.monto, 0);

  if (!org) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          No encontramos tu organización. Cierra sesión e ingresa de nuevo.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <PerfilHeader user={user} badge={{ icon: 'business', label: 'Fundación' }} />

      <View style={styles.statsRow}>
        <StatBox label="Recibido" value={currencyCLP(totalRecibido)} icon="cash" />
        <StatBox label="Animales" value={animalesSeguimiento.length} icon="paw" />
        <StatBox label="Posts foro" value={posts.length} icon="chatbubble" />
      </View>

      <Section title="Datos públicos" icon="business-outline"
        right={
          <TouchableOpacity onPress={() => setEditOpen(true)} hitSlop={8}>
            <View style={styles.editPill}>
              <Ionicons name="create-outline" size={13} color={COLORS.primary} />
              <Text style={styles.editPillText}>Editar</Text>
            </View>
          </TouchableOpacity>
        }
      >
        <DatoRow icon="location-outline" label="Sede" value={org.comuna} />
        <DatoRow
          icon="map-outline"
          label="Opera en"
          value={(org.comunasOperacion || []).join(', ')}
        />
        <DatoRow icon="call-outline" label="Teléfono" value={org.telefono} />
        <DatoRow icon="time-outline" label="Horario" value={org.horario} />
        <View style={styles.descripcionBox}>
          <Text style={styles.dataLabelInline}>Descripción</Text>
          <Text style={styles.descripcionText}>{org.descripcion}</Text>
        </View>
        {org.redes && (
          <View style={styles.redesBox}>
            <Text style={styles.dataLabelInline}>Redes</Text>
            <RedesSocialesRow redes={org.redes} />
          </View>
        )}
      </Section>

      <Section title="Datos bancarios" icon="card-outline">
        <DatoRow icon="business-outline" label="Banco" value={org.banco.banco} />
        <DatoRow icon="wallet-outline" label="Tipo" value={org.banco.tipoCuenta} />
        <DatoRow icon="card-outline" label="Cuenta" value={org.banco.numero} />
        <DatoRow icon="document-outline" label="RUT" value={org.banco.rut} />
        <DatoRow icon="person-outline" label="Titular" value={org.banco.titular} />
        <DatoRow icon="mail-outline" label="Email" value={org.banco.email} />
      </Section>

      <View style={styles.actionsBox}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnPrimary]}
          onPress={() => navigation?.navigate?.('Foro')}
        >
          <Ionicons name="add-circle-outline" size={18} color={COLORS.white} />
          <Text style={styles.actionBtnPrimaryText}>
            Publicar nueva actualización
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnSecondary]}
          onPress={logout}
        >
          <Ionicons name="log-out-outline" size={18} color={COLORS.primary} />
          <Text style={styles.actionBtnSecondaryText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>

      <EditarOrganizacionModal
        visible={editOpen}
        org={org}
        onCancel={() => setEditOpen(false)}
        onClose={() => setEditOpen(false)}
      />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Subcomponentes reutilizables
// ---------------------------------------------------------------------------
function Section({ title, icon, right, empty, children }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name={icon} size={16} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        {right}
      </View>
      {empty ? <Text style={styles.emptyText}>{empty}</Text> : children}
    </View>
  );
}

function StatBox({ label, value, icon }) {
  return (
    <View style={styles.statBox}>
      <Ionicons name={icon} size={18} color={COLORS.primary} />
      <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function AnimalChip({ animal, onPress }) {
  return (
    <TouchableOpacity style={styles.animalChip} onPress={onPress} activeOpacity={0.85}>
      <Ionicons name="paw" size={12} color={COLORS.primary} />
      <Text style={styles.animalChipText} numberOfLines={1}>
        {animal.nombre} · {animal.zona}
      </Text>
    </TouchableOpacity>
  );
}

function ReporteRow({ reporte, onAbrirAnimal }) {
  const animal = reporte.animalId ? getAnimalById(reporte.animalId) : null;
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name="camera" size={14} color={COLORS.white} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {animal ? animal.nombre : 'Animal nuevo (sin match)'}
        </Text>
        <Text style={styles.rowSubtitle} numberOfLines={2}>
          {reporte.ubicacion}
        </Text>
        <View style={styles.rowMetaRow}>
          <Text style={styles.rowDate}>{formatearFecha(reporte.fecha)}</Text>
          <View style={styles.estadoPill}>
            <Text style={styles.estadoPillText}>{reporte.estado}</Text>
          </View>
        </View>
      </View>
      {animal && (
        <TouchableOpacity
          onPress={() => onAbrirAnimal(animal)}
          style={styles.rowAction}
          hitSlop={8}
        >
          <Ionicons name="chevron-forward" size={18} color={COLORS.gray} />
        </TouchableOpacity>
      )}
    </View>
  );
}

function DonacionRow({ donacion }) {
  const org = getOrganizacionById(donacion.organizacionId);
  return (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: COLORS.accent }]}>
        <Ionicons name="heart" size={14} color={COLORS.white} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {org?.nombre ?? 'Organización'}
        </Text>
        <Text style={styles.rowDate}>{formatearFecha(donacion.fecha)}</Text>
      </View>
      <Text style={styles.rowAmount}>{currencyCLP(donacion.monto)}</Text>
    </View>
  );
}

function DatoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <View style={styles.datoRow}>
      <Ionicons name={icon} size={14} color={COLORS.primary} />
      <Text style={styles.datoLabel}>{label}:</Text>
      <Text style={styles.datoValue}>{value}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Modal: editar nombre (usuario normal)
// ---------------------------------------------------------------------------
function EditarNombreModal({ visible, nombreActual, onCancel, onSave }) {
  const [nombre, setNombre] = useState(nombreActual);

  React.useEffect(() => {
    if (visible) setNombre(nombreActual);
  }, [visible, nombreActual]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Editar datos</Text>
          <Text style={styles.modalHint}>
            El email no se puede modificar porque identifica tu cuenta.
          </Text>
          <Text style={styles.fieldLabel}>Nombre</Text>
          <TextInput
            value={nombre}
            onChangeText={setNombre}
            style={styles.input}
            maxLength={60}
          />
          <ModalActions
            onCancel={onCancel}
            onConfirm={() => onSave(nombre)}
            confirmLabel="Guardar"
            disabled={!nombre.trim()}
          />
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Modal: editar organización (fundación)
// ---------------------------------------------------------------------------
function EditarOrganizacionModal({ visible, org, onCancel, onClose }) {
  const { editarOrganizacion } = useAuth();
  const [descripcion, setDescripcion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [horario, setHorario] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [web, setWeb] = useState('');

  React.useEffect(() => {
    if (!visible) return;
    setDescripcion(org.descripcion || '');
    setTelefono(org.telefono || '');
    setHorario(org.horario || '');
    setInstagram(org.redes?.instagram || '');
    setFacebook(org.redes?.facebook || '');
    setWhatsapp(org.redes?.whatsapp || '');
    setWeb(org.redes?.web || '');
  }, [visible, org]);

  const handleSave = () => {
    if (!descripcion.trim() || !telefono.trim() || !horario.trim()) {
      Alert.alert('Faltan datos', 'Descripción, teléfono y horario son obligatorios.');
      return;
    }
    const redes = {};
    if (instagram.trim()) redes.instagram = instagram.trim();
    if (facebook.trim()) redes.facebook = facebook.trim();
    if (whatsapp.trim()) redes.whatsapp = whatsapp.trim();
    if (web.trim()) redes.web = web.trim();

    const updates = {
      descripcion: descripcion.trim(),
      telefono: telefono.trim(),
      horario: horario.trim(),
      ...(Object.keys(redes).length > 0 ? { redes } : { redes: undefined }),
    };

    const res = editarOrganizacion(updates);
    if (!res.ok) {
      Alert.alert('No se pudo guardar', res.error);
      return;
    }
    onClose();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, styles.modalCardWide]}>
          <ScrollView contentContainerStyle={{ paddingBottom: 8 }}>
            <Text style={styles.modalTitle}>Editar ficha pública</Text>
            <Text style={styles.modalHint}>
              Estos datos aparecen en la tarjeta de Donar y en el Foro. Comuna
              sede, comunas de operación y datos bancarios se editan al migrar
              a la base de datos definitiva.
            </Text>

            <Text style={styles.fieldLabel}>Descripción</Text>
            <TextInput
              value={descripcion}
              onChangeText={setDescripcion}
              style={[styles.input, styles.inputMultiline]}
              multiline
              maxLength={400}
            />

            <Text style={styles.fieldLabel}>Teléfono</Text>
            <TextInput
              value={telefono}
              onChangeText={setTelefono}
              style={styles.input}
              placeholder="+56 9 1234 5678"
            />

            <Text style={styles.fieldLabel}>Horario</Text>
            <TextInput
              value={horario}
              onChangeText={setHorario}
              style={styles.input}
              placeholder="Lun a Vie 10:00 - 18:00"
            />

            <Text style={styles.modalSectionTitle}>Redes sociales</Text>
            <Text style={styles.fieldLabel}>Instagram (handle)</Text>
            <TextInput
              value={instagram}
              onChangeText={setInstagram}
              style={styles.input}
              placeholder="@mifundacion"
              autoCapitalize="none"
            />
            <Text style={styles.fieldLabel}>Facebook</Text>
            <TextInput
              value={facebook}
              onChangeText={setFacebook}
              style={styles.input}
              placeholder="MiFundacionCL"
              autoCapitalize="none"
            />
            <Text style={styles.fieldLabel}>WhatsApp</Text>
            <TextInput
              value={whatsapp}
              onChangeText={setWhatsapp}
              style={styles.input}
              placeholder="+56912345678"
              keyboardType="phone-pad"
            />
            <Text style={styles.fieldLabel}>Sitio web</Text>
            <TextInput
              value={web}
              onChangeText={setWeb}
              style={styles.input}
              placeholder="https://mifundacion.cl"
              autoCapitalize="none"
            />
          </ScrollView>

          <ModalActions
            onCancel={onCancel}
            onConfirm={handleSave}
            confirmLabel="Guardar"
          />
        </View>
      </View>
    </Modal>
  );
}

function ModalActions({ onCancel, onConfirm, confirmLabel, disabled }) {
  return (
    <View style={styles.modalActions}>
      <TouchableOpacity
        style={[styles.modalBtn, styles.modalBtnSecondary]}
        onPress={onCancel}
      >
        <Text style={styles.modalBtnSecondaryText}>Cancelar</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.modalBtn,
          styles.modalBtnPrimary,
          disabled && styles.modalBtnDisabled,
        ]}
        onPress={onConfirm}
        disabled={disabled}
      >
        <Text style={styles.modalBtnPrimaryText}>{confirmLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Estilos
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 40 },

  // Header
  headerBox: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 8,
  },
  avatarText: { color: COLORS.white, fontWeight: 'bold', fontSize: 26 },
  headerNombre: {
    fontSize: 17, fontWeight: 'bold', color: COLORS.text, textAlign: 'center',
  },
  headerEmail: { color: COLORS.gray, fontSize: 12, marginTop: 2 },
  headerBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 10, marginTop: 8,
  },
  headerBadgeText: {
    color: COLORS.white, fontSize: 11, fontWeight: '700',
    marginLeft: 4, textTransform: 'uppercase',
  },

  // Stats (fundación)
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: {
    fontSize: 14, fontWeight: 'bold', color: COLORS.primary, marginTop: 4,
  },
  statLabel: { fontSize: 11, color: COLORS.gray, fontWeight: '600', marginTop: 2 },

  // Section
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 10,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: {
    fontSize: 14, fontWeight: 'bold', color: COLORS.text, marginLeft: 6,
  },
  totalText: {
    color: COLORS.primary, fontWeight: 'bold', fontSize: 13,
  },
  emptyText: {
    color: COLORS.gray, fontStyle: 'italic', fontSize: 12, lineHeight: 17,
  },

  editPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12,
  },
  editPillText: {
    color: COLORS.primary, fontWeight: '700', fontSize: 11, marginLeft: 4,
  },

  // Chips de animales
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  animalChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5,
    marginRight: 6, marginBottom: 6, maxWidth: '100%',
  },
  animalChipText: {
    fontSize: 11, color: COLORS.text, marginLeft: 4, fontWeight: '600',
  },

  // Filas (reportes, donaciones)
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: COLORS.lightGray,
  },
  rowIcon: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  rowTitle: { fontSize: 13, fontWeight: 'bold', color: COLORS.text },
  rowSubtitle: { fontSize: 12, color: COLORS.text, marginTop: 1 },
  rowMetaRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: 3,
  },
  rowDate: { fontSize: 11, color: COLORS.gray, marginRight: 8 },
  estadoPill: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8,
  },
  estadoPillText: {
    fontSize: 10, color: COLORS.primary, fontWeight: '700',
    textTransform: 'uppercase',
  },
  rowAction: { paddingLeft: 6 },
  rowAmount: {
    fontSize: 14, fontWeight: 'bold', color: COLORS.primary, marginLeft: 8,
  },

  // Datos fundación
  datoRow: {
    flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6,
  },
  datoLabel: {
    fontSize: 12, color: COLORS.gray, fontWeight: '700',
    marginLeft: 6, marginRight: 6,
  },
  datoValue: { fontSize: 12, color: COLORS.text, flex: 1 },
  dataLabelInline: {
    fontSize: 11, color: COLORS.gray, fontWeight: '700',
    textTransform: 'uppercase', marginBottom: 4,
  },
  descripcionBox: { marginTop: 6 },
  descripcionText: { fontSize: 12, color: COLORS.text, lineHeight: 17 },
  redesBox: { marginTop: 10 },

  // Acciones
  actionsBox: { marginTop: 4 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 25, marginBottom: 10,
  },
  actionBtnPrimary: { backgroundColor: COLORS.primary },
  actionBtnPrimaryText: {
    color: COLORS.white, fontWeight: 'bold', fontSize: 14, marginLeft: 8,
  },
  actionBtnSecondary: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5, borderColor: COLORS.primary,
  },
  actionBtnSecondaryText: {
    color: COLORS.primary, fontWeight: 'bold', fontSize: 14, marginLeft: 8,
  },
  actionBtnDanger: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5, borderColor: COLORS.urgent,
  },
  actionBtnDangerText: {
    color: COLORS.urgent, fontWeight: 'bold', fontSize: 14, marginLeft: 8,
  },

  errorText: {
    color: COLORS.urgent, fontSize: 13, textAlign: 'center', padding: 24,
  },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center', padding: 16,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18, padding: 18,
    width: '100%', maxWidth: 440,
  },
  modalCardWide: { maxHeight: '90%' },
  modalTitle: {
    fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 4,
  },
  modalHint: {
    fontSize: 12, color: COLORS.gray, marginBottom: 10, lineHeight: 17,
  },
  modalSectionTitle: {
    fontSize: 12, fontWeight: '700', color: COLORS.text,
    marginTop: 14, marginBottom: 2,
  },
  fieldLabel: {
    fontSize: 11, color: COLORS.gray, fontWeight: '700',
    textTransform: 'uppercase', marginTop: 8, marginBottom: 4,
  },
  input: {
    borderWidth: 1, borderColor: COLORS.lightGray,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8,
    fontSize: 13, color: COLORS.text, backgroundColor: COLORS.white,
  },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },

  modalActions: {
    flexDirection: 'row', marginTop: 14,
    borderTopWidth: 1, borderTopColor: COLORS.lightGray, paddingTop: 12,
  },
  modalBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 25,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 4,
  },
  modalBtnPrimary: { backgroundColor: COLORS.primary },
  modalBtnPrimaryText: {
    color: COLORS.white, fontWeight: 'bold', fontSize: 14,
  },
  modalBtnSecondary: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5, borderColor: COLORS.primary,
  },
  modalBtnSecondaryText: {
    color: COLORS.primary, fontWeight: 'bold', fontSize: 13,
  },
  modalBtnDisabled: { backgroundColor: COLORS.gray, opacity: 0.6 },
});

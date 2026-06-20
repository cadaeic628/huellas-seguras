import React, { forwardRef, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';
import { COMUNAS_SANTIAGO } from '../constants/santiago';
import OptionsPickerModal from '../components/OptionsPickerModal';
import {
  isValidEmail,
  passwordChecks,
  isPasswordStrong,
  formatRut,
  isValidRut,
  formatPhoneDigits,
  formatPhoneDisplay,
  isValidPhone,
  formatTime,
  isValidTime,
} from '../utils/validation';

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export default function AuthScreen() {
  const { login, signupNormal, signupFundacion } = useAuth();
  const [mode, setMode] = useState('login');

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.root}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brand}>
          <Image
            source={require('../../assets/logo-full.png')}
            style={styles.brandLogo}
            resizeMode="contain"
          />
          <Text style={styles.brandSubtitle}>
            Rescata, apadrina, dona. Únete a la red de cuidado.
          </Text>
        </View>

        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tab, mode === 'login' && styles.tabActive]}
            onPress={() => setMode('login')}
            activeOpacity={0.85}
          >
            <Text
              style={[styles.tabText, mode === 'login' && styles.tabTextActive]}
            >
              Iniciar sesión
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, mode === 'signup' && styles.tabActive]}
            onPress={() => setMode('signup')}
            activeOpacity={0.85}
          >
            <Text
              style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}
            >
              Crear cuenta
            </Text>
          </TouchableOpacity>
        </View>

        {mode === 'login' ? (
          <LoginForm onSubmit={login} />
        ) : (
          <SignupForm
            onSignupNormal={signupNormal}
            onSignupFundacion={signupFundacion}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------
function LoginForm({ onSubmit }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(null);
  const passwordRef = useRef(null);

  const emailFormatError =
    email.trim().length > 0 && !isValidEmail(email)
      ? 'El formato del email no es válido.'
      : null;

  const canSubmit = isValidEmail(email) && password.length > 0;

  const [submitting, setSubmitting] = useState(false);

  const handle = async () => {
    setAuthError(null);
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    const res = await onSubmit(email, password);
    setSubmitting(false);
    if (!res.ok) setAuthError(res.error || 'No se pudo iniciar sesión.');
  };

  return (
    <View style={styles.card}>
      {authError && <ErrorBanner message={authError} />}

      <Field
        label="Email"
        value={email}
        onChangeText={(t) => {
          setEmail(t);
          setAuthError(null);
        }}
        placeholder="tu@email.cl"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => passwordRef.current?.focus()}
        error={emailFormatError}
      />
      <PasswordField
        ref={passwordRef}
        label="Contraseña"
        value={password}
        onChangeText={(t) => {
          setPassword(t);
          setAuthError(null);
        }}
        returnKeyType="go"
        onSubmitEditing={handle}
      />

      <PrimaryButton
        onPress={handle}
        disabled={!canSubmit || submitting}
        icon="log-in-outline"
        label={submitting ? 'Entrando...' : 'Entrar'}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Signup
// ---------------------------------------------------------------------------
function SignupForm({ onSignupNormal, onSignupFundacion }) {
  const [role, setRole] = useState('normal');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [authError, setAuthError] = useState(null);

  // Fundación
  const [comuna, setComuna] = useState('');
  const [comunasOperacion, setComunasOperacion] = useState([]);
  const [descripcion, setDescripcion] = useState('');
  const [telefonoDigits, setTelefonoDigits] = useState('');
  const [dayFrom, setDayFrom] = useState('');
  const [dayTo, setDayTo] = useState('');
  const [timeFrom, setTimeFrom] = useState('');
  const [timeTo, setTimeTo] = useState('');
  const [bancoNombre, setBancoNombre] = useState('');
  const [bancoTipo, setBancoTipo] = useState('');
  const [bancoNumero, setBancoNumero] = useState('');
  const [bancoRut, setBancoRut] = useState('');

  // Picker state
  const [picker, setPicker] = useState(null); // 'comuna' | 'comunasOp' | 'dayFrom' | 'dayTo'

  // --- Errores inline (solo se muestran si el campo tiene contenido) ---
  const emailFormatError =
    email.trim().length > 0 && !isValidEmail(email)
      ? 'El formato del email no es válido.'
      : null;

  const checks = passwordChecks(password);
  const passwordStrong = isPasswordStrong(password);

  const telefonoError =
    telefonoDigits.length > 0 && !isValidPhone(telefonoDigits)
      ? 'Teléfono inválido. Debe tener 9 dígitos y empezar con 9.'
      : null;
  const rutError =
    bancoRut.length > 0 && !isValidRut(bancoRut)
      ? 'RUT inválido. Verifica el número y el dígito verificador.'
      : null;
  const timeFromError =
    timeFrom.length > 0 && !isValidTime(timeFrom)
      ? 'Hora inválida (formato HH:MM, 00:00 a 23:59).'
      : null;
  const timeToError =
    timeTo.length > 0 && !isValidTime(timeTo)
      ? 'Hora inválida (formato HH:MM, 00:00 a 23:59).'
      : null;

  // --- Habilitación del botón ---
  const baseOk =
    isValidEmail(email) && passwordStrong && nombre.trim().length > 0;

  const fundacionOk =
    !!comuna &&
    comunasOperacion.length > 0 &&
    descripcion.trim().length > 0 &&
    isValidPhone(telefonoDigits) &&
    !!dayFrom &&
    !!dayTo &&
    isValidTime(timeFrom) &&
    isValidTime(timeTo) &&
    bancoNombre.trim().length > 0 &&
    bancoTipo.trim().length > 0 &&
    bancoNumero.trim().length > 0 &&
    isValidRut(bancoRut);

  const canSubmit = role === 'normal' ? baseOk : baseOk && fundacionOk;

  const [submitting, setSubmitting] = useState(false);

  const handle = async () => {
    setAuthError(null);
    if (!canSubmit || submitting) return;
    setSubmitting(true);

    if (role === 'normal') {
      const res = await onSignupNormal({ email, password, nombre });
      setSubmitting(false);
      if (!res.ok) setAuthError(res.error);
      return;
    }

    const horario = `${dayFrom} a ${dayTo} ${timeFrom} - ${timeTo}`;
    const telefono = `+56 ${formatPhoneDisplay(telefonoDigits)}`;

    const res = await onSignupFundacion({
      email,
      password,
      nombre,
      comuna,
      descripcion,
      comunasOperacion,
      telefono,
      horario,
      banco: {
        banco: bancoNombre.trim(),
        tipoCuenta: bancoTipo.trim(),
        numero: bancoNumero.trim(),
        rut: bancoRut,
        titular: nombre.trim(),
        email: email.trim(),
      },
    });
    setSubmitting(false);
    if (!res.ok) setAuthError(res.error);
  };

  return (
    <View style={styles.card}>
      {authError && <ErrorBanner message={authError} />}

      <Text style={styles.fieldLabel}>Tipo de cuenta</Text>
      <View style={styles.roleRow}>
        <RoleChip
          active={role === 'normal'}
          onPress={() => setRole('normal')}
          icon="person-outline"
          label="Persona"
        />
        <RoleChip
          active={role === 'fundacion'}
          onPress={() => setRole('fundacion')}
          icon="business-outline"
          label="Fundación"
        />
      </View>

      <Field
        label={role === 'fundacion' ? 'Nombre de la fundación' : 'Nombre completo'}
        value={nombre}
        onChangeText={setNombre}
      />
      <Field
        label="Email"
        value={email}
        onChangeText={(t) => {
          setEmail(t);
          setAuthError(null);
        }}
        placeholder="tu@email.cl"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        error={emailFormatError}
      />

      <PasswordField
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
      />
      <PasswordRequirements checks={checks} />

      {role === 'fundacion' && (
        <>
          <Text style={styles.sectionTitle}>Datos de la fundación</Text>

          <DropdownTrigger
            label="Comuna sede"
            value={comuna}
            placeholder="Selecciona una comuna"
            onPress={() => setPicker('comuna')}
          />

          <Text style={styles.fieldLabel}>Comunas de operación</Text>
          {comunasOperacion.length > 0 && (
            <View style={styles.chipsRow}>
              {comunasOperacion.map((c) => (
                <View key={c} style={styles.chip}>
                  <Text style={styles.chipText}>{c}</Text>
                  <TouchableOpacity
                    onPress={() =>
                      setComunasOperacion((prev) => prev.filter((x) => x !== c))
                    }
                    hitSlop={8}
                  >
                    <Ionicons name="close-circle" size={14} color={COLORS.gray} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setPicker('comunasOp')}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle-outline" size={16} color={COLORS.primary} />
            <Text style={[styles.dropdownText, { color: COLORS.primary, marginLeft: 6 }]}>
              {comunasOperacion.length === 0
                ? 'Agregar comunas'
                : 'Modificar selección'}
            </Text>
          </TouchableOpacity>

          <Field
            label="Descripción"
            value={descripcion}
            onChangeText={setDescripcion}
            multiline
            placeholder="Misión, animales que atiende..."
          />

          <Text style={styles.fieldLabel}>Teléfono</Text>
          <View style={styles.phoneRow}>
            <View style={styles.phonePrefix}>
              <Text style={styles.phonePrefixText}>+56</Text>
            </View>
            <TextInput
              value={formatPhoneDisplay(telefonoDigits)}
              onChangeText={(t) => setTelefonoDigits(formatPhoneDigits(t))}
              style={[styles.input, { flex: 1 }]}
              keyboardType="phone-pad"
              placeholder="9 1234 5678"
              placeholderTextColor={COLORS.gray}
              maxLength={12}
            />
          </View>
          {telefonoError && <Text style={styles.fieldError}>{telefonoError}</Text>}

          <Text style={styles.fieldLabel}>Horario de atención</Text>
          <View style={styles.horarioRow}>
            <View style={styles.horarioCol}>
              <DropdownTrigger
                value={dayFrom}
                placeholder="Día"
                onPress={() => setPicker('dayFrom')}
                compact
              />
            </View>
            <Text style={styles.horarioSeparator}>a</Text>
            <View style={styles.horarioCol}>
              <DropdownTrigger
                value={dayTo}
                placeholder="Día"
                onPress={() => setPicker('dayTo')}
                compact
              />
            </View>
          </View>
          <View style={styles.horarioRow}>
            <View style={styles.horarioCol}>
              <TextInput
                value={timeFrom}
                onChangeText={(t) => setTimeFrom(formatTime(t))}
                style={[
                  styles.input,
                  styles.timeInput,
                  timeFromError && styles.inputError,
                ]}
                keyboardType="numeric"
                placeholder="HH:MM"
                placeholderTextColor={COLORS.gray}
                maxLength={5}
              />
            </View>
            <Text style={styles.horarioSeparator}>—</Text>
            <View style={styles.horarioCol}>
              <TextInput
                value={timeTo}
                onChangeText={(t) => setTimeTo(formatTime(t))}
                style={[
                  styles.input,
                  styles.timeInput,
                  timeToError && styles.inputError,
                ]}
                keyboardType="numeric"
                placeholder="HH:MM"
                placeholderTextColor={COLORS.gray}
                maxLength={5}
              />
            </View>
          </View>
          {(timeFromError || timeToError) && (
            <Text style={styles.fieldError}>
              {timeFromError || timeToError}
            </Text>
          )}

          <Text style={styles.sectionTitle}>Datos bancarios</Text>
          <Field label="Banco" value={bancoNombre} onChangeText={setBancoNombre} />
          <Field
            label="Tipo de cuenta"
            value={bancoTipo}
            onChangeText={setBancoTipo}
            placeholder="Cuenta Corriente"
          />
          <Field
            label="Número de cuenta"
            value={bancoNumero}
            onChangeText={setBancoNumero}
            keyboardType="default"
          />
          <Field
            label="RUT de la fundación"
            value={bancoRut}
            onChangeText={(t) => setBancoRut(formatRut(t))}
            placeholder="76.123.456-7"
            autoCapitalize="characters"
            error={rutError}
            maxLength={12}
          />
        </>
      )}

      <PrimaryButton
        onPress={handle}
        disabled={!canSubmit || submitting}
        icon="checkmark-circle-outline"
        label={submitting ? 'Creando cuenta...' : 'Crear cuenta'}
      />

      <OptionsPickerModal
        visible={picker === 'comuna'}
        title="Comuna sede"
        options={COMUNAS_SANTIAGO}
        value={comuna}
        searchable
        onCancel={() => setPicker(null)}
        onConfirm={(v) => {
          setComuna(v);
          setPicker(null);
        }}
      />
      <OptionsPickerModal
        visible={picker === 'comunasOp'}
        title="Comunas de operación"
        options={COMUNAS_SANTIAGO}
        value={comunasOperacion}
        multiSelect
        searchable
        onCancel={() => setPicker(null)}
        onConfirm={(v) => {
          setComunasOperacion(v);
          setPicker(null);
        }}
      />
      <OptionsPickerModal
        visible={picker === 'dayFrom'}
        title="Día desde"
        options={DIAS}
        value={dayFrom}
        onCancel={() => setPicker(null)}
        onConfirm={(v) => {
          setDayFrom(v);
          setPicker(null);
        }}
      />
      <OptionsPickerModal
        visible={picker === 'dayTo'}
        title="Día hasta"
        options={DIAS}
        value={dayTo}
        onCancel={() => setPicker(null)}
        onConfirm={(v) => {
          setDayTo(v);
          setPicker(null);
        }}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Subcomponentes UI
// ---------------------------------------------------------------------------
function PasswordRequirements({ checks }) {
  return (
    <View style={styles.requirementsBox}>
      <Text style={styles.requirementsTitle}>Tu contraseña debe tener:</Text>
      {checks.map((c) => (
        <View key={c.id} style={styles.requirementRow}>
          <Ionicons
            name={c.ok ? 'checkmark-circle' : 'ellipse-outline'}
            size={14}
            color={c.ok ? COLORS.healthy : COLORS.gray}
          />
          <Text
            style={[
              styles.requirementText,
              c.ok && { color: COLORS.healthy, fontWeight: '600' },
            ]}
          >
            {c.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function ErrorBanner({ message }) {
  return (
    <View style={styles.errorBanner}>
      <Ionicons name="alert-circle" size={18} color={COLORS.urgent} />
      <Text style={styles.errorBannerText}>{message}</Text>
    </View>
  );
}

function RoleChip({ active, onPress, icon, label }) {
  return (
    <TouchableOpacity
      style={[styles.roleChip, active && styles.roleChipActive]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Ionicons
        name={icon}
        size={20}
        color={active ? COLORS.white : COLORS.primary}
      />
      <Text style={[styles.roleChipText, active && { color: COLORS.white }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const Field = forwardRef(function Field(
  { label, multiline, error, ...rest },
  ref
) {
  return (
    <>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        ref={ref}
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          error && styles.inputError,
        ]}
        multiline={multiline}
        placeholderTextColor={COLORS.gray}
        {...rest}
      />
      {!!error && <Text style={styles.fieldError}>{error}</Text>}
    </>
  );
});

// Input de contraseña con perrito ilustrado a la derecha que alterna entre
// "mirando" (ojos abiertos) y "tapándose los ojos" para indicar la
// visibilidad. Reusa el mismo `styles.input` que `Field`, sumando padding
// derecho para que el texto no se solape con la imagen. Forward ref para
// que el login pueda enfocarlo desde el campo de email.
const PasswordField = forwardRef(function PasswordField(
  { label, error, ...rest },
  ref
) {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.passwordWrapper}>
        <TextInput
          ref={ref}
          style={[
            styles.input,
            styles.passwordInput,
            error && styles.inputError,
          ]}
          secureTextEntry={!visible}
          placeholderTextColor={COLORS.gray}
          {...rest}
        />
        <TouchableOpacity
          style={styles.passwordToggle}
          onPress={() => setVisible((v) => !v)}
          hitSlop={8}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          <Image
            source={
              visible
                ? require('../../assets/dog-hide.png')
                : require('../../assets/dog-peek.png')
            }
            style={styles.passwordDog}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
      {!!error && <Text style={styles.fieldError}>{error}</Text>}
    </>
  );
});

function DropdownTrigger({ label, value, placeholder, onPress, compact }) {
  return (
    <>
      {!!label && <Text style={styles.fieldLabel}>{label}</Text>}
      <TouchableOpacity
        style={[styles.dropdown, compact && styles.dropdownCompact]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <Text
          style={[
            styles.dropdownText,
            !value && { color: COLORS.gray },
          ]}
        >
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={COLORS.gray} />
      </TouchableOpacity>
    </>
  );
}

function PrimaryButton({ onPress, disabled, icon, label }) {
  return (
    <TouchableOpacity
      style={[styles.primaryBtn, disabled && styles.primaryBtnDisabled]}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={disabled}
    >
      <Ionicons name={icon} size={18} color={COLORS.white} />
      <Text style={styles.primaryBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.primary },
  scroll: {
    padding: 18,
    paddingBottom: 40,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },

  brand: { alignItems: 'center', marginTop: 24, marginBottom: 18 },
  brandLogo: {
    width: 220,
    height: 264,
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 13,
    color: COLORS.white,
    opacity: 0.92,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  tabsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: '700', color: COLORS.gray },
  tabTextActive: { color: COLORS.white },

  card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 16 },

  fieldLabel: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 10,
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
  inputMultiline: { minHeight: 70, textAlignVertical: 'top' },
  inputError: { borderColor: COLORS.urgent },
  passwordWrapper: { position: 'relative', justifyContent: 'center' },
  // El PNG del perrito tiene padding interno (la silueta ocupa ~70% del
  // canvas), por eso el ancho visual real es menor que el del touchable.
  passwordInput: { paddingRight: 48 },
  passwordToggle: {
    position: 'absolute',
    right: 4,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  passwordDog: { width: 34, height: 34 },
  fieldError: {
    fontSize: 11,
    color: COLORS.urgent,
    marginTop: 4,
    fontWeight: '600',
  },

  roleRow: { flexDirection: 'row', marginTop: 4 },
  roleChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginRight: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  roleChipActive: { backgroundColor: COLORS.primary },
  roleChipText: {
    color: COLORS.primary,
    fontWeight: '700',
    marginLeft: 6,
    fontSize: 13,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 18,
    marginBottom: 2,
  },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 25,
    paddingVertical: 14,
    marginTop: 18,
  },
  primaryBtnDisabled: { backgroundColor: COLORS.gray, opacity: 0.6 },
  primaryBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 6,
  },

  // Password requirements
  requirementsBox: {
    marginTop: 8,
    padding: 10,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  requirementsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.gray,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  requirementRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  requirementText: { fontSize: 12, color: COLORS.gray, marginLeft: 6 },

  // Error banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FDECEE',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.urgent,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  errorBannerText: {
    fontSize: 12,
    color: COLORS.urgent,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },

  // Dropdown trigger
  dropdown: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
  },
  dropdownCompact: { paddingVertical: 8 },
  dropdownText: { fontSize: 13, color: COLORS.text },

  // Chips (comunas operación seleccionadas)
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 6,
    marginBottom: 6,
  },
  chipText: { fontSize: 12, color: COLORS.text, marginRight: 6 },

  // Phone
  phoneRow: { flexDirection: 'row', alignItems: 'stretch' },
  phonePrefix: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: COLORS.lightGray,
  },
  phonePrefixText: { fontSize: 13, fontWeight: '700', color: COLORS.text },

  // Horario rows
  horarioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  horarioCol: { flex: 1 },
  horarioSeparator: {
    paddingHorizontal: 8,
    color: COLORS.gray,
    fontWeight: '700',
  },
  timeInput: { textAlign: 'center' },
});

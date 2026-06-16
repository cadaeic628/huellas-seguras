import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';

export default function AuthScreen() {
  const { login, signupNormal, signupFundacion } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.root}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <View style={styles.logoCircle}>
            <Ionicons name="paw" size={36} color={COLORS.white} />
          </View>
          <Text style={styles.brandTitle}>Huellas Seguras</Text>
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
            <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>
              Iniciar sesión
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, mode === 'signup' && styles.tabActive]}
            onPress={() => setMode('signup')}
            activeOpacity={0.85}
          >
            <Text style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}>
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

function LoginForm({ onSubmit }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handle = () => {
    if (!email.trim() || !password) {
      Alert.alert('Faltan datos', 'Ingresa email y contraseña.');
      return;
    }
    const res = onSubmit(email, password);
    if (!res.ok) Alert.alert('No se pudo ingresar', res.error);
  };

  return (
    <View style={styles.card}>
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <Field
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.primaryBtn} onPress={handle} activeOpacity={0.85}>
        <Ionicons name="log-in-outline" size={18} color={COLORS.white} />
        <Text style={styles.primaryBtnText}>Entrar</Text>
      </TouchableOpacity>

      <View style={styles.demoBox}>
        <Text style={styles.demoTitle}>Cuentas de prueba</Text>
        <Text style={styles.demoLine}>· maria@example.com / demo123 (usuaria)</Text>
        <Text style={styles.demoLine}>· refugio@example.com / demo123 (fundación)</Text>
        <Text style={styles.demoLine}>· huellitas@example.com / demo123 (fundación)</Text>
      </View>
    </View>
  );
}

function SignupForm({ onSignupNormal, onSignupFundacion }) {
  const [role, setRole] = useState('normal');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');

  // Solo para fundación
  const [comuna, setComuna] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [comunasOpStr, setComunasOpStr] = useState('');
  const [telefono, setTelefono] = useState('');
  const [horario, setHorario] = useState('');
  const [bancoNombre, setBancoNombre] = useState('');
  const [bancoTipo, setBancoTipo] = useState('');
  const [bancoNumero, setBancoNumero] = useState('');
  const [bancoRut, setBancoRut] = useState('');

  const handle = () => {
    if (!email.trim() || !password || !nombre.trim()) {
      Alert.alert('Faltan datos', 'Email, contraseña y nombre son obligatorios.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Contraseña muy corta', 'Debe tener al menos 6 caracteres.');
      return;
    }
    if (role === 'normal') {
      const res = onSignupNormal({ email, password, nombre });
      if (!res.ok) Alert.alert('No se pudo registrar', res.error);
      return;
    }
    if (!comuna.trim() || !descripcion.trim()) {
      Alert.alert('Faltan datos', 'La comuna y la descripción de la fundación son obligatorias.');
      return;
    }
    const comunasOperacion = comunasOpStr
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    if (comunasOperacion.length === 0) comunasOperacion.push(comuna.trim());

    const res = onSignupFundacion({
      email,
      password,
      nombre,
      comuna,
      descripcion,
      comunasOperacion,
      telefono,
      horario,
      banco: {
        banco: bancoNombre.trim() || '—',
        tipoCuenta: bancoTipo.trim() || '—',
        numero: bancoNumero.trim() || '—',
        rut: bancoRut.trim() || '—',
        titular: nombre.trim(),
        email: email.trim(),
      },
    });
    if (!res.ok) Alert.alert('No se pudo registrar', res.error);
  };

  return (
    <View style={styles.card}>
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
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <Field
        label="Contraseña (mínimo 6 caracteres)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {role === 'fundacion' && (
        <>
          <Field label="Comuna sede" value={comuna} onChangeText={setComuna} />
          <Field
            label="Comunas de operación (separadas por coma)"
            value={comunasOpStr}
            onChangeText={setComunasOpStr}
            placeholder="Ñuñoa, Providencia, Macul"
          />
          <Field
            label="Descripción"
            value={descripcion}
            onChangeText={setDescripcion}
            multiline
            placeholder="Misión de la fundación, animales que atiende..."
          />
          <Field
            label="Teléfono"
            value={telefono}
            onChangeText={setTelefono}
            keyboardType="phone-pad"
            placeholder="+56 9 ..."
          />
          <Field
            label="Horario"
            value={horario}
            onChangeText={setHorario}
            placeholder="Lun a Vie 10:00 - 18:00"
          />

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
          />
          <Field
            label="RUT"
            value={bancoRut}
            onChangeText={setBancoRut}
            placeholder="76.123.456-7"
          />
        </>
      )}

      <TouchableOpacity style={styles.primaryBtn} onPress={handle} activeOpacity={0.85}>
        <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.white} />
        <Text style={styles.primaryBtnText}>Crear cuenta</Text>
      </TouchableOpacity>
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

function Field({ label, multiline, ...rest }) {
  return (
    <>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        multiline={multiline}
        placeholderTextColor={COLORS.gray}
        {...rest}
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 18, paddingBottom: 40 },

  brand: { alignItems: 'center', marginTop: 24, marginBottom: 18 },
  logoCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 12,
  },
  brandSubtitle: {
    fontSize: 13,
    color: COLORS.gray,
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

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
  },

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
    marginTop: 14,
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
  primaryBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 6,
  },

  demoBox: {
    marginTop: 16,
    padding: 10,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  demoTitle: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  demoLine: { fontSize: 12, color: COLORS.text, marginBottom: 2 },
});

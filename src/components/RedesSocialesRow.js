import React from 'react';
import { View, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

// Construye la URL pública para cada red social a partir del handle/número
// crudo guardado en mockData. Devuelve null si el valor no es utilizable.
function buildUrl(tipo, valor) {
  if (!valor) return null;
  const v = String(valor).trim();
  if (!v) return null;

  switch (tipo) {
    case 'instagram':
      return `https://instagram.com/${v.replace(/^@/, '')}`;
    case 'facebook':
      // Acepta tanto un slug ("RefugioEsperanzaCL") como una URL completa.
      if (/^https?:\/\//i.test(v)) return v;
      return `https://facebook.com/${v.replace(/^@/, '')}`;
    case 'whatsapp':
      // wa.me requiere solo dígitos (con código de país).
      return `https://wa.me/${v.replace(/\D/g, '')}`;
    case 'web':
      return /^https?:\/\//i.test(v) ? v : `https://${v}`;
    default:
      return null;
  }
}

const ICONOS = [
  { tipo: 'instagram', icono: 'logo-instagram', color: '#E4405F' },
  { tipo: 'facebook', icono: 'logo-facebook', color: '#1877F2' },
  { tipo: 'whatsapp', icono: 'logo-whatsapp', color: '#25D366' },
  { tipo: 'web', icono: 'globe-outline', color: COLORS.secondary },
];

export default function RedesSocialesRow({ redes, size = 22, style }) {
  if (!redes) return null;

  const items = ICONOS
    .map((c) => ({ ...c, url: buildUrl(c.tipo, redes[c.tipo]) }))
    .filter((c) => c.url);

  if (items.length === 0) return null;

  const handlePress = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('No se puede abrir el enlace', url);
      }
    } catch {
      Alert.alert('No se puede abrir el enlace', url);
    }
  };

  return (
    <View style={[styles.row, style]}>
      {items.map((it) => (
        <TouchableOpacity
          key={it.tipo}
          style={[styles.iconBtn, { borderColor: it.color }]}
          onPress={() => handlePress(it.url)}
          accessibilityLabel={`Abrir ${it.tipo}`}
        >
          <Ionicons name={it.icono} size={size} color={it.color} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, marginRight: 8, marginBottom: 4,
    backgroundColor: COLORS.white,
  },
});

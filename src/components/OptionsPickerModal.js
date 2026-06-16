import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

// Modal genérico de selección desde una lista. Soporta single y multi-select.
// `value` es string en single y string[] en multi. En single se confirma
// directo al tocar una opción; en multi hay botón "Confirmar".
export default function OptionsPickerModal({
  visible,
  title,
  multiSelect = false,
  value,
  options,
  searchable = false,
  onCancel,
  onConfirm,
}) {
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState(multiSelect ? value || [] : value);

  useEffect(() => {
    if (visible) {
      setDraft(multiSelect ? value || [] : value);
      setSearch('');
    }
  }, [visible, value, multiSelect]);

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase())
  );

  const isSelected = (opt) =>
    multiSelect ? (draft || []).includes(opt) : draft === opt;

  const toggle = (opt) => {
    if (multiSelect) {
      setDraft((prev) => {
        const list = prev || [];
        return list.includes(opt) ? list.filter((x) => x !== opt) : [...list, opt];
      });
    } else {
      onConfirm(opt);
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onCancel} hitSlop={10}>
              <Ionicons name="close" size={22} color={COLORS.gray} />
            </TouchableOpacity>
          </View>

          {searchable && (
            <View style={styles.searchRow}>
              <Ionicons name="search" size={14} color={COLORS.gray} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar..."
                placeholderTextColor={COLORS.gray}
                style={styles.search}
              />
            </View>
          )}

          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            {filtered.length === 0 && (
              <Text style={styles.emptyText}>Sin resultados.</Text>
            )}
            {filtered.map((opt) => {
              const active = isSelected(opt);
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.row, active && styles.rowActive]}
                  onPress={() => toggle(opt)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={
                      multiSelect
                        ? active
                          ? 'checkbox'
                          : 'square-outline'
                        : active
                          ? 'radio-button-on'
                          : 'radio-button-off'
                    }
                    size={18}
                    color={active ? COLORS.primary : COLORS.gray}
                  />
                  <Text
                    style={[
                      styles.rowText,
                      active && { color: COLORS.primary, fontWeight: '700' },
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {multiSelect && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.btn, styles.btnSecondary]}
                onPress={onCancel}
              >
                <Text style={styles.btnSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnPrimary]}
                onPress={() => onConfirm(draft || [])}
              >
                <Ionicons name="checkmark" size={16} color={COLORS.white} />
                <Text style={styles.btnPrimaryText}>
                  Confirmar ({(draft || []).length})
                </Text>
              </TouchableOpacity>
            </View>
          )}
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
    padding: 16,
    width: '100%',
    maxWidth: 480,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  search: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    marginLeft: 6,
    paddingVertical: 4,
  },
  list: { maxHeight: 360 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  rowActive: { backgroundColor: COLORS.background },
  rowText: { fontSize: 13, color: COLORS.text, marginLeft: 10 },
  emptyText: {
    fontSize: 12,
    color: COLORS.gray,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingTop: 12,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  btnPrimary: { backgroundColor: COLORS.primary },
  btnPrimaryText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 13,
    marginLeft: 6,
  },
  btnSecondary: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  btnSecondaryText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 13,
  },
});

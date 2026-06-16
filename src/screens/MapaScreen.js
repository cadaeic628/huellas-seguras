import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import {
  ANIMALS,
  VETERINARIAS,
  SANTIAGO_CENTER,
  getEstadoLabel,
  getEstadoColor,
} from '../data/mockData';
import FichaAnimalModal from '../components/FichaAnimalModal';
import RedesSocialesRow from '../components/RedesSocialesRow';

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

// Inyecta CSS/JS de Leaflet vía CDN (sólo en web)
function loadLeaflet() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(null);
    if (window.L) return resolve(window.L);

    if (!document.querySelector('#hs-leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'hs-leaflet-css';
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }

    let script = document.querySelector('#hs-leaflet-js');
    if (!script) {
      script = document.createElement('script');
      script.id = 'hs-leaflet-js';
      script.src = LEAFLET_JS;
      document.head.appendChild(script);
    }
    script.addEventListener('load', () => resolve(window.L));
    if (window.L) resolve(window.L);
  });
}

// HTML para un marcador circular (animal)
const animalMarkerHtml = (color) => `
  <div style="background:${color};width:32px;height:32px;border-radius:50%;
              border:3px solid #fff;display:flex;align-items:center;justify-content:center;
              box-shadow:0 2px 6px rgba(0,0,0,0.35);font-size:16px;line-height:1;">
    <span style="filter:brightness(0) invert(1);">🐾</span>
  </div>`;

// HTML para un marcador cuadrado (veterinaria)
const vetMarkerHtml = () => `
  <div style="background:${COLORS.vet};width:32px;height:32px;border-radius:6px;
              border:3px solid #fff;display:flex;align-items:center;justify-content:center;
              box-shadow:0 2px 6px rgba(0,0,0,0.35);color:#fff;font-weight:700;
              font-size:13px;line-height:1;">+</div>`;

// === Mapa real con Leaflet (web) ===
function LeafletMap({ onSelectAnimal, onSelectVet }) {
  const containerRef = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled || !L || !containerRef.current) return;
      if (mapInstance.current) return;

      const map = L.map(containerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView([SANTIAGO_CENTER.lat, SANTIAGO_CENTER.lng], 11);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Marcadores de animales
      ANIMALS.filter((a) => !a.adoptado).forEach((animal) => {
        const icon = L.divIcon({
          className: 'hs-animal-marker',
          html: animalMarkerHtml(getEstadoColor(animal.estado)),
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        const marker = L.marker([animal.lat, animal.lng], { icon }).addTo(map);
        marker.bindTooltip(
          `<b>${animal.nombre}</b> · ${animal.zona}`,
          { direction: 'top', offset: [0, -10] }
        );
        marker.on('click', () => onSelectAnimal(animal));
      });

      // Marcadores de veterinarias
      VETERINARIAS.forEach((vet) => {
        const icon = L.divIcon({
          className: 'hs-vet-marker',
          html: vetMarkerHtml(),
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        const marker = L.marker([vet.lat, vet.lng], { icon }).addTo(map);
        marker.bindTooltip(`🏥 ${vet.nombre}`, {
          direction: 'top',
          offset: [0, -10],
        });
        marker.on('click', () => onSelectVet(vet));
      });

      mapInstance.current = map;
    });

    return () => {
      cancelled = true;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [onSelectAnimal, onSelectVet]);

  return (
    <View style={styles.mapWrapper}>
      <View
        ref={containerRef}
        style={styles.realMap}
        // En web, react-native-web mapea View a <div>. Le pasamos altura concreta.
      />
    </View>
  );
}

// === Mapa simulado de fallback (móvil) ===
function FallbackMap({ onSelectAnimal, onSelectVet }) {
  const [size, setSize] = useState({ width: 320, height: 460 });
  // Convertimos lat/lng a una posición relativa dentro de un cuadro
  // Rango aproximado de Santiago para encuadrar los puntos
  const LAT_MIN = -33.65, LAT_MAX = -33.35;
  const LNG_MIN = -70.80, LNG_MAX = -70.50;

  const toXY = (lat, lng) => ({
    x: ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * size.width - 16,
    y: ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * size.height - 16,
  });

  return (
    <View style={styles.mapWrapper}>
      <View
        style={styles.simBackground}
        onLayout={(e) => setSize(e.nativeEvent.layout)}
      >
        <View style={[styles.streetH, { top: '20%' }]} />
        <View style={[styles.streetH, { top: '45%' }]} />
        <View style={[styles.streetH, { top: '70%' }]} />
        <View style={[styles.streetV, { left: '25%' }]} />
        <View style={[styles.streetV, { left: '55%' }]} />
        <View style={[styles.streetV, { left: '80%' }]} />

        <Text style={[styles.zoneLabel, { top: 8, left: 12 }]}>Norte</Text>
        <Text style={[styles.zoneLabel, { top: 8, right: 12 }]}>Centro</Text>
        <Text style={[styles.zoneLabel, { bottom: 8, left: 12 }]}>Poniente</Text>
        <Text style={[styles.zoneLabel, { bottom: 8, right: 12 }]}>Sur</Text>

        {ANIMALS.filter((a) => !a.adoptado).map((animal) => {
          const pos = toXY(animal.lat, animal.lng);
          return (
            <TouchableOpacity
              key={animal.id}
              style={[
                styles.simMarker,
                {
                  left: pos.x,
                  top: pos.y,
                  backgroundColor: getEstadoColor(animal.estado),
                },
              ]}
              onPress={() => onSelectAnimal(animal)}
            >
              <Ionicons name="paw" size={16} color={COLORS.white} />
            </TouchableOpacity>
          );
        })}

        {VETERINARIAS.map((vet) => {
          const pos = toXY(vet.lat, vet.lng);
          return (
            <TouchableOpacity
              key={vet.id}
              style={[styles.simMarkerVet, { left: pos.x, top: pos.y }]}
              onPress={() => onSelectVet(vet)}
            >
              <Ionicons name="medkit" size={16} color={COLORS.white} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function MapaScreen() {
  const navigation = useNavigation();
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [selectedVet, setSelectedVet] = useState(null);
  const [fichaAnimal, setFichaAnimal] = useState(null);
  const [imgError, setImgError] = useState(false);

  const handleSelectAnimal = (a) => {
    setImgError(false);
    setSelectedVet(null);
    setSelectedAnimal(a);
  };
  const handleSelectVet = (v) => {
    setSelectedAnimal(null);
    setSelectedVet(v);
  };

  const handleVerFicha = () => {
    const a = selectedAnimal;
    setSelectedAnimal(null);
    setFichaAnimal(a);
  };

  const handleContactar = () => {
    Alert.alert(
      'Contacto veterinaria',
      `${selectedVet.nombre}\nComuna: ${selectedVet.comuna}\nTeléfono: ${selectedVet.telefono}\nHorario: ${selectedVet.horario}`
    );
  };

  const animalesActivos = ANIMALS.filter((a) => !a.adoptado);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerCard}>
          <Ionicons name="paw" size={20} color={COLORS.primary} />
          <Text style={styles.headerCardText}>
            {animalesActivos.length} animales en seguimiento ·{' '}
            {VETERINARIAS.length} veterinarias asociadas
          </Text>
        </View>

        {Platform.OS === 'web' ? (
          <LeafletMap
            onSelectAnimal={handleSelectAnimal}
            onSelectVet={handleSelectVet}
          />
        ) : (
          <FallbackMap
            onSelectAnimal={handleSelectAnimal}
            onSelectVet={handleSelectVet}
          />
        )}

        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Leyenda</Text>
          <View style={styles.legendGrid}>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.healthy }]} />
              <Text style={styles.legendText}>Saludable</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.observation }]} />
              <Text style={styles.legendText}>En observación</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.urgent }]} />
              <Text style={styles.legendText}>Urgente</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDotSquare, { backgroundColor: COLORS.vet }]} />
              <Text style={styles.legendText}>Veterinaria asociada</Text>
            </View>
          </View>
          <Text style={styles.helpText}>
            Toca un marcador para ver detalles. Puedes hacer zoom y mover el mapa.
          </Text>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('Donar')}>
        <Ionicons name="heart" size={18} color={COLORS.white} />
        <Text style={styles.fabText}>Hacer donación</Text>
      </TouchableOpacity>

      {/* Modal animal */}
      <Modal
        transparent
        visible={!!selectedAnimal}
        animationType="fade"
        onRequestClose={() => setSelectedAnimal(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedAnimal(null)}
        >
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            {selectedAnimal && (
              <>
                {imgError ? (
                  <View style={[styles.modalImage, styles.modalImagePlaceholder]}>
                    <Ionicons name="paw" size={50} color={COLORS.primary} />
                  </View>
                ) : (
                  <Image
                    source={{ uri: selectedAnimal.foto }}
                    style={styles.modalImage}
                    onError={() => setImgError(true)}
                  />
                )}
                <Text style={styles.modalTitle}>{selectedAnimal.nombre}</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedAnimal.tipo} · ID {selectedAnimal.id}
                </Text>
                <View
                  style={[
                    styles.estadoBadge,
                    { backgroundColor: getEstadoColor(selectedAnimal.estado) },
                  ]}
                >
                  <Text style={styles.estadoText}>
                    {getEstadoLabel(selectedAnimal.estado)}
                  </Text>
                </View>
                <View style={styles.modalRow}>
                  <Ionicons name="location-outline" size={14} color={COLORS.gray} />
                  <Text style={styles.modalSmall}>
                    {selectedAnimal.zona} ({selectedAnimal.comuna})
                  </Text>
                </View>
                <TouchableOpacity style={styles.primaryButton} onPress={handleVerFicha}>
                  <Text style={styles.primaryButtonText}>Ver ficha</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal veterinaria */}
      <Modal
        transparent
        visible={!!selectedVet}
        animationType="fade"
        onRequestClose={() => setSelectedVet(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedVet(null)}
        >
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            {selectedVet && (
              <>
                <View style={styles.vetIconWrapper}>
                  <Ionicons name="medkit" size={36} color={COLORS.white} />
                </View>
                <Text style={styles.modalTitle}>{selectedVet.nombre}</Text>
                <View style={styles.modalRow}>
                  <Ionicons name="location-outline" size={14} color={COLORS.gray} />
                  <Text style={styles.modalSmall}>{selectedVet.comuna}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Ionicons name="call-outline" size={14} color={COLORS.gray} />
                  <Text style={styles.modalSmall}>{selectedVet.telefono}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Ionicons name="time-outline" size={14} color={COLORS.gray} />
                  <Text style={styles.modalSmall}>{selectedVet.horario}</Text>
                </View>
                <RedesSocialesRow redes={selectedVet.redes} style={styles.vetRedesRow} />
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: COLORS.secondary }]}
                  onPress={handleContactar}
                >
                  <Text style={styles.primaryButtonText}>Contactar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal ficha completa */}
      <FichaAnimalModal
        animal={fichaAnimal}
        visible={!!fichaAnimal}
        onClose={() => setFichaAnimal(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: 12, paddingBottom: 130 },
  headerCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: 10, padding: 12, marginBottom: 12,
  },
  headerCardText: { marginLeft: 8, color: COLORS.text, fontSize: 13, fontWeight: '600', flex: 1 },
  mapWrapper: {
    borderRadius: 12, overflow: 'hidden',
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    backgroundColor: COLORS.white,
  },
  realMap: { width: '100%', height: 500 },
  simBackground: {
    width: '100%', height: 460, backgroundColor: '#DCEBE3', position: 'relative',
  },
  streetH: { position: 'absolute', left: 0, right: 0, height: 6, backgroundColor: '#fff', zIndex: 1 },
  streetV: { position: 'absolute', top: 0, bottom: 0, width: 6, backgroundColor: '#fff', zIndex: 1 },
  zoneLabel: {
    position: 'absolute', color: '#5A7065', fontSize: 11,
    fontWeight: '700', fontStyle: 'italic', zIndex: 2,
  },
  simMarker: {
    position: 'absolute', width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: COLORS.white,
    elevation: 5, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 }, zIndex: 10,
  },
  simMarkerVet: {
    position: 'absolute', width: 32, height: 32, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.vet,
    borderWidth: 2, borderColor: COLORS.white, elevation: 5,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 }, zIndex: 10,
  },
  legend: { backgroundColor: COLORS.white, borderRadius: 12, padding: 14, marginTop: 14 },
  legendTitle: { fontWeight: 'bold', color: COLORS.text, marginBottom: 10, fontSize: 14 },
  legendGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  legendRow: { flexDirection: 'row', alignItems: 'center', width: '50%', marginVertical: 5 },
  legendDot: { width: 20, height: 20, borderRadius: 10, marginRight: 8 },
  legendDotSquare: { width: 20, height: 20, borderRadius: 5, marginRight: 8 },
  legendText: { color: COLORS.text, fontSize: 12, flex: 1 },
  helpText: { color: COLORS.gray, marginTop: 10, fontStyle: 'italic', fontSize: 12 },
  fab: {
    position: 'absolute', bottom: 18, right: 18,
    backgroundColor: COLORS.accent, paddingHorizontal: 18, paddingVertical: 12,
    borderRadius: 30, flexDirection: 'row', alignItems: 'center',
    elevation: 6, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4,
    shadowOffset: { width: 0, height: 3 },
  },
  fabText: { color: COLORS.white, fontWeight: 'bold', marginLeft: 8, fontSize: 13 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  modalCard: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 20,
    width: '100%', maxWidth: 360, alignItems: 'center',
  },
  modalImage: { width: 130, height: 130, borderRadius: 65, marginBottom: 12, backgroundColor: COLORS.lightGray },
  modalImagePlaceholder: { backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: COLORS.gray, marginBottom: 10 },
  modalRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 3 },
  modalSmall: { fontSize: 13, color: COLORS.text, marginLeft: 6 },
  estadoBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 12 },
  estadoText: { color: COLORS.white, fontWeight: 'bold', fontSize: 12 },
  primaryButton: {
    backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 25, marginTop: 14,
  },
  primaryButtonText: { color: COLORS.white, fontWeight: 'bold' },
  vetRedesRow: { marginTop: 10, justifyContent: 'center' },
  vetIconWrapper: {
    width: 70, height: 70, borderRadius: 12, backgroundColor: COLORS.secondary,
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
});

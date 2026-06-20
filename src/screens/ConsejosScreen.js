import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

// Catálogo estático de consejos. No depende de Supabase porque es contenido
// educativo curado por el equipo; si en el futuro queremos editarlo desde la
// app, mover a una tabla `public.consejos` con SELECT público.
const CATEGORIAS = [
  {
    id: 'alimentacion',
    label: 'Alimentación',
    icon: 'restaurant',
    color: COLORS.accent,
    intro:
      'Una dieta equilibrada previene enfermedades crónicas y mejora el ánimo de tu mascota.',
    tips: [
      {
        title: 'Perros: porciones según peso',
        body:
          'Adultos sanos: 2% a 3% de su peso corporal al día, dividido en 2 comidas. Cachorros: 3 a 4 comidas al día con alimento específico para crecimiento.',
      },
      {
        title: 'Gatos: pequeñas porciones frecuentes',
        body:
          'Los gatos prefieren comer 4 a 6 veces al día. Deja alimento seco disponible y refuerza con húmedo 1 vez al día para hidratación.',
      },
      {
        title: 'Alimentos prohibidos',
        body:
          'Nunca des chocolate, uvas, pasas, cebolla, ajo, palta, café ni huesos cocidos. Son tóxicos y pueden ser mortales.',
      },
      {
        title: 'Agua siempre fresca',
        body:
          'Cambia el agua una vez al día y lava el bebedero. Un gato adulto necesita ~60 ml/kg al día; un perro entre 50 y 100 ml/kg.',
      },
    ],
  },
  {
    id: 'salud',
    label: 'Salud y vacunas',
    icon: 'medkit',
    color: COLORS.urgent,
    intro:
      'La prevención es más barata que el tratamiento. Lleva un registro de fechas.',
    tips: [
      {
        title: 'Calendario base de vacunas',
        body:
          'Perros: séxtuple a las 6, 9 y 12 semanas + antirrábica al cumplir 4 meses. Gatos: triple felina + antirrábica anual.',
      },
      {
        title: 'Desparasitación',
        body:
          'Interna cada 3 meses en adultos; externa (pulgas/garrapatas) mensual con pipeta o collar, sobre todo en verano.',
      },
      {
        title: 'Esterilización',
        body:
          'Reduce riesgo de tumores mamarios y problemas de próstata. Recomendado entre los 6 y 8 meses de edad.',
      },
      {
        title: 'Señales de alerta',
        body:
          'Acude al veterinario si notas vómitos repetidos, encías pálidas, decaimiento por más de 24 h, o cojera persistente.',
      },
    ],
  },
  {
    id: 'higiene',
    label: 'Higiene',
    icon: 'water',
    color: COLORS.secondary,
    intro:
      'Higiene regular previene infecciones cutáneas, óticas y dentales.',
    tips: [
      {
        title: 'Baños sin excederse',
        body:
          'Perros: 1 vez al mes con shampoo neutro o específico. Gatos: rara vez (se asean solos); cepíllalos en su lugar 2 a 3 veces por semana.',
      },
      {
        title: 'Cepillado dental',
        body:
          'Idealmente 3 veces por semana con pasta para mascotas (la humana es tóxica). Reduce sarro y mal aliento.',
      },
      {
        title: 'Limpieza de orejas',
        body:
          'Revisa cada 2 semanas. Limpia con gasa y solución ótica veterinaria. Nunca uses cotonitos dentro del canal.',
      },
      {
        title: 'Corte de uñas',
        body:
          'Cada 3 a 4 semanas. Corta solo la punta blanca; la zona rosada tiene vasos sanguíneos.',
      },
    ],
  },
  {
    id: 'ejercicio',
    label: 'Ejercicio y juego',
    icon: 'walk',
    color: COLORS.healthy,
    intro:
      'El ejercicio canaliza energía, previene obesidad y reduce conductas destructivas.',
    tips: [
      {
        title: 'Perros: paseos diarios',
        body:
          'Mínimo 30 a 60 minutos al día según raza. Razas activas (border collie, husky) necesitan 1 a 2 horas.',
      },
      {
        title: 'Gatos: estimulación mental',
        body:
          'Juega 10 a 15 minutos, 2 a 3 veces al día con varitas o pelotas. Rota los juguetes para que no se aburran.',
      },
      {
        title: 'Evita horas de calor',
        body:
          'En verano, pasea temprano en la mañana o al atardecer. El pavimento caliente quema las almohadillas.',
      },
      {
        title: 'Enriquecimiento ambiental',
        body:
          'Comederos interactivos, rascadores en altura para gatos y juguetes con premios para perros mantienen su mente activa.',
      },
    ],
  },
  {
    id: 'comportamiento',
    label: 'Comportamiento',
    icon: 'happy',
    color: COLORS.primary,
    intro:
      'Una mascota bien socializada es una mascota feliz y segura.',
    tips: [
      {
        title: 'Refuerzo positivo',
        body:
          'Premia conductas deseadas con golosinas o caricias. Evita castigos físicos: generan miedo y agresividad.',
      },
      {
        title: 'Socialización temprana',
        body:
          'Entre las 3 y 14 semanas es la ventana clave. Expón al cachorro a personas, sonidos y otros animales de forma controlada.',
      },
      {
        title: 'Espacio seguro',
        body:
          'Asigna un rincón con cama y agua donde tu mascota pueda retirarse sin ser molestada, especialmente con niños o visitas.',
      },
      {
        title: 'Estrés y ansiedad por separación',
        body:
          'Si destruye cosas o ladra cuando estás fuera, no lo retes al llegar. Practica salidas cortas y consulta a un etólogo.',
      },
    ],
  },
  {
    id: 'primeros-auxilios',
    label: 'Primeros auxilios',
    icon: 'pulse',
    color: COLORS.observation,
    intro:
      'Saber qué hacer en los primeros minutos puede salvar una vida.',
    tips: [
      {
        title: 'Atragantamiento',
        body:
          'Abre la boca y revisa si ves el objeto. Si no sale, aplica maniobra de Heimlich modificada según tamaño y traslado urgente.',
      },
      {
        title: 'Golpe de calor',
        body:
          'Sombra, agua fresca (no helada) en patas y abdomen, y traslado inmediato al veterinario. Síntomas: jadeo excesivo, encías rojas.',
      },
      {
        title: 'Hemorragia',
        body:
          'Presiona la herida con gasa limpia durante 5 minutos. Si no para, eleva la zona y traslada al veterinario.',
      },
      {
        title: 'Intoxicación',
        body:
          'No induzcas el vómito sin instrucción veterinaria. Lleva el envase del producto sospechoso al centro de urgencia.',
      },
    ],
  },
];

export default function ConsejosScreen() {
  const [categoriaActiva, setCategoriaActiva] = useState(CATEGORIAS[0].id);

  const categoria = useMemo(
    () => CATEGORIAS.find((c) => c.id === categoriaActiva) ?? CATEGORIAS[0],
    [categoriaActiva]
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerBox}>
        <Ionicons name="bulb" size={42} color={COLORS.accent} />
        <Text style={styles.headerTitle}>Cuidados para tu mascota</Text>
        <Text style={styles.headerSubtitle}>
          Guía rápida con recomendaciones de alimentación, salud y bienestar.
          Ante cualquier duda, consulta siempre con un veterinario.
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {CATEGORIAS.map((cat) => {
          const activo = cat.id === categoriaActiva;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.chip,
                activo && { backgroundColor: cat.color, borderColor: cat.color },
              ]}
              onPress={() => setCategoriaActiva(cat.id)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={activo ? cat.icon : `${cat.icon}-outline`}
                size={15}
                color={activo ? COLORS.white : cat.color}
              />
              <Text
                style={[
                  styles.chipText,
                  activo && { color: COLORS.white },
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={[styles.introCard, { borderLeftColor: categoria.color }]}>
        <Text style={styles.introText}>{categoria.intro}</Text>
      </View>

      {categoria.tips.map((tip, idx) => (
        <View key={idx} style={styles.tipCard}>
          <View
            style={[
              styles.tipIconWrap,
              { backgroundColor: categoria.color },
            ]}
          >
            <Ionicons name={categoria.icon} size={18} color={COLORS.white} />
          </View>
          <View style={styles.tipBody}>
            <Text style={styles.tipTitle}>{tip.title}</Text>
            <Text style={styles.tipText}>{tip.body}</Text>
          </View>
        </View>
      ))}

      <View style={styles.footerCard}>
        <Ionicons name="information-circle" size={18} color={COLORS.secondary} />
        <Text style={styles.footerText}>
          Estos consejos son orientativos y no reemplazan la consulta con un
          médico veterinario para diagnóstico y tratamiento.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: {
    padding: 16,
    paddingBottom: 30,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  headerBox: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 6,
    textAlign: 'center',
  },
  headerSubtitle: {
    color: COLORS.gray,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  chipsRow: {
    paddingVertical: 4,
    paddingRight: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  chipText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '600',
    marginLeft: 6,
  },
  introCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  introText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  tipCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  tipIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tipBody: { flex: 1 },
  tipTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
  },
  footerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EAF2F7',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  footerText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    color: COLORS.text,
    lineHeight: 17,
  },
});

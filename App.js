import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import MapaScreen from './src/screens/MapaScreen';
import AnimalesScreen from './src/screens/AnimalesScreen';
import ReportarScreen from './src/screens/ReportarScreen';
import DonarScreen from './src/screens/DonarScreen';
import ForoScreen from './src/screens/ForoScreen';
import PerfilScreen from './src/screens/PerfilScreen';
import AuthScreen from './src/screens/AuthScreen';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { COLORS } from './src/constants/colors';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Mapa: 'map',
  Animales: 'paw',
  Reportar: 'camera',
  Donar: 'heart',
  Foro: 'chatbubbles',
};

// Botón circular elevado para la pestaña central (Reportar).
function CenterTabButton({ children, onPress, accessibilityState }) {
  const focused = accessibilityState?.selected;
  return (
    <TouchableOpacity
      style={styles.centerButtonWrapper}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View
        style={[
          styles.centerButton,
          focused && styles.centerButtonFocused,
        ]}
      >
        {children}
      </View>
    </TouchableOpacity>
  );
}

// Menú desplegable del header: acceso a Mi perfil y cerrar sesión. Reemplaza
// al tab dedicado para no desbalancear la barra inferior (la pestaña Perfil
// sigue existiendo en el navegador, solo está oculta del tabBar).
function HeaderMenu({ navigation }) {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);

  const goPerfil = () => {
    setOpen(false);
    navigation.navigate('Perfil');
  };

  const handleLogout = () => {
    setOpen(false);
    logout();
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={styles.headerMenuBtn}
        hitSlop={10}
        activeOpacity={0.7}
        accessibilityLabel="Abrir menú de cuenta"
      >
        <Ionicons name="person-circle-outline" size={26} color={COLORS.white} />
      </TouchableOpacity>

      <Modal
        transparent
        visible={open}
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity
          style={styles.menuBackdrop}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem} onPress={goPerfil}>
              <Ionicons name="person-outline" size={18} color={COLORS.text} />
              <Text style={styles.menuItemText}>Mi perfil</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color={COLORS.urgent} />
              <Text style={[styles.menuItemText, { color: COLORS.urgent }]}>
                Cerrar sesión
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) => ({
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: COLORS.white,
        headerTitleStyle: { fontWeight: 'bold' },
        // Alineado a la izquierda. El logo irá al extremo izquierdo más
        // adelante (via headerLeft) y el menú de cuenta queda a la derecha.
        headerTitleAlign: 'left',
        headerRight: () => <HeaderMenu navigation={navigation} />,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
        tabBarIcon: ({ color, focused }) => {
          const iconName = TAB_ICONS[route.name];
          if (route.name === 'Reportar') {
            return <Ionicons name={iconName} size={26} color={COLORS.white} />;
          }
          return (
            <Ionicons
              name={focused ? iconName : `${iconName}-outline`}
              size={26}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="Mapa"
        component={MapaScreen}
        options={{ title: 'Huellas Seguras' }}
      />
      <Tab.Screen
        name="Animales"
        component={AnimalesScreen}
        options={{ title: 'Catálogo de Animales' }}
      />
      <Tab.Screen
        name="Reportar"
        component={ReportarScreen}
        options={{
          title: 'Reportar Animal',
          tabBarButton: (props) => <CenterTabButton {...props} />,
        }}
      />
      <Tab.Screen
        name="Donar"
        component={DonarScreen}
        options={{ title: 'Donar' }}
      />
      <Tab.Screen
        name="Foro"
        component={ForoScreen}
        options={{ title: 'Foro de fundaciones' }}
      />
      <Tab.Screen
        name="Perfil"
        component={PerfilScreen}
        options={{
          title: 'Mi perfil',
          // Oculta del tabBar: la pantalla se alcanza desde el menú del header.
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
    </Tab.Navigator>
  );
}

function RootGate() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={COLORS.white} size="large" />
      </View>
    );
  }
  if (!user) return <AuthScreen />;
  return <MainNavigator />;
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <RootGate />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    height: 64,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 18 : 6,
  },
  tabItem: { height: 56 },
  centerButtonWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    top: -18,
  },
  centerButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.white,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  centerButtonFocused: { backgroundColor: COLORS.accent },

  // Menú del header (Mi perfil / Cerrar sesión)
  headerMenuBtn: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  menuCard: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 92 : 56,
    right: 8,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingVertical: 6,
    minWidth: 180,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  menuItemText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '600',
    marginLeft: 10,
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.lightGray,
    marginHorizontal: 8,
  },
});

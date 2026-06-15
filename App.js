import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import MapaScreen from './src/screens/MapaScreen';
import AnimalesScreen from './src/screens/AnimalesScreen';
import ReportarScreen from './src/screens/ReportarScreen';
import DonarScreen from './src/screens/DonarScreen';
import ForoScreen from './src/screens/ForoScreen';
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

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerStyle: { backgroundColor: COLORS.primary },
          headerTintColor: COLORS.white,
          headerTitleStyle: { fontWeight: 'bold' },
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
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
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
});

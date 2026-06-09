import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import MapaScreen from './src/screens/MapaScreen';
import AnimalesScreen from './src/screens/AnimalesScreen';
import ReportarScreen from './src/screens/ReportarScreen';
import DonarScreen from './src/screens/DonarScreen';
import { COLORS } from './src/constants/colors';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerStyle: {
            backgroundColor: COLORS.primary,
          },
          headerTintColor: COLORS.white,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.gray,
          tabBarStyle: {
            backgroundColor: COLORS.white,
            borderTopWidth: 1,
            borderTopColor: COLORS.lightGray,
            paddingBottom: 6,
            paddingTop: 6,
            height: 62,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
          tabBarIcon: ({ color, size }) => {
            let iconName;
            if (route.name === 'Mapa') iconName = 'map';
            else if (route.name === 'Animales') iconName = 'paw';
            else if (route.name === 'Reportar') iconName = 'camera';
            else if (route.name === 'Donar') iconName = 'heart';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen
          name="Mapa"
          component={MapaScreen}
          options={{ title: 'Huellas Seguras', tabBarLabel: 'Mapa' }}
        />
        <Tab.Screen
          name="Animales"
          component={AnimalesScreen}
          options={{ title: 'Catálogo de Animales', tabBarLabel: 'Animales' }}
        />
        <Tab.Screen
          name="Reportar"
          component={ReportarScreen}
          options={{ title: 'Reportar Animal', tabBarLabel: 'Reportar' }}
        />
        <Tab.Screen
          name="Donar"
          component={DonarScreen}
          options={{ title: 'Donar', tabBarLabel: 'Donar' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

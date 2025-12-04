import * as React from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import HomeScreen from "./screens/HomeScreen";
import DriverScreen from "./screens/DriverScreen";
import ParentScreen from "./screens/ParentScreen";

const Stack = createStackNavigator();

export default function App() {
  return (
    <>
      <StatusBar style="light" backgroundColor="#237D71" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: styles.headerStyle,
            headerTintColor: "#fff",
            headerTitleStyle: styles.headerTitleStyle,
            headerTitleAlign: "center",
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: "Bus Monitor" }}
          />
          <Stack.Screen
            name="Driver"
            component={DriverScreen}
            options={{ title: "Driver" }}
          />
          <Stack.Screen
            name="Parent"
            component={ParentScreen}
            options={{ title: "Parent" }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

const styles = StyleSheet.create({
  headerStyle: {
    backgroundColor: "#237D71",
    height: 120,
  },
  headerTitleStyle: {
    fontWeight: "bold",
    fontSize: 36,
  },
});

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import PolylineDecoder from "polyline";
import Constants from "expo-constants";

const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.extra?.googleMapsApiKey ?? "";

const from = { latitude: 37.9838, longitude: 23.7275 };
const to = { latitude: 37.9842, longitude: 23.7298 };

export default function DriverScreen() {
  const [route, setRoute] = useState<{ latitude: number; longitude: number }[]>([]);

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const response = await fetch(
          "https://routes.googleapis.com/directions/v2:computeRoutes",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
              "X-Goog-FieldMask": "routes.polyline.encodedPolyline",
            },
            body: JSON.stringify({
              origin: { location: { latLng: from } },
              destination: { location: { latLng: to } },
              travelMode: "DRIVE",
            }),
          }
        );

        const data = await response.json();
        const encoded = data.routes?.[0]?.polyline?.encodedPolyline;
        if (encoded) {
          const decoded = (PolylineDecoder.decode(encoded) as [number, number][])
            .map(([lat, lng]) => ({
              latitude: lat,
              longitude: lng,
            }));
          setRoute(decoded);
        }
      } catch (error) {
        console.error("Error fetching route:", error);
      }
    };

    fetchRoute();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: from.latitude,
            longitude: from.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          <Marker coordinate={from} title="Start" />
          <Marker coordinate={to} title="Destination" />
          {route.length > 0 && (
            <Polyline
              coordinates={route}
              strokeColor="#007bff"
              strokeWidth={5}
            />
          )}
        </MapView>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>Students Present:</Text>
        <Text style={styles.numberText}>20</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 20,
  },
  mapContainer: {
    width: '100%',
    height: '80%',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  infoContainer: {
    width: '100%',
    height: '10%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  infoText: {
    color: '#000',
    fontSize: 20,
    fontWeight: 'bold',
  },
  numberText: {
    color: '#58aa32',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

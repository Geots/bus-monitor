import React, { useEffect, useState, useRef } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import PolylineDecoder from "polyline";
import Constants from "expo-constants";

const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.extra?.googleMapsApiKey;

interface Lat_Lng {
  latitude: number;
  longitude: number;
}

interface LiveMapProps {
  currentLocation: Lat_Lng;
  destination: Lat_Lng;
  markerTitle?: string;
}

export default function LiveMap({
  currentLocation,
  destination,
  markerTitle = "Bus",
}: LiveMapProps) {
  const mapRef = useRef<MapView>(null);
  const [route, setRoute] = useState<Lat_Lng[]>([]);

  useEffect(() => {
    mapRef.current?.animateCamera({
      center: currentLocation,
    });
  }, [currentLocation]);

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
              origin: { location: { latLng: currentLocation } },
              destination: { location: { latLng: destination } },
              travelMode: "DRIVE",
            }),
          }
        );

        const data = await response.json();
        const encoded = data.routes?.[0]?.polyline?.encodedPolyline;
        if (encoded) {
          const decoded = (
            PolylineDecoder.decode(encoded) as [number, number][]
          ).map(([lat, lng]) => ({
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
  }, [currentLocation, destination]);

  return (
    <View style={styles.mapContainer}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker coordinate={currentLocation} title={markerTitle} />
        <Marker coordinate={destination} title="Destination" />

        {route.length > 0 && (
          <Polyline coordinates={route} strokeColor="#007bff" strokeWidth={5} />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    overflow: "hidden",
  },
  map: {
    width: "100%",
    height: "100%",
  },
});

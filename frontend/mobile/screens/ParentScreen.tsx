import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

const lat = 37.7749;
const long = -122.4194;

export default function ParentScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: lat,
            longitude: long,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          >
          <Marker
            coordinate={{ latitude: lat, longitude: long }}
            title="Bus 1"
            description="Speed: 45 km/h"
          />
        </MapView>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>Current Speed:</Text>
        <Text style={styles.numberText}>45 km/h</Text>
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

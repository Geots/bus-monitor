import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import mqtt from "mqtt";
import LiveMap from "./components/LiveMap";

const from = { latitude: 37.990681948701905, longitude: 23.677086735467476 };
const destination = {
  latitude: 37.97743299485048,
  longitude: 23.673475337091762,
};

export default function ParentScreen() {
  const [busLocation, setBusLocation] = useState(from);
  const [speed, setSpeed] = useState(0);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  useEffect(() => {
    const client = mqtt.connect("ws://broker.hivemq.com:8000/mqtt");
    const TOPIC_DATA = "bus_tracker/data";
    const TOPIC_WARNING = "bus_tracker/warnings";

    client.on("connect", () => {
      console.log("MQTT Connected");
      client.subscribe([TOPIC_DATA, TOPIC_WARNING]);
    });

    client.on("message", (topic, message) => {
      const msgString = message.toString();

      if (topic === TOPIC_DATA) {
        try {
          const payload = JSON.parse(msgString);

          if (payload.gps_lat && payload.gps_lng) {
            setBusLocation({
              latitude: payload.gps_lat,
              longitude: payload.gps_lng,
            });
          }

          if (payload.gps_speed !== undefined) {
            setSpeed(payload.gps_speed);
          }
        } catch (error) {
          console.error("Error parsing MQTT message:", error);
        }
      } else if (topic === TOPIC_WARNING) {
        setWarningMessage(msgString);
      }
    });

    return () => {
      if (client.connected) client.end();
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Map */}
      <View style={styles.mapWrapper}>
        <LiveMap
          currentLocation={busLocation}
          destination={destination}
          markerTitle="Bus"
        />
      </View>

      {/* Speed */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>Current Speed:</Text>
        <Text style={styles.numberText}>{speed.toFixed(1)} km/h</Text>
      </View>

      {warningMessage && (
        <View style={styles.warningContainer}>
          <View style={styles.warningHeader}>
            <Text style={styles.warningTitle}>Warning</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setWarningMessage(null)}
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.warningBodyText}>{warningMessage}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    padding: 20,
  },
  mapWrapper: {
    width: "100%",
    height: "70%",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    backgroundColor: "#fff",
    marginBottom: 20,
  },
  infoContainer: {
    width: "100%",
    height: 80,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    marginBottom: 15,
  },
  infoText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "bold",
  },
  numberText: {
    color: "#58aa32",
    fontSize: 20,
    fontWeight: "bold",
  },
  warningContainer: {
    width: "100%",
    backgroundColor: "#FFF5F7",
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: "#ef9a9a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  warningHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#d32f2f",
  },
  closeButton: {
    backgroundColor: "#d32f2f",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  closeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  warningBodyText: {
    fontSize: 14,
    color: "#c62828",
    marginTop: 5,
  },
});

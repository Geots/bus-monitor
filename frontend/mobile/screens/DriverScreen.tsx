import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import mqtt from "mqtt";
import LiveMap from "./components/LiveMap";

const from = { latitude: 37.9838, longitude: 23.7275 };
const destination = {
  latitude: 37.97743299485048,
  longitude: 23.673475337091762,
};

export default function DriverScreen() {
  const [driverLocation, setDriverLocation] = useState(from);
  const [studentCount, setStudentCount] = useState(20);

  useEffect(() => {
    const client = mqtt.connect("ws://broker.hivemq.com:8000/mqtt");
    const TOPIC_DATA = "bus_tracker/data";

    client.on("connect", () => {
      console.log("MQTT Connected");
      client.subscribe(TOPIC_DATA);
    });

    client.on("message", (topic, message) => {
      if (topic === TOPIC_DATA) {
        try {
          const payload = JSON.parse(message.toString());

          if (payload.gps_lat && payload.gps_lng) {
            setDriverLocation({
              latitude: payload.gps_lat,
              longitude: payload.gps_lng,
            });
          }

          if (payload.students !== undefined) {
            setStudentCount(payload.students);
          }
        } catch (error) {
          console.error("Error parsing MQTT message:", error);
        }
      }
    });

    return () => {
      if (client.connected) client.end();
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.mapWrapper}>
        <LiveMap
          currentLocation={driverLocation}
          destination={destination}
          markerTitle="Bus"
        />
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>Students:</Text>
        <Text style={styles.numberText}>{studentCount}</Text>
      </View>
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
    height: "80%",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    backgroundColor: "#fff",
  },
  infoContainer: {
    width: "100%",
    height: "10%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  infoText: {
    color: "#000",
    fontSize: 20,
    fontWeight: "bold",
  },
  numberText: {
    color: "#58aa32",
    fontSize: 20,
    fontWeight: "bold",
  },
});

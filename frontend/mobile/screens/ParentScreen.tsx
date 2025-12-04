import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity } from "react-native";
import mqtt from "mqtt";
import LiveMap from "./components/LiveMap";

const from = { latitude: 37.9838, longitude: 23.7275 };
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
      console.log("Parent App: MQTT Connected successfully");
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
      <View style={styles.mapWrapper}>
        <LiveMap
          currentLocation={busLocation}
          destination={destination}
          markerTitle="School Bus"
        />
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>Current Speed:</Text>
        <Text style={styles.numberText}>{speed.toFixed(1)} km/h</Text>
      </View>

      <Modal
        transparent={true}
        visible={!!warningMessage}
        onRequestClose={() => setWarningMessage(null)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Warning</Text>
            </View>
            <Text style={styles.modalText}>{warningMessage}</Text>
            <TouchableOpacity
              style={styles.buttonClose}
              onPress={() => setWarningMessage(null)}
            >
              <Text style={styles.textStyle}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalView: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 15,
    alignItems: "center",
  },
  modalHeader: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#d32f2f",
  },
  modalText: {
    marginBottom: 25,
    textAlign: "center",
    fontSize: 16,
    color: "#333",
  },
  buttonClose: {
    borderRadius: 10,
    padding: 8,
    paddingHorizontal: 30,
    borderWidth: 2,
    borderColor: "#d32f2f",
  },
  textStyle: {
    color: "#d32f2f",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
});

"use client";

import React, { useState, useEffect } from "react";
import mqtt from "mqtt";

// --- TYPE DEFINITIONS ---
interface BusData {
  accel_x: number;
  distance: number;
  temp: number;
  students: number;
}

// --- MQTT CONFIGURATION (HiveMQ Cloud) ---
const MQTT_BROKER_HOST =
  "a7773caeed82c4eae9db011800efef4e53.s1.eu.hivemq.cloud";
const MQTT_BROKER_PORT = 8884;
const MQTT_USER = "hivemq.webclient.1763651528769";
const MQTT_PASS = "uv>.lkEFb1,sA<02BD3C";

const DATA_TOPIC = "bus_tracker/data";
const WARNING_TOPIC = "bus_tracker/warnings";

// Χρήση WSS (Secure WebSockets)
const MQTT_BROKER_URL = `wss://${MQTT_BROKER_HOST}:${MQTT_BROKER_PORT}/mqtt`;

const DEFAULT_DATA: BusData = {
  accel_x: 0.0,
  distance: 0,
  temp: 0.0,
  students: 0,
};

const LiveTracker: React.FC = () => {
  const [status, setStatus] = useState<string>("Connecting...");
  const [data, setData] = useState<BusData>(DEFAULT_DATA);

  // Warning State
  const [warningMessage, setWarningMessage] = useState<string>(
    "Σύστημα Ασφαλείας: OK"
  );
  const [isWarningActive, setIsWarningActive] = useState<boolean>(false);

  useEffect(() => {
    // 1. Σύνδεση MQTT
    const mqttClient = mqtt.connect(MQTT_BROKER_URL, {
      clientId: "nextjs_web_" + Math.random().toString(16).substr(2, 8),
      clean: true,
      protocol: "wss", // Ασφαλής σύνδεση
      username: MQTT_USER,
      password: MQTT_PASS,
    });

    // 2. Event: Συνδέθηκε
    mqttClient.on("connect", () => {
      setStatus("Connected");
      console.log("Connected to HiveMQ Cloud");

      // Εγγραφή στα Topics
      mqttClient.subscribe([DATA_TOPIC, WARNING_TOPIC], (err) => {
        if (!err) console.log(`Subscribed to topics`);
      });
    });

    // 3. Event: Λήψη Μηνύματος
    mqttClient.on("message", (topic, message) => {
      const payload = message.toString();

      if (topic === WARNING_TOPIC) {
        // --- ΧΕΙΡΙΣΜΟΣ WARNING ---
        setWarningMessage(payload);
        setIsWarningActive(true);

        // Αυτόματη επαναφορά μετά από 5 δευτερόλεπτα
        setTimeout(() => {
          setWarningMessage("Σύστημα Ασφαλείας: OK");
          setIsWarningActive(false);
        }, 5000);
      } else if (topic === DATA_TOPIC) {
        // --- ΧΕΙΡΙΣΜΟΣ ΔΕΔΟΜΕΝΩΝ (JSON) ---
        try {
          const newData: BusData = JSON.parse(payload);
          setData(newData);
        } catch (e) {
          console.error("JSON Parse Error:", e);
        }
      }
    });

    mqttClient.on("error", (err) => {
      setStatus(`Error: ${err.message}`);
      console.error("MQTT Error:", err);
    });

    mqttClient.on("close", () => {
      setStatus("Disconnected");
    });

    // 4. Cleanup
    return () => {
      if (mqttClient) mqttClient.end();
    };
  }, []);

  // --- RENDER (Tailwind CSS) ---
  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 p-4">
      <div className="max-w-4xl mx-auto my-10 bg-white p-8 rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center border-b-2 border-gray-200 pb-4 mb-6">
          <h1 className="text-3xl font-extrabold text-blue-700">
            🚌 Bus Tracker Live
          </h1>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-500">Status:</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                status === "Connected"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {status}
            </span>
          </div>
        </div>

        {/* WARNING BOX (Δυναμικό) */}
        <div
          className={`p-4 mb-8 rounded-lg text-center font-bold text-lg transition-all duration-300 ${
            isWarningActive
              ? "bg-red-600 text-white shadow-lg animate-pulse"
              : "bg-green-500 text-white shadow-sm"
          }`}
        >
          {warningMessage}
        </div>

        {/* Grid Δεδομένων */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Επιτάχυνση */}
          <div className="p-6 bg-gray-50 border-l-4 border-blue-500 rounded-lg shadow-sm">
            <h3 className="text-gray-500 text-sm uppercase tracking-wider mb-1">
              Επιταχυνση (X)
            </h3>
            <p className="text-3xl font-bold text-gray-800">
              {data.accel_x.toFixed(2)}{" "}
              <span className="text-lg text-gray-500">m/s²</span>
            </p>
          </div>

          {/* Απόσταση */}
          <div
            className={`p-6 border-l-4 rounded-lg shadow-sm transition-colors ${
              data.distance < 20
                ? "bg-red-50 border-red-500"
                : "bg-gray-50 border-blue-500"
            }`}
          >
            <h3 className="text-gray-500 text-sm uppercase tracking-wider mb-1">
              Αποσταση Εμποδιου
            </h3>
            <p className="text-3xl font-bold text-gray-800">
              {data.distance} <span className="text-lg text-gray-500">cm</span>
            </p>
          </div>

          {/* Θερμοκρασία */}
          <div className="p-6 bg-gray-50 border-l-4 border-orange-500 rounded-lg shadow-sm">
            <h3 className="text-gray-500 text-sm uppercase tracking-wider mb-1">
              Θερμοκρασια
            </h3>
            <p className="text-3xl font-bold text-gray-800">
              {data.temp.toFixed(1)}{" "}
              <span className="text-lg text-gray-500">°C</span>
            </p>
          </div>

          {/* Μαθητές */}
          <div className="p-6 bg-blue-50 border-l-4 border-cyan-600 rounded-lg shadow-sm flex flex-col justify-center">
            <h3 className="text-cyan-800 text-sm uppercase tracking-wider mb-1">
              Μαθητες Εντος
            </h3>
            <p className="text-5xl font-extrabold text-cyan-700">
              {data.students}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTracker;

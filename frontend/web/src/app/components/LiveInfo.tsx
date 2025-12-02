import React, { useEffect, useState } from "react";
import mqtt from "mqtt";
import { Bus } from "../page";

interface BusTrackerProps {
  selectedBus: Bus | null;
}

const BusTracker: React.FC<BusTrackerProps> = ({ selectedBus }) => {
  const [warnings, setWarnings] = useState<string[]>([]);
  const [status, setStatus] = useState<
    "Connected" | "Disconnected" | "Connecting"
  >("Connecting");

  const TOPIC_WARNING = "bus_tracker/warnings";

  const THRESHOLD_HEAT = 600.0;
  const THRESHOLD_DIST = 10.0;
  const THRESHOLD_ACCEL = 2.0;

  useEffect(() => {
    const client = mqtt.connect("ws://broker.hivemq.com:8000/mqtt");

    client.on("connect", () => {
      setStatus("Connected");
      client.subscribe(TOPIC_WARNING);
    });

    client.on("message", (topic, message) => {
      if (topic === TOPIC_WARNING) {
        const payload = message.toString();
        const timestamp = new Date().toLocaleTimeString();
        setWarnings((prev) => [`[${timestamp}] ${payload}`, ...prev]);
      }
    });

    client.on("close", () => {
      setStatus("Disconnected");
    });

    return () => {
      if (client.connected) client.end();
    };
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-2 bg-gray-50 font-sans mt-8 rounded-xl border border-gray-200 shadow-sm">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Bus Information</h1>
          <p className="text-md text-gray-600 mt-1">
            Selected:{" "}
            <span className="font-bold text-[#58aa32]">
              {selectedBus?.name || "None"}
            </span>
          </p>
        </div>
        <span className={`rounded-full text-sm font-bold`}>MQTT: {status}</span>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Students */}
        <div className="p-6 rounded-xl shadow-md text-gray-800 transition-colors duration-300">
          <h2 className="text-sm uppercase tracking-wider opacity-80">
            Students
          </h2>
          <div className="text-4xl font-bold mt-2">
            {selectedBus ? selectedBus.students : "-"}
          </div>
        </div>

        {/* Temperature */}
        <div
          className={`p-6 rounded-xl shadow-md transition-colors duration-300 ${
            selectedBus && selectedBus.temp > THRESHOLD_HEAT
              ? "bg-red-500 text-white"
              : "bg-white text-gray-800"
          }`}
        >
          <h2 className="text-sm uppercase tracking-wider opacity-75">
            Temperature
          </h2>
          <div className="text-4xl font-bold mt-2">
            {selectedBus ? `${selectedBus.temp}°C` : "-"}
          </div>
        </div>

        {/* Distance */}
        <div
          className={`p-6 rounded-xl shadow-md transition-colors duration-300 ${
            selectedBus && selectedBus.distance <= THRESHOLD_DIST
              ? "bg-red-500 text-white"
              : "bg-white text-gray-800"
          }`}
        >
          <h2 className="text-sm uppercase tracking-wider opacity-75">
            Proximity
          </h2>
          <div className="text-4xl font-bold mt-2">
            {selectedBus ? `${selectedBus.distance} cm` : "-"}
          </div>
        </div>

        {/* Acceleration */}
        <div
          className={`p-6 rounded-xl shadow-md transition-colors duration-300 ${
            selectedBus && Math.abs(selectedBus.accel_x) >= THRESHOLD_ACCEL
              ? "bg-red-500 text-white"
              : "bg-white text-gray-800"
          }`}
        >
          <h2 className="text-sm uppercase tracking-wider opacity-75">
            Accel (X)
          </h2>
          <div className="text-4xl font-bold mt-2">
            {selectedBus ? `${selectedBus.accel_x.toFixed(2)} g` : "-"}
          </div>
        </div>
      </div>

      {/* Warnings */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">
          Warnings
        </h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {warnings.length === 0 ? (
            <p className="text-gray-400 italic">No warnings ...</p>
          ) : (
            warnings.map((warn, index) => (
              <div
                key={index}
                className="p-3 bg-red-50 text-red-700 rounded text-sm font-mono shadow-sm"
              >
                {warn}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default BusTracker;

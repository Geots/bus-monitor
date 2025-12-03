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
  const THRESHOLD_SPEED = 80.0;

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
    <div className="bg-gray-50 h-full rounded-xl shadow-xl flex flex-col overflow-hidden">
      <header className="p-4 bg-gradient-to-r from-green-900 to-emerald-700 flex justify-between items-center shadow-md">
        <div>
          <h1 className="text-xl font-bold text-white">Bus Information</h1>
          <p className="text-sm text-green-100 mt-1">
            Selected:{" "}
            <span className="font-bold text-white">
              {selectedBus?.name || "No Bus Selected"}
            </span>
          </p>
        </div>
        <span className="text-xs bg-white/20 backdrop-blur-md px-2 py-1 rounded-full text-white font-mono border border-white/30">
          {status}
        </span>
      </header>

      <div className="flex flex-col p-4 h-full overflow-hidden">
        <div className="grid grid-cols-2 gap-3 mb-4 shrink-0">
          {/* Students */}
          <div className="p-4 rounded-xl shadow-sm bg-white text-gray-800 border border-gray-100">
            <h2 className="text-[10px] uppercase tracking-wider opacity-60">
              Students
            </h2>
            <div className="text-2xl font-bold mt-1">
              {selectedBus ? selectedBus.students : "-"}
            </div>
          </div>

          {/* Temp */}
          <div
            className={`p-4 rounded-xl shadow-sm border border-gray-100 transition-colors duration-300 ${
              selectedBus && selectedBus.temp > THRESHOLD_HEAT
                ? "bg-red-500 text-white"
                : "bg-white text-gray-800"
            }`}
          >
            <h2 className="text-[10px] uppercase tracking-wider opacity-60">
              Temperature
            </h2>
            <div className="text-2xl font-bold mt-1">
              {selectedBus ? `${selectedBus.temp}°C` : "-"}
            </div>
          </div>

          {/* Distance */}
          <div
            className={`p-4 rounded-xl shadow-sm border border-gray-100 transition-colors duration-300 ${
              selectedBus && selectedBus.distance <= THRESHOLD_DIST
                ? "bg-red-500 text-white"
                : "bg-white text-gray-800"
            }`}
          >
            <h2 className="text-[10px] uppercase tracking-wider opacity-60">
              Proximity
            </h2>
            <div className="text-2xl font-bold mt-1">
              {selectedBus ? `${selectedBus.distance} cm` : "-"}
            </div>
          </div>

          {/* Speed */}
          <div
            className={`p-4 rounded-xl shadow-sm border border-gray-100 transition-colors duration-300 ${
              selectedBus && selectedBus.speed >= THRESHOLD_SPEED
                ? "bg-red-500 text-white"
                : "bg-white text-gray-800"
            }`}
          >
            <h2 className="text-[10px] uppercase tracking-wider opacity-60">
              Speed
            </h2>
            <div className="text-2xl font-bold mt-1">
              {selectedBus ? `${selectedBus.speed.toFixed(0)} km/h` : "-"}
            </div>
          </div>
        </div>

        {/* Warnings */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col min-h-0">
          <h3 className="text-sm font-bold text-gray-800 mb-2 border-b pb-2 shrink-0">
            Warnings
          </h3>
          <div className="space-y-2 overflow-y-auto flex-1 pr-1">
            {warnings.length === 0 ? (
              <p className="text-gray-400 text-xs italic">No warnings.</p>
            ) : (
              warnings.map((warn, index) => (
                <div
                  key={index}
                  className="p-2 bg-red-50 text-red-700 rounded text-xs font-mono border border-red-100"
                >
                  {warn}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusTracker;

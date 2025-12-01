import React, { useEffect, useState } from 'react';
import mqtt from 'mqtt';
// Make sure this path matches where your page.tsx is located.
// If LiveInfo.tsx is in 'app/components' and page.tsx is in 'app', this is correct.
import { Bus } from '../page'; 

interface BusTrackerProps {
  selectedBus: Bus | null;
}

const BusTracker: React.FC<BusTrackerProps> = ({ selectedBus }) => {
  const [warnings, setWarnings] = useState<string[]>([]);
  const [status, setStatus] = useState<'Connected' | 'Disconnected' | 'Connecting'>('Connecting');

  const TOPIC_WARNING = 'bus_tracker/warnings'; 
  
  const THRESHOLD_HEAT = 600.0;
  const THRESHOLD_DIST = 10.0;
  const THRESHOLD_ACCEL = 2.0;

  // MQTT Connection (Only for System Warnings & Status)
  useEffect(() => {
    // Connect to HiveMQ via WebSockets
    const client = mqtt.connect('ws://broker.hivemq.com:8000/mqtt');

    client.on('connect', () => {
      setStatus('Connected');
      
      // We ONLY subscribe to warnings here. 
      // Live sensor data is passed down from the parent component (page.tsx) via props.
      client.subscribe(TOPIC_WARNING, (err) => {
        if (err) console.error('Subscription error:', err);
      });
    });

    client.on('message', (topic, message) => {
      if (topic === TOPIC_WARNING) {
        const payload = message.toString();
        const timestamp = new Date().toLocaleTimeString();
        setWarnings((prev) => [`[${timestamp}] ${payload}`, ...prev].slice(0, 10));
      }
    });

    client.on('close', () => {
      setStatus('Disconnected');
    });

    return () => {
      if (client.connected) client.end();
    };
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-50 font-sans mt-8 rounded-xl border border-gray-200 shadow-sm">
      <header className="mb-6 flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Bus Stats</h1>
            <p className="text-md text-gray-600 mt-1">
              {/* Show Name or Placeholder */}
              Selected: <span className="font-bold text-[#58aa32]">{selectedBus?.name || "None"}</span>
            </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
          status === 'Connected' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          System Status: {status}
        </span>
      </header>

      {/* Sensor Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* 1. Student Counter */}
        <div className="bg-blue-600 text-white p-6 rounded-xl shadow-md">
          <h2 className="text-sm uppercase tracking-wider opacity-80">Occupancy</h2>
          <div className="text-4xl font-bold mt-2">
            {selectedBus ? selectedBus.students : "-"}
          </div>
          <div className="text-sm mt-2 opacity-90">
            Students Onboard
          </div>
        </div>

        {/* 2. Temperature Card */}
        <div className={`p-6 rounded-xl shadow-md transition-colors duration-300 ${
          selectedBus && selectedBus.temp > THRESHOLD_HEAT ? 'bg-red-500 text-white' : 'bg-white text-gray-800'
        }`}>
          <h2 className="text-sm uppercase tracking-wider opacity-75">Temperature</h2>
          <div className="text-4xl font-bold mt-2">
            {selectedBus ? `${selectedBus.temp}°C` : "-"}
          </div>
          <div className="text-sm mt-2 font-medium">
            {!selectedBus ? '-' : (selectedBus.temp > THRESHOLD_HEAT ? 'CRITICAL HEAT' : 'Normal Range')}
          </div>
        </div>

        {/* 3. Distance Card */}
        <div className={`p-6 rounded-xl shadow-md transition-colors duration-300 ${
          selectedBus && selectedBus.distance <= THRESHOLD_DIST ? 'bg-yellow-400 text-black' : 'bg-white text-gray-800'
        }`}>
          <h2 className="text-sm uppercase tracking-wider opacity-75">Proximity</h2>
          <div className="text-4xl font-bold mt-2">
            {selectedBus ? `${selectedBus.distance} cm` : "-"}
          </div>
          <div className="text-sm mt-2 font-medium">
            {!selectedBus ? '-' : (selectedBus.distance <= THRESHOLD_DIST ? 'OBSTRUCTION DETECTED' : 'Clear Path')}
          </div>
        </div>

        {/* 4. Acceleration Card */}
        <div className={`p-6 rounded-xl shadow-md transition-colors duration-300 ${
          selectedBus && Math.abs(selectedBus.accel_x) >= THRESHOLD_ACCEL ? 'bg-orange-500 text-white' : 'bg-white text-gray-800'
        }`}>
          <h2 className="text-sm uppercase tracking-wider opacity-75">G-Force (X)</h2>
          <div className="text-4xl font-bold mt-2">
            {selectedBus ? `${selectedBus.accel_x.toFixed(2)} g` : "-"}
          </div>
          <div className="text-sm mt-2 font-medium">
             {!selectedBus ? '-' : (Math.abs(selectedBus.accel_x) >= THRESHOLD_ACCEL ? 'UNSAFE DRIVING' : 'Stable')}
          </div>
        </div>
      </div>

      {/* Warnings Log */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">System Alerts (Live Stream)</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {warnings.length === 0 ? (
            <p className="text-gray-400 italic">No active alerts reported by system...</p>
          ) : (
            warnings.map((warn, index) => (
              <div key={index} className="p-3 bg-red-50 text-red-700 rounded border-l-4 border-red-500 text-sm font-mono shadow-sm">
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
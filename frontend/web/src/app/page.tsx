"use client";

import React, { useState, useEffect } from "react";
import {
  GoogleMap,
  LoadScript,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import mqtt from "mqtt";
import BusTracker from "./components/LiveInfo";

const mapContainerStyle = {
  width: "100%",
  height: "100%",
  borderRadius: "10px",
};

const center = { lat: 37.9838, lng: 23.7275 };

export interface Bus {
  id: number;
  name: string;
  lat: number;
  lng: number;
  speed: number;
  students: number;
  smoking: boolean;
  alcohol: boolean;
  speeding: boolean;
  temp: number;
  distance: number;
  accel_x: number;
}

const initialBuses: Bus[] = [
  {
    id: 1,
    name: "Bus 1 (Live Tracker)",
    lat: 37.9838,
    lng: 23.7275,
    speed: 0,
    students: 10,
    smoking: false,
    alcohol: false,
    speeding: false,
    temp: 22.5,
    distance: 150,
    accel_x: 0.1,
  },
  {
    id: 2,
    name: "Bus 2 (Static - Obstruction)",
    lat: 37.9842,
    lng: 23.7298,
    speed: 52,
    students: 15,
    smoking: false,
    alcohol: false,
    speeding: true,
    temp: 24.0,
    distance: 8.5,
    accel_x: 0.5,
  },
  {
    id: 3,
    name: "Bus 3 (Static - Aggressive)",
    lat: 37.9829,
    lng: 23.7251,
    speed: 38,
    students: 20,
    smoking: false,
    alcohol: true,
    speeding: false,
    temp: 21.0,
    distance: 200,
    accel_x: 2.5,
  },
  {
    id: 4,
    name: "Bus 4 (Static - Overheat)",
    lat: 37.9851,
    lng: 23.7315,
    speed: 60,
    students: 5,
    smoking: true,
    alcohol: false,
    speeding: false,
    temp: 650,
    distance: 300,
    accel_x: 0.2,
  },
];

export default function Home() {
  const [buses, setBuses] = useState<Bus[]>(initialBuses);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);

  // MQTT Connection Logic
  useEffect(() => {
    const client = mqtt.connect("ws://broker.hivemq.com:8000/mqtt");

    client.on("connect", () => {
      console.log("🌍 Map Component Connected to MQTT Broker");
      client.subscribe("bus_tracker/data");
    });

    client.on("message", (topic, message) => {
      if (topic === "bus_tracker/data") {
        try {
          const payload = JSON.parse(message.toString());

          // 1. Update Map Markers
          setBuses((prevBuses) =>
            prevBuses.map((bus) => {
              if (bus.id === 1) {
                return {
                  ...bus,
                  // FIX: Check for 'gps_lat' first, then 'lat', then fallback
                  lat: payload.gps_lat ?? payload.lat ?? bus.lat,
                  lng: payload.gps_lng ?? payload.lng ?? bus.lng,

                  // FIX: Map 'gps_speed' to 'speed'
                  speed: payload.gps_speed ?? 40,

                  temp: payload.temp ?? bus.temp,
                  students: payload.students ?? bus.students,
                  distance: payload.distance ?? bus.distance,
                  accel_x: payload.accel_x ?? bus.accel_x,
                };
              }
              return bus;
            })
          );

          // 2. Update Popup Info (Apply the same fix here)
          setSelectedBus((prevSelected) => {
            if (prevSelected && prevSelected.id === 1) {
              return {
                ...prevSelected,
                lat: payload.gps_lat ?? payload.lat ?? prevSelected.lat,
                lng: payload.gps_lng ?? payload.lng ?? prevSelected.lng,
                speed: payload.gps_speed ?? prevSelected.speed, // Update speed for popup too
                temp: payload.temp ?? prevSelected.temp,
                students: payload.students ?? prevSelected.students,
                distance: payload.distance ?? prevSelected.distance,
                accel_x: payload.accel_x ?? prevSelected.accel_x,
              };
            }
            return prevSelected;
          });
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
    <div className="font-sans min-h-screen pb-20 gap-16">
      <div className="flex flex-col items-center">
        <h1 className="w-full text-4xl font-bold mb-8 bg-[#58aa32] text-white p-4 text-center">
          Bus Monitor
        </h1>

        <div className="w-5/6 h-80 md:h-100 lg:h-150 bg-gray-200 rounded-md shadow-lg">
          <LoadScript
            googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
          >
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={center}
              zoom={15}
            >
              {buses.map((bus) => (
                <Marker
                  key={bus.id}
                  position={{ lat: bus.lat, lng: bus.lng }}
                  onClick={() => setSelectedBus(bus)}
                />
              ))}

              {selectedBus && (
                <InfoWindow
                  position={{ lat: selectedBus.lat, lng: selectedBus.lng }}
                  onCloseClick={() => setSelectedBus(null)}
                >
                  <div className="p-2 min-w-[150px]">
                    <h2 className="font-bold text-lg mb-2 border-b pb-1">
                      {selectedBus.name}
                    </h2>
                    <p className="text-sm">
                      <strong>Status:</strong>{" "}
                      {selectedBus.speed > 0 ? "Moving" : "Stopped"}
                    </p>
                    <p className="text-sm">
                      <strong>Occupancy:</strong> {selectedBus.students}
                    </p>
                    {(selectedBus.temp > 600 ||
                      selectedBus.distance < 10 ||
                      Math.abs(selectedBus.accel_x) > 2) && (
                      <p className="text-xs font-bold text-red-600 mt-2">
                        ⚠️ WARNINGS ACTIVE
                      </p>
                    )}
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          </LoadScript>
        </div>

        <BusTracker selectedBus={selectedBus} />
      </div>
    </div>
  );
}

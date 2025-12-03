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
import BusList from "./components/BusList";

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
  speeding: boolean;
  temp: number;
  distance: number;
}

// Mock bus data
const initialBuses: Bus[] = [
  {
    id: 1,
    name: "Bus 1",
    lat: 37.9838,
    lng: 23.7275,
    speed: 0,
    students: 10,
    speeding: false,
    temp: 22.5,
    distance: 150,
  },
  {
    id: 2,
    name: "Bus 2",
    lat: 37.9842,
    lng: 23.7298,
    speed: 52,
    students: 15,
    speeding: true,
    temp: 24.0,
    distance: 8.5,
  },
  {
    id: 3,
    name: "Bus 3",
    lat: 37.9829,
    lng: 23.7251,
    speed: 85,
    students: 20,
    speeding: false,
    temp: 21.0,
    distance: 200,
  },
  {
    id: 4,
    name: "Bus 4",
    lat: 37.9851,
    lng: 23.7315,
    speed: 60,
    students: 5,
    speeding: false,
    temp: 650,
    distance: 300,
  },
];

export default function Home() {
  const [buses, setBuses] = useState<Bus[]>(initialBuses);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);

  useEffect(() => {
    const client = mqtt.connect("ws://broker.hivemq.com:8000/mqtt");

    client.on("connect", () => {
      client.subscribe("bus_tracker/data");
    });

    client.on("message", (topic, message) => {
      if (topic === "bus_tracker/data") {
        try {
          const payload = JSON.parse(message.toString());

          setBuses((prevBuses) =>
            prevBuses.map((bus) => {
              if (bus.id === 1) {
                const newBusData = {
                  ...bus,
                  lat: payload.gps_lat ?? bus.lat,
                  lng: payload.gps_lng ?? bus.lng,
                  speed: payload.gps_speed ?? bus.speed,
                  temp: payload.temp ?? bus.temp,
                  students: payload.students ?? bus.students,
                  distance: payload.distance ?? bus.distance,
                };

                setSelectedBus((currentSelected) => {
                  if (currentSelected && currentSelected.id === 1) {
                    return newBusData;
                  }
                  return currentSelected;
                });

                return newBusData;
              }
              return bus;
            })
          );
        } catch (error) {
          console.error("Error:", error);
        }
      }
    });

    return () => {
      if (client.connected) client.end();
    };
  }, []);

  return (
    <div className="font-sans min-h-screen bg-gray-300 flex flex-col">
      {/* Header */}
      <div className="w-full mb-2 bg-gradient-to-r from-green-900 to-emerald-700 text-white p-4 shadow-md flex flex-col md:flex-row items-center justify-center gap-6">
        <h1 className="text-2xl md:text-3xl font-bold text-center">
          Bus Monitor Admin
        </h1>
        <div className="hidden md:block w-1 h-10 bg-gray-200 rounded-full"></div>
        <p className="text-xl font-semibold md:text-2xl text-center">
          Κυβερνοφυσικά Συστήματα
        </p>
      </div>

      <div className="max-w-[95%] mx-auto mt-8 flex-grow w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[650px]">
          <div className="lg:col-span-2 h-full">
            <BusList
              buses={buses}
              selectedBus={selectedBus}
              onSelect={setSelectedBus}
            />
          </div>

          {/* Map */}
          <div className="lg:col-span-7 h-full bg-white rounded-xl shadow-xl overflow-hidden relative">
            <LoadScript
              googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
            >
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={
                  selectedBus
                    ? { lat: selectedBus.lat, lng: selectedBus.lng }
                    : center
                }
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
                      <h2 className="font-bold text-lg text-gray-800">
                        {selectedBus.name}
                      </h2>
                      <p className="text-gray-600">
                        Speed: {selectedBus.speed.toFixed(1)} km/h
                      </p>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            </LoadScript>
          </div>

          {/* Live Info */}
          <div className="lg:col-span-3 h-full">
            <BusTracker selectedBus={selectedBus} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 bg-gradient-to-r from-green-900 to-emerald-700 text-white pt-6 pb-4 shadow-md">
        <div className="max-w-5xl mx-auto text-center space-y-1">
          <p className="text-lg font-bold leading-tight">
            Πανεπιστήμιο Δυτικής Αττικής — Σχολή Μηχανικών, Τμήμα Μηχανικών
            Βιομηχανικής Σχεδίασης και Παραγωγής
          </p>
          <p className="text-base text-emerald-100">
            Μάθημα: Κυβερνοφυσικά Συστήματα (9007) — Απαλλακτική Εργασία
            Εξαμήνου
          </p>
          <p className="text-sm text-emerald-200 font-light">
            Ακαδημαϊκό Έτος: 2025–2026 • Θέμα Εργασίας: Σύστημα Παρακολούθησης
            Σχολικών Λεωφορείων
          </p>
        </div>
      </footer>
    </div>
  );
}

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
  speeding: boolean;
  temp: number;
  distance: number;
  accel_x: number;
}

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
    accel_x: 0.1,
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
    accel_x: 0.5,
  },
  {
    id: 3,
    name: "Bus 3",
    lat: 37.9829,
    lng: 23.7251,
    speed: 38,
    students: 20,
    speeding: false,
    temp: 21.0,
    distance: 200,
    accel_x: 2.5,
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
    accel_x: 0.2,
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
                return {
                  ...bus,
                  lat: payload.gps_lat,
                  lng: payload.gps_lng,
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

          setSelectedBus((prevSelected) => {
            if (prevSelected && prevSelected.id === 1) {
              return {
                ...prevSelected,
                lat: payload.gps_lat ?? prevSelected.lat,
                lng: payload.gps_lng ?? prevSelected.lng,
                speed: payload.gps_speed ?? prevSelected.speed,
                temp: payload.temp ?? prevSelected.temp,
                students: payload.students ?? prevSelected.students,
                distance: payload.distance ?? prevSelected.distance,
                accel_x: payload.accel_x ?? prevSelected.accel_x,
              };
            }
            return prevSelected;
          });
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
                    <h2 className="font-bold text-lg mb-2">
                      {selectedBus.name}
                    </h2>
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

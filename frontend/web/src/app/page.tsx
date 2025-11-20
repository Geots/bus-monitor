"use client";

import { useState } from "react";
import {
  GoogleMap,
  LoadScript,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";

const mapContainerStyle = {
  width: "100%",
  height: "100%",
  borderRadius: "10px",
};

// Center the map (example: Athens)
const center = { lat: 37.9838, lng: 23.7275 };

interface Bus {
  id: number;
  name: string;
  lat: number;
  lng: number;
  speed: number;
  studentsPresent: number;
  smoking: boolean;
  alcohol: boolean;
  speeding: boolean;
}

// Demo buses
const demoBuses = [
  {
    id: 1,
    name: "Bus 1",
    lat: 37.9838,
    lng: 23.7275,
    speed: 45,
    studentsPresent: 10,
    smoking: false,
    alcohol: false,
    speeding: false,
  },
  {
    id: 2,
    name: "Bus 2",
    lat: 37.9842,
    lng: 23.7298,
    speed: 52,
    studentsPresent: 15,
    smoking: false,
    alcohol: false,
    speeding: true,
  },
  {
    id: 3,
    name: "Bus 3",
    lat: 37.9829,
    lng: 23.7251,
    speed: 38,
    studentsPresent: 20,
    smoking: false,
    alcohol: true,
    speeding: false,
  },
  {
    id: 4,
    name: "Bus 4",
    lat: 37.9851,
    lng: 23.7315,
    speed: 60,
    studentsPresent: 20,
    smoking: true,
    alcohol: false,
    speeding: false,
  },
];

export default function Home() {
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [accidentAlert, setAccidentAlert] = useState(false);
  const [smoking, setSmoking] = useState(false);
  const [alcohol, setAlcohol] = useState(false);
  const [speeding, setSpeeding] = useState(false);
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
              zoom={14}
            >
              {demoBuses.map((bus) => (
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
                  <div>
                    <h2 className="font-semibold">{selectedBus.name}</h2>
                    <p>Speed: {selectedBus.speed} km/h</p>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          </LoadScript>
        </div>
        <div className="w-1/2 flex flex-row justify-between min-h-56 mt-8 shadow-lg rounded-md border border-gray-300 p-4">
          <div className="flex flex-col rounded-md items-center gap-4 p-4 px-8">
            <p className="text-xl font-bold text-center underline">
              Selected Bus:
            </p>
            <div className="flex flex-row items-center w-full gap-4">
              <p className="text-lg md:text-xl font-bold text-center">
                Bus Name:
              </p>
              <p className="text-lg md:text-xl font-bold text-center text-[#58aa32]">
                {selectedBus?.name || "No bus selected"}
              </p>
            </div>
            <div className="flex flex-row items-center w-full gap-4">
              <p className="text-lg md:text-xl font-bold text-center">
                Curent Speed:
              </p>
              <p className="text-lg md:text-xl font-bold text-center text-[#58aa32]">
                {selectedBus?.speed || "-"} km/h
              </p>
            </div>
            <div className="flex flex-row items-center w-full gap-4">
              <p className="text-lg md:text-xl font-bold text-center">
                Students Present:
              </p>
              <p className="text-lg md:text-xl font-bold text-center text-[#58aa32]">
                {selectedBus?.studentsPresent || "-"} Students
              </p>
            </div>
          </div>
          <div className="w-px bg-[#3f9c14] p-0.5"></div>
          <div className="flex flex-col rounded-md items-center gap-4 p-4 px-8">
            <p className="text-xl font-bold text-center underline">
              Bus Driver Safety Checks:
            </p>
            <div className="flex flex-row items-center w-full gap-4">
              <p className="text-lg md:text-xl font-bold text-center">
                Smoking:
              </p>
              {selectedBus?.smoking ? (
                <p className="text-lg md:text-xl font-bold text-center text-red-500">
                  Yes
                </p>
              ) : (
                <p className="text-lg md:text-xl font-bold text-center text-[#58aa32]">
                  No
                </p>
              )}
            </div>
            <div className="flex flex-row items-center w-full gap-4">
              <p className="text-lg md:text-xl font-bold text-center">
                Alcohol:
              </p>
              {selectedBus?.alcohol ? (
                <p className="text-lg md:text-xl font-bold text-center text-red-500">
                  Yes
                </p>
              ) : (
                <p className="text-lg md:text-xl font-bold text-center text-[#58aa32]">
                  No
                </p>
              )}
            </div>
            <div className="flex flex-row items-center w-full gap-4">
              <p className="text-lg md:text-xl font-bold text-center">
                Speeding:
              </p>
              {selectedBus?.speeding ? (
                <p className="text-lg md:text-xl font-bold text-center text-red-500">
                  Yes
                </p>
              ) : (
                <p className="text-lg md:text-xl font-bold text-center text-[#58aa32]">
                  No
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between mt-12 gap-4">
          <p className="text-xl font-bold">Test Buttons:</p>
          <div className="flex flex-row items-center justify-between">
            <p className="text-xl font-bold mr-2">Accident Alert:</p>
            <button
              onClick={() => setAccidentAlert(true)}
              className="bg-red-500 text-white px-2 py-1 rounded-md cursor-pointer"
            >
              Alert
            </button>
          </div>
          <div className="flex flex-row items-center justify-between">
            <p className="text-xl font-bold mr-2">Smoking:</p>
            <button
              onClick={() => setSmoking(true)}
              className="bg-green-500 text-white px-2 py-1 rounded-md cursor-pointer"
            >
              Smoke
            </button>
          </div>
          <div className="flex flex-row items-center justify-between">
            <p className="text-xl font-bold mr-2">Alcohol:</p>
            <button
              onClick={() => setAlcohol(true)}
              className="bg-blue-500 text-white px-2 py-1 rounded-md cursor-pointer"
            >
              Drink
            </button>
          </div>
          <div className="flex flex-row items-center justify-between">
            <p className="text-xl font-bold mr-2">Speeding:</p>
            <button
              onClick={() => setSpeeding(true)}
              className="bg-yellow-500 text-white px-2 py-1 rounded-md cursor-pointer"
            >
              Speed
            </button>
          </div>
        </div>
        {accidentAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black opacity-40"></div>
            <div className="relative flex flex-col bg-red-500 text-white px-6 py-4 rounded-md shadow-lg items-center space-x-4">
              <p className="text-lg font-semibold mb-2 underline">
                Accident Alert:
              </p>
              <p className="text-lg font-semibold text-center mb-4">
                An accident has been detected. <br /> Please contact the driver
                and local authorities.
              </p>
              <button
                onClick={() => setAccidentAlert(false)}
                className="bg-white text-red-500 px-3 py-1 rounded-md font-medium hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        )}
        {smoking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black opacity-40"></div>
            <div className="relative flex flex-col bg-red-500 text-white px-6 py-4 rounded-md shadow-lg items-center space-x-4">
              <p className="text-lg font-semibold mb-2 underline">
                Smoking Alert:
              </p>
              <p className="text-lg font-semibold text-center mb-4">
                Smoking has been detected. <br /> Please contact the driver.
              </p>
              <button
                onClick={() => setSmoking(false)}
                className="bg-white text-red-500 px-3 py-1 rounded-md font-medium hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        )}
        {alcohol && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black opacity-40"></div>
            <div className="relative flex flex-col bg-red-500 text-white px-6 py-4 rounded-md shadow-lg items-center space-x-4">
              <p className="text-lg font-semibold mb-2 underline">
                Alcohol Alert:
              </p>
              <p className="text-lg font-semibold text-center mb-4">
                Alcohol has been detected. <br /> Please contact the driver.
              </p>
              <button
                onClick={() => setAlcohol(false)}
                className="bg-white text-red-500 px-3 py-1 rounded-md font-medium hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        )}
        {speeding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black opacity-40"></div>
            <div className="relative flex flex-col bg-red-500 text-white px-6 py-4 rounded-md shadow-lg items-center space-x-4">
              <p className="text-lg font-semibold mb-2 underline">
                Speeding Alert:
              </p>
              <p className="text-lg font-semibold text-center mb-4">
                Speeding has been detected. <br /> Please contact the driver.
              </p>
              <button
                onClick={() => setSpeeding(false)}
                className="bg-white text-red-500 px-3 py-1 rounded-md font-medium hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

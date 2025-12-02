import React from "react";
import { Bus } from "../page";

interface BusListProps {
  buses: Bus[];
  selectedBus: Bus | null;
  onSelect: (bus: Bus) => void;
}

const BusList: React.FC<BusListProps> = ({ buses, selectedBus, onSelect }) => {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="font-bold text-gray-700 text-lg">Bus Fleet</h2>
        <p className="text-sm text-gray-500">{buses.length} Busses</p>
      </div>

      <div className="overflow-y-auto flex-1 p-2 space-y-2">
        {buses.map((bus) => {
          const isSelected = selectedBus?.id === bus.id;
          return (
            <div
              key={bus.id}
              onClick={() => onSelect(bus)}
              className={`cursor-pointer p-4 rounded-lg border transition-all duration-200 ${
                isSelected
                  ? "border-[#58aa32] bg-green-50 shadow-sm"
                  : "border-gray-100 hover:bg-gray-50 hover:border-gray-300"
              }`}
            >
              {/* Bus Name */}
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-gray-800">{bus.name}</span>
              </div>

              <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm text-gray-600">
                {/* Speed */}
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-gray-400 tracking-wider">
                    Speed
                  </span>
                  <span className="font-mono font-medium">
                    {bus.speed.toFixed(1)} km/h
                  </span>
                </div>

                {/* Temp */}
                <div className="flex flex-col text-right">
                  <span className="text-[10px] uppercase text-gray-400 tracking-wider">
                    Temp
                  </span>
                  <span className="font-mono font-medium">{bus.temp}°C</span>
                </div>

                {/* Students */}
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-gray-400 tracking-wider">
                    Students
                  </span>
                  <span className="font-mono font-medium">{bus.students}</span>
                </div>

                {/* Proximity */}
                <div className="flex flex-col text-right">
                  <span className="text-[10px] uppercase text-gray-400 tracking-wider">
                    Proximity
                  </span>
                  <span className="font-mono font-medium">
                    {bus.distance} cm
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BusList;

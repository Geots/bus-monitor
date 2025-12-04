import React from "react";
import { Bus } from "../page";

interface BusTrackerProps {
  selectedBus: Bus | null;
  warningMessage: string | null;
  onDismissWarning: () => void;
}

const BusTracker: React.FC<BusTrackerProps> = ({
  selectedBus,
  warningMessage,
  onDismissWarning,
}) => {
  const THRESHOLD_HEAT = 600.0;
  const THRESHOLD_DIST = 10.0;
  const THRESHOLD_SPEED = 80.0;

  return (
    <div className="bg-gray-50 h-full rounded-xl shadow-xl flex flex-col overflow-hidden relative">
      <header className="p-4 bg-gradient-to-r from-green-900 to-emerald-700 flex justify-between items-center shadow-md shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white">Bus Information</h1>
          <p className="text-sm text-green-100 mt-1">
            Selected:{" "}
            <span className="font-bold text-white">
              {selectedBus?.name || "No Bus Selected"}
            </span>
          </p>
        </div>
      </header>

      <div className="flex flex-col p-4 h-full overflow-y-auto">
        <div className="grid grid-cols-2 gap-3 mb-4 content-start shrink-0">
          {/* Students */}
          <div className="p-4 rounded-xl shadow-sm bg-white text-gray-800 border border-gray-100 flex flex-col justify-center min-h-[120px]">
            <h2 className="text-xs uppercase tracking-wider opacity-60">
              Students
            </h2>
            <div className="text-3xl font-bold mt-2">
              {selectedBus ? selectedBus.students : "-"}
            </div>
          </div>

          {/* Temp */}
          <div
            className={`p-4 rounded-xl shadow-sm border border-gray-100 transition-colors duration-300 flex flex-col justify-center min-h-[120px] ${
              selectedBus && selectedBus.temp > THRESHOLD_HEAT
                ? "bg-red-500 text-white"
                : "bg-white text-gray-800"
            }`}
          >
            <h2 className="text-xs uppercase tracking-wider opacity-60">
              Temperature
            </h2>
            <div className="text-3xl font-bold mt-2">
              {selectedBus ? `${selectedBus.temp}°C` : "-"}
            </div>
          </div>

          {/* Distance */}
          <div
            className={`p-4 rounded-xl shadow-sm border border-gray-100 transition-colors duration-300 flex flex-col justify-center min-h-[120px] ${
              selectedBus && selectedBus.distance <= THRESHOLD_DIST
                ? "bg-red-500 text-white"
                : "bg-white text-gray-800"
            }`}
          >
            <h2 className="text-xs uppercase tracking-wider opacity-60">
              Proximity
            </h2>
            <div className="text-3xl font-bold mt-2">
              {selectedBus ? `${selectedBus.distance} cm` : "-"}
            </div>
          </div>

          {/* Speed */}
          <div
            className={`p-4 rounded-xl shadow-sm border border-gray-100 transition-colors duration-300 flex flex-col justify-center min-h-[120px] ${
              selectedBus && selectedBus.speed >= THRESHOLD_SPEED
                ? "bg-red-500 text-white"
                : "bg-white text-gray-800"
            }`}
          >
            <h2 className="text-xs uppercase tracking-wider opacity-60">
              Speed
            </h2>
            <div className="text-3xl font-bold mt-2">
              {selectedBus ? `${selectedBus.speed.toFixed(0)} km/h` : "-"}
            </div>
          </div>
        </div>

        {/* Warning */}
        {warningMessage && (
          <div className="my-auto mx-auto pt-4 w-[90%]">
            <div className="border border-red-500 rounded-xl overflow-hidden shadow-lg">
              <div className="bg-red-600 p-2 flex items-center justify-center">
                <h2 className="text-md font-bold text-white tracking-widest">
                  Warning - Bus 1
                </h2>
              </div>
              <div className="p-4 text-center">
                <p className="text-gray-900 font-semibold leading-relaxed mb-3">
                  {warningMessage}
                </p>
                <button
                  onClick={onDismissWarning}
                  className="w-[30%] mt-2 cursor-pointer border border-red-500 text-red-500 font-bold py-2 rounded-lg shadow-md text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusTracker;

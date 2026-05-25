import React, { useRef } from 'react';
import map from '../../assets/Tra.png';

const MapCoordinatePicker = ({ x, y, onChange, dayNumber }) => {
  const mapRef = useRef(null);

  const handleMapClick = (e) => {
    const rect = mapRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Map the click coordinates to the 300x450 SVG coordinate system
    const mapX = Math.round((clickX / rect.width) * 300);
    const mapY = Math.round((clickY / rect.height) * 450);

    onChange(mapX, mapY);
  };

  return (
    <div className="space-y-4">
      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 block">
        Route Position (Day {dayNumber})
      </label>
      
      <div className="relative group cursor-crosshair border-2 border-dashed border-gray-200 rounded-3xl p-2 bg-gray-50/50 hover:border-primary/30 transition-colors">
        <div className="relative aspect-[3/4] w-full max-w-[200px] mx-auto overflow-hidden rounded-2xl bg-white shadow-inner" ref={mapRef} onClick={handleMapClick}>
          <img src={map} alt="Sri Lanka Map" className="w-full h-full object-contain opacity-80" />
          
          {/* Grid lines for precision (optional) */}
          <div className="absolute inset-0 grid grid-cols-6 grid-rows-9 opacity-5 pointer-events-none">
            {Array.from({ length: 54 }).map((_, i) => (
              <div key={i} className="border-[0.5px] border-primary"></div>
            ))}
          </div>

          {/* Current Marker */}
          {x !== undefined && y !== undefined && (
            <div 
              className="absolute w-6 h-6 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-xl animate-bounce"
              style={{ 
                left: `${(x / 300) * 100}%`, 
                top: `${(y / 450) * 100}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              {dayNumber}
            </div>
          )}

          {/* Instructions Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none">
            <span className="text-[8px] font-bold text-primary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Click to place marker</span>
          </div>
        </div>
        
        <div className="flex gap-4 justify-center mt-4">
          <div className="bg-white px-3 py-2 rounded-xl border border-gray-100 shadow-sm">
            <span className="text-[10px] text-gray-400 font-bold uppercase mr-2">X:</span>
            <span className="text-sm font-bold text-primary">{x}</span>
          </div>
          <div className="bg-white px-3 py-2 rounded-xl border border-gray-100 shadow-sm">
            <span className="text-[10px] text-gray-400 font-bold uppercase mr-2">Y:</span>
            <span className="text-sm font-bold text-primary">{y}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapCoordinatePicker;

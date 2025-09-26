import React, { useRef } from 'react';
import type { LocationData } from '../types';
import { CameraIcon } from './Icons';

interface LocationCardProps {
  location: LocationData;
  onAddPhoto: (locationName: string, photoData: string) => void;
}

export const LocationCard: React.FC<LocationCardProps> = ({ location, onAddPhoto }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onAddPhoto(location.locationName, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddPhotoClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
      <div className="p-5 bg-slate-800/50 border-b border-slate-700 flex justify-between items-center">
        <h3 className="text-xl font-bold text-cyan-400">{location.locationName}</h3>
        <button
          onClick={handleAddPhotoClick}
          className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
        >
          <CameraIcon className="h-5 w-5" />
          Aggiungi Foto
        </button>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      {location.photos.length > 0 && (
          <div className="p-5">
            <h4 className="font-semibold mb-3 text-slate-300">Foto Allegat:</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {location.photos.map((photo, index) => (
                <div key={index} className="aspect-square rounded-lg overflow-hidden border-2 border-slate-600">
                  <img src={photo} alt={`Foto ${index + 1} per ${location.locationName}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
};

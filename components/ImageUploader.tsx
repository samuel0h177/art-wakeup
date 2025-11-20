import React, { useCallback, useState } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelect: (base64: string, mimeType: string) => void;
  selectedImage: string | null;
  onClear: () => void;
  disabled: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect, selectedImage, onClear, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [onImageSelect]);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Extract base64 data and mime type
      const match = result.match(/^data:(.+);base64,(.+)$/);
      if (match) {
        onImageSelect(match[2], match[1]); // Pass raw base64 and mime
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  if (selectedImage) {
    return (
      <div className="relative w-full h-96 rounded-xl overflow-hidden shadow-xl border border-stone-200 group bg-stone-100">
        <img 
          src={`data:image/jpeg;base64,${selectedImage}`} 
          alt="Selected Art" 
          className="w-full h-full object-contain"
        />
        {!disabled && (
          <button 
            onClick={onClear}
            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors backdrop-blur-md"
          >
            <X size={20} />
          </button>
        )}
        <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/60 text-white text-xs rounded-full backdrop-blur-md">
          Original Artwork
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`
        w-full h-96 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-300
        ${isDragging ? 'border-rose-500 bg-rose-50' : 'border-stone-300 bg-white hover:border-stone-400'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <label className={`flex flex-col items-center justify-center w-full h-full ${!disabled && 'cursor-pointer'}`}>
        <div className={`p-4 rounded-full mb-4 transition-transform duration-300 ${isDragging ? 'bg-rose-100 scale-110' : 'bg-stone-100'}`}>
          {isDragging ? <ImageIcon className="text-rose-500" size={32} /> : <Upload className="text-stone-500" size={32} />}
        </div>
        <p className="text-lg font-medium text-stone-700 mb-2 serif">Upload Artwork</p>
        <p className="text-sm text-stone-500 max-w-xs text-center">
          Drag and drop your painting here, or click to browse.
          <br/><span className="text-xs opacity-70">(JPG, PNG)</span>
        </p>
        <input 
          type="file" 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileChange} 
          disabled={disabled}
        />
      </label>
    </div>
  );
};
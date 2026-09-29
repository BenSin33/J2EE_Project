'use client';
import { X } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#16161a] border border-gray-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="font-bold text-lg text-white">Reader Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 flex flex-col gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Reading Direction</label>
            <div className="grid grid-cols-2 gap-2">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium">Vertical Scroll</button>
              <button className="px-4 py-2 bg-gray-800 text-gray-300 hover:bg-gray-700 rounded-lg font-medium transition">Paged</button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Page Width</label>
            <div className="grid grid-cols-3 gap-2">
              <button className="px-4 py-2 bg-gray-800 text-gray-300 hover:bg-gray-700 rounded-lg font-medium transition">Fit Content</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium">Fit Screen</button>
              <button className="px-4 py-2 bg-gray-800 text-gray-300 hover:bg-gray-700 rounded-lg font-medium transition">Original</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

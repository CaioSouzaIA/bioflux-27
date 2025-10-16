
import React from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Moon, Sun } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`relative inline-flex items-center w-16 h-8 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1f1f1f] ${
        theme === 'dark' 
          ? 'bg-gray-800 border-2 border-gray-600' 
          : 'bg-gray-200 border-2 border-gray-300'
      }`}
    >
      {/* Switch Circle */}
      <div
        className={`absolute w-6 h-6 rounded-full transition-transform duration-300 flex items-center justify-center ${
          theme === 'dark'
            ? 'transform translate-x-8 bg-white'
            : 'transform translate-x-1 bg-white'
        }`}
      >
        {theme === 'dark' ? (
          <Moon className="w-4 h-4 text-gray-800" />
        ) : (
          <Sun className="w-4 h-4 text-gray-800" />
        )}
      </div>
    </button>
  );
};

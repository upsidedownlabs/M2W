'use client'
import React, { useState } from 'react';
import { Utensils, Users, Droplets, Bath, Navigation, Sun, Moon, Wifi, WifiOff, Zap, HelpCircle } from 'lucide-react';

interface Option {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  lightColor: string;
}

const CommunicationInterface: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  const options: Option[] = [
    { 
      id: 'food', 
      label: 'Food', 
      icon: <Utensils size={52} strokeWidth={1.5} />, 
      color: 'bg-orange-500',
      lightColor: 'bg-orange-400'
    },
    { 
      id: 'meet', 
      label: 'Meet Someone', 
      icon: <Users size={52} strokeWidth={1.5} />, 
      color: 'bg-blue-500',
      lightColor: 'bg-blue-400'
    },
    { 
      id: 'washroom', 
      label: 'Washroom', 
      icon: <Navigation size={52} strokeWidth={1.5} />, 
      color: 'bg-purple-500',
      lightColor: 'bg-purple-400'
    },
    { 
      id: 'water', 
      label: 'Water', 
      icon: <Droplets size={52} strokeWidth={1.5} />, 
      color: 'bg-cyan-500',
      lightColor: 'bg-cyan-400'
    },
    { 
      id: 'bath', 
      label: 'Bath', 
      icon: <Bath size={52} strokeWidth={1.5} />, 
      color: 'bg-green-500',
      lightColor: 'bg-green-400'
    }
  ];

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Enhanced theme classes with glassmorphism
  const themeClasses = {
    background: isDarkMode 
      ? 'bg-slate-900' 
      : 'bg-gray-50',
    text: isDarkMode ? 'text-white' : 'text-slate-800',
    cardBg: isDarkMode 
      ? 'bg-white/10 backdrop-blur-xl border-white/20' 
      : 'bg-white/70 backdrop-blur-xl border-white/30 shadow-xl',
    cardHover: isDarkMode 
      ? 'hover:bg-white/20 hover:border-white/30' 
      : 'hover:bg-white/80 hover:border-white/50',
    textSecondary: isDarkMode ? 'text-slate-300' : 'text-slate-600',
    textMuted: isDarkMode ? 'text-slate-400' : 'text-slate-500',
    glassBg: isDarkMode 
      ? 'bg-white/5 backdrop-blur-2xl border border-white/10' 
      : 'bg-white/60 backdrop-blur-2xl border border-white/20 shadow-lg'
  };

  return (
    <div className={`min-h-screen p-4 md:p-6 transition-all duration-700 ${themeClasses.background} ${themeClasses.text} relative overflow-hidden`}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full ${isDarkMode ? 'bg-purple-500/20' : 'bg-blue-200/30'} blur-3xl animate-pulse`}></div>
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full ${isDarkMode ? 'bg-blue-500/20' : 'bg-purple-200/30'} blur-3xl animate-pulse`} style={{animationDelay: '2s'}}></div>
        <div className={`absolute top-1/2 left-1/2 w-60 h-60 rounded-full ${isDarkMode ? 'bg-pink-500/10' : 'bg-pink-200/20'} blur-3xl animate-pulse`} style={{animationDelay: '4s'}}></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Modern Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
          
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-purple-400">
                M2w
              </h1>
              <p className={`text-sm ${themeClasses.textMuted} font-medium`}>
                Assistive Communication
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-3 rounded-2xl ${themeClasses.glassBg} hover:scale-110 transition-all duration-300 group`}
            >
              {isDarkMode ? 
                <Sun size={20} className="text-yellow-400 group-hover:rotate-180 transition-transform duration-500" /> : 
                <Moon size={20} className="text-slate-600 group-hover:rotate-180 transition-transform duration-500" />
              }
            </button>

            {/* Connection Status */}
            <div className={`flex items-center space-x-3 px-4 py-3 rounded-2xl ${themeClasses.glassBg} ring-2 ring-red-400/50 transition-all duration-300`}>
              <div className="relative">
                <WifiOff size={20} className="text-red-400" />
              </div>
              <span className="font-semibold text-sm">
                Disconnected
              </span>
            </div>
            
            <button
              className="px-6 py-3 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 active:scale-95 bg-green-500 text-white shadow-lg hover:shadow-green-500/25"
            >
              Connect
            </button>
          </div>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-6xl mx-auto">
          {options.map((option) => {
            return (
              <div
                key={option.id}
                className={`
                  relative group cursor-pointer transition-all duration-500 transform
                  ${themeClasses.cardBg} ${themeClasses.cardHover} hover:scale-105 hover:shadow-2xl
                  rounded-3xl p-6 md:p-8
                `}
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className={`
                    p-4 rounded-2xl transition-all duration-500 group-hover:rotate-12
                    ${isDarkMode ? 'bg-white/10 backdrop-blur-sm' : 'bg-white/50 backdrop-blur-sm'}
                  `}>
                    <div className={`transition-all duration-300 ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>
                      {option.icon}
                    </div>
                  </div>
                  
                  <h3 className="text-lg md:text-xl font-bold text-center transition-all duration-300">
                    {option.label}
                  </h3>
                </div>
              </div>
            );
          })}
        </div>

        {/* Instructions */}
        <div className="mt-30 text-center">
          <h3 className={`text-xl font-bold mb-6 ${themeClasses.textSecondary}`}>
            How It Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { step: '01', title: 'Connect', desc: 'Connect to the NeuralHelp.', color: 'bg-blue-500' },
              { step: '02', title: 'Activate Menu', desc: 'Double blink to activate the menu.', color: 'bg-purple-500' },
              { step: '03', title: 'Switch Option', desc: 'Double blink to switch between the options.', color: 'bg-yellow-500' },
              { step: '04', title: 'Select', desc: 'Focus to choose the selected option.', color: 'bg-pink-500' }
            ].map((item, index) => (
              <div key={index} className={`${themeClasses.glassBg} p-6 rounded-3xl group hover:scale-105 transition-all duration-300`}>
                <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center mb-4 mx-auto group-hover:rotate-12 transition-transform duration-300`}>
                  <span className="text-white font-black text-lg">{item.step}</span>
                </div>
                <div className="font-bold text-lg mb-2">{item.title}</div>
                <div className={`text-sm ${themeClasses.textMuted}`}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunicationInterface;
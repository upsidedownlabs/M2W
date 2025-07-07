'use client'
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Utensils, Users, Droplets, Navigation, Sun, Moon, WifiOff, HelpCircle } from 'lucide-react';

interface Option {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  lightColor: string;
  soundFile: string;
}
// Define types for Bluetooth objects
interface BluetoothDevice extends EventTarget {
  gatt?: BluetoothRemoteGATTServer;
}
declare global {
  interface Navigator {
    bluetooth: {
      requestDevice(options: {
        filters: Array<{ name?: string }>;
        optionalServices?: string[];
      }): Promise<BluetoothDevice>;
    };
  }
}
interface BluetoothRemoteGATTServer {
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  connected: boolean;
  getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
}

interface BluetoothRemoteGATTService {
  getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTCharacteristic extends EventTarget {
  startNotifications(): Promise<void>;
  stopNotifications(): Promise<void>;
  readValue(): Promise<DataView>;
  value?: DataView;
}
const CommunicationInterface: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [activeSelection, setActiveSelection] = useState<string | null>(null);
  const [currentMenuIndex, setCurrentMenuIndex] = useState(0);
  const [menuActive, setMenuActive] = useState(false);

  // Memoize options to prevent unnecessary re-renders
  const options: Option[] = useMemo(() => [
    {
      id: 'food',
      label: 'Food',
      icon: <Utensils size={52} strokeWidth={1.5} />,
      color: 'bg-orange-500',
      lightColor: 'bg-orange-400',
      soundFile: 'food.mp3'
    },
    {
      id: 'help',
      label: 'Help',
      icon: <HelpCircle size={52} strokeWidth={1.5} />,
      color: 'bg-red-500',
      lightColor: 'bg-red-400',
      soundFile: 'help.mp3'
    },
    {
      id: 'outing',
      label: 'Outing',
      icon: <Users size={52} strokeWidth={1.5} />,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-400',
      soundFile: 'outing.mp3'
    },
    {
      id: 'television',
      label: 'Television',
      icon: <div className="text-4xl">📺</div>,
      color: 'bg-indigo-500',
      lightColor: 'bg-indigo-400',
      soundFile: 'television.mp3'
    },
    {
      id: 'washroom',
      label: 'Washroom',
      icon: <Navigation size={52} strokeWidth={1.5} />,
      color: 'bg-purple-500',
      lightColor: 'bg-purple-400',
      soundFile: 'washroom.mp3'
    },
    {
      id: 'water',
      label: 'Water',
      icon: <Droplets size={52} strokeWidth={1.5} />,
      color: 'bg-cyan-500',
      lightColor: 'bg-cyan-400',
      soundFile: 'water.mp3'
    }
  ], []);

  const playSound = useCallback((soundFile: string) => {
    try {
      const audio = new Audio(`./sounds/${soundFile}`);
      audio.volume = 0.7;
      audio.play().catch(error => {
        console.log('Audio play failed:', error);
      });
    } catch (error) {
      console.log('Audio creation failed:', error);
    }
  }, []);
  const handleNotifications = useCallback((event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const value = target.value;
    if (!value) return;

    // Convert DataView to Uint8Array
    const data = new Uint8Array(value.buffer);

    // Handle different notification types based on your ESP32 code
    if (data.length === 1) {
      // Menu state change (0 = off, 127 = timeout)
      if (data[0] === 0) {
        // Menu activated
        setMenuActive(true);
        setCurrentMenuIndex(1); // Start with first option
        setActiveSelection(null);
      } else if (data[0] === 127) {
        // Menu timed out
        setMenuActive(false);
        setCurrentMenuIndex(0);
        setActiveSelection(null);
      }
    } else if (data.length === 2) {
      // Menu selection change
      if (data[0] === 'S'.charCodeAt(0)) {
        // 'S' for selection change
        const newIndex = data[1];
        setMenuActive(true);
        setCurrentMenuIndex(newIndex);
        setActiveSelection(null); // Clear active selection when navigating
        // Play navigation tone with pitch based on position
      } else if (data[0] === 'A'.charCodeAt(0)) {
        // 'A' for activation/selection
        const selectedIndex = data[1];
        if (selectedIndex > 0 && selectedIndex <= options.length) {
          const optionId = options[selectedIndex - 1].id;
          setSelectedOption(optionId);
          setActiveSelection(optionId); // Set as active selection
          playSound(options[selectedIndex - 1].soundFile); // Play the full sound file
          // Reset after sound plays (optional)
          setTimeout(() => {
            setActiveSelection(null);
          }, 3000);
        }
      }
    }
  }, [options, playSound]);


  // Handle menu index changes
  useEffect(() => {
    if (menuActive && currentMenuIndex > 0 && currentMenuIndex <= options.length) {
      // Highlight the current menu option
      const optionId = options[currentMenuIndex - 1].id;
      setSelectedOption(optionId);
      playSound("select.mp3");
    } else if (!menuActive) {
      setSelectedOption(null);
    }
  }, [currentMenuIndex, menuActive, options, playSound]);

  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const connectedDeviceRef = useRef<BluetoothDevice | null>(null);

  // Then modify your connection handling code
  const connectToDevice = useCallback(async () => {
    try {
      setIsConnecting(true);
      setConnectionError(null);

      if (!navigator.bluetooth || !navigator.bluetooth.requestDevice) {
        throw new Error('Web Bluetooth not supported');
      }

      console.log('Requesting Bluetooth Device...');
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ name: 'ESP32C6_EEG' }],
        optionalServices: ['6910123a-eb0d-4c35-9a60-bebe1dcb549d']
      }) as BluetoothDevice;

      connectedDeviceRef.current = device;

      if (!device.gatt) {
        throw new Error('Bluetooth device does not support GATT');
      }

      device.addEventListener('gattserverdisconnected', handleDisconnection);

      console.log('Connecting to GATT Server...');
      const server = await device.gatt.connect();

      console.log('Getting Service...');
      const service = await server.getPrimaryService('6910123a-eb0d-4c35-9a60-bebe1dcb549d');

      console.log('Getting Characteristic...');
      const characteristic = await service.getCharacteristic('5f4f1107-7fc1-43b2-a540-0aa1a9f1ce78');

      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', handleNotifications);

      setDevice(device);
      setIsConnected(true);
      setIsConnecting(false);

      console.log('Successfully connected');
      return true;
    } catch (error) {
      console.error('Connection failed:', error);
      setIsConnecting(false);
      setIsConnected(false);
      setConnectionError(error instanceof Error ? error.message : 'Connection failed');
      return false;
    }
  }, [handleNotifications]);
  // Simplified disconnection handler - no reconnection attempts
  const handleDisconnection = useCallback(() => {
    console.log('Device disconnected');
    setIsConnected(false);
    setMenuActive(false);
    setCurrentMenuIndex(0);
    // No reconnection logic here
  }, []);

  // Disconnect function remains similar but without reconnection concerns
  const disconnectDevice = useCallback(async () => {
    try {
      if (!connectedDeviceRef.current) {
        console.log("No connected device to disconnect.");
        return;
      }

      const server = connectedDeviceRef.current.gatt;
      if (!server) {
        return;
      }

      if (!server.connected) {
        connectedDeviceRef.current = null;
        setIsConnected(false);
        return;
      }

      // Add await to these asynchronous operations
      const service = await server.getPrimaryService("6910123a-eb0d-4c35-9a60-bebe1dcb549d");
      const dataChar = await service.getCharacteristic("5f4f1107-7fc1-43b2-a540-0aa1a9f1ce78");

      await dataChar.stopNotifications();
      dataChar.removeEventListener("characteristicvaluechanged", handleNotifications);

      server.disconnect();
    } catch (error) {
      console.error("Error during disconnection:", error);
    } finally {
      setDevice(null);
      setIsConnected(false);
      setIsConnecting(false);
      setMenuActive(false);
      setCurrentMenuIndex(0);
    }
  }, [handleNotifications]);
  const toggleConnection = async () => {
    if (isConnected) {
      disconnectDevice();
    } else {
      await connectToDevice();
    }
  };

  // Update the connection status UI to show connecting state
  const connectionStatusText = () => {
    if (isConnected) return 'Connected';
    if (device && !isConnected) return 'Connecting...';
    return 'Disconnected';
  };

  const connectionStatusIcon = () => {
    if (isConnected) return <WifiOff size={20} className="text-green-400" />;
    if (device && !isConnected) return <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />;
    return <WifiOff size={20} className="text-red-400" />;
  };

  const handleOptionClick = (option: Option) => {
    if (!isConnected) {
      alert('Please connect first!');
      return;
    }

    setSelectedOption(selectedOption === option.id ? null : option.id);
    playSound(option.soundFile);
  };

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
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full ${isDarkMode ? 'bg-blue-500/20' : 'bg-purple-200/30'} blur-3xl animate-pulse`} style={{ animationDelay: '2s' }}></div>
        <div className={`absolute top-1/2 left-1/2 w-60 h-60 rounded-full ${isDarkMode ? 'bg-pink-500/10' : 'bg-pink-200/20'} blur-3xl animate-pulse`} style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Modern Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-purple-400">
                M2W
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
            <div className={`flex items-center space-x-3 px-4 py-3 rounded-2xl ${themeClasses.glassBg} ring-2 ${isConnected ? 'ring-green-400/50' : device && !isConnected ? 'ring-blue-400/50' : 'ring-red-400/50'} transition-all duration-300`}>
              <div className="relative">
                {connectionStatusIcon()}
              </div>
              <span className="font-semibold text-sm">
                {connectionStatusText()}
              </span>
              {menuActive && (
                <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded-full">
                  Menu Active
                </span>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={toggleConnection}
                disabled={isConnecting}
                className={`px-6 py-3 rounded-2xl font-bold transition-all ${isConnected
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-green-500 hover:bg-green-600'
                  } text-white shadow-lg ${isConnecting ? 'opacity-75' : ''}`}
              >
                {isConnecting ? (
                  <span className="flex items-center">
                    <span className="animate-spin mr-2">↻</span>
                    Connecting...
                  </span>
                ) : isConnected ? (
                  'Disconnect'
                ) : (
                  'Connect'
                )}
              </button>

              {connectionError && (
                <div className="text-red-500 text-sm max-w-xs">
                  {connectionError}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 max-w-7xl mx-auto">
          {options.map((option, index) => {
            const isSelected = selectedOption === option.id;
            const isCurrentMenuOption = menuActive && currentMenuIndex === index + 1;

            return (
              <div
                key={option.id}
                onClick={() => handleOptionClick(option)}
                className={`
                  relative group cursor-pointer transition-all duration-500 transform
                  ${themeClasses.cardBg} ${themeClasses.cardHover} hover:scale-105 hover:shadow-2xl
                  rounded-3xl p-6 md:p-8 border-2
                  ${isSelected ? 'border-green-400 bg-green-500/20 scale-105' : 'border-transparent'}
                  ${isCurrentMenuOption ? 'ring-4 ring-purple-400/50' : ''}
                  ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}
                     ${activeSelection === option.id ? '!bg-green-500/30 border-green-400 scale-105' : ''}
              ${isCurrentMenuOption ? 'ring-4 ring-purple-400/50' : ''}
                `}
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className={`
                    p-4 rounded-2xl transition-all duration-500 group-hover:rotate-12
                    ${isDarkMode ? 'bg-white/10 backdrop-blur-sm' : 'bg-white/50 backdrop-blur-sm'}
                    ${isSelected ? 'bg-green-400/30' : ''}
                    ${isCurrentMenuOption ? 'bg-purple-400/30' : ''}
                    
                  `}>
                    <div className={`transition-all duration-300 ${isDarkMode ? 'text-white' : 'text-slate-700'} ${isSelected ? 'text-green-400' : ''} ${isCurrentMenuOption ? 'text-purple-400' : ''}`}>
                      {option.icon}
                    </div>
                  </div>

                  <h3 className={`text-lg md:text-xl font-bold text-center transition-all duration-300 ${isSelected ? 'text-green-400' : ''} ${isCurrentMenuOption ? 'text-purple-400' : ''}`}>
                    {option.label}
                  </h3>

                  {isSelected && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center animate-pulse">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  )}

                  {isCurrentMenuOption && !isSelected && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-400 rounded-full flex items-center justify-center animate-pulse">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Instructions */}
        <div className="mt-6 sm:mt-5 md:mt-50 text-center">
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
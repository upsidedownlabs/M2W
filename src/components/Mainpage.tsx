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
            icon: <div className="text-2xl sm:text-3xl lg:text-4xl">📺</div>,
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
        <div className={`min-h-screen min-w-full flex flex-col transition-all duration-700 ${themeClasses.background} ${themeClasses.text} relative overflow-hidden`}>
            {/* Animated background elements - made responsive */}
            <div className="absolute inset-0 overflow-hidden">
                <div className={`absolute -top-20 -right-20 sm:-top-40 sm:-right-40 w-40 h-40 sm:w-80 sm:h-80 rounded-full ${isDarkMode ? 'bg-purple-500/20' : 'bg-blue-200/30'} blur-3xl animate-pulse`}></div>
                <div className={`absolute -bottom-20 -left-20 sm:-bottom-40 sm:-left-40 w-40 h-40 sm:w-80 sm:h-80 rounded-full ${isDarkMode ? 'bg-blue-500/20' : 'bg-purple-200/30'} blur-3xl animate-pulse`} style={{ animationDelay: '2s' }}></div>
                <div className={`absolute top-1/2 left-1/2 w-30 h-30 sm:w-60 sm:h-60 rounded-full ${isDarkMode ? 'bg-pink-500/10' : 'bg-pink-200/20'} blur-3xl animate-pulse`} style={{ animationDelay: '4s' }}></div>
            </div>

            {/* Main content container with proper flexbox layout */}
            <div className="flex-1 flex flex-col px-2 py-2 sm:px-4 sm:py-4 md:px-6 md:py-6 lg:px-8 lg:py-8 xl:px-12 xl:py-12 max-w-full relative z-10">

                {/* Improved Responsive Header - better height and spacing */}
                <div className="flex flex-col gap-4 sm:gap-5 md:gap-6 lg:flex-row lg:justify-between lg:items-center mb-6 sm:mb-8 lg:mb-12">

                    {/* Left section - Logo and title */}
                    <div className="flex items-center space-x-3 sm:space-x-4 md:space-x-5 min-h-[60px] sm:min-h-[70px] md:min-h-[80px] lg:min-h-[90px]">
                        <div className="flex flex-col justify-center">
                            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-purple-400 leading-none">
                                M2W
                            </h1>
                            <p className={`text-sm sm:text-base md:text-lg lg:text-xl ${themeClasses.textMuted} mt-1`}>
                                Assistive Communication
                            </p>
                        </div>
                    </div>

                    {/* Right section - Controls with improved responsive layout */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 md:gap-5 lg:gap-6 min-h-[60px] sm:min-h-[70px] md:min-h-[80px] lg:min-h-[90px]">

                        {/* Top row for mobile, inline for larger screens */}
                        <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-4">

                            {/* Theme Toggle - improved sizing */}
                            <button
                                onClick={toggleTheme}
                                className={`p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl ${themeClasses.glassBg} hover:scale-110 active:scale-95 transition-all duration-300 group flex-shrink-0`}
                                aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                            >
                                {isDarkMode ?
                                    <Sun size={20} className="sm:w-6 sm:h-6 md:w-7 md:h-7 text-yellow-400 group-hover:rotate-180 transition-transform duration-500" /> :
                                    <Moon size={20} className="sm:w-6 sm:h-6 md:w-7 md:h-7 text-slate-600 group-hover:rotate-180 transition-transform duration-500" />
                                }
                            </button>

                            {/* Connection Status - improved responsive design */}
                            <div className={`flex items-center space-x-2 sm:space-x-3 md:space-x-4 px-4 sm:px-5 md:px-6 py-3 sm:py-4 md:py-5 rounded-xl sm:rounded-2xl ${themeClasses.glassBg}
                ring-2 ${isConnected ? 'ring-green-400/50' :
                                    device && !isConnected ? 'ring-blue-400/50' : 'ring-red-400/50'}
                text-sm sm:text-base md:text-lg min-w-0 flex-1 sm:flex-initial`}>

                                <div className="relative flex-shrink-0">
                                    {connectionStatusIcon()}
                                </div>

                                <span className="font-semibold truncate">
                                    {connectionStatusText()}
                                </span>

                                {menuActive && (
                                    <span className="text-xs sm:text-sm bg-purple-500 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full whitespace-nowrap flex-shrink-0">
                                        Menu Active
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Bottom row for mobile, inline for larger screens */}
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">

                            {/* Connection Button - improved sizing and responsiveness */}
                            <button
                                onClick={toggleConnection}
                                disabled={isConnecting}
                                className={`px-6 sm:px-7 md:px-8 lg:px-10 py-3 sm:py-4 md:py-5 rounded-xl sm:rounded-2xl font-semibold transition-all text-sm sm:text-base md:text-lg
                  ${isConnected ? 'bg-red-500 hover:bg-red-600 active:bg-red-700' : 'bg-green-500 hover:bg-green-600 active:bg-green-700'}
                  text-white shadow-lg hover:shadow-xl active:shadow-md
                  ${isConnecting ? 'opacity-75 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
                  transition-all duration-200 flex-shrink-0 min-h-[48px] sm:min-h-[56px] md:min-h-[64px]`}
                                aria-label={isConnected ? 'Disconnect device' : 'Connect device'}
                            >
                                {isConnecting ? (
                                    <span className="flex items-center justify-center">
                                        <span className="animate-spin mr-2 sm:mr-3">↻</span>
                                        <span className="hidden xs:inline">Connecting...</span>
                                        <span className="xs:hidden">...</span>
                                    </span>
                                ) : isConnected ? (
                                    'Disconnect'
                                ) : (
                                    'Connect'
                                )}
                            </button>
                        </div>

                        {/* Connection Error - improved positioning */}
                        {connectionError && (
                            <div className="text-red-500 text-sm sm:text-base bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg border border-red-200 dark:border-red-800 max-w-xs sm:max-w-sm break-words">
                                <span className="font-medium">Error: </span>
                                {connectionError}
                            </div>
                        )}
                    </div>
                </div>

                {/* Options Grid - fully responsive for all screen sizes and zoom levels */}
                <div className="flex-shrink-0 mb-4 sm:mb-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4 lg:gap-5 xl:gap-6 max-w-full">
                        {options.map((option, index) => {
                            const isSelected = selectedOption === option.id;
                            const isCurrentMenuOption = menuActive && currentMenuIndex === index + 1;

                            return (
                                <div
                                    key={option.id}
                                    onClick={() => handleOptionClick(option)}
                                    className={`
                    aspect-square w-full h-full
                    max-h-32 sm:max-h-40 md:max-h-48 lg:max-h-56 xl:max-h-64
                    relative group cursor-pointer transition-all duration-500
                    ${themeClasses.cardBg} ${themeClasses.cardHover}
                    rounded-lg sm:rounded-xl p-1.5 sm:p-2 md:p-3 border-2
                    ${isSelected ? 'border-green-400 bg-green-500/20' : 'border-transparent'}
                    ${isCurrentMenuOption ? 'ring-2 ring-purple-400/50' : ''}
                    ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}
                    ${activeSelection === option.id ? '!bg-green-500/30 border-green-400 scale-105' : ''}
                    hover:scale-105 active:scale-95
                  `}
                                >
                                    <div className="flex flex-col items-center justify-center h-full space-y-1">
                                        <div className={`
                      p-1 sm:p-1.5 md:p-2 rounded-md sm:rounded-lg transition-all duration-500 group-hover:rotate-12
                      ${isDarkMode ? 'bg-white/10 backdrop-blur-sm' : 'bg-white/50 backdrop-blur-sm'}
                      ${isSelected ? 'bg-green-400/30' : ''}
                      ${isCurrentMenuOption ? 'bg-purple-400/30' : ''}
                    `}>
                                            <div className={`transition-all duration-300 ${isDarkMode ? 'text-white' : 'text-slate-700'} ${isSelected ? 'text-green-400' : ''} ${isCurrentMenuOption ? 'text-purple-400' : ''}`}>
                                                {React.isValidElement(option.icon) && typeof option.icon.type === "function"
                                                    ? React.cloneElement(option.icon as React.ReactElement<any>, {
                                                        size: undefined,
                                                        className: "w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-10 lg:h-10"
                                                    })
                                                    : option.icon}
                                            </div>
                                        </div>
                                        <h3 className={`
                     text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl
                     font-bold text-center transition-all duration-300 leading-tight
                     ${isSelected ? 'text-green-400' : ''} ${isCurrentMenuOption ? 'text-purple-400' : ''}
                         `}>
                                            {option.label}
                                        </h3>

                                        {isSelected && (
                                            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 sm:w-4 sm:h-4 bg-green-400 rounded-full flex items-center justify-center animate-pulse">
                                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"></div>
                                            </div>
                                        )}

                                        {isCurrentMenuOption && !isSelected && (
                                            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 sm:w-4 sm:h-4 bg-purple-400 rounded-full flex items-center justify-center animate-pulse">
                                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Spacer to push instructions to bottom */}
                <div className="flex-grow"></div>

                {/* Instructions section - positioned at bottom */}
                <div className="flex-shrink-0 mt-auto pb-2 sm:pb-4">
                    <div className="text-center">
                        <h3 className={`text-base sm:text-lg md:text-xl lg:text-2xl font-bold mb-3 sm:mb-4 md:mb-6 ${themeClasses.textSecondary}`}>
                            How It Works
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 max-w-full">
                            {[
                                { step: '01', title: 'Connect', desc: 'Connect to the NeuralHelp.', color: 'bg-blue-500' },
                                { step: '02', title: 'Activate Menu', desc: 'Double blink to activate the menu.', color: 'bg-purple-500' },
                                { step: '03', title: 'Switch Option', desc: 'Double blink to switch between the options.', color: 'bg-yellow-500' },
                                { step: '04', title: 'Select', desc: 'Triple blink to choose the selected option.', color: 'bg-pink-500' }
                            ].map((item, index) => (
                                <div
                                    key={index}
                                    className={`${themeClasses.glassBg} w-full h-24 sm:h-28 md:h-32 lg:h-36
                      p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl 
                      group hover:scale-105 transition-all duration-300 flex flex-col justify-center`}
                                >
                                    <div className={`w-8 h-20 sm:w-10 sm:h-32 md:w-12 md:h-18 lg:w-14 lg:h-28 rounded-xl ${item.color} flex items-center justify-center mb-2 sm:mb-3 mx-auto group-hover:rotate-12 transition-transform duration-300`}>
                                        <span className="text-white font-black text-sm sm:text-base md:text-lg">{item.step}</span>
                                    </div>
                                    <div className="font-bold text-sm sm:text-base md:text-lg mb-1 sm:mb-2">{item.title}</div>
                                    <div className={`text-xs sm:text-sm md:text-base ${themeClasses.textMuted} leading-relaxed`}>{item.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommunicationInterface;
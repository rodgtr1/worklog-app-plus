import { useState, useEffect, useRef } from "react";

function Timer() {
  const [duration, setDuration] = useState(25); // Default 25 minutes (Pomodoro)
  const [timeLeft, setTimeLeft] = useState(25 * 60); // In seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [soundOption, setSoundOption] = useState<'gentle' | 'chime' | 'ding' | 'success' | 'none'>('gentle');
  const [twoMinuteWarningShown, setTwoMinuteWarningShown] = useState(false);
  const [oneMinuteWarningShown, setOneMinuteWarningShown] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const playAlertSound = () => {
    if (soundOption === 'none') return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      if (soundOption === 'gentle') {
        // Gentle bell - soft sine wave with fade
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 1);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 1);
        
      } else if (soundOption === 'chime') {
        // Pleasant chime - multiple harmonious tones
        const playTone = (freq: number, delay: number, duration: number) => {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          
          osc.connect(gain);
          gain.connect(audioContext.destination);
          
          osc.frequency.value = freq;
          osc.type = 'sine';
          
          const startTime = audioContext.currentTime + delay;
          gain.gain.setValueAtTime(0.2, startTime);
          gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
          
          osc.start(startTime);
          osc.stop(startTime + duration);
        };
        
        // Play harmonious chord
        playTone(523.25, 0, 0.8);    // C5
        playTone(659.25, 0.1, 0.8);  // E5  
        playTone(783.99, 0.2, 0.8);  // G5
        
      } else if (soundOption === 'ding') {
        // Simple ding - quick bright tone
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 1200;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
        
      } else if (soundOption === 'success') {
        // Success melody - upward progression
        const playNote = (freq: number, start: number, duration: number) => {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          
          osc.connect(gain);
          gain.connect(audioContext.destination);
          
          osc.frequency.value = freq;
          osc.type = 'triangle';
          
          const startTime = audioContext.currentTime + start;
          gain.gain.setValueAtTime(0.25, startTime);
          gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
          
          osc.start(startTime);
          osc.stop(startTime + duration);
        };
        
        // Happy ascending melody
        playNote(523.25, 0, 0.15);    // C5
        playNote(659.25, 0.1, 0.15);  // E5
        playNote(783.99, 0.2, 0.15);  // G5
        playNote(1046.50, 0.3, 0.4);  // C6
      }
      
    } catch (error) {
      console.log('Web Audio API failed:', error);
    }
  };

  const playWarningSound = (count: number) => {
    if (soundOption === 'none') return;
    
    const playSound = () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        if (soundOption === 'gentle') {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.5);
          
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.5);
          
        } else if (soundOption === 'chime') {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          
          osc.connect(gain);
          gain.connect(audioContext.destination);
          
          osc.frequency.value = 523.25; // C5
          osc.type = 'sine';
          
          gain.gain.setValueAtTime(0.15, audioContext.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
          
          osc.start(audioContext.currentTime);
          osc.stop(audioContext.currentTime + 0.4);
          
        } else if (soundOption === 'ding') {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = 1000;
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.2);
          
        } else if (soundOption === 'success') {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          
          osc.connect(gain);
          gain.connect(audioContext.destination);
          
          osc.frequency.value = 659.25; // E5
          osc.type = 'triangle';
          
          gain.gain.setValueAtTime(0.15, audioContext.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          
          osc.start(audioContext.currentTime);
          osc.stop(audioContext.currentTime + 0.3);
        }
        
      } catch (error) {
        console.log('Warning audio failed:', error);
      }
    };

    // Play the sound 'count' number of times
    for (let i = 0; i < count; i++) {
      setTimeout(() => playSound(), i * 400);
    }
  };

  const sendWarningNotification = async (timeRemaining: number) => {
    const minutes = Math.floor(timeRemaining / 60);
    const title = `${minutes} Minute${minutes > 1 ? 's' : ''} Remaining`;
    const body = minutes === 2 
      ? 'Start wrapping up your current task.' 
      : 'Final minute - time to finish up!';

    try {
      // Try Tauri notification first (better desktop integration)
      const { sendNotification } = await import('@tauri-apps/api/notification');
      await sendNotification({
        title: `⏰ ${title}`,
        body: body,
      });
    } catch (error) {
      // Fallback to browser notification
      if (Notification.permission === 'granted') {
        new Notification(`⏰ ${title}`, {
          body: body,
          icon: '⏰'
        });
      }
    }
  };

  // Update timeLeft when duration changes
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(duration * 60);
      setIsCompleted(false);
      setTwoMinuteWarningShown(false);
      setOneMinuteWarningShown(false);
    }
  }, [duration, isRunning]);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          // Check for 2-minute warning
          if (prev === 121 && !twoMinuteWarningShown) {
            setTwoMinuteWarningShown(true);
            playWarningSound(1);
            sendWarningNotification(120);
          }
          
          // Check for 1-minute warning
          if (prev === 61 && !oneMinuteWarningShown) {
            setOneMinuteWarningShown(true);
            playWarningSound(2);
            sendWarningNotification(60);
          }

          if (prev <= 1) {
            setIsRunning(false);
            setIsCompleted(true);
            // Gentle alert - native notification and audio
            (async () => {
              try {
                // Try Tauri notification first (better desktop integration)
                const { sendNotification } = await import('@tauri-apps/api/notification');
                await sendNotification({
                  title: 'Focus Timer Complete! 🎉',
                  body: 'Great job! Time for a well-deserved break.',
                });
              } catch (error) {
                // Fallback to browser notification
                if (Notification.permission === 'granted') {
                  new Notification('Focus Timer Complete! 🎉', {
                    body: 'Great job! Time for a break.',
                    icon: '⏰'
                  });
                }
              }
            })();
            // Play alert sound three times
            playAlertSound();
            setTimeout(() => playAlertSound(), 800);
            setTimeout(() => playAlertSound(), 1600);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  // Request notification permission on mount
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleStart = () => {
    if (timeLeft > 0) {
      setIsRunning(true);
      setIsCompleted(false);
    }
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(duration * 60);
    setIsCompleted(false);
    setTwoMinuteWarningShown(false);
    setOneMinuteWarningShown(false);
  };

  // Calculate angles for timer
  const totalSeconds = duration * 60;
  const currentMinute = Math.floor(timeLeft / 60);
  const currentSecond = timeLeft % 60;
  
  // Main hand points to current minute remaining
  const mainHandAngle = (currentMinute * 6) - 90; // 6 degrees per minute, start at 12 o'clock
  
  // Second hand for current second (optional, subtle)
  const secondHandAngle = (currentSecond * 6) - 90; // 6 degrees per second

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate minute markers (60 total, like a real timer)
  const minuteMarkers = Array.from({ length: 60 }, (_, i) => {
    const angle = (i * 6) - 90; // 6 degrees per minute
    const isEveryFive = i % 5 === 0;
    const x1 = 160 + Math.cos(angle * Math.PI / 180) * 136;
    const y1 = 160 + Math.sin(angle * Math.PI / 180) * 136;
    const x2 = 160 + Math.cos(angle * Math.PI / 180) * (isEveryFive ? 124 : 130);
    const y2 = 160 + Math.sin(angle * Math.PI / 180) * (isEveryFive ? 124 : 130);
    
    return (
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={isEveryFive ? "#6B7280" : "#9CA3AF"}
        strokeWidth={isEveryFive ? "2" : "1"}
      />
    );
  });

  // Generate minute numbers (every 5 minutes)
  const minuteNumbers = Array.from({ length: 12 }, (_, i) => {
    const minute = i * 5;
    const angle = (minute * 6) - 90; // 6 degrees per minute
    const x = 160 + Math.cos(angle * Math.PI / 180) * 112;
    const y = 160 + Math.sin(angle * Math.PI / 180) * 112 + 5;
    
    return (
      <text
        key={minute}
        x={x}
        y={y}
        textAnchor="middle"
        className="text-sm font-semibold fill-gray-700"
      >
        {minute}
      </text>
    );
  });

  return (
    <div className="h-full flex flex-col items-center justify-start p-4 bg-gradient-to-br from-blue-50 to-indigo-100 overflow-auto">
      {/* Header */}
      <div className="text-center mb-4 flex-shrink-0">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Focus Timer</h2>
        <p className="text-gray-600 text-sm">Set your focus time and watch the clock count down</p>
      </div>

      {/* Clock Face */}
      <div className="relative mb-4 flex-shrink-0">
        <svg width="320" height="320" className="drop-shadow-lg">
          {/* Outer circle */}
          <circle
            cx="160"
            cy="160"
            r="144"
            fill="white"
            stroke="#E5E7EB"
            strokeWidth="3"
          />
          
          {/* Duration arc (shows total time set) */}
          {duration === 60 ? (
            // Full circle for 60 minutes
            <circle
              cx="160"
              cy="160"
              r="144"
              fill="none"
              stroke="#10B981"
              strokeWidth="8"
              opacity="0.3"
            />
          ) : (
            // Arc for less than 60 minutes
            <path
              d={`M 160 16 A 144 144 0 ${duration > 30 ? 1 : 0} 1 ${
                160 + Math.cos((duration * 6 - 90) * Math.PI / 180) * 144
              } ${
                160 + Math.sin((duration * 6 - 90) * Math.PI / 180) * 144
              }`}
              fill="none"
              stroke="#10B981"
              strokeWidth="8"
              opacity="0.3"
            />
          )}
          
          {/* Elapsed time arc (shows time used) */}
          {Math.floor((totalSeconds - timeLeft) / 60) === 60 ? (
            // Full circle for 60 minutes elapsed
            <circle
              cx="160"
              cy="160"
              r="144"
              fill="none"
              stroke="#EF4444"
              strokeWidth="6"
              opacity="0.6"
            />
          ) : Math.floor((totalSeconds - timeLeft) / 60) > 0 ? (
            // Arc for elapsed time
            <path
              d={`M 160 16 A 144 144 0 ${(totalSeconds - timeLeft) / 60 > 30 ? 1 : 0} 1 ${
                160 + Math.cos(((totalSeconds - timeLeft) / 60 * 6 - 90) * Math.PI / 180) * 144
              } ${
                160 + Math.sin(((totalSeconds - timeLeft) / 60 * 6 - 90) * Math.PI / 180) * 144
              }`}
              fill="none"
              stroke="#EF4444"
              strokeWidth="6"
              opacity="0.6"
            />
          ) : null}

          {/* Minute markers */}
          {minuteMarkers}
          
          {/* Minute numbers */}
          {minuteNumbers}

          {/* Main hand (points to current minutes remaining) */}
          <line
            x1="160"
            y1="160"
            x2={160 + Math.cos(mainHandAngle * Math.PI / 180) * 100}
            y2={160 + Math.sin(mainHandAngle * Math.PI / 180) * 100}
            stroke="#1F2937"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Second hand (subtle, shows current second) */}
          <line
            x1="160"
            y1="160"
            x2={160 + Math.cos(secondHandAngle * Math.PI / 180) * 120}
            y2={160 + Math.sin(secondHandAngle * Math.PI / 180) * 120}
            stroke="#F59E0B"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.7"
          />

          {/* Center dot */}
          <circle
            cx="160"
            cy="160"
            r="6"
            fill="#1F2937"
          />
        </svg>

        {/* Digital display overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white bg-opacity-90 px-4 py-2 rounded-xl shadow-lg border-2 border-gray-200">
            <div className={`text-3xl font-mono font-bold ${
              isCompleted ? 'text-green-600' : isRunning ? 'text-blue-600' : 'text-gray-700'
            }`}>
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>
      </div>

      {/* Duration selector */}
      {!isRunning && (
        <div className="mb-4 flex-shrink-0">
          <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
            Focus Duration (minutes)
          </label>
          <div className="flex items-center space-x-3 mb-3">
            <input
              type="range"
              min="1"
              max="60"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="w-48 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="bg-white px-3 py-1 rounded-lg shadow border font-semibold text-gray-700 min-w-[3rem] text-center text-sm">
              {duration}m
            </div>
          </div>
          
          {/* Sound selector */}
          <div className="text-center">
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Alert Sound
            </label>
            <div className="flex justify-center space-x-2">
              {[
                { key: 'gentle', label: '🔔', title: 'Gentle Bell' },
                { key: 'chime', label: '🎵', title: 'Pleasant Chime' },
                { key: 'ding', label: '🔊', title: 'Simple Ding' },
                { key: 'success', label: '🎉', title: 'Success Melody' },
                { key: 'none', label: '🔇', title: 'No Sound' }
              ].map(({ key, label, title }) => (
                <button
                  key={key}
                  onClick={() => {
                    setSoundOption(key as typeof soundOption);
                    // Test play the sound when selected
                    if (key !== 'none') {
                      const testPlayAlertSound = () => {
                        try {
                          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                          
                          if (key === 'gentle') {
                            const oscillator = audioContext.createOscillator();
                            const gainNode = audioContext.createGain();
                            oscillator.connect(gainNode);
                            gainNode.connect(audioContext.destination);
                            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                            oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.5);
                            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                            oscillator.start(audioContext.currentTime);
                            oscillator.stop(audioContext.currentTime + 0.5);
                          } else if (key === 'chime') {
                            const playTone = (freq: number, delay: number) => {
                              const osc = audioContext.createOscillator();
                              const gain = audioContext.createGain();
                              osc.connect(gain);
                              gain.connect(audioContext.destination);
                              osc.frequency.value = freq;
                              const startTime = audioContext.currentTime + delay;
                              gain.gain.setValueAtTime(0.15, startTime);
                              gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
                              osc.start(startTime);
                              osc.stop(startTime + 0.4);
                            };
                            playTone(523.25, 0);
                            playTone(659.25, 0.05);
                            playTone(783.99, 0.1);
                          } else if (key === 'ding') {
                            const oscillator = audioContext.createOscillator();
                            const gainNode = audioContext.createGain();
                            oscillator.connect(gainNode);
                            gainNode.connect(audioContext.destination);
                            oscillator.frequency.value = 1200;
                            gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
                            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                            oscillator.start(audioContext.currentTime);
                            oscillator.stop(audioContext.currentTime + 0.2);
                          } else if (key === 'success') {
                            const playNote = (freq: number, start: number) => {
                              const osc = audioContext.createOscillator();
                              const gain = audioContext.createGain();
                              osc.connect(gain);
                              gain.connect(audioContext.destination);
                              osc.frequency.value = freq;
                              osc.type = 'triangle';
                              const startTime = audioContext.currentTime + start;
                              gain.gain.setValueAtTime(0.15, startTime);
                              gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);
                              osc.start(startTime);
                              osc.stop(startTime + 0.1);
                            };
                            playNote(523.25, 0);
                            playNote(659.25, 0.05);
                            playNote(783.99, 0.1);
                            playNote(1046.50, 0.15);
                          }
                        } catch (error) {
                          console.log('Preview audio failed:', error);
                        }
                      };
                      testPlayAlertSound();
                    }
                  }}
                  className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 text-sm ${
                    soundOption === key
                      ? 'border-blue-500 bg-blue-50 scale-110'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                  title={title}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex space-x-3 flex-shrink-0">
        {!isRunning ? (
          <button
            onClick={handleStart}
            disabled={timeLeft === 0}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold flex items-center space-x-2 shadow-lg text-sm"
          >
            <span>▶️</span>
            <span>Start Focus</span>
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-all duration-200 font-semibold flex items-center space-x-2 shadow-lg text-sm"
          >
            <span>⏸️</span>
            <span>Pause</span>
          </button>
        )}
        
        <button
          onClick={handleReset}
          className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 font-semibold flex items-center space-x-2 shadow-lg text-sm"
        >
          <span>🔄</span>
          <span>Reset</span>
        </button>
      </div>

      {/* Completion message */}
      {isCompleted && (
        <div className="mt-4 text-center animate-pulse flex-shrink-0">
          <div className="text-xl font-bold text-green-600 mb-1">🎉 Focus Session Complete! 🎉</div>
          <div className="text-gray-600 text-sm">Great job! Time for a well-deserved break.</div>
        </div>
      )}
    </div>
  );
}

export default Timer;
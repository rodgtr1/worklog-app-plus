import { useState, useEffect, useRef } from "react";
import { 
  FocusTask, 
  FocusSession,
  BreakSession,
  getTodaysFocusTasks, 
  startFocusSession, 
  completeFocusSession,
  getBreakRecommendation,
  startBreakSession,
  completeBreakSession,
  getOrphanedSessions,
  getOrphanedBreaks,
  cleanupOrphanedSessions,
  cleanupOrphanedBreaks
} from "../lib/fileUtils";

function Timer() {
  const [duration, setDuration] = useState(25); // Default 25 minutes (Pomodoro)
  const [timeLeft, setTimeLeft] = useState(25 * 60); // In seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [soundOption, setSoundOption] = useState<'gentle' | 'chime' | 'ding' | 'success' | 'none'>('gentle');
  const [twoMinuteWarningShown, setTwoMinuteWarningShown] = useState(false);
  const [oneMinuteWarningShown, setOneMinuteWarningShown] = useState(false);
  
  // Focus task integration
  const [availableTasks, setAvailableTasks] = useState<FocusTask[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<FocusSession | null>(null);
  const [showTaskSelection, setShowTaskSelection] = useState(false);
  const [showSessionComplete, setShowSessionComplete] = useState(false);
  const [sessionNotes, setSessionNotes] = useState("");
  
  // Break system states
  const [showBreakSuggestion, setShowBreakSuggestion] = useState(false);
  const [breakRecommendation, setBreakRecommendation] = useState<{shouldBreak: boolean; duration: number; message: string} | null>(null);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [currentBreak, setCurrentBreak] = useState<BreakSession | null>(null);
  const [breakTimeLeft, setBreakTimeLeft] = useState(0);
  const [breakActivity, setBreakActivity] = useState("");
  const [selectedBreakDuration, setSelectedBreakDuration] = useState(5);
  
  // Orphaned session cleanup states
  const [showOrphanedSessionsModal, setShowOrphanedSessionsModal] = useState(false);
  const [orphanedSessions, setOrphanedSessions] = useState<FocusSession[]>([]);
  const [orphanedBreaks, setOrphanedBreaks] = useState<BreakSession[]>([]);
  
  const intervalRef = useRef<number | null>(null);

  // Check for orphaned sessions on component mount
  useEffect(() => {
    const checkOrphanedSessions = () => {
      const orphanedSessions = getOrphanedSessions();
      const orphanedBreaks = getOrphanedBreaks();
      
      if (orphanedSessions.length > 0 || orphanedBreaks.length > 0) {
        setOrphanedSessions(orphanedSessions);
        setOrphanedBreaks(orphanedBreaks);
        setShowOrphanedSessionsModal(true);
      }
    };
    
    // Small delay to let the component render first
    const timeoutId = setTimeout(checkOrphanedSessions, 500);
    return () => clearTimeout(timeoutId);
  }, []);

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

    // Use browser notification
    if (Notification.permission === 'granted') {
      new Notification(`⏰ ${title}`, {
        body: body,
        icon: '⏰'
      });
    }
  };

  // Load available focus tasks
  const loadTasks = () => {
    const tasks = getTodaysFocusTasks();
    setAvailableTasks(tasks);
  };

  // Get selected task details
  const getSelectedTask = () => {
    if (!selectedTaskId) return null;
    return availableTasks.find(task => task.id === selectedTaskId) || null;
  };

  // Load tasks on component mount
  useEffect(() => {
    loadTasks();
  }, []);

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
            
            // Show session completion modal if there's an active session
            if (currentSession) {
              setShowSessionComplete(true);
            }
            
            // Gentle alert - native notification and audio
            if (Notification.permission === 'granted') {
              new Notification('Focus Timer Complete! 🎉', {
                body: currentSession ? `Completed: ${currentSession.taskTitle}` : 'Great job! Time for a break.',
                icon: '⏰'
              });
            }
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

  // Break timer logic
  useEffect(() => {
    if (isOnBreak && breakTimeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setBreakTimeLeft(prev => {
          if (prev <= 1) {
            // Break complete - use browser notification
            if (Notification.permission === 'granted') {
              new Notification('Break Complete! 🌟', {
                body: 'Ready to get back to focused work?',
                icon: '⏰'
              });
            }
            
            // Play gentle sound
            playAlertSound();
            
            // Auto-complete the break
            handleCompleteBreak();
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
  }, [isOnBreak, breakTimeLeft]);

  // Request notification permission on mount
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleStart = () => {
    if (timeLeft > 0) {
      // Show task selection before starting timer
      setShowTaskSelection(true);
    }
  };

  // Start timer with selected task
  const handleStartWithTask = () => {
    const selectedTask = getSelectedTask();
    const taskTitle = selectedTask ? selectedTask.title : "Free Focus Time";
    
    // Create a new focus session
    const session = startFocusSession(selectedTaskId, taskTitle, duration);
    setCurrentSession(session);
    
    // Start the timer
    setIsRunning(true);
    setIsCompleted(false);
    setShowTaskSelection(false);
    
    // Reload tasks to get updated data
    loadTasks();
  };

  // Complete the current session
  const handleCompleteSession = () => {
    if (currentSession) {
      completeFocusSession(currentSession.id, sessionNotes.trim() || undefined);
      setCurrentSession(null);
      setSessionNotes("");
      loadTasks(); // Refresh tasks to show updated session counts
      
      // Check if we should recommend a break
      const recommendation = getBreakRecommendation();
      if (recommendation.shouldBreak) {
        setBreakRecommendation(recommendation);
        setSelectedBreakDuration(recommendation.duration); // Set default to recommended duration
        setShowBreakSuggestion(true);
      }
    }
    setShowSessionComplete(false);
  };

  // Skip session completion (don't mark as complete)
  const handleSkipSession = () => {
    setCurrentSession(null);
    setSessionNotes("");
    setShowSessionComplete(false);
  };

  // Break handling functions
  const handleTakeBreak = () => {
    const breakSession = startBreakSession(selectedBreakDuration, breakActivity);
    setCurrentBreak(breakSession);
    setBreakTimeLeft(selectedBreakDuration * 60); // Convert to seconds
    setIsOnBreak(true);
    setShowBreakSuggestion(false);
  };

  const handleSkipBreak = () => {
    setShowBreakSuggestion(false);
    setBreakRecommendation(null);
    setBreakActivity("");
    setSelectedBreakDuration(5); // Reset to default
  };

  const handleCompleteBreak = () => {
    if (currentBreak) {
      completeBreakSession(currentBreak.id);
      setCurrentBreak(null);
    }
    setIsOnBreak(false);
    setBreakTimeLeft(0);
    setBreakActivity("");
    
    // Reset timer state and show task selection for next session
    setIsRunning(false);
    setTimeLeft(duration * 60);
    setIsCompleted(false);
    setTwoMinuteWarningShown(false);
    setOneMinuteWarningShown(false);
    setShowTaskSelection(true);
  };

  // Orphaned session cleanup handlers
  const handleCompleteOrphanedSessions = () => {
    cleanupOrphanedSessions('complete');
    cleanupOrphanedBreaks('complete');
    setShowOrphanedSessionsModal(false);
    setOrphanedSessions([]);
    setOrphanedBreaks([]);
    loadTasks(); // Refresh to show updated session counts
  };

  const handleDeleteOrphanedSessions = () => {
    cleanupOrphanedSessions('delete');
    cleanupOrphanedBreaks('delete');
    setShowOrphanedSessionsModal(false);
    setOrphanedSessions([]);
    setOrphanedBreaks([]);
    loadTasks(); // Refresh to show updated session counts
  };

  const handleKeepOrphanedSessions = () => {
    // Just close the modal and keep the orphaned sessions as-is
    setShowOrphanedSessionsModal(false);
    setOrphanedSessions([]);
    setOrphanedBreaks([]);
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
    setCurrentSession(null);
    setSelectedTaskId(null);
    setShowSessionComplete(false);
    setSessionNotes("");
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
        <h2 className="text-2xl font-bold text-gray-800 mb-1">
          {isOnBreak ? "Break Timer" : "Focus Timer"}
        </h2>
        <p className="text-gray-600 text-sm">
          {isOnBreak 
            ? "Take a break and recharge your energy" 
            : "Set your focus time and watch the clock count down"
          }
        </p>
      </div>

      {/* Active Task Display */}
      {currentSession && !isOnBreak && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mb-4 flex-shrink-0 max-w-md">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Currently Working On</h3>
            <p className="text-blue-600 font-medium">{currentSession.taskTitle}</p>
            <div className="text-xs text-gray-500 mt-2">
              Session Duration: {currentSession.duration} minutes
            </div>
          </div>
        </div>
      )}

      {/* Break Display */}
      {isOnBreak && currentBreak && (
        <div className="bg-green-50 rounded-xl shadow-lg border border-green-200 p-4 mb-4 flex-shrink-0 max-w-md">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-green-800 mb-1">On Break</h3>
            <p className="text-green-600 font-medium">
              {currentBreak.activity || "Recharging..."}
            </p>
            <div className="text-xs text-green-600 mt-2">
              Break Duration: {currentBreak.duration} minutes
            </div>
          </div>
        </div>
      )}

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
          <div className={`bg-white bg-opacity-90 px-4 py-2 rounded-xl shadow-lg border-2 ${
            isOnBreak ? 'border-green-200' : 'border-gray-200'
          }`}>
            <div className={`text-3xl font-mono font-bold ${
              isOnBreak ? 'text-green-600' :
              isCompleted ? 'text-green-600' : 
              isRunning ? 'text-blue-600' : 
              'text-gray-700'
            }`}>
              {formatTime(isOnBreak ? breakTimeLeft : timeLeft)}
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
      {isCompleted && !showSessionComplete && (
        <div className="mt-4 text-center animate-pulse flex-shrink-0">
          <div className="text-xl font-bold text-green-600 mb-1">🎉 Focus Session Complete! 🎉</div>
          <div className="text-gray-600 text-sm">Great job! Time for a well-deserved break.</div>
        </div>
      )}

      {/* Task Selection Modal */}
      {showTaskSelection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 text-xl">🎯</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Choose Your Focus</h3>
                  <p className="text-sm text-gray-500 mt-1">What will you work on for {duration} minutes?</p>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Task
                </label>
                <select
                  value={selectedTaskId || ""}
                  onChange={(e) => setSelectedTaskId(e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">🆓 Free Focus Time</option>
                  {availableTasks.filter(task => !task.completed).map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title} ({task.sessionsCompleted} sessions)
                    </option>
                  ))}
                </select>
              </div>
              
              {availableTasks.length === 0 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    No focus tasks for today. Visit the Focus tab to add some, or start with free focus time.
                  </p>
                </div>
              )}
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowTaskSelection(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartWithTask}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium flex items-center justify-center space-x-2"
                >
                  <span>▶️</span>
                  <span>Start Focus</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Session Completion Modal */}
      {showSessionComplete && currentSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 text-xl">✅</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Session Complete!</h3>
                  <p className="text-sm text-gray-500 mt-1">How did your focus session go?</p>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="text-sm text-gray-700 mb-3">
                  <strong>Task:</strong> {currentSession.taskTitle}
                </div>
                <div className="text-sm text-gray-700 mb-3">
                  <strong>Duration:</strong> {currentSession.duration} minutes
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="What did you accomplish? Any observations?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleSkipSession}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
                >
                  Skip
                </button>
                <button
                  onClick={handleCompleteSession}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 font-medium flex items-center justify-center space-x-2"
                >
                  <span>✅</span>
                  <span>Complete Session</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Break Suggestion Modal */}
      {showBreakSuggestion && breakRecommendation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 text-xl">🌟</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Time for a Break!</h3>
                  <p className="text-sm text-gray-500 mt-1">Recharge and come back stronger</p>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-700 mb-3">{breakRecommendation.message}</p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Break Duration
                </label>
                <div className="flex space-x-2">
                  {[5, 10, 15].map((minutes) => (
                    <button
                      key={minutes}
                      onClick={() => setSelectedBreakDuration(minutes)}
                      className={`flex-1 px-3 py-2 rounded-lg border transition-all duration-200 font-medium ${
                        selectedBreakDuration === minutes
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-green-500'
                      }`}
                    >
                      {minutes} min
                    </button>
                  ))}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Recommended: {breakRecommendation.duration} minutes
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Break Activity (optional)
                </label>
                <select
                  value={breakActivity}
                  onChange={(e) => setBreakActivity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Just relax</option>
                  <option value="☕ Get some coffee">☕ Get some coffee</option>
                  <option value="🚶 Take a short walk">🚶 Take a short walk</option>
                  <option value="💧 Drink some water">💧 Drink some water</option>
                  <option value="👀 Look away from screen">👀 Look away from screen</option>
                  <option value="🧘 Do some stretches">🧘 Do some stretches</option>
                  <option value="🍎 Have a healthy snack">🍎 Have a healthy snack</option>
                  <option value="📱 Check messages">📱 Check messages</option>
                </select>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleSkipBreak}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
                >
                  Continue Working
                </button>
                <button
                  onClick={handleTakeBreak}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 font-medium flex items-center justify-center space-x-2"
                >
                  <span>☕</span>
                  <span>Take Break</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orphaned Sessions Cleanup Modal */}
      {showOrphanedSessionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-orange-600 text-xl">⚠️</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Incomplete Sessions Found</h3>
                  <p className="text-sm text-gray-500 mt-1">Previous sessions weren't completed</p>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-700 mb-3">
                  Found {orphanedSessions.length} incomplete focus session{orphanedSessions.length !== 1 ? 's' : ''}
                  {orphanedBreaks.length > 0 && ` and ${orphanedBreaks.length} incomplete break${orphanedBreaks.length !== 1 ? 's' : ''}`} 
                  from your previous app session.
                </p>
                
                {orphanedSessions.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <h4 className="font-medium text-gray-800 mb-2">Incomplete Focus Sessions:</h4>
                    <ul className="space-y-1">
                      {orphanedSessions.map((session) => (
                        <li key={session.id} className="text-sm text-gray-600">
                          • {session.taskTitle} ({session.duration} min)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {orphanedBreaks.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <h4 className="font-medium text-gray-800 mb-2">Incomplete Breaks:</h4>
                    <ul className="space-y-1">
                      {orphanedBreaks.map((breakSession) => (
                        <li key={breakSession.id} className="text-sm text-gray-600">
                          • {breakSession.activity || 'Break'} ({breakSession.duration} min)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <p className="text-sm text-gray-600">
                  What would you like to do with these incomplete sessions?
                </p>
              </div>
              
              <div className="flex flex-col space-y-2">
                <button
                  onClick={handleCompleteOrphanedSessions}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 font-medium flex items-center justify-center space-x-2"
                >
                  <span>✅</span>
                  <span>Mark as Completed</span>
                </button>
                <button
                  onClick={handleDeleteOrphanedSessions}
                  className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-medium flex items-center justify-center space-x-2"
                >
                  <span>🗑️</span>
                  <span>Delete Sessions</span>
                </button>
                <button
                  onClick={handleKeepOrphanedSessions}
                  className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
                >
                  Keep As-Is (I'll handle later)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Timer;
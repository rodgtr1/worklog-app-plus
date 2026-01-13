import { invoke } from "@tauri-apps/api/core";



export const processWorklog = async (entries: string[]): Promise<void> => {
  try {
    await invoke("process_worklog", { entries });
  } catch (error) {
    console.error("Error processing worklog:", error);
    throw error;
  }
};

export const readWorklog = async (): Promise<string> => {
  try {
    return await invoke("read_worklog");
  } catch (error) {
    console.error("Error reading worklog:", error);
    throw error;
  }
};

export const undoLastChange = async (): Promise<void> => {
  try {
    await invoke("undo_last_change");
  } catch (error) {
    console.error("Error undoing last change:", error);
    throw error;
  }
};

export const generateSummaryReport = async (
  startDate: string,
  endDate: string,
  reportStyle: string
): Promise<string> => {
  try {
    return await invoke("generate_summary_report", {
      startDate,
      endDate,
      reportStyle
    });
  } catch (error) {
    console.error("Error generating summary report:", error);
    throw error;
  }
};


// Secure API key management functions
export const saveOpenAIKey = async (apiKey: string): Promise<void> => {
  try {
    await invoke("save_openai_key", { apiKey });
  } catch (error) {
    console.error("Error saving OpenAI key:", error);
    throw error;
  }
};

export const getOpenAIKeyStatus = async (): Promise<boolean> => {
  try {
    return await invoke("get_openai_key_status");
  } catch (error) {
    console.error("Error checking OpenAI key status:", error);
    return false;
  }
};

export const deleteOpenAIKey = async (): Promise<void> => {
  try {
    await invoke("delete_openai_key");
  } catch (error) {
    console.error("Error deleting OpenAI key:", error);
    throw error;
  }
};

// Calendar-related functions
export interface TimeBlock {
  id: string;
  project: string;
  startDate: string;
  endDate: string;
  color: string;
}

export const readCalendar = async (): Promise<TimeBlock[]> => {
  try {
    const result = await invoke("read_calendar");
    // Convert snake_case to camelCase for frontend
    return (result as any[]).map(block => ({
      id: block.id,
      project: block.project,
      startDate: block.start_date,
      endDate: block.end_date,
      color: block.color,
    }));
  } catch (error) {
    console.error("Error reading calendar:", error);
    throw error;
  }
};

export const saveCalendar = async (timeBlocks: TimeBlock[]): Promise<void> => {
  try {
    // Convert camelCase to snake_case for backend
    const backendBlocks = timeBlocks.map(block => ({
      id: block.id,
      project: block.project,
      start_date: block.startDate,
      end_date: block.endDate,
      color: block.color,
    }));
    await invoke("save_calendar", { timeBlocks: backendBlocks });
  } catch (error) {
    console.error("Error saving calendar:", error);
    throw error;
  }
};

export const addTimeBlock = async (
  project: string,
  startDate: string,
  endDate: string,
  color?: string
): Promise<string> => {
  try {
    return await invoke("add_time_block", {
      project,
      startDate,
      endDate,
      color,
    });
  } catch (error) {
    console.error("Error adding time block:", error);
    throw error;
  }
};

export const deleteTimeBlock = async (blockId: string): Promise<void> => {
  try {
    await invoke("delete_time_block", { blockId });
  } catch (error) {
    console.error("Error deleting time block:", error);
    throw error;
  }
};

export const updateTimeBlock = async (
  blockId: string,
  project: string,
  startDate: string,
  endDate: string,
  color?: string
): Promise<void> => {
  try {
    await invoke("update_time_block", {
      blockId,
      project,
      startDate,
      endDate,
      color,
    });
  } catch (error) {
    console.error("Error updating time block:", error);
    throw error;
  }
};

export const getTodaysTimeBlocks = async (): Promise<TimeBlock[]> => {
  try {
    const allBlocks = await readCalendar();
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const todayDate = new Date(todayString);
    
    // Only return blocks if today is a weekday
    const isWeekday = (date: Date) => {
      const dayOfWeek = date.getDay();
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    };
    
    if (!isWeekday(todayDate)) return [];
    
    return allBlocks.filter(block => {
      const blockStart = new Date(block.startDate);
      const blockEnd = new Date(block.endDate);
      
      return todayDate >= blockStart && todayDate <= blockEnd;
    });
  } catch (error) {
    console.error("Error getting today's time blocks:", error);
    return [];
  }
};

// Focus Sessions functionality
export interface FocusTask {
  id: string;
  title: string;
  category: 'deep-work' | 'admin' | 'creative' | 'learning' | 'meetings' | 'other';
  completed: boolean;
  sessionsCompleted: number;
  estimatedSessions?: number;
  createdAt: string;
}

export interface FocusSession {
  id: string;
  taskId: string | null; // null for free focus time
  taskTitle: string;
  duration: number; // in minutes
  completed: boolean;
  startedAt: string;
  completedAt?: string;
  notes?: string;
  date: string; // YYYY-MM-DD format
}

export interface BreakSession {
  id: string;
  duration: number; // in minutes
  completed: boolean;
  startedAt: string;
  completedAt?: string;
  activity?: string;
  date: string; // YYYY-MM-DD format
}

// Get today's focus tasks from local storage (for now, we can move to Rust backend later)
export const getTodaysFocusTasks = (): FocusTask[] => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const tasksJson = localStorage.getItem(`focus-tasks-${today}`);
    return tasksJson ? JSON.parse(tasksJson) : [];
  } catch (error) {
    console.error("Error getting today's focus tasks:", error);
    return [];
  }
};

// Save today's focus tasks
export const saveTodaysFocusTasks = (tasks: FocusTask[]): void => {
  try {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`focus-tasks-${today}`, JSON.stringify(tasks));
  } catch (error) {
    console.error("Error saving today's focus tasks:", error);
    throw error;
  }
};

// Add a new focus task for today
export const addFocusTask = (title: string, category: FocusTask['category'], estimatedSessions?: number): FocusTask => {
  const newTask: FocusTask = {
    id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title,
    category,
    completed: false,
    sessionsCompleted: 0,
    estimatedSessions,
    createdAt: new Date().toISOString(),
  };
  
  const tasks = getTodaysFocusTasks();
  tasks.push(newTask);
  saveTodaysFocusTasks(tasks);
  
  return newTask;
};

// Update a focus task
export const updateFocusTask = (taskId: string, updates: Partial<FocusTask>): void => {
  const tasks = getTodaysFocusTasks();
  const taskIndex = tasks.findIndex(task => task.id === taskId);
  
  if (taskIndex !== -1) {
    tasks[taskIndex] = { ...tasks[taskIndex], ...updates };
    saveTodaysFocusTasks(tasks);
  }
};

// Delete a focus task
export const deleteFocusTask = (taskId: string): void => {
  const tasks = getTodaysFocusTasks();
  const filteredTasks = tasks.filter(task => task.id !== taskId);
  saveTodaysFocusTasks(filteredTasks);
};

// Focus sessions management
export const getTodaysFocusSessions = (): FocusSession[] => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const sessionsJson = localStorage.getItem(`focus-sessions-${today}`);
    return sessionsJson ? JSON.parse(sessionsJson) : [];
  } catch (error) {
    console.error("Error getting today's focus sessions:", error);
    return [];
  }
};

// Save today's focus sessions
export const saveTodaysFocusSessions = (sessions: FocusSession[]): void => {
  try {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`focus-sessions-${today}`, JSON.stringify(sessions));
  } catch (error) {
    console.error("Error saving today's focus sessions:", error);
    throw error;
  }
};

// Start a new focus session
export const startFocusSession = (taskId: string | null, taskTitle: string, duration: number): FocusSession => {
  const newSession: FocusSession = {
    id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    taskId,
    taskTitle,
    duration,
    completed: false,
    startedAt: new Date().toISOString(),
    date: new Date().toISOString().split('T')[0],
  };
  
  const sessions = getTodaysFocusSessions();
  sessions.push(newSession);
  saveTodaysFocusSessions(sessions);
  
  return newSession;
};

// Complete a focus session
export const completeFocusSession = (sessionId: string, notes?: string): void => {
  const sessions = getTodaysFocusSessions();
  const sessionIndex = sessions.findIndex(session => session.id === sessionId);
  
  if (sessionIndex !== -1) {
    sessions[sessionIndex] = {
      ...sessions[sessionIndex],
      completed: true,
      completedAt: new Date().toISOString(),
      notes,
    };
    saveTodaysFocusSessions(sessions);
    
    // Update task session count if it has a taskId
    const session = sessions[sessionIndex];
    if (session.taskId) {
      const tasks = getTodaysFocusTasks();
      const taskIndex = tasks.findIndex(task => task.id === session.taskId);
      if (taskIndex !== -1) {
        tasks[taskIndex].sessionsCompleted += 1;
        saveTodaysFocusTasks(tasks);
      }
    }
  }
};

// Break sessions management
export const getTodaysBreakSessions = (): BreakSession[] => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const breaksJson = localStorage.getItem(`break-sessions-${today}`);
    return breaksJson ? JSON.parse(breaksJson) : [];
  } catch (error) {
    console.error("Error getting today's break sessions:", error);
    return [];
  }
};

// Save today's break sessions
export const saveTodaysBreakSessions = (breaks: BreakSession[]): void => {
  try {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`break-sessions-${today}`, JSON.stringify(breaks));
  } catch (error) {
    console.error("Error saving today's break sessions:", error);
    throw error;
  }
};

// Start a new break session
export const startBreakSession = (duration: number, activity?: string): BreakSession => {
  const newBreak: BreakSession = {
    id: `break-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    duration,
    completed: false,
    startedAt: new Date().toISOString(),
    activity,
    date: new Date().toISOString().split('T')[0],
  };
  
  const breaks = getTodaysBreakSessions();
  breaks.push(newBreak);
  saveTodaysBreakSessions(breaks);
  
  return newBreak;
};

// Complete a break session
export const completeBreakSession = (breakId: string): void => {
  const breaks = getTodaysBreakSessions();
  const breakIndex = breaks.findIndex(breakSession => breakSession.id === breakId);
  
  if (breakIndex !== -1) {
    breaks[breakIndex] = {
      ...breaks[breakIndex],
      completed: true,
      completedAt: new Date().toISOString(),
    };
    saveTodaysBreakSessions(breaks);
  }
};

// Get break recommendation based on completed sessions
export const getBreakRecommendation = (): { shouldBreak: boolean; duration: number; message: string } => {
  const sessions = getTodaysFocusSessions();
  const breaks = getTodaysBreakSessions();
  
  const completedSessions = sessions.filter(s => s.completed).length;
  const completedBreaks = breaks.filter(b => b.completed).length;
  
  // Don't recommend a break if we just took one
  const lastSession = sessions.slice(-1)[0];
  const lastBreak = breaks.slice(-1)[0];
  
  if (lastBreak && lastSession && lastBreak.completedAt && lastSession.completedAt) {
    const lastBreakTime = new Date(lastBreak.completedAt).getTime();
    const lastSessionTime = new Date(lastSession.completedAt).getTime();
    
    // If the last break was after the last session, don't recommend another break yet
    if (lastBreakTime > lastSessionTime) {
      return { shouldBreak: false, duration: 0, message: "" };
    }
  }
  
  // Recommend breaks based on sessions completed since last break
  const sessionsSinceLastBreak = completedSessions - completedBreaks;
  
  if (sessionsSinceLastBreak >= 3) {
    return {
      shouldBreak: true,
      duration: 15,
      message: "You've completed 3 focus sessions! Time for a 15-minute break."
    };
  } else if (sessionsSinceLastBreak >= 2) {
    return {
      shouldBreak: true,
      duration: 10,
      message: "Nice momentum! Take a 10-minute break to recharge."
    };
  } else if (sessionsSinceLastBreak >= 1 && completedSessions === 1) {
    return {
      shouldBreak: true,
      duration: 5,
      message: "Great start! Take a quick 5-minute break?"
    };
  }
  
  return { shouldBreak: false, duration: 0, message: "" };
};

// Orphaned session cleanup utilities
export const getOrphanedSessions = (): FocusSession[] => {
  const sessions = getTodaysFocusSessions();
  return sessions.filter(session => !session.completed);
};

export const getOrphanedBreaks = (): BreakSession[] => {
  const breaks = getTodaysBreakSessions();
  return breaks.filter(breakSession => !breakSession.completed);
};

export const cleanupOrphanedSessions = (action: 'complete' | 'delete'): void => {
  const sessions = getTodaysFocusSessions();
  const orphanedSessions = sessions.filter(session => !session.completed);
  
  if (action === 'complete') {
    // Mark orphaned sessions as completed
    orphanedSessions.forEach(session => {
      completeFocusSession(session.id, 'Session interrupted - auto-completed on restart');
    });
  } else if (action === 'delete') {
    // Remove orphaned sessions entirely
    const completedSessions = sessions.filter(session => session.completed);
    saveTodaysFocusSessions(completedSessions);
  }
};

export const cleanupOrphanedBreaks = (action: 'complete' | 'delete'): void => {
  const breaks = getTodaysBreakSessions();
  const orphanedBreaks = breaks.filter(breakSession => !breakSession.completed);
  
  if (action === 'complete') {
    // Mark orphaned breaks as completed
    orphanedBreaks.forEach(breakSession => {
      completeBreakSession(breakSession.id);
    });
  } else if (action === 'delete') {
    // Remove orphaned breaks entirely
    const completedBreaks = breaks.filter(breakSession => breakSession.completed);
    saveTodaysBreakSessions(completedBreaks);
  }
};

// Check if an orphaned session is likely stale (started more than its duration + 5 min ago)
export const isSessionStale = (session: FocusSession): boolean => {
  if (session.completed) return false;
  
  const startTime = new Date(session.startedAt).getTime();
  const now = Date.now();
  const expectedDuration = session.duration * 60 * 1000; // Convert to milliseconds
  const gracePeroid = 5 * 60 * 1000; // 5 minute grace period
  
  return (now - startTime) > (expectedDuration + gracePeroid);
};

export const isBreakStale = (breakSession: BreakSession): boolean => {
  if (breakSession.completed) return false;
  
  const startTime = new Date(breakSession.startedAt).getTime();
  const now = Date.now();
  const expectedDuration = breakSession.duration * 60 * 1000; // Convert to milliseconds
  const gracePeroid = 5 * 60 * 1000; // 5 minute grace period
  
  return (now - startTime) > (expectedDuration + gracePeroid);
};

export const getStaleOrphanedSessions = (): FocusSession[] => {
  return getOrphanedSessions().filter(isSessionStale);
};

export const getStaleOrphanedBreaks = (): BreakSession[] => {
  return getOrphanedBreaks().filter(isBreakStale);
};
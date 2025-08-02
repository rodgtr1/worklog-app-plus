import { invoke } from "@tauri-apps/api/tauri";



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
  completedAt?: string;
  notes?: string;
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
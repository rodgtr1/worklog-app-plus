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
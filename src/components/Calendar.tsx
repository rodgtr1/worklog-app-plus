import { useState, useEffect } from "react";
import { TimeBlock, readCalendar, addTimeBlock, updateTimeBlock, deleteTimeBlock } from "../lib/fileUtils";

function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<Date | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<Date | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#3B82F6");

  // Color palette for time blocks
  const colorPalette = [
    "#3B82F6", "#EF4444", "#10B981", "#F59E0B", 
    "#8B5CF6", "#F97316", "#06B6D4", "#84CC16",
    "#EC4899", "#6B7280", "#14B8A6", "#F43F5E"
  ];

  // Get current month/year
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Get first day of month and number of days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // Month names
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Navigate months
  const previousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Load calendar data
  const loadCalendar = async () => {
    try {
      const blocks = await readCalendar();
      setTimeBlocks(blocks);
    } catch (error) {
      console.error("Failed to load calendar:", error);
    }
  };

  useEffect(() => {
    loadCalendar();
  }, []);

  // Helper function to check if a date is a weekday (Monday-Friday)
  const isWeekday = (date: Date) => {
    const dayOfWeek = date.getDay();
    return dayOfWeek >= 1 && dayOfWeek <= 5; // 1 = Monday, 5 = Friday
  };

  // Date selection handlers - only allow weekdays
  const handleMouseDown = (day: number) => {
    const selectedDate = new Date(currentYear, currentMonth, day);
    if (!isWeekday(selectedDate)) return; // Only allow weekdays
    
    setIsSelecting(true);
    setSelectionStart(selectedDate);
    setSelectionEnd(selectedDate);
  };

  const handleMouseEnter = (day: number) => {
    if (isSelecting && selectionStart) {
      const selectedDate = new Date(currentYear, currentMonth, day);
      if (!isWeekday(selectedDate)) return; // Only allow weekdays
      
      setSelectionEnd(selectedDate);
    }
  };

  const handleMouseUp = () => {
    if (isSelecting && selectionStart && selectionEnd) {
      setShowProjectModal(true);
    }
    setIsSelecting(false);
  };

  // Get date range for selection
  const getSelectionRange = () => {
    if (!selectionStart || !selectionEnd) return { start: null, end: null };
    
    const start = selectionStart <= selectionEnd ? selectionStart : selectionEnd;
    const end = selectionStart <= selectionEnd ? selectionEnd : selectionStart;
    
    return { start, end };
  };

  // Check if a day is in the selection range (only weekdays)
  const isDayInSelection = (day: number) => {
    const { start, end } = getSelectionRange();
    if (!start || !end) return false;
    
    const dayDate = new Date(currentYear, currentMonth, day);
    // Only highlight if it's a weekday and within the range
    return isWeekday(dayDate) && dayDate >= start && dayDate <= end;
  };

  // Handle project creation/update
  const handleSaveProject = async () => {
    if (!projectName.trim()) return;
    
    try {
      if (isEditMode && editingBlock) {
        // Update existing block
        const { start, end } = getSelectionRange();
        if (!start || !end) return;
        
        await updateTimeBlock(
          editingBlock.id,
          projectName.trim(),
          start.toISOString().split('T')[0],
          end.toISOString().split('T')[0],
          selectedColor
        );
      } else {
        // Create new block
        if (!selectionStart || !selectionEnd) return;
        const { start, end } = getSelectionRange();
        if (!start || !end) return;
        
        await addTimeBlock(
          projectName.trim(),
          start.toISOString().split('T')[0],
          end.toISOString().split('T')[0],
          selectedColor
        );
      }
      
      await loadCalendar();
      handleCancelProject();
    } catch (error) {
      console.error("Failed to save time block:", error);
    }
  };

  const handleCancelProject = () => {
    setShowProjectModal(false);
    setProjectName("");
    setSelectionStart(null);
    setSelectionEnd(null);
    setEditingBlock(null);
    setIsEditMode(false);
    setSelectedColor("#3B82F6");
  };

  // Handle editing an existing time block
  const handleEditBlock = (block: TimeBlock, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent day selection
    
    setEditingBlock(block);
    setProjectName(block.project);
    setSelectedColor(block.color);
    setIsEditMode(true);
    
    // Set selection to match the block's date range
    const startDate = new Date(block.startDate);
    const endDate = new Date(block.endDate);
    setSelectionStart(startDate);
    setSelectionEnd(endDate);
    
    setShowProjectModal(true);
  };

  // Handle deleting a time block
  const handleDeleteBlock = async (blockId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent day selection
    
    if (confirm("Are you sure you want to delete this time block?")) {
      try {
        await deleteTimeBlock(blockId);
        await loadCalendar();
      } catch (error) {
        console.error("Failed to delete time block:", error);
      }
    }
  };

  // Get time blocks for a specific day (only show on weekdays)
  const getTimeBlocksForDay = (day: number) => {
    const dayDate = new Date(currentYear, currentMonth, day);
    
    // Only show blocks on weekdays
    if (!isWeekday(dayDate)) return [];
    
    return timeBlocks.filter(block => {
      const blockStart = new Date(block.startDate);
      const blockEnd = new Date(block.endDate);
      return dayDate >= blockStart && dayDate <= blockEnd;
    });
  };

  // Generate calendar days
  const calendarDays = [];
  
  // Empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Today's date for highlighting
  const today = new Date();
  const isToday = (day: number) => {
    return today.getDate() === day && 
           today.getMonth() === currentMonth && 
           today.getFullYear() === currentYear;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Project Calendar</h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="text-lg">←</span>
            </button>
            <h3 className="text-xl font-semibold text-gray-700 min-w-[200px] text-center">
              {monthNames[currentMonth]} {currentYear}
            </h3>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="text-lg">→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 p-6">
        <div className="h-full bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Days of week header */}
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="p-3 text-center text-sm font-medium text-gray-600 border-r border-gray-200 last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 flex-1" style={{ gridTemplateRows: 'repeat(6, 1fr)' }}>
            {calendarDays.map((day, index) => {
              const dayBlocks = day ? getTimeBlocksForDay(day) : [];
              const isSelected = day ? isDayInSelection(day) : false;
              const dayDate = day ? new Date(currentYear, currentMonth, day) : null;
              const isWeekdayDay = dayDate ? isWeekday(dayDate) : false;
              
              return (
                <div
                  key={index}
                  className={`border-r border-b border-gray-200 last:border-r-0 p-2 min-h-[100px] relative select-none ${
                    day && isWeekdayDay ? 'hover:bg-gray-50 cursor-pointer' : ''
                  } ${
                    day && !isWeekdayDay ? 'bg-gray-100 cursor-not-allowed' : ''
                  } ${
                    day && isToday(day) ? 'bg-blue-50' : ''
                  } ${
                    isSelected ? 'bg-blue-100' : ''
                  }`}
                  onMouseDown={day ? () => handleMouseDown(day) : undefined}
                  onMouseEnter={day ? () => handleMouseEnter(day) : undefined}
                  onMouseUp={handleMouseUp}
                >
                  {day && (
                    <>
                      <div className={`text-sm font-medium mb-1 ${
                        isToday(day) ? 'text-blue-600' : isWeekdayDay ? 'text-gray-700' : 'text-gray-400'
                      }`}>
                        {day}
                      </div>
                      
                      {/* Time blocks */}
                      {dayBlocks.map((block, blockIndex) => {
                        const blockStart = new Date(block.startDate);
                        const blockEnd = new Date(block.endDate);
                        const dayDate = new Date(currentYear, currentMonth, day);
                        
                        // Calculate which weekday of the project this is
                        let weekdayNumber = 0;
                        let totalWeekdays = 0;
                        const tempDate = new Date(blockStart);
                        
                        // Count weekdays up to current day
                        while (tempDate <= dayDate) {
                          if (isWeekday(tempDate)) {
                            weekdayNumber++;
                          }
                          tempDate.setDate(tempDate.getDate() + 1);
                        }
                        
                        // Count total weekdays in project
                        tempDate.setTime(blockStart.getTime());
                        while (tempDate <= blockEnd) {
                          if (isWeekday(tempDate)) {
                            totalWeekdays++;
                          }
                          tempDate.setDate(tempDate.getDate() + 1);
                        }
                        
                        const dayLabel = `Day ${weekdayNumber} of ${totalWeekdays}`;
                        
                        return (
                          <div
                            key={`${block.id}-${blockIndex}`}
                            className="text-xs p-1 mb-1 rounded text-white font-medium truncate cursor-pointer hover:opacity-90 group relative"
                            style={{ backgroundColor: block.color }}
                            title={`${block.project}: ${dayLabel} (Click to edit)`}
                            onClick={(e) => handleEditBlock(block, e)}
                          >
                            <div className="font-semibold truncate">{block.project}</div>
                            <div className="text-xs opacity-90">{dayLabel}</div>
                            
                            {/* Edit/Delete buttons - show on hover */}
                            <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                              <button
                                onClick={(e) => handleEditBlock(block, e)}
                                className="w-4 h-4 bg-white bg-opacity-80 rounded text-gray-700 text-xs flex items-center justify-center hover:bg-opacity-100"
                                title="Edit"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={(e) => handleDeleteBlock(block.id, e)}
                                className="w-4 h-4 bg-white bg-opacity-80 rounded text-gray-700 text-xs flex items-center justify-center hover:bg-opacity-100"
                                title="Delete"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Project Creation Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 text-xl">📅</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {isEditMode ? 'Edit Time Block' : 'Create Time Block'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Configure your project time block
                  </p>
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name
                </label>
                <input
                  id="projectName"
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g., Getting Started page"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                  maxLength={50}
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {colorPalette.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 ${
                        selectedColor === color
                          ? 'border-gray-800 scale-110'
                          : 'border-gray-300 hover:border-gray-500'
                      }`}
                      style={{ backgroundColor: color }}
                      title={`Select ${color}`}
                    />
                  ))}
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                  {selectionStart && selectionEnd && (() => {
                    const { start, end } = getSelectionRange();
                    if (!start || !end) return "No dates selected";
                    
                    const startStr = start.toLocaleDateString();
                    const endStr = end.toLocaleDateString();
                    
                    // Count only weekdays in the range
                    let weekdayCount = 0;
                    const currentDate = new Date(start);
                    while (currentDate <= end) {
                      if (isWeekday(currentDate)) {
                        weekdayCount++;
                      }
                      currentDate.setDate(currentDate.getDate() + 1);
                    }
                    
                    return startStr === endStr 
                      ? `${startStr} (1 weekday)`
                      : `${startStr} - ${endStr} (${weekdayCount} weekdays)`;
                  })()}
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleCancelProject}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                {isEditMode && editingBlock && (
                  <button
                    onClick={(e) => {
                      handleDeleteBlock(editingBlock.id, e);
                      handleCancelProject();
                    }}
                    className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-medium flex items-center justify-center space-x-2"
                  >
                    <span>🗑️</span>
                    <span>Delete</span>
                  </button>
                )}
                <button
                  onClick={handleSaveProject}
                  disabled={!projectName.trim()}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center justify-center space-x-2"
                >
                  <span>📅</span>
                  <span>{isEditMode ? 'Update Block' : 'Create Block'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Calendar;
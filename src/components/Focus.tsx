import { useState, useEffect } from "react";
import { 
  FocusTask, 
  FocusSession,
  BreakSession,
  getTodaysFocusTasks, 
  getTodaysFocusSessions,
  getTodaysBreakSessions,
  addFocusTask, 
  updateFocusTask, 
  deleteFocusTask,
  getOrphanedSessions,
  getOrphanedBreaks,
  cleanupOrphanedSessions,
  cleanupOrphanedBreaks
} from "../lib/fileUtils";

function Focus() {
  const [tasks, setTasks] = useState<FocusTask[]>([]);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [breaks, setBreaks] = useState<BreakSession[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState<FocusTask['category']>('deep-work');
  const [showAddTask, setShowAddTask] = useState(false);

  const categoryLabels = {
    'deep-work': '🧠 Deep Work',
    'admin': '📋 Admin',
    'creative': '🎨 Creative',
    'learning': '📚 Learning',
    'meetings': '👥 Meetings',
    'other': '⚡ Other'
  };

  const categoryColors = {
    'deep-work': 'bg-blue-100 text-blue-800 border-blue-200',
    'admin': 'bg-gray-100 text-gray-800 border-gray-200',
    'creative': 'bg-purple-100 text-purple-800 border-purple-200',
    'learning': 'bg-green-100 text-green-800 border-green-200',
    'meetings': 'bg-orange-100 text-orange-800 border-orange-200',
    'other': 'bg-yellow-100 text-yellow-800 border-yellow-200'
  };

  // Load tasks, sessions, and breaks
  const loadData = () => {
    setTasks(getTodaysFocusTasks());
    setSessions(getTodaysFocusSessions());
    setBreaks(getTodaysBreakSessions());
  };

  useEffect(() => {
    loadData();
  }, []);

  // Add new task
  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    
    addFocusTask(newTaskTitle.trim(), newTaskCategory);
    setNewTaskTitle("");
    setNewTaskCategory('deep-work');
    setShowAddTask(false);
    loadData();
  };

  // Toggle task completion
  const handleToggleTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      updateFocusTask(taskId, { completed: !task.completed });
      loadData();
    }
  };

  // Delete task
  const handleDeleteTask = (taskId: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteFocusTask(taskId);
      loadData();
    }
  };

  // Clean up orphaned sessions
  const handleCleanupOrphans = () => {
    const orphanedSessions = getOrphanedSessions();
    const orphanedBreaks = getOrphanedBreaks();
    
    if (orphanedSessions.length === 0 && orphanedBreaks.length === 0) {
      alert("No incomplete sessions found!");
      return;
    }
    
    const sessionCount = orphanedSessions.length;
    const breakCount = orphanedBreaks.length;
    const message = `Found ${sessionCount} incomplete focus session${sessionCount !== 1 ? 's' : ''}${breakCount > 0 ? ` and ${breakCount} incomplete break${breakCount !== 1 ? 's' : ''}` : ''}. Mark them as completed?`;
    
    if (confirm(message)) {
      cleanupOrphanedSessions('complete');
      cleanupOrphanedBreaks('complete');
      loadData();
    }
  };

  // Calculate today's stats
  const completedSessions = sessions.filter(s => s.completed).length;
  const totalSessionTime = sessions
    .filter(s => s.completed)
    .reduce((sum, s) => sum + s.duration, 0);
  const completedTasks = tasks.filter(t => t.completed).length;
  const completedBreaks = breaks.filter(b => b.completed).length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Daily Focus</h2>
            <p className="text-gray-600 text-sm mt-1">Plan your focus tasks and track your progress</p>
          </div>
          
          {/* Today's Stats */}
          <div className="flex items-center space-x-6 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{completedSessions}</div>
              <div className="text-gray-500">Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{Math.floor(totalSessionTime / 60)}h {totalSessionTime % 60}m</div>
              <div className="text-gray-500">Focus Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{completedBreaks}</div>
              <div className="text-gray-500">Breaks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{completedTasks}/{tasks.length}</div>
              <div className="text-gray-500">Tasks Done</div>
            </div>
            
            {/* Cleanup Button */}
            <div className="ml-4">
              <button
                onClick={handleCleanupOrphans}
                className="px-3 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-xs font-medium border border-orange-200"
                title="Clean up incomplete sessions from app restarts"
              >
                🧹 Cleanup
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          {/* Add Task Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Today's Focus Tasks</h3>
              <button
                onClick={() => setShowAddTask(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
              >
                <span>+</span>
                <span>Add Task</span>
              </button>
            </div>

            {/* Add Task Form */}
            {showAddTask && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="What will you focus on today?"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                  />
                  <select
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value as FocusTask['category'])}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddTask}
                    disabled={!newTaskTitle.trim()}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowAddTask(false);
                      setNewTaskTitle("");
                      setNewTaskCategory('deep-work');
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Tasks List */}
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-lg font-medium mb-2">No focus tasks yet</h3>
                <p className="text-sm">Add your first task to start planning your focused work day</p>
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className={`bg-white rounded-lg border border-gray-200 p-4 transition-all duration-200 ${
                    task.completed ? 'opacity-75' : 'hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <button
                        onClick={() => handleToggleTask(task.id)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          task.completed
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 hover:border-green-500'
                        }`}
                      >
                        {task.completed && <span className="text-xs">✓</span>}
                      </button>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className={`font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                            {task.title}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs border ${categoryColors[task.category]}`}>
                            {categoryLabels[task.category]}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>
                            {task.sessionsCompleted} session{task.sessionsCompleted !== 1 ? 's' : ''} completed
                          </span>
                          {task.estimatedSessions && (
                            <span>
                              • {task.estimatedSessions} estimated
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete task"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Progress bar for estimated sessions */}
                  {task.estimatedSessions && task.estimatedSessions > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{Math.min(task.sessionsCompleted, task.estimatedSessions)} / {task.estimatedSessions}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min((task.sessionsCompleted / task.estimatedSessions) * 100, 100)}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Recent Activity */}
          {(sessions.length > 0 || breaks.length > 0) && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Today's Activity</h3>
              <div className="space-y-2">
                {/* Combine sessions and breaks, then sort by time */}
                {[
                  ...sessions.map(s => ({...s, type: 'session' as const})),
                  ...breaks.map(b => ({...b, type: 'break' as const}))
                ]
                .sort((a, b) => {
                  const timeA = new Date(a.completedAt || (a.type === 'break' ? (a as any).startedAt : '') || '').getTime();
                  const timeB = new Date(b.completedAt || (b.type === 'break' ? (b as any).startedAt : '') || '').getTime();
                  return timeB - timeA; // Most recent first
                })
                .slice(0, 8) // Show last 8 activities
                .map((activity) => (
                  <div
                    key={activity.id}
                    className={`bg-white rounded-lg border border-gray-200 p-3 ${
                      activity.completed 
                        ? activity.type === 'session' ? 'border-blue-200 bg-blue-50' : 'border-green-200 bg-green-50'
                        : 'border-orange-200 bg-orange-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-gray-800">
                          {activity.type === 'session' 
                            ? (activity as any).taskTitle 
                            : `Break: ${(activity as any).activity || 'Recharging'}`
                          }
                        </span>
                        <span className="text-sm text-gray-500 ml-2">
                          ({activity.duration} min)
                        </span>
                      </div>
                      <div className="text-sm">
                        {activity.completed ? (
                          <span className={`font-medium ${
                            activity.type === 'session' ? 'text-blue-600' : 'text-green-600'
                          }`}>
                            {activity.type === 'session' ? '✓ Focused' : '☕ Rested'}
                          </span>
                        ) : (
                          <span className="text-orange-600 font-medium">⏱️ In Progress</span>
                        )}
                      </div>
                    </div>
                    {activity.type === 'session' && (activity as any).notes && (
                      <p className="text-sm text-gray-600 mt-1">{(activity as any).notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Focus;
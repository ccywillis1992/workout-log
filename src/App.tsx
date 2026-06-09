import React, { useState, useEffect, useMemo } from 'react';
import { 
  Dumbbell, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  Plus, 
  Trash2, 
  Check, 
  Clock, 
  RotateCcw, 
  Info, 
  Layers, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  ClipboardList,
  Flame,
  Scale,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

import { DailyLog, ExerciseLog, SetLog, WeightUnit } from './types';
import { 
  generateInitialData, 
  getPastDate, 
  formatDateString, 
  EXERCISE_SUGGESTIONS, 
  CATEGORIES 
} from './initialData';

export default function App() {
  // 1. Core State
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('lbs');
  const [showDocumentation, setShowDocumentation] = useState<boolean>(false);
  const [timeRange, setTimeRange] = useState<number>(14);

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Input states for New Exercise
  const [exerciseInput, setExerciseInput] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Chest');
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  
  // Array of sets being designed in the form
  const [draftSets, setDraftSets] = useState<{ weight: number; reps: number; restTimeSeconds: number }[]>([
    { weight: 45, reps: 10, restTimeSeconds: 60 }
  ]);

  // General log states for the selected date
  const [bodyWeightInput, setBodyWeightInput] = useState<string>('');
  const [notesInput, setNotesInput] = useState<string>('');

  // Filtering for volume chart
  const [selectedChartCategory, setSelectedChartCategory] = useState<string>('All');

  // Rest Timer State
  const [activeTimerSeconds, setActiveTimerSeconds] = useState<number | null>(null);
  const [timerRemaining, setTimerRemaining] = useState<number>(0);

  // Initialize App on load
  useEffect(() => {
    const todayStr = formatDateString(new Date());
    setSelectedDate(todayStr);

    const savedLogs = localStorage.getItem('workout_tracker_logs');
    const savedUnit = localStorage.getItem('workout_tracker_unit');
    
    if (savedLogs) {
      try {
        setLogs(JSON.parse(savedLogs));
      } catch (e) {
        setLogs(generateInitialData());
      }
    } else {
      setLogs(generateInitialData());
    }

    if (savedUnit === 'lbs' || savedUnit === 'kg') {
      setWeightUnit(savedUnit as WeightUnit);
    }
  }, []);

  // Sync state to localStorage
  const saveLogsToStorage = (updatedLogs: DailyLog[]) => {
    localStorage.setItem('workout_tracker_logs', JSON.stringify(updatedLogs));
    setLogs(updatedLogs);
  };

  const handleUnitToggle = (unit: WeightUnit) => {
    setWeightUnit(unit);
    localStorage.setItem('workout_tracker_unit', unit);
  };

  // 2. Derive Current Selected Date's DailyLog
  const activeDayLog = useMemo(() => {
    return logs.find(log => log.date === selectedDate);
  }, [logs, selectedDate]);

  // When selectedDate changes, populate inputs
  useEffect(() => {
    if (activeDayLog) {
      setBodyWeightInput(activeDayLog.bodyWeight?.toString() || '');
      setNotesInput(activeDayLog.notes || '');
    } else {
      setBodyWeightInput('');
      setNotesInput('');
    }
  }, [selectedDate, activeDayLog]);

  // Suggestions filtered by what's typed
  const filteredSuggestions = useMemo(() => {
    if (!exerciseInput) return [];
    return EXERCISE_SUGGESTIONS.filter(item => 
      item.name.toLowerCase().includes(exerciseInput.toLowerCase())
    ).slice(0, 5);
  }, [exerciseInput]);

  // 3. Calendar helper functions
  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const date = new Date(year, month, 1);
    const days: Date[] = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [currentMonth]);

  const monthYearLabel = useMemo(() => {
    return currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  }, [currentMonth]);

  const changeMonth = (increment: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + increment);
    setCurrentMonth(newMonth);
  };

  // Identify dates that have custom logs with at least 1 exercise
  const loggedDatesSet = useMemo(() => {
    const dates = new Set<string>();
    logs.forEach(log => {
      if (log.exercises && log.exercises.length > 0) {
        dates.add(log.date);
      }
    });
    return dates;
  }, [logs]);

  // 4. Input handling & Actions
  const handleSelectSuggestion = (name: string, category: string) => {
    setExerciseInput(name);
    setSelectedCategory(category);
    setShowSuggestions(false);
  };

  const addDraftSet = () => {
    const lastSet = draftSets[draftSets.length - 1] || { weight: 45, reps: 10, restTimeSeconds: 60 };
    setDraftSets([...draftSets, { ...lastSet }]);
  };

  const removeDraftSet = (idx: number) => {
    if (draftSets.length <= 1) return;
    setDraftSets(draftSets.filter((_, i) => i !== idx));
  };

  const updateDraftSet = (idx: number, field: 'weight' | 'reps' | 'restTimeSeconds', value: number) => {
    const updated = [...draftSets];
    updated[idx] = {
      ...updated[idx],
      [field]: value
    };
    setDraftSets(updated);
  };

  // Save/Update Daily Weight & Notes
  const handleSaveDayMeta = () => {
    const numericWeight = bodyWeightInput ? parseFloat(bodyWeightInput) : undefined;
    
    let updatedLogs = [...logs];
    const logIndex = updatedLogs.findIndex(log => log.date === selectedDate);

    if (logIndex >= 0) {
      updatedLogs[logIndex] = {
        ...updatedLogs[logIndex],
        bodyWeight: numericWeight,
        notes: notesInput
      };
    } else {
      updatedLogs.push({
        date: selectedDate,
        bodyWeight: numericWeight,
        notes: notesInput,
        exercises: []
      });
    }

    saveLogsToStorage(updatedLogs);
  };

  // Submit complete exercise to active log
  const handleSaveExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exerciseInput.trim()) return;

    const formattedSets: SetLog[] = draftSets.map((set, idx) => ({
      id: `set-${Date.now()}-${idx}`,
      setNumber: idx + 1,
      weight: set.weight,
      reps: set.reps,
      restTimeSeconds: set.restTimeSeconds
    }));

    const newExercise: ExerciseLog = {
      id: `ex-${Date.now()}`,
      exerciseName: exerciseInput.trim(),
      category: selectedCategory,
      sets: formattedSets
    };

    let updatedLogs = [...logs];
    const logIndex = updatedLogs.findIndex(log => log.date === selectedDate);

    if (logIndex >= 0) {
      // Add to existing day
      updatedLogs[logIndex] = {
        ...updatedLogs[logIndex],
        exercises: [...(updatedLogs[logIndex].exercises || []), newExercise]
      };
    } else {
      // First exercise for this day
      updatedLogs.push({
        date: selectedDate,
        exercises: [newExercise],
        bodyWeight: bodyWeightInput ? parseFloat(bodyWeightInput) : undefined,
        notes: notesInput || ''
      });
    }

    saveLogsToStorage(updatedLogs);

    // Reset exercise form
    setExerciseInput('');
    setDraftSets([{ weight: 45, reps: 10, restTimeSeconds: 60 }]);
    setShowSuggestions(false);
  };

  const handleDeleteExercise = (exerciseId: string) => {
    let updatedLogs = [...logs];
    const logIndex = updatedLogs.findIndex(log => log.date === selectedDate);
    if (logIndex < 0) return;

    const filteredExercises = updatedLogs[logIndex].exercises.filter(ex => ex.id !== exerciseId);
    
    // If we have no weight, notes, or exercises left, we can clean up the date log entirely,
    // or just leave the empty exercises array. Let's keep the day log if notes/weight exists.
    if (filteredExercises.length === 0 && !updatedLogs[logIndex].bodyWeight && !updatedLogs[logIndex].notes) {
      updatedLogs = updatedLogs.filter(log => log.date !== selectedDate);
    } else {
      updatedLogs[logIndex] = {
        ...updatedLogs[logIndex],
        exercises: filteredExercises
      };
    }

    saveLogsToStorage(updatedLogs);
  };

  const handleResetSeedData = () => {
    if (window.confirm("Are you sure you want to restore the helpful beginner sample data? Any current tracking changes will be kept or merged.")) {
      saveLogsToStorage(generateInitialData());
    }
  };

  const handleClearAllData = () => {
    if (window.confirm("Wipe all tracking logs? This will clean up your local storage completely.")) {
      saveLogsToStorage([]);
      setBodyWeightInput('');
      setNotesInput('');
    }
  };

  // Rest Timer Logic
  const startTimer = (seconds: number) => {
    setActiveTimerSeconds(seconds);
    setTimerRemaining(seconds);
  };

  useEffect(() => {
    if (activeTimerSeconds === null) return;
    
    const interval = setInterval(() => {
      setTimerRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setActiveTimerSeconds(null);
          // Simple visual ping complete
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimerSeconds]);

  // 5. Chart Calculations
  // Generate list of dates from today going back 'timeRange' days
  const dateRangeList = useMemo(() => {
    const list: string[] = [];
    for (let i = timeRange - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      list.push(formatDateString(d));
    }
    return list;
  }, [timeRange]);

  // Daily Volume Data
  const volumeChartData = useMemo(() => {
    return dateRangeList.map(dateStr => {
      const log = logs.find(l => l.date === dateStr);
      let totalVolume = 0;
      let hasAnySets = false;
      if (log) {
        log.exercises.forEach(ex => {
          if (selectedChartCategory === 'All' || ex.category === selectedChartCategory) {
            if (ex.sets.length > 0) {
              hasAnySets = true;
              ex.sets.forEach(set => {
                totalVolume += (set.weight * set.reps);
              });
            }
          }
        });
      }

      const parts = dateStr.split('-');
      const formattedLabel = parts.length === 3 
        ? new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])).toLocaleDateString('default', { month: 'short', day: 'numeric' })
        : dateStr;

      return {
        date: dateStr,
        label: formattedLabel,
        volume: hasAnySets ? totalVolume : null
      };
    });
  }, [dateRangeList, logs, selectedChartCategory]);

  // Body Weight Data
  const weightChartData = useMemo(() => {
    return dateRangeList.map(dateStr => {
      const log = logs.find(l => l.date === dateStr);
      
      const parts = dateStr.split('-');
      const formattedLabel = parts.length === 3 
        ? new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])).toLocaleDateString('default', { month: 'short', day: 'numeric' })
        : dateStr;

      return {
        date: dateStr,
        label: formattedLabel,
        weight: log && log.bodyWeight !== undefined && log.bodyWeight > 0 ? log.bodyWeight : null
      };
    });
  }, [dateRangeList, logs]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-4 sm:p-6 lg:p-8">
      {/* Container wrapper limiting maximum width for modern visual spacing */}
      <div id="app_container" className="max-w-7xl mx-auto space-y-8 animate-[fadeIn_0.5s_ease-out]">
        
        {/* UPPER BRANDING HEADER WITH ACTIVE PWA USAGI LOGO */}
        <header id="app_header" className="flex flex-col md:flex-row justify-between items-center gap-6 pb-6 border-b-4 border-zinc-900">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left w-full md:w-auto">
            <img 
              src="./icon.png?v=2" 
              alt="Cartoon Usagi Bench Press" 
              referrerPolicy="no-referrer"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border border-lime-400 p-1 bg-zinc-900 shadow-xl object-contain"
            />
            <div>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter leading-none uppercase text-white font-display">
                STRENGTH<span className="text-lime-400">.LOG</span>
              </h1>
              <p className="text-zinc-400 text-xs sm:text-sm uppercase tracking-widest font-bold mt-2">
                Pristine Daily Sets, Reps & Resting Time Intensity
              </p>
            </div>
          </div>
          <div className="text-left md:text-right w-full md:w-auto">
            <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold font-mono">Selected Session</p>
            <p className="text-2xl sm:text-3xl font-mono text-lime-400 font-extrabold uppercase">
              {(() => {
                const parts = selectedDate.split('-');
                if (parts.length === 3) {
                  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
                }
                return selectedDate;
              })()}
            </p>

            {/* PREFERRED UNIT TOGGLE & BACKUP TOOLS */}
            <div id="unit_controls" className="flex items-center gap-3 mt-3 justify-start md:justify-end select-none">
              <div className="flex bg-zinc-900 p-1 border border-zinc-800 text-xs font-bold font-mono">
                <button 
                  onClick={() => handleUnitToggle('lbs')}
                  className={`px-3 py-1 cursor-pointer transition-all ${weightUnit === 'lbs' ? 'bg-lime-400 text-black font-black' : 'text-zinc-400 hover:text-white'}`}
                >
                  LBS
                </button>
                <button 
                  onClick={() => handleUnitToggle('kg')}
                  className={`px-3 py-1 cursor-pointer transition-all ${weightUnit === 'kg' ? 'bg-lime-400 text-black font-black' : 'text-zinc-400 hover:text-white'}`}
                >
                  KG
                </button>
              </div>

              <button 
                onClick={handleResetSeedData}
                className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white border border-zinc-805 text-[10px] font-bold font-mono uppercase transition cursor-pointer"
              >
                Reset Demo
              </button>
              <button 
                onClick={handleClearAllData}
                className="px-2.5 py-1.5 bg-zinc-900 hover:bg-red-950/20 text-red-400 border border-zinc-855 text-[10px] font-bold font-mono uppercase transition cursor-pointer"
              >
                Clear Logs
              </button>
            </div>
          </div>
        </header>

        {/* CORE WORKSPACE GRID */}
        <div id="core_cols_wrapper" className="flex flex-col lg:grid lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT CONTAINER - CONSISTENCY CALENDAR & BODY METRIC SENSOR */}
          <div className="contents lg:block lg:col-span-4 lg:space-y-8">
            
            {/* 1. DYNAMIC CONSISTENCY CALENDAR CARD */}
            <div id="consistency_calendar" className="bg-zinc-900 border-l-4 border-lime-400 p-6 shadow-xl w-full order-3 lg:order-none">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-lime-400" />
                  <h2 className="font-display font-extrabold uppercase text-white tracking-widest text-xs">Consistency Calendar</h2>
                </div>
                
                {/* Month Picker Nav */}
                <div className="flex items-center gap-1 bg-zinc-950 p-1 border border-zinc-850">
                  <button 
                    onClick={() => changeMonth(-1)}
                    className="p-1 text-zinc-400 hover:bg-zinc-800 rounded hover:text-lime-400 transition cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono font-bold px-1.5 min-w-[70px] text-center text-zinc-300">
                    {currentMonth.toLocaleString('default', { month: 'short' }).toUpperCase()}
                  </span>
                  <button 
                    onClick={() => changeMonth(1)}
                    className="p-1 text-zinc-400 hover:bg-zinc-800 rounded hover:text-lime-400 transition cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Month Header Label */}
              <div className="text-center font-display font-black text-lime-400 text-lg uppercase mb-4 tracking-wider">
                {monthYearLabel}
              </div>

              {/* Calendar Days Names Column Headers */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-zinc-500 mb-2 font-mono">
                <span>SUN</span>
                <span>MON</span>
                <span>TUE</span>
                <span>WED</span>
                <span>THU</span>
                <span>FRI</span>
                <span>SAT</span>
              </div>

              {/* Grid Layout of Days */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty buffer starting cells if month doesn't start on Sunday */}
                {Array.from({ length: daysInMonth[0]?.getDay() || 0 }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square bg-transparent font-mono text-[10px]"></div>
                ))}

                {/* Day Elements */}
                {daysInMonth.map((day, i) => {
                  const dayStr = formatDateString(day);
                  const isSelected = selectedDate === dayStr;
                  const hasLogs = loggedDatesSet.has(dayStr);
                  const isToday = formatDateString(new Date()) === dayStr;

                  return (
                    <button
                      key={`day-${i}`}
                      onClick={() => setSelectedDate(dayStr)}
                      className={`relative aspect-square rounded-xs flex flex-col items-center justify-center text-xs font-mono transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-lime-400 text-black font-black text-sm'
                          : isToday
                          ? 'border-2 border-lime-400 bg-lime-400/10 text-lime-400'
                          : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-900/50'
                      }`}
                    >
                      <span>{day.getDate()}</span>
                      
                      {/* Active Workout Indicator Dot */}
                      {hasLogs && !isSelected && (
                        <span className="absolute bottom-1 w-1.5 h-1.5 bg-lime-400 rounded-full animate-bounce"></span>
                      )}
                      {hasLogs && isSelected && (
                        <span className="absolute bottom-1 w-1.5 h-1.5 bg-zinc-950 rounded-full"></span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400 font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-lime-400 inline-block"></span>
                  <span>Days Completed</span>
                </div>
                <div>
                  <span className="font-bold text-lime-400 font-mono">{loggedDatesSet.size}</span> completed
                </div>
              </div>
            </div>

            {/* 2. BODY WEIGHT PROGRESS CARD & DAILY NOTES */}
            <div id="body_weight_progress" className="bg-zinc-900 border-l-4 border-lime-400/60 p-6 shadow-xl space-y-4 w-full order-4 lg:order-none">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
                <Scale className="w-5 h-5 text-lime-400" />
                <h2 className="font-display font-extrabold uppercase text-white tracking-widest text-xs">Body Metrics</h2>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                Log diagnostic specs of body metrics on <span className="font-bold text-lime-400">{selectedDate}</span>.
              </p>

              <div className="space-y-4">
                {/* Weight Input Box with selection scroll indicator */}
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-zinc-400 mb-1.5 font-mono" htmlFor="body_weight_input">
                    BODYWEIGHT ({weightUnit.toUpperCase()})
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="body_weight_input"
                      type="number"
                      step="0.1"
                      placeholder="e.g. 165.5"
                      value={bodyWeightInput}
                      onChange={(e) => setBodyWeightInput(e.target.value)}
                      className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-lime-400 focus:ring-1 focus:ring-lime-400 text-white rounded-xs px-3 py-2 text-sm outline-none transition font-semibold font-mono"
                    />
                    <button
                      onClick={handleSaveDayMeta}
                      className="bg-lime-400 text-black font-black uppercase text-xs px-4 py-2 transition hover:bg-white cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                </div>

                {/* Day Notes Input Box */}
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-zinc-400 mb-1.5 font-mono" htmlFor="day_notes_input">
                    RECOVERY / DIET NOTES
                  </label>
                  <textarea
                    id="day_notes_input"
                    rows={2}
                    placeholder="e.g., Squats felt lighter. Smashed high-protein meals."
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-lime-400 focus:ring-1 focus:ring-lime-400 text-white rounded-xs p-2.5 text-xs outline-none transition font-mono"
                  />
                </div>
              </div>
            </div>

            {/* LIVE REST TIME ALARM TIMER METRIC */}
            {activeTimerSeconds !== null && (
              <div id="countdown_timer" className="bg-zinc-900 border-l-4 border-yellow-400 p-6 flex items-center justify-between shadow-xl w-full order-1 lg:order-none">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-zinc-950 text-yellow-400 border border-zinc-800 animate-pulse">
                    <Clock className="w-5 h-5 animate-spin" />
                  </div>
                  <div>
                    <h4 className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 font-mono">Rest Counting Down</h4>
                    <span className="font-mono text-2xl font-black text-yellow-400 leading-none block mt-1">
                      {Math.floor(timerRemaining / 60)}:{(timerRemaining % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveTimerSeconds(null)}
                  className="text-[10px] uppercase tracking-widest font-bold bg-yellow-400 hover:bg-white text-black px-3 py-2 transition cursor-pointer"
                >
                  Skip
                </button>
              </div>
            )}

          </div>

          {/* RIGHT CONTAINER/MIDDLE - DAILY ACTIVITIES WORKLOG & LOG FORM */}
          <div className="contents lg:block lg:col-span-8 lg:space-y-8">
            
            {/* PRIMARY BOX: SELECTED DATE ACTIVITIES AND ACCUMULATED WEIGHT VOLUMES */}
            <div id="day_log_activities" className="bg-zinc-900 border-t-4 border-lime-400 p-6 shadow-xl space-y-6 w-full order-2 lg:order-none">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 border-b border-zinc-800 pb-4">
                <div>
                  <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest font-mono">ACTIVITY TRACKER</div>
                  <h2 className="font-display font-black text-white tracking-tighter text-3xl sm:text-4xl uppercase">
                    TRAINING LOG
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold bg-zinc-950 text-lime-400 px-3 py-2 border border-zinc-800 font-mono select-none">
                    VOLUME: {activeDayLog ? activeDayLog.exercises.reduce((sum, ex) => sum + ex.sets.reduce((es, s) => es + (s.weight * s.reps), 0), 0) : 0} {weightUnit.toUpperCase()}
                  </span>
                  
                  {activeDayLog?.bodyWeight && (
                    <span className="text-xs font-bold bg-zinc-950 text-white border border-zinc-800 px-3 py-2 font-mono select-none">
                      BODYWEIGHT: {activeDayLog.bodyWeight} {weightUnit.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              {/* Exercises listed for the day */}
              <div className="space-y-4">
                {!activeDayLog || activeDayLog.exercises.length === 0 ? (
                  <div className="py-12 text-center bg-zinc-950 border border-dashed border-zinc-800 rounded-sm">
                    <p className="text-zinc-400 font-mono text-sm uppercase tracking-wider">Blank Log for Selected Date</p>
                    <p className="text-zinc-600 text-xs mt-1 font-mono uppercase">Ready to overlay? Compose sets and reps below first.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeDayLog.exercises.map((exercise) => {
                      // Total Exercise specific volume calculation
                      const exVolume = exercise.sets.reduce((total, set) => total + (set.weight * set.reps), 0);

                      return (
                        <div key={exercise.id} className="border border-zinc-800 bg-zinc-950 p-5 hover:border-zinc-700 transition-all flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div>
                                <span className="inline-block text-[9px] uppercase tracking-widest font-black text-lime-400 bg-lime-400/10 border border-lime-400/30 px-2 py-0.5 font-mono">
                                  {exercise.category.toUpperCase()}
                                </span>
                                <h3 className="font-display font-black text-white text-lg tracking-tight uppercase mt-1">{exercise.exerciseName}</h3>
                              </div>
                              <button 
                                onClick={() => handleDeleteExercise(exercise.id)}
                                className="text-zinc-500 hover:text-red-400 p-1.5 hover:bg-zinc-900 transition-colors cursor-pointer"
                                title="Remove Workout Exercise"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Set logs detailed lists */}
                            <div className="space-y-1.5 mt-3">
                              {exercise.sets.map((set, sIdx) => (
                                <div key={set.id} className="flex items-center justify-between text-xs font-mono bg-zinc-900 border border-zinc-850 px-3 py-2 hover:border-zinc-800 transition">
                                  <span className="text-zinc-500 font-bold uppercase">SET 0{sIdx + 1}</span>
                                  <div className="flex items-center gap-3">
                                    <span className="font-black text-white">{set.weight} {weightUnit.toUpperCase()}</span>
                                    <span className="text-zinc-800">/</span>
                                    <span className="font-black text-lime-400">{set.reps} REPS</span>
                                    {set.restTimeSeconds > 0 && (
                                      <>
                                        <span className="text-zinc-800">/</span>
                                        <button 
                                          onClick={() => startTimer(set.restTimeSeconds)}
                                          title="Start Rest Timer"
                                          className="text-zinc-400 hover:text-lime-400 flex items-center gap-1 font-semibold transition cursor-pointer"
                                        >
                                          <Clock className="w-3.5 h-3.5 text-lime-400" />
                                          {set.restTimeSeconds}S
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="border-t border-zinc-900 mt-5 pt-3 flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                            <span>TOTAL SETS: 0{exercise.sets.length}</span>
                            <span className="font-bold text-lime-450">VOLUME: <span className="text-white font-extrabold">{exVolume}</span> {weightUnit.toUpperCase()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SHOW GENERAL DAY NOTES IF PRESENT */}
              {activeDayLog?.notes && (
                <div className="bg-zinc-950 border border-zinc-800 p-4 text-xs leading-relaxed">
                  <span className="font-mono text-[9px] uppercase tracking-widest font-black text-lime-400 block mb-1">Reflection //</span>
                  <p className="text-zinc-300 font-mono italic">"{activeDayLog.notes}"</p>
                </div>
              )}

            </div>

            {/* SECONDARY BOX: LOG NEW ACTIVITY COMPOSER FORM */}
            <div id="exercise_composer_form" className="bg-zinc-900 border-l-4 border-lime-400 p-6 shadow-xl w-full order-1 lg:order-none">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-zinc-850">
                <Plus className="w-5 h-5 text-lime-400" />
                <h2 className="font-display font-black text-white uppercase tracking-widest text-sm">Log Movements</h2>
              </div>

              <form onSubmit={handleSaveExercise} className="space-y-6">
                
                {/* Search Exercise Suggestion input & Category Select */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-[10px] uppercase mb-1.5 text-zinc-400 font-mono font-bold tracking-widest" htmlFor="exercise_input">
                      EXERCISE TYPE / NAME
                    </label>
                    <input
                      id="exercise_input"
                      type="text"
                      required
                      placeholder="e.g. Bench Press"
                      value={exerciseInput}
                      onChange={(e) => {
                        setExerciseInput(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-lime-400 focus:ring-1 focus:ring-lime-400 text-white p-3 font-bold uppercase text-xs sm:text-sm outline-none transition font-sans"
                    />
                    
                    {/* Floating suggestions dropdown lists */}
                    {showSuggestions && filteredSuggestions.length > 0 && (
                      <div className="absolute z-20 w-full bg-zinc-900 border border-zinc-800 shadow-2xl mt-1 p-1 max-h-48 overflow-y-auto">
                        <div className="text-[9px] font-bold text-zinc-500 px-2 py-1 font-mono tracking-widest">POPULAR SUGGESTIONS</div>
                        {filteredSuggestions.map((item) => (
                          <button
                            key={item.name}
                            type="button"
                            onClick={() => handleSelectSuggestion(item.name, item.category)}
                            className="w-full text-left text-xs px-2.5 py-2 hover:bg-zinc-800 transition-colors flex justify-between items-center text-zinc-200 hover:text-white cursor-pointer"
                          >
                            <span className="font-bold uppercase tracking-tight">{item.name}</span>
                            <span className="text-[8px] uppercase tracking-widest text-lime-400 bg-lime-400/10 px-1.5 py-0.5 font-black font-mono">{item.category}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase mb-1.5 text-zinc-400 font-mono font-bold tracking-widest" htmlFor="category_select">
                      MUSCLE TARGET GROUP
                    </label>
                    <select
                      id="category_select"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-lime-400 focus:ring-1 focus:ring-lime-400 text-white p-3 font-bold uppercase text-xs sm:text-sm outline-none transition cursor-pointer"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat} className="bg-zinc-950">{cat.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* DYNAMIC SETS BUILDER - STREAMLINED LOGGING */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                    <span className="text-[10px] uppercase tracking-widest font-bold font-mono text-zinc-400">Sets Configuration</span>
                    <button
                      type="button"
                      onClick={addDraftSet}
                      className="text-xs bg-zinc-950 hover:bg-zinc-800 text-lime-400 border border-zinc-800 font-black uppercase px-3 py-1.5 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> ADD SET ROW
                    </button>
                  </div>

                  {/* Header labels */}
                  <div className="hidden sm:grid sm:grid-cols-12 gap-3 pb-1 border-b border-zinc-900 text-[9px] font-bold text-zinc-500 font-mono tracking-widest uppercase">
                    <span className="col-span-2 text-center">SET NO.</span>
                    <span className="col-span-3">WEIGHT ({weightUnit.toUpperCase()})</span>
                    <span className="col-span-3">REPS</span>
                    <span className="col-span-3">REST TIMER</span>
                    <span className="col-span-1"></span>
                  </div>

                  {/* Dynamic set list container elements */}
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {draftSets.map((set, index) => (
                      <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 items-center bg-zinc-950 p-3 sm:p-0 sm:bg-transparent border border-zinc-850 sm:border-0">
                        {/* Set count index */}
                        <div className="col-span-1 sm:col-span-2 flex justify-between sm:justify-center items-center font-mono text-xs font-bold text-zinc-500">
                          <span className="sm:hidden uppercase tracking-wider text-[8px] font-mono font-bold text-zinc-450 text-[9px]">Set Count:</span>
                          <span className="bg-zinc-855 text-lime-400 px-2.5 py-1 rounded-sm font-bold font-mono">0{index + 1}</span>
                        </div>

                        {/* Weight spinner scroll dropdown list */}
                        <div className="col-span-3 font-mono">
                          <div className="flex items-center gap-1 bg-zinc-950 p-1 border border-zinc-800">
                            <input
                              type="number"
                              min="0"
                              max="999"
                              required
                              placeholder="Weight"
                              value={set.weight || ''}
                              onChange={(e) => updateDraftSet(index, 'weight', parseInt(e.target.value) || 0)}
                              className="w-full bg-transparent text-white font-mono text-center text-sm font-black outline-none border-none py-1"
                            />
                            {/* Fast adjust modifiers for beginners */}
                            <button
                              type="button"
                              onClick={() => updateDraftSet(index, 'weight', Math.max(0, set.weight - 5))}
                              className="px-2 py-1 text-[10px] bg-zinc-900 font-bold hover:bg-zinc-800 text-zinc-300 rounded-sm cursor-pointer"
                            >
                              -5
                            </button>
                            <button
                              type="button"
                              onClick={() => updateDraftSet(index, 'weight', set.weight + 5)}
                              className="px-2 py-1 text-[10px] bg-zinc-900 font-bold hover:bg-zinc-800 text-zinc-300 rounded-sm cursor-pointer"
                            >
                              +5
                            </button>
                          </div>
                        </div>

                        {/* Reps Number Dropdown list box */}
                        <div className="col-span-3 font-mono">
                          <div className="flex items-center gap-1 bg-zinc-950 p-1 border border-zinc-800">
                            <select
                              value={set.reps}
                              onChange={(e) => updateDraftSet(index, 'reps', parseInt(e.target.value))}
                              className="w-full bg-transparent text-white font-mono text-sm font-black outline-none border-none cursor-pointer py-1"
                            >
                              {Array.from({ length: 30 }, (_, i) => i + 1).map((num) => (
                                <option key={num} value={num} className="bg-zinc-950 text-white font-mono">{num} REPS</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => updateDraftSet(index, 'reps', Math.max(1, set.reps - 1))}
                              className="px-2 py-1 text-[10px] bg-zinc-900 font-bold hover:bg-zinc-800 text-zinc-300 rounded-sm cursor-pointer"
                            >
                              -
                            </button>
                            <button
                              type="button"
                              onClick={() => updateDraftSet(index, 'reps', set.reps + 1)}
                              className="px-2 py-1 text-[10px] bg-zinc-900 font-bold hover:bg-zinc-800 text-zinc-300 rounded-sm cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Resting time dropdown box selection */}
                        <div className="col-span-3">
                          <div className="bg-zinc-950 px-2 py-1.5 border border-zinc-800 font-mono">
                            <select
                              value={set.restTimeSeconds}
                              onChange={(e) => updateDraftSet(index, 'restTimeSeconds', parseInt(e.target.value))}
                              className="w-full bg-zinc-900 text-white font-mono text-xs font-black outline-none border-none cursor-pointer"
                            >
                              <option value={0} className="bg-zinc-900 text-white">NO REST</option>
                              <option value={15} className="bg-zinc-900 text-white">15s REST</option>
                              <option value={30} className="bg-zinc-900 text-white">30s REST</option>
                              <option value={45} className="bg-zinc-900 text-white">45s REST</option>
                              <option value={60} className="bg-zinc-900 text-white">60s (1m) REST</option>
                              <option value={90} className="bg-zinc-900 text-white">90s (1.5m) REST</option>
                              <option value={120} className="bg-zinc-900 text-white">120s (2m) REST</option>
                              <option value={150} className="bg-zinc-900 text-white">150s (2.5m) REST</option>
                              <option value={180} className="bg-zinc-900 text-white">180s (3m) REST</option>
                            </select>
                          </div>
                        </div>

                        {/* Delete row */}
                        <div className="col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => removeDraftSet(index)}
                            disabled={draftSets.length <= 1}
                            className={`p-2 rounded-sm transition-all cursor-pointer ${
                              draftSets.length <= 1 
                                ? 'text-zinc-800 cursor-not-allowed' 
                                : 'text-zinc-500 hover:text-red-400 hover:bg-zinc-950'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>

                <div className="pt-4 border-t border-zinc-800 flex justify-end">
                  <button
                    type="submit"
                    className="w-full bg-lime-400 text-black font-black uppercase py-4 hover:bg-white transition-colors cursor-pointer text-sm tracking-wider"
                  >
                    Commit Set
                  </button>
                </div>

              </form>
            </div>

            {/* ANALYTICS CHARTS */}
            <div id="analytics_and_charts" className="bg-zinc-900 border border-zinc-805 p-6 shadow-xl space-y-6 w-full order-5 lg:order-none">
              
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-lime-400" />
                  <h2 className="font-display font-black text-white uppercase tracking-widest text-xs">Progress Charts & Volume Trajectory</h2>
                </div>

                {/* Combined Filter Controls: Duration Range & Target Muscle */}
                <div className="flex flex-wrap items-center gap-4">
                  
                  {/* Past 7/14/30 Days / 3 Months (90 Days) toggles */}
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-zinc-500 font-mono uppercase tracking-widest">Range:</span>
                    <div className="flex bg-zinc-950 p-1 border border-zinc-800 text-[10px] font-bold font-mono">
                      {[
                        { label: '7D', value: 7 },
                        { label: '14D', value: 14 },
                        { label: '30D', value: 30 },
                        { label: '3M', value: 90 }
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setTimeRange(opt.value)}
                          className={`px-2.5 py-1 cursor-pointer transition-all ${timeRange === opt.value ? 'bg-lime-400 text-black font-black' : 'text-zinc-400 hover:text-white'}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Muscle Filter dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-zinc-500 font-mono uppercase tracking-widest">Muscle:</span>
                    <select
                      value={selectedChartCategory}
                      onChange={(e) => setSelectedChartCategory(e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 text-[10px] text-white px-2 py-1.5 focus:border-lime-400 outline-none font-bold uppercase cursor-pointer font-mono"
                    >
                      <option value="All" className="bg-zinc-950">ALL</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat} className="bg-zinc-950">{cat.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>

                </div>
              </div>

              {/* TWO CHART SECTIONS IN RESPONSIVE GRID LAYOUT */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                {/* CHART 1: ACCUMULATED WORKOUT VOLUME */}
                <div className="space-y-3 bg-zinc-950 border border-zinc-850 p-5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs uppercase font-black text-zinc-300 font-mono tracking-wider">01 // Volume Progression</span>
                    <span className="text-[10px] font-mono text-lime-400 font-bold uppercase">Total {weightUnit.toUpperCase()} Raised</span>
                  </div>
                  
                  <div className="h-[220px] w-full bg-zinc-900/30 p-2 border border-zinc-850">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={volumeChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272A" />
                        <XAxis 
                          dataKey="label" 
                          stroke="#52525B" 
                          fontSize={9} 
                          tickLine={false} 
                          axisLine={false} 
                        />
                        <YAxis 
                          stroke="#52525B" 
                          fontSize={9} 
                          tickLine={false} 
                          axisLine={false}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#09090b', 
                            border: '1px solid #27272a', 
                            borderRadius: '0px', 
                            color: '#fff',
                            fontFamily: 'JetBrains Mono',
                            fontSize: '11px'
                          }} 
                          labelStyle={{ fontWeight: 'bold', color: '#a3e635' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="volume" 
                          name="Weight Volume"
                          stroke="#a3e635" 
                          strokeWidth={3} 
                          connectNulls={true}
                          dot={{ stroke: '#a3e635', strokeWidth: 2, r: 2.5, fill: '#09090b' }} 
                          activeDot={{ r: 5 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <p className="text-[10px] text-zinc-500 font-mono leading-relaxed uppercase">
                    Volume = Sets × Reps × Weight. Mapped continuously over the selected past {timeRange} days.
                  </p>
                </div>

                {/* CHART 2: PERSONAL BODY WEIGHT PROGRESSION OVER TIME */}
                <div className="space-y-3 bg-zinc-950 border border-zinc-850 p-5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs uppercase font-black text-zinc-300 font-mono tracking-wider">02 // Weight Trajectory</span>
                    <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase">Weight in {weightUnit.toUpperCase()}</span>
                  </div>

                  <div className="h-[220px] w-full bg-zinc-900/30 p-2 border border-zinc-850">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weightChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272A" />
                        <XAxis 
                          dataKey="label" 
                          stroke="#52525B" 
                          fontSize={9} 
                          tickLine={false} 
                          axisLine={false} 
                        />
                        <YAxis 
                          stroke="#52525B" 
                          fontSize={9} 
                          tickLine={false} 
                          axisLine={false}
                          domain={['auto', 'auto']}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#09090b', 
                            border: '1px solid #27272a', 
                            borderRadius: '0px', 
                            color: '#fff',
                            fontFamily: 'JetBrains Mono',
                            fontSize: '11px'
                          }} 
                          labelStyle={{ fontWeight: 'bold', color: '#fff' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="weight" 
                          name="Body Weight"
                          stroke="#ffffff" 
                          strokeWidth={3} 
                          connectNulls={true}
                          dot={{ stroke: '#ffffff', strokeWidth: 2, r: 2.5, fill: '#09090b' }} 
                          activeDot={{ r: 5 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <p className="text-[10px] text-zinc-500 font-mono leading-relaxed uppercase">
                    Continuous monitoring supports optimal recovery. Mapped continuously over the selected past {timeRange} days.
                  </p>
                </div>

              </div>

            </div>

          </div>

        </div>

        {/* SYSTEM SPECIFICATION: PRD ACCORDION AT BOTTOM */}
        {showDocumentation && (
          <section id="system_doc_accordion" className="bg-zinc-900 border-l-4 border-lime-400 p-6 shadow-xl transition-all duration-300 mt-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-lime-400" />
                <h2 className="font-display text-lg font-black uppercase tracking-widest text-white">
                  Data Architecture & PRD Plan Spec
                </h2>
              </div>
              <button 
                onClick={() => setShowDocumentation(false)}
                className="text-[10px] uppercase tracking-widest font-bold bg-zinc-800 text-zinc-300 px-3 py-1.5 hover:bg-lime-400 hover:text-black transition cursor-pointer"
              >
                Collapse Info
              </button>
            </div>
            
            <div className="p-1 grid grid-cols-1 md:grid-cols-2 gap-8 text-sm pt-6">
              <div className="space-y-3">
                <h3 className="font-display font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="text-lime-400">01 //</span> Client-Side Data Architecture
                </h3>
                <p className="text-zinc-400 leading-relaxed text-xs">
                  The application is engineered on a decoupled, type-safe schema leveraging React state and durable <code className="text-mono text-lime-400 bg-zinc-950 px-1.5 py-0.5 rounded font-bold font-mono">localStorage</code> persistence, fully eliminating server-side vulnerability for personal gym logs.
                </p>
                <ul className="space-y-1.5 text-xs text-zinc-400 pl-4 list-disc font-mono">
                  <li><strong>Schema:</strong> Modeled within a relational array <code className="text-lime-400">DailyLog[]</code> using <code className="text-lime-400">YYYY-MM-DD</code> strings as index.</li>
                  <li><strong>Modularity:</strong> Features isolated sub-nodes for each exercise session containing names, muscle targeting, and set metrics.</li>
                  <li><strong>Volume tracking:</strong> Aggregated calculations of Workout intensity mapped across chronological ranges.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-display font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="text-lime-400">02 //</span> Product Requirements (PRD) Goals
                </h3>
                <p className="text-zinc-400 leading-relaxed text-xs">
                  This tracker removes analytical friction for gym beginners, prioritizing simple, streamlined steps that maximize physical consistency loop compliance.
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 bg-zinc-950 border border-zinc-800">
                    <span className="text-lime-400 block font-bold mb-1 uppercase tracking-wide">Streamlined Log</span>
                    <p className="text-zinc-500 text-[11px] leading-relaxed">Fast suggestion prompts and dropdown entries bypass manual keyboard friction.</p>
                  </div>
                  <div className="p-3 bg-zinc-950 border border-zinc-800">
                    <span className="text-white block font-bold mb-1 uppercase tracking-wide">Visual Metrics</span>
                    <p className="text-zinc-500 text-[11px] leading-relaxed">Direct mapping of muscle volume calculations and progressive overload curves of target lift types.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Collapsed documentation prompt */}
        {!showDocumentation && (
          <div className="flex justify-start mt-8">
            <button 
              onClick={() => setShowDocumentation(true)}
              className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-lime-400 bg-zinc-900 border border-zinc-800 px-4 py-2 hover:border-lime-400 transition cursor-pointer"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Show System Spec & PRD</span>
            </button>
          </div>
        )}

        {/* Footer Decorative */}
        <footer className="mt-8 flex flex-col sm:flex-row justify-between items-center text-[10px] text-zinc-650 font-mono border-t border-zinc-900 pt-6 gap-2">
          <div className="uppercase">SYSTEM STATUS: OPTIMIZED FOR STRENGTH // TRAINING METHOD: PROGRESSIVE OVERLOAD</div>
          <div className="uppercase">v1.1.0-beta_stable_release_bold</div>
        </footer>

      </div>
    </div>
  );
}

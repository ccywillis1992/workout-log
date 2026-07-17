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
  FileText,
  Download,
  Upload,
  Database,
  Pencil,
  Copy
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
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg');
  const [showDocumentation, setShowDocumentation] = useState<boolean>(false);
  const [timeRange, setTimeRange] = useState<number>(14);

  // Toast Alert State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Action confirmation states
  const [resetConfirm, setResetConfirm] = useState<boolean>(false);
  const [clearConfirm, setClearConfirm] = useState<boolean>(false);

  useEffect(() => {
    if (resetConfirm) {
      const timer = setTimeout(() => setResetConfirm(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [resetConfirm]);

  useEffect(() => {
    if (clearConfirm) {
      const timer = setTimeout(() => setClearConfirm(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [clearConfirm]);

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Input states for New Exercise
  const [exerciseInput, setExerciseInput] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Chest');
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [exerciseSuggestions, setExerciseSuggestions] = useState<{ name: string; category: string }[]>(EXERCISE_SUGGESTIONS);
  const [globalDoubleVolume, setGlobalDoubleVolume] = useState<boolean>(false);

  const handleGlobalDoubleVolumeToggle = () => {
    const nextVal = !globalDoubleVolume;
    setGlobalDoubleVolume(nextVal);
    setDraftSets(draftSets.map(set => ({ ...set, isDoubleVolume: nextVal })));
  };
  
  // Committed set editing state
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [editSetWeight, setEditSetWeight] = useState<number | string>(0);
  const [editSetReps, setEditSetReps] = useState<number>(0);
  const [editSetRest, setEditSetRest] = useState<number>(60);
  const [editSetIsDouble, setEditSetIsDouble] = useState<boolean>(false);
  const [editSetMinutes, setEditSetMinutes] = useState<number>(0);
  const [editSetPace, setEditSetPace] = useState<string>('');
  const [editSetIncline, setEditSetIncline] = useState<number>(0);

  // Array of sets being designed in the form
  const [draftSets, setDraftSets] = useState<{ 
    weight: number | string; 
    reps: number; 
    restTimeSeconds: number;
    isDoubleVolume?: boolean;
    minutes?: number;
    pace?: string;
    inclineAngle?: number;
  }[]>([
    { weight: 45, reps: 10, restTimeSeconds: 60, isDoubleVolume: false, minutes: 10, pace: '5:30/km', inclineAngle: 15 }
  ]);

  // General log states for the selected date
  const [bodyWeightInput, setBodyWeightInput] = useState<string>('');
  const [notesInput, setNotesInput] = useState<string>('');

  // Filtering for volume chart
  const [selectedChartCategory, setSelectedChartCategory] = useState<string>('All');

  // Rest Timer State
  const [activeTimerSeconds, setActiveTimerSeconds] = useState<number | null>(null);
  const [timerRemaining, setTimerRemaining] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Initialize App on load
  useEffect(() => {
    const todayStr = formatDateString(new Date());
    setSelectedDate(todayStr);

    const savedLogs = localStorage.getItem('workout_tracker_logs');
    let loadedLogs: DailyLog[] = [];
    
    if (savedLogs) {
      try {
        const parsed = JSON.parse(savedLogs);
        if (Array.isArray(parsed)) {
          loadedLogs = parsed;
          setLogs(parsed);
        } else {
          loadedLogs = generateInitialData();
          setLogs(loadedLogs);
        }
      } catch (e) {
        loadedLogs = generateInitialData();
        setLogs(loadedLogs);
      }
    } else {
      loadedLogs = generateInitialData();
      setLogs(loadedLogs);
    }

    setWeightUnit('kg');
    localStorage.setItem('workout_tracker_unit', 'kg');

    // Populate customized suggestions list
    const savedCustomSuggestions = localStorage.getItem('workout_tracker_custom_suggestions');
    let baseSuggestions = EXERCISE_SUGGESTIONS;
    if (savedCustomSuggestions) {
      try {
        const parsed = JSON.parse(savedCustomSuggestions);
        if (Array.isArray(parsed)) {
          baseSuggestions = parsed;
        }
      } catch (e) {
        // ignore
      }
    }
    
    // Scrape loaded logs for any missing exercise names to fully synthesize suggestion banks
    const scanned: { name: string; category: string }[] = [];
    const scannedKeys = new Set<string>();
    
    baseSuggestions.forEach(item => {
      const key = `${item.name.toLowerCase()}||${item.category}`;
      if (!scannedKeys.has(key)) {
        scannedKeys.add(key);
        scanned.push(item);
      }
    });

    if (Array.isArray(loadedLogs)) {
      loadedLogs.forEach((log: DailyLog) => {
        if (log.exercises) {
          log.exercises.forEach(ex => {
            const name = ex.exerciseName;
            const category = ex.category;
            const key = `${name.toLowerCase()}||${category}`;
            if (!scannedKeys.has(key)) {
              scannedKeys.add(key);
              scanned.push({ name, category });
            }
          });
        }
      });
    }

    setExerciseSuggestions(scanned);
    localStorage.setItem('workout_tracker_custom_suggestions', JSON.stringify(scanned));
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

  // 1.5 Export Training Logs as Excel-compatible CSV
  const handleExportToExcel = () => {
    const headers = [
      "Date",
      "Body Weight (kg)",
      "Daily Notes",
      "Exercise Name",
      "Muscle Group",
      "Set Number",
      "Weight (kg)",
      "Reps",
      "Rest Time (seconds)",
      "Estimated 1RM (kg)",
      "Is Double Volume",
      "Cardio Minutes",
      "Cardio Pace",
      "Cardio Incline Angle"
    ];

    const csvRows = [headers.join(",")];
    const sortedLogs = [...logs].sort((a, b) => a.date.localeCompare(b.date));

    sortedLogs.forEach(day => {
      const dateStr = day.date;
      const bodyWt = day.bodyWeight !== undefined ? day.bodyWeight : "";
      const escapedNotes = day.notes ? day.notes.replace(/"/g, '""') : "";

      if (day.exercises.length === 0) {
        const row = [
          dateStr,
          bodyWt,
          `"${escapedNotes}"`,
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "FALSE",
          "",
          "",
          ""
        ];
        csvRows.push(row.join(","));
      } else {
        day.exercises.forEach(ex => {
          const exNameEscaped = ex.exerciseName.replace(/"/g, '""');
          const category = ex.category;

          ex.sets.forEach(set => {
            let est1RM = "";
            if (set.reps > 0 && ex.category !== 'Cardio') {
              est1RM = set.reps === 1 
                ? set.weight.toFixed(1)
                : (set.weight * (1 + set.reps / 30)).toFixed(1);
            }

            const row = [
              dateStr,
              bodyWt,
              `"${escapedNotes}"`,
              `"${exNameEscaped}"`,
              `"${category}"`,
              set.setNumber,
              set.weight,
              set.reps,
              set.restTimeSeconds,
              est1RM,
              set.isDoubleVolume ? "TRUE" : "FALSE",
              set.minutes !== undefined ? set.minutes : "",
              set.pace ? `"${set.pace.replace(/"/g, '""')}"` : "",
              set.inclineAngle !== undefined ? set.inclineAngle : ""
            ];
            csvRows.push(row.join(","));
          });
        });
      }
    });

    const csvString = csvRows.join("\r\n");
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `STRENGTH_LOG_EXPORT_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          handleImportCSV(text);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        showToast("Please upload a valid Excel-compatible .csv file.", "error");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          handleImportCSV(text);
        }
      };
      reader.readAsText(file);
    }
  };

  // CSV Parser to handle custom double quotes and row delimiters correctly
  const parseCSV = (text: string) => {
    const lines: string[][] = [];
    let row: string[] = [];
    let inQuotes = false;
    let currentField = '';
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentField += '"';
          i++; // skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(currentField.trim());
        currentField = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        row.push(currentField.trim());
        if (row.length > 1 || row[0] !== '') {
          lines.push(row);
        }
        row = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
    if (row.length > 0 || currentField !== '') {
      row.push(currentField.trim());
      lines.push(row);
    }
    return lines;
  };

  // 1.6 Import Training Logs from Excel-compatible CSV and Merge
  const handleImportCSV = (csvText: string) => {
    const parsed = parseCSV(csvText);
    if (parsed.length < 2) {
      showToast("Invalid CSV format or empty file.", "error");
      return;
    }
    
    const headers = parsed[0].map(h => h.toLowerCase().trim().replace(/"/g, ''));
    
    const dateIdx = headers.indexOf("date");
    const bodyWtIdx = headers.indexOf("body weight (kg)");
    const notesIdx = headers.indexOf("daily notes");
    const exNameIdx = headers.indexOf("exercise name");
    const categoryIdx = headers.indexOf("muscle group");
    const setNumIdx = headers.indexOf("set number");
    const weightIdx = headers.indexOf("weight (kg)");
    const repsIdx = headers.indexOf("reps");
    const restIdx = headers.indexOf("rest time (seconds)");
    
    const doubleVolIdx = headers.indexOf("is double volume");
    const cardioMinsIdx = headers.indexOf("cardio minutes");
    const cardioPaceIdx = headers.indexOf("cardio pace");
    const cardioInclineIdx = headers.indexOf("cardio incline angle");

    if (dateIdx === -1) {
      showToast("Required 'Date' column not found in CSV.", "error");
      return;
    }

    const tempLogsMap = new Map<string, DailyLog>();
    logs.forEach(log => {
      tempLogsMap.set(log.date, JSON.parse(JSON.stringify(log)));
    });

    for (let r = 1; r < parsed.length; r++) {
      const row = parsed[r];
      if (!row || row.length === 0 || !row[dateIdx]) continue;

      const dateStr = row[dateIdx];
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) continue;

      let log = tempLogsMap.get(dateStr);
      if (!log) {
        log = {
          date: dateStr,
          exercises: [],
          bodyWeight: undefined,
          notes: ''
        };
        tempLogsMap.set(dateStr, log);
      }

      if (bodyWtIdx !== -1 && row[bodyWtIdx]) {
        const parsedWt = parseFloat(row[bodyWtIdx]);
        if (!isNaN(parsedWt)) {
          log.bodyWeight = parsedWt;
        }
      }
      if (notesIdx !== -1 && row[notesIdx]) {
        log.notes = row[notesIdx];
      }

      const exName = exNameIdx !== -1 ? row[exNameIdx] : "";
      const category = categoryIdx !== -1 ? row[categoryIdx] : "Other";

      if (exName) {
        let ex = log.exercises.find(e => e.exerciseName.toLowerCase() === exName.toLowerCase());
        if (!ex) {
          ex = {
            id: `ex-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            exerciseName: exName,
            category: category || 'Other',
            sets: []
          };
          log.exercises.push(ex);
        }

        const setNum = setNumIdx !== -1 && row[setNumIdx] ? parseInt(row[setNumIdx]) : (ex.sets.length + 1);
        const weight = weightIdx !== -1 && row[weightIdx] ? parseFloat(row[weightIdx]) : 0;
        const reps = repsIdx !== -1 && row[repsIdx] ? parseInt(row[repsIdx]) : 0;
        const rest = restIdx !== -1 && row[restIdx] ? parseInt(row[restIdx]) : 0;
        
        const isDouble = doubleVolIdx !== -1 && row[doubleVolIdx] ? (row[doubleVolIdx].toLowerCase() === 'true' || row[doubleVolIdx] === '1') : false;
        
        const cardioMins = cardioMinsIdx !== -1 && row[cardioMinsIdx] ? parseFloat(row[cardioMinsIdx]) : undefined;
        const cardioPace = cardioPaceIdx !== -1 && row[cardioPaceIdx] ? row[cardioPaceIdx] : undefined;
        const cardioIncline = cardioInclineIdx !== -1 && row[cardioInclineIdx] ? parseFloat(row[cardioInclineIdx]) : undefined;

        if (reps > 0 || weight > 0 || cardioMins !== undefined || cardioPace) {
          const setLog: SetLog = {
            id: `set-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            setNumber: setNum,
            weight: isNaN(weight) ? 0 : weight,
            reps: isNaN(reps) ? 0 : reps,
            restTimeSeconds: isNaN(rest) ? 0 : rest,
            isDoubleVolume: isDouble,
            minutes: (cardioMins !== undefined && !isNaN(cardioMins)) ? cardioMins : undefined,
            pace: cardioPace || undefined,
            inclineAngle: (cardioIncline !== undefined && !isNaN(cardioIncline)) ? cardioIncline : undefined
          };
          ex.sets.push(setLog);
        }
      }
    }

    tempLogsMap.forEach(log => {
      log.exercises.forEach(ex => {
        ex.sets.sort((a, b) => a.setNumber - b.setNumber);
        ex.sets.forEach((set, sIdx) => {
          set.setNumber = sIdx + 1;
        });
      });
    });

    const updatedList = Array.from(tempLogsMap.values());
    saveLogsToStorage(updatedList);
    showToast("History CSV records successfully imported and merged!", "success");
  };

  // Committed set editing action triggers
  const startEditingSet = (set: SetLog) => {
    setEditingSetId(set.id);
    setEditSetWeight(set.weight);
    setEditSetReps(set.reps);
    setEditSetRest(set.restTimeSeconds);
    setEditSetIsDouble(!!set.isDoubleVolume);
    setEditSetMinutes(set.minutes || 0);
    setEditSetPace(set.pace || '');
    setEditSetIncline(set.inclineAngle || 0);
  };

  const handleSaveSetEdit = (exerciseId: string) => {
    if (!editingSetId) return;
    
    let updatedLogs = [...logs];
    const logIndex = updatedLogs.findIndex(log => log.date === selectedDate);
    if (logIndex < 0) return;
    
    const exIndex = updatedLogs[logIndex].exercises.findIndex(ex => ex.id === exerciseId);
    if (exIndex < 0) return;

    updatedLogs[logIndex].exercises[exIndex].sets = updatedLogs[logIndex].exercises[exIndex].sets.map(s => {
      if (s.id === editingSetId) {
        return {
          ...s,
          weight: typeof editSetWeight === 'string' ? parseFloat(editSetWeight) || 0 : editSetWeight || 0,
          reps: editSetReps,
          restTimeSeconds: editSetRest,
          isDoubleVolume: editSetIsDouble,
          minutes: editSetMinutes > 0 ? editSetMinutes : undefined,
          pace: editSetPace ? editSetPace : undefined,
          inclineAngle: editSetIncline > 0 ? editSetIncline : undefined
        };
      }
      return s;
    });

    saveLogsToStorage(updatedLogs);
    setEditingSetId(null);
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
    return exerciseSuggestions.filter(item => 
      item.name.toLowerCase().includes(exerciseInput.toLowerCase())
    ).slice(0, 5);
  }, [exerciseInput, exerciseSuggestions]);

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
    const lastSet = draftSets[draftSets.length - 1] || { weight: 45, reps: 10, restTimeSeconds: 60, isDoubleVolume: globalDoubleVolume, minutes: 10, pace: '5:30/km', inclineAngle: 15 };
    setDraftSets([...draftSets, { ...lastSet, isDoubleVolume: globalDoubleVolume }]);
  };

  const removeDraftSet = (idx: number) => {
    if (draftSets.length <= 1) return;
    setDraftSets(draftSets.filter((_, i) => i !== idx));
  };

  const updateDraftSet = (idx: number, field: 'weight' | 'reps' | 'restTimeSeconds' | 'isDoubleVolume' | 'minutes' | 'pace' | 'inclineAngle', value: any) => {
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
    showToast("Session health metrics and recovery notes saved!", "success");
  };

  // Submit complete exercise to active log
  const handleSaveExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exerciseInput.trim()) return;

    const formattedSets: SetLog[] = draftSets.map((set, idx) => ({
      id: `set-${Date.now()}-${idx}`,
      setNumber: idx + 1,
      weight: selectedCategory === 'Cardio' ? 0 : (typeof set.weight === 'string' ? parseFloat(set.weight) || 0 : set.weight || 0),
      reps: selectedCategory === 'Cardio' ? 0 : (set.reps || 1),
      restTimeSeconds: selectedCategory === 'Cardio' ? 0 : (set.restTimeSeconds || 0),
      isDoubleVolume: selectedCategory === 'Cardio' ? false : !!set.isDoubleVolume,
      minutes: selectedCategory === 'Cardio' ? (set.minutes !== undefined ? set.minutes : 10) : undefined,
      pace: selectedCategory === 'Cardio' ? (set.pace !== undefined ? set.pace : '5:30/km') : undefined,
      inclineAngle: selectedCategory === 'Cardio' ? (set.inclineAngle !== undefined ? set.inclineAngle : 15) : undefined
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

    const trimmedExName = exerciseInput.trim();
    if (trimmedExName) {
      setExerciseSuggestions(prev => {
        const exists = prev.some(
          item => item.name.toLowerCase() === trimmedExName.toLowerCase() && item.category === selectedCategory
        );
        if (!exists) {
          const updated = [...prev, { name: trimmedExName, category: selectedCategory }];
          localStorage.setItem('workout_tracker_custom_suggestions', JSON.stringify(updated));
          return updated;
        }
        return prev;
      });
    }

    // Reset exercise form
    setExerciseInput('');
    setDraftSets([{ weight: 45, reps: 10, restTimeSeconds: 60, isDoubleVolume: false, minutes: 10, pace: '5:30/km', inclineAngle: 15 }]);
    setGlobalDoubleVolume(false);
    setShowSuggestions(false);
  };

  const handleCopyMuscleGroupToToday = (muscleGroup: string, sourceDate: string) => {
    const todayStr = formatDateString(new Date());
    if (sourceDate === todayStr) {
      showToast("Cannot copy to today because you are already viewing today's session.", "error");
      return;
    }

    const sourceLog = logs.find(log => log.date === sourceDate);
    if (!sourceLog) {
      showToast("No source data found for this date.", "error");
      return;
    }

    const exercisesToCopy = sourceLog.exercises.filter(ex => ex.category === muscleGroup);
    if (exercisesToCopy.length === 0) {
      showToast(`No exercises found for ${muscleGroup} on this date.`, "info");
      return;
    }

    const copiedExercises: ExerciseLog[] = exercisesToCopy.map(ex => ({
      ...ex,
      id: `ex-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sets: ex.sets.map((set, sIdx) => ({
        ...set,
        id: `set-${Date.now()}-${sIdx}-${Math.random().toString(36).substr(2, 9)}`
      }))
    }));

    let updatedLogs = [...logs];
    let todayLogIndex = updatedLogs.findIndex(log => log.date === todayStr);

    if (todayLogIndex >= 0) {
      updatedLogs[todayLogIndex] = {
        ...updatedLogs[todayLogIndex],
        exercises: [...(updatedLogs[todayLogIndex].exercises || []), ...copiedExercises]
      };
    } else {
      updatedLogs.push({
        date: todayStr,
        exercises: copiedExercises,
        bodyWeight: undefined,
        notes: ''
      });
    }

    saveLogsToStorage(updatedLogs);
    showToast(`Copied ${copiedExercises.length} ${muscleGroup} exercise(s) to Today (${todayStr})!`, "success");
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
    if (!resetConfirm) {
      setResetConfirm(true);
      return;
    }
    saveLogsToStorage(generateInitialData());
    setResetConfirm(false);
    showToast("Helpful beginner sample data restored successfully!", "success");
  };

  const handleClearAllData = () => {
    if (!clearConfirm) {
      setClearConfirm(true);
      return;
    }
    saveLogsToStorage([]);
    setBodyWeightInput('');
    setNotesInput('');
    setClearConfirm(false);
    showToast("All tracking logs wiped successfully!", "info");
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
                if (ex.category !== 'Cardio') {
                  const mult = set.isDoubleVolume ? 2 : 1;
                  totalVolume += (set.weight * set.reps * mult);
                }
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

  // Memoized Volume Breakdown Show by parts
  const volumeByParts = useMemo(() => {
    const parts: Record<string, number> = {};
    CATEGORIES.forEach(cat => {
      parts[cat] = 0;
    });
    if (activeDayLog) {
      activeDayLog.exercises.forEach(ex => {
        const cat = ex.category || 'Other';
        const vol = ex.sets.reduce((sum, s) => {
          if (cat === 'Cardio') return sum;
          const mult = s.isDoubleVolume ? 2 : 1;
          return sum + (s.weight * s.reps * mult);
        }, 0);
        parts[cat] = (parts[cat] || 0) + vol;
      });
    }
    return parts;
  }, [activeDayLog]);

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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-4 sm:p-6 lg:p-8 relative">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            id="toast-notification"
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-zinc-900 border-l-4 border-lime-400 text-white px-5 py-3 shadow-[0_10px_35px_rgba(0,0,0,0.8)] border border-zinc-800 rounded font-mono text-xs max-w-md w-[calc(100%-2rem)]"
          >
            <div className={`w-2 h-2 rounded-full shrink-0 ${toast.type === 'error' ? 'bg-red-500 animate-pulse' : toast.type === 'success' ? 'bg-lime-500 animate-ping' : 'bg-lime-400 animate-pulse'}`} />
            <div className="flex-1 font-bold">{toast.message}</div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Container wrapper limiting maximum width for modern visual spacing */}
      <div id="app_container" className="max-w-7xl mx-auto space-y-8 animate-[fadeIn_0.5s_ease-out]">
        
        {/* UPPER BRANDING HEADER WITH ACTIVE PWA USAGI LOGO */}
        <header id="app_header" className="flex flex-col sm:flex-row justify-between items-center gap-4 pb-4 border-b-2 border-zinc-900">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <img 
              src="./icon.png?v=2" 
              alt="Cartoon Usagi Bench Press" 
              referrerPolicy="no-referrer"
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg border border-lime-400 p-0.5 bg-zinc-900 shadow-md object-contain shrink-0"
            />
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-none uppercase text-white font-display">
                STRENGTH<span className="text-lime-400">.LOG</span>
                <span className="inline-block text-[8px] bg-zinc-900 border border-zinc-800 text-lime-400 font-mono font-bold px-1 py-[1px] rounded ml-2 uppercase tracking-wider align-middle">v2.5</span>
              </h1>
            </div>
          </div>
          <div className="flex flex-col sm:items-end w-full sm:w-auto gap-1.5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 sm:justify-end">
              <div className="flex items-center gap-1.5">
                <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold font-mono">Selected Session:</p>
                <p className="text-sm font-mono text-lime-400 font-extrabold uppercase">
                  {(() => {
                    const parts = selectedDate.split('-');
                    if (parts.length === 3) {
                      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
                    }
                    return selectedDate;
                  })()}
                </p>
              </div>

              {/* Body Weight input row next to the date */}
              <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5">
                <span className="text-zinc-500 text-[8px] uppercase tracking-wider font-bold font-mono">BW:</span>
                <input
                  type="number"
                  step="0.1"
                  placeholder="--"
                  value={bodyWeightInput}
                  onChange={(e) => setBodyWeightInput(e.target.value)}
                  className="w-12 bg-transparent text-white text-[11px] font-black font-mono text-center outline-none"
                  title="Body Weight"
                />
                <span className="text-zinc-500 text-[8px] font-bold font-mono uppercase">{weightUnit}</span>
                <button
                  type="button"
                  onClick={handleSaveDayMeta}
                  className="ml-1 bg-lime-400 hover:bg-white text-black font-black text-[8px] px-1 py-[2px] rounded-xs transition-colors cursor-pointer uppercase leading-none"
                  title="Save body weight metrics"
                >
                  Save
                </button>
              </div>
            </div>

            {/* PREFERRED UNIT TOGGLE & BACKUP TOOLS */}
            <div id="unit_controls" className="flex items-center gap-2 select-none">
              <div className="bg-zinc-900 px-2 py-1 border border-zinc-800 text-[9px] font-black font-mono text-lime-400 uppercase tracking-widest select-none">
                KG
              </div>

              <button 
                onClick={handleResetSeedData}
                className={`px-2 py-1 transition duration-200 text-[9px] font-bold font-mono uppercase cursor-pointer border ${
                  resetConfirm 
                    ? "bg-amber-950/40 text-amber-400 border-amber-500/80 animate-pulse" 
                    : "bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white border-zinc-805"
                }`}
              >
                {resetConfirm ? "Confirm resetting?" : "Reset Demo"}
              </button>
              <button 
                onClick={handleClearAllData}
                className={`px-2 py-1 transition duration-200 text-[9px] font-bold font-mono uppercase cursor-pointer border ${
                  clearConfirm 
                    ? "bg-red-950 text-red-400 border-red-500/80 animate-pulse animate-duration-500" 
                    : "bg-zinc-900 hover:bg-red-950/20 text-red-400 border-zinc-855"
                }`}
              >
                {clearConfirm ? "Confirm Wiping?" : "Clear Logs"}
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

            {/* 3. EXPORT & IMPORT TRAINING JOURNAL (DATA CONTROL CENTER) */}
            <div id="export_data_center" className="bg-zinc-900 border-l-4 border-lime-400 p-4 shadow-xl w-full order-6 lg:order-none">
              <div className="flex gap-2">
                <button 
                  onClick={handleExportToExcel}
                  className="flex-1 bg-lime-400 text-black hover:bg-white transition-all font-black uppercase text-[10px] py-2 px-3 font-mono tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
                <button 
                  onClick={() => {
                    const el = document.getElementById('csv-file-upload');
                    if (el) (el as HTMLInputElement).click();
                  }}
                  className="flex-1 bg-zinc-950 border border-zinc-800 text-lime-400 hover:bg-zinc-800 hover:text-white transition-all font-black uppercase text-[10px] py-2 px-3 font-mono tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import CSV</span>
                </button>
                <input 
                  type="file" 
                  id="csv-file-upload" 
                  accept=".csv" 
                  onChange={handleFileChange} 
                  className="sr-only" 
                />
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
            <div id="day_log_activities" className="bg-zinc-900 border-t-4 border-lime-400 p-4 sm:p-6 shadow-xl space-y-4 sm:space-y-6 w-full order-2 lg:order-none">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-3 gap-3">
                <div>
                  <div className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest font-mono">ACTIVITY TRACKER</div>
                  <h2 className="font-display font-black text-white tracking-tighter text-2xl sm:text-3xl uppercase">
                    TRAINING LOG
                  </h2>
                </div>

                <div className="flex flex-col text-right font-mono text-[11px] shrink-0 border-l border-zinc-800 pl-3">
                  <div className="font-bold text-lime-400">
                    VOL: <span className="text-white font-extrabold">{activeDayLog ? activeDayLog.exercises.reduce((sum, ex) => {
                      if (ex.category === 'Cardio') return sum;
                      return sum + ex.sets.reduce((es, s) => {
                        const mult = s.isDoubleVolume ? 2 : 1;
                        return es + (s.weight * s.reps * mult);
                      }, 0);
                    }, 0).toLocaleString() : 0}</span> {weightUnit.toUpperCase()}
                  </div>
                  {activeDayLog?.bodyWeight ? (
                    <div className="text-[10px] text-zinc-400 mt-0.5">
                      BW: <span className="text-white font-extrabold">{activeDayLog.bodyWeight}</span> {weightUnit.toUpperCase()}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Volume breakdown shown by parts */}
              {activeDayLog && activeDayLog.exercises.length > 0 && (
                <div className="space-y-1.5 font-mono">
                  <div className="text-[9px] font-bold text-zinc-500 font-mono tracking-widest uppercase">
                    Volume Breakdown By Muscle Group
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-2 px-1.5 py-1.5 bg-zinc-950 border border-zinc-855">
                    {Object.entries(volumeByParts).map(([part, vol]) => {
                      const numericVol = vol as number;
                      const isSelectedPartUsed = numericVol > 0;
                      const hasExercisesOnDay = activeDayLog?.exercises.some(ex => ex.category === part);
                      const showCopyButton = selectedDate !== formatDateString(new Date()) && hasExercisesOnDay;
                      return (
                        <div 
                          key={part} 
                          className={`p-2 flex flex-col justify-between font-mono text-[9px] border transition min-h-[50px] ${
                            isSelectedPartUsed 
                              ? 'border-lime-400/35 bg-lime-400/5 text-lime-400' 
                              : 'border-zinc-900 bg-zinc-900/10 text-zinc-600'
                          }`}
                        >
                          <div>
                            <span className="font-bold uppercase tracking-wider block truncate text-[8px]">{part}</span>
                            <span className="text-sm font-black text-white mt-0.5 block leading-none">
                              {numericVol > 0 ? `${Number(numericVol.toFixed(1)).toLocaleString()}` : '0'} <span className="text-[7px] text-zinc-500">KG</span>
                            </span>
                          </div>
                          {showCopyButton && (
                            <button
                              type="button"
                              onClick={() => handleCopyMuscleGroupToToday(part, selectedDate)}
                              className="mt-1.5 w-full bg-lime-400 hover:bg-white text-black font-black text-[7px] py-1 rounded-xs uppercase tracking-wider flex items-center justify-center gap-0.5 transition-all cursor-pointer shadow-sm"
                              title={`Copy all ${part} exercises from this day to Today`}
                            >
                              <Copy className="w-2 h-2" />
                              <span>Copy</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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
                      const exVolume = exercise.sets.reduce((total, set) => {
                        if (exercise.category === 'Cardio') return 0;
                        const mult = set.isDoubleVolume ? 2 : 1;
                        return total + (set.weight * set.reps * mult);
                      }, 0);

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
                              {exercise.sets.map((set, sIdx) => {
                                const isEditing = editingSetId === set.id;
                                if (isEditing) {
                                  if (exercise.category === 'Cardio') {
                                    return (
                                      <div key={set.id} className="flex flex-col gap-2 bg-zinc-950 border-2 border-lime-400 p-3 text-xs font-mono">
                                        <div className="grid grid-cols-3 gap-2">
                                          <div>
                                            <label className="text-[8px] text-zinc-500 font-bold block mb-1 uppercase tracking-widest">MINS</label>
                                            <input
                                              type="number"
                                              value={editSetMinutes}
                                              onChange={(e) => setEditSetMinutes(parseFloat(e.target.value) || 0)}
                                              className="w-full bg-zinc-900 border border-zinc-800 text-white px-2 py-1 select-all outline-none font-bold"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-[8px] text-zinc-500 font-bold block mb-1 uppercase tracking-widest">PACE</label>
                                            <input
                                              type="text"
                                              value={editSetPace}
                                              onChange={(e) => setEditSetPace(e.target.value)}
                                              className="w-full bg-zinc-900 border border-zinc-800 text-white px-2 py-1 select-all outline-none font-bold"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-[8px] text-zinc-500 font-bold block mb-1 uppercase tracking-widest">INCLINE %</label>
                                            <input
                                              type="number"
                                              value={editSetIncline}
                                              onChange={(e) => setEditSetIncline(parseFloat(e.target.value) || 0)}
                                              className="w-full bg-zinc-900 border border-zinc-800 text-white px-2 py-1 select-all outline-none font-bold"
                                            />
                                          </div>
                                        </div>
                                        <div className="flex gap-1.5 justify-end items-center mt-1 pt-1.5 border-t border-zinc-850">
                                          <button
                                            type="button"
                                            onClick={() => handleSaveSetEdit(exercise.id)}
                                            className="px-2.5 py-1 bg-lime-400 text-black hover:bg-white transition-all font-black uppercase text-[10px] rounded-sm cursor-pointer"
                                          >
                                            Save Set
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setEditingSetId(null)}
                                            className="px-2.5 py-1 bg-zinc-900 text-zinc-450 hover:text-white transition-all font-black uppercase text-[10px] rounded-sm cursor-pointer"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  } else {
                                    return (
                                      <div key={set.id} className="flex flex-col gap-2 bg-zinc-950 border-2 border-lime-400 p-3 text-xs font-mono">
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                          <div>
                                            <label className="text-[8px] text-zinc-500 font-bold block mb-0.5 uppercase tracking-widest">Weight</label>
                                            <input
                                              type="number"
                                              step="0.1"
                                              value={editSetWeight !== undefined && editSetWeight !== null ? editSetWeight : ''}
                                              onChange={(e) => setEditSetWeight(e.target.value)}
                                              className="w-full bg-zinc-900 border border-zinc-800 text-white px-2 py-1 select-all outline-none font-bold"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-[8px] text-zinc-500 font-bold block mb-0.5 uppercase tracking-widest">Reps</label>
                                            <select
                                              value={editSetReps}
                                              onChange={(e) => setEditSetReps(parseInt(e.target.value))}
                                              className="w-full bg-zinc-900 border border-zinc-800 text-white px-1 py-1 outline-none font-bold cursor-pointer"
                                            >
                                              {Array.from({ length: 40 }, (_, i) => i + 1).map((n) => (
                                                <option key={n} value={n} className="bg-zinc-905 text-white">{n} REPS</option>
                                              ))}
                                            </select>
                                          </div>
                                          <div>
                                            <label className="text-[8px] text-zinc-500 font-bold block mb-0.5 uppercase tracking-widest">Rest Timer</label>
                                            <select
                                              value={editSetRest}
                                              onChange={(e) => setEditSetRest(parseInt(e.target.value))}
                                              className="w-full bg-zinc-900 border border-zinc-800 text-white px-1 py-1 outline-none font-bold cursor-pointer text-[10px]"
                                            >
                                              <option value={0} className="bg-zinc-950 text-white font-mono">NO REST</option>
                                              <option value={30} className="bg-zinc-950 text-white font-mono">30s Rest</option>
                                              <option value={60} className="bg-zinc-950 text-white font-mono">60s Rest</option>
                                              <option value={90} className="bg-zinc-950 text-white font-mono">90s Rest</option>
                                              <option value={120} className="bg-zinc-950 text-white font-mono">120s Rest</option>
                                              <option value={180} className="bg-zinc-950 text-white font-mono">180s Rest</option>
                                            </select>
                                          </div>
                                          <div>
                                            <label className="text-[8px] text-zinc-500 font-bold block mb-0.5 uppercase tracking-widest">2x Factor</label>
                                            <button
                                              type="button"
                                              onClick={() => setEditSetIsDouble(!editSetIsDouble)}
                                              className={`w-full py-1.5 text-[10px] font-black uppercase transition border text-center cursor-pointer ${
                                                editSetIsDouble 
                                                  ? 'bg-lime-400 text-black border-lime-400 font-extrabold shadow-sm' 
                                                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                                              }`}
                                            >
                                              {editSetIsDouble ? '2X FACTOR ON' : '1X NORMAL'}
                                            </button>
                                          </div>
                                        </div>
                                        <div className="flex gap-1.5 justify-end items-center mt-1 pt-1.5 border-t border-zinc-850">
                                          <button
                                            type="button"
                                            onClick={() => handleSaveSetEdit(exercise.id)}
                                            className="px-2.5 py-1 bg-lime-400 text-black hover:bg-white transition-all font-black uppercase text-[10px] rounded-sm cursor-pointer"
                                          >
                                            Save Set
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setEditingSetId(null)}
                                            className="px-2.5 py-1 bg-zinc-900 text-zinc-450 hover:text-white transition-all font-black uppercase text-[10px] rounded-sm cursor-pointer"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  }
                                }

                                return (
                                  <div key={set.id} className="flex items-center justify-between text-xs font-mono bg-zinc-900 border border-zinc-850 px-3 py-2 hover:border-zinc-800 transition">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-zinc-500 font-bold uppercase">
                                        {exercise.category === 'Cardio' ? `RD ${sIdx + 1}` : `SET 0${sIdx + 1}`}
                                      </span>
                                      {set.isDoubleVolume && (
                                        <span className="text-[8px] tracking-wider bg-lime-400/15 border border-lime-400/40 px-1.5 py-0.2 rounded text-lime-400 font-mono font-black uppercase">2X VOL</span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {exercise.category === 'Cardio' ? (
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-bold text-white">{set.minutes || 0}m</span>
                                          <span className="text-zinc-850">/</span>
                                          <span className="font-bold text-lime-400 text-[11px] truncate max-w-[80px]">{set.pace || '5:30/km'}</span>
                                          {set.inclineAngle !== undefined && set.inclineAngle !== null && set.inclineAngle > 0 && (
                                            <>
                                              <span className="text-zinc-850">/</span>
                                              <span className="font-bold text-yellow-400">{set.inclineAngle}%^</span>
                                            </>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-black text-white">{set.weight} {weightUnit.toUpperCase()}</span>
                                          <span className="text-zinc-800">/</span>
                                          <span className="font-black text-lime-400">{set.reps}r</span>
                                          {set.restTimeSeconds > 0 && (
                                            <>
                                              <span className="text-zinc-800">/</span>
                                              <button 
                                                onClick={() => startTimer(set.restTimeSeconds)}
                                                title="Start Rest Timer"
                                                className="text-zinc-400 hover:text-lime-400 flex items-center gap-1 font-semibold transition cursor-pointer"
                                              >
                                                <Clock className="w-3 h-3 text-lime-400" />
                                                {set.restTimeSeconds}s
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      )}
                                      <span className="text-zinc-800 font-mono">|</span>
                                      <button
                                        type="button"
                                        onClick={() => startEditingSet(set)}
                                        className="text-zinc-500 hover:text-lime-400 p-1.5 transition cursor-pointer"
                                        title="Edit Set"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="border-t border-zinc-900 mt-5 pt-3 flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                            <span>TOTAL SETS: 0{exercise.sets.length}</span>
                            {exercise.category === 'Cardio' ? (
                              <span className="font-bold text-lime-450">CARDIO LOG</span>
                            ) : (
                              <span className="font-bold text-lime-450">VOLUME: <span className="text-white font-extrabold">{exVolume.toLocaleString()}</span> {weightUnit.toUpperCase()}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

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
                      MUSCLE TARGET GROUP & MULTIPLIER
                    </label>
                    <div className="flex gap-2">
                      <select
                        id="category_select"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-lime-400 focus:ring-1 focus:ring-lime-400 text-white p-3 font-bold uppercase text-xs sm:text-sm outline-none transition cursor-pointer"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat} className="bg-zinc-950">{cat.toUpperCase()}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleGlobalDoubleVolumeToggle}
                        className={`px-4 font-mono font-black text-xs uppercase tracking-wider border transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
                          globalDoubleVolume 
                            ? 'bg-lime-400 text-black border-lime-400 font-extrabold shadow-sm' 
                            : 'bg-zinc-950 text-zinc-500 border-zinc-800 hover:text-zinc-300'
                        }`}
                        title="Toggle 2X Volume Factor for ALL sets in this exercise"
                      >
                        2X
                      </button>
                    </div>
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



                  {/* Dynamic set list container elements */}
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {draftSets.map((set, index) => (
                      <div key={index} className="flex items-center gap-1.5 py-1.5 border-b border-zinc-800/50 font-mono text-xs">
                        {/* Set/Round Index label */}
                        <span className="text-[10px] text-zinc-500 font-bold shrink-0 min-w-[24px] text-center">
                          {selectedCategory === 'Cardio' ? `R${index + 1}` : `S${index + 1}`}
                        </span>

                        {selectedCategory === 'Cardio' ? (
                          <>
                            {/* Duration Minutes */}
                            <div className="flex-1 min-w-[55px] bg-zinc-950 border border-zinc-800 rounded-sm">
                              <input
                                type="number"
                                min="0"
                                max="999"
                                required
                                placeholder="Mins"
                                value={set.minutes !== undefined ? set.minutes : ''}
                                onChange={(e) => updateDraftSet(index, 'minutes', parseFloat(e.target.value) || 0)}
                                className="w-full bg-transparent text-white font-mono text-center text-xs font-bold outline-none py-1.5 px-1"
                              />
                            </div>

                            {/* Pace */}
                            <div className="flex-1 min-w-[75px] bg-zinc-950 border border-zinc-800 rounded-sm">
                              <input
                                type="text"
                                placeholder="Pace"
                                value={set.pace || ''}
                                onChange={(e) => updateDraftSet(index, 'pace', e.target.value)}
                                className="w-full bg-transparent text-white font-mono text-center text-xs font-bold outline-none py-1.5 px-1"
                              />
                            </div>

                            {/* Incline */}
                            <div className="flex-1 min-w-[55px] bg-zinc-950 border border-zinc-800 rounded-sm">
                              <input
                                type="number"
                                min="0"
                                max="45"
                                step="0.5"
                                placeholder="Incline%"
                                value={set.inclineAngle !== undefined ? set.inclineAngle : ''}
                                onChange={(e) => updateDraftSet(index, 'inclineAngle', parseFloat(e.target.value) || 0)}
                                className="w-full bg-transparent text-white font-mono text-center text-xs font-bold outline-none py-1.5 px-1"
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            {/* Weight selection input */}
                            <div className="flex-1 min-w-[70px] flex items-center bg-zinc-950 border border-zinc-800 rounded-sm px-1">
                              <input
                                type="number"
                                min="0"
                                max="999"
                                step="0.1"
                                required
                                placeholder={`Wt (${weightUnit})`}
                                value={set.weight !== undefined && set.weight !== null ? set.weight : ''}
                                onChange={(e) => updateDraftSet(index, 'weight', e.target.value)}
                                className="w-full bg-transparent text-white font-mono text-center text-xs font-bold outline-none py-1"
                              />
                              <div className="flex flex-col gap-[1px] shrink-0">
                                <button
                                  type="button"
                                  onClick={() => updateDraftSet(index, 'weight', parseFloat((parseFloat(String(set.weight || 0)) + 2.5).toFixed(1)))}
                                  className="text-[7px] leading-none bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-bold px-1 py-0.5 rounded-xs"
                                >
                                  +
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateDraftSet(index, 'weight', Math.max(0, parseFloat((parseFloat(String(set.weight || 0)) - 2.5).toFixed(1))))}
                                  className="text-[7px] leading-none bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-bold px-1 py-0.5 rounded-xs"
                                >
                                  -
                                </button>
                              </div>
                            </div>

                            {/* Reps */}
                            <div className="shrink-0 w-16 bg-zinc-950 border border-zinc-800 rounded-sm">
                              <select
                                value={set.reps}
                                onChange={(e) => updateDraftSet(index, 'reps', parseInt(e.target.value))}
                                className="w-full bg-transparent text-white font-mono text-center text-xs font-bold outline-none cursor-pointer py-1.5"
                              >
                                {Array.from({ length: 40 }, (_, i) => i + 1).map((num) => (
                                  <option key={num} value={num} className="bg-zinc-950 text-white font-mono">{num} reps</option>
                                ))}
                              </select>
                            </div>

                            {/* Rest */}
                            <div className="shrink-0 w-16 bg-zinc-950 border border-zinc-800 rounded-sm">
                              <select
                                value={set.restTimeSeconds}
                                onChange={(e) => updateDraftSet(index, 'restTimeSeconds', parseInt(e.target.value))}
                                className="w-full bg-transparent text-white font-mono text-center text-[10px] font-bold outline-none cursor-pointer py-1.5"
                              >
                                <option value={0} className="bg-zinc-950 text-white font-mono">no rest</option>
                                <option value={15} className="bg-zinc-950 text-white font-mono">15s</option>
                                <option value={30} className="bg-zinc-950 text-white font-mono">30s</option>
                                <option value={45} className="bg-zinc-950 text-white font-mono">45s</option>
                                <option value={60} className="bg-zinc-950 text-white font-mono">1m</option>
                                <option value={90} className="bg-zinc-950 text-white font-mono">1.5m</option>
                                <option value={120} className="bg-zinc-950 text-white font-mono">2m</option>
                                <option value={180} className="bg-zinc-950 text-white font-mono">3m</option>
                              </select>
                            </div>

                          </>
                        )}

                        {/* Delete row */}
                        <button
                          type="button"
                          onClick={() => removeDraftSet(index)}
                          disabled={draftSets.length <= 1}
                          className={`p-1 transition-all shrink-0 cursor-pointer ${
                            draftSets.length <= 1 
                              ? 'text-zinc-800 cursor-not-allowed' 
                              : 'text-zinc-500 hover:text-red-400'
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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

        {/* Footer Decorative */}
        <footer className="mt-8 flex flex-col sm:flex-row justify-between items-center text-[10px] text-zinc-650 font-mono border-t border-zinc-900 pt-6 gap-2">
          <div className="uppercase">SYSTEM STATUS: OPTIMIZED FOR STRENGTH // TRAINING METHOD: PROGRESSIVE OVERLOAD</div>
          <div className="uppercase">v1.1.0-beta_stable_release_bold</div>
        </footer>

      </div>
    </div>
  );
}

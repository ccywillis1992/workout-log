import { DailyLog } from './types';

// Helper to format date as YYYY-MM-DD in local time
export function formatDateString(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getPastDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return formatDateString(date);
}

export const EXERCISE_SUGGESTIONS = [
  { name: 'Bench Press', category: 'Chest' },
  { name: 'Incline Dumbbell Press', category: 'Chest' },
  { name: 'Barbell Squat', category: 'Legs' },
  { name: 'Leg Press', category: 'Legs' },
  { name: 'Romanian Deadlift', category: 'Legs' },
  { name: 'Barbell Row', category: 'Back' },
  { name: 'Lat Pulldown', category: 'Back' },
  { name: 'Pull-up', category: 'Back' },
  { name: 'Overhead Press', category: 'Shoulders' },
  { name: 'Dumbbell Lateral Raise', category: 'Shoulders' },
  { name: 'Bicep Curl', category: 'Arms' },
  { name: 'Tricep Pushdown', category: 'Arms' },
  { name: 'Hanging Leg Raise', category: 'Core' },
  { name: 'Plank', category: 'Core' },
  { name: 'Treadmill Run', category: 'Cardio' },
];

export const CATEGORIES = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio', 'Other'];

export function generateInitialData(): DailyLog[] {
  return [
    {
      date: getPastDate(14),
      bodyWeight: 165.0,
      notes: "First day at the gym! Felt amazing, albeit slightly sore later.",
      exercises: [
        {
          id: 'ex-14-1',
          exerciseName: 'Barbell Squat',
          category: 'Legs',
          sets: [
            { id: 'set-14-1-1', setNumber: 1, weight: 45, reps: 10, restTimeSeconds: 90 },
            { id: 'set-14-1-2', setNumber: 2, weight: 65, reps: 8, restTimeSeconds: 90 },
            { id: 'set-14-1-3', setNumber: 3, weight: 65, reps: 8, restTimeSeconds: 120 }
          ]
        },
        {
          id: 'ex-14-2',
          exerciseName: 'Leg Press',
          category: 'Legs',
          sets: [
            { id: 'set-14-2-1', setNumber: 1, weight: 90, reps: 10, restTimeSeconds: 60 },
            { id: 'set-14-2-2', setNumber: 2, weight: 110, reps: 10, restTimeSeconds: 60 }
          ]
        }
      ]
    },
    {
      date: getPastDate(12),
      bodyWeight: 165.2,
      notes: "Upper body focus. Focused on slow, controlled motions.",
      exercises: [
        {
          id: 'ex-12-1',
          exerciseName: 'Bench Press',
          category: 'Chest',
          sets: [
            { id: 'set-12-1-1', setNumber: 1, weight: 45, reps: 12, restTimeSeconds: 90 },
            { id: 'set-12-1-2', setNumber: 2, weight: 65, reps: 10, restTimeSeconds: 90 },
            { id: 'set-12-1-3', setNumber: 3, weight: 75, reps: 8, restTimeSeconds: 90 }
          ]
        },
        {
          id: 'ex-12-2',
          exerciseName: 'Lat Pulldown',
          category: 'Back',
          sets: [
            { id: 'set-12-2-1', setNumber: 1, weight: 60, reps: 12, restTimeSeconds: 60 },
            { id: 'set-12-2-2', setNumber: 2, weight: 70, reps: 10, restTimeSeconds: 60 }
          ]
        }
      ]
    },
    {
      date: getPastDate(10),
      bodyWeight: 165.1,
      notes: "Consistency is key. Squats feeling slightly smoother.",
      exercises: [
        {
          id: 'ex-10-1',
          exerciseName: 'Barbell Squat',
          category: 'Legs',
          sets: [
            { id: 'set-10-1-1', setNumber: 1, weight: 65, reps: 10, restTimeSeconds: 90 },
            { id: 'set-10-1-2', setNumber: 2, weight: 75, reps: 8, restTimeSeconds: 90 },
            { id: 'set-10-1-3', setNumber: 3, weight: 85, reps: 8, restTimeSeconds: 120 }
          ]
        },
        {
          id: 'ex-10-2',
          exerciseName: 'Overhead Press',
          category: 'Shoulders',
          sets: [
            { id: 'set-10-2-1', setNumber: 1, weight: 30, reps: 12, restTimeSeconds: 60 },
            { id: 'set-10-2-2', setNumber: 2, weight: 40, reps: 10, restTimeSeconds: 90 }
          ]
        }
      ]
    },
    {
      date: getPastDate(8),
      bodyWeight: 165.7,
      notes: "First time trying Pull-ups. Needed resistance band helper, but great pump!",
      exercises: [
        {
          id: 'ex-8-1',
          exerciseName: 'Pull-up',
          category: 'Back',
          sets: [
            { id: 'set-8-1-1', setNumber: 1, weight: 0, reps: 6, restTimeSeconds: 90 },
            { id: 'set-8-1-2', setNumber: 2, weight: 0, reps: 5, restTimeSeconds: 90 },
            { id: 'set-8-1-3', setNumber: 3, weight: 0, reps: 4, restTimeSeconds: 120 }
          ]
        },
        {
          id: 'ex-8-2',
          exerciseName: 'Bench Press',
          category: 'Chest',
          sets: [
            { id: 'set-8-2-1', setNumber: 1, weight: 65, reps: 10, restTimeSeconds: 90 },
            { id: 'set-8-2-2', setNumber: 2, weight: 75, reps: 10, restTimeSeconds: 90 },
            { id: 'set-8-2-3', setNumber: 3, weight: 85, reps: 6, restTimeSeconds: 90 }
          ]
        }
      ]
    },
    {
      date: getPastDate(6),
      bodyWeight: 165.8,
      notes: "Leg day again. Moving up in weight on squats, form felt very solid.",
      exercises: [
        {
          id: 'ex-6-1',
          exerciseName: 'Barbell Squat',
          category: 'Legs',
          sets: [
            { id: 'set-6-1-1', setNumber: 1, weight: 75, reps: 10, restTimeSeconds: 90 },
            { id: 'set-6-1-2', setNumber: 2, weight: 85, reps: 8, restTimeSeconds: 90 },
            { id: 'set-6-1-3', setNumber: 3, weight: 95, reps: 8, restTimeSeconds: 120 }
          ]
        },
        {
          id: 'ex-6-2',
          exerciseName: 'Hanging Leg Raise',
          category: 'Core',
          sets: [
            { id: 'set-6-2-1', setNumber: 1, weight: 0, reps: 12, restTimeSeconds: 60 },
            { id: 'set-6-2-2', setNumber: 2, weight: 0, reps: 10, restTimeSeconds: 60 }
          ]
        }
      ]
    },
    {
      date: getPastDate(4),
      bodyWeight: 166.1,
      notes: "Overhead press feels lighter! Increased weight slightly.",
      exercises: [
        {
          id: 'ex-4-1',
          exerciseName: 'Overhead Press',
          category: 'Shoulders',
          sets: [
            { id: 'set-4-1-1', setNumber: 1, weight: 40, reps: 10, restTimeSeconds: 90 },
            { id: 'set-4-1-2', setNumber: 2, weight: 45, reps: 8, restTimeSeconds: 90 },
            { id: 'set-4-1-3', setNumber: 3, weight: 45, reps: 8, restTimeSeconds: 120 }
          ]
        },
        {
          id: 'ex-4-2',
          exerciseName: 'Bicep Curl',
          category: 'Arms',
          sets: [
            { id: 'set-4-2-1', setNumber: 1, weight: 15, reps: 12, restTimeSeconds: 60 },
            { id: 'set-4-2-2', setNumber: 2, weight: 20, reps: 10, restTimeSeconds: 60 }
          ]
        }
      ]
    },
    {
      date: getPastDate(2),
      bodyWeight: 166.4,
      notes: "Pushed raw chest volume today. Felt highly intense and very rewarding.",
      exercises: [
        {
          id: 'ex-2-1',
          exerciseName: 'Bench Press',
          category: 'Chest',
          sets: [
            { id: 'set-2-1-1', setNumber: 1, weight: 65, reps: 12, restTimeSeconds: 90 },
            { id: 'set-2-1-2', setNumber: 2, weight: 75, reps: 10, restTimeSeconds: 90 },
            { id: 'set-2-1-3', setNumber: 3, weight: 85, reps: 8, restTimeSeconds: 90 },
            { id: 'set-2-1-4', setNumber: 4, weight: 95, reps: 5, restTimeSeconds: 120 }
          ]
        },
        {
          id: 'ex-2-2',
          exerciseName: 'Incline Dumbbell Press',
          category: 'Chest',
          sets: [
            { id: 'set-2-2-1', setNumber: 1, weight: 30, reps: 10, restTimeSeconds: 60 },
            { id: 'set-2-2-2', setNumber: 2, weight: 35, reps: 8, restTimeSeconds: 60 }
          ]
        }
      ]
    }
  ];
}

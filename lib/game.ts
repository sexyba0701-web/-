export type MealType = "good" | "normal" | "bad";
export type FormType = "Egg" | "Baby" | "Fighter" | "Beast";
export type ExerciseId = "pushup" | "squat" | "pullup" | "bench" | "deadlift";

export type Profile = {
  createdAt: string;
  streak: number;
  lastActiveDate: string | null;
};

export type Monster = {
  name: string;
  level: number;
  xp: number;
  form: FormType;
  fat: number;
  muscle: number;
  mood: number;
};

export type TrainLog = {
  dateISO: string;
  exerciseId: ExerciseId;
  reps: number;
  points: number;
};

export type FoodLog = {
  dateISO: string;
  mealType: MealType;
};

export type GameData = {
  profile: Profile;
  monster: Monster;
  logs: {
    trainLogs: TrainLog[];
    foodLogs: FoodLog[];
  };
};

export const EXERCISES: Record<
  ExerciseId,
  { id: ExerciseId; name: string; ptPerRep: number }
> = {
  pushup: { id: "pushup", name: "腕立て", ptPerRep: 1 },
  squat: { id: "squat", name: "スクワット", ptPerRep: 1 },
  pullup: { id: "pullup", name: "懸垂", ptPerRep: 4 },
  bench: { id: "bench", name: "ベンチ", ptPerRep: 3 },
  deadlift: { id: "deadlift", name: "デッド", ptPerRep: 4 },
};

export const STORAGE_KEY = "monster-fit-mvp-data-v1";
export const TRAIN_DAILY_CAP = 300;
export const FOOD_DAILY_LIMIT = 3;

const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v));

export const getTodayDate = (): string => new Date().toISOString().slice(0, 10);

const getFormByLevel = (level: number): FormType => {
  if (level <= 2) return "Egg";
  if (level <= 5) return "Baby";
  if (level <= 9) return "Fighter";
  return "Beast";
};

export const defaultData = (): GameData => ({
  profile: {
    createdAt: new Date().toISOString(),
    streak: 0,
    lastActiveDate: null,
  },
  monster: {
    name: "Mogu",
    level: 1,
    xp: 0,
    form: "Egg",
    fat: 1,
    muscle: 0,
    mood: 0,
  },
  logs: {
    trainLogs: [],
    foodLogs: [],
  },
});

export const hydrateMonster = (monster: Monster): Monster => {
  const level = 1 + Math.floor(monster.xp / 100);
  return {
    ...monster,
    level,
    form: getFormByLevel(level),
    fat: Number(clamp(monster.fat, 0, 99).toFixed(1)),
    muscle: Number(clamp(monster.muscle, 0, 99).toFixed(1)),
    mood: clamp(monster.mood, -99, 99),
  };
};

const isYesterday = (last: string, today: string): boolean => {
  const d1 = new Date(`${last}T00:00:00`);
  const d2 = new Date(`${today}T00:00:00`);
  const diffDays = Math.round((d2.getTime() - d1.getTime()) / (24 * 60 * 60 * 1000));
  return diffDays === 1;
};

const ensureActiveDay = (profile: Profile, today: string): Profile => {
  if (profile.lastActiveDate === today) return profile;
  const streak = profile.lastActiveDate && isYesterday(profile.lastActiveDate, today) ? profile.streak + 1 : 1;
  return {
    ...profile,
    streak,
    lastActiveDate: today,
  };
};

const dailyTrainPoints = (data: GameData, day: string): number =>
  data.logs.trainLogs
    .filter((log) => log.dateISO === day)
    .reduce((sum, log) => sum + log.points, 0);

const didTrainToday = (data: GameData, day: string): boolean =>
  data.logs.trainLogs.some((log) => log.dateISO === day);

export const addTrainLog = (data: GameData, exerciseId: ExerciseId, reps: number, today = getTodayDate()): GameData => {
  const exercise = EXERCISES[exerciseId];
  const remaining = Math.max(0, TRAIN_DAILY_CAP - dailyTrainPoints(data, today));
  const rawPoints = reps * exercise.ptPerRep;
  const points = Math.min(rawPoints, remaining);

  if (points <= 0) {
    return data;
  }

  const alreadyTrained = didTrainToday(data, today);
  const nextData: GameData = {
    ...data,
    profile: ensureActiveDay(data.profile, today),
    monster: hydrateMonster({
      ...data.monster,
      xp: data.monster.xp + points,
      muscle: alreadyTrained ? data.monster.muscle : data.monster.muscle + 0.1,
    }),
    logs: {
      ...data.logs,
      trainLogs: [...data.logs.trainLogs, { dateISO: today, exerciseId, reps, points }],
    },
  };

  return nextData;
};

export const addFoodLog = (data: GameData, mealType: MealType, today = getTodayDate()): { data: GameData; limited: boolean } => {
  const todayFoodLogs = data.logs.foodLogs.filter((log) => log.dateISO === today);

  if (todayFoodLogs.length >= FOOD_DAILY_LIMIT) {
    return { data, limited: true };
  }

  const delta = {
    good: { mood: 1, fat: -0.2 },
    normal: { mood: 0, fat: 0 },
    bad: { mood: -1, fat: 0.3 },
  }[mealType];

  return {
    limited: false,
    data: {
      ...data,
      profile: ensureActiveDay(data.profile, today),
      monster: hydrateMonster({
        ...data.monster,
        mood: data.monster.mood + delta.mood,
        fat: data.monster.fat + delta.fat,
      }),
      logs: {
        ...data.logs,
        foodLogs: [...data.logs.foodLogs, { dateISO: today, mealType }],
      },
    },
  };
};

export const removeTodayTrainLog = (data: GameData, index: number, today = getTodayDate()): GameData => {
  let count = -1;
  const logs = data.logs.trainLogs.filter((log) => {
    if (log.dateISO !== today) return true;
    count += 1;
    return count !== index;
  });

  if (count < index) return data;

  const todayTrain = logs.filter((l) => l.dateISO === today);
  const totalXp = logs.reduce((sum, log) => sum + log.points, 0);

  return {
    ...data,
    monster: hydrateMonster({
      ...data.monster,
      xp: totalXp,
      muscle: Number((data.monster.muscle - (todayTrain.length === 0 ? 0.1 : 0)).toFixed(1)),
    }),
    logs: {
      ...data.logs,
      trainLogs: logs,
    },
  };
};

export const removeTodayFoodLog = (data: GameData, index: number, today = getTodayDate()): GameData => {
  let count = -1;
  let removed: FoodLog | null = null;
  const logs = data.logs.foodLogs.filter((log) => {
    if (log.dateISO !== today) return true;
    count += 1;
    if (count === index) {
      removed = log;
      return false;
    }
    return true;
  });

  if (!removed) return data;

  const revert = {
    good: { mood: -1, fat: +0.2 },
    normal: { mood: 0, fat: 0 },
    bad: { mood: +1, fat: -0.3 },
  }[removed.mealType];

  return {
    ...data,
    monster: hydrateMonster({
      ...data.monster,
      mood: data.monster.mood + revert.mood,
      fat: data.monster.fat + revert.fat,
    }),
    logs: {
      ...data.logs,
      foodLogs: logs,
    },
  };
};

export const selectors = {
  todayTrainPoints: (data: GameData, today = getTodayDate()) => dailyTrainPoints(data, today),
  todayFoodCount: (data: GameData, today = getTodayDate()) => data.logs.foodLogs.filter((log) => log.dateISO === today).length,
  todayTrainLogs: (data: GameData, today = getTodayDate()) => data.logs.trainLogs.filter((log) => log.dateISO === today),
  todayFoodLogs: (data: GameData, today = getTodayDate()) => data.logs.foodLogs.filter((log) => log.dateISO === today),
};

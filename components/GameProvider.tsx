"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  addFoodLog,
  addTrainLog,
  defaultData,
  GameData,
  hydrateMonster,
  MealType,
  removeTodayFoodLog,
  removeTodayTrainLog,
  STORAGE_KEY,
} from "@/lib/game";

type GameContextValue = {
  data: GameData;
  addTrain: (exerciseId: Parameters<typeof addTrainLog>[1], reps: number) => void;
  addFood: (mealType: MealType) => void;
  removeTrainAt: (index: number) => void;
  removeFoodAt: (index: number) => void;
};

const GameContext = createContext<GameContextValue | null>(null);

const parseData = (raw: string): GameData | null => {
  try {
    const parsed = JSON.parse(raw) as GameData;
    return {
      ...parsed,
      monster: hydrateMonster(parsed.monster),
    };
  } catch {
    return null;
  }
};

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<GameData>(defaultData);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    const parsed = parseData(saved);
    if (parsed) setData(parsed);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const value = useMemo<GameContextValue>(
    () => ({
      data,
      addTrain: (exerciseId, reps) => setData((prev) => addTrainLog(prev, exerciseId, reps)),
      addFood: (mealType) => setData((prev) => addFoodLog(prev, mealType).data),
      removeTrainAt: (index) => setData((prev) => removeTodayTrainLog(prev, index)),
      removeFoodAt: (index) => setData((prev) => removeTodayFoodLog(prev, index)),
    }),
    [data],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside GameProvider");
  return ctx;
}

"use client";

import { useMemo, useState } from "react";
import { GameProvider, useGame } from "@/components/GameProvider";
import { EXERCISES, FOOD_DAILY_LIMIT, selectors, type ExerciseId, type MealType } from "@/lib/game";

type Tab = "home" | "train" | "food" | "monster";

function AppInner() {
  const [tab, setTab] = useState<Tab>("home");
  const [exerciseId, setExerciseId] = useState<ExerciseId>("pushup");
  const [reps, setReps] = useState("");
  const [foodMsg, setFoodMsg] = useState("");
  const { data, addTrain, addFood, removeTrainAt, removeFoodAt } = useGame();

  const todayTrainPoints = selectors.todayTrainPoints(data);
  const todayFoodCount = selectors.todayFoodCount(data);
  const todayTrainLogs = selectors.todayTrainLogs(data);
  const todayFoodLogs = selectors.todayFoodLogs(data);

  const exerciseList = useMemo(() => Object.values(EXERCISES), []);

  const handleTrainSubmit = () => {
    const n = Number(reps);
    if (!Number.isFinite(n) || n <= 0) return;
    addTrain(exerciseId, Math.floor(n));
    setReps("");
    setTab("home");
  };

  const handleFood = (mealType: MealType) => {
    if (todayFoodCount >= FOOD_DAILY_LIMIT) {
      setFoodMsg("今日の上限に達しました");
      return;
    }
    addFood(mealType);
    setFoodMsg("記録しました！");
    setTab("home");
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-white shadow-sm">
      <header className="sticky top-0 z-10 border-b bg-white px-4 py-3">
        <h1 className="text-lg font-bold text-indigo-600">Monster Fit MVP</h1>
        <p className="text-xs text-slate-500">30秒で入力して、毎日成長。</p>
      </header>

      <section className="flex-1 space-y-4 p-4 pb-24">
        {tab === "home" && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <Card label="今日PT" value={`${todayTrainPoints}`} />
              <Card label="食事回数" value={`${todayFoodCount}/3`} />
              <Card label="streak" value={`${data.profile.streak}日`} />
            </div>
            <div className="rounded-xl bg-indigo-50 p-4">
              <h2 className="mb-2 font-semibold">{data.monster.name}</h2>
              <p className="text-sm">Lv.{data.monster.level} / XP {data.monster.xp}</p>
              <p className="text-sm">Form: {data.monster.form}</p>
              <p className="text-sm">Fat: {data.monster.fat.toFixed(1)} / Muscle: {data.monster.muscle.toFixed(1)}</p>
              <p className="text-sm">Mood: {data.monster.mood}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button className="rounded-lg bg-indigo-600 py-3 text-white" onClick={() => setTab("train")}>今日の入力へ（Train）</button>
              <button className="rounded-lg bg-emerald-500 py-3 text-white" onClick={() => setTab("food")}>今日の入力へ（Food）</button>
            </div>
          </div>
        )}

        {tab === "train" && (
          <div className="space-y-3">
            <h2 className="font-semibold">筋トレ入力</h2>
            <div className="grid grid-cols-2 gap-2">
              {exerciseList.map((exercise) => (
                <button
                  key={exercise.id}
                  onClick={() => setExerciseId(exercise.id)}
                  className={`rounded-lg border p-2 text-sm ${exerciseId === exercise.id ? "border-indigo-600 bg-indigo-50" : "border-slate-200"}`}
                >
                  {exercise.name} ({exercise.ptPerRep}pt)
                </button>
              ))}
            </div>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              type="number"
              min={1}
              inputMode="numeric"
              placeholder="回数を入力"
              value={reps}
              onChange={(e) => setReps(e.target.value.replace(/[^0-9]/g, ""))}
            />
            <button onClick={handleTrainSubmit} className="w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white">追加</button>
            <p className="text-sm text-slate-600">今日の合計ポイント: {todayTrainPoints} / 300</p>
            <h3 className="text-sm font-semibold">今日のログ</h3>
            <ul className="space-y-2">
              {todayTrainLogs.map((log, idx) => (
                <li key={`${log.exerciseId}-${idx}`} className="flex items-center justify-between rounded border border-slate-200 p-2 text-sm">
                  <span>{EXERCISES[log.exerciseId].name} {log.reps}回 ({log.points}pt)</span>
                  <button className="text-rose-500" onClick={() => removeTrainAt(idx)}>削除</button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === "food" && (
          <div className="space-y-3">
            <h2 className="font-semibold">食事入力</h2>
            <div className="grid grid-cols-3 gap-2">
              <FoodButton label="good" color="bg-emerald-500" onClick={() => handleFood("good")} />
              <FoodButton label="normal" color="bg-sky-500" onClick={() => handleFood("normal")} />
              <FoodButton label="bad" color="bg-amber-500" onClick={() => handleFood("bad")} />
            </div>
            {foodMsg && <p className="text-sm text-slate-600">{foodMsg}</p>}
            <p className="text-sm text-slate-600">今日の記録: {todayFoodCount} / 3</p>
            <h3 className="text-sm font-semibold">今日のログ</h3>
            <ul className="space-y-2">
              {todayFoodLogs.map((log, idx) => (
                <li key={`${log.mealType}-${idx}`} className="flex items-center justify-between rounded border border-slate-200 p-2 text-sm">
                  <span>{log.mealType}</span>
                  <button className="text-rose-500" onClick={() => removeFoodAt(idx)}>削除</button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === "monster" && (
          <div className="space-y-2 rounded-xl bg-violet-50 p-4">
            <h2 className="font-semibold">モンスター状態</h2>
            <p>名前: {data.monster.name}</p>
            <p>レベル: {data.monster.level}</p>
            <p>XP: {data.monster.xp}</p>
            <p>Form: {data.monster.form}</p>
            <p>Fat: {data.monster.fat.toFixed(1)}</p>
            <p>Muscle: {data.monster.muscle.toFixed(1)}</p>
            <p>Mood: {data.monster.mood}</p>
            <p className="text-xs text-slate-500">トレーニングと食事入力で即時更新されます。</p>
          </div>
        )}
      </section>

      <nav className="fixed bottom-0 left-1/2 grid w-full max-w-md -translate-x-1/2 grid-cols-4 border-t bg-white">
        <TabButton name="Home" active={tab === "home"} onClick={() => setTab("home")} />
        <TabButton name="Train" active={tab === "train"} onClick={() => setTab("train")} />
        <TabButton name="Food" active={tab === "food"} onClick={() => setTab("food")} />
        <TabButton name="Monster" active={tab === "monster"} onClick={() => setTab("monster")} />
      </nav>
    </main>
  );
}

function TabButton({ name, active, onClick }: { name: string; active: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={`py-3 text-sm ${active ? "bg-indigo-50 font-semibold text-indigo-700" : "text-slate-500"}`}>{name}</button>;
}

function FoodButton({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
  return <button onClick={onClick} className={`rounded-lg py-3 text-sm font-semibold text-white ${color}`}>{label}</button>;
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-100 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  );
}

export default function Page() {
  return (
    <GameProvider>
      <AppInner />
    </GameProvider>
  );
}

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Sparkles } from 'lucide-react';
import {
  RunnerChecklistItem,
  getStoredChecklist,
  saveChecklist,
} from '../utils/runnerStorage';

export const RunnerChecklist: React.FC = () => {
  const [items, setItems] = useState<RunnerChecklistItem[]>(getStoredChecklist());

  useEffect(() => {
    saveChecklist(items);
  }, [items]);

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const completedCount = items.filter((i) => i.completed).length;
  const percentage = Math.round((completedCount / items.length) * 100);

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-purple-100 shadow-sm">
      {/* Header & Animated Progress Bar */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-black tracking-wider text-[#5B20A8] uppercase">
            <Sparkles className="w-3.5 h-3.5 text-[#FFC928]" />
            <span>MY RACE CHECKLIST</span>
          </div>
          <h3 className="text-lg font-black text-[#1F1035]">เช็กลิสต์ความพร้อมส่วนตัว</h3>
        </div>

        <div className="text-right">
          <div className="text-2xl font-black text-[#5B20A8] leading-none">{percentage}%</div>
          <span className="text-[10px] font-bold text-gray-400 uppercase">
            {completedCount}/{items.length} เรียบร้อย
          </span>
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="w-full bg-purple-50 rounded-full h-2.5 overflow-hidden mb-5 border border-purple-100">
        <div
          className="bg-gradient-to-r from-[#5B20A8] to-[#FFC928] h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Checklist items list */}
      <div className="space-y-2.5">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => toggleItem(item.id)}
            className={`w-full text-left p-3 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${
              item.completed
                ? 'bg-[#F4FAF6] border-emerald-200 text-gray-800'
                : 'bg-[#FCFAFF] hover:bg-white border-purple-100 text-gray-700'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {item.completed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
              ) : (
                <Circle className="w-5 h-5 text-gray-300 hover:text-purple-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div
                className={`text-xs sm:text-sm font-bold leading-snug ${
                  item.completed ? 'line-through text-gray-500' : 'text-[#1F1035]'
                }`}
              >
                {item.label}
              </div>
              {item.description && (
                <div className="text-[11px] text-gray-500 mt-0.5">{item.description}</div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

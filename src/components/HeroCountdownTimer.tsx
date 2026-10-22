import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PawIcon } from './brand/DogDecor';

interface CountdownTimerProps {
  targetDate?: string;
  className?: string;
}

export const HeroCountdownTimer: React.FC<CountdownTimerProps> = ({
  targetDate = '2027-02-15T16:30:00+07:00',
  className = '',
}) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 117,
    hours: 21,
    minutes: 35,
    seconds: 28,
  });

  useEffect(() => {
    const destination = new Date(targetDate).getTime();

    const calculateTime = () => {
      const now = new Date().getTime();
      const difference = destination - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const padNumber = (num: number) => num.toString().padStart(2, '0');

  const timeUnits = [
    { value: timeLeft.days.toString(), thaiLabel: 'วัน' },
    { value: padNumber(timeLeft.hours), thaiLabel: 'ชั่วโมง' },
    { value: padNumber(timeLeft.minutes), thaiLabel: 'นาที' },
    { value: padNumber(timeLeft.seconds), thaiLabel: 'วินาที' },
  ];

  return (
    <div className={`w-full ${className}`}>
      {/* Eyebrow Label matching mockup */}
      <div className="flex items-center justify-center lg:justify-start gap-2.5 mb-3">
        <PawIcon size={16} color="#45B9EA" />
        <span className="text-xs sm:text-sm font-extrabold tracking-wider text-white uppercase">
          CHANGSUEK RUN 2027 <span className="text-[#FFC928]">COUNTDOWN</span>
        </span>
        <PawIcon size={16} color="#FFC928" />
      </div>

      {/* 4 Countdown Boxes matching mockup */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3.5 max-w-[380px] sm:max-w-[420px] mx-auto lg:mx-0">
        {timeUnits.map((unit, index) => {
          const isSeconds = index === 3;
          return (
            <div
              key={unit.thaiLabel}
              className={`relative overflow-hidden rounded-2xl px-2 sm:px-3 py-2.5 sm:py-3.5 text-center bg-[#230B44]/90 border shadow-[0_8px_20px_rgba(0,0,0,0.32)] backdrop-blur-md select-none ${
                isSeconds ? 'border-[#FFC928]/60' : 'border-white/25'
              }`}
            >
              <div className="relative h-7 sm:h-10 flex items-center justify-center overflow-hidden">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={unit.value}
                    initial={{ y: -12, opacity: 0.3, scale: 0.92 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 12, opacity: 0, scale: 0.92 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className={`block font-display text-2xl sm:text-4xl font-extrabold leading-none tabular-nums ${
                      isSeconds ? 'text-[#FFC928]' : 'text-white'
                    }`}
                  >
                    {unit.value}
                  </motion.span>
                </AnimatePresence>
              </div>
              <div className="mt-1 text-[10px] sm:text-xs font-bold text-white/90">
                {unit.thaiLabel}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

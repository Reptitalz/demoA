
"use client";

import { useState, useEffect } from 'react';
import { Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';

const CountdownTimer = ({ onTimerClick }: { onTimerClick: () => void }) => {
  const [targetDate] = useState(() => {
    // Set a fixed target date for consistency across clients and re-renders.
    // For example, August 13, 2024 at 00:00:00 local time.
    const target = new Date('2024-08-13T00:00:00');
    return target;
  });

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
        const now = new Date().getTime();
        const distance = targetDate.getTime() - now;

        if (distance < 0) {
            return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }

        return {
            days: Math.floor(distance / (1000 * 60 * 60 * 24)),
            hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((distance % (1000 * 60)) / 1000),
        };
    };
    
    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  const TimeSegment = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <span className="text-xl font-bold tracking-tight text-foreground">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[10px] uppercase text-muted-foreground">{label}</span>
    </div>
  );

  return (
    <div 
      className="w-full text-center py-3 px-4 bg-card/50 rounded-lg border border-border/20 shadow-sm hover:shadow-md transition-all cursor-pointer"
      onClick={onTimerClick}
    >
      <div className="flex items-center justify-center gap-4">
        <div className="flex items-center gap-2 text-sm text-foreground">
           <Rocket className="h-4 w-4 text-primary" />
           <span className="font-semibold">Próximo Lanzamiento:</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <TimeSegment value={timeLeft.days} label="Días" />
          <span className="text-xl font-light text-muted-foreground/50">:</span>
          <TimeSegment value={timeLeft.hours} label="Hrs" />
          <span className="text-xl font-light text-muted-foreground/50">:</span>
          <TimeSegment value={timeLeft.minutes} label="Min" />
          <span className="text-xl font-light text-muted-foreground/50">:</span>
          <TimeSegment value={timeLeft.seconds} label="Seg" />
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;

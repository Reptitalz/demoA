
"use client";

import { useState, useEffect } from 'react';

const CountdownTimer = ({ onTimerClick }: { onTimerClick: () => void }) => {
  const [targetDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 5);
    return date;
  });

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  const TimeCard = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="bg-primary/10 text-primary p-4 rounded-lg shadow-inner w-20 h-20 flex items-center justify-center">
        <span className="text-4xl font-bold tracking-tighter">{String(value).padStart(2, '0')}</span>
      </div>
      <span className="mt-2 text-xs text-muted-foreground uppercase tracking-widest">{label}</span>
    </div>
  );

  return (
    <section 
      className="w-full text-center py-10 sm:py-16 bg-card/50 cursor-pointer"
      onClick={onTimerClick}
    >
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">¡Prepárate para el Lanzamiento!</h2>
        <p className="text-muted-foreground mb-6">El servicio de recargas estará disponible muy pronto.</p>
        <div className="flex justify-center items-center gap-2 sm:gap-4">
          <TimeCard value={timeLeft.days} label="Días" />
          <span className="text-4xl font-bold text-primary pb-8">:</span>
          <TimeCard value={timeLeft.hours} label="Horas" />
          <span className="text-4xl font-bold text-primary pb-8">:</span>
          <TimeCard value={timeLeft.minutes} label="Minutos" />
          <span className="text-4xl font-bold text-primary pb-8">:</span>
          <TimeCard value={timeLeft.seconds} label="Segundos" />
        </div>
      </div>
    </section>
  );
};

export default CountdownTimer;

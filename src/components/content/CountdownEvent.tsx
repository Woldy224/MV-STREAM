import { useEffect, useState } from 'react';

// Date du prochain grand culte : 30 mars 2026 à 10h
const EVENT_DATE = new Date('2026-03-30T10:00:00');


interface CountdownEventProps {
  image?: string;
  title?: string;
  date?: string;
  description?: string;
}

function getTimeLeft(dateStr: string) {
  const now = new Date();
  const eventDate = new Date(dateStr);
  const diff = eventDate.getTime() - now.getTime();
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

const CountdownEvent = ({ image, title = 'Grand culte à venir', date = '2026-03-30T10:00:00', description }: CountdownEventProps) => {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(date));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(date));
    }, 1000);
    return () => clearInterval(timer);
  }, [date]);

  if (!timeLeft) {
    return (
      <div
        className="glass-panel rounded-[1.75rem] p-6 text-center relative overflow-hidden"
        style={image ? { backgroundImage: `url(${image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10">
          <h3 className="text-xl font-semibold tracking-[-0.03em] text-white">{title}</h3>
          <p className="mt-3 text-sm leading-6 text-white/58">L'événement a commencé !</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="glass-panel rounded-[1.75rem] p-6 text-center relative overflow-hidden"
      style={image ? { backgroundImage: `url(${image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10">
        <h3 className="text-xl font-semibold tracking-[-0.03em] text-white">{title}</h3>
        {description && <p className="mt-3 text-sm leading-6 text-white/58">{description}</p>}
        <div className="mt-4 flex justify-center gap-4 text-white text-2xl font-bold">
          <div><span>{timeLeft.days}</span>j</div>
          <div><span>{timeLeft.hours}</span>h</div>
          <div><span>{timeLeft.minutes}</span>m</div>
          <div><span>{timeLeft.seconds}</span>s</div>
        </div>
        <p className="mt-4 text-sm text-white/58">Date : {new Date(date).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })}</p>
      </div>
    </div>
  );
};

export default CountdownEvent;

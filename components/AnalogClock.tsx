"use client";

interface AnalogClockProps {
  now: Date;
  className?: string;
  faceColor?: string;
  rimColor?: string;
  tickColor?: string;
  hourHandColor?: string;
  minuteHandColor?: string;
  secondHandColor?: string;
  centerColor?: string;
}

export function AnalogClock({
  now,
  className = "h-56 w-56",
  faceColor = "white",
  rimColor = "#212529",
  tickColor = "#212529",
  hourHandColor = "#212529",
  minuteHandColor = "#212529",
  secondHandColor = "#6f42c1",
  centerColor = "#6f42c1",
}: AnalogClockProps) {
  const hours = now.getHours() % 12;
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const ms = now.getMilliseconds();

  const secondDeg = (seconds + ms / 1000) * 6;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = hours * 30 + minutes * 0.5;

  const ticks = Array.from({ length: 12 }, (_, i) => i);

  return (
    <svg viewBox="0 0 200 200" className={className}>
      <circle cx="100" cy="100" r="96" fill={faceColor} stroke={rimColor} strokeWidth="2" />

      {ticks.map((i) => {
        const angle = (i * 30 * Math.PI) / 180;
        const isMajor = i % 3 === 0;
        const outer = 88;
        const inner = isMajor ? 76 : 82;
        const x1 = 100 + outer * Math.sin(angle);
        const y1 = 100 - outer * Math.cos(angle);
        const x2 = 100 + inner * Math.sin(angle);
        const y2 = 100 - inner * Math.cos(angle);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={tickColor}
            strokeWidth={isMajor ? 2.5 : 1.5}
            strokeLinecap="round"
          />
        );
      })}

      <line
        x1="100"
        y1="100"
        x2={100 + 48 * Math.sin((hourDeg * Math.PI) / 180)}
        y2={100 - 48 * Math.cos((hourDeg * Math.PI) / 180)}
        stroke={hourHandColor}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <line
        x1="100"
        y1="100"
        x2={100 + 68 * Math.sin((minuteDeg * Math.PI) / 180)}
        y2={100 - 68 * Math.cos((minuteDeg * Math.PI) / 180)}
        stroke={minuteHandColor}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <line
        x1="100"
        y1="100"
        x2={100 + 76 * Math.sin((secondDeg * Math.PI) / 180)}
        y2={100 - 76 * Math.cos((secondDeg * Math.PI) / 180)}
        stroke={secondHandColor}
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      <circle cx="100" cy="100" r="4" fill={centerColor} />
    </svg>
  );
}

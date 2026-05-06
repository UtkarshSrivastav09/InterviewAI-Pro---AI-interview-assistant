import { useEffect, useState } from 'react';

interface WaveformProps {
  isActive: boolean;
  barCount?: number;
  color?: string;
  height?: number;
}

export default function Waveform({ isActive, barCount = 20, color = '#6366f1', height = 40 }: WaveformProps) {
  const [bars, setBars] = useState<number[]>(Array(barCount).fill(4));

  useEffect(() => {
    if (!isActive) {
      setBars(Array(barCount).fill(4));
      return;
    }

    const interval = setInterval(() => {
      setBars(prev =>
        prev.map(() => (isActive ? Math.random() * height + 4 : 4))
      );
    }, 80);

    return () => clearInterval(interval);
  }, [isActive, barCount, height]);

  return (
    <div className="flex items-end gap-[2px]" style={{ height: height + 8 }}>
      {bars.map((h, i) => (
        <div
          key={i}
          className="rounded-full transition-all duration-100"
          style={{
            width: 3,
            height: h,
            backgroundColor: isActive ? color : '#334155',
            opacity: isActive ? 0.8 : 0.3,
          }}
        />
      ))}
    </div>
  );
}

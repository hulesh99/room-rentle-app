import { useId } from 'react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

export const buildDailySeries = (items = [], dateKey = 'createdAt', days = 7) => {
  const series = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - i);
    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);
    const count = items.filter((item) => {
      const t = new Date(item[dateKey]);
      return !Number.isNaN(t.getTime()) && t >= day && t < nextDay;
    }).length;
    series.push({ label: `${day.getDate()}/${day.getMonth() + 1}`, value: count });
  }
  return series;
};

const Sparkline = ({ data = [], className = '' }) => {
  const gradientId = useId().replace(/[:]/g, '');
  const color = 'hsl(var(--primary))';

  return (
    <div className={className} aria-hidden="true">
      <ResponsiveContainer width="100%" height={36}>
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.32} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.8}
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Sparkline;

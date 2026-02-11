import { LineChart, Line, ResponsiveContainer } from 'recharts';

export function Sparkline({ data }: { data: number[] }) {
  const points = data.map((v, i) => ({ v, i }));

  return (
    <div className='h-8 w-20'>
      <LineChart width={80} height={32} data={points}>
        <Line
          type='monotone'
          dataKey='v'
          stroke='#6366f1'
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </div>
  );
}

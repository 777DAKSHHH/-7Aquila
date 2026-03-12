import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ProgressChart = ({ data = [], height = 300 }) => {
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload?.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-2">{payload?.[0]?.payload?.date}</p>
          <div className="space-y-1">
            <p className="text-sm text-primary">
              Overall: <span className="font-semibold">{payload?.[0]?.value}</span>
            </p>
            {payload?.[0]?.payload?.fluency && (
              <p className="text-xs text-muted-foreground">
                Fluency: {payload?.[0]?.payload?.fluency}
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card rounded-lg p-4 md:p-6 border border-border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base md:text-lg font-heading font-semibold text-foreground">
          Band Score Progress
        </h3>
        <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground font-caption">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span>Overall Score</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis 
            dataKey="date" 
            stroke="var(--color-muted-foreground)"
            style={{ fontSize: '12px', fontFamily: 'var(--font-caption)' }}
          />
          <YAxis 
            domain={[0, 9]} 
            ticks={[0, 3, 6, 9]}
            stroke="var(--color-muted-foreground)"
            style={{ fontSize: '12px', fontFamily: 'var(--font-caption)' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="score" 
            stroke="var(--color-primary)" 
            strokeWidth={3}
            dot={{ fill: 'var(--color-primary)', r: 5 }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProgressChart;
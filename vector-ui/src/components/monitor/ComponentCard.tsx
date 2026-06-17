import { useMemo } from 'react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import type { ComponentMetric } from '../../types/pipeline';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { cn } from '../../lib/cn';

interface ComponentCardProps {
  metric: ComponentMetric;
  pulseKey: number;
}

function bufferGradient(fill: number): string {
  if (fill >= 80) return 'linear-gradient(90deg, var(--green), var(--amber), var(--red))';
  if (fill >= 50) return 'linear-gradient(90deg, var(--green), var(--amber))';
  return 'var(--green)';
}

export function ComponentCard({ metric, pulseKey }: ComponentCardProps) {
  const reducedMotion = useReducedMotion();
  const chartData = useMemo(
    () => metric.throughput.map((v, i) => ({ i, v })),
    [metric.throughput],
  );
  const hasErrors = metric.errorCount > 0;
  const fillColor = hasErrors ? 'var(--red)' : 'var(--accent)';

  return (
    <motion.article
      key={pulseKey}
      initial={reducedMotion ? false : { boxShadow: '0 0 0 0 transparent' }}
      animate={
        reducedMotion
          ? {}
          : {
              boxShadow: [
                '0 0 0 0 transparent',
                '0 0 12px 1px color-mix(in srgb, var(--accent) 35%, transparent)',
                '0 0 0 0 transparent',
              ],
            }
      }
      transition={{ duration: 1.2, ease: 'easeOut' }}
      className="rounded-lg border border-border2 bg-bg2 p-4"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-mono text-sm font-medium text-text">{metric.name}</h3>
          <p className="font-mono text-[10px] text-text3">{metric.id}</p>
        </div>
        <span
          className={cn(
            'rounded px-2 py-0.5 font-mono text-xs',
            hasErrors ? 'bg-red-dim text-red' : 'bg-bg3 text-text3',
          )}
        >
          {metric.errorCount} err
        </span>
      </div>

      <div className="mb-3 h-12">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={`fill-${metric.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={fillColor} stopOpacity={0.4} />
                <stop offset="100%" stopColor={fillColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke={fillColor}
              fill={`url(#fill-${metric.id})`}
              strokeWidth={1.5}
              isAnimationActive={!reducedMotion}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between font-mono text-[10px] text-text2">
          <span>Buffer</span>
          <span>{metric.bufferFill.toFixed(0)}%</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-bg3">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(100, metric.bufferFill)}%`,
              background: bufferGradient(metric.bufferFill),
            }}
          />
        </div>
      </div>
    </motion.article>
  );
}

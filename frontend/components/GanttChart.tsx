import { Task } from '../lib/api';
import { differenceInCalendarDays, format, isWithinInterval } from 'date-fns';

interface GanttChartProps {
  tasks: Task[];
}

export default function GanttChart({ tasks }: GanttChartProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No tasks to display
      </div>
    );
  }

  // Calculate date range
  const startDates = tasks
    .filter(t => t.start_date)
    .map(t => new Date(t.start_date!).getTime());
  const endDates = tasks
    .filter(t => t.end_date)
    .map(t => new Date(t.end_date!).getTime());

  if (startDates.length === 0 || endDates.length === 0) {
    return <div className="text-center py-12 text-gray-500">Unable to display timeline</div>;
  }

  const minDate = Math.min(...startDates);
  const maxDate = Math.max(...endDates);
  const range = Math.max(maxDate - minDate, 24 * 60 * 60 * 1000);
  const totalDays = differenceInCalendarDays(new Date(maxDate), new Date(minDate)) + 1;

  // Generate day markers (show every 2-5 days depending on total length)
  const dayInterval = totalDays > 60 ? 7 : totalDays > 30 ? 5 : totalDays > 14 ? 3 : 1;
  const dayMarkers: { day: number; date: Date }[] = [];
  for (let i = 0; i <= totalDays; i += dayInterval) {
    const date = new Date(minDate + i * 24 * 60 * 60 * 1000);
    dayMarkers.push({ day: i, date });
  }
  const today = new Date();
  const showTodayMarker = isWithinInterval(today, {
    start: new Date(minDate),
    end: new Date(maxDate),
  });

  const todayOffset = showTodayMarker
    ? ((today.getTime() - minDate) / range) * 100
    : null;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-max bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Delivery Timeline</p>
            <p className="text-lg font-semibold text-slate-800">
              {format(new Date(minDate), 'MMM d, yyyy')} – {format(new Date(maxDate), 'MMM d, yyyy')}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-8 rounded-full bg-gradient-to-r from-red-500 to-red-600" />
              Critical Path
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600" />
              Planned
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-8 rounded-full bg-emerald-500/80" />
              Completed
            </div>
          </div>
        </div>

        {/* Timeline Header */}
        <div className="flex px-6 py-4 border-b border-slate-100 bg-slate-50/80 backdrop-blur">
          <div className="w-80 text-xs font-semibold uppercase tracking-wider text-slate-500">Workstream</div>
          <div className="flex-1 flex justify-between px-6">
            {dayMarkers.map(marker => (
              <div key={marker.day} className="text-[11px] text-slate-400 text-center min-w-[60px]">
                <div className="font-semibold text-slate-500 mb-1">Day {marker.day}</div>
                <div>{format(marker.date, 'MMM d')}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Task Rows */}
        <div className="divide-y divide-slate-100">
          {tasks.map((task, index) => {
            if (!task.start_date || !task.end_date) return null;

            const taskStart = new Date(task.start_date).getTime();
            const taskEnd = new Date(task.end_date).getTime();
            const startOffset = ((taskStart - minDate) / range) * 100;
            const rawDuration = ((taskEnd - taskStart) / range) * 100;
            // Ensure minimum width for readability, but allow longer tasks to be wider
            const duration = Math.max(rawDuration, Math.min(8, task.name.length * 0.8));

            return (
              <div
                key={task.id}
                className="flex items-stretch px-6 py-6 transition hover:bg-slate-50/70"
              >
                <div className="w-80 pr-6">
                  <div className="flex items-start gap-3">
                    <span className="mt-[2px] text-[11px] font-semibold text-slate-400">{index + 1}</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 leading-tight">
                        {task.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {format(new Date(task.start_date), 'MMM d')} → {format(new Date(task.end_date), 'MMM d')} ·{' '}
                        {task.expected_duration.toFixed(1)} days
                      </p>
                    </div>
                  </div>
                  {task.is_on_critical_path && (
                    <div className="mt-2 inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-600 ring-1 ring-red-100">
                      Critical path
                    </div>
                  )}
                  {task.dependencies.length > 0 && (
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
                      <span className="inline-flex h-1.5 w-1.5 rounded-full bg-slate-300" />
                      Depends on {task.dependencies.length} task{task.dependencies.length > 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                <div className="flex-1 relative h-20">
                  {/* Grid background */}
                  <div className="absolute inset-0 flex px-6">
                    {dayMarkers.map(marker => (
                      <div
                        key={marker.day}
                        className="flex-1 border-l border-dashed border-slate-200/70 min-w-[60px]"
                      />
                    ))}
                  </div>

                  {/* Today marker */}
                  {showTodayMarker && todayOffset !== null && (
                    <div
                      className="absolute top-0 bottom-0 w-px bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.4)]"
                      style={{ left: `${todayOffset}%` }}
                    />
                  )}

                  {/* Task bar */}
                  <div
                    className={`absolute top-4 h-12 rounded-xl shadow-sm ring-1 ring-black/5 transition-all duration-300 group cursor-pointer ${
                      task.is_complete
                        ? 'bg-emerald-500/85'
                        : task.is_on_critical_path
                        ? 'bg-gradient-to-r from-rose-500 to-red-500'
                        : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600'
                    }`}
                    style={{
                      left: `${startOffset}%`,
                      width: `${Math.min(duration, 100 - startOffset)}%`,
                    }}
                  >
                    <div className="flex h-full items-center justify-between px-4 text-[13px] font-medium text-white">
                      <span className="truncate flex-1 mr-2">{task.name}</span>
                      <span className="shrink-0 text-white/90 font-semibold">
                        {task.expected_duration.toFixed(1)}d
                      </span>
                    </div>
                    
                    {/* Enhanced Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 max-w-xs">
                      <div className="font-semibold mb-1">{task.name}</div>
                      <div className="text-xs text-gray-300">
                        {format(new Date(task.start_date), 'MMM d, yyyy')} - {format(new Date(task.end_date), 'MMM d, yyyy')}
                      </div>
                      <div className="text-xs text-gray-300 mt-1">
                        Duration: {task.expected_duration.toFixed(1)} days
                      </div>
                      {task.description && (
                        <div className="text-xs text-gray-300 mt-1 max-w-xs">
                          {task.description}
                        </div>
                      )}
                      {task.is_on_critical_path && (
                        <div className="text-xs text-red-300 mt-1 font-medium">
                          ⚠️ Critical Path Task
                        </div>
                      )}
                      {/* Tooltip arrow */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

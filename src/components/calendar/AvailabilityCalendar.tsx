import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Slot {
  id: string;
  start_time: string;
  end_time: string;
}

interface Props {
  slots: Slot[];
  onPick: (slot: Slot) => void;
}

function startOfWeek(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - x.getDay()); // Sunday start
  return x;
}

export default function AvailabilityCalendar({ slots, onPick }: Props) {
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    }),
    [weekStart]
  );

  const slotsByDay = useMemo(() => {
    const map: Record<string, Slot[]> = {};
    for (const s of slots) {
      const k = new Date(s.start_time).toDateString();
      (map[k] ||= []).push(s);
    }
    return map;
  }, [slots]);

  const fmtRange = `${weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${
    new Date(weekStart.getTime() + 6 * 86400000).toLocaleDateString(undefined, { month: "short", day: "numeric" })
  }`;

  const today = new Date(); today.setHours(0, 0, 0, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium">{fmtRange}</p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setWeekStart((w) => { const n = new Date(w); n.setDate(n.getDate() - 7); return n; })}
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => setWeekStart(startOfWeek(new Date()))}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setWeekStart((w) => { const n = new Date(w); n.setDate(n.getDate() + 7); return n; })}
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((d) => {
          const key = d.toDateString();
          const daySlots = slotsByDay[key] || [];
          const isToday = d.toDateString() === today.toDateString();
          const isPast = d < today;
          return (
            <div
              key={key}
              className={cn(
                "rounded-xl border border-border p-2 min-h-[140px] flex flex-col gap-1.5",
                isToday && "border-primary/50 bg-primary/5",
                isPast && "opacity-50"
              )}
            >
              <div className="text-center pb-1.5 border-b border-border">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                  {d.toLocaleDateString(undefined, { weekday: "short" })}
                </p>
                <p className={cn("font-display font-bold text-sm mt-0.5", isToday && "text-primary")}>
                  {d.getDate()}
                </p>
              </div>
              <div className="flex flex-col gap-1 overflow-y-auto">
                {daySlots.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground text-center mt-2">—</p>
                ) : (
                  daySlots.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => onPick(s)}
                      className="text-[11px] rounded-md bg-card border border-border hover:border-primary hover:bg-primary/10 hover:shadow-soft transition-smooth px-1.5 py-1 font-medium"
                    >
                      {new Date(s.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </button>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
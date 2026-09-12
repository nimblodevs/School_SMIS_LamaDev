"use client";

import { Calendar, momentLocalizer, View, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useEffect, useMemo, useState } from "react";

const localizer = momentLocalizer(moment);

type CalendarEvent = { title: string; start: Date; end: Date };

const LessonEvent = ({ event }: { event: CalendarEvent }) => {
  return (
    <div className="h-full overflow-hidden pr-1">
      <div className="truncate text-[10px] leading-tight text-gray-500">
        {moment(event.start).format("h:mm A")}
      </div>
      <div className="truncate text-xs font-semibold leading-tight">
        {event.title}
      </div>
    </div>
  );
};

const BigCalendar = ({ data }: { data: CalendarEvent[] }) => {
  const [view, setView] = useState<View>(Views.WORK_WEEK);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const calendarDate = useMemo(() => {
    if (!data.length) return new Date();
    const monday = new Date(data[0].start);
    const day = monday.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    monday.setDate(monday.getDate() + diff);
    monday.setHours(8, 0, 0, 0);
    return monday;
  }, [data]);

  if (!mounted) {
    return <div className="h-full rounded-md bg-slate-50" />;
  }

  return (
    <div className="h-full min-w-0 overflow-hidden">
      <Calendar
        localizer={localizer}
        events={data}
        date={calendarDate}
        startAccessor="start"
        endAccessor="end"
        views={["work_week", "day"]}
        view={view}
        onNavigate={() => {}}
        style={{ height: "100%" }}
        onView={setView}
        min={new Date(1970, 0, 1, 8, 0, 0)}
        max={new Date(1970, 0, 1, 20, 0, 0)}
        step={60}
        timeslots={1}
        dayLayoutAlgorithm="no-overlap"
        tooltipAccessor={(event) =>
          `${event.title} • ${moment(event.start).format("h:mm A")} - ${moment(event.end).format("h:mm A")}`
        }
        formats={{
          eventTimeRangeFormat: () => "",
          eventTimeRangeStartFormat: () => "",
          eventTimeRangeEndFormat: () => "",
        }}
        components={{
          event: LessonEvent,
        }}
      />
    </div>
  );
};

export default BigCalendar;

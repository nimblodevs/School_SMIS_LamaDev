import prisma from "@/lib/prisma";
import BigCalendar from "./BigCalender";
import { adjustScheduleToCurrentWeek } from "@/lib/utils";

const BigCalendarContainer = async ({
  type,
  id,
}: {
  type: "teacherId" | "classId";
  id: string | number;
}) => {
  const dataRes = await prisma.lesson.findMany({
    where: {
      ...(type === "teacherId"
        ? { teacherId: id as string }
        : { classId: id as number }),
    },
    include: {
      subject: { select: { name: true } },
      class: { select: { name: true } },
    },
  });

  const data = dataRes.map((lesson) => ({
    title: lesson.subject?.name
      ? `${lesson.subject.name}${lesson.class?.name ? ` (${lesson.class.name})` : ""}`
      : lesson.name,
    start: lesson.startTime,
    end: lesson.endTime,
    day: lesson.day,
  }));

  const schedule = adjustScheduleToCurrentWeek(data);

  return (
    <div className="h-full min-h-0">
      <BigCalendar data={schedule} />
    </div>
  );
};

export default BigCalendarContainer;

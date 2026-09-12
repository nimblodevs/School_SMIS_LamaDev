const WEEKDAY_OFFSET: Record<string, number> = {
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  THURSDAY: 3,
  FRIDAY: 4,
};

const getLatestMonday = (): Date => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const latestMonday = new Date(today);
  latestMonday.setDate(today.getDate() - daysSinceMonday);
  latestMonday.setHours(0, 0, 0, 0);
  return latestMonday;
};

export const adjustScheduleToCurrentWeek = (
  lessons: { title: string; start: Date; end: Date; day?: string }[]
): { title: string; start: Date; end: Date }[] => {
  const latestMonday = getLatestMonday();

  return lessons.map((lesson) => {
    const daysFromMonday =
      lesson.day && WEEKDAY_OFFSET[lesson.day] !== undefined
        ? WEEKDAY_OFFSET[lesson.day]
        : lesson.start.getDay() === 0
          ? 6
          : lesson.start.getDay() - 1;

    const adjustedStartDate = new Date(latestMonday);
    adjustedStartDate.setDate(latestMonday.getDate() + daysFromMonday);
    adjustedStartDate.setHours(
      lesson.start.getHours(),
      0,
      0,
      0
    );

    const durationHours = Math.max(
      1,
      lesson.end.getHours() - lesson.start.getHours()
    );

    const adjustedEndDate = new Date(adjustedStartDate);
    adjustedEndDate.setHours(adjustedStartDate.getHours() + durationHours, 0, 0, 0);

    return {
      title: lesson.title,
      start: adjustedStartDate,
      end: adjustedEndDate,
    };
  });
};

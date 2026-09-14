import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import EventCalendar from "@/components/EventCalendar";
import prisma from "@/lib/prisma";
import { requirePageUser } from "@/lib/authorization";

const StudentPage = async () => {
  const user = await requirePageUser(["student"]);
  const userId = user.id;
  const classItem = await prisma.class.findMany({
    where: {
      students: { some: { id: userId! } },
    },
  });

  return (
    <div className="p-4 flex gap-4 flex-col xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        <div className="h-[500px] bg-white p-4 rounded-md flex flex-col">
          <h1 className="text-xl font-semibold mb-4">
            Schedule ({classItem[0]?.name ?? "Class"})
          </h1>
          <div className="flex-1 min-h-0">
            {classItem[0] && (
              <BigCalendarContainer type="classId" id={classItem[0].id} />
            )}
          </div>
        </div>
      </div>
      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-8">
        <EventCalendar />
        <Announcements />
      </div>
    </div>
  );
};

export default StudentPage;

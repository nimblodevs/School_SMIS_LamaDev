import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import FormContainer from "@/components/FormContainer";
import Performance from "@/components/Performance";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { Teacher } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

const SingleTeacherPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const session = await auth();
  const role = session?.user?.role;
  const currentUserId = session?.user?.id;
  const canEditTeacher =
    role === "admin" || (role === "teacher" && currentUserId === id);

  const teacher:
    | (Teacher & {
      subjects: { name: string }[];
      lessons: { id: number }[];
      classes: { id: number; name: string }[];
    })
    | null = await prisma.teacher.findUnique({
      where: { id },
      include: {
        subjects: {
          select: { name: true },
        },
        lessons: {
          select: { id: true },
        },
        classes: {
          select: { id: true, name: true },
        },
      },
    });

  if (!teacher) {
    return notFound();
  }

  const subjectCount = teacher.subjects.length;
  const lessonCount = teacher.lessons.length;
  const classCount = teacher.classes.length;
  const subjectNames = teacher.subjects.map((subject) => subject.name);

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        {/* TOP */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* USER INFO CARD */}
          <div className="bg-lamaSky py-6 px-4 rounded-md flex-1 flex gap-4 min-w-0">
            <div className="w-1/3 flex items-center justify-center shrink-0">
              <div className="relative h-24 w-24 overflow-hidden rounded-full xl:h-36 xl:w-36">
                <Image
                  src={teacher.img || "/noAvatar.png"}
                  alt={`${teacher.name} ${teacher.surname}`}
                  width={144}
                  height={144}
                  className="h-full w-full rounded-full object-cover"
                />
              </div>
            </div>
            <div className="w-2/3 flex flex-col justify-between gap-3 min-w-0">
              <div className="flex items-center gap-4 flex-wrap">
                <h1 className="text-xl font-semibold">
                  {teacher.name + " " + teacher.surname}
                </h1>
                {canEditTeacher && (
                  <FormContainer table="teacher" type="update" data={teacher} />
                )}
              </div>
              <p className="text-sm text-gray-500 break-words">
                {teacher.address}
              </p>
              <div className="flex flex-col gap-2">
                {subjectNames.length > 0 ? (
                  <>
                    <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wide text-slate-600">
                      <span>Subjects</span>
                      <span className="rounded-full bg-white/80 px-2 py-0.5 text-[9px] text-slate-700">
                        {subjectCount}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {subjectNames.slice(0, 4).map((subject) => (
                        <span
                          key={subject}
                          className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-medium text-slate-700"
                        >
                          {subject}
                        </span>
                      ))}
                      {subjectNames.length > 4 && (
                        <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-medium text-slate-700">
                          +{subjectNames.length - 4} more
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <span className="rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-medium text-slate-700 w-fit">
                    No subjects assigned
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-medium">
                <div className="w-full md:w-[48%] 2xl:w-[48%] flex items-center gap-2">
                  <Image src="/blood.png" alt="" width={14} height={14} />
                  <span>{teacher.bloodType}</span>
                </div>
                <div className="w-full md:w-[48%] 2xl:w-[48%] flex items-center gap-2">
                  <Image src="/date.png" alt="" width={14} height={14} />
                  <span>
                    {new Intl.DateTimeFormat("en-GB").format(teacher.birthday)}
                  </span>
                </div>
                <div className="w-full md:w-[48%] 2xl:w-[48%] flex items-center gap-2 min-w-0">
                  <Image src="/mail.png" alt="" width={14} height={14} />
                  <span className="truncate">{teacher.email || "-"}</span>
                </div>
                <div className="w-full md:w-[48%] 2xl:w-[48%] flex items-center gap-2">
                  <Image src="/phone.png" alt="" width={14} height={14} />
                  <span>{teacher.phone || "-"}</span>
                </div>
              </div>
            </div>
          </div>
          {/* SMALL CARDS */}
          <div className="flex-1 flex gap-4 justify-between flex-wrap">
            {/* CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleAttendance.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold">90%</h1>
                <span className="text-sm text-gray-400">Attendance</span>
              </div>
            </div>
            {/* CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleBranch.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold">{subjectCount}</h1>
                <span className="text-sm text-gray-400">Subjects</span>
              </div>
            </div>
            {/* CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleLesson.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold">{lessonCount}</h1>
                <span className="text-sm text-gray-400">Lessons</span>
              </div>
            </div>
            {/* CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleClass.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold">{classCount}</h1>
                <span className="text-sm text-gray-400">Classes</span>
              </div>
            </div>
          </div>
        </div>
        {/* BOTTOM */}
        <div className="mt-4 bg-white rounded-md p-4 h-[500px] flex flex-col">
          <h1 className="text-xl font-semibold mb-4">Teacher&apos;s Schedule</h1>
          <div className="flex-1 min-h-0">
            <BigCalendarContainer type="teacherId" id={teacher.id} />
          </div>
        </div>
      </div>
      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold">Shortcuts</h1>
          <div className="mt-4 flex flex-col gap-2 text-xs text-gray-500">
            <Link
              className="p-3 rounded-md bg-lamaSkyLight"
              href={`/list/classes?supervisorId=${teacher.id}`}
            >
              Teacher&apos;s Classes
            </Link>
            <Link
              className="p-3 rounded-md bg-lamaPurpleLight"
              href={`/list/students?teacherId=${teacher.id}`}
            >
              Teacher&apos;s Students
            </Link>
            <Link
              className="p-3 rounded-md bg-lamaYellowLight"
              href={`/list/lessons?teacherId=${teacher.id}`}
            >
              Teacher&apos;s Lessons
            </Link>
            <Link
              className="p-3 rounded-md bg-pink-50"
              href={`/list/exams?teacherId=${teacher.id}`}
            >
              Teacher&apos;s Exams
            </Link>
            <Link
              className="p-3 rounded-md bg-lamaSkyLight"
              href={`/list/assignments?teacherId=${teacher.id}`}
            >
              Teacher&apos;s Assignments
            </Link>
          </div>
        </div>
        <Performance />
        <Announcements />
      </div>
    </div>
  );
};

export default SingleTeacherPage;

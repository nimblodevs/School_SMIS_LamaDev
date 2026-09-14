"use server";

import "server-only";

import bcrypt from "bcryptjs";
import { Prisma, UserRole as DatabaseUserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireActionUser } from "./authorization";
import {
  classSchema,
  examSchema,
  lessonSchema,
  parentSchema,
  studentSchema,
  subjectSchema,
  teacherSchema,
  type ClassSchema,
  type ExamSchema,
  type LessonSchema,
  type ParentSchema,
  type StudentSchema,
  type SubjectSchema,
  type TeacherSchema,
} from "./formValidationSchemas";
import prisma from "./prisma";
import type { UserRole } from "./routeAccess";

type CurrentState = { success: boolean; error: boolean };
type SessionUser = { id: string; role: UserRole };

const successState: CurrentState = { success: true, error: false };
const errorState: CurrentState = { success: false, error: true };
const adminOnly = ["admin"] as const;
const adminOrTeacher = ["admin", "teacher"] as const;
const integerIdSchema = z.coerce.number().int().positive();
const stringIdSchema = z.string().trim().min(1);

async function runMutation<Schema extends z.ZodTypeAny>(
  label: string,
  allowedRoles: readonly UserRole[],
  schema: Schema,
  input: unknown,
  path: string,
  operation: (data: z.infer<Schema>, user: SessionUser) => Promise<void>
): Promise<CurrentState> {
  try {
    const user = await requireActionUser(allowedRoles);
    const parsed = schema.safeParse(input);

    if (!parsed.success) {
      return errorState;
    }

    await operation(parsed.data, user);
    revalidatePath(path);
    return successState;
  } catch (error) {
    console.error(
      `${label} failed:`,
      error instanceof Error ? error.message : "Unknown error"
    );
    return errorState;
  }
}

function idFromFormData(data: FormData): FormDataEntryValue | null {
  return data.get("id");
}

function requireId<T>(id: T | undefined): T {
  if (id === undefined) {
    throw new Error("A record id is required");
  }

  return id;
}

type AccountInput = {
  id: string;
  username: string;
  name: string;
  email?: string | null;
  passwordHash?: string;
  role: DatabaseUserRole;
};

async function syncUserAccount(
  tx: Prisma.TransactionClient,
  account: AccountInput
): Promise<void> {
  const existingUser = await tx.user.findUnique({ where: { id: account.id } });
  const password = account.passwordHash;

  if (!existingUser && !password) {
    throw new Error("A password is required when creating an account");
  }

  if (existingUser) {
    await tx.user.update({
      where: { id: account.id },
      data: {
        username: account.username,
        name: account.name,
        email: account.email || null,
        role: account.role,
        ...(password ? { password } : {}),
      },
    });
    return;
  }

  await tx.user.create({
    data: {
      id: account.id,
      username: account.username,
      name: account.name,
      email: account.email || null,
      role: account.role,
      password: password!,
    },
  });
}

export const createSubject = async (
  _currentState: CurrentState,
  data: SubjectSchema
) =>
  runMutation("Create subject", adminOnly, subjectSchema, data, "/list/subjects", async (values) => {
    await prisma.subject.create({
      data: {
        name: values.name,
        teachers: {
          connect: values.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });
  });

export const updateSubject = async (
  _currentState: CurrentState,
  data: SubjectSchema
) =>
  runMutation("Update subject", adminOnly, subjectSchema, data, "/list/subjects", async (values) => {
    await prisma.subject.update({
      where: { id: requireId(values.id) },
      data: {
        name: values.name,
        teachers: {
          set: values.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });
  });

export const deleteSubject = async (
  _currentState: CurrentState,
  data: FormData
) =>
  runMutation(
    "Delete subject",
    adminOnly,
    integerIdSchema,
    idFromFormData(data),
    "/list/subjects",
    async (id) => {
      await prisma.subject.delete({ where: { id } });
    }
  );

export const createClass = async (
  _currentState: CurrentState,
  data: ClassSchema
) =>
  runMutation("Create class", adminOnly, classSchema, data, "/list/classes", async (values) => {
    await prisma.class.create({
      data: {
        name: values.name,
        capacity: values.capacity,
        gradeId: values.gradeId,
        supervisorId: values.supervisorId,
      },
    });
  });

export const updateClass = async (
  _currentState: CurrentState,
  data: ClassSchema
) =>
  runMutation("Update class", adminOnly, classSchema, data, "/list/classes", async (values) => {
    const id = requireId(values.id);
    await prisma.class.update({
      where: { id },
      data: {
        name: values.name,
        capacity: values.capacity,
        gradeId: values.gradeId,
        supervisorId: values.supervisorId,
      },
    });
  });

export const deleteClass = async (
  _currentState: CurrentState,
  data: FormData
) =>
  runMutation(
    "Delete class",
    adminOnly,
    integerIdSchema,
    idFromFormData(data),
    "/list/classes",
    async (id) => {
      await prisma.class.delete({ where: { id } });
    }
  );

export const createTeacher = async (
  _currentState: CurrentState,
  data: TeacherSchema
) =>
  runMutation("Create teacher", adminOnly, teacherSchema, data, "/list/teachers", async (values) => {
    if (!values.password) {
      throw new Error("A password is required for a new teacher");
    }

    const passwordHash = await bcrypt.hash(values.password, 12);
    await prisma.$transaction(async (tx) => {
      await tx.teacher.create({
        data: {
          id: values.username,
          username: values.username,
          name: values.name,
          surname: values.surname,
          email: values.email || null,
          phone: values.phone || null,
          address: values.address,
          img: values.img || null,
          bloodType: values.bloodType,
          sex: values.sex,
          birthday: values.birthday,
          subjects: {
            connect: values.subjects?.map((subjectId) => ({
              id: Number(subjectId),
            })),
          },
        },
      });
      await syncUserAccount(tx, {
        id: values.username,
        username: values.username,
        name: `${values.name} ${values.surname}`,
        email: values.email,
        passwordHash,
        role: DatabaseUserRole.TEACHER,
      });
    });
  });

export const updateTeacher = async (
  _currentState: CurrentState,
  data: TeacherSchema
) =>
  runMutation(
    "Update teacher",
    adminOrTeacher,
    teacherSchema,
    data,
    "/list/teachers",
    async (values, user) => {
      const id = requireId(values.id);
      if (user.role === "teacher" && user.id !== id) {
        throw new Error("Teachers may only update their own profile");
      }

      const passwordHash = values.password
        ? await bcrypt.hash(values.password, 12)
        : undefined;
      await prisma.$transaction(async (tx) => {
        await tx.teacher.update({
          where: { id },
          data: {
            username: values.username,
            name: values.name,
            surname: values.surname,
            email: values.email || null,
            phone: values.phone || null,
            address: values.address,
            ...(values.img !== undefined ? { img: values.img || null } : {}),
            bloodType: values.bloodType,
            sex: values.sex,
            birthday: values.birthday,
            subjects: {
              set: values.subjects?.map((subjectId) => ({
                id: Number(subjectId),
              })),
            },
          },
        });
        await syncUserAccount(tx, {
          id,
          username: values.username,
          name: `${values.name} ${values.surname}`,
          email: values.email,
          passwordHash,
          role: DatabaseUserRole.TEACHER,
        });
      });
    }
  );

export const deleteTeacher = async (
  _currentState: CurrentState,
  data: FormData
) =>
  runMutation(
    "Delete teacher",
    adminOnly,
    stringIdSchema,
    idFromFormData(data),
    "/list/teachers",
    async (id) => {
      await prisma.$transaction([
        prisma.user.deleteMany({ where: { id } }),
        prisma.teacher.delete({ where: { id } }),
      ]);
    }
  );

export const createParent = async (
  _currentState: CurrentState,
  data: ParentSchema
) =>
  runMutation("Create parent", adminOnly, parentSchema, data, "/list/parents", async (values) => {
    if (!values.password) {
      throw new Error("A password is required for a new parent");
    }

    const passwordHash = await bcrypt.hash(values.password, 12);
    await prisma.$transaction(async (tx) => {
      const parent = await tx.parent.create({
        data: {
          id: values.username,
          username: values.username,
          name: values.name,
          surname: values.surname,
          email: values.email || null,
          phone: values.phone,
          address: values.address,
        },
      });

      if (values.studentId) {
        await tx.student.update({
          where: { id: values.studentId },
          data: { parentId: parent.id },
        });
      }

      await syncUserAccount(tx, {
        id: parent.id,
        username: values.username,
        name: `${values.name} ${values.surname}`,
        email: values.email,
        passwordHash,
        role: DatabaseUserRole.PARENT,
      });
    });
  });

export const updateParent = async (
  _currentState: CurrentState,
  data: ParentSchema
) =>
  runMutation("Update parent", adminOnly, parentSchema, data, "/list/parents", async (values) => {
    const id = requireId(values.id);
    const passwordHash = values.password
      ? await bcrypt.hash(values.password, 12)
      : undefined;
    await prisma.$transaction(async (tx) => {
      await tx.parent.update({
        where: { id },
        data: {
          username: values.username,
          name: values.name,
          surname: values.surname,
          email: values.email || null,
          phone: values.phone,
          address: values.address,
        },
      });

      if (values.studentId) {
        await tx.student.update({
          where: { id: values.studentId },
          data: { parentId: id },
        });
      }

      await syncUserAccount(tx, {
        id,
        username: values.username,
        name: `${values.name} ${values.surname}`,
        email: values.email,
        passwordHash,
        role: DatabaseUserRole.PARENT,
      });
    });
  });

export const deleteParent = async (
  _currentState: CurrentState,
  data: FormData
) =>
  runMutation(
    "Delete parent",
    adminOnly,
    stringIdSchema,
    idFromFormData(data),
    "/list/parents",
    async (id) => {
      await prisma.$transaction([
        prisma.user.deleteMany({ where: { id } }),
        prisma.parent.delete({ where: { id } }),
      ]);
    }
  );

export const createStudent = async (
  _currentState: CurrentState,
  data: StudentSchema
) =>
  runMutation("Create student", adminOnly, studentSchema, data, "/list/students", async (values) => {
    if (!values.password) {
      throw new Error("A password is required for a new student");
    }

    const passwordHash = await bcrypt.hash(values.password, 12);
    await prisma.$transaction(
      async (tx) => {
        const classItem = await tx.class.findUnique({
          where: { id: values.classId },
          include: { _count: { select: { students: true } } },
        });

        if (!classItem || classItem._count.students >= classItem.capacity) {
          throw new Error("The selected class is full or unavailable");
        }

        await tx.student.create({
          data: {
            id: values.username,
            username: values.username,
            name: values.name,
            surname: values.surname,
            email: values.email || null,
            phone: values.phone || null,
            address: values.address,
            ...(values.img !== undefined ? { img: values.img || null } : {}),
            bloodType: values.bloodType,
            sex: values.sex,
            birthday: values.birthday,
            gradeId: values.gradeId,
            classId: values.classId,
            parentId: values.parentId,
          },
        });
        await syncUserAccount(tx, {
          id: values.username,
          username: values.username,
          name: `${values.name} ${values.surname}`,
          email: values.email,
          passwordHash,
          role: DatabaseUserRole.STUDENT,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  });

export const updateStudent = async (
  _currentState: CurrentState,
  data: StudentSchema
) =>
  runMutation("Update student", adminOnly, studentSchema, data, "/list/students", async (values) => {
    const id = requireId(values.id);
    const passwordHash = values.password
      ? await bcrypt.hash(values.password, 12)
      : undefined;
    await prisma.$transaction(
      async (tx) => {
        const [student, classItem] = await Promise.all([
          tx.student.findUnique({ where: { id }, select: { classId: true } }),
          tx.class.findUnique({
            where: { id: values.classId },
            include: { _count: { select: { students: true } } },
          }),
        ]);

        if (!student || !classItem) {
          throw new Error("Student or class not found");
        }

        if (
          student.classId !== values.classId &&
          classItem._count.students >= classItem.capacity
        ) {
          throw new Error("The selected class is full");
        }

        await tx.student.update({
          where: { id },
          data: {
            username: values.username,
            name: values.name,
            surname: values.surname,
            email: values.email || null,
            phone: values.phone || null,
            address: values.address,
            ...(values.img !== undefined ? { img: values.img || null } : {}),
            bloodType: values.bloodType,
            sex: values.sex,
            birthday: values.birthday,
            gradeId: values.gradeId,
            classId: values.classId,
            parentId: values.parentId,
          },
        });
        await syncUserAccount(tx, {
          id,
          username: values.username,
          name: `${values.name} ${values.surname}`,
          email: values.email,
          passwordHash,
          role: DatabaseUserRole.STUDENT,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  });

export const deleteStudent = async (
  _currentState: CurrentState,
  data: FormData
) =>
  runMutation(
    "Delete student",
    adminOnly,
    stringIdSchema,
    idFromFormData(data),
    "/list/students",
    async (id) => {
      await prisma.$transaction([
        prisma.user.deleteMany({ where: { id } }),
        prisma.student.delete({ where: { id } }),
      ]);
    }
  );

export const createLesson = async (
  _currentState: CurrentState,
  data: LessonSchema
) =>
  runMutation("Create lesson", adminOnly, lessonSchema, data, "/list/lessons", async (values) => {
    await prisma.lesson.create({
      data: {
        name: values.name,
        day: values.day,
        startTime: values.startTime,
        endTime: values.endTime,
        subjectId: values.subjectId,
        classId: values.classId,
        teacherId: values.teacherId,
      },
    });
  });

export const updateLesson = async (
  _currentState: CurrentState,
  data: LessonSchema
) =>
  runMutation("Update lesson", adminOnly, lessonSchema, data, "/list/lessons", async (values) => {
    const id = requireId(values.id);
    await prisma.lesson.update({
      where: { id },
      data: {
        name: values.name,
        day: values.day,
        startTime: values.startTime,
        endTime: values.endTime,
        subjectId: values.subjectId,
        classId: values.classId,
        teacherId: values.teacherId,
      },
    });
  });

export const deleteLesson = async (
  _currentState: CurrentState,
  data: FormData
) =>
  runMutation(
    "Delete lesson",
    adminOnly,
    integerIdSchema,
    idFromFormData(data),
    "/list/lessons",
    async (id) => {
      await prisma.lesson.delete({ where: { id } });
    }
  );

async function assertTeacherOwnsLesson(
  user: SessionUser,
  lessonId: number
): Promise<void> {
  if (user.role !== "teacher") return;

  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, teacherId: user.id },
    select: { id: true },
  });
  if (!lesson) throw new Error("Teachers may only manage exams for their lessons");
}

export const createExam = async (
  _currentState: CurrentState,
  data: ExamSchema
) =>
  runMutation("Create exam", adminOrTeacher, examSchema, data, "/list/exams", async (values, user) => {
    await assertTeacherOwnsLesson(user, values.lessonId);
    await prisma.exam.create({
      data: {
        title: values.title,
        startTime: values.startTime,
        endTime: values.endTime,
        lessonId: values.lessonId,
      },
    });
  });

export const updateExam = async (
  _currentState: CurrentState,
  data: ExamSchema
) =>
  runMutation("Update exam", adminOrTeacher, examSchema, data, "/list/exams", async (values, user) => {
    const id = requireId(values.id);
    await assertTeacherOwnsLesson(user, values.lessonId);

    if (user.role === "teacher") {
      const existing = await prisma.exam.findFirst({
        where: { id, lesson: { teacherId: user.id } },
        select: { id: true },
      });
      if (!existing) throw new Error("Teachers may only update their own exams");
    }

    await prisma.exam.update({
      where: { id },
      data: {
        title: values.title,
        startTime: values.startTime,
        endTime: values.endTime,
        lessonId: values.lessonId,
      },
    });
  });

export const deleteExam = async (
  _currentState: CurrentState,
  data: FormData
) =>
  runMutation(
    "Delete exam",
    adminOrTeacher,
    integerIdSchema,
    idFromFormData(data),
    "/list/exams",
    async (id, user) => {
      if (user.role === "admin") {
        await prisma.exam.delete({ where: { id } });
        return;
      }

      const result = await prisma.exam.deleteMany({
        where: { id, lesson: { teacherId: user.id } },
      });
      if (result.count !== 1) {
        throw new Error("Teachers may only delete their own exams");
      }
    }
  );

export const deleteEvent = async (
  _currentState: CurrentState,
  data: FormData
) =>
  runMutation(
    "Delete event",
    adminOnly,
    integerIdSchema,
    idFromFormData(data),
    "/list/events",
    async (id) => {
      await prisma.event.delete({ where: { id } });
    }
  );

export const deleteAnnouncement = async (
  _currentState: CurrentState,
  data: FormData
) =>
  runMutation(
    "Delete announcement",
    adminOnly,
    integerIdSchema,
    idFromFormData(data),
    "/list/announcements",
    async (id) => {
      await prisma.announcement.delete({ where: { id } });
    }
  );

"use client";

import {
  deleteClass,
  deleteAnnouncement,
  deleteExam,
  deleteEvent,
  deleteLesson,
  deleteParent,
  deleteStudent,
  deleteSubject,
  deleteTeacher,
} from "@/lib/actions";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  type Dispatch,
  type ReactElement,
  type SetStateAction,
  useActionState,
  useEffect,
  useState,
} from "react";
import { toast } from "react-toastify";
import type { FormContainerProps } from "./FormContainer";

type ActionState = { success: boolean; error: boolean };
type DeleteAction = (
  state: ActionState,
  data: FormData
) => Promise<ActionState>;
type FormFactory = (
  setOpen: Dispatch<SetStateAction<boolean>>,
  type: "create" | "update",
  data?: unknown,
  relatedData?: unknown
) => ReactElement;

const TeacherForm = dynamic(() => import("./forms/TeacherForm"), {
  loading: () => <h1>Loading...</h1>,
});
const StudentForm = dynamic(() => import("./forms/StudentForm"), {
  loading: () => <h1>Loading...</h1>,
});
const SubjectForm = dynamic(() => import("./forms/SubjectForm"), {
  loading: () => <h1>Loading...</h1>,
});
const ClassForm = dynamic(() => import("./forms/ClassForm"), {
  loading: () => <h1>Loading...</h1>,
});
const ExamForm = dynamic(() => import("./forms/ExamForm"), {
  loading: () => <h1>Loading...</h1>,
});
const LessonForm = dynamic(() => import("./forms/LessonForm"), {
  loading: () => <h1>Loading...</h1>,
});
const ParentForm = dynamic(() => import("./forms/ParentForm"), {
  loading: () => <h1>Loading...</h1>,
});

const forms: Partial<Record<FormContainerProps["table"], FormFactory>> = {
  subject: (setOpen, type, data, relatedData) => (
    <SubjectForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  class: (setOpen, type, data, relatedData) => (
    <ClassForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  teacher: (setOpen, type, data, relatedData) => (
    <TeacherForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  student: (setOpen, type, data, relatedData) => (
    <StudentForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  exam: (setOpen, type, data, relatedData) => (
    <ExamForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  lesson: (setOpen, type, data, relatedData) => (
    <LessonForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  parent: (setOpen, type, data, relatedData) => (
    <ParentForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
};

const deleteActionMap: Partial<
  Record<FormContainerProps["table"], DeleteAction>
> = {
  subject: deleteSubject,
  class: deleteClass,
  teacher: deleteTeacher,
  student: deleteStudent,
  exam: deleteExam,
  lesson: deleteLesson,
  parent: deleteParent,
  event: deleteEvent,
  announcement: deleteAnnouncement,
};

const unsupportedDeleteAction: DeleteAction = async () => ({
  success: false,
  error: true,
});

function UnsupportedForm({
  label,
  table,
  type,
  onClose,
}: {
  label: string;
  table: FormContainerProps["table"];
  type: FormContainerProps["type"];
  onClose: () => void;
}) {
  return (
    <div className="p-4 flex flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-2xl">
        ⚠️
      </div>
      <div>
        <h2 className="text-lg font-semibold text-gray-800">{label}</h2>
        <p className="mt-2 text-sm text-gray-500">
          This {table} {type} action is not available yet.
        </p>
      </div>
      <button
        type="button"
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white"
        onClick={onClose}
      >
        Close
      </button>
    </div>
  );
}

function ModalContent({
  table,
  type,
  data,
  id,
  relatedData,
  setOpen,
}: FormContainerProps & {
  relatedData?: unknown;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const deleteAction = deleteActionMap[table];
  const [state, formAction] = useActionState(
    deleteAction ?? unsupportedDeleteAction,
    { success: false, error: false }
  );
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`${table} has been deleted!`);
      setOpen(false);
      router.refresh();
    }
  }, [state.success, router, setOpen, table]);

  if (type === "delete") {
    if (id === undefined) {
      return (
        <UnsupportedForm
          label="Missing record"
          table={table}
          type={type}
          onClose={() => setOpen(false)}
        />
      );
    }

    if (!deleteAction) {
      return (
        <UnsupportedForm
          label="Delete form unavailable"
          table={table}
          type={type}
          onClose={() => setOpen(false)}
        />
      );
    }

    return (
      <form action={formAction} className="p-4 flex flex-col gap-4">
        <input type="hidden" name="id" value={id} />
        <span className="text-center font-medium">
          All data will be lost. Are you sure you want to delete this {table}?
        </span>
        {state.error && (
          <span className="text-center text-sm text-red-500">
            The record could not be deleted.
          </span>
        )}
        <button className="bg-red-700 text-white py-2 px-4 rounded-md border-none w-max self-center">
          Delete
        </button>
      </form>
    );
  }

  const form = forms[table];
  if (!form) {
    return (
      <UnsupportedForm
        label="Form unavailable"
        table={table}
        type={type}
        onClose={() => setOpen(false)}
      />
    );
  }

  return form(setOpen, type, data, relatedData);
}

const FormModal = ({
  table,
  type,
  data,
  id,
  relatedData,
}: FormContainerProps & { relatedData?: unknown }) => {
  const size = type === "create" ? "w-8 h-8" : "w-7 h-7";
  const bgColor =
    type === "create"
      ? "bg-lamaYellow"
      : type === "update"
        ? "bg-lamaSky"
        : "bg-lamaPurple";
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label={`${type} ${table}`}
        className={`${size} flex items-center justify-center rounded-full ${bgColor}`}
        onClick={() => setOpen(true)}
      >
        <Image src={`/${type}.png`} alt="" width={16} height={16} />
      </button>
      {open && (
        <div className="w-screen h-screen absolute left-0 top-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-md relative w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[40%]">
            <ModalContent
              table={table}
              type={type}
              data={data}
              id={id}
              relatedData={relatedData}
              setOpen={setOpen}
            />
            <button
              type="button"
              aria-label="Close form"
              className="absolute top-4 right-4 cursor-pointer"
              onClick={() => setOpen(false)}
            >
              <Image src="/close.png" alt="" width={14} height={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FormModal;

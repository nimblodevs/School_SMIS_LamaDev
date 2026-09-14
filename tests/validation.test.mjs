import assert from "node:assert/strict";
import test from "node:test";
import {
  examSchema,
  studentSchema,
} from "../src/lib/formValidationSchemas.ts";

const validStudent = {
  username: "student-1",
  password: "a-secure-password",
  name: "Ada",
  surname: "Lovelace",
  address: "1 School Road",
  bloodType: "O+",
  birthday: "2012-01-01",
  sex: "FEMALE",
  gradeId: 1,
  classId: 1,
  parentId: "parent-1",
};

test("requires a parent for every student", () => {
  assert.equal(studentSchema.safeParse(validStudent).success, true);
  assert.equal(
    studentSchema.safeParse({ ...validStudent, parentId: "" }).success,
    false
  );
});

test("requires an exam to end after it starts", () => {
  const result = examSchema.safeParse({
    title: "Mathematics",
    startTime: "2026-09-14T10:00:00Z",
    endTime: "2026-09-14T09:00:00Z",
    lessonId: 1,
  });
  assert.equal(result.success, false);
});

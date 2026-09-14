DO $$
BEGIN
  CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'TEACHER', 'STUDENT', 'PARENT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

ALTER TABLE "Class"
ADD CONSTRAINT "Class_capacity_positive" CHECK ("capacity" > 0) NOT VALID;

ALTER TABLE "Lesson"
ADD CONSTRAINT "Lesson_time_order" CHECK ("endTime" > "startTime") NOT VALID;

ALTER TABLE "Exam"
ADD CONSTRAINT "Exam_time_order" CHECK ("endTime" > "startTime") NOT VALID;

ALTER TABLE "Assignment"
ADD CONSTRAINT "Assignment_time_order" CHECK ("dueDate" > "startDate") NOT VALID;

ALTER TABLE "Event"
ADD CONSTRAINT "Event_time_order" CHECK ("endTime" > "startTime") NOT VALID;

ALTER TABLE "Result"
ADD CONSTRAINT "Result_score_range" CHECK ("score" BETWEEN 0 AND 100) NOT VALID,
ADD CONSTRAINT "Result_single_assessment" CHECK (
  ("examId" IS NOT NULL AND "assignmentId" IS NULL)
  OR ("examId" IS NULL AND "assignmentId" IS NOT NULL)
) NOT VALID;

-- Preserve rows that cannot be made valid without choosing or discarding
-- assessment data. Administrators can inspect these quarantine tables after
-- deployment and restore corrected records through the application.
CREATE TABLE IF NOT EXISTS "_ResultIntegrityQuarantine" (
  "id" INTEGER NOT NULL PRIMARY KEY,
  "score" INTEGER NOT NULL,
  "examId" INTEGER,
  "assignmentId" INTEGER,
  "studentId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "quarantinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "_AttendanceIntegrityQuarantine" (
  "id" INTEGER NOT NULL PRIMARY KEY,
  "date" TIMESTAMP(3) NOT NULL,
  "present" BOOLEAN NOT NULL,
  "studentId" TEXT NOT NULL,
  "lessonId" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "quarantinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

UPDATE "Class"
SET "capacity" = 1
WHERE "capacity" <= 0;

UPDATE "Lesson"
SET "endTime" = "startTime" + INTERVAL '1 hour'
WHERE "endTime" <= "startTime";

UPDATE "Exam"
SET "endTime" = "startTime" + INTERVAL '1 hour'
WHERE "endTime" <= "startTime";

UPDATE "Assignment"
SET "dueDate" = "startDate" + INTERVAL '1 day'
WHERE "dueDate" <= "startDate";

UPDATE "Event"
SET "endTime" = "startTime" + INTERVAL '1 hour'
WHERE "endTime" <= "startTime";

INSERT INTO "_ResultIntegrityQuarantine" (
  "id", "score", "examId", "assignmentId", "studentId", "reason"
)
SELECT
  "id", "score", "examId", "assignmentId", "studentId",
  'result must reference exactly one assessment'
FROM "Result"
WHERE ("examId" IS NULL AND "assignmentId" IS NULL)
   OR ("examId" IS NOT NULL AND "assignmentId" IS NOT NULL)
ON CONFLICT ("id") DO NOTHING;

WITH duplicate_results AS (
  SELECT "id"
  FROM (
    SELECT
      "id",
      ROW_NUMBER() OVER (
        PARTITION BY "studentId", "examId"
        ORDER BY "id"
      ) AS row_number
    FROM "Result"
    WHERE "examId" IS NOT NULL
  ) ranked
  WHERE row_number > 1
)
INSERT INTO "_ResultIntegrityQuarantine" (
  "id", "score", "examId", "assignmentId", "studentId", "reason"
)
SELECT
  result."id", result."score", result."examId", result."assignmentId",
  result."studentId", 'duplicate student exam result'
FROM "Result" result
JOIN duplicate_results duplicate ON duplicate."id" = result."id"
ON CONFLICT ("id") DO NOTHING;

WITH duplicate_results AS (
  SELECT "id"
  FROM (
    SELECT
      "id",
      ROW_NUMBER() OVER (
        PARTITION BY "studentId", "assignmentId"
        ORDER BY "id"
      ) AS row_number
    FROM "Result"
    WHERE "assignmentId" IS NOT NULL
  ) ranked
  WHERE row_number > 1
)
INSERT INTO "_ResultIntegrityQuarantine" (
  "id", "score", "examId", "assignmentId", "studentId", "reason"
)
SELECT
  result."id", result."score", result."examId", result."assignmentId",
  result."studentId", 'duplicate student assignment result'
FROM "Result" result
JOIN duplicate_results duplicate ON duplicate."id" = result."id"
ON CONFLICT ("id") DO NOTHING;

-- Quarantine inserts intentionally precede normalization so the audit rows
-- retain the original score and assessment references.
UPDATE "Result"
SET "score" = GREATEST(0, LEAST("score", 100))
WHERE "score" < 0 OR "score" > 100;

-- When both references exist, keep the exam association active and preserve
-- the original row above for manual reconciliation.
UPDATE "Result"
SET "assignmentId" = NULL
WHERE "examId" IS NOT NULL AND "assignmentId" IS NOT NULL;

DELETE FROM "Result"
WHERE "examId" IS NULL AND "assignmentId" IS NULL;

WITH duplicate_results AS (
  SELECT "id"
  FROM (
    SELECT
      "id",
      ROW_NUMBER() OVER (
        PARTITION BY "studentId", "examId"
        ORDER BY "id"
      ) AS row_number
    FROM "Result"
    WHERE "examId" IS NOT NULL
  ) ranked
  WHERE row_number > 1
  UNION
  SELECT "id"
  FROM (
    SELECT
      "id",
      ROW_NUMBER() OVER (
        PARTITION BY "studentId", "assignmentId"
        ORDER BY "id"
      ) AS row_number
    FROM "Result"
    WHERE "assignmentId" IS NOT NULL
  ) ranked
  WHERE row_number > 1
)
DELETE FROM "Result"
WHERE "id" IN (SELECT "id" FROM duplicate_results);

WITH duplicate_attendance AS (
  SELECT "id"
  FROM (
    SELECT
      "id",
      ROW_NUMBER() OVER (
        PARTITION BY "studentId", "lessonId", "date"
        ORDER BY "id"
      ) AS row_number
    FROM "Attendance"
  ) ranked
  WHERE row_number > 1
)
INSERT INTO "_AttendanceIntegrityQuarantine" (
  "id", "date", "present", "studentId", "lessonId", "reason"
)
SELECT
  attendance."id", attendance."date", attendance."present",
  attendance."studentId", attendance."lessonId", 'duplicate attendance row'
FROM "Attendance" attendance
JOIN duplicate_attendance duplicate ON duplicate."id" = attendance."id"
ON CONFLICT ("id") DO NOTHING;

WITH duplicate_attendance AS (
  SELECT "id"
  FROM (
    SELECT
      "id",
      ROW_NUMBER() OVER (
        PARTITION BY "studentId", "lessonId", "date"
        ORDER BY "id"
      ) AS row_number
    FROM "Attendance"
  ) ranked
  WHERE row_number > 1
)
DELETE FROM "Attendance"
WHERE "id" IN (SELECT "id" FROM duplicate_attendance);

CREATE UNIQUE INDEX CONCURRENTLY "Attendance_studentId_lessonId_date_key"
ON "Attendance"("studentId", "lessonId", "date");

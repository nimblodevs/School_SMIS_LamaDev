ALTER TABLE "Class" VALIDATE CONSTRAINT "Class_capacity_positive";
ALTER TABLE "Lesson" VALIDATE CONSTRAINT "Lesson_time_order";
ALTER TABLE "Exam" VALIDATE CONSTRAINT "Exam_time_order";
ALTER TABLE "Assignment" VALIDATE CONSTRAINT "Assignment_time_order";
ALTER TABLE "Event" VALIDATE CONSTRAINT "Event_time_order";
ALTER TABLE "Result" VALIDATE CONSTRAINT "Result_score_range";
ALTER TABLE "Result" VALIDATE CONSTRAINT "Result_single_assessment";

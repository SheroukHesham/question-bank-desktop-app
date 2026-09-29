import { IExam, IExamBase } from "@/shared/interfaces/index.js";
import Database from "better-sqlite3";
import { ExamRow } from "../interfaces/index.js";

export class ExamRepository {
  constructor(private readonly db: Database.Database) {}

  createExam(exam: IExamBase) {
    const {
      title,
      type,
      totalNumberOfQuestions,
      numberOfQuestionsAdded,
      examQuestions,
      status,
    } = exam;

    const createWithQuestions = this.db.transaction(() => {
      const insertExam = this.db
        .prepare(
          "INSERT INTO exams (title,type,total_number_of_questions,number_of_questions_added,status) VALUES (?,?,?,?,?)",
        )
        .run(
          title,
          type,
          totalNumberOfQuestions,
          numberOfQuestionsAdded,
          status,
        );

      const examId = insertExam.lastInsertRowid as number;

      this.createExamQuestions(examId, examQuestions);

      return examId;
    });

    return createWithQuestions();
  }

  private createExamQuestions(
    examId: number,
    examQuestions: { questionId: number; position: number }[],
  ) {
    const insertExamDetails = this.db.prepare(
      "INSERT INTO exam_questions (exam_id, question_id,position) VALUES (?,?,?)",
    );

    examQuestions.map(({ questionId, position }) => {
      insertExamDetails.run(examId, questionId, position);
    });
  }

  findExamById(examId: number): IExam {
    const examInfo = this.db
      .prepare<number, ExamRow>(
        `
      SELECT
        _id,
        title,
        status,
        type,
        total_number_of_questions AS totalNumberOfQuestions,
        number_of_questions_added AS numberOfQuestionsAdded,

        strftime('%d/%m/%Y', created_at) || ' ' ||
        CASE
          WHEN CAST(strftime('%H', created_at) AS INTEGER) = 0
            THEN '12:' || strftime('%M', created_at) || ' AM'
          WHEN CAST(strftime('%H', created_at) AS INTEGER) < 12
            THEN CAST(CAST(strftime('%H', created_at) AS INTEGER) AS TEXT)
                 || ':' || strftime('%M', created_at) || ' AM'
          WHEN CAST(strftime('%H', created_at) AS INTEGER) = 12
            THEN '12:' || strftime('%M', created_at) || ' PM'
          ELSE
            CAST(CAST(strftime('%H', created_at) AS INTEGER) - 12 AS TEXT)
                 || ':' || strftime('%M', created_at) || ' PM'
        END AS createdAt,

        strftime('%d/%m/%Y', updated_at) || ' ' ||
        CASE
          WHEN CAST(strftime('%H', updated_at) AS INTEGER) = 0
            THEN '12:' || strftime('%M', updated_at) || ' AM'
          WHEN CAST(strftime('%H', updated_at) AS INTEGER) < 12
            THEN CAST(CAST(strftime('%H', updated_at) AS INTEGER) AS TEXT)
                 || ':' || strftime('%M', updated_at) || ' AM'
          WHEN CAST(strftime('%H', updated_at) AS INTEGER) = 12
            THEN '12:' || strftime('%M', updated_at) || ' PM'
          ELSE
            CAST(CAST(strftime('%H', updated_at) AS INTEGER) - 12 AS TEXT)
                 || ':' || strftime('%M', updated_at) || ' PM'
        END AS updatedAt

      FROM exams
      WHERE _id = ?
      `,
      )
      .get(examId);

    if (examInfo) {
      return {
        ...examInfo,
        examQuestions: this.findExamQuestions(examId),
      };
    }

    throw new Error("Exam Not Found!");
  }

  findAllExams(): IExam[] {
    const result = this.db
      .prepare<unknown[], ExamRow>(
        `
      SELECT
        _id,
        title,
        status,
        type,
        total_number_of_questions AS totalNumberOfQuestions,
        number_of_questions_added AS numberOfQuestionsAdded,

        strftime('%d/%m/%Y', created_at) || ' ' ||
        CASE
          WHEN CAST(strftime('%H', created_at) AS INTEGER) = 0
            THEN '12:' || strftime('%M', created_at) || ' AM'
          WHEN CAST(strftime('%H', created_at) AS INTEGER) < 12
            THEN CAST(CAST(strftime('%H', created_at) AS INTEGER) AS TEXT)
                 || ':' || strftime('%M', created_at) || ' AM'
          WHEN CAST(strftime('%H', created_at) AS INTEGER) = 12
            THEN '12:' || strftime('%M', created_at) || ' PM'
          ELSE
            CAST(CAST(strftime('%H', created_at) AS INTEGER) - 12 AS TEXT)
                 || ':' || strftime('%M', created_at) || ' PM'
        END AS createdAt,

        strftime('%d/%m/%Y', updated_at) || ' ' ||
        CASE
          WHEN CAST(strftime('%H', updated_at) AS INTEGER) = 0
            THEN '12:' || strftime('%M', updated_at) || ' AM'
          WHEN CAST(strftime('%H', updated_at) AS INTEGER) < 12
            THEN CAST(CAST(strftime('%H', updated_at) AS INTEGER) AS TEXT)
                 || ':' || strftime('%M', updated_at) || ' AM'
          WHEN CAST(strftime('%H', updated_at) AS INTEGER) = 12
            THEN '12:' || strftime('%M', updated_at) || ' PM'
          ELSE
            CAST(CAST(strftime('%H', updated_at) AS INTEGER) - 12 AS TEXT)
                 || ':' || strftime('%M', updated_at) || ' PM'
        END AS updatedAt

      FROM exams
      ORDER BY created_at DESC
      `,
      )
      .all();

    const exams: IExam[] = [];

    for (const exam of result) {
      exams.push({
        ...exam,
        examQuestions: this.findExamQuestions(exam._id),
      });
    }

    return exams;
  }

  private findExamQuestions(
    examId: number,
  ): { questionId: number; position: number }[] {
    return this.db
      .prepare<
        number,
        { questionId: number; position: number }
      >("SELECT question_id AS questionId,position FROM exam_questions WHERE exam_id = ? ORDER BY position ASC")
      .all(examId);
  }

  updateExam(examId: number, updates: Partial<IExamBase>): IExam {
    const runUpdate = this.db.transaction(() => {
      const {
        title,
        type,
        status,
        examQuestions,
        numberOfQuestionsAdded,
        totalNumberOfQuestions,
      } = updates;
      const fields: string[] = [];
      const values: unknown[] = [];

      if (title) {
        fields.push("title = ?");
        values.push(title);
      }
      if (type) {
        fields.push("type = ?");
        values.push(type);
      }
      if (status) {
        fields.push("status = ?");
        values.push(status);
      }
      if (numberOfQuestionsAdded) {
        fields.push("number_of_questions_added = ?");
        values.push(numberOfQuestionsAdded);
      }
      if (totalNumberOfQuestions) {
        fields.push("total_number_of_questions = ?");
        values.push(totalNumberOfQuestions);
      }

      if (examQuestions) {
        this.db
          .prepare("DELETE FROM exam_questions WHERE exam_id = ?")
          .run(examId);
        this.createExamQuestions(examId, examQuestions);
      }

      if (fields.length === 0) return;

      fields.push("updated_at = datetime('now')");
      values.push(examId);

      this.db
        .prepare(`UPDATE exams SET ${fields.join(", ")} WHERE _id = ?`)
        .run(...values);
    });

    runUpdate();
    return this.findExamById(examId);
  }

  deleteExam(examId: number) {
    const result = this.db
      .prepare("DELETE FROM exams WHERE _id = ?")
      .run(examId);
    if (result.changes === 0) throw new Error("Exam not found.");
  }
}

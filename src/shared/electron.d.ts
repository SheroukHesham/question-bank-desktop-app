import type {
  ICategory,
  ICategoryDetails,
  ICreateEssayQuestion,
  IEssayQuestion,
  IFilteredQuestion,
  IGroupedCategorySubcategory,
  IGroupedQuestionCategory,
  IQuestionCountByCategory,
  IQuestions,
  ISubCategory,
  IGenerateExamInput,
  IExamBase,
  IExam,
  IFindQuestionsParams,
} from "./interfaces";
import type { IpcResult } from "./ipc-result";
import type { ICreateMcqQuestion, IMcqQuestion } from "./question";

export {};

declare global {
  interface Window {
    electron: {
      question: {
        createMcq(input: ICreateMcqQuestion): Promise<IMcqQuestion>;
        createEssay(input: ICreateEssayQuestion): Promise<IEssayQuestion>;
        findQuestionById(id: number): Promise<IQuestions>;
        findGroupedQuestions(): Promise<IGroupedQuestionCategory[]>;
        findByFilterPaginated(params: IFindQuestionsParams): Promise<{
          data: {
            questions: IFilteredQuestion[];
            total: number;
          };
        }>;
        updateMcq(updatedQuestion: IMcqQuestion): Promise<IMcqQuestion>;
        updateEssay(updatedQuestion: IEssayQuestion): Promise<IEssayQuestion>;
        deleteQuestion(id: number): Promise<void>;
        getTotalQuestions(): Promise<{ total: number } | undefined>;
        getTotalQuestionsPerCategory(): Promise<
          IQuestionCountByCategory[] | undefined
        >;
        findByCategoryId(categoryId: number): Promise<IQuestions[]>;
        generateExamQuestions(
          criteria: IGenerateExamInput,
        ): Promise<IpcResult<IQuestions[]>>;
        findQuestionsForExam(examId: number): Promise<IQuestions[]>;
      };
      image: {
        getPathForFile(file: File): Promise<string>;
      };
      category: {
        createCategory(name: string): Promise<ICategory>;
        updateCategory(category: ICategory): Promise<ICategory>;
        deleteCategory(id: number): Promise<void>;
        getAllCategories(): Promise<ICategory[]>;
        getCategoryById(id: number): Promise<ICategory | undefined>;
        findCategoryByName(name: string): Promise<ICategory | undefined>;
        findAllCategoriesDetails(): Promise<ICategoryDetails[] | undefined>;
        getGroupedCategorySubcategory(): Promise<IGroupedCategorySubcategory[]>;
      };
      subcategory: {
        findSubcategoryByName(name: string): Promise<ISubCategory | undefined>;
        findSubcategoryById(id: number): Promise<ISubCategory | undefined>;
        createSubcategory(
          name: string,
          categoryId: number,
        ): Promise<ISubCategory>;
        updateSubcategory(subcategory: ISubCategory): Promise<ISubCategory>;
        deleteSubcategory(id: number): Promise<void>;
        findAllSubcategories(): Promise<ISubCategory[]>;
        findSubcategoryByCategoryId(
          categoryId: number,
        ): Promise<ISubCategory[]>;
      };
      exam: {
        createExam(exam: IExamBase): Promise<void>;
        updateExam(examId: number, updates: Partial<IExam>): Promise<IExam>;
        deleteExam(examId: number): Promise<void>;
        findExamById(examId: number): Promise<IExam>;
        findAllExams(): Promise<IExam[]>;
        exportToWord(examId: number): Promise<{
          success: boolean;
          data: { exported: boolean; filePath: string };
        }>;
      };
      update: {
        onAvailable(cb: (version: string) => void);
        onDownloaded(cb: (version: string) => void);
        install();
      };
    };
  }
}

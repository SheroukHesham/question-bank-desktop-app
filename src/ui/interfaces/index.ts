import type { IQuestions } from "@/shared/interfaces";
import type { LucideProps } from "lucide-react";
import type {
  ForwardRefExoticComponent,
  RefAttributes,
  RefObject,
} from "react";
import type { TNavBarLinks } from "../types";

export interface INavbar {
  id: TNavBarLinks;
  label: string;
  to?: string;
  subLinks?: INavbar[];
  icon?: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;
}

export interface IRadioGroupItem {
  id: string;
  value: string;
  title: string;
  description?: string;
  icon?: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;
}

export interface IQuestionSubcategory {
  _id: string;
  name: string;
  categoryId: string;
  questions: IQuestions[];
}

export interface IVirtualizedQuestionsProps {
  questions: IQuestions[];
  currentPage: number;
  pageSize: number;
  editable: boolean;
  expandable: boolean;
  selectedQuestions?: IQuestions[];
  toggleSelected?: (question: IQuestions) => void;
}

export interface IWindowVirtualizedQuestionsProps extends IVirtualizedQuestionsProps {
  controlsRef: RefObject<HTMLDivElement | null>;
}

export interface IContainerVirtualizedQuestionsProps extends IVirtualizedQuestionsProps {
  scrollContainerRef: RefObject<HTMLDivElement | null>;
}

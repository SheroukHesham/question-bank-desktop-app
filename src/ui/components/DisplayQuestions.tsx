// DisplayQuestions.tsx

import { useEffect, useRef, useState, type RefObject } from "react";
import PagePagination from "./PagePagination";
import ReusableSearch from "./ReusableSearch";
import { SingleSelect } from "./SingleSelect";
import type { TQuestionTypeFilter } from "../types";
import { SelectItem } from "./ui/select";
import type {
  ICategoryDetails,
  IQuestions,
  ISubCategory,
} from "@/shared/interfaces";
import type { TQuestionDifficulty, TQuestionTypes } from "@/shared/types";
import { useFetch } from "../hooks/custom";
import { questionQueries } from "../lib/queries/questions.queries";
import ContainerVirtualizedQuestions from "./ContainerVirtualizedQuestions";
import WindowVirtualizedQuestions from "./WindowVirtualizedQuestions";

interface IProps {
  categoryId?: number;
  subcategories: ISubCategory[] | undefined;
  categories?: ICategoryDetails[];
  editable?: boolean;
  toggleSelected?: (question: IQuestions) => void;
  selectedQuestions?: IQuestions[];
  examType?: TQuestionTypes;
  expandable?: boolean;
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
}

const PAGE_SIZE = 25;

function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);

  return debounced;
}

const DisplayQuestions = ({
  subcategories,
  categoryId,
  categories,
  editable = true,
  toggleSelected,
  selectedQuestions,
  examType,
  expandable = true,
  scrollContainerRef,
}: IProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<TQuestionTypeFilter>("all");
  const [specializationFilter, setSpecializationFilter] = useState<
    string | null
  >(null);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(
    undefined,
  );
  const [difficultyFilter, setDifficultyFilter] = useState<
    TQuestionDifficulty | undefined
  >(undefined);
  const [search, setSearch] = useState("");

  const controlsRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data } = useFetch(
    questionQueries.filtered({
      categoryId:
        categoryId ?? (categoryFilter ? Number(categoryFilter) : undefined),
      typeFilter: examType ?? (typeFilter === "all" ? undefined : typeFilter),
      specializationFilter: specializationFilter
        ? Number(specializationFilter)
        : undefined,
      difficulty: difficultyFilter,
      currentPage,
      search: debouncedSearch || undefined,
      PAGE_SIZE,
    }),
  );

  const questions: IQuestions[] = data?.data.questions ?? [];
  const total = data?.data.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    if (scrollContainerRef) {
      scrollContainerRef.current?.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      return;
    }

    const controls = controlsRef.current;
    if (!controls) return;

    const top = controls.getBoundingClientRect().bottom + window.scrollY;

    window.scrollTo({
      top: Math.max(0, top),
      behavior: "smooth",
    });
  }, [currentPage, scrollContainerRef]);

  return (
    <>
      <div ref={controlsRef}>
        <div className="my-5">
          <ReusableSearch
            placeholder="Search for a question"
            search={search}
            setSearch={(value) => {
              setCurrentPage(1);
              setSearch(value);
            }}
          />
        </div>

        <div className="mt-3 flex w-full flex-wrap gap-2">
          {!categoryId && (
            <SingleSelect
              placeholder="Topic"
              value={categoryFilter ?? "all"}
              onValueChange={(value) => {
                setCurrentPage(1);
                setCategoryFilter(value === "all" ? undefined : value);
                setSpecializationFilter(null);
              }}
            >
              <SelectItem value="all">All</SelectItem>

              {categories?.map((category) => (
                <SelectItem
                  key={category.categoryId}
                  value={category.categoryId.toString()}
                >
                  {category.categoryName}
                </SelectItem>
              ))}
            </SingleSelect>
          )}

          <SingleSelect
            placeholder="Subtopic"
            value={specializationFilter ?? "all"}
            onValueChange={(value) => {
              setCurrentPage(1);
              setSpecializationFilter(value === "all" ? null : value);
            }}
          >
            <SelectItem value="all">All Subtopics</SelectItem>

            {subcategories
              ?.filter((subcategory) =>
                categoryFilter
                  ? subcategory.categoryId === Number(categoryFilter)
                  : true,
              )
              .map((subcategory) => (
                <SelectItem
                  key={subcategory._id}
                  value={subcategory._id.toString()}
                >
                  {subcategory.name}
                </SelectItem>
              ))}
          </SingleSelect>

          {!examType && (
            <SingleSelect
              placeholder="Question Type"
              value={typeFilter}
              onValueChange={(value) => {
                setCurrentPage(1);
                setTypeFilter(value as TQuestionTypeFilter);
              }}
            >
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="mcq">MCQ</SelectItem>
              <SelectItem value="essay">Essay</SelectItem>
            </SingleSelect>
          )}

          <SingleSelect
            placeholder="Question Difficulty"
            value={difficultyFilter ?? "all"}
            onValueChange={(value) => {
              setCurrentPage(1);
              setDifficultyFilter(
                value === "all" ? undefined : (value as TQuestionDifficulty),
              );
            }}
          >
            <SelectItem value="all">All Difficulties</SelectItem>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="moderate">Moderate</SelectItem>
            <SelectItem value="difficult">Difficult</SelectItem>
          </SingleSelect>
        </div>
      </div>

      {scrollContainerRef ? (
        <ContainerVirtualizedQuestions
          questions={questions}
          currentPage={currentPage}
          pageSize={PAGE_SIZE}
          editable={editable}
          expandable={expandable}
          selectedQuestions={selectedQuestions}
          toggleSelected={toggleSelected}
          scrollContainerRef={scrollContainerRef}
        />
      ) : (
        <WindowVirtualizedQuestions
          questions={questions}
          currentPage={currentPage}
          pageSize={PAGE_SIZE}
          editable={editable}
          expandable={expandable}
          selectedQuestions={selectedQuestions}
          toggleSelected={toggleSelected}
          controlsRef={controlsRef}
        />
      )}

      <div className="mt-5 flex justify-center">
        <PagePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </>
  );
};

export default DisplayQuestions;

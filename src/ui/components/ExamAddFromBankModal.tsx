import { X } from "lucide-react";
import { Button } from "./ui/button";
import type { IQuestions, ISubCategory } from "@/shared/interfaces";
import { useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { TQuestionTypes } from "@/shared/types";
import { useFetch } from "../hooks/custom";
import DisplayQuestions from "./DisplayQuestions";
import { categoryQueries } from "../lib/queries/categories.queries";
import { subcategoryQueries } from "../lib/queries/subcategory.queries";
import { createPortal } from "react-dom";

interface IProps {
  examType: TQuestionTypes;
  addedQuestions: IQuestions[];
  setAddedQuestions: Dispatch<SetStateAction<IQuestions[]>>;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

const ExamAddFromBankModal = ({
  setAddedQuestions,
  examType,
  open,
  setOpen,
}: IProps) => {
  const [selectedQuestions, setSelectedQuestions] = useState<IQuestions[]>([]);
  const parentRef = useRef<HTMLDivElement>(null);

  const { data: categories } = useFetch(categoryQueries.findAllDetails());
  const { data: subcategories } = useFetch(subcategoryQueries.findAllDetails());

  const toggleSelected = (question: IQuestions) => {
    setSelectedQuestions((prev) =>
      prev.some((item) => item._id === question._id)
        ? prev.filter((item) => item._id !== question._id)
        : [...prev, question],
    );
  };

  const onClose = () => {
    // if (containerRef.current !== null)
    parentRef?.current?.scrollTo({ top: 0 });
    setOpen(false);
    setSelectedQuestions([]);
  };

  const onAddFromBankSubmit = () => {
    setAddedQuestions((prev) => {
      const existingIds = new Set(prev.map((question) => question._id));

      const newQuestions = selectedQuestions.filter(
        (question) => !existingIds.has(question._id),
      );
      return [...prev, ...newQuestions];
    });

    onClose();
  };

  const [shouldRender, setShouldRender] = useState(open);

  if (open && !shouldRender) {
    setShouldRender(true);
  }

  if (!shouldRender) return null;

  return createPortal(
    <div
      data-open={open}
      data-closed={!open}
      onAnimationEnd={() => {
        if (!open) setShouldRender(false);
      }}
      className="fixed inset-0 isolate z-100 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 max-h-80vh overflow-auto"
    >
      <div
        className={`absolute  rounded-lg bg-popover p-5 m-auto w-[95%] z-100 h-[95%] inset-0 ${open ? "flex" : "hidden"}`}
      >
        <div className="relative w-full h-full bg-popover z-100 flex flex-col gap-5">
          <div className="w-full flex justify-between">
            <h1 className="text-3xl font-semibold tracking-tight">
              Add From Question Bank
            </h1>
            <X
              size={20}
              className="text-muted/80 hover:text-muted cursor-pointer"
              onClick={() => {
                onClose();
              }}
            />
          </div>
          <div className=" sticky top-0 w-full flex justify-end  ">
            <div className="bg-popover ">
              <Button
                type="button"
                onClick={onAddFromBankSubmit}
                disabled={selectedQuestions?.length === 0}
                className="sm:w-lg disabled:pointer-events-none"
              >
                Add
                {selectedQuestions?.length > 0 &&
                  ` (${selectedQuestions.length})`}
              </Button>
            </div>
          </div>

          <DisplayQuestions
            subcategories={subcategories as ISubCategory[]}
            categories={categories}
            editable={false}
            selectedQuestions={selectedQuestions}
            toggleSelected={toggleSelected}
            examType={examType}
            expandable={false}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ExamAddFromBankModal;

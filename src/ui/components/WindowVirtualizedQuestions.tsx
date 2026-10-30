import { useLayoutEffect, useRef, useState } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import QuestionCard from "./QuestionCard";
import type { IWindowVirtualizedQuestionsProps } from "../interfaces";

const QUESTION_GAP = 20;

const WindowVirtualizedQuestions = ({
  questions,
  currentPage,
  pageSize,
  editable,
  expandable,
  selectedQuestions,
  toggleSelected,
  controlsRef,
}: IWindowVirtualizedQuestionsProps) => {
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  useLayoutEffect(() => {
    const updateScrollMargin = () => {
      const list = listRef.current;
      if (!list) return;

      const nextMargin = list.getBoundingClientRect().top + window.scrollY;

      setScrollMargin((previous) =>
        previous === nextMargin ? previous : nextMargin,
      );
    };

    updateScrollMargin();

    const observer = new ResizeObserver(updateScrollMargin);

    if (controlsRef.current) {
      observer.observe(controlsRef.current);
    }

    window.addEventListener("resize", updateScrollMargin);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateScrollMargin);
    };
  }, [controlsRef]);

  const virtualizer = useWindowVirtualizer({
    count: questions.length,
    estimateSize: () => 220,
    overscan: 5,
    gap: QUESTION_GAP,
    scrollMargin,
    getItemKey: (index) => questions[index]?._id ?? index,
    measureElement: (element) => element.getBoundingClientRect().height,
  });

  return (
    <div ref={listRef} className="mt-5 w-full">
      <div
        className="relative w-full"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const question = questions[virtualItem.index];
          if (!question) return null;

          const isSelected = selectedQuestions?.some(
            (item) => item._id === question._id,
          );

          return (
            <div
              key={virtualItem.key}
              ref={virtualizer.measureElement}
              data-index={virtualItem.index}
              className="absolute left-0 top-0 w-full"
              style={{
                transform: `translateY(${virtualItem.start - scrollMargin}px)`,
              }}
            >
              <div
                className={`h-fit rounded-md ${
                  isSelected ? "border-2 border-primary" : ""
                }`}
              >
                <QuestionCard
                  idx={(currentPage - 1) * pageSize + virtualItem.index}
                  question={question}
                  editable={editable}
                  onClick={() => toggleSelected?.(question)}
                  size={editable ? "default" : "sm"}
                  expandable={expandable}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WindowVirtualizedQuestions;

// ContainerVirtualizedQuestions.tsx

import { useLayoutEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import QuestionCard from "./QuestionCard";
import type { IContainerVirtualizedQuestionsProps } from "../interfaces";

const QUESTION_GAP = 20;

const ContainerVirtualizedQuestions = ({
  questions,
  currentPage,
  pageSize,
  editable,
  expandable,
  selectedQuestions,
  toggleSelected,
  scrollContainerRef,
}: IContainerVirtualizedQuestionsProps) => {
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    const list = listRef.current;

    if (!container || !list) return;

    const updateScrollMargin = () => {
      const nextMargin =
        list.getBoundingClientRect().top -
        container.getBoundingClientRect().top +
        container.scrollTop;

      setScrollMargin((previous) =>
        previous === nextMargin ? previous : nextMargin,
      );
    };

    updateScrollMargin();

    const observer = new ResizeObserver(updateScrollMargin);
    observer.observe(container);

    window.addEventListener("resize", updateScrollMargin);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateScrollMargin);
    };
  }, [scrollContainerRef]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: questions.length,
    getScrollElement: () => scrollContainerRef.current,
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

export default ContainerVirtualizedQuestions;

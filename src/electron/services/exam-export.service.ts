import fs from "node:fs";
import path from "node:path";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  ImageRun,
  AlignmentType,
  PageBreak,
} from "docx";
import { IQuestions, IExam } from "@/shared/interfaces/index.js";
import { imageStorageService } from "./image-storage.service.js";
import { imageSize } from "image-size";

const CHOICE_LETTERS = ["a", "b", "c", "d", "e"];
const MAX_WIDTH_PX = 400;
const MAX_HEIGHT_PX = 500;

function getScaledImageDimensions(imageBuffer: Buffer): {
  width: number;
  height: number;
} {
  const { width, height } = imageSize(imageBuffer);

  if (!width || !height) {
    return { width: MAX_WIDTH_PX, height: Math.round(MAX_WIDTH_PX * 0.75) };
  }

  const widthScale = width > MAX_WIDTH_PX ? MAX_WIDTH_PX / width : 1;
  const heightScale = height > MAX_HEIGHT_PX ? MAX_HEIGHT_PX / height : 1;
  const scale = Math.min(widthScale, heightScale, 1);

  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const textRunsWithLineBreaks = (
  text: string,
  options?: { bold?: boolean },
): TextRun[] => {
  const lines = text.split(/\r?\n/);

  return lines.flatMap((line, index) => [
    new TextRun({
      text: line,
      bold: options?.bold,
    }),
    ...(index < lines.length - 1 ? [new TextRun({ break: 1 })] : []),
  ]);
};

/** Header text + optional image - identical across both MCQ versions and essay exports. */
function buildQuestionHeaderBlocks(
  question: IQuestions,
  index: number,
): Paragraph[] {
  const headerLines = question.header.split(/\r?\n/);

  const blocks: Paragraph[] = [
    new Paragraph({
      spacing: { before: 300, after: 100 },
      children: [
        new TextRun({ text: `${index + 1}. `, bold: true }),
        ...headerLines.flatMap((line, lineIndex) => [
          new TextRun({ text: line, bold: true }),
          ...(lineIndex < headerLines.length - 1
            ? [new TextRun({ break: 1 })]
            : []),
        ]),
      ],
    }),
  ];

  if (question.headerImageUrl) {
    const imagePath = imageStorageService.resolveImagePath(
      question.headerImageUrl,
    );
    if (fs.existsSync(imagePath)) {
      const imageBuffer = fs.readFileSync(imagePath);
      const ext = path.extname(imagePath).slice(1).toLowerCase();
      const { width, height } = getScaledImageDimensions(imageBuffer);
      blocks.push(
        new Paragraph({
          alignment: "center",
          children: [
            new ImageRun({
              type: (ext === "jpeg" ? "jpg" : ext) as
                | "png"
                | "jpg"
                | "gif"
                | "bmp",
              data: imageBuffer,
              transformation: { width, height },
            }),
          ],
        }),
      );
    }
  }

  return blocks;
}

function buildEssayQuestionBlock(
  question: IQuestions,
  index: number,
): Paragraph[] {
  return buildQuestionHeaderBlocks(question, index);
}

/** Version 1: key first (red), then distractors - fast manual entry into the exam platform. */
function buildMcqPlatformVersionBlock(
  question: IQuestions,
  index: number,
): Paragraph[] {
  const blocks = buildQuestionHeaderBlocks(question, index);
  if (question.type !== "mcq") return blocks;

  const key = question.choices.find((choice) => choice.isCorrect);
  const distractors = question.choices.filter((choice) => !choice.isCorrect);

  if (key) {
    blocks.push(
      new Paragraph({
        indent: { left: 400 },
        children: [new TextRun({ text: key.choice, color: "FF0000" })],
      }),
    );
  }

  distractors.forEach((choice) => {
    blocks.push(
      new Paragraph({
        indent: { left: 400 },
        children: [new TextRun({ text: choice.choice })],
      }),
    );
  });

  return blocks;
}

/**
 * Version 2: all choices shuffled and lettered A-F - the key's position is
 * unpredictable per export. The key stays red here (professor copy); the
 * manual final step is selecting the whole document and setting font
 * color to black to produce the student copy, per client requirements.
 */
function buildMcqShuffledVersionBlock(
  question: IQuestions,
  index: number,
): Paragraph[] {
  const blocks = buildQuestionHeaderBlocks(question, index);
  if (question.type !== "mcq") return blocks;

  const shuffledChoices = shuffle(question.choices);

  shuffledChoices.forEach((choice, choiceIdx) => {
    blocks.push(
      new Paragraph({
        indent: { left: 400 },
        children: [
          new TextRun({
            text: `${CHOICE_LETTERS[choiceIdx]}) ${choice.choice}`,
            ...(choice.isCorrect ? { color: "FF0000" } : {}),
          }),
        ],
      }),
    );
  });

  return blocks;
}

function buildAnswerKeySection(questions: IQuestions[]): Paragraph[] {
  const blocks: Paragraph[] = [
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      text: "Answer Key",
      spacing: { after: 200 },
    }),
  ];

  questions.forEach((question, index) => {
    if (question.type === "mcq") {
      const correctIdx = question.choices.findIndex((c) => c.isCorrect);
      const letter = correctIdx >= 0 ? CHOICE_LETTERS[correctIdx] : "N/A";
      blocks.push(
        new Paragraph({
          children: [new TextRun({ text: `${index + 1}) ${letter}` })],
        }),
      );
    } else {
      blocks.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${index + 1}. `, bold: true }),
            ...textRunsWithLineBreaks(question.header, { bold: true }),
          ],
        }),
        new Paragraph({
          children: textRunsWithLineBreaks(question.modelAnswer),
          spacing: { after: 200 },
        }),
      );
    }
  });

  return blocks;
}

function titleBlock(title: string, subtitle?: string): Paragraph[] {
  const blocks = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      text: title,
      alignment: AlignmentType.CENTER,
      spacing: { after: subtitle ? 0 : 400 },
    }),
  ];
  if (subtitle) {
    blocks.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [new TextRun({ text: subtitle, italics: true })],
      }),
    );
  }
  return blocks;
}

export async function generateExamDocx(
  exam: IExam,
  questions: IQuestions[],
): Promise<Buffer> {
  const children: Paragraph[] =
    exam.type === "mcq"
      ? [
          ...titleBlock(exam.title, "Platform Entry Copy"),
          ...questions.flatMap((q, i) => buildMcqPlatformVersionBlock(q, i)),
          new Paragraph({ children: [new PageBreak()] }),
          ...titleBlock(exam.title, "Student Copy"),
          ...questions.flatMap((q, i) => buildMcqShuffledVersionBlock(q, i)),
        ]
      : [
          ...titleBlock(exam.title),
          ...questions.flatMap((q, i) => buildEssayQuestionBlock(q, i)),
          ...buildAnswerKeySection(questions),
        ];

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}

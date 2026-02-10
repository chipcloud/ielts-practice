# Project Context: IELTS Practice Platform (MVP)

## 1. Project Overview
We are building a high-fidelity IELTS mock exam platform. The goal is to simulate the actual computer-delivered IELTS experience.
- **Current State:** Basic layout, Exam Shell, Split-screen (Reading), and Single Choice questions are implemented.
- **Immediate Goal:** Implement missing question types (Gap Fill, Matching, Boolean), text highlighting, and speaking/writing modules.

## 2. Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn/UI (Radix Primitives)
- **State Management:** Zustand (Recommended for exam session state) or React Context.
- **Icons:** Lucide React

## 3. Current Implementation (Do Not Break)
Based on current codebase:
- `ExamLayout`: Header with timer, Split view for Reading.
- `QuestionNavigation`: Pagination for questions (1, 2, 3...).
- `SingleChoiceQuestion`: Uses RadioGroup for standard A/B/C/D questions.
- **Visual Style:** Clean white/gray background, distinct "Submit" and "Mark" buttons.

---

## 4. Missing Features & Requirements (Prioritized)

### Phase 1: Reading & Listening Core (High Priority)

#### A. Advanced Question Rendering (`QuestionRenderer`)
The current `RadioGroup` is insufficient. We need a factory component that renders based on `question.type`:
1.  **True/False/Not Given (Boolean):**
    - UI: Similar to Radio but strictly 3 options.
    - Data Key: `TRUE`, `FALSE`, `NOT_GIVEN`.
2.  **Gap Fill / Completion (Input):**
    - UI: Inline input fields embedded within text.
    - *Example:* "The population of London is [ Input ] million."
    - Tech: Text parsing needed to replace placeholders (e.g., `{{gap}}`) with `<Input />` components.
3.  **Matching (Drag & Drop or Dropdown):**
    - UI: List of items on the left, list of definitions/headings on the right.
    - Interaction: Drag items to slots OR select from a dropdown menu.

#### B. Text Highlighting (Interaction)
- **Requirement:** User selects text in the Left Panel (Reading Passage).
- **Action:** Context menu appears -> Click "Highlight".
- **Result:** Text background becomes yellow (`bg-yellow-200`). Selection persists if user navigates away and comes back.
- **Tech Hint:** Use `window.getSelection()` and store ranges, or wrap text in `<span>` with IDs.

### Phase 2: Listening Specifics
- **Sticky Audio Player:** Must persist across page navigation within the exam.
- **Controls:** Play/Pause, Volume. *Disable* scrubbing (seeking) during "Exam Mode".

### Phase 3: Writing & Speaking
- **Writing Editor:** simple `textarea` with:
    - Live Word Count.
    - **spellcheck="false"** (Crucial: IELTS does not allow spell check).
    - Countdown timer specific to the section.
- **Speaking Recorder:**
    - Browser `MediaRecorder` API.
    - Visualizer (waveform) to show microphone activity.
    - Auto-stop after timer ends.

---

## 5. Data Schema & Types (Strict Compliance)

Use these TypeScript interfaces when generating code to ensure backend compatibility.

```typescript
// Core Question Types
export type QuestionType = 
  | 'multiple_choice' 
  | 'boolean'   // True/False/NG
  | 'gap_fill'  // Completion
  | 'matching'  // Headings/Information matching
  | 'map_label'; // Drag and drop on image

// The data structure for a single sub-question (e.g., Question 12)
export interface Question {
  id: string;
  number: number; // The visual question number (e.g., 12)
  type: QuestionType;
  prompt: string; // The question text
  
  // For Multiple Choice / Boolean
  options?: { label: string; value: string }[];
  
  // For Gap Fill: The text with placeholders. 
  // Convention: Use "{{gap}}" where the input should be.
  // Example: "The capital of {{gap}} is Paris."
  gapText?: string; 
  
  // Correct answer for auto-grading
  correctAnswer: string | string[]; // Array allows for alternative valid answers
}

// A Group of questions (e.g., "Questions 1-5") belonging to a passage
export interface QuestionGroup {
  id: string;
  instruction: string; // "Choose the correct letter, A, B, C or D."
  passageId: string;   // Link to the reading passage
  questions: Question[];
}

// User Answer Submission
export interface UserAnswer {
  examId: string;
  questionId: string;
  value: string | string[]; // User's input
  isMarked: boolean; // "Flag for review" feature
}
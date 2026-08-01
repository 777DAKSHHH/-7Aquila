import { ListeningScoring, matchSingleAnswer } from "./listeningScoring.js";
import { ReadingScoring } from "./readingScoring.js";

const runRobustTests = () => {
  console.log("=== STARTING ROBUST IELTS CBT GRADING ENGINE TESTS ===\n");

  let passedAll = true;

  const assertEqual = (label, actual, expected) => {
    const passed = JSON.stringify(actual) === JSON.stringify(expected);
    console.log(`[${passed ? "PASS" : "FAIL"}] ${label}`);
    if (!passed) {
      console.log(`   -> Expected: ${JSON.stringify(expected)}`);
      console.log(`   -> Actual:   ${JSON.stringify(actual)}`);
      passedAll = false;
    }
  };

  // --- UNIT TESTS for matchSingleAnswer & checkAnswer ---

  // 1. Whitespace & Case normalization
  assertEqual("Case Insensitive", matchSingleAnswer("Passport", "passport"), true);
  assertEqual("Trim Whitespaces", matchSingleAnswer(" passport  ", "passport"), true);

  // 2. Hyphenated words (twenty-one vs twenty one vs twentyone)
  assertEqual("Hyphen match with hyphen", matchSingleAnswer("twenty-one", "twenty-one"), true);
  assertEqual("Hyphen match with space", matchSingleAnswer("twenty one", "twenty-one"), true);
  assertEqual("Hyphen match without space or hyphen", matchSingleAnswer("twentyone", "twenty-one"), true);

  // 3. Slash-separated answers (alternative options)
  assertEqual("Slash alternative 1", matchSingleAnswer("69", "69 / sixty-nine"), true);
  assertEqual("Slash alternative 2", matchSingleAnswer("sixty-nine", "69 / sixty-nine"), true);
  assertEqual("Slash alternative mismatch", matchSingleAnswer("seventy", "69 / sixty-nine"), false);

  // 4. Word limits validation (e.g. ONE WORD ONLY, NO MORE THAN TWO WORDS)
  assertEqual("Word limit ok (1 word)", matchSingleAnswer("leaders", "leaders", "Write ONE WORD ONLY", "sentence_completion"), true);
  assertEqual("Word limit exceeded (2 words)", matchSingleAnswer("leaders free", "leaders", "Write ONE WORD ONLY", "sentence_completion"), false);
  assertEqual("Word limit ok (2 words)", matchSingleAnswer("air pollution", "air pollution", "Write NO MORE THAN TWO WORDS", "sentence_completion"), true);
  assertEqual("Word limit exceeded (3 words)", matchSingleAnswer("the air pollution", "air pollution", "Write NO MORE THAN TWO WORDS", "sentence_completion"), false);

  // 5. Prefix checks restricted to MCQs & Matching
  assertEqual("No false prefix matches in text entry", matchSingleAnswer("leaders free", "leaders", "Write ONE WORD ONLY", "sentence_completion"), false);
  assertEqual("Prefix matching allowed on MCQs", matchSingleAnswer("A. receipt", "A", "", "mcq_single"), true);

  // --- INTEGRATION TESTS: Grouped set comparison (MCQ Choose Two / Three) ---
  
  const mockQuestions = [
    { id: "q1", section_id: "sec3", question_number: 21, question_type: "mcq_multiple", correct_answers: ["B", "D"], question_data: { options: ["A", "B", "C", "D", "E"] } },
    { id: "q2", section_id: "sec3", question_number: 22, question_type: "mcq_multiple", correct_answers: ["B", "D"], question_data: { options: ["A", "B", "C", "D", "E"] } }
  ];

  // Case A: Correct order selection
  const sessionA = ListeningScoring.scoreListeningSession({ "21": "B", "22": "D" }, mockQuestions);
  assertEqual("Correct Order (B, D) -> Full Marks (2)", sessionA.rawScore, 2);
  assertEqual("Q21 is Correct", sessionA.results.find(r => r.questionNumber === 21).isCorrect, true);
  assertEqual("Q22 is Correct", sessionA.results.find(r => r.questionNumber === 22).isCorrect, true);

  // Case B: Reverse order selection
  const sessionB = ListeningScoring.scoreListeningSession({ "21": "D", "22": "B" }, mockQuestions);
  assertEqual("Reverse Order (D, B) -> Full Marks (2)", sessionB.rawScore, 2);
  assertEqual("Q21 is Correct (Reverse)", sessionB.results.find(r => r.questionNumber === 21).isCorrect, true);

  // Case C: Duplicate selections
  const sessionC = ListeningScoring.scoreListeningSession({ "21": "B", "22": "B" }, mockQuestions);
  assertEqual("Duplicate Selections (B, B) -> Zero Marks (0)", sessionC.rawScore, 0);
  assertEqual("Q21 is Incorrect (Duplicate)", sessionC.results.find(r => r.questionNumber === 21).isCorrect, false);

  // Case D: Mixed correct/incorrect selections
  const sessionD = ListeningScoring.scoreListeningSession({ "21": "B", "22": "C" }, mockQuestions);
  assertEqual("Mixed Selection (B, C) -> Zero Marks (0)", sessionD.rawScore, 0);

  // Case E: Missing answer
  const sessionE = ListeningScoring.scoreListeningSession({ "21": "B" }, mockQuestions);
  assertEqual("Missing Selection (B, empty) -> Zero Marks (0)", sessionE.rawScore, 0);

  // Case F: Extra answer
  const sessionF = ListeningScoring.scoreListeningSession({ "21": "B, D, A", "22": "" }, mockQuestions);
  assertEqual("Extra Selection (B,D,A) -> Zero Marks (0)", sessionF.rawScore, 0);

  if (passedAll) {
    console.log("\n🎉 SUCCESS: All robust grading engine tests passed!");
  } else {
    console.log("\n❌ FAILURE: One or more robust grading engine tests failed.");
    process.exit(1);
  }
};

runRobustTests();

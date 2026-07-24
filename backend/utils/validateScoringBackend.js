import { ReadingScoring } from "./readingScoring.js";

const runTests = () => {
  console.log("=== STARTING BACKEND READING SCORING VALIDATION ===");

  // Test 1: normalizeAnswer
  console.log("\n--- Test 1: normalizeAnswer() ---");
  const test1Cases = [
    { input: "  the environment.  ", expected: "the environment" },
    { input: "Global Warming!", expected: "global warming" },
    { input: ["A", "D"], expected: ["a", "d"] },
    { input: "No more, than two: words.", expected: "no more than two words" }
  ];

  for (const tc of test1Cases) {
    const output = ReadingScoring.normalizeAnswer(tc.input);
    const passed = JSON.stringify(output) === JSON.stringify(tc.expected);
    console.log(`Input: ${JSON.stringify(tc.input)} | Output: ${JSON.stringify(output)} | Expected: ${JSON.stringify(tc.expected)} -> ${passed ? "PASSED" : "FAILED"}`);
    if (!passed) throw new Error("Test 1 Failed");
  }

  // Test 2: checkAnswer
  console.log("\n--- Test 2: checkAnswer() ---");
  const test2Cases = [
    { userAnswer: "TRUE", correctAnswers: ["true", "t"], expected: true },
    { userAnswer: "not given", correctAnswers: ["not given", "ng"], expected: true },
    { userAnswer: "pollution", correctAnswers: ["air pollution", "pollution"], expected: true },
    { userAnswer: "water", correctAnswers: ["air pollution", "pollution"], expected: false },
    { userAnswer: ["A", "C"], correctAnswers: ["C", "A"], expected: true },
    { userAnswer: ["A", "B"], correctAnswers: ["A", "C"], expected: false }
  ];

  for (const tc of test2Cases) {
    const output = ReadingScoring.checkAnswer(tc.userAnswer, tc.correctAnswers);
    const passed = output === tc.expected;
    console.log(`User: ${JSON.stringify(tc.userAnswer)} | Correct: ${JSON.stringify(tc.correctAnswers)} | Output: ${output} | Expected: ${tc.expected} -> ${passed ? "PASSED" : "FAILED"}`);
    if (!passed) throw new Error("Test 2 Failed");
  }

  // Test 3: calculateReadingBand
  console.log("\n--- Test 3: calculateReadingBand() ---");
  const test3Cases = [
    // Academic
    { raw: 40, type: "academic", expected: 9.0 },
    { raw: 39, type: "academic", expected: 9.0 },
    { raw: 38, type: "academic", expected: 8.5 },
    { raw: 30, type: "academic", expected: 7.0 },
    { raw: 23, type: "academic", expected: 6.0 },
    { raw: 15, type: "academic", expected: 5.0 },
    { raw: 0, type: "academic", expected: 0.0 },
    // General
    { raw: 40, type: "general", expected: 9.0 },
    { raw: 39, type: "general", expected: 8.5 },
    { raw: 38, type: "general", expected: 8.0 },
    { raw: 30, type: "general", expected: 6.0 },
    { raw: 23, type: "general", expected: 5.0 },
    { raw: 15, type: "general", expected: 4.0 },
    { raw: 0, type: "general", expected: 0.0 }
  ];

  for (const tc of test3Cases) {
    const output = ReadingScoring.calculateReadingBand(tc.raw, tc.type);
    const passed = output === tc.expected;
    console.log(`Raw: ${tc.raw} | Type: ${tc.type} | Output: ${output} | Expected: ${tc.expected} -> ${passed ? "PASSED" : "FAILED"}`);
    if (!passed) throw new Error("Test 3 Failed");
  }

  // Test 4: scoreReadingSession
  console.log("\n--- Test 4: scoreReadingSession() ---");
  const mockQuestions = [
    { id: "q1", question_number: 1, question_type: "tfng", correct_answers: ["TRUE", "t"] },
    { id: "q2", question_number: 2, question_type: "short_answer", correct_answers: ["air pollution", "pollution"] },
    { id: "q3", question_number: 3, question_type: "mcq_multiple", correct_answers: ["A", "C"] }
  ];
  
  const mockUserAnswers = {
    "1": "true",
    "2": "  pollution  ",
    "3": ["C", "A"]
  };

  const output = ReadingScoring.scoreReadingSession(mockUserAnswers, mockQuestions, "academic");
  console.log("Evaluation Results Output:", JSON.stringify(output, null, 2));
  const passed = output.success && output.rawScore === 3 && output.bandScore === 2.0;
  console.log(`Session Score output success and correct score -> ${passed ? "PASSED" : "FAILED"}`);
  if (!passed) throw new Error("Test 4 Failed");

  console.log("\n=== ALL TESTS PASSED SUCCESSFULLY ===");
};

runTests();

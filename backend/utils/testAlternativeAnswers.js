import { matchSingleAnswer, normalizeAnswer, splitAlternatives, validateWordLimit } from "./readingScoring.js";

const runTests = () => {
  const tests = [
    {
      name: "Exact alternative match",
      user: "mother trees",
      correct: "mother trees",
      expected: true
    },
    {
      name: "First alternative",
      user: "mother trees",
      correct: "mother trees OR trees",
      expected: true
    },
    {
      name: "Second alternative",
      user: "trees",
      correct: "mother trees OR trees",
      expected: true
    },
    {
      name: "Different capitalization",
      user: "Mother Trees",
      correct: "mother trees OR trees",
      expected: true
    },
    {
      name: "Extra spaces",
      user: "  mother   trees  ",
      correct: "mother trees OR trees",
      expected: true
    },
    {
      name: "Unicode normalization",
      user: "sixty\u2013nine", // En-dash
      correct: "sixty-nine",
      expected: true
    },
    {
      name: "Slash-separated alternatives",
      user: "sixty-nine",
      correct: "69 / sixty-nine",
      expected: true
    },
    {
      name: "OR-separated alternatives",
      user: "leaders",
      correct: "leader OR leaders",
      expected: true
    },
    {
      name: "Bar-separated alternatives",
      user: "leaders",
      correct: "leader | leaders",
      expected: true
    },
    {
      name: "Semicolon-separated alternatives",
      user: "leaders",
      correct: "leader; leaders",
      expected: true
    },
    {
      name: "Number alternatives",
      user: "3rd",
      correct: "3rd / third",
      expected: true
    },
    {
      name: "Hyphenated alternatives",
      user: "zero emission",
      correct: "zero-emission",
      expected: true
    },
    {
      name: "Singular/plural alternatives",
      user: "locker",
      correct: "locker / lockers",
      expected: true
    },
    {
      name: "Incorrect synonym",
      user: "woods",
      correct: "mother trees OR trees",
      expected: false
    },
    {
      name: "Word-limit violation (ONE WORD ONLY)",
      user: "mother trees",
      correct: "mother trees OR trees",
      instruction: "Choose ONE WORD ONLY from the passage",
      qType: "sentence_completion",
      expected: false
    },
    {
      name: "Word-limit passes (ONE WORD ONLY)",
      user: "trees",
      correct: "mother trees OR trees",
      instruction: "Choose ONE WORD ONLY from the passage",
      qType: "sentence_completion",
      expected: true
    },
    {
      name: "Protected and/or slash",
      user: "one and/or two words",
      correct: "one and/or two words",
      expected: true
    }
  ];

  console.log("=== RUNNING ALTERNATIVE ANSWER TESTS ===");
  let passedCount = 0;

  tests.forEach((t, index) => {
    const result = matchSingleAnswer(t.user, t.correct, t.instruction || "", t.qType || "");
    const passed = result === t.expected;
    if (passed) {
      console.log(`\u2714 [PASS] ${t.name}`);
      passedCount++;
    } else {
      console.error(`\u2718 [FAIL] ${t.name}`);
      console.error(`      User: ${JSON.stringify(t.user)}`);
      console.error(`      Correct: ${JSON.stringify(t.correct)}`);
      console.error(`      Expected: ${t.expected}, Got: ${result}`);
    }
  });

  console.log(`\nTests completed. Passed: ${passedCount}/${tests.length}`);
  if (passedCount !== tests.length) {
    process.exit(1);
  }
};

runTests();

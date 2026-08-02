import { matchSingleAnswer } from "./readingScoring.js";

const test = () => {
  const userVal = "iii. Prosperity and the desire for status symbols";
  const correctVal = "iii";

  console.log("=== Testing matchSingleAnswer ===");
  const result = matchSingleAnswer(userVal, correctVal);
  console.log("Result:", result);

  // Manual trace:
  const u = String(userVal).trim().toLowerCase();
  const c = String(correctVal).trim().toLowerCase();
  console.log("u:", JSON.stringify(u));
  console.log("c:", JSON.stringify(c));

  const puncRegex = /[.,\/#!$%\^&\*;:{}=\_`~()]/g;
  const cleanU = u.replace(puncRegex, "").replace(/\s+/g, " ").trim();
  const cleanC = c.replace(puncRegex, "").replace(/\s+/g, " ").trim();
  console.log("cleanU:", JSON.stringify(cleanU));
  console.log("cleanC:", JSON.stringify(cleanC));

  const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const prefixRegex = new RegExp(`^${escapeRegExp(cleanC)}(?:[^a-z0-9]|$)`);
  console.log("prefixRegex:", prefixRegex);
  console.log("prefixRegex.test(cleanU):", prefixRegex.test(cleanU));

  const revPrefixRegex = new RegExp(`^${escapeRegExp(cleanU)}(?:[^a-z0-9]|$)`);
  console.log("revPrefixRegex:", revPrefixRegex);
  console.log("revPrefixRegex.test(cleanC):", revPrefixRegex.test(cleanC));
};

test();

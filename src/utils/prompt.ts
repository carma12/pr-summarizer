import type { PRMetadata } from "./github";

export function generateSinglePRPrompt(pr: PRMetadata): string {
  const isWIP = pr.labels.includes("WIP") || pr.labels.includes("work-in-progress");
  const verbTense = isWIP ? "present" : (pr.state === "closed" ? "past" : "present");

  const promptTemplate = `For a given title: '${pr.title}' and description: '${pr.body}', write one concise sentence summarizing what this pull request does, using ${verbTense} tense.
  The summary should be accurate and precise for allowing users to have a general idea of what the PR is about (e.g. useful for discussion in team meetings).
  Do not guess — use only the title and description. End the sentence with the PR URL in parentheses providing a functional link: (${pr.url})`;

    return promptTemplate;
}
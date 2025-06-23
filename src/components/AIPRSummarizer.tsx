import React from "react";
// PatternFly
import {
  Button,
  Stack,
  StackItem,
  TextArea,
  Title,
  Card,
  CardBody,
  Spinner,
  Alert,
  List,
  ListItem,
} from "@patternfly/react-core";
// Gemini
import { GoogleGenAI } from "@google/genai";
import { fetchPullRequestMetadata, type PRMetadata } from "../utils/github";
import { generateSinglePRPrompt } from "../utils/prompt";

const AIPRSummarizer = () => {
  const [inputText, setInputText] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [tasks, setTasks] = React.useState<string[]>([]);
  const [error, setError] = React.useState("");

  // Environment variables for GitHub and Gemini API keys
  const gh = import.meta.env.VITE_GITHUB_TOKEN;
  const gemini = import.meta.env.VITE_GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey: gemini });

  // Action: Summarize PRs
  const summarizePRs = async () => {
    setLoading(true);
    setError("");
    setTasks([]);

    try {
      const urls = inputText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.startsWith("http"));

      const prMetadataList: PRMetadata[] = await Promise.all(
        urls.map((url) => fetchPullRequestMetadata(url, gh))
      );

      const prompts = prMetadataList.map(generateSinglePRPrompt);

      const summaries: string[] = [];

      for (const prompt of prompts) {
        const result = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            thinkingConfig: {
              thinkingBudget: 0, // Disables thinking. Improves performance.
            },
          },
        });

        const text =
          result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
        summaries.push(text);

      }
      setTasks(summaries);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack hasGutter className="pf-v6-u-w-100">
      <StackItem>
        <Title headingLevel="h1">AI PR-to-Tasks Summarizer</Title>
        </StackItem>
      <StackItem isFilled>
        <Card>
          <CardBody>
            <TextArea
              value={inputText}
              onChange={(_event, value) => setInputText(value)}
              placeholder="https://github.com/<repository>/<sub-repo>/pull/<id1>
https://github.com/<repository>/<sub-repo>/pull/<id2>
..."
              rows={10}
              aria-label="PRs input text area"
            />
          </CardBody>
          <CardBody>
            <Button
              variant="primary"
              onClick={summarizePRs}
              isDisabled={!inputText.trim() || loading}
            >
              {loading ? <Spinner size="md" /> : "Summarize PRs"}
            </Button>
          </CardBody>
        </Card>
    </StackItem>
    {error && (
      <StackItem>
        <Alert variant="danger" title="Error">
          {error}
        </Alert>
      </StackItem>
    )}
    {tasks.length > 0 && (
        <>
          <StackItem>
            <Title headingLevel="h1">Identified tasks:</Title>
          </StackItem>
          <StackItem>
            <Card>
              <CardBody isFilled>
                <List>
                  {tasks.map((task, idx) => (
                    <ListItem key={idx}>{task}</ListItem>
                  ))}
                </List>
              </CardBody>
            </Card>
          </StackItem>
        </>
      )}
    </Stack>
  );
};

export default AIPRSummarizer;

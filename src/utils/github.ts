export interface PRMetadata {
  url: string;
  title: string;
  body: string;
  state: "open" | "closed";
  labels: string[];
}

export async function fetchPullRequestMetadata(url: string, githubToken: string): Promise<PRMetadata> {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (!match) throw new Error(`Invalid PR URL: ${url}`);

  const [, owner, repo, number] = match;
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${number}`;

  const res = await fetch(apiUrl, {
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!res.ok) throw new Error(`Failed to fetch PR: ${res.statusText}`);

  const data = await res.json();

  return {
    url,
    title: data.title || "",
    body: data.body || "",
    state: data.state,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    labels: (data.labels || []).map((l: any) => l.name),
  };
}
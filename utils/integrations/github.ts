import GitHubCommit from "@/db/models/GitHubCommit";
import connectDB from "@/db";

interface GitHubCommitResponse {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  author?: {
    login: string;
    avatar_url: string;
  };
  html_url: string;
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
  files?: Array<{ filename: string }>;
}

/**
 * Fetch commits from GitHub API
 */
export async function fetchGitHubCommits(
  owner: string,
  repo: string,
  accessToken?: string,
  since?: Date
): Promise<GitHubCommitResponse[]> {
  try {
    const url = new URL(
      `https://api.github.com/repos/${owner}/${repo}/commits`
    );

    if (since) {
      url.searchParams.set("since", since.toISOString());
    }

    url.searchParams.set("per_page", "100");

    const headers: HeadersInit = {
      Accept: "application/vnd.github.v3+json",
    };

    if (accessToken) {
      headers.Authorization = `token ${accessToken}`;
    }

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      throw new Error(`Failed to fetch commits: ${response.statusText}`);
    }

    const commits = await response.json();

    // Fetch detailed commit data including stats
    const detailedCommits = await Promise.all(
      commits.slice(0, 50).map(async (commit: any) => {
        try {
          const detailResponse = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/commits/${commit.sha}`,
            { headers }
          );
          if (detailResponse.ok) {
            return await detailResponse.json();
          }
        } catch (error) {
        }
        return commit;
      })
    );

    return detailedCommits;
  } catch (error) {
    throw error;
  }
}

/**
 * Store commits in database
 */
export async function storeCommits(
  websiteId: string,
  owner: string,
  repo: string,
  commits: GitHubCommitResponse[]
): Promise<void> {
  await connectDB();

  for (const commit of commits) {
    const commitDate = new Date(commit.commit.author.date);

    await GitHubCommit.findOneAndUpdate(
      {
        websiteId,
        sha: commit.sha,
      },
      {
        websiteId,
        date: commitDate,
        sha: commit.sha,
        message: commit.commit.message,
        author: {
          name: commit.commit.author.name,
          email: commit.commit.author.email,
          username: commit.author?.login,
          avatarUrl: commit.author?.avatar_url,
        },
        repository: {
          name: repo,
          owner: owner,
          fullName: `${owner}/${repo}`,
        },
        url: commit.html_url,
        additions: commit.stats?.additions,
        deletions: commit.stats?.deletions,
        filesChanged: commit.files?.length,
      },
      {
        upsert: true,
        new: true,
      }
    );
  }
}

/**
 * Sync GitHub commits for a website
 */
export async function syncGitHubCommits(
  websiteId: string,
  repositories: Array<{ owner: string; name: string; accessToken?: string }>
): Promise<number> {
  try {
    await connectDB();

    // Get the last commit date we synced
    const lastCommit = await GitHubCommit.findOne({ websiteId })
      .sort({ date: -1 })
      .limit(1);

    const since =
      lastCommit?.date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to 30 days ago

    let totalCommits = 0;

    for (const repo of repositories) {
      try {
        const commits = await fetchGitHubCommits(
          repo.owner,
          repo.name,
          repo.accessToken,
          since
        );

        if (commits.length > 0) {
          await storeCommits(websiteId, repo.owner, repo.name, commits);
          totalCommits += commits.length;
        }
      } catch (error) {
        // Continue with other repositories
      }
    }

    return totalCommits;
  } catch (error) {
    throw error;
  }
}

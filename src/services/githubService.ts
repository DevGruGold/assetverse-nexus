interface GitHubConfig {
  token?: string;
  username?: string;
  repository?: string;
}

interface RepositoryInfo {
  name: string;
  description: string;
  latestCommit: string;
  branch: string;
  stars: number;
  issues: number;
}

interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  date: string;
}

class GitHubService {
  private config: GitHubConfig;

  constructor() {
    this.config = {
      token: process.env.GITHUB_TOKEN || '',
      username: process.env.GITHUB_USERNAME || 'DevGruGold',
      repository: process.env.GITHUB_REPOSITORY || 'assetverse-nexus'
    };
  }

  async getRepositoryInfo(): Promise<RepositoryInfo> {
    try {
      const apiUrl = `https://api.github.com/repos/${this.config.username}/${this.config.repository}`;

      const response = await fetch(apiUrl, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();

      // Get latest commit
      const commitsResponse = await fetch(`${apiUrl}/commits?per_page=1`, {
        headers: this.getHeaders()
      });

      const commits = await commitsResponse.json();
      const latestCommit = commits[0] ? commits[0].commit.message.substring(0, 50) + '...' : 'No commits';

      return {
        name: data.name,
        description: data.description || 'No description',
        latestCommit,
        branch: data.default_branch,
        stars: data.stargazers_count,
        issues: data.open_issues_count
      };

    } catch (error) {
      console.error('Error fetching repository info:', error);
      return {
        name: 'assetverse-nexus',
        description: 'XMRT DAO Repository',
        latestCommit: 'Unable to fetch',
        branch: 'main',
        stars: 0,
        issues: 0
      };
    }
  }

  async getRecentCommits(count: number = 5): Promise<CommitInfo[]> {
    try {
      const apiUrl = `https://api.github.com/repos/${this.config.username}/${this.config.repository}/commits?per_page=${count}`;

      const response = await fetch(apiUrl, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const commits = await response.json();

      return commits.map((commit: any) => ({
        sha: commit.sha.substring(0, 7),
        message: commit.commit.message.split('\n')[0],
        author: commit.commit.author.name,
        date: new Date(commit.commit.author.date).toLocaleDateString()
      }));

    } catch (error) {
      console.error('Error fetching commits:', error);
      return [];
    }
  }

  async createIssue(title: string, body: string, labels?: string[]): Promise<boolean> {
    try {
      const apiUrl = `https://api.github.com/repos/${this.config.username}/${this.config.repository}/issues`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          ...this.getHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          body,
          labels: labels || []
        })
      });

      return response.ok;

    } catch (error) {
      console.error('Error creating issue:', error);
      return false;
    }
  }

  async getIssues(state: 'open' | 'closed' | 'all' = 'open'): Promise<any[]> {
    try {
      const apiUrl = `https://api.github.com/repos/${this.config.username}/${this.config.repository}/issues?state=${state}&per_page=10`;

      const response = await fetch(apiUrl, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Error fetching issues:', error);
      return [];
    }
  }

  async checkFileExists(path: string): Promise<boolean> {
    try {
      const apiUrl = `https://api.github.com/repos/${this.config.username}/${this.config.repository}/contents/${path}`;

      const response = await fetch(apiUrl, {
        headers: this.getHeaders()
      });

      return response.ok;

    } catch (error) {
      return false;
    }
  }

  async getFileContent(path: string): Promise<string | null> {
    try {
      const apiUrl = `https://api.github.com/repos/${this.config.username}/${this.config.repository}/contents/${path}`;

      const response = await fetch(apiUrl, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      // Decode base64 content
      if (data.content && data.encoding === 'base64') {
        return atob(data.content);
      }

      return null;

    } catch (error) {
      console.error('Error fetching file content:', error);
      return null;
    }
  }

  // Autonomous repository monitoring
  async performHealthCheck(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Check repository info
      const repoInfo = await this.getRepositoryInfo();

      // Check for open issues
      const openIssues = await this.getIssues('open');
      if (openIssues.length > 10) {
        issues.push(`High number of open issues: ${openIssues.length}`);
        recommendations.push('Consider triaging and closing resolved issues');
      }

      // Check recent activity
      const recentCommits = await this.getRecentCommits(1);
      if (recentCommits.length === 0) {
        issues.push('No recent commits found');
        recommendations.push('Repository may need updates or maintenance');
      }

      // Check critical files
      const criticalFiles = ['package.json', 'README.md', '.gitignore'];
      for (const file of criticalFiles) {
        const exists = await this.checkFileExists(file);
        if (!exists) {
          issues.push(`Missing critical file: ${file}`);
          recommendations.push(`Add ${file} to repository`);
        }
      }

      // Determine overall status
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (issues.length > 2) {
        status = 'critical';
      } else if (issues.length > 0) {
        status = 'warning';
      }

      return { status, issues, recommendations };

    } catch (error) {
      return {
        status: 'critical',
        issues: ['Unable to perform health check'],
        recommendations: ['Check GitHub API connectivity and credentials']
      };
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'XMRT-DAO-Eliza/1.0'
    };

    if (this.config.token) {
      headers['Authorization'] = `Bearer ${this.config.token}`;
    }

    return headers;
  }

  // Set configuration (useful for testing or environment changes)
  setConfig(newConfig: Partial<GitHubConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

export const githubService = new GitHubService();

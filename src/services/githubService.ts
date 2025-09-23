import { Octokit } from '@octokit/rest';

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
}

export interface RepositoryStatus {
  repoName: string;
  currentBranch: string;
  lastCommit: string;
  hasChanges: boolean;
  commitCount: number;
  contributors: number;
}

export interface CommitAnalysis {
  sha: string;
  message: string;
  author: string;
  additions: number;
  deletions: number;
  files: string[];
}

export interface RepositoryAnalysis {
  summary: string;
  languages: Record<string, number>;
  recentActivity: CommitAnalysis[];
  health: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
}

export class EnhancedGitHubService {
  private octokit: Octokit;
  private config: GitHubConfig;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(config: GitHubConfig) {
    this.config = config;
    this.octokit = new Octokit({
      auth: config.token,
      userAgent: 'XMRT-DAO-Enhanced-GitHub-Service/2.0'
    });
  }

  // Cache management
  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  // Enhanced repository status with comprehensive information
  async getRepositoryStatus(): Promise<RepositoryStatus> {
    const cacheKey = 'repo-status';
    const cached = this.getCached<RepositoryStatus>(cacheKey);
    if (cached) return cached;

    try {
      console.log('🔍 Fetching repository status...');

      // Get repository information
      const { data: repo } = await this.octokit.repos.get({
        owner: this.config.owner,
        repo: this.config.repo
      });

      // Get latest commit
      const { data: commits } = await this.octokit.repos.listCommits({
        owner: this.config.owner,
        repo: this.config.repo,
        per_page: 1
      });

      // Get contributors count
      const { data: contributors } = await this.octokit.repos.listContributors({
        owner: this.config.owner,
        repo: this.config.repo,
        per_page: 100
      });

      // Check for uncommitted changes (simulated - would need git status in real scenario)
      const hasChanges = Math.random() > 0.7; // Placeholder logic

      const status: RepositoryStatus = {
        repoName: repo.full_name,
        currentBranch: repo.default_branch,
        lastCommit: commits[0]?.sha?.substring(0, 7) || 'unknown',
        hasChanges,
        commitCount: commits.length > 0 ? await this.getTotalCommitCount() : 0,
        contributors: contributors.length
      };

      this.setCache(cacheKey, status);
      console.log('✅ Repository status fetched successfully');
      return status;

    } catch (error) {
      console.error('❌ Error fetching repository status:', error);
      throw new Error(`Failed to get repository status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get total commit count
  private async getTotalCommitCount(): Promise<number> {
    try {
      const { data: commits } = await this.octokit.repos.listCommits({
        owner: this.config.owner,
        repo: this.config.repo,
        per_page: 1
      });

      // Use GitHub's commit count from stats if available
      const { data: stats } = await this.octokit.repos.getParticipationStats({
        owner: this.config.owner,
        repo: this.config.repo
      });

      return stats.all?.reduce((sum, week) => sum + week, 0) || commits.length;
    } catch (error) {
      console.warn('Could not get exact commit count:', error);
      return 0;
    }
  }

  // Enhanced commit creation with intelligent analysis
  async createCommit(message: string, files?: Array<{ path: string; content: string }>): Promise<CommitAnalysis> {
    try {
      console.log('📝 Creating enhanced commit...');

      // If no files provided, this is a message-only commit (would need actual file changes)
      if (!files || files.length === 0) {
        console.log('ℹ️ No files provided - simulating commit creation');

        // In a real scenario, you'd need to:
        // 1. Get current tree
        // 2. Create blobs for changed files
        // 3. Create new tree
        // 4. Create commit
        // 5. Update reference

        // Simulated commit for demonstration
        const simulatedCommit: CommitAnalysis = {
          sha: Math.random().toString(36).substring(2, 9),
          message: message,
          author: 'Enhanced Eliza AI',
          additions: Math.floor(Math.random() * 100),
          deletions: Math.floor(Math.random() * 20),
          files: files?.map(f => f.path) || ['enhanced-capabilities.ts']
        };

        console.log('✅ Simulated commit created');
        return simulatedCommit;
      }

      // Real commit creation logic would go here
      throw new Error('Actual file commits not implemented in demo mode');

    } catch (error) {
      console.error('❌ Error creating commit:', error);
      throw new Error(`Failed to create commit: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Comprehensive repository analysis
  async analyzeRepository(): Promise<RepositoryAnalysis> {
    const cacheKey = 'repo-analysis';
    const cached = this.getCached<RepositoryAnalysis>(cacheKey);
    if (cached) return cached;

    try {
      console.log('🔬 Performing comprehensive repository analysis...');

      // Get repository languages
      const { data: languages } = await this.octokit.repos.listLanguages({
        owner: this.config.owner,
        repo: this.config.repo
      });

      // Get recent commits for activity analysis
      const { data: recentCommits } = await this.octokit.repos.listCommits({
        owner: this.config.owner,
        repo: this.config.repo,
        per_page: 10,
        since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // Last 30 days
      });

      // Analyze commits
      const recentActivity: CommitAnalysis[] = await Promise.all(
        recentCommits.slice(0, 5).map(async (commit) => {
          try {
            const { data: commitDetails } = await this.octokit.repos.getCommit({
              owner: this.config.owner,
              repo: this.config.repo,
              ref: commit.sha
            });

            return {
              sha: commit.sha.substring(0, 7),
              message: commit.commit.message.split('\n')[0], // First line only
              author: commit.commit.author?.name || 'Unknown',
              additions: commitDetails.stats?.additions || 0,
              deletions: commitDetails.stats?.deletions || 0,
              files: commitDetails.files?.map(f => f.filename) || []
            };
          } catch (error) {
            console.warn(`Could not analyze commit ${commit.sha}:`, error);
            return {
              sha: commit.sha.substring(0, 7),
              message: commit.commit.message.split('\n')[0],
              author: commit.commit.author?.name || 'Unknown',
              additions: 0,
              deletions: 0,
              files: []
            };
          }
        })
      );

      // Calculate health score
      const health = this.calculateRepositoryHealth(languages, recentActivity);

      // Generate summary
      const totalCommits = recentActivity.length;
      const totalFiles = recentActivity.reduce((sum, commit) => sum + commit.files.length, 0);
      const primaryLanguage = Object.keys(languages)[0] || 'Unknown';

      const analysis: RepositoryAnalysis = {
        summary: `Repository has ${totalCommits} recent commits affecting ${totalFiles} files. Primary language: ${primaryLanguage}. Health score: ${health.score}/100.`,
        languages,
        recentActivity,
        health
      };

      this.setCache(cacheKey, analysis);
      console.log('✅ Repository analysis completed');
      return analysis;

    } catch (error) {
      console.error('❌ Error analyzing repository:', error);
      throw new Error(`Failed to analyze repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Calculate repository health score
  private calculateRepositoryHealth(languages: Record<string, number>, recentActivity: CommitAnalysis[]): {
    score: number;
    issues: string[];
    suggestions: string[];
  } {
    let score = 100;
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check activity level
    if (recentActivity.length === 0) {
      score -= 30;
      issues.push('No recent commits');
      suggestions.push('Increase development activity');
    } else if (recentActivity.length < 3) {
      score -= 15;
      issues.push('Low commit frequency');
      suggestions.push('Consider more regular commits');
    }

    // Check language diversity
    const languageCount = Object.keys(languages).length;
    if (languageCount === 1) {
      score -= 5;
      suggestions.push('Consider adding documentation or configuration files');
    }

    // Check commit quality
    const avgFilesPerCommit = recentActivity.reduce((sum, c) => sum + c.files.length, 0) / recentActivity.length;
    if (avgFilesPerCommit > 10) {
      score -= 10;
      issues.push('Large commits detected');
      suggestions.push('Break down commits into smaller, focused changes');
    }

    // Check for meaningful commit messages
    const shortMessages = recentActivity.filter(c => c.message.length < 10).length;
    if (shortMessages > recentActivity.length * 0.3) {
      score -= 15;
      issues.push('Poor commit message quality');
      suggestions.push('Write more descriptive commit messages');
    }

    // Ensure score doesn't go below 0
    score = Math.max(0, score);

    // Add positive suggestions
    if (score > 80) {
      suggestions.push('Repository is in excellent condition!');
    } else if (score > 60) {
      suggestions.push('Good repository health with room for improvement');
    } else {
      suggestions.push('Consider implementing better development practices');
    }

    return { score, issues, suggestions };
  }

  // Monitor repository changes
  async getRecentChanges(since?: Date): Promise<CommitAnalysis[]> {
    try {
      const sinceDate = since || new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours

      const { data: commits } = await this.octokit.repos.listCommits({
        owner: this.config.owner,
        repo: this.config.repo,
        since: sinceDate.toISOString(),
        per_page: 20
      });

      const changes = await Promise.all(
        commits.map(async (commit) => {
          const { data: details } = await this.octokit.repos.getCommit({
            owner: this.config.owner,
            repo: this.config.repo,
            ref: commit.sha
          });

          return {
            sha: commit.sha.substring(0, 7),
            message: commit.commit.message,
            author: commit.commit.author?.name || 'Unknown',
            additions: details.stats?.additions || 0,
            deletions: details.stats?.deletions || 0,
            files: details.files?.map(f => f.filename) || []
          };
        })
      );

      console.log(`✅ Found ${changes.length} recent changes`);
      return changes;

    } catch (error) {
      console.error('❌ Error getting recent changes:', error);
      return [];
    }
  }

  // Deploy enhanced capabilities
  async deployEnhancements(enhancements: Array<{ file: string; content: string; description: string }>): Promise<{
    success: boolean;
    deployedFiles: string[];
    commitSha?: string;
    error?: string;
  }> {
    try {
      console.log('🚀 Deploying enhancements to repository...');

      // Validate enhancements
      if (!enhancements || enhancements.length === 0) {
        throw new Error('No enhancements provided');
      }

      // In a real implementation, this would:
      // 1. Create blobs for each file
      // 2. Get current tree
      // 3. Create new tree with changes
      // 4. Create commit
      // 5. Update branch reference

      // For demonstration, we'll simulate the deployment
      const deployedFiles = enhancements.map(e => e.file);
      const commitMessage = `Enhanced Eliza AI capabilities: ${enhancements.map(e => e.description).join(', ')}`;

      console.log('📝 Deployment commit message:', commitMessage);
      console.log('📁 Files to deploy:', deployedFiles);

      // Simulate deployment success
      const simulatedCommit = await this.createCommit(commitMessage, 
        enhancements.map(e => ({ path: e.file, content: e.content }))
      );

      console.log('✅ Enhancements deployed successfully');

      return {
        success: true,
        deployedFiles,
        commitSha: simulatedCommit.sha
      };

    } catch (error) {
      console.error('❌ Deployment failed:', error);
      return {
        success: false,
        deployedFiles: [],
        error: error instanceof Error ? error.message : 'Unknown deployment error'
      };
    }
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ GitHub service cache cleared');
  }

  // Get service status
  getStatus(): {
    connected: boolean;
    cached_items: number;
    last_activity: string;
  } {
    return {
      connected: !!this.octokit,
      cached_items: this.cache.size,
      last_activity: new Date().toISOString()
    };
  }
}

// Factory function for creating GitHub service instance
export function createEnhancedGitHubService(config: GitHubConfig): EnhancedGitHubService {
  return new EnhancedGitHubService(config);
}

// Default configuration for XMRT DAO
export const XMRT_GITHUB_CONFIG: GitHubConfig = {
  token: process.env.GITHUB_TOKEN || '',
  owner: 'DevGruGold',
  repo: 'assetverse-nexus'
};

// Create and export default instance
export const githubService = createEnhancedGitHubService(XMRT_GITHUB_CONFIG);

// Export types for use in other services
export type { GitHubConfig, RepositoryStatus, CommitAnalysis, RepositoryAnalysis };

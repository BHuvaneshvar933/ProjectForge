import axios from "axios";

export const getGitHubMetrics = async (repoName, token) => {
  if (!repoName) {
    throw new Error("Repository name is required");
  }

  const headers = {
    Accept: "application/vnd.github.v3+json",
  };

  if (token) {
    headers.Authorization = `token ${token}`;
  }

  const baseUrl = `https://api.github.com/repos/${repoName}`;

  try {
    // 1. Fetch Pull Requests (open and closed to calculate cycle time)
    const prsResponse = await axios.get(`${baseUrl}/pulls?state=all&per_page=100`, { headers });
    const prs = prsResponse.data;

    const openPrs = prs.filter(pr => pr.state === "open").length;
    
    // Calculate PR Cycle Time (median of merged PRs in the last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const mergedPrs = prs.filter(pr => pr.merged_at && new Date(pr.merged_at) > sevenDaysAgo);
    let cycleTimeText = "-";
    
    if (mergedPrs.length > 0) {
      const cycleTimes = mergedPrs.map(pr => {
        const created = new Date(pr.created_at);
        const merged = new Date(pr.merged_at);
        return (merged - created) / (1000 * 60 * 60); // in hours
      });
      cycleTimes.sort((a, b) => a - b);
      const medianHours = cycleTimes[Math.floor(cycleTimes.length / 2)];
      
      if (medianHours < 24) {
        cycleTimeText = `${Math.round(medianHours)}h`;
      } else {
        cycleTimeText = `${Math.round(medianHours / 24)}d`;
      }
    }

    // 2. Fetch Deployments
    const deploymentsResponse = await axios.get(`${baseUrl}/deployments?per_page=100`, { headers }).catch(e => {
      // Deployments API often returns 404 if not configured, which is fine. But we shouldn't swallow 403 Rate Limits.
      if (e.response && e.response.status === 404) return { data: [] };
      throw e;
    });
    const deployments = deploymentsResponse.data;
    
    const recentDeployments = deployments.filter(d => new Date(d.created_at) > sevenDaysAgo).length;

    // 3. Fetch Dependabot alerts (requires specific token scopes, so it might fail for many, we gracefully handle)
    let criticalVulnerabilities = 0;
    try {
      const alertsResponse = await axios.get(`${baseUrl}/dependabot/alerts?state=open&severity=critical`, { headers });
      criticalVulnerabilities = alertsResponse.data.length;
    } catch (e) {
      // Ignore dependabot errors (often 403 or 404 if not enabled)
    }

    return {
      openPullRequests: openPrs,
      prCycleTime: cycleTimeText,
      leadTimeForChanges: cycleTimeText, // Approximating lead time as cycle time for simplicity
      deploymentFrequency: recentDeployments,
      criticalVulnerabilities: criticalVulnerabilities
    };

  } catch (error) {
    console.error("GitHub API Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to fetch GitHub metrics");
  }
};

export const getBasicRepoStats = async (repoUrl) => {
  if (!repoUrl || typeof repoUrl !== 'string') return null;
  
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return null;
  
  const owner = match[1];
  const repo = match[2].replace(/\.git$/, '');
  
  try {
    const repoRes = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'ProjectForge-App'
      }
    });
    
    return {
      stars: repoRes.data.stargazers_count,
      forks: repoRes.data.forks_count,
      openIssues: repoRes.data.open_issues_count,
      language: repoRes.data.language,
      description: repoRes.data.description,
      owner,
      repo
    };
  } catch (error) {
    console.error("GitHub API error:", error.message);
    return null;
  }
};

export const getWeeklyGitHubActivity = async (repoName, token) => {
  if (!repoName) return null;

  const headers = { Accept: "application/vnd.github.v3+json" };
  if (token) headers.Authorization = `token ${token}`;
  const baseUrl = `https://api.github.com/repos/${repoName}`;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sinceISO = sevenDaysAgo.toISOString();

  try {
    // 1. Fetch Commits
    const commitsRes = await axios.get(`${baseUrl}/commits?since=${sinceISO}&per_page=100`, { headers }).catch(() => ({ data: [] }));
    const commits = commitsRes.data.map(c => ({
      message: c.commit.message.split('\n')[0],
      author: c.commit.author.name || c.author?.login || "Unknown",
      date: c.commit.author.date
    }));

    // 2. Fetch Pull Requests
    const prsRes = await axios.get(`${baseUrl}/pulls?state=all&sort=updated&direction=desc&per_page=100`, { headers }).catch(() => ({ data: [] }));
    const allPrs = prsRes.data.filter(pr => new Date(pr.updated_at) > sevenDaysAgo);
    
    const pullRequests = {
      opened: allPrs.filter(pr => new Date(pr.created_at) > sevenDaysAgo).map(pr => ({ title: pr.title, number: pr.number, author: pr.user?.login })),
      merged: allPrs.filter(pr => pr.merged_at && new Date(pr.merged_at) > sevenDaysAgo).map(pr => ({ title: pr.title, number: pr.number, author: pr.user?.login })),
      closed: allPrs.filter(pr => pr.state === 'closed' && !pr.merged_at && new Date(pr.closed_at) > sevenDaysAgo).map(pr => ({ title: pr.title, number: pr.number }))
    };

    // 3. Fetch Issues (GitHub issues endpoint includes PRs, so we filter them out)
    const issuesRes = await axios.get(`${baseUrl}/issues?state=all&since=${sinceISO}&per_page=100`, { headers }).catch(() => ({ data: [] }));
    const actualIssues = issuesRes.data.filter(issue => !issue.pull_request);
    
    const issues = {
      opened: actualIssues.filter(i => new Date(i.created_at) > sevenDaysAgo).map(i => ({ title: i.title, number: i.number })),
      closed: actualIssues.filter(i => i.state === 'closed' && new Date(i.closed_at) > sevenDaysAgo).map(i => ({ title: i.title, number: i.number }))
    };

    return {
      commits,
      pullRequests,
      issues
    };
  } catch (error) {
    console.error("Failed to fetch weekly GitHub activity:", error.message);
    return null;
  }
};

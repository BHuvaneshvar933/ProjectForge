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
    const prsResponse = await axios.get(`${baseUrl}/pulls?state=all&per_page=100`, { headers }).catch(() => ({ data: [] }));
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
    const deploymentsResponse = await axios.get(`${baseUrl}/deployments?per_page=100`, { headers }).catch(() => ({ data: [] }));
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

import React, { useMemo, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { generateAIContent } from '../../api/aiApi';
import { getBasicRepoStats } from '../../api/projectApi';
import { endorseUser } from '../../api/userApi';
import ReactMarkdown from 'react-markdown';
import './WorkspaceSummary.css';

export default function WorkspaceSummary({ project, tasks, team, me }) {
  const archiveData = project?.archiveData || {};
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  
  const [githubStats, setGithubStats] = useState(null);

  useEffect(() => {
    if (archiveData.deliverables?.sourceCodeUrl) {
      getBasicRepoStats(archiveData.deliverables.sourceCodeUrl)
        .then(res => {
          if (res.data?.data?.stats) {
            setGithubStats(res.data.data.stats);
          }
        })
        .catch(err => console.error("Could not fetch repo stats"));
    }
  }, [archiveData.deliverables?.sourceCodeUrl]);

  const handleAIGenerate = async (type) => {
    setAiLoading(true);
    setAiResult(null);
    try {
      const skills = (archiveData.skillsGained || []).map(s => s.name || s);
      const payload = {
        title: project.title,
        description: project.description,
        skills,
        achievements: archiveData.achievements || [],
        challenges: (archiveData.challenges || []).map(c => `Problem: ${c.problem}, Solution: ${c.solution}`),
        takeaway: archiveData.takeaway
      };
      const res = await generateAIContent(type, payload);
      setAiResult({ type, content: res.data.data.result });
    } catch (e) {
      toast.error("Failed to generate AI content");
    } finally {
      setAiLoading(false);
    }
  };
  
  const stats = useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) return {};

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === "done").length;
    const completionPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
    const bugsFixed = tasks.filter(t => t.issueType === "bug" && t.status === "done").length;
    const epicsFinished = tasks.filter(t => t.issueType === "epic" && t.status === "done").length;

    // Contributions leaderboard
    const contributions = {};
    team.forEach(m => {
      if (m?.userId) {
        contributions[m.userId._id] = { 
          id: m.userId._id, 
          name: m.userId.name, 
          count: 0 
        };
      }
    });

    tasks.filter(t => t.status === "done").forEach(t => {
      if (t.assignedTo) {
        const aId = typeof t.assignedTo === 'string' ? t.assignedTo : t.assignedTo._id;
        if (contributions[aId]) contributions[aId].count++;
      }
    });

    const leaderboard = Object.values(contributions)
      .filter(c => c.count > 0)
      .sort((a, b) => b.count - a.count);

    return { totalTasks, completedTasks, completionPercentage, bugsFixed, epicsFinished, leaderboard };
  }, [tasks, team]);

  const durationDays = useMemo(() => {
    if (!project?.createdAt) return 0;
    const start = new Date(project.createdAt).getTime();
    // eslint-disable-next-line react-hooks/purity
    const end = project.status === "completed" && project.updatedAt 
      ? new Date(project.updatedAt).getTime() 
      : Date.now();
    
    return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
  }, [project]);

  const storyParagraph = useMemo(() => {
    if (!project) return "";
    
    const teamSize = team.length;
    const { completedTasks, bugsFixed } = stats;
    
    let story = `${project.title} began as an idea to solve a real problem. `;
    story += `Over ${durationDays} days, a team of ${teamSize} developers completed ${completedTasks} tasks`;
    
    if (bugsFixed > 0) story += ` and successfully tracked and fixed ${bugsFixed} bugs. `;
    else story += ". ";

    if (project?.archiveData?.challenges?.length > 0) {
      story += `Along the way, the team overcame ${project.archiveData.challenges.length} major engineering challenges. `;
    }

    if (project?.archiveData?.skillsGained?.length > 0) {
      const skillNames = project.archiveData.skillsGained.map(s => s.name || s).slice(0, 3).join(", ");
      story += `They gained substantial experience working with technologies like ${skillNames}. `;
    }

    story += `This project stands as a testament to their collaboration and technical growth.`;
    return story;
  }, [project, durationDays, stats, team.length]);

  if (!project) return null;

  return (
    <div className="workspace-summary">
      <div className="workspace-summary__content">
        
        {/* SECTION 1: Overview & Story */}
        <div className="summary-section">
          <h2 className="summary-section__title">Project Story</h2>
          <div className="summary-card story-card">
            <p>{storyParagraph}</p>
          </div>
          
          <div className="summary-overview-grid mt-4">
            <div className="summary-kv">
              <span className="summary-kv__label">Duration</span>
              <span className="summary-kv__value">{durationDays} days</span>
            </div>
            <div className="summary-kv">
              <span className="summary-kv__label">Start Date</span>
              <span className="summary-kv__value">{new Date(project.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="summary-kv">
              <span className="summary-kv__label">Team Size</span>
              <span className="summary-kv__value">{team.length} members</span>
            </div>
            <div className="summary-kv">
              <span className="summary-kv__label">Owner</span>
              <span className="summary-kv__value">{project.owner?.name || "Unknown"}</span>
            </div>
          </div>
        </div>

        {/* SECTION 2: Project Statistics */}
        <div className="summary-section">
          <h2 className="summary-section__title">Project Statistics</h2>
          <div className="summary-stats-grid">
            <div className="summary-stat-card">
              <div className="summary-stat-card__value">{stats.totalTasks}</div>
              <div className="summary-stat-card__label">Tasks Created</div>
            </div>
            <div className="summary-stat-card">
              <div className="summary-stat-card__value">{stats.completedTasks}</div>
              <div className="summary-stat-card__label">Tasks Completed</div>
            </div>
            <div className="summary-stat-card">
              <div className="summary-stat-card__value">{stats.completionPercentage}%</div>
              <div className="summary-stat-card__label">Completion</div>
            </div>
            <div className="summary-stat-card">
              <div className="summary-stat-card__value">{stats.bugsFixed}</div>
              <div className="summary-stat-card__label">Bugs Fixed</div>
            </div>
          </div>
        </div>

        <div className="summary-two-col">
          {/* LEFT COL */}
          <div className="summary-col">
            {/* SECTION 3: Timeline */}
            <div className="summary-section">
              <h2 className="summary-section__title">Project Timeline</h2>
              {archiveData.timelineEvents?.length > 0 ? (
                <div className="summary-timeline">
                  {archiveData.timelineEvents.map((evt, idx) => (
                    <div key={idx} className="summary-timeline__item">
                      <div className="summary-timeline__dot"></div>
                      <div className="summary-timeline__date">{new Date(evt.date).toLocaleDateString()}</div>
                      <div className="summary-timeline__content">
                        <strong>{evt.title}</strong>
                        {evt.description && <p>{evt.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="summary-empty">No timeline events recorded.</div>
              )}
            </div>

            {/* SECTION 5: Challenges */}
            <div className="summary-section">
              <h2 className="summary-section__title">Challenges Overcome</h2>
              {archiveData.challenges?.length > 0 ? (
                <div className="summary-challenges">
                  {archiveData.challenges.map((c, idx) => (
                    <div key={idx} className="summary-card challenge-card">
                      <div className="challenge-card__problem">
                        <span className="challenge-label problem-label">The Problem</span>
                        <p>{c.problem}</p>
                      </div>
                      <div className="challenge-card__solution">
                        <span className="challenge-label solution-label">The Solution</span>
                        <p>{c.solution}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="summary-empty">No challenges recorded.</div>
              )}
            </div>
          </div>

          {/* RIGHT COL */}
          <div className="summary-col">
            {/* SECTION 4: Achievements */}
            <div className="summary-section">
              <h2 className="summary-section__title">Major Achievements</h2>
              {archiveData.achievements?.length > 0 ? (
                <ul className="summary-achievements">
                  {archiveData.achievements.map((ach, idx) => (
                    <li key={idx}>🏆 {ach}</li>
                  ))}
                </ul>
              ) : (
                <div className="summary-empty">No achievements recorded.</div>
              )}
            </div>

            {/* SECTION 8: Skills */}
            <div className="summary-section">
              <h2 className="summary-section__title">Skills Gained</h2>
              {archiveData.skillsGained?.length > 0 ? (
                <div className="summary-skills">
                  {archiveData.skillsGained.map((skill, idx) => (
                    <div key={idx} className="summary-skill-chip">✓ {skill.name || skill}</div>
                  ))}
                </div>
              ) : (
                <div className="summary-empty">No skills tagged.</div>
              )}
            </div>

            {/* SECTION 7: Takeaway */}
            <div className="summary-section">
              <h2 className="summary-section__title">Biggest Takeaway</h2>
              {archiveData.takeaway ? (
                <div className="summary-card takeaway-card">
                  <em>"If I started this project again tomorrow, what would I do differently?"</em>
                  <p className="mt-2">{archiveData.takeaway}</p>
                </div>
              ) : (
                <div className="summary-empty">No takeaway recorded.</div>
              )}
            </div>

            {/* SECTION 9: Contributions & Endorsements */}
            <div className="summary-section">
              <h2 className="summary-section__title">Top Contributors</h2>
              {stats.leaderboard?.length > 0 ? (
                <div className="summary-leaderboard">
                  {stats.leaderboard.map((u, idx) => (
                    <div key={idx} className="summary-leaderboard__item">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span>{u.name}</span>
                        <strong>{u.count} tasks</strong>
                      </div>
                      {me && String(me._id) !== String(u.id) && (
                        <button 
                          className="summary-btn" 
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          onClick={() => {
                            const text = prompt(`Write a short endorsement for ${u.name}:`);
                            if (text) {
                              endorseUser(u.id, {
                                project: project._id,
                                text,
                                skills: archiveData.skillsGained?.map(s => s.name || s) || []
                              }).then(() => toast.success(`Endorsed ${u.name}!`))
                                .catch(err => toast.error(err.response?.data?.message || "Failed to endorse"));
                            }
                          }}
                        >
                          🏅 Endorse
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="summary-empty">No task completions recorded.</div>
              )}
            </div>

            {/* SECTION 10: Deliverables */}
            <div className="summary-section">
              <h2 className="summary-section__title">Deliverables</h2>
              <div className="summary-deliverables">
                {archiveData.deliverables?.sourceCodeUrl && (
                  <a href={archiveData.deliverables.sourceCodeUrl} target="_blank" rel="noreferrer" className="summary-btn">🔗 Source Code</a>
                )}
                {archiveData.deliverables?.demoVideoUrl && (
                  <a href={archiveData.deliverables.demoVideoUrl} target="_blank" rel="noreferrer" className="summary-btn">▶️ Demo Video</a>
                )}
                {archiveData.deliverables?.reportUrl && (
                  <a href={archiveData.deliverables.reportUrl} target="_blank" rel="noreferrer" className="summary-btn">📄 Project Report</a>
                )}
                {archiveData.deliverables?.slidesUrl && (
                  <a href={archiveData.deliverables.slidesUrl} target="_blank" rel="noreferrer" className="summary-btn">📊 Presentation</a>
                )}
                {!archiveData.deliverables?.sourceCodeUrl && !archiveData.deliverables?.demoVideoUrl && !archiveData.deliverables?.reportUrl && !archiveData.deliverables?.slidesUrl && (
                  <div className="summary-empty">No deliverables attached.</div>
                )}
              </div>
              
              {githubStats && (
                <div className="github-stats-card mt-4">
                  <h3 className="github-stats-title">GitHub Repository</h3>
                  <p className="github-stats-desc">{githubStats.description}</p>
                  <div className="github-stats-metrics">
                    <span className="github-metric">⭐ {githubStats.stars}</span>
                    <span className="github-metric">🍴 {githubStats.forks}</span>
                    <span className="github-metric">⚠️ {githubStats.openIssues} Issues</span>
                    {githubStats.language && <span className="github-metric">💻 {githubStats.language}</span>}
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 11: AI Resume Generator */}
            <div className="summary-section">
              <h2 className="summary-section__title">AI Resume Assistant</h2>
              <div className="summary-card ai-card">
                <p>Use your project journey to automatically generate high-quality resume bullets and interview stories.</p>
                <div className="ai-buttons">
                  <button 
                    className="summary-btn ai-btn" 
                    onClick={() => handleAIGenerate('resume')}
                    disabled={aiLoading}
                  >
                    ✨ Generate Resume Bullet
                  </button>
                  <button 
                    className="summary-btn ai-btn" 
                    onClick={() => handleAIGenerate('interview')}
                    disabled={aiLoading}
                  >
                    ✨ Generate Interview Story
                  </button>
                </div>
                {aiLoading && <div className="mt-4 text-sm opacity-50">Generating...</div>}
                {aiResult && (
                  <div className="ai-result-box mt-4">
                    <h3 className="ai-result-title">{aiResult.type === 'resume' ? 'Resume Bullet' : 'Interview Story'}</h3>
                    <div className="ai-result-content markdown-content">
                      <ReactMarkdown>{aiResult.content}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

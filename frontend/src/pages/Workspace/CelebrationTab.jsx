import React, { useState } from 'react';
import { toast } from 'react-toastify';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import API from '../../api/client';
import { saveMyReflections } from '../../api/projectApi';

import './CelebrationTab.css';

export default function CelebrationTab({ project, team, myTeamRecord }) {
  const [loading, setLoading] = useState(false);
  const [savingReflections, setSavingReflections] = useState(false);
  
  // Local state for assets and reflections to avoid forcing a full refetch immediately
  const [assets, setAssets] = useState(myTeamRecord?.careerAssets || null);
  const [hasReflections, setHasReflections] = useState(!!myTeamRecord?.reflections?.biggestChallenge);
  const [activeAssetTab, setActiveAssetTab] = useState('resume'); 
  
  const [answers, setAnswers] = useState({
    biggestChallenge: myTeamRecord?.reflections?.biggestChallenge || "",
    biggestAchievement: myTeamRecord?.reflections?.biggestAchievement || "",
    favoriteFeature: myTeamRecord?.reflections?.favoriteFeature || "",
    whatToImprove: myTeamRecord?.reflections?.whatToImprove || ""
  });

  const hasGeneratedAssets = assets && (assets.portfolioDescription || (assets.resumeBullets && assets.resumeBullets.length > 0) || (assets.linkedinPosts && Object.keys(assets.linkedinPosts).length > 0));

  const isFormValid = () => {
    return answers.biggestChallenge.trim() !== "" &&
           answers.biggestAchievement.trim() !== "" &&
           answers.favoriteFeature.trim() !== "" &&
           answers.whatToImprove.trim() !== "";
  };

  const handleSaveReflections = async () => {
    if (!isFormValid()) return;
    setSavingReflections(true);
    try {
      await saveMyReflections(project._id, { reflections: answers });
      toast.success("Reflections saved!");
      setHasReflections(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save reflections");
    } finally {
      setSavingReflections(false);
    }
  };

  const handleGenerateAssets = async () => {
    setLoading(true);
    try {
      const { data } = await API.post('/ai/generate', {
        type: 'career-assets',
        projectId: project._id,
        projectData: {
          title: project.title,
          description: project.description,
          skills: project.requiredSkills?.map(s => s.name) || [],
          duration: project.timeline?.estimatedDuration || 30,
          teamSize: team?.length || 1,
          tasksCompleted: 10,
          biggestChallenge: answers.biggestChallenge,
          biggestAchievement: answers.biggestAchievement,
          favoriteFeature: answers.favoriteFeature,
          whatToImprove: answers.whatToImprove
        }
      });
      setAssets(data.data.result);
      toast.success("Career assets generated successfully!");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to generate assets");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="celebration-tab">
      <div className="celebration-hero">
        <h1>Congratulations!</h1>
        <p>You completed <strong>{project.title}</strong></p>

        <div className="celebration-stats">
          <div className="stat-box">
            <span className="stat-label">Duration</span>
            <span className="stat-value">{project.timeline?.estimatedDuration || 30} days</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Team</span>
            <span className="stat-value">{team?.length || 1} developers</span>
          </div>
        </div>

        <div className="celebration-team-shoutout">
          <h3>Team Appreciation</h3>
          <p>Couldn't have built this without you.</p>
          <div className="team-avatars">
            {team?.map(member => (
              <div key={member._id} className="team-member-chip">
                {member.userId?.name || member.user?.name || "Member"}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="celebration-assets-section">
        {!hasReflections && (
          <div className="reflection-form">
            <h3 style={{ marginBottom: "10px", color: "var(--color-text-dark)" }}>Reflect on your journey</h3>
            <p style={{ color: "var(--color-text-muted)", marginBottom: "20px" }}>
              To generate your personalized AI career assets (resume bullets, LinkedIn posts), please answer these 4 quick questions. Your reflections will be saved with this project and can be used to generate your career assets later.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", textAlign: "left" }}>
              <div>
                <label style={{ display: "block", color: "var(--color-text-dark)", fontWeight: "600", marginBottom: "4px", fontSize: "14px" }}>
                  1. What was the biggest technical challenge you overcame?
                </label>
                <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "8px" }}>
                  <strong>Pro Tip:</strong> Tell us what went wrong, what made it difficult, and how you solved it.
                </div>
                <textarea 
                  value={answers.biggestChallenge}
                  onChange={(e) => setAnswers({...answers, biggestChallenge: e.target.value})}
                  placeholder="e.g. Setting up real-time WebSockets with authentication..."
                  style={{ width: "100%", padding: "12px", background: "var(--color-paper)", border: "1px solid var(--border-color)", borderRadius: "8px", color: "var(--color-text-dark)", minHeight: "80px", resize: "vertical" }}
                />
              </div>
              
              <div>
                <label style={{ display: "block", color: "var(--color-text-dark)", fontWeight: "600", marginBottom: "4px", fontSize: "14px" }}>
                  2. What is the biggest achievement of this project?
                </label>
                <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "8px" }}>
                  <strong>Pro Tip:</strong> Recruiters love metrics. Try to include a number if you can (e.g., "Reduced load time by 40%", "Built 5 API routes").
                </div>
                <textarea 
                  value={answers.biggestAchievement}
                  onChange={(e) => setAnswers({...answers, biggestAchievement: e.target.value})}
                  placeholder="e.g. Reduced API response time by 50%..."
                  style={{ width: "100%", padding: "12px", background: "var(--color-paper)", border: "1px solid var(--border-color)", borderRadius: "8px", color: "var(--color-text-dark)", minHeight: "80px", resize: "vertical" }}
                />
              </div>

              <div>
                <label style={{ display: "block", color: "var(--color-text-dark)", fontWeight: "600", marginBottom: "4px", fontSize: "14px" }}>
                  3. What is your favorite feature that you built?
                </label>
                <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "8px" }}>
                  <strong>Pro Tip:</strong> Talk about the user impact. Why does this feature matter to the person using the app?
                </div>
                <textarea 
                  value={answers.favoriteFeature}
                  onChange={(e) => setAnswers({...answers, favoriteFeature: e.target.value})}
                  placeholder="e.g. The drag-and-drop Kanban board..."
                  style={{ width: "100%", padding: "12px", background: "var(--color-paper)", border: "1px solid var(--border-color)", borderRadius: "8px", color: "var(--color-text-dark)", minHeight: "80px", resize: "vertical" }}
                />
              </div>

              <div>
                <label style={{ display: "block", color: "var(--color-text-dark)", fontWeight: "600", marginBottom: "4px", fontSize: "14px" }}>
                  4. If you had another month, what would you improve?
                </label>
                <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "8px" }}>
                  <strong>Pro Tip:</strong> Showing awareness of technical debt (like needing tests, CI/CD, or caching) shows senior-level maturity.
                </div>
                <textarea 
                  value={answers.whatToImprove}
                  onChange={(e) => setAnswers({...answers, whatToImprove: e.target.value})}
                  placeholder="e.g. Add unit tests and Redis caching..."
                  style={{ width: "100%", padding: "12px", background: "var(--color-paper)", border: "1px solid var(--border-color)", borderRadius: "8px", color: "var(--color-text-dark)", minHeight: "80px", resize: "vertical" }}
                />
              </div>
            </div>

            <div style={{ marginTop: "20px" }}>
              <Button onClick={handleSaveReflections} disabled={!isFormValid() || savingReflections}>
                {savingReflections ? "Saving..." : "Save Reflections & Continue →"}
              </Button>
            </div>
          </div>
        )}

        {hasReflections && !hasGeneratedAssets && !loading && (
          <div className="generate-prompt">
            <h3>Generate Career Assets</h3>
            <p>Turn your hard work into portfolio descriptions, resume bullets, and LinkedIn posts instantly.</p>
            <Button onClick={handleGenerateAssets} size="lg">Generate with AI</Button>
          </div>
        )}

        {loading && (
          <div className="generate-loading">
            <Spinner />
            <p>Analyzing your project and crafting career assets...</p>
          </div>
        )}

        {hasGeneratedAssets && (
          <div className="assets-results">
            <div className="assets-tabs">
              <button className={activeAssetTab === 'resume' ? 'active' : ''} onClick={() => setActiveAssetTab('resume')}>Resume</button>
              <button className={activeAssetTab === 'linkedin' ? 'active' : ''} onClick={() => setActiveAssetTab('linkedin')}>LinkedIn</button>
              <button className={activeAssetTab === 'portfolio' ? 'active' : ''} onClick={() => setActiveAssetTab('portfolio')}>Portfolio</button>
              <button className={activeAssetTab === 'interview' ? 'active' : ''} onClick={() => setActiveAssetTab('interview')}>Interview</button>
            </div>

            <div className="assets-content">
              {activeAssetTab === 'resume' && (
                <div>
                  <h4>Resume Bullets</h4>
                  <p className="assets-description">Add these to your resume to highlight your impact.</p>
                  <div className="educational-box">
                    <strong>Why this works:</strong> These bullets use the <em>XYZ Formula</em> (Accomplished X, as measured by Y, by doing Z). 
                    <br/><br/>
                    <strong>How to improve:</strong> If you see placeholders like [X]%, replace them with realistic metrics you measured during the project!
                  </div>
                  <div className="assets-card">
                    <ul>
                      {assets.resumeBullets?.map((bullet, i) => (
                        <li key={i}>{bullet}</li>
                      ))}
                    </ul>
                    <Button variant="outline" size="sm" onClick={() => handleCopy(assets.resumeBullets?.join('\n'))}>Copy All</Button>
                  </div>
                </div>
              )}

              {activeAssetTab === 'linkedin' && (
                <div>
                  <h4>LinkedIn Posts</h4>
                  <p className="assets-description">Choose a tone that fits your personal brand.</p>
                  <div className="educational-box">
                    <strong>Why this works:</strong> Recruiters love engineers who share <em>value</em>. Instead of just bragging about finishing a project, these posts share architectural lessons and technical decisions.
                  </div>
                  
                  {assets.linkedinPosts?.professional && (
                    <div className="assets-card">
                      <h5>Professional</h5>
                      <p style={{ whiteSpace: 'pre-wrap', marginBottom: '10px' }}>{assets.linkedinPosts.professional}</p>
                      <Button variant="outline" size="sm" onClick={() => handleCopy(assets.linkedinPosts.professional)}>Copy</Button>
                    </div>
                  )}

                  {assets.linkedinPosts?.buildInPublic && (
                    <div className="assets-card">
                      <h5>Build in Public</h5>
                      <p style={{ whiteSpace: 'pre-wrap', marginBottom: '10px' }}>{assets.linkedinPosts.buildInPublic}</p>
                      <Button variant="outline" size="sm" onClick={() => handleCopy(assets.linkedinPosts.buildInPublic)}>Copy</Button>
                    </div>
                  )}
                </div>
              )}

              {activeAssetTab === 'portfolio' && (
                <div>
                  <h4>Portfolio Description</h4>
                  <p className="assets-description">A polished summary for your personal website or GitHub README.</p>
                  <div className="educational-box">
                    <strong>Why this works:</strong> Good portfolios don't just list what was built; they explain <em>why</em> it was built. This explicitly highlights the core problem and the architectural decisions you made.
                  </div>
                  <div className="assets-card">
                    <p style={{ whiteSpace: 'pre-wrap', marginBottom: '10px' }}>{assets.portfolioDescription}</p>
                    <Button variant="outline" size="sm" onClick={() => handleCopy(assets.portfolioDescription)}>Copy</Button>
                  </div>
                </div>
              )}

              {activeAssetTab === 'interview' && (
                <div>
                  <h4>Interview Talking Point (STAR Method)</h4>
                  <p className="assets-description">Use this to answer "Tell me about a challenging project."</p>
                  <div className="educational-box">
                    <strong>Why this works:</strong> The STAR method (Situation, Task, Action, Result) keeps your answers structured. Notice how 60% of this answer focuses on the <em>Action</em> (using "I" statements) to show exactly what you contributed.
                  </div>
                  <div className="assets-card">
                    <p style={{ whiteSpace: 'pre-wrap', marginBottom: '10px' }}>{assets.interviewAnswer}</p>
                    <Button variant="outline" size="sm" onClick={() => handleCopy(assets.interviewAnswer)}>Copy</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { browseProjects } from "../../api/projectApi";
import "./LearningArchive.css";

export default function LearningArchive() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [projectType, setProjectType] = useState("");

  const fetchArchive = async () => {
    try {
      setLoading(true);
      const res = await browseProjects({
        status: "completed",
        search,
        projectType,
        limit: 50,
      });
      if (res.data.success) {
        setProjects(res.data.data.projects);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchArchive();
    }, 300);
    return () => clearTimeout(delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, projectType]);

  return (
    <div className="learning-archive">
      <div className="learning-archive__header">
        <h1 className="learning-archive__title">Learning Archive</h1>
        <p className="learning-archive__subtitle">
          Explore completed projects to discover technical insights, challenges faced, and lessons learned from past teams.
        </p>
      </div>

      <div className="learning-archive__filters">
        <input
          type="text"
          className="learning-archive__input"
          placeholder="Search archived projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="learning-archive__select"
          value={projectType}
          onChange={(e) => setProjectType(e.target.value)}
        >
          <option value="">All Domains</option>
          <option value="web">Web Development</option>
          <option value="mobile">Mobile Development</option>
          <option value="ml">Machine Learning</option>
          <option value="hackathon">Hackathon</option>
        </select>
      </div>

      {loading ? (
        <div className="learning-archive__empty">Loading archives...</div>
      ) : (
        <div className="learning-archive__grid">
          {projects.length === 0 ? (
            <div className="learning-archive__empty">
              No completed projects found in the archive.
            </div>
          ) : (
            projects.map((p) => (
              <Link to={`/workspace/${p._id}?tab=journey`} key={p._id} className="learning-archive__card">
                <div className="learning-archive__card-header">
                  <span className="learning-archive__type">{p.projectType}</span>
                </div>
                <h3 className="learning-archive__card-title">{p.title}</h3>
                <p className="learning-archive__card-desc">
                  {p.description.length > 120 ? p.description.slice(0, 120) + "..." : p.description}
                </p>
                <div className="learning-archive__card-meta">
                  <span>{new Date(p.updatedAt).getFullYear()}</span>
                  <span>{p.metrics?.completedTasks || 0} tasks</span>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}

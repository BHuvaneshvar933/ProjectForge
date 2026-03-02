import { useEffect, useState } from "react";
import { browseProjects } from "../../api/projectApi";
import "./BrowseProjects.css";

export default function BrowseProjects() {

  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);

      const res = await browseProjects({
        search
      });

      setProjects(res.data.projects);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="browse-container">
      <div className="browse-header">
        <h1 style={{
          fontSize: '3.2rem',
          fontWeight: 900,
          margin: 0,
          color: '#fff',
          letterSpacing: '-0.03em',
          lineHeight: 1.1
        }}>Explore Projects</h1>

        <div className="search-box">
          <input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button onClick={fetchProjects}>Search</button>
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', fontSize: '1.1rem', color: 'rgba(255,255,255,0.4)', fontWeight: 400, marginTop: 80 }}>Loading...</p>
      ) : (
        <div className="project-grid">
          {projects.map((project) => (
            <div className="project-card" key={project._id}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{
                  fontSize: '1.35rem',
                  margin: 0,
                  fontWeight: 700,
                  color: '#fff',
                  letterSpacing: '-0.02em'
                }}>{project.title}</h3>
                <span style={{
                  background: project.status === 'recruiting' ? '#fff' : 'rgba(255,255,255,0.1)',
                  color: project.status === 'recruiting' ? '#000' : 'rgba(255,255,255,0.5)',
                  borderRadius: 980,
                  padding: '5px 14px',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  letterSpacing: '0.01em'
                }}>{project.status}</span>
              </div>

              <p style={{
                margin: '0 0 0 0',
                fontSize: '0.95rem',
                color: 'rgba(255,255,255,0.5)',
                fontWeight: 400,
                lineHeight: 1.6
              }}>{project.description}</p>

              <div className="skills">
                {project.requiredSkills?.map(skill => (
                  <span key={skill._id}>{skill.name}</span>
                ))}
              </div>

              <div className="footer">
                <p style={{
                  margin: 0,
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.35)',
                  fontSize: '0.88rem'
                }}>{project.owner?.name}</p>
                <button style={{
                  background: '#fff',
                  color: '#000',
                  border: 'none',
                  borderRadius: 980,
                  padding: '10px 26px',
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  transition: 'background 0.25s, transform 0.2s',
                  letterSpacing: '-0.01em'
                }}>View</button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
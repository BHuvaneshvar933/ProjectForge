import React, { useState, useEffect } from 'react';
import Button from "../../../../components/common/Button";
import { getMyProjects, getJoinedProjects } from "../../../../api/projectApi";
import { toast } from "react-toastify";

export default function FeaturedProjectsEditor({ form, setForm }) {
  const featuredProjects = form.featuredProjects || [];
  const [eligibleProjects, setEligibleProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const [myRes, joinedRes] = await Promise.all([
          getMyProjects(),
          getJoinedProjects()
        ]);
        const my = myRes.data?.data?.projects || [];
        const joined = joinedRes.data?.data?.projects || [];
        
        const combined = [...my, ...joined];
        // Deduplicate
        const unique = Array.from(new Map(combined.map(p => [p._id, p])).values());
        setEligibleProjects(unique);
      } catch {
        toast.error("Failed to load projects for featuring");
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const addProject = (projectId) => {
    if (!projectId) return;
    if (featuredProjects.some(fp => fp.projectId === projectId)) return;

    setForm(p => ({
      ...p,
      featuredProjects: [...(p.featuredProjects || []), { projectId, order: (p.featuredProjects || []).length }]
    }));
  };

  const removeProject = (index) => {
    setForm(p => {
      const newFp = (p.featuredProjects || []).filter((_, i) => i !== index);
      // Re-adjust order
      return {
        ...p,
        featuredProjects: newFp.map((fp, i) => ({ ...fp, order: i }))
      };
    });
  };

  const moveProject = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === featuredProjects.length - 1) return;

    setForm(p => {
      const newFp = [...(p.featuredProjects || [])];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      
      const temp = newFp[index];
      newFp[index] = newFp[targetIndex];
      newFp[targetIndex] = temp;

      return {
        ...p,
        featuredProjects: newFp.map((fp, i) => ({ ...fp, order: i }))
      };
    });
  };

  return (
    <div className="account__section">
      <div className="account__card-title" style={{ marginBottom: 16 }}>Featured Projects</div>
      <p className="account__muted" style={{ marginBottom: 16 }}>
        Select up to 4 projects to feature on your public portfolio. You can only select projects you belong to that are in-progress or completed.
      </p>

      {featuredProjects.length === 0 ? (
        <p className="account__muted" style={{ fontStyle: 'italic', marginBottom: 16 }}>No featured projects yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          {featuredProjects.map((fp, i) => {
            const projDetails = eligibleProjects.find(p => p._id === fp.projectId);
            return (
              <div key={fp.projectId || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'var(--color-paper)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>{projDetails?.title || 'Unknown Project'}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{projDetails?.status}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button variant="outline" size="sm" onClick={() => moveProject(i, 'up')} disabled={i === 0}>↑</Button>
                  <Button variant="outline" size="sm" onClick={() => moveProject(i, 'down')} disabled={i === featuredProjects.length - 1}>↓</Button>
                  <Button variant="danger" size="sm" onClick={() => removeProject(i)}>Remove</Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {featuredProjects.length < 4 && (
        <div style={{ display: 'flex', gap: 8 }}>
          <select 
            className="account__skill-input" 
            style={{ flex: 1 }}
            onChange={(e) => {
              addProject(e.target.value);
              e.target.value = "";
            }}
            defaultValue=""
          >
            <option value="" disabled>Select a project to feature...</option>
            {eligibleProjects
              .filter(p => (p.status === 'completed' || p.status === 'in-progress') && !featuredProjects.some(fp => fp.projectId === p._id))
              .map(p => (
                <option key={p._id} value={p._id}>{p.title}</option>
              ))
            }
          </select>
        </div>
      )}
      {loading && <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8 }}>Loading eligible projects...</div>}
    </div>
  );
}

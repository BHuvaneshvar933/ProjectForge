import './Badge.css';

export default function Badge({ children, variant = "default", className = "" }) {
  const variants = {
    default: "badge--default",
    recruiting: "badge--recruiting",
    "in-progress": "badge--in-progress",
    completed: "badge--completed",
    archived: "badge--archived",
    owner: "badge--owner",
    member: "badge--member",
    skill: "badge--skill",
    web: "badge--web",
    mobile: "badge--mobile",
    ml: "badge--ml",
    hackathon: "badge--hackathon",
    personal: "badge--personal",
    startup: "badge--startup",
    "open-source": "badge--open-source",
    academic: "badge--academic"
  };

  return (
    <span className={`badge ${variants[variant] || variants.default} ${className}`.trim()}>
      {children}
    </span>
  );
}

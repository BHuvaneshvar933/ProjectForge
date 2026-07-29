import './ProjectCardSkeleton.css';

export default function ProjectCardSkeleton() {
  return (
    <div className="project-card-skel" aria-hidden>
      <div className="project-card-skel__header">
        <div className="project-card-skel__title" />
        <div className="project-card-skel__badges">
          <div className="project-card-skel__badge" />
          <div className="project-card-skel__badge" />
        </div>
      </div>

      <div className="project-card-skel__lines">
        <div className="project-card-skel__line" />
        <div className="project-card-skel__line" />
        <div className="project-card-skel__line project-card-skel__line--short" />
      </div>

      <div className="project-card-skel__team">
        <div className="project-card-skel__team-row">
          <div className="project-card-skel__label" />
          <div className="project-card-skel__value" />
        </div>
        <div className="project-card-skel__progress" />
      </div>

      <div className="project-card-skel__skills">
        <div className="project-card-skel__chip" />
        <div className="project-card-skel__chip" />
        <div className="project-card-skel__chip" />
      </div>

      <div className="project-card-skel__footer">
        <div className="project-card-skel__owner">
          <div className="project-card-skel__avatar" />
          <div className="project-card-skel__name" />
        </div>
        <div className="project-card-skel__cta" />
      </div>
    </div>
  );
}

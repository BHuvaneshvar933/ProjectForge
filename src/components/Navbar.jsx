import { Link } from "react-router-dom";

export default function Navbar() {
  const linkClasses = "no-underline font-medium text-sm px-[18px] py-2 rounded-full transition-[background,color] duration-250 tracking-tight";
  
  return (
    <nav className="flex justify-between items-center px-[8vw] py-4 bg-black/85 sticky top-0 z-[100] border-b border-white/8"
         style={{
           backdropFilter: "saturate(180%) blur(20px)",
           WebkitBackdropFilter: "saturate(180%) blur(20px)",
         }}>
      <Link to="/" className="no-underline">
        <h2 className="font-extrabold text-[1.35rem] m-0 tracking-tighter text-white">
          TeamForge
        </h2>
      </Link>
      <div className="flex items-center gap-2">
        <Link to="/projects" className={`${linkClasses} bg-white text-black`}>
          Browse
        </Link>
        <Link to="/my-projects" className={`${linkClasses} text-white/80 hover:bg-white/10`}>
          My Projects
        </Link>
        <Link to="/profile" className={`${linkClasses} text-white/80 hover:bg-white/10`}>
          Profile
        </Link>
      </div>
    </nav>
  );
}

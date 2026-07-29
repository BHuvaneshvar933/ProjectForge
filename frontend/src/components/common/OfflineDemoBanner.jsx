import { useState, useEffect } from "react";
import { getOfflineDb, resetOfflineDb, switchDemoUser } from "../../api/offlineMockEngine";
import { toast } from "react-toastify";

export default function OfflineDemoBanner() {
  const [db, setDb] = useState(getOfflineDb());
  const [isOpen, setIsOpen] = useState(false);
  const [activeUser, setActiveUser] = useState(db.currentUser);

  useEffect(() => {
    const handleUpdate = () => {
      const freshDb = getOfflineDb();
      setDb(freshDb);
      setActiveUser(freshDb.currentUser);
    };

    window.addEventListener("offline-db-updated", handleUpdate);
    window.addEventListener("offline-user-switched", handleUpdate);
    return () => {
      window.removeEventListener("offline-db-updated", handleUpdate);
      window.removeEventListener("offline-user-switched", handleUpdate);
    };
  }, []);

  const handleReset = () => {
    resetOfflineDb();
    toast.success("Offline seed database reset successfully");
    window.location.reload();
  };

  const handleSwitchUser = (userId) => {
    switchDemoUser(userId);
    toast.info(`Switched active profile`);
    window.location.reload();
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] font-sans">
      <div className="rounded-sm bg-[#0a0a0c] border border-zinc-800 text-white p-3 max-w-xs shadow-none border-t-2 border-t-[#ffffff]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] font-extrabold tracking-widest uppercase text-[#ffffff]">
              Standalone Mode
            </span>
            <span className="text-xs text-white font-medium truncate max-w-[160px]">
              {activeUser.name}
            </span>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded-sm"
          >
            {isOpen ? "Close" : "Setup"}
          </button>
        </div>

        {isOpen && (
          <div className="mt-3 pt-3 border-t border-zinc-900 text-xs space-y-3">
            <div className="bg-zinc-950 p-2 border border-zinc-900 space-y-1">
              <div className="flex justify-between text-zinc-500 text-[10px] uppercase tracking-wider">
                <span>Projects</span>
                <span className="font-semibold text-zinc-300">{db.projects.length}</span>
              </div>
              <div className="flex justify-between text-zinc-500 text-[10px] uppercase tracking-wider">
                <span>Tasks</span>
                <span className="font-semibold text-zinc-300">{db.tasks.length}</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                Active Persona
              </label>
              <select
                value={activeUser._id}
                onChange={(e) => handleSwitchUser(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-sm px-2 py-1 text-xs text-zinc-200 outline-none focus:border-[#ffffff]"
              >
                {db.users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleReset}
              className="w-full text-[11px] font-extrabold uppercase tracking-wider rounded-sm bg-[#ffffff] hover:bg-[rgba(255, 255, 255, 0.2)] py-1.5 text-black"
            >
              Reset Mock Data
            </button>
          </div>
        )}
      </div>
    </div>
  );
}




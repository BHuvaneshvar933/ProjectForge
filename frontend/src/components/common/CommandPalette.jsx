import { useState, useEffect } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { Search, Folder, User, Settings } from 'lucide-react';
import './CommandPalette.css';

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (command) => {
    setOpen(false);
    command();
  };

  return (
    <Command.Dialog 
      open={open} 
      onOpenChange={setOpen} 
      label="Global Command Menu"
      className="command-palette-dialog"
    >
        <div className="command-palette-input-wrapper">
          <Search className="command-palette-search-icon" />
          <Command.Input autoFocus placeholder="Type a command or search..." className="command-palette-input" />
        </div>
        
        <Command.List className="command-palette-list">
          <Command.Empty className="command-palette-empty">No results found.</Command.Empty>
          
          <Command.Group heading="Navigation">
            <Command.Item onSelect={() => runCommand(() => navigate('/projects'))} className="command-palette-item">
              <Folder className="command-palette-item-icon" />
              Browse Projects
            </Command.Item>
            <Command.Item onSelect={() => runCommand(() => navigate('/my-projects'))} className="command-palette-item">
              <Folder className="command-palette-item-icon" />
              My Projects
            </Command.Item>
            <Command.Item onSelect={() => runCommand(() => navigate('/account'))} className="command-palette-item">
              <User className="command-palette-item-icon" />
              My Account
            </Command.Item>
          </Command.Group>

          <Command.Group heading="Actions">
            <Command.Item onSelect={() => runCommand(() => navigate('/projects/create'))} className="command-palette-item">
              <Settings className="command-palette-item-icon" />
              Create New Project
            </Command.Item>
          </Command.Group>
        </Command.List>
      </Command.Dialog>
  );
}

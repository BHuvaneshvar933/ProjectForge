import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import { toast } from 'react-toastify';
import {
  Search,
  BookOpen,
  Compass,
  FolderPlus,
  UserPlus,
  Users,
  LayoutDashboard,
  MessageSquare,
  Calendar,
  Award,
  HelpCircle,
  Mail,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  GitBranch,
  CheckSquare,
  Layers,
  ArrowRight,
  Send,
  Flag,
  Lightbulb,
  Clock,
  ShieldAlert
} from 'lucide-react';
import './HelpSupport.css';

export default function HelpSupport() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedFaq, setExpandedFaq] = useState(null);
  
  // Support form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('Technical Issue');
  const [contactMessage, setContactMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { id: 'all', label: 'All Topics' },
    { id: 'discover', label: 'Discover & Search' },
    { id: 'create', label: 'Create & Lead' },
    { id: 'join', label: 'Join & Apply' },
    { id: 'invite', label: 'Invites & Recruiting' },
    { id: 'workspace', label: 'Workspace & Collab' },
    { id: 'messages', label: 'Chat & Messaging' },
    { id: 'calendar', label: 'Calendar & Deadlines' },
    { id: 'archive', label: 'Portfolio & Journey' },
    { id: 'faq', label: 'Frequently Asked Questions' },
    { id: 'contact', label: 'Contact Support' },
  ];

  const tutorials = [
    {
      id: 'discover',
      category: 'discover',
      badge: 'Step 1: Finding Projects',
      title: 'How to Browse, Search & Match with Projects',
      subtitle: 'Find open-source and collaborative projects that fit your exact skills and experience level.',
      steps: [
        {
          title: 'Navigate to the Discover Page',
          description: 'Click "Discover" in the top navigation bar or go directly to the project catalog.',
          details: 'You can explore all public projects created by the community. Each card gives a snapshot of the project\'s goals, active team size, open roles, and technologies used.',
          actionLink: '/projects',
          actionText: 'Open Discover Catalog'
        },
        {
          title: 'Search by Keyword, Tags or Technologies',
          description: 'Use the real-time search bar to look up specific technologies (e.g. React, Node.js, Python, Tailwind) or project categories (e.g. AI, E-Commerce, DevTools).',
          details: 'The list dynamically updates as you type, highlighting projects that require your preferred tech stack.'
        },
        {
          title: 'Filter by Status and Open Positions',
          description: 'Filter projects by status: "Active" (currently recruiting), "In Progress" (development underway), or "Completed".',
          details: 'You can also check the "Positions Open" count on cards. If a card says "0 Positions Open", the team is currently full, but you can still view and follow their progress.'
        },
        {
          title: 'Understand the "Match Score"',
          description: 'ProjectForge automatically compares the skills listed in your profile with the project\'s required skills.',
          details: 'A high match score (e.g., 85% or 100%) indicates your profile strongly matches the tech stack requested by the project owner.'
        }
      ],
      proTip: 'Keep your Account Profile updated with your latest skills and proficiencies to get higher match ratings and stand out to project leads!'
    },
    {
      id: 'create',
      category: 'create',
      badge: 'Step 2: Starting a Project',
      title: 'How to Create, Configure & Launch a Project',
      subtitle: 'Turn your idea into a thriving collaboration. Set up roles, tech stack, milestones, and repo links.',
      steps: [
        {
          title: 'Initiate Project Creation',
          description: 'Click "Start Project" in the navigation bar or "+ New Project" in your My Projects dashboard.',
          actionLink: '/projects/create',
          actionText: 'Launch Project Creation Wizard'
        },
        {
          title: 'Step 1: Basic Information',
          description: 'Enter your project title, short tagline, comprehensive description, category, and target completion timeline.',
          details: 'Be clear about the problem you are solving, the audience, and what makes your project exciting for other developers to join.'
        },
        {
          title: 'Step 2: Define the Tech Stack',
          description: 'Add all languages, frameworks, and libraries your project will utilize (e.g. React, Express, MongoDB, Docker).',
          details: 'These tags are used by the matching engine to suggest your project to developers who have matching proficiencies.'
        },
        {
          title: 'Step 3: Define Roles & Positions Needed',
          description: 'Specify which team members you need to recruit (e.g., 2 Frontend Engineers, 1 UI/UX Designer, 1 Backend Lead).',
          details: 'For each role, define required skills, responsibilities, and experience level (Beginner, Intermediate, Advanced).'
        },
        {
          title: 'Step 4: Milestones & Roadmap',
          description: 'Outline key phases (e.g., "MVP UI Design", "API Development", "Beta Testing", "Launch").',
          details: 'Milestones help incoming collaborators understand where the project currently stands and what deadlines lie ahead.'
        },
        {
          title: 'Editing & Managing Your Project',
          description: 'As the project owner, visit your project detail page anytime and click "Edit Project" to adjust settings, update roles, or change status to Completed.',
          actionLink: '/my-projects',
          actionText: 'Manage My Projects'
        }
      ],
      proTip: 'Clear, well-defined roles attract higher quality applicants much faster than generic descriptions.'
    },
    {
      id: 'join',
      category: 'join',
      badge: 'Step 3: Joining a Team',
      title: 'How to Apply & Join an Open Project',
      subtitle: 'Find an open position that excites you and pitch your skills to the project lead.',
      steps: [
        {
          title: 'Review the Project Details Page',
          description: 'Click on any project card in the Discover page to open its full showcase.',
          details: 'Inspect the project description, existing team members, milestones, and open roles section.'
        },
        {
          title: 'Select an Open Role & Click "Apply"',
          description: 'Click the "Apply to Role" button under the role you want to take on.',
          details: 'You will be prompted with an application modal where you can select your role and write a tailored message.'
        },
        {
          title: 'Compose Your Application Pitch',
          description: 'Introduce yourself, summarize why you are interested in the project, highlight relevant experience, and share links to your GitHub or portfolio.',
          details: 'Project owners read these messages to determine who will be the best fit for their team.'
        },
        {
          title: 'Track Your Application Status',
          description: 'Navigate to "Applications" in the navigation bar to see all applications you have sent.',
          details: 'Statuses: "Pending" (under review), "Accepted" (you\'re on the team!), or "Rejected". When accepted, you immediately gain full access to the project\'s private Workspace.',
          actionLink: '/applications/sent',
          actionText: 'View Sent Applications'
        }
      ],
      proTip: 'Personalize each pitch! Mention specific features in the project roadmap you are eager to build.'
    },
    {
      id: 'invite',
      category: 'invite',
      badge: 'Step 4: Recruiting & Inviting',
      title: 'How to Review Applications & Add Collaborators',
      subtitle: 'Manage applicant submissions, message candidates, and accept team members into your Workspace.',
      steps: [
        {
          title: 'Receive Application Notifications',
          description: 'When someone applies to your project, you will receive an in-app notification bell alert.',
          details: 'You can also check the application count badge directly on your project in the My Projects dashboard.'
        },
        {
          title: 'Go to Project Applications Review',
          description: 'From your project details page or My Projects, click "Manage Applications" (or navigate to /projects/:id/applications).',
          details: 'You will see a list of all candidates who have applied for each role, along with their bio, skills, and pitch message.'
        },
        {
          title: 'Message Applicants Before Deciding',
          description: 'Click the message icon next to an applicant to open a 1-on-1 direct conversation.',
          details: 'Ask questions about their availability, time zones, or past projects to ensure mutual alignment.'
        },
        {
          title: 'Accept or Decline Applications',
          description: 'Click "Accept" to admit the developer into your project team.',
          details: 'Accepting immediately adds them to the team roster, decrements the open positions count, and gives them access to the collaborative Workspace.'
        },
        {
          title: 'Inviting Other Users Directly',
          description: 'To invite a developer you know or found on the platform, message them directly via Direct Messages with your project link so they can submit their instant application.',
          actionLink: '/messages',
          actionText: 'Go to Direct Messages'
        }
      ],
      proTip: 'Quick responses keep talented developers engaged. Try to review applications within 48 hours!'
    },
    {
      id: 'workspace',
      category: 'workspace',
      badge: 'Step 5: The Command Center',
      title: 'Mastering the Collaboration Workspace',
      subtitle: 'The private hub where accepted team members build together. Deep dive into all 7 tabs.',
      steps: [
        {
          title: 'Tab 1: Overview',
          description: 'High-level project snapshot with overall progress percentage, active milestones bar, target launch dates, and full team roster.',
          details: 'Use this tab during standups and weekly check-ins to stay aligned on high-level goals.'
        },
        {
          title: 'Tab 2: Tasks (Kanban / Agile Board)',
          description: 'The heartbeat of your workflow. Manage deliverables across 4 columns: "To Do", "In Progress", "Under Review", and "Completed".',
          details: 'Creating Tasks: Click "+ Add Task", assign a team member, set a deadline date, and assign priority (Low, Medium, High, Urgent). Moving a task to "Completed" automatically advances the overall project progress bar!'
        },
        {
          title: 'Tab 3: Development & Git Hub',
          description: 'Code coordination center. Contains GitHub repo links, branch conventions, PR guidelines, and development environment setup instructions.',
          details: 'Collaborators can view current branch structures, repository activity, and commit history.'
        },
        {
          title: 'Tab 4: Team Chat Room',
          description: 'Dedicated real-time group chat exclusively for the project team.',
          details: 'Share code snippets, discuss architectural decisions, coordinate pairing sessions, and get immediate answers from teammates without switching apps.'
        },
        {
          title: 'Tab 5: Releases & Changelog',
          description: 'Track version tags (v1.0.0, v1.1.0, etc.) and deployment milestones.',
          details: 'Document release notes, changelog updates, and links to live staging/production demos or APK/binary downloads.'
        },
        {
          title: 'Tab 6: Journey & Growth',
          description: 'Document your personal engineering contributions, technical challenges overcome, and skill progression.',
          details: 'Track "Skills & Technologies" with Before & After proficiency badges (e.g. Beginner → Intermediate). These insights can be exported to your portfolio!'
        },
        {
          title: 'Tab 7: Celebration & Accolades',
          description: 'When the project reaches 100% completion or key milestones are shipped, the celebration tab unlocks!',
          details: 'Features team shoutouts, completion accolades, project badges, and summary statistics to celebrate your shared success.'
        }
      ],
      proTip: 'Always assign tasks to a specific team member with a realistic due date. This feeds into the Calendar and deadline reminder system!'
    },
    {
      id: 'messages',
      category: 'messages',
      badge: 'Step 6: Communication',
      title: 'How to Direct Message & Use Real-Time Chat',
      subtitle: 'Seamless, instant 1-on-1 and group communication across the entire platform.',
      steps: [
        {
          title: 'Opening Direct Messages',
          description: 'Click "Messages" in the navigation bar or access it from any user\'s profile or application card.',
          actionLink: '/messages',
          actionText: 'Open Direct Messages'
        },
        {
          title: 'Real-Time Socket Connection',
          description: 'Messages are delivered in real time with WebSocket technology. You will see instant message bubbles, delivery timestamps, and unread badges.',
          details: 'If you are offline, unread indicators will alert you when you return.'
        },
        {
          title: 'The Floating Quick-Chat Widget',
          description: 'Notice the circular chat icon at the bottom right corner of your screen? Click it anytime to open a floating chat window.',
          details: 'You can chat with teammates, reply to inquiries, or check active conversations without leaving the page you are currently working on.'
        }
      ],
      proTip: 'Use Direct Messages for 1-on-1 discussions and interviews, and use the Workspace Chat tab for shared team-wide updates.'
    },
    {
      id: 'calendar',
      category: 'calendar',
      badge: 'Step 7: Deadlines & Scheduling',
      title: 'How the Calendar & Deadline Alerts Work',
      subtitle: 'Never miss a deliverable. Automatically sync all task due dates and milestone schedules.',
      steps: [
        {
          title: 'The Unified Interactive Calendar',
          description: 'Click "Calendar" in the navigation bar to see a full monthly/weekly view.',
          details: 'The calendar aggregates all tasks and milestones across every project you own or have joined into a single view.',
          actionLink: '/calendar',
          actionText: 'Open My Calendar'
        },
        {
          title: 'Task Indicators & Bullet Points',
          description: 'Each day cell shows task items as clean bullet points. Click any task to view its details, urgency, and linked project.',
          details: 'Overdue tasks are flagged with prominent red status alerts, while upcoming tasks show their scheduled due date.'
        },
        {
          title: 'Upcoming Events Panel',
          description: 'The right-hand sidebar organizes your schedule into "Next 7 Days" and "Upcoming This Month" for rapid prioritization.',
          details: 'Click "Open Task →" to jump straight into the corresponding project Workspace with that task focused.'
        },
        {
          title: 'Customizing Notification Triggers',
          description: 'Go to Account > Notification Settings to configure when you want to receive alerts.',
          details: 'Toggle reminders for 3 days before, 1 day before, 1 hour before, and when a task becomes overdue.',
          actionLink: '/account',
          actionText: 'Configure Notifications'
        }
      ],
      proTip: 'Check your Calendar every Monday morning to plan your sprints and team deliverables effectively!'
    },
    {
      id: 'archive',
      category: 'archive',
      badge: 'Step 8: Portfolio & Growth',
      title: 'How to Leverage the Learning Archive & Portfolio',
      subtitle: 'Turn your collaborative coding experience into tangible proof for job interviews and resume building.',
      steps: [
        {
          title: 'Building Your Account Profile',
          description: 'Visit "Account" to manage your public persona. Add your bio, job title, social handles (GitHub, LinkedIn, Portfolio), and primary skills.',
          details: 'A complete profile increases your chance of getting accepted into top projects by 3x.',
          actionLink: '/account',
          actionText: 'Edit My Profile'
        },
        {
          title: 'The Learning Archive',
          description: 'Click "Learning Archive" to browse a curated repository of notes, learnings, resources, and technical takeaways saved from completed projects.',
          details: 'Search by tag or topic to recall how you configured specific libraries, tackled tricky bugs, or set up CI/CD pipelines in past projects.',
          actionLink: '/learning-archive',
          actionText: 'Explore Learning Archive'
        },
        {
          title: 'Showcasing Completed Projects',
          description: 'When projects reach completion, pin them as "Featured Projects" in your profile.',
          details: 'Future collaborators and hiring managers can see the live demo link, repository, and your documented Journey growth.'
        }
      ],
      proTip: 'Document challenges as they happen in the Workspace Journey tab. It\'s much easier than trying to remember what you built 6 months later!'
    }
  ];

  const faqs = [
    {
      q: 'How do I know if my project application was accepted?',
      a: 'When a project owner accepts your application, you will receive an in-app notification, and the status in your "Applications" page will change to "Accepted". You will also automatically gain access to the private Workspace for that project!'
    },
    {
      q: 'Can I apply to multiple projects simultaneously?',
      a: 'Yes! You can apply to as many projects as match your skills and interests. You can view and manage all your pending applications in the Applications tab.'
    },
    {
      q: 'How do I invite someone specific to join my project?',
      a: 'Share your project link with them directly, or find them via Direct Messages and send them the link to your project detail page where they can submit their role application with one click.'
    },
    {
      q: 'What happens when a project is marked as "Completed"?',
      a: 'Once all tasks and milestones are delivered, the owner can update the project status to "Completed". The team unlocks the Celebration tab with completion badges, and all contributors can feature the project on their profiles and export their Journey notes.'
    },
    {
      q: 'Can I leave a project if my availability changes?',
      a: 'Yes. Communicate with the project owner first via Workspace Chat or Direct Messages, then request removal from the roster so they can re-open your position for new contributors.'
    },
    {
      q: 'How do task deadlines show up on my calendar?',
      a: 'Any task created in a Workspace that is assigned to you with a due date automatically syncs to your personal Calendar in real-time. You don\'t need to manually configure anything!'
    },
    {
      q: 'How do I switch between Dark and Light mode?',
      a: 'Click the sun/moon icon located on the right side of the top navigation bar anytime. Your preference is automatically saved to your browser.'
    },
    {
      q: 'Is ProjectForge free for open-source teams?',
      a: 'Yes, ProjectForge is completely free for developers, students, and open-source creators to collaborate, learn, and build impactful projects together.'
    }
  ];

  // Filtering logic
  const filteredTutorials = useMemo(() => {
    let result = tutorials;
    if (activeCategory !== 'all' && activeCategory !== 'faq' && activeCategory !== 'contact') {
      result = result.filter(t => t.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(q) ||
        t.subtitle.toLowerCase().includes(q) ||
        t.badge.toLowerCase().includes(q) ||
        t.steps.some(s => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || (s.details && s.details.toLowerCase().includes(q)))
      );
    }
    return result;
  }, [tutorials, activeCategory, searchQuery]);

  const filteredFaqs = useMemo(() => {
    if (activeCategory !== 'all' && activeCategory !== 'faq') return [];
    if (!searchQuery.trim()) return faqs;
    const q = searchQuery.toLowerCase();
    return faqs.filter(f => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q));
  }, [faqs, activeCategory, searchQuery]);

  const handleSupportSubmit = (e) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setIsSubmitting(true);
    // Simulate support ticket submission
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success('Your support inquiry has been submitted! Our team will respond shortly.');
      setContactName('');
      setContactEmail('');
      setContactMessage('');
    }, 800);
  };

  return (
    <div className="help-page">
      <PageHeader 
        title="Help & Support"
        actions={
          <div className="help-header-actions">
            <a href="#contact-support" className="help-header-btn">
              <Mail style={{ width: 15, height: 15 }} />
              Contact Support
            </a>
          </div>
        }
      />

      {/* Hero Search & Quick Intro */}
      <section className="help-hero">
        <div className="help-hero__content">
          <h1 className="help-hero__heading">Everything you need to build, collaborate & ship</h1>
          <p className="help-hero__subheading">
            Explore comprehensive step-by-step tutorials covering project discovery, team recruiting, workspace tools, real-time messaging, task management, and portfolio building.
          </p>

          <div className="help-search-container">
            <Search className="help-search-icon" />
            <input
              type="text"
              className="help-search-input"
              placeholder="Search tutorials, features, workflows (e.g. 'Kanban', 'Apply', 'Workspace', 'Invite')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                type="button" 
                className="help-search-clear"
                onClick={() => setSearchQuery('')}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Category Pills Bar */}
      <div className="help-categories-bar">
        <div className="help-categories-scroll">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                className={`help-cat-pill ${isActive ? 'is-active' : ''}`}
                onClick={() => {
                  setActiveCategory(cat.id);
                  if (cat.id === 'contact') {
                    const el = document.getElementById('contact-support');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  } else if (cat.id === 'faq') {
                    const el = document.getElementById('faq-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tutorials Grid / List */}
      {(activeCategory === 'all' || (activeCategory !== 'faq' && activeCategory !== 'contact')) && (
        <section className="help-tutorials-section">
          {filteredTutorials.length === 0 ? (
            <div className="help-empty-state">
              <HelpCircle className="help-empty-icon" />
              <h3>No matching tutorials found</h3>
              <p>Try searching for a different keyword or reset your category filter.</p>
              <button 
                type="button" 
                className="btn-help-secondary"
                onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="help-tutorials-list">
              {filteredTutorials.map((tut, index) => (
                <article key={tut.id} className="help-card" id={`tutorial-${tut.id}`}>
                  <header className="help-card__header">
                    <div className="help-card__meta">
                      <span className="help-card__badge">{tut.badge}</span>
                      <span className="help-card__index">Module {index + 1} of {tutorials.length}</span>
                    </div>
                    <h2 className="help-card__title">{tut.title}</h2>
                    <p className="help-card__subtitle">{tut.subtitle}</p>
                  </header>

                  <div className="help-steps-container">
                    {tut.steps.map((step, sIdx) => (
                      <div key={sIdx} className="help-step-item">
                        <div className="help-step-number">{sIdx + 1}</div>
                        <div className="help-step-body">
                          <h4 className="help-step-title">{step.title}</h4>
                          <p className="help-step-desc">{step.description}</p>
                          {step.details && (
                            <p className="help-step-details">{step.details}</p>
                          )}
                          {step.actionLink && (
                            <Link to={step.actionLink} className="help-step-action-btn">
                              {step.actionText}
                              <ArrowRight style={{ width: 14, height: 14 }} />
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {tut.proTip && (
                    <div className="help-protip-box">
                      <div className="help-protip-icon">
                        <Lightbulb style={{ width: 18, height: 18 }} />
                      </div>
                      <div className="help-protip-content">
                        <strong>Pro Tip:</strong> {tut.proTip}
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* FAQ Section */}
      {(activeCategory === 'all' || activeCategory === 'faq') && (
        <section className="help-faq-section" id="faq-section">
          <div className="help-section-heading">
            <span className="help-section-tag">
              <HelpCircle style={{ width: 14, height: 14 }} />
              Quick Answers
            </span>
            <h2>Frequently Asked Questions</h2>
            <p>Immediate solutions for common collaboration and project questions.</p>
          </div>

          <div className="help-faq-list">
            {filteredFaqs.map((faq, fIdx) => {
              const isOpen = expandedFaq === fIdx;
              return (
                <div 
                  key={fIdx} 
                  className={`help-faq-item ${isOpen ? 'is-open' : ''}`}
                >
                  <button 
                    type="button" 
                    className="help-faq-trigger"
                    onClick={() => setExpandedFaq(isOpen ? null : fIdx)}
                  >
                    <span className="help-faq-q">{faq.q}</span>
                    <ChevronDown className={`help-faq-arrow ${isOpen ? 'is-rotated' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="help-faq-body">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Contact & Support Form */}
      {(activeCategory === 'all' || activeCategory === 'contact') && (
        <section className="help-contact-section" id="contact-support">
          <div className="help-contact-grid">
            <div className="help-contact-info">
              <span className="help-section-tag">
                <Mail style={{ width: 14, height: 14 }} />
                Get in Touch
              </span>
              <h2>Need additional assistance?</h2>
              <p>
                Have a question that wasn't answered in the guides, encountered an unexpected bug, or need help managing your project team? Drop us a message and our support team will get back to you.
              </p>

              <div className="help-support-features">
                <div className="help-feat-item">
                  <CheckCircle2 className="help-feat-icon" />
                  <div>
                    <strong>Fast Turnaround</strong>
                    <p>We typically review and respond within 24 hours.</p>
                  </div>
                </div>
                <div className="help-feat-item">
                  <ShieldAlert className="help-feat-icon" />
                  <div>
                    <strong>Team & Dispute Support</strong>
                    <p>Assistance with project ownership, transfer, or member disputes.</p>
                  </div>
                </div>
                <div className="help-feat-item">
                  <Sparkles className="help-feat-icon" />
                  <div>
                    <strong>Feature Suggestions</strong>
                    <p>We actively build features requested directly by developers.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="help-contact-card">
              <form onSubmit={handleSupportSubmit} className="help-contact-form">
                <div className="help-form-row">
                  <div className="help-form-group">
                    <label htmlFor="contact-name">Your Name *</label>
                    <input
                      id="contact-name"
                      type="text"
                      className="help-form-input"
                      placeholder="e.g. Alex Morgan"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="help-form-group">
                    <label htmlFor="contact-email">Email Address *</label>
                    <input
                      id="contact-email"
                      type="email"
                      className="help-form-input"
                      placeholder="alex@example.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="help-form-group">
                  <label htmlFor="contact-subject">Inquiry Topic</label>
                  <select
                    id="contact-subject"
                    className="help-form-select"
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                  >
                    <option value="Technical Issue">Technical Issue</option>
                    <option value="Collaboration & Team Help">Collaboration & Team Help</option>
                    <option value="Project Applications & Invites">Project Applications & Invites</option>
                    <option value="Workspace & Kanban Board">Workspace & Kanban Board</option>
                    <option value="Bug Report">Bug Report</option>
                    <option value="Feature Request">Feature Request</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="help-form-group">
                  <label htmlFor="contact-message">Message Details *</label>
                  <textarea
                    id="contact-message"
                    rows={4}
                    className="help-form-textarea"
                    placeholder="Describe what you need help with or what occurred..."
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn-help-submit"
                  disabled={isSubmitting}
                >
                  <Send style={{ width: 16, height: 16 }} />
                  {isSubmitting ? 'Sending inquiry...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

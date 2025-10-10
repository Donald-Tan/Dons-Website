import React, { useState } from "react";
import {
  Code,
  MapPin,
  TrendingUp,
  Users,
  LayoutDashboardIcon,
  Database,
  Brush,
  Bug,
  Rocket,
  Calendar,
} from "lucide-react";

const Work = () => {
  return (
    <section id="work" className="work-section">
      <div className="work-wrapper">
        <div className="work-intro">
          <h2 className="work-main-title">Work Experience</h2>
          <p className="work-tagline">
            From a gym assistant to a full-stack developer, Donald's journey in
            the world of work has been a testament to his dedication and
            commitment to excellence. Through his experiences, he has honed his
            skills in problem-solving, communication, and teamwork, enabling him
            to contribute effectively to diverse projects.
          </p>
        </div>

        <div className="work-content">
          <WorkExperienceCard />
        </div>
      </div>
    </section>
  );
};

const WorkExperienceCard = () => {
  const [selectedView, setSelectedView] = useState("overview");
  const [isExpanded, setIsExpanded] = useState(false);

  const responsibilities = [
    {
      icon: <Code size={20} />,
      title: "Full-Stack Development",
      description:
        "Built and deployed a responsive dental clinic website using React, Vite, and Tailwind CSS, hosted on Vercel for optimal performance",
    },
    {
      icon: <MapPin size={20} />,
      title: "API Integration",
      description:
        "Integrated Google Maps API and Elfsight API for clinic location services and patient testimonials to enhance user experience",
    },
    {
      icon: <TrendingUp size={20} />,
      title: "Data Analytics",
      description:
        "Implemented data visualizations with Recharts to track performance trends and enhance clinic analytics",
    },
    {
      icon: <Users size={20} />,
      title: "Agile Collaboration",
      description:
        "Collaborated with a partner using Scrum timeline, conducting weekly sprints and standups for efficient project delivery",
    },
    {
      icon: <LayoutDashboardIcon size={20} />,
      title: "Dashboard Management",
      description:
        "Created a dashboard for clinic administration, streamlining operations",
    },
    {
      icon: <Database size={20} />,
      title: "Database Integration",
      description:
        "Integrated MongoDB for efficient data storage and retrieval, ensuring scalability and security",
    },
  ];

  const tools = [
    "React",
    "Vite",
    "Tailwind",
    "MongoDB",
    "Node.js",
    "Vercel",
    "Recharts",
    "Git",
  ];

  const timeline = [
    {
      phase: "Planning & Discovery",
      duration: "Week 1",
      description:
        "Initial client meetings, requirements gathering, and project scope definition with weekly SCRUM sessions",
      icon: <LayoutDashboardIcon size={18} />,
    },
    {
      phase: "Design & Architecture",
      duration: "Week 2",
      description:
        "UI/UX wireframing, database schema design, and tech stack finalization",
      icon: <Brush size={18} />,
    },
    {
      phase: "Frontend Development",
      duration: "Week 3-5",
      description: "Frontend development with React, Vite, and Tailwind CSS",
      icon: <Code size={18} />,
    },
    {
      phase: "Backend Development",
      duration: "Week 6-8",
      description:
        "Backend development with Node.js, Express, and MongoDB, ensuring scalability and security",
      icon: <Database size={18} />,
    },
    {
      phase: "Debug, Testing & Review",
      duration: "Week 9-11",
      description:
        "Quality assurance, client feedback integration, and performance optimization",
      icon: <Bug size={18} />,
    },
    {
      phase: "Launch & Deployment",
      duration: "Week 12",
      description:
        "Final deployment on Vercel with continuous monitoring and post-launch support",
      icon: <Rocket size={18} />,
    },
  ];

  return (
    <div className="work-card">
      <div className="work-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="work-title-section">
          <h3 className="work-position">Full-Stack Developer</h3>
          <p className="work-company">Monroe Denture Clinic Website</p>
          <div className="work-meta">
            <span className="work-date">
              <Calendar size={14} />
              March 2025 – June 2025
            </span>
            <span className="work-location">
              <MapPin size={14} />
              Monroe, WA
            </span>
          </div>
        </div>
      </div>

      <div className={`work-tabs ${isExpanded ? "show" : ""}`}>
        <button
          className={`work-tab ${selectedView === "overview" ? "active" : ""}`}
          onClick={() => setSelectedView("overview")}
        >
          Overview
        </button>
        <button
          className={`work-tab ${selectedView === "tools" ? "active" : ""}`}
          onClick={() => setSelectedView("tools")}
        >
          Tech Stack
        </button>
        <button
          className={`work-tab ${selectedView === "timeline" ? "active" : ""}`}
          onClick={() => setSelectedView("timeline")}
        >
          Timeline
        </button>
      </div>

      <div className={`work-body ${isExpanded ? "show" : ""}`}>
        {selectedView === "overview" && (
          <div className="work-overview">
            <div className="work-responsibilities">
              {responsibilities.map((item, idx) => (
                <div key={idx} className="responsibility-item">
                  <div className="responsibility-icon">{item.icon}</div>
                  <div className="responsibility-content">
                    <h4 className="responsibility-title">{item.title}</h4>
                    <p className="responsibility-desc">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedView === "tools" && (
          <div className="work-tools">
            <div className="tools-grid">
              {tools.map((tool, idx) => (
                <div key={idx} className="tool-badge">
                  {tool}
                </div>
              ))}
            </div>
            <div className="tools-description">
              <p>
                Leveraged modern web technologies to build a scalable,
                performant, and user-friendly application. The tech stack was
                carefully selected to ensure rapid development, excellent
                developer experience, and optimal end-user performance.
              </p>
            </div>
          </div>
        )}

        {selectedView === "timeline" && (
          <div className="work-timeline">
            <div className="timeline-grid">
              {timeline.map((item, idx) => (
                <div key={idx} className="timeline-card">
                  <div className="timeline-card-header">
                    <div className="timeline-icon">{item.icon}</div>
                    <div className="timeline-number">
                      <span>{String(idx + 1).padStart(2, "0")}</span>
                    </div>
                  </div>
                  <div className="timeline-card-body">
                    <h4 className="timeline-phase">{item.phase}</h4>
                    <p className="timeline-duration">{item.duration}</p>
                    <p className="timeline-desc">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="timeline-summary">
              <h4 className="timeline-summary-title">Agile Methodology</h4>
              <p>
                Adopted an Agile Scrum framework with bi-weekly sprints, daily
                standups, and iterative development cycles. This approach
                ensured consistent progress, rapid feedback integration, and
                successful project delivery within the 16-week timeline.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Work;

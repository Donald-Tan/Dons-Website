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
            From leading a team of 12+ developers on a mental health platform to
            crafting full-stack solutions for healthcare clients, Donald has
            grown from building individual features to architecting entire
            systems. His journey reflects a commitment to creating meaningful
            digital experiences that directly impact users' lives, whether
            through accessible mental health tools or streamlined clinic
            operations.
          </p>
        </div>

        <div className="work-content">
          <MonroeExperienceCard />
          <ICareExperienceCard />
        </div>
      </div>
    </section>
  );
};

const MonroeExperienceCard = () => {
  const [selectedView, setSelectedView] = useState("overview");
  const [isExpanded, setIsExpanded] = useState(false);

  const responsibilities = [
    {
      icon: <Code size={20} />,
      title: "Full-Stack Development",
      description:
        "Designed and deployed responsive full-stack clinic website using React, Vite, Tailwind CSS, and Vercel with MongoDB backend, managing ~100 monthly visitors and 300+ appointment requests with 95%+ uptime",
    },
    {
      icon: <TrendingUp size={20} />,
      title: "SEO & Analytics Integration",
      description:
        "Integrated Google Maps, Elfsight APIs, and Google Analytics achieving 65% conversion rate increase and 120% organic traffic growth through comprehensive SEO optimization and Core Web Vitals improvements",
    },
    {
      icon: <LayoutDashboardIcon size={20} />,
      title: "Admin Dashboard",
      description:
        "Built admin dashboard with appointment management, automated email/SMS notifications, payment integration, and Recharts analytics, reducing administrative overhead by 40%",
    },
    {
      icon: <Rocket size={20} />,
      title: "Agile Development",
      description:
        "Deployed 30+ feature updates in bi-weekly sprints, collaborating directly with clinic stakeholders in weekly sprint reviews to prioritize features and iterate on design improvements",
    },
    {
      icon: <Database size={20} />,
      title: "Database Management",
      description:
        "Integrated MongoDB for efficient data storage and retrieval, handling appointment requests, patient data, and clinic analytics with high reliability",
    },
    {
      icon: <Users size={20} />,
      title: "Stakeholder Collaboration",
      description:
        "Worked directly with clinic stakeholders to gather feedback, prioritize feature development, and ensure alignment with business objectives",
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
              Aug 2024 – Jun 2025
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

const ICareExperienceCard = () => {
  const [selectedView, setSelectedView] = useState("overview");
  const [isExpanded, setIsExpanded] = useState(false);

  const responsibilities = [
    {
      icon: <Users size={20} />,
      title: "Team Leadership",
      description:
        "Leading frontend development for dual AI mental health chatbot platform, managing and onboarding 12+ student developers while collaborating with research faculty in Agile environment",
    },
    {
      icon: <Brush size={20} />,
      title: "Platform Redesign",
      description:
        "Spearheaded complete V2 to V3 platform redesign based on IRB-approved user studies, implementing conversation history, context retention, personalized dashboards, and progress tracking—achieving 40% improvement in user satisfaction scores",
    },
    {
      icon: <Code size={20} />,
      title: "Core Features",
      description:
        "Architected theme switching (dark/light/system), real-time WebSocket messaging with reconnection logic, and accessible UI following WCAG 2.1 guidelines, conducting A/B testing to optimize user flows",
    },
    {
      icon: <TrendingUp size={20} />,
      title: "Performance Optimization",
      description:
        "Engineered performance optimizations via code splitting, lazy loading, and caching strategies that reduced load times by 45%, while establishing React Testing Library infrastructure achieving 80%+ code coverage",
    },
    {
      icon: <LayoutDashboardIcon size={20} />,
      title: "Component Library",
      description:
        "Developed reusable component library with documentation and CI/CD pipelines with Docker containerization, reducing development time through standardized patterns",
    },
    {
      icon: <Rocket size={20} />,
      title: "Quality Assurance",
      description:
        "Established rigorous code review processes and testing infrastructure to maintain high code quality and ensure platform reliability for mental health users",
    },
  ];

  const tools = [
    "React",
    "TypeScript",
    "WebSockets",
    "Docker",
    "Testing Library",
    "WCAG 2.1",
    "CI/CD",
    "Figma",
  ];

  const timeline = [
    {
      phase: "Team Building & Onboarding",
      duration: "Sept 2023 - Dec 2023",
      description:
        "Onboarded 12+ student developers, established Agile workflows, and coordinated with research faculty to define platform goals",
      icon: <Users size={18} />,
    },
    {
      phase: "User Research & Planning",
      duration: "Jan 2024 - Mar 2024",
      description:
        "Conducted IRB-approved user studies, analyzed feedback, and planned V3 redesign with focus on conversation history and personalization",
      icon: <LayoutDashboardIcon size={18} />,
    },
    {
      phase: "V3 Platform Redesign",
      duration: "Apr 2024 - Aug 2024",
      description:
        "Led complete frontend overhaul implementing personalized dashboards, progress tracking, and context retention features",
      icon: <Brush size={18} />,
    },
    {
      phase: "Accessibility & Testing",
      duration: "Sept 2024 - Dec 2024",
      description:
        "Implemented WCAG 2.1 guidelines, conducted A/B testing, and established comprehensive testing infrastructure with 80%+ coverage",
      icon: <Code size={18} />,
    },
    {
      phase: "Performance & Optimization",
      duration: "Jan 2025 - Present",
      description:
        "Optimized load times through code splitting and caching, achieving 45% performance improvement while maintaining component library",
      icon: <TrendingUp size={18} />,
    },
  ];

  return (
    <div className="work-card">
      <div className="work-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="work-title-section">
          <h3 className="work-position">Frontend Lead</h3>
          <p className="work-company">UW iCare Mental Health Platform</p>
          <div className="work-meta">
            <span className="work-date">
              <Calendar size={14} />
              Sept 2023 – Present
            </span>
            <span className="work-location">
              <MapPin size={14} />
              University of Washington
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
                Built with accessibility, performance, and user experience at
                the forefront. Leveraged modern React patterns, real-time
                communication, and comprehensive testing to create a reliable
                mental health platform that serves vulnerable users.
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
              <h4 className="timeline-summary-title">Ongoing Development</h4>
              <p>
                Continuous iteration and improvement based on user feedback and
                research findings. Working closely with faculty researchers and
                student developers to evolve the platform and expand its
                capabilities while maintaining high standards for accessibility
                and performance.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Work;

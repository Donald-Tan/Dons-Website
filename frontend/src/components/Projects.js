import React, { useState, useEffect } from "react";
import { Code, Calendar, X } from "lucide-react";

const Projects = () => {
  return (
    <section id="projects" className="projects-section">
      <div className="projects-intro">
        <Code className="projects-icon-large" />
        <h2 className="projects-main-title">Projects</h2>
      </div>
      <ProjectsGrid />
    </section>
  );
};

const ProjectsGrid = () => {
  const [selectedProject, setSelectedProject] = useState(null);

  const projects = [
    {
      year: "2025",
      title: "Robinhood Tracer",
      subtitle: "Portfolio Tracking WebApp",
      tech: "Python · Pandas · NumPy · SQLAlchemy",
      color: "#f59e0b",
      description: `Built a full-stack web app integrating with the Robin_Stocks API to display trades, portfolio positions, and performance history.
Processed and analyzed historical stock data using Python (Pandas & NumPy) to generate time-series simulations and performance insights.
Implemented portfolio visualization with interactive charts to highlight trends and historical performance.
Designed a database layer (SQLite via SQLAlchemy) to persist trades and reduce redundant API calls.
Planned multi-user support to enable authenticated users to compare portfolios.`,
    },
    {
      year: "2025",
      title: "CommUnity",
      subtitle: "Social Networking App",
      tech: "React Native · Node.js · MySQL · Firebase",
      color: "#6366f1",
      description: `Designed and developed a mobile social networking app using React Native.
Targeted students and professionals within verified domains for private community building.
Core features: club creation/joining, interest-based discussion groups, swipe-based matching, and real-time notifications.
Backend: Node.js, Express, MySQL, and Firebase for media storage & authentication.
Built interactive UX/UI including home pages, group chats, profile customization, and notifications.`,
    },
    {
      year: "2025",
      title: "CalCenter",
      subtitle: "Fitness & Nutrition Tracker",
      tech: "React Native · Express · MySQL",
      color: "#10b981",
      description: `Built a full-stack fitness tracking app with a React Native frontend and Node.js + Express backend connected to MySQL.
Designed database schema for users, activities, meals, recipes, and logs.
Features: detailed calorie tracking, personalized insights, secure login/signup, activity/meal logging.
Created dynamic nutrition logging with custom recipes, real-time calorie computation, and historical log retrieval.`,
    },
    {
      year: "2024",
      title: "Enrollment System",
      subtitle: "Backend Architecture",
      tech: "C++ · OOP · Hash Maps",
      color: "#8b5cf6",
      description: `Developed backend system with Student, Course, and University classes for enrollment.
Supported adding/removing universities, students, and courses.
Enabled bi-directional enrollment tracking using hash maps for fast access.
Focused on efficient memory management and OOP design principles.`,
    },
    {
      year: "2024",
      title: "Thumb-2 Assembly Project",
      subtitle: "Low-Level Programming",
      tech: "ARM Assembly · System Calls",
      color: "#ef4444",
      description: `Implemented memory/time-related C library functions (bzero, strncpy, malloc, free, signal, alarm) in Thumb-2 assembly.
Integrated buddy memory allocation for efficient dynamic memory management.
Worked with system calls, interrupt handling, and ARM Procedure Call Standard (APCS) for C-assembly argument passing.`,
    },
    {
      year: "2023",
      title: "Text-Based Adventure Game",
      subtitle: "Interactive Fiction",
      tech: "Java · Data Structures",
      color: "#06b6d4",
      description: `Built a command-line adventure game inspired by Eric Roberts's project.
Designed robust data structures to handle rooms, items, and player actions.
Implemented file input/output to load story configurations dynamically, allowing easy expansion of the game world.
Applied generics and abstraction to build reusable components for command handling and inventory management.
Learned how to balance gameplay logic with data-driven design for scalability.`,
    },
    {
      year: "2023",
      title: "Huffman Coding Tool",
      subtitle: "Compression Algorithm",
      tech: "Java · Binary Trees",
      color: "#ec4899",
      description: `Implemented a file compression and decompression system using Huffman Coding.
Analyzed character frequencies in large text files to construct optimal binary trees.
Designed a bit-level encoder and decoder capable of handling variable-length codes.
Compared compression ratios across different file types to evaluate algorithm performance.
Strengthened understanding of information theory, tree structures, and frequency-based algorithms.`,
    },
  ];

  return (
    <>
      <div className="projects-grid">
        {projects.map((project, idx) => (
          <div
            key={idx}
            className="project-grid-card"
            onClick={() => setSelectedProject(project)}
            style={{ "--accent-color": project.color }}
          >
            <div className="project-year-badge">
              <Calendar size={14} />
              {project.year}
            </div>
            <h3 className="project-grid-title">{project.title}</h3>
            <p className="project-grid-subtitle">{project.subtitle}</p>
            <p className="project-grid-tech">{project.tech}</p>
          </div>
        ))}
      </div>

      {selectedProject && (
        <ProjectModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </>
  );
};

const ProjectModal = ({ project, onClose }) => {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <div className="project-modal-overlay" onClick={onClose}>
      <div
        className="project-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ "--accent-color": project.color }}
      >
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="modal-header">
          <h2 className="modal-title">{project.title}</h2>
          <p className="modal-subtitle">{project.subtitle}</p>
        </div>

        <div className="modal-body">
          <div className="modal-description">
            {project.description.split("\n").map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <p className="modal-tech">{project.tech}</p>
        </div>
      </div>
    </div>
  );
};

export default Projects;

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import profileImage from "../assets/profile.png";

export default function About() {
  const timelineRef = useRef(null);

  const timeline = [
    {
      year: "2021",
      title: "High School Graduate",
      place: "Miri, Malaysia",
    },
    {
      year: "2021",
      title: "Moved to USA",
      place: "Started at Seattle Central College",
    },
    {
      year: "2023",
      title: "Associate Degree",
      place: "Computer Science, Seattle Central",
    },
    {
      year: "2023",
      title: "University of Washington",
      place: "Pursuing Bachelor's Degree",
    },
    {
      year: "2025",
      title: "Bachelor's Degree",
      place: "Computer Science, UW",
    },
  ];

  const skillsData = {
    Code: [
      "JavaScript",
      "TypeScript",
      "Java",
      "Python",
      "Pandas & NumPy",
      "C++",
      "React",
      "React Native",
      "Next.js",
      "Node.js",
      "Express.js",
      "MongoDB",
      "Firebase",
      "MySQL",
      "SQLAlchemy",
      "Git",
      "Docker",
      "HTML",
      "CSS",
      "Tailwind CSS",
      "Vite",
      "Axios",
      "REST APIs",
      "Flask",
    ],
    "Tools & Practices": [
      "Figma",
      "Postman",
      "GitHub",
      "Slack",
      "Agile/Scrum",
      "Microsoft 365",
      "Google Workspace",
    ],
  };

  useEffect(() => {
    const observerOptions = {
      threshold: 0.2,
      rootMargin: "0px 0px -100px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const items = entry.target.querySelectorAll(".timeline-item");
          items.forEach((item) => {
            item.classList.add("animate");
          });
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    if (timelineRef.current) {
      observer.observe(timelineRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="about-hero-content"
        >
          <div className="profile-image">
            <img
              src={profileImage}
              alt="Donald Tan"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "50%",
              }}
            />
          </div>
        </motion.div>
      </section>

      {/* Story Section */}
      <section className="about-story">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="story-text">
            Originally from Malaysia, now living in the United States for the
            past five years. My journey started with a fascination for
            technology; growing up, I was always the kid who wanted to try the
            latest gadget or explore how things worked behind the screen. That
            curiosity eventually led me to pursue both my Associate's degree at
            Seattle Central College and a Bachelor's in Computer Science and
            Computer Engineering at the University of Washington.
          </p>
          <p className="story-text">
            I'm passionate about building meaningful digital experiences, which
            is why I'm currently pursuing a career as a web developer. To me,
            web development is the perfect blend of creativity and technology —
            it's where ideas turn into interactive experiences that people can
            actually use. One of my favorite projects was a contract role with
            Monroe Denture Clinic, where I helped design and develop a
            functional, modern website for a local business. It taught me the
            value of using tech to make a real-world impact.
          </p>
          <p className="story-text">
            What drives me most is the desire to leave an impact. I live by the
            saying "You only live once," and I want to make that one life count
            — whether through tech, leadership, or inspiring others. I see
            myself growing into a project manager, leading teams to bring
            ambitious ideas to life.
          </p>
          <p className="story-text">
            Beyond coding, I'm someone who believes life is meant to be
            experienced. I'm a Manchester United fan, love fashion, R&B and rap
            music, and enjoy creating YouTube videos that let me express my
            creative side in different ways. I've also traveled to over ten
            countries so far, and every trip reminds me how big the world is —
            and how much there's still to learn.
          </p>
        </motion.div>
      </section>

      {/* Timeline Section */}
      <section className="about-timeline">
        <h2 className="section-title">Journey</h2>
        <div className="timeline-container" ref={timelineRef}>
          {timeline.map((item, index) => (
            <div key={index} className="timeline-item">
              <span className="timeline-year">{item.year}</span>
              <div className="timeline-content">
                <h3>{item.title}</h3>
                <p>{item.place}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Skills Section */}
      <section className="about-skills">
        <h2 className="section-title">Skills</h2>
        <div className="skills-categories">
          {Object.entries(skillsData).map(([category, skills], catIndex) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: catIndex * 0.2 }}
              className="skills-category"
            >
              <h3>{category}</h3>
              <div className="skills-cloud">
                {skills.map((skill, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                    className="skill-tag"
                  >
                    {skill}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}

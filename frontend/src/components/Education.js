import React from "react";
import uwImage from "../assets/uw.png";
import sccImage from "../assets/scc.png";

const Education = () => {
  return (
    <section id="education" className="education-section">
      <div className="education-wrapper">
        <div className="education-intro">
          <h2 className="edu-main-title">Academic Background</h2>
          <p className="edu-tagline">
            Donald's academic journey began at Seattle Central College in 2021,
            immersing himself in the foundational courses needed to transfer to
            the University of Washington. There, he focused intensely on
            mastering core concepts while preparing for the next stage of his
            education. At UW, he dove into higher-level courses, tackling
            real-world projects that sharpened his technical skills and explored
            modern technologies shaping today's industry. Driven by curiosity
            and a passion for building impactful digital experiences, he honed
            the tools and knowledge needed to innovate in practical settings.
            From fundamental courses to advanced projects, his academic journey
            reflects a commitment to growth, skill development, and bridging the
            gap between theory and real-world application.
          </p>
        </div>

        <div className="education-cards">
          <EducationCard
            name="University of Washington"
            image={uwImage}
            degree="B.S. Computer Science & Software Engineering"
            years="2023 – 2025"
            gpa="3.55"
            courses={[
              "Data Structures & Algorithms",
              "AI & Machine Learning",
              "Database & Web Systems",
              "Operating Systems",
              "Computer Organization",
              "Cybersecurity",
            ]}
          />

          <EducationCard
            name="Seattle Central College"
            image={sccImage}
            degree="A.S. Computer Science"
            years="2021 – 2023"
            gpa="3.89"
            courses={[
              "Python & Java Programming",
              "Object-Oriented Design",
              "Calculus I & II",
              "Engineering Physics",
            ]}
          />
        </div>
      </div>
    </section>
  );
};

const EducationCard = ({ name, image, degree, years, gpa, courses }) => {
  return (
    <div className="edu-card">
      <div className="edu-bg">
        <img src={image} alt={name} />
      </div>
      <div className="edu-content">
        <h3 className="edu-name">{name}</h3>
        <p className="edu-degree">{degree}</p>
        <p className="edu-meta">
          {years} · GPA: {gpa}
        </p>
        <div className="courses-section">
          <p className="courses-label">Key Coursework:</p>
          <ul className="courses-list">
            {courses.map((course, idx) => (
              <li key={idx}>{course}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Education;

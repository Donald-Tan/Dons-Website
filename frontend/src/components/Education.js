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
            Donald began his academic journey at Seattle Central College in
            2021, where he built a strong foundation in computer science before
            transferring to the University of Washington. At UW, he expanded his
            knowledge through advanced coursework and hands-on projects that
            connected theory to real-world application. Guided by curiosity and
            a passion for creating meaningful digital experiences, he developed
            the technical and creative skills to turn ideas into impactful
            solutions.
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

import React from "react";
import uwImage from "../assets/uw.png";
import { Calendar, Award, BookOpen } from "lucide-react";

const Education = () => {
  return (
    <section id="education" className="education-section">
      <div className="education-split-layout">
        <div className="edu-image-panel">
          <img src={uwImage} alt="University of Washington" className="edu-full-image" />
        </div>

        <div className="edu-content-panel">
          <div className="edu-content-inner">
            <div className="edu-intro">
              <h2 className="edu-main-title">Academic Background</h2>
              <p className="edu-tagline">
                Through rigorous coursework and hands-on projects, Donald has developed
                a strong foundation in both theoretical computer science and practical
                software development, preparing him to build innovative solutions that
                bridge the gap between complex technical challenges and real-world applications.
              </p>
            </div>

            <div className="edu-header-section">
              <h3 className="edu-university-name">University of Washington</h3>
              <p className="edu-degree-title">Bachelor Degree in Computer Science & Software Engineering</p>

              <div className="edu-meta-info">
                <div className="edu-meta-item">
                  <Calendar size={18} />
                  <span>Sept 2021 – June 2025</span>
                </div>
                <div className="edu-meta-item">
                  <Award size={18} />
                  <span>GPA: 3.55</span>
                </div>
              </div>
            </div>

            <div className="edu-courses-section">
              <div className="courses-header">
                <BookOpen size={22} />
                <h4>Relevant Coursework</h4>
              </div>
              <div className="courses-tags">
                <span className="course-pill">Databases</span>
                <span className="course-pill">Web Development</span>
                <span className="course-pill">Advanced Data Structures & Algorithms</span>
                <span className="course-pill">Operating Systems</span>
                <span className="course-pill">Python, C++ & Java Programming</span>
                <span className="course-pill">Object-Oriented Design</span>
                <span className="course-pill">AI & Machine Learning</span>
                <span className="course-pill">Computer Organization</span>
                <span className="course-pill">Cybersecurity</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Education;

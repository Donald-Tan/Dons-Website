import React from "react";
import { Mail, Phone, MapPin, Linkedin, Github } from "lucide-react";

const Contact = () => {
  return (
    <div className="contact-page">
      {/* Hero Section */}
      <section className="contact-hero">
        <div className="contact-hero-content">
          <h1 className="contact-hero-title">Let's Connect</h1>
          <p className="contact-hero-subtitle">
            If you like my work and would love to connect, feel free to reach
            out. I'm always open to discussing new projects, creative ideas, or
            opportunities.
          </p>
        </div>
      </section>

      {/* Main Contact Section */}
      <section className="contact-main">
        <div className="contact-wrapper">
          {/* Contact Info Cards */}
          <div className="contact-info-section">
            <div className="contact-cards">
              <a href="mailto:donaldtan382@gmail.com" className="contact-card">
                <div className="contact-card-icon">
                  <Mail size={20} />
                </div>
                <div className="contact-card-content">
                  <h3 className="contact-card-title">Email</h3>
                  <p className="contact-card-text">donaldtan382@gmail.com</p>
                </div>
              </a>

              <a href="tel:+12067134204" className="contact-card">
                <div className="contact-card-icon">
                  <Phone size={20} />
                </div>
                <div className="contact-card-content">
                  <h3 className="contact-card-title">Phone</h3>
                  <p className="contact-card-text">(206) 713-4204</p>
                </div>
              </a>

              <a
                href="https://www.google.com/maps/search/?api=1&query=Brooklyn, NY"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-card"
              >
                <div className="contact-card-icon">
                  <MapPin size={20} />
                </div>
                <div className="contact-card-content">
                  <h3 className="contact-card-title">Location</h3>
                  <p className="contact-card-text">Brooklyn, New York</p>
                </div>
              </a>

              <a
                href="https://www.linkedin.com/in/donald-augustine-tan"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-card"
              >
                <div className="contact-card-icon">
                  <Linkedin size={20} />
                </div>
                <div className="contact-card-content">
                  <h3 className="contact-card-title">LinkedIn</h3>
                  <p className="contact-card-text">donald-augustine-tan</p>
                </div>
              </a>

              <a
                href="https://github.com/Donald-Tan"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-card"
              >
                <div className="contact-card-icon">
                  <Github size={20} />
                </div>
                <div className="contact-card-content">
                  <h3 className="contact-card-title">GitHub</h3>
                  <p className="contact-card-text">Donald-Tan</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;

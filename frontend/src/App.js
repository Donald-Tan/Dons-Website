import "bootstrap/dist/css/bootstrap.min.css";
import "./css/App.css";
import "./css/Home.css";
import "./css/Investment.css";
import "./css/About.css";
import "./css/Contact.css";
import "./css/Featured.css";
import "./css/Travel.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { useEffect } from "react";
import { NavBar } from "./components/NavBar";
import Home from "./pages/Home";
import { Investment } from "./pages/Investment";
import About from "./pages/About";
import Contact from "./pages/Contact";
import { Featured } from "./pages/Featured";
import { Travel } from "./pages/Travel";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  }, [pathname]);

  return null;
}

function PageTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    const titles = {
      "/": "Donald Tan - Home",
      "/About": "Donald Tan - About",
      "/Contact": "Donald Tan - Contact",
      "/Investment": "Donald Tan - Investments",
      "/Travel": "Donald Tan - Travel",
      "/Featured": "Donald Tan - Featured",
    };
    document.title = titles[pathname] || "Donald Tan - Portfolio";
  }, [pathname]);

  return null;
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <PageTitle />
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/About" element={<About />} />
        <Route path="/Contact" element={<Contact />} />
        <Route path="/Investment" element={<Investment />} />
        <Route path="/Travel" element={<Travel />} />
        <Route path="/Featured" element={<Featured />} />
      </Routes>
    </Router>
  );
}

export default App;

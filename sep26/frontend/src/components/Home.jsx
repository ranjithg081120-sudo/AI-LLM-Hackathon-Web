import { useState, useEffect } from "react";
import collegeLogo from "../assets/website_newlogo.jpg";
import { apiGetDomains } from "../services/appsScriptApi";
import { getAuthToken } from "../services/authSession";

const FOUR_DOMAINS = [
  {
    number: "01",
    id: "AGR",
    title: "Agriculture & Rural Development",
    description: "Build AI agents and LLM tools to empower farmers, improve crop yield predictions, optimize supply chains, and enhance rural infrastructure.",
    defaultMax: 12,
    defaultRemaining: 11
  },
  {
    number: "02",
    id: "EMP",
    title: "Skills, Employment & Entrepreneurship",
    description: "Create intelligent systems for job matching, resume intelligence, micro-skill development, and automated mentorship for emerging entrepreneurs.",
    defaultMax: 12,
    defaultRemaining: 12
  },
  {
    number: "03",
    id: "EDU",
    title: "Education & Knowledge",
    description: "Develop personalized AI tutors, automated curriculum generation tools, multilingual learning assistants, and interactive knowledge retrieval platforms.",
    defaultMax: 10,
    defaultRemaining: 8
  },
  {
    number: "04",
    id: "GOV",
    title: "Government & Public Services",
    description: "Design conversational AI solutions for citizen assistance, policy information retrieval, public grievance processing, and automated service workflows.",
    defaultMax: 10,
    defaultRemaining: 10
  }
];

const JOURNEY_STEPS = [
  {
    step: "01",
    title: "Analyze Real-World Problems",
    description: "Understand domain-specific challenges and outline effective agentic AI workflows."
  },
  {
    step: "02",
    title: "Build & Retrieve Information with RAG",
    description: "Implement vector databases and retreival mechanisms for domain context."
  },
  {
    step: "03",
    title: "Develop & Fine-tune LLM Solutions",
    description: "Formulate prompts and fine-tune models (LoRA/QLoRA) for accurate responses."
  },
  {
    step: "04",
    title: "Optimize for Better Performance",
    description: "Enhance latency, token efficiency, and output reliability of your agentic system."
  },
  {
    step: "05",
    title: "Present Your Solution",
    description: "Demonstrate working prototypes to expert judges and showcase practical impact."
  }
];

const FOCUS_AREAS = [
  {
    icon: "bi-search",
    title: "RAG & Embeddings",
    description: "Combining vector similarity search with dense contextual embeddings for grounded model generation."
  },
  {
    icon: "bi-sliders",
    title: "Fine-tuning (QLoRA/LoRA)",
    description: "Parameter-efficient fine-tuning techniques to adapt open-source LLMs to custom task domains."
  },
  {
    icon: "bi-terminal",
    title: "Prompt Engineering",
    description: "Advanced prompt techniques including Chain-of-Thought, ReAct, and structured outputs."
  },
  {
    icon: "bi-lightning-charge",
    title: "LLM Optimization",
    description: "Quantization, caching, streaming, and efficient context window management for fast inference."
  },
  {
    icon: "bi-shield-check",
    title: "Evaluation & Reliability",
    description: "Benchmarking halluncination rates, guardrails, and deterministic verification of LLM outputs."
  }
];

function Home({ setPage, setSelectedDomainId }) {
  const [domainData, setDomainData] = useState({});

  useEffect(() => {
    let mounted = true;
    async function loadDomains() {
      try {
        const idToken = getAuthToken();
        const response = await apiGetDomains(idToken);
        if (mounted && response && response.success && Array.isArray(response.data)) {
          const map = {};
          response.data.forEach((d) => {
            map[String(d.domainId).toUpperCase()] = d;
          });
          setDomainData(map);
        }
      } catch {
        // Fallback to default representation if offline or public without auth
      }
    }
    loadDomains();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSelectDomain = (domainId) => {
    if (setSelectedDomainId) {
      setSelectedDomainId(domainId);
    }
    if (setPage) {
      setPage("register");
    }
  };

  return (
    <div className="landing-page">
      {/* 2. HERO SECTION */}
      <section className="hero-section text-center">
        <div className="container py-4">
          <img
            className="hero-college-logo"
            src={collegeLogo}
            alt="Bannari Amman Institute of Technology"
          />

          <div>
            <span className="organizer-tag">
              Organized by Agentic AI &amp; LLM Community
            </span>
          </div>

          <h1 className="hero-title">INTELLIX</h1>
          <h2 className="hero-subtitle mb-2">Agentic AI &amp; LLM Hackathon</h2>
          <p className="hero-tagline mb-4">Think. Build. Solve.</p>

          <p className="lead text-light opacity-75 max-w-2xl mx-auto mb-4" style={{ maxWidth: 680 }}>
            Turn real-world challenges into autonomous solutions using Large Language Models, RAG, QLoRA fine-tuning, and multi-agent orchestration.
          </p>

          <div className="d-flex justify-content-center align-items-center gap-3 mb-5">
            <div className="date-badge">
              <i className="bi bi-calendar-event text-warning"></i>
              <span>15 September 2026</span>
              <span className="opacity-50">|</span>
              <i className="bi bi-clock text-info"></i>
              <span>8:45 AM – 4:30 PM</span>
            </div>
          </div>

          <div className="d-flex justify-content-center gap-3">
            <button
              className="btn btn-brand btn-lg px-4 py-3"
              onClick={() => setPage("register")}
            >
              Register Your Team <i className="bi bi-arrow-right ms-2"></i>
            </button>
            <a
              href="#domains"
              className="btn btn-outline-glass btn-lg px-4 py-3"
            >
              Explore Domains
            </a>
          </div>
        </div>
      </section>

      {/* 3. ABOUT INTELLIX */}
      <section className="py-5 bg-dark border-top border-secondary border-opacity-25">
        <div className="container py-4">
          <div className="row align-items-center g-4">
            <div className="col-lg-6">
              <span className="text-primary fw-bold text-uppercase tracking-wider">About The Event</span>
              <h2 className="display-6 fw-bold text-light mt-2 mb-4">
                Empowering Next-Gen AI Engineers &amp; Builders
              </h2>
              <p className="text-secondary lead fs-6">
                INTELLIX is an intensive one-day Agentic AI &amp; LLM Hackathon bringing together top analytical minds to solve complex domain challenges. Participants leverage modern LLM stack frameworks to architect autonomous systems, intelligent search agents, and domain-adapted AI models.
              </p>
              <div className="row g-3 mt-3">
                <div className="col-sm-6">
                  <div className="d-flex align-items-center gap-3 p-3 glass-card">
                    <i className="bi bi-cpu fs-3 text-primary"></i>
                    <div>
                      <h6 className="mb-0 text-light fw-bold">Agentic Systems</h6>
                      <small className="text-secondary">Autonomous task tools</small>
                    </div>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="d-flex align-items-center gap-3 p-3 glass-card">
                    <i className="bi bi-database-check fs-3 text-success"></i>
                    <div>
                      <h6 className="mb-0 text-light fw-bold">RAG Architecture</h6>
                      <small className="text-secondary">Grounded knowledge bases</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="p-4 glass-card border border-primary border-opacity-25 rounded-4">
                <h4 className="text-light fw-bold mb-3">Event Overview</h4>
                <ul className="list-unstyled text-secondary mb-0 d-flex flex-column gap-3">
                  <li className="d-flex align-items-start gap-3">
                    <i className="bi bi-check-circle-fill text-primary mt-1"></i>
                    <div>
                      <strong className="text-light">Institution:</strong> Bannari Amman Institute of Technology
                    </div>
                  </li>
                  <li className="d-flex align-items-start gap-3">
                    <i className="bi bi-check-circle-fill text-primary mt-1"></i>
                    <div>
                      <strong className="text-light">Organizer:</strong> Agentic AI &amp; LLM Community
                    </div>
                  </li>
                  <li className="d-flex align-items-start gap-3">
                    <i className="bi bi-check-circle-fill text-primary mt-1"></i>
                    <div>
                      <strong className="text-light">Date:</strong> 15 September 2026
                    </div>
                  </li>
                  <li className="d-flex align-items-start gap-3">
                    <i className="bi bi-check-circle-fill text-primary mt-1"></i>
                    <div>
                      <strong className="text-light">Duration:</strong> 8:45 AM – 4:30 PM (Full Day Intensive)
                    </div>
                  </li>
                  <li className="d-flex align-items-start gap-3">
                    <i className="bi bi-check-circle-fill text-primary mt-1"></i>
                    <div>
                      <strong className="text-light">Team Size:</strong> 2 – 4 Members Total (including Team Leader)
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HACKATHON JOURNEY */}
      <section id="journey" className="py-5" style={{ background: "rgba(11, 15, 25, 0.95)" }}>
        <div className="container py-4">
          <div className="text-center mb-5">
            <span className="text-warning fw-bold text-uppercase tracking-wider">Step-by-Step Roadmap</span>
            <h2 className="display-6 fw-bold text-light mt-2">Hackathon Journey</h2>
            <p className="text-secondary">Five structured milestones from problem analysis to technical presentation.</p>
          </div>

          <div className="row g-4">
            {JOURNEY_STEPS.map((item) => (
              <div className="col-lg-4 col-md-6" key={item.step}>
                <div className="timeline-card glass-card">
                  <div className="timeline-number">{item.step}</div>
                  <h5 className="text-light fw-bold mb-2">{item.title}</h5>
                  <p className="text-secondary mb-0 fs-6">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. KEY FOCUS AREAS */}
      <section className="py-5 bg-dark border-top border-secondary border-opacity-25">
        <div className="container py-4">
          <div className="text-center mb-5">
            <span className="text-primary fw-bold text-uppercase tracking-wider">Core Technologies</span>
            <h2 className="display-6 fw-bold text-light mt-2">Key Focus Areas</h2>
            <p className="text-secondary">Master technical pillars underlying modern intelligent applications.</p>
          </div>

          <div className="row g-4 justify-content-center">
            {FOCUS_AREAS.map((area) => (
              <div className="col-lg-4 col-md-6" key={area.title}>
                <div className="glass-card p-4 h-100">
                  <div className="focus-icon-box">
                    <i className={`bi ${area.icon}`}></i>
                  </div>
                  <h5 className="text-light fw-bold mb-2">{area.title}</h5>
                  <p className="text-secondary fs-6 mb-0">{area.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. FOUR DOMAINS */}
      <section id="domains" className="py-5" style={{ background: "radial-gradient(circle at 50% 50%, #1e1b4b 0%, #0b0f19 90%)" }}>
        <div className="container py-4">
          <div className="text-center mb-5">
            <span className="text-info fw-bold text-uppercase tracking-wider">Choose Your Track</span>
            <h2 className="display-6 fw-bold text-light mt-2">Four Hackathon Domains</h2>
            <p className="text-secondary">Each team explicitly selects one domain. Domain capacity is dynamically updated.</p>
          </div>

          <div className="row g-4">
            {FOUR_DOMAINS.map((domain) => {
              const liveData = domainData[domain.id];
              const max = liveData ? liveData.maximumTeams : domain.defaultMax;
              const rem = liveData ? liveData.remainingCapacity : domain.defaultRemaining;
              const isFull = rem === 0;

              return (
                <div className="col-md-6" key={domain.id}>
                  <div className={`glass-card domain-card p-4 h-100 d-flex flex-column justify-content-between ${isFull ? "disabled" : ""}`}>
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="domain-badge">Domain {domain.number}</span>
                        <div className="capacity-indicator">
                          <span className={`capacity-pill ${isFull ? "full" : ""}`}>
                            {isFull ? "FULL" : `${rem} / ${max} teams available`}
                          </span>
                        </div>
                      </div>

                      <h4 className="text-light fw-bold mb-2">{domain.title}</h4>
                      <p className="text-secondary fs-6 mb-4">{domain.description}</p>
                    </div>

                    <div>
                      <button
                        className={`btn ${isFull ? "btn-secondary" : "btn-brand"} w-100 py-2`}
                        onClick={() => handleSelectDomain(domain.id)}
                        disabled={isFull}
                      >
                        {isFull ? "Capacity Full" : "Select Domain & Register"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. WHO CAN PARTICIPATE */}
      <section className="py-5 bg-dark border-top border-secondary border-opacity-25">
        <div className="container py-4">
          <div className="row align-items-center g-4">
            <div className="col-lg-6">
              <span className="text-warning fw-bold text-uppercase tracking-wider">Eligibility &amp; Collaboration</span>
              <h2 className="display-6 fw-bold text-light mt-2 mb-4">Who Can Participate?</h2>
              <ul className="list-unstyled text-secondary d-flex flex-column gap-3 fs-6">
                <li className="d-flex align-items-start gap-3">
                  <i className="bi bi-mortarboard-fill text-warning fs-5"></i>
                  <span>Students registered under Bannari Amman Institute of Technology with valid student credentials.</span>
                </li>
                <li className="d-flex align-items-start gap-3">
                  <i className="bi bi-people-fill text-warning fs-5"></i>
                  <span>Teams consisting of <strong>2 to 4 members TOTAL</strong> (including Team Leader).</span>
                </li>
                <li className="d-flex align-items-start gap-3">
                  <i className="bi bi-diagram-2-fill text-warning fs-5"></i>
                  <span><strong>Cross-year collaboration is encouraged (II &amp; III Year).</strong></span>
                </li>
                <li className="d-flex align-items-start gap-3">
                  <i className="bi bi-laptop-fill text-warning fs-5"></i>
                  <span>Developers, AI enthusiasts, prompt engineers, and problem solvers of all skill levels.</span>
                </li>
              </ul>
            </div>
            <div className="col-lg-6">
              {/* 8. WHAT YOU'LL GAIN */}
              <div className="p-4 glass-card">
                <span className="text-success fw-bold text-uppercase tracking-wider">Key Benefits</span>
                <h3 className="text-light fw-bold mt-2 mb-4">What You'll Gain</h3>
                <div className="d-flex flex-column gap-3">
                  <div className="d-flex align-items-center gap-3">
                    <i className="bi bi-award-fill text-warning fs-3"></i>
                    <div>
                      <h6 className="text-light fw-bold mb-0">Practical LLM Experience</h6>
                      <small className="text-secondary">Hands-on experience building multi-agent AI systems.</small>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <i className="bi bi-lightbulb-fill text-info fs-3"></i>
                    <div>
                      <h6 className="text-light fw-bold mb-0">Mentorship &amp; Feedback</h6>
                      <small className="text-secondary">Guidance from AI community leads and technical experts.</small>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <i className="bi bi-journal-code text-success fs-3"></i>
                    <div>
                      <h6 className="text-light fw-bold mb-0">Portfolio Expansion</h6>
                      <small className="text-secondary">Showcase working agentic prototypes in your developer portfolio.</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. GUIDELINES & EVENT DETAILS */}
      <section className="py-5" style={{ background: "rgba(15, 23, 42, 0.95)" }}>
        <div className="container py-4">
          <div className="text-center mb-5">
            <span className="text-primary fw-bold text-uppercase tracking-wider">Schedule &amp; Information</span>
            <h2 className="display-6 fw-bold text-light mt-2">Event Details &amp; Guidelines</h2>
          </div>

          <div className="row g-4 justify-content-center mb-4">
            <div className="col-md-4">
              <div className="glass-card p-4 h-100 text-center">
                <i className="bi bi-calendar3 fs-1 text-primary mb-3"></i>
                <h5 className="text-light fw-bold">Date</h5>
                <p className="text-secondary fs-5 mb-0">15 September 2026</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="glass-card p-4 h-100 text-center">
                <i className="bi bi-clock-history fs-1 text-info mb-3"></i>
                <h5 className="text-light fw-bold">Time</h5>
                <p className="text-secondary fs-5 mb-0">8:45 AM – 4:30 PM</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="glass-card p-4 h-100 text-center">
                <i className="bi bi-file-earmark-code fs-1 text-warning mb-3"></i>
                <h5 className="text-light fw-bold">Problem Statement</h5>
                <p className="text-warning fs-5 fw-semibold mb-0">Released On-Spot</p>
              </div>
            </div>
          </div>

          <div className="p-4 glass-card border border-warning border-opacity-25 rounded-4 mt-4">
            <h4 className="text-warning fw-bold mb-3"><i className="bi bi-shield-exclamation me-2"></i> Official Event Guidelines</h4>
            <ul className="list-unstyled text-secondary mb-0 d-flex flex-column gap-2 fs-6">
              <li className="d-flex align-items-start gap-3">
                <i className="bi bi-check2-circle text-warning mt-1"></i>
                <span>Bring your own laptop and necessary development setup.</span>
              </li>
              <li className="d-flex align-items-start gap-3">
                <i className="bi bi-check2-circle text-warning mt-1"></i>
                <span>Complete the solution within the given time.</span>
              </li>
              <li className="d-flex align-items-start gap-3">
                <i className="bi bi-check2-circle text-warning mt-1"></i>
                <span>Follow the hackathon rules and maintain an ethical and collaborative approach.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 10. REGISTRATION CTA */}
      <section className="py-5 text-center" style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)" }}>
        <div className="container py-4">
          <h2 className="display-5 fw-bold text-light mb-3">Ready to Build Intelligent AI Agents?</h2>
          <p className="lead text-light opacity-75 mb-4 max-w-xl mx-auto" style={{ maxWidth: 600 }}>
            Gather your team, choose your domain, and submit your registration before domain capacity fills up.
          </p>
          <button
            className="btn btn-brand btn-lg px-5 py-3 fs-5"
            onClick={() => setPage("register")}
          >
            Register Your Team Now <i className="bi bi-arrow-right ms-2"></i>
          </button>
        </div>
      </section>

      {/* 11. FOOTER */}
      <footer className="app-footer text-center">
        <div className="container">
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3">
            <div className="text-start">
              <h5 className="text-light fw-bold mb-1">INTELLIX</h5>
              <p className="text-secondary small mb-0">Bannari Amman Institute of Technology</p>
            </div>
            <div className="text-secondary small">
              Organized by Agentic AI &amp; LLM Community &copy; 2026. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
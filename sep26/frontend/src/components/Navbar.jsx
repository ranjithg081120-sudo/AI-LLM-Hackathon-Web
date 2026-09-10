import collegeLogo from "../assets/website_newlogo.jpg";

function AppNavbar({ setPage, onNavigate }) {
  const handleNav = (target) => {
    if (onNavigate) {
      onNavigate(target);
    } else if (setPage) {
      setPage(target);
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top border-bottom border-secondary border-opacity-25 px-3 py-2">
      <div className="container-fluid">
        <button
          className="navbar-brand-custom"
          onClick={() => handleNav("home")}
          type="button"
        >
          <img src={collegeLogo} alt="Bannari Amman Institute of Technology" />
          <span className="brand-text">INTELLIX</span>
        </button>

        <div className="ms-auto d-flex align-items-center gap-2">
          <button
            className="btn btn-link text-light text-decoration-none btn-sm px-2 d-none d-md-inline"
            onClick={() => handleNav("home")}
            type="button"
          >
            Home
          </button>
          <a
            href="#domains"
            className="btn btn-link text-light text-decoration-none btn-sm px-2 d-none d-md-inline"
            onClick={(e) => {
              e.preventDefault();
              handleNav("home");
              setTimeout(() => {
                const el = document.getElementById("domains");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }, 100);
            }}
          >
            Domains
          </a>
          <a
            href="#journey"
            className="btn btn-link text-light text-decoration-none btn-sm px-2 d-none d-md-inline"
            onClick={(e) => {
              e.preventDefault();
              handleNav("home");
              setTimeout(() => {
                const el = document.getElementById("journey");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }, 100);
            }}
          >
            Journey
          </a>
          <button
            className="btn btn-brand btn-sm"
            onClick={() => handleNav("register")}
            type="button"
          >
            Register Team
          </button>
        </div>
      </div>
    </nav>
  );
}

export default AppNavbar;
function AppNavbar({ page, setPage }) {
  return (
    <nav className="navbar navbar-expand navbar-dark bg-brand px-3 py-3">
      <span className="navbar-brand fw-bold">
        <i className="bi bi-cpu me-2"></i>AI Hackathon
      </span>
      <div className="ms-auto">
        <button className="btn btn-outline-light btn-sm me-2" onClick={() => setPage("home")}>Home</button>
        <button className="btn btn-outline-light btn-sm me-2" onClick={() => setPage("login")}>Team Login</button>
        <button className="btn btn-brand btn-sm" onClick={() => setPage("register")}>Register Team</button>
      </div>
    </nav>
  );
}
export default AppNavbar;
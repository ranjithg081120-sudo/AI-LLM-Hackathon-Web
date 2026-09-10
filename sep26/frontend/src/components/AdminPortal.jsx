function AdminPortal({ setPage }) {
  return (
    <div className="container py-5" style={{ maxWidth: 720 }}>
      <div className="glass-card p-5 text-center">
        <i className="bi bi-shield-lock text-warning display-3 mb-3"></i>
        <h2 className="text-light fw-bold mb-2">Admin Portal</h2>
        <p className="text-secondary mb-4">
          Administrator management dashboard for INTELLIX Hackathon. Active admin authentication required.
        </p>
        <div className="alert alert-warning border-0 bg-warning bg-opacity-10 text-warning mb-4">
          <i className="bi bi-shield-exclamation me-2"></i> Administrator privileges are verified via backend OAuth tokens.
        </div>
        <button className="btn btn-outline-glass" onClick={() => setPage("home")}>
          Return to Homepage
        </button>
      </div>
    </div>
  );
}

export default AdminPortal;

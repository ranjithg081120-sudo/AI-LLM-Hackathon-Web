function ParticipantPortal({ setPage }) {
  return (
    <div className="container py-5 text-center" style={{ maxWidth: 640 }}>
      <div className="glass-card p-5">
        <div className="mb-3">
          <i className="bi bi-clock-history text-warning display-1"></i>
        </div>
        <span className="organizer-tag mb-2">Participant Portal</span>
        <h2 className="text-light fw-bold mb-3">Team Portal Coming Soon</h2>
        <p className="text-secondary fs-5 mb-4">
          The team portal is not open yet. Dashboard access and problem statement workflows will open on the scheduled event day.
        </p>
        <div className="alert alert-info border-0 bg-info bg-opacity-10 text-info mb-4">
          <i className="bi bi-info-circle me-2"></i> Registration status confirmed. Please check back on 15 September 2026.
        </div>
        <button className="btn btn-outline-glass btn-lg px-4" onClick={() => setPage("home")}>
          Return to Homepage
        </button>
      </div>
    </div>
  );
}

export default ParticipantPortal;

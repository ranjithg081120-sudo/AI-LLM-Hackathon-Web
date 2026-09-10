function SuccessScreen({ registrationData, setPage }) {
  const data = typeof registrationData === "object" && registrationData !== null
    ? registrationData
    : { teamId: registrationData };

  return (
    <div className="container py-5 text-center" style={{ maxWidth: 640 }}>
      <div className="glass-card p-5">
        <div className="mb-3">
          <i className="bi bi-check-circle-fill text-success display-1"></i>
        </div>

        <span className="organizer-tag mb-2">Confirmation</span>
        <h2 className="text-light fw-bold mb-3">REGISTRATION SUCCESSFUL</h2>

        <p className="text-secondary fs-5 mb-4">
          Your team has been successfully registered.
        </p>

        <div className="bg-dark p-4 rounded-3 border border-secondary border-opacity-25 mb-4 text-start">
          <div className="row g-3">
            <div className="col-sm-6">
              <small className="text-secondary text-uppercase tracking-wider fw-semibold">Team ID</small>
              <div className="text-warning fw-bold fs-4">{data.teamId || "BIT-AI-001"}</div>
            </div>
            <div className="col-sm-6">
              <small className="text-secondary text-uppercase tracking-wider fw-semibold">Team Name</small>
              <div className="text-light fw-semibold fs-5">{data.teamName || "Registered Team"}</div>
            </div>
            <div className="col-sm-6">
              <small className="text-secondary text-uppercase tracking-wider fw-semibold">Domain</small>
              <div className="text-info fw-semibold">{data.domainName || data.domainId || "Selected Domain"}</div>
            </div>
            <div className="col-sm-6">
              <small className="text-secondary text-uppercase tracking-wider fw-semibold">Team Leader</small>
              <div className="text-light fw-semibold">{data.leaderName || "Team Leader"}</div>
            </div>
          </div>
        </div>

        <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
          <button
            className="btn btn-brand btn-lg px-4"
            onClick={() => setPage("participant")}
          >
            Team Portal (Coming Soon) <i className="bi bi-arrow-right ms-2"></i>
          </button>
          <button
            className="btn btn-outline-glass btn-lg px-4"
            onClick={() => setPage("home")}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default SuccessScreen;
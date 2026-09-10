function SuccessScreen({ teamId, setPage }) {
  return (
    <div className="container text-center py-5">
      <i className="bi bi-check-circle-fill text-success" style={{ fontSize: "3rem" }}></i>
      <h2 className="fw-heading mt-3">Registration Successful</h2>
      <p className="text-muted mb-4">Your permanent Team ID:</p>
      <div className="d-inline-block px-4 py-2 bg-dark text-white rounded fw-bold fs-4 mb-4">
        {teamId}
      </div>
      <div>
        <button className="btn btn-outline-secondary" onClick={() => setPage("home")}>Back to Home</button>
      </div>
    </div>
  );
}
export default SuccessScreen;
import { useState } from "react";
import { registerTeam } from "../api/client";

const emptyMember = { name: "", regNo: "", dept: "" };

function RegistrationForm({ onSuccess }) {
  const [teamName, setTeamName] = useState("");
  const [leader, setLeader] = useState(emptyMember);
  const [members, setMembers] = useState([emptyMember, emptyMember, emptyMember, emptyMember]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateMember = (index, field, value) => {
    const copy = [...members];
    copy[index] = { ...copy[index], [field]: value };
    setMembers(copy);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await registerTeam({ teamName, leader, members });
      if (res.success) onSuccess(res.teamId);
      else setError(res.message || "Registration failed. Try again.");
    } catch {
      setError("Could not reach server. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const memberFields = (m, i, onChange, label) => (
    <div className="row g-2 mb-3" key={label}>
      <div className="col-12"><small className="text-muted fw-semibold">{label}</small></div>
      <div className="col-md-4">
        <input className="form-control" placeholder="Name" value={m.name}
          onChange={(e) => onChange(i, "name", e.target.value)} required />
      </div>
      <div className="col-md-4">
        <input className="form-control" placeholder="Register Number" value={m.regNo}
          onChange={(e) => onChange(i, "regNo", e.target.value)} required />
      </div>
      <div className="col-md-4">
        <input className="form-control" placeholder="Department" value={m.dept}
          onChange={(e) => onChange(i, "dept", e.target.value)} required />
      </div>
    </div>
  );

  return (
    <div className="container py-5" style={{ maxWidth: 720 }}>
      <div className="card shadow-sm border-0">
        <div className="card-body p-4">
          <h3 className="fw-heading mb-4">Team Registration</h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Team Name</label>
              <input className="form-control" value={teamName}
                onChange={(e) => setTeamName(e.target.value)} required />
            </div>

            {memberFields(leader, 0, (_, f, v) => setLeader({ ...leader, [f]: v }), "Team Leader")}
            {members.map((m, i) => memberFields(m, i, updateMember, `Member ${i + 1}`))}

            {error && <div className="alert alert-danger py-2">{error}</div>}

            <button className="btn btn-brand w-100 py-2" disabled={loading}>
              {loading ? "Submitting..." : "Submit Registration"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
export default RegistrationForm;
function Home({ setPage }) {
  return (
    <div className="hero py-5">
      <div className="container text-center py-5">
        <h1 className="display-4 fw-heading fw-bold mb-3">Agentic AI & LLM Optimization Hackathon</h1>
        <p className="lead mb-4 opacity-75">
          Build with LLMs, RAG, and fine-tuning. Teams of up to 5. College account required.
        </p>
        <button className="btn btn-brand btn-lg px-4" onClick={() => setPage("register")}>
          Register Your Team <i className="bi bi-arrow-right ms-1"></i>
        </button>
      </div>
    </div>
  );
}
export default Home;
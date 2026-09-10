import { useState } from "react";
import AppNavbar from "./components/Navbar";
import Home from "./components/Home";
import RegistrationForm from "./components/RegistrationForm";
import SuccessScreen from "./components/SuccessScreen";
import GoogleLoginTest from "./GoogleLoginTest";

function App() {
  const [page, setPage] = useState("home");
  const [teamId, setTeamId] = useState(null);

  return (
    <div>
      <AppNavbar page={page} setPage={setPage} />
      {page === "home" && <Home setPage={setPage} />}
      {page === "register" && (
        <RegistrationForm onSuccess={(id) => { setTeamId(id); setPage("success"); }} />
      )}
      {page === "success" && <SuccessScreen teamId={teamId} setPage={setPage} />}
      {page === "login" && <GoogleLoginTest />}
    </div>
  );
}
export default App;
import { useCallback, useEffect, useRef, useState } from "react";
import { apiGetDomains, apiRegisterTeam } from "./services/appsScriptApi";

const runtimeTestTeam = {
  teamName: "Runtime Test Team",
  leaderName: "Runtime Test Leader",
  leaderRegisterNumber: "TEST-001",
  leaderDepartment: "CSE",
  members: []
};

function GoogleLoginTest() {
  const buttonRef = useRef(null);
  const initializedRef = useRef(false);
  const credentialRef = useRef(null);
  const [authStatus, setAuthStatus] = useState("ready");
  const [authResult, setAuthResult] = useState(null);
  const [registrationStatus, setRegistrationStatus] = useState("idle");
  const [registrationResult, setRegistrationResult] = useState(null);

  const authenticateWithBackend = useCallback(async (credential) => {
    credentialRef.current = credential;
    setAuthStatus("authenticating");
    setAuthResult(null);
    setRegistrationStatus("idle");
    setRegistrationResult(null);

    try {
      const payload = await apiGetDomains(credentialRef.current);

      if (payload.success !== true) {
        setAuthStatus("failed");
        setAuthResult({
          code: payload.code || "BACKEND_REQUEST_FAILED",
          error: payload.error || "The backend authentication request failed."
        });
        credentialRef.current = null;
        return;
      }

      setAuthStatus("successful");
      setAuthResult({
        message: "Google ID token successfully passed backend authentication.",
        data: payload.data
      });
      console.log("Backend authentication result:", {
        success: payload.success,
        data: payload.data
      });
    } catch (error) {
      setAuthStatus("failed");
      setAuthResult({
        code: "NETWORK_ERROR",
        error: error.message || "Unable to reach the Apps Script backend."
      });
      credentialRef.current = null;
    }
  }, []);

  const registerRuntimeTestTeam = useCallback(async () => {
    if (!credentialRef.current) {
      setRegistrationStatus("failed");
      setRegistrationResult({
        code: "AUTH_REQUIRED",
        error: "Authenticate with Google before registering the test team."
      });
      return;
    }

    setRegistrationStatus("registering");
    setRegistrationResult(null);

    try {
      const payload = await apiRegisterTeam(
        credentialRef.current,
        runtimeTestTeam
      );

      if (payload.success !== true) {
        setRegistrationStatus("failed");
        setRegistrationResult({
          code: payload.code || "BACKEND_REQUEST_FAILED",
          error: payload.error || "The team registration request failed."
        });
        return;
      }

      setRegistrationStatus("successful");
      setRegistrationResult({
        teamId: payload.data && payload.data.teamId
      });
    } catch (error) {
      setRegistrationStatus("failed");
      setRegistrationResult({
        code: "NETWORK_ERROR",
        error: error.message || "Unable to reach the Apps Script backend."
      });
    }
  }, []);

  useEffect(() => {
    return () => {
      if (!import.meta.env.DEV) {
        credentialRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV || initializedRef.current) {
      return;
    }

    initializedRef.current = true;
    authenticateWithBackend("development-only-credential");
  }, [authenticateWithBackend]);

  useEffect(() => {
    if (import.meta.env.DEV) {
      return;
    }

    const initializeGoogle = () => {
      // Prevent Google Identity Services from being initialized multiple times
      if (
        initializedRef.current ||
        !window.google ||
        !buttonRef.current
      ) {
        return;
      }

      initializedRef.current = true;

      // Initialize Google Identity Services
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,

        callback: (response) => {
          if (!response.credential) {
            setAuthStatus("failed");
            setAuthResult({
              code: "GOOGLE_CREDENTIAL_MISSING",
              error: "Google did not return an ID token."
            });
            return;
          }

          authenticateWithBackend(response.credential);
        }
      });

      // Render Google Sign-In button
      window.google.accounts.id.renderButton(
        buttonRef.current,
        {
          theme: "outline",
          size: "large",
          text: "signin_with",
          shape: "rectangular"
        }
      );
    };

    // GIS script has already loaded
    if (window.google) {
      initializeGoogle();
      return;
    }

    // Wait for GIS script to load
    const interval = setInterval(() => {
      if (window.google) {
        clearInterval(interval);
        initializeGoogle();
      }
    }, 100);

    // Cleanup interval when component unmounts
    return () => {
      clearInterval(interval);
    };
  }, [authenticateWithBackend]);

  return (
    <div>
      <h2>Google Login Test</h2>

      <p>
        Google authentication: {authStatus === "ready" && "Google login ready"}
        {authStatus === "authenticating" && "Authenticating"}
        {authStatus === "successful" && "Backend authentication successful"}
        {authStatus === "failed" && "Backend authentication failed"}
      </p>

      <div ref={buttonRef}></div>

      <button
        type="button"
        onClick={registerRuntimeTestTeam}
        disabled={authStatus !== "successful" || registrationStatus === "registering"}
      >
        Register Runtime Test Team
      </button>

      <p>
        Registration: {registrationStatus === "idle" && "Waiting for Google authentication"}
        {registrationStatus === "registering" && "Registering Runtime Test Team"}
        {registrationStatus === "successful" && "Registration successful"}
        {registrationStatus === "failed" && "Registration failed"}
      </p>

      {registrationStatus === "successful" && registrationResult && (
        <p>Team ID: {registrationResult.teamId}</p>
      )}

      {authResult && (
        <pre>{JSON.stringify(authResult, null, 2)}</pre>
      )}

      {registrationStatus === "failed" && registrationResult && (
        <pre>{JSON.stringify(registrationResult, null, 2)}</pre>
      )}
    </div>
  );
}

export default GoogleLoginTest;
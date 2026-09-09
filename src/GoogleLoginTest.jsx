import { useEffect, useRef } from "react";

function GoogleLoginTest() {
  const buttonRef = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
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

      // Debug information
      console.log(
        "Google Client ID being used:",
        import.meta.env.VITE_GOOGLE_CLIENT_ID
      );

      console.log(
        "Current browser origin:",
        window.location.origin
      );

      // Initialize Google Identity Services
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,

        callback: (response) => {
          console.log("Google authentication successful.");

          // Do NOT print the actual credential/token
          console.log(
            "Credential received:",
            Boolean(response.credential)
          );

          // We will send response.credential to Apps Script
          // in the next authentication step.
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
  }, []);

  return (
    <div>
      <h2>Google Login Test</h2>

      <div ref={buttonRef}></div>
    </div>
  );
}

export default GoogleLoginTest;
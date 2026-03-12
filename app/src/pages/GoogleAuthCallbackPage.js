import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";

export default function GoogleAuthCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("processing");
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const errorParam = params.get("error");

    if (errorParam) {
      setStatus("error");
      setError("הגישה ליומן גוגל נדחתה: " + errorParam);
      return;
    }

    if (!code) {
      setStatus("error");
      setError("לא התקבל קוד אימות מגוגל.");
      return;
    }

    const redirectUri = window.location.origin + "/auth/google/callback";

    const googleAuthCallback = httpsCallable(functions, "googleAuthCallback");
    googleAuthCallback({ code, redirectUri })
      .then(() => {
        setStatus("success");
        setTimeout(() => navigate("/calendar"), 2000);
      })
      .catch((err) => {
        setStatus("error");
        setError(err.message);
      });
  }, [navigate]);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {status === "processing" && (
          <>
            <div style={styles.spinner}>⏳</div>
            <h2 style={styles.title}>מתחבר ליומן Google...</h2>
            <p style={styles.sub}>אנא המתן בזמן שאנו משלימים את החיבור.</p>
          </>
        )}
        {status === "success" && (
          <>
            <div style={styles.icon}>✅</div>
            <h2 style={styles.title}>החיבור הצליח!</h2>
            <p style={styles.sub}>מעביר אותך בחזרה ליומן...</p>
          </>
        )}
        {status === "error" && (
          <>
            <div style={styles.icon}>❌</div>
            <h2 style={{ ...styles.title, color: "#ef4444" }}>החיבור נכשל</h2>
            <p style={styles.sub}>{error}</p>
            <button onClick={() => navigate("/calendar")} style={styles.btn}>
              חזרה ליומן
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", backgroundColor: "#f0f4f8", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', system-ui, sans-serif", direction: "rtl" },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: "48px 40px", maxWidth: 400, width: "100%", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.1)" },
  spinner: { fontSize: 48, marginBottom: 16 },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { margin: "0 0 8px", fontSize: 22, fontWeight: 700, color: "#1e293b" },
  sub: { color: "#64748b", fontSize: 14, margin: "0 0 20px" },
  btn: { backgroundColor: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" },
};
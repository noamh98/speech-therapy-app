import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      // תרגום שגיאות נפוצות של Firebase לעברית
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("אימייל או סיסמה לא נכונים.");
      } else if (err.code === "auth/too-many-requests") {
        setError("יותר מדי ניסיונות כושלים. אנא נסה שוב מאוחר יותר.");
      } else {
        setError("הכניסה נכשלה: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoIcon}>🗣️</div>
          <h1 style={styles.title}>SpeechCare</h1>
          <p style={styles.subtitle}>ניהול קליניקה לטיפול בדיבור</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div style={styles.errorBox}>{error}</div>}

          <div style={styles.field}>
            <label style={styles.label}>אימייל</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
              placeholder="name@example.com"
              autoComplete="email"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>סיסמה</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "מתחבר..." : "התחברות"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#0f172a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    padding: 20,
    direction: "rtl", // העברת כל הדף לימין לשמאל
  },
  card: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: "48px 40px",
    width: "100%",
    maxWidth: 400,
    boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  header: {
    textAlign: "center",
    marginBottom: 36,
  },
  logoIcon: { fontSize: 48, marginBottom: 12 },
  title: {
    color: "#f1f5f9",
    margin: "0 0 8px",
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: "-0.5px",
  },
  subtitle: {
    color: "#64748b",
    margin: 0,
    fontSize: 14,
  },
  form: { display: "flex", flexDirection: "column", gap: 20 },
  errorBox: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    border: "1px solid rgba(239, 68, 68, 0.4)",
    color: "#fca5a5",
    borderRadius: 8,
    padding: "12px 16px",
    fontSize: 14,
    textAlign: "right",
  },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { color: "#94a3b8", fontSize: 13, fontWeight: 500, textAlign: "right" },
  input: {
    backgroundColor: "#0f172a",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    color: "#f1f5f9",
    padding: "12px 14px",
    fontSize: 15,
    outline: "none",
    transition: "border-color 0.15s",
    textAlign: "right", // יישור טקסט בתוך האינפוט
  },
  btn: {
    backgroundColor: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "14px",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 8,
    transition: "background 0.15s",
  },
};
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// רשימה נקייה - רק מה שצריך ורק בעברית
const navItems = [
  { path: "/", heLabel: "בקרה", icon: "grid_view" },
  { path: "/patients", heLabel: "מטופלים", icon: "person" },
  { path: "/sessions", heLabel: "טיפולים", icon: "assignment" },
  { path: "/calendar", heLabel: "יומן", icon: "calendar_today" },
  { path: "/payments", heLabel: "תשלומים", icon: "payments" },
];

export default function Layout({ children }) {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  async function handleLogout() {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  }

  return (
    <div style={styles.wrapper}>
      {/* Sidebar למחשב - בעיצוב נקי ללא אנגלית */}
      {!isMobile && (
        <aside style={styles.sidebar}>
          <div style={styles.logoContainer}>
            <div style={styles.logoCircle}>
              <span className="material-icons" style={{ color: "#3b82f6" }}>psychology</span>
            </div>
            <div style={styles.logoText}>
              <div style={styles.brandName}>SpeechCare</div>
              <div style={styles.userName}>שלום, {currentUser?.displayName || "נעם"}</div>
            </div>
          </div>

          <nav style={styles.nav}>
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path} style={{ ...styles.navLink, ...(active ? styles.navLinkActive : {}) }}>
                  <span className="material-icons">{item.icon}</span>
                  <span style={styles.navLabel}>{item.heLabel}</span>
                </Link>
              );
            })}
          </nav>

          <div style={styles.sidebarFooter}>
            <button onClick={handleLogout} style={styles.logoutBtn}>
              <span className="material-icons">logout</span>
              <span>יציאה</span>
            </button>
          </div>
        </aside>
      )}

      {/* תוכן ראשי */}
      <main style={styles.main}>
        <div style={styles.contentContainer}>
          {children}
        </div>

        {/* תפריט תחתון לנייד - רק עברית */}
        {isMobile && (
          <nav style={styles.bottomNav}>
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path} style={{ ...styles.bottomNavLink, ...(active ? styles.bottomActive : {}) }}>
                  <span className="material-icons">{item.icon}</span>
                  <span style={{ fontSize: "12px" }}>{item.heLabel}</span>
                </Link>
              );
            })}
          </nav>
        )}
      </main>
    </div>
  );
}

const styles = {
  wrapper: { display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc", direction: "rtl", fontFamily: "'Assistant', sans-serif" },
  sidebar: {
    width: 240,
    background: "linear-gradient(180deg, #3b82f6 0%, #2fb4bd 100%)",
    padding: "24px 16px",
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    position: "sticky",
    top: 0
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    backgroundColor: "rgba(255,255,255,0.15)",
    padding: "12px",
    borderRadius: "16px",
    marginBottom: "32px"
  },
  logoCircle: { width: 40, height: 40, backgroundColor: "#fff", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" },
  logoText: { color: "#fff" },
  brandName: { fontWeight: "800", fontSize: "16px" },
  userName: { fontSize: "11px", opacity: 0.9 },

  nav: { flex: 1, display: "flex", flexDirection: "column", gap: "8px" },
  navLink: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    textDecoration: "none",
    color: "rgba(255,255,255,0.7)",
    borderRadius: "12px",
    transition: "all 0.2s"
  },
  navLinkActive: { backgroundColor: "#fff", color: "#3b82f6", fontWeight: "700", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" },
  navLabel: { fontSize: "15px" },

  sidebarFooter: { marginTop: "auto", paddingTop: "20px" },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(255,255,255,0.1)",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    fontSize: "14px",
    width: "100%",
    padding: "10px",
    borderRadius: "10px"
  },

  main: { flex: 1, overflowY: "auto" },
  contentContainer: { padding: "24px", maxWidth: "1200px", margin: "0 auto" },

  bottomNav: {
    position: "fixed", bottom: 0, left: 0, right: 0,
    backgroundColor: "#fff", height: "70px", display: "flex",
    justifyContent: "space-around", alignItems: "center",
    boxShadow: "0 -4px 20px rgba(0,0,0,0.08)", zIndex: 1000
  },
  bottomNavLink: { display: "flex", flexDirection: "column", alignItems: "center", color: "#94a3b8", textDecoration: "none" },
  bottomActive: { color: "#3b82f6" }
};
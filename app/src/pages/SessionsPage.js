import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { usePatients } from "../hooks/usePatients";
import { useSessions } from "../hooks/useSessions";

export default function SessionsPage() {
  const { patients } = usePatients();
  const { sessions, loading, updatePaymentStatus, deleteSession } = useSessions();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [patientFilter, setPatientFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const filtered = sessions.filter((s) => {
    const patient = patients.find((p) => p.id === s.patientId);
    const matchSearch =
      !search ||
      patient?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      s.type?.toLowerCase().includes(search.toLowerCase()) ||
      s.notes?.toLowerCase().includes(search.toLowerCase());
    const matchPatient = !patientFilter || s.patientId === patientFilter;
    const matchStatus = statusFilter === "all" || s.paymentStatus === statusFilter;
    const matchType = typeFilter === "all" || s.type === typeFilter;
    return matchSearch && matchPatient && matchStatus && matchType;
  });

  const totalAmount = filtered.reduce((sum, s) => sum + (s.price || 0), 0);

  if (loading) return <div style={styles.loading}>טוען טיפולים...</div>;

  return (
    <div style={styles.page}>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>יומן טיפולים</h1>
        <p style={styles.pageSubtitle}>
          {filtered.length} טיפולים · <strong>₪{totalAmount.toLocaleString()}</strong> סה"כ
        </p>
      </div>

      <div style={styles.filters}>
        <input
          placeholder="חיפוש..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />
        <select value={patientFilter} onChange={(e) => setPatientFilter(e.target.value)} style={styles.select}>
          <option value="">כל המטופלים</option>
          {patients.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={styles.select}>
          <option value="all">כל הסטטוסים</option>
          <option value="unpaid">לא שולם</option>
          <option value="paid">שולם</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div style={styles.empty}>לא נמצאו טיפולים</div>
      ) : (
        <div style={isMobile ? styles.mobileList : styles.tableWrap}>
          {!isMobile && (
            <div style={styles.tableHeader}>
              <div>מטופל</div>
              <div>תאריך</div>
              <div>סוג</div>
              <div>מיקום</div>
              <div>מחיר</div>
              <div>סטטוס</div>
              <div></div>
            </div>
          )}

          {filtered.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime)).map((s) => {
            const patient = patients.find((p) => p.id === s.patientId);
            const statusColor = s.paymentStatus === "paid" ? "#10b981" : s.paymentStatus === "partial" ? "#f59e0b" : "#ef4444";

            if (isMobile) {
              return (
                <div key={s.id} style={styles.mobileCard}>
                  <div style={styles.cardHeader}>
                    <Link to={`/patients/${s.patientId}`} style={styles.patientLink}>{patient?.fullName || "לא ידוע"}</Link>
                    <span style={{ fontWeight: 600 }}>₪{s.price}</span>
                  </div>
                  <div style={styles.cardBody}>
                    <div>📅 {s.dateTime ? new Date(s.dateTime).toLocaleDateString("he-IL") : "—"} | {s.dateTime ? new Date(s.dateTime).toLocaleTimeString("he-IL", { hour: '2-digit', minute: '2-digit' }) : ""}</div>
                    <div>📍 {s.location === 'clinic' ? 'קליניקה' : 'בית'} | {s.type === 'treatment' ? 'טיפול' : 'אבחון'}</div>
                  </div>
                  <div style={styles.cardActions}>
                    <select
                      value={s.paymentStatus || "unpaid"}
                      onChange={(e) => updatePaymentStatus(s.id, e.target.value)}
                      style={{ ...styles.statusSelect, color: statusColor, backgroundColor: `${statusColor}15`, flex: 1 }}
                    >
                      <option value="unpaid">לא שולם</option>
                      <option value="partial">חלקי</option>
                      <option value="paid">שולם</option>
                    </select>
                    <button onClick={() => { if (window.confirm("למחוק?")) deleteSession(s.id); }} style={styles.deleteBtn}>🗑️</button>
                  </div>
                </div>
              );
            }

            return (
              <div key={s.id} style={styles.tableRow}>
                <div style={styles.col}><Link to={`/patients/${s.patientId}`} style={styles.patientLink}>{patient?.fullName}</Link></div>
                <div style={styles.col}>{new Date(s.dateTime).toLocaleDateString("he-IL")}</div>
                <div style={styles.col}>{s.type}</div>
                <div style={styles.col}>{s.location === 'clinic' ? 'קליניקה' : 'בית'}</div>
                <div style={styles.col}>₪{s.price}</div>
                <div style={styles.col}>
                  <select
                    value={s.paymentStatus || "unpaid"}
                    onChange={(e) => updatePaymentStatus(s.id, e.target.value)}
                    style={{ ...styles.statusSelect, color: statusColor, backgroundColor: `${statusColor}15` }}
                  >
                    <option value="unpaid">לא שולם</option>
                    <option value="paid">שולם</option>
                  </select>
                </div>
                <div style={{ textAlign: "left" }}><button onClick={() => deleteSession(s.id)} style={styles.deleteBtn}>🗑️</button></div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: 1200, margin: "0 auto", padding: "16px", direction: "rtl" },
  pageHeader: { marginBottom: 20 },
  pageTitle: { fontSize: 24, margin: 0 },
  pageSubtitle: { color: "#64748b", fontSize: 14 },
  filters: { display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" },
  searchInput: { flex: "1 1 200px", padding: "12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 16 },
  select: { flex: "1 1 140px", padding: "10px", borderRadius: 8, border: "1px solid #e2e8f0", backgroundColor: "#fff" },

  // תצוגת מחשב
  tableWrap: { backgroundColor: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
  tableHeader: { display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 0.8fr 1fr 40px", padding: "12px 16px", backgroundColor: "#f8fafc", fontWeight: 700, fontSize: 13, color: "#94a3b8" },
  tableRow: { display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 0.8fr 1fr 40px", padding: "12px 16px", borderBottom: "1px solid #f1f5f9", alignItems: "center" },

  // תצוגת נייד
  mobileList: { display: "flex", flexDirection: "column", gap: 12 },
  mobileCard: { backgroundColor: "#fff", padding: "16px", borderRadius: 12, boxShadow: "0 2px 4px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" },
  cardHeader: { display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 16 },
  cardBody: { fontSize: 13, color: "#64748b", lineHeight: 1.6, marginBottom: 12 },
  cardActions: { display: "flex", gap: 10, alignItems: "center" },

  statusSelect: { border: "none", borderRadius: 12, padding: "6px 10px", fontSize: 12, fontWeight: 600, appearance: "none", cursor: "pointer" },
  patientLink: { color: "#3b82f6", textDecoration: "none", fontWeight: 600 },
  deleteBtn: { background: "none", border: "none", cursor: "pointer", fontSize: 16 },
  loading: { textAlign: "center", padding: "40px" },
  empty: { textAlign: "center", padding: "40px", color: "#94a3b8" }
};
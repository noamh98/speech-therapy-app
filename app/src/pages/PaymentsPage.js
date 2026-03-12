import React, { useState } from "react";
import { Link } from "react-router-dom";
import { usePatients } from "../hooks/usePatients";
import { useSessions } from "../hooks/useSessions";

export default function PaymentsPage() {
  const { patients } = usePatients();
  const { sessions, loading, updatePaymentStatus, getTotalIncome, getUnpaidTotal } = useSessions();
  const [filter, setFilter] = useState("unpaid");

  const totalIncome = getTotalIncome();
  const totalOwed = getUnpaidTotal();

  const filtered = sessions.filter((s) => {
    if (filter === "all") return true;
    return s.paymentStatus === filter;
  });

  const groupedByPatient = {};
  filtered.forEach((s) => {
    if (!groupedByPatient[s.patientId]) {
      groupedByPatient[s.patientId] = { sessions: [], total: 0 };
    }
    groupedByPatient[s.patientId].sessions.push(s);
    groupedByPatient[s.patientId].total += s.price || 0;
  });

  if (loading) return <div style={styles.loading}>טוען נתוני תשלומים...</div>;

  return (
    <div style={styles.page}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>תשלומים</h1>
          <p style={styles.pageSubtitle}>סקירה פיננסית ומעקב חובות</p>
        </div>
      </div>

      <div style={styles.statsRow}>
        <div style={{ ...styles.statCard, borderColor: "#10b981" }}>
          <div style={styles.statAmount}>₪{totalIncome.toLocaleString()}</div>
          <div style={styles.statLabel}>הכנסות (שולמו)</div>
        </div>
        <div style={{ ...styles.statCard, borderColor: "#ef4444" }}>
          <div style={{ ...styles.statAmount, color: "#ef4444" }}>₪{totalOwed.toLocaleString()}</div>
          <div style={styles.statLabel}>יתרה לתשלום (חוב)</div>
        </div>
        <div style={{ ...styles.statCard, borderColor: "#3b82f6" }}>
          <div style={styles.statAmount}>₪{(totalIncome + totalOwed).toLocaleString()}</div>
          <div style={styles.statLabel}>סה"כ חיובים</div>
        </div>
        <div style={{ ...styles.statCard, borderColor: "#8b5cf6" }}>
          <div style={styles.statAmount}>
            {sessions.filter(s => s.paymentStatus !== "paid").length}
          </div>
          <div style={styles.statLabel}>טיפולים שלא שולמו</div>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.filterRow}>
          {[
            { id: "unpaid", label: "לא שולם" },
            { id: "partial", label: "שולם חלקית" },
            { id: "paid", label: "שולם" },
            { id: "all", label: "הכל" }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{ ...styles.filterBtn, ...(filter === f.id ? styles.filterActive : {}) }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {Object.keys(groupedByPatient).length === 0 ? (
          <div style={styles.empty}>
            <span style={{ fontSize: 36, display: "block", marginBottom: 12 }}>✅</span>
            <p>אין טיפולים בקטגוריה זו.</p>
          </div>
        ) : (
          Object.entries(groupedByPatient).map(([patientId, data]) => {
            const patient = patients.find((p) => p.id === patientId);
            return (
              <div key={patientId} style={styles.patientGroup}>
                <div style={styles.groupHeader}>
                  <Link to={`/patients/${patientId}`} style={styles.groupTitle}>
                    {patient ? patient.fullName : "מטופל לא ידוע"}
                  </Link>
                  <div style={styles.groupTotal}>
                    סה"כ: <strong>₪{data.total.toLocaleString()}</strong>
                  </div>
                </div>
                <div style={styles.table}>
                  <div style={styles.tableHeader}>
                    <div>תאריך</div>
                    <div>סוג</div>
                    <div>משך</div>
                    <div>מחיר</div>
                    <div>סטטוס</div>
                    <div>אמצעי תשלום</div>
                    <div>פעולות</div>
                  </div>
                  {data.sessions.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime)).map((s) => (
                    <div key={s.id} style={styles.tableRow}>
                      <div style={styles.cell}>
                        {s.dateTime ? new Date(s.dateTime).toLocaleDateString("he-IL") : "—"}
                      </div>
                      <div style={styles.cell}>{s.type === 'evaluation' ? 'אבחון' : 'טיפול'}</div>
                      <div style={styles.cell}>{s.durationMinutes ? `${s.durationMinutes} דק'` : "—"}</div>
                      <div style={{ ...styles.cell, fontWeight: 600 }}>₪{(s.price || 0).toLocaleString()}</div>
                      <div style={styles.cell}>
                        <select
                          value={s.paymentStatus || "unpaid"}
                          onChange={(e) => updatePaymentStatus(s.id, e.target.value)}
                          style={{
                            ...styles.statusSelect,
                            backgroundColor: s.paymentStatus === "paid" ? "rgba(16,185,129,0.1)" : s.paymentStatus === "partial" ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)",
                            color: s.paymentStatus === "paid" ? "#10b981" : s.paymentStatus === "partial" ? "#f59e0b" : "#ef4444",
                          }}
                        >
                          <option value="unpaid">לא שולם</option>
                          <option value="partial">חלקי</option>
                          <option value="paid">שולם</option>
                        </select>
                      </div>
                      <div style={styles.cell}>
                        {s.paymentMethod === 'cash' ? 'מזומן' :
                          s.paymentMethod === 'bit' ? 'ביט' :
                            s.paymentMethod === 'transfer' ? 'העברה' :
                              s.paymentMethod === 'credit' ? 'אשראי' : '—'}
                      </div>
                      <div style={styles.cell}>
                        {s.paymentStatus !== "paid" && (
                          <button
                            onClick={() => updatePaymentStatus(s.id, "paid")}
                            style={styles.markPaidBtn}
                          >
                            סמן כשולם ✓
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: 1100, margin: "0 auto", direction: "rtl", textAlign: "right", padding: "20px" },
  loading: { display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "#64748b", direction: "rtl" },
  pageHeader: { marginBottom: 28 },
  pageTitle: { margin: "0 0 4px", fontSize: 28, fontWeight: 700, color: "#1e293b" },
  pageSubtitle: { margin: 0, color: "#64748b", fontSize: 14 },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 },
  statCard: { backgroundColor: "#fff", borderRadius: 12, padding: "20px 22px", borderTop: "3px solid #3b82f6", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  statAmount: { fontSize: 26, fontWeight: 700, color: "#1e293b", marginBottom: 6 },
  statLabel: { fontSize: 12, color: "#64748b", fontWeight: 500 },
  section: { backgroundColor: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  filterRow: { display: "flex", gap: 8, marginBottom: 24 },
  filterBtn: { padding: "7px 16px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", fontSize: 13, cursor: "pointer", color: "#64748b" },
  filterActive: { background: "#3b82f6", color: "#fff", borderColor: "#3b82f6" },
  patientGroup: { marginBottom: 24, border: "1px solid #f1f5f9", borderRadius: 10, overflow: "hidden" },
  groupHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", backgroundColor: "#f8fafc" },
  groupTitle: { fontSize: 14, fontWeight: 600, color: "#3b82f6", textDecoration: "none" },
  groupTotal: { fontSize: 13, color: "#64748b" },
  table: { overflowX: "auto" },
  tableHeader: { display: "grid", gridTemplateColumns: "1fr 1fr 0.8fr 0.8fr 1fr 1fr 1.2fr", padding: "8px 16px", fontSize: 11, fontWeight: 700, color: "#94a3b8", backgroundColor: "#fafafa" },
  tableRow: { display: "grid", gridTemplateColumns: "1fr 1fr 0.8fr 0.8fr 1fr 1fr 1.2fr", padding: "12px 16px", borderTop: "1px solid #f8fafc", alignItems: "center" },
  cell: { fontSize: 13, color: "#475569" },
  statusSelect: { border: "none", borderRadius: 20, padding: "3px 8px", fontSize: 11, fontWeight: 600, cursor: "pointer", outline: "none", appearance: "none", textAlign: "center" },
  markPaidBtn: { padding: "4px 10px", backgroundColor: "rgba(16,185,129,0.1)", color: "#10b981", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer" },
  empty: { textAlign: "center", padding: "40px 20px", color: "#94a3b8" },
};
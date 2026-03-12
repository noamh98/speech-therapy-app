import React from "react";
import { Link } from "react-router-dom";
import { usePatients } from "../hooks/usePatients";
import { useSessions } from "../hooks/useSessions";

export default function DashboardPage() {
  const { patients, loading: pLoading } = usePatients();
  const { sessions, loading: sLoading, getUnpaidSessions, getTotalIncome, getUnpaidTotal } = useSessions();

  const loading = pLoading || sLoading;

  if (loading) {
    return <div style={styles.loading}>טוען נתונים...</div>;
  }

  // לוגיקה מהקוד הישן
  const activePatients = patients.filter((p) => p.status === "active");
  const unpaid = getUnpaidSessions();
  const totalIncome = getTotalIncome();
  const unpaidTotal = getUnpaidTotal();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const sessionsThisMonth = sessions.filter((s) => s.dateTime && new Date(s.dateTime) >= monthStart);

  return (
    <div style={styles.container}>
      {/* שורת הכרטיסים הצבעוניים - לפי העיצוב החדש */}
      <div style={styles.statsGrid}>

        <div style={{ ...styles.statCard, background: "linear-gradient(135deg, #ff8c00 0%, #ff4500 100%)" }}>
          <div style={styles.cardHeader}>
            <span className="material-icons">person</span>
            <span style={styles.cardLabel}>מטופלים פעילים</span>
          </div>
          <div style={styles.cardValue}>{activePatients.length}</div>
          <div style={styles.cardSubValue}>מתוך {patients.length} סה"כ</div>
        </div>

        <div style={{ ...styles.statCard, background: "linear-gradient(135deg, #8a2be2 0%, #9370db 100%)" }}>
          <div style={styles.cardHeader}>
            <span className="material-icons">event_note</span>
            <span style={styles.cardLabel}>טיפולים החודש</span>
          </div>
          <div style={styles.cardValue}>{sessionsThisMonth.length}</div>
          <div style={styles.cardSubValue}>החודש הנוכחי</div>
        </div>

        <div style={{ ...styles.statCard, background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}>
          <div style={styles.cardHeader}>
            <span className="material-icons">payments</span>
            <span style={styles.cardLabel}>הכנסות (שולמו)</span>
          </div>
          <div style={styles.cardValue}>₪{totalIncome.toLocaleString()}</div>
          <div style={styles.cardSubValue}>סה"כ שהתקבל</div>
        </div>

        <div style={{ ...styles.statCard, background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)" }}>
          <div style={styles.cardHeader}>
            <span className="material-icons">priority_high</span>
            <span style={styles.cardLabel}>ממתין לתשלום</span>
          </div>
          <div style={styles.cardValue}>₪{unpaidTotal.toLocaleString()}</div>
          <div style={styles.cardSubValue}>{unpaid.length} טיפולים בחוב</div>
        </div>

      </div>

      {/* טבלאות נתונים - בעיצוב הכרטיס הלבן והנקי */}
      <div style={styles.lowerGrid}>

        {/* פגישות הממתינות לתשלום */}
        <div style={styles.whiteCard}>
          <div style={styles.whiteCardHeader}>
            <h3 style={styles.cardTitle}>חובות פתוחים</h3>
            <Link to="/payments" style={styles.seeAll}>צפה בהכל ←</Link>
          </div>

          {unpaid.length === 0 ? (
            <div style={styles.emptyState}>🎉 כל הפגישות שולמו!</div>
          ) : (
            <div style={styles.simpleList}>
              {unpaid.slice(0, 5).map(s => {
                const patient = patients.find(p => p.id === s.patientId);
                return (
                  <div key={s.id} style={styles.listItem}>
                    <div style={styles.itemMain}>
                      <span style={styles.itemName}>{patient?.fullName || "לא ידוע"}</span>
                      <span style={styles.itemDate}>{new Date(s.dateTime).toLocaleDateString("he-IL")}</span>
                    </div>
                    <span style={styles.itemAmount}>₪{s.price}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* פגישות אחרונות */}
        <div style={styles.whiteCard}>
          <div style={styles.whiteCardHeader}>
            <h3 style={styles.cardTitle}>טיפולים אחרונים</h3>
            <Link to="/sessions" style={styles.seeAll}>צפה בהכל ←</Link>
          </div>
          <div style={styles.simpleList}>
            {sessions.slice(0, 5).map(s => {
              const patient = patients.find(p => p.id === s.patientId);
              return (
                <div key={s.id} style={styles.listItem}>
                  <div style={styles.itemMain}>
                    <span style={styles.itemName}>{patient?.fullName || "לא ידוע"}</span>
                    <span style={styles.itemDate}>{new Date(s.dateTime).toLocaleDateString("he-IL")}</span>
                  </div>
                  <div style={{
                    ...styles.badge,
                    backgroundColor: s.paymentStatus === 'paid' ? '#ecfdf5' : '#fef2f2',
                    color: s.paymentStatus === 'paid' ? '#10b981' : '#ef4444'
                  }}>
                    {s.paymentStatus === 'paid' ? 'שולם' : 'לא שולם'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

const styles = {
  container: { padding: "10px 0", direction: "rtl" },
  loading: { textAlign: "center", padding: "100px", color: "#64748b" },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "20px",
    marginBottom: "30px"
  },
  statCard: {
    borderRadius: "20px",
    padding: "24px",
    color: "#fff",
    boxShadow: "0 10px 20px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  cardHeader: { display: "flex", alignItems: "center", gap: "8px", opacity: 0.9 },
  cardLabel: { fontSize: "15px", fontWeight: "600" },
  cardValue: { fontSize: "30px", fontWeight: "800" },
  cardSubValue: { fontSize: "12px", opacity: 0.8 },

  lowerGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
    gap: "20px"
  },
  whiteCard: {
    backgroundColor: "#fff",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
  },
  whiteCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px"
  },
  cardTitle: { fontSize: "18px", fontWeight: "700", color: "#1e293b", margin: 0 },
  seeAll: { fontSize: "13px", color: "#3b82f6", textDecoration: "none" },

  simpleList: { display: "flex", flexDirection: "column", gap: "16px" },
  listItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: "12px",
    borderBottom: "1px solid #f1f5f9"
  },
  itemMain: { display: "flex", flexDirection: "column" },
  itemName: { fontWeight: "600", color: "#1e293b", fontSize: "15px" },
  itemDate: { fontSize: "12px", color: "#94a3b8" },
  itemAmount: { fontWeight: "700", color: "#1e293b" },
  badge: { padding: "4px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: "600" },
  emptyState: { textAlign: "center", padding: "40px", color: "#94a3b8" }
};
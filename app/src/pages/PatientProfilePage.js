import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { usePatients } from "../hooks/usePatients";
import { useSessions } from "../hooks/useSessions";

// --- קומפוננטת עזר להצגת שורה במידע האישי ---
function InfoItem({ label, value, icon }) {
  return (
    <div style={styles.infoItem}>
      <span className="material-icons" style={styles.infoIcon}>{icon}</span>
      <div style={styles.infoText}>
        <span style={styles.infoLabel}>{label}</span>
        <span style={styles.infoValue}>{value || "---"}</span>
      </div>
    </div>
  );
}

// --- קומפוננטת המודאל להוספה/עריכת מפגש ---
function SessionModal({ session, onClose, onSave }) {
  const [formData, setFormData] = useState(session || {
    dateTime: new Date().toISOString().slice(0, 16),
    type: "treatment",
    price: 150,
    notes: "",
    paymentStatus: "unpaid"
  });

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.content} onClick={(e) => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <h3 style={{ margin: 0 }}>{session?.id ? "עריכת מפגש" : "רישום מפגש חדש"}</h3>
          <button onClick={onClose} style={modalStyles.closeBtn}>×</button>
        </div>

        <div style={modalStyles.body}>
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>תאריך ושעה</label>
            <input
              type="datetime-local"
              value={formData.dateTime}
              onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
              style={modalStyles.input}
            />
          </div>

          <div style={modalStyles.field}>
            <label style={modalStyles.label}>סוג מפגש</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              style={modalStyles.input}
            >
              <option value="treatment">טיפול</option>
              <option value="assessment">אבחון</option>
              <option value="followup">מעקב</option>
            </select>
          </div>

          <div style={modalStyles.field}>
            <label style={modalStyles.label}>מחיר (₪)</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              style={modalStyles.input}
            />
          </div>

          <div style={modalStyles.field}>
            <label style={modalStyles.label}>הערות מהטיפול</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              style={{ ...modalStyles.input, minHeight: '80px', resize: 'vertical' }}
              placeholder="מה עשיתם היום?"
            />
          </div>
        </div>

        <div style={modalStyles.footer}>
          <button onClick={onClose} style={modalStyles.cancelBtn}>ביטול</button>
          <button onClick={() => onSave(formData)} style={modalStyles.saveBtn}>שמירה</button>
        </div>
      </div>
    </div>
  );
}

export default function PatientProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { patients, deletePatient } = usePatients();
  const { sessions, addSession, updateSession, updatePaymentStatus } = useSessions();
  const [sessionModal, setSessionModal] = useState(null);

  const patient = patients.find((p) => p.id === id);
  const patientSessions = sessions
    .filter((s) => s.patientId === id)
    .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));

  // --- לוגיקת פתיחה אוטומטית מהיומן ---
  useEffect(() => {
    if (location.state?.openNewSession) {
      setSessionModal({ session: null });
      // ניקוי ה-state כדי שלא ייפתח שוב ברענון דף
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  if (!patient) return <div style={styles.notFound}>מטופל לא נמצא</div>;

  const totalPaid = patientSessions.filter(s => s.paymentStatus === "paid").reduce((sum, s) => sum + (s.price || 0), 0);
  const totalOwed = patientSessions.filter(s => s.paymentStatus !== "paid").reduce((sum, s) => sum + (s.price || 0), 0);

  const handleSaveSession = async (data) => {
    if (data.id) {
      await updateSession(data.id, data);
    } else {
      await addSession({ ...data, patientId: id });
    }
    setSessionModal(null);
  };

  return (
    <div style={styles.page}>
      <Link to="/patients" style={styles.backLink}>
        <span className="material-icons" style={{ fontSize: '18px' }}>arrow_forward</span>
        חזרה לרשימת מטופלים
      </Link>

      <div style={styles.profileCard}>
        <div style={styles.profileMain}>
          <div style={styles.profileAvatar}>{patient.fullName ? patient.fullName[0] : "?"}</div>
          <div style={styles.profileText}>
            <h1 style={styles.profileName}>{patient.fullName}</h1>
            <div style={styles.statusRow}>
              <span style={{
                ...styles.statusBadge,
                backgroundColor: patient.status === "active" ? "#dcfce7" : "#f1f5f9",
                color: patient.status === "active" ? "#16a34a" : "#64748b"
              }}>
                {patient.status === "active" ? "פעיל" : (patient.status || "סטטוס לא מוגדר")}
              </span>
              <span style={styles.patientIdTag}>ת.ז: {patient.tz || "---"}</span>
            </div>
          </div>
        </div>
        <div style={styles.profileActions}>
          <button onClick={() => { if (window.confirm("למחוק את המטופל לצמיתות?")) { deletePatient(id); navigate("/patients"); } }} style={styles.deleteBtn}>
            <span className="material-icons" style={{ fontSize: '18px' }}>delete</span>
            מחיקה
          </button>
        </div>
      </div>

      <div style={styles.gridContainer}>
        <div style={styles.infoColumn}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span className="material-icons" style={styles.cardIcon}>contact_page</span>
              <h3 style={styles.cardTitle}>פרטי קשר וזיהוי</h3>
            </div>
            <div style={styles.infoGrid}>
              <InfoItem label="טלפון מטופל" value={patient.phone} icon="phone" />
              <InfoItem label="אימייל" value={patient.email} icon="alternate_email" />
              <InfoItem label="תאריך לידה" value={patient.dateOfBirth} icon="cake" />
              <InfoItem label="כתובת" value={patient.address} icon="home" />
              <InfoItem label="גישה לפורטול" value={patient.portalAccess === "enabled" ? "מאופשר" : "חסום"} icon="vpn_key" />
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span className="material-icons" style={styles.cardIcon}>family_restroom</span>
              <h3 style={styles.cardTitle}>פרטי הורים</h3>
            </div>
            <div style={styles.infoGrid}>
              <InfoItem label="הורה 1" value={patient.parentName1} icon="person" />
              <InfoItem label="טלפון הורה 1" value={patient.parentPhone1} icon="smartphone" />
              <div style={{ height: '1px', backgroundColor: '#f1f5f9', margin: '4px 0' }} />
              <InfoItem label="הורה 2" value={patient.parentName2} icon="person_outline" />
              <InfoItem label="טלפון הורה 2" value={patient.parentPhone2} icon="smartphone" />
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span className="material-icons" style={styles.cardIcon}>payments</span>
              <h3 style={styles.cardTitle}>מצב כספי</h3>
            </div>
            <div style={styles.financeRow}>
              <div style={styles.financeBox}>
                <span style={styles.financeLabel}>שולם</span>
                <span style={styles.financeValue}>₪{totalPaid.toLocaleString()}</span>
              </div>
              <div style={{ ...styles.financeBox, borderRight: "1px solid #f1f5f9" }}>
                <span style={styles.financeLabel}>חוב</span>
                <span style={{ ...styles.financeValue, color: "#ef4444" }}>₪{totalOwed.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.sessionsColumn}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-icons" style={styles.cardIcon}>history</span>
                <h3 style={styles.cardTitle}>מפגשים אחרונים</h3>
              </div>
              <button onClick={() => setSessionModal({ session: null })} style={styles.addSessionBtn}>+ חדש</button>
            </div>

            <div style={styles.sessionList}>
              {patientSessions.length === 0 ? (
                <div style={styles.empty}>אין עדיין טיפולים מתועדים</div>
              ) : (
                patientSessions.map((s) => (
                  <div key={s.id} style={styles.sessionItem}>
                    <div style={styles.sessionDateBox}>
                      <span style={styles.sDay}>{new Date(s.dateTime).getDate()}</span>
                      <span style={styles.sMonth}>{new Date(s.dateTime).toLocaleString('he-IL', { month: 'short' })}</span>
                    </div>
                    <div style={styles.sessionMain}>
                      <div style={styles.sessionTop}>
                        <span style={styles.sessionType}>
                          {s.type === 'assessment' ? 'אבחון' : s.type === 'followup' ? 'מעקב' : 'טיפול'}
                        </span>
                        <span style={styles.sessionPrice}>₪{s.price}</span>
                      </div>
                      <div style={styles.sessionNotes}>{s.notes || "בלי הערות"}</div>
                      <div style={styles.sessionFooter}>
                        <button
                          onClick={() => updatePaymentStatus(s.id, s.paymentStatus === 'paid' ? 'unpaid' : 'paid')}
                          style={{ ...styles.payToggle, color: s.paymentStatus === 'paid' ? '#10b981' : '#ef4444' }}
                        >
                          <span className="material-icons" style={{ fontSize: '14px', marginLeft: '4px' }}>
                            {s.paymentStatus === 'paid' ? 'check_circle' : 'pending'}
                          </span>
                          {s.paymentStatus === 'paid' ? 'שולם' : 'לסמן כסודר'}
                        </button>
                        <button onClick={() => setSessionModal({ session: s })} style={styles.editBtn}>עריכה</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {sessionModal && (
        <SessionModal
          session={sessionModal.session}
          onClose={() => setSessionModal(null)}
          onSave={handleSaveSession}
        />
      )}
    </div>
  );
}

// --- אובייקטי העיצוב (Styles) נשארו כפי שהיו ---
const modalStyles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  content: { backgroundColor: '#fff', borderRadius: '28px', padding: '24px', width: '90%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', direction: 'rtl' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  closeBtn: { background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' },
  body: { display: 'flex', flexDirection: 'column', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '14px', fontWeight: '700', color: '#1e293b' },
  input: { padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '16px', outline: 'none', backgroundColor: '#f8fafc' },
  footer: { display: 'flex', gap: '12px', marginTop: '24px' },
  cancelBtn: { flex: 1, padding: '12px', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#fff', fontWeight: '700', cursor: 'pointer', color: '#64748b' },
  saveBtn: { flex: 2, padding: '12px', borderRadius: '14px', border: 'none', background: '#3b82f6', color: '#fff', fontWeight: '700', cursor: 'pointer' }
};

const styles = {
  page: { maxWidth: "1100px", margin: "0 auto", padding: "20px", direction: "rtl" },
  backLink: { display: "flex", alignItems: "center", gap: "8px", color: "#64748b", textDecoration: "none", marginBottom: "20px", fontWeight: "600" },
  profileCard: { backgroundColor: "#fff", borderRadius: "24px", padding: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", marginBottom: "24px", border: "1px solid #f1f5f9" },
  profileMain: { display: "flex", alignItems: "center", gap: "20px" },
  profileAvatar: { width: "64px", height: "64px", borderRadius: "20px", backgroundColor: "#3b82f6", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: "800" },
  profileName: { margin: 0, fontSize: "24px", fontWeight: "800", color: "#1e293b" },
  statusRow: { display: "flex", gap: "10px", marginTop: "4px", alignItems: "center" },
  statusBadge: { padding: "4px 12px", borderRadius: "8px", fontSize: "13px", fontWeight: "700" },
  patientIdTag: { color: "#94a3b8", fontSize: "13px" },
  deleteBtn: { display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", borderRadius: "12px", border: "1px solid #fee2e2", backgroundColor: "#fff", cursor: "pointer", color: "#ef4444", fontWeight: "600" },
  gridContainer: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" },
  card: { backgroundColor: "#fff", borderRadius: "24px", padding: "20px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", marginBottom: "20px", border: "1px solid #f1f5f9" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  cardIcon: { color: "#3b82f6", opacity: 0.8 },
  cardTitle: { fontSize: "16px", fontWeight: "700", color: "#1e293b", margin: 0 },
  infoGrid: { display: "flex", flexDirection: "column", gap: "16px" },
  infoItem: { display: "flex", gap: "12px", alignItems: "flex-start" },
  infoIcon: { fontSize: "18px", color: "#94a3b8", marginTop: "2px" },
  infoText: { display: "flex", flexDirection: "column" },
  infoLabel: { fontSize: "11px", color: "#94a3b8", fontWeight: "600" },
  infoValue: { fontSize: "14px", color: "#334155", fontWeight: "600" },
  financeRow: { display: "flex" },
  financeBox: { flex: 1, display: "flex", flexDirection: "column", padding: "10px" },
  financeLabel: { fontSize: "12px", color: "#64748b" },
  financeValue: { fontSize: "20px", fontWeight: "800", color: "#10b981" },
  addSessionBtn: { backgroundColor: "#3b82f6", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "10px", fontWeight: "700", cursor: "pointer" },
  sessionList: { display: "flex", flexDirection: "column", gap: "16px" },
  sessionItem: { display: "flex", gap: "16px", padding: "16px", backgroundColor: "#f8fafc", borderRadius: "16px" },
  sessionDateBox: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#fff", borderRadius: "12px", width: "50px", height: "55px", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" },
  sDay: { fontSize: "18px", fontWeight: "800", color: "#1e293b" },
  sMonth: { fontSize: "11px", color: "#3b82f6", fontWeight: "700" },
  sessionMain: { flex: 1 },
  sessionTop: { display: "flex", justifyContent: "space-between", marginBottom: "4px" },
  sessionType: { fontWeight: "700", fontSize: "14px" },
  sessionPrice: { fontWeight: "800", color: "#334155" },
  sessionNotes: { fontSize: "13px", color: "#64748b", marginBottom: "12px" },
  sessionFooter: { display: "flex", justifyContent: "space-between", borderTop: "1px solid #edf2f7", paddingTop: "8px" },
  payToggle: { display: "flex", alignItems: "center", background: "none", border: "none", fontSize: "12px", fontWeight: "700", cursor: "pointer" },
  editBtn: { background: "none", border: "none", color: "#3b82f6", fontSize: "12px", cursor: "pointer" },
  empty: { textAlign: "center", padding: "20px", color: "#94a3b8", fontSize: "14px" },
  notFound: { textAlign: "center", padding: "100px", fontSize: "20px", color: "#64748b" }
};
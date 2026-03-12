import React, { useState } from "react";
import { Link } from "react-router-dom";
import { usePatients } from "../hooks/usePatients";

// --- קומפוננטת המודאל להוספה/עריכת מטופל ---
const EMPTY_FORM = {
  fullName: "",
  tz: "",
  phone: "",
  email: "",
  status: "active",
  dateOfBirth: "",
  address: "",
  parentName1: "",
  parentPhone1: "",
  parentName2: "",
  parentPhone2: "",
  portalAccess: "disabled",
};

function PatientModal({ patient, onClose, onSave }) {
  const [form, setForm] = useState(patient || EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isMobile = window.innerWidth < 768;

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={ms.overlay} onClick={onClose}>
      <div style={ms.modal} onClick={(e) => e.stopPropagation()}>
        <div style={ms.modalHeader}>
          <h2 style={ms.modalTitle}>{patient ? "עריכת פרטי מטופל" : "הוספת מטופל חדש"}</h2>
          <button onClick={onClose} style={ms.closeBtn}>×</button>
        </div>
        {error && <div style={ms.errorBox}>{error}</div>}
        <form onSubmit={handleSubmit} style={ms.form}>
          <div style={{ ...ms.row, gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}>
            <div style={ms.field}>
              <label style={ms.label}>שם מלא *</label>
              <input name="fullName" value={form.fullName} onChange={handleChange} required style={ms.input} />
            </div>
            <div style={ms.field}>
              <label style={ms.label}>תעודת זהות *</label>
              <input name="tz" value={form.tz} onChange={handleChange} required style={ms.input} />
            </div>
          </div>

          <div style={{ ...ms.row, gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}>
            <div style={ms.field}>
              <label style={ms.label}>טלפון *</label>
              <input name="phone" type="tel" value={form.phone} onChange={handleChange} required style={ms.input} />
            </div>
            <div style={ms.field}>
              <label style={ms.label}>אימייל</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} style={ms.input} />
            </div>
          </div>

          <div style={{ ...ms.row, gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}>
            <div style={ms.field}>
              <label style={ms.label}>סטטוס</label>
              <select name="status" value={form.status} onChange={handleChange} style={ms.input}>
                <option value="active">פעיל</option>
                <option value="inactive">לא פעיל</option>
              </select>
            </div>
            <div style={ms.field}>
              <label style={ms.label}>תאריך לידה</label>
              <input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} style={ms.input} />
            </div>
          </div>

          <div style={ms.actions}>
            <button type="submit" disabled={saving} style={ms.saveBtn}>
              {saving ? "שומר..." : "שמור וסגור"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- הדף הראשי ---
export default function PatientsPage() {
  const { patients, loading, addPatient, updatePatient, archivePatient } = usePatients();
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");

  const filtered = patients.filter((p) => {
    const matchSearch = !search ||
      p.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      p.phone?.includes(search) ||
      p.tz?.includes(search);
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) return <div style={styles.loading}>טוען...</div>;

  return (
    <div style={styles.page}>
      <div style={styles.headerSection}>
        <div>
          <h1 style={styles.pageTitle}>המטופלים שלי</h1>
          <div style={styles.statsTag}>
            <span className="material-icons" style={{ fontSize: '14px' }}>group</span>
            {patients.filter(p => p.status === "active").length} מטופלים פעילים במערכת
          </div>
        </div>
        <button onClick={() => setModal({ patient: null })} style={styles.addBtn}>
          <span className="material-icons">add</span>
          מטופל חדש
        </button>
      </div>

      <div style={styles.filterSection}>
        <div style={styles.searchWrapper}>
          <span className="material-icons" style={styles.searchIcon}>search</span>
          <input
            placeholder="חיפוש לפי שם, טלפון או ת.ז..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <div style={styles.tabGroup}>
          <button
            onClick={() => setStatusFilter("active")}
            style={{ ...styles.tab, ...(statusFilter === "active" ? styles.tabActive : {}) }}
          >פעילים</button>
          <button
            onClick={() => setStatusFilter("inactive")}
            style={{ ...styles.tab, ...(statusFilter === "inactive" ? styles.tabActive : {}) }}
          >ארכיון</button>
        </div>
      </div>

      <div style={styles.grid}>
        {filtered.length > 0 ? filtered.map((p) => (
          <div key={p.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.avatar}>{p.fullName ? p.fullName[0].toUpperCase() : "?"}</div>
              <div style={styles.statusBadge(p.status)}>
                {p.status === 'active' ? 'פעיל' : 'בארכיון'}
              </div>
            </div>

            <Link to={`/patients/${p.id}`} style={styles.cardName}>{p.fullName}</Link>

            <div style={styles.cardDetails}>
              <div style={styles.detailRow}>
                <span className="material-icons" style={styles.detailIcon}>fingerprint</span>
                {p.tz || "---"}
              </div>
              <div style={styles.detailRow}>
                <span className="material-icons" style={styles.detailIcon}>phone</span>
                {p.phone || "---"}
              </div>
            </div>

            <div style={styles.cardFooter}>
              <Link to={`/patients/${p.id}`} style={styles.primaryAction}>פרופיל מלא</Link>
              <button onClick={() => setModal({ patient: p })} style={styles.secondaryAction}>
                <span className="material-icons" style={{ fontSize: '18px' }}>edit</span>
              </button>
              <button
                onClick={() => p.status === 'active' ? archivePatient(p.id) : updatePatient(p.id, { status: 'active' })}
                style={styles.secondaryAction}
              >
                <span className="material-icons" style={{ fontSize: '18px' }}>
                  {p.status === 'active' ? 'archive' : 'unarchive'}
                </span>
              </button>
            </div>
          </div>
        )) : (
          <div style={styles.emptyState}>לא נמצאו מטופלים העונים לחיפוש</div>
        )}
      </div>

      {modal && (
        <PatientModal
          patient={modal.patient}
          onClose={() => setModal(null)}
          onSave={async (data) => {
            if (modal.patient) await updatePatient(modal.patient.id, data);
            else await addPatient(data);
          }}
        />
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: "1200px", margin: "0 auto", padding: "30px 20px", direction: "rtl" },
  headerSection: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" },
  pageTitle: { fontSize: "28px", fontWeight: "800", color: "#1e293b", margin: 0 },
  statsTag: { display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "14px", marginTop: "4px" },
  addBtn: { display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#3b82f6", color: "#fff", border: "none", borderRadius: "14px", padding: "12px 24px", fontWeight: "700", cursor: "pointer", boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)" },
  filterSection: { display: "flex", gap: "16px", marginBottom: "32px", flexWrap: "wrap" },
  searchWrapper: { flex: 1, position: "relative", minWidth: "250px" },
  searchIcon: { position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" },
  searchInput: { width: "100%", padding: "14px 44px 14px 14px", borderRadius: "16px", border: "1px solid #e2e8f0", fontSize: "16px", outline: "none", backgroundColor: "#fff", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" },
  tabGroup: { display: "flex", background: "#f1f5f9", padding: "4px", borderRadius: "12px" },
  tab: { padding: "10px 20px", border: "none", background: "none", borderRadius: "8px", cursor: "pointer", color: "#64748b", fontWeight: "600", transition: "0.2s" },
  tabActive: { background: "#fff", color: "#1e293b", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" },
  card: { backgroundColor: "#fff", borderRadius: "24px", padding: "20px", border: "1px solid #f1f5f9", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", transition: "transform 0.2s" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" },
  avatar: { width: "50px", height: "50px", borderRadius: "16px", backgroundColor: "#eff6ff", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: "800" },
  statusBadge: (status) => ({ padding: "4px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: "700", backgroundColor: status === "active" ? "#dcfce7" : "#f1f5f9", color: status === "active" ? "#16a34a" : "#64748b" }),
  cardName: { fontSize: "18px", fontWeight: "800", color: "#1e293b", textDecoration: "none", display: "block", marginBottom: "12px" },
  cardDetails: { display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" },
  detailRow: { display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "14px" },
  detailIcon: { fontSize: "16px", color: "#cbd5e1" },
  cardFooter: { display: "flex", gap: "8px", borderTop: "1px solid #f1f5f9", paddingTop: "16px" },
  primaryAction: { flex: 1, backgroundColor: "#f8fafc", color: "#3b82f6", textAlign: "center", padding: "10px", borderRadius: "12px", fontSize: "14px", fontWeight: "700", textDecoration: "none", border: "1px solid #e2e8f0" },
  secondaryAction: { padding: "10px", borderRadius: "12px", border: "1px solid #e2e8f0", backgroundColor: "#fff", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  emptyState: { gridColumn: "1/-1", textAlign: "center", padding: "60px", color: "#94a3b8", fontSize: "16px" },
  loading: { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontSize: "20px", color: "#3b82f6", fontWeight: "700" }
};

const ms = {
  overlay: { position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, direction: "rtl", padding: "20px" },
  modal: { backgroundColor: "#fff", borderRadius: "28px", width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" },
  modalHeader: { padding: "24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { margin: 0, fontSize: "20px", fontWeight: "800", color: "#1e293b" },
  closeBtn: { background: "none", border: "none", fontSize: "24px", color: "#94a3b8", cursor: "pointer" },
  form: { padding: "24px" },
  row: { display: "grid", gap: "20px", marginBottom: "20px" },
  field: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "13px", fontWeight: "700", color: "#475569" },
  input: { padding: "12px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "16px", backgroundColor: "#f8fafc", outline: "none" },
  actions: { marginTop: "10px" },
  saveBtn: { width: "100%", padding: "14px", borderRadius: "14px", border: "none", backgroundColor: "#3b82f6", color: "#fff", fontSize: "16px", fontWeight: "700", cursor: "pointer", boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)" },
  errorBox: { margin: "0 24px 20px", padding: "12px", backgroundColor: "#fef2f2", color: "#ef4444", borderRadius: "12px", fontSize: "14px", border: "1px solid #fee2e2" }
};
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  format,
  startOfMonth,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  startOfWeek,
} from "date-fns";
import { he } from "date-fns/locale";
import { HebrewCalendar, HDate } from '@hebcal/core';
import { usePatients } from "../hooks/usePatients";
import { useSessions } from "../hooks/useSessions";
import { useGoogleCalendar } from "../hooks/useGoogleCalendar";

export default function CalendarPage() {
  const navigate = useNavigate();
  const { patients } = usePatients();
  const { sessions, loading, addSession, deleteSession, updateSession } = useSessions();
  const { connectGoogleCalendar } = useGoogleCalendar();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSeriesModalOpen, setIsSeriesModalOpen] = useState(false);
  const [viewingSession, setViewingSession] = useState(null);

  const [formData, setFormData] = useState({
    patientId: "",
    type: "טיפול",
    time: "09:00",
    price: 250,
    occurrences: 10,
    startDate: format(new Date(), "yyyy-MM-dd"),
  });

  const monthStart = startOfMonth(currentMonth);
  const calendarDays = [];
  let day = startOfWeek(monthStart, { weekStartsOn: 0 });
  while (calendarDays.length < 42) {
    calendarDays.push(day);
    day = addDays(day, 1);
  }

  const holidays = HebrewCalendar.calendar({
    year: currentMonth.getFullYear(),
    month: currentMonth.getMonth() + 1,
    il: true, holidays: true
  });

  const getSessionsForDay = (d) => sessions.filter(s => s.dateTime && isSameDay(new Date(s.dateTime), d));

  const isTimeSlotTaken = (dateTime) => {
    return sessions.some(s => s.dateTime && new Date(s.dateTime).getTime() === new Date(dateTime).getTime());
  };

  const handleAddSingle = async (e) => {
    e.preventDefault();
    const [hours, minutes] = formData.time.split(':');
    const sessionDate = new Date(selectedDay);
    sessionDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    if (isTimeSlotTaken(sessionDate) && !window.confirm("כבר קיים תור בשעה זו. להמשיך?")) return;

    try {
      await addSession({
        ...formData,
        duration: 45,
        dateTime: sessionDate.toISOString(),
        paymentStatus: "unpaid",
        status: "scheduled"
      });
      setIsAddModalOpen(false);
    } catch (err) { alert("שגיאה: " + err.message); }
  };

  const handleAddSeries = async (e) => {
    e.preventDefault();
    const [hours, minutes] = formData.time.split(':');
    const baseDate = new Date(formData.startDate);
    let conflictFound = false;

    try {
      for (let i = 0; i < formData.occurrences; i++) {
        const sessionDate = addDays(baseDate, i * 7);
        sessionDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        if (isTimeSlotTaken(sessionDate)) conflictFound = true;

        await addSession({
          patientId: formData.patientId,
          type: formData.type,
          price: formData.price,
          duration: 45,
          dateTime: sessionDate.toISOString(),
          paymentStatus: "unpaid",
          status: "scheduled"
        });
      }
      if (conflictFound) alert("הסדרה נוצרה, אך היו כפילויות בחלק מהתאריכים.");
      else alert("הסדרה נוצרה בהצלחה!");
      setIsSeriesModalOpen(false);
    } catch (err) { alert("שגיאה: " + err.message); }
  };

  const handleMarkMissed = async (id) => {
    try {
      await updateSession(id, { status: "missed" });
      setViewingSession(null);
    } catch (err) { alert("שגיאה בעדכון הסטטוס"); }
  };

  if (loading) return <div style={styles.loading}>טוען נתונים...</div>;

  return (
    <div style={styles.page}>
      <div style={styles.topActions}>
        <div style={styles.headerRight}>
          <h1 style={styles.mainTitle}>יומן טיפולים</h1>
          <div style={styles.currentMonthLabel}>{format(currentMonth, "MMMM yyyy", { locale: he })}</div>
        </div>
        <div style={styles.buttonGroup}>
          <button style={styles.seriesBtn} onClick={() => setIsSeriesModalOpen(true)}>🗓️ סדרת תורים</button>
          <button style={styles.ghostBtn} onClick={() => connectGoogleCalendar()}>🔗 יומן גוגל</button>
          <button style={styles.addBtn} onClick={() => setIsAddModalOpen(true)}>+ תור חדש</button>
        </div>
      </div>

      <div style={styles.subHeader}>
        <div style={styles.navBar}>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} style={styles.navArrow}>‹</button>
          <span style={styles.navText}>{format(currentMonth, "MMMM yyyy", { locale: he })}</span>
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} style={styles.navArrow}>›</button>
        </div>
      </div>

      <div style={styles.calendarCard}>
        <div style={styles.grid}>
          {calendarDays.map((d, idx) => {
            const daySessions = getSessionsForDay(d);
            const isSelected = isSameDay(d, selectedDay);
            const hdate = new HDate(d);
            const holiday = holidays.find(h => h.getDate().isSameDate(hdate));

            return (
              <div key={idx} onClick={() => setSelectedDay(d)} style={{
                ...styles.cell,
                opacity: isSameMonth(d, currentMonth) ? 1 : 0.3,
                border: isSelected ? '2px solid #3b82f6' : '1px solid #f1f5f9',
                backgroundColor: isSelected ? '#f8fafc' : '#fff'
              }}>
                <div style={styles.cellTop}>
                  <span style={styles.hebDate}>{hdate.renderGematriya().split(' ')[0]}</span>
                  <span style={styles.engDate}>{format(d, "d")}</span>
                </div>
                {holiday && <div style={styles.holidayTag}>{holiday.render('he')}</div>}
                <div style={styles.miniList}>
                  {daySessions.map(s => (
                    <div
                      key={s.id}
                      onClick={(e) => { e.stopPropagation(); setViewingSession(s); }}
                      style={{
                        ...styles.miniSession,
                        backgroundColor: s.status === "missed" ? "#fee2e2" : "#eff6ff",
                        borderRight: s.status === "missed" ? "3px solid #ef4444" : "3px solid #3b82f6"
                      }}
                    >
                      <span style={styles.mTime}>{format(new Date(s.dateTime), "HH:mm")}</span>
                      <span style={styles.mName}>{patients.find(p => p.id === s.patientId)?.fullName || "מטופל"}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {viewingSession && (
        <div style={styles.modalOverlay} onClick={() => setViewingSession(null)}>
          <div style={styles.detailModal} onClick={e => e.stopPropagation()}>
            <div style={styles.detailHeader}>
              <span>פרטי תור</span>
              <button onClick={() => setViewingSession(null)} style={styles.closeBtn}>✕</button>
            </div>
            <div style={styles.infoBox}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>מטופל 👤</span>
                <span style={styles.infoValue}>{patients.find(p => p.id === viewingSession.patientId)?.fullName}</span>
              </div>
            </div>
            <div style={styles.infoBox}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>תאריך ושעה 📅</span>
                <span style={styles.infoValue}>{format(new Date(viewingSession.dateTime), "d MMMM, yyyy, HH:mm", { locale: he })}</span>
                <span style={styles.infoSubText}>משך: 45 דקות</span>
              </div>
            </div>
            <div style={styles.actionRow}>
              <button style={styles.editBtn}>📝</button>
              <button
                style={styles.recordBtn}
                // תיקון: patients ברבים כדי להתאים ל-App.js
                onClick={() => navigate(`/patients/${viewingSession.patientId}`, { state: { openNewSession: true } })}
              >
                📄 תעד טיפול
              </button>
            </div>
            <div style={styles.footerActions}>
              <button style={styles.cancelSessionBtn} onClick={() => { if (window.confirm("לבטל?")) { deleteSession(viewingSession.id); setViewingSession(null); } }}>✕ בטל תור</button>
              <button style={styles.closeActionBtn} onClick={() => setViewingSession(null)}>סגור</button>
            </div>
            <button style={styles.missedLink} onClick={() => handleMarkMissed(viewingSession.id)}>סמן כהחמצה</button>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>קביעת תור</h3>
            <form onSubmit={handleAddSingle} style={styles.form}>
              <select required style={styles.input} onChange={e => setFormData({ ...formData, patientId: e.target.value })}>
                <option value="">בחר מטופל...</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.fullName}</option>)}
              </select>
              <input type="time" value={formData.time} style={styles.input} onChange={e => setFormData({ ...formData, time: e.target.value })} />
              <button type="submit" style={styles.saveBtn}>שמור</button>
              <button type="button" onClick={() => setIsAddModalOpen(false)} style={styles.cancelBtn}>ביטול</button>
            </form>
          </div>
        </div>
      )}

      {isSeriesModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>סדרת תורים</h3>
            <form onSubmit={handleAddSeries} style={styles.form}>
              <select required style={styles.input} onChange={e => setFormData({ ...formData, patientId: e.target.value })}>
                <option value="">בחר מטופל...</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.fullName}</option>)}
              </select>
              <label style={styles.label}>תאריך התחלה:</label>
              <input type="date" value={formData.startDate} style={styles.input} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
              <input type="time" value={formData.time} style={styles.input} onChange={e => setFormData({ ...formData, time: e.target.value })} />
              <input type="number" value={formData.occurrences} min="1" max="52" style={styles.input} onChange={e => setFormData({ ...formData, occurrences: parseInt(e.target.value) })} />
              <button type="submit" style={styles.seriesSaveBtn}>צור סדרה שבועית</button>
              <button type="button" onClick={() => setIsSeriesModalOpen(false)} style={styles.cancelBtn}>ביטול</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { direction: "rtl", padding: "20px", backgroundColor: "#f8fafc", minHeight: "100vh", fontFamily: "sans-serif" },
  topActions: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" },
  mainTitle: { fontSize: "28px", fontWeight: "800", margin: 0 },
  currentMonthLabel: { color: "#64748b", fontSize: "16px" },
  buttonGroup: { display: "flex", gap: "10px" },
  seriesBtn: { padding: "10px 15px", borderRadius: "10px", border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontWeight: "600" },
  addBtn: { background: "linear-gradient(135deg, #3b82f6, #06b6d4)", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "10px", fontWeight: "700", cursor: "pointer" },
  ghostBtn: { padding: "10px 15px", borderRadius: "10px", border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer" },
  subHeader: { display: "flex", justifyContent: "center", marginBottom: "20px" },
  navBar: { display: "flex", alignItems: "center", gap: "20px" },
  navArrow: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "5px 15px", cursor: "pointer" },
  navText: { fontWeight: "700", fontSize: "18px", minWidth: "150px", textAlign: "center" },
  calendarCard: { background: "#fff", borderRadius: "20px", padding: "10px", boxShadow: "0 4px 6px rgba(0,0,0,0.02)" },
  grid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1px", backgroundColor: "#f1f5f9" },
  cell: { background: "#fff", minHeight: "110px", padding: "8px", cursor: "pointer" },
  cellTop: { display: "flex", justifyContent: "space-between" },
  engDate: { fontWeight: "700" },
  hebDate: { fontSize: "11px", color: "#cbd5e1" },
  holidayTag: { fontSize: "10px", color: "#ef4444", fontWeight: "800" },
  miniList: { display: "flex", flexDirection: "column", gap: "3px", marginTop: "5px" },
  miniSession: { display: "flex", gap: "4px", padding: "2px 5px", borderRadius: "4px", fontSize: "10px" },
  mTime: { fontWeight: "800", color: "#2563eb" },
  mName: { overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" },
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modalContent: { background: "#fff", padding: "20px", borderRadius: "20px", width: "320px" },
  modalTitle: { margin: "0 0 15px 0", fontSize: "18px", fontWeight: "700" },
  form: { display: "flex", flexDirection: "column", gap: "10px" },
  input: { padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", outline: "none" },
  label: { fontSize: "12px", fontWeight: "600", color: "#64748b" },
  saveBtn: { padding: "12px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700" },
  seriesSaveBtn: { padding: "12px", background: "#8b5cf6", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700" },
  cancelBtn: { padding: "10px", background: "#f1f5f9", border: "none", borderRadius: "10px", cursor: "pointer" },
  detailModal: { background: "#fff", padding: "24px", borderRadius: "20px", width: "350px", display: "flex", flexDirection: "column", gap: "16px" },
  detailHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: "700", fontSize: "18px" },
  closeBtn: { background: "none", border: "none", fontSize: "18px", cursor: "pointer" },
  infoBox: { backgroundColor: "#f8fafc", padding: "16px", borderRadius: "12px" },
  infoItem: { display: "flex", flexDirection: "column", gap: "4px" },
  infoLabel: { fontSize: "12px", color: "#94a3b8" },
  infoValue: { fontWeight: "700", fontSize: "16px" },
  infoSubText: { fontSize: "12px", color: "#64748b" },
  actionRow: { display: "flex", gap: "12px" },
  editBtn: { padding: "10px", borderRadius: "10px", border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer" },
  recordBtn: { flex: 1, padding: "12px", borderRadius: "10px", background: "linear-gradient(135deg, #3b82f6, #06b6d4)", color: "#fff", border: "none", fontWeight: "700", cursor: "pointer" },
  footerActions: { display: "flex", gap: "12px" },
  cancelSessionBtn: { flex: 1, padding: "12px", borderRadius: "10px", background: "#ef4444", color: "#fff", border: "none", fontWeight: "700", cursor: "pointer" },
  closeActionBtn: { flex: 1, padding: "12px", borderRadius: "10px", background: "#fff", border: "1px solid #e2e8f0", fontWeight: "700", cursor: "pointer" },
  missedLink: { background: "none", border: "none", color: "#ef4444", fontSize: "14px", cursor: "pointer", marginTop: "8px", textDecoration: "underline" },
  loading: { textAlign: "center", marginTop: "100px" }
};
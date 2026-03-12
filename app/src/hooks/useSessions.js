import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";

export function useSessions() {
  const { currentUser } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "sessions"),
      where("therapistId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        data.sort((a, b) => {
          const aTime = a.dateTime ? new Date(a.dateTime).getTime() : 0;
          const bTime = b.dateTime ? new Date(b.dateTime).getTime() : 0;
          return bTime - aTime;
        });
        setSessions(data);
        setLoading(false);
      },
      (err) => {
        console.error("useSessions error:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [currentUser]);

  // --- הפונקציות המקוריות ששלחת לי בקוד הישן ---

  function getUnpaidSessions() {
    return sessions.filter((s) => s.paymentStatus !== "paid");
  }

  function getTotalIncome() {
    return sessions
      .filter((s) => s.paymentStatus === "paid")
      .reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0);
  }

  function getUnpaidTotal() {
    return sessions
      .filter((s) => s.paymentStatus !== "paid")
      .reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0);
  }

  // פונקציות כתיבה
  async function addSession(data) {
    const docRef = await addDoc(collection(db, "sessions"), {
      ...data,
      therapistId: currentUser.uid,
      paymentStatus: data.paymentStatus || "unpaid",
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  }

  async function updateSession(id, data) {
    await updateDoc(doc(db, "sessions", id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }

  async function deleteSession(id) {
    await deleteDoc(doc(db, "sessions", id));
  }

  return {
    sessions,
    loading,
    error,
    addSession,
    updateSession,
    deleteSession,
    getUnpaidSessions, // עכשיו זה קיים ומוחזר!
    getTotalIncome,    // עכשיו זה קיים ומוחזר!
    getUnpaidTotal,    // עכשיו זה קיים ומוחזר!
  };
}
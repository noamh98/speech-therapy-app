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

export function usePatients() {
  const { currentUser } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "patients"),
      where("therapistId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

        data.sort((a, b) => {
          const aName = a.fullName || "";
          const bName = b.fullName || "";
          return aName.localeCompare(bName, "he");
        });

        setPatients(data);
        setLoading(false);
      },
      (err) => {
        console.error("טעות בשליפת מטופלים:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [currentUser]);

  // הוספת מטופל - סנכרון שמות שדות עם ה-UI
  async function addPatient(formData) {
    try {
      await addDoc(collection(db, "patients"), {
        // שדות זיהוי וקשר
        fullName: formData.fullName || "",
        tz: formData.tz || "",
        email: formData.email || "",
        phone: formData.phone || "",
        dateOfBirth: formData.dateOfBirth || "",
        address: formData.address || "",

        // פרטי הורים - הותאם ל-UI (parent במקום guardian)
        parentName1: formData.parentName1 || "",
        parentPhone1: formData.parentPhone1 || "",
        parentName2: formData.parentName2 || "",
        parentPhone2: formData.parentPhone2 || "",

        // ניהול וגישה
        status: formData.status || "active",
        portalAccess: formData.portalAccess || "disabled",

        therapistId: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error adding patient:", err);
      throw err;
    }
  }

  async function updatePatient(id, data) {
    try {
      const patientRef = doc(db, "patients", id);
      await updateDoc(patientRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error updating patient:", err);
      throw err;
    }
  }

  async function deletePatient(id) {
    try {
      await deleteDoc(doc(db, "patients", id));
    } catch (err) {
      console.error("Error deleting patient:", err);
      throw err;
    }
  }

  async function archivePatient(id) {
    await updatePatient(id, { status: "inactive" });
  }

  return {
    patients,
    loading,
    error,
    addPatient,
    updatePatient,
    deletePatient,
    archivePatient, // הוספתי כדי שיתאים לקריאה מה-PatientsPage
  };
}
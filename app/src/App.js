import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import Layout from "./components/Layout";

// Pages
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import PatientsPage from "./pages/PatientsPage";
import PatientProfilePage from "./pages/PatientProfilePage";
import SessionsPage from "./pages/SessionsPage";
import CalendarPage from "./pages/CalendarPage";
import PaymentsPage from "./pages/PaymentsPage";
import GoogleAuthCallbackPage from "./pages/GoogleAuthCallbackPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* עטיפת האפליקציה ב-div עם כיווניות RTL מבטיחה שכל הניווט והתוכן יתנהגו כראוי */}
        <div style={{ direction: "rtl", textAlign: "right", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/google/callback" element={<GoogleAuthCallbackPage />} />

            {/* דף הבית / דאשבורד */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout>
                    <DashboardPage />
                  </Layout>
                </PrivateRoute>
              }
            />

            {/* ניהול מטופלים */}
            <Route
              path="/patients"
              element={
                <PrivateRoute>
                  <Layout>
                    <PatientsPage />
                  </Layout>
                </PrivateRoute>
              }
            />

            {/* פרופיל מטופל ספציפי */}
            <Route
              path="/patients/:id"
              element={
                <PrivateRoute>
                  <Layout>
                    <PatientProfilePage />
                  </Layout>
                </PrivateRoute>
              }
            />

            {/* יומן טיפולים - רשימה */}
            <Route
              path="/sessions"
              element={
                <PrivateRoute>
                  <Layout>
                    <SessionsPage />
                  </Layout>
                </PrivateRoute>
              }
            />

            {/* לוח שנה ויזואלי */}
            <Route
              path="/calendar"
              element={
                <PrivateRoute>
                  <Layout>
                    <CalendarPage />
                  </Layout>
                </PrivateRoute>
              }
            />

            {/* כספים ותשלומים */}
            <Route
              path="/payments"
              element={
                <PrivateRoute>
                  <Layout>
                    <PaymentsPage />
                  </Layout>
                </PrivateRoute>
              }
            />

            {/* ניתוב מחדש לכל נתיב לא מוכר */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";

export function useGoogleCalendar() {
  async function connectGoogleCalendar() {
    const startGoogleAuth = httpsCallable(functions, "startGoogleAuth");
    const result = await startGoogleAuth({});
    const { authUrl } = result.data;
    window.location.href = authUrl;
  }

  async function createEventForSession(session) {
    const createCalendarEvent = httpsCallable(functions, "createCalendarEvent");
    const result = await createCalendarEvent({ session });
    return result.data.eventId;
  }

  async function updateEventForSession(session) {
    if (!session.googleCalendarEventId) return null;
    const updateCalendarEvent = httpsCallable(functions, "updateCalendarEvent");
    const result = await updateCalendarEvent({ session });
    return result.data.eventId;
  }

  async function deleteEventForSession(googleCalendarEventId) {
    if (!googleCalendarEventId) return;
    const deleteCalendarEvent = httpsCallable(functions, "deleteCalendarEvent");
    await deleteCalendarEvent({ eventId: googleCalendarEventId });
  }

  return {
    connectGoogleCalendar,
    createEventForSession,
    updateEventForSession,
    deleteEventForSession,
  };
}

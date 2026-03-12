const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { google } = require("googleapis");

admin.initializeApp();
const db = admin.firestore();

// ─────────────────────────────────────────────
// Helper: build an authenticated OAuth2 client
// ─────────────────────────────────────────────
function buildOAuth2Client() {
  const cfg = functions.config().google;
  return new google.auth.OAuth2(
    cfg.client_id,
    cfg.client_secret,
    cfg.redirect_uri
  );
}

// ─────────────────────────────────────────────
// Helper: load stored tokens for a user, refresh if needed
// ─────────────────────────────────────────────
async function getAuthorizedClient(uid) {
  const therapistRef = db.collection("therapists").doc(uid);
  const snap = await therapistRef.get();

  if (!snap.exists || !snap.data().googleTokens) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Google Calendar is not connected. Please authorize first."
    );
  }

  const tokens = snap.data().googleTokens;
  const oauth2Client = buildOAuth2Client();
  oauth2Client.setCredentials(tokens);

  // If access token is expired, refresh it
  if (tokens.expiry_date && Date.now() >= tokens.expiry_date - 60000) {
    const { credentials } = await oauth2Client.refreshAccessToken();
    await therapistRef.update({ googleTokens: credentials });
    oauth2Client.setCredentials(credentials);
  }

  return oauth2Client;
}

// ─────────────────────────────────────────────
// Helper: format a session as a Google Calendar event body
// ─────────────────────────────────────────────
function sessionToEventBody(session) {
  const startDate = new Date(session.dateTime);
  const durationMs = (session.durationMinutes || 45) * 60 * 1000;
  const endDate = new Date(startDate.getTime() + durationMs);

  return {
    summary: `Speech Therapy – ${session.patientName || "Session"}`,
    description:
      `Type: ${session.type || "treatment"}\n` +
      `Location: ${session.location || "clinic"}\n` +
      `Price: ₪${session.price || 0}\n` +
      (session.notes ? `Notes: ${session.notes}` : ""),
    start: { dateTime: startDate.toISOString(), timeZone: "Asia/Jerusalem" },
    end: { dateTime: endDate.toISOString(), timeZone: "Asia/Jerusalem" },
    location: session.location === "online" ? "Online (Zoom/Teams)" : "Speech Therapy Clinic",
  };
}

// ─────────────────────────────────────────────
// 1. startGoogleAuth
//    Returns an OAuth2 URL the frontend redirects to
// ─────────────────────────────────────────────
exports.startGoogleAuth = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Must be signed in.");
  }

  const oauth2Client = buildOAuth2Client();

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
    ],
    state: context.auth.uid,
  });

  return { authUrl };
});

// ─────────────────────────────────────────────
// 2. googleAuthCallback
//    Exchanges the code for tokens and stores them
// ─────────────────────────────────────────────
exports.googleAuthCallback = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Must be signed in.");
  }

  const { code, redirectUri } = data;
  if (!code) {
    throw new functions.https.HttpsError("invalid-argument", "Missing authorization code.");
  }

  const cfg = functions.config().google;
  const oauth2Client = new google.auth.OAuth2(
    cfg.client_id,
    cfg.client_secret,
    redirectUri || cfg.redirect_uri
  );

  let tokens;
  try {
    const result = await oauth2Client.getToken(code);
    tokens = result.tokens;
  } catch (err) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Failed to exchange authorization code: " + err.message
    );
  }

  await db.collection("therapists").doc(context.auth.uid).set(
    {
      uid: context.auth.uid,
      email: context.auth.token.email || "",
      googleTokens: tokens,
      googleCalendarConnected: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return { success: true };
});

// ─────────────────────────────────────────────
// 3. createCalendarEvent
//    Creates a Google Calendar event for a session
// ─────────────────────────────────────────────
exports.createCalendarEvent = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Must be signed in.");
  }

  const { session } = data;
  if (!session || !session.dateTime) {
    throw new functions.https.HttpsError("invalid-argument", "Session data with dateTime is required.");
  }

  const oauth2Client = await getAuthorizedClient(context.auth.uid);
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  let createdEvent;
  try {
    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: sessionToEventBody(session),
    });
    createdEvent = response.data;
  } catch (err) {
    throw new functions.https.HttpsError(
      "internal",
      "Failed to create calendar event: " + err.message
    );
  }

  return { eventId: createdEvent.id, eventLink: createdEvent.htmlLink };
});

// ─────────────────────────────────────────────
// 4. updateCalendarEvent
//    Updates an existing Google Calendar event
// ─────────────────────────────────────────────
exports.updateCalendarEvent = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Must be signed in.");
  }

  const { session } = data;
  if (!session || !session.googleCalendarEventId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Session with googleCalendarEventId is required."
    );
  }

  const oauth2Client = await getAuthorizedClient(context.auth.uid);
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  let updatedEvent;
  try {
    const response = await calendar.events.update({
      calendarId: "primary",
      eventId: session.googleCalendarEventId,
      requestBody: sessionToEventBody(session),
    });
    updatedEvent = response.data;
  } catch (err) {
    throw new functions.https.HttpsError(
      "internal",
      "Failed to update calendar event: " + err.message
    );
  }

  return { eventId: updatedEvent.id };
});

// ─────────────────────────────────────────────
// 5. deleteCalendarEvent
//    Deletes a Google Calendar event
// ─────────────────────────────────────────────
exports.deleteCalendarEvent = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Must be signed in.");
  }

  const { eventId } = data;
  if (!eventId) {
    throw new functions.https.HttpsError("invalid-argument", "eventId is required.");
  }

  const oauth2Client = await getAuthorizedClient(context.auth.uid);
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  try {
    await calendar.events.delete({
      calendarId: "primary",
      eventId: eventId,
    });
  } catch (err) {
    // If the event doesn't exist anymore, that's fine
    if (err.code !== 404 && err.code !== 410) {
      throw new functions.https.HttpsError(
        "internal",
        "Failed to delete calendar event: " + err.message
      );
    }
  }

  return { success: true };
});

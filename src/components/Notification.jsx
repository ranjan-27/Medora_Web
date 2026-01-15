import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Notification.css";
import { API } from "../api";

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  let token = localStorage.getItem("token");
  token = token ? token.replace(/^"|"$/g, '').trim() : null;
  const navigate = useNavigate();

  // API is imported from src/api.js and already includes the /api prefix
  // e.g. API -> http://localhost:5000/api

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Backend error:", text);
        setError("Failed to fetch notifications");
        return;
      }

      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error("Fetch failed:", err);
      setError("Something went wrong while fetching notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [token]);

  const speak = (text) => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-IN";
    window.speechSynthesis.speak(utter);
  };

  // ✅ Mark medicine as Taken
  const markTaken = async (id) => {
    try {
      const res = await fetch(`${API}/medicines/${id}/taken`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        console.error("Mark taken failed");
        return;
      }
      await fetchNotifications();
    } catch (err) {
      console.error("Mark taken error:", err);
    }
  };

  // ✅ Mark medicine as Missed
  const markMissed = async (id) => {
    try {
      const res = await fetch(`${API}/medicines/${id}/missed`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        console.error("Mark missed failed");
        return;
      }
      await fetchNotifications();
    } catch (err) {
      console.error("Mark missed error:", err);
    }
  };

  return (
    <div className="notifications">
      <h2>Notifications</h2>

      {loading && <p>Loading notifications...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <>
          {items.length === 0 ? (
            <p>No notifications yet.</p>
          ) : (
            <div className="notes">
              {items.map((n) => (
                <div key={n._id} className="note">
                  <p>{n.message}</p>
                  <small>{new Date(n.createdAt).toLocaleString()}</small>

                  {/* ✅ Show status if backend includes it */}
                  {n.status && (
                    <span className={`status ${n.status.toLowerCase()}`}>
                      {n.status}
                    </span>
                  )}

                  <button onClick={() => speak(n.message)}>🔊 Speak</button>

                  {/* ✅ Show action buttons if Upcoming */}
                  {n.status === "Upcoming" && n.medicineId && (
                    <div className="actions">
                      <button onClick={() => markTaken(n.medicineId)}>✅ Taken</button>
                      <button onClick={() => markMissed(n.medicineId)}>❌ Missed</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <button className="back-btn" onClick={() => navigate("/")}>
        ⬅ Back
      </button>
    </div>
  );
}

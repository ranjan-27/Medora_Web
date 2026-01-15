// ...existing code...
import React, { useState, useEffect } from "react";
import "./AddMed.css";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";
import { API } from "../api";

const AddMedicine = () => {
  const [formData, setFormData] = useState({
    _id: null,
    name: "",
    type: "",
    dosage: "",
    time: "",
    frequency: "",
    notes: "",
    status: "Upcoming"
  });

  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const BASE_URL = `${API}/medicines`;

  // Speech recognition handler (unchanged)
  const startListening = (field, lang = "en-IN", index = null) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("Speech recognition not supported in this browser");
      return;
    }
    const recognition = new SR();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();
    setIsListening(true);

    recognition.onresult = (event) => {
      const spokenText = event.results[0][0].transcript.trim();
      setFormData((prev) => ({ ...prev, [field]: spokenText }));
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  };

  // Handle manual typing
  const handleChange = (e, index = null) => {
    const { name, value } = e.target;
    console.debug("handleChange:", { name, value, index });
    // caregivers removed: always update top-level formData
    setFormData((prev) => ({ ...prev, [name]: value }));
  };


  // ✅ Submit handler (backend integration)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    setLoading(true);

    const payload = { ...formData };


    try {
      let res;
      if (formData._id) {
        // Editing existing medicine
        res = await fetch(`${BASE_URL}/${formData._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        // Adding new medicine
        res = await fetch(BASE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      const text = await res.text().catch(() => null);
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        data = { error: text };
      }

      if (res.ok) {
        toast.success(formData._id ? "Medicine updated successfully ✅" : "Medicine added successfully ✅");
        navigate("/MyMed"); // redirect to medicine list
      } else {
        const msg = data.error || text || `Failed to save medicine (${res.status})`;
        toast.error(msg);
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to backend");
    } finally{
      setLoading(false);
    }
  };

  // Prefill from Speak.jsx or Edit
useEffect(() => {
  if (location.state) {
    setFormData((prev) => ({
      ...prev,
      _id: location.state._id || prev._id,
      name: location.state.name || prev.name,
      dosage: location.state.dosage || prev.dosage,
      type: location.state.type || prev.type,
      time: location.state.time || prev.time,
      frequency: location.state.frequency || prev.frequency,
      notes: location.state.notes || prev.notes,
    }));
  }
}, [location.state]);


  return (
    <div className="add-medicine">
      <h2>{formData._id ? "Edit Medicine / दवा संपादित करें" : "Add Medicine / दवा जोड़ें"}</h2>

      {isListening && (
        <div className="listening-popup">
          🎤 Listening... Please speak <br />
          🎤 सुनिए... कृपया बोलें
        </div>
      )}

      <form onSubmit={handleSubmit}>
          <label>
            Medicine Name / दवा का नाम:
            <input
              type="text"
              name="name"
              value={formData.name || ""}
              onChange={handleChange}
              required
            />
            <div className="mic-buttons">
              <button
                type="button"
                className="mic-btn-en"
                onClick={() => startListening("name", "en-IN")}
              >
                🎤 English
              </button>
              <button
                type="button"
                className="mic-btn-hi"
                onClick={() => startListening("name", "hi-IN")}
              >
                🎤 Hindi
              </button>
            </div>
          </label>

          <label>
            Type / प्रकार:
            <select
              name="type"
              value={formData.type || ""}
              onChange={handleChange}
              required
            >
              <option value="">Select</option>
              <option value="Tablet">Tablet</option>
              <option value="Capsule">Capsule</option>
              <option value="Syrup">Syrup</option>
              <option value="Injection">Injection</option>
              <option value="Other">Other</option>
            </select>
          </label>

          <label>
            Dosage / मात्रा:
            <input
              type="text"
              name="dosage"
              value={formData.dosage || ""}
              onChange={handleChange}
            />
            <div className="mic-buttons">
              <button
                type="button"
                className="mic-btn-en"
                onClick={() => startListening("dosage", "en-IN")}
              >
                🎤 English
              </button>
              <button
                type="button"
                className="mic-btn-hi"
                onClick={() => startListening("dosage", "hi-IN")}
              >
                🎤 Hindi
              </button>
            </div>
          </label>

          <label>
            Time / समय:
            <input
              type="time"
              name="time"
              value={formData.time || ""}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Frequency / कितनी बार:
            <select
              name="frequency"
              value={formData.frequency || ""}
              onChange={handleChange}
              required
            >
              <option value="">Select</option>
              <option value="Once a day">Once a day</option>
              <option value="Twice a day">Twice a day</option>
              <option value="Thrice a day">Thrice a day</option>
              <option value="Every 8 hours">Every 8 hours</option>
              <option value="Custom">Custom</option>
            </select>
          </label>

          <label>
            Notes / नोट्स:
            <textarea
              name="notes"
              value={formData.notes || ""}
              onChange={handleChange}
            ></textarea>
            <div className="mic-buttons">
              <button
                type="button"
                className="mic-btn-en"
                onClick={() => startListening("notes", "en-IN")}
              >
                🎤 English
              </button>
              <button
                type="button"
                className="mic-btn-hi"
                onClick={() => startListening("notes", "hi-IN")}
              >
                🎤 Hindi
              </button>
            </div>
          </label>

          {/* Caregiver feature removed */}

        <button type="submit" className="btn" disabled={loading}>
          {loading ? (
            <>
              Saving medicine <span className="spinner"></span>
            </>
          ) : (
            formData._id ? "Update Medicine" : "Save Medicine"
          )}
        </button>

      </form>
    </div>
  );
};

export default AddMedicine;
// ...existing code...
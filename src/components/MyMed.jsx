import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./MyMed.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API } from "../api";
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';


const MyMed = () => {
  const [medicines, setMedicines] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const BASE_URL = `${API}/medicines`;

  // Fetch medicines from backend
  useEffect(() => {
    const fetchMedicines = async () => {
      setLoading(true);
      let token = localStorage.getItem("token");
      token = token ? token.replace(/^"|"$/g, '').trim() : null;
      if (!token) {
        setError("No token found. Please login first.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(BASE_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const contentType = res.headers.get('content-type') || '';
        if (!res.ok || !contentType.includes('application/json')) {
          const text = await res.text().catch(() => null);
          setError(text || `Failed to fetch medicines (${res.status})`);
          return;
        }
        const data = await res.json();
        if (data && res.ok) {
          setMedicines(data.medicines || []);
        } else {
          setError(data.error || "Failed to fetch medicines ❌");
        }
      } catch (err) {
        setError("Error connecting to backend");
      } finally {
        setLoading(false);
      }
    };

    fetchMedicines();
    // Refresh status every minute
    const interval = setInterval(fetchMedicines, 60000);
    return () => clearInterval(interval);
  }, []);

  // Check if medicine time has passed
  const getMedicineStatus = (medicineTime) => {
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTime = currentHours * 100 + currentMinutes; // e.g., 1430 for 2:30 PM

    const [hours, minutes] = medicineTime.split(":").map(Number);
    const medicineTimeInMinutes = hours * 100 + minutes;

    if (currentTime >= medicineTimeInMinutes) {
      return "Overdue"; // Time has passed
    } else if (currentTime >= medicineTimeInMinutes - 30) {
      return "Due Soon"; // 30 mins before
    } else {
      return "Upcoming";
    }
  };

  // Edit medicine
  const handleEdit = (med) => {
    navigate("/AddMedicine", { state: med });
  };

  // Delete medicine
  const handleDelete = (id) => {
    confirmAlert({
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete this medicine?',
      buttons: [
        {
          label: 'Yes',
          onClick: async () => {
              let token = localStorage.getItem("token");
              token = token ? token.replace(/^"|"$/g, '').trim() : null;
            try {
              const res = await fetch(`${BASE_URL}/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });
              const text = await res.text().catch(() => null);
              let data;
              try { data = text ? JSON.parse(text) : {}; } catch (e) { data = { error: text }; }
              if (res.ok) {
                setMedicines(medicines.filter((m) => m._id !== id));
                toast.success("Medicine deleted successfully ✅");
              } else {
                toast.error(data.error || `Failed to delete medicine (${res.status})`);
              }
            } catch (err) {
              toast.error("Error deleting medicine");
            }
          }
        },
        {
          label: 'Cancel'
        }
      ]
    });
  };

  const handleNotify = (med) => {
    toast.success(`Notification sent for ${med.name} to caregiver(s)!`);
  };

  return (
    <div className="my-med">
      <h2>My Medicines</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {medicines.length === 0 ? (
        <div className="empty-state">
          <p>No medicines added yet.</p>
          <button className="add-btn" onClick={() => navigate("/AddMedicine")}>
            ➕ Add Medicine
          </button>
        </div>
      ) : (
        <div className="med-list">
          {medicines.map((med) => {
            const status = getMedicineStatus(med.time);
            const statusClass = 
              status === "Overdue" ? "overdue" : 
              status === "Due Soon" ? "due-soon" : 
              "upcoming";

            return (
              <div key={med._id} className={`med-card ${statusClass}`}>
                <div className="med-header">
                  <h3>{med.name}</h3>
                  <span className={`status-badge ${statusClass}`}>{status}</span>
                </div>
                <p><strong>Dosage:</strong> {med.dosage}</p>
                <p><strong>Frequency:</strong> {med.frequency}</p>
                <p><strong>Next dose:</strong> {med.time}</p>
                
                <div className="actions">
                  <button onClick={() => handleEdit(med)}>✏️ Edit</button>
                  <button onClick={() => handleDelete(med._id)}>🗑️ Delete</button>
                  <button onClick={() => handleNotify(med)}>🔔 Notify</button>
                  {status === "Overdue" && (
                    <button className="btn-mark-done">✓ Taken</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default MyMed;
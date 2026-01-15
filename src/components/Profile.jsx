import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Profile.css";
import { API } from "../api";

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Use central API base
  const BASE_URL = `${API}/auth`;

  // Fetch profile from backend
  useEffect(() => {
    const fetchProfile = async () => {
      let token = localStorage.getItem("token");
      token = token ? token.replace(/^"|"$/g, '').trim() : null;
      if (!token) {
        setError("No token found. Please login first.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${BASE_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const contentType = res.headers.get('content-type') || '';
        if (!res.ok || !contentType.includes('application/json')) {
          const text = await res.text().catch(() => null);
          if (res.status === 403) {
            // Invalid token → clear and redirect to login
            localStorage.removeItem('token');
            navigate('/auth');
            return;
          }
          setError(text || `Failed to fetch profile (${res.status})`);
          return;
        }

        const data = await res.json();
        if (data.error) {
          setError(data.error);
        } else {
          setProfile(data.user || data); // ✅ handle both shapes
        }
      } catch (err) {
        setError("Failed to fetch profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Handle input changes (for editing profile locally)
  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  // Save profile to backend
  const handleSave = async () => {
    let token = localStorage.getItem("token");
    token = token ? token.replace(/^"|"$/g, '').trim() : null;
    try {
      const res = await fetch(`${BASE_URL}/update-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });
      const text = await res.text().catch(() => null);
      let data;
      try { data = text ? JSON.parse(text) : {}; } catch (e) { data = { error: text }; }
      if (res.ok && !data.error) {
        alert("Profile updated successfully ✅");
      } else {
        alert(data.error || `Failed to update profile (${res.status})`);
      }
    } catch (err) {
      alert("Error updating profile");
    }
  };

  // Sign out
  const handleSignOut = () => {
    localStorage.removeItem("token");
    navigate("/auth");
  };

  if (loading) return <p>Loading profile...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!profile) return <p>No profile data found.</p>;

  return (
    <div className="profile">
      <h2>My Profile / मेरी प्रोफ़ाइल</h2>

      <label>
        Name:
        <input
          type="text"
          name="name"
          value={profile.name || ""}
          onChange={handleChange}
        />
      </label>

      <label>
        Email:
        <input
          type="email"
          name="email"
          value={profile.email || ""}
          readOnly
        />
      </label>

      <label>
        Age:
        <input
          type="number"
          name="age"
          value={profile.age || ""}
          onChange={handleChange}
        />
      </label>

      <label>
        Phone:
        <input
          type="tel"
          name="phone"
          value={profile.phone || ""}
          onChange={handleChange}
        />
      </label>

      <button className="btn" onClick={handleSave}>
        Save Profile
      </button>

      <button className="btn sign-btn" onClick={handleSignOut}>
        Sign Out
      </button>
    </div>
  );
};

export default Profile;

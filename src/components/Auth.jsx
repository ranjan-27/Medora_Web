import React, { useState } from 'react';
import './Auth.css';
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";
import { API } from "../api";


const Auth = () => {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(true);
  const [otpSent, setOtpSent] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  const [isForgot, setIsForgot] = useState(false);
  const [forgotOtpSent, setForgotOtpSent] = useState(false);
  const [newPassword, setNewPassword] = useState('');

const [isLoading, setIsLoading] = useState(false);

  // API base (API already includes `/api` suffix). e.g. http://localhost:5000/api
  const BASE_URL = `${API}/auth`;

  // Signup → creates user (verified=false) and triggers OTP email
  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const text = await response.text().catch(() => null);
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        data = { error: text };
      }
      if (response.ok) {
       // alert("Signup successful ✅. Check your email for OTP.");
        toast.success("Signup successful ✅. Check your email for OTP.");


        await fetch(`${BASE_URL}/send-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });        
        setOtpSent(true); // show OTP input
        
      } else {
        //alert(data.error || "Signup failed ❌");
        toast.error(data.error || "Signup failed ❌");

      }
    } catch (err) {
      console.error(err);
      //alert("Error connecting to backend");
      toast.error("Error connecting to backend");
    }finally {
      setIsLoading(false);
    }
  };

  // Step 1: Send OTP for password reset
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const text = await res.text().catch(() => null);
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        data = { error: text };
      }
      if (res.ok) {
        //alert("Reset OTP sent ✅. Check your email.");
        toast.info("Reset OTP sent ✅. Check your email.");

        setForgotOtpSent(true);
      } else {
        //alert(data.error || "Failed to send reset OTP ❌");
        toast.error(data.error || "Failed to send reset OTP ❌");
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to backend");
    }finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP + set new password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const text = await res.text().catch(() => null);
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        data = { error: text };
      }
      if (res.ok) {
        //alert("Password reset successful ✅. Please log in.");
        toast.success("Password reset successful ✅. Please log in.");
        setIsForgot(false);
        setForgotOtpSent(false);
        setOtp('');
        setNewPassword('');
      } else {
        alert(data.error || "Reset failed ❌");
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to backend");
    }finally {
      setIsLoading(false);
    }
  };


  // Verify OTP → marks user as verified
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const text = await response.text().catch(() => null);
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        data = { error: text };
      }
      if (response.ok) {
        //alert("Email verified successfully ✅. You can now log in.");
        toast.success("Email verified successfully ✅. You can now log in.");


        setOtp('');
        setOtpSent(false);
        setEmail('');
        setPassword('');
        setName('');
        navigate("/auth"); // or redirect to login page
      } else {
        //alert(data.error || "OTP verification failed ❌");
        toast.error(data.error || "OTP verification failed ❌");

      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to backend");
    }finally {
      setIsLoading(false);
    }
  };

  // Login → only works if verified=true
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const text = await response.text().catch(() => null);
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        data = { error: text };
      }
      if (response.ok) {
        //alert("Login successful ✅");
        toast.success("Login successful ✅");

        setEmail('');
        setPassword('');
        localStorage.setItem("token", data.token);
        localStorage.setItem("userName", data.user.name);
        navigate("/");
      } else {
        //alert(data.error || "Login failed ❌");
        toast.error(data.error || "Login failed ❌");

      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to backend");
    }finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth">
      <h1 className="header">{isSignup ? "Sign Up" : "Login"}</h1>

      {isSignup && (
        <form className="signup" onSubmit={otpSent ? handleVerifyOtp : handleSignup}>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isLoading}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />

           {!otpSent && (
            <button className="btn1" type="submit" disabled={isLoading}>
              {isLoading ? "Loading..." : "Sign Up"}
            </button>
          )}

          {otpSent && (
            <>
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                disabled={isLoading}
              />
              <button className="btn1" type="submit" disabled={isLoading}>
                {isLoading ? "Loading..." : "Verify OTP"}
              </button>
              <button
                type="button"
                className="btn1"
                disabled={isLoading}
                onClick={async () => {
                  setIsLoading(true);
                  try {
                    const response = await fetch(`${BASE_URL}/send-otp`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email })
                    });
                    const text = await response.text().catch(() => null);
                    let data;
                    try {
                      data = text ? JSON.parse(text) : {};
                    } catch (e) {
                      data = { error: text };
                    }
                    if (response.ok) {
                      toast.info("New OTP sent ✅");
                    } else {
                      toast.error(data.error || "Failed to resend OTP ❌");
                    }
                  } catch (err) {
                    console.error(err);
                    alert("Error resending OTP");
                  }finally {
                    setIsLoading(false);
                  }
                }}
              >
               {isLoading ? "Loading..." : "Resend OTP"}
              </button>
            </>
          )}
        </form>
      )}

      {!isSignup && (
        <form className="login" onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
           <button className="btn1" type="submit" disabled={isLoading}>
            {isLoading ? "Loading..." : "Login"}
          </button>
          <button
            type="button"
            className="f"
            onClick={() => {
              setIsForgot(true);
              setForgotOtpSent(false);
            }}
            disabled={isLoading}
          >
            Forgot Password?
          </button>

        </form>
      )}

      {isForgot && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setIsForgot(false)}>&times;</span>

            <h2>Reset Password</h2>

            <form onSubmit={forgotOtpSent ? handleResetPassword : handleForgotPassword}>
              {!forgotOtpSent && (
                <>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <button className="btn1" type="submit" disabled={isLoading}>
                    {isLoading ? "Loading..." : "Send Reset OTP"}
                  </button>
                </>
              )}

              {forgotOtpSent && (
                <>
                  <input
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={5}
                    disabled={isLoading}
                  />
                 <button className="btn1" type="submit" disabled={isLoading}>
                    {isLoading ? "Loading..." : "Reset Password"}
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      )}


      

      <p>
        {isSignup ? "Already have an account?" : "New user?"}{" "}
        <span
          className="toggle"
          onClick={() => {
            setIsSignup(!isSignup);
            setOtpSent(false);
          }}
        >
          {isSignup ? "Login here" : "Sign up here"}
        </span>
      </p>
      
    </div>
    
  );
  

};

export default Auth;


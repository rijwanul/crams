import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { API_URLS } from "../config/api";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Student");
  const [error, setError] = useState("");
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [registrationForm, setRegistrationForm] = useState({
    name: "",
    email: "",
    studentId: "",
    password: ""
  });
  const [serverStatus, setServerStatus] = useState("unknown");

  // Test server connection on component mount
  useEffect(() => {
    testServerConnection();
  }, []);

  const testServerConnection = async () => {
    try {
      console.log("Testing server connection to:", API_URLS.LOGIN.replace('/api/auth/login', ''));
      const response = await fetch(API_URLS.LOGIN.replace('/api/auth/login', ''), {
        method: 'GET',
      });
      if (response.ok) {
        setServerStatus("connected");
        console.log("Server is running!");
      } else {
        setServerStatus("error");
        console.log("Server responded with error:", response.status);
      }
    } catch (error) {
      setServerStatus("disconnected");
      console.error("Server connection failed:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    console.log("Attempting login to:", API_URLS.LOGIN);
    console.log("Login data:", { email, role });
    
    try {
      const res = await fetch(API_URLS.LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });
      
      console.log("Login response status:", res.status);
      
      const data = await res.json();
      console.log("Login response data:", data);
      
      if (res.ok) {
        localStorage.setItem("token", data.token);
        toast.success("Login successful!");
        window.location.href = `/${data.role.toLowerCase()}`;
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(`Network error: ${err.message}`);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    const registrationUrl = `${API_URLS.USERS}/register-student`;
    console.log("Registration URL:", registrationUrl);
    console.log("API_URLS.USERS:", API_URLS.USERS);
    console.log("Registration data:", registrationForm);
    
    // First test if the server is reachable
    try {
      console.log("Testing server connectivity...");
      const testResponse = await fetch(API_URLS.USERS.replace('/api/users', ''), {
        method: 'GET',
      });
      console.log("Server test response status:", testResponse.status);
    } catch (testError) {
      console.error("Server is not reachable:", testError);
      toast.error("Cannot connect to server. Please check if the server is running.");
      return;
    }
    
    try {
      const res = await fetch(registrationUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationForm),
      });

      console.log("Registration response status:", res.status);
      console.log("Registration response headers:", Object.fromEntries(res.headers.entries()));
      
      if (res.ok) {
        const responseData = await res.json();
        console.log("Registration success:", responseData);
        toast.success("Registration successful! You can now login.");
        setShowRegisterForm(false);
        setRegistrationForm({ name: "", email: "", studentId: "", password: "" });
      } else {
        const responseText = await res.text();
        console.log("Registration error response (raw):", responseText);
        
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          errorData = { error: responseText || "Registration failed" };
        }
        
        console.log("Registration error response (parsed):", errorData);
        toast.error(errorData.error || "Registration failed");
      }
    } catch (error) {
      console.error("Registration network error:", error);
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      toast.error(`Network error during registration: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mb-6">
            <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">CRAMS</h2>
          <p className="mt-2 text-sm text-gray-600">Course Registration & Advising Management System</p>
        </div>
        
        <form className="bg-white py-8 px-6 shadow-xl rounded-xl space-y-6" onSubmit={handleSubmit}>
          <h3 className="text-xl font-semibold text-gray-800 text-center">Sign in to your account</h3>
          
          {/* Server Status Indicator */}
          <div className="flex items-center justify-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              serverStatus === "connected" ? "bg-green-500" : 
              serverStatus === "disconnected" ? "bg-red-500" : "bg-yellow-500"
            }`}></div>
            <span className="text-sm text-gray-600">
              Server: {serverStatus === "connected" ? "Connected" : 
                      serverStatus === "disconnected" ? "Disconnected" : "Checking..."}
            </span>
            <button
              type="button"
              onClick={testServerConnection}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Test
            </button>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                id="role"
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="Student">Student</option>
                <option value="Advisor">Advisor</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>
          
          <button 
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 font-medium"
            type="submit"
          >
            Sign in
          </button>
          
          <div className="text-center space-y-3">
            <p className="text-xs text-gray-500">
              Demo credentials: student1@example.com / password123
            </p>
            <button
              type="button"
              onClick={() => setShowRegisterForm(true)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium transition duration-200"
            >
              Register as New Student
            </button>
          </div>
        </form>
        
        {/* New Student Registration Modal */}
        {showRegisterForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Register New Student</h2>
                <button
                  onClick={() => setShowRegisterForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={registrationForm.name}
                    onChange={(e) => setRegistrationForm({...registrationForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={registrationForm.email}
                    onChange={(e) => setRegistrationForm({...registrationForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your email"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                  <input
                    type="text"
                    required
                    value={registrationForm.studentId}
                    onChange={(e) => setRegistrationForm({...registrationForm, studentId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your student ID"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={registrationForm.password}
                    onChange={(e) => setRegistrationForm({...registrationForm, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Create a password"
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowRegisterForm(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition duration-200"
                  >
                    Register
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LoginPage;

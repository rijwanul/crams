import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { API_URLS } from "../config/api";

function AdminPanel() {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ code: "", name: "", limit: 1, prerequisites: "", times: "" });
  const [editing, setEditing] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  
  // User management states
  const [activeTab, setActiveTab] = useState('courses');
  const [students, setStudents] = useState([]);
  const [advisors, setAdvisors] = useState([]);
  const [userForm, setUserForm] = useState({ name: '', email: '', role: 'Student', password: '' });
  const [editingUser, setEditingUser] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationData, setNotificationData] = useState({ subject: '', message: '' });
  const [selectedUsers, setSelectedUsers] = useState([]);

  const fetchCourses = async () => {
    try {
      const response = await fetch(API_URLS.COURSES, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.ok) {
        const coursesData = await response.json();
        setCourses(coursesData);
      } else {
        console.error('Failed to fetch courses');
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  useEffect(() => {
    // Check current user role
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log("👤 Current user:", payload);
        if (payload.role !== 'Admin') {
          setNotification({ message: 'Access denied: Admin role required', type: 'error' });
          return;
        }
      } catch (e) {
        console.error("Invalid token:", e);
        setNotification({ message: 'Invalid authentication token', type: 'error' });
        return;
      }
    } else {
      setNotification({ message: 'No authentication token found', type: 'error' });
      return;
    }

    fetchCourses();
    fetchAnalytics();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      console.log("🔍 Fetching users from:", API_URLS.USERS);
      console.log("🔑 Token:", localStorage.getItem("token") ? "Present" : "Missing");
      
      const response = await fetch(`${API_URLS.USERS}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      
      console.log("📡 Response status:", response.status);
      console.log("📡 Response ok:", response.ok);
      
      if (response.ok) {
        const users = await response.json();
        console.log("👥 Fetched users:", users);
        const studentList = users.filter(user => user.role === "Student");
        const advisorList = users.filter(user => user.role === "Advisor");
        setStudents(studentList);
        setAdvisors(advisorList);
        console.log(`📊 Users loaded: ${studentList.length} students, ${advisorList.length} advisors`);
      } else {
        const errorText = await response.text();
        console.error("❌ Failed to fetch users:", response.status, errorText);
        setNotification({ message: `Failed to fetch users: ${response.status}`, type: 'error' });
      }
    } catch (error) {
      console.error("❌ Error fetching users:", error);
      setNotification({ message: `Error fetching users: ${error.message}`, type: 'error' });
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(API_URLS.ANALYTICS, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.ok) {
        const analyticsData = await response.json();
        setAnalytics(analyticsData);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleUserAction = async (action, userId, data = {}) => {
    try {
      let url, method, body;

      switch (action) {
        case 'create':
          url = API_URLS.USERS;
          method = 'POST';
          body = JSON.stringify(data);
          break;
        case 'update':
          url = `${API_URLS.USERS}/${userId}`;
          method = 'PUT';
          body = JSON.stringify(data);
          break;
        case 'delete':
          url = `${API_URLS.USERS}/${userId}`;
          method = 'DELETE';
          break;
        case 'resetPassword':
          url = `${API_URLS.USERS}/${userId}/reset-password`;
          method = 'POST';
          body = JSON.stringify({ newPassword: data.password });
          break;
        default:
          throw new Error('Invalid action');
      }

      console.log(`🚀 ${action} user request:`, { url, method, data });
      console.log("🔑 Token:", localStorage.getItem("token") ? "Present" : "Missing");

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body,
      });

      console.log("📡 Response status:", response.status);
      console.log("📡 Response ok:", response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Success result:", result);
        setNotification({ message: `User ${action} successful!`, type: 'success' });
        fetchUsers();
        setUserForm({ name: '', email: '', role: 'Student', password: '' });
        setEditingUser(null);
      } else {
        const error = await response.json();
        console.error("❌ Error response:", error);
        setNotification({ message: error.message || error.error || `Failed to ${action} user`, type: 'error' });
      }
    } catch (error) {
      console.error(`❌ Error ${action} user:`, error);
      setNotification({ message: `Error ${action} user: ${error.message}`, type: 'error' });
    }
  };

  const handleSendNotification = async () => {
    console.log("🚀 Starting notification send process...");
    console.log("📋 Selected users:", selectedUsers);
    console.log("📝 Notification data:", notificationData);

    if (!notificationData.message || selectedUsers.length === 0) {
      const errorMsg = !notificationData.message ? 'Please enter a message' : 'Please select users';
      console.warn("⚠️ Validation failed:", errorMsg);
      setNotification({ message: `${errorMsg} to send notification`, type: 'error' });
      return;
    }

    if (!notificationData.message.trim()) {
      console.warn("⚠️ Message is empty after trimming");
      setNotification({ message: 'Please enter a valid message', type: 'error' });
      return;
    }

    try {
      const requestData = {
        recipients: selectedUsers,
        title: notificationData.subject?.trim() || 'Admin Notification',
        message: notificationData.message.trim()
      };

      console.log("📧 Final request data:", requestData);
      console.log("📧 API URL:", `${API_URLS.NOTIFICATIONS}/send`);
      console.log("📧 Full URL:", `${API_URLS.NOTIFICATIONS}/send`);
      console.log("📧 Token:", localStorage.getItem("token") ? "Present" : "Missing");

      const response = await fetch(`${API_URLS.NOTIFICATIONS}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(requestData),
      });

      console.log("📧 Response received:");
      console.log("  - Status:", response.status);
      console.log("  - Status Text:", response.statusText);
      console.log("  - OK:", response.ok);
      console.log("  - Headers:", Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Notification sent successfully:", result);
        setNotification({ message: `Notification sent successfully to ${selectedUsers.length} user(s)!`, type: 'success' });
        setShowNotificationModal(false);
        setNotificationData({ subject: '', message: '' });
        setSelectedUsers([]);
      } else {
        const errorText = await response.text();
        console.error("❌ Notification error response:");
        console.error("  - Status:", response.status);
        console.error("  - Response text:", errorText);
        
        let errorMessage = 'Failed to send notification';
        try {
          const error = JSON.parse(errorText);
          errorMessage = error.message || error.error || errorMessage;
          console.error("  - Parsed error:", error);
        } catch (e) {
          console.error("  - Could not parse error as JSON");
          errorMessage = errorText || errorMessage;
        }
        setNotification({ message: `Error: ${errorMessage}`, type: 'error' });
      }
    } catch (error) {
      console.error('❌ Network/unexpected error:', error);
      setNotification({ message: `Network error: ${error.message}`, type: 'error' });
    }
  };

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = editing ? "PUT" : "POST";
    const url = editing ? `${API_URLS.COURSES}/${editing}` : API_URLS.COURSES;
    const body = {
      ...form,
      limit: Number(form.limit),
      prerequisites: form.prerequisites.split(",").map(s => s.trim()).filter(Boolean),
      times: form.times.split(";").map(t => {
        const [day, start, end] = t.split(" ");
        return { day, start, end };
      }).filter(t => t.day && t.start && t.end),
    };
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      toast.success(editing ? "Course updated" : "Course created");
      setForm({ code: "", name: "", limit: 1, prerequisites: "", times: "" });
      setEditing(null);
      fetchCourses();
    } else {
      toast.error("Failed to save course");
    }
  };

  const handleEdit = c => setForm({ ...c, prerequisites: c.prerequisites.join(", "), times: c.times.map(t => `${t.day} ${t.start} ${t.end}`).join("; ") }) || setEditing(c._id);
  const handleDelete = async id => {
    if (!window.confirm("Delete this course?")) return;
    const res = await fetch(`${API_URLS.COURSES}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (res.ok) {
      toast.success("Course deleted");
      fetchCourses();
    } else {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center mr-3">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            </div>
            <button 
              onClick={() => { localStorage.removeItem("token"); window.location.href = "/"; }}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('courses')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'courses' 
                  ? 'border-emerald-500 text-emerald-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Course Management
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'students' 
                  ? 'border-emerald-500 text-emerald-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Student List ({students.length})
            </button>
            <button
              onClick={() => setActiveTab('advisors')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'advisors' 
                  ? 'border-emerald-500 text-emerald-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Advisor List ({advisors.length})
            </button>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Notification */}
        {notification && (
          <div className={`mb-6 p-4 rounded-lg ${
            notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {notification.message}
            <button 
              onClick={() => setNotification(null)}
              className="float-right text-lg font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Course Management Tab */}
        {activeTab === 'courses' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Course Management */}
              <div className="xl:col-span-2">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
                    <h2 className="text-xl font-semibold text-white flex items-center">
                      <svg className="h-6 w-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Course Management
                    </h2>
                  </div>
                  
                  <div className="p-6">
                    {/* Course Form */}
                    <form className="mb-8 bg-gray-50 p-6 rounded-lg" onSubmit={handleSubmit}>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        {editing ? "Edit Course" : "Add New Course"}
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Course Code</label>
                          <input 
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition duration-200" 
                            name="code" 
                            placeholder="e.g., CS101" 
                            value={form.code} 
                            onChange={handleChange} 
                            required 
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Student Limit</label>
                          <input 
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition duration-200" 
                            name="limit" 
                            type="number" 
                            min="1" 
                            placeholder="30" 
                            value={form.limit} 
                            onChange={handleChange} 
                            required 
                          />
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
                        <input 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition duration-200" 
                          name="name" 
                          placeholder="Introduction to Programming" 
                          value={form.name} 
                          onChange={handleChange} 
                          required 
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Prerequisites (comma separated)</label>
                        <input 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition duration-200" 
                          name="prerequisites" 
                          placeholder="CS100, MATH101" 
                          value={form.prerequisites} 
                          onChange={handleChange} 
                        />
                      </div>
                      
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Schedule</label>
                        <input 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition duration-200" 
                          name="times" 
                          placeholder="Mon 10:00 12:00; Wed 14:00 16:00" 
                          value={form.times} 
                          onChange={handleChange} 
                        />
                        <p className="text-xs text-gray-500 mt-1">Format: Day StartTime EndTime; separated by semicolons</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <button 
                          className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-2 rounded-lg hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition duration-200 font-medium" 
                          type="submit"
                        >
                          {editing ? "Update Course" : "Create Course"}
                        </button>
                        {editing && (
                          <button 
                            type="button"
                            className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition duration-200 font-medium"
                            onClick={() => {
                              setEditing(null);
                              setForm({ code: "", name: "", limit: 1, prerequisites: "", times: "" });
                            }}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>
                    
                    {/* Course List */}
                    <div className="space-y-4">
                      {courses.map(c => (
                        <div key={c._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition duration-200">
                          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex-1 mb-4 lg:mb-0">
                              <div className="flex items-center mb-2">
                                <span className="font-bold text-lg text-gray-900">{c.code}</span>
                                <span className="ml-3 text-gray-600">{c.name}</span>
                              </div>
                              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                <span className="flex items-center">
                                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                  {c.enrolled}/{c.limit} enrolled
                                </span>
                                {c.prerequisites && c.prerequisites.length > 0 && (
                                  <span className="flex items-center">
                                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Prerequisites: {c.prerequisites.join(", ")}
                                  </span>
                                )}
                                {c.times && c.times.length > 0 && (
                                  <span className="flex items-center">
                                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {c.times.map(t => `${t.day} ${t.start}-${t.end}`).join(", ")}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-lg transition duration-200 text-sm font-medium" 
                                onClick={() => handleEdit(c)}
                              >
                                Edit
                              </button>
                              <button 
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg transition duration-200 text-sm font-medium" 
                                onClick={() => handleDelete(c._id)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Analytics */}
              <div className="xl:col-span-1">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                    <h2 className="text-xl font-semibold text-white flex items-center">
                      <svg className="h-6 w-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Analytics
                    </h2>
                  </div>
                  
                  <div className="p-6">
                    {analytics ? (
                      <div className="space-y-6">
                        {/* Quick Stats */}
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-green-50 p-3 rounded-lg">
                              <div className="text-2xl font-bold text-green-900">{analytics.totalCourses || 0}</div>
                              <div className="text-sm text-green-600">Total Courses</div>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <div className="text-2xl font-bold text-blue-900">{analytics.totalRegistrations || 0}</div>
                              <div className="text-sm text-blue-600">Registrations</div>
                            </div>
                            <div className="bg-yellow-50 p-3 rounded-lg">
                              <div className="text-2xl font-bold text-yellow-900">{analytics.pendingRegistrations || 0}</div>
                              <div className="text-sm text-yellow-600">Pending</div>
                            </div>
                            <div className="bg-purple-50 p-3 rounded-lg">
                              <div className="text-2xl font-bold text-purple-900">{analytics.approvedCourses || 0}</div>
                              <div className="text-sm text-purple-600">Approved</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-gray-600">Loading analytics...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Student List Tab */}
        {activeTab === 'students' && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <svg className="h-6 w-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  Student Management
                </h2>
              </div>
              
              <div className="p-6">
                {/* User Form for Students */}
                <form className="mb-8 bg-gray-50 p-6 rounded-lg" onSubmit={(e) => {
                  e.preventDefault();
                  if (editingUser) {
                    handleUserAction('update', editingUser._id, { ...userForm, role: 'Student' });
                  } else {
                    handleUserAction('create', null, { ...userForm, role: 'Student' });
                  }
                }}>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {editingUser ? "Edit Student" : "Add New Student"}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200" 
                        name="name" 
                        placeholder="John Doe" 
                        value={userForm.name} 
                        onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                        required 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200" 
                        name="email" 
                        type="email"
                        placeholder="john@example.com" 
                        value={userForm.email} 
                        onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                        required 
                      />
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200" 
                      name="password" 
                      type="password"
                      placeholder={editingUser ? "Leave blank to keep current password" : "Enter password"}
                      value={userForm.password} 
                      onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                      required={!editingUser}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 font-medium" 
                      type="submit"
                    >
                      {editingUser ? "Update Student" : "Create Student"}
                    </button>
                    {editingUser && (
                      <button 
                        type="button"
                        className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition duration-200 font-medium"
                        onClick={() => {
                          setEditingUser(null);
                          setUserForm({ name: '', email: '', role: 'Student', password: '' });
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
                
                {/* Student List */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Student List ({students.length})</h3>
                    <button 
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition duration-200 font-medium"
                      onClick={() => {
                        if (selectedUsers.length === 0) {
                          setNotification({ message: 'Please select students to send notification', type: 'error' });
                          return;
                        }
                        setShowNotificationModal(true);
                      }}
                      disabled={selectedUsers.length === 0}
                    >
                      Send Notice to Selected ({selectedUsers.length})
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {students.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>No students found. Create a student account to get started.</p>
                      </div>
                    ) : (
                      students.map(student => (
                        <div key={student._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition duration-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <input 
                                type="checkbox"
                                className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                checked={selectedUsers.includes(student._id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedUsers([...selectedUsers, student._id]);
                                  } else {
                                    setSelectedUsers(selectedUsers.filter(id => id !== student._id));
                                  }
                                }}
                              />
                              <div>
                                <div className="font-medium text-gray-900">{student.name}</div>
                                <div className="text-sm text-gray-500">{student.email}</div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-lg transition duration-200 text-sm font-medium" 
                                onClick={() => {
                                  setEditingUser(student);
                                  setUserForm({ name: student.name, email: student.email, role: 'Student', password: '' });
                                }}
                              >
                                Edit
                              </button>
                              <button 
                                className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-lg transition duration-200 text-sm font-medium" 
                                onClick={() => {
                                  const newPassword = prompt('Enter new password for ' + student.name + ':');
                                  if (newPassword) {
                                    handleUserAction('resetPassword', student._id, { password: newPassword });
                                  }
                                }}
                              >
                                Reset Password
                              </button>
                              <button 
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg transition duration-200 text-sm font-medium" 
                                onClick={() => {
                                  if (window.confirm(`Delete student ${student.name}?`)) {
                                    handleUserAction('delete', student._id);
                                  }
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Advisor List Tab */}
        {activeTab === 'advisors' && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <svg className="h-6 w-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Advisor Management
                </h2>
              </div>
              
              <div className="p-6">
                {/* User Form for Advisors */}
                <form className="mb-8 bg-gray-50 p-6 rounded-lg" onSubmit={(e) => {
                  e.preventDefault();
                  if (editingUser) {
                    handleUserAction('update', editingUser._id, { ...userForm, role: 'Advisor' });
                  } else {
                    handleUserAction('create', null, { ...userForm, role: 'Advisor' });
                  }
                }}>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {editingUser ? "Edit Advisor" : "Add New Advisor"}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200" 
                        name="name" 
                        placeholder="Dr. Jane Smith" 
                        value={userForm.name} 
                        onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                        required 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200" 
                        name="email" 
                        type="email"
                        placeholder="advisor@example.com" 
                        value={userForm.email} 
                        onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                        required 
                      />
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200" 
                      name="password" 
                      type="password"
                      placeholder={editingUser ? "Leave blank to keep current password" : "Enter password"}
                      value={userForm.password} 
                      onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                      required={!editingUser}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition duration-200 font-medium" 
                      type="submit"
                    >
                      {editingUser ? "Update Advisor" : "Create Advisor"}
                    </button>
                    {editingUser && (
                      <button 
                        type="button"
                        className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition duration-200 font-medium"
                        onClick={() => {
                          setEditingUser(null);
                          setUserForm({ name: '', email: '', role: 'Advisor', password: '' });
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
                
                {/* Advisor List */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Advisor List ({advisors.length})</h3>
                    <button 
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition duration-200 font-medium"
                      onClick={() => {
                        if (selectedUsers.length === 0) {
                          setNotification({ message: 'Please select advisors to send notification', type: 'error' });
                          return;
                        }
                        setShowNotificationModal(true);
                      }}
                      disabled={selectedUsers.length === 0}
                    >
                      Send Notice to Selected ({selectedUsers.length})
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {advisors.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>No advisors found. Create an advisor account to get started.</p>
                      </div>
                    ) : (
                      advisors.map(advisor => (
                        <div key={advisor._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition duration-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <input 
                                type="checkbox"
                                className="mr-3 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                checked={selectedUsers.includes(advisor._id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedUsers([...selectedUsers, advisor._id]);
                                  } else {
                                    setSelectedUsers(selectedUsers.filter(id => id !== advisor._id));
                                  }
                                }}
                              />
                              <div>
                                <div className="font-medium text-gray-900">{advisor.name}</div>
                                <div className="text-sm text-gray-500">{advisor.email}</div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-lg transition duration-200 text-sm font-medium" 
                                onClick={() => {
                                  setEditingUser(advisor);
                                  setUserForm({ name: advisor.name, email: advisor.email, role: 'Advisor', password: '' });
                                }}
                              >
                                Edit
                              </button>
                              <button 
                                className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-lg transition duration-200 text-sm font-medium" 
                                onClick={() => {
                                  const newPassword = prompt('Enter new password for ' + advisor.name + ':');
                                  if (newPassword) {
                                    handleUserAction('resetPassword', advisor._id, { password: newPassword });
                                  }
                                }}
                              >
                                Reset Password
                              </button>
                              <button 
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg transition duration-200 text-sm font-medium" 
                                onClick={() => {
                                  if (window.confirm(`Delete advisor ${advisor.name}?`)) {
                                    handleUserAction('delete', advisor._id);
                                  }
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notification Modal */}
        {showNotificationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Send Notification</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  placeholder="Enter subject" 
                  value={notificationData.subject} 
                  onChange={(e) => setNotificationData({...notificationData, subject: e.target.value})}
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  rows="4"
                  placeholder="Enter your message" 
                  value={notificationData.message} 
                  onChange={(e) => setNotificationData({...notificationData, message: e.target.value})}
                />
              </div>
              
              <div className="flex gap-2">
                <button 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200 font-medium" 
                  onClick={handleSendNotification}
                >
                  Send to {selectedUsers.length} users
                </button>
                <button 
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition duration-200 font-medium" 
                  onClick={() => {
                    setShowNotificationModal(false);
                    setNotificationData({ subject: '', message: '' });
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;

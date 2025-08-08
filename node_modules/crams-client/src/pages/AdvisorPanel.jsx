import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { API_URLS } from "../config/api";

function AdvisorPanel() {
  const [registrations, setRegistrations] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [feedback, setFeedback] = useState({});
  const [selectedCourses, setSelectedCourses] = useState({});
  const [showScreenedRegistrations, setShowScreenedRegistrations] = useState(false);
  const [error, setError] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationForm, setNotificationForm] = useState({ title: "", message: "", recipients: [] });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchRegistrations();
    fetchCourses();
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      console.log("🔍 Fetching analytics from:", API_URLS.ANALYTICS);
      const response = await fetch(API_URLS.ANALYTICS, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("📊 Analytics data received:", data);
        setAnalytics(data);
      } else {
        console.warn("⚠️ Analytics fetch failed:", response.status, response.statusText);
        // Don't set analytics data, but don't crash the component
        setAnalytics(null);
      }
    } catch (error) {
      console.error("❌ Error fetching analytics:", error);
      // Don't crash the component if analytics fail
      setAnalytics(null);
    }
  };

  const fetchRegistrations = async () => {
    try {
      const response = await fetch(API_URLS.REGISTRATION, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        setError(err.error || `Error: ${response.status}`);
        setRegistrations([]);
        return;
      }
      
      const data = await response.json();
      console.log("Fetched registrations:", data);
      if (Array.isArray(data)) {
        setRegistrations(data);
      }
    } catch (error) {
      console.error("Error fetching registrations:", error);
      setError("Failed to load registrations");
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch(API_URLS.COURSES, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await response.json();
      setCourses(data);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  // Determine if a registration has been screened (all courses have non-pending status)
  const isScreened = (registration) => {
    return registration.courses.every(course => course.status !== 'pending');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-800 border-green-200";
      case "rejected": return "bg-red-100 text-red-800 border-red-200";
      case "waitlisted": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  const getOverallStatus = (courses) => {
    const statuses = courses.map(c => c.status);
    if (statuses.every(s => s === "approved")) return "All Approved";
    if (statuses.every(s => s === "rejected")) return "All Rejected";
    if (statuses.includes("approved") && statuses.includes("rejected")) return "Mixed";
    if (statuses.includes("pending")) return "Pending Review";
    return "Under Review";
  };

  // Filter registrations based on search and status
  const getFilteredRegistrations = () => {
    try {
      if (!registrations || !Array.isArray(registrations)) {
        return [];
      }

      let filtered = registrations.filter(reg => 
        showScreenedRegistrations ? isScreened(reg) : !isScreened(reg)
      );

      // Apply search filter
      if (searchTerm && searchTerm.trim()) {
        filtered = filtered.filter(reg => {
          const searchLower = searchTerm.toLowerCase();
          return (
            reg.student?.email?.toLowerCase().includes(searchLower) ||
            reg.student?.name?.toLowerCase().includes(searchLower) ||
            reg.courses?.some(c => 
              c.course?.name?.toLowerCase().includes(searchLower) ||
              c.course?.code?.toLowerCase().includes(searchLower)
            )
          );
        });
      }

      // Apply status filter
      if (statusFilter !== "all") {
        filtered = filtered.filter(reg => {
          try {
            const overallStatus = getOverallStatus(reg.courses || []);
            return overallStatus.toLowerCase().includes(statusFilter.toLowerCase());
          } catch (error) {
            console.warn("Error filtering by status:", error);
            return true; // Include the registration if status check fails
          }
        });
      }

      return filtered;
    } catch (error) {
      console.error("Error in getFilteredRegistrations:", error);
      return registrations || []; // Return unfiltered data as fallback
    }
  };

  // Filter registrations based on screening status, search, and status filter
  const filteredRegistrations = getFilteredRegistrations();

  // Handle individual course action
  const handleCourseAction = async (registrationId, courseId, action) => {
    const loadingKey = `${registrationId}-${courseId}-${action}`;
    setActionLoading(prev => ({ ...prev, [loadingKey]: true }));

    try {
      const url = `${API_URLS.REGISTRATION}/${registrationId}/course/${courseId}/${action}`;
      console.log(`Making ${action} request to:`, url);
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          feedback: feedback[`${registrationId}-${courseId}`] || ""
        }),
      });

      console.log(`${action} response status:`, response.status);
      
      if (response.ok) {
        const updatedRegistration = await response.json();
        console.log(`${action} successful, updated registration:`, updatedRegistration);
        
        setRegistrations(prev =>
          prev.map(reg => reg._id === registrationId ? updatedRegistration : reg)
        );
        
        // Clear feedback for this course
        setFeedback(prev => {
          const newFeedback = { ...prev };
          delete newFeedback[`${registrationId}-${courseId}`];
          return newFeedback;
        });

        toast.success(`Course ${action}d successfully!`);
      } else {
        const errorText = await response.text();
        console.error(`Failed to ${action} course:`, response.status, errorText);
        toast.error(`Failed to ${action} course: ${response.status}`);
      }
    } catch (error) {
      console.error(`Error ${action}ing course:`, error);
      toast.error(`Error ${action}ing course: ${error.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  // Handle bulk actions on selected courses
  const handleBulkAction = async (registrationId, action) => {
    const selectedCourseIds = selectedCourses[registrationId] || [];
    if (selectedCourseIds.length === 0) {
      toast.error("Please select at least one course");
      return;
    }

    const loadingKey = `${registrationId}-bulk-${action}`;
    setActionLoading(prev => ({ ...prev, [loadingKey]: true }));

    try {
      const url = `${API_URLS.REGISTRATION}/${registrationId}/bulk-action`;
      console.log(`Making bulk ${action} request to:`, url);
      console.log(`Selected course IDs:`, selectedCourseIds);
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          courseIds: selectedCourseIds,
          action,
          feedback: feedback[`${registrationId}-bulk`] || ""
        }),
      });

      console.log(`Bulk ${action} response status:`, response.status);

      if (response.ok) {
        const updatedRegistration = await response.json();
        console.log(`Bulk ${action} successful, updated registration:`, updatedRegistration);
        
        setRegistrations(prev =>
          prev.map(reg => reg._id === registrationId ? updatedRegistration : reg)
        );
        
        // Clear selections and feedback
        setSelectedCourses(prev => ({ ...prev, [registrationId]: [] }));
        setFeedback(prev => {
          const newFeedback = { ...prev };
          delete newFeedback[`${registrationId}-bulk`];
          return newFeedback;
        });

        toast.success(`${selectedCourseIds.length} course${selectedCourseIds.length !== 1 ? 's' : ''} ${action}d successfully!`);
      } else {
        const errorText = await response.text();
        console.error(`Failed to ${action} selected courses:`, response.status, errorText);
        toast.error(`Failed to ${action} selected courses: ${response.status}`);
      }
    } catch (error) {
      console.error(`Error with bulk ${action}:`, error);
      toast.error(`Error with bulk ${action}: ${error.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  // Handle overall registration action (approve/reject all)
  const handleOverallAction = async (registrationId, action) => {
    const loadingKey = `${registrationId}-${action}`;
    setActionLoading(prev => ({ ...prev, [loadingKey]: true }));

    try {
      const response = await fetch(`${API_URLS.REGISTRATION}/${action}/${registrationId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ feedback: feedback[registrationId] || "" }),
      });

      if (response.ok) {
        toast.success(`${action === "approve" ? "Approved" : "Rejected"} all courses!`);
        fetchRegistrations(); // Refresh the list
        setFeedback(prev => ({ ...prev, [registrationId]: "" }));
      } else {
        toast.error("Action failed");
      }
    } catch (error) {
      console.error(`Error ${action}ing registration:`, error);
      toast.error("Action failed");
    } finally {
      setActionLoading(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  // Handle course selection for bulk actions
  const handleCourseSelection = (registrationId, courseId, checked) => {
    setSelectedCourses(prev => {
      const current = prev[registrationId] || [];
      if (checked) {
        return { ...prev, [registrationId]: [...current, courseId] };
      } else {
        return { ...prev, [registrationId]: current.filter(id => id !== courseId) };
      }
    });
  };

  // Select/deselect all courses for a registration
  const handleSelectAll = (registrationId, checked) => {
    const registration = registrations.find(reg => reg._id === registrationId);
    if (checked) {
      const allCourseIds = registration.courses.map(course => course.course._id);
      setSelectedCourses(prev => ({ ...prev, [registrationId]: allCourseIds }));
    } else {
      setSelectedCourses(prev => ({ ...prev, [registrationId]: [] }));
    }
  };

  // Handle bulk notification sending
  const handleBulkNotification = async () => {
    try {
      console.log("📧 Sending notification:", notificationForm);
      console.log("📧 API URL:", `${API_URLS.NOTIFICATIONS}/send`);
      
      const response = await fetch(`${API_URLS.NOTIFICATIONS}/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(notificationForm),
      });

      console.log("📧 Response status:", response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log("📧 Success response:", result);
        toast.success(`Notification sent to ${notificationForm.recipients.length} student(s)!`);
        setShowNotificationModal(false);
        setNotificationForm({ title: "", message: "", recipients: [] });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("📧 Error response:", response.status, errorData);
        toast.error(`Failed to send notification: ${errorData.error || response.status}`);
      }
    } catch (error) {
      console.error("📧 Network error sending notification:", error);
      toast.error(`Error sending notification: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading registrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center mr-3">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Advisor Panel</h1>
            </div>
            
            {/* Status Toggle and Logout */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className={`text-sm ${!showScreenedRegistrations ? 'font-medium text-purple-600' : 'text-gray-600'}`}>
                  Pending ({registrations.filter(reg => !isScreened(reg)).length})
                </span>
                <button
                  onClick={() => setShowScreenedRegistrations(!showScreenedRegistrations)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                    showScreenedRegistrations ? 'bg-purple-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showScreenedRegistrations ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`text-sm ${showScreenedRegistrations ? 'font-medium text-purple-600' : 'text-gray-600'}`}>
                  Screened ({registrations.filter(reg => isScreened(reg)).length})
                </span>
              </div>
              
              <button 
                onClick={() => {localStorage.removeItem('token'); window.location.href = '/';}}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <svg className="h-6 w-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {showScreenedRegistrations ? "Completed Screenings" : "Pending Course Registrations"}
            </h2>
          </div>
          
          <div className="p-6">
            {/* Analytics Dashboard */}
            <div className="analytics-section mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                📊 Registration Analytics
              </h3>
              {analytics ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-800">Total Registrations</h4>
                    <p className="text-2xl font-bold text-blue-900">{analytics.totalRegistrations}</p>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-yellow-800">Pending Review</h4>
                    <p className="text-2xl font-bold text-yellow-900">{analytics.pendingRegistrations}</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-green-800">Approved Courses</h4>
                    <p className="text-2xl font-bold text-green-900">{analytics.approvedCourses}</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-red-800">Rejected Courses</h4>
                    <p className="text-2xl font-bold text-red-900">{analytics.rejectedCourses}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                  <p className="text-gray-600 text-sm">Analytics temporarily unavailable</p>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
                    <div className="bg-gray-100 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-600">Total Registrations</h4>
                      <p className="text-xl font-bold text-gray-500">--</p>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-600">Pending Review</h4>
                      <p className="text-xl font-bold text-gray-500">--</p>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-600">Approved Courses</h4>
                      <p className="text-xl font-bold text-gray-500">--</p>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-600">Rejected Courses</h4>
                      <p className="text-xl font-bold text-gray-500">--</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Search and Filter Controls */}
            <div className="controls-section mb-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <input
                    type="text"
                    placeholder="Search by student name, email, or course..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent flex-1"
                  />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>
                
                {/* Bulk Notification Button */}
                <button
                  onClick={() => setShowNotificationModal(true)}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg transition duration-200 flex items-center"
                >
                  📢 Send Bulk Notification
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
                {error}
              </div>
            )}
            
            {filteredRegistrations.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {showScreenedRegistrations ? "No completed screenings" : "No pending registrations"}
                </h3>
                <p className="text-gray-500">
                  {showScreenedRegistrations 
                    ? "All registrations are still pending review." 
                    : "All student registrations have been screened."
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredRegistrations.map((registration) => {
                  const registrationId = registration._id;
                  const selectedCount = (selectedCourses[registrationId] || []).length;
                  const allSelected = selectedCount === registration.courses.length;
                  const someSelected = selectedCount > 0 && selectedCount < registration.courses.length;
                  const hasApprovedOrRejected = registration.courses.some(c => c.status !== 'pending');

                  return (
                    <div key={registrationId} className="border border-gray-200 rounded-xl overflow-hidden">
                      {/* Registration Header */}
                      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {registration.student?.email || registration.student}
                              </h3>
                              <p className="text-sm text-gray-500">
                                Submitted {new Date(registration.submittedAt).toLocaleDateString()} • 
                                Status: <span className={`font-medium ${isScreened(registration) ? 'text-green-600' : 'text-purple-600'}`}>
                                  {getOverallStatus(registration.courses)}
                                </span>
                              </p>
                            </div>
                          </div>
                          
                          {!isScreened(registration) && (
                            <div className="flex items-center space-x-4">
                              <label className="flex items-center space-x-2 text-sm text-gray-600">
                                <input
                                  type="checkbox"
                                  checked={allSelected}
                                  ref={(input) => {
                                    if (input) input.indeterminate = someSelected;
                                  }}
                                  onChange={(e) => handleSelectAll(registrationId, e.target.checked)}
                                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                />
                                <span>Select All ({registration.courses.length})</span>
                              </label>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Courses List */}
                      <div className="p-6">
                        <h4 className="text-md font-medium text-gray-900 mb-4">Selected Courses:</h4>
                        <div className="space-y-3 mb-6">
                          {registration.courses.map((courseEntry) => {
                            const course = courseEntry.course;
                            const courseId = course._id;
                            const isSelected = (selectedCourses[registrationId] || []).includes(courseId);
                            const isPending = courseEntry.status === 'pending';

                            return (
                              <div key={courseId} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-start space-x-3 flex-1">
                                    {!isScreened(registration) && isPending && (
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => handleCourseSelection(registrationId, courseId, e.target.checked)}
                                        className="mt-1 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                      />
                                    )}
                                    
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium text-gray-900">
                                          {course?.name || courses.find(c => c._id === course)?.name || "(Unknown)"}
                                        </span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(courseEntry.status)}`}>
                                          {courseEntry.status.toUpperCase()}
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-600">
                                        Code: {course?.code} • Credits: {course?.credits} • Instructor: {course?.instructor}
                                      </p>
                                      {courseEntry.feedback && (
                                        <div className="mt-2 text-sm text-gray-600 bg-white p-2 rounded border">
                                          <span className="font-medium">Feedback:</span> {courseEntry.feedback}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Individual Course Actions */}
                                  {isPending && !isScreened(registration) && (
                                    <div className="flex flex-col space-y-2">
                                      <div className="flex space-x-2">
                                        <button
                                          onClick={() => handleCourseAction(registrationId, courseId, "approve")}
                                          disabled={actionLoading[`${registrationId}-${courseId}-approve`]}
                                          className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                          {actionLoading[`${registrationId}-${courseId}-approve`] ? "..." : "✓"}
                                        </button>
                                        <button
                                          onClick={() => handleCourseAction(registrationId, courseId, "reject")}
                                          disabled={actionLoading[`${registrationId}-${courseId}-reject`]}
                                          className="px-3 py-1 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                          {actionLoading[`${registrationId}-${courseId}-reject`] ? "..." : "✕"}
                                        </button>
                                      </div>
                                      <input
                                        type="text"
                                        placeholder="Feedback"
                                        value={feedback[`${registrationId}-${courseId}`] || ""}
                                        onChange={(e) => setFeedback(prev => ({
                                          ...prev,
                                          [`${registrationId}-${courseId}`]: e.target.value
                                        }))}
                                        className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Bulk Actions */}
                        {!isScreened(registration) && selectedCount > 0 && (
                          <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                              <div>
                                <h4 className="font-medium text-purple-900">
                                  Bulk Actions ({selectedCount} course{selectedCount !== 1 ? 's' : ''} selected)
                                </h4>
                                <input
                                  type="text"
                                  placeholder="Feedback for selected courses"
                                  value={feedback[`${registrationId}-bulk`] || ""}
                                  onChange={(e) => setFeedback(prev => ({
                                    ...prev,
                                    [`${registrationId}-bulk`]: e.target.value
                                  }))}
                                  className="mt-2 px-3 py-2 text-sm border border-purple-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 w-full sm:w-80"
                                />
                              </div>
                              <div className="flex space-x-3">
                                <button
                                  onClick={() => handleBulkAction(registrationId, "approve")}
                                  disabled={actionLoading[`${registrationId}-bulk-approve`]}
                                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  {actionLoading[`${registrationId}-bulk-approve`] ? "Processing..." : "✓ Approve Selected"}
                                </button>
                                <button
                                  onClick={() => handleBulkAction(registrationId, "reject")}
                                  disabled={actionLoading[`${registrationId}-bulk-reject`]}
                                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  {actionLoading[`${registrationId}-bulk-reject`] ? "Processing..." : "✕ Reject Selected"}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Overall Actions */}
                        {!isScreened(registration) && (
                          <div className="border-t border-gray-200 pt-4">
                            <div className="flex flex-col sm:flex-row gap-4">
                              <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Overall Feedback (optional)
                                </label>
                                <textarea
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 resize-none"
                                  rows={2}
                                  placeholder="Add feedback for the entire registration..."
                                  value={feedback[registrationId] || ""}
                                  onChange={e => setFeedback({ ...feedback, [registrationId]: e.target.value })}
                                />
                              </div>
                              <div className="flex flex-col justify-end gap-2 sm:w-48">
                                <button 
                                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 px-4 rounded-lg hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-200 font-medium disabled:opacity-50"
                                  onClick={() => handleOverallAction(registrationId, "approve")}
                                  disabled={actionLoading[`${registrationId}-approve`]}
                                >
                                  {actionLoading[`${registrationId}-approve`] ? "Approving..." : "✓ Approve All"}
                                </button>
                                <button 
                                  className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white py-2 px-4 rounded-lg hover:from-red-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition duration-200 font-medium disabled:opacity-50"
                                  onClick={() => handleOverallAction(registrationId, "reject")}
                                  disabled={actionLoading[`${registrationId}-reject`]}
                                >
                                  {actionLoading[`${registrationId}-reject`] ? "Rejecting..." : "✕ Reject All"}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Notification Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Send Bulk Notification</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={notificationForm.title}
                  onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Notification title..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  value={notificationForm.message}
                  onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Type your message here..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipients
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                  {filteredRegistrations.map((reg) => {
                    console.log("📋 Registration for notification:", reg);
                    const studentId = reg.student?._id || reg.student || reg.userId;
                    const studentName = reg.student?.name || reg.student?.email || "Student";
                    
                    return (
                      <label key={reg._id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={notificationForm.recipients.includes(studentId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNotificationForm(prev => ({
                                ...prev,
                                recipients: [...prev.recipients, studentId]
                              }));
                            } else {
                              setNotificationForm(prev => ({
                                ...prev,
                                recipients: prev.recipients.filter(id => id !== studentId)
                              }));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-700">
                          {studentName} {studentId ? `(${studentId})` : "(No ID)"}
                        </span>
                      </label>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {notificationForm.recipients.length} student(s) selected
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowNotificationModal(false);
                  setNotificationForm({ title: "", message: "", recipients: [] });
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkNotification}
                disabled={!notificationForm.title || !notificationForm.message || notificationForm.recipients.length === 0}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Notification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdvisorPanel;

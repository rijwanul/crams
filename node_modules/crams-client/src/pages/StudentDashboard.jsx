import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { API_URLS } from "../config/api";
import NotificationBell from "../components/NotificationBell";

function checkConflicts(selected, courses) {
  // Simple time overlap check
  const times = selected.map(cid => {
    const c = courses.find(c => c._id === cid);
    return c ? c.times : [];
  }).flat();
  for (let i = 0; i < times.length; i++) {
    for (let j = i + 1; j < times.length; j++) {
      if (times[i].day === times[j].day && times[i].start === times[j].start && times[i].end === times[j].end) {
        return true;
      }
    }
  }
  return false;
}

function StudentDashboard() {
  const [courses, setCourses] = useState([]);
  const [selected, setSelected] = useState([]);
  const [status, setStatus] = useState([]);
  const [currentRegistration, setCurrentRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [coursesLoaded, setCoursesLoaded] = useState(false);
  const [statusLoaded, setStatusLoaded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchCourses();
    fetchRegistrationStatus();
  }, []);

  const fetchCourses = () => {
    fetch(API_URLS.COURSES, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then(async res => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setError(err.error || `Error: ${res.status}`);
          setCourses([]);
          setCoursesLoaded(true);
          return;
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) setCourses(data);
        setCoursesLoaded(true);
      });
  };

  const fetchRegistrationStatus = () => {
    fetch(API_URLS.REGISTRATION_STUDENT, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then(async res => {
        if (!res.ok) {
          setStatus([]);
          setCurrentRegistration(null);
          setStatusLoaded(true);
          return;
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const registration = data[0];
          setStatus(registration.courses || []);
          setCurrentRegistration(registration);
          
          // If there's a pending or approved registration, populate selected courses for editing
          if (registration.status === 'pending' || registration.status === 'approved') {
            const courseIds = registration.courses.map(c => 
              typeof c.course === 'object' ? c.course._id : c.course
            );
            setSelected(courseIds);
          }
        } else {
          setStatus([]);
          setCurrentRegistration(null);
        }
        setStatusLoaded(true);
      });
  };

  // Update loading state when both requests complete
  useEffect(() => {
    if (coursesLoaded && statusLoaded) {
      setLoading(false);
    }
  }, [coursesLoaded, statusLoaded]);

  const handleSelect = (id) => {
    if (!canEditRegistration()) return;
    setSelected(selected.includes(id) ? selected.filter(cid => cid !== id) : [...selected, id]);
  };

  const canEditRegistration = () => {
    // If no registration exists, allow editing (for new registrations)
    if (!currentRegistration) return true;
    
    // If currently in edit mode, allow editing
    if (isEditing) return true;
    
    // Otherwise, checkboxes should be disabled until user clicks "Edit"
    return false;
  };

  const canSubmitNewRegistration = () => {
    if (!currentRegistration) return true;
    const overallStatus = getOverallRegistrationStatus();
    return overallStatus === 'rejected';
  };

  const handleSubmit = async () => {
    if (checkConflicts(selected, courses)) {
      toast.error("Time conflict detected!");
      return;
    }

    // Use POST for both new and update operations, but different endpoints
    const method = "POST";
    const url = currentRegistration && isEditing 
      ? `${API_URLS.REGISTRATION}/update/${currentRegistration._id}` 
      : API_URLS.REGISTRATION;

    console.log("Submitting registration:", {
      method,
      url,
      isEditing,
      currentRegistration: currentRegistration?._id,
      selectedCourses: selected
    });

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ courses: selected.map(cid => ({ course: cid })) }),
      });

      console.log("Response status:", res.status);
      console.log("Response headers:", Object.fromEntries(res.headers.entries()));

      // Check if response is HTML (error page) instead of JSON
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        const htmlContent = await res.text();
        console.error("Received HTML instead of JSON:", htmlContent.substring(0, 500));
        toast.error(`Server error: ${res.status} - Check console for details`);
        return;
      }

      const responseData = await res.json();
      console.log("Response:", { status: res.status, data: responseData });

      if (res.ok) {
        toast.success(isEditing ? "Registration updated and resubmitted!" : "Registration submitted!");
        setSelected([]);
        setIsEditing(false);
        fetchRegistrationStatus(); // Refresh registration status
      } else {
        console.error("Registration failed:", responseData);
        toast.error(responseData.error || `Failed to submit registration (${res.status})`);
      }
    } catch (error) {
      console.error("Network error:", error);
      if (error.message.includes("Unexpected token '<'")) {
        toast.error("Server returned HTML instead of JSON. Check if backend is running properly.");
      } else {
        toast.error("Network error occurred. Please try again.");
      }
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    // Pre-select the courses from current registration
    if (currentRegistration && currentRegistration.courses) {
      const courseIds = currentRegistration.courses.map(c => 
        typeof c.course === 'object' ? c.course._id : c.course
      );
      setSelected(courseIds);
    }
    toast.info("You can now edit your course selection. Changes will be resubmitted for advisor review.");
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset selected courses to current registration
    if (currentRegistration) {
      const courseIds = currentRegistration.courses.map(c => 
        typeof c.course === 'object' ? c.course._id : c.course
      );
      setSelected(courseIds);
    }
  };

  const getOverallRegistrationStatus = () => {
    if (!currentRegistration || !currentRegistration.courses || currentRegistration.courses.length === 0) {
      return 'unknown';
    }
    
    const courseStatuses = currentRegistration.courses.map(c => c.status);
    
    // If any course is rejected, overall status is rejected
    if (courseStatuses.includes('rejected')) {
      return 'rejected';
    }
    // If all courses are approved, overall status is approved
    if (courseStatuses.every(status => status === 'approved')) {
      return 'approved';
    }
    // If any course is pending (and none rejected), overall status is pending
    if (courseStatuses.includes('pending')) {
      return 'pending';
    }
    // If any course is waitlisted
    if (courseStatuses.includes('waitlisted')) {
      return 'waitlisted';
    }
    
    return 'unknown';
  };

  const getRegistrationStatusText = () => {
    if (!currentRegistration) return "No registration submitted";
    
    const overallStatus = getOverallRegistrationStatus();
    
    switch (overallStatus) {
      case 'pending':
        return isEditing ? "Editing Registration (Pending)" : "Registration Pending Review";
      case 'approved':
        return "Registration Approved";
      case 'rejected':
        return "Registration Rejected";
      case 'waitlisted':
        return "Registration Waitlisted";
      default:
        return "Registration Status Unknown";
    }
  };

  const getRegistrationStatusColor = () => {
    if (!currentRegistration) return "text-gray-600";
    
    const overallStatus = getOverallRegistrationStatus();
    
    switch (overallStatus) {
      case 'pending':
        return "text-yellow-600";
      case 'approved':
        return "text-green-600";
      case 'rejected':
        return "text-red-600";
      case 'waitlisted':
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationBell />
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Course Selection Panel */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <svg className="h-6 w-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Course Selection
              </h2>
            </div>
            
            <div className="p-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                  {error}
                </div>
              )}
              
              {/* Registration Status Message */}
              {currentRegistration ? (
                (() => {
                  const overallStatus = getOverallRegistrationStatus();
                  return (
                    <div className={`mb-4 p-4 rounded-lg border-l-4 ${
                      overallStatus === 'approved' ? 'bg-green-50 border-green-500 text-green-700' :
                      overallStatus === 'pending' ? 'bg-yellow-50 border-yellow-500 text-yellow-700' :
                      overallStatus === 'waitlisted' ? 'bg-blue-50 border-blue-500 text-blue-700' :
                      'bg-red-50 border-red-500 text-red-700'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {getRegistrationStatusText()}
                          </p>
                          {currentRegistration.courses.some(c => c.feedback) && (
                            <div className="text-sm mt-2 space-y-1">
                              <span className="font-medium">Course Feedback:</span>
                              {currentRegistration.courses.filter(c => c.feedback).map((c, i) => (
                                <div key={i} className="bg-white bg-opacity-50 p-2 rounded">
                                  <span className="font-medium">{c.course?.code || 'Unknown Course'}:</span> {c.feedback}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* Edit buttons right in the status message */}
                        <div className="flex space-x-2">
                          {(overallStatus === 'pending' || overallStatus === 'rejected' || overallStatus === 'waitlisted') && !isEditing && (
                            <button
                              onClick={handleEdit}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition duration-200 flex items-center ${
                                overallStatus === 'pending' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' :
                                overallStatus === 'rejected' ? 'bg-red-600 hover:bg-red-700 text-white' :
                                'bg-blue-600 hover:bg-blue-700 text-white'
                              }`}
                            >
                              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              {overallStatus === 'pending' ? 'Edit Pending' : 'Edit Registration'}
                            </button>
                          )}
                          {overallStatus === 'approved' && !isEditing && (
                            <button
                              onClick={handleEdit}
                              className="px-4 py-2 rounded-lg text-sm font-medium transition duration-200 flex items-center bg-green-600 hover:bg-green-700 text-white"
                            >
                              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit Approved
                            </button>
                          )}
                          {isEditing && (
                            <button
                              onClick={handleCancelEdit}
                              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition duration-200"
                            >
                              Cancel Edit
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="mb-4 p-4 rounded-lg bg-blue-50 border-l-4 border-blue-500 text-blue-700">
                  <p className="font-medium">No Registration Found</p>
                  <p className="text-sm mt-1">You haven't submitted a course registration yet. Please register from the login page.</p>
                </div>
              )}
              
              {/* Course List */}
              <div className="space-y-3 mb-6">
                {Array.isArray(courses) && courses.length > 0 ? courses.map((c) => (
                  <div key={c._id} className={`flex items-center p-4 border border-gray-200 rounded-lg transition duration-200 ${
                    canEditRegistration() ? 'hover:bg-gray-50' : 'opacity-60'
                  }`}>
                    <input
                      type="checkbox"
                      checked={selected.includes(c._id)}
                      onChange={() => handleSelect(c._id)}
                      disabled={!canEditRegistration()}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-4 disabled:opacity-50"
                    />
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <span className="font-semibold text-gray-900">{c.code}</span>
                          <span className="text-gray-600 ml-2">{c.name}</span>
                        </div>
                        <div className="flex items-center mt-1 sm:mt-0">
                          <span className="text-sm text-gray-500">
                            Seats: <span className={`font-medium ${c.enrolled >= c.limit ? 'text-red-600' : 'text-green-600'}`}>
                              {c.enrolled}/{c.limit}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    No courses available
                  </div>
                )}
              </div>
              
              {/* Conflict Warning */}
              {checkConflicts(selected, courses) && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4 flex items-center">
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Warning: Time conflict detected!
                </div>
              )}
              
              {/* Submit/Update Button */}
              {(canSubmitNewRegistration() || isEditing) && (
                <button 
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleSubmit}
                  disabled={selected.length === 0}
                >
                  {isEditing ? `Update Registration (${selected.length} courses)` : `Submit Registration (${selected.length} courses)`}
                </button>
              )}
            </div>
          </div>

          {/* Registration Status */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <svg className="h-6 w-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Registration Status
              </h2>
            </div>
            
            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {status.length > 0 ? status.map((c, i) => {
                    // Handle both populated course objects and course IDs
                    let courseName = "(Unknown)";
                    if (c.course) {
                      if (typeof c.course === 'object' && c.course.name) {
                        // Course is populated
                        courseName = `${c.course.code} - ${c.course.name}`;
                      } else if (typeof c.course === 'string') {
                        // Course is just an ID, find it in courses array
                        const course = courses.find(course => course._id === c.course);
                        if (course) {
                          courseName = `${course.code} - ${course.name}`;
                        }
                      }
                    }
                    
                    const statusColors = {
                      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                      approved: 'bg-green-100 text-green-800 border-green-200',
                      rejected: 'bg-red-100 text-red-800 border-red-200',
                      waitlisted: 'bg-blue-100 text-blue-800 border-blue-200'
                    };
                    
                    return (
                      <div key={i} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                          <div className="font-medium text-gray-900 mb-2 sm:mb-0">
                            {courseName}
                          </div>
                          <div className="flex items-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[c.status] || statusColors.pending}`}>
                              {c.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        {c.feedback && (
                          <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            <span className="font-medium">Feedback:</span> {c.feedback}
                          </div>
                        )}
                      </div>
                    );
                  }) : (
                    <div className="text-center py-8 text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      No registrations submitted yet
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;

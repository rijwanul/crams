import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { API_URLS } from "../config/api";

function AdvisorPanel() {
  const [plans, setPlans] = useState([]);
  const [courses, setCourses] = useState([]);
  const [feedback, setFeedback] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(API_URLS.REGISTRATION, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then(async res => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setError(err.error || `Error: ${res.status}`);
          setPlans([]);
          return;
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) setPlans(data);
        setLoading(false);
      });
    fetch(API_URLS.COURSES, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then(res => res.json())
      .then(setCourses);
  }, []);

  const handleAction = async (id, action) => {
    const res = await fetch(`${API_URLS.REGISTRATION}/${action}/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ feedback: feedback[id] || "" }),
    });
    if (res.ok) {
      toast.success(`${action === "approve" ? "Approved" : "Rejected"}!`);
      // Refresh the plans list
      fetch(API_URLS.REGISTRATION, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setPlans(data);
        });
    } else {
      toast.error("Action failed");
    }
  };

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
            <button 
              onClick={() => {localStorage.removeItem('token'); window.location.href = '/';}}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition duration-200"
            >
              Logout
            </button>
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
              Student Registration Plans
            </h2>
          </div>
          
          <div className="p-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
                {error}
              </div>
            )}
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="ml-2 text-gray-600">Loading student plans...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {plans.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No plans submitted yet</h3>
                    <p className="text-gray-500">When students submit their course registration plans, they will appear here for review.</p>
                  </div>
                ) : (
                  plans.map((plan) => (
                    <div key={plan._id} className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="h-10 w-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {plan.student?.email || plan.student}
                              </h3>
                              <p className="text-sm text-gray-500">
                                Submitted {new Date(plan.submittedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            {plan.courses.length} course{plan.courses.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <h4 className="text-md font-medium text-gray-900 mb-4">Selected Courses:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                          {plan.courses.map((c, i) => {
                            const statusColors = {
                              pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                              approved: 'bg-green-100 text-green-800 border-green-200',
                              rejected: 'bg-red-100 text-red-800 border-red-200',
                              waitlisted: 'bg-blue-100 text-blue-800 border-blue-200'
                            };
                            
                            return (
                              <div key={i} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-gray-900">
                                    {c.course?.name || courses.find(course => course._id === c.course)?.name || "(Unknown)"}
                                  </span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColors[c.status] || statusColors.pending}`}>
                                    {c.status.toUpperCase()}
                                  </span>
                                </div>
                                {c.feedback && (
                                  <div className="text-sm text-gray-600 bg-white p-2 rounded border">
                                    <span className="font-medium">Feedback:</span> {c.feedback}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className="border-t border-gray-200 pt-4">
                          <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Feedback (optional)
                              </label>
                              <textarea
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 resize-none"
                                rows={3}
                                placeholder="Add feedback for the student..."
                                value={feedback[plan._id] || ""}
                                onChange={e => setFeedback({ ...feedback, [plan._id]: e.target.value })}
                              />
                            </div>
                            <div className="flex flex-col justify-end gap-2 sm:w-48">
                              <button 
                                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 px-4 rounded-lg hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-200 font-medium"
                                onClick={() => handleAction(plan._id, "approve")}
                              >
                                ✓ Approve
                              </button>
                              <button 
                                className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white py-2 px-4 rounded-lg hover:from-red-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition duration-200 font-medium"
                                onClick={() => handleAction(plan._id, "reject")}
                              >
                                ✕ Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdvisorPanel;

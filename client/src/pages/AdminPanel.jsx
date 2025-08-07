import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { API_URLS } from "../config/api";

function AdminPanel() {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ code: "", name: "", limit: 1, prerequisites: "", times: "" });
  const [editing, setEditing] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  const fetchCourses = () => {
    fetch(API_URLS.COURSES, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then(res => res.json())
      .then(setCourses);
  };

  useEffect(() => {
    fetchCourses();
    fetch(API_URLS.ANALYTICS, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then(res => res.json())
      .then(setAnalytics);
  }, []);

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
              onClick={() => {localStorage.removeItem('token'); window.location.href = '/';}}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                            {c.prerequisites.length > 0 && (
                              <span className="flex items-center">
                                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Prerequisites: {c.prerequisites.join(", ")}
                              </span>
                            )}
                            {c.times.length > 0 && (
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
                    {/* Registration Statistics */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Registration Status</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <div className="text-2xl font-bold text-green-600">{analytics.approved}</div>
                          <div className="text-sm text-green-700">Approved</div>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                          <div className="text-2xl font-bold text-red-600">{analytics.rejected}</div>
                          <div className="text-sm text-red-700">Rejected</div>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <div className="text-2xl font-bold text-blue-600">{analytics.waitlisted}</div>
                          <div className="text-sm text-blue-700">Waitlisted</div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <div className="text-2xl font-bold text-gray-600">
                            {analytics.approved + analytics.rejected + analytics.waitlisted}
                          </div>
                          <div className="text-sm text-gray-700">Total</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Seat Usage */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Seat Usage</h3>
                      <div className="space-y-3">
                        {analytics.seatUsage.map((s, i) => {
                          const percentage = (s.enrolled / s.limit) * 100;
                          return (
                            <div key={i} className="border border-gray-200 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-900">{s.code}</span>
                                <span className="text-sm text-gray-600">{s.enrolled}/{s.limit}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    percentage >= 90 ? 'bg-red-500' : 
                                    percentage >= 75 ? 'bg-yellow-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min(percentage, 100)}%` }}
                                ></div>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {percentage.toFixed(1)}% capacity
                              </div>
                            </div>
                          );
                        })}
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
    </div>
  );
}

export default AdminPanel;

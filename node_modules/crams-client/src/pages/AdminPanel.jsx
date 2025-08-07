import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

function AdminPanel() {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ code: "", name: "", limit: 1, prerequisites: "", times: "" });
  const [editing, setEditing] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  const fetchCourses = () => {
    fetch("/api/courses", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then(res => res.json())
      .then(setCourses);
  };

  useEffect(() => {
    fetchCourses();
    fetch("/api/analytics", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then(res => res.json())
      .then(setAnalytics);
  }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/courses/${editing}` : "/api/courses";
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
    const res = await fetch(`/api/courses/${id}`, {
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
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
      <h2 className="font-semibold mb-2">Manage Courses</h2>
      <form className="mb-4 flex flex-col gap-2" onSubmit={handleSubmit}>
        <input className="border p-1 rounded" name="code" placeholder="Code" value={form.code} onChange={handleChange} required />
        <input className="border p-1 rounded" name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
        <input className="border p-1 rounded" name="limit" type="number" min="1" placeholder="Limit" value={form.limit} onChange={handleChange} required />
        <input className="border p-1 rounded" name="prerequisites" placeholder="Prerequisites (comma separated)" value={form.prerequisites} onChange={handleChange} />
        <input className="border p-1 rounded" name="times" placeholder="Times (e.g. Mon 10:00 12:00; Wed 14:00 16:00)" value={form.times} onChange={handleChange} />
        <button className="bg-blue-600 text-white px-4 py-2 rounded self-start" type="submit">{editing ? "Update" : "Create"} Course</button>
      </form>
      <ul className="mb-6">
        {courses.map(c => (
          <li key={c._id} className="mb-2 border rounded p-2 flex items-center justify-between">
            <span>{c.code} - {c.name} (Seats: {c.enrolled}/{c.limit})</span>
            <span>
              <button className="bg-yellow-500 text-white px-2 py-1 rounded mr-2" onClick={() => handleEdit(c)}>Edit</button>
              <button className="bg-red-600 text-white px-2 py-1 rounded" onClick={() => handleDelete(c._id)}>Delete</button>
            </span>
          </li>
        ))}
      </ul>
      <h2 className="font-semibold mb-2">Analytics</h2>
      {analytics ? (
        <div className="mb-4">
          <div>Approved: {analytics.approved}</div>
          <div>Rejected: {analytics.rejected}</div>
          <div>Waitlisted: {analytics.waitlisted}</div>
          <div>Seat Usage:</div>
          <ul>
            {analytics.seatUsage.map((s, i) => (
              <li key={i}>{s.code}: {s.enrolled}/{s.limit}</li>
            ))}
          </ul>
        </div>
      ) : <div>Loading analytics...</div>}
    </div>
  );
}

export default AdminPanel;

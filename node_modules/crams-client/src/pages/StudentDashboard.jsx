import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [coursesLoaded, setCoursesLoaded] = useState(false);
  const [statusLoaded, setStatusLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/courses", {
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
    fetch("/api/registration/student", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then(async res => {
        if (!res.ok) {
          setStatus([]);
          setStatusLoaded(true);
          return;
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) setStatus(data[0]?.courses || []);
        setStatusLoaded(true);
      });
  }, []);

  // Update loading state when both requests complete
  useEffect(() => {
    if (coursesLoaded && statusLoaded) {
      setLoading(false);
    }
  }, [coursesLoaded, statusLoaded]);

  const handleSelect = (id) => {
    setSelected(selected.includes(id) ? selected.filter(cid => cid !== id) : [...selected, id]);
  };

  const handleSubmit = async () => {
    if (checkConflicts(selected, courses)) {
      toast.error("Time conflict detected!");
      return;
    }
    const res = await fetch("/api/registration", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ courses: selected.map(cid => ({ course: cid })) }),
    });
    if (res.ok) {
      toast.success("Registration submitted!");
      setSelected([]); // Clear selections
      // Refresh registration status
      fetch("/api/registration/student", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
        .then(async res => {
          if (!res.ok) {
            setStatus([]);
            return;
          }
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data)) setStatus(data[0]?.courses || []);
        });
    } else {
      toast.error("Failed to submit registration");
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Student Dashboard</h1>
      <h2 className="font-semibold mb-2">Course Offerings</h2>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <ul className="mb-4">
        {Array.isArray(courses) && courses.length > 0 ? courses.map((c) => (
          <li key={c._id} className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={selected.includes(c._id)}
              onChange={() => handleSelect(c._id)}
              className="mr-2"
            />
            <span>{c.code} - {c.name} (Seats: {c.enrolled}/{c.limit})</span>
          </li>
        )) : <li>No courses available.</li>}
      </ul>
      <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleSubmit}>
        Submit Registration
      </button>
      {checkConflicts(selected, courses) && (
        <div className="text-red-500 mt-2">Warning: Time conflict detected!</div>
      )}
      <h2 className="font-semibold mt-6 mb-2">Registration Status</h2>
      {loading ? <div>Loading...</div> : (
        <ul>
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
            return (
              <li key={i} className="mb-1">
                {courseName} - <span className="capitalize">{c.status}</span>
                {c.feedback && <span className="ml-2 text-sm text-gray-500">({c.feedback})</span>}
              </li>
            );
          }) : <li>No registrations submitted yet.</li>}
        </ul>
      )}
    </div>
  );
}

export default StudentDashboard;

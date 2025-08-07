import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

function AdvisorPanel() {
  const [plans, setPlans] = useState([]);
  const [courses, setCourses] = useState([]);
  const [feedback, setFeedback] = useState({});

  useEffect(() => {
    fetch("/api/registration", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then(res => res.json())
      .then(setPlans);
    fetch("/api/courses", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then(res => res.json())
      .then(setCourses);
  }, []);

  const handleAction = async (id, action) => {
    const res = await fetch(`/api/registration/${action}/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ feedback: feedback[id] || "" }),
    });
    if (res.ok) {
      toast.success(`${action === "approve" ? "Approved" : "Rejected"}!`);
    } else {
      toast.error("Action failed");
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Advisor Panel</h1>
      <h2 className="font-semibold mb-2">Student Plans</h2>
      {plans.length === 0 ? <div>No plans submitted yet.</div> : plans.map((plan) => (
        <div key={plan._id} className="border rounded p-3 mb-4">
          <div className="mb-2 font-semibold">Student: {plan.student}</div>
          <ul className="mb-2">
            {plan.courses.map((c, i) => (
              <li key={i}>
                {courses.find(course => course._id === c.course)?.name || "(Unknown)"} - <span className="capitalize">{c.status}</span>
                {c.feedback && <span className="ml-2 text-sm text-gray-500">({c.feedback})</span>}
              </li>
            ))}
          </ul>
          <input
            className="border p-1 rounded mr-2"
            placeholder="Feedback (optional)"
            value={feedback[plan._id] || ""}
            onChange={e => setFeedback({ ...feedback, [plan._id]: e.target.value })}
          />
          <button className="bg-green-600 text-white px-2 py-1 rounded mr-2" onClick={() => handleAction(plan._id, "approve")}>Approve</button>
          <button className="bg-red-600 text-white px-2 py-1 rounded" onClick={() => handleAction(plan._id, "reject")}>Reject</button>
        </div>
      ))}
    </div>
  );
}

export default AdvisorPanel;

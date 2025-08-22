import React, { useEffect, useState } from "react";
import { db } from '/src/firebase.js';
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";

const SUBSCRIPTION_TIERS = ["free", "premium", "admin"];

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  // Fetch users from Firestore
  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      const usersSnap = await getDocs(collection(db, "users"));
      const usersList = [];
      usersSnap.forEach((docSnap) => {
        usersList.push({ uid: docSnap.id, ...docSnap.data() });
      });
      setUsers(usersList);
      setLoading(false);
    }
    fetchUsers();
  }, []);

  // Filtered user list
  const displayedUsers = filter === "all"
    ? users
    : users.filter((u) => u.subscription === filter);

  // Change subscription tier for a user
  const handleTierChange = async (uid, newTier) => {
    await updateDoc(doc(db, "users", uid), { subscription: newTier });
    setUsers((prev) =>
      prev.map((u) =>
        u.uid === uid ? { ...u, subscription: newTier } : u
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col px-4 py-6 items-center">
      <div className="w-full max-w-4xl bg-white p-8 rounded shadow">
        <h1 className="text-2xl font-bold mb-4 text-center">Admin Dashboard</h1>
        <div className="flex justify-between items-center mb-4">
          <span className="font-semibold">Users: {displayedUsers.length}</span>
          <select
            className="border border-gray-300 px-2 py-1 rounded"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            <option value="all">All Subscriptions</option>
            {SUBSCRIPTION_TIERS.map(tier => (
              <option value={tier} key={tier}>{tier.charAt(0).toUpperCase() + tier.slice(1)}</option>
            ))}
          </select>
        </div>
        {loading ? (
          <div className="text-center">Loading users...</div>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full bg-white border">
              <thead>
                <tr>
                  <th className="p-2 border text-left">Email</th>
                  <th className="p-2 border text-left">Username</th>
                  <th className="p-2 border text-left">Subscription</th>
                  <th className="p-2 border text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-gray-100">
                    <td className="p-2 border">{user.email}</td>
                    <td className="p-2 border">{user.name || user.username || "-"}</td>
                    <td className="p-2 border capitalize">{user.subscription || "free"}</td>
                    <td className="p-2 border">
                      <select
                        value={user.subscription || "free"}
                        onChange={e => handleTierChange(user.uid, e.target.value)}
                        className="border-gray-300 px-2 py-1 rounded"
                      >
                        {SUBSCRIPTION_TIERS.map(tier => (
                          <option value={tier} key={tier}>{tier.charAt(0).toUpperCase() + tier.slice(1)}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
                {displayedUsers.length === 0 && (
                  <tr>
                    <td className="p-2 border text-center" colSpan={4}>
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;

"use client";

import { useState, useEffect } from "react";
import { createUser, updateUser, deleteUser } from "@/app/api/user/actions";
import SearchBar from "@/components/search";

interface User {
  id: number;
  nama_user: string;
  username: string;
  user_priv: string;
  alamat: string;
  hp: string;
  status: string;
  password: string;
}

export default function UserPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const fetchUsers = async () => {
    try {
      const res = await fetch(`/api/user?search=${encodeURIComponent(search)}`);
      if (!res.ok) {
        const errorText = await res.text();
        setError(errorText || "Failed to fetch users");
        return;
      }

      const data = await res.json();
      setUsers(data);
    } catch (error) {
      setError(error?.message || "An unexpected error occurred");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const handleEdit = (user: User) => {
    setIsEditing(true);
    setEditUser(user);
    setIsModalOpen(true);
    setPassword(""); // Reset password state saat edit
    setConfirmPassword("");
    setPasswordError("");
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteUser(id);
      fetchUsers();
    } catch (error) {
      setError(error?.message || "An error occurred while deleting.");
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi password
    if (password !== confirmPassword) {
      setPasswordError("Password dan Confirmation Password tidak cocok.");
      return;
    } else {
      setPasswordError("");
    }

    const formData = new FormData(e.target as HTMLFormElement);
    formData.set("password", password);

    try {
      if (isEditing && editUser) {
        await updateUser(formData, editUser.id);
      } else {
        await createUser(formData);
      }

      fetchUsers();
      setIsModalOpen(false);
      setIsEditing(false);
      setEditUser(null);
      setPassword("");
      setConfirmPassword("");
      setPasswordError("");
      setError("");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    }
  };

  const handleAddNew = () => {
    setIsEditing(false);
    setEditUser(null);
    setIsModalOpen(true);
  };

  return (
    <div className="">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <SearchBar
        search={search}
        setSearch={setSearch}
        onAddNew={handleAddNew}
      />

      <table className="w-full border-collapse border border-gray-200 mt-6">
        <thead>
          <tr>
            <th className="border p-2">NO</th>
            <th className="border p-2">Nama User</th>
            <th className="border p-2">Username</th>
            <th className="border p-2">Privilege</th>
            <th className="border p-2">Alamat</th>
            <th className="border p-2">HP</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, index) => (
            <tr key={user.id}>
              <td className="border p-2 text-center">{index + 1}</td>
              <td className="border p-2 w-1/6">{user.nama_user}</td>
              <td className="border p-2 w-1/6">{user.username}</td>
              <td className="border p-2 w-1/6 text-center">{user.user_priv}</td>
              <td className="border p-2 w-1/6">{user.alamat}</td>
              <td className="border p-2 w-1/12 text-right">{user.hp}</td>
              <td className="border p-2 w-1/6 text-center">{user.status}</td>
              <td className="flex flex-row border gap-3 p-3">
                <button
                  onClick={() => handleEdit(user)}
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(user.id)}
                  className="w-full bg-red-500 text-white px-4 py-2 rounded"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg ">
            <h2 className="text-xl font-bold mb-4">
              {isEditing ? "Edit User" : "Add New User"}
            </h2>
            <form
              onSubmit={handleFormSubmit}
              className="w-full sm:min-w-[400px] grid grid-cols-2 gap-3"
            >
              <div className="grid col-span-1 w-full min-w-sm ">
                <div className=" w-full min-w-sm items-center">
                  <label className="block text-base font-medium text-gray-700">
                    Nama User
                  </label>
                  <input
                    type="text"
                    name="nama_user"
                    placeholder="Nama User"
                    className="border p-2 rounded w-full mt-2"
                    defaultValue={isEditing ? editUser?.nama_user : ""}
                  />
                </div>
                <div className=" w-full min-w-sm items-center gap-2">
                  <label className="block text-base font-medium text-gray-700">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    className="border p-2 rounded w-full mt-2"
                    defaultValue={isEditing ? editUser?.username : ""}
                  />
                </div>
                {error && (
                  <div className=" grid-cols-2">
                    <div className=" "> </div>
                    <div className=" text-red-500 grid col-span-1 ">
                      {error}
                    </div>
                  </div>
                )}
                <div className=" w-full min-w-sm items-center">
                  <label className="block text-base font-medium text-gray-700">
                    No. HP
                  </label>
                  <input
                    type="text"
                    name="hp"
                    placeholder="No. HP"
                    className="border p-2 rounded w-full mt-2"
                    defaultValue={isEditing ? editUser?.hp : ""}
                  />
                </div>
              </div>

              <div className="grid col-span-1 grid-cols-1 w-full min-w-sm">
                <div className=" grid col-span-1 w-full min-w-sm items-center">
                  <label className="block text-base font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Password"
                    className="border p-2 rounded w-full mt-2"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="grid col-span-1 w-full min-w-sm items-center">
                  <label className="block text-base font-medium text-gray-700">
                    Confirmation Password
                  </label>
                  <input
                    type="password"
                    placeholder="Confirmation Password"
                    className="border p-2 rounded w-full mt-2"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                {passwordError && (
                  <div className="grid col-span-1 grid-cols-2">
                    <div className=" "> </div>
                    <div className="col-span-2 text-red-500">
                      {passwordError}
                    </div>
                  </div>
                )}
                <div className="grid col-span-1 w-full min-w-sm items-center">
                  <label className="block text-base font-medium text-gray-700">
                    Status
                  </label>
                  <input
                    type="text"
                    name="status"
                    placeholder="Status"
                    className="border p-2 rounded w-full mt-2"
                    defaultValue={isEditing ? editUser?.status : ""}
                  />
                </div>
              </div>

              <div className="grid col-span-2 w-full min-w-sm items-center">
                <label className="block text-base font-medium text-gray-700">
                  User Privilage
                </label>
                <select
                  name="user_priv"
                  className="border p-2 rounded w-full mt-2"
                  defaultValue={isEditing ? editUser?.user_priv : "PETUGAS"}
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="PETUGAS">PETUGAS</option>
                </select>
              </div>
              <div className="grid col-span-2 w-full min-w-sm items-center">
                <label className="block text-base font-medium text-gray-700">
                  Alamat
                </label>
                <textarea
                  name="alamat"
                  placeholder="Alamat"
                  className="border p-2 rounded w-full mt-2"
                  defaultValue={isEditing ? editUser?.alamat : ""}
                />
              </div>

              <button
                type="submit"
                className="bg-green-500 text-white px-4 py-2 rounded mt-3"
              >
                {isEditing ? "Update" : "Add"}
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-300 text-black px-4 py-2 rounded mt-3 ml-2"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

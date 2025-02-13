"use client";

import { useState, useEffect } from "react";
import { createUser, updateUser, deleteUser } from "@/app/api/user/actions";
import SearchBar from "@/components/search";
import toast from "react-hot-toast";
import { Pencil, Plus, Trash2 } from "lucide-react";

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

interface FormData {
  nama_user: string;
  username: string;
  user_priv: string;
  alamat: string;
  hp: string;
  status: string;
}

interface PaginationData {
  users: User[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}
export default function UserPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);

  const [formData, setFormData] = useState<FormData>({
    nama_user: "",
    username: "",
    user_priv: "PETUGAS",
    alamat: "",
    hp: "",
    status: "",
  });

  const fetchUsers = async () => {
    try {
      const res = await fetch(
        `/api/user?search=${encodeURIComponent(
          search
        )}&page=${currentPage}&limit=${itemsPerPage}`
      );

      if (!res.ok) {
        const errorText = await res.text();
        setError(errorText || "Failed to fetch users");
        return;
      }

      const data: PaginationData = await res.json();
      setUsers(data.users);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, currentPage, itemsPerPage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleItemsPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newLimit = parseInt(e.target.value);
    setItemsPerPage(newLimit);
    setCurrentPage(1);
  };

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(startIndex + itemsPerPage - 1, totalCount);

  const handleEdit = (user: User) => {
    setIsEditing(true);
    setEditUser(user);
    setFormData({
      nama_user: user.nama_user,
      username: user.username,
      user_priv: user.user_priv,
      alamat: user.alamat,
      hp: user.hp,
      status: user.status,
    });
    setIsModalOpen(true);
    setPassword("");
    setConfirmPassword("");
    setPasswordError("");
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const openConfirmModal = (id: number) => {
    setUserToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (userToDelete === null) return;

    try {
      await deleteUser(userToDelete);
      fetchUsers();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Terjadi kesalahan saat menghapus data");
      }
    } finally {
      setIsConfirmOpen(false);
      setUserToDelete(null);
      toast.success("Data berhasil dihapus");
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setPasswordError("Password dan Confirmation Password tidak cocok.");
      return;
    } else {
      setPasswordError("");
    }

    const submitFormData = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      submitFormData.append(key, value);
    });
    submitFormData.set("password", password);

    try {
      if (isEditing && editUser) {
        await updateUser(submitFormData, editUser.id);
        toast.success("Data berhasil diperbarui");
      } else {
        await createUser(submitFormData);
        toast.success("Data berhasil ditambahkan");
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
      toast.error(err.message);
    }
  };

  const handleAddNew = () => {
    setIsEditing(false);
    setEditUser(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>

      <div className="flex flex-row gap-5 items-center text-center mb-3">
        <div className="flex items-center gap-4">
          <span className="text-gray-600">Show</span>
          <select
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            className="border rounded px-2 py-1 focus:outline-none focus:ring focus:ring-green-300"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
          <span className="text-gray-600">entries</span>
        </div>

        <SearchBar search={search} setSearch={setSearch} />

        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 bg-green-500 text-white px-3 my-1 py-1 rounded-lg hover:bg-green-600 transition"
        >
          <Plus size={20} />
          Add New
        </button>
      </div>

      <table className="w-full border-collapse border border-gray-200">
        <thead>
          <tr className="bg-gray-50">
            <th className="border p-2 text-left">Nama User</th>
            <th className="border p-2 text-left">Username</th>
            <th className="border p-2 text-center">Role</th>
            <th className="border p-2 text-left">Alamat</th>
            <th className="border p-2 text-left">HP</th>
            <th className="border p-2 text-center">Status</th>
            <th className="border p-2 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td className="border p-2">{user.nama_user}</td>
              <td className="border p-2">{user.username}</td>
              <td className="border p-2 text-center">
                <span className="bg-gray-600 text-white px-2 py-1 rounded text-sm">
                  {user.user_priv}
                </span>
              </td>
              <td className="border p-2 max-w-72">{user.alamat}</td>
              <td className="border p-2">{user.hp}</td>
              <td className="border p-2 text-center">{user.status}</td>
              <td className="border p-2">
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => handleEdit(user)}
                    className="bg-blue-500 text-white px-3 py-1 rounded flex items-center gap-1"
                  >
                    <Pencil size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => openConfirmModal(user.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded flex items-center gap-1"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-between items-center mt-4">
        <div>
          Showing {totalCount > 0 ? startIndex : 0} to {endIndex} of{" "}
          {totalCount} entries
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 border rounded ${
              currentPage === 1 ? "bg-gray-100" : "hover:bg-gray-100"
            }`}
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1 border rounded ${
                currentPage === page
                  ? "bg-blue-500 text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 border rounded ${
              currentPage === totalPages ? "bg-gray-100" : "hover:bg-gray-100"
            }`}
          >
            Next
          </button>
        </div>
      </div>

      {/* Modal Create/Update*/}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">
              {isEditing ? "Edit User" : "Add New User"}
            </h2>
            <form
              onSubmit={handleFormSubmit}
              className="w-full sm:min-w-[400px] grid grid-cols-2 gap-3"
            >
              <div className="grid col-span-1 w-full min-w-sm">
                <div className="w-full min-w-sm items-center">
                  <label className="block text-base font-medium text-gray-700">
                    Nama User
                  </label>
                  <input
                    type="text"
                    name="nama_user"
                    placeholder="Nama User"
                    className="border p-2 rounded w-full mt-2"
                    value={formData.nama_user}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="w-full min-w-sm items-center gap-2">
                  <label className="block text-base font-medium text-gray-700">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    className="border p-2 rounded w-full mt-2"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="w-full min-w-sm items-center">
                  <label className="block text-base font-medium text-gray-700">
                    No. HP
                  </label>
                  <input
                    type="text"
                    name="hp"
                    placeholder="No. HP"
                    className="border p-2 rounded w-full mt-2"
                    value={formData.hp}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="grid col-span-1 grid-cols-1 w-full min-w-sm">
                <div className="grid col-span-1 w-full min-w-sm items-center">
                  <label className="block text-base font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Password"
                    className="border p-2 rounded w-full mt-2"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
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
                    required
                  />
                </div>
                {passwordError && (
                  <div className="grid col-span-1 grid-cols-2">
                    <div className=""></div>
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
                    value={formData.status}
                    onChange={handleInputChange}
                    required
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
                  value={formData.user_priv}
                  onChange={handleInputChange}
                  required
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
                  value={formData.alamat}
                  onChange={handleInputChange}
                  required
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
                onClick={handleModalClose}
                className="bg-gray-300 text-black px-4 py-2 rounded mt-3 ml-2"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Delete*/}
      {isConfirmOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <p className="text-lg font-medium mb-4">
              Apakah Anda yakin ingin menghapus data ini?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={confirmDelete}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Hapus
              </button>
              <button
                onClick={() => setIsConfirmOpen(false)}
                className="bg-gray-300 text-black px-4 py-2 rounded"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

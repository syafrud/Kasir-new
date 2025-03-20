"use client";

import { useState, useEffect } from "react";
import SearchBar from "@/components/search";
import toast from "react-hot-toast";
import { Pencil, Plus, Trash2, Tag } from "lucide-react";
import { format } from "date-fns";
import EventProductsModal from "@/components/EventProductsModal";

interface Event {
  id: number;
  nama_event: string;
  deskripsi: string | null;
  tanggal_mulai: Date;
  tanggal_selesai: Date;
}

interface PaginationData {
  events: Event[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export default function EventPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [events, setEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nama_event: "",
    deskripsi: "",
    tanggal_mulai: "",
    tanggal_selesai: "",
  });

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<number | null>(null);
  const [isProductsModalOpen, setIsProductsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const fetchEvents = async () => {
    try {
      const res = await fetch(
        `/api/event?search=${encodeURIComponent(
          search
        )}&page=${currentPage}&limit=${itemsPerPage}`
      );

      if (!res.ok) {
        const errorText = await res.text();
        setError(errorText || "Failed to fetch events");
        return;
      }

      const data: PaginationData = await res.json();
      setEvents(data.events);
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
    fetchEvents();
  }, [search, currentPage, itemsPerPage]);

  const handleEdit = (event: Event) => {
    setIsEditing(true);
    setEditEvent(event);
    setFormData({
      nama_event: event.nama_event,
      deskripsi: event.deskripsi || "",
      tanggal_mulai: new Date(event.tanggal_mulai).toISOString().split("T")[0],
      tanggal_selesai: new Date(event.tanggal_selesai)
        .toISOString()
        .split("T")[0],
    });
    setIsModalOpen(true);
  };

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

  const openConfirmModal = (id: number) => {
    setEventToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (eventToDelete === null) return;

    try {
      const res = await fetch(`/api/event/${eventToDelete}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to delete event");
      }

      fetchEvents();
      toast.success("Event berhasil dihapus");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
        toast.error(error.message);
      } else {
        setError("An error occurred while deleting.");
        toast.error("An error occurred while deleting.");
      }
    } finally {
      setIsConfirmOpen(false);
      setEventToDelete(null);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEditing && editEvent) {
        const res = await fetch(`/api/event/${editEvent.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText || "Failed to update event");
        }

        toast.success("Event berhasil diperbarui");
      } else {
        const res = await fetch("/api/event", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText || "Failed to create event");
        }

        toast.success("Event berhasil ditambahkan");
      }

      fetchEvents();
      setIsModalOpen(false);
      setIsEditing(false);
      setEditEvent(null);
      setFormData({
        nama_event: "",
        deskripsi: "",
        tanggal_mulai: "",
        tanggal_selesai: "",
      });
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      toast.error(err.message);
    }
  };

  const handleAddNew = () => {
    setIsEditing(false);
    setEditEvent(null);
    setFormData({
      nama_event: "",
      deskripsi: "",
      tanggal_mulai: "",
      tanggal_selesai: "",
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleManageProducts = (event: Event) => {
    setSelectedEvent(event);
    setIsProductsModalOpen(true);
  };

  return (
    <div className="">
      <h1 className="text-2xl font-bold mb-4">Event</h1>

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
          className="flex items-center gap-2 bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition h-8"
        >
          <Plus size={20} />
        </button>
      </div>

      <table className="w-full border-collapse border border-gray-200 mt-6">
        <thead>
          <tr className="text-center">
            <th className="border p-2 max-w-min">NO</th>
            <th className="border p-2 w-1/6">Nama Event</th>
            <th className="border p-2 w-2/6">Deskripsi</th>
            <th className="border p-2 w-1/6">Tanggal Mulai</th>
            <th className="border p-2 w-1/6">Tanggal Selesai</th>
            <th className="border py-2 px-16 w-52">Actions</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event, index) => (
            <tr key={event.id}>
              <td className="border p-2">{startIndex + index}</td>
              <td className="border p-2">{event.nama_event}</td>
              <td className="border p-2">{event.deskripsi || "-"}</td>
              <td className="border p-2">
                {format(new Date(event.tanggal_mulai), "dd/MM/yyyy")}
              </td>
              <td className="border p-2">
                {format(new Date(event.tanggal_selesai), "dd/MM/yyyy")}
              </td>
              <td className="border p-3 text-center">
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => handleManageProducts(event)}
                    className="bg-purple-500 text-white px-3 py-1 rounded flex items-center gap-1"
                    title="Manage Products"
                  >
                    <Tag size={16} />
                    Products
                  </button>
                  <button
                    onClick={() => handleEdit(event)}
                    className="bg-blue-500 text-white px-3 py-1 rounded flex items-center gap-1"
                  >
                    <Pencil size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => openConfirmModal(event.id)}
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
              // Fix the "Next" button styling that got cut off
              currentPage === totalPages ? "bg-gray-100" : "hover:bg-gray-100"
            }`}
          >
            Next
          </button>
        </div>
      </div>

      {/* Add or Edit Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
            <h2 className="text-xl font-bold mb-4">
              {isEditing ? "Edit Event" : "Add New Event"}
            </h2>
            <form onSubmit={handleFormSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Nama Event</label>
                <input
                  type="text"
                  name="nama_event"
                  value={formData.nama_event}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Deskripsi</label>
                <textarea
                  name="deskripsi"
                  value={formData.deskripsi}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  rows={3}
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  name="tanggal_mulai"
                  value={formData.tanggal_mulai}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Tanggal Selesai
                </label>
                <input
                  type="date"
                  name="tanggal_selesai"
                  value={formData.tanggal_selesai}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  {isEditing ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete */}
      {isConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p className="mb-6">Are you sure you want to delete this event?</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsConfirmOpen(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products Modal */}
      {isProductsModalOpen && selectedEvent && (
        <EventProductsModal
          eventId={selectedEvent.id}
          eventName={selectedEvent.nama_event}
          onClose={() => setIsProductsModalOpen(false)}
        />
      )}
    </div>
  );
}

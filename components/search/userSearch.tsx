// components/search/userSearch.tsx
import React, { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";

interface User {
  id: number;
  username: string;
  nama_user?: string;
}

interface UserSearchProps {
  onSelect: (user: User) => void;
  selectedId?: string;
}

const UserSearch: React.FC<UserSearchProps> = ({ onSelect, selectedId }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedId) {
      const fetchUser = async () => {
        try {
          const response = await fetch(`/api/penjualan/users`);
          if (!response.ok) throw new Error("Failed to fetch users");
          const data = await response.json();
          const user = data.users.find(
            (u: User) => u.id.toString() === selectedId
          );
          if (user) {
            setSelectedUser(user);
            setSearchTerm(user.username);
          }
        } catch (error) {
          console.error("Error fetching user:", error);
        }
      };
      fetchUser();
    }
  }, [selectedId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearch = async (term: string) => {
    setSearchTerm(term);

    if (term.length < 2) {
      setUsers([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/penjualan/users?search=${term}`);
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data.users);
      setShowResults(true);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (user: User) => {
    setSelectedUser(user);
    setSearchTerm(user.username);
    setShowResults(false);
    onSelect(user);
  };

  return (
    <div ref={searchRef} className="relative">
      <label className="block text-gray-700 font-medium text-sm mb-1">
        Nama Petugas
      </label>
      <div className="relative">
        <input
          type="text"
          className="border rounded-lg p-2 w-full pl-10"
          placeholder="Cari petugas..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => searchTerm.length >= 2 && setShowResults(true)}
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
          <Search size={16} />
        </div>
      </div>

      {showResults && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
          {loading ? (
            <div className="p-2 text-center text-gray-500">Loading...</div>
          ) : users.length > 0 ? (
            users.map((user) => (
              <div
                key={user.id}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleSelect(user)}
              >
                {user.username} {user.nama_user && `(${user.nama_user})`}
              </div>
            ))
          ) : (
            <div className="p-2 text-center text-gray-500">No users found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserSearch;

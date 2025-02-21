"use client";

interface SearchBarProps {
  search: string;
  setSearch: (value: string) => void;
}

export default function SearchBar({ search, setSearch }: SearchBarProps) {
  return (
    <div className="flex flex-1 gap-2 flex-row items-center">
      <label htmlFor="search" className="text-gray-600">
        Search :
      </label>
      <input
        type="text"
        placeholder="Search username"
        className="border p-1 rounded flex-1"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </div>
  );
}

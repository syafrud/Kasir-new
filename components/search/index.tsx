"use client";

interface SearchBarProps {
  search: string;
  setSearch: (value: string) => void;
  onAddNew: () => void;
}

export default function SearchBar({
  search,
  setSearch,
  onAddNew,
}: SearchBarProps) {
  return (
    <div className="mb-4 flex gap-2">
      <input
        type="text"
        placeholder="Searchs users"
        className="border p-2 rounded w-full"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <button
        onClick={onAddNew}
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        Add New
      </button>
    </div>
  );
}

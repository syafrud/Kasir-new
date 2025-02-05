import React from "react";

interface SearchBarProps {
  search: string;
  setSearch: (value: string) => void;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  setDateRange: (range: { startDate: string; endDate: string }) => void;
  totalRange: {
    minTotal: string;
    maxTotal: string;
  };
  setTotalRange: (range: { minTotal: string; maxTotal: string }) => void;
  onAddNew: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  search,
  setSearch,
  dateRange,
  setDateRange,
  totalRange,
  setTotalRange,
  onAddNew,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-end">
        <div className="flex gap-4 ">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by staff name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <label className="block text-sm font-medium">Date Range</label>
          <div className="flex gap-2">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, startDate: e.target.value })
              }
              className="w-full p-2 border rounded"
            />
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, endDate: e.target.value })
              }
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <label className="block text-sm font-medium">Total Price Range</label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min total"
              value={totalRange.minTotal}
              onChange={(e) =>
                setTotalRange({ ...totalRange, minTotal: e.target.value })
              }
              className="w-full p-2 border rounded"
            />
            <input
              type="number"
              placeholder="Max total"
              value={totalRange.maxTotal}
              onChange={(e) =>
                setTotalRange({ ...totalRange, maxTotal: e.target.value })
              }
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        <button
          onClick={onAddNew}
          className="bg-green-500 text-white px-4 py-2 rounded h-3/4"
        >
          Add New
        </button>
      </div>
    </div>
  );
};

export default SearchBar;

import { Input } from "./ui/input";

interface SearchAndFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
}

function SearchAndFilters({
  search,
  onSearchChange,
  categories,
  selectedCategory,
  onCategoryChange,
}: SearchAndFiltersProps) {
  return (
    <div className="grid w-full gap-4 sm:grid-cols-2">
      <label className="flex flex-col gap-1 text-sm text-muted-foreground">
        <span className="uppercase tracking-widest">Search</span>
        <Input
          type="text"
          placeholder="e.g. MrBeast"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-muted-foreground">
        <span className="uppercase tracking-widest">Category</span>
        <select
          className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={selectedCategory}
          onChange={(event) => onCategoryChange(event.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export default SearchAndFilters;

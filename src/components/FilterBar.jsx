import React from 'react';

function FilterBar({ 
  onRegionChange, 
  onLanguageChange, 
  onSortChange, 
  regions, 
  languages, 
  selectedRegion = '', 
  selectedLanguage = '',
  selectedSort = '' 
}) {
  const sortOptions = [
    { value: 'name-asc', label: 'Name (A-Z)' },
    { value: 'name-desc', label: 'Name (Z-A)' },
    { value: 'population-desc', label: 'Population (High to Low)' },
    { value: 'population-asc', label: 'Population (Low to High)' },
    { value: 'area-desc', label: 'Area (Large to Small)' },
    { value: 'area-asc', label: 'Area (Small to Large)' }
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {/* Sorting dropdown */}
      <select
        className="p-2 border rounded shadow-sm text-sm flex-1 min-w-[120px]"
        onChange={(e) => onSortChange(e.target.value)}
        value={selectedSort}
      >
        <option value="">Sort Countries</option>
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {/* Filter options */}
      <select
        className="p-2 border rounded shadow-sm text-sm flex-1 min-w-[120px]"
        onChange={(e) => onRegionChange(e.target.value)}
        value={selectedRegion}
      >
        <option value="">Region</option>
        {regions.map((region) => (
          <option key={region} value={region}>
            {region}
          </option>
        ))}
      </select>

      <select
        className="p-2 border rounded shadow-sm text-sm flex-1 min-w-[120px]"
        onChange={(e) => onLanguageChange(e.target.value)}
        value={selectedLanguage}
      >
        <option value="">Language</option>
        {languages.map((language) => (
          <option key={language} value={language}>
            {language}
          </option>
        ))}
      </select>
    </div>
  );
}

export default FilterBar;

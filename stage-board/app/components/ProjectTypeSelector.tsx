// src/components/ProjectTypeSelector.tsx
import React, { useEffect, useState } from 'react';

interface ProjectTypeSelectorProps {
  selectedType: string;
  onChange: (projectType: string) => void;
  disabled?: boolean;
  className?: string;
}

interface ProjectTypeInfo {
  code: string;
  name: string;
  timeline: string;
  totalDays: number;
}

const ProjectTypeSelector: React.FC<ProjectTypeSelectorProps> = ({
  selectedType,
  onChange,
  disabled = false,
  className = ''
}) => {
  const [projectTypes, setProjectTypes] = useState<ProjectTypeInfo[]>([
    { code: '1BHK', name: '1 BHK', timeline: '16 days total', totalDays: 16 },
    { code: '2BHK', name: '2 BHK', timeline: '20 days total', totalDays: 20 },
    { code: '3BHK', name: '3 BHK', timeline: '23 days total', totalDays: 23 },
    { code: '4BHK', name: '4 BHK', timeline: '26 days total', totalDays: 26 },
    { code: '5BHK', name: '5 BHK', timeline: '31 days total', totalDays: 31 }
  ]);

  return (
    <div className={`relative ${className}`}>
      <select
        value={selectedType}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
      >
        {projectTypes.map((type) => (
          <option key={type.code} value={type.code}>
            {type.name}
          </option>
        ))}
      </select>
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
};

export default ProjectTypeSelector;
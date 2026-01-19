// src/api/projectApi.ts
export type ProjectType = {
  code: string;
  name: string;
  // Removed baseDays and multiplier
};

export const projectApi = {
  // Get all available project types
  getProjectTypes: async (): Promise<ProjectType[]> => {
    try {
      const response = await fetch('http://localhost:8080/api/project-types');
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching project types:', error);
      // Return default types if API fails
      return [
        { code: '1BHK', name: '1 BHK Apartment' },
        { code: '2BHK', name: '2 BHK Apartment' },
        { code: '3BHK', name: '3 BHK Apartment' },
        { code: '4BHK', name: '4 BHK Apartment' },
        { code: 'VILLA', name: 'Villa' },
        { code: 'PENTHOUSE', name: 'Penthouse' },
      ];
    }
  },
  
  // Get stage durations for a specific project type
  getStageDurations: async (projectType: string): Promise<Record<string, number>> => {
    try {
      const response = await fetch(`http://localhost:8080/api/project-types/${projectType}/stage-durations`);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching durations for ${projectType}:`, error);
      return {};
    }
  },
};
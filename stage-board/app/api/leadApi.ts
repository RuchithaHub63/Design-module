// src/api/leadApi.ts
const API_BASE_URL = "http://localhost:8080/api";

const convertToBackendId = (frontendId: string): string => {
  if (frontendId.startsWith('l')) {
    return frontendId.substring(1);
  }
  return frontendId;
};

const convertToFrontendId = (backendId: string | number): string => {
  const idStr = String(backendId);
  if (!idStr.startsWith('l')) {
    return `l${idStr}`;
  }
  return idStr;
};

export type Lead = { 
  id: string;
  backendId: number;
  name: string;
  note: string; // Regular note (latest non-rejection note)
  status: string;
  stageType: string;
  projectType: string;
  currentStageStartedAt?: string;
  currentStageDeadlineAt?: string;
  daysRemaining?: number;
  hoursRemaining?: number;
  overdue?: boolean;
  projectStartDate?: string;
  projectEndDate?: string;
  rejectedStageCount?: number;
  rejectionTimeExtensionDays?: number;
  originalProjectDurationDays?: number;
  extendedProjectDurationDays?: number;
  cumulativeDaysElapsed?: number;
  cumulativeDaysScheduled?: number;
  projectStatus?: string;
  rejectionImpact?: string;
  rejectedReason?: string; // Rejection reason (stored separately in DB)
  allNotes?: string[]; // All notes including rejection notes
  rejectionNotes?: string[]; // Just the rejection notes (starting with [REJECTED])
}

export const leadApi = {
  getLeads: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/leads`);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error('Error in getLeads:', error);
      throw error;
    }
  },

  moveLead: async (
    leadId: string,
    fromStage: string,
    toStage: string,
    note?: string
  ) => {
    const backendLeadId = convertToBackendId(leadId);
    const response = await fetch(`${API_BASE_URL}/move-lead`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        leadId: backendLeadId,
        fromStage, 
        toStage, 
        note: note || "" 
      }),
    });
    if (!response.ok) throw new Error(`Failed to move lead: ${response.status}`);
    return await response.json();
  },

  markLeadDone: async (
    leadId: string,
    fromStage: string,
    note?: string
  ) => {
    const backendLeadId = convertToBackendId(leadId);
    const response = await fetch(`${API_BASE_URL}/mark-done`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        leadId: backendLeadId,
        fromStage, 
        note: note || "" 
      }),
    });
    if (!response.ok) throw new Error(`Failed to mark lead as done: ${response.status}`);
    return await response.json();
  },

  // UPDATED: Add project type parameter (optional for backward compatibility)
  addNewLead: async (
    name: string,
    note?: string,
    projectType?: string
  ) => {
    const response = await fetch(`${API_BASE_URL}/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        name, 
        note: note || "", 
        projectType: projectType || "1BHK" 
      }),
    });
    if (!response.ok) throw new Error(`Failed to add lead: ${response.status}`);
    return await response.json();
  },

  updateLeadNote: async (
    leadId: string,
    note: string
  ) => {
    const backendLeadId = convertToBackendId(leadId);
    const response = await fetch(`${API_BASE_URL}/leads/${backendLeadId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });
    if (!response.ok) throw new Error(`Failed to update note: ${response.status}`);
    return await response.json();
  },

  rejectLead: async (
    leadId: string,
    note?: string,
    currentStage?: string
  ) => {
    const backendLeadId = convertToBackendId(leadId);
    const response = await fetch(`${API_BASE_URL}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        leadId: backendLeadId, 
        note: note || "",
        currentStage: currentStage || ""
      }),
    });
    if (!response.ok) throw new Error(`Failed to reject lead: ${response.status}`);
    return await response.json();
  },
};
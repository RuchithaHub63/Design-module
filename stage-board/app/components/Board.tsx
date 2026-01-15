"use client";
import React, { useState, useEffect } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import StageColumn from "./StageColumn";
import LeadCard from "./LeadCard";
import { ALL_STAGES } from "../config/stage";

type Lead = { 
  id: string; 
  name: string; 
  note?: string; 
  status?: string;
  backendId?: number;
  // Timeline fields from backend
  currentStageStartedAt?: string;
  currentStageDeadlineAt?: string;
  daysRemaining?: number;
  hoursRemaining?: number;
  overdue?: boolean;
  stageType?: string;
  projectStartDate?: string; 
  projectEndDate?: string;   
  rejectedStageCount?: number;
  // NEW FIELDS
  rejectionTimeExtensionDays?: number;
  originalProjectDurationDays?: number;
  extendedProjectDurationDays?: number;
  cumulativeDaysElapsed?: number;
  cumulativeDaysScheduled?: number;
  projectStatus?: string;
};
type LeadsMap = Record<string, Lead[]>;

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

// Helper function to get stage duration based on stage type - matches backend logic
const getStageDuration = (stageType: string): {duration: string, unit: 'hours' | 'days'} => {
  const stage = stageType.toUpperCase();
  
  // Hours display stages (from your backend)
  const HOURS_DISPLAY_STAGES = [
    'GROUP_DESCRIPTION_UPDATE',      // 12 hours
    'MAIL_LOOP_CHAIN_2_INITIATE',    // 12 hours
    'D1_FILES_UPLOAD',               // 24 hours = 1 day (but show as hours)
    'FIRST_CUT_DESIGN_QUOTATION',    // 24 hours = 1 day (but show as hours)
    'PAYMENT_10_PERCENT',            // 24 hours = 1 day (but show as hours)
    'DQC_1_APPROVAL',                // 24 hours = 1 day (but show as hours)
    'DQC_2_APPROVAL',                // 24 hours = 1 day (but show as hours)
    'D2_MASKING_REQUEST',            // 12 hours
    'D2_FILES_UPLOAD',               // 12 hours
    'FINAL_REVISED_FILES_READY',     // 12 hours
    'DQC_2_SUBMISSION',              // 12 hours
    'DESIGN_SIGN_OFF',               // 12 hours
    'PAYMENT_40_PERCENT',            // 12 hours
    'CX_APPROVAL_FOR_PRODUCTION',    // 8 hours
    'POC_MAIL',                      // 8 hours
    'TIMELINE_SUBMISSION'            // 8 hours
  ];
  
  // Days display stages (from your backend)
  const DAYS_DISPLAY_STAGES = [
    'D1_REQUEST_MAIL_TO_TEAM',       // 2 days = 48 hours
    'MATERIAL_SELECTION_MEETING',    // 2 days = 48 hours
    'DQC_1_SUBMISSION'               // 2 days = 48 hours
  ];
  
  // Check for hours display stages first
  if (HOURS_DISPLAY_STAGES.includes(stage)) {
    if (stage === 'GROUP_DESCRIPTION_UPDATE' || stage === 'MAIL_LOOP_CHAIN_2_INITIATE' ||
        stage === 'D2_MASKING_REQUEST' || stage === 'D2_FILES_UPLOAD' ||
        stage === 'FINAL_REVISED_FILES_READY' || stage === 'DQC_2_SUBMISSION' ||
        stage === 'DESIGN_SIGN_OFF' || stage === 'PAYMENT_40_PERCENT') {
      return {duration: '12', unit: 'hours'};
    } else if (stage === 'D1_FILES_UPLOAD' || stage === 'FIRST_CUT_DESIGN_QUOTATION' ||
               stage === 'PAYMENT_10_PERCENT' || stage === 'DQC_1_APPROVAL' || 
               stage === 'DQC_2_APPROVAL') {
      return {duration: '24', unit: 'hours'}; // These are 1 day but shown as 24 hours
    } else if (stage === 'CX_APPROVAL_FOR_PRODUCTION' || stage === 'POC_MAIL' || 
               stage === 'TIMELINE_SUBMISSION') {
      return {duration: '8', unit: 'hours'};
    } else {
      return {duration: '12', unit: 'hours'}; // Default for hours stages
    }
  } 
  // Then check for days display stages
  else if (DAYS_DISPLAY_STAGES.includes(stage)) {
    return {duration: '2', unit: 'days'}; // All days stages are 2 days
  }
  
  // Default for unknown stages
  return {duration: 'Not specified', unit: 'days'};
};

const api = {
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

  addNewLead: async (
    name: string,
    note?: string
  ) => {
    const response = await fetch(`${API_BASE_URL}/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, note: note || "" }),
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

const organizeLeadsByStage = (backendLeads: any[]): LeadsMap => {
  const leadsMap: LeadsMap = {};
  
  // Initialize all stages with empty arrays
  ALL_STAGES.forEach(stage => {
    leadsMap[stage] = [];
  });
  
  if (!Array.isArray(backendLeads) || backendLeads.length === 0) {
    return leadsMap;
  }
  
  backendLeads.forEach((lead) => {
    if (!lead || !lead.id) return;
    
    const frontendId = convertToFrontendId(lead.id);
    const leadName = lead.name || `Lead ${lead.id}`;
    
    let leadNote = "";
    if (lead.notes && Array.isArray(lead.notes) && lead.notes.length > 0) {
      leadNote = lead.notes[lead.notes.length - 1];
    }
    
    const leadStage = lead.stageType || lead.stage || lead.status || "GROUP_DESCRIPTION_UPDATE";
    const stageKey = leadStage.toUpperCase();
    
    const leadObj: Lead = {
      id: frontendId,
      backendId: lead.id,
      name: leadName,
      note: leadNote,
      status: stageKey,
      stageType: leadStage,
      currentStageStartedAt: lead.currentStageStartedAt,
      currentStageDeadlineAt: lead.currentStageDeadlineAt,
      daysRemaining: lead.daysRemaining,
      hoursRemaining: lead.hoursRemaining,
      overdue: lead.overdue,
      projectStartDate: lead.projectStartDate, 
      projectEndDate: lead.projectEndDate,     
      rejectedStageCount: lead.rejectedStageCount || 0,
      rejectionTimeExtensionDays: lead.rejectionTimeExtensionDays || 0,
      originalProjectDurationDays: lead.originalProjectDurationDays,
      extendedProjectDurationDays: lead.extendedProjectDurationDays,
      cumulativeDaysElapsed: lead.cumulativeDaysElapsed,
      cumulativeDaysScheduled: lead.cumulativeDaysScheduled,
      projectStatus: lead.projectStatus
    };
    
    // SAFEST APPROACH: Use spread operator instead of .push()
    if (leadsMap[stageKey]) {
      leadsMap[stageKey] = [...leadsMap[stageKey], leadObj];
    } else {
      // If stage doesn't exist, use GROUP_DESCRIPTION_UPDATE
      const defaultStage = "GROUP_DESCRIPTION_UPDATE";
      if (leadsMap[defaultStage]) {
        leadsMap[defaultStage] = [...leadsMap[defaultStage], leadObj];
      } else {
        // If default stage doesn't exist, initialize it
        leadsMap[defaultStage] = [leadObj];
      }
    }
  });
  
  return leadsMap;
};

export default function Board() {
  const [leads, setLeads] = useState<LeadsMap>({});
  const [loading, setLoading] = useState(false);
  const [dragInProgress, setDragInProgress] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const [newName, setNewName] = useState("");
  const [newNote, setNewNote] = useState("");
  const [leadToReject, setLeadToReject] = useState<{stage: string, index: number} | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [hiddenStages, setHiddenStages] = useState<Set<string>>(new Set());

  const windowSize = 4;
  const STATIC_STAGE = "GROUP_DESCRIPTION_UPDATE";
  const normalizedAll = ALL_STAGES.map((s) => s.trim());
  const LAST_STAGE_INDEX = normalizedAll.length - 1;

  const stagesToShow = normalizedAll.filter(
    (s) => s !== "FIRST_CUT_DESIGN_QUOTATION" || unlocked
  );

  const visiblePipelineStages = stagesToShow.filter(
    (s) => s === STATIC_STAGE || !hiddenStages.has(s)
  );

  const scrollableStages = visiblePipelineStages.filter((s) => s !== STATIC_STAGE);

  const formatStageName = (s: string) =>
    s.replace(/_/g, " ")
      .toLowerCase()
      .split(" ")
      .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ""))
      .join(" ");

  // Initialize leads with empty arrays for all stages on mount
  useEffect(() => {
    const initialLeads: LeadsMap = {};
    ALL_STAGES.forEach(stage => {
      initialLeads[stage] = [];
    });
    setLeads(initialLeads);
  }, []);

  // Fetch leads from database
  const fetchLeads = async () => {
    setLoading(true);
    try {
      const leadsData = await api.getLeads();
      const leadsArray = Array.isArray(leadsData) ? leadsData : [];
      const leadsMap = organizeLeadsByStage(leadsArray);
      
      if (leadsMap["FIRST_CUT_DESIGN_QUOTATION"] && leadsMap["FIRST_CUT_DESIGN_QUOTATION"].length > 0) {
        setUnlocked(true);
      } else {
        setUnlocked(false);
      }
      
      setLeads(leadsMap);
    } catch (error: any) {
      console.error('Error loading leads:', error);
      // Initialize with empty arrays for all stages on error
      const emptyLeads: LeadsMap = {};
      ALL_STAGES.forEach(stage => { 
        emptyLeads[stage] = []; 
      });
      setLeads(emptyLeads);
      
      // Show user-friendly error
      if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed')) {
        alert('Cannot connect to server. Please check if backend is running at http://localhost:8080');
      } else {
        alert(`Error loading leads: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Load leads on component mount
  useEffect(() => {
    fetchLeads();
    const intervalId = setInterval(fetchLeads, 60000);
    return () => clearInterval(intervalId);
  }, []);

  // Add new lead
  async function addLead() {
    if (!newName.trim() || loading) return;
    setLoading(true);
    try {
      const lead = await api.addNewLead(newName.trim(), newNote.trim());
      const frontendId = convertToFrontendId(lead.id);
      const newLead: Lead = {
        id: frontendId,
        backendId: lead.id,
        name: lead.name || newName.trim(),
        note: lead.note || newNote.trim(),
        status: STATIC_STAGE,
        stageType: STATIC_STAGE
      };
      setLeads((prev) => {
        const next = { ...prev };
        if (!next[STATIC_STAGE]) next[STATIC_STAGE] = [];
        next[STATIC_STAGE] = [newLead, ...next[STATIC_STAGE]];
        return next;
      });
      setNewName("");
      setNewNote("");
    } catch (error: any) {
      alert(`Failed to add lead: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Update lead note - FIXED with safe array access
  async function updateLeadNote(stage: string, index: number, note: string) {
    const currentItems = Array.from(leads[stage] ?? []);
    const lead = currentItems[index];
    if (!lead) return;

    const originalNote = lead.note || "";
    setLeads((prev) => {
      const next = { ...prev };
      const items = Array.from(next[stage] ?? []);
      if (!items[index]) return prev;
      items[index] = { ...items[index], note };
      next[stage] = items;
      return next;
    });

    try {
      await api.updateLeadNote(lead.id, note);
    } catch (error: any) {
      setLeads((prev) => {
        const next = { ...prev };
        const items = Array.from(next[stage] ?? []);
        if (!items[index]) return prev;
        items[index] = { ...items[index], note: originalNote };
        next[stage] = items;
        return next;
      });
      alert(`Failed to save note: ${error.message}`);
    }
  }

  // Mark lead as done - FIXED with safe array access
  async function handleMarkLeadDone(stage: string, index: number) {
    if (loading) return;
    const currentItems = Array.from(leads[stage] ?? []);
    const lead = currentItems[index];
    if (!lead) return;

    const stageIdx = normalizedAll.indexOf(stage);
    if (stageIdx === LAST_STAGE_INDEX) {
      setLoading(true);
      try {
        await api.markLeadDone(lead.id, stage, lead.note);
        setLeads((prev) => {
          const next = { ...prev };
          const items = Array.from(next[stage] ?? []);
          items.splice(index, 1);
          next[stage] = items;
          return next;
        });
      } catch (error: any) {
        alert(`Failed to complete lead: ${error.message}`);
      } finally {
        setLoading(false);
      }
      return;
    }

    const nextStage = normalizedAll[stageIdx + 1];
    setLoading(true);
    try {
      await api.markLeadDone(lead.id, stage, lead.note);
      setLeads((prev) => {
        const next = { ...prev };
        const items = Array.from(next[stage] ?? []);
        items.splice(index, 1);
        next[stage] = items;
        if (!next[nextStage]) next[nextStage] = [];
        next[nextStage] = [...next[nextStage], { 
          ...lead, 
          status: nextStage,
          stageType: nextStage
        }];
        if (nextStage === "FIRST_CUT_DESIGN_QUOTATION") setUnlocked(true);
        return next;
      });
    } catch (error: any) {
      alert(`Failed to move lead: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Handle reject lead - FIXED with safe array access
  async function handleRejectLead(stage: string, index: number) {
    const currentItems = Array.from(leads[stage] ?? []);
    const lead = currentItems[index];
    if (!lead) return;
    setLeadToReject({ stage, index });
    setRejectNote("");
  }

  // Confirm reject lead
  async function confirmRejectLead() {
    if (!leadToReject || loading) return;
    const { stage, index } = leadToReject;
    const currentItems = Array.from(leads[stage] ?? []);
    const lead = currentItems[index];
    if (!lead) return;

    setLoading(true);
    try {
      const note = rejectNote ? `Rejection reason: ${rejectNote}` : "Lead rejected";
      await api.rejectLead(lead.id, note, stage);
      await fetchLeads(); // Refresh to get updated project end date with penalty
    } catch (error: any) {
      alert(`Failed to reject lead: ${error.message}`);
      await fetchLeads();
    } finally {
      setLoading(false);
      setLeadToReject(null);
      setRejectNote("");
    }
  }

  function cancelReject() {
    setLeadToReject(null);
    setRejectNote("");
  }

  // Drag and drop handler - FIXED with safe array access
  async function onDragEnd(result: DropResult) {
    const { source, destination } = result;
    if (!destination) {
      setDragInProgress(false);
      return;
    }

    const src = source.droppableId;
    const dst = destination.droppableId;

    if (src === dst) {
      const items = Array.from(leads[src] ?? []);
      const [moved] = items.splice(source.index, 1);
      items.splice(destination.index, 0, moved);
      setLeads({ ...leads, [src]: items });
      setDragInProgress(false);
      return;
    }

    const srcItems = Array.from(leads[src] ?? []);
    const [moved] = srcItems.splice(source.index, 1);
    if (!moved) {
      setDragInProgress(false);
      return;
    }

    const dstItems = Array.from(leads[dst] ?? []);
    const movedUpdated = { 
      ...moved, 
      status: dst,
      stageType: dst
    };
    dstItems.splice(destination.index, 0, movedUpdated);
    const updatedLeads = { ...leads, [src]: srcItems, [dst]: dstItems };
    setLeads(updatedLeads);
    setDragInProgress(false);

    setLoading(true);
    try {
      await api.moveLead(moved.id, src, dst, moved.note);
      if (dst === "FIRST_CUT_DESIGN_QUOTATION") setUnlocked(true);
    } catch (error: any) {
      await fetchLeads();
      alert(`Failed to move lead: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  function onDragStart() {
    setDragInProgress(true);
  }

  const allNonStatic = normalizedAll.filter((s) => s !== STATIC_STAGE);
  const currentFirstVisibleStage = scrollableStages[startIndex] ?? scrollableStages[0] ?? allNonStatic[0];
  const currentFirstIndexInAll = allNonStatic.indexOf(currentFirstVisibleStage);
  const canPrev = currentFirstIndexInAll > 0;
  const canNext = startIndex + (windowSize - 1) < scrollableStages.length;

  const isInteractionDisabled = loading || dragInProgress;

  return (
    <>
      {loading && (
        <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-sm">Processing...</p>
          </div>
        </div>
      )}
      
      {leadToReject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Confirm Reject Lead</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to reject this lead? The lead will be moved to a previous stage and 
              <span className="font-bold text-red-600"> the time needed to re-do that stage will be added to the project timeline</span>.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rejection Reason (Optional)
              </label>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Enter reason for rejection..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelReject}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={confirmRejectLead}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                disabled={loading}
              >
                {loading ? "Processing..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex gap-4 mb-4 items-center">
        <div className="flex gap-2 items-center">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Lead name"
            className="px-3 py-2 border rounded-md w-40 disabled:opacity-50"
            disabled={isInteractionDisabled}
            onKeyDown={(e) => e.key === 'Enter' && newName.trim() && addLead()}
          />
          <input
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Note (optional)"
            className="px-3 py-2 border rounded-md w-60 disabled:opacity-50"
            disabled={isInteractionDisabled}
            onKeyDown={(e) => e.key === 'Enter' && newName.trim() && addLead()}
          />
          <button 
            onClick={addLead} 
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={isInteractionDisabled || !newName.trim()}
          >
            Add Lead
          </button>
          <button 
            onClick={fetchLeads}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            disabled={loading}
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        <div className="ml-auto flex gap-2">
          <button
            disabled={!canPrev || isInteractionDisabled}
            onClick={() => setStartIndex(Math.max(0, startIndex - 1))}
            className={`px-4 py-2 rounded-md ${
              !canPrev || isInteractionDisabled 
                ? 'bg-gray-300 cursor-not-allowed opacity-50' 
                : 'bg-gray-200 hover:bg-gray-300 transition-colors'
            }`}
          >
            ◀
          </button>
          <button
            disabled={!canNext || isInteractionDisabled}
            onClick={() => setStartIndex(startIndex + 1)}
            className={`px-4 py-2 rounded-md ${
              !canNext || isInteractionDisabled 
                ? 'bg-gray-300 cursor-not-allowed opacity-50' 
                : 'bg-gray-200 hover:bg-gray-300 transition-colors'
            }`}
          >
            ▶
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd} onDragStart={onDragStart}>
        <div className="flex gap-6">
          <div className="sticky top-4 self-start">
            <Droppable key={STATIC_STAGE} droppableId={STATIC_STAGE}>
              {(provided, snapshot) => (
                <div 
                  ref={provided.innerRef} 
                  {...provided.droppableProps}
                  className={snapshot.isDraggingOver ? "bg-blue-50 rounded-lg p-1" : ""}
                >
                  <StageColumn 
                    title={formatStageName(STATIC_STAGE)} 
                    duration="12 hours" 
                    isStatic
                  >
                    {(leads[STATIC_STAGE] ?? []).map((lead, index) => (
                      <Draggable 
                        key={lead.id} 
                        draggableId={lead.id} 
                        index={index}
                        isDragDisabled={isInteractionDisabled}
                      >
                        {(provided, snapshot) => (
                          <div 
                            ref={provided.innerRef} 
                            {...provided.draggableProps} 
                            {...provided.dragHandleProps}
                            className={`mb-2 ${snapshot.isDragging ? 'opacity-50' : ''} ${isInteractionDisabled ? "opacity-60" : ""}`}
                          >
                            <LeadCard
                              leadId={lead.id}
                              leadName={lead.name}
                              leadNote={lead.note}
                              status={formatStageName(lead.status || STATIC_STAGE)}
                              onNoteChange={(n) => updateLeadNote(STATIC_STAGE, index, n)}
                              onReject={() => handleRejectLead(STATIC_STAGE, index)}
                              disabled={isInteractionDisabled}
                              hoursRemaining={lead.hoursRemaining}
                              daysRemaining={undefined}
                              overdue={lead.overdue}
                              stageStartedAt={lead.currentStageStartedAt}
                              deadlineAt={lead.currentStageDeadlineAt}
                              allowedDuration="12 hours"
                              // Project timeline props
                              projectStartDate={lead.projectStartDate}
                              projectEndDate={lead.projectEndDate}
                              rejectedStageCount={lead.rejectedStageCount}
                              // NEW PROPS
                              rejectionTimeExtensionDays={lead.rejectionTimeExtensionDays}
                              originalProjectDurationDays={lead.originalProjectDurationDays}
                              extendedProjectDurationDays={lead.extendedProjectDurationDays}
                              cumulativeDaysElapsed={lead.cumulativeDaysElapsed}
                              cumulativeDaysScheduled={lead.cumulativeDaysScheduled}
                              projectStatus={lead.projectStatus}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </StageColumn>
                </div>
              )}
            </Droppable>
          </div>

          <div className="flex-1 overflow-x-auto py-2">
            <div className="flex gap-4 min-w-max">
              {scrollableStages.slice(startIndex, startIndex + windowSize - 1).map((stage) => {
                const stageDurationInfo = getStageDuration(stage);
                const stageDuration = `${stageDurationInfo.duration} ${stageDurationInfo.unit}`;
                const isHoursDisplay = stageDurationInfo.unit === 'hours';
                
                return (
                  <Droppable key={stage} droppableId={stage}>
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef} 
                        {...provided.droppableProps}
                        className={snapshot.isDraggingOver ? "bg-blue-50 rounded-lg p-1" : ""}
                      >
                        <StageColumn title={formatStageName(stage)} duration={stageDuration}>
                          {(leads[stage] ?? []).map((lead, index) => (
                            <Draggable 
                              key={lead.id} 
                              draggableId={lead.id} 
                              index={index}
                              isDragDisabled={isInteractionDisabled}
                            >
                              {(provided, snapshot) => (
                                <div 
                                  ref={provided.innerRef} 
                                  {...provided.draggableProps} 
                                  {...provided.dragHandleProps}
                                  className={`mb-2 ${snapshot.isDragging ? 'opacity-50' : ''} ${isInteractionDisabled ? "opacity-60" : ""}`}
                                >
                                  <LeadCard
                                    leadId={lead.id}
                                    leadName={lead.name}
                                    leadNote={lead.note}
                                    status={formatStageName(stage)}
                                    onNoteChange={(n) => updateLeadNote(stage, index, n)}
                                    onReject={() => handleRejectLead(stage, index)}
                                    disabled={isInteractionDisabled}
                                    hoursRemaining={isHoursDisplay ? lead.hoursRemaining : undefined}
                                    daysRemaining={!isHoursDisplay ? lead.daysRemaining : undefined}
                                    overdue={lead.overdue}
                                    stageStartedAt={lead.currentStageStartedAt}
                                    deadlineAt={lead.currentStageDeadlineAt}
                                    allowedDuration={stageDuration}
                                    // Project timeline props
                                    projectStartDate={lead.projectStartDate}
                                    projectEndDate={lead.projectEndDate}
                                    rejectedStageCount={lead.rejectedStageCount}
                                    // NEW PROPS
                                    rejectionTimeExtensionDays={lead.rejectionTimeExtensionDays}
                                    originalProjectDurationDays={lead.originalProjectDurationDays}
                                    extendedProjectDurationDays={lead.extendedProjectDurationDays}
                                    cumulativeDaysElapsed={lead.cumulativeDaysElapsed}
                                    cumulativeDaysScheduled={lead.cumulativeDaysScheduled}
                                    projectStatus={lead.projectStatus}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </StageColumn>
                      </div>
                    )}
                  </Droppable>
                );
              })}
            </div>
          </div>
        </div>
      </DragDropContext>
    </>
  );
}
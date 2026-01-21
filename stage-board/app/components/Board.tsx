"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from 'next/dynamic';

// Dynamically import drag & drop components with no SSR
const DragDropContext = dynamic(
  () => import('@hello-pangea/dnd').then(mod => mod.DragDropContext),
  { ssr: false }
);

const Droppable = dynamic(
  () => import('@hello-pangea/dnd').then(mod => mod.Droppable),
  { ssr: false }
);

const Draggable = dynamic(
  () => import('@hello-pangea/dnd').then(mod => mod.Draggable),
  { ssr: false }
);

import StageColumn from "./StageColumn";
import LeadCard from "./LeadCard";
import ProjectTypeSelector from "./ProjectTypeSelector";
import { ALL_STAGES } from "../config/stage";
import { leadApi, Lead } from "../api/leadApi";

// Import DropResult type from the library
import type { DropResult } from '@hello-pangea/dnd';

type LeadsMap = Record<string, Lead[]>;

const convertToFrontendId = (backendId: string | number): string => {
  const idStr = String(backendId);
  if (!idStr.startsWith('l')) {
    return `l${idStr}`;
  }
  return idStr;
};

// Helper function to get stage duration based on stage type and project type
const getStageDuration = (stageType: string, projectType: string): {duration: string, unit: 'hours' | 'days'} => {
  const stage = stageType.toUpperCase();
  const project = projectType.toUpperCase();
  
  // Base durations for 1BHK (16 days total)
  const get1BHKDuration = (stage: string): {duration: string, unit: 'hours' | 'days'} => {
    switch(stage) {
      // 12 hours stages
      case 'GROUP_DESCRIPTION_UPDATE':
      case 'MAIL_LOOP_CHAIN_2_INITIATE':
      case 'D2_MASKING_REQUEST':
      case 'D2_FILES_UPLOAD':
      case 'FINAL_REVISED_FILES_READY':
      case 'DQC_2_SUBMISSION':
      case 'DESIGN_SIGN_OFF':
      case 'PAYMENT_40_PERCENT':
        return {duration: '12', unit: 'hours'};
      
      // 24 hours (1 day) stages
      case 'D1_FILES_UPLOAD':
      case 'FIRST_CUT_DESIGN_QUOTATION':
      case 'PAYMENT_10_PERCENT':
      case 'DQC_1_APPROVAL':
      case 'DQC_2_APPROVAL':
        return {duration: '24', unit: 'hours'};
      
      // 8 hours stages
      case 'CX_APPROVAL_FOR_PRODUCTION':
      case 'POC_MAIL':
      case 'TIMELINE_SUBMISSION':
        return {duration: '8', unit: 'hours'};
      
      // 2 days stages
      case 'D1_REQUEST_MAIL_TO_TEAM':
      case 'MATERIAL_SELECTION_MEETING':
      case 'DQC_1_SUBMISSION':
        return {duration: '2', unit: 'days'};
      
      default:
        return {duration: '12', unit: 'hours'};
    }
  };

  // For 1BHK (16 days total)
  if (project === '1BHK') {
    return get1BHKDuration(stage);
  }
  
  // For 2BHK (20 days total)
  if (project === '2BHK') {
    switch(stage) {
      // Increased durations for 2BHK
      case 'MATERIAL_SELECTION_MEETING':
        return {duration: '3', unit: 'days'};
      case 'DQC_1_APPROVAL':
        return {duration: '2', unit: 'days'};
      default:
        return get1BHKDuration(stage);
    }
  }
  
  // For 3BHK (23 days total)
  if (project === '3BHK') {
    switch(stage) {
      case 'D1_REQUEST_MAIL_TO_TEAM':
        return {duration: '2', unit: 'days'};
      case 'D1_FILES_UPLOAD':
        return {duration: '2', unit: 'days'};
      case 'FIRST_CUT_DESIGN_QUOTATION':
        return {duration: '2', unit: 'days'};
      case 'MATERIAL_SELECTION_MEETING':
        return {duration: '4', unit: 'days'};
      case 'DQC_1_SUBMISSION':
        return {duration: '2', unit: 'days'};
      case 'DQC_1_APPROVAL':
        return {duration: '2', unit: 'days'};
      case 'FINAL_REVISED_FILES_READY':
        return {duration: '1', unit: 'day'};
      case 'DQC_2_SUBMISSION':
        return {duration: '1', unit: 'day'};
      case 'DQC_2_APPROVAL':
        return {duration: '2', unit: 'days'};
      default:
        return get1BHKDuration(stage);
    }
  }
  
  // For 4BHK (26 days total)
  if (project === '4BHK') {
    switch(stage) {
      case 'D1_REQUEST_MAIL_TO_TEAM':
        return {duration: '2', unit: 'days'};
      case 'D1_FILES_UPLOAD':
        return {duration: '3', unit: 'days'};
      case 'FIRST_CUT_DESIGN_QUOTATION':
        return {duration: '2', unit: 'days'};
      case 'MATERIAL_SELECTION_MEETING':
        return {duration: '5', unit: 'days'};
      case 'DQC_1_SUBMISSION':
        return {duration: '2', unit: 'days'};
      case 'DQC_1_APPROVAL':
        return {duration: '3', unit: 'days'};
      case 'FINAL_REVISED_FILES_READY':
        return {duration: '1', unit: 'day'};
      case 'DQC_2_SUBMISSION':
        return {duration: '1', unit: 'day'};
      case 'DQC_2_APPROVAL':
        return {duration: '2', unit: 'days'};
      default:
        return get1BHKDuration(stage);
    }
  }
  
  // For 5BHK (31 days total)
  if (project === '5BHK') {
    switch(stage) {
      case 'D1_REQUEST_MAIL_TO_TEAM':
        return {duration: '2', unit: 'days'};
      case 'D1_FILES_UPLOAD':
        return {duration: '4', unit: 'days'};
      case 'FIRST_CUT_DESIGN_QUOTATION':
        return {duration: '3', unit: 'days'};
      case 'MATERIAL_SELECTION_MEETING':
        return {duration: '5', unit: 'days'};
      case 'DQC_1_SUBMISSION':
        return {duration: '3', unit: 'days'};
      case 'DQC_1_APPROVAL':
        return {duration: '3', unit: 'days'};
      case 'FINAL_REVISED_FILES_READY':
        return {duration: '1.5', unit: 'days'};
      case 'DQC_2_SUBMISSION':
        return {duration: '1.5', unit: 'days'};
      case 'DQC_2_APPROVAL':
        return {duration: '3', unit: 'days'};
      default:
        return get1BHKDuration(stage);
    }
  }
  
  // Default fallback
  return get1BHKDuration(stage);
};

const organizeLeadsByStage = (backendLeads: any[]): LeadsMap => {
  const leadsMap: LeadsMap = {};
  
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
    
    // Get ALL notes from backend (includes both regular and rejection notes)
    const allNotes = lead.notes || [];
    
    // Process notes - your backend returns notes with timestamps like "2026-01-19 23:34: good mrng"
    // We need to extract just the note text
    const processedNotes = allNotes.map((note: string) => {
      if (!note) return "";
      // Extract note text after timestamp
      const parts = note.split(': ');
      if (parts.length >= 3) {
        // Join back everything after the timestamp
        return parts.slice(2).join(': ');
      } else if (parts.length === 2) {
        return parts[1];
      }
      return note;
    });
    
    // Separate regular notes from rejection notes
    const regularNotes = processedNotes.filter((note: string) => 
      note && typeof note === 'string' && !note.startsWith('[REJECTED]')
    );
    
    const rejectionNotes = processedNotes.filter((note: string) => 
      note && typeof note === 'string' && note.startsWith('[REJECTED]')
    );
    
    // Get the latest regular note (not rejection note)
    let leadNote = "";
    if (regularNotes.length > 0) {
      leadNote = regularNotes[regularNotes.length - 1];
    }
    
    // Get rejection reason from the separate field
    const rejectionReason = lead.rejectionReason || lead.latestRejectionReason || "";
    
    const leadStage = lead.stageType || lead.stage || lead.status || "GROUP_DESCRIPTION_UPDATE";
    const stageKey = leadStage.toUpperCase();
    
    // Ensure stageKey exists in ALL_STAGES
    const validStage = ALL_STAGES.includes(stageKey) ? stageKey : "GROUP_DESCRIPTION_UPDATE";
    
    const leadObj: Lead = {
      id: frontendId,
      backendId: lead.id,
      name: leadName,
      note: leadNote, // Latest regular note (not rejection)
      status: validStage,
      stageType: leadStage,
      projectType: lead.projectType || 'ONE_BHK',
      currentStageStartedAt: lead.currentStageStartedAt,
      currentStageDeadlineAt: lead.currentStageDeadlineAt,
      daysRemaining: lead.daysRemaining,
      hoursRemaining: lead.hoursRemaining,
      overdue: lead.overdue || false,
      projectStartDate: lead.projectStartDate, 
      projectEndDate: lead.projectEndDate,     
      rejectedStageCount: lead.rejectedStageCount || 0,
      rejectionTimeExtensionDays: lead.rejectionTimeExtensionDays || 0,
      originalProjectDurationDays: lead.originalProjectDurationDays,
      extendedProjectDurationDays: lead.extendedProjectDurationDays,
      cumulativeDaysElapsed: lead.cumulativeDaysElapsed,
      cumulativeDaysScheduled: lead.cumulativeDaysScheduled,
      projectStatus: lead.projectStatus,
      rejectionImpact: lead.rejectionImpactDisplay || lead.rejectionImpact || "",
      // Get rejection reason from separate field
      rejectedReason: rejectionReason,
      // Store all notes (processed)
      allNotes: processedNotes,
      // Store regular and rejection notes separately
      regularNotes: regularNotes,
      rejectionNotes: rejectionNotes,
      // Store raw notes for reference
      rawNotes: allNotes
    };
    
    if (leadsMap[validStage]) {
      leadsMap[validStage] = [...leadsMap[validStage], leadObj];
    } else {
      const defaultStage = "GROUP_DESCRIPTION_UPDATE";
      if (leadsMap[defaultStage]) {
        leadsMap[defaultStage] = [...leadsMap[defaultStage], leadObj];
      } else {
        leadsMap[defaultStage] = [leadObj];
      }
    }
  });
  
  return leadsMap;
};

export default function Board() {
  const [isClient, setIsClient] = useState(false);
  const [leads, setLeads] = useState<LeadsMap>({});
  const [loading, setLoading] = useState(false);
  const [dragInProgress, setDragInProgress] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const [newName, setNewName] = useState("");
  const [newNote, setNewNote] = useState("");
  const [selectedProjectType, setSelectedProjectType] = useState("ONE_BHK");
  const [leadToReject, setLeadToReject] = useState<{stage: string, index: number} | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [hiddenStages, setHiddenStages] = useState<Set<string>>(new Set());
  const [lastOperationTime, setLastOperationTime] = useState<number>(0);
  const [apiError, setApiError] = useState<string | null>(null);

  // Initialize client-side state
  useEffect(() => {
    setIsClient(true);
  }, []);

  const windowSize = 4;
  const STATIC_STAGE = "GROUP_DESCRIPTION_UPDATE";
  const normalizedAll = ALL_STAGES.map((s) => s.trim());
  const LAST_STAGE_INDEX = normalizedAll.length - 1;

  const stagesToShow = normalizedAll;

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

  // Fetch leads from database - wrapped in useCallback to prevent unnecessary re-renders
  const fetchLeads = useCallback(async () => {
    if (!isClient) return;
    
    setLoading(true);
    setApiError(null);
    try {
      console.log('Fetching leads from API...');
      const leadsData = await leadApi.getLeads();
      console.log('Raw API response:', leadsData);
      
      // Check if we got valid data
      if (!leadsData || !Array.isArray(leadsData)) {
        console.warn('Invalid leads data received:', leadsData);
        throw new Error('Invalid data received from server');
      }
      
      const leadsMap = organizeLeadsByStage(leadsData);
      console.log('Organized leads map:', leadsMap);
      
      // Log first lead details for debugging
      if (leadsData.length > 0) {
        console.log('First lead details:', leadsData[0]);
        console.log('First lead notes:', leadsData[0].notes);
        console.log('First lead rejectionReason:', leadsData[0].rejectionReason);
      }
      
      if (leadsMap["FIRST_CUT_DESIGN_QUOTATION"] && leadsMap["FIRST_CUT_DESIGN_QUOTATION"].length > 0) {
        setUnlocked(true);
      } else {
        setUnlocked(false);
      }
      
      setLeads(leadsMap);
    } catch (error: any) {
      console.error('Error loading leads:', error);
      setApiError(`Failed to load leads: ${error.message}`);
      
      const emptyLeads: LeadsMap = {};
      ALL_STAGES.forEach(stage => { 
        emptyLeads[stage] = []; 
      });
      setLeads(emptyLeads);
      
      if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed')) {
        console.error('Cannot connect to server. Please check if backend is running at http://localhost:8080');
        setApiError('Cannot connect to server. Make sure backend is running at http://localhost:8080');
      }
    } finally {
      setLoading(false);
    }
  }, [isClient]);

  // Load leads on component mount with auto-refresh every 30 seconds
  useEffect(() => {
    if (isClient) {
      fetchLeads();
    }
  }, [isClient, fetchLeads]);

  // Add new lead
  const addLead = async () => {
    if (!newName.trim() || loading || !isClient) return;
    setLoading(true);
    setApiError(null);
    try {
      await leadApi.addNewLead(newName.trim(), newNote.trim(), selectedProjectType);
      setTimeout(fetchLeads, 300);
      setNewName("");
      setNewNote("");
      setLastOperationTime(Date.now());
    } catch (error: any) {
      console.error(`Failed to add lead: ${error.message}`);
      setApiError(`Failed to add lead: ${error.message}`);
      setLoading(false);
    }
  };

  // Update lead note (regular note, not rejection reason)
  const updateLeadNote = useCallback(async (stage: string, index: number, note: string) => {
    if (!isClient || !note.trim()) return;
    
    const currentItems = Array.from(leads[stage] ?? []);
    const lead = currentItems[index];
    if (!lead) return;

    setLoading(true);
    setApiError(null);
    try {
      // Send note to backend
      await leadApi.updateLeadNote(lead.id, note.trim());
      setTimeout(fetchLeads, 300);
      setLastOperationTime(Date.now());
    } catch (error: any) {
      console.error(`Failed to save note: ${error.message}`);
      setApiError(`Failed to save note: ${error.message}`);
      setLoading(false);
    }
  }, [isClient, leads, fetchLeads]);

  // Mark lead as done
  const handleMarkLeadDone = useCallback(async (stage: string, index: number) => {
    if (loading || !isClient) return;
    
    setLoading(true);
    setApiError(null);
    try {
      const currentItems = Array.from(leads[stage] ?? []);
      const lead = currentItems[index];
      if (!lead) return;

      // Send the current note with the mark done request
      await leadApi.markLeadDone(lead.id, stage, lead.note || "");
      setTimeout(fetchLeads, 300);
      
      if (stage === "FIRST_CUT_DESIGN_QUOTATION") {
        setUnlocked(true);
      }
      setLastOperationTime(Date.now());
    } catch (error: any) {
      console.error(`Failed to move lead: ${error.message}`);
      setApiError(`Failed to move lead: ${error.message}`);
      setLoading(false);
    }
  }, [loading, isClient, leads, fetchLeads]);

  // Handle reject lead
  const handleRejectLead = useCallback((stage: string, index: number) => {
    if (!isClient) return;
    
    const currentItems = Array.from(leads[stage] ?? []);
    const lead = currentItems[index];
    if (!lead) return;
    setLeadToReject({ stage, index });
    setRejectNote("");
  }, [isClient, leads]);

  // Confirm reject lead
  const confirmRejectLead = async () => {
    if (!leadToReject || loading || !isClient) return;
    const { stage, index } = leadToReject;
    const currentItems = Array.from(leads[stage] ?? []);
    const lead = currentItems[index];
    if (!lead) return;

    setLoading(true);
    setApiError(null);
    try {
      // The rejectNote will be stored as rejectionReason in the database
      const rejectionReason = rejectNote.trim() || "Lead rejected";
      await leadApi.rejectLead(lead.id, rejectionReason, stage);
      setTimeout(fetchLeads, 300);
      setLastOperationTime(Date.now());
    } catch (error: any) {
      console.error(`Failed to reject lead: ${error.message}`);
      setApiError(`Failed to reject lead: ${error.message}`);
      setTimeout(fetchLeads, 300);
    } finally {
      setLoading(false);
      setLeadToReject(null);
      setRejectNote("");
    }
  };

  const cancelReject = () => {
    setLeadToReject(null);
    setRejectNote("");
  };

  // FIXED: Instant drag and drop handler with duration updates
  const onDragEnd = async (result: DropResult) => {
    if (!isClient) return;
    
    const { source, destination } = result;
    if (!destination) {
      setDragInProgress(false);
      return;
    }

    const src = source.droppableId;
    const dst = destination.droppableId;

    // Update UI INSTANTLY (optimistic update)
    const srcItems = Array.from(leads[src] ?? []);
    const [movedLead] = srcItems.splice(source.index, 1);
    
    if (!movedLead) {
      setDragInProgress(false);
      return;
    }

    // Get stage duration for the NEW stage
    const stageDuration = getStageDuration(dst, movedLead.projectType || selectedProjectType);
    const now = new Date();
    
    // Calculate new deadline based on stage duration
    let newDeadline = new Date(now);
    if (stageDuration.unit === 'hours') {
      const hours = parseFloat(stageDuration.duration);
      newDeadline.setHours(now.getHours() + hours);
    } else {
      const days = parseFloat(stageDuration.duration);
      newDeadline.setDate(now.getDate() + days);
    }

    // Calculate hours/days remaining
    const timeDiff = newDeadline.getTime() - now.getTime();
    const hoursRemaining = Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60)));
    const daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
    
    // Create updated lead with new timeline properties
    const updatedLead = {
      ...movedLead,
      status: dst, // Update status immediately
      stageType: dst, // Update stage type immediately
      currentStageStartedAt: now.toISOString(), // Reset stage start time
      currentStageDeadlineAt: newDeadline.toISOString(), // Set new deadline
      hoursRemaining: stageDuration.unit === 'hours' ? hoursRemaining : undefined,
      daysRemaining: stageDuration.unit === 'days' ? daysRemaining : undefined,
      overdue: false, // Reset overdue status
      // Update cumulative days (simplified - increment by 1 for demo)
      cumulativeDaysElapsed: (movedLead.cumulativeDaysElapsed || 0) + 1,
      cumulativeDaysScheduled: (movedLead.cumulativeDaysScheduled || 0) + 
        (stageDuration.unit === 'days' ? parseFloat(stageDuration.duration) : 
         parseFloat(stageDuration.duration) / 24)
    };

    // INSTANT UI UPDATE - No waiting
    setLeads(prev => ({
      ...prev,
      [src]: srcItems,
      [dst]: [...(prev[dst] ?? []), updatedLead]
    }));

    setDragInProgress(false);
    
    // Call API in background (no loading state, no waiting)
    try {
      await leadApi.moveLead(movedLead.id, src, dst, "");
    } catch (error: any) {
      console.error(`Failed to move lead: ${error.message}`);
      // If API fails, refresh to get correct state
      fetchLeads();
    }
  };

  const onDragStart = () => {
    if (!isClient) return;
    setDragInProgress(true);
  };

  const allNonStatic = normalizedAll.filter((s) => s !== STATIC_STAGE);
  const currentFirstVisibleStage = scrollableStages[startIndex] ?? scrollableStages[0] ?? allNonStatic[0];
  const currentFirstIndexInAll = allNonStatic.indexOf(currentFirstVisibleStage);
  const canPrev = currentFirstIndexInAll > 0;
  const canNext = startIndex + (windowSize - 1) < scrollableStages.length;

  const isInteractionDisabled = dragInProgress || !isClient;

  // Don't render during SSR
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {apiError && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          <div className="flex justify-between items-center">
            <span>{apiError}</span>
            <button 
              onClick={() => setApiError(null)}
              className="text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
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
              <p className="text-xs text-gray-500 mt-1">
                This reason will be stored separately from regular notes and will be displayed in the lead card.
              </p>
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
      
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex gap-4 items-center">
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
            
            <ProjectTypeSelector
              selectedType={selectedProjectType}
              onChange={setSelectedProjectType}
              disabled={isInteractionDisabled}
              className="w-48"
            />
            
            <button 
              onClick={addLead} 
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={isInteractionDisabled || !newName.trim()}
            >
              Add Lead
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
      </div>

      <DragDropContext onDragEnd={onDragEnd} onDragStart={onDragStart}>
        <div className="flex gap-6">
          <div className="sticky top-4 self-start">
            <Droppable key={STATIC_STAGE} droppableId={STATIC_STAGE}>
              {(provided, snapshot) => (
                <div 
                  ref={provided.innerRef} 
                  {...provided.droppableProps}
                  className={`rounded-lg p-1 ${snapshot.isDraggingOver ? "bg-blue-50" : ""}`}
                >
                  <StageColumn 
                    title={formatStageName(STATIC_STAGE)} 
                    duration="12 hours" 
                    isStatic
                  >
                    {(leads[STATIC_STAGE] ?? []).map((lead, index) => {
                      const stageDuration = getStageDuration(STATIC_STAGE, lead.projectType || selectedProjectType);
                      const stageDurationText = `${stageDuration.duration} ${stageDuration.unit}`;
                      
                      return (
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
                                projectType={lead.projectType || selectedProjectType}
                                onNoteChange={(n) => updateLeadNote(STATIC_STAGE, index, n)}
                                onReject={() => handleRejectLead(STATIC_STAGE, index)}
                                onMarkDone={() => handleMarkLeadDone(STATIC_STAGE, index)}
                                disabled={isInteractionDisabled}
                                hoursRemaining={lead.hoursRemaining}
                                daysRemaining={undefined}
                                overdue={lead.overdue}
                                stageStartedAt={lead.currentStageStartedAt}
                                deadlineAt={lead.currentStageDeadlineAt}
                                allowedDuration={stageDurationText}
                                // Project timeline props
                                projectStartDate={lead.projectStartDate}
                                projectEndDate={lead.projectEndDate}
                                rejectedStageCount={lead.rejectedStageCount}
                                rejectionTimeExtensionDays={lead.rejectionTimeExtensionDays}
                                originalProjectDurationDays={lead.originalProjectDurationDays}
                                extendedProjectDurationDays={lead.extendedProjectDurationDays}
                                cumulativeDaysElapsed={lead.cumulativeDaysElapsed}
                                cumulativeDaysScheduled={lead.cumulativeDaysScheduled}
                                projectStatus={lead.projectStatus}
                                rejectionImpact={lead.rejectionImpact}
                                rejectedReason={lead.rejectedReason}
                                allNotes={lead.allNotes}
                                regularNotes={lead.regularNotes}
                                rejectionNotes={lead.rejectionNotes}
                                rawNotes={lead.rawNotes}
                              />
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </StageColumn>
                </div>
              )}
            </Droppable>
          </div>

          <div className="flex-1 overflow-x-auto py-2">
            <div className="flex gap-4 min-w-max">
              {scrollableStages.slice(startIndex, startIndex + windowSize - 1).map((stage) => {
                return (
                  <Droppable key={stage} droppableId={stage}>
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef} 
                        {...provided.droppableProps}
                        className={`rounded-lg p-1 ${snapshot.isDraggingOver ? "bg-blue-50" : ""}`}
                      >
                        <StageColumn 
                          title={formatStageName(stage)} 
                          duration={getStageDuration(stage, selectedProjectType).duration + " " + getStageDuration(stage, selectedProjectType).unit}
                        >
                          {(leads[stage] ?? []).map((lead, index) => {
                            const stageDuration = getStageDuration(stage, lead.projectType || selectedProjectType);
                            const stageDurationText = `${stageDuration.duration} ${stageDuration.unit}`;
                            const isHoursDisplay = stageDuration.unit === 'hours';
                            
                            return (
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
                                      projectType={lead.projectType || selectedProjectType}
                                      onNoteChange={(n) => updateLeadNote(stage, index, n)}
                                      onReject={() => handleRejectLead(stage, index)}
                                      onMarkDone={() => handleMarkLeadDone(stage, index)}
                                      disabled={isInteractionDisabled}
                                      hoursRemaining={isHoursDisplay ? lead.hoursRemaining : undefined}
                                      daysRemaining={!isHoursDisplay ? lead.daysRemaining : undefined}
                                      overdue={lead.overdue}
                                      stageStartedAt={lead.currentStageStartedAt}
                                      deadlineAt={lead.currentStageDeadlineAt}
                                      allowedDuration={stageDurationText}
                                      // Project timeline props
                                      projectStartDate={lead.projectStartDate}
                                      projectEndDate={lead.projectEndDate}
                                      rejectedStageCount={lead.rejectedStageCount}
                                      rejectionTimeExtensionDays={lead.rejectionTimeExtensionDays}
                                      originalProjectDurationDays={lead.originalProjectDurationDays}
                                      extendedProjectDurationDays={lead.extendedProjectDurationDays}
                                      cumulativeDaysElapsed={lead.cumulativeDaysElapsed}
                                      cumulativeDaysScheduled={lead.cumulativeDaysScheduled}
                                      projectStatus={lead.projectStatus}
                                      rejectionImpact={lead.rejectionImpact}
                                      rejectedReason={lead.rejectedReason}
                                      allNotes={lead.allNotes}
                                      regularNotes={lead.regularNotes}
                                      rejectionNotes={lead.rejectionNotes}
                                      rawNotes={lead.rawNotes}
                                    />
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
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
    </div>
  );
}
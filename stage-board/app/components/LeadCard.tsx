"use client";

import React, { useState } from "react";

type Props = {
  leadId: string;
  status?: string;
  disabled?: boolean;
  onReject?: () => void;
  leadName?: string;
  daysRemaining?: number; 
  hoursRemaining?: number;
  leadPhone?: string;
  leadEmail?: string;
  leadNote?: string;
  onNoteChange?: (note: string) => void;
  overdue?: boolean;
  stageStartedAt?: string;
  deadlineAt?: string;
  allowedDuration?: string;
  projectStartDate?: string;
  projectEndDate?: string;
  rejectedStageCount?: number;
  // NEW PROPS
  rejectionTimeExtensionDays?: number;
  originalProjectDurationDays?: number;
  extendedProjectDurationDays?: number;
  cumulativeDaysElapsed?: number;
  cumulativeDaysScheduled?: number;
  projectStatus?: string;
  // NEW: Rejection impact from backend
  rejectionImpact?: string;
};

const statusColor = (s?: string) => {
  if (!s) return "bg-gray-100 text-gray-700";
  if (s === "Done" || s === "Completed") return "bg-blue-600 text-white";
  return "bg-indigo-100 text-indigo-700 border border-indigo-200";
};

const getProjectStatusColor = (status?: string) => {
  if (!status) return "bg-gray-100 text-gray-800";
  
  switch(status) {
    case 'SERIOUS_DELAY':
      return "bg-red-100 text-red-800";
    case 'MINOR_DELAY':
      return "bg-orange-100 text-orange-800";
    case 'ON_SCHEDULE':
      return "bg-green-100 text-green-800";
    case 'AHEAD_OF_SCHEDULE':
      return "bg-blue-100 text-blue-800";
    case 'NOT_STARTED':
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const formatDateTime = (dateString?: string) => {
  if (!dateString) return "Not set";
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return "Invalid date";
  }
};

const calculateProjectDuration = (startDate?: string, endDate?: string) => {
  if (!startDate || !endDate) return null;
  
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch (error) {
    return null;
  }
};

const formatProjectStatus = (status?: string) => {
  if (!status) return "Unknown";
  return status.replace(/_/g, ' ');
};

const LeadCard: React.FC<Props> = ({
  leadId,
  status,
  disabled = false,
  onReject,
  leadName = "First Cut Design Quotation",
  daysRemaining,
  hoursRemaining,
  leadPhone = "+1 (555) 123-4567",
  leadEmail = "john@example.com",
  leadNote = "",
  onNoteChange,
  overdue,
  stageStartedAt,
  deadlineAt,
  allowedDuration,
  projectStartDate,
  projectEndDate,
  rejectedStageCount = 0,
  // NEW PROPS
  rejectionTimeExtensionDays = 0,
  originalProjectDurationDays,
  extendedProjectDurationDays,
  cumulativeDaysElapsed,
  cumulativeDaysScheduled,
  projectStatus,
  // NEW: Rejection impact from backend
  rejectionImpact
}) => {
  const [showModal, setShowModal] = useState(false);
  const [note, setNote] = useState(leadNote);
  const [isEditingNote, setIsEditingNote] = useState(false);

  const handleViewClick = () => {
    if (disabled) return;
    setShowModal(true);
  };
  
  const handleReject = () => {
    if (disabled || !onReject) return;
    onReject();
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditingNote(false);
  };

  const handleSaveNote = () => {
    if (onNoteChange) {
      onNoteChange(note);
    }
    setIsEditingNote(false);
  };

  const handleCancelEdit = () => {
    setNote(leadNote);
    setIsEditingNote(false);
  };

  // Function to determine what time remaining to display
  const getTimeRemainingDisplay = () => {
    if (hoursRemaining !== undefined && hoursRemaining < 24) {
      return `${hoursRemaining} hour${hoursRemaining === 1 ? '' : 's'} remaining`;
    } else if (daysRemaining !== undefined) {
      return `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining`;
    } else if (hoursRemaining !== undefined) {
      const days = Math.ceil(hoursRemaining / 24);
      return `${days} day${days === 1 ? '' : 's'} remaining`;
    }
    return null;
  };

  const timeRemainingText = getTimeRemainingDisplay();
  
  // Calculate if the lead is overdue
  const isOverdue = overdue || 
    (deadlineAt && new Date(deadlineAt) < new Date()) || 
    (daysRemaining !== undefined && daysRemaining < 0) ||
    (hoursRemaining !== undefined && hoursRemaining < 0);

  // Calculate project duration
  const projectDuration = calculateProjectDuration(projectStartDate, projectEndDate);
  
  // Calculate actual rejection penalty days (from backend)
  const actualRejectionPenaltyDays = rejectionTimeExtensionDays;
  
  // Use rejectionImpact from backend if available
  const displayRejectionImpact = rejectionImpact || 
    (rejectedStageCount > 0 ? `+${actualRejectionPenaltyDays} days penalty (${rejectedStageCount} rejection${rejectedStageCount > 1 ? 's' : ''})` : "");

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        {/* Top Row */}
        <div className="flex justify-between items-start mb-4">
          {/* Status - Left Top */}
          {status && (
            <div className={`text-xs px-3 py-1.5 rounded-md font-medium ${statusColor(status)}`}>
              {status}
            </div>
          )}
          
          {/* Lead ID - Right Top */}
          <div className="text-xs font-medium text-gray-500">
            ID: {leadId}
          </div>
        </div>

        {/* Time Remaining - Single display with priority logic */}
        {timeRemainingText && (
          <div className={`mb-4 flex items-center gap-2 ${isOverdue ? 'text-red-600' : 'text-orange-600'}`}>
            {/* Clock Symbol */}
            <svg 
              className="w-4 h-4" 
              fill="currentColor" 
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                fillRule="evenodd" 
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" 
                clipRule="evenodd" 
              />
            </svg>
            
            {/* Time Text */}
            <div className={`text-sm font-bold ${isOverdue ? 'text-red-600' : 'text-orange-600'}`}>
              {isOverdue ? (
                <>
                  {hoursRemaining !== undefined && hoursRemaining < 0
                    ? `${Math.abs(hoursRemaining)} hour${Math.abs(hoursRemaining) === 1 ? '' : 's'} overdue`
                    : daysRemaining !== undefined && daysRemaining < 0
                      ? `${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) === 1 ? '' : 's'} overdue`
                      : 'Overdue'}
                </>
              ) : (
                timeRemainingText
              )}
            </div>
          </div>
        )}

        {/* Bottom Row - Buttons */}
        <div className="flex justify-between items-center">
          {/* View Details - Left Bottom */}
          <button
            onClick={handleViewClick}
            className={`px-3 py-1.5 text-sm rounded-lg ${
              disabled 
                ? "text-gray-400 bg-gray-100" 
                : "text-blue-600 bg-blue-50 hover:bg-blue-100"
            }`}
            disabled={disabled}
          >
            View Details
          </button>
          
          {/* Reject - Right Bottom */}
          <button
            onClick={handleReject}
            className={`px-3 py-1.5 text-sm rounded-lg ${
              disabled 
                ? "opacity-50" 
                : "bg-orange-500 text-white hover:bg-orange-600"
            }`}
            disabled={disabled}
          >
            Reject
          </button>
        </div>
      </div>

      {/* Modal Popup with Blurred Background */}
      {showModal && (
        <>
          {/* Backdrop with blur effect */}
          <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm transition-opacity duration-300" />
          
          {/* Modal Container */}
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              {/* Modal Content */}
              <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-auto my-8 animate-fadeIn">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">Lead Details</h2>
                    <p className="text-sm text-gray-500 mt-1">Lead ID: {leadId}</p>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-600 text-2xl hover:scale-110 transition-transform"
                  >
                    ×
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6">
                  {/* Project Status Badge */}
                  {projectStatus && (
                    <div className={`mb-4 p-3 rounded-lg text-center font-medium ${getProjectStatusColor(projectStatus)}`}>
                      <span className="font-bold">Project Status:</span> {formatProjectStatus(projectStatus)}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Lead Information */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          Lead Name
                        </label>
                        <div className="text-base font-medium text-gray-800">
                          {leadName}
                        </div>
                      </div>
                      
                      {/* Time Remaining in Modal */}
                      {timeRemainingText && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            Time Remaining
                          </label>
                          <div className={`text-base font-bold ${isOverdue ? 'text-red-600' : 'text-orange-600'}`}>
                            {isOverdue ? 'OVERDUE' : timeRemainingText}
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          Phone Number
                        </label>
                        <div className="text-base text-gray-800">
                          {leadPhone}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          Email Address
                        </label>
                        <div className="text-base text-gray-800">
                          {leadEmail}
                        </div>
                      </div>
                    </div>

                    {/* Status & Timestamps */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          Current Status
                        </label>
                        <div className={`inline-block text-xs px-3 py-1.5 rounded-md font-medium ${statusColor(status)}`}>
                          {status}
                        </div>
                      </div>
                      
                      {/* Stage Started At */}
                      {stageStartedAt && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            Stage Started At
                          </label>
                          <div className="text-sm text-gray-800">
                            {formatDateTime(stageStartedAt)}
                          </div>
                        </div>
                      )}
                      
                      {/* Deadline At */}
                      {deadlineAt && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            Stage Deadline
                          </label>
                          <div className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-green-600'}`}>
                            {formatDateTime(deadlineAt)}
                            {isOverdue && <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">OVERDUE</span>}
                          </div>
                        </div>
                      )}
                      
                      {/* Allowed Duration */}
                      {allowedDuration && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            Stage Duration
                          </label>
                          <div className="text-sm text-gray-800">
                            {allowedDuration}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes Section */}
                  <div className="border-t pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-800">Notes</h3>
                      {!isEditingNote ? (
                        <button
                          onClick={() => setIsEditingNote(true)}
                          className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          {note ? "Edit Note" : "Add Note"}
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveNote}
                            className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                          >
                            Save Note
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-4 py-2 text-sm bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>

                    {isEditingNote ? (
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="w-full h-40 p-4 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all"
                        placeholder="Add your note here..."
                        autoFocus
                      />
                    ) : note ? (
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-[100px] hover:bg-gray-100 transition-colors">
                        <p className="text-gray-700 whitespace-pre-wrap">{note}</p>
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-[100px] flex items-center justify-center hover:bg-gray-100 transition-colors">
                        <p className="text-gray-500">No notes added yet</p>
                      </div>
                    )}

                    {/* Project Timeline Information */}
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <h4 className="text-sm font-medium text-blue-800 mb-3">Project Timeline Analysis</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {/* Project Start Date */}
                        {projectStartDate && (
                          <div>
                            <span className="text-blue-600 font-medium">Project Start:</span>
                            <span className="text-gray-700 ml-2 whitespace-nowrap">{formatDateTime(projectStartDate)}</span>
                          </div>
                        )}
                        
                        {/* Project End Date */}
                        {projectEndDate && (
                          <div>
                            <span className="text-blue-600 font-medium">Project Deadline:</span>
                            <span className={`ml-2 whitespace-nowrap ${new Date(projectEndDate) < new Date() ? 'text-red-600 font-bold' : 'text-gray-700'}`}>
                              {formatDateTime(projectEndDate)}
                              {new Date(projectEndDate) < new Date() && (
                                <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">PROJECT OVERDUE</span>
                              )}
                            </span>
                          </div>
                        )}
                        
                        {/* Cumulative Timeline Progress */}
                        {cumulativeDaysElapsed !== undefined && cumulativeDaysScheduled !== undefined && (
                          <div className="md:col-span-2 border-t pt-2 mt-2">
                            <div className="flex justify-between mb-1">
                              <span className="text-blue-600 font-medium">Timeline Progress:</span>
                              <span className="text-gray-700">
                                {cumulativeDaysElapsed} days elapsed / {cumulativeDaysScheduled} days scheduled
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className={`h-2.5 rounded-full ${
                                  cumulativeDaysElapsed > cumulativeDaysScheduled ? 'bg-red-600' : 'bg-green-600'
                                }`}
                                style={{ 
                                  width: `${Math.min(100, (cumulativeDaysElapsed / cumulativeDaysScheduled) * 100)}%` 
                                }}
                              ></div>
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              {cumulativeDaysElapsed > cumulativeDaysScheduled 
                                ? `Behind schedule by ${cumulativeDaysElapsed - cumulativeDaysScheduled} days`
                                : `On track (${cumulativeDaysScheduled - cumulativeDaysElapsed} days ahead)`
                              }
                            </div>
                          </div>
                        )}
                        
                        {/* Original vs Extended Duration */}
                        {originalProjectDurationDays !== undefined && extendedProjectDurationDays !== undefined && (
                          <div className="md:col-span-2">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-2 bg-green-50 rounded border border-green-100">
                                <div className="text-green-700 text-xs font-medium">Original Duration</div>
                                <div className="text-green-800 font-bold">{originalProjectDurationDays} days</div>
                              </div>
                              <div className="p-2 bg-blue-50 rounded border border-blue-100">
                                <div className="text-blue-700 text-xs font-medium">Extended Duration</div>
                                <div className="text-blue-800 font-bold">{extendedProjectDurationDays} days</div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Rejection Information */}
                        {rejectedStageCount > 0 && (
                          <div className="md:col-span-2 border-t pt-2 mt-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-blue-600 font-medium">Rejection Impact:</span>
                                {/* Use rejectionImpact from backend if available */}
                                <span className="text-red-600 font-bold ml-2">
                                  {displayRejectionImpact}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500">
                                {actualRejectionPenaltyDays === 0 
                                  ? "No time penalty applied"
                                  : `${actualRejectionPenaltyDays} day${actualRejectionPenaltyDays > 1 ? 's' : ''} added to timeline`
                                }
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Total Timeline Summary */}
                        {projectDuration && (
                          <div className="md:col-span-2 bg-gray-50 p-3 rounded border border-gray-200">
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="text-gray-700 font-medium">Total Timeline:</span>
                                <span className="text-gray-800 font-bold ml-2">
                                  {projectDuration} days total
                                  {actualRejectionPenaltyDays > 0 && (
                                    <span className="text-sm text-gray-600 ml-2">
                                      ({projectDuration - actualRejectionPenaltyDays} original + {actualRejectionPenaltyDays} penalty)
                                    </span>
                                  )}
                                </span>
                              </div>
                              {actualRejectionPenaltyDays > 0 && (
                                <div className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                  {actualRejectionPenaltyDays} day{actualRejectionPenaltyDays > 1 ? 's' : ''} added due to rejections
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Current Stage Duration */}
                        {allowedDuration && (
                          <div className="md:col-span-2">
                            <span className="text-blue-600 font-medium">Current Stage Duration:</span>
                            <span className="text-gray-700 ml-2">{allowedDuration}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50 rounded-b-xl">
                  <button
                    onClick={handleCloseModal}
                    className="px-6 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      handleSaveNote();
                      handleCloseModal();
                    }}
                    className="px-6 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add animation style */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

export default LeadCard;
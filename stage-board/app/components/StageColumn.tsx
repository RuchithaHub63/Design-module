import React from "react";

type Props = {
  title: string;
  completed?: boolean;
  children?: React.ReactNode;
  headerActions?: React.ReactNode;
  className?: string;
  isStatic?: boolean;
  durationInStage?: string;
  
  
};

const StageColumn: React.FC<Props> = ({
  title,
  completed,
  children,
  headerActions,
  className = "",
  isStatic = false,
  durationInStage,
 
}) => {
  const headerClass = isStatic
    ? "px-4 py-3 flex items-center justify-between bg-black"
    : "px-4 py-3 flex items-center justify-between bg-gray-800";

  return (
    <div className={`w-99 min-w-88 bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 ${className}`}>
      {/* Header */}
      <div className={`${headerClass}`}>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <div className="flex items-center gap-2">
          {completed && (
            <span className="text-xs font-medium bg-blue-600 text-white px-2 py-0.5 rounded">
              Completed
            </span>
          )}
          {headerActions}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 min-h-screen bg-gray-50">
        <div className="space-y-3">{children}</div>
      </div>
    </div>
  );
};

export default StageColumn;

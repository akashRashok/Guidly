"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CloseAssignmentButtonProps {
  assignmentId: string;
}

export function CloseAssignmentButton({ assignmentId }: CloseAssignmentButtonProps) {
  const router = useRouter();
  const [isClosing, setIsClosing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClose = async () => {
    setIsClosing(true);

    try {
      const response = await fetch(`/api/assignments/${assignmentId}/close`, {
        method: "POST",
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to close assignment:", error);
    } finally {
      setIsClosing(false);
      setShowConfirm(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-600">Close assignment?</span>
        <button
          onClick={handleClose}
          disabled={isClosing}
          className="btn btn-primary text-sm py-1.5"
        >
          {isClosing ? "Closing..." : "Yes, Close"}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className="btn btn-secondary text-sm py-1.5"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="btn btn-outline text-sm"
    >
      Close Assignment
    </button>
  );
}



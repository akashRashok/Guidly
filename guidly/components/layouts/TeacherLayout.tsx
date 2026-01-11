"use client";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { ActivitySidebar } from "./ActivitySidebar";

interface Activity {
  id: string;
  type: "completion" | "misconception" | "comment";
  studentName: string;
  message: string;
  time: string;
  assignmentTitle?: string;
}

interface TeacherLayoutProps {
  children: React.ReactNode;
  userEmail: string;
  userName?: string | null;
  userImage?: string | null;
  activities?: Activity[];
  recentStudents?: Array<{
    id: string;
    name: string;
    initial: string;
  }>;
  onLogout: () => void;
  showActivitySidebar?: boolean;
}

export function TeacherLayout({
  children,
  userEmail,
  userName,
  userImage,
  activities,
  recentStudents,
  onLogout,
  showActivitySidebar = true,
}: TeacherLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Left Sidebar */}
      <Sidebar onLogout={onLogout} />

      {/* Right Activity Sidebar */}
      {showActivitySidebar && (
        <ActivitySidebar activities={activities} recentStudents={recentStudents} />
      )}

      {/* Main content area */}
      <div className={`ml-60 ${showActivitySidebar ? "xl:mr-80" : ""}`}>
        {/* Header */}
        <Header userEmail={userEmail} userName={userName} userImage={userImage} />

        {/* Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}



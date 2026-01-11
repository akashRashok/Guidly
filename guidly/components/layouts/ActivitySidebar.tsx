"use client";

interface Activity {
  id: string;
  type: "completion" | "misconception" | "comment";
  studentName: string;
  message: string;
  time: string;
  assignmentTitle?: string;
}

interface ActivitySidebarProps {
  activities?: Activity[];
  recentStudents?: Array<{
    id: string;
    name: string;
    initial: string;
  }>;
}

export function ActivitySidebar({ activities = [], recentStudents = [] }: ActivitySidebarProps) {
  // Default activities if none provided
  const displayActivities: Activity[] = activities.length > 0 ? activities : [
    {
      id: "1",
      type: "completion",
      studentName: "Student",
      message: "Completed an assignment",
      time: "Just now",
    },
  ];

  // Default students if none provided
  const displayStudents = recentStudents.length > 0 ? recentStudents : [];

  const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
      case "completion":
        return (
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case "misconception":
        return (
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      case "comment":
        return (
          <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <aside className="fixed right-0 top-0 h-full w-80 bg-white border-l border-slate-200 flex flex-col z-30 hidden xl:flex">
      {/* Direct Messages Section */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800">Direct Messages</h2>
          <button type="button" className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
        </div>
        
        {/* Recent contacts */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Recents</span>
            <button type="button" className="text-xs text-slate-400 hover:text-slate-600">•••</button>
          </div>
          
          {displayStudents.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {displayStudents.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  className="flex flex-col items-center gap-1.5 min-w-[48px]"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white text-sm font-medium">
                    {student.initial}
                  </div>
                  <span className="text-xs text-slate-600 truncate max-w-[48px]">{student.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-4">No recent students</p>
          )}
        </div>
      </div>

      {/* Activities Section */}
      <div className="flex-1 overflow-y-auto p-5">
        <h2 className="font-semibold text-slate-800 mb-4">Activities</h2>
        
        <div className="space-y-4">
          {displayActivities.map((activity) => (
            <div key={activity.id} className="flex gap-3">
              {getActivityIcon(activity.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-800">
                  <span className="font-medium">{activity.studentName}</span>{" "}
                  <span className="text-slate-600">{activity.message}</span>
                </p>
                {activity.assignmentTitle && (
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {activity.assignmentTitle}
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}


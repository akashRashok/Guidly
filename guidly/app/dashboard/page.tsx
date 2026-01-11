import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db, assignments } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  // Fetch teacher's assignments
  const teacherAssignments = await db
    .select()
    .from(assignments)
    .where(eq(assignments.teacherId, session.user.id))
    .orderBy(desc(assignments.createdAt));

  return (
    <DashboardClient
      assignments={teacherAssignments}
      userEmail={session.user.email || ""}
      userName={session.user.name}
      userImage={session.user.image}
    />
  );
}

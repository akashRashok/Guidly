import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NewAssignmentClient } from "./NewAssignmentClient";

export default async function NewAssignmentPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <NewAssignmentClient
      userEmail={session.user.email || ""}
      userName={session.user.name}
      userImage={session.user.image}
    />
  );
}

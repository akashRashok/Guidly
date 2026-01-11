import { db } from "./index";
import { misconceptions } from "./schema";
import { predefinedMisconceptions } from "../misconceptions";

/**
 * Seed the database with predefined misconceptions
 */
export async function seedMisconceptions() {
  console.log("Seeding misconceptions...");
  
  // Check if misconceptions already exist
  const existing = await db.select().from(misconceptions).limit(1);
  
  if (existing.length > 0) {
    console.log("Misconceptions already seeded, skipping...");
    return;
  }
  
  // Insert all predefined misconceptions
  await db.insert(misconceptions).values(predefinedMisconceptions);
  
  console.log(`Seeded ${predefinedMisconceptions.length} misconceptions`);
}

// Run if called directly
if (require.main === module) {
  seedMisconceptions()
    .then(() => {
      console.log("Seeding complete!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seeding failed:", error);
      process.exit(1);
    });
}



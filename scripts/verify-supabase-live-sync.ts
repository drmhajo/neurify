import { createInitialDepartmentData } from "../lib/department-model";
import { getPilotSnapshot, savePilotSnapshot } from "../server/supabase-sync";

async function verify() {
  const existing = await getPilotSnapshot();
  const saved = existing ?? await savePilotSnapshot({ data: createInitialDepartmentData(), actorName: "Pilot verification" });

  const readBack = await getPilotSnapshot();
  if (!readBack || readBack.version !== saved.version) {
    throw new Error("Supabase snapshot verification did not return the saved version.");
  }
  if (JSON.stringify(readBack.data).includes("file://")) {
    throw new Error("A local device file reference was included in the cloud snapshot.");
  }

  console.log(`Pilot snapshot verified at version ${readBack.version} without local file references.`);
}

void verify();

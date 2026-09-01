const endpoint = "https://zyszoiezbbrunkgscwth.supabase.co/functions/v1/central-registration";
const credentials = {
  identifier: "googleplay.tester@neurify.review",
  password: "NfyReview!2026-9p4",
};

const signInResponse = await fetch(endpoint, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ action: "sign_in", ...credentials }),
});
const signIn = await signInResponse.json();
if (!signInResponse.ok || signIn?.ok !== true || signIn?.account?.role !== "play_reviewer" || !signIn?.account?.dataProof) {
  throw new Error("Google Play reviewer sign-in verification failed.");
}

const snapshotResponse = await fetch(endpoint, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ action: "data_pull", accountId: signIn.account.id, dataProof: signIn.account.dataProof }),
});
const snapshotResult = await snapshotResponse.json();
const snapshot = snapshotResult?.snapshot?.data;
const isEmptyReviewWorkspace = snapshotResult?.ok === true
  && snapshot?.releaseVersion === "Google Play reviewer access — no clinical records"
  && Array.isArray(snapshot?.teams) && snapshot.teams.length === 0
  && Array.isArray(snapshot?.reports) && snapshot.reports.length === 0
  && Array.isArray(snapshot?.surgeries) && snapshot.surgeries.length === 0
  && Array.isArray(snapshot?.opdOperationWaitingList) && snapshot.opdOperationWaitingList.length === 0
  && Array.isArray(snapshot?.generalDiscussionMessages) && snapshot.generalDiscussionMessages.length === 0;
if (!snapshotResponse.ok || !isEmptyReviewWorkspace) {
  throw new Error("Google Play reviewer workspace is not isolated from clinical records.");
}

const writeResponse = await fetch(endpoint, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ action: "data_push", accountId: signIn.account.id, dataProof: signIn.account.dataProof, expectedVersion: 1, data: {} }),
});
const writeResult = await writeResponse.json();
if (writeResponse.status !== 403 || writeResult?.error !== "reviewer_write_not_available") {
  throw new Error("Google Play reviewer write protection verification failed.");
}

console.log("Google Play reviewer sign-in, empty workspace, and write protection verified.");

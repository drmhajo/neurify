export type PushEventType = "consultation" | "admitted_case" | "general_announcement";

type ExpoPushTicket = {
  status: "ok" | "error";
  details?: { error?: string };
};

export function isExpoPushToken(token: string): boolean {
  return /^(ExponentPushToken|ExpoPushToken)\[[\w-]+\]$/.test(token);
}

export function createTeamPushPayload(input: {
  token: string;
  teamId: string;
  type: PushEventType;
  title: string;
  body: string;
}) {
  return {
    to: input.token,
    title: input.title,
    body: input.body,
    sound: "default" as const,
    priority: "high" as const,
    channelId: "department-alerts",
    data: input.type === "general_announcement" ? { type: input.type, url: "/notifications" } : { teamId: input.teamId, type: input.type },
  };
}

export async function sendTeamPushNotifications(input: {
  tokens: string[];
  teamId: string;
  type: PushEventType;
  title: string;
  body: string;
}): Promise<{ sent: number; invalidTokens: string[] }> {
  const validTokens = [...new Set(input.tokens)].filter(isExpoPushToken);
  if (!validTokens.length) return { sent: 0, invalidTokens: [] };

  const chunks = Array.from({ length: Math.ceil(validTokens.length / 100) }, (_, index) => validTokens.slice(index * 100, index * 100 + 100));
  const invalidTokens: string[] = [];
  let sent = 0;

  for (const tokens of chunks) {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(tokens.map((token) => createTeamPushPayload({ token, teamId: input.teamId, type: input.type, title: input.title, body: input.body }))),
    });
    if (!response.ok) throw new Error(`Expo Push Service returned ${response.status}`);
    const result = await response.json() as { data?: ExpoPushTicket[] };
    sent += tokens.length;
    result.data?.forEach((ticket, index) => {
      if (ticket.status === "error" && ticket.details?.error === "DeviceNotRegistered") invalidTokens.push(tokens[index]);
    });
  }

  return { sent, invalidTokens };
}

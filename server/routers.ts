import { COOKIE_NAME } from "../shared/const.js";
import { z } from "zod";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { isExpoPushToken, sendTeamPushNotifications } from "./push";
import { getPilotSnapshot, savePilotSnapshot } from "./supabase-sync";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  push: router({
    register: publicProcedure.input(z.object({ staffId: z.string().min(1).max(64), token: z.string().min(10).max(255), platform: z.enum(["ios", "android"]) })).mutation(async ({ input }) => {
      if (!isExpoPushToken(input.token)) throw new Error("Invalid push token");
      return db.upsertDevicePushToken(input);
    }),
    sendTeam: publicProcedure.input(z.object({
      teamId: z.string().min(1).max(64),
      recipientIds: z.array(z.string().min(1).max(64)).min(1).max(100),
      type: z.enum(["consultation", "admitted_case"]),
      title: z.string().min(1).max(80),
      body: z.string().min(1).max(180),
    })).mutation(async ({ input }) => {
      const tokens = await db.getActivePushTokens(input.recipientIds);
      const result = await sendTeamPushNotifications({ tokens, teamId: input.teamId, type: input.type, title: input.title, body: input.body });
      if (result.invalidTokens.length) await db.deactivatePushTokens(result.invalidTokens);
      return { recipients: tokens.length, sent: result.sent };
    }),
  }),
  backup: router({
    validate: adminProcedure.input(z.object({ payload: z.string().min(40).max(8_000_000) })).mutation(({ input }) => {
      try {
        const backup = JSON.parse(input.payload) as { format?: unknown; version?: unknown; data?: Record<string, unknown> };
        const collections = ["users", "reports", "shifts", "surgeries", "weeklyAssignments", "scheduleDocuments", "teams", "notifications"];
        const valid = backup.format === "ksmc-neurosurgery-backup" && backup.version === 1 && collections.every((key) => Array.isArray(backup.data?.[key]));
        if (!valid) return { valid: false as const, message: "Unsupported backup structure" };
        return { valid: true as const, message: "Backup structure is valid" };
      } catch { return { valid: false as const, message: "Backup JSON could not be parsed" }; }
    }),
  }),
  cloudSync: router({
    pull: publicProcedure.query(() => getPilotSnapshot()),
    // Pilot-only: the client uses the existing local demonstration login, so this route must
    // never be treated as a substitute for institutional identity or clinical authorization.
    push: publicProcedure.input(z.object({ data: z.unknown(), actorName: z.string().min(1).max(120) })).mutation(({ input }) => savePilotSnapshot(input)),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;

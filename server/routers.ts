import { COOKIE_NAME } from "../shared/const.js";
import { z } from "zod";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { isExpoPushToken, sendTeamPushNotifications } from "./push";

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

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;

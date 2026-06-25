import passport from "passport";
import type { Profile, VerifyCallback } from "passport-google-oauth20";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { env } from "@/config/env";
import { prisma } from "@/lib/prisma";
import { isGoogleOAuthConfigured } from "@/lib/oauth";
import type { UserRole } from "@/lib/domain-types";

if (isGoogleOAuthConfigured()) {
  const clientID = env.GOOGLE_CLIENT_ID as string;
  const clientSecret = env.GOOGLE_CLIENT_SECRET as string;
  const callbackURL = env.GOOGLE_CALLBACK_URL as string;

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL
      },
      async (_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) => {
        try {
          const email = profile.emails?.[0]?.value;

          if (!email) {
            return done(new Error("Google account email not available"));
          }

          const user = await prisma.user.upsert({
            where: { email },
            update: {
              googleId: profile.id,
              avatarUrl: profile.photos?.[0]?.value
            },
            create: {
              name: profile.displayName,
              email,
              googleId: profile.id,
              avatarUrl: profile.photos?.[0]?.value
            }
          });

          return done(null, {
            id: user.id,
            email: user.email,
            role: user.role as UserRole,
            name: user.name,
            avatarUrl: user.avatarUrl
          });
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );
}

export { passport };

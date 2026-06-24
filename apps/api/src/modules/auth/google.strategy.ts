import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { env } from "@/config/env";
import { prisma } from "@/lib/prisma";

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_CALLBACK_URL) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL
      },
      async (_accessToken, _refreshToken, profile, done) => {
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

          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );
}

export { passport };


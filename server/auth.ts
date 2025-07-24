import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express } from "express";
import { storage } from "./storage";

export function setupAuth(app: Express) {
  // Session configuration
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "your-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false, // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Google OAuth Strategy for students
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: "/api/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Check if user already exists
            let user = await storage.getUserByEmail(profile.emails?.[0]?.value || "");
            
            if (!user) {
              // Create new user
              user = await storage.createUser({
                id: profile.id,
                email: profile.emails?.[0]?.value || "",
                firstName: profile.name?.givenName || "",
                lastName: profile.name?.familyName || "",
                profileImageUrl: profile.photos?.[0]?.value || "",
                role: "student",
              });
            }
            
            return done(null, user);
          } catch (error) {
            return done(error, undefined);
          }
        }
      )
    );
  }

  // Local Strategy for admin login
  passport.use(
    new LocalStrategy(
      {
        usernameField: "username",
        passwordField: "password",
      },
      async (username, password, done) => {
        try {
          if (username === "admin" && password === "admin123") {
            // Return admin user object
            const adminUser = {
              id: "admin",
              username: "admin",
              role: "admin",
              email: "admin@intellitutor.com",
            };
            return done(null, adminUser);
          } else {
            return done(null, false, { message: "Invalid credentials" });
          }
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Serialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, { id: user.id, role: user.role });
  });

  // Deserialize user from session
  passport.deserializeUser(async (sessionUser: any, done) => {
    try {
      if (sessionUser.role === "admin") {
        const adminUser = {
          id: "admin",
          username: "admin",
          role: "admin",
          email: "admin@intellitutor.com",
        };
        done(null, adminUser);
      } else {
        const user = await storage.getUser(sessionUser.id);
        done(null, user);
      }
    } catch (error) {
      done(error);
    }
  });

  // Auth routes
  app.get("/api/login", (req, res) => {
    res.redirect("/login");
  });

  app.post("/api/auth/admin/login", passport.authenticate("local"), (req, res) => {
    res.json({ success: true, user: req.user });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  // Remove this route since it's defined in routes.ts
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Middleware to check if user is admin
export function isAdmin(req: any, res: any, next: any) {
  if (req.isAuthenticated() && req.user?.role === "admin") {
    return next();
  }
  res.status(403).json({ message: "Admin access required" });
}

// Middleware to check if user is student
export function isStudent(req: any, res: any, next: any) {
  if (req.isAuthenticated() && req.user?.role === "student") {
    return next();
  }
  res.status(403).json({ message: "Student access required" });
}
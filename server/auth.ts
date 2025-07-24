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
    console.log("Setting up Google OAuth with callback URL:", `https://${process.env.REPLIT_DOMAINS}/api/auth/google/callback`);
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: `https://${process.env.REPLIT_DOMAINS}/api/auth/google/callback`,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            console.log("Google OAuth callback - Profile:", profile.displayName, profile.emails?.[0]?.value);
            
            // Check if user already exists
            let user = await storage.getUserByEmail(profile.emails?.[0]?.value || "");
            console.log("Existing user found:", !!user);
            
            if (!user) {
              // Create new user
              console.log("Creating new user for Google OAuth");
              user = await storage.createUser({
                id: profile.id,
                email: profile.emails?.[0]?.value || "",
                firstName: profile.name?.givenName || "",
                lastName: profile.name?.familyName || "",
                profileImageUrl: profile.photos?.[0]?.value || "",
                role: "student",
              });
              console.log("New user created:", user.id);
            }
            
            console.log("OAuth success, returning user:", user.id, user.role);
            return done(null, user);
          } catch (error) {
            console.error("Google OAuth error:", error);
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

  // Google OAuth routes for students
  app.get("/api/auth/google", 
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  app.get("/api/auth/google/callback", 
    (req, res, next) => {
      console.log("OAuth callback received with query:", req.query);
      passport.authenticate("google", { 
        failureRedirect: "/login",
        failureMessage: true 
      })(req, res, next);
    },
    (req, res) => {
      // Successful authentication, redirect to dashboard
      console.log("OAuth callback success, user:", req.user);
      console.log("Session ID:", req.sessionID);
      res.redirect("/dashboard");
    }
  );

  // Add error handling for OAuth failures
  app.get("/api/auth/google/error", (req, res) => {
    console.log("OAuth error callback hit");
    res.redirect("/login?error=oauth_failed");
  });

  app.post("/api/auth/admin/login", passport.authenticate("local"), (req, res) => {
    res.json({ success: true, user: req.user });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      // Clear session and redirect
      req.session.destroy((sessionErr) => {
        if (sessionErr) {
          console.error("Session destruction error:", sessionErr);
        }
        res.clearCookie('connect.sid');
        res.json({ success: true, redirect: "/" });
      });
    });
  });

  // Add GET logout route for consistency
  app.get("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.redirect("/");
      }
      // Clear session and redirect
      req.session.destroy((sessionErr) => {
        if (sessionErr) {
          console.error("Session destruction error:", sessionErr);
        }
        res.clearCookie('connect.sid');
        res.redirect("/");
      });
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
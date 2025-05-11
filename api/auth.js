import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage.js";
import { db } from "./db.js";

// Promisify the scrypt function
const scryptAsync = promisify(scrypt);

// Setup passport with local strategy
export function setupAuth(app) {
  // Initialize session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Set secure in production
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure local strategy
  passport.use(new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password'
    },
    async (email, password, done) => {
      try {
        // Find user by email
        const user = await storage.getUserByEmail(email);
        
        if (!user) {
          return done(null, false, { message: 'Incorrect email or password' });
        }

        // Verify password
        const isMatch = await verifyPassword(password, user.password);
        
        if (!isMatch) {
          return done(null, false, { message: 'Incorrect email or password' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));

  // Serialize user
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, id)
      });
      
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}

// Verify password using scrypt
async function verifyPassword(password, hashedPassword) {
  // Split the stored hash to get the salt and hash
  const [salt, hash] = hashedPassword.split('.');
  
  // Hash the provided password with the same salt
  const hashBuffer = await scryptAsync(password, salt, 64);
  
  // Convert the hash buffer to a string
  const keyBuffer = Buffer.from(hash, 'hex');
  
  // Compare the hashes using timingSafeEqual to prevent timing attacks
  return timingSafeEqual(hashBuffer, keyBuffer);
}

// Middleware to check if user is authenticated
export function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Not authenticated' });
}

// Middleware to check if user is an admin
export function isAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ error: 'Not authorized' });
}

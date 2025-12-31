import { supabase } from "../lib/supabase";

// Email validation
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation
const isValidPassword = (password) => {
  return password && password.length >= 6;
};

/**
 * Sign up a new user with validation
 */
export async function signUp(email, password) {
  // Validate inputs
  if (!email || !isValidEmail(email)) {
    return { error: "Please enter a valid email address" };
  }

  if (!isValidPassword(password)) {
    return { error: "Password must be at least 6 characters" };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      // User-friendly error messages
      if (error.message.includes("already registered")) {
        return {
          error: "This email is already registered. Please sign in instead.",
        };
      }
      if (error.message.includes("rate limit")) {
        return {
          error: "Too many attempts. Please wait a moment and try again.",
        };
      }
      return { error: error.message };
    }

    // Check if email confirmation is required
    const needsConfirmation = data.user && !data.session;

    return {
      user: data.user,
      session: data.session,
      needsConfirmation,
    };
  } catch (err) {
    console.error("SignUp error:", err);
    return {
      error:
        "Unable to create account. Please check your connection and try again.",
    };
  }
}

/**
 * Sign in an existing user with validation
 */
export async function signIn(email, password) {
  // Validate inputs
  if (!email || !isValidEmail(email)) {
    return { error: "Please enter a valid email address" };
  }

  if (!password) {
    return { error: "Please enter your password" };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      // User-friendly error messages
      if (error.message.includes("Invalid login")) {
        return { error: "Incorrect email or password. Please try again." };
      }
      if (error.message.includes("Email not confirmed")) {
        return {
          error:
            "Please verify your email before signing in. Check your inbox.",
        };
      }
      if (error.message.includes("rate limit")) {
        return {
          error: "Too many attempts. Please wait a moment and try again.",
        };
      }
      return { error: error.message };
    }

    return { user: data.user, session: data.session };
  } catch (err) {
    console.error("SignIn error:", err);
    return {
      error: "Unable to sign in. Please check your connection and try again.",
    };
  }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Sign out error:", error);
      return { error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error("SignOut error:", err);
    return { error: "Unable to sign out. Please try again." };
  }
}

/**
 * Get the current user with error handling
 */
export async function getCurrentUser() {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) {
      console.error("Get user error:", error);
      return null;
    }
    return user;
  } catch (err) {
    console.error("GetCurrentUser error:", err);
    return null;
  }
}

/**
 * Listen for auth state changes
 */
export function onAuthStateChange(callback) {
  try {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Handle different auth events
      if (event === "SIGNED_OUT") {
        callback(event, null);
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        callback(event, session);
      } else {
        callback(event, session);
      }
    });
    return () => subscription.unsubscribe();
  } catch (err) {
    console.error("Auth listener error:", err);
    return () => {}; // Return empty cleanup function
  }
}

/**
 * Get the current session
 */
export async function getSession() {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) {
      console.error("Get session error:", error);
      return null;
    }
    return session;
  } catch (err) {
    console.error("GetSession error:", err);
    return null;
  }
}

/**
 * Refresh the session token
 */
export async function refreshSession() {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.refreshSession();
    if (error) {
      console.error("Refresh session error:", error);
      return null;
    }
    return session;
  } catch (err) {
    console.error("RefreshSession error:", err);
    return null;
  }
}

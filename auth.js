const authPanel = document.getElementById("auth-panel");
const recoveryPanel = document.getElementById("recovery-panel");
const signupTab = document.getElementById("tab-signup");
const loginTab = document.getElementById("tab-login");
const showRecoveryButton = document.getElementById("show-recovery");
const backToAuthButton = document.getElementById("back-to-auth");
const authForm = document.getElementById("auth-form");
const recoveryForm = document.getElementById("recovery-form");
const sendCodeButton = document.getElementById("send-code");
const feedbackBox = document.getElementById("auth-feedback");
const authSubmit = document.getElementById("auth-submit");
const signupNameRow = document.getElementById("signup-name-row");
const confirmPasswordWrap = document.getElementById("confirm-password-wrap");
const termsWrap = document.getElementById("terms-wrap");
const linkedinLogin = document.getElementById("linkedin-login");
const authHeading = document.getElementById("auth-heading");
const authSubheading = document.getElementById("auth-subheading");
const googleFallback = document.getElementById("google-login-fallback");

let authMode = "signup";
let googleSignInReady = false;

function showFeedback(message, type) {
    const classes = {
        success: "border-emerald-400/30 bg-emerald-400/10 text-emerald-700",
        error: "border-rose-400/30 bg-rose-50 text-rose-700",
        info: "border-sky-300 bg-sky-50 text-sky-700"
    };

    feedbackBox.className = `auth-feedback ${classes[type] || classes.info}`;
    feedbackBox.textContent = message;
    feedbackBox.classList.remove("hidden");
}

function setMode(mode) {
    authMode = mode;
    const isSignup = mode === "signup";

    signupTab.classList.toggle("auth-tab-active", isSignup);
    loginTab.classList.toggle("auth-tab-active", !isSignup);
    signupTab.setAttribute("aria-selected", isSignup ? "true" : "false");
    loginTab.setAttribute("aria-selected", isSignup ? "false" : "true");

    signupNameRow.classList.toggle("hidden", !isSignup);
    confirmPasswordWrap.classList.toggle("hidden", !isSignup);
    termsWrap.classList.toggle("hidden", !isSignup);
    authSubmit.textContent = isSignup ? "Create Account" : "Log In";
    document.getElementById("auth-password").placeholder = isSignup ? "Create a password" : "Enter your password";
    authHeading.textContent = isSignup ? "Create your account" : "Log in to your account";
    authSubheading.textContent = isSignup
        ? "Create an account first to upload resumes, track scores, and save analysis history."
        : "Enter your email and password to continue to your dashboard and previous analyses.";
}

function showRecovery() {
    authPanel.classList.add("hidden");
    recoveryPanel.classList.remove("hidden");
    feedbackBox.classList.add("hidden");
}

function showAuth() {
    recoveryPanel.classList.add("hidden");
    authPanel.classList.remove("hidden");
    feedbackBox.classList.add("hidden");
}

function consumeOAuthRedirect() {
    const url = new URL(window.location.href);
    const token = url.searchParams.get("token");
    const oauthProvider = url.searchParams.get("oauth");

    if (!token || !oauthProvider) {
        return;
    }

    const user = {
        firstName: url.searchParams.get("firstName") || oauthProvider,
        lastName: url.searchParams.get("lastName") || "",
        email: url.searchParams.get("email") || "",
        provider: url.searchParams.get("provider") || oauthProvider
    };

    ResumeSmartAPI.setSession({ token, user });
    url.search = "";
    window.location.href = "dashboard.html";
}

async function handleGoogleCredentialResponse(response) {
    try {
        const data = await ResumeSmartAPI.request("/auth/google", {
            method: "POST",
            body: JSON.stringify({ credential: response.credential })
        });
        ResumeSmartAPI.setSession(data);
        window.location.href = "dashboard.html";
    } catch (error) {
        showFeedback(error.message, "error");
    }
}

function initializeGoogleSignIn() {
    const clientId = window.RESUMESMART_GOOGLE_CLIENT_ID;

    if (!clientId || !window.google || !google.accounts || !google.accounts.id) {
        googleFallback.classList.remove("hidden");
        googleSignInReady = false;
        return;
    }

    google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCredentialResponse,
        auto_select: false
    });

    googleFallback.classList.remove("hidden");
    googleSignInReady = true;
}

signupTab.addEventListener("click", () => setMode("signup"));
loginTab.addEventListener("click", () => setMode("login"));
showRecoveryButton.addEventListener("click", showRecovery);
backToAuthButton.addEventListener("click", showAuth);

authForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const firstName = document.getElementById("first-name").value.trim();
    const lastName = document.getElementById("last-name").value.trim();
    const email = document.getElementById("auth-email").value.trim().toLowerCase();
    const password = document.getElementById("auth-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;
    const acceptedTerms = document.getElementById("terms-checkbox").checked;

    if (!email || !password) {
        showFeedback("Enter your email and password to continue.", "error");
        return;
    }

    try {
        if (authMode === "signup") {
            if (!firstName || !lastName) {
                showFeedback("Add your first and last name to create the account.", "error");
                return;
            }
            if (password.length < 6) {
                showFeedback("Use a password with at least 6 characters.", "error");
                return;
            }
            if (password !== confirmPassword) {
                showFeedback("Password confirmation does not match.", "error");
                return;
            }
            if (!acceptedTerms) {
                showFeedback("Accept the terms to continue.", "error");
                return;
            }

            const data = await ResumeSmartAPI.request("/api/auth/signup", {
                method: "POST",
                body: JSON.stringify({ firstName, lastName, email, password })
            });
            ResumeSmartAPI.setSession(data);
            window.location.href = "dashboard.html";
            return;
        }

        const data = await ResumeSmartAPI.request("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password })
        });
        ResumeSmartAPI.setSession(data);
        window.location.href = "dashboard.html";
    } catch (error) {
        showFeedback(error.message, "error");
    }
});

sendCodeButton.addEventListener("click", async () => {
    const email = document.getElementById("reset-email").value.trim().toLowerCase();

    if (!email) {
        showFeedback("Enter the registered email first.", "error");
        return;
    }

    try {
        const data = await ResumeSmartAPI.request("/api/auth/forgot-password/request", {
            method: "POST",
            body: JSON.stringify({ email })
        });
        showFeedback(`Reset code generated for demo use: ${data.resetCode}`, "info");
    } catch (error) {
        showFeedback(error.message, "error");
    }
});

recoveryForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("reset-email").value.trim().toLowerCase();
    const code = document.getElementById("reset-code").value.trim();
    const newPassword = document.getElementById("new-password").value;
    const confirmNewPassword = document.getElementById("confirm-new-password").value;

    if (newPassword !== confirmNewPassword) {
        showFeedback("New password confirmation does not match.", "error");
        return;
    }

    try {
        await ResumeSmartAPI.request("/api/auth/forgot-password/reset", {
            method: "POST",
            body: JSON.stringify({ email, code, newPassword })
        });
        showAuth();
        setMode("login");
        document.getElementById("auth-email").value = email;
        showFeedback("Password updated. You can log in now.", "success");
    } catch (error) {
        showFeedback(error.message, "error");
    }
});

linkedinLogin.addEventListener("click", () => {
    if (!window.RESUMESMART_LINKEDIN_CLIENT_ID) {
        showFeedback("LinkedIn OAuth needs a valid LinkedIn client ID in auth.html and matching backend credentials to use real LinkedIn sign-in.", "info");
        return;
    }

    window.location.href = `${ResumeSmartAPI.baseUrl}/api/auth/linkedin/start`;
});

googleFallback.addEventListener("click", () => {
    if (!googleSignInReady || !window.google || !google.accounts || !google.accounts.id) {
        showFeedback("Google OAuth needs a valid Google client ID and backend verification to use the real account chooser.", "info");
        return;
    }

    google.accounts.id.disableAutoSelect();
    google.accounts.id.prompt();
});

setMode("signup");
consumeOAuthRedirect();
window.addEventListener("load", () => {
    initializeGoogleSignIn();
});

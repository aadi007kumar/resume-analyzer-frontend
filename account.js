const accountSession = JSON.parse(localStorage.getItem("resumeSmartSession") || "null");

if (!accountSession || !ResumeSmartAPI.getToken()) {
    window.location.href = "auth.html";
}

const accountFeedback = document.getElementById("account-feedback");

function showAccountFeedback(message, type = "info") {
    const classes = {
        success: "border-emerald-400/30 bg-emerald-400/10 text-emerald-700",
        error: "border-rose-400/30 bg-rose-50 text-rose-700",
        info: "border-sky-300 bg-sky-50 text-sky-700"
    };

    accountFeedback.className = `auth-feedback top-gap ${classes[type] || classes.info}`;
    accountFeedback.textContent = message;
    accountFeedback.classList.remove("hidden");
}

function setAvatar(avatarUrl, name) {
    const preview = document.getElementById("profile-avatar-preview");
    const previewFallback = document.getElementById("profile-avatar-fallback");
    const sidebarAvatar = document.getElementById("sidebar-avatar");
    const sidebarFallback = document.getElementById("sidebar-avatar-fallback");
    const initials = (name || "RS")
        .split(" ")
        .map((entry) => entry[0] || "")
        .join("")
        .slice(0, 2)
        .toUpperCase();

    previewFallback.textContent = initials;
    sidebarFallback.textContent = initials;

    if (avatarUrl) {
        const absoluteUrl = avatarUrl.startsWith("http") ? avatarUrl : `http://localhost:5000${avatarUrl}`;
        preview.src = absoluteUrl;
        sidebarAvatar.src = absoluteUrl;
        preview.classList.remove("hidden");
        sidebarAvatar.classList.remove("hidden");
        previewFallback.classList.add("hidden");
        sidebarFallback.classList.add("hidden");
    } else {
        preview.classList.add("hidden");
        sidebarAvatar.classList.add("hidden");
        previewFallback.classList.remove("hidden");
        sidebarFallback.classList.remove("hidden");
    }
}

function applyAccountUser(user) {
    const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || user.email;
    localStorage.setItem("resumeSmartSession", JSON.stringify(user));
    document.getElementById("sidebar-user-name").textContent = displayName;
    document.getElementById("sidebar-user-email").textContent = user.email;
    document.getElementById("account-first-name").value = user.firstName || "";
    document.getElementById("account-last-name").value = user.lastName || "";
    document.getElementById("account-email").value = user.email || "";
    document.getElementById("account-phone").value = user.phoneNumber || "";
    document.getElementById("member-since").textContent = user.memberSinceLabel || "--";
    setAvatar(user.avatarUrl, displayName);

    const phoneStatusBadge = document.getElementById("phone-status-badge");
    const verifiedIndicator = document.getElementById("phone-verified-indicator");
    if (user.phoneVerified) {
        phoneStatusBadge.textContent = "Phone Verified";
        verifiedIndicator.classList.remove("hidden");
    } else {
        phoneStatusBadge.textContent = "Phone Unverified";
        verifiedIndicator.classList.add("hidden");
    }
}

async function loadAccount() {
    try {
        const { user } = await ResumeSmartAPI.request("/api/auth/me");
        applyAccountUser(user);
    } catch (error) {
        if (error.message.toLowerCase().includes("token") || error.message.toLowerCase().includes("authentication")) {
            ResumeSmartAPI.clearSession();
            window.location.href = "auth.html";
            return;
        }
        showAccountFeedback(error.message, "error");
    }
}

document.getElementById("profile-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
        const data = await ResumeSmartAPI.request("/api/auth/profile", {
            method: "PATCH",
            body: JSON.stringify({
                firstName: document.getElementById("account-first-name").value.trim(),
                lastName: document.getElementById("account-last-name").value.trim(),
                phoneNumber: document.getElementById("account-phone").value.trim()
            })
        });
        const currentUser = JSON.parse(localStorage.getItem("resumeSmartSession") || "{}");
        applyAccountUser({ ...currentUser, ...data.user });
        showAccountFeedback(data.message, "success");
    } catch (error) {
        showAccountFeedback(error.message, "error");
    }
});

document.getElementById("avatar-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const avatarFile = document.getElementById("avatar-file").files[0];
    if (!avatarFile) {
        showAccountFeedback("Select an image first.", "error");
        return;
    }

    const formData = new FormData();
    formData.append("avatar", avatarFile);

    try {
        const data = await ResumeSmartAPI.request("/api/auth/avatar", {
            method: "POST",
            body: formData
        });
        const currentUser = JSON.parse(localStorage.getItem("resumeSmartSession") || "{}");
        applyAccountUser({ ...currentUser, avatarUrl: data.avatarUrl });
        showAccountFeedback(data.message, "success");
    } catch (error) {
        showAccountFeedback(error.message, "error");
    }
});

document.getElementById("request-phone-otp").addEventListener("click", async () => {
    const phoneNumber = document.getElementById("account-phone").value.trim();

    if (!phoneNumber) {
        showAccountFeedback("Add a phone number first.", "error");
        return;
    }

    try {
        const data = await ResumeSmartAPI.request("/api/auth/phone/request-otp", {
            method: "POST",
            body: JSON.stringify({ phoneNumber })
        });
        document.getElementById("otp-card").classList.remove("hidden");
        document.getElementById("otp-helper").textContent = `Demo OTP generated: ${data.otpCode}`;
        showAccountFeedback("OTP generated for phone verification.", "info");
    } catch (error) {
        showAccountFeedback(error.message, "error");
    }
});

document.getElementById("verify-phone-otp").addEventListener("click", async () => {
    const phoneNumber = document.getElementById("account-phone").value.trim();
    const code = document.getElementById("phone-otp-input").value.trim();

    try {
        await ResumeSmartAPI.request("/api/auth/phone/verify-otp", {
            method: "POST",
            body: JSON.stringify({ phoneNumber, code })
        });
        const currentUser = JSON.parse(localStorage.getItem("resumeSmartSession") || "{}");
        applyAccountUser({ ...currentUser, phoneNumber, phoneVerified: true });
        document.getElementById("otp-helper").textContent = "Phone number verified successfully.";
        showAccountFeedback("Phone number verified.", "success");
    } catch (error) {
        showAccountFeedback(error.message, "error");
    }
});

document.getElementById("delete-account-button").addEventListener("click", async () => {
    const shouldDelete = window.confirm("Delete this account and all saved analyses?");
    if (!shouldDelete) {
        return;
    }

    try {
        await ResumeSmartAPI.request("/api/auth/account", { method: "DELETE" });
        ResumeSmartAPI.clearSession();
        window.location.href = "auth.html";
    } catch (error) {
        showAccountFeedback(error.message, "error");
    }
});

document.getElementById("logout-button").addEventListener("click", () => {
    ResumeSmartAPI.clearSession();
    window.location.href = "auth.html";
});

loadAccount();

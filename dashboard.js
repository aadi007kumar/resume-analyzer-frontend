const session = JSON.parse(localStorage.getItem("resumeSmartSession") || "null");

if (!session || !ResumeSmartAPI.getToken()) {
    window.location.href = "auth.html";
} else {
    loadDashboard();
}

function setAvatar(avatarUrl, name) {
    const sidebarAvatar = document.getElementById("sidebar-avatar");
    const sidebarFallback = document.getElementById("sidebar-avatar-fallback");
    const initials = (name || "RS")
        .split(" ")
        .map((entry) => entry[0] || "")
        .join("")
        .slice(0, 2)
        .toUpperCase();

    sidebarFallback.textContent = initials;

    if (avatarUrl) {
        const absoluteUrl = avatarUrl.startsWith("http") ? avatarUrl : `http://localhost:5000${avatarUrl}`;
        sidebarAvatar.src = absoluteUrl;
        sidebarAvatar.classList.remove("hidden");
        sidebarFallback.classList.add("hidden");
    } else {
        sidebarAvatar.classList.add("hidden");
        sidebarFallback.classList.remove("hidden");
    }
}

function applyUserToUI(user) {
    const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || user.email;

    document.getElementById("welcome-heading").textContent = `Welcome back, ${displayName}`;
    document.getElementById("profile-name").textContent = displayName;
    document.getElementById("profile-email").textContent = user.email;
    document.getElementById("profile-provider").textContent = user.provider || "Email";
    document.getElementById("member-since").textContent = user.memberSinceLabel || "--";
    document.getElementById("profile-phone").textContent = user.phoneNumber || "Not added";
    document.getElementById("sidebar-user-name").textContent = displayName;
    document.getElementById("sidebar-user-email").textContent = user.email;
    setAvatar(user.avatarUrl, displayName);

    const phoneStatusBadge = document.getElementById("phone-status-badge");
    const phoneVerifiedIndicator = document.getElementById("phone-verified-indicator");
    if (user.phoneVerified) {
        phoneStatusBadge.textContent = "Phone Verified";
        phoneVerifiedIndicator.classList.remove("hidden");
    } else {
        phoneStatusBadge.textContent = "Phone Unverified";
        phoneVerifiedIndicator.classList.add("hidden");
    }
}

async function loadDashboard() {
    try {
        const [{ user }, { analyses }] = await Promise.all([
            ResumeSmartAPI.request("/auth/me"),
            ResumeSmartAPI.request("/analyses")
        ]);

        localStorage.setItem("resumeSmartSession", JSON.stringify(user));
        applyUserToUI(user);

        document.getElementById("analysis-count").textContent = analyses.length;
        const averageScore = analyses.length
            ? Math.round(analyses.reduce((sum, analysis) => sum + analysis.overallScore, 0) / analyses.length)
            : 0;
        document.getElementById("average-score").textContent = averageScore;

        const improvementCount = analyses.reduce((sum, analysis) => sum + (analysis.improvements?.length || 0), 0);
        document.getElementById("improvement-count").textContent = improvementCount;

        const recentAnalysesContainer = document.getElementById("recent-analyses");
        if (!analyses.length) {
            recentAnalysesContainer.innerHTML = `
                <div class="empty-state">
                    <p class="empty-state-title">No analyses yet</p>
                    <p class="empty-state-text">Upload your first resume to populate the dashboard and results history.</p>
                </div>
            `;
        } else {
            recentAnalysesContainer.innerHTML = analyses.slice(0, 5).map((analysis) => `
                <article class="history-card light-history-card">
                    <div>
                        <p class="history-kicker">${analysis.targetRole}</p>
                        <h3 class="history-title">${analysis.fileName}</h3>
                        <p class="history-copy">Uploaded for ${analysis.companyName || "general applications"} on ${analysis.createdAtLabel}</p>
                    </div>
                    <div class="history-actions">
                        <span class="site-score-pill">${analysis.overallScore}/100</span>
                        <button type="button" class="secondary-action history-open" data-analysis-id="${analysis.id}">View Report</button>
                    </div>
                </article>
            `).join("");

            document.querySelectorAll(".history-open").forEach((button) => {
                button.addEventListener("click", () => {
                    localStorage.setItem("resumeSmartCurrentAnalysisId", button.dataset.analysisId);
                    window.location.href = "results.html";
                });
            });
        }
    } catch (error) {
        if (error.message.toLowerCase().includes("token") || error.message.toLowerCase().includes("authentication")) {
            ResumeSmartAPI.clearSession();
            window.location.href = "auth.html";
            return;
        }
        console.error(error);
    }
}

document.getElementById("logout-button").addEventListener("click", () => {
    ResumeSmartAPI.clearSession();
    window.location.href = "auth.html";
});

const resultsSession = JSON.parse(localStorage.getItem("resumeSmartSession") || "null");

if (!resultsSession || !ResumeSmartAPI.getToken()) {
    window.location.href = "auth.html";
} else {
    loadResults();
}

async function loadResults() {
    const currentAnalysisId = localStorage.getItem("resumeSmartCurrentAnalysisId");
    const emptyResults = document.getElementById("empty-results");
    const resultsContent = document.getElementById("results-content");

    try {
        const path = currentAnalysisId ? `/analyses/${currentAnalysisId}` : "/analyses/latest";
        const { analysis: currentAnalysis } = await ResumeSmartAPI.request(path);

        resultsContent.classList.remove("hidden");
        document.getElementById("result-title").textContent = `${currentAnalysis.targetRole} resume report`;
        document.getElementById("result-subtitle").textContent = currentAnalysis.summary;
        document.getElementById("snapshot-file").textContent = currentAnalysis.fileName;
        document.getElementById("snapshot-role").textContent = currentAnalysis.targetRole;
        document.getElementById("snapshot-company").textContent = currentAnalysis.companyName || "General applications";
        document.getElementById("snapshot-date").textContent = currentAnalysis.createdAtLabel;

        const scores = [
            ["overall-score", "overall-bar", currentAnalysis.overallScore],
            ["ats-score", "ats-bar", currentAnalysis.atsScore],
            ["role-score", "role-bar", currentAnalysis.roleMatch],
            ["clarity-score", "clarity-bar", currentAnalysis.clarityScore]
        ];

        scores.forEach(([scoreId, barId, value]) => {
            document.getElementById(scoreId).textContent = `${value}/100`;
            document.getElementById(barId).style.width = `${value}%`;
        });

        document.getElementById("analysis-summary").textContent = currentAnalysis.summary;
        document.getElementById("skills-list").innerHTML = currentAnalysis.skills.map((skill) => `
            <span class="site-pill">${skill}</span>
        `).join("");

        document.getElementById("ats-checklist").innerHTML = currentAnalysis.atsChecklist.map((item) => `
            <div class="site-info-row">
                <span>${item.label}</span>
                <strong>${item.status}</strong>
            </div>
        `).join("");

        document.getElementById("strengths-list").innerHTML = currentAnalysis.strengths.map((item) => `
            <li class="site-info-row"><span>${item}</span></li>
        `).join("");

        document.getElementById("improvements-list").innerHTML = currentAnalysis.improvements.map((item) => `
            <li class="site-info-row"><span>${item}</span></li>
        `).join("");

        document.getElementById("next-steps-list").innerHTML = currentAnalysis.nextSteps.map((item) => `
            <li class="site-info-row"><span>${item}</span></li>
        `).join("");
    } catch (error) {
        if (error.message.toLowerCase().includes("no analyses") || error.message.toLowerCase().includes("not found")) {
            emptyResults.classList.remove("hidden");
            return;
        }
        if (error.message.toLowerCase().includes("authentication") || error.message.toLowerCase().includes("token")) {
            ResumeSmartAPI.clearSession();
            window.location.href = "auth.html";
            return;
        }
        console.error(error);
        emptyResults.classList.remove("hidden");
    }
}

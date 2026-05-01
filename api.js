const ResumeSmartAPI = (() => {
    const baseUrl = window.RESUMESMART_API_BASE_URL || "http://localhost:5000/api";

    function getToken() {
        return localStorage.getItem("resumeSmartToken") || "";
    }

    function setSession(authPayload) {
        localStorage.setItem("resumeSmartToken", authPayload.token);
        localStorage.setItem("resumeSmartSession", JSON.stringify(authPayload.user));
    }

    function clearSession() {
        localStorage.removeItem("resumeSmartToken");
        localStorage.removeItem("resumeSmartSession");
        localStorage.removeItem("resumeSmartCurrentAnalysisId");
    }

    async function request(path, options = {}) {
        const headers = new Headers(options.headers || {});
        const token = getToken();

        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }

        if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
            headers.set("Content-Type", "application/json");
        }

        const response = await fetch(`${baseUrl}${path}`, {
            ...options,
            headers
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.message || "Request failed.");
        }

        return data;
    }

    return {
        baseUrl,
        getToken,
        setSession,
        clearSession,
        request
    };
})();

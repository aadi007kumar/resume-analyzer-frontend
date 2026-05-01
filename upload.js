const uploadSession = JSON.parse(localStorage.getItem("resumeSmartSession") || "null");

if (!uploadSession || !ResumeSmartAPI.getToken()) {
    window.location.href = "auth.html";
} else {
    initializeUploadPage();
}

function initializeUploadPage() {
    const uploadForm = document.getElementById("upload-form");
    const fileInput = document.getElementById("resume-file");
    const filePreview = document.getElementById("file-preview");
    const fileNameElement = document.getElementById("file-name");
    const fileMetaElement = document.getElementById("file-meta");
    const removeFileButton = document.getElementById("remove-file");
    const feedbackElement = document.getElementById("upload-feedback");
    const progressBar = document.getElementById("progress-bar");
    const progressPercent = document.getElementById("progress-percent");
    const progressText = document.getElementById("progress-text");
    const dropzone = document.getElementById("dropzone");

    let selectedFile = null;

    function showUploadFeedback(message, type) {
        const classes = {
            success: "border-emerald-400/30 bg-emerald-400/10 text-emerald-700",
            error: "border-rose-400/30 bg-rose-50 text-rose-700",
            info: "border-sky-300 bg-sky-50 text-sky-700"
        };

        feedbackElement.className = `auth-feedback ${classes[type] || classes.info}`;
        feedbackElement.textContent = message;
        feedbackElement.classList.remove("hidden");
    }

    function setProgress(value, message) {
        progressBar.style.width = `${value}%`;
        progressPercent.textContent = `${value}%`;
        progressText.textContent = message;
    }

    function formatFileSize(bytes) {
        if (bytes < 1024 * 1024) {
            return `${Math.round(bytes / 1024)} KB`;
        }
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    function setSelectedFile(file) {
        selectedFile = file;
        fileNameElement.textContent = file.name;
        fileMetaElement.textContent = `${formatFileSize(file.size)} | ${file.type || "Document file"}`;
        filePreview.classList.remove("hidden");
        showUploadFeedback("Resume attached. Add role context and start analysis when ready.", "info");
    }

    function clearSelectedFile() {
        selectedFile = null;
        fileInput.value = "";
        filePreview.classList.add("hidden");
        feedbackElement.classList.add("hidden");
        setProgress(0, "Waiting for a resume upload.");
    }

    fileInput.addEventListener("change", (event) => {
        const [file] = event.target.files;
        if (file) {
            setSelectedFile(file);
        }
    });

    removeFileButton.addEventListener("click", clearSelectedFile);

    dropzone.addEventListener("dragover", (event) => {
        event.preventDefault();
        dropzone.classList.add("dropzone-active");
    });

    dropzone.addEventListener("dragleave", () => {
        dropzone.classList.remove("dropzone-active");
    });

    dropzone.addEventListener("drop", (event) => {
        event.preventDefault();
        dropzone.classList.remove("dropzone-active");
        const [file] = event.dataTransfer.files;
        if (file) {
            setSelectedFile(file);
        }
    });

    uploadForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const targetRole = document.getElementById("target-role").value.trim();
        const companyName = document.getElementById("company-name").value.trim();
        const jobDescription = document.getElementById("job-description").value.trim();

        if (!targetRole) {
            showUploadFeedback("Add the target role before starting analysis.", "error");
            return;
        }
        if (!selectedFile) {
            showUploadFeedback("Attach a resume file before continuing.", "error");
            return;
        }

        const formData = new FormData();
        formData.append("resume", selectedFile);
        formData.append("targetRole", targetRole);
        formData.append("companyName", companyName);
        formData.append("jobDescription", jobDescription);

        try {
            setProgress(20, "Uploading resume...");
            showUploadFeedback("Resume received. Sending it to the backend now.", "info");

            const data = await ResumeSmartAPI.request("/analyses", {
                method: "POST",
                body: formData
            });

            localStorage.setItem("resumeSmartCurrentAnalysisId", data.analysis.id);
            setProgress(100, "Analysis complete. Redirecting to results...");
            showUploadFeedback("Analysis complete. Opening your report.", "success");

            setTimeout(() => {
                window.location.href = "results.html";
            }, 500);
        } catch (error) {
            showUploadFeedback(error.message, "error");
        }
    });
}

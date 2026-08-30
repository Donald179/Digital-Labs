(function () {
    "use strict";

    const api = window.AppSupabase || {};
    const utils = window.AppUtils || {};
    const render = window.AppRender || {};
    let downloads = [];

    function fillFilters() {
        const categorySelect = document.getElementById("downloadCategory");
        const platformSelect = document.getElementById("downloadPlatform");
        const categories = [...new Set(downloads.map((item) => item.category).filter(Boolean))].sort();
        const platforms = [...new Set(downloads.map((item) => item.platform).filter(Boolean))].sort();
        if (categorySelect) categorySelect.innerHTML = `<option value="">Toutes</option>${categories.map((value) => `<option value="${utils.escapeHTML(value)}">${utils.escapeHTML(value)}</option>`).join("")}`;
        if (platformSelect) platformSelect.innerHTML = `<option value="">Toutes</option>${platforms.map((value) => `<option value="${utils.escapeHTML(value)}">${utils.escapeHTML(value)}</option>`).join("")}`;
    }

    function renderDownloads() {
        const host = document.getElementById("downloadsGrid");
        const count = document.getElementById("downloadCount");
        if (!host) return;
        const search = (document.getElementById("downloadSearch")?.value || "").toLowerCase().trim();
        const category = document.getElementById("downloadCategory")?.value || "";
        const platform = document.getElementById("downloadPlatform")?.value || "";
        const filtered = downloads.filter((item) => {
            const haystack = `${item.name} ${item.description} ${item.category} ${item.platform} ${item.version}`.toLowerCase();
            return (!search || haystack.includes(search)) && (!category || item.category === category) && (!platform || item.platform === platform);
        });
        if (count) count.textContent = `${filtered.length} élément${filtered.length > 1 ? "s" : ""}`;
        host.innerHTML = filtered.length ? filtered.map(render.renderDownloadCard).join("") : utils.renderEmptyState("Aucun téléchargement actif actuellement. Ajoutez uniquement des logiciels distribuables légalement dans Supabase.");
    }

    async function initDownloads() {
        const host = document.getElementById("downloadsGrid");
        if (!host) return;
        host.innerHTML = `<div class="col-12"><div class="skeleton-line"></div></div>`;
        try {
            downloads = api.configured ? await api.fetchDownloads() : [];
        } catch (error) {
            console.error(error);
            utils.showToast("Les téléchargements ne peuvent pas être chargés.", "error");
            downloads = [];
        }
        fillFilters();
        renderDownloads();
    }

    document.addEventListener("DOMContentLoaded", () => {
        if (!document.getElementById("downloadsPage")) return;
        initDownloads();
        const debounced = utils.debounce(renderDownloads, 180);
        document.getElementById("downloadSearch")?.addEventListener("input", debounced);
        document.getElementById("downloadCategory")?.addEventListener("change", renderDownloads);
        document.getElementById("downloadPlatform")?.addEventListener("change", renderDownloads);
        document.getElementById("resetDownloadFilters")?.addEventListener("click", () => {
            document.getElementById("downloadSearch").value = "";
            document.getElementById("downloadCategory").value = "";
            document.getElementById("downloadPlatform").value = "";
            renderDownloads();
        });
    });
})();
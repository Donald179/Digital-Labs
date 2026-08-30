(function () {
    "use strict";

    const cfg = window.AppConfig || {};
    const api = window.AppSupabase || {};
    const utils = window.AppUtils || {};
    const render = window.AppRender || {};
    let services = [];

    function hydrateFilters() {
        const select = document.getElementById("serviceCategory");
        if (!select) return;
        const categories = [...new Set(services.map((item) => item.category).filter(Boolean))].sort();
        select.innerHTML = `<option value="">Toutes les catégories</option>${categories.map((category) => `<option value="${utils.escapeHTML(category)}">${utils.escapeHTML(category)}</option>`).join("")}`;
    }

    function renderServices() {
        const host = document.getElementById("servicesGrid");
        const count = document.getElementById("serviceCount");
        const search = (document.getElementById("serviceSearch")?.value || "").toLowerCase().trim();
        const category = document.getElementById("serviceCategory")?.value || "";
        const filtered = services.filter((service) => {
            const haystack = `${service.title} ${service.description} ${service.category} ${service.platform}`.toLowerCase();
            return (!search || haystack.includes(search)) && (!category || service.category === category);
        });
        if (count) count.textContent = `${filtered.length} service${filtered.length > 1 ? "s" : ""}`;
        if (!host) return;
        host.innerHTML = filtered.length ? filtered.map((service) => render.renderServiceCard(service, false)).join("") : utils.renderEmptyState("Aucun service ne correspond à votre recherche.");
    }

    async function initServices() {
        const host = document.getElementById("servicesGrid");
        if (!host) return;
        host.innerHTML = `<div class="col-12"><div class="skeleton-line"></div></div>`;
        try {
            const remote = api.configured ? await api.fetchActiveServices() : [];
            services = remote.length ? remote : (cfg.DEFAULT_SERVICES || []);
        } catch (error) {
            console.error(error);
            utils.showToast("Les services distants ne peuvent pas être chargés. Les services de base sont affichés.", "warning");
            services = cfg.DEFAULT_SERVICES || [];
        }
        hydrateFilters();
        renderServices();
    }

    document.addEventListener("DOMContentLoaded", () => {
        if (!document.getElementById("servicesPage")) return;
        initServices();
        const rerender = utils.debounce(renderServices, 180);
        document.getElementById("serviceSearch")?.addEventListener("input", rerender);
        document.getElementById("serviceCategory")?.addEventListener("change", renderServices);
        document.getElementById("resetServiceFilters")?.addEventListener("click", () => {
            document.getElementById("serviceSearch").value = "";
            document.getElementById("serviceCategory").value = "";
            renderServices();
        });
    });
})();
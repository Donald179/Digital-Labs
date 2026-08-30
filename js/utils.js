(function () {
    "use strict";

    const htmlMap = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    };

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, (char) => htmlMap[char]);
    }

    function sanitizeHTML(dirty) {
        const allowedTags = new Set(["P", "BR", "STRONG", "B", "EM", "I", "UL", "OL", "LI", "A", "H2", "H3", "H4", "BLOCKQUOTE", "CODE", "PRE"]);
        const template = document.createElement("template");
        template.innerHTML = String(dirty ?? "");

        function cleanNode(node) {
            Array.from(node.children).forEach((child) => {
                if (!allowedTags.has(child.tagName)) {
                    child.replaceWith(document.createTextNode(child.textContent || ""));
                    return;
                }

                Array.from(child.attributes).forEach((attribute) => {
                    const attrName = attribute.name.toLowerCase();
                    if (child.tagName === "A" && attrName === "href") {
                        const href = attribute.value.trim();
                        if (/^(https?:|mailto:|tel:)/i.test(href)) {
                            child.setAttribute("rel", "noopener noreferrer");
                            if (/^https?:/i.test(href)) child.setAttribute("target", "_blank");
                            return;
                        }
                    }
                    child.removeAttribute(attribute.name);
                });

                cleanNode(child);
            });
        }

        cleanNode(template.content);
        return template.innerHTML;
    }

    function formatDate(value) {
        if (!value) return "";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";
        return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(date);
    }

    function formatPrice(price, currency) {
        if (price === null || price === undefined || price === "") return "Prix sur demande";
        const number = Number(price);
        if (Number.isNaN(number)) return "Prix sur demande";
        return `${new Intl.NumberFormat("fr-FR").format(number)} ${escapeHTML(currency || "FCFA")}`;
    }

    function showToast(message, type = "success") {
        const host = document.getElementById("toastHost");
        if (!host) return;
        const toast = document.createElement("div");
        const bg = type === "error" ? "text-bg-danger" : type === "warning" ? "text-bg-warning" : "text-bg-success";
        toast.className = `toast custom-toast align-items-center ${bg} border-0`;
        toast.setAttribute("role", "status");
        toast.setAttribute("aria-live", "polite");
        toast.setAttribute("aria-atomic", "true");
        toast.innerHTML = `<div class="d-flex"><div class="toast-body"></div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Fermer"></button></div>`;
        toast.querySelector(".toast-body").textContent = message;
        host.appendChild(toast);
        if (window.bootstrap?.Toast) {
            const instance = new window.bootstrap.Toast(toast, { delay: 4500 });
            toast.addEventListener("hidden.bs.toast", () => toast.remove());
            instance.show();
        } else {
            setTimeout(() => toast.remove(), 4500);
        }
    }

    function setButtonLoading(button, isLoading, loadingText = "Chargement...") {
        if (!button) return;
        if (isLoading) {
            button.dataset.originalText = button.textContent;
            button.disabled = true;
            button.textContent = loadingText;
        } else {
            button.disabled = false;
            button.textContent = button.dataset.originalText || button.textContent;
        }
    }

    function buildWhatsAppLink(message) {
        const number = (window.AppConfig?.WHATSAPP_NUMBER || "").replace(/[^0-9]/g, "");
        if (!number) return "";
        return `https://wa.me/${number}?text=${encodeURIComponent(message || "Bonjour, je souhaite obtenir une assistance informatique.")}`;
    }

    function debounce(fn, delay = 250) {
        let timer;
        return (...args) => {
            window.clearTimeout(timer);
            timer = window.setTimeout(() => fn.apply(null, args), delay);
        };
    }

    function renderEmptyState(message) {
        return `<div class="col-12"><div class="empty-state">${escapeHTML(message)}</div></div>`;
    }

    function stripTags(value) {
        return String(value ?? "").replace(/<[^>]*>?/g, "").trim();
    }

    function localRateLimit(key, limit, windowMs) {
        const now = Date.now();
        const storageKey = `rate:${key}`;
        const raw = localStorage.getItem(storageKey);
        const entries = raw ? JSON.parse(raw).filter((time) => now - time < windowMs) : [];
        if (entries.length >= limit) return false;
        entries.push(now);
        localStorage.setItem(storageKey, JSON.stringify(entries));
        return true;
    }

    function getCanonicalUrl(path = "") {
        const base = window.AppConfig?.SITE_URL || window.location.origin;
        return new URL(path || window.location.pathname + window.location.search, base).toString();
    }

    window.AppUtils = {
        escapeHTML,
        sanitizeHTML,
        formatDate,
        formatPrice,
        showToast,
        setButtonLoading,
        buildWhatsAppLink,
        debounce,
        renderEmptyState,
        stripTags,
        localRateLimit,
        getCanonicalUrl
    };
})();
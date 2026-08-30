(function () {
    "use strict";

    const cfg = window.AppConfig || {};
    const api = window.AppSupabase || {};
    const utils = window.AppUtils || {};

    function setText(selector, value) {
        document.querySelectorAll(selector).forEach((element) => {
            element.textContent = value;
        });
    }

    function initGlobalContent() {
        setText(".js-site-name", cfg.SITE_NAME || "Services Informatiques en Ligne");
        setText(".js-location", cfg.LOCATION || "Bobo-Dioulasso, secteur 18");
        const year = document.getElementById("currentYear");
        if (year) year.textContent = String(new Date().getFullYear());
    }

    function initActiveNav() {
        const path = window.location.pathname.split("/").pop() || "index.html";
        document.querySelectorAll(".nav-link").forEach((link) => {
            const href = link.getAttribute("href") || "";
            const target = href.split("/").pop();
            const blogArticle = path === "article.html" && target === "blog.html";
            if (target === path || blogArticle) link.classList.add("active");
        });
    }

    function initNavbarMotion() {
        const nav = document.querySelector(".site-navbar");
        if (!nav) return;
        const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 12);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
    }

    function initReveal() {
        const items = document.querySelectorAll(".reveal");
        if (!items.length || !window.IntersectionObserver) {
            items.forEach((item) => item.classList.add("is-visible"));
            return;
        }
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.14 });
        items.forEach((item) => observer.observe(item));
    }

    function initContactLinks() {
        const whatsappMessage = "Bonjour, je souhaite obtenir une assistance informatique.";
        const whatsAppHref = utils.buildWhatsAppLink ? utils.buildWhatsAppLink(whatsappMessage) : "";
        document.querySelectorAll(".js-whatsapp").forEach((link) => {
            const customMessage = link.dataset.message || whatsappMessage;
            const href = utils.buildWhatsAppLink ? utils.buildWhatsAppLink(customMessage) : "";
            link.href = href || "contact.html";
            if (href) link.setAttribute("target", "_blank");
        });

        const whatsapp = document.querySelector(".js-contact-whatsapp");
        if (whatsapp) {
            whatsapp.textContent = cfg.WHATSAPP_NUMBER || "À renseigner";
            whatsapp.href = whatsAppHref || "#";
            if (whatsAppHref) whatsapp.setAttribute("target", "_blank");
            if (!whatsAppHref) whatsapp.setAttribute("aria-disabled", "true");
        }

        const phone = document.querySelector(".js-contact-phone");
        if (phone) {
            phone.textContent = cfg.PHONE_NUMBER || "À renseigner";
            phone.href = cfg.PHONE_NUMBER ? `tel:${cfg.PHONE_NUMBER.replace(/\s/g, "")}` : "#";
            if (!cfg.PHONE_NUMBER) phone.setAttribute("aria-disabled", "true");
        }

        const email = document.querySelector(".js-contact-email");
        if (email) {
            email.textContent = cfg.CONTACT_EMAIL || "À renseigner";
            email.href = cfg.CONTACT_EMAIL ? `mailto:${cfg.CONTACT_EMAIL}` : "#";
            if (!cfg.CONTACT_EMAIL) email.setAttribute("aria-disabled", "true");
        }
    }

    function serviceIcon(category) {
        const key = String(category || "").toLowerCase();
        if (key.includes("sécurité") || key.includes("securite")) return "bi-shield-lock";
        if (key.includes("système") || key.includes("systeme")) return "bi-pc-display";
        if (key.includes("dépannage") || key.includes("depannage")) return "bi-tools";
        if (key.includes("téléchargement") || key.includes("telechargement")) return "bi-download";
        return "bi-window-stack";
    }

    function renderServiceCard(service, compact = false) {
        const message = `Bonjour, je souhaite obtenir des informations concernant : ${service.title}`;
        const whatsapp = utils.buildWhatsAppLink ? utils.buildWhatsAppLink(message) : "";
        const contactHref = `contact.html?service=${encodeURIComponent(service.slug || service.id || "")}`;
        const orderHref = whatsapp || contactHref;
        const target = whatsapp ? " target=\"_blank\" rel=\"noopener noreferrer\"" : "";
        return `
            <div class="col-md-6 ${compact ? "col-xl-4" : "col-lg-4"} reveal is-visible">
                <article class="service-card">
                    <span class="service-icon"><i class="bi ${serviceIcon(service.category)}" aria-hidden="true"></i></span>
                    <div class="d-flex flex-wrap gap-2 mb-3">
                        <span class="badge-soft">${utils.escapeHTML(service.category || "Service")}</span>
                        <span class="badge-soft">${utils.escapeHTML(service.platform || "En ligne")}</span>
                    </div>
                    <h3>${utils.escapeHTML(service.title)}</h3>
                    <p>${utils.escapeHTML(service.description)}</p>
                    <span class="price-tag"><i class="bi bi-cash-coin" aria-hidden="true"></i>${utils.formatPrice(service.price, service.currency || cfg.DEFAULT_CURRENCY)}</span>
                    <div class="d-flex flex-column flex-sm-row gap-2 mt-3">
                        <a class="btn btn-primary btn-sm" href="${orderHref}"${target}>Commander</a>
                        <a class="btn btn-secondary btn-sm" href="${contactHref}">Contacter</a>
                    </div>
                </article>
            </div>`;
    }

    function renderArticleCard(post, nested = false) {
        const base = nested ? "article.html" : "blog/article.html";
        const href = `${base}?slug=${encodeURIComponent(post.slug || "")}`;
        const image = post.featured_image || "https://images.pexels.com/photos/7709171/pexels-photo-7709171.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=360&w=640";
        return `
            <div class="col-md-6 col-xl-4 reveal is-visible">
                <article class="article-card">
                    <img class="article-image" src="${utils.escapeHTML(image)}" alt="${utils.escapeHTML(post.title || "Article informatique")}" loading="lazy" width="640" height="360">
                    <div class="meta-line mb-2"><span>${utils.escapeHTML(post.category || "Conseil")}</span><span>${utils.escapeHTML(utils.formatDate(post.published_at))}</span></div>
                    <h3 class="h5 fw-bold">${utils.escapeHTML(post.title)}</h3>
                    <p>${utils.escapeHTML(post.excerpt || "")}</p>
                    <a class="btn btn-secondary btn-sm" href="${href}">Lire l'article</a>
                </article>
            </div>`;
    }

    function renderDownloadCard(download) {
        const href = download.file_url || download.website_url || "";
        const disabled = href ? "" : " disabled aria-disabled=\"true\"";
        return `
            <div class="col-md-6 col-xl-4 reveal is-visible">
                <article class="download-card">
                    <span class="download-icon">${download.icon_url ? `<img src="${utils.escapeHTML(download.icon_url)}" alt="" loading="lazy" width="32" height="32">` : `<i class="bi bi-download" aria-hidden="true"></i>`}</span>
                    <div class="d-flex flex-wrap gap-2 mb-3">
                        <span class="badge-soft">${utils.escapeHTML(download.category || "Logiciel")}</span>
                        <span class="badge-soft">${utils.escapeHTML(download.platform || "Toutes")}</span>
                    </div>
                    <h3>${utils.escapeHTML(download.name)}</h3>
                    <p>${utils.escapeHTML(download.description || "")}</p>
                    <p class="meta-line">${download.version ? `Version ${utils.escapeHTML(download.version)}` : "Version à vérifier sur le site officiel"}</p>
                    <a class="btn btn-primary btn-sm mt-2${disabled ? " disabled" : ""}" href="${utils.escapeHTML(href)}" target="_blank" rel="noopener noreferrer"${disabled}>Télécharger</a>
                </article>
            </div>`;
    }

    async function initHomeData() {
        const serviceHost = document.getElementById("homeServices");
        const blogHost = document.getElementById("homeBlogPosts");
        const downloadHost = document.getElementById("homeDownloads");

        if (serviceHost) {
            try {
                const services = api.configured ? await api.fetchActiveServices() : [];
                const data = services.length ? services : (cfg.DEFAULT_SERVICES || []);
                serviceHost.innerHTML = data.slice(0, 3).map((service) => renderServiceCard(service, true)).join("");
            } catch (error) {
                console.error(error);
                serviceHost.innerHTML = (cfg.DEFAULT_SERVICES || []).slice(0, 3).map((service) => renderServiceCard(service, true)).join("");
            }
        }

        if (blogHost) {
            try {
                const posts = api.configured ? await api.fetchLatestPosts(3) : [];
                blogHost.innerHTML = posts.length ? posts.map((post) => renderArticleCard(post)).join("") : utils.renderEmptyState("Aucun article publié actuellement. Les articles publiés dans Supabase apparaîtront ici.");
            } catch (error) {
                console.error(error);
                blogHost.innerHTML = utils.renderEmptyState("Les articles ne peuvent pas être chargés pour le moment.");
            }
        }

        if (downloadHost) {
            try {
                const downloads = api.configured ? await api.fetchDownloads() : [];
                downloadHost.innerHTML = downloads.length ? downloads.slice(0, 3).map(renderDownloadCard).join("") : utils.renderEmptyState("Aucun téléchargement actif actuellement. Ajoutez uniquement des logiciels autorisés depuis Supabase.");
            } catch (error) {
                console.error(error);
                downloadHost.innerHTML = utils.renderEmptyState("Les téléchargements ne peuvent pas être chargés pour le moment.");
            }
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        initGlobalContent();
        initActiveNav();
        initNavbarMotion();
        initReveal();
        initContactLinks();
        initHomeData();
    });

    window.AppRender = { renderServiceCard, renderArticleCard, renderDownloadCard };
})();
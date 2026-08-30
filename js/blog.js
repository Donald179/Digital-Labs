(function () {
    "use strict";

    const cfg = window.AppConfig || {};
    const api = window.AppSupabase || {};
    const utils = window.AppUtils || {};
    const render = window.AppRender || {};
    let posts = [];
    let page = 1;
    const pageSize = 9;

    function updateCategoryFilter(items) {
        const select = document.getElementById("blogCategory");
        if (!select) return;
        const current = select.value;
        const categories = [...new Set(items.map((item) => item.category).filter(Boolean))].sort();
        select.innerHTML = `<option value="">Toutes les catégories</option>${categories.map((category) => `<option value="${utils.escapeHTML(category)}">${utils.escapeHTML(category)}</option>`).join("")}`;
        select.value = categories.includes(current) ? current : "";
    }

    function renderPagination(total) {
        const host = document.getElementById("blogPagination");
        if (!host) return;
        const pages = Math.max(1, Math.ceil(total / pageSize));
        if (pages <= 1) {
            host.innerHTML = "";
            return;
        }
        host.innerHTML = Array.from({ length: pages }, (_, index) => {
            const value = index + 1;
            return `<li class="page-item ${value === page ? "active" : ""}"><button class="page-link" type="button" data-page="${value}">${value}</button></li>`;
        }).join("");
        host.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => {
            page = Number(button.dataset.page || 1);
            loadPosts();
        }));
    }

    async function loadPosts() {
        const host = document.getElementById("blogGrid");
        const count = document.getElementById("blogCount");
        if (!host) return;
        host.innerHTML = `<div class="col-12"><div class="skeleton-line"></div></div>`;
        const search = document.getElementById("blogSearch")?.value.trim() || "";
        const category = document.getElementById("blogCategory")?.value || "";
        try {
            const result = api.configured ? await api.fetchPublishedPosts({ page, pageSize, search, category }) : { data: [], count: 0 };
            posts = result.data || [];
            updateCategoryFilter(posts);
            if (count) count.textContent = `${result.count || posts.length} article${(result.count || posts.length) > 1 ? "s" : ""}`;
            host.innerHTML = posts.length ? posts.map((post) => render.renderArticleCard(post)).join("") : utils.renderEmptyState("Aucun article publié actuellement. Les brouillons restent privés et ne sont jamais affichés.");
            renderPagination(result.count || posts.length);
        } catch (error) {
            console.error(error);
            host.innerHTML = utils.renderEmptyState("Une erreur est survenue pendant le chargement des articles.");
        }
    }

    function setMeta(selector, attribute, value) {
        const element = document.querySelector(selector);
        if (element && value) element.setAttribute(attribute, value);
    }

    function updateArticleSeo(post) {
        const title = `${post.title} | Blog informatique`;
        const description = post.seo_description || post.excerpt || "Conseil informatique publié sur le blog.";
        const image = post.featured_image || "https://images.pexels.com/photos/7709171/pexels-photo-7709171.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200";
        const url = utils.getCanonicalUrl ? utils.getCanonicalUrl(`/blog/article.html?slug=${encodeURIComponent(post.slug)}`) : window.location.href;
        document.title = title;
        setMeta("meta[name='description']", "content", description);
        setMeta("meta[name='keywords']", "content", post.meta_keywords || "assistance informatique, dépannage informatique, Bobo-Dioulasso");
        setMeta("link[rel='canonical']", "href", url);
        setMeta("meta[property='og:title']", "content", post.title);
        setMeta("meta[property='og:description']", "content", description);
        setMeta("meta[property='og:image']", "content", image);
        setMeta("meta[property='og:url']", "content", url);
        setMeta("meta[property='og:type']", "content", "article");
        setMeta("meta[name='twitter:title']", "content", post.title);
        setMeta("meta[name='twitter:description']", "content", description);
        setMeta("meta[name='twitter:image']", "content", image);

        let script = document.getElementById("article-jsonld");
        if (!script) {
            script = document.createElement("script");
            script.id = "article-jsonld";
            script.type = "application/ld+json";
            document.head.appendChild(script);
        }
        script.textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description,
            image,
            author: { "@type": "Person", name: post.author || cfg.SITE_AUTHOR || cfg.SITE_NAME },
            datePublished: post.published_at,
            dateModified: post.updated_at || post.published_at,
            publisher: { "@type": "Organization", name: cfg.SITE_NAME || "Services Informatiques en Ligne" },
            mainEntityOfPage: url
        });
    }

    async function loadArticle() {
        const host = document.getElementById("articleContainer");
        if (!host) return;
        const params = new URLSearchParams(window.location.search);
        const slug = params.get("slug");
        if (!slug) {
            host.innerHTML = utils.renderEmptyState("Article introuvable : aucun identifiant n'a été fourni.");
            return;
        }
        try {
            const post = api.configured ? await api.fetchPublishedPostBySlug(slug) : null;
            if (!post) {
                host.innerHTML = utils.renderEmptyState("Article indisponible. Il n'existe pas ou n'est pas publié.");
                return;
            }
            updateArticleSeo(post);
            const image = post.featured_image || "https://images.pexels.com/photos/7709171/pexels-photo-7709171.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=620&w=1100";
            host.innerHTML = `
                <header class="article-header reveal is-visible">
                    <p class="eyebrow dark">${utils.escapeHTML(post.category || "Article")}</p>
                    <h1>${utils.escapeHTML(post.title)}</h1>
                    <p class="lead muted">${utils.escapeHTML(post.excerpt || "")}</p>
                    <div class="meta-line mb-4"><span>${utils.escapeHTML(post.author || cfg.SITE_NAME)}</span><span>${utils.escapeHTML(utils.formatDate(post.published_at))}</span></div>
                    <img class="article-image" src="${utils.escapeHTML(image)}" alt="${utils.escapeHTML(post.title)}" loading="eager" width="1100" height="620">
                </header>
                <div class="article-content">${utils.sanitizeHTML(post.content || "<p>Le contenu de cet article est en cours de préparation.</p>")}</div>`;

            const related = api.configured ? await api.fetchRelatedPosts(post.category, post.slug, 3) : [];
            const relatedHost = document.getElementById("relatedPosts");
            if (relatedHost) relatedHost.innerHTML = related.length ? related.map((item) => render.renderArticleCard(item, true)).join("") : utils.renderEmptyState("Aucun article similaire publié pour le moment.");

            const recentHost = document.getElementById("recentPosts");
            if (recentHost) {
                const recent = api.configured ? (await api.fetchLatestPosts(3)).filter((item) => item.slug !== post.slug) : [];
                recentHost.innerHTML = recent.length ? recent.map((item) => render.renderArticleCard(item, true)).join("") : utils.renderEmptyState("Aucun autre article récent publié pour le moment.");
            }
        } catch (error) {
            console.error(error);
            host.innerHTML = utils.renderEmptyState("Une erreur est survenue pendant le chargement de l'article.");
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        if (document.getElementById("blogPage")) {
            loadPosts();
            const debounced = utils.debounce(() => { page = 1; loadPosts(); }, 250);
            document.getElementById("blogSearch")?.addEventListener("input", debounced);
            document.getElementById("blogCategory")?.addEventListener("change", () => { page = 1; loadPosts(); });
            document.getElementById("resetBlogFilters")?.addEventListener("click", () => {
                document.getElementById("blogSearch").value = "";
                document.getElementById("blogCategory").value = "";
                page = 1;
                loadPosts();
            });
        }
        if (document.getElementById("articlePage")) loadArticle();
    });
})();
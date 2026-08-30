(function () {
    "use strict";

    const cfg = window.AppConfig || {};
    const configured = Boolean(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase);
    const client = configured ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true }
    }) : null;

    async function withTimeout(promise, ms = 10000) {
        let timeoutId;
        const timeout = new Promise((_, reject) => {
            timeoutId = window.setTimeout(() => reject(new Error("request-timeout")), ms);
        });
        try {
            return await Promise.race([promise, timeout]);
        } finally {
            window.clearTimeout(timeoutId);
        }
    }

    function requireClient() {
        if (!client) return null;
        return client;
    }

    async function fetchActiveServices() {
        const sb = requireClient();
        if (!sb) return [];
        const { data, error } = await withTimeout(sb
            .from("services")
            .select("id,title,slug,description,price,currency,category,platform,image_url,is_active,created_at,updated_at")
            .eq("is_active", true)
            .order("created_at", { ascending: false }));
        if (error) throw error;
        return data || [];
    }

    async function fetchPublishedPosts(options = {}) {
        const sb = requireClient();
        if (!sb) return { data: [], count: 0 };
        const page = Number(options.page || 1);
        const pageSize = Number(options.pageSize || 9);
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        let query = sb
            .from("blog_posts")
            .select("id,title,slug,excerpt,featured_image,category,author,status,published_at,created_at,updated_at", { count: "exact" })
            .eq("status", "published")
            .lte("published_at", new Date().toISOString())
            .order("published_at", { ascending: false })
            .range(from, to);
        if (options.category) query = query.eq("category", options.category);
        if (options.search) {
            const clean = String(options.search).replace(/[%,]/g, "").trim();
            if (clean) query = query.or(`title.ilike.%${clean}%,excerpt.ilike.%${clean}%,category.ilike.%${clean}%`);
        }
        const { data, error, count } = await withTimeout(query);
        if (error) throw error;
        return { data: data || [], count: count || 0 };
    }

    async function fetchLatestPosts(limit = 3) {
        const result = await fetchPublishedPosts({ page: 1, pageSize: limit });
        return result.data;
    }

    async function fetchPublishedPostBySlug(slug) {
        const sb = requireClient();
        if (!sb || !slug) return null;
        const { data, error } = await withTimeout(sb
            .from("blog_posts")
            .select("id,title,slug,excerpt,content,featured_image,category,author,status,published_at,created_at,updated_at,meta_keywords,seo_description")
            .eq("slug", slug)
            .eq("status", "published")
            .lte("published_at", new Date().toISOString())
            .maybeSingle());
        if (error) throw error;
        return data;
    }

    async function fetchRelatedPosts(category, currentSlug, limit = 3) {
        const sb = requireClient();
        if (!sb || !category) return [];
        const { data, error } = await withTimeout(sb
            .from("blog_posts")
            .select("id,title,slug,excerpt,featured_image,category,author,published_at")
            .eq("status", "published")
            .eq("category", category)
            .neq("slug", currentSlug)
            .lte("published_at", new Date().toISOString())
            .order("published_at", { ascending: false })
            .limit(limit));
        if (error) throw error;
        return data || [];
    }

    async function fetchDownloads() {
        const sb = requireClient();
        if (!sb) return [];
        const { data, error } = await withTimeout(sb
            .from("downloads")
            .select("id,name,slug,description,version,platform,file_url,website_url,category,icon_url,is_active,created_at")
            .eq("is_active", true)
            .order("created_at", { ascending: false }));
        if (error) throw error;
        return data || [];
    }

    async function insertContactMessage(payload) {
        const sb = requireClient();
        if (!sb) throw new Error("supabase-not-configured");
        const { error } = await withTimeout(sb.from("contact_messages").insert([payload]), 10000);
        if (error) throw error;
        return true;
    }

    window.AppSupabase = {
        client,
        configured,
        fetchActiveServices,
        fetchPublishedPosts,
        fetchLatestPosts,
        fetchPublishedPostBySlug,
        fetchRelatedPosts,
        fetchDownloads,
        insertContactMessage
    };
})();
(function () {
    "use strict";

    const cfg = window.AppConfig || {};
    const api = window.AppSupabase || {};
    const utils = window.AppUtils || {};

    function markInvalid(field, invalid) {
        if (!field) return;
        field.classList.toggle("is-invalid", invalid);
        field.classList.toggle("is-valid", !invalid && field.value.trim().length > 0);
    }

    function validate(payload) {
        const errors = {};
        if (payload.name.length < 2 || payload.name.length > 80) errors.name = true;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email) || payload.email.length > 160) errors.email = true;
        if (!/^[0-9+()\s.-]{6,30}$/.test(payload.phone)) errors.phone = true;
        if (payload.subject.length < 3 || payload.subject.length > 120) errors.subject = true;
        if (payload.message.length < 10 || payload.message.length > 1500) errors.message = true;
        return errors;
    }

    function prefillFromService() {
        const params = new URLSearchParams(window.location.search);
        const slug = params.get("service");
        if (!slug) return;
        const service = (cfg.DEFAULT_SERVICES || []).find((item) => item.slug === slug || item.id === slug);
        if (!service) return;
        const subject = document.getElementById("subject");
        const message = document.getElementById("message");
        if (subject && !subject.value) subject.value = `Demande : ${service.title}`;
        if (message && !message.value) message.value = `Bonjour, je souhaite obtenir des informations concernant : ${service.title}`;
    }

    async function onSubmit(event) {
        event.preventDefault();
        const form = event.currentTarget;
        const button = document.getElementById("contactSubmit");
        const status = document.getElementById("contactStatus");
        const fields = form.elements;
        const honeypot = fields.website?.value || "";
        if (honeypot) return;

        const payload = {
            name: utils.stripTags(fields.name.value),
            email: utils.stripTags(fields.email.value).toLowerCase(),
            phone: utils.stripTags(fields.phone.value),
            subject: utils.stripTags(fields.subject.value),
            message: utils.stripTags(fields.message.value)
        };
        const errors = validate(payload);
        ["name", "email", "phone", "subject", "message"].forEach((key) => markInvalid(fields[key], Boolean(errors[key])));
        if (Object.keys(errors).length) {
            if (status) status.textContent = "Veuillez corriger les champs indiqués.";
            return;
        }

        if (!utils.localRateLimit("contact", 3, 10 * 60 * 1000)) {
            if (status) status.textContent = "Trop de tentatives. Veuillez réessayer dans quelques minutes.";
            utils.showToast("Limite temporaire atteinte.", "warning");
            return;
        }

        try {
            utils.setButtonLoading(button, true, "Envoi...");
            if (status) status.textContent = "Envoi du message...";
            await api.insertContactMessage(payload);
            form.reset();
            form.querySelectorAll(".is-valid").forEach((field) => field.classList.remove("is-valid"));
            if (status) status.textContent = "Votre message a été envoyé avec succès.";
            utils.showToast("Votre message a été envoyé avec succès.");
        } catch (error) {
            console.error(error);
            if (status) status.textContent = api.configured ? "Une erreur est survenue. Veuillez réessayer." : "Le formulaire doit être connecté à Supabase avant utilisation.";
            utils.showToast(api.configured ? "Impossible d'envoyer le message." : "Supabase n'est pas configuré.", "error");
        } finally {
            utils.setButtonLoading(button, false);
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        const form = document.getElementById("contactForm");
        if (!form) return;
        prefillFromService();
        form.addEventListener("submit", onSubmit);
    });
})();
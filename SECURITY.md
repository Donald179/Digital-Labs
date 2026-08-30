# Sécurité

## Principes

- La clé `SUPABASE_SERVICE_ROLE_KEY` ne doit jamais être placée dans HTML, CSS, JavaScript frontend, GitHub Pages, Netlify public assets ou Vercel static assets.
- La clé anon Supabase peut être utilisée côté frontend uniquement avec RLS correctement configuré.
- RLS doit rester activé sur toutes les tables publiques.
- Les brouillons du blog restent privés via la policy `status = 'published'`.
- Les messages de contact ne sont pas lisibles publiquement.

## XSS

Les données Supabase sont considérées comme non fiables. Le frontend utilise :

- `escapeHTML()` pour les textes injectés dans des templates
- `sanitizeHTML()` pour le contenu riche des articles
- `textContent` lorsque possible

N'ajoutez pas de `innerHTML` avec des données utilisateur sans échappement ou sanitization stricte.

## Formulaire Contact

Le formulaire utilise :

- validation frontend
- honeypot
- limitation locale raisonnable
- contraintes PostgreSQL
- policy RLS d'insertion uniquement

Pour une protection anti-spam renforcée, ajoutez une Supabase Edge Function avec vérification serveur, CAPTCHA si nécessaire et rate limiting par IP.

## Signalement

Renseignez une adresse email de sécurité dans `js/config.js` ou dans la documentation publique du projet avant mise en production.
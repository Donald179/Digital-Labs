# Services Informatiques en Ligne

Site vitrine statique pour présenter des prestations informatiques en ligne et à Bobo-Dioulasso, secteur 18. Le frontend est compatible GitHub Pages, Netlify et Vercel, avec données dynamiques via Supabase.

## Technologies

- HTML5, CSS3, Bootstrap 5.3, Bootstrap Icons
- Tailwind browser CDN présent dans les pages HTML pour compatibilité avec la contrainte de génération
- JavaScript vanilla ES6+
- Supabase, PostgreSQL, RLS
- Frontend statique sans serveur Node.js, React, Vue, Angular ou Next.js

## Structure

- `index.html` : accueil orienté conversion
- `services.html` : catalogue, recherche et filtres
- `blog.html` : liste des articles publiés
- `blog/article.html` : article dynamique avec SEO généré côté client
- `telechargement.html` : bibliothèque de téléchargements actifs
- `a-propos.html` : présentation fidèle aux informations fournies
- `contact.html` : coordonnées configurables et formulaire Supabase
- `css/style.css` et `css/responsive.css` : design personnalisé
- `js/config.js` : configuration publique uniquement
- `js/supabase.js` : accès Supabase avec clé anon
- `js/utils.js` : sécurité XSS, formatage, toasts, rate limit local
- `supabase/schema.sql` : tables, contraintes, index, triggers
- `supabase/policies.sql` : RLS et policies

## Configuration Frontend

Modifiez `js/config.js` :

- `SITE_URL` : URL publique finale
- `SUPABASE_URL` : URL du projet Supabase
- `SUPABASE_ANON_KEY` : clé publique anon Supabase
- `CONTACT_EMAIL` : email public si disponible
- `WHATSAPP_NUMBER` : numéro WhatsApp au format international sans espaces si possible
- `PHONE_NUMBER` : numéro public SMS/appels
- `LOCATION` : déjà défini sur `Bobo-Dioulasso, secteur 18`

Ne placez jamais `SUPABASE_SERVICE_ROLE_KEY` dans `js/config.js` ou dans un fichier public.

## Création Supabase

1. Créez un projet Supabase.
2. Ouvrez SQL Editor.
3. Exécutez `supabase/schema.sql`.
4. Exécutez `supabase/policies.sql`.
5. Ajoutez les données dans `services`, `blog_posts` et `downloads` depuis Supabase Studio ou une future interface admin sécurisée.

## RLS

Les visiteurs peuvent lire uniquement :

- `services` avec `is_active = true`
- `blog_posts` avec `status = 'published'` et `published_at <= now()`
- `downloads` avec `is_active = true`
- `categories`

Les visiteurs peuvent insérer un message dans `contact_messages`, mais ne peuvent pas lire, modifier ou supprimer les messages.

## Administrateur

Pour gérer les contenus, créez un utilisateur dans Supabase Auth puis associez-le à un profil `admin` dans `public.profiles`. Exemple à adapter avec l'UUID réel :

```sql
insert into public.profiles (id, email, role)
values ('00000000-0000-0000-0000-000000000000', 'admin@example.com', 'admin')
on conflict (id) do update set role = 'admin';
```

Ce projet n'expose pas de clé `service_role` côté frontend. Une interface d'administration complète peut être ajoutée ensuite avec Supabase Auth et les mêmes policies.

## Blog et SEO

La liste du blog charge uniquement les articles publiés. La page `blog/article.html?slug=...` génère dynamiquement :

- `title`
- meta description
- meta keywords
- canonical
- Open Graph
- Twitter Card
- JSON-LD `Article`

Pour un SEO serveur parfait, prévoyez ensuite une génération statique des articles et du sitemap via un workflow CI ou une Edge Function dédiée.

## Téléchargements

N'ajoutez que des logiciels ou fichiers dont la distribution est légalement autorisée. Les cracks, keygens, licences illégitimes ou fichiers piratés sont exclus.

## Déploiement GitHub Pages

1. Poussez le dépôt sur GitHub.
2. Dans Settings, Pages, choisissez la branche et le dossier racine.
3. Mettez à jour `SITE_URL`, les canonical et `sitemap.xml` avec l'URL réelle.

## Déploiement Netlify ou Vercel

Le projet est statique. Déployez le dossier racine sans build command. Configurez les variables publiques dans `js/config.js` avant publication ou générez ce fichier dans votre pipeline.

## Maintenance

- Gardez RLS activé.
- Vérifiez régulièrement les policies.
- Maintenez `sitemap.xml` quand de nouvelles pages publiques sont ajoutées.
- Testez le formulaire contact après toute modification Supabase.
- Ne stockez jamais de secret dans le dépôt.
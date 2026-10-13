# Portfolio : site de prestations web

Site statique (HTML, CSS, JavaScript) construit selon le brief commercial : une offre claire d'abord, puis les réalisations, les preuves, la méthode et le contact.

## Structure

```
SiteLLCER/
├─ index.html          Accueil (offre, services, réalisations, pourquoi moi, méthode, preuves, à propos, contact)
├─ services.html       Création, refonte, SEO et performance, maintenance, sur mesure, offres
├─ realisations.html   Études de cas + projets techniques (Planning 24/7, Scription, Nexus)
├─ a-propos.html       Texte, formation, expérience, compétences
├─ contact.html        Formulaire simple + coordonnées
├─ planning.html       Projet personnel (application Vue) : hors menu, non indexée
├─ constructions.html  Projet personnel (galerie) : hors menu, non indexée
├─ _template.html      Gabarit pour une nouvelle page
├─ sitemap.xml  robots.txt  A-COMPLETER.md
└─ assets/
   ├─ css/  style.css (commun)  planning.css (page Planning)
   ├─ js/   app.js (réglages, menu, pied de page)  circuit.js (fond, chargé en différé)
   │        contact.js (formulaire)  planning.js (page Planning)
   └─ img/  og-image.png (image de partage)  ·  img/builds/ (galerie)
```

## Réglages (un seul endroit)

En haut de `assets/js/app.js` :
- `SITE` : nom, email, GitHub, LinkedIn, adresse du service de formulaire. Une valeur entre `[crochets]` est considérée comme non renseignée.
- `PAGES` : liste des pages. **Ajouter une page = copier `_template.html` + ajouter une ligne dans `PAGES`.** Sans 3e valeur, la page est dans le menu ; `'tool'` la met en dernier dans le menu, en gris (utilisé pour le Planning) ; `'home'` ou `'extra'` la place seulement en pied de page.

Le menu, le pied de page, le fond et la notification sont injectés par `app.js` : une modification se fait une fois pour toutes les pages.

## Ajouter du CSS ou du JS propre à une page

Créer `assets/css/ma-page.css` / `assets/js/ma-page.js`, les déclarer dans le `<head>` de la page, préfixer les classes (`pl-` pour le planning) et envelopper le JS dans `(() => { … })();`.

## Principes du brief appliqués

- Aucun client, chiffre, témoignage ou compétence inventé : tout ce qui manque est marqué **[À RENSEIGNER]** (liste dans `A-COMPLETER.md`).
- Les services web sont en premier ; les compétences complémentaires (Python, C#, Rust…) sont discrètes ; les projets non liés au web sont hors menu.
- Chaque réalisation suit la structure besoin, solution, rôle, technologies, résultats.
- Les scores Lighthouse, résultats SEO et prix ne sont affichés que lorsqu'ils seront réels.

## SEO et performance

- Une seule balise `h1` par page, titres `h2`/`h3` cohérents, title et description uniques, canonical, Open Graph, données structurées (`ProfessionalService`) sur l'accueil, `sitemap.xml`, `robots.txt`.
- Le contenu des pages est dans le HTML (indexable) ; seul le planning est généré par JavaScript, d'où sa non-indexation.
- Le fond animé est chargé après l'affichage de la page, s'arrête si l'onglet est inactif, et est coupé avec « réduire les animations » ou « économiseur de données ». Sur écran tactile, il est fixe.
- À faire avant mise en ligne : mesurer avec Lighthouse, héberger les polices (Orbitron, Exo 2) soi-même au lieu de Google Fonts, convertir les images en WebP, activer la compression et le cache sur l'hébergement.
- Images (à venir) : un `alt` descriptif pour chaque capture, format WebP, attributs `width`/`height` et `loading="lazy"` sous la ligne de flottaison.
- URLs : les pages se terminent par `.html`. Si l'hébergeur gère les URLs sans extension (Netlify, Cloudflare Pages, GitHub Pages), on peut les retirer des liens, canonical et sitemap.

## Tester en local

Ouvrir `index.html`, ou lancer `python3 -m http.server` dans le dossier puis ouvrir `http://localhost:8000`.

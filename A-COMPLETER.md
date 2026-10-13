# À compléter avant publication

Rien n'a été inventé : chaque information manquante est signalée dans le site par **[À RENSEIGNER]** (affiché en orange en pointillés). Cette liste est générée à partir du site actuel ; cherchez `À RENSEIGNER` dans VS Code pour tout retrouver.

## 1. Éléments marqués dans le site (23 emplacements)

**`a-propos.html`**
- [ ] [À RENSEIGNER] entreprise, missions
- [ ] [À RENSEIGNER] tâches, sites concernés

**`contact.html`**
- [ ] [À RENSEIGNER] email professionnel

**`index.html`**
- [ ] [À RENSEIGNER] SEO (Search Console), performance (Lighthouse, PageSpeed)
- [ ] [À RENSEIGNER] adresses des sites réalisés
- [ ] [À RENSEIGNER] entreprise, rôle précis, résultat
- [ ] [À RENSEIGNER] site, tâches, résultat
- [ ] [À RENSEIGNER] témoignages clients : nom, activité, citation, accord de publication

**`realisations.html`**
- [ ] [À RENSEIGNER] autres outils
- [ ] [À RENSEIGNER] capture d
- [ ] [À RENSEIGNER] changements observables, preuves
- [ ] [À RENSEIGNER] description et lien
- [ ] [À RENSEIGNER] intervention réalisée
- [ ] [À RENSEIGNER] mesures Lighthouse et PageSpeed
- [ ] [À RENSEIGNER] modifications effectuées
- [ ] [À RENSEIGNER] outils
- [ ] [À RENSEIGNER] problématique et objectif
- [ ] [À RENSEIGNER] rôle et niveau d
- [ ] [À RENSEIGNER] rôle précis

**`services.html`**
- [ ] [À RENSEIGNER] Mesures Lighthouse, PageSpeed Insights, Core Web Vitals. À afficher uniquement lorsqu
- [ ] [À RENSEIGNER] Résultats SEO documentés : impressions, clics, positions, évolution du trafic, cas client. À afficher uniquement avec des preuves.

**`assets/js/app.js`**
- [ ] [À RENSEIGNER] URL LinkedIn
- [ ] [À RENSEIGNER] email professionnel

## 2. Réglages techniques (obligatoires)

- [ ] Remplacer `https://VOTRE-DOMAINE.fr` par le vrai domaine dans **tout le projet** (VS Code : Ctrl+Maj+H) : canonical, Open Graph, `sitemap.xml`, `robots.txt`, données structurées.
- [ ] Retirer le blocage d'indexation : rechercher `A-RETIRER-A-LA-PUBLICATION` et supprimer toute la ligne `<meta name="robots" content="noindex, nofollow">…` dans les 5 pages commerciales. **Tant que cette ligne est présente, Google n'indexe pas le site** (voulu pendant la construction). `planning.html` et `constructions.html` restent volontairement non indexées.
- [ ] Dans `assets/js/app.js`, objet `SITE` : renseigner `email`, `linkedin`, vérifier `github`, et `brand` si le nom professionnel est différent de « Ghost-Wob ».
- [ ] Formulaire : sans réglage, il ouvre la messagerie du visiteur (fonctionne sans serveur). Pour un envoi direct, renseigner `SITE.formEndpoint` avec l'adresse fournie par un service de formulaire (Formspree, Netlify Forms, Basin…).
- [ ] Mettre à jour `<lastmod>` dans `sitemap.xml` à chaque modification importante.

## 3. Décisions à prendre (je n'ai rien supposé)

**Identité**
- [ ] Nom professionnel ou marque : le site utilise « Ghost-Wob » (ancien pseudo du site). « Noctralys » a été retiré du pied de page.
- [ ] Expérience en milieu hospitalier : non reprise dans « À propos » (le brief demande de ne la mentionner que si elle apporte quelque chose au récit).

**Compétences web : niveau réel à confirmer** (les cases en pointillés sur la page À propos)
- [ ] JavaScript · TypeScript · PHP · React · Vue · Next.js · Tailwind · Figma · UX/UI · accessibilité · Git · déploiement · Docker · Nginx/Apache · Cloudflare · DNS · analytics (outils réellement utilisés)
- [ ] Ne laisser affichées que celles qui peuvent être démontrées.

**SEO** : outils utilisés, projets concernés, résultats mesurables, captures Search Console, données Analytics.

**Commercial**
- [ ] Statut professionnel · zone géographique · travail à distance · prix cible et panier moyen · type de clients prioritaire · maintenance proposée · délai moyen · conditions de paiement · acompte
- [ ] Prix des offres : affichés « à déterminer » ou « sur devis » tant que rien n'est défini.

## 4. Preuves à rassembler

- [ ] Captures d'écran des sites réalisés (idéalement avant/après), au format WebP, avec un texte alternatif utile.
- [ ] Témoignages avec accord écrit de publication.
- [ ] Mesures Lighthouse / PageSpeed / Core Web Vitals **du portfolio lui-même** une fois en ligne, puis les afficher dans la carte « Ce portfolio » et sur la page Services.
- [ ] Descriptions et liens de Scription et de Nexus.

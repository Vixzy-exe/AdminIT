# AdminIT — site vitrine

Site statique (HTML + CSS), hébergé sur GitHub Pages.

- `index.html` : page d'accueil
- `mentions-legales.html`, `confidentialite.html` : pages légales
- `styles.css`, `script.js` : mise en forme et petites interactions
- `assets/` : polices, logo, icônes, image de partage
- `assets/video/` : vidéo de présentation en 16:9 (ordinateur) et 9:16 (téléphone), avec leur image d'aperçu

## Modifier un texte
Ouvrir le fichier sur GitHub, cliquer sur le crayon, modifier, puis « Commit changes ». Le site se met à jour en une minute environ.

## Publier
Settings → Pages → Source : « Deploy from a branch », branche `main`, dossier `/ (root)`.

## Nom de domaine (adminit.support)
1. Chez le registraire : 4 enregistrements A vers `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`, et un CNAME `www` vers `vixzy-exe.github.io`.
2. Sur GitHub : Settings → Pages → Custom domain → `adminit.support`, puis cocher « Enforce HTTPS ».

# Mise en ligne depuis GitHub

Audit réalisé le 15 juillet 2026 sur le dossier `C:\Users\julia\Desktop\collection-ecommerce`.

## Décision

**Choix recommandé : dépôt GitHub + déploiement Vercel.**

GitHub héberge le code, l’historique et les demandes de modification. Vercel construit et exécute l’application Next.js, puis crée automatiquement un déploiement de prévisualisation pour les branches et un déploiement de production pour `main`.

**GitHub Pages n’est pas compatible avec cette application complète.** Pages publie des fichiers statiques. Or ce projet contient :

- de nombreuses routes serveur avec des méthodes `POST` ou des opérations protégées ;
- des cookies de session signés et des pages rendues selon la session ;
- `src/proxy.ts`, qui protège `/admin` et `/api/admin` ;
- un webhook Stripe qui doit lire et vérifier chaque requête ;
- des en-têtes HTTP configurés par Next.js ;
- plusieurs pages marquées dynamiques par le build Next.js.

L’export statique de Next.js ne prend pas en charge les API, `proxy.ts`, les en-têtes serveur, les cookies ou les autres fonctions qui exigent un serveur. Le fichier `index.html` de la racine est uniquement un lanceur local : publié sur GitHub Pages, il renverrait chaque visiteur vers son propre `localhost:3000` et non vers la boutique.

Sources officielles :

- [GitHub Pages est un hébergement statique](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [Fonctions incompatibles avec un export statique Next.js](https://nextjs.org/docs/pages/guides/static-exports#unsupported-features)
- [Prise en charge de Next.js, des Route Handlers et du rendu serveur par Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs)
- [Déploiements Git et prévisualisations Vercel](https://vercel.com/docs/git)
- [Les écritures de fichiers d’une Function ne remplacent pas un stockage persistant](https://vercel.com/kb/guide/how-can-i-use-files-in-serverless-functions#examples-of-writing-files)

## Ce qui peut être publié maintenant

La **vitrine de démonstration** peut être mise sur Vercel dès maintenant : le build, le typage, le lint et les 26 tests passent. Elle permet de parcourir les 24 objets, les collections, le panier local et le faux parcours de commande.

Elle doit rester clairement présentée comme une démonstration :

- aucun compte ne peut se connecter en production ;
- l’ajout d’un produit peut être enregistré dans un fichier JSON local lorsque le stockage de démonstration est activé, mais ce fichier n’est pas durable sur Vercel ;
- les contacts, inscriptions, réservations et imports ne sont pas persistés ;
- les annonces ajoutées apparaissent bien dans le catalogue local, mais leur fichier JSON n’est pas durable sur Vercel ;
- aucune commande ni mise à jour de stock n’est écrite en base ;
- les visuels sont des illustrations de démonstration ;
- les informations légales du vendeur ne sont pas renseignées.

**Ne pas activer Stripe Live.** Avec des clés Stripe, le projet peut ouvrir un Checkout, mais le webhook ne fait encore que vérifier et journaliser les événements. Il ne crée pas la commande, ne décrémente pas le stock et ne possède pas de déduplication persistante.

## État Git et dépôt distant

Le projet est maintenant un dépôt Git local sur la branche `main`, relié au dépôt public [JulianPERESSON/guyperesson](https://github.com/JulianPERESSON/guyperesson). Les fichiers `.env`, `.env.local`, `.vercel`, `.next`, `node_modules`, `coverage`, `.data` et `src/generated/prisma` restent exclus par `.gitignore`.

Pour les prochaines modifications, vérifier les fichiers, créer un commit puis envoyer la branche :

Depuis PowerShell, à la racine du projet :

```powershell
git add .
git status
git commit -m "Décrit la modification"
git push -u origin main
```

Avant `git commit`, vérifier particulièrement que `.env`, `.env.local`, `.vercel`, `.next`, `node_modules`, `coverage` et `src/generated/prisma` ne figurent pas dans `git status`. Le `.gitignore` actuel les exclut déjà. `.env.example` doit en revanche être versionné puisqu’il ne contient aucune valeur.

Après le premier push, activer dans GitHub :

- un ruleset sur `main` exigeant une pull request et la réussite du workflow **Qualité** ;
- Dependabot alerts et les mises à jour de sécurité ;
- la détection de secrets disponible pour le type de dépôt ;
- l’authentification à deux facteurs sur les comptes ayant accès au dépôt et à Vercel.

Le fichier `.github/dependabot.yml` prépare une vérification npm hebdomadaire. Les propositions de mise à jour doivent toujours passer par la CI et une prévisualisation Vercel avant fusion.

## Importer le dépôt dans Vercel

Le forfait **Hobby** est réservé par Vercel à un usage personnel et non commercial. Il convient à une démonstration qui ne vend rien. Dès que le site sollicite ou traite des paiements, ou fait la promotion de produits à vendre, choisir **Pro** ou **Enterprise** avant l'ouverture publique. Voir les [conditions du forfait Hobby](https://vercel.com/docs/plans/hobby) et les [règles d'usage commercial](https://vercel.com/docs/limits/fair-use-guidelines#commercial-usage).

1. Se connecter à Vercel avec le compte GitHub.
2. Choisir **Add New → Project**, puis importer le dépôt.
3. Laisser **Framework Preset : Next.js** et **Root Directory : `.`**.
4. Conserver les commandes détectées automatiquement : installation npm et `next build`. Aucun `vercel.json` n’est nécessaire.
5. Utiliser Node.js `24.x`, version LTS actuellement utilisée par défaut sur Vercel et validée localement. Next.js 16 exige au minimum Node.js 20.9.
6. Ajouter les variables adaptées à l’environnement, puis lancer le premier déploiement.
7. Vérifier le domaine provisoire `*.vercel.app`, puis attacher le domaine final.
8. Définir `NEXT_PUBLIC_SITE_URL` sur l’URL canonique finale et redéployer afin de corriger sitemap, robots, métadonnées et liens Stripe.

Le workflow `.github/workflows/quality.yml` ajouté par cet audit vérifie chaque push et chaque pull request. Vercel reste responsable du déploiement ; aucun secret Vercel n’est nécessaire dans GitHub Actions lorsque l’intégration Git officielle est utilisée.

## Variables d’environnement

### Vitrine publique de démonstration

| Variable | Production Vercel | Remarque |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | requise | URL exacte en `https://`, sans chemin |
| `DATABASE_URL` | non requise pour la vitrine | le build utilise une URL locale factice sans connexion |
| `AUTH_SECRET` | non suffisant seul | l’authentification PostgreSQL n’est pas raccordée |
| `STRIPE_SECRET_KEY` | ne pas définir | évite tout paiement réel accidentel |
| `STRIPE_WEBHOOK_SECRET` | ne pas définir | inutile sans Checkout réel |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ne pas définir | actuellement inutilisée par l’interface |
| `CLOUDINARY_*` | non requises | aucune route d’upload n’est raccordée |
| `DEMO_*` | ne pas définir | le code les refuse quand `NODE_ENV=production` |
| `DEMO_PRODUCT_STORE_ENABLED` | ne pas définir | le fichier JSON local n’est pas un stockage Vercel durable |
| `DEMO_PRODUCT_STORE_PATH` | ne pas définir | chemin réservé aux essais locaux |
| `SEED_ADMIN_*` | ne pas définir dans Vercel | variables temporaires réservées au seed |

### Future boutique connectée

| Variable | Portée recommandée | Exigence |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Production | domaine canonique public |
| `AUTH_SECRET` | Production et Preview séparément | secret aléatoire d’au moins 32 caractères |
| `DATABASE_URL` | Production | URL PostgreSQL **poolée** pour les fonctions |
| `DIRECT_URL` | CI/migrations uniquement | URL directe recommandée ; pas encore déclarée dans le projet |
| `STRIPE_SECRET_KEY` | Production, après recette | clé `sk_live_…`, jamais préfixée `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Production | uniquement si le navigateur utilise Stripe.js |
| `STRIPE_WEBHOOK_SECRET` | Production | secret propre à l’endpoint du domaine final |
| `CLOUDINARY_CLOUD_NAME` | Production | nom du cloud |
| `CLOUDINARY_API_KEY` | Production | clé serveur |
| `CLOUDINARY_API_SECRET` | Production | secret serveur, jamais public |
| `AUTH_SESSION_MAX_AGE_SECONDS` | optionnelle | valeur admise entre 300 et 604800 |

Générer un secret de session sans le placer dans l’historique Git :

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Le copier directement dans les variables Vercel. Une variable ajoutée ou modifiée exige un nouveau déploiement.

Pour les déploiements Preview, ne pas brancher Stripe Live ni la base de production. Utiliser soit une base de recette séparée, soit aucune base tant que les routes restent en démonstration. Vercel permet de définir des valeurs distinctes pour Development, Preview et Production.

## PostgreSQL et migrations

Le projet possède un schéma Prisma complet et un seed idempotent, mais **aucune migration versionnée n’est présente dans le dossier audité**. Un `npm run db:deploy` ne peut donc pas initialiser proprement une base vierge.

Avant le mode connecté :

1. créer et relire une migration initiale dans `prisma/migrations` ;
2. la tester sur une base vide de recette ;
3. sauvegarder l’historique de migrations dans Git ;
4. utiliser une URL poolée pour le trafic des fonctions et une URL directe pour les migrations ;
5. exécuter `prisma migrate deploy` une seule fois par version, via une étape CI contrôlée ou manuellement ;
6. lancer le seed avec les variables administrateur temporaires, puis les supprimer ;
7. mettre en place sauvegardes, restauration testée et alertes de connexion.

Prisma recommande le pooling pour les fonctions serverless et une connexion directe pour les migrations : [documentation Prisma sur le pooling](https://www.prisma.io/docs/postgres/database/connection-pooling).

Le fallback de `prisma.config.ts` facilite uniquement `prisma generate` et le build. Un build vert ne prouve donc ni l’existence de la base ni l’application des migrations.

## Stripe

Pour une recette future :

1. utiliser exclusivement le mode Stripe Test ;
2. créer l’endpoint `https://DOMAINE/api/stripe/webhook` ;
3. écouter les événements indiqués dans le README ;
4. enregistrer chaque `event.id` dans `WebhookEvent` avec une contrainte unique ;
5. dans une transaction PostgreSQL, vérifier le stock, créer ou confirmer la commande, consommer le verrou et marquer l’événement traité ;
6. tester les événements répétés, expirés, asynchrones et échoués ;
7. n’activer Live qu’après une commande de bout en bout, un remboursement et une reprise sur incident.

Une simple `Map` en mémoire ne convient pas à Vercel : deux fonctions peuvent recevoir le même événement et le cache disparaît lors d’un redéploiement.

## GitHub Pages : seule variante envisageable

Une seconde version **catalogue statique uniquement** pourrait être créée plus tard pour GitHub Pages. Elle constituerait un autre produit et demanderait :

- `output: "export"` dans Next.js ;
- suppression ou remplacement de toutes les routes API, sessions et protections admin ;
- suppression de `proxy.ts` et des en-têtes serveur ;
- génération de chaque paramètre de route à la compilation ;
- loader d’images compatible export statique ;
- `basePath` et `assetPrefix` pour l’URL `/<nom-du-depot>` ;
- formulaires confiés à un service externe ;
- aucun panier partagé, compte, administration, réservation de stock ou paiement serveur.

Cette variante n’est pas recommandée pour la boutique demandée. Ne pas ajouter de workflow GitHub Pages au dépôt actuel.

## Priorités avant ouverture commerciale

### P0 — bloquants

1. **Persistance** : raccorder les routes et écrans aux dépôts Prisma. Le dépôt JSON ajouté pour la démonstration locale ne doit pas être utilisé sur Vercel.
2. **Authentification production** : lire `User.passwordHash` dans PostgreSQL, gérer les sessions durables, la déconnexion et le mot de passe oublié. Le login actuel est explicitement désactivé en production.
3. **Commande atomique** : créer commande, lignes, verrou de stock et clé d’idempotence dans une transaction. Empêcher réellement deux achats du même objet.
4. **Webhook durable** : remplacer le cache mémoire par `WebhookEvent` et finaliser les transitions paiement/stock.
5. **Migration initiale** : versionner et tester la migration Prisma avant toute base de production.
6. **Médias** : implémenter l’upload Cloudinary protégé et remplacer les visuels de démonstration.
7. **Obligations commerciales** : renseigner identité, SIRET/TVA, médiateur, retours, livraison, politique de confidentialité et coordonnées réelles.
8. **E-mails** : confirmations de commande, réservation, contact, réinitialisation et suivi.
9. **Forfait d'hébergement** : passer sur Vercel Pro ou Enterprise avant tout usage commercial ; Hobby ne couvre que la démonstration personnelle non commerciale.

### P1 — sécurité et exploitation

1. Remplacer le rate limiting en mémoire par Redis/KV partagé.
2. Ajouter une politique CSP adaptée, puis HSTS une fois le domaine HTTPS stabilisé.
3. Configurer journalisation structurée, alertes Stripe et suivi des erreurs.
4. Séparer les bases Preview et Production ; ne jamais migrer la production depuis un build de pull request.
5. Tester sauvegarde et restauration PostgreSQL.
6. Ajouter des tests d’intégration base/API et des parcours navigateur critiques.
7. Isoler le dépôt JSON local du bundle de production : son chemin de fichier configurable provoque actuellement un avertissement Turbopack et le traçage involontaire de l’ensemble du projet.
7. Examiner les cinq avis npm de sévérité modérée actuellement signalés. Les versions installées sont déjà les dernières publiées ; ne pas lancer `npm audit fix --force`, qui proposerait des rétrogradations majeures incohérentes.

### P2 — qualité de lancement

1. Ajouter domaine personnalisé, favicon/aperçu social définitifs et outils de mesure avec consentement adapté.
2. Finaliser factures, retours, suivi transporteur et export comptable.
3. Tester accessibilité clavier/lecteur d’écran et performances avec les photographies réelles.
4. Documenter les procédures de remboursement, rotation des secrets et reprise après incident.

## Contrôles effectués

- `npm run lint` : réussi ;
- `npm run typecheck` : réussi ;
- `npm test` : 26 tests réussis ;
- `npm run build` : réussi, 82 pages générées, routes dynamiques et proxy confirmés ; un avertissement de traçage de fichiers lié au dépôt JSON local reste à corriger ;
- recherche de secrets : aucune clé réelle détectée ;
- `npm audit --omit=dev` : 5 avis modérés, aucun avis élevé ou critique.

Le build valide la compatibilité technique avec Vercel, pas l’aptitude à encaisser de l’argent réel. Les points P0 constituent la barrière de mise en production commerciale.

# L’Inventaire

Boutique e-commerce française dédiée aux objets de collection : céramiques, revues auto et moto, et cartes postales. Le projet propose une vitrine responsive, un catalogue multicritère, des collections éditoriales, un panier, des réservations, un tunnel Stripe et une administration protégée.

Le dépôt peut être lancé immédiatement comme démonstration locale, sans service externe. PostgreSQL/Prisma, Stripe et Cloudinary disposent de leur schéma, configuration ou points d’intégration ; les raccordements persistants encore absents sont identifiés sans ambiguïté dans les limites connues.

## Sommaire

- [Architecture](#architecture)
- [Arborescence des pages](#arborescence-des-pages)
- [Technologies](#technologies)
- [Structure des dossiers](#structure-des-dossiers)
- [Fonctionnalités](#fonctionnalités)
- [Démarrage local](#démarrage-local)
- [Mode démonstration](#mode-démonstration)
- [PostgreSQL et Prisma](#postgresql-et-prisma)
- [Créer un administrateur](#créer-un-administrateur)
- [Configurer Stripe](#configurer-stripe)
- [Configurer Cloudinary](#configurer-cloudinary)
- [Déployer sur Vercel](#déployer-sur-vercel)
- [Tests et qualité](#tests-et-qualité)
- [Limites connues de la démonstration](#limites-connues-de-la-démonstration)

## Architecture

L’application suit une architecture en couches afin que l’interface, la logique métier et les accès externes restent indépendants :

1. **Présentation** — routes Next.js App Router, composants React et styles Tailwind.
2. **Domaine** — recherche catalogue, panier, stock, commandes, réservations, validation et autorisations sous forme de fonctions TypeScript pures.
3. **API serveur** — validation Zod, sessions JWT signées, limitation de débit, protection d’origine et routes Stripe.
4. **Données** — catalogue TypeScript de démonstration ou modèles Prisma reliés à PostgreSQL.
5. **Services externes** — Stripe pour le paiement et Cloudinary pour les médias de production.

Les objets uniques sont limités à une unité. La validation finale du stock doit être effectuée dans une transaction PostgreSQL avec une mise à jour conditionnelle ; le panier du navigateur n’est jamais considéré comme une réservation de stock. Le webhook Stripe est la source de vérité pour confirmer un paiement.

La description détaillée des dépendances, flux métier et modèles se trouve dans [ARCHITECTURE.md](./ARCHITECTURE.md).

## Arborescence des pages

```text
/
├── catalogue
├── ceramique
│   └── [[...segments]]
├── revues-auto-moto
│   └── [[...segments]]
├── cartes-postales
│   └── [[...segments]]
├── collections
│   └── [slug]
├── produits
│   └── [slug]
├── nouveautes
├── objets-rares
├── promotions
├── a-propos
├── contact
├── faq
├── panier
├── commande
│   └── confirmation
├── connexion
├── inscription
├── mot-de-passe-oublie
├── compte
│   ├── commandes
│   ├── favoris
│   ├── reservations
│   └── adresses
├── admin
│   ├── produits
│   ├── collections
│   ├── categories
│   ├── commandes
│   ├── reservations
│   ├── clients
│   ├── promotions
│   ├── messages
│   ├── import-export
│   └── contenus
├── mentions-legales
├── cgv
├── confidentialite
├── cookies
└── livraison-retours
```

Les principales routes HTTP sont :

| Méthode | Route | Rôle |
| --- | --- | --- |
| `POST` | `/api/auth/login` | ouvrir une session signée |
| `POST` | `/api/auth/logout` | supprimer la session |
| `POST` | `/api/auth/register` | créer un compte ou simuler l’inscription en démo |
| `POST` | `/api/contact` | envoyer une demande d’information |
| `POST` | `/api/reservations` | demander la réservation d’un objet |
| `POST` | `/api/checkout` | créer une session de paiement Stripe |
| `POST` | `/api/stripe/webhook` | vérifier et traiter les événements Stripe |
| `GET` | `/api/admin/export` | exporter le catalogue en CSV, rôle administrateur requis |
| `POST` | `/api/admin/import` | importer un CSV, rôle administrateur requis |

## Technologies

- **Next.js 16**, App Router et React 19 ;
- **TypeScript strict** ;
- **Tailwind CSS 4** pour l’interface responsive ;
- **PostgreSQL** et **Prisma ORM 7** avec l’adaptateur `pg` ;
- sessions **JWT HS256** signées avec `jose`, mots de passe hachés avec `bcryptjs` ;
- **Zod 4** pour valider les entrées serveur ;
- **Stripe Checkout** et webhook signé ;
- **Cloudinary** pour les images de production ;
- **Vitest 4** et couverture V8 pour les tests métier.

## Structure des dossiers

```text
collection-ecommerce/
├── prisma/
│   ├── migrations/          # historique SQL versionné
│   ├── schema.prisma        # modèle relationnel
│   └── seed.ts              # données de démonstration idempotentes
├── public/                  # fichiers statiques éventuels
├── src/
│   ├── app/                 # pages, layouts et routes HTTP Next.js
│   ├── components/          # composants catalogue, commerce, formulaires et layout
│   ├── data/                # catalogue TypeScript du mode vitrine
│   ├── generated/prisma/    # client généré ; ne pas modifier à la main
│   ├── lib/
│   │   ├── domain/          # règles métier pures et testables
│   │   └── server/          # session, sécurité HTTP et intégrations serveur
│   ├── types/               # contrats TypeScript partagés
│   └── __tests__/           # tests Vitest
├── .env.example             # inventaire des variables, sans secret
├── prisma.config.ts         # configuration Prisma 7 et commande de seed
└── vitest.config.ts         # configuration des tests
```

## Fonctionnalités

- 3 univers, sous-catégories, périodes et 6 collections éditoriales ;
- 24 objets de démonstration documentés, soit 8 par univers ;
- recherche tolérante aux accents et filtres combinables ;
- tri par prix, date, nouveauté, ordre alphabétique et rareté ;
- fiches produits avec galerie, caractéristiques, état, défauts, provenance et produits associés ;
- ajout d’annonces depuis l’administration, avec validation, détection des doublons et conservation locale après redémarrage ;
- panier et favoris conservés dans le navigateur ;
- calculs monétaires déterministes en centimes ;
- limitation stricte des objets uniques et instantané des lignes de commande ;
- demandes de réservation avec cycle en attente, acceptation, refus, annulation et expiration ;
- authentification par cookie `HttpOnly`, rôles `USER` et `ADMIN` ;
- import/export CSV protégé ;
- paiement Stripe activé uniquement si toute sa configuration est valide ;
- pages légales, métadonnées, navigation accessible, états vides et messages d’erreur ;
- en-têtes de sécurité et validation des requêtes côté serveur.

## Démarrage local

Prérequis : **Node.js 20 ou supérieur**, npm et, pour le mode connecté, une instance PostgreSQL.

### Ouverture simple sous Windows

Double-cliquer sur l’icône **L’Inventaire — Ouvrir** placée sur le Bureau, ou sur
`OUVRIR_LE_SITE.bat` dans le dossier du projet. Le lanceur démarre le serveur
local et ouvre automatiquement `http://localhost:3000` dans Google Chrome
lorsqu’il est installé, ou dans le navigateur par défaut. Garder la fenêtre du
serveur ouverte pendant l’utilisation du site.

Pour administrer le catalogue, double-cliquer sur l’icône **L’Inventaire — AJOUTER UNE ANNONCE** du Bureau. Elle démarre également le site si nécessaire, puis ouvre directement le formulaire protégé.

Le fichier `index.html` présent à la racine sert de page d’accès. Il peut être
ouvert directement, mais le lanceur doit avoir démarré le serveur pour que les
fonctions dynamiques du site soient disponibles.

```bash
copy .env.example .env
npm install
npm run dev
```

Sous macOS ou Linux, remplacer `copy` par `cp`. `prisma.config.ts` contient une URL locale de secours utilisée uniquement pour permettre la génération du client et le build sans secret. Ces opérations ne contactent aucune base. Avant une migration ou un déploiement, renseigner impérativement une vraie `DATABASE_URL` ; le seed refuse explicitement de s’exécuter sans elle.

Ouvrir ensuite [http://localhost:3000](http://localhost:3000).

Avant de proposer une modification :

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Mode démonstration

Sans base ni clés externes, les pages publiques combinent les données de `src/data` et les annonces ajoutées depuis l’administration. Celles-ci sont conservées dans `.data/admin-products.json`, un fichier local ignoré par Git. Les visuels sont des illustrations SVG générées par `DemoArtwork`, clairement signalées comme démonstration ; les favoris ainsi que le panier sont enregistrés dans `localStorage`.

L’authentification simulée est volontairement désactivée par défaut. Pour l’autoriser en développement uniquement :

```dotenv
DEMO_AUTH_ENABLED=true
DEMO_REGISTRATION_ENABLED=true
DEMO_ADMIN_EMAIL=admin@example.test
DEMO_ADMIN_NAME=Administrateur démo
DEMO_ADMIN_PASSWORD_HASH=<hachage bcrypt>
```

Créer localement un hachage bcrypt de coût 12, puis placer uniquement le résultat dans `.env`. Dans ce fichier, chaque caractère `$` du hachage doit être échappé en `\$` afin que Next.js ne l’interprète pas comme une variable :

```bash
node -e "require('bcryptjs').hash(process.argv[1], 12).then(console.log)" "un-mot-de-passe-de-test"
```

En l’absence d’un `AUTH_SECRET` d’au moins 32 caractères, le mode démo génère une clé aléatoire en mémoire. Toutes les sessions deviennent alors invalides au redémarrage. Cette solution de secours est impossible en production. `AUTH_SESSION_MAX_AGE_SECONDS` permet de régler la durée entre 300 secondes et 7 jours.

Les variables `DEMO_USER_EMAIL`, `DEMO_USER_NAME` et `DEMO_USER_PASSWORD_HASH` ajoutent de la même façon un compte client de test. L’inscription simulée ne persiste pas après la requête.

## PostgreSQL et Prisma

1. Créer une base PostgreSQL vide.
2. Renseigner sa chaîne de connexion dans `.env` (fichier chargé par Prisma CLI) :

   ```dotenv
   DATABASE_URL=postgresql://utilisateur:mot-de-passe@hote:5432/linventaire?schema=public
   ```

3. Générer le client Prisma dans `src/generated/prisma` :

   ```bash
   npm run db:generate
   ```

4. Créer/appliquer la première migration en développement :

   ```bash
   npm run db:migrate -- --name init_collection_store
   ```

5. Insérer les catégories, sous-catégories, 6 collections, 24 produits, images, contenus et le code `BIENVENUE10` :

   ```bash
   npm run db:seed
   ```

Le seed est idempotent : il peut être relancé sans dupliquer les données. Pour inspecter la base :

```bash
npm run db:studio
```

Après modification du schéma, créer une nouvelle migration nommée et versionner le dossier généré. En production, ne jamais exécuter `migrate dev` ; utiliser :

```bash
npm run db:deploy
```

## Créer un administrateur

La méthode durable passe par le seed. Ajouter temporairement ces variables dans `.env` :

```dotenv
SEED_ADMIN_EMAIL=admin@votre-domaine.fr
SEED_ADMIN_PASSWORD=<mot-de-passe-unique-de-12-caracteres-minimum>
SEED_ADMIN_FIRST_NAME=Prénom
SEED_ADMIN_LAST_NAME=Nom
```

Puis relancer :

```bash
npm run db:seed
```

Le mot de passe est haché avec bcrypt (coût 12) et le compte est créé ou mis à jour avec le rôle `ADMIN`. Retirer ensuite `SEED_ADMIN_PASSWORD` de l’environnement courant et de la configuration d’hébergement ; cette variable n’est pas nécessaire au fonctionnement de l’application. Ne jamais versionner `.env`.

À ce stade, cette commande prépare bien l’administrateur persistant en base, mais `/api/auth/login` ne consulte pas encore Prisma. Il faut raccorder la recherche `User` et la comparaison de `passwordHash` avant que ce compte puisse ouvrir une session. Pour parcourir l’administration dans la démonstration actuelle, utiliser le compte `DEMO_ADMIN_*` décrit plus haut.

Le compte `DEMO_ADMIN_*` décrit plus haut sert uniquement à une démonstration locale et ne remplace pas cet administrateur PostgreSQL.

## Configurer Stripe

Renseigner les variables de test Stripe dans `.env` :

```dotenv
NEXT_PUBLIC_SITE_URL=http://localhost:3000
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
```

Pour recevoir les événements en local avec la CLI Stripe :

```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Reporter le secret `whsec_…` affiché par la CLI dans `STRIPE_WEBHOOK_SECRET`, redémarrer le serveur, puis lancer un paiement avec une carte de test Stripe. La route lit le corps brut et vérifie la signature avant tout traitement.

En production, créer un endpoint Stripe vers :

```text
https://votre-domaine.fr/api/stripe/webhook
```

Sélectionner les événements `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired` et `checkout.session.async_payment_failed`. Utiliser exclusivement les clés du même environnement Stripe.

**Important : conserver des clés Stripe de test dans l’état actuel du projet.** Le webhook vérifie et déduplique localement les événements, mais la transaction Prisma qui crée la commande et décrémente le stock reste un point d’intégration documenté. Ne pas activer les clés réelles avant d’avoir implémenté et testé cette transaction ainsi qu’une déduplication persistante. Si la clé secrète, le secret webhook ou l’URL publique sont absents ou invalides, `/api/checkout` revient automatiquement à une réponse de démonstration et aucun paiement réel n’est créé.

## Configurer Cloudinary

1. Créer un environnement Cloudinary et relever le nom du cloud, la clé API et le secret.
2. Renseigner `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` et `CLOUDINARY_API_SECRET` dans `.env` puis dans Vercel.
3. Conserver le secret côté serveur uniquement ; ne jamais le préfixer par `NEXT_PUBLIC_`.
4. Créer un dossier Cloudinary dédié, limiter les formats et la taille des fichiers, puis enregistrer dans Prisma l’URL sécurisée, le texte alternatif, la position et l’indicateur d’image principale.

Next.js négocie WebP/AVIF pour les images compatibles. Les SVG de démonstration sont générés dans l’interface et ne sont pas envoyés à Cloudinary. Les variables sont prêtes, mais la route d’upload administrateur n’est pas encore implémentée ; elle doit rester serveur, valider le rôle et signer chaque envoi.

## Déployer sur Vercel

1. Pousser le projet dans un dépôt Git et l’importer dans Vercel comme application Next.js.
2. Créer une base PostgreSQL de production et ajouter `DATABASE_URL` aux environnements nécessaires.
3. Ajouter toutes les variables de `.env.example`. Utiliser un `AUTH_SECRET` aléatoire d’au moins 32 caractères et `NEXT_PUBLIC_SITE_URL=https://votre-domaine.fr`.
4. Exécuter `npm run db:deploy` depuis un environnement autorisé à joindre la base, puis `npm run db:seed` si les données initiales sont souhaitées.
5. Déployer ; `postinstall` génère automatiquement le client Prisma.
6. Préparer Cloudinary, puis créer un webhook **Stripe test** sur l’URL Vercel définitive et mettre son secret à jour dans Vercel.
7. Redéployer après toute modification de variable d’environnement et effectuer un paiement de bout en bout en mode test. Le passage en Stripe Live attend le raccordement persistant décrit ci-dessous.

Pour éviter deux migrations concurrentes lors de plusieurs déploiements, exécuter `db:deploy` dans une étape CI unique ou manuellement avant la promotion en production, plutôt que dans chaque instance de build.

## Tests et qualité

```bash
npm test                 # suite unitaire, une exécution
npm run test:watch       # développement en continu
npm run test:coverage    # rapport texte + HTML
npm run typecheck        # TypeScript strict
npm run lint             # règles Next.js/React
```

La suite couvre la recherche et les filtres combinés, les calculs du panier, les instantanés de commande, la concurrence sur un objet unique, les transitions de réservation, la validation des formulaires et la protection administrateur. Les tests de domaine n’ont besoin ni de PostgreSQL, ni de Stripe, ni du navigateur.

## Limites connues de la démonstration

- Les annonces ajoutées sont durables sur l’ordinateur local et réapparaissent dans le catalogue après redémarrage, mais ce fichier JSON ne constitue pas un stockage de production et ne persiste pas de façon fiable sur Vercel. PostgreSQL reste nécessaire pour la boutique en ligne.
- Le panier et les favoris sont locaux au navigateur, sans synchronisation entre appareils ni fusion après connexion.
- La connexion actuelle ne connaît que les comptes `DEMO_*` en développement. Le schéma `User` et l’administrateur créé par le seed ne sont pas encore raccordés à `/api/auth/login`.
- L’inscription, les contacts, les réservations et l’import CSV de démonstration renvoient un résultat contrôlé mais ne sont pas persistés et n’envoient pas d’e-mail.
- Les sessions utilisant la clé aléatoire de secours disparaissent au redémarrage ; elles sont strictement interdites en production.
- Sans configuration Stripe complète, le tunnel simule la création du paiement. Avec des clés de test, Checkout est réel, mais le webhook ne persiste pas encore la commande et ne modifie pas le stock ; sa déduplication en mémoire disparaît lors d’un redéploiement.
- Les illustrations SVG générées par l’interface sont des visuels originaux temporaires ; la route de téléversement et les transformations Cloudinary restent à raccorder.
- Les garanties contre le double achat deviennent réellement atomiques uniquement lorsqu’elles sont exécutées dans une transaction PostgreSQL ; le checkout actuel relit le catalogue de démonstration mais ne crée pas encore de verrou ou de `InventoryHold` persistant.
- Les pages de facture, retour, récupération de mot de passe, statistiques avancées et contenu administrable constituent des points d’extension lorsqu’aucun service métier persistant n’est branché.

## Sécurité avant mise en production

- remplacer toutes les valeurs de démonstration et désactiver `DEMO_AUTH_ENABLED` ainsi que `DEMO_REGISTRATION_ENABLED` ;
- utiliser un gestionnaire de secrets et faire tourner toute clé exposée ;
- vérifier les rôles côté serveur sur chaque route d’administration ;
- activer une limitation de débit partagée (Redis/KV) sur plusieurs instances Vercel ;
- raccorder l’authentification, les commandes, le stock, les réservations, les messages et les imports à Prisma ;
- remplacer la déduplication Stripe en mémoire par `WebhookEvent` avec une contrainte unique et une transaction ;
- tester sauvegardes, restauration PostgreSQL, politique de conservation et suppression des données ;
- compléter les informations légales, fiscales, livraison, retours et consentement cookies avec le responsable du site.

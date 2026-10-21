# Base de données Supabase

Une fois Supabase configuré, SkyCRM enregistre ses données dans une base PostgreSQL
en ligne au lieu du navigateur, ce qui les rend accessibles depuis tous vos appareils.
Sans configuration, l'application continue de fonctionner en local.

## Mise en place (une seule fois)

1. Créez un projet gratuit sur https://supabase.com.
2. **SQL Editor → New query** : collez le contenu de [`schema.sql`](schema.sql) puis cliquez sur **Run**.
3. **Authentication → Users → Add user → Create new user** : saisissez votre email et un mot de passe
   (cochez *Auto Confirm User*). C'est le compte avec lequel vous vous connecterez.
4. **Authentication → Sign In / Providers** : désactivez *Allow new users to sign up*
   pour que personne d'autre ne puisse créer de compte.
5. **Project Settings → API Keys** : copiez l'URL du projet et la clé publishable (*anon public*).
6. Renseignez-les :
   - en local, dans un fichier `.env.local` à la racine :
     ```
     VITE_SUPABASE_URL=https://xxxx.supabase.co
     VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
     ```
   - sur Vercel : **Settings → Environment Variables**, avec les mêmes noms, puis redéployez.

## Récupérer vos données existantes

À la première connexion, si la base est vide, les données déjà présentes dans le navigateur
y sont envoyées automatiquement (elles restent aussi dans le navigateur, par sécurité).
Pour transférer les données d'un autre appareil : **Paramètres → Exporter en JSON** sur
l'ancien appareil, puis **Importer un fichier JSON** une fois connecté.

# React + Vite

## Phase 3 — invitations et réseau communautaire

Le frontend Phase 3 utilise des RPC Supabase limitées au membre connecté pour consulter son réseau. La page d’invitation ne révèle que le prénom et le nom associés à un code d’affiliation valide. À la création du profil, un trigger résout ce code côté base et renseigne `referred_by`; le client ne transmet jamais lui-même l’identifiant du parrain. Les champs de rôle, parrain, code d’affiliation, numéro de membre et quartier sont protégés contre les modifications d’un membre.

### Migration à appliquer

La migration minimale est `supabase/migrations/20260927190000_phase3_community_network.sql`. Elle ne recrée pas de tables et ne modifie pas les policies RLS. Elle ajoute les RPC du réseau et les triggers nécessaires à l’attribution d’invitation ainsi qu’à la protection des champs gérés par IDA.

Ce workspace n’est actuellement pas lié au projet Supabase (`supabase db push --linked --dry-run` indique qu’aucun project ref n’est configuré). Après avoir confirmé le bon projet dans Supabase, appliquer le SQL du fichier de migration depuis **Supabase Dashboard → SQL Editor**, ou lier d’abord ce dépôt puis exécuter la migration via le CLI. Ne pas mettre de clé `service_role` dans l’application.

L’inscription seule demeure possible sans invitation : `referred_by` reste alors `NULL`. Pour une invitation, la migration lit `referral_code` dans les métadonnées Auth, retrouve l’identifiant du membre côté serveur et ignore toute valeur `referred_by` fournie par le navigateur. Le code d’affiliation propre du nouvel inscrit continue d’être généré par la logique Phase 1 existante. Le seuil de 20 indique uniquement une éligibilité; le rôle `leader` n’est jamais attribué automatiquement.

Après application, vérifier avec deux comptes de test distincts qu’une invitation produit bien le rattachement attendu, que les RPC du compteur et de la liste arborescente répondent pour chaque compte, et qu’un membre ne peut modifier ni son rôle ni son parrain. Ces scénarios exigent un accès authentifié de test au projet; aucun compte ou profil de test n’est créé par ce dépôt.

Les colonnes existantes utilisées par la migration sont `profiles.id`, `first_name`, `last_name`, `affiliate_code`, `referred_by`, `neighborhood_id`, `member_number`, `role`, `created_at`, `is_active` et `neighborhoods.id/name`. Elles ont été vérifiées via l’API PostgREST configurée; aucune donnée de profil n’a été lue.

## Phase 7 — actualités, actions, informations et dons

Avant d’ajouter les contenus, le schéma Supabase existant a été interrogé en lecture seule. `activities`, `missions`, `reports`, `news`, `important_information` et `donations` existent déjà. Les actualités réutilisent `news` (`excerpt` pour le résumé, `author_id` pour l’auteur, et `status` déjà présent); la migration n’ajoute que `image_url` si elle manque. Les activités Phase 5 restent les comptes opérationnels des leaders; les actions éditoriales publiques utilisent `public_actions`, seule table de contenu manquante. `important_information` est adaptée en place : `status` est ajouté car `is_active` ne distingue pas brouillon, publié et archivé. `status` est la source de vérité et le trigger synchronise `is_active` pour la compatibilité des anciens lecteurs.

### Migration Phase 7

Appliquer `supabase/migrations/20260928150000_phase7_public_content.sql` dans **Supabase Dashboard → SQL Editor** après avoir vérifié le projet lié. Cette migration crée la table d’actions manquante, adapte `important_information`, ajoute `image_url` à `news` si nécessaire, maintient RLS, donne accès public à la lecture publiée et réserve la gestion à `admin`/`administrator` et `founder`/`fondateur`. Des policies restrictives encadrent les policies historiques de `news` et `important_information` sans les supprimer.

Le projet ne possède pas de bucket Supabase Storage configuré pour les médias éditoriaux. En Phase 7, l’administration peut renseigner une URL d’image; aucun téléversement Storage n’est simulé. La page Dons prépare un message WhatsApp; aucun paiement, transfert ou enregistrement de promesse n’est réalisé. Une future intégration de paiement devra être serveur et utiliser un fournisseur configuré séparément.

Après application, vérifier la lecture anonyme des contenus publiés, la visibilité des brouillons uniquement pour les administrateurs/fondateurs, ainsi que les opérations de publication, archivage et suppression avec ces rôles. Les pages afficheront une erreur d’indisponibilité tant que cette migration n’aura pas été appliquée.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

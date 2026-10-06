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

Contrôle PostgREST en lecture seule réalisé le 6 octobre 2026, sans sélectionner de lignes : `news`, `important_information` et `donations` sont exposées. `news.status` existe; `news.category` est absente. `important_information` possède `is_active`, `priority`, `published_at`, `created_by`, `created_at` et `updated_at`, mais **pas** `status`. `public_actions` n’est pas présente dans le cache PostgREST. Dans `donations`, `amount`, `currency`, `status`, `donor_name`, `payment_method` et `created_at` sont visibles, mais `objective` ne l’est pas; ces résultats ne révèlent pas l’état RLS ni les données des donateurs. Le projet Supabase n’est pas lié au CLI de ce workspace.

Le client éditorial détecte l’ancien schéma d’`important_information` et utilise `is_active` pour publier/dépublier au lieu d’envoyer une colonne `status` inexistante. Tant que le statut distinct n’est pas migré, l’archivage des informations est désactivé. Les actions éditoriales publiques sont séparées des enregistrements opérationnels de `activities`.

### Migration Phase 7

Appliquer `supabase/migrations/20260928150000_phase7_public_content.sql` dans **Supabase Dashboard → SQL Editor**, en vérifiant d’abord que le projet cible est le bon. La migration idempotente crée `public_actions`, ajoute `important_information.status` et `news.category` si absentes, configure les triggers et les policies RLS pour que le public ne lise que les contenus publiés et que seuls les rôles d’administration éditent. Elle ne supprime aucune table ni aucune donnée. Elle envoie `NOTIFY pgrst, 'reload schema'` à la fin. Puis vérifier dans Supabase que la migration réussit et recharger le schéma PostgREST.

Le projet ne possède pas de bucket Supabase Storage configuré pour les médias éditoriaux. L’administration peut renseigner une URL d’image; aucun téléversement Storage n’est simulé. La page Dons prépare une demande WhatsApp; aucun paiement, transfert ou enregistrement de promesse n’est réalisé. La table `donations` existante n’a pas été modifiée et ne contient pas de colonne `objective` exposée. Le paiement réel requiert un fournisseur et des endpoints/webhooks serveur; voir [docs/donations-paiements.md](docs/donations-paiements.md).

RLS et fonctions doivent être vérifiées dans Supabase Dashboard avec un accès administrateur au projet; une clé publishable ne peut pas établir à elle seule l’état des policies. Après migration, vérifier la lecture anonyme des contenus publiés, l’isolation des brouillons, ainsi que les opérations de publication, dépublication, archivage et suppression avec les rôles autorisés. Tant que la migration n’est pas appliquée, la liste d’actions publiques et la catégorie actualité restent indisponibles; les annonces continuent à utiliser `is_active` sans archive distincte.

## Phase 8 — éligibilité leader côté base

`supabase/migrations/20261006120000_phase8_leader_eligibility.sql` ajoute un trigger défensif sur la table existante `profiles`. Une transition `member` vers `leader` est rejetée par la base tant que le membre ne compte pas au moins 20 descendants dans `referred_by`. Aucun rôle n’est attribué automatiquement et aucune colonne ou donnée n’est créée, supprimée ou modifiée. Appliquer cette migration au projet distant pour protéger également les appels directs au RPC de changement de rôle.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

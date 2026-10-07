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

Un contrôle supplémentaire des seules colonnes confirme que les tables opérationnelles distantes ne correspondent pas à la migration Phase 5 actuelle : `missions` n’expose pas `leader_id` ni `objective` et utilise notamment `start_date`/`end_date`; la table de liaison `mission_assignments` existe et expose `mission_id`, `leader_id`, `assigned_by`, `assigned_at`. `activities` n’expose pas `leader_id`, `activity_type`, `participants_count` ni `mission_id`; `reports` n’expose pas `leader_id`, `summary`, `activities_done`, `participants_count`, `performed_on` ni `observations`, mais expose `author_id`, `title`, `description`, `activity_date`, `location`, `results` et `status`. `report_history` et `admin_action_logs` ne sont pas présentes dans le cache API. Ce décalage implique que la migration Phase 5 présente dans le dépôt **ne doit pas être exécutée telle quelle** : ses `CREATE TABLE IF NOT EXISTS` laisseraient les tables existantes intactes puis les index, RPC et policies qui supposent les autres colonnes échoueraient ou ne protégeraient pas le bon propriétaire.

Des appels PostgREST incomplets, qui s’arrêtent à la résolution des signatures sans exécuter de mutation, indiquent également que `set_member_role`, `create_mission`, `create_activity`, `create_report` et `validate_report` ne sont pas publiées dans le cache de fonctions distant. Les interfaces qui en dépendent ne peuvent donc pas être considérées comme fonctionnelles dans la base distante actuelle. Les colonnes détectées ne sont que celles testées individuellement via la clé publique, pas un inventaire exhaustif du schéma.

Les RPC de réseau `get_network_member_count`, `get_my_network_stats` et `get_my_network_members` sont également absentes du cache. Les colonnes nécessaires à la migration Phase 3 ont été confirmées par probes sans lignes (`profiles`, `neighborhoods`), mais il faut encore examiner dans Supabase les policies RLS préexistantes avant validation par rôle. La migration Phase 4 est nécessaire avant Phase 8 car son RPC contrôlé `set_member_role` n’existe pas et le journal `admin_action_logs` est absent.

Le client éditorial détecte l’ancien schéma d’`important_information` et utilise `is_active` pour publier/dépublier au lieu d’envoyer une colonne `status` inexistante. Tant que le statut distinct n’est pas migré, l’archivage des informations est désactivé. Les actions éditoriales publiques sont séparées des enregistrements opérationnels de `activities`.

### Migration Phase 7

Le schéma actuel expose `news.status` mais pas `news.image_url` ni `news.category`; il expose `important_information.is_active` mais pas `status`; `public_actions` n’existe pas encore. Appliquer `supabase/migrations/20260928150000_phase7_public_content.sql` dans **Supabase Dashboard → SQL Editor**, après avoir vérifié le projet. Cette migration idempotente ajoute les colonnes manquantes, crée `public_actions`, configure les triggers/RLS et notifie PostgREST. Elle ne supprime ni table ni données. Après exécution, relancer les probes `supabase/rls-audit.sql` et vérifier l’accès public anonyme aux seuls contenus publiés.

Le projet ne possède pas de bucket Supabase Storage configuré pour les médias éditoriaux. L’administration peut renseigner une URL d’image; aucun téléversement Storage n’est simulé. La page Dons prépare une demande WhatsApp; aucun paiement, transfert ou enregistrement de promesse n’est réalisé. La table `donations` existante n’a pas été modifiée et ne contient pas de colonne `objective` exposée. Le paiement réel requiert un fournisseur et des endpoints/webhooks serveur; voir [docs/donations-paiements.md](docs/donations-paiements.md).

RLS et fonctions doivent être vérifiées dans Supabase Dashboard avec un accès administrateur au projet; une clé publishable ne peut pas établir à elle seule l’état des policies. Après migration, vérifier la lecture anonyme des contenus publiés, l’isolation des brouillons, ainsi que les opérations de publication, dépublication, archivage et suppression avec les rôles autorisés. Tant que la migration n’est pas appliquée, la liste d’actions publiques et la catégorie actualité restent indisponibles; les annonces continuent à utiliser `is_active` sans archive distincte.

## Phase 8 — éligibilité leader côté base

`supabase/migrations/20261006120000_phase8_leader_eligibility.sql` ajoute un trigger défensif sur la table existante `profiles`. Une transition `member` vers `leader` est rejetée par la base tant que le membre ne compte pas au moins 20 descendants dans `referred_by`. Aucun rôle n’est attribué automatiquement et aucune colonne ou donnée n’est créée, supprimée ou modifiée. Appliquer cette migration au projet distant pour protéger également les appels directs au RPC de changement de rôle.

## Réparation du rôle administrateur

Le schéma distant n’expose ni `set_member_role()` ni `admin_action_logs`, cause confirmée de l’échec du bouton du fondateur. Appliquer `supabase/migrations/20261007110000_phase10_role_nomination_repair.sql`. Elle crée le journal manquant avec RLS et une fonction RPC transactionnelle : le fondateur peut nommer/retirer un administrateur; un administrateur ordinaire ne peut gérer que les leaders; la cible ne peut pas être soi-même ou le fondateur. Toute nomination de leader exige 20 membres dans le réseau. Les refus d’accès directs à la table d’audit sont conservés; le journal est écrit par la fonction contrôlée. La migration notifie PostgREST.

Les requêtes read-only de vérification des états RLS, policies, colonnes, contraintes, triggers et grants se trouvent dans `supabase/rls-audit.sql`. La migration Phase 5 fournie dans le dépôt est incompatible avec les tables opérationnelles présentes dans le projet distant; ne l’appliquez pas tant qu’une version adaptée à `mission_assignments` et aux vrais champs de rapports/activités n’a pas été préparée. Aucune policy ne doit supposer `missions.leader_id` ou `reports.leader_id`.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

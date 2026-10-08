# Paiements de dons — état et prérequis

## État actuel

- Aucun SDK ou fournisseur de paiement n’est présent dans les dépendances ni dans le code examiné.
- Le projet est une application React/Vite statique ; `vercel.json` ne configure que le routage SPA.
- Aucun endpoint de paiement ni webhook Supabase Edge Function n’a été trouvé dans le dépôt.
- Le contrôle PostgREST sans lecture de lignes confirme que `public.donations` existe et expose `id`, `amount`, `currency`, `status`, `donor_name`, `payment_method` et `created_at`. `objective`, `first_name`, `last_name`, `email`, `phone`, `provider`, `reference` et `transaction_id` ne sont pas exposés sous ces noms. La contrainte et les valeurs permises de `status`, relations, triggers et politiques RLS n’ont pas pu être consultés avec la clé publique.
- Le dépôt n’est pas lié au CLI Supabase; les catalogues PostgreSQL, les contraintes et les policies distantes ne sont pas accessibles depuis les identifiants locaux.
- Aucun paiement ne peut être créé, confirmé ou remboursé à ce stade. Le formulaire public ne fait que préparer une demande WhatsApp et le précise explicitement.

## Blocage Vercel observé

Lors du contrôle du 6 octobre 2026, la version publique `https://ongida.vercel.app/` affichait l’erreur de démarrage « Configuration de l’application incomplète ». La console indiquait que `VITE_SUPABASE_URL` et la clé publique de navigateur n’étaient pas injectées dans le build de production. Le CLI Vercel n’était pas installé ni lié dans ce workspace; ces variables n’ont donc pas pu être corrigées à distance.

## Décisions requises avant l’implémentation

1. Choisir le prestataire avec l’ONGD : paiements réellement disponibles pour les donateurs en RDC (notamment moyens locaux/mobile money), devise de règlement, coûts, délais, remboursements et éventuel paiement international.
2. Obtenir un compte marchand de production et un compte sandbox/test auprès de ce prestataire.
3. Dans Supabase, vérifier en lecture seule le schéma de `public.donations` (colonnes, types, contraintes, relations, triggers, RLS et policies) ainsi que les fonctions existantes. Ne pas supposer que `status` existe.
4. Confirmer la politique de confidentialité et les coordonnées minimales à collecter. L’anonymat doit être compatible avec les obligations du prestataire et de conformité.

## Flux serveur recommandé

1. Le frontend envoie uniquement l’objectif, le montant, la devise et les coordonnées nécessaires vers un endpoint serveur.
2. L’endpoint valide les données, crée/réutilise un enregistrement `pending` selon le schéma effectivement vérifié, puis demande au prestataire une session de paiement. Aucune clé privée n’est envoyée au navigateur.
3. Le visiteur est redirigé vers la page de paiement hébergée du prestataire.
4. Un webhook serveur vérifie la signature du prestataire, l’identifiant de transaction, le montant et la devise. Le traitement doit être idempotent et mettre à jour l’enregistrement selon les états effectivement supportés.
5. La page de retour interroge le serveur pour l’état vérifié. Les paramètres d’URL ou le retour du navigateur ne constituent jamais une preuve de paiement.
6. Un reçu/succès n’est présenté comme confirmé qu’après validation serveur du webhook ou vérification serveur équivalente auprès du prestataire.

Les états internes souhaités sont `pending`, `paid`, `failed`, `cancelled` et `refunded`, mais ils ne doivent être ajoutés ni à une colonne ni à une table avant l’inspection du schéma réel. Aucun SQL n’est fourni ou exécuté dans cette phase, car la structure à modifier n’est pas vérifiée.

## Hébergement des secrets

Les noms précis dépendront du prestataire. À titre de convention, prévoir des secrets serveur tels que `PAYMENT_PROVIDER_SECRET_KEY` et `PAYMENT_WEBHOOK_SECRET`, stockés exclusivement dans les variables d’environnement Vercel côté serveur ou les secrets Supabase Edge Function. Une éventuelle `SUPABASE_SERVICE_ROLE_KEY` ne doit jamais être préfixée par `VITE_` ni intégrée à React. Toute écriture doit rester derrière un endpoint serveur et respecter les politiques RLS retenues.

Les seules variables frontend Supabase attendues par le code actuel sont `VITE_SUPABASE_URL` et soit `VITE_SUPABASE_PUBLISHABLE_KEY`, soit `VITE_SUPABASE_ANON_KEY`. Ces clés publiques n’autorisent pas à exposer une clé privilégiée.

## Tests requis avant production

- Tests sandbox réussis/échoués/annulés, paiements dupliqués, webhook invalide, devise ou montant modifié, remboursement et retour navigateur sans webhook.
- Vérification que les visiteurs ne peuvent ni s’attribuer `paid`, ni lire des données personnelles d’autres donateurs, ni modifier une transaction.
- Réconciliation d’un paiement auprès du prestataire et journalisation sans données sensibles.
- Vérification des reçus, de l’anonymat, des montants et des devises auprès de l’ONGD.
# Mur de Post-it 2.0

**Auteur : ATTAR AYOUB**

## Lancer le projet

```bash
npm install
npm start
```

Ouvrir : http://localhost:3000

---

## Fonctionnalités ajoutées

- **Commentaires** — Ajouter / supprimer des commentaires sur chaque post (persistés en SQLite)
- **Réactions emoji** — Réagir à un post avec ❤️ 😂 👍 🔥 😮 (compteur en temps réel)
- **Épinglage** — Épingler / désépingler un post (les épinglés apparaissent en premier)
- **Compteur de vues** — Incrémenté à chaque ouverture du panneau commentaires
- **Likes** — Liker / unliker un post (état sauvegardé en localStorage)
- **Recherche & Filtres** — Par texte, auteur, catégorie, période
- **Pagination** — 12 posts par page
- **Dark mode** — Bascule thème clair/sombre (persisté en localStorage)
- **Couleurs** — 6 couleurs de post-it au choix
- **Catégories** — Tags : Idée, Bug, Todo, Important, Question
- **Auto-refresh** — Rechargement automatique toutes les 30 secondes

## Stack technique

- **Back-end** : Node.js + Express (API REST)
- **Base de données** : SQLite via `better-sqlite3`
- **Front-end** : JavaScript vanilla (fetch / async-await, manipulation DOM)

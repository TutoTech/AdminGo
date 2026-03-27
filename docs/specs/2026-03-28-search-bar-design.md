# Design — Barre de recherche flashcards

**Date :** 2026-03-28
**Repo :** TutoTech/AdminGo

---

## Objectif

Permettre aux utilisateurs de retrouver une flashcard spécifique parmi les 510 en tapant un mot-clé. La recherche filtre le deck de cartes et s'intègre aux filtres domaine existants.

---

## Emplacement

Champ texte placé dans la sidebar filtres, au-dessus des checkboxes domaine (sous le titre "Domaines" et les boutons Tout/Rien). Sur mobile, accessible via le bouton "Filtres par Domaine" existant.

---

## Comportement

### Filtrage

- Recherche en temps réel sur l'événement `input`, avec un **debounce de 300ms**
- Porte sur les champs **`question`** et **`reponse`** de chaque carte
- **Insensible à la casse et aux accents** : normalisation Unicode NFD + suppression des diacritiques (regex `[\u0300-\u036f]`) avant comparaison, sur le terme de recherche comme sur les données
- S'applique **en intersection** avec les filtres domaine : une carte doit correspondre au terme de recherche ET appartenir à un domaine coché
- Terme vide = pas de filtre texte (retour au comportement normal)

### Intégration avec les filtres existants

La fonction `applyFilters()` existante filtre déjà par domaine puis shuffle. Elle sera étendue pour appliquer aussi le filtre texte avant le shuffle. L'ordre est :

1. Filtrer par domaines actifs
2. Filtrer par terme de recherche (si non vide)
3. Shuffle (Fisher-Yates)
4. Reset index et render

### Feedback utilisateur

- Le compteur existant `card-counter` ("12 / 510") reflète automatiquement le nombre de cartes filtrées
- Si aucune carte ne correspond : le message existant "Aucune carte disponible. Sélectionnez au moins un domaine." s'affiche (déjà géré par `renderCard()`)
- Un bouton "clear" (x) dans le champ permet d'effacer rapidement la recherche

---

## Modifications par fichier

### `index.html`

Ajout du champ de recherche dans la sidebar (`#filter-sidebar`), entre le bloc des boutons Tout/Rien et le conteneur de filtres `#filter-container` :

- Un `<div>` wrapper contenant :
  - Un `<input type="search">` avec `id="search-input"`, `placeholder="Rechercher..."`, `aria-label="Rechercher une flashcard"`
  - Un `<button>` clear (x) avec `id="btn-clear-search"`, masqué quand le champ est vide

### `app.js`

- Nouvelle fonction `normalizeText(str)` : supprime les accents et passe en minuscules
- Modification de `applyFilters()` : ajout du filtre texte entre le filtre domaine et le shuffle
- Fonction `debounce(fn, delay)` utilitaire
- Branchement de l'événement `input` sur le champ de recherche (debounced)
- Branchement du bouton clear pour vider le champ et relancer `applyFilters()`

### `styles.css`

- Styles pour le champ de recherche (cohérence avec le design existant : border-radius, couleurs via CSS variables)
- Styles pour le bouton clear
- Styles responsive pour mobile

---

## Hors périmètre

- Pas de suggestions / autocomplétion
- Pas de highlight du terme trouvé dans la carte
- Pas de recherche dans les explications
- Pas de nouveau fichier JS (tout dans `app.js` existant)

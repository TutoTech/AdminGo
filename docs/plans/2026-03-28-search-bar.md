# Search Bar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter une barre de recherche dans la sidebar filtres pour filtrer les flashcards par mot-clé (question + réponse), avec debounce et normalisation des accents.

**Architecture:** Un champ `<input type="search">` est ajouté dans la sidebar entre les boutons Tout/Rien et les checkboxes domaine. La fonction `applyFilters()` existante est étendue pour combiner filtre domaine + filtre texte avant le shuffle. Une fonction utilitaire `normalizeText()` gère la normalisation Unicode (accents + casse).

**Tech Stack:** HTML5, Vanilla JavaScript ES6+, CSS custom variables (stack existante, zéro dépendance ajoutée)

---

## Fichiers concernés

| Action   | Fichier       | Responsabilité |
|----------|---------------|----------------|
| Modifier | `index.html`  | Ajout du champ de recherche dans la sidebar |
| Modifier | `app.js`      | Logique de filtrage texte, debounce, normalisation |
| Modifier | `styles.css`  | Styles du champ de recherche et du bouton clear |

---

### Task 1 : Ajouter le champ de recherche dans le HTML

**Files:**
- Modify: `index.html:156-167` (entre les boutons Tout/Rien et `#filter-container`)

- [ ] **Step 1 : Ajouter le bloc HTML du champ de recherche**

Dans `index.html`, après le `</div>` fermant du bloc des boutons Tout/Rien (ligne 167) et avant le `<div id="filter-container">` (ligne 169), insérer :

```html
            <!-- Search -->
            <div class="search-wrapper mb-4">
              <input type="search" id="search-input" class="search-input" placeholder="Rechercher..."
                aria-label="Rechercher une flashcard" autocomplete="off" />
              <button id="btn-clear-search" class="search-clear" aria-label="Effacer la recherche"
                style="display:none;">✕</button>
            </div>
```

- [ ] **Step 2 : Vérifier que la page se charge sans erreur**

Ouvrir `index.html` via un serveur local :

```bash
cd /home/user/Documents/GitHub/AdminGo && python3 -m http.server 8000 &
```

Ouvrir `http://localhost:8000`, vérifier que le champ de recherche apparaît dans la sidebar entre les boutons Tout/Rien et les checkboxes domaine. Tuer le serveur ensuite.

- [ ] **Step 3 : Commit**

```bash
git add index.html
git commit -m "feat: add search input field in filter sidebar"
```

---

### Task 2 : Ajouter les styles du champ de recherche

**Files:**
- Modify: `styles.css` (ajouter après la section DOMAIN FILTERS, avant la section DARK MODE TOGGLE)

- [ ] **Step 1 : Ajouter les styles CSS**

Dans `styles.css`, après la règle `.filter-item input[type="checkbox"]` (ligne 650), ajouter :

```css
/* ============================================
   SEARCH BAR
   ============================================ */
.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  width: 100%;
  padding: 10px 36px 10px 14px;
  border-radius: 12px;
  border: 2px solid rgb(var(--color-border));
  background: rgb(var(--color-bg));
  color: rgb(var(--color-text));
  font-family: 'Nunito', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  transition: border-color 0.2s, box-shadow 0.2s;
  outline: none;
}

.search-input::placeholder {
  color: rgb(var(--color-text-secondary));
  opacity: 0.7;
}

.search-input:focus {
  border-color: rgb(var(--color-primary));
  box-shadow: 0 0 0 3px rgba(var(--color-primary), 0.15);
}

.search-clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: rgb(var(--color-text-secondary));
  font-size: 0.85rem;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
  border-radius: 50%;
  transition: color 0.2s, background 0.2s;
}

.search-clear:hover {
  color: rgb(var(--color-danger));
  background: rgba(var(--color-danger), 0.1);
}
```

- [ ] **Step 2 : Vérifier le rendu visuel**

Recharger la page. Vérifier :
- Le champ a un border-radius arrondi, cohérent avec le reste de l'UI
- Le focus affiche un outline vert (couleur primary)
- Le placeholder "Rechercher..." est visible en gris
- En mode sombre (cliquer le toggle), le champ reste lisible (fond sombre, texte clair)

- [ ] **Step 3 : Commit**

```bash
git add styles.css
git commit -m "feat: add search bar styles"
```

---

### Task 3 : Implémenter la logique de recherche dans app.js

**Files:**
- Modify: `app.js`

- [ ] **Step 1 : Ajouter la fonction `normalizeText`**

Dans `app.js`, après la section FISHER-YATES SHUFFLE (après la ligne 100), ajouter :

```javascript
// ============================================
// TEXT NORMALIZATION (accent-insensitive search)
// ============================================
function normalizeText(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}
```

- [ ] **Step 2 : Ajouter la fonction `debounce`**

Juste après `normalizeText`, ajouter :

```javascript
// ============================================
// DEBOUNCE UTILITY
// ============================================
function debounce(fn, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}
```

- [ ] **Step 3 : Ajouter la variable d'état `searchTerm`**

Dans la section `// --- State ---` en haut du fichier (après la ligne `let scoreDidnt = 0;`, ligne 13), ajouter :

```javascript
let searchTerm = '';
```

- [ ] **Step 4 : Modifier la fonction `applyFilters`**

Remplacer la fonction `applyFilters()` existante (lignes 161-168) par :

```javascript
function applyFilters() {
    let cards = allCards.filter((c) => activeDomains.has(c.domaine));

    if (searchTerm) {
        const normalizedSearch = normalizeText(searchTerm);
        cards = cards.filter((c) =>
            normalizeText(c.question).includes(normalizedSearch) ||
            normalizeText(c.reponse).includes(normalizedSearch)
        );
    }

    filteredCards = shuffleArray(cards);
    currentIndex = 0;
    isFlipped = false;
    renderCard();
}
```

- [ ] **Step 5 : Ajouter la fonction `handleSearchInput` et le branchement des événements**

Dans la section INIT, dans la fonction `init()`, après le branchement du bouton `btn-toggle-filters` (ligne 625), ajouter :

```javascript
    // Search
    const searchInput = document.getElementById('search-input');
    const btnClearSearch = document.getElementById('btn-clear-search');

    if (searchInput) {
        const debouncedSearch = debounce(() => {
            searchTerm = searchInput.value.trim();
            btnClearSearch.style.display = searchTerm ? 'block' : 'none';
            applyFilters();
        }, 300);

        searchInput.addEventListener('input', debouncedSearch);
    }

    if (btnClearSearch) {
        btnClearSearch.addEventListener('click', () => {
            searchInput.value = '';
            searchTerm = '';
            btnClearSearch.style.display = 'none';
            applyFilters();
        });
    }
```

- [ ] **Step 6 : Tester manuellement**

Recharger la page et vérifier les scénarios suivants :

1. **Recherche simple** : taper "Kerberos" → seule(s) la/les carte(s) contenant "Kerberos" dans la question ou la réponse s'affichent. Le compteur reflète le nombre réduit.
2. **Insensibilité aux accents** : taper "reseau" → les cartes contenant "réseau" ou "réseaux" apparaissent.
3. **Insensibilité à la casse** : taper "dhcp" → les cartes contenant "DHCP" apparaissent.
4. **Combinaison avec filtre domaine** : cocher uniquement "Cybersécurité : Protection" puis taper "chiffrement" → seules les cartes du domaine coché ET contenant "chiffrement" s'affichent.
5. **Bouton clear** : apparaît quand du texte est saisi, disparaît quand le champ est vidé. Un clic efface le texte et restaure le deck complet.
6. **Terme vide** : effacer tout le texte → retour au comportement normal (toutes les cartes des domaines cochés).
7. **Aucun résultat** : taper "xyznotfound" → message "Aucune carte disponible" et compteur "0 / 0".

- [ ] **Step 7 : Commit**

```bash
git add app.js
git commit -m "feat: implement search filtering with debounce and accent normalization"
```

---

### Task 4 : Push et vérification finale

**Files:**
- Aucun fichier modifié (push uniquement)

- [ ] **Step 1 : Push vers GitHub**

```bash
GIT_SSH_COMMAND="ssh -i /home/user/.ssh/sshkey-vm2-paravirtu-prod-tutotech -o IdentitiesOnly=yes" git push git@github.com:TutoTech/AdminGo.git main
```

- [ ] **Step 2 : Vérifier sur GitHub Pages**

Une fois le déploiement terminé (1-2 minutes), ouvrir le site et vérifier que la recherche fonctionne en production.

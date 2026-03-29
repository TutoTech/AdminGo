# Design — Export/Import de progression

**Date :** 2026-03-29
**Repo :** TutoTech/AdminGo

---

## Objectif

Permettre aux utilisateurs d'exporter leur progression (scores, préférences) sous forme de code texte copiable, et de l'importer dans un autre navigateur/appareil en collant ce code.

---

## Données concernées

| Clé localStorage | Type | Description |
|---|---|---|
| `admingo-score-knew` | int | Nombre de cartes marquées "je savais" |
| `admingo-score-didnt` | int | Nombre de cartes marquées "je ne savais pas" |
| `ais-dark-mode` | string | "true" ou "false" |
| `admingo-pwa-dismissed` | string | "1" si le banner PWA a été fermé |

---

## Format d'échange

L'objet JSON contenant les 4 clés est encodé en **base64** (`btoa(JSON.stringify(data))`). Le résultat est un code texte opaque que l'utilisateur peut copier/coller.

Exemple de JSON avant encodage :
```json
{
  "admingo-score-knew": 42,
  "admingo-score-didnt": 15,
  "ais-dark-mode": "true",
  "admingo-pwa-dismissed": "1"
}
```

---

## Flux export

1. L'utilisateur clique le bouton **"Exporter"** dans la sidebar
2. Le bloc export s'affiche : un champ `<input type="text" readonly>` prérempli avec le code base64 + un bouton **"Copier"**
3. Un clic sur "Copier" appelle `navigator.clipboard.writeText()` et affiche un feedback visuel (le texte du bouton passe à "Copié !" pendant 2 secondes)
4. Un second clic sur "Exporter" referme le bloc

---

## Flux import

1. L'utilisateur clique le bouton **"Importer"** dans la sidebar
2. Le bloc import s'affiche : un champ `<input type="text">` avec placeholder "Collez votre code ici" + un bouton **"Valider"**
3. Au clic sur "Valider" :
   - Le code est décodé avec `atob()`
   - Le résultat est parsé en JSON avec `JSON.parse()`
   - Les clés sont validées (au minimum `admingo-score-knew` et `admingo-score-didnt` doivent être présentes et numériques)
   - Si valide : les valeurs sont écrites dans `localStorage`, les fonctions `loadScore()` et `initDarkMode()` sont appelées pour mettre à jour l'UI immédiatement, et un message "Importé !" s'affiche
   - Si invalide : un message "Code invalide" s'affiche en rouge
4. Un second clic sur "Importer" referme le bloc

---

## Placement UI

Dans la sidebar (`<aside>`), après le bloc raccourcis clavier existant (visible uniquement en desktop `lg:block`). Un nouveau bloc avec le même style visuel (même fond, border, border-radius) contenant :

- Titre : "💾 Sauvegarde"
- Deux boutons côte à côte : **Exporter** et **Importer**
- Sous les boutons : un espace qui se déplie pour afficher le champ texte + action contextuelle (export ou import)

Sur mobile : le bloc est visible quand le panneau filtres est ouvert (même comportement que les raccourcis, qui sont `hidden lg:block` — ici on le rend accessible sur mobile aussi via le toggle filtres existant).

---

## Fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| `index.html` | Ajout du bloc HTML de sauvegarde dans la sidebar, après le bloc raccourcis clavier |
| `app.js` | Fonctions `exportProgression()`, `importProgression()`, bindings des boutons |
| `styles.css` | Styles du bloc sauvegarde (champ texte, boutons, feedback, message d'erreur) |
| `sw.js` | Incrémenter `CACHE_VERSION` |

---

## Hors périmètre

- Pas de synchronisation automatique entre appareils
- Pas de stockage côté serveur
- Pas de chiffrement du code (le base64 n'est pas du chiffrement, c'est un encodage)
- Pas d'export de l'historique par carte (le score est global, pas par carte)

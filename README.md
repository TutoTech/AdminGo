# 🎓 AIS Flashcards — Révisions Admin Systèmes & Réseaux

<div align="center">

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-58CC02?style=for-the-badge)

**Application web de révision par flashcards pour l'examen AIS**
*(Administrateur d'Infrastructures Sécurisées)*

Une SPA statique, moderne et gamifiée, inspirée du design Duolingo.

[Démarrage rapide](#-démarrage-rapide) •
[Fonctionnalités](#-fonctionnalités) •
[Architecture](#-architecture) •
[Personnalisation](#-personnalisation) •
[Licence](#-licence)

</div>

---

## ✨ Fonctionnalités

| Fonctionnalité | Description |
|---|---|
| 🃏 **510 flashcards** | Générées dynamiquement depuis un fichier CSV (10 questions par sujet × 51 sujets) |
| 🔄 **Animation 3D Flip** | Retournement de carte fluide avec `perspective` et `rotateY` CSS 3D |
| 🔍 **Recherche** | Filtrage instantané par mot-clé dans les questions et réponses (insensible aux accents) |
| 📋 **Filtres par domaine** | Cases à cocher pour réviser par thématique (9 domaines couverts) |
| 📊 **Barre de progression** | Style Duolingo avec animation élastique |
| 🔀 **Mélange aléatoire** | Algorithme de Fisher-Yates pour un ordre différent à chaque session |
| 🌙 **Mode sombre** | Basculement instantané avec persistance via `localStorage` |
| 📶 **Mode hors-ligne (PWA)** | Installable sur l'écran d'accueil, fonctionne sans connexion internet |
| 💾 **Export/Import** | Sauvegardez et restaurez votre progression entre appareils via un code court |
| 🤖 **Easter Egg Cyberpunk** | Code Konami (↑↑↓↓←→←→BA) — thème néon avec scanlines et glitch |
| ⌨️ **Raccourcis clavier** | `Espace` pour retourner, `Entrée` pour suivant |
| 📱 **Responsive** | Design adaptatif pour desktop, tablette et mobile |
| 🐳 **Dockerisé** | Prêt à déployer en une commande |

## 📚 Domaines couverts

1. **Administration Systèmes** — OS, services réseaux, AD, scripting, exploitation
2. **Infrastructures Réseaux** — Commutation, routage, Wi-Fi, VPN, VLAN
3. **Cybersécurité : Gouvernance** — ANSSI, ISO 27000, PSSI, analyse de risques
4. **Cybersécurité : Protection** — Pare-feu, WAF, chiffrement, PKI, Zero Trust
5. **Cybersécurité : Détection & Audit** — EDR, SIEM, SOC, pentest, CVE
6. **Virtualisation et Datacenter** — Hyperviseurs, Docker, Kubernetes, cloud
7. **Continuité et Supervision** — PRA/PCA, SNMP, ITIL, GLPI
8. **Conception et Déploiement** — DevOps, CI/CD, PDCA, TCO
9. **Réglementation et Transversal** — RGPD, éco-conception, accessibilité

## 🚀 Démarrage rapide

### Option 1 — Docker (recommandé)

```bash
docker compose up --build -d
```

L'application sera accessible sur **[http://localhost:8080](http://localhost:8080)**.

### Option 2 — Serveur local Python

```bash
python3 -m http.server 8000
```

Puis ouvrir **[http://localhost:8000](http://localhost:8000)**.

### Option 3 — Tout autre serveur HTTP statique

Les fichiers sont 100% statiques. Servez simplement le répertoire avec nginx, Apache, Caddy, ou le serveur de votre choix.

## 🏗️ Architecture

```
AdminGo/
├── index.html          # Structure HTML5 + CDN Tailwind & PapaParse
├── styles.css          # Animations flip 3D, dark mode, thème cyberpunk
├── app.js              # Logique : parsing CSV, shuffle, filtres, recherche, navigation
├── particles.js        # Réseau de particules interactif (canvas)
├── database.csv        # Base de données des 510 questions/réponses
├── manifest.json       # Manifeste PWA (installation, icône, thème)
├── sw.js               # Service Worker (cache hors-ligne)
├── logo.png            # Logo de l'application
├── Dockerfile          # Image nginx:alpine pour le déploiement
├── docker-compose.yml  # Orchestration Docker sur le port 8080
└── README.md           # Ce fichier
```

### Stack technique

| Couche | Technologie | Rôle |
|---|---|---|
| **Structure** | HTML5 | Squelette sémantique de l'application |
| **Styling** | Tailwind CSS (CDN) + CSS custom | Design utilitaire + animations avancées |
| **Parsing** | PapaParse (CDN) | Lecture et parsing du fichier CSV |
| **Logique** | Vanilla JavaScript ES6+ | Zero dépendance, zero framework |
| **PWA** | Service Worker + Manifest | Installation mobile/desktop + cache hors-ligne |
| **Déploiement** | GitHub Pages / Docker | Hébergement statique ou image nginx:alpine (~7 Mo) |

### Flux de données

```
database.csv
    │
    ▼
fetch() ──► PapaParse ──► Tableau de 510 cartes
                              │
                              ▼
                     Fisher-Yates Shuffle
                              │
                              ▼
                    Filtrage par domaine
                              │
                              ▼
                    Filtrage par recherche
                              │
                              ▼
                      Rendu de la carte
                     (flip 3D au clic)
```

## ⚙️ Personnalisation

### Modifier les questions

Éditez le fichier `database.csv` avec n'importe quel tableur (Excel, LibreOffice Calc, Google Sheets). La structure attendue est :

```
Domaine, Sujet, Détails, Question 1, Réponse 1, Explication 1, ..., Question 10, Réponse 10, Explication 10
```

Les blocs Q/R/E vides sont automatiquement ignorés.

### Modifier les couleurs

Les couleurs sont définies via des variables CSS dans `styles.css` :

```css
:root {
  --color-primary: 88, 204, 2;     /* Vert Duolingo */
  --color-secondary: 28, 176, 246; /* Bleu */
  --color-accent: 255, 150, 0;     /* Orange */
}
```

## 🕹️ Easter Egg

Tapez le **Code Konami** sur votre clavier pour activer le mode **Cyberpunk** :

```
↑ ↑ ↓ ↓ ← → ← → B A
```

> Fond noir, texte néon vert, police monospace, bordures glitchées et lignes de scan rétro. Retapez le code pour revenir à la normale.

## 📄 Licence

Ce projet est distribué sous licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

```
MIT License

Copyright (c) 2026 Nicolas BODAINE

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 👤 Auteur

**Nicolas BODAINE**

---

<div align="center">

Fait avec ❤️ pour les étudiants AIS

</div>

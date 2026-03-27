/* ============================================
   AIS Flashcard SPA - Application Logic
   ============================================ */

// --- State ---
let allCards = [];
let filteredCards = [];
let currentIndex = 0;
let isFlipped = false;
let activeDomains = new Set();
let domainColorMap = {}; // domain name -> color index
let scoreKnew = 0;
let scoreDidnt = 0;
let searchTerm = '';
const konamiSequence = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'b', 'a'
];
let konamiIndex = 0;

// --- DOM Elements ---
const cardFlipper = document.getElementById('card-flipper');
const questionText = document.getElementById('question-text');
const domainBadge = document.getElementById('domain-badge');
const sujetLabel = document.getElementById('sujet-label');
const reponseText = document.getElementById('reponse-text');
const explicationText = document.getElementById('explication-text');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const cardCounter = document.getElementById('card-counter');
const filterContainer = document.getElementById('filter-container');
const themeToggleBtn = document.getElementById('theme-toggle');
const btnPrev = document.getElementById('btn-prev');
const btnFlip = document.getElementById('btn-flip');
const btnNext = document.getElementById('btn-next');
const loadingScreen = document.getElementById('loading-screen');
const appContainer = document.getElementById('app-container');

// ============================================
// CSV LOADING & PARSING
// ============================================

/**
 * Fetch and parse database.csv with PapaParse
 * Each row generates up to 10 cards (Q1/R1/E1 ... Q10/R10/E10)
 */
async function loadCSV() {
    try {
        const response = await fetch('database.csv');

        // Defensive check: ensure the request succeeded
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const csvText = await response.text();

        const parsed = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (h) => h.trim(),
        });

        const cards = [];

        parsed.data.forEach((row) => {
            const domaine = (row['Domaine'] || '').trim();
            const sujet = (row['Sujet'] || '').trim();

            // Generate up to 10 cards per row
            for (let i = 1; i <= 10; i++) {
                const question = (row[`Question ${i}`] || '').trim();
                const reponse = (row[`Réponse ${i}`] || '').trim();
                const explication = (row[`Explication ${i}`] || '').trim();

                // Skip empty blocks
                if (question && reponse) {
                    cards.push({ domaine, sujet, question, reponse, explication });
                }
            }
        });

        return cards;
    } catch (error) {
        console.error('Erreur lors du chargement du CSV :', error);
        return [];
    }
}

// ============================================
// FISHER-YATES SHUFFLE
// ============================================
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// ============================================
// TEXT NORMALIZATION (accent-insensitive search)
// ============================================
function normalizeText(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

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

// ============================================
// FILTERS
// ============================================

/**
 * Populate domain filter checkboxes from unique domains
 */
function buildFilters(cards) {
    const domains = [...new Set(cards.map((c) => c.domaine))].sort();

    // Build domain-to-color mapping (stable across sessions)
    domainColorMap = {};
    domains.forEach((domain, index) => {
        domainColorMap[domain] = index % 9; // 9 colors available
    });

    filterContainer.innerHTML = '';

    domains.forEach((domain) => {
        const count = cards.filter((c) => c.domaine === domain).length;
        const id = `filter-${domain.replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`;

        const label = document.createElement('label');
        label.className = 'filter-item';
        label.setAttribute('for', id);

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = id;
        checkbox.checked = true;
        checkbox.value = domain;

        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                activeDomains.add(domain);
            } else {
                activeDomains.delete(domain);
            }
            // Point 8: bounce animation on checkbox toggle
            label.classList.remove('filter-bounce');
            void label.offsetWidth; // force reflow to re-trigger
            label.classList.add('filter-bounce');
            applyFilters();
        });

        activeDomains.add(domain);

        const text = document.createElement('span');
        text.textContent = `${domain} (${count})`;

        label.appendChild(checkbox);
        label.appendChild(text);
        filterContainer.appendChild(label);
    });
}

/**
 * Filter cards by active domains, shuffle, and reset
 */
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

// ============================================
// CARD RENDERING
// ============================================
function renderCard() {
    if (filteredCards.length === 0) {
        domainBadge.textContent = '—';
        domainBadge.removeAttribute('data-domain-color');
        sujetLabel.textContent = '';
        questionText.textContent = 'Aucune carte disponible. Sélectionnez au moins un domaine.';
        reponseText.textContent = '';
        explicationText.textContent = '';
        cardCounter.textContent = '0 / 0';
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
        hideScorePanel();
        return;
    }

    const card = filteredCards[currentIndex];

    // Front
    domainBadge.textContent = card.domaine;
    sujetLabel.textContent = card.sujet;
    questionText.textContent = card.question;

    // Apply domain color to badge
    const colorIdx = domainColorMap[card.domaine];
    if (colorIdx !== undefined) {
        domainBadge.setAttribute('data-domain-color', colorIdx);
        // Also color the top accent line on the card front
        const cardFront = document.querySelector('.card-front');
        if (cardFront) {
            const domainColors = [
                '88, 204, 2', '28, 176, 246', '206, 75, 224',
                '255, 75, 75', '255, 150, 0', '0, 194, 168',
                '100, 120, 255', '255, 100, 150', '160, 132, 72'
            ];
            cardFront.style.setProperty('--domain-accent', domainColors[colorIdx]);
        }
    }

    // Back
    reponseText.textContent = card.reponse;
    explicationText.textContent = card.explication;

    // Un-flip
    if (isFlipped) {
        cardFlipper.classList.remove('is-flipped');
        isFlipped = false;
    }

    // Hide score panel (show only after flip)
    hideScorePanel();

    // Counter with flip animation (Point 9)
    const counterText = `${currentIndex + 1} / ${filteredCards.length}`;
    if (cardCounter.textContent !== counterText) {
        cardCounter.classList.remove('counter-flip');
        void cardCounter.offsetWidth; // force reflow
        cardCounter.classList.add('counter-flip');
        cardCounter.textContent = counterText;
    }

    // Progress
    const pct = Math.round(((currentIndex + 1) / filteredCards.length) * 100);
    progressBar.style.width = `${pct}%`;
    progressText.textContent = `${pct}%`;

    // Sync ARIA progressbar attribute
    const progressContainer = document.getElementById('progress-container');
    if (progressContainer) progressContainer.setAttribute('aria-valuenow', pct);

    // Point 6: Confetti celebration at 100%
    if (pct === 100 && filteredCards.length > 1) {
        launchConfetti();
    }
}

// ============================================
// NAVIGATION
// ============================================
function flipCard() {
    if (filteredCards.length === 0) return;
    isFlipped = !isFlipped;
    cardFlipper.classList.toggle('is-flipped');

    // Show score panel when flipped to back
    if (isFlipped) {
        showScorePanel();
    } else {
        hideScorePanel();
    }

    // Update ARIA visibility for screen readers
    const front = document.getElementById('card-front-face');
    const back = document.getElementById('card-back-face');
    if (front) front.setAttribute('aria-hidden', isFlipped ? 'true' : 'false');
    if (back) back.setAttribute('aria-hidden', isFlipped ? 'false' : 'true');
}

function nextCard() {
    if (filteredCards.length === 0) return;
    currentIndex = (currentIndex + 1) % filteredCards.length;
    isFlipped = false;
    cardFlipper.classList.remove('is-flipped');
    slideCard('next');
}

function prevCard() {
    if (filteredCards.length === 0) return;
    currentIndex = (currentIndex - 1 + filteredCards.length) % filteredCards.length;
    isFlipped = false;
    cardFlipper.classList.remove('is-flipped');
    slideCard('prev');
}

/**
 * Animate card transition with slide effect
 */
function slideCard(direction) {
    const outClass = direction === 'next' ? 'card-slide-out-left' : 'card-slide-out-right';
    const inClass = direction === 'next' ? 'card-slide-in-right' : 'card-slide-in-left';

    cardFlipper.classList.add(outClass);

    setTimeout(() => {
        cardFlipper.classList.remove(outClass);
        renderCard();
        cardFlipper.classList.add(inClass);

        setTimeout(() => {
            cardFlipper.classList.remove(inClass);
        }, 300);
    }, 250);
}

// ============================================
// SCORE SYSTEM
// ============================================
function loadScore() {
    scoreKnew = parseInt(localStorage.getItem('admingo-score-knew') || '0', 10);
    scoreDidnt = parseInt(localStorage.getItem('admingo-score-didnt') || '0', 10);
    updateScoreDisplay();
}

function saveScore() {
    localStorage.setItem('admingo-score-knew', scoreKnew);
    localStorage.setItem('admingo-score-didnt', scoreDidnt);
}

function markKnew() {
    scoreKnew++;
    saveScore();
    updateScoreDisplay();
    // Auto-advance to next card
    nextCard();
}

function markDidnt() {
    scoreDidnt++;
    saveScore();
    updateScoreDisplay();
    // Auto-advance to next card
    nextCard();
}

function updateScoreDisplay() {
    const knewEl = document.getElementById('score-knew-count');
    const didntEl = document.getElementById('score-didnt-count');
    const headerEl = document.getElementById('score-header');

    if (knewEl) knewEl.textContent = scoreKnew;
    if (didntEl) didntEl.textContent = scoreDidnt;

    // Show header score once any scoring has happened
    if (headerEl && (scoreKnew > 0 || scoreDidnt > 0)) {
        headerEl.style.display = 'flex';
    }
}

function showScorePanel() {
    const panel = document.getElementById('score-panel');
    if (panel) panel.classList.add('visible');
}

function hideScorePanel() {
    const panel = document.getElementById('score-panel');
    if (panel) panel.classList.remove('visible');
}

// ============================================
// POINT 6 : CONFETTI CELEBRATION
// ============================================
let confettiLaunched = false;

function launchConfetti() {
    if (confettiLaunched) return;
    confettiLaunched = true;

    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);

    const colors = [
        '#58CC02', '#1CB0F6', '#FF9600', '#CE4BE0',
        '#FF4B4B', '#00C2A8', '#FFD700', '#FF6496'
    ];

    for (let i = 0; i < 40; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = `${Math.random() * 100}%`;
        piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDuration = `${1.5 + Math.random() * 2}s`;
        piece.style.animationDelay = `${Math.random() * 0.8}s`;
        piece.style.width = `${6 + Math.random() * 8}px`;
        piece.style.height = `${6 + Math.random() * 8}px`;
        piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        container.appendChild(piece);
    }

    // Cleanup after animation
    setTimeout(() => {
        container.remove();
        // Allow re-trigger on next full cycle
        setTimeout(() => { confettiLaunched = false; }, 2000);
    }, 4000);
}

// ============================================
// POINT 10 : SWIPE HINT (mobile)
// ============================================
function showSwipeHint() {
    // Show only once per session
    if (sessionStorage.getItem('admingo-swipe-seen')) return;
    const hint = document.getElementById('swipe-hint');
    if (!hint) return;

    // Only show on touch devices
    if (!('ontouchstart' in window)) return;

    hint.classList.add('show');
    sessionStorage.setItem('admingo-swipe-seen', '1');

    // Remove after animation completes
    setTimeout(() => {
        hint.classList.remove('show');
    }, 4000);
}

// ============================================
// DARK MODE
// ============================================
function initDarkMode() {
    const saved = localStorage.getItem('ais-dark-mode');
    if (saved === 'true') {
        document.documentElement.classList.add('dark');
        themeToggleBtn.textContent = '☀️';
    } else {
        themeToggleBtn.textContent = '🌙';
    }
}

function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('ais-dark-mode', isDark);
    themeToggleBtn.textContent = isDark ? '☀️' : '🌙';
}

// ============================================
// KONAMI CODE - CYBERPUNK EASTER EGG
// ============================================
function initKonami() {
    document.addEventListener('keydown', (e) => {
        // Use e.key for layout-independent detection (works on AZERTY, QWERTY, etc.)
        const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

        if (key === konamiSequence[konamiIndex]) {
            konamiIndex++;
            if (konamiIndex === konamiSequence.length) {
                activateCyberpunk();
                konamiIndex = 0;
            }
        } else {
            konamiIndex = 0;
            // Check if first key matches again
            if (key === konamiSequence[0]) {
                konamiIndex = 1;
            }
        }
    });
}

function activateCyberpunk() {
    const isCyber = document.documentElement.classList.toggle('cyberpunk');

    // Show flash notification
    const notify = document.createElement('div');
    notify.className = 'cyber-notify';
    notify.textContent = isCyber ? '> CYBERPUNK MODE: ON_' : '> CYBERPUNK MODE: OFF_';
    document.body.appendChild(notify);

    setTimeout(() => notify.remove(), 1600);
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Skip if typing in an input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        switch (e.code) {
            case 'Space':
                e.preventDefault();
                flipCard();
                break;
            case 'ArrowRight':
                // Handled by Konami but also navigation if Konami not matching
                break;
            case 'Enter':
                nextCard();
                break;
        }
    });
}

// ============================================
// SELECT ALL / DESELECT ALL FILTERS
// ============================================
function selectAllFilters() {
    const checkboxes = filterContainer.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((cb) => {
        cb.checked = true;
        activeDomains.add(cb.value);
    });
    applyFilters();
}

function deselectAllFilters() {
    const checkboxes = filterContainer.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((cb) => {
        cb.checked = false;
        activeDomains.delete(cb.value);
    });
    applyFilters();
}

// ============================================
// SHUFFLE BUTTON
// ============================================
function reshuffleCards() {
    filteredCards = shuffleArray(filteredCards);
    currentIndex = 0;
    isFlipped = false;
    cardFlipper.classList.remove('is-flipped');
    renderCard();

    // Visual feedback on shuffle button
    const btn = document.getElementById('btn-shuffle');
    if (btn) {
        btn.classList.add('animate-spin-once');
        setTimeout(() => btn.classList.remove('animate-spin-once'), 400);
    }
}

// ============================================
// MOBILE FILTER TOGGLE
// ============================================
function toggleMobileFilters() {
    const panel = document.getElementById('filter-sidebar');
    if (panel) {
        panel.classList.toggle('hidden');
        panel.classList.toggle('block');
    }
}

// ============================================
// TOUCH SWIPE SUPPORT (mobile navigation)
// ============================================
function initTouchSwipe() {
    const scene = document.getElementById('card-scene');
    if (!scene) return;

    let startX = 0;
    let startY = 0;
    const SWIPE_THRESHOLD = 60; // minimum px to count as swipe

    scene.addEventListener('touchstart', (e) => {
        startX = e.changedTouches[0].screenX;
        startY = e.changedTouches[0].screenY;
    }, { passive: true });

    scene.addEventListener('touchend', (e) => {
        const endX = e.changedTouches[0].screenX;
        const endY = e.changedTouches[0].screenY;
        const dx = endX - startX;
        const dy = endY - startY;

        // Only count horizontal swipes (ignore vertical scrolling)
        if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
            if (dx < 0) {
                nextCard();  // swipe left = next
            } else {
                prevCard();  // swipe right = previous
            }
        }
    }, { passive: true });
}

// ============================================
// INIT
// ============================================
async function init() {
    // Initialize themes
    initDarkMode();
    initKonami();
    initKeyboardShortcuts();
    initTouchSwipe();
    loadScore();
    showSwipeHint();

    // Load data
    allCards = await loadCSV();

    if (allCards.length === 0) {
        questionText.textContent = 'Erreur : impossible de charger les données.';
        if (loadingScreen) loadingScreen.classList.add('hidden');
        if (appContainer) appContainer.classList.remove('hidden');
        return;
    }

    // Build filters
    buildFilters(allCards);

    // Initial shuffle & render
    filteredCards = shuffleArray(allCards);
    renderCard();

    // Bind events
    cardFlipper.addEventListener('click', flipCard);
    btnPrev.addEventListener('click', prevCard);
    btnFlip.addEventListener('click', flipCard);
    btnNext.addEventListener('click', nextCard);
    themeToggleBtn.addEventListener('click', toggleDarkMode);

    // Score buttons
    document.getElementById('btn-knew')?.addEventListener('click', markKnew);
    document.getElementById('btn-didnt')?.addEventListener('click', markDidnt);

    // Select/Deselect all
    document.getElementById('btn-select-all')?.addEventListener('click', selectAllFilters);
    document.getElementById('btn-deselect-all')?.addEventListener('click', deselectAllFilters);
    document.getElementById('btn-shuffle')?.addEventListener('click', reshuffleCards);
    document.getElementById('btn-toggle-filters')?.addEventListener('click', toggleMobileFilters);

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

    // Hide loading, show app
    if (loadingScreen) loadingScreen.classList.add('hidden');
    if (appContainer) appContainer.classList.remove('hidden');
}

// Launch on DOM ready
document.addEventListener('DOMContentLoaded', init);

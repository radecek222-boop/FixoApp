/**
 * FIXO - AI Asistent pro domácí opravy
 * Hlavní JavaScript soubor
 */

// ========================================
// Globální proměnné a konfigurace
// ========================================

const CONFIG = {
    maxFileSize: 10 * 1024 * 1024, // 10 MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    compressionQuality: 0.7,
    maxImageWidth: 1200,
    analysisDelay: 2000 // Simulovaná doba analýzy
};

// ========================================
// Utility funkce
// ========================================

/**
 * Zobrazí toast notifikaci
 */
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="icon">${type === 'success' ? '✓' : type === 'error' ? '✗' : '⚠️'}</span>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

/**
 * Komprese obrázku bez ukládání
 */
function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Zmenšení pokud je příliš velké
                if (width > CONFIG.maxImageWidth) {
                    height = (height * CONFIG.maxImageWidth) / width;
                    width = CONFIG.maxImageWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Komprimovaný base64
                const compressedBase64 = canvas.toDataURL('image/jpeg', CONFIG.compressionQuality);
                resolve(compressedBase64);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Uložení do LocalStorage
 */
function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error('Chyba při ukládání do LocalStorage:', e);
    }
}

/**
 * Načtení z LocalStorage
 */
function loadFromStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error('Chyba při načítání z LocalStorage:', e);
        return null;
    }
}

// ========================================
// Cookie Consent
// ========================================

function acceptCookies() {
    saveToStorage('cookieConsent', { accepted: true, date: new Date().toISOString() });
    hideCookieBanner();
    showToast('Děkujeme za souhlas s cookies.', 'success');
}

function declineCookies() {
    saveToStorage('cookieConsent', { accepted: false, date: new Date().toISOString() });
    hideCookieBanner();
    showToast('Cookies odmítnuty. Některé funkce mohou být omezeny.', 'warning');
}

function hideCookieBanner() {
    const banner = document.getElementById('consentBanner');
    if (banner) {
        banner.classList.remove('show');
    }
}

function checkCookieConsent() {
    const consent = loadFromStorage('cookieConsent');
    if (!consent) {
        const banner = document.getElementById('consentBanner');
        if (banner) {
            setTimeout(() => banner.classList.add('show'), 1000);
        }
    }
}

// ========================================
// Upload a analýza fotografií
// ========================================

let selectedFile = null;
let compressedImageData = null;

function initUpload() {
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');

    if (!uploadZone || !fileInput) return;

    // Drag & Drop
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    // Click upload
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    // Analyze button
    const analyzeBtn = document.getElementById('analyzeBtn');
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', startAnalysis);
    }

    // Clear button
    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearUpload);
    }
}

async function handleFile(file) {
    // Validace typu
    if (!CONFIG.allowedTypes.includes(file.type)) {
        showToast('Nepodporovaný formát. Použijte JPG, PNG nebo WEBP.', 'error');
        return;
    }

    // Validace velikosti
    if (file.size > CONFIG.maxFileSize) {
        showToast('Soubor je příliš velký. Maximum je 10 MB.', 'error');
        return;
    }

    selectedFile = file;

    // Komprese obrázku
    try {
        compressedImageData = await compressImage(file);

        // Zobrazení náhledu
        const preview = document.getElementById('imagePreview');
        const previewContainer = document.getElementById('previewContainer');
        const uploadZone = document.getElementById('uploadZone');

        if (preview && previewContainer && uploadZone) {
            preview.src = compressedImageData;
            previewContainer.classList.remove('hidden');
            uploadZone.classList.add('hidden');
        }

        showToast('Fotografie nahrána a komprimována.', 'success');
    } catch (error) {
        showToast('Chyba při zpracování obrázku.', 'error');
        console.error(error);
    }
}

function clearUpload() {
    selectedFile = null;
    compressedImageData = null;

    const previewContainer = document.getElementById('previewContainer');
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');

    if (previewContainer) previewContainer.classList.add('hidden');
    if (uploadZone) uploadZone.classList.remove('hidden');
    if (fileInput) fileInput.value = '';
}

function startAnalysis() {
    if (!compressedImageData) {
        showToast('Nejprve nahrajte fotografii.', 'error');
        return;
    }

    const previewContainer = document.getElementById('previewContainer');
    const loadingState = document.getElementById('loadingState');

    if (previewContainer) previewContainer.classList.add('hidden');
    if (loadingState) loadingState.classList.remove('hidden');

    // Simulovaná AI analýza - uložení dat a přesměrování
    const analysisData = {
        image: compressedImageData,
        timestamp: new Date().toISOString(),
        result: generateMockAnalysis()
    };

    saveToStorage('lastAnalysis', analysisData);

    // Přidání do historie
    addToHistory(analysisData);

    // Simulace doby analýzy
    setTimeout(() => {
        window.location.href = 'analytics.html';
    }, CONFIG.analysisDelay);
}

function addToHistory(analysisData) {
    let history = loadFromStorage('analysisHistory') || [];
    history.unshift({
        id: Date.now(),
        timestamp: analysisData.timestamp,
        problem: analysisData.result.title,
        category: analysisData.result.category
    });
    // Uchovat max 20 položek
    history = history.slice(0, 20);
    saveToStorage('analysisHistory', history);
}

// ========================================
// Mock AI analýza
// ========================================

function generateMockAnalysis() {
    const problems = [
        {
            title: 'Kapající kohoutek',
            category: 'bathroom',
            categoryName: 'Koupelna',
            difficulty: 'easy',
            difficultyName: 'Snadné',
            confidence: 87,
            description: 'Na základě analýzy fotografie jsme identifikovali opotřebené těsnění vodovodního kohoutku. Jedná se o běžný problém způsobený stářím těsnění nebo usazeninami vodního kamene.',
            warning: null,
            steps: [
                { title: 'Uzavřete přívod vody', description: 'Najděte uzávěr pod umyvadlem nebo hlavní uzávěr vody.', time: '2 min' },
                { title: 'Otevřete kohoutek', description: 'Nechte odtéct zbývající vodu z potrubí.', time: '1 min' },
                { title: 'Demontujte rukojeť', description: 'Odšroubujte krytku a vyjměte šroub držící rukojeť.', time: '3 min' },
                { title: 'Vyměňte těsnění', description: 'Vyjměte staré těsnění a vložte nové stejné velikosti.', time: '5 min' },
                { title: 'Složte kohoutek zpět', description: 'Postupujte v opačném pořadí a utáhněte všechny spoje.', time: '3 min' },
                { title: 'Otestujte', description: 'Pusťte vodu a zkontrolujte těsnost.', time: '2 min' }
            ],
            tools: ['Křížový šroubovák', 'Nastavitelný klíč', 'Hadřík'],
            materials: ['Nové těsnění (sada)', 'Teflonová páska'],
            diyCost: '50 - 150 Kč',
            proCost: '800 - 1 500 Kč',
            savings: '650 - 1 350 Kč',
            totalTime: '~20 min'
        },
        {
            title: 'Vrzající dveře',
            category: 'house',
            categoryName: 'Dům',
            difficulty: 'easy',
            difficultyName: 'Snadné',
            confidence: 92,
            description: 'Analýza ukazuje na nedostatečné mazání pantů nebo mírné vychýlení dveřního křídla. Problém je snadno řešitelný bez speciálních nástrojů.',
            warning: null,
            steps: [
                { title: 'Očistěte panty', description: 'Hadříkem odstraňte prach a nečistoty z pantů.', time: '2 min' },
                { title: 'Naneste mazivo', description: 'Použijte WD-40 nebo speciální mazivo na panty. Nastříkejte do štěrbin.', time: '2 min' },
                { title: 'Rozpohybujte dveře', description: 'Několikrát otevřete a zavřete dveře, aby se mazivo rozetřelo.', time: '1 min' },
                { title: 'Utřete přebytek', description: 'Odstraňte přebytečné mazivo, aby neznečistilo podlahu.', time: '1 min' }
            ],
            tools: ['Hadřík', 'WD-40 nebo mazivo'],
            materials: ['Mazivo na panty'],
            diyCost: '80 - 150 Kč',
            proCost: '500 - 800 Kč',
            savings: '350 - 650 Kč',
            totalTime: '~10 min'
        },
        {
            title: 'Nefunkční zásuvka',
            category: 'electrical',
            categoryName: 'Elektřina',
            difficulty: 'medium',
            difficultyName: 'Střední',
            confidence: 78,
            description: 'Na základě popisu problému se pravděpodobně jedná o uvolněné kontakty v zásuvce nebo poškozený jistič. U elektroinstalace doporučujeme konzultovat odborníka.',
            warning: 'POZOR! Před jakoukoli prací na elektroinstalaci VŽDY vypněte příslušný jistič. Pokud si nejste jisti, kontaktujte elektrikáře.',
            steps: [
                { title: 'Vypněte jistič', description: 'V rozvaděči vypněte jistič pro daný okruh. Ověřte zkoušečkou.', time: '2 min' },
                { title: 'Zkontrolujte jistič', description: 'Zkuste jistič vypnout a znovu zapnout. Možná pouze vypadl.', time: '1 min' },
                { title: 'Demontujte kryt zásuvky', description: 'Odšroubujte kryt a zkontrolujte vodiče.', time: '3 min' },
                { title: 'Zkontrolujte spoje', description: 'Ověřte, že všechny vodiče jsou pevně připojeny.', time: '5 min' },
                { title: 'Utáhněte uvolněné spoje', description: 'Pokud jsou vodiče uvolněné, opatrně je dotáhněte.', time: '3 min' },
                { title: 'Složte zpět a otestujte', description: 'Nasaďte kryt, zapněte jistič a otestujte funkčnost.', time: '2 min' }
            ],
            tools: ['Zkoušečka napětí', 'Křížový šroubovák', 'Plochý šroubovák'],
            materials: ['Případně nová zásuvka'],
            diyCost: '0 - 200 Kč',
            proCost: '1 000 - 2 000 Kč',
            savings: '800 - 1 800 Kč',
            totalTime: '~20 min'
        },
        {
            title: 'Ucpaný odpad',
            category: 'bathroom',
            categoryName: 'Koupelna',
            difficulty: 'easy',
            difficultyName: 'Snadné',
            confidence: 85,
            description: 'Ucpaný odpad v umyvadle nebo dřezu. Nejčastější příčinou jsou vlasy, zbytky mýdla nebo mastnota. Problém lze vyřešit zvonkem nebo chemickým čističem.',
            warning: null,
            steps: [
                { title: 'Vyjměte zátku', description: 'Pokud je přítomna, vyjměte zátku a očistěte ji.', time: '1 min' },
                { title: 'Použijte zvon', description: 'Naplňte dřez vodou a použijte zvon k vytvoření tlaku.', time: '3 min' },
                { title: 'Chemický čistič', description: 'Pokud zvon nepomohl, použijte čistič odpadů dle návodu.', time: '15 min' },
                { title: 'Propláchněte', description: 'Propláchněte odpad velkým množstvím horké vody.', time: '2 min' }
            ],
            tools: ['Zvon na odpady', 'Gumové rukavice'],
            materials: ['Čistič odpadů (Krtek, apod.)'],
            diyCost: '50 - 200 Kč',
            proCost: '800 - 1 500 Kč',
            savings: '600 - 1 300 Kč',
            totalTime: '~25 min'
        },
        {
            title: 'Netěsnící okno',
            category: 'house',
            categoryName: 'Dům',
            difficulty: 'medium',
            difficultyName: 'Střední',
            confidence: 81,
            description: 'Okno propouští vzduch nebo vodu. Příčinou může být opotřebené těsnění nebo špatné seřízení kování.',
            warning: null,
            steps: [
                { title: 'Zkontrolujte těsnění', description: 'Prohlédněte gumové těsnění po celém obvodu okna.', time: '3 min' },
                { title: 'Očistěte těsnění', description: 'Umyjte těsnění vlhkým hadříkem a nechte uschnout.', time: '5 min' },
                { title: 'Nastavte kování', description: 'Pomocí imbusového klíče seřiďte přítlak křídla.', time: '10 min' },
                { title: 'Vyměňte těsnění', description: 'Pokud je poškozené, opatrně vyjměte a vložte nové.', time: '15 min' },
                { title: 'Otestujte', description: 'Zavřete okno a zkontrolujte těsnost papírem.', time: '2 min' }
            ],
            tools: ['Imbusový klíč (4mm)', 'Nůž', 'Hadřík'],
            materials: ['Nové těsnění (metráž)', 'Silikonový sprej'],
            diyCost: '100 - 300 Kč',
            proCost: '1 500 - 3 000 Kč',
            savings: '1 200 - 2 700 Kč',
            totalTime: '~40 min'
        }
    ];

    return problems[Math.floor(Math.random() * problems.length)];
}

// ========================================
// Stránka analytiky
// ========================================

function loadAnalysisResults() {
    const analysis = loadFromStorage('lastAnalysis');

    const loadingState = document.getElementById('loadingState');
    const resultsContainer = document.getElementById('resultsContainer');
    const emptyState = document.getElementById('emptyState');
    const analyzedImage = document.getElementById('analyzedImage');

    if (!analysis || !analysis.result) {
        if (loadingState) loadingState.classList.add('hidden');
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }

    const result = analysis.result;

    // Nastavení obrázku
    if (analyzedImage && analysis.image) {
        analyzedImage.src = analysis.image;
    }

    // Nastavení výsledků
    document.getElementById('problemTitle').textContent = `🔍 ${result.title}`;
    document.getElementById('confidenceText').textContent = `${result.confidence}% jistota`;
    document.getElementById('problemDescription').textContent = result.description;
    document.getElementById('problemCategory').textContent = result.categoryName;
    document.getElementById('problemDifficulty').textContent = result.difficultyName;
    document.getElementById('totalTime').textContent = result.totalTime;
    document.getElementById('diyCost').textContent = result.diyCost;
    document.getElementById('proCost').textContent = result.proCost;
    document.getElementById('savings').textContent = `Ušetříte: ${result.savings}`;

    // Varování
    if (result.warning) {
        const warningBox = document.getElementById('warningBox');
        const warningText = document.getElementById('warningText');
        if (warningBox && warningText) {
            warningText.textContent = result.warning;
            warningBox.classList.remove('hidden');
        }
    }

    // Kroky opravy
    const stepsContainer = document.getElementById('repairSteps');
    if (stepsContainer) {
        stepsContainer.innerHTML = result.steps.map(step => `
            <li class="repair-step">
                <h4>${step.title}</h4>
                <p>${step.description}</p>
                <span class="time">⏱️ ${step.time}</span>
            </li>
        `).join('');
    }

    // Nástroje
    const toolsList = document.getElementById('toolsList');
    if (toolsList) {
        toolsList.innerHTML = result.tools.map(tool => `
            <div class="tool-item">
                <span class="icon">🔧</span>
                <span>${tool}</span>
            </div>
        `).join('');
    }

    // Materiál
    const materialsList = document.getElementById('materialsList');
    if (materialsList) {
        materialsList.innerHTML = result.materials.map(material => `
            <div class="tool-item">
                <span class="icon">📦</span>
                <span>${material}</span>
            </div>
        `).join('');
    }

    // Řemeslníci
    loadNearbyProviders(result.category);

    // Zobrazení výsledků
    if (loadingState) loadingState.classList.add('hidden');
    if (resultsContainer) resultsContainer.classList.remove('hidden');
}

function loadNearbyProviders(category) {
    const providersList = document.getElementById('providersList');
    if (!providersList) return;

    const providers = getMockProviders().slice(0, 4);

    providersList.innerHTML = providers.map(provider => `
        <div class="provider-card">
            <div class="provider-avatar">${provider.avatar}</div>
            <div class="provider-info">
                <h4>${provider.name}</h4>
                <p class="specialization">${provider.specialization}</p>
                <div class="provider-rating">⭐ ${provider.rating} (${provider.reviews} recenzí)</div>
            </div>
            ${provider.verified ? '<span class="provider-badge">Ověřeno</span>' : ''}
        </div>
    `).join('');
}

// ========================================
// Stránka návodů
// ========================================

function initRepairPage() {
    loadRepairs();
    initCategoryFilters();
    initSearch();

    // Načtení kategorie z URL
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    if (category) {
        filterByCategory(category);
    }
}

function loadRepairs(filter = {}) {
    const grid = document.getElementById('repairsGrid');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');

    if (!grid) return;

    let repairs = getMockRepairs();

    // Filtrace podle kategorie
    if (filter.category && filter.category !== 'all') {
        repairs = repairs.filter(r => r.category === filter.category);
    }

    // Filtrace podle obtížnosti
    if (filter.difficulty && filter.difficulty !== 'all') {
        repairs = repairs.filter(r => r.difficulty === filter.difficulty);
    }

    // Vyhledávání
    if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        repairs = repairs.filter(r =>
            r.title.toLowerCase().includes(searchLower) ||
            r.description.toLowerCase().includes(searchLower)
        );
    }

    // Aktualizace počtu
    const countEl = document.getElementById('repairCount');
    if (countEl) {
        countEl.textContent = `(${repairs.length} návodů)`;
    }

    if (repairs.length === 0) {
        grid.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    grid.innerHTML = repairs.map(repair => `
        <div class="category-card" onclick="showRepairDetail('${repair.id}')">
            <span class="icon">${repair.icon}</span>
            <h3>${repair.title}</h3>
            <p>${repair.description}</p>
            <div class="flex-between mt-2">
                <span class="badge ${repair.difficulty === 'easy' ? 'badge-success' : repair.difficulty === 'medium' ? 'badge-warning' : 'badge-danger'}">
                    ${repair.difficultyName}
                </span>
                <span style="font-size: 12px; color: #666;">⏱️ ${repair.time}</span>
            </div>
        </div>
    `).join('');
}

function initCategoryFilters() {
    document.querySelectorAll('[data-category]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const category = link.dataset.category;
            filterByCategory(category);
        });
    });

    document.querySelectorAll('[data-difficulty]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const difficulty = link.dataset.difficulty;
            filterByDifficulty(difficulty);
        });
    });
}

function filterByCategory(category) {
    // Aktualizace aktivní třídy
    document.querySelectorAll('[data-category]').forEach(link => {
        link.classList.toggle('active', link.dataset.category === category);
    });

    // Aktualizace titulku
    const icons = { all: '📚', bathroom: '🚿', house: '🏠', electrical: '⚡', heating: '🌡️', kitchen: '🍳', garden: '🌱' };
    const names = { all: 'Všechny návody', bathroom: 'Koupelna', house: 'Dům', electrical: 'Elektřina', heating: 'Topení', kitchen: 'Kuchyň', garden: 'Zahrada' };

    const iconEl = document.getElementById('categoryIcon');
    const titleEl = document.getElementById('categoryTitle');
    if (iconEl) iconEl.textContent = icons[category] || '📚';
    if (titleEl) titleEl.textContent = names[category] || 'Všechny návody';

    loadRepairs({ category });
}

function filterByDifficulty(difficulty) {
    document.querySelectorAll('[data-difficulty]').forEach(link => {
        link.classList.toggle('active', link.dataset.difficulty === difficulty);
    });
    loadRepairs({ difficulty });
}

function initSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    let timeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            loadRepairs({ search: e.target.value });
        }, 300);
    });
}

function showRepairDetail(id) {
    const repairs = getMockRepairs();
    const repair = repairs.find(r => r.id === id);
    if (!repair) return;

    const modal = document.getElementById('repairModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    if (modalTitle) modalTitle.textContent = repair.title;
    if (modalBody) {
        modalBody.innerHTML = `
            <div class="analysis-section">
                <h3><span class="icon">📝</span> Popis</h3>
                <p>${repair.fullDescription || repair.description}</p>
            </div>

            ${repair.warning ? `
                <div class="warning-box mb-3">
                    <span class="icon">⚠️</span>
                    <div>
                        <h4>Bezpečnostní upozornění</h4>
                        <p>${repair.warning}</p>
                    </div>
                </div>
            ` : ''}

            <div class="analysis-section">
                <h3><span class="icon">📋</span> Postup</h3>
                <ol class="repair-steps">
                    ${repair.steps.map(step => `
                        <li class="repair-step">
                            <h4>${step.title}</h4>
                            <p>${step.description}</p>
                            <span class="time">⏱️ ${step.time}</span>
                        </li>
                    `).join('')}
                </ol>
            </div>

            <div class="grid grid-2">
                <div>
                    <h3><span class="icon">🛠️</span> Nástroje</h3>
                    <div class="tools-list">
                        ${repair.tools.map(t => `<div class="tool-item"><span class="icon">🔧</span>${t}</div>`).join('')}
                    </div>
                </div>
                <div>
                    <h3><span class="icon">💰</span> Náklady</h3>
                    <p><strong>DIY:</strong> ${repair.diyCost}</p>
                    <p><strong>Řemeslník:</strong> ${repair.proCost}</p>
                </div>
            </div>
        `;
    }

    if (modal) modal.classList.add('show');
}

function closeModal() {
    const modal = document.getElementById('repairModal');
    if (modal) modal.classList.remove('show');
}

// ========================================
// Stránka řemeslníků
// ========================================

function initProvidersPage() {
    loadProviders();
    initProviderFilters();
    initProviderSearch();
}

function loadProviders(filter = {}) {
    const grid = document.getElementById('providersGrid');
    if (!grid) return;

    let providers = getMockProviders();

    // Filtrace podle specializace
    if (filter.specialization && filter.specialization !== 'all') {
        providers = providers.filter(p => p.specialization === filter.specialization);
    }

    // Vyhledávání
    if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        providers = providers.filter(p =>
            p.name.toLowerCase().includes(searchLower) ||
            p.specialization.toLowerCase().includes(searchLower)
        );
    }

    // Aktualizace počtu
    const countEl = document.getElementById('providerCount');
    if (countEl) {
        countEl.textContent = `(${providers.length} řemeslníků)`;
    }

    grid.innerHTML = providers.map(provider => `
        <div class="provider-card" onclick="showProviderDetail('${provider.id}')">
            <div class="provider-avatar">${provider.avatar}</div>
            <div class="provider-info">
                <h4>${provider.name}</h4>
                <p class="specialization">${provider.specializationName}</p>
                <p style="font-size: 12px; color: #666;">📍 ${provider.location}</p>
                <div class="provider-rating">⭐ ${provider.rating} (${provider.reviews} recenzí)</div>
            </div>
            ${provider.verified ? '<span class="provider-badge">Ověřeno</span>' : ''}
        </div>
    `).join('');
}

function initProviderFilters() {
    document.querySelectorAll('[data-spec]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const spec = link.dataset.spec;

            document.querySelectorAll('[data-spec]').forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            loadProviders({ specialization: spec });
        });
    });
}

function initProviderSearch() {
    const searchInput = document.getElementById('searchProvider');
    if (!searchInput) return;

    let timeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            loadProviders({ search: e.target.value });
        }, 300);
    });
}

function detectLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                showToast('Poloha zjištěna! Zobrazuji řemeslníky v okolí.', 'success');
                // V reálné aplikaci bychom zde načetli řemeslníky podle polohy
            },
            () => {
                showToast('Nepodařilo se zjistit polohu. Zadejte PSČ ručně.', 'error');
            }
        );
    } else {
        showToast('Váš prohlížeč nepodporuje geolokaci.', 'error');
    }
}

function showProviderDetail(id) {
    const providers = getMockProviders();
    const provider = providers.find(p => p.id === id);
    if (!provider) return;

    const modal = document.getElementById('providerDetailModal');
    const modalTitle = document.getElementById('providerDetailTitle');
    const modalBody = document.getElementById('providerDetailBody');
    const callBtn = document.getElementById('callProviderBtn');

    if (modalTitle) modalTitle.textContent = provider.name;
    if (callBtn) callBtn.href = `tel:${provider.phone}`;
    if (modalBody) {
        modalBody.innerHTML = `
            <div class="flex gap-3 mb-3">
                <div class="provider-avatar" style="width: 80px; height: 80px; font-size: 36px;">${provider.avatar}</div>
                <div>
                    <h3 style="margin-bottom: 4px;">${provider.name}</h3>
                    <p style="color: #666;">${provider.specializationName}</p>
                    <div class="provider-rating">⭐ ${provider.rating} (${provider.reviews} recenzí)</div>
                    ${provider.verified ? '<span class="provider-badge mt-1">Ověřený řemeslník</span>' : ''}
                </div>
            </div>

            <div class="info-box mb-3">
                <span class="icon">📍</span>
                <p><strong>Lokalita:</strong> ${provider.location}<br><strong>Dojezd:</strong> ${provider.radius} km</p>
            </div>

            <div class="mb-3">
                <h4>📞 Kontakt</h4>
                <p><strong>Telefon:</strong> ${provider.phone}</p>
                <p><strong>E-mail:</strong> ${provider.email}</p>
            </div>

            <div class="mb-3">
                <h4>💼 O řemeslníkovi</h4>
                <p>${provider.description}</p>
            </div>

            <div>
                <h4>🏷️ Ceník (orientační)</h4>
                <p><strong>Hodinová sazba:</strong> ${provider.hourlyRate} Kč/hod</p>
                <p><strong>Výjezd:</strong> ${provider.calloutFee} Kč</p>
            </div>
        `;
    }

    if (modal) modal.classList.add('show');
}

function closeProviderDetail() {
    const modal = document.getElementById('providerDetailModal');
    if (modal) modal.classList.remove('show');
}

function openRegisterModal() {
    const modal = document.getElementById('registerModal');
    if (modal) modal.classList.add('show');
}

function closeRegisterModal() {
    const modal = document.getElementById('registerModal');
    if (modal) modal.classList.remove('show');
}

function submitRegistration() {
    // Simulace odeslání
    showToast('Děkujeme za registraci! Budeme vás kontaktovat.', 'success');
    closeRegisterModal();
    document.getElementById('registerForm').reset();
}

// ========================================
// Mock data
// ========================================

function getMockRepairs() {
    return [
        {
            id: 'faucet-drip',
            icon: '🚿',
            title: 'Kapající kohoutek',
            description: 'Výměna těsnění a oprava kapání',
            fullDescription: 'Kapající kohoutek je jedním z nejčastějších problémů v domácnosti. Příčinou je obvykle opotřebené těsnění, které lze snadno vyměnit.',
            category: 'bathroom',
            difficulty: 'easy',
            difficultyName: 'Snadné',
            time: '20 min',
            diyCost: '50-150 Kč',
            proCost: '800-1500 Kč',
            tools: ['Křížový šroubovák', 'Nastavitelný klíč'],
            steps: [
                { title: 'Uzavřete vodu', description: 'Zavřete přívod vody pod umyvadlem.', time: '2 min' },
                { title: 'Demontujte rukojeť', description: 'Odšroubujte krytku a vyjměte rukojeť.', time: '3 min' },
                { title: 'Vyměňte těsnění', description: 'Vložte nové těsnění stejné velikosti.', time: '5 min' },
                { title: 'Složte zpět', description: 'Postupujte v opačném pořadí.', time: '3 min' }
            ]
        },
        {
            id: 'door-squeak',
            icon: '🚪',
            title: 'Vrzající dveře',
            description: 'Mazání pantů a seřízení dveří',
            fullDescription: 'Vrzající dveře jsou způsobeny nedostatečným mazáním pantů. Stačí několik kapek oleje.',
            category: 'house',
            difficulty: 'easy',
            difficultyName: 'Snadné',
            time: '10 min',
            diyCost: '80-150 Kč',
            proCost: '500-800 Kč',
            tools: ['WD-40', 'Hadřík'],
            steps: [
                { title: 'Očistěte panty', description: 'Odstraňte prach a nečistoty.', time: '2 min' },
                { title: 'Naneste mazivo', description: 'Nastříkejte WD-40 do pantů.', time: '2 min' },
                { title: 'Rozpohybujte', description: 'Několikrát otevřete a zavřete dveře.', time: '1 min' }
            ]
        },
        {
            id: 'outlet-fix',
            icon: '🔌',
            title: 'Nefunkční zásuvka',
            description: 'Kontrola a oprava elektrické zásuvky',
            fullDescription: 'Nefunkční zásuvka může být způsobena uvolněnými spoji nebo vypadlým jističem.',
            category: 'electrical',
            difficulty: 'medium',
            difficultyName: 'Střední',
            time: '20 min',
            diyCost: '0-200 Kč',
            proCost: '1000-2000 Kč',
            warning: 'VŽDY vypněte jistič před prací na elektroinstalaci!',
            tools: ['Zkoušečka', 'Šroubovák'],
            steps: [
                { title: 'Vypněte jistič', description: 'Vypněte příslušný jistič v rozvaděči.', time: '2 min' },
                { title: 'Zkontrolujte spoje', description: 'Demontujte kryt a zkontrolujte vodiče.', time: '5 min' },
                { title: 'Utáhněte spoje', description: 'Dotáhněte uvolněné svorky.', time: '3 min' }
            ]
        },
        {
            id: 'drain-clog',
            icon: '🚰',
            title: 'Ucpaný odpad',
            description: 'Čištění ucpaného odpadu v umyvadle',
            fullDescription: 'Ucpaný odpad je nejčastěji způsoben vlasy a zbytky mýdla. Lze vyčistit zvonkem nebo chemicky.',
            category: 'bathroom',
            difficulty: 'easy',
            difficultyName: 'Snadné',
            time: '25 min',
            diyCost: '50-200 Kč',
            proCost: '800-1500 Kč',
            tools: ['Zvon', 'Gumové rukavice'],
            steps: [
                { title: 'Použijte zvon', description: 'Vytvořte podtlak pomocí zvonu.', time: '3 min' },
                { title: 'Chemický čistič', description: 'Použijte čistič dle návodu.', time: '15 min' },
                { title: 'Propláchněte', description: 'Propláchněte horkou vodou.', time: '2 min' }
            ]
        },
        {
            id: 'window-seal',
            icon: '🪟',
            title: 'Netěsnící okno',
            description: 'Výměna těsnění a seřízení oken',
            fullDescription: 'Netěsnící okno způsobuje úniky tepla a průvan. Řešením je výměna těsnění nebo seřízení kování.',
            category: 'house',
            difficulty: 'medium',
            difficultyName: 'Střední',
            time: '40 min',
            diyCost: '100-300 Kč',
            proCost: '1500-3000 Kč',
            tools: ['Imbusový klíč', 'Nůž'],
            steps: [
                { title: 'Zkontrolujte těsnění', description: 'Prohlédněte gumové těsnění.', time: '3 min' },
                { title: 'Seřiďte kování', description: 'Pomocí imbusového klíče seřiďte přítlak.', time: '10 min' },
                { title: 'Vyměňte těsnění', description: 'Pokud je poškozené, vložte nové.', time: '15 min' }
            ]
        },
        {
            id: 'radiator-bleed',
            icon: '🌡️',
            title: 'Odvzdušnění radiátoru',
            description: 'Odstranění vzduchu z topného systému',
            fullDescription: 'Vzduch v radiátoru snižuje účinnost topení. Odvzdušnění je jednoduchý úkon.',
            category: 'heating',
            difficulty: 'easy',
            difficultyName: 'Snadné',
            time: '15 min',
            diyCost: '0 Kč',
            proCost: '500-800 Kč',
            tools: ['Odvzdušňovací klíč', 'Hadřík'],
            steps: [
                { title: 'Vypněte kotel', description: 'Zastavte cirkulační čerpadlo.', time: '1 min' },
                { title: 'Otevřete ventil', description: 'Pomocí klíče otevřete odvzdušňovací ventil.', time: '3 min' },
                { title: 'Počkejte na vodu', description: 'Až začne téct voda, zavřete ventil.', time: '2 min' }
            ]
        },
        {
            id: 'toilet-flush',
            icon: '🚽',
            title: 'Netěsnící WC',
            description: 'Oprava splachovacího mechanismu',
            fullDescription: 'Neustále tekoucí voda do WC je způsobena poškozeným ventilem nebo plovákem.',
            category: 'bathroom',
            difficulty: 'medium',
            difficultyName: 'Střední',
            time: '30 min',
            diyCost: '100-400 Kč',
            proCost: '1000-2000 Kč',
            tools: ['Nastavitelný klíč', 'Hadřík'],
            steps: [
                { title: 'Uzavřete vodu', description: 'Zavřete přívod vody k WC.', time: '1 min' },
                { title: 'Sundejte víko', description: 'Odstraňte víko nádržky.', time: '1 min' },
                { title: 'Zkontrolujte mechanismus', description: 'Najděte příčinu netěsnosti.', time: '5 min' },
                { title: 'Vyměňte díl', description: 'Nahraďte poškozený díl novým.', time: '15 min' }
            ]
        },
        {
            id: 'light-switch',
            icon: '💡',
            title: 'Výměna vypínače',
            description: 'Instalace nového světelného vypínače',
            fullDescription: 'Nefunkční nebo poškozený vypínač lze snadno vyměnit za nový.',
            category: 'electrical',
            difficulty: 'medium',
            difficultyName: 'Střední',
            time: '20 min',
            diyCost: '50-200 Kč',
            proCost: '800-1500 Kč',
            warning: 'VŽDY vypněte jistič před prací na elektroinstalaci!',
            tools: ['Zkoušečka', 'Šroubovák'],
            steps: [
                { title: 'Vypněte jistič', description: 'Zajistěte, že obvod je bez napětí.', time: '2 min' },
                { title: 'Demontujte kryt', description: 'Odšroubujte kryt vypínače.', time: '2 min' },
                { title: 'Odpojte vodiče', description: 'Poznamenejte si zapojení a odpojte.', time: '3 min' },
                { title: 'Připojte nový vypínač', description: 'Zapojte vodiče do nového vypínače.', time: '5 min' }
            ]
        },
        {
            id: 'sink-leak',
            icon: '🍳',
            title: 'Kapající sifon',
            description: 'Oprava netěsnosti pod dřezem',
            fullDescription: 'Kapající sifon je způsoben uvolněnými spoji nebo poškozeným těsněním.',
            category: 'kitchen',
            difficulty: 'easy',
            difficultyName: 'Snadné',
            time: '20 min',
            diyCost: '50-150 Kč',
            proCost: '800-1200 Kč',
            tools: ['Nastavitelný klíč', 'Kbelík'],
            steps: [
                { title: 'Připravte kbelík', description: 'Položte pod sifon pro zachycení vody.', time: '1 min' },
                { title: 'Utáhněte spoje', description: 'Dotáhněte všechny matice sifonu.', time: '5 min' },
                { title: 'Vyměňte těsnění', description: 'Pokud stále kape, vyměňte těsnění.', time: '10 min' }
            ]
        },
        {
            id: 'mower-service',
            icon: '🌱',
            title: 'Údržba sekačky',
            description: 'Základní servis zahradní sekačky',
            fullDescription: 'Pravidelná údržba sekačky prodlouží její životnost a zlepší výkon.',
            category: 'garden',
            difficulty: 'medium',
            difficultyName: 'Střední',
            time: '45 min',
            diyCost: '200-500 Kč',
            proCost: '800-1500 Kč',
            tools: ['Klíče', 'Čistič karburátoru', 'Pilník'],
            steps: [
                { title: 'Odpojte svíčku', description: 'Pro bezpečnost odpojte zapalovací svíčku.', time: '1 min' },
                { title: 'Očistěte podvozek', description: 'Odstraňte usazenou trávu.', time: '10 min' },
                { title: 'Zkontrolujte olej', description: 'Doplňte nebo vyměňte olej.', time: '10 min' },
                { title: 'Nabruste nože', description: 'Opatrně nabruste řezací nože.', time: '15 min' }
            ]
        }
    ];
}

function getMockProviders() {
    return [
        {
            id: 'p1',
            avatar: '👨‍🔧',
            name: 'Jan Novák',
            specialization: 'plumber',
            specializationName: 'Instalatér',
            location: 'Praha 4',
            radius: 15,
            rating: 4.9,
            reviews: 127,
            verified: true,
            phone: '+420 777 123 456',
            email: 'jan.novak@email.cz',
            description: '15 let zkušeností s vodoinstalací a topenářstvím. Rychlé a spolehlivé služby.',
            hourlyRate: 450,
            calloutFee: 300
        },
        {
            id: 'p2',
            avatar: '👨‍🔧',
            name: 'Petr Svoboda',
            specialization: 'electrician',
            specializationName: 'Elektrikář',
            location: 'Praha 10',
            radius: 20,
            rating: 4.8,
            reviews: 89,
            verified: true,
            phone: '+420 602 234 567',
            email: 'petr.svoboda@email.cz',
            description: 'Certifikovaný elektrikář s oprávněním pro všechny typy elektroinstalací.',
            hourlyRate: 500,
            calloutFee: 400
        },
        {
            id: 'p3',
            avatar: '👨‍🔧',
            name: 'Martin Dvořák',
            specialization: 'carpenter',
            specializationName: 'Truhlář',
            location: 'Praha 6',
            radius: 25,
            rating: 4.7,
            reviews: 64,
            verified: false,
            phone: '+420 608 345 678',
            email: 'martin.dvorak@email.cz',
            description: 'Zakázková výroba nábytku, opravy dveří a oken, montáže.',
            hourlyRate: 400,
            calloutFee: 250
        },
        {
            id: 'p4',
            avatar: '👨‍🔧',
            name: 'Tomáš Horák',
            specialization: 'locksmith',
            specializationName: 'Zámečník',
            location: 'Praha 2',
            radius: 30,
            rating: 4.9,
            reviews: 203,
            verified: true,
            phone: '+420 777 456 789',
            email: 'tomas.horak@email.cz',
            description: 'Nouzové otevírání, výměna zámků, bezpečnostní dveře. Dostupný 24/7.',
            hourlyRate: 550,
            calloutFee: 500
        },
        {
            id: 'p5',
            avatar: '👨‍🔧',
            name: 'Jiří Procházka',
            specialization: 'heating',
            specializationName: 'Topenář',
            location: 'Praha 5',
            radius: 20,
            rating: 4.6,
            reviews: 78,
            verified: true,
            phone: '+420 603 567 890',
            email: 'jiri.prochazka@email.cz',
            description: 'Montáž a servis kotlů, radiátorů a podlahového topení.',
            hourlyRate: 480,
            calloutFee: 350
        },
        {
            id: 'p6',
            avatar: '👨‍🔧',
            name: 'Pavel Černý',
            specialization: 'painter',
            specializationName: 'Malíř',
            location: 'Praha 3',
            radius: 15,
            rating: 4.8,
            reviews: 156,
            verified: true,
            phone: '+420 604 678 901',
            email: 'pavel.cerny@email.cz',
            description: 'Malířské a natěračské práce, tapetování, dekorativní techniky.',
            hourlyRate: 350,
            calloutFee: 200
        },
        {
            id: 'p7',
            avatar: '👨‍🔧',
            name: 'Lukáš Veselý',
            specialization: 'handyman',
            specializationName: 'Údržbář',
            location: 'Praha 9',
            radius: 25,
            rating: 4.5,
            reviews: 92,
            verified: false,
            phone: '+420 605 789 012',
            email: 'lukas.vesely@email.cz',
            description: 'Drobné opravy a údržba v domácnosti. Montáže nábytku, police, obrazy.',
            hourlyRate: 300,
            calloutFee: 150
        },
        {
            id: 'p8',
            avatar: '👨‍🔧',
            name: 'David Kučera',
            specialization: 'plumber',
            specializationName: 'Instalatér',
            location: 'Praha 8',
            radius: 20,
            rating: 4.7,
            reviews: 113,
            verified: true,
            phone: '+420 606 890 123',
            email: 'david.kucera@email.cz',
            description: 'Specialista na koupelny a kuchyně. Kompletní rekonstrukce.',
            hourlyRate: 480,
            calloutFee: 300
        }
    ];
}

// ========================================
// Inicializace
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    // Cookie consent
    checkCookieConsent();

    // Upload (hlavní stránka)
    initUpload();

    // Zavření modalů kliknutím na overlay
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('show');
            }
        });
    });

    // Zavření modalů klávesou Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.show').forEach(modal => {
                modal.classList.remove('show');
            });
        }
    });
});

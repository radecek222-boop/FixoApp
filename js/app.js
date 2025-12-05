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

// Affiliate odkazy pro nástroje a materiály (pouze Alza.cz)
const AFFILIATE_LINKS = {
    // Nástroje
    'Křížový šroubovák': 'https://www.alza.cz/search.htm?exps=sroubovak%20krizovy',
    'Plochý šroubovák': 'https://www.alza.cz/search.htm?exps=sroubovak%20plochy',
    'Šroubovák': 'https://www.alza.cz/search.htm?exps=sada%20sroubovaku',
    'Nastavitelný klíč': 'https://www.alza.cz/search.htm?exps=nastavitelny%20klic',
    'Hadřík': 'https://www.alza.cz/search.htm?exps=hadrik%20mikrovlakno',
    'Zkoušečka napětí': 'https://www.alza.cz/search.htm?exps=zkousecka%20napeti',
    'Zkoušečka': 'https://www.alza.cz/search.htm?exps=zkousecka%20napeti',
    'Zvon na odpady': 'https://www.alza.cz/search.htm?exps=zvon%20na%20odpady',
    'Gumové rukavice': 'https://www.alza.cz/search.htm?exps=gumove%20rukavice',
    'Imbusový klíč': 'https://www.alza.cz/search.htm?exps=imbusovy%20klic%20sada',
    'Imbusový klíč (4mm)': 'https://www.alza.cz/search.htm?exps=imbusovy%20klic%204mm',
    'Nůž': 'https://www.alza.cz/search.htm?exps=nuz%20remeselny',
    'Odvzdušňovací klíč': 'https://www.alza.cz/search.htm?exps=odvzdusnovaci%20klic%20radiator',
    'Kbelík': 'https://www.alza.cz/search.htm?exps=kbelik',
    'Klíče': 'https://www.alza.cz/search.htm?exps=sada%20klicu',
    'WD-40': 'https://www.alza.cz/search.htm?exps=wd-40',
    'WD-40 nebo mazivo': 'https://www.alza.cz/search.htm?exps=wd-40',
    'Pilník': 'https://www.alza.cz/search.htm?exps=pilnik',
    'Kleště': 'https://www.alza.cz/search.htm?exps=kleste',
    'Momentový klíč': 'https://www.alza.cz/search.htm?exps=momentovy%20klic',
    'Vrtačka': 'https://www.alza.cz/search.htm?exps=vrtacka%20akumulatorova',
    'Kladivo': 'https://www.alza.cz/search.htm?exps=kladivo',
    'Metr': 'https://www.alza.cz/search.htm?exps=svinovaci%20metr',
    'Vodováha': 'https://www.alza.cz/search.htm?exps=vodovaha',

    // Materiály
    'Čistič odpadů (Krtek, apod.)': 'https://www.alza.cz/search.htm?exps=krtek%20cistic%20odpadu',
    'Čistič odpadů': 'https://www.alza.cz/search.htm?exps=cistic%20odpadu',
    'Čistič karburátoru': 'https://www.alza.cz/search.htm?exps=cistic%20karburatoru',
    'Nové těsnění': 'https://www.alza.cz/search.htm?exps=tesneni%20vodovodní%20baterie',
    'Nový O-kroužek': 'https://www.alza.cz/search.htm?exps=o-krouzek%20tesneni',
    'Nová zásuvka': 'https://www.alza.cz/search.htm?exps=elektricka%20zasuvka',
    'Nový vypínač': 'https://www.alza.cz/search.htm?exps=elektricky%20vypinac',
    'Mazivo': 'https://www.alza.cz/search.htm?exps=mazivo%20univerzalni',
    'Olej na panty': 'https://www.alza.cz/search.htm?exps=olej%20na%20panty',
    'Silikón': 'https://www.alza.cz/search.htm?exps=silikon%20sanitarni',
    'Teflonová páska': 'https://www.alza.cz/search.htm?exps=teflonova%20paska'
};

/**
 * Získání affiliate odkazu pro nástroj/materiál
 */
function getAffiliateLink(item) {
    // Přímý match
    if (AFFILIATE_LINKS[item]) {
        return AFFILIATE_LINKS[item];
    }
    // Částečný match
    for (const key in AFFILIATE_LINKS) {
        if (item.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(item.toLowerCase())) {
            return AFFILIATE_LINKS[key];
        }
    }
    // Fallback - hledání na Alza
    return `https://www.alza.cz/search.htm?exps=${encodeURIComponent(item)}`;
}

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
        <span class="icon">${type === 'success' ? 'OK' : type === 'error' ? 'X' : '!'}</span>
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

async function startAnalysis() {
    if (!compressedImageData) {
        showToast('Nejprve nahrajte fotografii.', 'error');
        return;
    }

    // Kontrola API klíče
    if (!hasApiKey()) {
        showToast('Pro analýzu je nutné nastavit API klíč. Klikněte na ikonu klíče v menu.', 'warning');
        openApiKeyModal();
        return;
    }

    const previewContainer = document.getElementById('previewContainer');
    const loadingState = document.getElementById('loadingState');
    const loadingText = document.getElementById('loadingText');

    if (previewContainer) previewContainer.classList.add('hidden');
    if (loadingState) loadingState.classList.remove('hidden');
    if (loadingText) loadingText.textContent = 'Analyzuji fotografii pomocí AI...';

    try {
        // Skutečná AI analýza pomocí OpenAI Vision API
        const result = await analyzeImageWithAI(compressedImageData);

        const analysisData = {
            image: compressedImageData,
            timestamp: new Date().toISOString(),
            result: result,
            source: 'openai' // Označení že jde o skutečnou analýzu
        };

        saveToStorage('lastAnalysis', analysisData);
        addToHistory(analysisData);

        window.location.href = 'analytics.html';

    } catch (error) {
        console.error('Analysis error:', error);

        // Zpracování různých typů chyb
        let errorMessage = 'Došlo k chybě při analýze.';
        let shouldFallback = false;

        if (error.message === 'API_KEY_MISSING') {
            errorMessage = 'API klíč není nastaven. Nastavte ho v menu.';
            openApiKeyModal();
        } else if (error.message === 'API_KEY_INVALID') {
            errorMessage = 'API klíč je neplatný. Zkontrolujte ho v nastavení.';
            openApiKeyModal();
        } else if (error.message === 'API_RATE_LIMIT') {
            errorMessage = 'Příliš mnoho požadavků. Zkuste to za chvíli.';
            shouldFallback = true;
        } else if (error.message === 'API_QUOTA_EXCEEDED') {
            errorMessage = 'Vyčerpán kredit na API. Zkontrolujte váš OpenAI účet.';
        } else if (error.message.startsWith('ANALYSIS_FAILED:')) {
            errorMessage = error.message.replace('ANALYSIS_FAILED: ', '');
        } else if (error.message === 'API_EMPTY_RESPONSE') {
            errorMessage = 'AI nevrátila žádnou odpověď. Zkuste to znovu.';
            shouldFallback = true;
        } else {
            // Obecná chyba - nabídneme fallback na demo
            shouldFallback = true;
        }

        if (loadingState) loadingState.classList.add('hidden');
        if (previewContainer) previewContainer.classList.remove('hidden');

        if (shouldFallback) {
            // Nabídnout demo analýzu jako fallback
            if (confirm(`${errorMessage}\n\nChcete místo toho spustit demo analýzu?`)) {
                runDemoAnalysis();
            } else {
                showToast(errorMessage, 'error');
            }
        } else {
            showToast(errorMessage, 'error');
        }
    }
}

/**
 * Spustí demo analýzu (mock data) jako fallback
 */
function runDemoAnalysis() {
    const previewContainer = document.getElementById('previewContainer');
    const loadingState = document.getElementById('loadingState');
    const loadingText = document.getElementById('loadingText');

    if (previewContainer) previewContainer.classList.add('hidden');
    if (loadingState) loadingState.classList.remove('hidden');
    if (loadingText) loadingText.textContent = 'Spouštím demo analýzu...';

    const analysisData = {
        image: compressedImageData,
        timestamp: new Date().toISOString(),
        result: generateMockAnalysis(),
        source: 'demo' // Označení že jde o demo
    };

    saveToStorage('lastAnalysis', analysisData);
    addToHistory(analysisData);

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
// OpenAI Vision API - Skutečná AI analýza
// ========================================

/**
 * Analyzuje obrázek pomocí OpenAI Vision API
 * @param {string} base64Image - Obrázek v base64 formátu
 * @returns {Promise<Object>} - Výsledek analýzy
 */
async function analyzeImageWithAI(base64Image) {
    const apiKey = await getApiKey();

    if (!apiKey) {
        throw new Error('API_KEY_MISSING');
    }

    const systemPrompt = `Jsi expert na domácí opravy a údržbu. Analyzuj fotografii a identifikuj problém.

DŮLEŽITÉ: Odpověz POUZE validním JSON objektem bez jakéhokoli dalšího textu. Formát:

{
    "title": "Název problému (česky, max 30 znaků)",
    "category": "bathroom|house|electrical|heating|kitchen|garden",
    "categoryName": "Český název kategorie",
    "difficulty": "easy|medium|hard",
    "difficultyName": "Snadné|Střední|Obtížné",
    "confidence": 75-95,
    "description": "Detailní popis problému a jeho pravděpodobné příčiny (2-3 věty česky)",
    "warning": "Bezpečnostní varování pokud je potřeba, jinak null",
    "steps": [
        {"title": "Název kroku", "description": "Popis kroku", "time": "X min"}
    ],
    "tools": ["Seznam potřebných nástrojů"],
    "materials": ["Seznam potřebných materiálů"],
    "diyCost": "XXX - XXX Kč",
    "proCost": "XXX - XXX Kč",
    "savings": "XXX - XXX Kč",
    "totalTime": "~XX min"
}

Pokud na obrázku není vidět žádný problém k opravě nebo nejde o domácí opravu, vrať:
{
    "error": true,
    "message": "Popis proč nelze analyzovat"
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: 'Analyzuj tento obrázek a identifikuj problém k opravě. Odpověz pouze JSON objektem.'
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: base64Image,
                                detail: 'high'
                            }
                        }
                    ]
                }
            ],
            max_tokens: 2000,
            temperature: 0.3
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
            throw new Error('API_KEY_INVALID');
        } else if (response.status === 429) {
            throw new Error('API_RATE_LIMIT');
        } else if (response.status === 402 || errorData.error?.code === 'insufficient_quota') {
            throw new Error('API_QUOTA_EXCEEDED');
        }
        throw new Error(`API_ERROR: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
        throw new Error('API_EMPTY_RESPONSE');
    }

    // Parsování JSON z odpovědi (může být obaleno v markdown code blocku)
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.slice(7);
    } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.slice(3);
    }
    if (jsonContent.endsWith('```')) {
        jsonContent = jsonContent.slice(0, -3);
    }
    jsonContent = jsonContent.trim();

    const result = JSON.parse(jsonContent);

    if (result.error) {
        throw new Error(`ANALYSIS_FAILED: ${result.message}`);
    }

    return result;
}

// ========================================
// Mock AI analýza (fallback)
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

    // Zobrazení zdroje analýzy (AI vs Demo)
    const sourceIndicator = document.getElementById('analysisSource');
    if (sourceIndicator) {
        if (analysis.source === 'openai') {
            sourceIndicator.innerHTML = '<span style="background: var(--success); color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem;"><i class="fas fa-robot"></i> AI Analýza</span>';
        } else {
            sourceIndicator.innerHTML = '<span style="background: var(--warning); color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem;"><i class="fas fa-flask"></i> Demo</span>';
        }
    }

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

    // Nástroje - klikatelné s affiliate odkazy
    const toolsList = document.getElementById('toolsList');
    if (toolsList) {
        toolsList.innerHTML = result.tools.map(tool => `
            <a href="${getAffiliateLink(tool)}" target="_blank" rel="noopener" class="tool-item tool-link">
                <span class="icon">🔧</span>
                <span>${tool}</span>
                <span class="link-arrow">→</span>
            </a>
        `).join('');
    }

    // Materiál - klikatelné s affiliate odkazy
    const materialsList = document.getElementById('materialsList');
    if (materialsList) {
        materialsList.innerHTML = result.materials.map(material => `
            <a href="${getAffiliateLink(material)}" target="_blank" rel="noopener" class="tool-item tool-link">
                <span class="icon">📦</span>
                <span>${material}</span>
                <span class="link-arrow">→</span>
            </a>
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

async function initRepairPage() {
    // Nejdříve načteme data z JSON
    await loadRepairsFromJSON();

    // Pak zobrazíme
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

    // Použijeme cache z JSON nebo fallback
    let repairs = repairsCache || getMockRepairs();

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

    grid.innerHTML = repairs.map(repair => {
        // Výpočet úspor
        const diyAvg = parseInt(repair.diyCost.split('-')[0]) || 0;
        const proAvg = parseInt(repair.proCost.split('-')[0]) || 0;
        const savings = proAvg - diyAvg;

        // Bezpečnostní indikátor
        const hasSafety = repair.warning || repair.category === 'electrical';
        const safetyBadge = hasSafety ? `<span style="font-size: 10px; color: var(--danger); border: 1px solid var(--danger); padding: 2px 6px; border-radius: 4px;">⚠️ Bezpečnost</span>` : '';

        return `
            <div class="category-card" onclick="showRepairDetail('${repair.id}')" style="position: relative;">
                ${safetyBadge ? `<div style="position: absolute; top: 8px; right: 8px;">${safetyBadge}</div>` : ''}
                <span class="icon">${repair.icon}</span>
                <h3 style="font-size: 0.85rem; margin-bottom: 4px;">${repair.title}</h3>
                <p style="font-size: 0.7rem; margin-bottom: 8px;">${repair.description}</p>

                <!-- Ceny a úspora -->
                <div style="background: var(--bg-secondary); padding: 6px 8px; border-radius: 6px; margin-bottom: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.65rem; margin-bottom: 4px;">
                        <span style="color: var(--text-tertiary);">DIY:</span>
                        <strong style="color: var(--success);">${repair.diyCost}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.65rem; margin-bottom: 4px;">
                        <span style="color: var(--text-tertiary);">Profesionál:</span>
                        <strong>${repair.proCost}</strong>
                    </div>
                    <div style="border-top: 1px solid var(--border-color); padding-top: 4px; margin-top: 4px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.65rem;">
                            <span style="color: var(--text-tertiary);">Ušetříte:</span>
                            <strong style="color: var(--success); font-size: 0.75rem;">~${savings.toLocaleString('cs-CZ')} Kč</strong>
                        </div>
                    </div>
                </div>

                <!-- Obtížnost a čas -->
                <div class="flex-between">
                    <span class="badge ${repair.difficulty === 'easy' ? 'badge-success' : repair.difficulty === 'medium' ? 'badge-warning' : 'badge-danger'}" style="font-size: 0.6rem;">
                        ${repair.difficultyName}
                    </span>
                    <span style="font-size: 0.65rem; color: var(--text-tertiary);">⏱ ${repair.time}</span>
                </div>
            </div>
        `;
    }).join('');
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
    const repairs = repairsCache || getMockRepairs();
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
                    <span class="icon">!</span>
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
                        ${repair.tools.map(t => `<a href="${getAffiliateLink(t)}" target="_blank" rel="noopener" class="tool-item tool-link"><span class="icon">🔧</span><span>${t}</span><span class="link-arrow">→</span></a>`).join('')}
                    </div>
                    ${repair.materials && repair.materials.length > 0 ? `
                        <h3 style="margin-top: 16px;"><span class="icon">📦</span> Materiály</h3>
                        <div class="tools-list">
                            ${repair.materials.map(m => `<a href="${getAffiliateLink(m)}" target="_blank" rel="noopener" class="tool-item tool-link"><span class="icon">🛒</span><span>${m}</span><span class="link-arrow">→</span></a>`).join('')}
                        </div>
                    ` : ''}
                </div>
                <div>
                    <h3><span class="icon">💰</span> Náklady & Úspora</h3>
                    <div style="background: var(--bg-secondary); padding: 12px; border-radius: 8px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span>DIY oprava:</span>
                            <strong style="color: var(--success);">${repair.diyCost}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span>Řemeslník:</span>
                            <strong>${repair.proCost}</strong>
                        </div>
                        <div style="border-top: 2px solid var(--border-color); padding-top: 8px; margin-top: 8px;">
                            <div style="display: flex; justify-content: space-between;">
                                <span>Ušetříte:</span>
                                <strong style="color: var(--success); font-size: 1.1rem;">~${(parseInt(repair.proCost.split('-')[0]) - parseInt(repair.diyCost.split('-')[0])).toLocaleString('cs-CZ')} Kč</strong>
                            </div>
                        </div>
                    </div>
                    <div style="margin-top: 12px; padding: 10px; background: var(--bg-tertiary); border-radius: 6px; font-size: 0.8rem;">
                        <div style="margin-bottom: 6px;"><strong>⏱ Čas:</strong> ${repair.time}</div>
                        <div><strong>📊 Obtížnost:</strong> ${repair.difficultyName}</div>
                    </div>
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

            <div class="mb-3">
                <h4>🏷️ Ceník (orientační)</h4>
                <p><strong>Hodinová sazba:</strong> ${provider.hourlyRate} Kč/hod</p>
                <p><strong>Výjezd:</strong> ${provider.calloutFee} Kč</p>
            </div>

            <!-- Booking/Poptávkový formulář -->
            <div style="background: var(--bg-secondary); padding: 14px; border-radius: 8px; border: 2px solid var(--accent-primary);">
                <h4 style="margin-bottom: 10px;">📋 Odeslat poptávku</h4>
                <form id="bookingForm" onsubmit="submitBooking(event, '${provider.id}')">
                    <div class="form-group" style="margin-bottom: 10px;">
                        <label class="form-label" style="font-size: 0.75rem;">Vaše jméno *</label>
                        <input type="text" class="form-input" required placeholder="Jan Novák" style="font-size: 0.8rem;">
                    </div>
                    <div class="form-group" style="margin-bottom: 10px;">
                        <label class="form-label" style="font-size: 0.75rem;">Telefon *</label>
                        <input type="tel" class="form-input" required placeholder="+420 123 456 789" style="font-size: 0.8rem;">
                    </div>
                    <div class="form-group" style="margin-bottom: 10px;">
                        <label class="form-label" style="font-size: 0.75rem;">Typ opravy *</label>
                        <select class="form-select" required style="font-size: 0.8rem;">
                            <option value="">Vyberte typ opravy...</option>
                            <option value="bathroom">Koupelna (WC, sprcha, umyvadlo)</option>
                            <option value="electrical">Elektřina (zásuvky, vypínače)</option>
                            <option value="heating">Topení (radiátory, kotel)</option>
                            <option value="kitchen">Kuchyň (spotřebiče, dřez)</option>
                            <option value="house">Dům (dveře, okna, podlahy)</option>
                            <option value="other">Jiné</option>
                        </select>
                    </div>
                    <div class="form-group" style="margin-bottom: 10px;">
                        <label class="form-label" style="font-size: 0.75rem;">Popis problému *</label>
                        <textarea class="form-textarea" required placeholder="Popište problém..." style="font-size: 0.8rem; min-height: 60px;"></textarea>
                    </div>
                    <div class="form-group" style="margin-bottom: 10px;">
                        <label class="form-label" style="font-size: 0.75rem;">Urgence</label>
                        <select class="form-select" style="font-size: 0.8rem;">
                            <option value="normal">Běžná (do týdne)</option>
                            <option value="urgent">Urgentní (do 2 dnů)</option>
                            <option value="emergency">Nouzová (dnes/zítra)</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary btn-block" style="font-size: 0.8rem;">
                        Odeslat poptávku
                    </button>
                    <p style="font-size: 0.65rem; color: var(--text-tertiary); margin-top: 8px; text-align: center;">
                        Řemeslník vás bude kontaktovat do 24 hodin
                    </p>
                </form>
            </div>
        `;
    }

    if (modal) modal.classList.add('show');
}

function closeProviderDetail() {
    const modal = document.getElementById('providerDetailModal');
    if (modal) modal.classList.remove('show');
}

/**
 * Odeslání poptávky řemeslníkovi
 */
function submitBooking(event, providerId) {
    event.preventDefault();

    // V produkci by se data odeslala na server
    // Pro demo jen zobrazíme úspěšnou zprávu

    closeProviderDetail();

    showToast('Poptávka odeslána! Řemeslník vás bude kontaktovat do 24 hodin.', 'success');

    // Analytics tracking (v produkci)
    // trackEvent('booking_submitted', { provider_id: providerId });
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
// Data loading from JSON
// ========================================

// Cache pro načtená data
let repairsCache = null;
let repairsLoading = null;

// Mapování kategorií z JSON na app kategorie
const CATEGORY_MAP = {
    'voda': 'bathroom',
    'koupelna': 'bathroom',
    'elektrina': 'electrical',
    'elektro': 'electrical',
    'topeni': 'heating',
    'vytapeni': 'heating',
    'vytápění': 'heating',
    'spotrebice': 'kitchen',
    'kuchyn': 'kitchen',
    'dvere_okna': 'house',
    'nabytek': 'house',
    'steny_podlahy': 'house',
    'podlahy': 'house',
    'konstrukce': 'house',
    'zahrada': 'garden',
    'ventilace': 'heating'
};

const CATEGORY_NAMES = {
    'bathroom': 'Koupelna',
    'house': 'Dům',
    'electrical': 'Elektřina',
    'heating': 'Topení',
    'kitchen': 'Kuchyň',
    'garden': 'Zahrada'
};

const DIFFICULTY_MAP = {
    'Velmi nízká': { key: 'easy', name: 'Snadné' },
    'Nízká': { key: 'easy', name: 'Snadné' },
    'Střední': { key: 'medium', name: 'Střední' },
    'Vysoká': { key: 'hard', name: 'Obtížné' },
    'Velmi vysoká': { key: 'hard', name: 'Obtížné' }
};

/**
 * Načte návody z JSON souboru + sloučené z localStorage
 */
async function loadRepairsFromJSON() {
    if (repairsCache) {
        return repairsCache;
    }

    if (repairsLoading) {
        return repairsLoading;
    }

    repairsLoading = fetch('data/repairs.json')
        .then(response => {
            if (!response.ok) throw new Error('Failed to load repairs.json');
            return response.json();
        })
        .then(data => {
            let repairs = transformRepairsData(data);

            // Přidat sloučené návody z localStorage
            try {
                const mergedData = localStorage.getItem('mergedRepairs');
                if (mergedData) {
                    const mergedRepairs = JSON.parse(mergedData);
                    if (Array.isArray(mergedRepairs) && mergedRepairs.length > 0) {
                        // Transformovat na formát aplikace a přidat
                        const existingIds = new Set(repairs.map(r => r.id));
                        const uniqueMerged = mergedRepairs
                            .filter(r => !existingIds.has(r.id))
                            .map(r => ({
                                id: r.id,
                                title: r.name,
                                description: r.description,
                                category: r.category,
                                categoryKey: r.categoryKey,
                                difficulty: r.difficulty,
                                timeEstimate: r.timeEstimate,
                                riskScore: r.riskScore || 2,
                                materialCost: r.materialCost,
                                professionalCost: r.professionalCost,
                                tools: r.tools || [],
                                steps: r.steps || [],
                                safetyWarnings: r.safetyWarnings || []
                            }));
                        repairs = [...repairs, ...uniqueMerged];
                        console.log(`Loaded ${uniqueMerged.length} merged repairs from localStorage`);
                    }
                }
            } catch (e) {
                console.error('Error loading merged repairs:', e);
            }

            repairsCache = repairs;
            repairsLoading = null;
            return repairsCache;
        })
        .catch(error => {
            console.error('Error loading repairs:', error);
            repairsLoading = null;
            return [];
        });

    return repairsLoading;
}

/**
 * Transformuje JSON data na formát očekávaný aplikací
 */
function transformRepairsData(jsonData) {
    const repairs = [];

    for (const [categoryKey, categoryData] of Object.entries(jsonData.repairs)) {
        const appCategory = CATEGORY_MAP[categoryData.category] || 'house';
        const categoryName = CATEGORY_NAMES[appCategory] || categoryData.name;

        for (const issue of categoryData.issues || []) {
            const difficultyInfo = DIFFICULTY_MAP[issue.difficulty] || { key: 'medium', name: 'Střední' };

            // Formátování cen
            let diyCost = '0 Kč';
            let proCost = '0 Kč';

            if (issue.materialCost) {
                diyCost = `${issue.materialCost.min}-${issue.materialCost.max} Kč`;
            }
            if (issue.professionalCost) {
                proCost = `${issue.professionalCost.min}-${issue.professionalCost.max} Kč`;
            }

            // Transformace kroků
            const steps = (issue.steps || []).map(step => ({
                title: step.action.split(' ').slice(0, 4).join(' '),
                description: step.hint || step.action,
                time: step.time || '1 min'
            }));

            // Bezpečnostní varování
            const warning = issue.safetyWarnings && issue.safetyWarnings.length > 0
                ? issue.safetyWarnings.join(' ')
                : null;

            // Rozdělení nástrojů na nástroje a materiály
            const tools = issue.tools || [];
            const materials = [];

            repairs.push({
                id: `${categoryKey}-${issue.id}`,
                icon: categoryData.icon || '🔧',
                title: issue.name,
                description: issue.description,
                fullDescription: issue.description,
                category: appCategory,
                categoryName: categoryName,
                difficulty: difficultyInfo.key,
                difficultyName: difficultyInfo.name,
                time: issue.timeEstimate || '30 min',
                diyCost: diyCost,
                proCost: proCost,
                warning: warning,
                tools: tools,
                materials: materials,
                steps: steps,
                riskScore: issue.riskScore || 1
            });
        }
    }

    return repairs;
}

/**
 * Synchronní verze pro zpětnou kompatibilitu - vrací cache nebo prázdné pole
 */
function getMockRepairs() {
    // Pokud máme cache, vrátíme ji
    if (repairsCache) {
        return repairsCache;
    }
    // Jinak vrátíme fallback data
    return [
        {
            id: 'faucet-drip',
            icon: '🚿',
            title: 'Kapající kohoutek',
            description: 'Výměna těsnění a oprava kapání',
            fullDescription: 'Kapající kohoutek je jedním z nejčastějších problémů v domácnosti.',
            category: 'bathroom',
            categoryName: 'Koupelna',
            difficulty: 'easy',
            difficultyName: 'Snadné',
            time: '20 min',
            diyCost: '50-150 Kč',
            proCost: '800-1500 Kč',
            tools: ['Křížový šroubovák', 'Nastavitelný klíč'],
            materials: ['Nové těsnění'],
            steps: [
                { title: 'Uzavřete vodu', description: 'Zavřete přívod vody pod umyvadlem.', time: '2 min' },
                { title: 'Demontujte rukojeť', description: 'Odšroubujte krytku a vyjměte rukojeť.', time: '3 min' },
                { title: 'Vyměňte těsnění', description: 'Vložte nové těsnění stejné velikosti.', time: '5 min' },
                { title: 'Složte zpět', description: 'Postupujte v opačném pořadí.', time: '3 min' }
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
// Emergency Triage & Kalkulačky
// ========================================

/**
 * Data pro kalkulačku úspor
 */
const SAVINGS_DATA = {
    toilet: {
        name: 'WC - netěsnost',
        diy: { cost: 300, min: 200, max: 400, time: '30-60 min', difficulty: 'Snadné' },
        pro: { cost: 1800, min: 1200, max: 2500, time: '1-2 hod' }
    },
    faucet: {
        name: 'Výměna baterie',
        diy: { cost: 1150, min: 800, max: 1500, time: '45-90 min', difficulty: 'Střední' },
        pro: { cost: 3250, min: 2500, max: 4000, time: '1-2 hod' }
    },
    door: {
        name: 'Oprava dveří',
        diy: { cost: 225, min: 150, max: 300, time: '30-60 min', difficulty: 'Snadné' },
        pro: { cost: 1150, min: 800, max: 1500, time: '30-60 min' }
    },
    outlet: {
        name: 'Výměna zásuvky',
        diy: { cost: 140, min: 80, max: 200, time: '20-40 min', difficulty: 'Střední' },
        pro: { cost: 900, min: 600, max: 1200, time: '30-60 min' }
    },
    radiator: {
        name: 'Odvzdušnění topení',
        diy: { cost: 25, min: 0, max: 50, time: '10-20 min', difficulty: 'Velmi snadné' },
        pro: { cost: 600, min: 400, max: 800, time: '30 min' }
    },
    paint: {
        name: 'Malování pokoje (15m²)',
        diy: { cost: 3000, min: 2000, max: 4000, time: '4-8 hod', difficulty: 'Střední' },
        pro: { cost: 11500, min: 8000, max: 15000, time: '6-12 hod' }
    }
};

/**
 * Kalkulačka úspor - DIY vs Profesionál
 */
function calculateSavings() {
    const select = document.getElementById('repairTypeCalc');
    const resultDiv = document.getElementById('savingsResult');

    if (!select || !resultDiv) return;

    const repairType = select.value;

    if (!repairType || !SAVINGS_DATA[repairType]) {
        resultDiv.classList.add('hidden');
        return;
    }

    const data = SAVINGS_DATA[repairType];
    const savings = data.pro.cost - data.diy.cost;

    // Aktualizuj UI
    document.getElementById('diyCost').textContent = `${data.diy.cost.toLocaleString('cs-CZ')} Kč`;
    document.getElementById('diyTime').textContent = `⏱ ${data.diy.time} | ${data.diy.difficulty}`;
    document.getElementById('proCost').textContent = `${data.pro.cost.toLocaleString('cs-CZ')} Kč`;
    document.getElementById('proTime').textContent = `⏱ ${data.pro.time}`;
    document.getElementById('savings').textContent = `${savings.toLocaleString('cs-CZ')} Kč`;

    resultDiv.classList.remove('hidden');
}

/**
 * Emergency triage handler
 */
function handleEmergency(type) {
    const messages = {
        critical: {
            title: '🚨 Kritická situace',
            message: 'Okamžitě vypněte hlavní přívod (voda/elektřina) a volejte odborníka!',
            action: 'Najít řemeslníka',
            actionUrl: 'providers.html',
            color: '#ed4245'
        },
        urgent: {
            title: '⚠️ Urgentní oprava',
            message: 'Tato závada vyžaduje rychlou opravu. Doporučujeme kontaktovat řemeslníka.',
            action: 'Najít řemeslníka',
            actionUrl: 'providers.html',
            color: '#faa81a'
        },
        normal: {
            title: '✓ Běžná oprava',
            message: 'Máte čas si to rozmyslet. Můžete zkusit opravu svépomocí nebo pozvat řemeslníka.',
            action: 'Procházet návody',
            actionUrl: 'repair.html',
            color: '#3ba55d'
        }
    };

    const data = messages[type];
    if (!data) return;

    // Vytvoř modal
    const modalHTML = `
        <div class="modal-overlay show" id="emergencyModal" style="z-index: 10000;">
            <div class="modal" style="max-width: 400px;">
                <div class="modal-header" style="background: ${data.color}; color: white;">
                    <h3>${data.title}</h3>
                    <button class="modal-close" onclick="closeEmergencyModal()" style="color: white;">&times;</button>
                </div>
                <div class="modal-body">
                    <p style="font-size: 0.85rem; margin-bottom: 16px;">${data.message}</p>
                    ${type === 'critical' ? `
                        <div style="background: var(--bg-secondary); padding: 12px; border-radius: 8px; margin-bottom: 16px;">
                            <strong style="font-size: 0.8rem; display: block; margin-bottom: 8px;">🚑 Pohotovosti:</strong>
                            <div style="font-size: 0.75rem; color: var(--text-secondary);">
                                <div>• Hasiči: <strong>150</strong></div>
                                <div>• Policie: <strong>158</strong></div>
                                <div>• Záchranka: <strong>155</strong></div>
                            </div>
                        </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeEmergencyModal()">Zavřít</button>
                    <a href="${data.actionUrl}" class="btn btn-primary">${data.action}</a>
                </div>
            </div>
        </div>
    `;

    // Přidej do body
    const temp = document.createElement('div');
    temp.innerHTML = modalHTML;
    document.body.appendChild(temp.firstElementChild);
}

/**
 * Zavření emergency modalu
 */
function closeEmergencyModal() {
    const modal = document.getElementById('emergencyModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

// ========================================
// Inicializace
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    // Cookie consent
    checkCookieConsent();

    // Upload (hlavní stránka)
    initUpload();

    // Mobile menu
    initMobileMenu();

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
            // Also close mobile menu on Escape
            const nav = document.getElementById('mainNav');
            const menuBtn = document.getElementById('mobileMenuBtn');
            if (nav && nav.classList.contains('show')) {
                nav.classList.remove('show');
                if (menuBtn) {
                    const icon = menuBtn.querySelector('i');
                    if (icon) {
                        icon.classList.remove('fa-times');
                        icon.classList.add('fa-bars');
                    }
                }
            }
        }
    });
});

// ========================================
// API Key Management (AES-256 Encryption)
// ========================================

// Encryption key derivation from a passphrase (device-specific)
const API_KEY_STORAGE = 'fixo_api_key_encrypted';
const API_KEY_SALT = 'fixo_salt';

/**
 * Generate a device-specific encryption key
 */
async function getEncryptionKey() {
    const encoder = new TextEncoder();
    // Use a combination of factors for device-specific key
    const deviceId = navigator.userAgent + (navigator.language || '') + screen.width + screen.height;
    const salt = encoder.encode(API_KEY_SALT + deviceId.substring(0, 16));

    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(deviceId),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypt API key using AES-256-GCM
 */
async function encryptApiKey(apiKey) {
    try {
        const key = await getEncryptionKey();
        const encoder = new TextEncoder();
        const iv = crypto.getRandomValues(new Uint8Array(12));

        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            encoder.encode(apiKey)
        );

        // Combine IV and encrypted data
        const combined = new Uint8Array(iv.length + encrypted.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(encrypted), iv.length);

        // Convert to base64 for storage
        return btoa(String.fromCharCode(...combined));
    } catch (error) {
        console.error('Encryption error:', error);
        return null;
    }
}

/**
 * Decrypt API key
 */
async function decryptApiKey(encryptedData) {
    try {
        const key = await getEncryptionKey();

        // Decode from base64
        const combined = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));

        // Extract IV and encrypted data
        const iv = combined.slice(0, 12);
        const encrypted = combined.slice(12);

        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            encrypted
        );

        return new TextDecoder().decode(decrypted);
    } catch (error) {
        console.error('Decryption error:', error);
        return null;
    }
}

/**
 * Open API Key modal
 */
function openApiKeyModal() {
    const modal = document.getElementById('apiKeyModal');
    const input = document.getElementById('apiKeyInput');
    const status = document.getElementById('apiKeyStatus');
    const deleteBtn = document.getElementById('deleteApiKeyBtn');

    if (modal) {
        modal.classList.add('show');

        // Check if key exists
        const encryptedKey = localStorage.getItem(API_KEY_STORAGE);
        if (encryptedKey) {
            status.innerHTML = '<span style="color: var(--success);"><i class="fas fa-check-circle"></i> API klíč je uložen</span>';
            input.placeholder = '••••••••••••••••';
            input.value = '';
            if (deleteBtn) deleteBtn.style.display = 'block';
        } else {
            status.innerHTML = '<span style="color: var(--warning);"><i class="fas fa-exclamation-circle"></i> API klíč není nastaven</span>';
            input.placeholder = 'sk-...';
            if (deleteBtn) deleteBtn.style.display = 'none';
        }
    }

    // Close mobile menu if open
    const nav = document.getElementById('mainNav');
    const menuIcon = document.getElementById('menuIcon');
    if (nav && nav.classList.contains('show')) {
        nav.classList.remove('show');
        if (menuIcon) {
            menuIcon.classList.remove('fa-times');
            menuIcon.classList.add('fa-bars');
        }
    }
}

/**
 * Close API Key modal
 */
function closeApiKeyModal() {
    const modal = document.getElementById('apiKeyModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

/**
 * Toggle API key visibility
 */
function toggleApiKeyVisibility() {
    const input = document.getElementById('apiKeyInput');
    const icon = document.getElementById('apiKeyToggleIcon');

    if (input && icon) {
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }
}

/**
 * Save API key (encrypted)
 */
async function saveApiKey() {
    const input = document.getElementById('apiKeyInput');
    const status = document.getElementById('apiKeyStatus');
    const deleteBtn = document.getElementById('deleteApiKeyBtn');

    if (!input || !input.value.trim()) {
        if (status) {
            status.innerHTML = '<span style="color: var(--danger);"><i class="fas fa-times-circle"></i> Zadejte API klíč</span>';
        }
        return;
    }

    const apiKey = input.value.trim();

    // Basic validation for OpenAI API key format
    if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
        if (status) {
            status.innerHTML = '<span style="color: var(--danger);"><i class="fas fa-times-circle"></i> Neplatný formát API klíče</span>';
        }
        return;
    }

    try {
        const encrypted = await encryptApiKey(apiKey);
        if (encrypted) {
            localStorage.setItem(API_KEY_STORAGE, encrypted);
            if (status) {
                status.innerHTML = '<span style="color: var(--success);"><i class="fas fa-check-circle"></i> API klíč úspěšně uložen!</span>';
            }
            input.value = '';
            input.placeholder = '••••••••••••••••';
            if (deleteBtn) deleteBtn.style.display = 'block';

            showToast('API klíč byl úspěšně uložen', 'success');
        } else {
            throw new Error('Encryption failed');
        }
    } catch (error) {
        if (status) {
            status.innerHTML = '<span style="color: var(--danger);"><i class="fas fa-times-circle"></i> Chyba při ukládání</span>';
        }
        showToast('Chyba při ukládání API klíče', 'error');
    }
}

/**
 * Delete API key
 */
function deleteApiKey() {
    if (confirm('Opravdu chcete smazat uložený API klíč?')) {
        localStorage.removeItem(API_KEY_STORAGE);
        const status = document.getElementById('apiKeyStatus');
        const input = document.getElementById('apiKeyInput');
        const deleteBtn = document.getElementById('deleteApiKeyBtn');

        if (status) {
            status.innerHTML = '<span style="color: var(--warning);"><i class="fas fa-exclamation-circle"></i> API klíč není nastaven</span>';
        }
        if (input) {
            input.placeholder = 'sk-...';
            input.value = '';
        }
        if (deleteBtn) deleteBtn.style.display = 'none';

        showToast('API klíč byl smazán', 'success');
    }
}

/**
 * Get decrypted API key for use
 */
async function getApiKey() {
    const encryptedKey = localStorage.getItem(API_KEY_STORAGE);
    if (!encryptedKey) {
        return null;
    }
    return await decryptApiKey(encryptedKey);
}

/**
 * Check if API key is set
 */
function hasApiKey() {
    return localStorage.getItem(API_KEY_STORAGE) !== null;
}

// ========================================
// Mobile Menu
// ========================================

/**
 * Inicializace mobilního menu
 */
function initMobileMenu() {
    const menuBtn = document.getElementById('mobileMenuBtn');
    const nav = document.getElementById('mainNav');
    const menuIcon = document.getElementById('menuIcon');

    if (!menuBtn || !nav) return;

    menuBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        nav.classList.toggle('show');

        // Toggle icon
        if (menuIcon) {
            if (nav.classList.contains('show')) {
                menuIcon.classList.remove('fa-bars');
                menuIcon.classList.add('fa-times');
            } else {
                menuIcon.classList.remove('fa-times');
                menuIcon.classList.add('fa-bars');
            }
        }
    });

    // Close menu when clicking on a link
    nav.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            nav.classList.remove('show');
            if (menuIcon) {
                menuIcon.classList.remove('fa-times');
                menuIcon.classList.add('fa-bars');
            }
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (nav.classList.contains('show') && !nav.contains(e.target) && !menuBtn.contains(e.target)) {
            nav.classList.remove('show');
            if (menuIcon) {
                menuIcon.classList.remove('fa-times');
                menuIcon.classList.add('fa-bars');
            }
        }
    });
}

// ========================================
// Dynamický počet návodů
// ========================================

/**
 * Aktualizuje počet návodů na hlavní stránce
 */
async function updateRepairCount() {
    const countElement = document.getElementById('repairCountHome');
    if (!countElement) return;

    try {
        const repairs = await loadRepairsFromJSON();
        countElement.textContent = repairs.length;
    } catch (error) {
        console.error('Error loading repair count:', error);
        countElement.textContent = '100+';
    }
}

// Spustit při načtení stránky
document.addEventListener('DOMContentLoaded', updateRepairCount);

// ========================================
// AI Generátor návodů (Admin funkce)
// ========================================

/**
 * Generuje nové návody pomocí OpenAI API
 * Volá se z konzole: generateNewRepairs(5, 'bathroom')
 */
async function generateNewRepairs(count = 5, category = null) {
    const apiKey = await getApiKey();
    if (!apiKey) {
        console.error('❌ API klíč není nastaven. Nastavte ho přes menu.');
        return null;
    }

    console.log(`🔧 Generuji ${count} nových návodů${category ? ` pro kategorii: ${category}` : ''}...`);

    const categories = category ? [category] : ['bathroom', 'house', 'electrical', 'heating', 'kitchen', 'garden'];
    const categoryNames = {
        'bathroom': 'koupelna a voda',
        'house': 'dům, dveře, okna, nábytek',
        'electrical': 'elektřina a osvětlení',
        'heating': 'topení a klimatizace',
        'kitchen': 'kuchyň a spotřebiče',
        'garden': 'zahrada a exteriér'
    };

    const prompt = `Vygeneruj ${count} unikátních návodů na domácí opravy v češtině.
${category ? `Kategorie: ${categoryNames[category]}` : `Kategorie: náhodně z ${Object.values(categoryNames).join(', ')}`}

DŮLEŽITÉ:
- Vygeneruj POUZE návody které JEŠTĚ NEEXISTUJÍ v běžných databázích
- Buď kreativní - mysli na neobvyklé ale reálné problémy
- Každý návod musí být praktický a proveditelný

Vrať POUZE validní JSON pole bez dalšího textu:
[
  {
    "id": "unikatni-id-bez-diakritiky",
    "name": "Název problému",
    "description": "Krátký popis problému (1 věta)",
    "category": "${category || 'jedna z: bathroom, house, electrical, heating, kitchen, garden'}",
    "categoryKey": "klíč pro seskupení (např. kohoutek, dvere, zasuvka)",
    "difficulty": "Nízká|Střední|Vysoká",
    "timeEstimate": "XX min",
    "riskScore": 1-5,
    "materialCost": { "min": XXX, "max": XXX },
    "professionalCost": { "min": XXX, "max": XXX },
    "tools": ["nástroj1", "nástroj2"],
    "steps": [
      { "step": 1, "action": "Co udělat", "time": "X min", "hint": "Užitečný tip" }
    ],
    "safetyWarnings": ["Varování pokud je potřeba"]
  }
]`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: 'Jsi expert na domácí opravy. Generuješ detailní, praktické návody v češtině.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 4000,
                temperature: 0.8
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        let content = data.choices?.[0]?.message?.content?.trim();

        // Odstranit markdown bloky
        if (content.startsWith('```json')) content = content.slice(7);
        if (content.startsWith('```')) content = content.slice(3);
        if (content.endsWith('```')) content = content.slice(0, -3);

        const newRepairs = JSON.parse(content.trim());

        console.log(`✅ Vygenerováno ${newRepairs.length} návodů:`);
        newRepairs.forEach((r, i) => {
            console.log(`   ${i + 1}. ${r.name} (${r.category})`);
        });

        // Uložit do localStorage pro snadné kopírování
        localStorage.setItem('generatedRepairs', JSON.stringify(newRepairs, null, 2));
        console.log('\n📋 Data uložena do localStorage["generatedRepairs"]');
        console.log('   Pro kopírování: copy(localStorage.getItem("generatedRepairs"))');

        return newRepairs;

    } catch (error) {
        console.error('❌ Chyba při generování:', error);
        return null;
    }
}

/**
 * Přidá vygenerované návody do stávajícího JSON (nutno ručně uložit)
 */
async function mergeGeneratedRepairs() {
    const generated = localStorage.getItem('generatedRepairs');
    if (!generated) {
        console.error('❌ Žádné vygenerované návody. Nejdříve spusť generateNewRepairs()');
        return;
    }

    const newRepairs = JSON.parse(generated);
    const existingRepairs = await loadRepairsFromJSON();

    // Kontrola duplicit
    const existingIds = new Set(existingRepairs.map(r => r.id));
    const uniqueNew = newRepairs.filter(r => !existingIds.has(r.id));

    if (uniqueNew.length < newRepairs.length) {
        console.warn(`⚠️ ${newRepairs.length - uniqueNew.length} duplicitních návodů přeskočeno`);
    }

    console.log(`\n📄 Pro přidání ${uniqueNew.length} návodů do repairs.json:`);
    console.log('1. Zkopíruj výstup níže');
    console.log('2. Přidej do příslušné kategorie v data/repairs.json');
    console.log('\n--- KOPÍROVAT OD ZDE ---\n');
    console.log(JSON.stringify(uniqueNew, null, 2));
    console.log('\n--- KONEC ---');

    return uniqueNew;
}

// Export pro konzoli
window.generateNewRepairs = generateNewRepairs;
window.mergeGeneratedRepairs = mergeGeneratedRepairs;

// ========================================
// Inteligentní AI Generátor (pro Investor stránku)
// ========================================

let generatedRepairsData = [];
let isGenerating = false;

/**
 * Hlavní funkce pro generování 50 nových unikátních návodů
 */
async function startGenerating() {
    if (isGenerating) return;

    const apiKey = await getApiKey();
    if (!apiKey) {
        showToast('Nejdříve nastavte OpenAI API klíč v menu.', 'error');
        openApiKeyModal();
        return;
    }

    isGenerating = true;
    generatedRepairsData = [];

    // UI elementy
    const btn = document.getElementById('generateBtn');
    const progress = document.getElementById('generatorProgress');
    const result = document.getElementById('generatorResult');

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generuji...';
    progress.style.display = 'block';
    result.style.display = 'none';

    try {
        // 1. Načíst existující návody
        updateProgress(0, 'Načítám existující návody...', '');
        const existingRepairs = await loadRepairsFromJSON();

        // 2. Vytvořit seznam existujících názvů pro AI
        const existingTitles = existingRepairs.map(r => r.title).join(', ');

        updateProgress(5, 'Připravuji kontext pro AI...', `${existingRepairs.length} existujících návodů`);

        // 3. Generovat jednotlivě (spolehlivější)
        const totalGuides = 50;
        let failures = 0;
        const maxFailures = 5;

        for (let i = 0; i < totalGuides && failures < maxFailures; i++) {
            const progress_pct = 5 + (i / totalGuides) * 90;
            updateProgress(progress_pct, `Generuji návod ${i + 1}/${totalGuides}...`, `Hotovo: ${generatedRepairsData.length}`);

            try {
                const newRepair = await generateSingleRepair(apiKey, existingTitles, generatedRepairsData);
                if (newRepair) {
                    generatedRepairsData.push(newRepair);
                    failures = 0; // Reset po úspěchu
                }
            } catch (err) {
                console.error(`Guide ${i + 1} error:`, err);
                failures++;
                if (failures >= maxFailures) {
                    showToast(`Příliš mnoho chyb (${failures}), zastavuji`, 'error');
                }
            }

            // Krátká pauza mezi requesty
            if (i < totalGuides - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        // 4. Dokončeno
        updateProgress(100, 'Dokončeno!', '');

        // Uložit do localStorage
        localStorage.setItem('generatedRepairs', JSON.stringify(generatedRepairsData, null, 2));

        // Automaticky sloučit
        updateProgress(98, 'Slučuji do databáze...', '');
        await mergeGeneratedRepairs();

        // Zobrazit výsledek
        setTimeout(() => {
            progress.style.display = 'none';
            result.style.display = 'block';
            document.getElementById('resultText').textContent =
                `Vygenerováno a sloučeno ${generatedRepairsData.length} nových návodů do databáze!`;
        }, 500);

    } catch (error) {
        console.error('Generation error:', error);
        showToast('Chyba při generování: ' + error.message, 'error');
        progress.style.display = 'none';
    } finally {
        isGenerating = false;
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Vygenerovat 50 nových';
    }
}

/**
 * Generuje jeden návod - spolehlivější než batch
 */
async function generateSingleRepair(apiKey, existingTitles, alreadyGenerated) {
    const recentNames = alreadyGenerated.slice(-15).map(r => r.name).join(', ');
    const categories = ['Koupelna', 'Dům', 'Elektro', 'Topení', 'Kuchyň', 'Zahrada'];
    const randomCat = categories[Math.floor(Math.random() * categories.length)];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{
                role: 'user',
                content: `Vygeneruj 1 návod na opravu v kategorii "${randomCat}".

NEPOUŽÍVEJ: ${existingTitles.substring(0, 800)}${recentNames ? ', ' + recentNames : ''}

Vrať POUZE tento JSON (nic jiného):
{"id":"kebab-id","name":"Název","description":"Popis","category":"${randomCat}","categoryKey":"${randomCat === 'Koupelna' ? 'bathroom' : randomCat === 'Dům' ? 'house' : randomCat === 'Elektro' ? 'electrical' : randomCat === 'Topení' ? 'heating' : randomCat === 'Kuchyň' ? 'kitchen' : 'garden'}","difficulty":"Střední","timeEstimate":"30 min","riskScore":2,"materialCost":{"min":200,"max":800},"professionalCost":{"min":800,"max":2500},"tools":["nástroj1","nástroj2"],"steps":[{"step":1,"action":"Krok","time":"10 min","hint":"Tip"}],"safetyWarnings":["Varování"]}`
            }],
            max_tokens: 1000,
            temperature: 0.9
        })
    });

    if (!response.ok) {
        throw new Error(`API ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content?.trim();

    if (!content) throw new Error('Prázdná odpověď');

    // Očistit od markdown
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Najít JSON objekt
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Žádný JSON v odpovědi');

    const repair = JSON.parse(jsonMatch[0]);

    // Validace základních polí
    if (!repair.id || !repair.name) throw new Error('Neplatný návod');

    return repair;
}

function updateProgress(percent, text, detail) {
    const bar = document.getElementById('progressBar');
    const txt = document.getElementById('progressText');
    const pct = document.getElementById('progressPercent');
    const det = document.getElementById('progressDetail');

    if (bar) bar.style.width = percent + '%';
    if (txt) txt.textContent = text;
    if (pct) pct.textContent = Math.round(percent) + '%';
    if (det) det.textContent = detail;
}

async function mergeGeneratedRepairs() {
    const newData = localStorage.getItem('generatedRepairs');
    if (!newData) {
        showToast('Žádná nová data k sloučení', 'error');
        return;
    }

    try {
        const newRepairs = JSON.parse(newData);
        if (!Array.isArray(newRepairs) || newRepairs.length === 0) {
            showToast('Žádné návody k sloučení', 'error');
            return;
        }

        // Načíst existující sloučené návody z localStorage
        const existingMerged = localStorage.getItem('mergedRepairs');
        let allMerged = existingMerged ? JSON.parse(existingMerged) : [];

        // Přidat nové (vyhnout se duplicitám podle id)
        const existingIds = new Set(allMerged.map(r => r.id));
        const uniqueNew = newRepairs.filter(r => !existingIds.has(r.id));

        allMerged = [...allMerged, ...uniqueNew];

        // Uložit sloučené
        localStorage.setItem('mergedRepairs', JSON.stringify(allMerged));

        // Vyčistit generované (už jsou sloučené)
        localStorage.removeItem('generatedRepairs');

        // Invalidovat cache aby se znovu načetly s novými daty
        repairsCache = null;

        // Aktualizovat počty
        await updateInvestorRepairCount();
        if (typeof updateRepairCount === 'function') {
            updateRepairCount();
        }

        // Aktualizovat UI
        const btn = document.getElementById('mergeBtn');
        if (btn) {
            btn.innerHTML = '<i class="fas fa-check"></i> Sloučeno!';
            btn.disabled = true;
        }

        showToast(`Sloučeno ${uniqueNew.length} nových návodů!`, 'success');

    } catch (err) {
        console.error('Merge error:', err);
        showToast('Chyba při slučování: ' + err.message, 'error');
    }
}

function resetGenerator() {
    document.getElementById('generatorProgress').style.display = 'none';
    document.getElementById('generatorResult').style.display = 'none';
    generatedRepairsData = [];
}

async function updateInvestorRepairCount() {
    const el1 = document.getElementById('currentRepairCount');
    const el2 = document.getElementById('investorRepairCount');
    try {
        const repairs = await loadRepairsFromJSON();
        if (el1) el1.textContent = repairs.length;
        if (el2) el2.textContent = repairs.length;
    } catch (e) {
        if (el1) el1.textContent = '100+';
        if (el2) el2.textContent = '100+';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('currentRepairCount') || document.getElementById('investorRepairCount')) {
        updateInvestorRepairCount();
    }
});

window.startGenerating = startGenerating;
window.mergeGeneratedRepairs = mergeGeneratedRepairs;
window.resetGenerator = resetGenerator;

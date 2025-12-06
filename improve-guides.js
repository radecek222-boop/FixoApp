/**
 * Skript pro vylepšení návodů pomocí OpenAI API
 * Každý návod bude přepsán tak, aby byl srozumitelný pro naprosté amatéry
 */

const fs = require('fs');

// Konfigurace
const INPUT_FILE = 'data/generated-repairs.json';
const OUTPUT_FILE = 'data/generated-repairs.json';
const BACKUP_FILE = 'data/generated-repairs-backup.json';
const PROGRESS_FILE = 'data/improve-progress.json';
const BATCH_SIZE = 10; // Kolik návodů zpracovat najednou
const DELAY_MS = 500; // Pauza mezi requesty

// OpenAI API klíč - načíst z argumentu nebo proměnné prostředí
const API_KEY = process.argv[2] || process.env.OPENAI_API_KEY;

if (!API_KEY) {
    console.error('Chybí OpenAI API klíč!');
    console.error('Použití: node improve-guides.js <API_KEY>');
    process.exit(1);
}

// Prompt pro vylepšení návodu
const SYSTEM_PROMPT = `Jsi expert na DIY opravy a píšeš návody pro naprosté amatéry - lidi, kteří nikdy nic neopravovali.

Tvým úkolem je přepsat návod tak, aby:
1. Byl VELMI srozumitelný pro začátečníky
2. Každý krok vysvětloval PROČ se dělá (ne jen co)
3. Obsahoval praktické tipy a varování
4. Používal jednoduché, běžné výrazy (ne odborné termíny)
5. Povzbuzoval čtenáře, že to zvládne

Formát odpovědi - POUZE platný JSON objekt:
{
  "description": "Krátký, srozumitelný popis problému a co návod řeší (2-3 věty)",
  "difficulty": "Snadné" nebo "Střední" nebo "Těžké",
  "timeEstimate": "realistický odhad času pro začátečníka",
  "tools": ["seznam", "nástrojů", "s vysvětlením co to je"],
  "materials": ["seznam", "materiálů", "které potřebujete koupit"],
  "safetyWarnings": ["důležitá", "bezpečnostní", "upozornění"],
  "steps": [
    {
      "step": 1,
      "action": "Detailní popis kroku - co přesně udělat",
      "why": "Proč tento krok děláme",
      "tip": "Praktický tip pro začátečníky",
      "time": "kolik minut tento krok zabere"
    }
  ],
  "commonMistakes": ["časté", "chyby", "kterým se vyhnout"],
  "whenToCallPro": "Kdy je lepší zavolat odborníka místo DIY"
}`;

async function improveGuide(guide) {
    const userPrompt = `Přepiš tento návod pro naprosté amatéry:

Název: ${guide.name}
Kategorie: ${guide.category}
Aktuální popis: ${guide.description}
Nástroje: ${guide.tools?.join(', ') || 'neuvedeno'}
Materiály: ${guide.materials?.join(', ') || 'neuvedeno'}
Aktuální kroky:
${guide.steps?.map(s => `${s.step}. ${s.action}`).join('\n') || 'žádné kroky'}

Vrať POUZE JSON objekt bez žádného dalšího textu.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 2000
        })
    });

    if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();

    // Parsovat JSON z odpovědi
    let improved;
    try {
        // Odstranit markdown code blocks pokud jsou
        let jsonStr = content;
        if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
        }
        improved = JSON.parse(jsonStr);
    } catch (e) {
        console.error('JSON parse error for guide:', guide.id);
        console.error('Response:', content.substring(0, 200));
        return null;
    }

    // Sloučit vylepšená data s původními
    return {
        ...guide,
        description: improved.description || guide.description,
        difficulty: improved.difficulty || guide.difficulty,
        timeEstimate: improved.timeEstimate || guide.timeEstimate,
        tools: improved.tools || guide.tools,
        materials: improved.materials || guide.materials,
        safetyWarnings: improved.safetyWarnings || guide.safetyWarnings,
        steps: improved.steps?.map((s, i) => ({
            step: i + 1,
            action: s.action,
            why: s.why || '',
            tip: s.tip || '',
            time: s.time || '5 min',
            hint: s.tip || ''
        })) || guide.steps,
        commonMistakes: improved.commonMistakes || [],
        whenToCallPro: improved.whenToCallPro || '',
        improved: true,
        improvedAt: new Date().toISOString()
    };
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log('=== Vylepšování návodů pomocí OpenAI ===\n');

    // Načíst návody
    const guides = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
    console.log(`Načteno ${guides.length} návodů`);

    // Vytvořit zálohu
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(guides, null, 2));
    console.log(`Záloha vytvořena: ${BACKUP_FILE}`);

    // Načíst progress pokud existuje
    let progress = { lastIndex: -1, improved: [] };
    if (fs.existsSync(PROGRESS_FILE)) {
        progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
        console.log(`Pokračování od indexu ${progress.lastIndex + 1}`);
    }

    const startIndex = progress.lastIndex + 1;
    let successCount = 0;
    let errorCount = 0;

    console.log(`\nZpracovávám návody od ${startIndex} do ${guides.length - 1}...\n`);

    for (let i = startIndex; i < guides.length; i++) {
        const guide = guides[i];

        // Přeskočit již vylepšené
        if (guide.improved) {
            console.log(`[${i + 1}/${guides.length}] ${guide.id} - již vylepšeno, přeskakuji`);
            continue;
        }

        try {
            process.stdout.write(`[${i + 1}/${guides.length}] ${guide.id} - ${guide.name.substring(0, 40)}... `);

            const improved = await improveGuide(guide);

            if (improved) {
                guides[i] = improved;
                successCount++;
                console.log('✓');
            } else {
                errorCount++;
                console.log('✗ (parse error)');
            }

            // Uložit progress každých BATCH_SIZE návodů
            if ((i + 1) % BATCH_SIZE === 0) {
                progress.lastIndex = i;
                fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
                fs.writeFileSync(OUTPUT_FILE, JSON.stringify(guides, null, 2));
                console.log(`\n--- Uloženo po ${i + 1} návodech (${successCount} úspěšných, ${errorCount} chyb) ---\n`);
            }

            // Pauza mezi requesty
            await sleep(DELAY_MS);

        } catch (e) {
            errorCount++;
            console.log(`✗ (${e.message})`);

            // Při rate limit chybě počkat déle
            if (e.message.includes('429')) {
                console.log('Rate limit - čekám 60 sekund...');
                await sleep(60000);
            }
        }
    }

    // Finální uložení
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(guides, null, 2));

    // Smazat progress file
    if (fs.existsSync(PROGRESS_FILE)) {
        fs.unlinkSync(PROGRESS_FILE);
    }

    console.log('\n=== HOTOVO ===');
    console.log(`Úspěšně vylepšeno: ${successCount}`);
    console.log(`Chyby: ${errorCount}`);
    console.log(`Uloženo do: ${OUTPUT_FILE}`);
}

main().catch(console.error);

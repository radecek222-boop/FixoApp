# FIXO - AI Asistent pro domácí opravy

**Vyfoťte problém → AI diagnostika → Opravte sami nebo najděte řemeslníka**

## O aplikaci

FIXO je AI asistent pro diagnostiku a opravu domácích závad. Uživatel vyfotí problém (kapající kohoutek, vrzající dveře, nefunkční zásuvku), AI analyzuje fotografii a vrátí:

- Co je za problém
- Jak ho opravit krok za krokem
- Kolik to bude stát (materiál vs. řemeslník)
- Jaké nástroje potřebuje
- Bezpečnostní varování

## Funkce

### Pro uživatele
- **AI analýza fotek** - Upload → identifikace problému
- **500+ návodů** - Databáze oprav podle kategorií
- **Krok-za-krokem instrukce** - S časy, nástroji, hinty
- **Odhad nákladů** - DIY vs. profesionál
- **Bezpečnostní varování** - U elektřiny, plynu atd.
- **Partner e-shopy** - Hornbach, OBI, Bauhaus, Alza

### Pro řemeslníky
- Registrace do sítě
- Zákazníci v okolí
- Premium plány

## Kategorie závad

| Kategorie | Příklady |
|-----------|----------|
| 🚿 Koupelna | Kohoutek, WC, sprcha, vana |
| 🏠 Dům | Dveře, okna, zámky, podlahy |
| ⚡ Elektřina | Zásuvky, vypínače, žárovky |
| 🌡️ Topení | Radiátor, termostat, kotel |
| 🍳 Kuchyň | Dřez, sporák, myčka |
| 🌱 Zahrada | Sekačka, plot, závlaha |

## Struktura projektu

```
/FixoApp
├── index.html           # Hlavní stránka s uploadem
├── analytics.html       # Výsledky AI analýzy
├── repair.html          # Databáze oprav
├── partners.html        # Partnerské e-shopy
├── providers.html       # Řemeslníci
├── about.html           # O projektu
├── contacts.html        # Kontakty
├── privacy.html         # GDPR
├── terms.html           # Obchodní podmínky
├── manifest.json        # PWA manifest
├── /css
│   └── style.css        # Hlavní styly
├── /js
│   └── app.js           # Hlavní logika
├── /data
│   ├── repairs.json     # Databáze návodů
│   └── providers.json   # Demo řemeslníci
└── /assets
    └── /images
```

## Technologie

- HTML5, CSS3, JavaScript (vanilla)
- LocalStorage pro ukládání dat
- PWA (Progressive Web App)
- Responzivní design

## Bezpečnost

- Fotografie se neukládají - zpracovávají se pouze v paměti
- GDPR kompatibilní
- Šifrované HTTPS spojení
- Žádné sledovací cookies třetích stran

## Instalace

1. Naklonujte repozitář
2. Otevřete `index.html` v prohlížeči
3. Nebo nasaďte na GitHub Pages

## Licence

© 2024 FIXO - Všechna práva vyhrazena

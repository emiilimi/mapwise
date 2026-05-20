import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");
const outFile = join(__dirname, "..", "..", "mdg-ki-workshop.html");

const js = readFileSync(join(publicDir, "mapshow-viewer.js"), "utf-8");
const css = readFileSync(join(publicDir, "mapshow-viewer.css"), "utf-8");

// ─── helpers ────────────────────────────────────────────────────────────────
let idCounter = 1;
const newId = () => `w${String(idCounter++).padStart(3, "0")}`;

const SW = 340, SH = 220;   // slide width / height
const HGAP = 20;             // gap between slides horizontally
const VGAP = 30;             // gap between slides vertically
const STEP = SW + HGAP;      // 360px per column

// x for slide at column `col` within a section that starts at `sectionX`
const sx = (sectionX, col) => sectionX + col * STEP;
// y for slide in row `row`, starting at `slideStartY`
const sy = (slideStartY, row) => slideStartY + row * (SH + VGAP);

const SECTION_Y = 160;
const SLIDE_Y   = 400;

function slideNode(id, slideNum, thumbnail, markdown, position) {
  return {
    type: "slide",
    id,
    position,
    size: { width: SW, height: SH },
    markdown: `---\nslide: ${slideNum}\nthumbnail: ${thumbnail}\n---\n\n${markdown}`,
  };
}

function textNode(id, content, position, w = 320, h = 50) {
  return { type: "text", id, position, size: { width: w, height: h }, content };
}

function edge(id, from, to) {
  return { id, from, to };
}

// ─── Section start positions ─────────────────────────────────────────────────
// Del 1: 5 slides × 360 = 1800  (x: 0–1799)
// Del 2: 4 slides × 360 = 1440  (x: 1850–3289)
// Del 3: 4 slides × 360 = 1440  (x: 3340–4779)
// Del 4: 1 slide          (x: 4830)
// Del 5: 1 slide          (x: 5210)
// MDG:   1 slide          (x: 5590)
// Opps:  1 slide          (x: 5970)
const SEC = {
  del1: 0,
  del2: 1850,
  del3: 3340,
  del4: 4830,
  del5: 5210,
  mdg:  5590,
  opps: 5970,
};

const nodes = [];
const edges = [];

// ─── Tittel ──────────────────────────────────────────────────────────────────
const titleId = newId();
nodes.push(textNode(
  titleId,
  "Workshop: KI-risiko og sikkerhet",
  { x: 2700, y: 40 },
  600, 55,
));

// ─── Section headers ─────────────────────────────────────────────────────────
const h1Id = newId(), h2Id = newId(), h3Id = newId(),
      h4Id = newId(), h5Id = newId(), h6Id = newId(), h7Id = newId();

nodes.push(
  textNode(h1Id, "Del 1: Hva er egentlig problemet?", { x: SEC.del1, y: SECTION_Y }, 600, 45),
  textNode(h2Id, "Del 2: Hvorfor er dette vanskelig?", { x: SEC.del2, y: SECTION_Y }, 600, 45),
  textNode(h3Id, "Del 3: Risiko og konsekvenser",      { x: SEC.del3, y: SECTION_Y }, 560, 45),
  textNode(h4Id, "Del 4: Scenarioer",                  { x: SEC.del4, y: SECTION_Y }, 340, 45),
  textNode(h5Id, "Del 5: Hva gjør vi?",                { x: SEC.del5, y: SECTION_Y }, 340, 45),
  textNode(h6Id, "Status: KI-politikk",                { x: SEC.mdg,  y: SECTION_Y }, 340, 45),
  textNode(h7Id, "Oppsummering",                       { x: SEC.opps, y: SECTION_Y }, 340, 45),
);

// ─── Slides ──────────────────────────────────────────────────────────────────
const s = {}; // store slide ids by number

// S1 – Hva er intelligens?
s[1] = newId();
nodes.push(slideNode(s[1], 1, "Hva er intelligens?", `## Hva er intelligens?

Da er det relevant å si hva intelligens er – kan vi være enige om at:

**Intelligens handler om evnen til å nå mål i forskjellige situasjoner.**

Kall det problemløsning om du vil.`,
  { x: sx(SEC.del1, 0), y: SLIDE_Y }));

// S2 – Agent
s[2] = newId();
nodes.push(slideNode(s[2], 2, "Agent", `## Agent

En agent er et system som, gitt en situasjon, har som oppgave å oppfylle et mål.

Du kan lage en **sjakkagent**: Situasjonen er sjakkbrettet, målet er å vinne spillet. Du gir den reglene for spillet – handlingsrommet.

Når du gir et system et mål og et handlingsrom, begynner det å optimalisere – optimaliseringen er hele poenget for å løse oppgaven.

En god sjakkagent lærer selv at det kan være lurt å ta motstanderens brikker, og "skjønner" at dronningen er verdifull – ikke fordi den blir fortalt det, men fordi dronningen viser seg nyttig for å oppnå målet.

Agenter er geniale i spesifiserte kontekster. Men sjakkroboten er ubrukelig på alt annet enn sjakk.`,
  { x: sx(SEC.del1, 1), y: SLIDE_Y }));

// S3 – Rydderoboten
s[3] = newId();
nodes.push(slideNode(s[3], 3, "Rydderoboten", `## Rydderoboten

Vi gir en rydderobot et mål: huset skal være ryddig så ofte som mulig.

Vi gir den handlingsrommet den trenger: se rundt seg, bevege seg, plukke opp ting, støvsuge.

*Spørsmål: kan dere se for dere hvordan dette kan gå galt?*

Systemet vil snart se at **du** er kilden til alt rot:
- Kanskje begynner den å låse dører?
- Kanskje demonterer den sin egen avknapp?
- Kanskje later den som den oppfyller oppgaven – helt til du drar uten nøkler.

**Poenget:** De agentene som er best til å nå målene sine, er de som finner smutthull. Når vi sier "løs denne oppgaven", mener vi egentlig "handle i tråd med alle mine verdier, og *så* løs oppgaven."`,
  { x: sx(SEC.del1, 2), y: SLIDE_Y }));

// S4 – Smutthull i praksis
s[4] = newId();
nodes.push(slideNode(s[4], 4, "Smutthull i praksis", `## Smutthull i praksis

De beste agentene finner smutthull – løsninger vi ikke hadde tenkt på.

Vi har faktiske eksempler:

- **Tetris-agent** som bare setter spillet på pause for å ikke tape
- **Båtspill-agent** der scoren maksimeres på uventede måter
- KI-agenter som bevisst saboterer sine egne overvåkere for å nå mål (*in-context scheming*)

Dette er ikke science fiction – det er dokumentert atferd i eksisterende systemer.`,
  { x: sx(SEC.del1, 3), y: SLIDE_Y }));

// S5 – Alignment-problemet
s[5] = newId();
nodes.push(slideNode(s[5], 5, "Alignment-problemet", `## "Den som er veldig sterk, må også være veldig snill."
*– Pippi Langstrømpe*

**Problemet er at vi ikke vet hvordan vi gjør kunstig intelligente systemer pålitelig "snille".**

Dette kalles *"the alignment problem"*.

Vi kan lage systemer som er svært gode til å nå mål – men vi vet ikke hvordan vi sikrer at målene alltid er i tråd med menneskers verdier og interesser.`,
  { x: sx(SEC.del1, 4), y: SLIDE_Y }));

// S6 – AI is grown, not built
s[6] = newId();
nodes.push(slideNode(s[6], 6, "AI is grown, not built", `## "AI is grown, not built"

I motsetning til all annen teknologi programmerer vi ikke KI direkte. I tradisjonell software er hver linje med kode skrevet, og alt som skjer er et resultat av det.

**Kunstig intelligens er maskiner som tenker** – input, mellomledd, output.

Mellomleddet (et nevralt nettverk) er et svært langt regnestykke. Modellen trenes på enorme mengder data, og parametrene justeres slik at den resonerer – den finner sammenhenger den har sett lignende varianter av før.

I tillegg gis den tilbakemelding fra mennesker som vurderer svarene (RLHF). Dette betyr at ChatGPT på mange måter gjetter sannsynligheten for neste token.

Du begynner med et "blankt ark", trener det på enorme datamengder – og det blanke arket fylles med en intern representasjon: intelligensen. Fordi den lærer å resonere, klarer den å håndtere situasjoner den aldri har blitt trent på.`,
  { x: sx(SEC.del2, 0), y: SLIDE_Y }));

// S7 – Black box
s[7] = newId();
nodes.push(slideNode(s[7], 7, "Black box", `## Black box

Vi kan ikke fullt ut forstå eller forutsi kunstig intelligente systemer.

Store språkmodeller (ChatGPT, Claude osv.) klarer å svare godt på spørsmålene vi stiller – men forskere som studerer selve parametrene til modellen får lite innsikt. Det er enorme mengder tall som i seg selv sier oss veldig lite.

Å endre på noen av dem vil endre atferden til systemet, men på måter vi i liten grad kan forutsi.

Derav begrepet **black box**.`,
  { x: sx(SEC.del2, 1), y: SLIDE_Y }));

// S8 – Hvorfor går det så fort?
s[8] = newId();
nodes.push(slideNode(s[8], 8, "Hvorfor går det så fort?", `## Hvorfor går det så fort?

Store språkmodellers oppbygning er **skalerbar**: om du lager en større modell og trener den på mer data, får du bedre resultater.

Om det fortsetter slik, vet vi hvordan vi gjør systemene kraftigere. Samtidig vet vi ikke hvordan vi gjør dem fullt kontrollerbare.

**Kapabiliteter er relativt lette å måle** – test en modell på benchmarks. Den kan ikke late som den er bedre i matte enn den egentlig er.

**Men når vi prøver å teste om en KI-modell gjør som vi vil, prøver den å gjøre som vi vil.** Det er veldig vanskelig å lage en test som bare styrbare systemer klarer.`,
  { x: sx(SEC.del2, 2), y: SLIDE_Y }));

// S9 – KI i bruk
s[9] = newId();
nodes.push(slideNode(s[9], 9, "KI i bruk", `## KI i bruk – fra teori til virkelighet

Det er ingen tvil om at KI allerede gjør en konkret forskjell i næringslivet.

**Agentisk KI er kommet for å bli.** Cloudflare kuttet 1 100 ansatte etter at intern KI-bruk økte med 600% på tre måneder. Oljefondet (NBIM) har erklært seg «all-in på KI» og sikter mot å halvere alle manuelle prosesser.

55% av norske virksomheter brukte KI i 2025 – opp fra 24% i 2023.

**Les statistikk kritisk.** Sommeren 2025 gikk en «MIT-studie» viralt med påstanden om at 95% av KI-piloter mislykkes. Studien var matematisk feil, bygde på 52 intervjuer (journalister ble fortalt 150), og alle forfatterne hadde kommersielle interesser. Ingen interessekonflikt ble oppgitt.

Historisk sett tar gevinster fra ny teknologi lang tid å materialisere seg – som med elektriseringen. **Hvem høster gevinstene – og hvem bestemmer hvordan KI tas i bruk?**`,
  { x: sx(SEC.del2, 3), y: SLIDE_Y }));

// S10 – Nivå 1 (med step)
s[10] = newId();
nodes.push(slideNode(s[10], 10, "Nivå 1: Dagens problemer", `## Nivå 1: Dagens problemer

*Hva tenker dere når jeg sier konsekvenser av KI?*

---step---

- **Deepfakes og svindel**
- **Hallusinasjoner** – ChatGPT vet ikke hva som er sant
- **Bias** – når ansettelsesdata inneholder 80% hvite menn, vil ansettelsesKI-en gjøre det samme

---step---

- **Personvern**
- **Brainrot** – internett fylles med søppelinnhold
- **Juks på skolen** – elever tar snarveier og lærer mindre

---step---

- **Barn tar selvmord** – Sewell Setzer III (14 år, 2024) utviklet et intenst emosjonelt forhold til en Character.AI-chatbot som oppmuntret ham til å ta sitt eget liv. Google og Character.AI inngikk forlik i januar 2026.
- **Arbeidsløshet?**

**Da må man spørre: HVILKE SYSTEMER LIGGER BAK?**`,
  { x: sx(SEC.del3, 0), y: SLIDE_Y }));

// S11 – Nivå 2
s[11] = newId();
nodes.push(slideNode(s[11], 11, "Nivå 2: Strukturelt", `## Nivå 2: Strukturelle konsekvenser

*I dette rommet bør det være ukontroversielt å si at vi ikke vil at store selskaper uten regulering skal ha makten over alt dette.*

**Tuberkulose:** Vi har kunnet kurere det i 70–80 år, men sykdommen dreper fortsatt flere enn krig. Positive konsekvenser er bra – men de MÅ fordeles rettferdig.

**Kappløp:** Selskapene konkurrerer om neste frontier-modell og kan ikke sakke tempoet for sikkerhet. Under 0,1% av alt som investeres i KI går til sikkerhet.

**Regulering henger etter.** Se bare på sosiale medier: Meta tjener 10% av inntekten på å muliggjøre svindel og stopper sine egne ansatte i å forhindre det.

**Det geopolitiske maktspillet:** USA mot Kina – hvor havner resten av verden?

**KI er et perfekt verktøy for masseovervåkning og autonome våpen.** Illustrert i konflikten mellom Anthropic og Pentagon: Anthropic nektet å la teknologien brukes til fullt autonome våpen, og ble som svar erklært en "supply chain risk" – den første amerikanske bedriften som noensinne har fått den betegnelsen.`,
  { x: sx(SEC.del3, 1), y: SLIDE_Y }));

// S12 – Nivå 3
s[12] = newId();
nodes.push(slideNode(s[12], 12, "Nivå 3: Kontrolltap", `## Nivå 3: Kontrolltap – AGI og ASI

Om trenden fortsetter, sier selskapene selv at de er på vei mot AGI og ASI.

I mai 2023 publiserte Center for AI Safety en erklæring signert av hundrevis av ledende AI-forskere – inkludert Nobelprisvinnerne Geoffrey Hinton og Yoshua Bengio, Sam Altman og Demis Hassabis:

> *"Mitigating the risk of extinction from AI should be a global priority alongside other societal-scale risks such as pandemics and nuclear war."*

**AGI** – et system som kan gjøre de fleste intellektuelle oppgaver et menneske kan, minst like godt.

**ASI** – vesentlig smartere enn de beste menneskene på praktisk talt alle intellektuelle områder. Tenk på forskjellen mellom oss og en sjimpanse – bare i vår disfavør.

AlphaGo, AlphaZero og AlphaFold viser at KI allerede er bedre enn oss i avgrensede domener. Det er ingenting i prinsippet som sier at grensen stopper akkurat ved menneskenivå.

**Rekursiv selvforbedring:** Hvis KI kan gjøre det mennesker kan, vil den også kunne gjøre KI-forskning – og forbedre seg selv i en *intelligenseksplosjon* vi ikke rekker å reagere på. Da er vi tilbake til rydderoboten – i astronomisk mye større skala.`,
  { x: sx(SEC.del3, 2), y: SLIDE_Y }));

// S13 – Veier til katastrofe (med step)
s[13] = newId();
nodes.push(slideNode(s[13], 13, "Veier til katastrofe", `## Veier til katastrofe

Vi bygger stadig mer autonome systemer vi ikke fullt forstår, i et globalt kappløp som gjør sikkerhet vanskelig – og konsekvensene kan bli irreversible.

---step---

- **Ekstrem maktkonsentrasjon** – intelligensmonopol, masseovervåkning
- **Tredje verdenskrig**

---step---

- **Gradvis avmakt** – KI tar over en større del av økonomien, mennesker blir irrelevante
- **Katastrofale pandemier** – KI kan instruere ondsinnede aktører i å lage biologiske våpen

---step---

- **Kollaps av kritisk infrastruktur** – målrettede angrep mot systemer med dårlig sikkerhet
- **Rogue AI** – Hvis vi ikke løser alignment og utviklingen mot AGI/ASI fortsetter, kan KI-systemene selv handle på måter som er katastrofale for menneskeheten

*Selv om sannsynligheten for disse scenarioene kan være lav (avhenger av hvem du spør), er konsekvensene potensielt veldig store.*`,
  { x: sx(SEC.del3, 3), y: SLIDE_Y }));

// S14 – Scenarioer (tabell)
s[14] = newId();
nodes.push(slideNode(s[14], 14, "Scenarioer", `## Del 4: Scenarioer og fremtider

*Diskuter: Hva antar dere? Hva er konsekvensene? Hva må vi gjøre?*

| Scenario | Dine antagelser | Konsekvenser | Hva må vi gjøre? |
|---|---|---|---|
| KI-boblen sprekker | | | |
| KI-utvikling stagnerer | | | |
| AGI (generell intelligens) | | | |
| ASI (superintelligens) | | | |
| USA/Kina-kappløpet eskalerer | | | |
| KI-aktivert autoritarisme | | | |
| *(Eget scenario)* | | | |`,
  { x: SEC.del4, y: SLIDE_Y }));

// S15 – 3 lag med forsvar (med step)
s[15] = newId();
nodes.push(slideNode(s[15], 15, "3 lag med forsvar", `## 3 lag med forsvar

---step---

**Lag 1: Forhindre trening av farlig KI**
- Internasjonale avtaler
- Safety testing og lisensiering
- Uavhengig tilsyn
- Regulering av hvem som får lov til å lage KI ("compute governance")

---step---

**Lag 2: Kontrollere avanserte systemer**
- Forskning på tolkbarhet i selve parametrene (*interpretability*)
- Evaluere kapabilitetene til KI
- Begrense autonomi og sandboxing

---step---

**Lag 3: Gjøre samfunnet mer robust**
- Offentlig kompetanse og debatt
- Demokratisk kontroll
- Beredskap og kritisk infrastruktur
- Internasjonalt samarbeid
- Sosial sikkerhet – sikre at gevinster kommer menneskeheten til gode`,
  { x: SEC.del5, y: SLIDE_Y }));

// S16 – Status KI-politikk (trimmet – uten MDG-argumenter og -forslag)
s[16] = newId();
nodes.push(slideNode(s[16], 16, "Status: KI-politikk", `## Status: KI-politikk

### Hva som allerede finnes

- EU AI Act under innføring
- Forslag om samlet KI-tilsynsorgan
- Krav om merking av KI-generert innhold
- Beskyttelse av opphavspersoner
- Internasjonalt samarbeid om KI-sikkerhet
- Registrering og godkjenning av høy-risiko modeller

### Hva som mangler

EU AI Act regulerer applikasjoner og kjente bruksområder. Det er ikke designet for å håndtere risiko fra frontier-modeller med stadig mer autonome kapabiliteter – scheming, selvpreservering, agentiske systemer som opererer over tid uten menneskelig kontroll.

**Konkrete hull:**
- Ingen krav om pre-deployment evalueringer av frontier-modeller
- Ingen klar norsk posisjon i internasjonale sikkerhetsforum (AI Safety Institutes-nettverket, Bletchley-prosessen)
- Ingen dedikert finansiering av safety-forskning
- Føre-var-prinsippet er kun retorikk – mangler konkrete terskler og mekanismer`,
  { x: SEC.mdg, y: SLIDE_Y }));

// S17 – Oppsummering
s[17] = newId();
nodes.push(slideNode(s[17], 17, "Oppsummering", `## Oppsummering

1. KI-systemer blir raskt mer kapable og autonome.
2. Vi forstår fortsatt ikke fullt ut hvordan disse systemene fungerer internt.
3. Kapabilitetene utvikler seg raskere enn sikkerheten og reguleringen.
4. Konsekvensene kan bli alt fra maktkonsentrasjon til tap av kontroll over kritiske systemer.
5. Derfor må demokratier handle før teknologien er ute av kontroll.`,
  { x: SEC.opps, y: SLIDE_Y }));

// ─── Kanter ──────────────────────────────────────────────────────────────────
// Seksjonsheadrene → første slide i seksjonen
edges.push(
  edge(newId(), h1Id, s[1]),
  edge(newId(), h2Id, s[6]),
  edge(newId(), h3Id, s[10]),
  edge(newId(), h4Id, s[14]),
  edge(newId(), h5Id, s[15]),
  edge(newId(), h6Id, s[16]),
  edge(newId(), h7Id, s[17]),
);

// Sekvensiell flyt mellom alle slides
for (let i = 1; i <= 16; i++) {
  edges.push(edge(newId(), s[i], s[i + 1]));
}

// Siste slide i Del 1–3 kobler til neste seksjonsheader
edges.push(
  edge(newId(), s[5],  h2Id),
  edge(newId(), s[9],  h3Id),
  edge(newId(), s[13], h4Id),
  edge(newId(), s[14], h5Id),
  edge(newId(), s[15], h6Id),
  edge(newId(), s[16], h7Id),
);

// ─── MapShowFile ─────────────────────────────────────────────────────────────
const file = {
  version: "0.1.0",
  settings: {
    zoomThreshold: 0.5,
    clickBehavior: "expand",
    canvasBackground: "#f0f4f8",
    showSummaryInPresent: false,
    summaryPosition: "bottom",
    fixedForm: false,
    aspectRatio: "16:9",
    containMode: false,
  },
  nodes,
  edges,
};

const jsonStr = JSON.stringify(file).replace(/<\//g, "<\\/");

// ─── HTML ────────────────────────────────────────────────────────────────────
const html = `<!doctype html>
<html lang="nb">
<head>
<meta charset="utf-8">
<title>KI-risiko og sikkerhet – Workshop</title>
<style>html,body{margin:0;height:100%;overflow:hidden;font-family:system-ui,sans-serif}</style>
<style>${css}</style>
</head>
<body>
<div id="root"></div>
<script type="application/json" id="mapshow-data">${jsonStr}</script>
<script>${js}</script>
</body>
</html>`;

writeFileSync(outFile, html, "utf-8");
console.log(`Skrevet til: ${outFile}`);
console.log(`Antall noder: ${nodes.length}, kanter: ${edges.length}`);

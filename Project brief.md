Hier is een **project brief** voor **FlowForge AI** op basis van de huidige feature set in Airtable.

# FlowForge AI — Project Brief

## 1. Productvisie

FlowForge AI is een **AI-gedreven product- en ontwikkelplatform** dat de samenwerking optimaliseert tussen de **bedenker van een app** en de **developer**. Het systeem moet ideeën omzetten in duidelijke features, gestructureerde werkobjecten, concrete developer handoffs, AI-prompts, design-richting en uitvoerbare workflows.

De app moet aanvoelen als:

* een **product operating system**
* een **feature factory**
* een **AI governance platform**
* een **brug tussen concept en uitvoering**

De kernbelofte is:

**“Een app bedenken, structureren, uitbreiden, laten bouwen en blijven doorontwikkelen in één samenhangend systeem.”**

---

## 2. Hoofdrollen

### Concept Thinker / Founder / Product Architect

Deze gebruiker bedenkt features, bespreekt ideeën met AI, beoordeelt output, en houdt productvisie, logica en prioriteit scherp.

### Developer / Builder

Deze gebruiker ontvangt duidelijke developer briefs, coding prompts, statusflows, dependencies en review-context om features gestructureerd te bouwen.

### Admin / Operator

Deze gebruiker beheert pricing, AI governance, interne LLM functions, modelkeuzes, prompts, fallback-rules, versiebeheer en systeemintegriteit.

---

## 3. Hoofdstructuur van de app

De app bestaat uit 4 grote lagen:

### A. Core product layer

Voor projecten, features, backlog, detail, samenwerking en delivery.

### B. AI generation layer

Voor interne LLM functions die featuredata maken, verrijken, structureren en vertalen.

### C. Workflow & execution layer

Voor handoff, review, QA, dependencies, release en deployment.

### D. Admin & AI governance layer

Voor pricing, billing, prompts, modelrouting, LLM management en per-function optimalisatie.

---

## 4. Gebruikersflow van de app

### 4.1 Entry & Access

De gebruiker opent de app, ziet een branded splash, logt in en krijgt toegang op basis van rol en rechten.

**Features**

* FFA-001 Splash Screen
* FFA-002 Authentication
* FFA-003 Role-Based Access Control

### 4.2 Main App Flow

Na login ziet de gebruiker een overzicht van projecten en kan een nieuw project starten.

**Features**

* FFA-004 Projects Grid View
* FFA-005 Create New Project

### 4.3 Project Workspace

Binnen een project ziet de gebruiker modules die toegang geven tot features, documentatie, assets, AI tools en governance.

**Features**

* FFA-006 Project Workspace Grid
* FFA-026 Documentation Developer Module
* FFA-027 Showcase Suite Module
* FFA-028 Specific AI Agents Module
* FFA-029 App Assets Module

---

## 5. Feature ideation en generatie

De belangrijkste productflow begint in de **Feature Chat**.

De Concept Thinker bespreekt in chat een nieuw idee. Het systeem haalt projectcontext op, genereert feature-suggesties en laat de gebruiker deze beoordelen en opslaan als echte feature records.

### Chat & Suggestion Flow

* FFA-007 Feature Chat UI
* FFA-008 AppContextResolver
* FFA-009 FeatureSuggestionGenerator
* FFA-010 Feature Suggestions List View
* FFA-011 FeatureStoreSync

### Belang

Deze flow moet:

* projectcontext begrijpen
* niet generiek brainstormen
* suggesties maken die passen bij de bestaande app
* goedkeurbare output leveren
* goedgekeurde output opslaan als duurzame Feature Cards

---

## 6. Feature management en backlog

Zodra features zijn opgeslagen, moeten ze als echte werkobjecten beheerd worden.

### Feature List / Backlog

* FFA-012 Feature List View
* FFA-013 Status Group Chips
* FFA-014 Minimal Feature Card
* FFA-015 Expandable Feature Card Detail

De backlog moet:

* scanbaar zijn
* groepeerbaar op status
* makkelijk navigeerbaar
* geschikt voor dagelijks werk

---

## 7. Feature detail als centraal werkobject

De Feature Card is het centrale object van de app. Deze moet niet alleen een record zijn, maar een **volledig execution object**.

### Core detail structure

* FFA-016 Detailed Feature Card Structure
* FFA-076 Approved Feature Card Data Schema

De Feature Card moet bevatten:

* strategische waarde
* niet-technische uitleg
* developer brief
* prompts
* status
* comments
* dependencies
* review
* delivery-tracking
* versie-linking

### Feature detail sections

* FFA-017 Concept Thinker Section
* FFA-019 Builder Section

### Internal translators

* FFA-018 ConceptTranslator
* FFA-020 TechnicalTranslator

### Prompt surfaces

* FFA-021 Prompt Redirect Tabs
* FFA-022 Coding Agents Prompt Modal
* FFA-023 CodingPromptGenerator
* FFA-024 UI Design Agents Modal
* FFA-025 UIDesignPromptGenerator

---

## 8. Collaboration, handoff en kwaliteitscontrole

FlowForge AI moet samenwerking tussen architect en builder formaliseren.

### Collaboration layer

* FFA-051 Decision & Clarification Queue
* FFA-052 Builder Handoff Workflow
* FFA-053 Review & QA Workflow
* FFA-054 Dependency Graph & Blockers
* FFA-055 Version Assignment Workflow
* FFA-070 Release Readiness Dashboard
* FFA-073 Assigned Work Dashboard
* FFA-075 Implementation PR & Deployment Tracking

### Belangrijk gedrag

De app moet:

* open vragen expliciet maken
* handoff states formaliseren
* review en QA afdwingen
* dependencies zichtbaar maken
* feature-to-version linking ondersteunen
* release readiness bewaken
* werk per actor zichtbaar maken
* deployment en PR tracking ondersteunen

---

## 9. Data, storage en infrastructuur

De app heeft een solide persistence layer nodig zodat projecten, features, prompts, assets en settings duurzaam blijven bestaan.

### Infrastructure / storage

* FFA-038 Responsive Platform Layout
* FFA-039 Multi-Language Support
* FFA-040 Data & Storage Layer
* FFA-041 Brightness Slider
* FFA-046 File Upload
* FFA-047 Storage Browser
* FFA-048 Feature Cards Database Storage
* FFA-049 Feature Status Database Storage
* FFA-050 Generated Prompts Database Storage

### Verwachting

Het systeem moet:

* mobiel en tablet sterk werken
* stabiele persistence hebben
* uploads ondersteunen
* prompt-output bewaren
* feature state duurzaam maken
* meertalig schaalbaar zijn

---

## 10. AI layer en interne LLM functions

FlowForge AI gebruikt meerdere interne LLM functions om features te genereren, structureren, beoordelen en verrijken.

### Interne LLM functions

* FFA-008 AppContextResolver
* FFA-009 FeatureSuggestionGenerator
* FFA-018 ConceptTranslator
* FFA-020 TechnicalTranslator
* FFA-023 CodingPromptGenerator
* FFA-025 UIDesignPromptGenerator
* FFA-056 Change Impact Engine
* FFA-058 Prompt Regeneration Governance
* FFA-074 Decision Propagation Engine
* FFA-077 Field-Specific LLM Functions for Feature Cards
* FFA-078 FeatureTitleGenerator
* FFA-079 ProblemValueSynthesizer
* FFA-080 DifferentiationAnalyzer
* FFA-081 NoCoderDescriptionWriter
* FFA-082 DeveloperDescriptionWriter
* FFA-083 FeatureScorer
* FFA-084 ImplementationSequencePlanner
* FFA-085 RelatedPageMapper
* FFA-086 RelatedComponentMapper
* FFA-087 ArchitectCommentAssistant
* FFA-088 BuilderCommentAssistant
* FFA-089 StatusRecommendationEngine
* FFA-090 CommitReferenceLinker
* FFA-091 AppConceptImpactAnalyzer
* FFA-093 PendingFeatureSequenceEngine

### Doel van deze AI layer

Deze functions moeten:

* feature context begrijpen
* featuretitels maken
* strategic value formuleren
* no-coder en developer content maken
* coding en UI prompts maken
* implementatievolgorde adviseren
* pages/components mappen
* comments ondersteunen
* status aanbevelen
* commits koppelen
* conceptimpact analyseren

---

## 11. AI governance en per-function control

Dit is één van de belangrijkste onderscheidende lagen van FlowForge AI.

### Governance core

* FFA-034 LLM Functions Management
* FFA-035 LLM Model Router
* FFA-036 PromptTemplateManager
* FFA-042 LLM Functions Overview Page
* FFA-043 Per-Function Model Assignment
* FFA-044 Default Model Fallback
* FFA-045 System Prompts Editor
* FFA-057 AI Output Approval Layer
* FFA-059 Generation Traceability Panel
* FFA-071 Compare Generations View
* FFA-072 Section Locking for AI Content

### Nieuwe per-function governance features

* FFA-095 Internal LLM Functions Registry
* FFA-096 Internal LLM Function Detail Page
* FFA-097 Per-Function System Prompt Editor
* FFA-098 Per-Function Model Selector
* FFA-099 Per-Function Fallback Settings
* FFA-100 Per-Function Test Playground
* FFA-101 Per-Function Version History

### Wat dit betekent

De admin moet per interne LLM function kunnen:

* zien wat de functie doet
* huidig model bekijken
* model veranderen
* system prompt aanpassen
* fallback instellen
* testen uitvoeren
* versiegeschiedenis bekijken
* rollback doen

Dit maakt de app niet alleen een AI-product, maar een **AI-governed platform**.

---

## 12. Billing, pricing en vertrouwen

De monetization layer moet transparant aanvoelen.

### Commercial layer

* FFA-032 Price Plans Management
* FFA-033 Invoice Viewer
* FFA-037 API Keys Overview
* FFA-094 Transparent Subscription & Token Usage Billing

### Gedrag

Gebruikers moeten:

* abonnement begrijpen
* usage in geldsniveau zien
* niet zelf tokens naar kosten vertalen
* pricing logisch en eerlijk ervaren

Admins moeten:

* plannen beheren
* facturen reviewen
* integratie-status begrijpen
* pricing governance behouden

---

## 13. Notifications en personalisatie

De app moet dagelijkse productiviteit ondersteunen.

### Features

* FFA-060 Notifications Center
* FFA-068 Notification Preferences
* FFA-069 Default Workspace Preferences

### Verwachting

Gebruikers moeten:

* belangrijke events centraal zien
* meldingen kunnen filteren
* hun workspace kunnen personaliseren
* sneller terugkeren naar hun werkcontext

---

## 14. Hoe de app eruit moet zien

### Algemene stijl

* premium dark interface
* enterprise-grade uitstraling
* mobiel-first
* tablet-strong
* rustige hiërarchie
* hoge scanbaarheid
* weinig visuele ruis
* lange content goed leesbaar
* duidelijke states

### UI-gedrag

* geen chaotische dashboards
* geen losse tools zonder context
* alles moet voelen als één coherent product system
* state handling is essentieel:

  * loading
  * empty
  * partial-data
  * restricted
  * validation
  * success
  * failure

### Tablet is belangrijk

Tablet is niet alleen “grotere mobile UI”, maar een primaire werkvorm voor:

* feature review
* lange reading
* AI governance
* documentatie
* admin controls
* comparison work

---

## 15. Hoe de app moet functioneren

### Kernprincipes

1. **Alles is project-scoped**
2. **Features zijn centrale execution objects**
3. **AI output moet governable zijn**
4. **Handoff tussen bedenker en developer moet expliciet zijn**
5. **Elke belangrijke workflow moet status, geschiedenis en context hebben**
6. **De app moet uitbreidbaar blijven**
7. **AI governance moet per functie bestuurbaar zijn**
8. **Billing moet vertrouwen geven**
9. **Developer-facing content moet opdrachtgericht zijn**
10. **De app moet voelen als een systeem, niet als losse schermen**

---

## 16. Developer samenvatting

Als een developer dit systeem bouwt, moet hij of zij begrijpen dat:

* dit geen gewone task app is
* dit geen simpele AI chat app is
* dit geen standaard feature backlog tool is

### Dit is:

een **AI-native product operating system** dat:

* ideeën opvangt
* features genereert
* features opslaat
* context vertaalt
* prompts maakt
* developers aanstuurt
* review en QA organiseert
* AI behavior bestuurt
* monetization transparant maakt

### De belangrijkste technische prioriteiten zijn:

* stabiele project- en feature-architectuur
* sterke detailstructuur voor Feature Cards
* goede storage/persistence
* heldere state management
* modulaire AI-function architecture
* admin governance per internal LLM function
* nette mobiele en tablet layouts
* auditability en traceability

---

## 17. Featurelijst in compacte vorm

### Entry & Access

FFA-001 Splash Screen
FFA-002 Authentication
FFA-003 Role-Based Access Control

### Main App Flow

FFA-004 Projects Grid View
FFA-005 Create New Project
FFA-006 Project Workspace Grid

### Feature Ideation

FFA-007 Feature Chat UI
FFA-008 AppContextResolver
FFA-009 FeatureSuggestionGenerator
FFA-010 Feature Suggestions List View
FFA-011 FeatureStoreSync

### Feature List / Backlog

FFA-012 Feature List View
FFA-013 Status Group Chips
FFA-014 Minimal Feature Card
FFA-015 Expandable Feature Card Detail

### Feature Detail

FFA-016 Detailed Feature Card Structure
FFA-017 Concept Thinker Section
FFA-018 ConceptTranslator
FFA-019 Builder Section
FFA-020 TechnicalTranslator
FFA-021 Prompt Redirect Tabs
FFA-022 Coding Agents Prompt Modal
FFA-023 CodingPromptGenerator
FFA-024 UI Design Agents Modal
FFA-025 UIDesignPromptGenerator
FFA-076 Approved Feature Card Data Schema

### Project Modules

FFA-026 Documentation Developer Module
FFA-027 Showcase Suite Module
FFA-028 Specific AI Agents Module
FFA-029 App Assets Module

### Admin / Governance

FFA-030 Admin Access Page
FFA-031 Admin Workflow Tools Suite
FFA-032 Price Plans Management
FFA-033 Invoice Viewer
FFA-034 LLM Functions Management
FFA-035 LLM Model Router
FFA-036 PromptTemplateManager
FFA-037 API Keys Overview
FFA-042 LLM Functions Overview Page
FFA-043 Per-Function Model Assignment
FFA-044 Default Model Fallback
FFA-045 System Prompts Editor
FFA-095 Internal LLM Functions Registry
FFA-096 Internal LLM Function Detail Page
FFA-097 Per-Function System Prompt Editor
FFA-098 Per-Function Model Selector
FFA-099 Per-Function Fallback Settings
FFA-100 Per-Function Test Playground
FFA-101 Per-Function Version History

### Data / Platform

FFA-038 Responsive Platform Layout
FFA-039 Multi-Language Support
FFA-040 Data & Storage Layer
FFA-041 Brightness Slider
FFA-046 File Upload
FFA-047 Storage Browser
FFA-048 Feature Cards Database Storage
FFA-049 Feature Status Database Storage
FFA-050 Generated Prompts Database Storage

### Workflow / Execution

FFA-051 Decision & Clarification Queue
FFA-052 Builder Handoff Workflow
FFA-053 Review & QA Workflow
FFA-054 Dependency Graph & Blockers
FFA-055 Version Assignment Workflow
FFA-070 Release Readiness Dashboard
FFA-073 Assigned Work Dashboard
FFA-075 Implementation PR & Deployment Tracking

### AI Layer / Orchestration

FFA-056 Change Impact Engine
FFA-057 AI Output Approval Layer
FFA-058 Prompt Regeneration Governance
FFA-059 Generation Traceability Panel
FFA-071 Compare Generations View
FFA-072 Section Locking for AI Content
FFA-074 Decision Propagation Engine
FFA-077 Field-Specific LLM Functions for Feature Cards
FFA-078 FeatureTitleGenerator
FFA-079 ProblemValueSynthesizer
FFA-080 DifferentiationAnalyzer
FFA-081 NoCoderDescriptionWriter
FFA-082 DeveloperDescriptionWriter
FFA-083 FeatureScorer
FFA-084 ImplementationSequencePlanner
FFA-085 RelatedPageMapper
FFA-086 RelatedComponentMapper
FFA-087 ArchitectCommentAssistant
FFA-088 BuilderCommentAssistant
FFA-089 StatusRecommendationEngine
FFA-090 CommitReferenceLinker
FFA-091 AppConceptImpactAnalyzer
FFA-092 Pending Features Smart Sequence
FFA-093 PendingFeatureSequenceEngine

### Notifications / Preferences / Billing UX

FFA-060 Notifications Center
FFA-068 Notification Preferences
FFA-069 Default Workspace Preferences
FFA-094 Transparent Subscription & Token Usage Billing

---

Als je wilt, zet ik dit nu om in een **strakke developer handoff brief in doc-formaat** of een **founder + developer PRD**.

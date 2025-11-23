````markdown
# Projet d'automatisation des tests de reconnaissance d'images avec Playwright
Ce projet automatise la reconnaissance d'images pour un ensemble d'exemples d'oiseaux. Les tests upload l'image sur le site
et vérifient que le nom de l'oiseau correspond et que le score de correspondance est supérieur ou égal à 90%.

Lorsque le score est inférieur à 90% (par exemple à cause de la faible qualité de l'image de test) mais que les noms correspondent,
une image de meilleure qualité est téléchargée depuis un site externe et utilisée comme nouvelle image de test.
Cette image téléchargée devient alors la nouvelle donnée de test.

Les tests réussissent si et seulement si le nom de l'oiseau correspond à l'attendu et que le pourcentage de correspondance est >= 90%.
Il est facile d'étendre les tests à un nombre quelconque d'images en les ajoutant simplement au répertoire de données.

Ce framework d'automatisation robuste est construit avec Playwright et TypeScript pour tester des applications web. Il inclut
un setup/teardown global, un reporting personnalisé et la prise en charge de plusieurs navigateurs.

## 📋 Table des matières
<!-- TOC -->
* [Projet d'automatisation des tests de reconnaissance d'images avec Playwright](#projet-dautomatisation-des-tests-de-reconnaissance-dimages-avec-playwright)
  * [📋 Table des matières](#-table-des-matires)
  * [🚀 Fonctionnalités](#-fonctionnalits)
  * [📋 Prérequis](#-prrequis)
  * [🛠️ Installation](#-installation)
  * [🏗️ Structure du projet](#-structure-du-projet)
  * [🧪 Exécution des tests](#-xecution-des-tests)
  * [⚙️ Configuration](#-configuration)
    * [Config Playwright](#config-playwright)
    * [Navigateurs](#navigateurs)
  * [📊 Rapports de test](#-rapports-de-test)
  * [🔧 Environnement](#-environnement)
  * [🚀 Intgration sur Jenkins](#-intgration-sur-jenkins)
    * [Fonctionnalités du pipeline](#fonctionnalits-du-pipeline)
    * [Configuration Jenkins](#configuration-jenkins)
      * [Télécharger, installer et configurer Jenkins](#tlcharger-installer-et-configurer-jenkins)
      * [Installer les plugins requis](#installer-les-plugins-requis)
      * [Configurer Allure dans Jenkins](#configurer-allure-dans-jenkins)
      * [Créer un job Pipeline](#crer-un-job-pipeline)
      * [Paramètres de build Jenkins](#paramtres-de-build-jenkins)
<!-- TOC -->

## 🚀 Fonctionnalités
1. Support TypeScript : développement de tests typés
2. Tests multi-navigateurs : Chromium, Firefox et WebKit
3. Setup/Teardown global : préparation et nettoyage avant/après tests
4. Reporting personnalisé : rapports enrichis
5. Exécution parallèle : optimisé pour CI/CD avec workers configurables
6. Trace & capture vidéo : enregistrement automatique en cas d'échec
7. Configuration d'environnement : paramètres flexibles pour différents environnements

## 📋 Prérequis
- Node.js 20
- npm

## 🛠️ Installation
1. Installer les dépendances
```bash
npm install
```
2. Installer les navigateurs Playwright
```bash
npx playwright install
```
3. Vérifier l'installation
```bash
npx playwright --version
```

## 🏗️ Structure du projet
playwright-demo-typescript/
├── pages/
│   └── externalSite.ts             # Fichier pour gérer le site externe de données
│   └── HomePage.ts                 # Fichier de la page d'accueil du site testé
│   └── resultspage.ts              # Fichier pour la page des résultats
│   └── uploadPage.ts               # Fichier pour la page de téléversement de l'image
├── data/
│   ├── images/
│   │   └── xxx                     # Image d'origine à reconnaître
│   └── names/
│   │     └── names.json            # Données de test : noms d'oiseaux, seuils et liens externes
│   └── alternative-images/
│        └── xxx                    # Image de meilleure qualité téléchargée depuis le site externe

├── tests/
│   ├── specs/
│   │   ├── image.spec.ts           # Test de reconnaissance d'images

├── utils/
│   └── helpers.ts                  # Fonctions utilitaires de test
│   └── logger.ts                   # Utilitaire de journalisation
├── global-setup.ts                 # Configuration globale avant les tests
├── global-teardown.ts              # Configuration globale après les tests
├── playwright.config.ts            # Configuration Playwright
├── package.json                    # Dépendances du projet
└── test-results/                   # Résultats des tests

## 🧪 Exécution des tests
```bash
# tests sur Chromium, Firefox, WebKit et Edge en mode headless
npm run all

# tests en mode non-headless
npm run all --headed

# tests sur Chromium
npm run chrome

# tests sur Firefox
npm run firefox

# tests sur WebKit (Safari)
npm run safari

# tests sur Edge
npm run edge
```

## ⚙️ Configuration
### Config Playwright
1. Timeout : 60 secondes (timeout global)
2. Retries : 2 sur CI, 0 en local
3. Workers : 1 sur CI, indéfini en local
4. Trace : activée au premier retry
5. Capture d'écran : uniquement en cas d'échec
6. Vidéo : activée au premier retry

### Navigateurs
- Chromium (Desktop Chrome)
- Firefox (Desktop Firefox)
- WebKit (Desktop Safari)
- Edge (Desktop Edge)

## 📊 Rapports de test
- List Reporter : rapports en console avec le statut des tests
- HTML Reporter : rapport HTML interactif
- Allure Reporter : rapports avancés via Allure

```bash
# Générer et visualiser les rapports de test
npx playwright show-report   # rapport Playwright
allure serve                # rapport Allure
```

## 🔧 Environnement
- `global-setup.ts` : exécuté avant tous les tests
- `global-teardown.ts` : exécuté après tous les tests

## 🚀 Intégration sur Jenkins
### Fonctionnalités du pipeline
* Builds paramétrés avec options personnalisables
* Nettoyage automatique du workspace
* Tests multi-navigateurs
* Support d'exécution parallèle
* Génération de rapports Allure
* Notifications du statut de build

### Configuration Jenkins
#### Télécharger, installer et configurer Jenkins
Consultez la documentation officielle de Jenkins :
https://www.jenkins.io/doc/

#### Installer les plugins requis
* Allure Jenkins Plugin
* Pipeline Plugin
* Git Plugin

#### Configurer Allure dans Jenkins
* Allez dans Manage Jenkins → Global Tool Configuration
* Ajoutez une installation Allure Commandline
* Nom : `allure`
* Installation automatique : activée

#### Créer un job Pipeline
* New Item → Pipeline
* Definition : Pipeline script from SCM
* SCM : Git
* Repository URL : `hhttps://github.com/Ndongie/playwright-image-recognition-demo.git`
* Script Path : `Jenkinsfile`

#### Paramètres de build Jenkins
| Parameter | Options                            | Description           |
|-----------|------------------------------------|-----------------------|
| BROWSER   | all, chrome, firefox, edge, safari | Navigateur de test    |
| HEADLESS  | true/false                         | Mode headless         |

````

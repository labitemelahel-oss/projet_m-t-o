# AgriMétéo Pro

AgriMétéo Pro est un tableau de bord météo-agricole pour suivre les conditions d'une ville, organiser les travaux aux champs et conserver le suivi des parcelles. L'interface est en français et s'adapte aux écrans de bureau et aux téléphones.

## Fonctionnalités

- **Météo** : conditions actuelles, prévisions horaires sur 48 heures, prévisions sur 10 jours, pluie, vent, soleil et lune.
- **Indicateurs** : interprétation agronomique de la température ressentie, du point de rosée, du vent, de l'humidité, de la pression, des précipitations, de l'UV et de la visibilité.
- **Conseils** : indice des conditions, recommandations prioritaires, fenêtres d'action sur 72 heures, alertes et diagnostic pour chaque parcelle enregistrée.
- **Cultures et parcelles** : catalogue filtrable par catégorie, cycle et besoin en eau; compatibilité météo; calendriers de semis et itinéraires techniques; cultures personnalisées; parcelles et journal de culture.
- **Vidéos guidées** : fiches classées par situation. Chaque étape affiche un schéma agricole 3D animé généré dans le navigateur, avec lecture, pause, navigation par chapitre, transcription et impression d'une fiche terrain.
- **Actualités** : actualités locales et événements en direct, avec recherche et filtres.
- **Assistant AgriBot** : réponses sur la météo, les cultures, les semis, l'élevage, les parcelles et les fonctions du site. Les conseils de semis tiennent compte du calendrier et des prévisions de la ville active.

## Utilisation

1. Choisissez la ville à suivre depuis le bouton de localisation en haut de page.
2. Consultez la météo, les indicateurs ou les conseils pour cette ville.
3. Dans **Cultures**, recherchez une culture, ajoutez vos parcelles et consignez les opérations dans le journal.
4. Dans **Vidéos**, choisissez une situation puis une fiche. Utilisez les commandes du lecteur ou sélectionnez directement une étape du storyboard.
5. Utilisez l'assistant pour poser une question en langage courant ou sélectionner une suggestion.

Les données météo sont fournies par Open-Meteo. Les événements en direct et certaines bibliothèques de l'interface nécessitent une connexion Internet. Les données agricoles déjà enregistrées restent disponibles localement si le réseau est indisponible.

## Lancement local

Prérequis : Python 3. Le serveur utilise uniquement la bibliothèque standard de Python; aucun paquet Python n'est à installer.

Depuis le dossier du projet, pour initialiser une nouvelle base avec l'export fourni :

```powershell
py -3 server.py --import-sql "f207c7cf-ffaf-4853-af7f-2887e836d531_preview_database_export.sql"
```

Ouvrez ensuite <http://127.0.0.1:8000/>. Si la commande `py` n'est pas disponible, utilisez `python server.py --import-sql "f207c7cf-ffaf-4853-af7f-2887e836d531_preview_database_export.sql"`.

Pour les démarrages suivants, ne réimportez pas le dump : il pourrait remplacer les enregistrements portant les mêmes identifiants. Lancez simplement :

```powershell
py -3 server.py
```

Arrêtez le serveur avec `Ctrl+C`. Pour choisir un autre port, utilisez `py -3 server.py --port 8001`. La base persistante est créée dans `data/agrimeteo.sqlite3`.

## Données et réseau

Le serveur sert à la fois la page web et l'API REST `/tables/...` utilisée par l'application. Les villes, parcelles, entrées du journal, règles d'alerte, cultures personnalisées et préférences sont conservées dans SQLite. Au premier chargement, les données présentes dans le stockage local du navigateur sont copiées vers l'API si elles n'y figurent pas déjà.

Le stockage du navigateur est isolé par origine. Pour retrouver un ancien cache, ouvrez le site avec le même protocole, le même hôte et le même port qu'auparavant. N'ouvrez pas `index.html` directement en `file://` : utilisez l'adresse locale ci-dessus.

Le serveur écoute par défaut uniquement sur `127.0.0.1` et son API ne comporte pas d'authentification. Il est destiné au développement local; ne l'exposez pas directement sur Internet.

## Organisation du projet

- `index.html` : structure des vues et chargement des scripts.
- `css/style.css` : mise en page et styles responsive.
- `js/` : météo, données agricoles, cultures, conseils, assistant, clips 3D et accès aux tables.
- `server.py` : serveur web local et API REST SQLite.
- `data/agrimeteo.sqlite3` : base créée au premier démarrage; elle contient les données persistantes de l'application.
- `_selftest.html` : banc de tests fonctionnels ouvrable depuis le serveur local.
# AgriMétéo Pro

AgriMétéo Pro est un tableau de bord météo-agricole pour suivre les conditions d'une ville, organiser les travaux aux champs et conserver le suivi des parcelles. L'interface est en français et s'adapte aux écrans de bureau et aux téléphones.

Le site est déployé en ligne sur **Render**. Ouvrez l'URL publique de l'application fournie par Render pour y accéder depuis un navigateur; le lancement local décrit plus bas est uniquement destiné au développement.

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

Les données météo sont fournies par Open-Meteo. Les événements en direct et certaines bibliothèques de l'interface nécessitent une connexion Internet. Les données agricoles déjà enregistrées dans le navigateur restent disponibles hors ligne sur le même appareil et pour la même adresse du site.

## Déploiement sur Render

Render fournit une URL publique pour accéder au site. Pour un service Web Render exécutant ce dépôt, utilisez la commande de démarrage suivante afin d'écouter sur le port attribué par Render :

```sh
python server.py --host 0.0.0.0 --port $PORT
```

Le serveur utilise uniquement la bibliothèque standard de Python; aucun paquet Python n'est à installer. La base SQLite est créée dans `data/agrimeteo.sqlite3`. Pour conserver les données de l'API entre les redémarrages et les déploiements, configurez un disque persistant Render et placez la base sur ce disque. Sans stockage persistant, les données enregistrées sur le système de fichiers de l'instance peuvent être perdues.

**Attention :** l'API du projet ne comporte pas d'authentification. Ne stockez pas de données sensibles et n'utilisez pas ce déploiement pour des données privées sans ajouter de contrôle d'accès adapté.

## Lancement local pour le développement

Prérequis : Python 3. Depuis le dossier du projet, pour initialiser une nouvelle base avec l'export fourni :

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

Le stockage SQLite de ce lancement local se trouve dans `data/agrimeteo.sqlite3`. La commande de développement n'est pas nécessaire pour accéder au site déjà déployé sur Render.

## Organisation du projet

- `index.html` : structure des vues et chargement des scripts.
- `css/style.css` : mise en page et styles responsive.
- `js/` : météo, données agricoles, cultures, conseils, assistant, clips 3D et accès aux tables.
- `server.py` : serveur web et API REST SQLite.
- `data/agrimeteo.sqlite3` : base créée au premier démarrage; elle contient les données persistantes de l'application.
- `_selftest.html` : banc de tests fonctionnels ouvrable depuis le serveur.
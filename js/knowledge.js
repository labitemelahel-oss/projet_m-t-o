/* =====================================================================
   knowledge.js — Base de connaissances de l'assistant AgriBot
   Répond hors ligne à partir de règles et de correspondances de mots-clés.
   Le chatbot consulte aussi la météo courante, les cultures et les fiches
   vidéo pour personnaliser ses réponses.
   ===================================================================== */
'use strict';

/* ---------- Sujets de la base de connaissances ----------
   kw  : mots-clés déclencheurs (normalisés sans accents)
   tag : réponse (HTML simple autorisé : <p>, <ul>, <strong>, <code>)
   tip : conseil final
--------------------------------------------------------------- */
const KB = [
  /* ---------------------- UTILISATION DU SITE ---------------------- */
  {
    id: 'site-demarrage', title: 'Prise en main de l\'application',
    kw: ['comment utiliser', 'prise en main', 'demarrer', 'commence', 'premiere fois', 'ou commencer', 'tuto', 'guide utilisation', 'site', 'application'],
    answer: '<p>Bienvenue ! Voici le parcours conseillé, en 4 minutes :</p>' +
      '<ul>' +
      '<li><strong>1. Météo</strong> — votre ville active s\'affiche en grand (température, ciel, max/min, ressenti). Faites défiler la bande de villes pour changer de localité, ou touchez le nom de la ville en haut pour en ajouter une.</li>' +
      '<li><strong>2. Prévisions météo</strong> — suivez la pluie attendue sur les prochains jours pour planifier les travaux et les arrosages.</li>' +
      '<li><strong>3. Conseils</strong> — le moteur d\'aide à la décision traduit la météo en actions concrètes pour <em>vos</em> parcelles.</li>' +
      '<li><strong>4. Cultures</strong> — catalogue de plus de 90 cultures et élevages, plus votre journal de culture.</li>' +
      '<li><strong>5. Vidéos</strong> — que faire pendant chaque situation météo, en diaporama narré.</li>' +
      '<li><strong>6. Actus</strong> — bulletins et veille internationale en direct.</li>' +
      '</ul>' +
      '<p>Sur téléphone, les onglets sont en bas de l\'écran. Sur ordinateur, le menu est à gauche.</p>',
    tip: 'Astuce : commencez par ajouter vos parcelles (onglet Cultures → Ajouter) pour que tous les conseils deviennent personnalisés.'
  },
  {
    id: 'site-parcelle', title: 'Ajouter une parcelle',
    kw: ['ajouter parcelle', 'creer parcelle', 'nouvelle parcelle', 'mes parcelles', 'champ', 'exploitation', 'enregistrer champ'],
    answer: '<p>Une <strong>parcelle</strong> relie une culture à une ville météo : c\'est ce qui permet à l\'application de calculer vos conseils.</p>' +
      '<ul><li>Onglet <strong>Cultures</strong> → bouton <strong>Ajouter</strong> (bloc « Mes parcelles »).</li>' +
      '<li>Renseignez : nom, ville météo, culture, surface en hectares, type de sol, mode d\'irrigation, date de semis et stade actuel.</li>' +
      '<li>Le sélecteur <em>Culture</em> contient tout le catalogue (cultures, élevages, pisciculture, systèmes).</li>' +
      '<li>Enregistrez : la parcelle apparaît dans le diagnostic de l\'onglet Conseils avec ses indicateurs dédiés.</li></ul>',
    tip: 'Une parcelle par grand type de sol : un sol sableux et un sol hydromorphe n\'ont pas les mêmes besoins en eau.'
  },
  {
    id: 'site-villes', title: 'Gérer plusieurs villes',
    kw: ['ville', 'villes', 'changer ville', 'ajouter ville', 'multi ville', 'multi-villes', 'gps', 'ma position', 'localisation', 'autre pays'],
    answer: '<p>Vous pouvez suivre autant de villes que vous voulez.</p>' +
      '<ul><li>Touchez le <strong>nom de la ville en haut de l\'écran</strong> pour ouvrir le gestionnaire.</li>' +
      '<li><strong>Rechercher</strong> : tapez n\'importe quelle ville du monde (le géocodage est mondial).</li>' +
      '<li><strong>Me localiser</strong> : bouton « Utiliser ma position GPS ».</li>' +
      '<li><strong>Définir la principale</strong> : étoile ; elle s\'affiche par défaut à l\'ouverture.</li>' +
      '<li><strong>Retirer</strong> une ville : icône poubelle (vos parcelles restent enregistrées).</li></ul>' +
      '<p>La bande horizontale sous l\'en-tête montre toutes vos villes avec leur température et leurs min/max.</p>',
    tip: 'Ajoutez la ville de votre parcelle même si vous habitez en ville : les prévisions seront celles du champ, pas celles de votre domicile.'
  },
  {
    id: 'site-alertes', title: 'Configurer des alertes personnalisées',
    kw: ['alerte', 'alertes', 'notification', 'notifications', 'seuil', 'regle', 'm\'avertir', 'prevenir'],
    answer: '<p>Trois familles d\'alertes existent :</p>' +
      '<ul><li><strong>Règles personnalisées</strong> — icône cloche en haut de l\'écran. Choisissez un indicateur (température min/max, probabilité de pluie, cumul de pluie, vent, humidité, UV, pression), un opérateur, un seuil et un horizon en heures.</li>' +
      '<li><strong>Alertes agronomiques automatiques</strong> — calculées en continu (stress thermique, déficit hydrique, risque fongique, risque de verse, dérive de pulvérisation). Elles apparaissent dans l\'onglet <em>Conseils</em>.</li>' +
      '<li><strong>Notifications du navigateur</strong> — bouton « Autoriser les notifications » dans la fenêtre Alertes. Le navigateur demande votre accord une fois.</li></ul>' +
      '<p>Les alertes fonctionnent sur l\'horizon choisi : 24 h, 48 h ou plus selon la règle.</p>',
    tip: 'Une règle efficace : pluie ≥ 70 % dans les 24 h → « reporter l\'arrosage et protéger le séchage ».'
  },
  {
    id: 'site-theme', title: 'Thème, unités et réglages',
    kw: ['theme', 'sombre', 'couleur', 'contraste', 'unite', 'celsius', 'fahrenheit', 'reglage', 'affichage', 'taille'],
    answer: '<p>Chaque ville dispose de <strong>deux affichages</strong> : par jour et par nuit, avec des cartes qui regroupent les heures. Les unités et le thème se règlent via <strong>Réglages</strong> (engrenage en haut à droite de la barre d\'en-tête) :</p>' +
      '<ul><li>Températures en °C ou °F.</li><li>Vitesse du vent en km/h ou nœuds.</li><li>Pluie en millimètres ou pouces.</li></ul>',
    tip: 'Le format 12 h ou 24 h suit la langue de votre navigateur ; le reste de l\'interface est en français.'
  },

  /* ---------------------- MÉTÉO & PRÉVISIONS ---------------------- */
  {
    id: 'meteo-lecture', title: 'Lire les prévisions correctement',
    kw: ['lire prevision', 'comprendre meteo', 'prevision', 'probabilite', 'pourcentage pluie', 'bulletin', 'interpretation', 'fiable', 'confiance'],
    answer: '<p>Trois précisions pour bien interpréter la météo :</p>' +
      '<ul><li><strong>Probabilité de pluie</strong> : « 60 % » ne veut pas dire « il pleuvra 60 % du temps », mais « dans 6 situations similaires sur 10, il a plu ». C\'est un indice de confiance, pas d\'intensité.</li>' +
      '<li><strong>Cumul de pluie (mm)</strong> : 1 mm = 1 litre par m². Utile pour les plantes : 10 mm mouillent le sol sur environ 10 cm en sol sableux, 5 cm en sol argileux.</li>' +
      '<li><strong>Fiabilité</strong> : excellente à 24 h pour la température, correcte à 72 h. Au-delà de 7 jours, considérez la tendance, pas la valeur.</li></ul>',
    tip: 'Croisez toujours la probabilité de pluie avec le <strong>cumul prévu</strong> : 80 % de 1 mm ne justifie pas de reporter un semis ; 40 % de 25 mm, oui.'
  },
  {
    id: 'meteo-ressenti', title: 'Température ressentie et point de rosée',
    kw: ['ressenti', 'feels like', 'point de rosee', 'dew point', 'humidite', 'lourd', 'chaleur humide'],
    answer: '<p>La <strong>température ressentie</strong> combine la température de l\'air et l\'humidité (ou le vent, s\'il fait froid). Deux exemples :</p>' +
      '<ul><li>31 °C avec 80 % d\'humidité → ressenti proche de 40 °C. Le corps ne peut plus évacuer sa chaleur par la sueur : risque de coup de chaleur pour vous comme pour les animaux.</li>' +
      '<li>18 °C avec 25 km/h de vent → ressenti proche de 14 °C. Les jeunes plants et les volailles souffrent plus que ne le suggère le thermomètre.</li></ul>' +
      '<p>Le <strong>point de rosée</strong> est la température à laquelle la vapeur d\'eau commence à se condenser. Au-dessus de 22 °C, l\'air est très chargé en eau : conditions idéales pour la pourriture des fruits, la cercosporiose et les moisissures. C\'est aussi le signal que le feuillage restera mouillé longtemps le matin.</p>',
    tip: 'Une nuit où la température descend près du point de rosée = rosée abondante au matin = fenêtre à haut risque pour les maladies fongiques.'
  },
  {
    id: 'meteo-soil', title: 'Choisir ses cultures selon la zone',
    kw: ['zone', 'agro', 'region', 'quelle culture', 'quoi planter', 'adapter', 'saison', 'saison des pluies', 'harmattan'],
    answer: '<p>Trois règles simples pour le contexte ouest-africain :</p>' +
      '<ul><li><strong>Zone sahélienne (300-600 mm)</strong> : mil, sorgho, niébé, arachide, sésame, moringa, oignon irrigué. Cycle court impératif.</li>' +
      '<li><strong>Zone soudanienne (700-1200 mm)</strong> : maïs, coton, anacarde, igname, maraîchage de contre-saison, soja.</li>' +
      '<li><strong>Zone guinéenne (> 1300 mm)</strong> : manioc, igname, bananier, ananas, palmier, cacao, taro, riz, légumes-feuilles.</li></ul>' +
      '<p>Au-delà de la zone, l\'élément décisif est la <strong>réserve utile du sol</strong> : un sol limoneux profond rattrape plusieurs semaines de sécheresse, un sol sableux non.</p>',
    tip: 'Maniez toujours un <strong>cycle court</strong> (60-75 jours) en réserve de sécurité : niébé, ambérique, laitue, crincrin, mil précoce.'
  },

  /* ---------------------- IRRIGATION & EAU ---------------------- */
  {
    id: 'eau-arroser', title: 'Quand et combien arroser',
    kw: ['arroser', 'arrosage', 'irrigation', 'combien d\'eau', 'quand arroser', 'evapotranspiration', 'et0', 'besoin en eau', 'deficit hydrique'],
    answer: '<p>La règle d\'or : <strong>arroser moins souvent, plus profondément, aux heures fraîches.</strong></p>' +
      '<ul><li><strong>Quand ?</strong> Quand le sol est sec au toucher (test du poing à 10 cm de profondeur) et qu\'aucune pluie utile n\'est annoncée. Arroser avant la <strong>floraison</strong>, pendant la <strong>floraison</strong> et au <strong>grossissement</strong> : ce sont les 3 stades les plus sensibles — un déficit pendant la floraison annule une récolte entière.</li>' +
      '<li><strong>Combien ?</strong> 1 mm ≈ 1 litre par m² ≈ 10 m³/ha. Le besoin journalier d\'une tomate en pleine production est de <strong>4 à 6 mm/jour</strong>, un maïs en épiaison <strong>5 à 7 mm/jour</strong>, un citrus en production <strong>5 à 8 mm/jour</strong>.</li>' +
      '<li><strong>À quelle heure ?</strong> 6 h - 10 h ou 17 h - 20 h. Jamais entre 11 h et 16 h (30 à 40 % de perte par évaporation).</li></ul>',
    tip: 'En sol sableux, fractionnez : 2 arrosages de moitié plutôt qu\'un gros. En sol argileux, arrosez moins souvent mais plus longuement.'
  },
  {
    id: 'eau-economiser', title: 'Économiser l\'eau',
    kw: ['economiser eau', 'gaspillage', 'goutte a goutte', 'paillage', 'mulch', 'pompe', 'forage', 'reservoir', 'citerne', 'retenue'],
    answer: '<p>Six leviers, du moins coûteux au plus technique :</p>' +
      '<ol><li><strong>Paillage</strong> : -30 à -60 % d\'évaporation. Le meilleur rapport coût/efficacité.</li>' +
      '<li><strong>Arrosage localisé</strong> (au pied, pas sur toute la surface) : -30 %.</li>' +
      '<li><strong>Arrosage tôt le matin</strong> : jusqu\'à -40 % de pertes.</li>' +
      '<li><strong>Curages du réseau et réparation des fuites</strong> : une fuite de 1 mm de diamètre = 500 L/jour.</li>' +
      '<li><strong>Goutte à goutte</strong> : 4 à 6 mm/jour au lieu de 10 mm en aspersion, amorti en 1 à 2 saisons sur maraîchage.</li>' +
      '<li><strong>Stockage</strong> : bassin bâché, citerne, retenue en bas-fond, ou récupération des toits.</li></ol>',
    tip: 'Un simple paillage + arrosage matinal bien conduit permet de cultiver une planche de tomates avec 40 % d\'eau en moins.'
  },
  {
    id: 'eau-qualite', title: 'Qualité de l\'eau d\'irrigation',
    kw: ['qualite eau', 'eau salee', 'salinite', 'puisard', 'eaux usees', 'ph eau', 'conductivite', 'marre'],
    answer: '<p>Trois paramètres à connaître avant d\'irriguer :</p>' +
      '<ul><li><strong>Salinité</strong> : au-delà de 2 à 3 g/L, seules les cultures tolérantes s\'en sortent (betterave, orge, dattier, coton, palmier). Les légumes-feuilles et la fraise sont très sensibles.</li>' +
      '<li><strong>pH</strong> : entre 6 et 8, l\'eau est neutre. pH < 5 → ajoutez de la cendre ou du calcaire. pH > 8,5 → attention aux blocages de fer et de zinc ; apportez de la matière organique et acidifiez le sol.</li>' +
      '<li><strong>Hygiène</strong> : eaux usées brutes, marigots stagnants et puisards = bioaérosols, œufs de parasites et risques pour vous comme pour les consommateurs. Filtrez, décantez, et n\'irriguez jamais une salade avec une eau douteuses.</li></ul>',
    tip: 'Faites analyser votre eau une fois par an (charge de sels, pH, agents pathogènes) : un résultat de laboratoire évite deux années d\'erreurs.'
  },

  /* ---------------------- SOL & FERTILITÉ ---------------------- */
  {
    id: 'sol-fertilite', title: 'Fertiliser intelligemment',
    kw: ['engrais', 'fertilisation', 'npk', 'uree', 'azote', 'phosphore', 'potasse', 'compost', 'fumier', 'fertilite', 'dose'],
    answer: '<p>Pour 1 hectare, l\'ordre d\'importance est : <strong>organique d\'abord, minéral ensuite, fractionné toujours</strong>.</p>' +
      '<ul><li><strong>Fumier / compost</strong> : 5 à 10 t/ha avant le semis. Il améliore la structure et la rétention d\'eau, ce qu\'aucun engrais minéral ne fait.</li>' +
      '<li><strong>Azote (N)</strong> : c\'est l\'élément qui limite le rendement. Maïs : 80-120 kg N/ha en 2-3 apports (semis, 6 feuilles, floraison). Coton : 100-150 kg N/ha. Ne jamais épandre l\'urée à la volée juste avant une pluie violente (lessivage) ni en plein soleil (volatilisation).</li>' +
      '<li><strong>Phosphore (P)</strong> et <strong>potasse (K)</strong> : au fond du poquet au semis (20-30 kg P₂O₅ et 20-40 kg K₂O/ha). La potasse est déterminante pour la qualité des fruits et des tubercules.</li>' +
      '<li><strong>Fractionnement</strong> : 3 apports de 30 kg valent mieux qu\'un seul de 90 kg. Fractionner, c\'est augmenter l\'efficacité de 30 %.</li></ul>',
    tip: 'Après chaque coupe ou chaque récolte maraîchère, apportez du compost : un sol riche en matière organique retient plusieurs dizaines de mm d\'eau supplémentaires.'
  },
  {
    id: 'sol-ph', title: 'Corriger le pH du sol',
    kw: ['ph', 'acide', 'calcaire', 'chaulage', 'chaux', 'terre acide', 'sol acide', 'amendement'],
    answer: '<p>Le pH commande la disponibilité de tous les éléments nutritifs.</p>' +
      '<ul><li><strong>Sol acide (pH < 5,5)</strong> : fréquent en zone forestière humide. Symptômes : feuilles jaunes, peu de réponse aux engrais. Corrigez avec du calcaire broyé (1 à 3 t/ha, à apporter 3 mois avant le semis), de la cendre de bois ou de la dolomie.</li>' +
      '<li><strong>Sol neutre à alcalin (pH 6,5 à 8)</strong> : idéal pour la plupart des cultures. Si le pH dépasse 8, certains éléments (fer, zinc, manganèse) se bloquent : apportez de la matière organique (qui acidifie légèrement) et évitez le sur-chaulage.</li>' +
      '<li><strong>Cultures spécifiques</strong> : manioc et ananas acceptent 4,5-5,5 ; coton, orge et betterave tolèrent pH 8 ; la plupart des légumineuses préfèrent 6-7.</li></ul>',
    tip: 'Ne chauliez jamais au hasard : faites analyser le sol à la station agronomique de votre région (un échantillon prélevé en 15 points de la parcelle).'
  },
  {
    id: 'sol-erosion', title: 'Conserver son sol',
    kw: ['erosion', 'cordons pierreux', 'zai', 'diguette', 'ravine', 'ruissellement', 'sol degrade', 'croute de battance', 'conservation'],
    answer: '<p>Un sol qui part en poussière perd son potentiel de production. Cinq techniques éprouvées :</p>' +
      '<ul><li><strong>Zaï</strong> et <strong>demi-lunes</strong> : poquets de 20-30 cm remplis de compost sur sol encroûté, qui captent le ruissellement.</li>' +
      '<li><strong>Cordons pierreux</strong> et <strong>diguettes en courbe de niveau</strong> : retiennent l\'eau et le sable, avec un exutoire protégé.</li>' +
      '<li><strong>Bandes enherbées / vétiver</strong> : freinent les écoulements sur les pentes fortes.</li>' +
      '<li><strong>Paillage permanent</strong> : protège la surface de l\'impact des gouttes — la cause principale de la croûte de battance.</li>' +
      '<li><strong>Agroforesterie</strong> : arbres et haies vives (moringa, acacia, anacarde) qui stabilisent le sol et réduisent le vent.</li></ul>',
    tip: 'Une rigole qui commence se comble à la main en dix minutes. Laissée deux semaines, elle demande une journée de main-d\'œuvre.'
  },

  /* ---------------------- PROTECTION DES CULTURES ---------------------- */
  {
    id: 'phyto-ravageurs', title: 'Ravageurs fréquents et lutte raisonnée',
    kw: ['ravageur', 'insecte', 'chenille', 'legionnaire', 'puceron', 'thrips', 'aleurode', 'mouche blanche', 'foreur', 'bruche', 'acarien', 'punaise', 'lem',
      'mouche des fruits', 'charancon', 'termite', 'oiseaux', 'rongeur'],
    answer: '<p>Repérez d\'abord, agissez ensuite — et alternez les moyens :</p>' +
      '<ul><li><strong>Chenille légionnaire d\'automne</strong> (maïs, sorgho) : apparition brutale, feuilles trouées. Surveillez 2 fois/semaine au stade jeune. Traitez au stade larvaire précoce le matin ou en fin de journée (les larves sortent la nuit). Alternez les matières actives ; la lutte biologique (Bt, virus) est efficace sur jeunes larves.</li>' +
      '<li><strong>Chenilles de la capsule</strong> (coton, gombo) : 14 jours après l\'apparition des boutons floraux. Seuil : 3-5 larves pour 100 plants.</li>' +
      '<li><strong>Pucerons et thrips</strong> : se multiplient en saison sèche et à l\'abri du vent. Savon noir, neem, savon + huile végétale sont d\'excellents appoints avant tout traitement chimique.</li>' +
      '<li><strong>Mouche blanche (aleurode)</strong> : vecteur du virus TYLCV de la tomate. Pièges jaunes, filets, et variétés résistantes.</li>' +
      '<li><strong>Mouche des fruits</strong> (mangue, agrumes, goyave) : ramassage quotidien des fruits tombés, piégeage à l\'attractif, ceintures de pièges autour du verger.</li>' +
      '<li><strong>Bruche du niébé</strong> (stockage) : traitement de semence + stockage hermétique + répulsif naturel (piper guinéen, neem).</li>' +
      '<li><strong>Oiseaux (millet, sorgho, riz)</strong> : gardiennage, bandes d\'effarouchement, variétés à panicule compacte.</li></ul>',
    tip: 'Le meilleur insecticide est souvent un semis à la bonne date, une densité correcte, un sol nourri et une surveillance deux fois par semaine.'
  },
  {
    id: 'phyto-maladies', title: 'Maladies : mildiou, anthracnose, rouille',
    kw: ['maladie', 'mildiou', 'anthracnose', 'rouille', 'oidium', 'pourriture', 'fletrissement', 'fu',' fumagine', 'taches', 'fanent', 'mosaique', 'virus'],
    answer: '<p>Plus de 80 % des maladies des cultures viennent de trois causes : <strong>humidité foliaire prolongée</strong>, <strong>densité excessive</strong> et <strong>rotation absente</strong>.</p>' +
      '<ul><li><strong>Mildiou</strong> (tomate, oignon, pomme de terre) : taches huileuses, feutrage blanc au revers. Prévenez avant les pluies ; arrosez au pied, taillez les gourmands, éliminez les plants atteints.</li>' +
      '<li><strong>Anthracnose</strong> (mangue, piment, gombo, banane) : taches noires enfoncées. Éliminez les organes atteints, évitez les blessures, traitez préventivement à la nouaison.</li>' +
      '<li><strong>Rouille</strong> (blé, sorgho, café) : pustules orangées sous les feuilles. Évitez un surplus d\'azote, boucliez les variétés résistantes.</li>' +
      '<li><strong>Pourriture des fruits</strong> (cacao, ananas, papaye) : récoltez et sortez du champ les fruits malades ; améliorez le drainage du sol et l\'aération de la parcelle.</li>' +
      '<li><strong>Virus</strong> (mosaïque du manioc, TYLCV, PRSV) : pas de traitement curatif. Arrachez et brûlez les plants malades, luttez contre les vecteurs (aleurodes, pucerons), utilisez des variétés résistantes.</li></ul>',
    tip: 'Sortez du champ les parties malades et brûlez-les. Un fruit pourri laissé sur le sol contamine les suivants.'
  },
  {
    id: 'phyto-especes', title: 'Bien appliquer un traitement',
    kw: ['pulveriser', 'traitement', 'dosage', 'dose', 'melange', 'epi', 'protection', 'masque', 'delai avant recolte', 'resistance'],
    answer: '<p>Un traitement mal appliqué, c\'est de l\'argent perdu et un risque pour votre santé :</p>' +
      '<ul><li><strong>Heure</strong> : tôt le matin ou en fin de journée. Le vent doit être entre 3 et 12 km/h (ni calme plat, ni rafales).</li>' +
      '<li><strong>Météo</strong> : pas de traitement si pluie prévue dans les 6 heures (le produit est lessivé) ni si la température dépasse 30-32 °C (brûlure des feuilles, volatilisation).</li>' +
      '<li><strong>Dose</strong> : respectez la dose recommandée. Surdoser ne double pas l\'efficacité mais double le risque de résidus et de brûlure.</li>' +
      '<li><strong>Protection</strong> : masque, gants, lunettes, manches longues, bottes. Ne mangez pas, ne buvez pas et ne fumez pas pendant l\'application. Changez de vêtements après.</li>' +
      '<li><strong>Délai avant récolte</strong> : respectez-le absolument (souvent 7 à 21 jours). C\'est la garantie d\'un produit vendable et non toxique pour le consommateur.</li>' +
      '<li><strong>Résistance</strong> : alternez les matières actives et les modes d\'action. Ne répétez pas le même produit 3 fois de suite.</li>\n</ul>',
    tip: 'Nettoyez votre pulvérisateur après chaque usage et rincez à trois reprises : un résidu d\'herbicide peut détruire la culture suivante.'
  },

  /* ---------------------- ÉLEVAGE ---------------------- */
  {
    id: 'elevage-volaille', title: 'Élevage de volailles',
    kw: ['poulet', 'poulets', 'volaille', 'volailles', 'pondeuse', 'oeufs', 'poussin', 'poussiniere', 'chair', 'pintade', 'dinde', 'canard', 'caille', 'aviculture'],
    answer: '<p>Les 6 clés d\'un élevage de volailles réussi :</p>' +
      '<ul><li><strong>Désinfection</strong> du poulailler 10 jours avant l\'arrivée et vide sanitaire de 15 jours entre deux bandes.</li>' +
      '<li><strong>Chaleur</strong> : poussinière à 32-34 °C la 1<sup>re</sup> semaine, puis -2 à -3 °C par semaine jusqu\'à 24 °C. Un poussin qui se tasse a froid ; un poussin qui s\'écarte du coin a trop chaud.</li>' +
      '<li><strong>Densité</strong> : poulet de chair 10-12 sujets/m², pondeuse 5-6/m², pintade 10/m².</li>' +
      '<li><strong>Eau et aliment</strong> propres à volonté : démarrage (0-3 semaines), croissance, finition. Une poule pondeuse a besoin de 3,5 à 4 % de calcium.</li>' +
      '<li><strong>Prophylaxie</strong> : Newcastle et Gumboro selon le calendrier local, vermifuge tous les 3 mois, litière sèche.</li>' +
      '<li><strong>Chaleur</strong> : au-delà de 32 °C, mortalité par stress thermique. Ventilez la nuit, distribuez l\'aliment aux heures fraîches, abreuvoirs à l\'ombre.</li></ul>',
    tip: 'Tenez un cahier d\'élevage : date d\'arrivée, effectif, aliment consommé, mortalité, traitements. Vous connaissez alors votre vrai coût de production.'
  },
  {
    id: 'elevage-ruminants', title: 'Petits et grands ruminants',
    kw: ['mouton', 'brebis', 'chevre', 'caprin', 'bovin', 'vache', 'taureau', 'zebu', 'embouche', 'lait', 'tabaski', 'fourrage', 'ppr', 'pature', 'alimentation animale'],
    answer: '<p>Adapter la conduite à l\'animal et à la saison :</p>' +
      '<ul><li><strong>Chèvre (Djallonké)</strong> : rustique et trypanotolérante, 1,5 m² en bâtiment. Idéale pour la zone humide ; la chèvre rousse de Maradi pour le lait.</li>' +
      '<li><strong>Mouton</strong> : planifiez les naissances 180-240 jours avant les fêtes (Tabaski) pour vendre au meilleur prix. PPR = vaccination annuelle obligatoire.</li>' +
      '<li><strong>Bovin</strong> : zébu au nord, taurin (Baoulé, Somba) en zone humide. Abreuvement 30-50 L/jour, pierre à lécher en libre-service.</li>' +
      '<li><strong>Fourrage</strong> : brachiaria, moringa, maïs ensilage, stylosanthes et fanes (niébé, arachide) assurent la soudure en saison sèche.</li>' +
      '<li><strong>Embouche paysanne</strong> : achat en saison sèche de jeunes animaux, 90-120 jours d\'engraissement avec fourrage + concentré, vente sur les fêtes.</li></ul>',
    tip: 'Un déparasitage mal fait annule tout l\'engraissement : vermifugez à l\'entrée du troupeau et traitez contre les tiques tous les 15 jours.'
  },
  {
    id: 'elevage-porc-lapin', title: 'Élevage porcin, cuniculture et aulacode',
    kw: ['porc', 'porc', 'porcelet', 'cochon', 'lapin', 'lapereau', 'cuniculture', 'aulacode', 'agouti', 'escargot', 'heliciculture', 'rongeur'],
    answer: '<ul><li><strong>Porc</strong> : 1 m²/animal en engraissement. Bâtiment bétonné lavable, pédiluve, biosécurité stricte (la peste porcine africaine est mortelle et sans vaccine). Alimentation à base de sons, tourteaux et sous-produits, en évitant les restes de viande crue à risque de transmission de parasites.</li>' +
      '<li><strong>Lapin</strong> : cage de 0,5 m², eau propre et fourrage vert + granulés. Au-delà de 28 °C, risque élevé de mort par coup de chaleur. Ventilez, ombrez, ne manipulez pas les animaux en pleine chaleur.</li>' +
      '<li><strong>Aulacode</strong> : bâtiment calme, semi-obscur, abrité du vent, 0,5 m²/animal. Fourrage vert à volonté (graminées, feuilles de manioc). Viande très valorisée sur le marché.</li>' +
      '<li><strong>Escargot (achatine)</strong> : enclos ombragé et humide, 20-30/m², sol à pH 7-8 (cendre, calcaire), alimentation feuilles + son. Attention aux fourmis et aux rats, les deux plus grands facteurs de mortalité.</li></ul>',
    tip: 'Dans tous ces élevages, la rentabilité vient de 3 chiffres seulement : taux de mortalité, indice de consommation, prix de vente. Suivez-les chaque semaine.'
  },
  {
    id: 'elevage-pisciculture', title: 'Pisciculture',
    kw: ['pisciculture', 'poisson', 'tilapia', 'clarias', 'poisson chat', 'etang', 'bassin', 'alevin', 'piscicole', 'aquaculture', 'aeration'],
    answer: '<ul><li><strong>Espèces</strong> : le tilapia du Nil pour un élevage familial (3-5 poissons/m² en étang), le poisson-chat africain (Clarias) pour la forte densité en bacs (60-100/m³) car il respire l\'air en surface.</li>' +
      '<li><strong>Alevins sexés</strong> : n\'utilisez que des tilapias mâles — sinon la population explose et vous récoltez des milliers de petits poissons invendables.</li>' +
      '<li><strong>Alimentation</strong> : 3 à 5 % du poids vif par jour, en 2-3 rations, aux heures fraîches. Son de riz, tourteau, résidus de cuisine enrichis.</li>' +
      '<li><strong>Eau</strong> : pH entre 6,5 et 8,5 ; transparence au disque de Secchi 25-40 cm ; renouvellement d\'eau et aération avant l\'aube. Le pic de mortalité par manque d\'oxygène se produit entre 4 h et 8 h du matin.</li>' +
      '<li><strong>Cycle</strong> : préparation (vidange + chaulage + fumure) puis empoissonnement, 5-6 mois de grossissement, pêche partielle étalée.</li></ul>',
    tip: 'Pisciculture intégrée = plus rentable : litière du poulailler → plancton de l\'étang → eau de l\'étang → maraîchage → fond de l\'étang → compost.'
  },

  /* ---------------------- IMPORTANT À SAVOIR ---------------------- */
  {
    id: 'info-pluie', title: 'Probabilité de pluie et décision',
    kw: ['il va pleuvoir', 'va-t-il pleuvoir', 'peut-on semer', 'peut on traiter', 'report', 'decaler', 'fenetre', 'creneau', 'opportunite'],
    answer: '<p>Décidez selon trois seuils simples :</p>' +
      '<ul><li><strong>Traitement phytosanitaire</strong> : autorisé si pluie < 30 % et vent 3-12 km/h. Interdit si pluie > 60 % dans les 6 h.</li>' +
      '<li><strong>Semis</strong> : à faire quand 30-40 mm sont attendus ou tombés. Un seul épisode de 5 mm ne suffit pas à la levée durable.</li>' +
      '<li><strong>Séchage de récolte</strong> : à lancer si le cumul prévu sur 48 h est inférieur à 2 mm. Sinon, attendez ou utilisez un abri ventilé.</li>' +
      '<li><strong>Récolte</strong> : toujours par temps sec. Si la pluie arrive dans les 24 h, avancez la récolte.</li></ul>',
    tip: 'Le moteur d\'aide à la décision calcule ces fenêtres pour vous : onglet Conseils → blocs « Fenêtres d\'action » et « Recommandations prioritaires ».'
  },
  {
    id: 'info-vendre', title: 'Vendre au bon moment',
    kw: ['prix', 'marche', 'vendre', 'warrantage', 'stockage', 'transformation', 'valeur ajoutee', 'revenu', 'marge', 'rentabilite', 'cooperative'],
    answer: '<p>Trois leviers pour augmenter votre marge sans produire plus :</p>' +
      '<ul><li><strong>Étalement de la vente</strong> : après la récolte, tout le monde vend et le prix est au plus bas. Le <em>warrantage</em> (stockage dans un magasin de proximité + crédit) permet de revendre 3 à 5 mois plus tard, souvent 20 à 40 % plus cher.</li>' +
      '<li><strong>Transformation</strong> : amidon de manioc, huile d\'arachide, jus de bissap, mélange de soja balancé, amandes de cajou, fromage de soja (tofu). Multipliez la valeur par deux ou trois pour un équipement modeste.</li>' +
      '<li><strong>Vente groupée</strong> : rejoignez une coopérative ou un groupement. Vous pesez en volume, vous négociez mieux, et vous accédez aux acheteurs institutionnels (cantines, industries).</li></ul>',
    tip: 'Notez systématiquement votre prix de revient réel (intrants + main-d\'œuvre + amortissement) : sans ce chiffre, aucune négociation n\'est possible.'
  },
  {
    id: 'info-climat', title: 'Climat : s\'adapter et se préparer',
    kw: ['climat', 'changement climatique', 'secheresse frequente', 'pluies irregulieres', 'resilience', 'adapter', 'risque climatique', 'assurance'],
    answer: '<p>Face à des pluies plus irrégulières, quatre stratégies qui marchent :</p>' +
      '<ul><li><strong>Diversifier</strong> : ne mettez jamais toute la surface sur une seule culture. Associez un cycle court de sécurité, une culture de rente et une production d\'élevage.</li>' +
      '<li><strong>Sécuriser l\'eau</strong> : bassins, paillage, cordons pierreux, zaï — la plus grande assurance contre la mauvaise saison.</li>' +
      '<li><strong>Choisir des variétés adaptées</strong> : maïs à cycle court et tolérant, variétés de tomate résistantes au TYLCV, niébé et mil précoces.</li>' +
      '<li><strong>S\'informer</strong> : consultez la météo chaque matin (6 prévisions clés) et l\'onglet Actus pour les bulletins saisonniers / prévisionnistes nationaux.</li></ul>',
    tip: 'Un calendrier cultural de 3-4 séquences (semis échelonnés) vaut mieux qu\'un calendrier unique : une seule saison ratée ne met pas l\'année en péril.'
  },
  {
    id: 'info-sante', title: 'Santé et sécurité au travail',
    kw: ['sante', 'securite', 'coup de chaleur', 'insolation', 'intoxication', 'morsure', 'serpent', 'scorpion', 'accident', 'protection'],
    answer: '<p>Trois risques majeurs au champ et comment les prévenir :</p>' +
      '<ul><li><strong>Chaleur et déshydratation</strong> : 2 litres d\'eau par personne et par jour, travail avant 11 h et après 16 h, pauses à l\'ombre. Signal d\'alerte : maux de tête, vertiges, nausées, arrêt de la sueur → ombre, eau fraîche, allongé, jambes surélevées, et faites appeler à l\'aide si cela ne passe pas en 15 minutes.</li>' +
      '<li><strong>Morsures et piqûres</strong> : bottes et gants à partir de la tombée de la nuit ; en cas de morsure de serpent, immobilisez le membre, retirez bijoux et vêtements serrés, ne pas inciser ni sucer, aller immédiatement au centre de santé avec un antivenin.</li>' +
      '<li><strong>Intoxication aux pesticides</strong> : équipement de protection complet, jamais d\'application à contre-vent, se laver à l\'eau et au savon après application, vêtements lavés séparément. Signes d\'intoxication (vomissements, sueurs, pupilles contractées, difficulté à respirer) : arrêtez, lavez, allez au centre de santé en apportant l\'emballage du produit.</li></ul>',
    tip: 'En cas d\'urgence, contactez les secours locaux. Cette application ne remplace jamais l\'avis d\'un professionnel de santé.'
  },
  {
    id: 'info-app', title: 'Vos données et la confidentialité',
    kw: ['donnees', 'donnees personnelles', 'confidentialite', 'rgpd', 'enregistrement', 'compte', 'identifiant', 'mot de passe', 'supprimer mes donnees', 'reset'],
    answer: '<p>Cette application fonctionne sans compte et sans identifiant :</p>' +
      '<ul><li>Vos villes, parcelles, entrées de journal, alertes et cultures personnalisées sont enregistrés dans la base de données de ce projet.</li>' +
      '<li>Les liens vidéo que vous ajoutez sont mémorisés dans votre navigateur uniquement.</li>' +
      '<li>Les données météo proviennent d\'Open-Meteo, un service public ; aucune donnée personnelle ne leur est transmise.</li>' +
      '<li>Aucune information n\'est partagée avec des tiers à des fins publicitaires.</li></ul>' +
      '<p>Pour repartir de zéro : Réglages → <strong>Réinitialiser les données de démo</strong>. Une fois vos parcelles créées, cette action ne les efface pas.</p>',
    tip: 'Exportez régulièrement votre journal de culture (impression ou copie) : c\'est votre mémoire technique de campagne.'
  }
];

/* ---------- Réponses courtes par intention ---------- */
const INTENTS = [
  { id: 'salutation', kw: ['bonjour', 'bonsoir', 'salut', 'hello', 'coucou', 'bjr', 'bonne journee', 'cava', 'ca va'], reply:
    '<p>Bonjour ! 👋 Je suis <strong>AgriBot</strong>, l\'assistant d\'AgriMétéo Pro. Je peux vous aider sur :</p>' +
    '<ul><li>l\'usage du site (villes, parcelles, alertes, thème) ;</li>' +
    '<li>la météo du jour et vos décisions (semer, traiter, arroser, récolter) ;</li>' +
    '<li>les 90+ cultures du catalogue et leur itinéraire technique ;</li>' +
    '<li>l\'élevage, la pisciculture, le sol, la fertilisation et la protection des cultures.</li></ul>' +
    '<p>Posez votre question en langage courant, je m\'adapte.</p>' },
  { id: 'remerciement', kw: ['merci', 'thanks', 'parfait', 'super', 'genial', 'top', 'excellent', 'bien joue'], reply:
    '<p>Avec plaisir ! 🌱 Si vous voulez aller plus loin, je peux détailler une culture précise, calculer votre besoin en eau, ou vous expliquer une alerte.</p>' },
  { id: 'aide', kw: ['aide', 'aider', 'help', 'que peux tu', 'que sais tu', 'capacite', 'peux-tu faire', 'fonctionnalites'], reply:
    '<p>Voici ce que je sais faire :</p>' +
    '<ul><li><strong>Météo</strong> : expliquer les prévisions, le ressenti, le point de rosée, la pression, l\'UV, la visibilité, le vent.</li>' +
    '<li><strong>Décisions</strong> : dire quand arroser, semer, traiter, récolter, selon la météo réelle de votre ville active.</li>' +
    '<li><strong>Cultures</strong> : 90+ fiches (céréales, tubercules, légumineuses, maraîchage, fruitiers, oléagineux, épices, fourrages).</li>' +
    '<li><strong>Élevage &amp; pisciculture</strong> : volailles, ruminants, porcs, lapins, aulacodes, escargots, tilapia, clarias.</li>' +
    '<li><strong>Sol &amp; protection</strong> : fertilisation, pH, compost, ravageurs, maladies, pulvérisation.</li>' +
    '<li><strong>Site</strong> : navigation, alertes, notifications, thème, données.</li></ul>' +
    '<p>Exemples : « puis-je traiter demain matin ? », « quand arroser mon maïs ? », « comment élever des tilapias ? », « ma tomate a des taches ».</p>' },
  { id: 'meteo_actuelle', kw: ['quel temps', 'temps qu il fait', 'meteo aujourd hui', 'temperature actuelle', 'il fait combien', 'meteo maintenant', 'temps actuel', 'quel temps fait il', 'quelle est la temperature', 'combien de degres', 'quelle temperature fait il'], dynamic: 'currentWeather' },
  { id: 'conseil_actuel', kw: ['conseil', 'que faire aujourd hui', 'que faire', 'recommandation', 'aujourd hui je', 'programme'], dynamic: 'todayAdvice' },
  { id: 'video_actuelle', kw: ['video', 'videos', 'quelle video', 'regarder', 'tutoriel video', 'montre moi'], dynamic: 'videoSuggestion' },
  { id: 'culture_actuelle', kw: ['quelles cultures', 'que semer', 'que puis-je semer', 'que puis je semer', 'que puis-je planter', 'que puis je planter', 'qu est ce que je peux semer', 'quoi semer en ce moment', 'quoi planter en ce moment', 'que semer maintenant', 'quoi planter', 'semis en ce moment', 'quelle culture choisir', 'culture adaptee', 'calendrier'], dynamic: 'cropSuggestion' }
];

/* ---------- Correspondance par mots-clés (score de recouvrement) ---------- */
function normalizeText(s) {
  return String(s || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .replace(/\s+/g, ' ').trim();
}
function matchKB(question) {
  const q = normalizeText(question);
  if (!q) return null;
  const words = q.split(' ').filter(function (w) { return w.length > 2; });
  let best = null, bestScore = 0;
  KB.forEach(function (entry) {
    let score = 0;
    entry.kw.forEach(function (k) {
      const kn = normalizeText(k);
      if (!kn) return;
      if (q.indexOf(kn) >= 0) score += kn.split(' ').length * 3;
      else {
        const parts = kn.split(' ');
        if (parts.length > 1 && parts.every(function (p) { return words.indexOf(p) >= 0; })) score += 2;
      }
    });
    if (score > bestScore) { bestScore = score; best = entry; }
  });
  return bestScore >= 3 ? { entry: best, score: bestScore } : null;
}
function matchIntent(question) {
  const q = normalizeText(question);
  let best = null, bestScore = 0;
  INTENTS.forEach(function (it) {
    let score = 0;
    it.kw.forEach(function (k) {
      const kn = normalizeText(k);
      if (kn && q.indexOf(kn) >= 0) score += kn.split(' ').length * 2;
    });
    if (score > bestScore) { bestScore = score; best = it; }
  });
  return bestScore >= 2 ? best : null;
}

/* ---------- Suggestions de questions ---------- */
const SUGGESTED_QUESTIONS = [
  'Comment ajouter une parcelle ?',
  'Puis-je traiter demain matin ?',
  'Quand arroser mon maïs ?',
  'Que puis-je semer en ce moment ?',
  'Comment élever des tilapias ?',
  'Ma tomate a des taches, que faire ?',
  'Comment configurer une alerte ?',
  'Quelle vidéo pour la pluie ?'
];

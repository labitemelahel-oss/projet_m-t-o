/* =====================================================================
  videos.js — Fiches de clips 3D générés à partir de chapitres agricoles.
   ===================================================================== */
'use strict';

const VIDEO_GUIDES = [
  /* ---------------------------- GÉNÉRAL ---------------------------- */
  {
    slug: 'general-preparation-journee',
    title: 'Préparer sa journée de travail au champ',
    situation: 'general', audience: 'agriculteur', duration: 130,
    poster: 'https://sspark.genspark.ai/i/xY9Qf9bLxsJb38h2?width=2560',
    summary: 'La routine de 6 lectures à faire chaque matin avant de sortir : pluie, vent, chaleur, humidité, UV et sol — et ce que chaque valeur change dans votre programme.',
    tags: ['routine', 'pluie', 'vent', 'chaleur', 'sol'],
    chapters: [
      { at: 0, dur: 26, title: 'Lire la probabilité de pluie des 6 prochaines heures', icon: 'fa-cloud-showers-heavy',
        visual: 'Ouvrez l\'onglet Météo : la bande horaire donne la probabilité de pluie heure par heure.',
        narration: 'Commencez toujours par la probabilité de pluie des six prochaines heures. Au-delà de soixante pour cent, ne lancez pas un traitement phytosanitaire et ne mettez pas de graines en terre : la pluie emporterait le produit et noierait les semences.',
        dos: ['Vérifier les 6 prochaines heures', 'Reporter si > 60 %'], dont: ['Traiter avant une pluie annoncée', 'Sécher une récolte sous un ciel menaçant'] },
      { at: 26, dur: 24, title: 'Vérifier le vent avant tout pulvérisation', icon: 'fa-wind',
        visual: 'Vitesse et rafales sont dans l\'onglet Indicateurs. Fenêtre sûre : 3 à 12 km/h.',
        narration: 'Le vent est la deuxième lecture obligatoire. En dessous de trois kilomètres par heure, l\'air est trop stable : le produit stagne et dérive. En dessous de douze, la dérive est maîtrisée. Au-dessus, vous perdez le produit et vous risquez d\'empoisonner les cultures voisines ou les ruches.',
        dos: ['Pulvériser entre 3 et 12 km/h', 'Viser tôt le matin'], dont: ['Traiter en pleine brise de midi', 'Traiter à moins de 100 m de ruches'] },
      { at: 50, dur: 24, title: 'Évaluer le risque de stress thermique', icon: 'fa-temperature-high',
        visual: 'Croisez la température maximale du jour avec l\'humidité pour obtenir la température ressentie.',
        narration: 'Croisez la température maximale avec l\'humidité relative pour obtenir la température ressentie. Au-delà de trente-cinq degrés ressentis pour les humains, décalez les travaux lourds avant onze heures ou après seize heures. Pour les animaux, l\'alerte se déclenche dès trente-deux degrés à l\'ombre.',
        dos: ['Travailler avant 11 h et après 16 h', 'Abreuver les animaux 2 fois de plus'], dont: ['Repiquer à midi', 'Transporter des volailles en plein soleil'] },
      { at: 74, dur: 20, title: 'Regarder l\'humidité du sol et le déficit hydrique', icon: 'fa-droplet',
        visual: 'Le bilan eau = pluie utile − évapotranspiration du jour (onglet Conseils).',
        narration: 'Soustrayez la pluie utile de l\'évapotranspiration du jour : c\'est votre bilan hydrique. Si le sol est en déficit de plus de dix millimètres, prévoyez un arrosage d\'appoint de vingt à vingt-cinq millimètres sur les cultures en floraison ou en grossissement.',
        dos: ['Arroser tôt le matin ou en soirée', 'Retenir l\'eau par du paillage'], dont: ['Arroser entre 11 h et 16 h', 'No inonder une parcelle argileuse'] },
      { at: 94, dur: 18, title: 'Protéger sa peau du soleil', icon: 'fa-sun-plant-wilt',
        visual: 'L\'indice UV au-dessus de 8 impose manches longues, chapeau et eau.',
        narration: 'Un indice UV supérieur à huit signifie un risque de brûlure en moins de quinze minutes. Manches longues, chapeau à bord large, deux litres d\'eau par personne et des pauses à l\'ombre. C\'est aussi un rappel : les jeunes plants transpirent et souffrent aux mêmes heures que vous.',
        dos: ['Ombrager les pépinières', 'Boire avant d\'avoir soif'], dont: ['Travail torse nu en plein soleil'] },
      { at: 112, dur: 18, title: 'Noter le programme dans le journal', icon: 'fa-clipboard-list',
        visual: 'Une entrée de journal par opération : date, parcelle, intitulé, coût.',
        narration: 'Terminez en inscrivant votre programme dans le journal de culture : parcelle, opération, intrant et coût. En fin de saison, ces lignes vous diront précisément ce qui a rapporté et ce qui a coûté. C\'est votre mémoire technique.',
        dos: ['Consigner chaque opération', 'Noter les coûts réels'], dont: ['Se fier à sa mémoire de fin de campagne'] }
    ]
  },

  /* ---------------------------- PLUIE ---------------------------- */
  {
    slug: 'pluie-forte-parcelle',
    title: 'Fortes pluies : protéger la parcelle et la récolte',
    situation: 'pluie', audience: 'agriculteur', duration: 145,
    poster: 'https://sspark.genspark.ai/i/dhQcvdHoWCGYrnDh?width=2560',
    summary: 'Que faire avant, pendant et après un épisode de pluies intenses : drainage, protection des jeunes plants, lutte contre l\'érosion et sauvetage des cultures couchées.',
    tags: ['drainage', 'érosion', 'verse', 'stockage'],
    chapters: [
      { at: 0, dur: 28, title: 'Avant la pluie : ouvrir les voies d\'eau', icon: 'fa-water',
        visual: 'Ouvrez des rigoles de drainage et relevez les buttes avant les premières grosses pluies.',
        narration: 'Dès qu\'un épisode de pluies fortes est annoncé, ouvrez les rigoles de drainage dans le sens de la pente et relevez les billons. L\'eau qui stagne plus de quarante-huit heures asphyxie les racines : c\'est la première cause de perte de récolte sur les sols argileux.',
        dos: ['Rigoles tous les 10-15 m', 'Rehausser les buttes', 'Déboucher les exutoires'], dont: ['Laisser l\'eau stagner en bas de parcelle', 'Travailler un sol détrempé'] },
      { at: 28, dur: 26, title: 'Avant la pluie : rentrer ce qui craint', icon: 'fa-basket-shopping',
        visual: 'Récoltes séchées, intrants, semences et petit matériel à l\'abri.',
        narration: 'Rentrez les récoltes étalées au séchage, les semences, les engrais et le petit matériel. Un sac d\'engrais mouillé devient une masse inutilisable ; une récolte de maïs qui prend la pluie au séchage peut moisir en quarante-huit heures et devenir impropre à la vente.',
        dos: ['Palettes pour surélever les sacs', 'Bâches propres et sèches'], dont: ['Laisser l\'engrais au sol', 'Sécher à même la terre nue'] },
      { at: 54, dur: 28, title: 'Pendant la pluie : ne rien tenter', icon: 'fa-cloud-bolt',
        visual: 'Pas de pulvérisation, pas de récolte, abri pour les personnes et les animaux.',
        narration: 'Pendant l\'averse, arrêtez toute pulvérisation : le produit est lessivé et vous perdriez la dose. Mettez les personnes et les bêtes à l\'abri. Ne circulez pas dans les bas-fonds et évitez les arbres isolés et les hangars métalliques en cas d\'orage.',
        dos: ['Attendre 4-6 h après la pluie pour traiter', 'S\'éloigner des cours d\'eau'], dont: ['Traiter sous la pluie', 'S\'abriter sous un arbre isolé'] },
      { at: 82, dur: 25, title: 'Après la pluie : résoudre l\'asphyxie et l\'érosion', icon: 'fa-mountain-sun',
        visual: 'Inspectez les griffes d\'érosion : chaque ravin naissant se corrige à la main en 10 minutes.',
        narration: 'Dès l\'arrêt de la pluie, parcourez la parcelle. Comblez les griffes d\'érosion avec des pierres et des résidus végétaux : un ravin qui commence se corrige à la main en dix minutes ; laissé trois semaines, il faudra un tracteur. Soulevez les plants qui sont tombés sans être cassés.',
        dos: ['Comblement immédiat des rigoles', 'Buttage léger après ressuyage'], dont: ['Reporter la correction au lendemain de la récolte'] },
      { at: 107, dur: 22, title: 'Relancer les cultures stressées', icon: 'fa-seedling',
        visual: 'Un léger apport d\'azote et un sarclage remettent la culture en route après l\'excès d\'eau.',
        narration: 'L\'excès d\'eau lessive l\'azote et asphyxie les racines. Après ressuyage, faites un sarclage léger pour réaérer le sol et apportez un complément d\'azote fractionné, faible dose mais rapide, sur les céréales en croissance.',
        dos: ['Sarclage superficiel', 'Azote fractionné en faible dose'], dont: ['Travailler le sol encore mouillé'] },
      { at: 129, dur: 16, title: 'Surveiller les maladies deux semaines', icon: 'fa-bacteria',
        visual: 'Humidité élevée pendant 3 jours = risque fongique maximal.',
        narration: 'Trois jours consécutifs d\'humidité supérieure à quatre-vingt-cinq pour cent déclenchent le risque de mildiou, d\'anthracnose et de pourriture. Inspectez le dessous des feuilles pendant les dix à quinze jours qui suivent et intervenez préventivement sur les cultures sensibles.',
        dos: ['Inspecter le dessous des feuilles', 'Traitement préventif sur tomate, piment, oignon'],
        dont: ['Attendre que les taches couvrent la parcelle'] }
    ]
  },
  {
    slug: 'pluie-drainage-bas-fond',
    title: 'Bas-fonds et sols argileux : maîtriser l\'eau',
    situation: 'pluie', audience: 'agriculteur', duration: 120,
    poster: 'https://sspark.genspark.ai/i/E7wqTl9T5XvzgUjV?width=2560',
    summary: 'Techniques spécifiques aux bas-fonds et aux sols lourds : planches surélevées, ceintures de diguettes, cultures adaptées à l\'engorgement et gestion après submersion.',
    tags: ['bas-fond', 'argileux', 'riz', 'drainage'],
    chapters: [
      { at: 0, dur: 26, title: 'Diagnostiquer son bas-fond', icon: 'fa-map-location-dot',
        visual: 'Repérez la zone haute, la zone d\'engorgement permanent et l\'exutoire naturel.',
        narration: 'Un bas-fond bien exploité commence par un diagnostic : marchez la parcelle, repérez la zone où l\'eau stagne en toute saison, la zone bien drainée et l\'exutoire naturel. Vous y installerez des cultures différentes, du riz ou du taro dans le creux, du maraîchage sur les bordures.',
        dos: ['Cartographier les zones d\'eau', 'Cultiver selon la position topographique'], dont: ['Semer un maïs dans la cuvette d\'un bas-fond'] },
      { at: 26, dur: 24, title: 'Planches surélevées et billons hauts', icon: 'fa-layer-group',
        visual: 'Billons de 30-40 cm de haut en saison des pluies, redescendus en saison sèche.',
        narration: 'En saison des pluies, montez des billons ou des planches de trente à quarante centimètres. En saison sèche, aplatissez-les pour retenir l\'eau. C\'est le seul geste qui permet de cultiver la tomate ou l\'oignon dans un sol lourd sans perdre les racines.',
        dos: ['Billons hauts en saison des pluies', 'Paillage des planches'], dont: ['Cultiver à plat sur sol engorgé'] },
      { at: 50, dur: 24, title: 'Ceintures de diguettes filtrantes', icon: 'fa-grip-lines',
        visual: 'Une diguette en courbe de niveau tous les 20 m avec exutoire maçonné.',
        narration: 'Disposez une diguette suivant la courbe de niveau tous les vingt mètres en amont de la culture. Elle freine l\'eau, laisse le sable et la fertilité sur place, et rejette l\'excès par un exutoire protégé. Un bas-fond équipé de diguettes filtrantes gagne souvent une récolte supplémentaire en contre-saison.',
        dos: ['Diguettes en courbe de niveau', 'Exutoire empierré'], dont: ['Exutoire nu qui se ravine'] },
      { at: 74, dur: 24, title: 'Cultures adaptées à l\'engorgement', icon: 'fa-wheat-awn',
        visual: 'Riz, taro, macabo, canne, patate douce tolèrent l\'eau. Tomate, arachide, niébé non.',
        narration: 'Choisissez les bonnes espèces dans les creux : riz, taro, macabo, canne à sucre, patate douce et légumes-feuilles s\'accommodent de l\'humidité. Évitez la tomate, l\'arachide et le niébé, qui pourrissent en quelques jours d\'engorgement.',
        dos: ['Riz, taro, macabo dans les creux', 'Maraîchage sur bordures drainées'],
        dont: ['Arachide en bas de pente inondable'] },
      { at: 98, dur: 22, title: 'Après une submersion', icon: 'fa-clock-rotate-left',
        visual: 'Dans les 48 h : retirer le limon sur les feuilles, aérer le sol, relancer la culture.',
        narration: 'Après une submersion, agissez dans les quarante-huit heures : rincez le limon déposé sur les feuilles à l\'arrosoir, aérez le sol avec une fourche, retirez les organes pourris et déclenchez un traitement fongique. Les cultures submergées plus de trois jours sont généralement perdues : replantez à la bonne saison.',
        dos: ['Rinçage du limon', 'Aération par fourche', 'Fongicide préventif'], dont: ['Laisser le limon sécher sur les feuilles'] }
    ]
  },

  /* ---------------------------- SÉCHERESSE ---------------------------- */
  {
    slug: 'secheresse-irrigation-efficace',
    title: 'Sécheresse : arroser juste, sans gaspiller',
    situation: 'secheresse', audience: 'agriculteur', duration: 140,
    poster: 'https://sspark.genspark.ai/i/6XLpcHqpm2HbRWBi?width=2560',
    summary: 'Arroser la bonne quantité au bon moment : test du poing, besoin par culture, gestes qui économisent 30 % d\'eau, priorités quand l\'eau manque.',
    tags: ['irrigation', 'test du poing', 'goutte à goutte', 'priorités'],
    chapters: [
      { at: 0, dur: 26, title: 'Savoir quand arroser : le test du poing', icon: 'fa-hand-fist',
        visual: 'Prenez une poignée de terre à 10 cm. Si elle s\'effrite, il faut arroser.',
        narration: 'Ne devinez jamais : prenez une poignée de terre à dix centimètres de profondeur. Si elle s\'effrite entre les doigts, le sol est sec et il faut arroser. Si elle forme une boulette qui tient, vous avez encore un ou deux jours. Cette simple poignée évite plus de pertes que n\'importe quel calendrier.',
        dos: ['Tester à 10 cm de profondeur', 'Vérifier 3 points dans la parcelle'], dont: ['Arroser parce que c\'est le jour habituel'] },
      { at: 26, dur: 26, title: 'La bonne dose, pas la plus grande', icon: 'fa-droplet',
        visual: '20 à 30 mm équivalent à 20-30 L/m². Trop d\'eau chasse l\'air et les nutriments.',
        narration: 'Vingt à trente millimètres, soit vingt à trente litres par mètre carré, suffisent à recharger la zone racinaire d\'une culture en place. Au-delà, l\'eau traverse le sol, emporte l\'azote et remplit la nappe sans profit. Arrosez moins souvent et plus profondément, plutôt que peu et souvent.',
        dos: ['Dose 20-30 mm par apport', 'Arroser profond, espacer les apports'], dont: ['Arrosages légers quotidiens'] },
      { at: 52, dur: 26, title: 'Arroser aux bonnes heures', icon: 'fa-clock',
        visual: 'Avant 9 h ou après 17 h : jusqu\'à 40 % d\'eau gagnée.',
        narration: 'Arrosez avant neuf heures du matin, ou après dix-sept heures. Entre onze heures et seize heures, quarante pour cent de l\'eau s\'évapore avant d\'atteindre les racines. Le soir est plus efficace que la nuit sur les cultures sensibles aux maladies foliaires, car les feuilles ont le temps de sécher.',
        dos: ['Tôt le matin de préférence', 'Le soir si maladie fongique'], dont: ['Arroser à midi'] },
      { at: 78, dur: 26, title: 'Pailler : l\'économie la moins chère', icon: 'fa-seedling',
        visual: 'Une couche de 5-10 cm de résidus réduit l\'évaporation du sol de 30 à 60 %.',
        narration: 'Couvrez le sol d\'une couche de cinq à dix centimètres de résidus ou de tiges hachées. Le paillage réduit l\'évaporation de trente à soixante pour cent, maintient la fraîcheur, étouffe les mauvaises herbes et limite l\'érosion. C\'est l\'investissement le plus rentable en saison sèche.',
        dos: ['Paillage de 5-10 cm', 'Réutiliser les résidus de récolte'], dont: ['Brûler les résidus au champ'] },
      { at: 104, dur: 22, title: 'Prioriser quand l\'eau est limitée', icon: 'fa-list-ol',
        visual: 'Priorité : pépinières, jeunes plants, cultures en floraison, puis le reste.',
        narration: 'Quand l\'eau manque, hiérarchisez : pépinières, jeunes plants, cultures en floraison ou en remplissage, puis les cultures pérennes en installation. Les cultures déjà mûres et les fourrages à cycle court passent en dernier, car l\'eau apportée ne changera pas le rendement.',
        dos: ['Sauver ce qui est irréversible', 'Réduire la surface irriguée'], dont: ['Arroser partout à moitié dose'] },
      { at: 126, dur: 14, title: 'Récupérer et stocker chaque goutte', icon: 'fa-jar',
        visual: 'Citex, bassins bâchés, toits collectés, gouttières vers la citerne.',
        narration: 'Récupérez toute l\'eau possible : toits vers des fûts ou une citerne bâchée, et sur les bas-fonds, une retenue en terre avec exutoire. Quelques mètres cubes stockés font la différence sur une planche de tomate en pleine saison sèche.',
        dos: ['Citerne bâchée', 'Réservoir en terre avec exutoire'], dont: ['Laisser l\'eau de pluie ruisseler dehors'],
        steps: ['Filtrer en entrée', 'Couvrir contre l\'évaporation'] }
    ]
  },
  {
    slug: 'secheresse-sol-vivant',
    title: 'Sécheresse : reconstruire un sol qui retient l\'eau',
    situation: 'secheresse', audience: 'agriculteur', duration: 130,
    poster: 'https://sspark.genspark.ai/i/jRg3dxoBhBxwATxH?width=2560',
    summary: 'Un sol couvert et riche en matière organique retient plusieurs dizaines de millimètres d\'eau en plus. Compost, cordons pierreux, zaï et rotation pour sécuriser la campagne suivante.',
    tags: ['compost', 'zaï', 'cordons pierreux', 'matière organique'],
    chapters: [
      { at: 0, dur: 24, title: 'Pourquoi un sol vivant résiste mieux', icon: 'fa-layer-group',
        visual: 'Chaque point de matière organique retient plusieurs fois son poids en eau.',
        narration: 'Un sol qui contient deux pour cent de matière organique retient beaucoup plus d\'eau qu\'un sol sableux nu. Enrichir le sol n\'est donc pas seulement une question de fertilisation : c\'est votre assurance contre la sécheresse, et cela se construit dès cette saison.',
        dos: ['Objectif 2 % de matière organique', 'Composter toute la biomasse du champ'], dont: ['Laisser le sol nu toute l\'année'] },
      { at: 24, dur: 26, title: 'Le compost : la recette simple', icon: 'fa-recycle',
        visual: 'Alterner couches vertes et sèches, retourner tous les 10 jours, mûr en 30-45 jours.',
        narration: 'Montez votre compost en alternant les couches de résidus secs, de déchets verts et de fumier, une fine couche de cendre ou de terre entre les deux. Retournez tous les dix jours et humidifiez si nécessaire. Le compost est mûr en trente à quarante-cinq jours, quand il sent la terre de forêt et que les vers ont disparu.',
        dos: ['Alterner carbone et azote', 'Retourner tous les 10 jours', 'Épandre 5-10 t/ha'],
        dont: ['Ajouter du plastique ou des piles', 'Laisser le tas sécher complètement'] },
      { at: 50, dur: 24, title: 'Zaï et poquets améliorés', icon: 'fa-circle-dot',
        visual: 'Poquets de 20-30 cm remplis de compost : la technique qui sauve les céréales au Sahel.',
        narration: 'Sur sol encroûté ou pente, creusez des poquets de vingt à trente centimètres de diamètre, remplissez-les de compost et de terre fine, et semez dedans. Chaque poquet capte le ruissellement et concentre la fertilité à l\'endroit exact de la graine. C\'est la technique la plus robuste du Sahel.',
        dos: ['Poquets au bon écartement', 'Compost ou fumier au fond'], dont: ['Semer à la volée sur croûte de battance'] },
      { at: 74, dur: 26, title: 'Cordons pierreux et diguettes en courbe de niveau', icon: 'fa-grip-lines-vertical',
        visual: 'Courbes de niveau matérialisées à l\'aide d\'un niveau à eau ou d\'un simple tuyau transparent.',
        narration: 'Pour retenir l\'eau et le sol, disposez des cordons pierreux ou des diguettes en courbe de niveau, espacés de vingt à trente mètres selon la pente. Tracez les courbes avec un niveau à eau : posez ensuite les pierres de façon à former un filtre qui laisse passer l\'eau claire et retient la terre.',
        dos: ['Tracer à la courbe de niveau', 'Espacer selon la pente'], dont: ['Aligner les cordons droit dans la pente'] },
      { at: 100, dur: 30, title: 'Rotation et association : la sécurité alimentaire', icon: 'fa-arrows-rotate',
        visual: 'Céréale → légumineuse → tubercule, avec une bande fourragère en bordure.',
        narration: 'Alternez céréale, légumineuse et tubercule : la légumineuse restitue l\'azote à la céréale suivante et casse le cycle des ravageurs. Associez par exemple maïs, niébé et courge, ou sorgho et arachide. Une bande fourragère en bordure sécurise l\'alimentation animale et limite l\'érosion.',
        dos: ['Légumineuse avant céréale', 'Association céréale + légumineuse + courge'],
        dont: ['Même culture au même endroit trois années de suite'] }
    ]
  },

  /* ---------------------------- CHALEUR ---------------------------- */
  {
    slug: 'chaleur-cultures',
    title: 'Forte chaleur : sauver les cultures',
    situation: 'chaleur', audience: 'agriculteur', duration: 135,
    poster: 'https://sspark.genspark.ai/i/gjMIRV25FDonzDOu?width=2560',
    summary: 'Pendant une vague de chaleur : ombrage, arrosage fractionné, paillage, protection des fleurs et des jeunes plants, et ce qu\'il ne faut surtout pas faire.',
    tags: ['ombrage', 'évaporation', 'floraison', 'brûlure'],
    chapters: [
      { at: 0, dur: 26, title: 'Reconnaître le stress thermique', icon: 'fa-sun-plant-wilt',
        visual: 'Feuilles enroulées le matin, bords brunis, chute de fleurs : la plante panique.',
        narration: 'Une plante stressée par la chaleur enroule ses feuilles dès le matin, brunit les bords de son limbe et surtout abandonne ses fleurs pour survivre. Pour le maïs, deux jours au-dessus de trente-cinq degrés en pleine floraison coûtent dix à vingt pour cent du rendement : c\'est irrécupérable après coup.',
        dos: ['Observer tôt le matin', 'Repérer l\'enroulement des feuilles'], dont: ['Attendre de voir les plants grillés'] },
      { at: 26, dur: 24, title: 'Arroser fractionné, tôt et tard', icon: 'fa-clock-rotate-left',
        visual: 'Deux apports légers : tôt le matin, et un rafraîchissement après 17 h.',
        narration: 'Fractionnez l\'arrosage : un apport avant neuf heures pour couvrir la journée, et un rafraîchissement après dix-sept heures si la culture est en floraison. Le soir, une aspersion courte de quinze minutes abaisse la température de la canopée de plusieurs degrés et fait baisser la transpiration nocturne.',
        dos: ['Matin + fin d\'après-midi', 'Aspersion courte en soirée'], dont: ['Arroser en pleine chaleur de midi'] },
      { at: 50, dur: 24, title: 'Ombrager les cultures sensibles', icon: 'fa-umbrella',
        visual: 'Filets d\'ombrage 30-50 % sur pépinières, jeunes plants et laitues.',
        narration: 'Installez un filet d\'ombrage ou une couverture de palmes sur les pépinières, les jeunes plants et les cultures sensibles comme la laitue ou les légumes-feuilles. Réduire la lumière de trente pour cent abaisse la température de la feuille de cinq degrés, ce qui suffit souvent à sauver la récolte.',
        dos: ['Filet 30-50 % sur pépinières', 'Paillage épais au pied'], dont: ['Laisser les jeunes plants plein soleil après repiquage'] },
      { at: 74, dur: 24, title: 'Ne pas fertiliser ni traiter à midi', icon: 'fa-ban',
        visual: 'Un apport d\'engrais ou un traitement sous 35 °C brûle les feuilles.',
        narration: 'N\'épandez pas d\'engrais et ne pulvérisez pas de produit entre onze heures et seize heures quand la température dépasse trente-cinq degrés : les sels concentrés brûlent le feuillage et le produit s\'évapore avant d\'agir, quand il ne brûle pas la culture. Reportez ces interventions quarante-huit heures plus tard si possible.',
        dos: ['Fertiliser tôt le matin', 'Traiter après 17 h'], dont: ['Épandre de l\'urée à midi', 'Pulvériser sous 35 °C'] },
      { at: 98, dur: 22, title: 'Favoriser la pollinisation et l\'ombrage utile', icon: 'fa-bee',
        visual: 'Ne jamais traiter les cultures en fleurs : les abeilles travaillent avant 10 h.',
        narration: 'Les fleurs de courge, de pastèque ou de fruitier n\'ont que quelques heures de validité, et les abeilles travaillent surtout avant dix heures du matin. Ne traitez jamais une culture en pleine floraison et préservez des zones refuges ombragées : un bon voisinage d\'abeilles peut ajouter vingt pour cent au rendement.',
        dos: ['Zéro insecticide en pleine floraison', 'Laisser des haies refuges'], dont: ['Pulvériser le matin sur fleurs ouvertes'] },
      { at: 120, dur: 15, title: 'Récolter aux heures fraîches', icon: 'fa-basket-shopping',
        visual: 'Récolte avant 8 h, mise à l\'ombre immédiate, transport en caisse ventilée.',
        narration: 'Récoltez avant huit heures et mettez immédiatement à l\'ombre. Un légume récolté à midi a déjà perdu une partie de son eau et de sa valeur : la chaîne du froid ou au minimum l\'ombre humide double la durée de conservation et donc le prix de vente.',
        dos: ['Récolte à l\'aube', 'Ombre humide immédiate'], dont: ['Entasser les légumes au soleil dans un sac'] }
    ]
  },
  {
    slug: 'chaleur-elevage',
    title: 'Forte chaleur : protéger les animaux',
    situation: 'chaleur', audience: 'agriculteur', duration: 125,
    poster: 'https://sspark.genspark.ai/i/CZQMOxHlvXpjuS1y?width=2560',
    summary: 'Volailles, lapins, porcs, ruminants et poissons pendant une vague de chaleur : ventilation nocturne, eau fraîche, ajustement des rations et gestes d\'urgence.',
    tags: ['stress thermique', 'ventilation', 'abreuvement', 'étang'],
    chapters: [
      { at: 0, dur: 24, title: 'Reconnaître le coup de chaleur', icon: 'fa-temperature-high',
        visual: 'Volaille haletante ailes écartées, lapin couché sur le flanc, poissons en surface.',
        narration: 'Le premier signe est le halètement chez les volailles, ailes écartées et bec ouvert. Chez le lapin, l\'animal s\'allonge les pattes étalées et respire vite : au-delà de vingt-huit degrés, un lapin peut mourir en quelques heures. Chez les poissons, l\'oxygène manque surtout entre quatre heures et huit heures du matin : les sujets viennent gober l\'air à la surface.',
        dos: ['Compter les respirations', 'Vérifier l\'étang à l\'aube'], dont: ['Attendre la mortalité pour agir'] },
      { at: 24, dur: 26, title: 'Ventiler la nuit, ombrager le jour', icon: 'fa-fan',
        visual: 'Ventilation nocturne maximale, toiture réfléchissante, ombrage direct des cages.',
        narration: 'La chaleur s\'accumule toute la journée : la nuit est votre meilleure arme. Ouvrez au maximum la nuit pour évacuer les calories, laissez les animaux dehors si c\'est sûr, et ombrez les cages et les toitures. Un toit clair ou réfléchissant gagne plusieurs degrés, et un toit végétalisé encore plus.',
        dos: ['Ventiler la nuit', 'Toiture claire ou végétalisée', 'Ombrager les cages'], dont: ['Fermer tout la nuit en saison chaude'] },
      { at: 50, dur: 26, title: 'Eau fraîche et propre, en priorité', icon: 'fa-glass-water',
        visual: 'L\'animal chaud boit 2 à 4 fois plus. Changez l\'eau 2 à 3 fois par jour.',
        narration: 'Un animal qui souffre de la chaleur boit deux à quatre fois plus. Changez l\'eau deux à trois fois par jour, à l\'ombre, dans des abreuvoirs propres, et ajoutez un seau supplémentaire pour éviter la bousculade. L\'eau fraîche est le premier traitement du coup de chaleur, pour tous les animaux et pour les poissons aussi.',
        dos: ['2-3 renouvellements par jour', 'Abreuvoirs à l\'ombre'], dont: ['Laisser une eau chaude et souillée'] },
      { at: 76, dur: 24, title: 'Réduire la ration et décaler les repas', icon: 'fa-bowl-food',
        visual: 'Repas tôt le matin et tard le soir, rations plus concentrées en énergie.',
        narration: 'La digestion produit de la chaleur : distribuez l\'aliment tôt le matin et tard le soir, et réduisez la ration de dix à vingt pour cent pendant le pic de chaleur. Ajoutez un peu d\'huile végétale ou de matière grasse, plus énergétique par kilo, et complétez en minéraux et vitamines.',
        dos: ['Repas aux heures fraîches', 'Ration -10 à -20 % le midi'], dont: ['Nourrir en plein après-midi'] },
      { at: 100, dur: 25, title: 'Le cas de l\'étang : surveiller l\'oxygène', icon: 'fa-fish',
        visual: 'Pas de sur-nourrissage les jours très chauds, renouveler l\'eau à l\'aube.',
        narration: 'Les jours très chauds, le plancton consomme l\'oxygène de nuit. Renouvelez partiellement l\'eau à l\'aube, faites fonctionner un brassage ou une pompe avant le lever du jour, et supprimez l\'alimentation du matin : les restes d\'aliment consomment aussi de l\'oxygène. Le tilapia supporte mieux que le poisson-chat, mais aucune des deux espèces ne survit à une chute totale.',
        dos: ['Renouvellement d\'eau à l\'aube', 'Arrêt de l\'alimentation du matin', 'Aération nocturne'],
        dont: ['Sur-nourrir par temps chaud', 'Laisser le fond envasé'] }
    ]
  },

  /* ---------------------------- FROID ---------------------------- */
  {
    slug: 'froid-fraicheur',
    title: 'Froid et fraîcheur : protéger cultures et animaux',
    situation: 'froid', audience: 'agriculteur', duration: 120,
    poster: 'https://sspark.genspark.ai/i/T87RCZqwwsD1Grpx?width=2560',
    summary: 'Harmattan, nuits fraîches et basses températures : voiles, brumisation, décalage des semis, abri des animaux et gestion des plants fragiles.',
    tags: ['harmattan', 'gelée', 'abri', 'pépinière'],
    chapters: [
      { at: 0, dur: 24, title: 'Quand la fraîcheur devient un risque', icon: 'fa-snowflake',
        visual: 'Sous 15 °C : arrêt de croissance. Sous 10 °C : risque de nécrose pour les cultures tropicales.',
        narration: 'La plupart des cultures tropicales arrêtent de pousser sous quinze degrés, et le maïs comme la tomate souffrent dès dix degrés. Surveillez la température minimale de la nuit : c\'est elle, plus que la moyenne, qui décide de la survie de vos plants.',
        dos: ['Lire la température minimale nocturne', 'Agir la veille au soir'], dont: ['Se fier à la sensation de la journée'] },
      { at: 24, dur: 24, title: 'Couvrir ce qui est précieux', icon: 'fa-umbrella-beach',
        visual: 'Voiles, paillis épais, tunnels bas, paillassons sur les jeunes plants.',
        narration: 'Couvrez pépinières, jeunes plants et cultures maraîchères avec un voile, un tunnel bas ou un simple paillis épais au pied. Une couche de paillis maintient la chaleur du sol pendant la nuit et protège les racines : c\'est l\'investissement le plus simple et le plus efficace.',
        dos: ['Voile ou tunnel bas la nuit', 'Paillis épais au pied'], dont: ['Laisser les pépinières à découvert'] },
      { at: 48, dur: 24, title: 'Brumiser avant l\'aube, pas après', icon: 'fa-shower',
        visual: 'Une brumisation légère juste avant le lever du jour protège les feuilles du gel.',
        narration: 'En cas de risque de gelée, une brumisation légère juste avant le lever du jour protège les feuilles : l\'eau qui gèle libère de la chaleur et maintient la feuille autour de zéro. Attention à l\'inverse : brumiser après le lever du soleil sur une feuille gelée provoque une brûlure immédiate.',
        dos: ['Brumiser avant l\'aube', 'Arroser le sol la veille au soir'], dont: ['Mouiller une feuille déjà gelée au soleil'] },
      { at: 72, dur: 24, title: 'Décaler les semis et repiquer aux heures chaudes', icon: 'fa-calendar-days',
        visual: 'Semez quand la température remonte, repiquez entre 10 h et 16 h.',
        narration: 'Ne semez pas en sol froid : la graine pourrit ou lève mal. Attendez que la température du sol remonte, et repiquez plutôt entre dix heures et seize heures, quand l\'air est le plus chaud, pour que les plants s\'installent avant la nuit. Les plants repiqués le soir dans un sol froid s\'installent mal.',
        dos: ['Attendre le réchauffement du sol', 'Repiquer en milieu de journée'], dont: ['Semer dans un sol froid et humide'] },
      { at: 96, dur: 24, title: 'Réduire l\'évaporation et abriter le bétail', icon: 'fa-house-chimney',
        visual: 'Brise-vent pour la volaille, litière épaisse, eau tiède pour les jeunes animaux.',
        narration: 'Le froid s\'accompagne souvent d\'un air très sec et d\'un vent desséchant : réduisez les arrosages devenus inutiles, paillez le sol pour garder la chaleur. Pour le bétail et la volaille, montez un brise-vent, épaississez la litière et servez une eau légèrement tiède aux jeunes : un animal qui gaspille son énergie contre le froid perd de la croissance.',
        dos: ['Brise-vent autour des bâtiments', 'Litière épaisse', 'Eau tiède aux jeunes'],
        dont: ['Exposer les volailles au vent froid', 'Laisser les lapereaux sur sol nu'] }
    ]
  },

  /* ---------------------------- VENT ---------------------------- */
  {
    slug: 'vent-fort',
    title: 'Vent fort : protéger les cultures et éviter la dérive',
    situation: 'vent', audience: 'agriculteur', duration: 120,
    poster: 'https://sspark.genspark.ai/i/5iUpRWeqvx9QI9g2?width=2560',
    summary: 'Avant et pendant un coup de vent : tuteurage, brise-vent, timing des traitements, protection des serres et bâtiments, et réparation immédiate des dégâts.',
    tags: ['verse', 'brise-vent', 'dérive', 'tuteurage'],
    chapters: [
      { at: 0, dur: 24, title: 'Lire le vent comme un intrant', icon: 'fa-wind',
        visual: 'Au-dessus de 25 km/h : pas de pulvérisation. Au-dessus de 45 km/h : pas d\'opération légère.',
        narration: 'Le vent est une donnée agronomique à part entière. Au-delà de vingt-cinq kilomètres par heure, la dérive rend la pulvérisation inefficace et dangereuse. Au-delà de quarante-cinq kilomètres par heure, arrêtez les opérations légères et sécurisez le matériel.',
        dos: ['Traiter entre 3 et 12 km/h', 'Caler les opérations légères avant le vent'],
        dont: ['Traiter avec des rafales de 30 km/h', 'Laisser les bâches au vent'] },
      { at: 24, dur: 26, title: 'Tuteurer avant, pas après', icon: 'fa-arrow-up-long',
        visual: 'Tuteurage du maïs, de la tomate et du bananier avant la montaison et le grossissement.',
        narration: 'Tuteurez avant que la culture ne devienne lourde : le maïs au stade montaison, la tomate avant la nouaison, le bananier dès que le régime prend du poids. Haubanez les régimes ou les branches chargées avec une corde en Y vers deux piquets. Après la verse, un maïs relevé ne se redresse jamais complètement.',
        dos: ['Tuteurer à la montaison', 'Haubaner les régimes lourds'], dont: ['Attendre la verse pour réagir'] },
      { at: 50, dur: 24, title: 'Installer des brise-vent utiles', icon: 'fa-tree',
        visual: 'Une haie vive perméable réduit la vitesse du vent de 30 à 50 % sur 10 fois sa hauteur.',
        narration: 'Plantez des haies vives perméables (moringa, vétiver, casuarina, ananas, canne) : elles réduisent la vitesse du vent de trente à cinquante pour cent sur une distance de dix fois leur hauteur. Une haie pleine et compacte crée par contre des turbulences : laissez passer un peu d\'air.',
        dos: ['Haies perméables en bordure', 'Vétiver en cordon'], dont: ['Mur végétal totalement compact'] },
      { at: 74, dur: 24, title: 'Sécuriser serres, hangars et volailles', icon: 'fa-warehouse',
        visual: 'Mettre du poids sur les bâches, fermer les abris légers, sortir les matériels hauts.',
        narration: 'Avant le vent, mettez du poids sur les bâches et toitures légères, fermez les abris, rangez les bâches et sacs, rentrez le petit matériel. Fermez les poulaillers aux trois quarts : trop ouverts, les volailles paniquent et s\'étouffent dans un coin.',
        dos: ['Rentrer le matériel léger', 'Ventilation partielle du poulailler'], dont: ['Laisser les tôles et bâches libres'] },
      { at: 98, dur: 22, title: 'Après le vent : réparer et relancer', icon: 'fa-screwdriver-wrench',
        visual: 'Soulever les tiges sans les casser, butter le pied, apporter un léger azote.',
        narration: 'Après le passage du vent, redressez les tiges non cassées et buttez le pied pour les stabiliser, puis retirez les organes cassés. Un léger apport d\'azote et un arrosage d\'appui relancent la croissance. Sur les arbres, coupez net les branches arrachées et enduisez les plaies.',
        dos: ['Butter après redressement', 'Couper proprement les branches'], dont: ['Tirer brutalement sur une tige cassée'] }
    ]
  },

  /* ---------------------------- GRÊLE / ORAGE ---------------------------- */
  {
    slug: 'grele-orage',
    title: 'Grêle, orage et foudre : que faire avant et après',
    situation: 'grele', audience: 'agriculteur', duration: 115,
    poster: 'https://sspark.genspark.ai/i/lLqHguVr7OcETCS8?width=2560',
    summary: 'Un orage ne se négocie pas. Apprenez à déceler les signes d\'alerte, à mettre à l\'abri les personnes et les bêtes, et à sauver une culture grêlée.',
    tags: ['orage', 'foudre', 'grêle', 'enclos'],
    chapters: [
      { at: 0, dur: 24, title: 'Reconnaître les signes d\'un orage violent', icon: 'fa-cloud-bolt',
        visual: 'Chute brutale de la pression, nuage noir à base plate, vent qui tourne.',
        narration: 'Surveillez la pression atmosphérique : une chute de plus de cinq hectopascals en quelques heures annonce un orage. Ajoutez un nuage à base plate et très sombre, un vent qui tourne ou une chaleur lourde et soudaine : vous avez une heure au maximum pour agir.',
        dos: ['Suivre la pression dans l\'onglet Indicateurs', 'Préparer l\'abri dès les premiers signes'],
        dont: ['Ignorer une chute rapide de pression'] },
      { at: 24, dur: 24, title: 'Mettre les personnes et les bêtes à l\'abri', icon: 'fa-person-shelter',
        visual: 'Ne jamais rester dans un champ ouvert ni sous un arbre isolé pendant un orage.',
        narration: 'Pendant un orage, aucune présence dans un champ ouvert, aucune abri sous un arbre isolé, aucune manipulation de clôture métallique en fil de fer. Regroupez le bétail dans un enclos avec abri, éloignez les animaux des clôtures métalliques et des fils de fer barbelés.',
        dos: ['Enclos avec abri pour le bétail', 'Éloigner du fil de fer'], dont: ['S\'abriter sous un arbre isolé'] },
      { at: 48, dur: 24, title: 'Protéger les cultures sensibles à la grêle', icon: 'fa-shield-halved',
        visual: 'Filet anti-grêle sur les cultures de valeur, toiture de tôles sur les pépinières.',
        narration: 'Pour les cultures de forte valeur, un filet anti-grêle ou une toiture légère de tôles sur la pépinière évite la perte totale. Des sacs de jute ou des branches feuillues placées au-dessus des jeunes plants apportent une protection d\'appoint presque gratuite. Pour les arbres, un filet au-dessus des fruits réduit les chocs directs.',
        dos: ['Filet ou toiture sur pépinière', 'Ombrage d\'appoint par branches'], dont: ['Laisser les semis exposés sans protection'] },
      { at: 72, dur: 24, title: 'Après la grêle : trier et désinfecter', icon: 'fa-scissors',
        visual: 'Couper les organes broyés, traiter les plaies en 48 h pour éviter la pourriture.',
        narration: 'La grêle laisse des plaies qui deviennent des portes d\'entrée pour les champignons et les bactéries. Dans les quarante-huit heures, coupez les organes broyés, retirez les fruits perforés et appliquez un traitement fongique ou un badigeon sur les plaies d\'arbres. Les fruits piqués ne se conserveront pas : dirigez-les vers une transformation ou donnez-les aux animaux.',
        dos: ['Nettoyage des organes broyés en 48 h', 'Fongicide après grêle'], dont: ['Laisser les fruits perforés sur l\'arbre'] },
      { at: 96, dur: 19, title: 'Relancer et noter pour la prochaine fois', icon: 'fa-clipboard-list',
        visual: 'Un apport azoté léger et un enregistrement de la date pour connaître la période à risque.',
        narration: 'Après le nettoyage, un apport azoté léger et un arrosage d\'appui relancent la végétation. Et surtout, notez la date et l\'heure de l\'épisode dans votre journal : au bout de trois années, vous connaîtrez la période à risque de votre terroir, et vous pourrez avancer ou retarder vos semis en conséquence.',
        dos: ['Azote léger après nettoyage', 'Consigner la date de l\'épisode'], dont: ['Oublier de noter : le risque est récurrent'] }
    ]
  },

  /* ---------------------------- HUMIDITÉ ---------------------------- */
  {
    slug: 'humidite-maladies',
    title: 'Humidité élevée : prévenir les maladies',
    situation: 'humidite', audience: 'agriculteur', duration: 130,
    poster: 'https://sspark.genspark.ai/i/4JduQAkNmsGtNIS7?width=2560',
    summary: 'Mildiou, anthracnose, pourriture du collet, rouille : comment l\'humidité déclenche les épidémies et comment les devancer sans multiplier les traitements.',
    tags: ['mildiou', 'anthracnose', 'rouille', 'aération', 'rotation'],
    chapters: [
      { at: 0, dur: 26, title: 'Comprendre le déclenchement', icon: 'fa-bacteria',
        visual: 'De l\'eau sur la feuille pendant 4 à 6 heures suffit à la germination d\'un champignon.',
        narration: 'Les champignons ne demandent pas des jours d\'humidité : quatre à six heures d\'eau libre sur une feuille suffisent pour qu\'une spore germe et pénètre. C\'est pourquoi une pluie en fin d\'après-midi ou un arrosage par aspersion le soir sont bien plus dangereux qu\'un arrosage du matin.',
        dos: ['Moucher les feuilles avant la nuit', 'Traiter en préventif sur cultures sensibles'],
        dont: ['Arroser par aspersion le soir sur tomate et oignon'] },
      { at: 26, dur: 26, title: 'Densité, aération et effeuillage', icon: 'fa-wind',
        visual: 'Éclaircir, tuteurer, éliminer les feuilles basses : l\'air doit circuler dans la culture.',
        narration: 'La maladie se développe dans les cultures serrées, humides et étouffantes. Respectez les écartements, tuteurez, taillez les gourmands, et éliminez les feuilles basses qui touchent le sol. Sur le cacaoyer, l\'élagage de drainage et le ramassage des cabosses malades valent plus que tous les traitements.',
        dos: ['Effeuillage sanitaire', 'Respect des écartements'], dont: ['Laisser un couvert épais et immobile'] },
      { at: 52, dur: 24, title: 'Rotation et assainissement du sol', icon: 'fa-arrows-rotate',
        visual: 'Trois ans sans la même famille sur la même planche. Retirer les résidus malades.',
        narration: 'Les spores et les sclérotes survivent dans le sol et sur les résidus. Sortez les débris des cultures malades et brûlez-les ou compostez-les séparément. Évitez de revenir sur la même planche avec la même famille botanique avant deux à trois saisons : la rotation est le traitement le moins cher qui existe.',
        dos: ['Rotation 2-3 ans entre familles', 'Retrait des résidus malades'], dont: ['Laisser les résidus malades au sol'] },
      { at: 76, dur: 26, title: 'Traitement préventif raisonné', icon: 'fa-spray-can-sparkles',
        visual: 'Prévenir 24 h avant la période à risque, alterner les matières actives, respecter les délais.',
        narration: 'Traitez préventivement, pas curativement : intervenez vingt-quatre heures avant la période à risque annoncée par la météo, jamais après que les taches couvrent la parcelle. Alternez les matières actives pour éviter les résistances, respectez strictement la dose et le délai avant récolte, et portez l\'équipement de protection.',
        dos: ['Préventif avant le créneau humide', 'Alternance des matières actives', 'Respect du délai avant récolte'],
        dont: ['Surdoser pour « assurer »', 'Mélanger au hasard plusieurs produits'] },
      { at: 102, dur: 28, title: 'Priorités : les cultures qui valent le traitement', icon: 'fa-triangle-exclamation',
        visual: 'Tomate, oignon, pomme de terre, bananier, cacaoyer, caféier : les plus sensibles.',
        narration: 'Toutes les cultures ne méritent pas la même vigilance. La tomate, l\'oignon, la pomme de terre, le bananier, le cacaoyer et le caféier peuvent perdre une récolte entière en une semaine d\'humidité. Céréales et légumineuses tolèrent mieux mais demandent une surveillance des épis. Concentrez votre budget protection sur les cultures rentables et sensibles.',
        dos: ['Surveillance renforcée sur cultures sensibles', 'Inspection du dessous des feuilles'],
        dont: ['Traiter tout au même rythme sans distinction'] }
    ]
  },

  /* ---------------------------- UV ---------------------------- */
  {
    slug: 'uv-eleve',
    title: 'Indice UV élevé : protéger les cultures et les travailleurs',
    situation: 'uv', audience: 'grand_public', duration: 105,
    poster: 'https://sspark.genspark.ai/i/BSjLWinqEKv92U96?width=2560',
    summary: 'Au-delà d\'un indice UV de 8 : brûlures foliaires, coups de soleil, échaudage des fruits et dégradation des plastiques. Le plan de protection complet.',
    tags: ['UV', 'brûlure', 'santé', 'ombrage'],
    chapters: [
      { at: 0, dur: 22, title: 'Décoder l\'indice UV', icon: 'fa-sun',
        visual: '0-2 faible, 3-5 modéré, 6-7 élevé, 8-10 très élevé, 11+ extrême.',
        narration: 'L\'indice UV mesure l\'intensité du rayonnement qui atteint votre peau et celle de vos plantes. De trois à cinq, une protection légère suffit. Dès huit, la peau peut brûler en moins de quinze minutes et les feuilles des jeunes plants peuvent griller en une matinée.',
        dos: ['Surveiller l\'indice UV du jour', 'Planifier les travaux lourds hors du pic'], dont: ['Se fier uniquement à la chaleur ressentie'] },
      { at: 22, dur: 22, title: 'Protéger sa peau et sa vue', icon: 'fa-hat-cowboy',
        visual: 'Chapeau large, manches longues, crème solaire 50+, lunettes, 2 L d\'eau par personne.',
        narration: 'Chapeau à bord large, manches longues en tissu tissé serré, crème solaire indice cinquante plus sur le visage, la nuque et les avant-bras, et lunettes pour protéger les yeux, très exposés au Niger, au Bénin ou au Burkina. Emportez deux litres d\'eau par personne et par jour, et buvez avant d\'avoir soif.',
        dos: ['Chapeau + manches longues', 'Crème 50+ toutes les 2 h', 'Boire régulièrement'],
        dont: ['Travail torse nu', 'Pause unique à midi sans eau'] },
      { at: 44, dur: 22, title: 'Reprendre le rythme des travaux', icon: 'fa-clock',
        visual: 'Travaux lourds avant 9 h ou après 16 h. Pause obligatoire entre 12 h et 15 h.',
        narration: 'Décalez les travaux lourds avant neuf heures ou après seize heures, et prenez une vraie pause entre midi et quinze heures. Le coup de chaleur chez l\'agriculteur arrive souvent en début d\'après-midi : maux de tête, vertiges, peau sèche. Arrêtez immédiatement, mettez à l\'ombre et buvez de l\'eau fraîche.',
        dos: ['Pause à l\'ombre entre 12 h et 15 h', 'Reconnaître les signes d\'alerte'],
        dont: ['Poursuivre un travail lourd avec des vertiges'] },
      { at: 66, dur: 22, title: 'Protéger les cultures du rayonnement', icon: 'fa-tree-city',
        visual: 'Filets d\'ombrage, haies, ombrage par association, paillage du sol.',
        narration: 'Les feuilles brûlent, mais aussi les fruits : tomate et piment développent des taches blanchâtres côté soleil, l\'ananas et la mangue se dessèchent. Filets d\'ombrage à trente pour cent, haies vives à l\'ouest, et surtout pailleur qui abaisse la température du sol et protège le collet.',
        dos: ['Filets 30 % sur cultures sensibles', 'Haie vive côté ouest', 'Paillage du sol'],
        dont: ['Exposer des jeunes plants plein sud sans ombrage'] },
      { at: 88, dur: 17, title: 'Bien positionner ses pépinières', icon: 'fa-seedling',
        visual: 'Ombrière haute, orientation est-ouest, tontine de palmes à 30 % d\'ombrage.',
        narration: 'Orientez l\'ombrière du levant au couchant pour couper le rayonnement de midi, jamais toute la lumière du matin. Un ombrage trop dense étiole les plants, un ombrage absent les brûle : visez trente pour cent environ et réduisez progressivement l\'ombre huit jours avant la mise en place.',
        dos: ['Ombrière est-ouest', 'Réduire l\'ombre avant la mise en place'],
        dont: ['Pépinière plein soleil sans protection'] }
    ]
  },

  /* ---------------------------- OUTILS ---------------------------- */
  {
    slug: 'previsions-pluie-agricole',
    title: 'Lire les prévisions de pluie et planifier ses travaux',
    situation: 'pluie', audience: 'grand_public', duration: 105,
    summary: 'Interprétez les quantités de pluie prévues, protégez les récoltes et adaptez semis et arrosages aux prochaines journées.',
    tags: ['pluie', 'prévisions', 'semis', 'arrosage'],
    chapters: [
      { at: 0, dur: 24, title: 'Lire les quantités prévues', icon: 'fa-cloud-rain',
        visual: 'Comparez les millimètres annoncés et la probabilité de pluie pour chaque jour.',
        narration: 'Commencez par comparer la quantité de pluie annoncée et sa probabilité. Une petite averse ne remplace pas une pluie utile pour humidifier tout le profil de semis. Regardez aussi les jours voisins : c\'est le cumul de plusieurs journées qui guide la décision.',
        dos: ['Comparer quantité et probabilité', 'Regarder plusieurs journées à la suite'],
        dont: ['Décider sur la seule icône météo'] },
      { at: 24, dur: 24, title: 'Anticiper le calendrier', icon: 'fa-calendar-days',
        visual: 'Repérez les journées sèches pour récolter, sécher et traiter.',
        narration: 'Une période sèche est utile pour récolter, sécher les grains et effectuer certains traitements. À l\'inverse, prévoyez une solution de protection si une forte pluie arrive pendant le séchage ou juste après un épandage.',
        dos: ['Réserver les journées sèches aux récoltes', 'Protéger les produits en cours de séchage'],
        dont: ['Laisser une récolte exposée à une pluie annoncée'] },
      { at: 48, dur: 22, title: 'Protéger le sol et les cultures', icon: 'fa-house-chimney',
        visual: 'Évacuation maîtrisée, paillage et abri des récoltes en cas de fortes pluies.',
        narration: 'Quand de fortes pluies sont prévues, vérifiez les drains sans accélérer le ruissellement, protégez les jeunes plants et mettez les récoltes à l\'abri. Le paillage limite la battance du sol et réduit les pertes d\'eau après l\'averse.',
        dos: ['Vérifier les écoulements', 'Pailler les sols nus', 'Mettre les récoltes à l\'abri'],
        dont: ['Diriger le ruissellement vers les parcelles voisines'] },
      { at: 70, dur: 20, title: 'Adapter semis et arrosages', icon: 'fa-seedling',
        visual: 'Reporter l\'arrosage avant une pluie utile; semer sur un sol suffisamment humide.',
        narration: 'Une pluie utile peut remplacer un arrosage, mais ne semez pas après une averse trop faible si le sol doit sécher aussitôt. Comparez les besoins de la culture, l\'humidité du sol et le cumul attendu avant de décider.',
        dos: ['Éviter les arrosages redondants', 'Attendre une humidité suffisante pour semer'],
        dont: ['Arroser juste avant une pluie abondante'] },
      { at: 90, dur: 15, title: 'Transformer la prévision en action', icon: 'fa-list-check',
        visual: 'Croisez la météo avec les conseils et l\'état réel de la parcelle.',
        narration: 'Terminez par les conseils de l\'application et vos observations au champ. La prévision aide à choisir le moment, mais le drainage, le type de sol et le stade de la culture restent déterminants.',
        dos: ['Vérifier l\'état réel du champ', 'Ajuster la décision au stade de la culture'],
        dont: ['Suivre une prévision sans observer la parcelle'] }
    ]
  },

  {
    slug: 'semis-reussis',
    title: 'Semis et repiquage réussis : les fondamentaux',
    situation: 'general', audience: 'agriculteur', duration: 120,
    poster: 'https://sspark.genspark.ai/i/ABnRoTxCMkp1g5rO?width=2560',
    summary: 'Préparer le sol, choisir la date selon la pluie utile, traiter la semence, semer à bonne profondeur et réussir son repiquage.',
    tags: ['semis', 'repiquage', 'pluie utile', 'semence'],
    chapters: [
      { at: 0, dur: 24, title: 'Semer quand la pluie est utile', icon: 'fa-cloud-rain',
        visual: 'Attendre 30 à 40 mm cumulés en 2-3 jours avant de semer le maïs, le sorgho ou le coton.',
        narration: 'Ne semez pas sur la première averse : attendez trente à quarante millimètres cumulés en deux ou trois jours. Une pluie de cinq millimètres fait lever les graines, qui meurent aussitôt après. Semer trop tôt est l\'erreur la plus coûteuse et la plus fréquente.',
        dos: ['Attendre une pluie utile de 30-40 mm', 'Semer en début de séquence pluvieuse'],
        dont: ['Semer sur la première averse de 5 mm'] },
      { at: 24, dur: 24, title: 'Préparer un sol qui reçoit la graine', icon: 'fa-tractor',
        visual: 'Sol ameubli sur 15-20 cm, sans mottes, niveau, résidus de la campagne précédente retirés.',
        narration: 'Préparez un sol ameubli sur quinze à vingt centimètres, sans grosses mottes, avec une surface régulière : une graine semée dans une motte ne lève pas. Profitez-en pour incorporer votre fumier ou votre compost, et laissez le sol prêt avant l\'arrivée de la pluie utile.',
        dos: ['Ameublir sur 15-20 cm', 'Incorporer compost ou fumier'], dont: ['Semer sur sol nu non travaillé et couvert de résidus'] },
      { at: 48, dur: 24, title: 'Traiter et calibrer la semence', icon: 'fa-seedling',
        visual: 'Semences triées, calibrées, traitées contre les champignons du sol et la bruche.',
        narration: 'Utilisez des semences triées et calibrées, d\'un bon taux de germination. Traitez-les contre les champignons du sol et, pour les légumineuses, contre la bruche qui ravage les stocks. Un traitement de semence coûte quelques francs par kilo et sécurise tout le champ.',
        dos: ['Semences calibrées', 'Traitement fongicide de semence', 'Traitement anti-bruche légumineuses'],
        dont: ['Utiliser des semences de récolte non triées'] },
      { at: 72, dur: 24, title: 'La bonne profondeur et le bon écartement', icon: 'fa-ruler-vertical',
        visual: '2-4 cm pour les petites graines, 4-6 cm pour le maïs, en lignes régulières.',
        narration: 'Respectez la profondeur : deux à quatre centimètres pour les petites graines, quatre à six pour le maïs et le sorgho, plus profond en sol sableux, moins profond en sol argileux humide. Une graine trop profonde épuise ses réserves avant de voir la lumière. Respectez aussi les écartements, c\'est votre densité de récolte.',
        dos: ['Profondeur selon la graine', 'Écartements selon la fiche culture'], dont: ['Semer à la volée sans régularité'] },
      { at: 96, dur: 24, title: 'Réussir le repiquage', icon: 'fa-hand-holding-droplet',
        visual: 'Repiquer aux heures fraîches, racines intactes, arrosage d\'installation immédiat.',
        narration: 'Pour un repiquage réussi : arrachez les plants avec leur motte de terre, repiquez aux heures fraîches, enlisez le collet sans l\'enterrer, et arrosez immédiatement. Un arrosage d\'installation dans l\'heure qui suit double le taux de reprise. Pendant les trois premiers jours, arrosez matin et soir.',
        dos: ['Motte de terre préservée', 'Arrosage immédiat', 'Deux arrosages par jour les 3 premiers jours'],
        dont: ['Repiquer à midi sous forte chaleur'] }
    ]
  },

  {
    slug: 'recolte-stockage',
    title: 'Bien récolter et bien stocker : ne pas perdre la récolte',
    situation: 'secheresse', audience: 'agriculteur', duration: 120,
    poster: 'https://sspark.genspark.ai/i/328rALmWMUEUzVXa?width=2560',
    summary: 'Jusqu\'à 30 % de la récolte se perd entre le champ et l\'assiette. Séchage, humidité cible, stockage hermétique et warrantage pour vendre au bon moment.',
    tags: ['séchage', 'stockage', 'aflatoxine', 'warrantage'],
    chapters: [
      { at: 0, dur: 24, title: 'Récolter au bon stade, au bon moment', icon: 'fa-basket-shopping',
        visual: 'Récolte quand le grain est mûr mais pas sec au point de s\'égrener.',
        narration: 'Récoltez au bon stade : un grain de maïs mûr est denté et dur, la spathe sèche ; un niébé se récolte gousse par gousse avant l\'éclatement, un arachide quand les gousses portent un réseau de veines net. Récoltez par temps sec, jamais sous la pluie ou sur un sol mouillé : l\'eau au moment de la récolte est la première cause de moisissure.',
        dos: ['Récolte par temps sec', 'Récolte échelonnée pour les légumineuses'],
        dont: ['Récolter sous la pluie', 'Attendre la sur-maturité par manque de main-d\'œuvre'] },
      { at: 24, dur: 24, title: 'Sécher correctement et vite', icon: 'fa-sun',
        visual: 'Maïs < 13 %, niébé < 12 %, arachide < 9 % d\'humidité avant stockage.',
        narration: 'Le séchage décide de la conservation. Visez moins de treize pour cent d\'humidité pour le maïs, moins de douze pour le niébé et moins de neuf pour l\'arachide. Séchez en couche mince sur une aire propre, jamais à même le sol, et rentrez avant les averses : une récolte mouillée au séchage moisit en quarante-huit heures.',
        dos: ['Aire de séchage propre et surélevée', 'Couche mince retournée régulièrement', 'Mesurer l\'humidité'],
        dont: ['Sécher à même la terre nue', 'Entasser les grains humides'] },
      { at: 48, dur: 24, title: 'Le piège des aflatoxines', icon: 'fa-triangle-exclamation',
        visual: 'Grains moisis, arachides tachées, maïs piqué : à écarter absolument.',
        narration: 'Les aflatoxines sont des poisons produites par des moisissures sur l\'arachide, le maïs et le niébé mal séchés. Elles ne se voient pas toujours et résistent à la cuisson. Écartez et détruisez les lots moisis ou tachés, ne les donnez pas aux enfants ni aux animaux, et nettoyez le sol entre deux lots.',
        dos: ['Tri sévère des lots', 'Destruction des grains moisis'], dont: ['Mélanger un lot moisi au lot sain'] },
      { at: 72, dur: 24, title: 'Stocker en hermétique, pas en sac ouvert', icon: 'fa-jar-wheat',
        visual: 'Sacs hermétiques, silos métalliques, fûts, ou triples sacs superposés.',
        narration: 'Stockez en hermétique : fûts, silos métalliques, sacs hermétiques en plastique multicouche, ou à défaut trois sacs superposés dans un endroit sec et ventilé, sur palettes. Pour le niébé, ajoutez un traitement ou un répulsif végétal (piper guinéen, neem). Un stock bien sec et hermétique se conserve une année sans perte.',
        dos: ['Palettes pour surélever', 'Conteneurs hermétiques', 'Répulsifs naturels (neem, piper guinéen)'],
        dont: ['Poser les sacs à même le sol', 'Stocker dans une pièce humide'] },
      { at: 96, dur: 24, title: 'Vendre au bon moment : le warrantage', icon: 'fa-scale-balanced',
        visual: 'Stocké, warranté, vendu hors récolte : la même récolte peut valoir 40 % de plus.',
        narration: 'Juste après la récolte, tout le monde vend et le prix est au plus bas. Avec le warrantage, vous stockez dans un magasin de proximité et obtenez un crédit en échange, puis vous vendez trois à cinq mois plus tard quand les prix remontent. La même récolte peut valoir quarante pour cent de plus, tout en vous donnant de la trésorerie immédiate pour l\'école ou les intrants.',
        dos: ['Stockage communautaire', 'Vente étalée hors période de récolte', 'Crédit adossé au stock'],
        dont: ['Vendre tout à la récolte au prix le plus bas'] }
    ]
  }
];

const VideoDB = {
  all: VIDEO_GUIDES,
  bySlug: function (slug) {
    return VIDEO_GUIDES.filter(function (v) { return v.slug === slug; })[0] || null;
  },
  bySituation: function (sit) {
    if (!sit || sit === 'all') return VIDEO_GUIDES;
    return VIDEO_GUIDES.filter(function (v) { return v.situation === sit; });
  },
  search: function (q) {
    if (!q) return VIDEO_GUIDES;
    const s = q.toLowerCase();
    return VIDEO_GUIDES.filter(function (v) {
      return (v.title + ' ' + v.summary + ' ' + (v.tags || []).join(' ') + ' ' + v.situation).toLowerCase().indexOf(s) >= 0;
    });
  },
  totalDuration: function (v) {
    return v.duration || v.chapters.reduce(function (a, c) { return a + c.dur; }, 0);
  },
  /* situation suggérée selon la météo courante */
  suggestSituation: function (w) {
    if (!w || !w.current) return 'general';
    const c = w.current;
    const d = (w.daily && w.daily[0]) || {};
    if (c.code >= 95 || (d.windMax || 0) > 60) return 'grele';
    if ((d.rain || 0) > 25 || (d.rainProb || 0) > 80) return 'pluie';
    if ((d.tmax || c.temp) >= 35) return 'chaleur';
    if ((d.tmin || c.temp) <= 16) return 'froid';
    if ((d.windMax || c.wind || 0) > 35) return 'vent';
    if ((c.humidity || 0) > 85) return 'humidite';
    if ((c.uv || 0) >= 9) return 'uv';
    const dry = (w.daily || []).slice(0, 5).reduce(function (a, x) { return a + (x.rain || 0); }, 0);
    if (dry < 3) return 'secheresse';
    return 'general';
  }
};

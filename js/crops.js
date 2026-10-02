/* =====================================================================
   crops.js — Bibliothèque des cultures, élevages et itinéraires techniques
   Base de données locale (hors ligne) extensible par l'utilisateur.
   Chaque fiche : exigences climatiques, sols, cycle, calendrier de semis,
   rendements, ravageurs et stades phénologiques avec besoins clés.
   ===================================================================== */
'use strict';

/* ---------- Modèles de stades par catégorie ---------- */
function defaultStages(cycle, cat) {
  const c = cycle || 120;
  const frac = function (f) { return Math.round(c * f); };
  const templates = {
    cereale: [['Semis / levée', frac(0.07), 'Humidité du sol à la levée, protection contre les oiseaux'],
      ['Tallage / végétatif', frac(0.3), 'Premier apport d\'azote, sarclage'],
      ['Montaison / floraison', frac(0.52), 'Besoin en eau maximal, protection des épis'],
      ['Remplissage des grains', frac(0.75), 'Deuxième apport, surveiller les ravageurs'],
      ['Maturité / récolte', c, 'Dessèchement, récolte par temps sec']],
    legumineuse: [['Semis / levée', frac(0.07), 'Inoculum si disponible, sol ressuyé'],
      ['Végétatif', frac(0.3), 'Sarclage, sol non asphyxiant'],
      ['Floraison', frac(0.55), 'Eau régulière, éviter les insecticides sur abeilles'],
      ['Formation des gousses', frac(0.75), 'Protection contre les pucerons et la pourriture'],
      ['Maturité / récolte', c, 'Récolte dès maturité pour éviter l\'égrenage']],
    tubercule: [['Préparation / plantation', frac(0.05), 'Buttage, sol meuble, semences saines'],
      ['Croissance végétative', frac(0.35), 'Sarclage, fertilisation, tuteurage si besoin'],
      ['Grossissement', frac(0.7), 'Arrosage régulier, buttage, éviter l\'asphyxie'],
      ['Maturité / récolte', c, 'Récolte en sol sec, conservation à l\'ombre']],
    maraichage: [['Pépinière / semis', frac(0.12), 'Substrat sain, ombrage, arrosage fin'],
      ['Repiquage / installation', frac(0.25), 'Racines protégées, arrosage d\'installation'],
      ['Croissance', frac(0.5), 'Fertilisation fractionnée, désherbage'],
      ['Floraison / fructification', frac(0.72), 'Eau régulière, protection fongique'],
      ['Récolte échelonnée', c, 'Récolte aux heures fraîches, chaîne du froid']],
    fruit: [['Plantation', 0, 'Trou de plantation, amendement organique'],
      ['Installation (juvénile)', frac(0.3), 'Arrosage de secours, paillage'],
      ['Croissance / formation', frac(0.6), 'Taille de formation, fertilisation'],
      ['Entrée en production', frac(0.85), 'Taille sanitaire, irrigation régulière'],
      ['Production', c, 'Récolte échelonnée, protection des fruits']],
    olagineux: [['Semis / levée', frac(0.08), 'Sol réchauffé, densité respectée'],
      ['Végétatif', frac(0.32), 'Sarclage, premier apport'],
      ['Floraison', frac(0.55), 'Eau, pollinisateurs préservés'],
      ['Remplissage des graines', frac(0.78), 'Protection contre les chenilles'],
      ['Maturité / récolte', c, 'Récolte par temps sec, séchage rapide']],
    fibre: [['Semis / levée', frac(0.07), 'Sol meuble, humidité suffisante'],
      ['Végétatif', frac(0.3), 'Démariage, sarclage, azote'],
      ['Floraison / capsulaison', frac(0.6), 'Surveillance ravageurs (piqueurs)'],
      ['Maturation des capsules', frac(0.8), 'Arrêt des traitements avant récolte'],
      ['Récolte', c, 'Récolte manuelle échelonnée, séchage']],
    epice: [['Pépinière / semis', frac(0.15), 'Substrat fin, ombrage léger'],
      ['Installation', frac(0.3), 'Repiquage aux heures fraîches'],
      ['Croissance', frac(0.6), 'Eau régulière, paillage'],
      ['Récolte échelonnée', c, 'Récolte à maturité, séchage à l\'ombre']],
    fourrage: [['Semis', frac(0.06), 'Préparation fine du sol'],
      ['Établissement', frac(0.35), 'Désherbage précoce'],
      ['Exploitation (coupes)', frac(0.7), 'Coupes espacées, fertilisation après coupe'],
      ['Entretien', c, 'Rotation, pâturage contrôlé']],
    elevage: [['Installation / mise en place', 0, 'Habitat sain, eau propre, désinfection'],
      ['Démarrage', frac(0.25), 'Aliment adapté, surveillance sanitaire'],
      ['Croissance', frac(0.6), 'Ration équilibrée, ventilation'],
      ['Finition / production', frac(0.9), 'Confort thermique, contrôle des ambiances'],
      ['Commercialisation / renouvellement', c, 'Pesée, suivi qualité, prophylaxie']],
    pisciculture: [['Préparation du bassin', 0, 'Mise en eau, fertilisation, contrôle du pH'],
      ['Empoissonnement', frac(0.12), 'Alevins de qualité, acclimatation'],
      ['Grossissement', frac(0.6), 'Alimentation 3-5 % du poids, oxygénation'],
      ['Finition / pêche', c, 'Tri, pêche partielle, renouvellement']],
    forestier: [['Plantation', 0, 'Trou de plantation, tuteur, paillage'],
      ['Installation', frac(0.3), 'Dégagement, arrosage de secours'],
      ['Croissance', frac(0.65), 'Élagage, protection contre le feu'],
      ['Exploitation / récolte', c, 'Coupe sélective, régénération']]
  };
  return (templates[cat] || templates.cereale).map(function (s) {
    return { name: s[0], days: s[1], key_needs: s[2] };
  });
}

/* ---------- Zones par catégorie (valeurs par défaut) ---------- */
const CAT_ZONES = {
  cereale: ['sahel', 'soudano-sahel', 'soudanienne', 'soudano-guineenne', 'guineenne', 'irrigue', 'montagne'],
  legumineuse: ['sahel', 'soudano-sahel', 'soudanienne', 'soudano-guineenne', 'guineenne', 'irrigue'],
  tubercule: ['soudano-sahel', 'soudanienne', 'soudano-guineenne', 'guineenne', 'bas-fond', 'urbaine'],
  maraichage: ['soudano-sahel', 'soudanienne', 'soudano-guineenne', 'guineenne', 'cotiere', 'urbaine', 'irrigue', 'montagne'],
  fruit: ['soudanienne', 'soudano-guineenne', 'guineenne', 'cotiere', 'montagne', 'irrigue'],
  olagineux: ['sahel', 'soudano-sahel', 'soudanienne', 'soudano-guineenne', 'guineenne'],
  fibre: ['soudano-sahel', 'soudanienne', 'soudano-guineenne', 'guineenne', 'irrigue'],
  epice: ['soudanienne', 'soudano-guineenne', 'guineenne', 'urbaine', 'irrigue'],
  fourrage: ['sahel', 'soudano-sahel', 'soudanienne', 'soudano-guineenne', 'guineenne', 'montagne'],
  elevage: ['sahel', 'soudano-sahel', 'soudanienne', 'soudano-guineenne', 'guineenne', 'montagne', 'urbaine'],
  pisciculture: ['guineenne', 'bas-fond', 'cotiere', 'soudano-guineenne'],
  forestier: ['sahel', 'soudano-sahel', 'soudanienne', 'soudano-guineenne', 'guineenne', 'montagne', 'urbaine']
};

/* ---------- Constructeur compact ---------- */
const CROP_ROWS = [];
function C(name, sci, cat, cycle, tmin, tmax, topt, rain, water, ph, soils, o) {
  o = o || {};
  CROP_ROWS.push({
    id: o.id || null, name: name, sci: sci, category: cat, cycle: cycle,
    tmin: tmin, tmax: tmax, topt: topt, rain: rain, water: water, ph: ph,
    soils: soils, zones: o.zones || CAT_ZONES[cat] || ['soudanienne'],
    spacing: o.spacing || '—', seed: o.seed || '—', yield: o.yld || '—',
    cal: o.cal || [5, 6], pests: o.pests || [],
    notes: o.notes || '', source: o.source || 'Référentiels FAO / IITA / INRAB / fiches techniques nationales',
    stages: o.stages || null, alt: o.alt
  });
}

/* =====================================================================
   CÉRÉALES
   ===================================================================== */
C('Maïs', 'Zea mays', 'cereale', 100, 10, 40, [21, 30], [500, 1200], 'eleve', [5.5, 7.5],
  ['limono-sableux', 'limoneux', 'ferralitique'],
  { spacing: '75 x 25 cm (0,75 m entre lignes)', seed: '20-25 kg/ha', yld: '2-6 t/ha (jusqu\'à 8 t/ha amélioré)',
    cal: [3, 4, 5, 6, 7, 8, 9], pests: ['Chenille légionnaire d\'automne', 'Foreur de tige', 'Charançon du grain', 'Striga (sols pauvres)', 'Moisissures des épis'],
    notes: 'Culture de base vivrière. Sensible au stress hydrique entre la floraison et le remplissage des grains. En zone guinéenne, viser deux campagnes (grande et petite saison des pluies). Apporter 80-120 kg N/ha en 2-3 fractionnements, plus P et K au semis.',
    stages: [['Semis / levée', 7, 'Humidité du sol suffisante, protection contre les oiseaux et rongeurs'],
      ['Végétatif (V6-V10)', 30, 'Sarclage, premier apport d\'urée (50 kg/ha)'],
      ['Floraison (soie)', 55, 'Besoin en eau maximal — éviter tout stress hydrique'],
      ['Remplissage des épis', 75, 'Deuxième apport d\'azote, surveiller la légionnaire'],
      ['Maturité laiteuse → pâteuse', 90, 'Surveiller les oiseaux et l\'humidité des grains'],
      ['Récolte', 100, 'Grains à 14 % d\'humidité, séchage rapide']] });

C('Riz', 'Oryza sativa', 'cereale', 120, 12, 38, [22, 32], [900, 2000], 'tres_eleve', [5.0, 7.5],
  ['argileux', 'hydromorphe', 'limoneux'],
  { spacing: '20 x 20 cm (repiquage) ou semis en ligne 20 cm', seed: '40-60 kg/ha (repiquage)',
    yld: '3-6 t/ha paddy (irrigué), 1,5-3 t/ha pluvial', cal: [4, 5, 6, 7, 8],
    pests: ['Foreur de tige', 'Oiseaux granivores', 'Adventices (graminées)', 'Pyriculariose', 'Altises'],
    notes: 'Deux systèmes : riziculture irriguée (maîtrise de l\'eau = facteur n°1) et riz pluvial de bas-fond. Maintenir 5 cm d\'eau de la reprise jusqu\'à la fin de la montaison, puis drainage avant récolte. Variétés à cycle court (90-100 j) utiles en contre-saison.',
    stages: [['Pépinière / semis', 20, 'Semis dense en pépinière, bassin préparé'],
      ['Repiquage', 25, 'Repiquage 2-3 brins par poquet, eau maîtrisée'],
      ['Tallage', 55, 'Maintien de 5 cm d\'eau, désherbage manuel'],
      ['Montaison / épiaison', 85, 'Azote en épiaison, surveiller les foreurs'],
      ['Maturité', 110, 'Drainage du casier 10 jours avant récolte'],
      ['Récolte / battage', 120, 'Battage rapide, séchage à l\'ombre puis au soleil']] });

C('Sorgho', 'Sorghum bicolor', 'cereale', 110, 8, 42, [25, 32], [400, 900], 'moyen', [5.5, 8.0],
  ['sableux', 'limono-sableux', 'lateritique', 'argileux'],
  { spacing: '80 x 40 cm', seed: '8-12 kg/ha', yld: '1,5-3 t/ha',
    cal: [5, 6, 7], pests: ['Cécidomyie du sorgho', 'Charançon', 'Oiseaux (Quelea)', 'Striga'],
    notes: 'Céréale la plus tolérante à la sécheresse : excellent choix en zone sahélienne. Sensible à l\'excès d\'eau. Variétés à tige sucrée pour fourrage, variétés à grain pour la consommation. Résiste bien aux sols pauvres.',
    stages: [['Semis / levée', 8, 'Sol à 15 °C minimum, démariage précoce'],
      ['Montaison', 40, 'Sarclage, azote selon la pluviométrie'],
      ['Épiaison / floraison', 65, 'Stade critique pour l\'eau, surveiller la cécidomyie'],
      ['Remplissage du grain', 90, 'Protection contre les oiseaux'],
      ['Maturité / récolte', 110, 'Récolte en une seule fois, séchage des panicules']] });

C('Mil / Petit mil', 'Pennisetum glaucum', 'cereale', 90, 10, 45, [25, 35], [250, 700], 'faible', [5.5, 8.2],
  ['sableux', 'lateritique', 'limono-sableux'],
  { spacing: '90 x 45 cm', seed: '5-8 kg/ha', yld: '0,7-2 t/ha', cal: [6, 7],
    pests: ['Mildiou', 'Charançon du mil', 'Oiseaux', 'Chenilles'],
    notes: 'Culture la plus résiliente du Sahel : cycle court (75-110 j), tolère des pluies de 250 mm. Repiquer les jeunes plants pour combler les manques. Bonne réponse à un léger apport de fumier en poquet.',
    stages: [['Semis / levée', 6, 'Semis dès 20 mm de pluie utile'],
      ['Tallage', 25, 'Démariage à 2 plants/poquet, sarclage'],
      ['Montaison / épiaison', 50, 'Surveiller la chenille et le mildiou'],
      ['Remplissage', 75, 'Protection des chandelles contre les oiseaux'],
      ['Maturité / récolte', 90, 'Récolte des chandelles, conservation en grenier']] });

C('Fonio', 'Digitaria exilis', 'cereale', 90, 15, 40, [25, 32], [400, 1000], 'faible', [4.5, 6.5],
  ['sableux', 'lateritique'],
  { spacing: 'Semis à la volée', seed: '15-25 kg/ha', yld: '0,6-1,2 t/ha', cal: [6, 7],
    pests: ['Oiseaux', 'Ravageurs des stocks'],
    notes: 'Céréale très ancienne d\'Afrique de l\'Ouest, excellente sur sols pauvres et dégradés, cycle de 70-90 jours : idéale pour combler une soudure avant les autres céréales.',
    stages: defaultStages(90, 'cereale') });

C('Blé', 'Triticum aestivum', 'cereale', 115, 5, 32, [15, 25], [400, 900], 'moyen', [6.0, 7.5],
  ['limoneux', 'argileux', 'limono-sableux'],
  { spacing: 'Semis en ligne 20 cm', seed: '100-150 kg/ha', yld: '2-4 t/ha (irrigué)',
    cal: [11, 12, 1], pests: ['Rouille', 'Oiseaux', 'Septoriose', 'Chenilles mineuses'],
    notes: 'À cultiver en contre-saison froide, en altitude ou sous irrigation. Sensible aux fortes chaleurs en fin de cycle (>30 °C pendant le remplissage). Éviter les sols trop acides.',
    stages: defaultStages(115, 'cereale') });

C('Orge', 'Hordeum vulgare', 'cereale', 110, 4, 34, [15, 25], [350, 800], 'moyen', [6.0, 8.0],
  ['limoneux', 'argileux'], { cal: [11, 12, 1], pests: ['Rouille', 'Charançon'],
    notes: 'Plus tolérante que le blé au sel et à la sécheresse de fin de cycle. Utilisable en grain ou en fourrage.' });

C('Tef / Téf', 'Eragrostis tef', 'cereale', 95, 10, 34, [18, 26], [350, 800], 'faible', [4.0, 6.5],
  ['limono-sableux', 'argileux'], { cal: [6, 7], yld: '0,8-1,5 t/ha',
    notes: 'Cycle très court, valorise les sols lourds temporairement engorgés, supporte bien l\'excès d\'eau passager sans support.' });

C('Avoine', 'Avena sativa', 'cereale', 110, 4, 28, [15, 22], [400, 900], 'moyen', [5.5, 7.5],
  ['limoneux', 'sableux'], { cal: [11, 12], pests: ['Rouille', 'Pucerons des céréales'],
    notes: 'Cultivée surtout en fourrage (avoine + vesce) pour l\'alimentation animale.' });

C('Mils et céréales secondaires (fonio, tef, millet commun)', '—', 'cereale', 95, 12, 40, [24, 32], [300, 800], 'faible', [5.0, 8.0],
  ['sableux', 'lateritique'], { cal: [6, 7], pests: ['Oiseaux', 'Insectes de stockage'],
    notes: 'Groupe à semer en complément pour sécuriser la soudure alimentaire sur sols marginaux.' });

C('Sorgho fourrager / Sorgho sucré', 'Sorghum bicolor var. saccharatum', 'fourrage', 100, 10, 40, [25, 33], [400, 900], 'faible', [5.5, 8.0],
  ['limono-sableux'], { spacing: '40 cm entre lignes serrées', seed: '15-20 kg/ha', yld: '20-40 t MS/ha', cal: [5, 6, 7],
    notes: 'Coupes possibles toutes les 6-8 semaines. Attention : sorgho jeune peut être toxique (acide cyanhydrique) en cas de stress ou de gelée.' });

/* =====================================================================
   TUBERCULES & RACINES (base alimentaire)
   ===================================================================== */
C('Igname', 'Dioscorea spp.', 'tubercule', 270, 15, 35, [25, 30], [1000, 1800], 'eleve', [5.5, 7.0],
  ['limono-sableux', 'ferralitique', 'sableux'],
  { spacing: 'Buttes 1 x 1 m ou billons 1,2 m', seed: '2-3 t/ha de semenceaux', yld: '8-25 t/ha',
    cal: [2, 3, 4], pests: ['Nématodes', 'Anthracnose', 'Champignons du sol', 'Criquets'],
    notes: 'Culture de rente et d\'alimentation majeure. Installez la tuteurerie (perches 2-3 m) avant la montaison : sans tuteur, le rendement chute de 40 %. Sol frais mais jamais détrempé, fumure organique abondante (fumier de bovin 10-20 t/ha).',
    stages: [['Préparation / buttage', 0, 'Buttes profondes, sol meuble, pré-installation des tuteurs'],
      ['Plantation des semenceaux', 10, 'Semenceaux sains de 300-500 g, traités contre les nématodes'],
      ['Levée / tuteurage', 45, 'Enroulement des tiges, sarclage, premier apport'],
      ['Tubérisation', 120, 'Fumure organique, arrosage en saison sèche si irrigation'],
      ['Grossissement des tubercules', 200, 'Paillage, éviter les blessures de tubercules'],
      ['Récolte', 270, 'Récolte en sol sec, séchage à l\'ombre avant stockage']] });

C('Manioc', 'Manihot esculenta', 'tubercule', 300, 12, 40, [24, 30], [600, 1500], 'moyen', [4.8, 7.5],
  ['sableux', 'limono-sableux', 'ferralitique', 'lateritique'],
  { spacing: '1 x 1 m ou 1 x 0,8 m', seed: '10 000 boutures/ha (20-25 cm)', yld: '15-40 t/ha de racines fraîches',
    cal: [4, 5, 6, 7], pests: ['Mosaïque du manioc', 'Acariens (helopeltis)', 'Bactériose', 'Cochenilles'],
    notes: 'Extrêmement tolérant : cycle de 8 à 24 mois selon la variété, récolte étalable et stockage en terre. Idéal comme culture de sécurité et d\'amortissement. Préférez les variétés améliorées résistantes à la mosaïque (TMS, TME).',
    stages: [['Préparation / bouturage', 0, 'Boutures saines de 20-25 cm, sol meuble'],
      ['Reprise / enracinement', 30, 'Contrôle des manquants, premier sarclage'],
      ['Croissance et ramification', 120, 'Fertilisation, désherbage, buttage léger'],
      ['Grossissement des racines', 210, 'Limiter les déficits hydriques répétés'],
      ['Récolte étalée', 300, 'Arracher progressivement selon les besoins de consommation']] });

C('Patate douce', 'Ipomoea batatas', 'tubercule', 120, 12, 38, [22, 30], [500, 1200], 'moyen', [5.0, 7.0],
  ['sableux', 'limono-sableux'],
  { spacing: '30-40 cm sur billons de 1 m', seed: '30 000-40 000 boutures/ha', yld: '10-25 t/ha',
    cal: [5, 6, 7, 8], pests: ['Charançon de la patate douce', 'Virus (SPVD)', 'Chenilles défoliatrices'],
    notes: 'Cycle court (90-140 j), forte valeur énergétique, tolère les sols pauvres. Éviter les sols riches en azote (production foliaire au détriment des racines).',
    stages: defaultStages(120, 'tubercule') });

C('Pomme de terre', 'Solanum tuberosum', 'tubercule', 95, 5, 30, [15, 22], [500, 800], 'eleve', [5.0, 6.5],
  ['limoneux', 'limono-sableux'],
  { spacing: '75 x 30 cm sur billons', seed: '2-2,5 t/ha de plants', yld: '15-30 t/ha',
    cal: [11, 12, 1], pests: ['Mildiou', 'Doryphore', 'Nématodes à galles', 'Rhizoctone'],
    notes: 'Culture de contre-saison froide ou d\'altitude. Le mildiou peut détruire la parcelle en 5 jours par temps humide : alterner les matières actives préventivement. Plant à germer avant plantation.',
    stages: [['Plantation', 0, 'Plants germés, sol ameubli, billons de 30 cm'],
      ['Levée', 20, 'Sarclage, premier buttage lorsque les plants font 15 cm'],
      ['Croissance / tubérisation', 50, 'Deuxième buttage, irrigation régulière'],
      ['Grossissement', 75, 'Arrêt des déficits hydriques, surveillance mildiou'],
      ['Défanage puis récolte', 95, 'Récolte 15 j après coupe des fanes en sol sec']] });

C('Taro / Macabo', 'Colocasia esculenta / Xanthosoma', 'tubercule', 240, 15, 33, [23, 30], [1200, 2500], 'tres_eleve', [5.0, 7.0],
  ['hydromorphe', 'argileux', 'limoneux'],
  { spacing: '80 x 60 cm', seed: '400-600 kg/ha de rejets', yld: '8-20 t/ha', cal: [3, 4, 5],
    pests: ['Puceron du taro', 'Pourriture du corme', 'Nématodes'],
    notes: 'Culture de bas-fond, apprécie l\'humidité permanente mais supporte mal l\'eau stagnante prolongée. Ombrage léger favorable les premières semaines.',
    stages: defaultStages(240, 'tubercule') });

C('Ignames sauvages et igname cousse-cousse', 'Dioscorea spp.', 'tubercule', 240, 16, 35, [25, 30], [1000, 1600], 'eleve', [5.5, 7.0],
  ['limono-sableux'], { cal: [3, 4], notes: 'Groupe des ignames à consommation crue ou variétés locales ; mêmes règles culturales que l\'igname principale.' });

C('Betterave sucrière / fourragère', 'Beta vulgaris', 'tubercule', 150, 5, 30, [15, 22], [450, 800], 'moyen', [6.0, 8.0],
  ['limoneux', 'argileux'], { cal: [11, 12], notes: 'Surtout en fourrage ou en zone d\'altitude tempérée. Tolère la salinité.' });

C('Navet / Radis', 'Raphanus sativus', 'tubercule', 30, 5, 30, [15, 22], [400, 700], 'moyen', [6.0, 7.5],
  ['limono-sableux'], { cal: [10, 11, 12, 1], spacing: '20 x 5 cm', seed: '8-10 kg/ha', yld: '15-25 t/ha', notes: 'Cycle très court (25-35 j) : excellent en culture intercalaire et pour l\'autoconsommation.' });

C('Carotte', 'Daucus carota', 'maraichage', 100, 5, 30, [16, 22], [400, 800], 'eleve', [6.0, 7.0],
  ['limono-sableux', 'sableux'],
  { spacing: '25 x 5 cm', seed: '3-4 kg/ha', yld: '20-40 t/ha', cal: [10, 11, 12, 1, 2],
    pests: ['Mouche de la carotte', 'Nématodes', 'Alternaria'],
    notes: 'Exige un sol meuble sans cailloux. Éclaircir impérativement 2-3 semaines après le semis. Arrosage régulier pour éviter les racines fissurées.' });

/* =====================================================================
   LÉGUMINEUSES
   ===================================================================== */
C('Niébé', 'Vigna unguiculata', 'legumineuse', 75, 15, 40, [25, 32], [350, 900], 'faible', [5.5, 7.5],
  ['sableux', 'limono-sableux', 'lateritique'],
  { spacing: '75 x 25 cm', seed: '15-25 kg/ha', yld: '0,8-2 t/ha',
    cal: [6, 7, 8], pests: ['Pucerons', 'Thrips', 'Punaise', 'Mosaïque', 'Bruche (stockage)'],
    notes: 'Légumineuse la plus adaptée au Sahel : fixation d\'azote, cycle court, feuilles et fanes fourragères de qualité. En association avec le mil ou le sorgho, elle améliore le rendement global du champ. Traiter les graines stockées contre la bruche.',
    stages: [['Semis / levée', 6, 'Densité respectée, sol ressuyé'],
      ['Végétatif / ramification', 25, 'Premier sarclage, éviter l\'excès d\'azote'],
      ['Floraison', 45, 'Eau régulière, préserver les pollinisateurs'],
      ['Formation des gousses', 60, 'Lutte contre les pucerons et punaises'],
      ['Maturation / récolte', 75, 'Récolte des gousses avant éclatement, séchage, traitement de stockage']] });

C('Arachide', 'Arachis hypogaea', 'olagineux', 110, 12, 40, [25, 30], [500, 1200], 'moyen', [5.8, 7.0],
  ['sableux', 'limono-sableux'],
  { spacing: '40 x 15 cm', seed: '90-120 kg/ha (gousses)', yld: '1-2,5 t/ha de gousses sèches',
    cal: [6, 7], pests: ['Cercosporiose', 'Rouille', 'Thrips', 'Termites', 'Aflatoxines'],
    notes: 'Le sol doit rester meuble pour que les akènes (gousses) puissent s\'enterrer : éviter la croûte de battance après les pluies. Récolter à maturité complète et bien sécher (humidité < 9 %) pour éviter les aflatoxines.',
    stages: [['Semis / levée', 7, 'Semis en sol réchauffé et meuble'],
      ['Végétatif', 30, 'Sarclage, chaulage si sol acide'],
      ['Floraison / fécondation', 55, 'Eau critique — éviter le stress hydrique'],
      ['Formation et remplissage des gousses', 80, 'Buttage léger, éviter les insectes du sol'],
      ['Maturité / récolte', 110, 'Arrachage, séchage rapide, tri des gousses moisies']] });

C('Soja', 'Glycine max', 'legumineuse', 110, 12, 35, [22, 30], [500, 1000], 'eleve', [6.0, 7.0],
  ['limoneux', 'limono-sableux'],
  { spacing: '50 x 10 cm', seed: '50-70 kg/ha', yld: '1,5-3 t/ha',
    cal: [6, 7], pests: ['Chenilles', 'Pucerons', 'Rouille', 'Nématodes'],
    notes: 'Excellent précédent cultural (fixe 40-80 kg N/ha). Inoculer les semences avec du rhizobium si la culture est nouvelle dans la zone. Ne pas récolter sous la pluie : les gousses se déhissent.',
    stages: defaultStages(110, 'legumineuse') });

C('Haricot commun', 'Phaseolus vulgaris', 'legumineuse', 90, 10, 30, [18, 25], [400, 800], 'eleve', [5.5, 7.0],
  ['limoneux', 'limono-sableux'], { cal: [10, 11, 4, 5], yld: '1-2,5 t/ha',
    pests: ['Anthracnose', 'Grayole', 'Pucerons', 'Mouches blanches'],
    notes: 'Sensible aux fortes chaleurs (>30 °C) et à l\'excès d\'eau. Cultiver en contre-saison fraîche ou en altitude.' });

C('Pois d\'Angole / Ambrevade', 'Cajanus cajan', 'legumineuse', 180, 12, 40, [24, 32], [400, 900], 'faible', [5.0, 7.5],
  ['sableux', 'lateritique', 'limono-sableux'],
  { spacing: '1 x 0,5 m', seed: '10-15 kg/ha', yld: '1-2 t/ha', cal: [5, 6],
    pests: ['Pucerons', 'Chenilles des gousses', 'Flétrissement (Fusarium)'],
    notes: 'Arbuste vivace de 2-3 ans : brise-vent, haie vive, ombrage et bois de feu. Rendement fiable même en année sèche.' });

C('Voandzou / Pois bambara', 'Vigna subterranea', 'legumineuse', 130, 15, 40, [25, 32], [300, 800], 'faible', [5.5, 7.5],
  ['sableux', 'lateritique'], { cal: [6, 7], pests: ['Termites', 'Rongeurs', 'Virus'],
    notes: 'Très résistant à la sécheresse : réussit là où l\'arachide échoue. Gousses formées sous terre, se conserve longtemps.' });

C('Ambérique / Lentille de terre', 'Vigna radiata', 'legumineuse', 70, 12, 38, [25, 32], [400, 900], 'faible', [5.5, 7.5],
  ['limono-sableux'], { cal: [6, 7], yld: '0,6-1,2 t/ha', notes: 'Cycle très court (60-80 j), culture de rattrapage idéale après une pluie tardive.' });

C('Pois / Pois fourrager', 'Pisum sativum', 'legumineuse', 100, 4, 26, [14, 22], [400, 800], 'moyen', [6.0, 7.5],
  ['limoneux'], { cal: [11, 12], notes: 'Zone fraîche ou d\'altitude, en association avec les céréales pour le fourrage.' });

C('Fève / Féverole', 'Vicia faba', 'legumineuse', 130, 4, 26, [15, 22], [450, 800], 'moyen', [6.0, 8.0],
  ['argileux', 'limoneux'], { cal: [11, 12], notes: 'Tolère les sols lourds et froids, bon précédent pour les céréales.' });

/* =====================================================================
   MARAÎCHAGE (cultures de rente à cycle court)
   ===================================================================== */
C('Tomate', 'Solanum lycopersicum', 'maraichage', 100, 12, 35, [20, 27], [500, 900], 'tres_eleve', [5.5, 7.0],
  ['limono-sableux', 'limoneux', 'ferralitique'],
  { spacing: '80 x 50 cm (tuteurer)', seed: '300-500 g/ha en pépinière', yld: '20-50 t/ha',
    cal: [10, 11, 12, 1, 2, 3], pests: ['Mildiou (Phytophthora)', 'Alternaria', 'Virus TYLCV (aleurodes)', 'Nématodes', 'Chenille Tuta absoluta'],
    notes: 'Culture maraîchère la plus rentable et la plus exigeante. Semis en pépinière ombragée (4-5 semaines), repiquage aux heures fraîches, tuteurage obligatoire en saison des pluies. Irrigation goutte à goutte + paillage = -60 % de maladies foliaires. Variétés résistantes au TYLCV recommandées en zone côtière.',
    stages: [['Pépinière', 25, 'Substrat désinfecté, ombrage 50 %, arrosage fin'],
      ['Repiquage', 30, 'Plants à 4-6 feuilles, arrosage d\'installation'],
      ['Croissance / floraison', 55, 'Tuteurage, taille des gourmands, fertilisation'],
      ['Nouaison', 70, 'Irrigation régulière, calcium contre le cul noir'],
      ['Grossissement des fruits', 85, 'Protection fongique préventive'],
      ['Récolte échelonnée', 100, 'Cueillette tous les 2-3 jours à maturité tournante']] });

C('Piment / Poivron', 'Capsicum spp.', 'maraichage', 120, 14, 35, [22, 30], [600, 1100], 'eleve', [5.5, 7.0],
  ['limono-sableux', 'limoneux'],
  { spacing: '60 x 40 cm', seed: '400-600 g/ha en pépinière', yld: '8-20 t/ha (frais)',
    cal: [9, 10, 11, 12, 1, 2], pests: ['Thrips', 'Aleurodes', 'Pucerons', 'Anthracnose', 'Pourriture du collet'],
    notes: 'Bonne valeur ajoutée, séchage possible pour la conservation. Le piment tolère mieux la chaleur que le poivron doux. Attention aux excès d\'azote : beaucoup de feuilles, peu de fruits.',
    stages: defaultStages(120, 'maraichage') });

C('Gombo', 'Abelmoschus esculentus', 'maraichage', 90, 15, 40, [25, 32], [600, 1200], 'eleve', [5.8, 7.5],
  ['limono-sableux', 'limoneux'],
  { spacing: '60 x 30 cm', seed: '8-12 kg/ha', yld: '8-15 t/ha', cal: [4, 5, 6, 7, 8],
    pests: ['Oïdium', 'Jassides', 'Chenilles des fruits', 'Nématodes'],
    notes: 'Culture robuste et rentable en saison des pluies. Récolter les fruits à 5-7 cm, 3 fois par semaine : un fruit trop mûr devient fibreux et freine la production.',
    stages: defaultStages(90, 'maraichage') });

C('Aubergine africaine', 'Solanum melongena / macrocarpon', 'maraichage', 110, 15, 38, [22, 30], [600, 1100], 'eleve', [5.5, 7.0],
  ['limoneux', 'limono-sableux'], { cal: [9, 10, 11, 12, 1, 2], seed: '300-400 g/ha', yld: '15-30 t/ha',
    pests: ['Flétrissement bactérien', 'Acariens', 'Aleurodes'], notes: 'Variétés locales (gboma, « aubergine africaine ») très rustiques et appréciées ; bonne tenue en saison chaude.' });

C('Aubergine européenne / Amère', 'Solanum spp.', 'maraichage', 120, 14, 34, [20, 28], [600, 1000], 'eleve', [5.5, 7.0],
  ['limoneux'], { cal: [10, 11, 1, 2], yld: '20-35 t/ha', notes: 'Exigeante en eau mais bien valorisée en zone urbaine.' });

C('Oignon', 'Allium cepa', 'maraichage', 130, 5, 32, [15, 25], [400, 800], 'eleve', [6.0, 7.5],
  ['limono-sableux', 'argileux'],
  { spacing: '20 x 8 cm sur planches', seed: '4-6 kg/ha en pépinière', yld: '15-30 t/ha',
    cal: [10, 11, 12], pests: ['Thrips', 'Mildiou', 'Pourriture du collet', 'Mouche de l\'oignon'],
    notes: 'En zone sahélienne, l\'oignon est une culture de contre-saison irriguée très rentable. Arrêter l\'irrigation 15 jours avant récolte pour améliorer la conservation. Variétés : Violet de Galmi, Blanc de Soumaré.',
    stages: [['Pépinière', 40, 'Semis dense, arrosage léger et fréquent'],
      ['Repiquage', 45, 'Plants à 15 cm, sol fin, planches surélevées'],
      ['Croissance foliaire', 80, 'Azote puis potasse, désherbage manuel'],
      ['Bulbification', 105, 'Réduire l\'azote, eau régulière puis arrêt'],
      ['Maturation / récolte', 130, 'Coucher des feuilles, séchage 10-15 j avant stockage']] });

C('Ail', 'Allium sativum', 'maraichage', 150, 5, 32, [15, 24], [400, 700], 'moyen', [6.0, 7.5],
  ['limono-sableux'], { cal: [10, 11], yld: '5-12 t/ha', pests: ['Thrips', 'Rouille', 'Pourriture blanche'],
    notes: 'Plantation de caïeux en saison fraîche. Arrêt de l\'irrigation 3 semaines avant récolte.' });

C('Chou / Chou pommé', 'Brassica oleracea', 'maraichage', 100, 5, 28, [15, 22], [500, 900], 'eleve', [6.0, 7.5],
  ['limoneux', 'argileux'], { cal: [10, 11, 12, 1], yld: '25-50 t/ha',
    pests: ['Chenille (Piéride)', 'Pucerons cendrés', 'Hernie du chou', 'Mouche du chou'],
    notes: 'Culture de contre-saison fraîche, sensible à la chaleur et à la sécheresse. La hernie du chou impose une rotation de 4 ans minimum.' });

C('Chou-fleur / Brocoli', 'Brassica oleracea var.', 'maraichage', 110, 5, 26, [15, 20], [500, 900], 'eleve', [6.0, 7.5],
  ['limoneux'], { cal: [11, 12, 1], yld: '15-25 t/ha', notes: 'Plus exigeant en fraîcheur que le chou pommé : à réserver à la contre-saison ou aux zones d\'altitude.' });

C('Laitue / Salade', 'Lactuca sativa', 'maraichage', 55, 5, 28, [15, 22], [400, 800], 'eleve', [6.0, 7.0],
  ['limono-sableux'], { cal: [10, 11, 12, 1, 2], spacing: '25 x 25 cm', yld: '20-35 t/ha',
    pests: ['Pucerons', 'Limaces', 'Mildiou', 'Sclérotiniose'],
    notes: 'Cycle très court (45-60 j), idéale en succession toutes les 2 semaines pour un approvisionnement continu. Monte à graines si la température dépasse 28 °C.' });

C('Épinard / Morelle noire / Amarante', 'Amaranthus / Solanum nigrum', 'maraichage', 40, 12, 38, [20, 30], [500, 1200], 'moyen', [5.5, 7.5],
  ['limoneux', 'limono-sableux'], { cal: [4, 5, 6, 7, 8, 9], yld: '10-20 t/ha',
    notes: 'Légumes-feuilles locaux très rustiques (amarante, morelle, crincrin). Coupes répétées toutes les 2-3 semaines. Excellente source de fer et de vitamines.' });

C('Crincrin / Corète potagère', 'Corchorus olitorius', 'maraichage', 45, 15, 38, [22, 32], [500, 1200], 'moyen', [5.5, 7.5],
  ['limono-sableux'], { cal: [4, 5, 6, 7, 8], notes: 'Légume-feuille le plus consommé d\'Afrique de l\'Ouest ; pousse vite et supporte bien la chaleur humide.' });

C('Vernonia / Sunkutu', 'Vernonia amygdalina', 'maraichage', 90, 12, 36, [22, 32], [600, 1200], 'moyen', [5.0, 7.5],
  ['limoneux'], { cal: [4, 5, 9, 10], notes: 'Légume-feuille pérenne riche en principes amers recherchés en pharmacopée locale.' });

C('Céleri', 'Apium graveolens', 'maraichage', 120, 5, 26, [15, 21], [500, 800], 'tres_eleve', [6.0, 7.0],
  ['limoneux', 'hydromorphe'], { cal: [11, 12, 1], notes: 'Exigeant en eau et en fraîcheur : surtout en zone d\'altitude ou en contre-saison irriguée.' });

C('Persil / Coriandre / Basilic', 'Petroselinum / Coriandrum / Ocimum', 'epice', 70, 8, 32, [18, 27], [400, 900], 'moyen', [6.0, 7.5],
  ['limoneux', 'limono-sableux'], { cal: [10, 11, 12, 1, 2, 3], notes: 'Aromates à forte valeur ajoutée en zone urbaine : coupes répétées, culture en planches ou en pots.' });

C('Menthe / Citronnelle', 'Mentha / Cymbopogon', 'epice', 120, 8, 36, [18, 28], [600, 1300], 'eleve', [5.5, 7.5],
  ['limoneux', 'hydromorphe'], { cal: [4, 5, 6, 9, 10], notes: 'Cultures pérennes à coupes répétées ; citronnelle utile en haie répulsive contre certains insectes.' });

/* =====================================================================
   LÉGUMINEUSES-MARAÎCHAGE / CUCURBITACÉES
   ===================================================================== */
C('Tomate cerise / Tomate industrielle', 'Solanum lycopersicum var.', 'maraichage', 110, 12, 35, [20, 28], [500, 900], 'tres_eleve', [5.5, 7.0],
  ['limono-sableux'], { cal: [10, 11, 12, 1], yld: '15-40 t/ha', notes: 'Sélection à port déterminé pour la transformation (concentré, séchage).' });

C('Pastèque', 'Citrullus lanatus', 'maraichage', 95, 15, 40, [24, 32], [500, 1000], 'eleve', [6.0, 7.0],
  ['sableux', 'limono-sableux'],
  { spacing: '2 x 1,5 m', seed: '3-4 kg/ha', yld: '15-35 t/ha', cal: [11, 12, 1, 2, 3],
    pests: ['Oïdium', 'Mildiou', 'Pucerons', 'Fonte des semis'],
    notes: 'Culture de contre-saison très rentable en zone sahélienne. La pollinisation par les abeilles est indispensable : éviter les insecticides en pleine floraison. Déficit hydrique = fruits petits, excès = fruits fades.',
    stages: [['Semis / levée', 7, 'Semis en poquets de 3 graines, sol réchauffé'],
      ['Croissance rampante', 30, 'Éclaircissage, premier binage'],
      ['Floraison', 50, 'Pollinisation, irrigation régulière'],
      ['Grossissement des fruits', 75, 'Éviter les à-coups d\'arrosage (éclatement)'],
      ['Récolte', 95, 'Récolte aux heures fraîches, fruits à son maturité']] });

C('Melon / Cantaloup', 'Cucumis melo', 'maraichage', 100, 15, 38, [22, 30], [450, 900], 'eleve', [6.0, 7.5],
  ['sableux', 'limono-sableux'], { cal: [12, 1, 2], yld: '12-25 t/ha',
    pests: ['Oïdium', 'Mildiou', 'Pucerons', 'Mouches des fruits'], notes: 'Sensible à l\'excès d\'humidité en fin de cycle : réduire l\'irrigation pendant la maturation pour concentrer les sucres.' });

C('Concombre', 'Cucumis sativus', 'maraichage', 60, 15, 35, [22, 30], [500, 1000], 'tres_eleve', [6.0, 7.0],
  ['limono-sableux'], { cal: [10, 11, 12, 1, 2], spacing: '1,5 x 0,4 m', yld: '20-40 t/ha',
    pests: ['Mildiou', 'Oïdium', 'Aleurodes', 'Nématodes'], notes: 'Récolte tous les 2 jours pour maintenir la production. Tuteurage vertical recommandé.' });

C('Courge / Courgette / Giraumon', 'Cucurbita spp.', 'maraichage', 100, 12, 35, [20, 30], [500, 1000], 'moyen', [6.0, 7.0],
  ['limono-sableux', 'limoneux'], { cal: [4, 5, 6, 9, 10], yld: '15-30 t/ha',
    notes: 'Rustiques, bonnes en culture associée (maïs-courge), feuilles consommées comme légume.' });

C('Gombo de Guinée / Okra longue', 'Abelmoschus spp.', 'maraichage', 110, 15, 38, [24, 32], [700, 1300], 'eleve', [5.8, 7.5],
  ['limoneux'], { cal: [5, 6, 7], notes: 'Variante à fruits longs, appréciée sur les marchés urbains.' });

/* =====================================================================
   FRUITIERS (cultures pérennes de rente)
   ===================================================================== */
C('Ananas', 'Ananas comosus', 'fruit', 540, 15, 36, [22, 30], [1000, 1800], 'moyen', [4.5, 6.5],
  ['sableux', 'limono-sableux', 'ferralitique'],
  { spacing: 'Double rangée 60+40 x 25 cm', seed: '50 000-60 000 rejets/ha', yld: '40-80 t/ha',
    cal: [4, 5, 6, 9, 10], pests: ['Cochenille farineuse', 'Pourriture du cœur', 'Nématodes', 'Fourmis'],
    notes: 'Filière reine du plateau d\'Allada (Bénin) : la variété Cayenne lisse est destinée à l\'export. pH acide indispensable (4,5-6,0). Traitement floral (éthéphon) pour déclencher une floraison homogène après 8-10 mois. Attention au drainage : l\'ananas redoute l\'eau stagnante.',
    stages: [['Plantation des rejets', 0, 'Rejets sains de 300-500 g, sol acide bien drainé'],
      ['Installation / croissance foliaire', 150, 'Désherbage, fertilisation N-K'],
      ['Traitement floral', 250, 'Induction florale homogène (éthéphon)'],
      ['Fructification', 400, 'Protection solaire des fruits en saison sèche'],
      ['Récolte', 540, 'Récolte à maturité (chute du 1/3 des fleurons), 2e cycle sur rejets']] });

C('Bananier / Plantain', 'Musa spp.', 'fruit', 400, 14, 36, [24, 30], [1000, 2000], 'tres_eleve', [5.5, 7.0],
  ['limoneux', 'hydromorphe', 'ferralitique'],
  { spacing: '3 x 2 m (1 600 plants/ha)', seed: '1 500-2 000 rejets/ha', yld: '20-40 t/ha',
    cal: [3, 4, 5, 9, 10], pests: ['Nématodes', 'Charançon du bananier', 'Cercosporiose (maladie des raies noires)', 'Fusariose (TR4)', 'Bactériose du Moko'],
    notes: 'Culture pérenne la plus productive en valeur alimentaire. Oeilletonnage et élimination des rejets excédentaires. Effeuillage sanitaire des feuilles tachées, et surtout surveillance de la fusariose TR4 (interdiction absolue d\'introduire des plants suspects).',
    stages: [['Plantation (rejets)', 0, 'Rejets de 150-300 g, travail du sol profond'],
      ['Croissance végétative', 150, 'Ceinturage des rejets, désherbage, mulch'],
      ['Floraison', 250, 'Effeuillage sanitaire, irrigation régulière'],
      ['Grossissement des régimes', 320, 'Haubanage des régimes lourds'],
      ['Récolte / repousse', 400, 'Coupe du régime, conservation du rejet successeur']] });

C('Manguier', 'Mangifera indica', 'fruit', 1095, 10, 42, [24, 32], [500, 1500], 'moyen', [5.5, 7.5],
  ['ferralitique', 'limono-sableux', 'lateritique'],
  { spacing: '10 x 10 m (100 arbres/ha)', seed: 'Greffé de 1 an', yld: '8-20 t/ha en pleine production',
    cal: [5, 6, 7], pests: ['Mouche des fruits (Bactrocera dorsalis)', 'Anthracnose', 'Oïdium', 'Cochenilles', 'Charognards des fruits'],
    notes: 'Espèce de rente majeure d\'Afrique de l\'Ouest. Planter des variétés greffées (Kent, Keitt, Amélie, Brooks) pour la commercialisation. La lutte contre la mouche des fruits est déterminante : ramassage quotidien des fruits tombés et piégeage. Alternance de production naturelle (année « on » / « off »).',
    stages: [['Plantation (juvenile)', 0, 'Trou 60 cm, fumier, tuteur, paillage'],
      ['Installation', 365, 'Arrosage de secours, désherbage du plateau'],
      ['Formation de la charpente', 730, 'Taille de formation, fertilisation progressive'],
      ['Entrée en production', 1095, 'Taille sanitaire, contrôle de la mouche des fruits'],
      ['Pleine production', 1825, 'Fertilisation annuelle, récolte sélective']] });

C('Papayer', 'Carica papaya', 'fruit', 330, 15, 36, [22, 30], [800, 1500], 'eleve', [5.5, 7.0],
  ['limoneux', 'ferralitique'],
  { spacing: '2,5 x 2 m', seed: '1 plant/ha (hermaphrodites)', yld: '30-60 t/ha', cal: [3, 4, 5, 9, 10],
    pests: ['Virus de la tache annulaire (PRSV)', 'Mouche des fruits', 'Pucerons', 'Pourriture du collet'],
    notes: 'Production dès 9-11 mois : excellent retour sur investissement. Sensible au virus PRSV : éviter de planter près d\'anciennes papayeraies. Le sol ne doit jamais être engorgé, planter sur billons.',
    stages: defaultStages(330, 'fruit') });

C('Agrumes (oranger, citronnier, mandarinier)', 'Citrus spp.', 'fruit', 1095, 8, 38, [20, 30], [700, 1500], 'moyen', [5.5, 7.0],
  ['limono-sableux', 'ferralitique'],
  { spacing: '6 x 5 m', seed: 'Porte-greffe volkameriana ou bigaradier', yld: '15-30 t/ha en production',
    cal: [5, 6, 7], pests: ['Mineuse des agrumes', 'Mouche des fruits', 'Très fort au Coton', 'Pucerons (CTV)', 'Gommose'],
    notes: 'Le CTV (tristeza) est transmis par les pucerons : greffer sur porte-greffe tolérant (volkameriana). Le « mal de Coton » (dépérissement) est lié aux sols asphyxiants : planter sur buttes et améliorer le drainage.',
    stages: defaultStages(1095, 'fruit') });

C('Anacardier (cajou)', 'Anacardium occidentale', 'fruit', 1095, 12, 40, [25, 33], [600, 1500], 'faible', [5.0, 7.5],
  ['sableux', 'lateritique', 'ferralitique'],
  { spacing: '8 x 8 m', seed: 'Plants greffés ou semis directs', yld: '1-2 t/ha de noix brutes (0,8-1,5 kg/arbre)',
    cal: [6, 7, 8], pests: ['Punaise du cajou', 'Charançon des graines', 'Moisissures', 'Feu bactérien'],
    notes: 'Filière d\'export majeure du nord du Bénin (Gogounou, Kalalé, Tchaourou). Tolère les sols pauvres et la sécheresse : culture clé d\'aménagement des sols dégradés. Greffage pour réduire la période improductive (3 ans au lieu de 6-8).',
    stages: defaultStages(1095, 'fruit') });

C('Avocatier', 'Persea americana', 'fruit', 1460, 10, 32, [18, 28], [800, 1600], 'moyen', [5.5, 7.0],
  ['ferralitique', 'limoneux'], { spacing: '8 x 8 m', yld: '10-20 t/ha',
    pests: ['Phytophthora (pourriture racinaire)', 'Mites', 'Thrips', 'Pucerons'], notes: 'Exige un excellent drainage et un sol riche en matière organique. Variétés d\'altitude et zones fraîches recommandées.' });

C('Cocotier', 'Cocos nucifera', 'fruit', 1825, 18, 38, [25, 32], [1000, 2500], 'moyen', [5.5, 8.0],
  ['sableux', 'cotiere'], { spacing: '9 x 9 m (littoral)', yld: '60-120 noix/arbre/an',
    pests: ['Rhinocéros du cocotier', 'Lépidoptères défoliateurs', 'Pourriture du cœur (mortalité du cocotier)'],
    notes: 'Réservé au littoral sableux. Utiliser des variétés hybrides naines (PB121) pour une entrée en production rapide (3-4 ans). Très sensible à l\'eau stagnante.' });

C('Palmier à huile', 'Elaeis guineensis', 'olagineux', 1460, 15, 38, [25, 32], [1500, 2500], 'eleve', [5.0, 7.0],
  ['ferralitique', 'hydromorphe', 'limoneux'],
  { spacing: '9 x 9 m (140 arbres/ha)', seed: 'Plants pré-germés en pépinière', yld: '15-25 t/ha de régimes',
    cal: [3, 4, 5, 9, 10], pests: ['Charançon des jeunes plantations (Oryctes)', 'Fusariose', 'Coeléonomenodera', 'Rats'],
    notes: 'Culture industrielle majeure du sud du Bénin (huile rouge, huile de palme). Gestion des feuilles : coupe des frondes basses sous la couronne. Se combine bien avec pisciculture et élevage (tourteaux).',
    stages: defaultStages(1460, 'olagineux') });

C('Cacaoyer', 'Theobroma cacao', 'fruit', 1095, 15, 33, [22, 28], [1500, 2500], 'tres_eleve', [5.5, 7.0],
  ['ferralitique', 'limoneux', 'argileux'],
  { spacing: '3 x 3 m sous ombrage', seed: '300-400 g/ha en pépinière', yld: '0,8-1,5 t/ha de fèves sèches',
    cal: [4, 5, 6], pests: ['Pourriture brune (Phytophthora megakarya)', 'Mirides (Sahlbergella)', 'Swollen shoot (virus)', 'Foreurs de cabosse'],
    notes: 'Nécessite un ombrage régulé (bananier, érythrine, cacaoyer d\'ombrage) et une forte humidité atmosphérique. La pourriture brune et les mirides sont les deux causes majeures de perte : élagage de drainage + ramassage des cabosses malades + traitements anti-mirides ciblés.',
    stages: [['Pépinière', 180, 'Semences de qualité, ombrage 50 %'],
      ['Plantation sous ombrage', 365, 'Ombrage provisoire (bananier), paillage'],
      ['Installation / croissance', 730, 'Élagage de l\'ombrage, fertilisation, désherbage'],
      ['Entrée en production', 1095, 'Taille sanitaire, ramassage des cabosses malades'],
      ['Pleine production', 1825, 'Écabossage, fermentation 6 j, séchage lent']] });

C('Caféier (robusta / arabica)', 'Coffea spp.', 'fruit', 1095, 12, 32, [18, 26], [1200, 2200], 'eleve', [5.5, 7.0],
  ['ferralitique', 'limoneux'],
  { spacing: '3 x 1,5 m (robusta)', seed: 'Pépinière 12 mois', yld: '0,5-1,5 t/ha de café marchand',
    cal: [4, 5, 6], pests: ['Scolyte des baies', 'Rouille orangée', 'Cercosporiose', 'Nématodes'],
    notes: 'Robusta pour les zones chaudes et humides, arabica pour l\'altitude fraîche (> 1000 m). Taille de régénération des rameaux épuisés indispensable. Traiter contre la rouille dès l\'apparition des premières taches.',
    stages: defaultStages(1095, 'fruit') });

C('Goyavier', 'Psidium guajava', 'fruit', 400, 12, 38, [22, 30], [800, 1800], 'moyen', [5.0, 7.5],
  ['sableux', 'limono-sableux'], { spacing: '4 x 5 m', yld: '15-30 t/ha',
    pests: ['Mouche des fruits', 'Cochenilles', 'Anthracnose', 'Nématodes'], notes: 'Fructification rapide (10-12 mois), très riche en vitamine C. Taille annuelle pour contrôler la hauteur et la qualité.' });

C('Safoutier / Prunier du Natal / Fruitiers locaux', 'Dacryodes / Carissa / Irvingia', 'fruit', 1460, 12, 38, [24, 32], [700, 1800], 'faible', [5.0, 7.5],
  ['ferralitique', 'sableux'], { cal: [5, 6, 7], notes: 'Ensemble des fruitiers autochtones (safoutier, aké, néré, baobab, tamarinier, karité) : rusticité remarquable, valeur marchande croissante (beurre de karité, néré fermenté).' });

C('Tamarínier / Baobab / Karité', 'Tamarindus / Adansonia / Vitellaria', 'forestier', 2555, 10, 45, [26, 36], [300, 1000], 'faible', [5.0, 8.0],
  ['lateritique', 'sableux', 'ferralitique'],
  { spacing: '10 x 10 m', yld: 'Variable (fruit / graine)', cal: [6, 7],
    notes: 'Agroforesterie : ombrage, brise-vent, fertilité, produits forestiers non ligneux (PFLN). Le karité rapporte du beurre très valorisé sur les marchés internationaux.' });

C('Pomme de Cythère / Cerisier des Antilles', 'Spondias / Malpighia', 'fruit', 400, 14, 38, [23, 32], [700, 1600], 'moyen', [5.5, 7.5],
  ['limono-sableux'], { cal: [4, 5], notes: 'Fruitiers secs de diversification, adaptés aux sols pauvres.' });

C('Vigne (zones d\'altitude / irrigation)', 'Vitis vinifera', 'fruit', 700, 5, 36, [18, 30], [400, 800], 'eleve', [6.0, 8.0],
  ['limono-sableux', 'lateritique'], { cal: [11, 12, 1], notes: 'Possible uniquement en zone fraîche ou avec irrigation maîtrisée (raisonnement hydrique pour concentrer les sucres).' });

C('Corossolier / Anone', 'Annona spp.', 'fruit', 1095, 14, 34, [22, 30], [1000, 1800], 'moyen', [5.5, 7.0],
  ['ferralitique'], { cal: [4, 5], notes: 'Fruits très appréciés localement, à valoriser en transformation (jus, glace).' });

/* =====================================================================
   CULTURES INDUSTRIELLES & DE RENTE
   ===================================================================== */
C('Coton', 'Gossypium hirsutum', 'fibre', 160, 15, 38, [24, 32], [600, 1200], 'eleve', [5.8, 8.0],
  ['limono-sableux', 'ferralitique', 'argileux'],
  { spacing: '80 x 30 cm (40 000 pieds/ha)', seed: '25-35 kg/ha', yld: '0,8-1,8 t/ha de coton graine',
    cal: [5, 6], pests: ['Chenilles de la capsule (Helicoverpa, Earias)', 'Puceron', 'Jasside', 'Aleurode', 'Mouche blanche', 'Verticilliose'],
    notes: 'Première culture de rente du nord du Bénin. L\'itinéraire technique est cadré par les campagnes cotonnières : semis précoce dès les premières pluies utiles (juin), écartement et démariage à 3 semaines, traitement phyto obligatoire tous les 14 jours, épandage d\'engrais (urée + complexe) en 2 apports. Récolte manuelle sélective (2-3 passages) et pesée obligatoire.',
    stages: [['Semis / levée', 8, 'Semis dès 30-40 mm de pluie, sol bien préparé'],
      ['Démariage / croissance', 30, 'Éclaircir à 2 plants/poquet, premier sarclage'],
      ['Boutons floraux', 55, 'Traitements phytosanitaires toutes les 2 semaines'],
      ['Floraison', 75, 'Besoin en eau maximal, surveiller les piqueurs'],
      ['Capsulaison', 110, 'Protection des capsules, apport de potasse'],
      ['Ouverture des capsules / récolte', 160, 'Récolte manuelle à 3 passages, séchage rapide']] });

C('Arachide de bouche / Arachide oléagineuse (groupe)', 'Arachis hypogaea var.', 'olagineux', 120, 12, 40, [25, 31], [500, 1200], 'moyen', [5.8, 7.0],
  ['sableux'], { cal: [6, 7], yld: '1,2-2,5 t/ha', notes: 'Variétés tardives pour reconversion en huile ; tri sévère des gousses pour éviter les aflatoxines.' });

C('Sésame', 'Sesamum indicum', 'olagineux', 100, 15, 42, [25, 34], [400, 800], 'faible', [5.5, 8.0],
  ['sableux', 'limono-sableux'],
  { spacing: '50 x 20 cm', seed: '4-6 kg/ha', yld: '0,5-1,2 t/ha', cal: [6, 7],
    pests: ['Pucerons', 'Chenilles des capsules', 'Bactériose', 'Égrenage à la récolte'],
    notes: 'Culture d\'export à haute valeur (graine et huile). Tolère la sécheresse. Le principal risque est l\'égrenage : récolter dès la maturité des capsules basses et couper les tiges pour séchage en meule.',
    stages: defaultStages(100, 'olagineux') });

C('Soja (groupe tardif)', 'Glycine max', 'olagineux', 130, 12, 34, [22, 30], [600, 1100], 'eleve', [6.0, 7.0],
  ['limoneux'], { cal: [6, 7], notes: 'Groupe tardif pour rendements supérieurs en zone soudano-guinéenne.' });

C('Tournesol', 'Helianthus annuus', 'olagineux', 110, 8, 34, [20, 28], [400, 800], 'moyen', [6.0, 7.5],
  ['limono-sableux', 'argileux'], { cal: [10, 11, 6], spacing: '70 x 30 cm', yld: '1-2,5 t/ha',
    pests: ['Mildiou', 'Oiseaux', 'Sclérotiniose', 'Chenilles'], notes: 'Culture de contre-saison de diversification ; les oiseaux peuvent ruiner la récolte sans surveillance.' });

C('Arachide / Colza / Carthame (oléagineux secondaires)', 'Brassica / Carthamus', 'olagineux', 120, 5, 35, [18, 28], [400, 800], 'moyen', [6.0, 7.5],
  ['limoneux'], { cal: [10, 11], notes: 'Oléagineux de diversification pour l\'huile et le tourteau (alimentation animale).' });

C('Canne à sucre', 'Saccharum officinarum', 'fibre', 400, 15, 38, [26, 34], [1200, 2000], 'tres_eleve', [5.5, 7.5],
  ['argileux', 'limoneux', 'hydromorphe'],
  { spacing: 'Rangées 1,4 m', seed: 'Boutures de 3-4 yeux (8-10 t/ha)', yld: '60-120 t/ha de cannes',
    cal: [3, 4, 5], pests: ['Foreur de tige', 'Puceron de la canne', 'Charançon', 'Maladie de Fidji', 'Rats'],
    notes: 'Nécessite un périmètre irrigué ou une pluviométrie élevée. Trois coupes possibles sur une même plantation. Très grande consommatrice d\'eau : le pilotage de l\'irrigation détermine la richesse en sucre.',
    stages: defaultStages(400, 'fibre') });

C('Jatropha / Pourghère', 'Jatropha curcas', 'olagineux', 1095, 12, 42, [24, 34], [300, 900], 'faible', [5.0, 8.0],
  ['lateritique', 'sableux', 'argileux'],
  { spacing: '2 x 2 m (2 500 plants/ha)', yld: '1-3 t/ha de graines', cal: [6, 7],
    notes: 'Culture à huile végétale (agrocarburant, savon). Résiste remarquablement à la sécheresse et valorise les sols dégradés ; sert de haie vive répulsive contre le bétail.' });

C('Ricín', 'Ricinus communis', 'olagineux', 200, 12, 40, [24, 32], [400, 900], 'faible', [5.5, 8.0],
  ['lateritique', 'sableux'], { cal: [6, 7], notes: 'Huile industrielle ; plante très rustique, attention à la toxicité des graines (animaux, enfants).' });

C('Hévéa (caoutchouc)', 'Hevea brasiliensis', 'forestier', 2190, 18, 36, [25, 32], [1500, 2500], 'eleve', [4.5, 6.5],
  ['ferralitique', 'limoneux'], { spacing: '6 x 3 m (550 arbres/ha)', yld: '1,5-2,5 t/ha de caoutchouc sec',
    cal: [4, 5, 6], pests: ['Fomes (pourriture des racines)', 'Corynespora', 'Oïdium', 'Fourmis défoliatrices'],
    notes: 'Saignée après 6-7 ans. Zone guinéenne humide uniquement. Filière lourde : prévoir la main-d\'œuvre qualifiée et la logistique de coagulation.' });

C('Rotin / Bambou', 'Calamus / Bambusa', 'forestier', 1095, 12, 38, [24, 32], [1200, 2500], 'eleve', [5.0, 7.0],
  ['bas-fond', 'hydromorphe'], { cal: [4, 5, 6], notes: 'Production artisanale (meubles, vannerie) ; protection des berges et des bas-fonds.' });

C('Kenaf / Roselle (oseille de Guinée)', 'Hibiscus cannabinus / sabdariffa', 'fibre', 150, 12, 38, [24, 32], [500, 1100], 'moyen', [5.5, 7.5],
  ['limono-sableux', 'lateritique'],
  { spacing: '50 x 20 cm', seed: '10-15 kg/ha', yld: '1-2 t/ha (fibre) ou 0,5-1 t/ha (calices)', cal: [6, 7],
    notes: 'Double usage : fibre (sacs, cordages) et calices d\'oseille de Guinée pour le jus (bissap), très rentables en transformation locale.' });

C('Vétiver / Citronnelle industrielle', 'Chrysopogon zizanioides', 'fourrage', 240, 8, 42, [22, 34], [400, 1500], 'moyen', [5.0, 8.0],
  ['lateritique', 'argileux'], { cal: [4, 5, 6], notes: 'Utilisé pour la stabilisation des sols, la lutte antifrosive et l\'huile essentielle.' });

C('Arbre à miel / Plantations mellifères', '—', 'forestier', 1095, 12, 38, [24, 32], [700, 1500], 'faible', [5.0, 7.5],
  ['lateritique'], { cal: [5, 6], notes: 'Association d\'espèces mellifères (acacia, anacardier, calliandra) pour la production de miel, revenu complémentaire sans concurrence avec les cultures.' });

C('Moringa', 'Moringa oleifera', 'forestier', 90, 12, 40, [25, 35], [350, 1200], 'faible', [5.0, 8.0],
  ['sableux', 'lateritique', 'limono-sableux'],
  { spacing: '1 x 1 m (fourrage) ou 3 x 3 m (graines)', seed: '0,5-1 kg/ha',
    yld: '20-60 t/ha de matière verte (coupes)', cal: [4, 5, 6, 9, 10],
    notes: 'Légume-feuille et fourrage exceptionnel : 4-8 coupes par an, richesse en protéines et vitamines. Pousse même sur sols pauvres, sert de haie vive et de brise-vent. Purifie l\'eau (floculant).',
    stages: [['Semis / plantation', 0, 'Semis direct ou boutures de 1 m'],
      ['Installation', 60, 'Désherbage, éclaircissage'],
      ['Premières coupes', 120, 'Récépée à 30-50 cm pour stimuler la ramification'],
      ['Régime de coupes', 200, 'Coupes toutes les 6-8 semaines, séchage à l\'ombre'],
      ['Production / graines', 365, 'Récolte des gousses pour semences et huile']] });

C('Néré / Nèbé (Parkia biglobosa)', 'Parkia biglobosa', 'forestier', 2190, 12, 42, [25, 35], [500, 1300], 'faible', [5.0, 8.0],
  ['lateritique', 'sableux'], { cal: [6, 7], notes: 'Arbre d\'agroforesterie majeur : gousses fermentées (soumbala/néré) très valorisées. Pousse sur les sols dégradés du nord du Bénin.' });

/* =====================================================================
   FOURRAGES & PÂTURAGES
   ===================================================================== */
C('Brachiaria / Herbe de Guinée', 'Brachiaria ruziziensis / Panicum maximum', 'fourrage', 120, 12, 40, [24, 34], [700, 1500], 'moyen', [5.0, 7.5],
  ['ferralitique', 'limono-sableux'],
  { spacing: 'Semis en lignes 40 cm ou éclats de souche', seed: '8-12 kg/ha', yld: '15-35 t MS/ha/an',
    cal: [4, 5, 6, 7], pests: ['Chenilles défoliatrices', 'Pucérons des graminées', 'Charançon'],
    notes: 'Base des kikuyu / brachiaria en élevage intensif. Coupes toutes les 5-7 semaines pour éviter la lignification. Répond très bien à la fertilisation organique.',
    stages: defaultStages(120, 'fourrage') });

C('Luzerne', 'Medicago sativa', 'fourrage', 240, 5, 32, [18, 26], [400, 900], 'eleve', [6.5, 8.0],
  ['limoneux', 'argileux'], { cal: [11, 12, 1], yld: '12-25 t MS/ha/an',
    notes: 'Légumineuse fourragère très protéique (18-22 % MAT) : nécessite un sol profond, drainé et non acide (chaulage). Coupes toutes les 4-5 semaines.' });

C('Vesce / Pois fourrager / Vesce-avoine', 'Vicia / Pisum / Avena', 'fourrage', 120, 4, 28, [15, 24], [400, 800], 'moyen', [6.0, 7.5],
  ['limoneux'], { cal: [11, 12], notes: 'Mélange semé en contre-saison pour l\'ensilage ou le foin : bon apport protéique.' });

C('Stylosanthes / Centrosema', 'Stylosanthes / Centrosema', 'fourrage', 180, 12, 38, [24, 34], [600, 1500], 'faible', [4.5, 7.0],
  ['lateritique', 'sableux'], { cal: [5, 6], notes: 'Légumineuse fourragère rustique, enrichit le sol en azote et améliore la valeur du pâturage naturel ; très utile en association avec brachiaria.' });

C('Maïs fourrager / Ensilage', 'Zea mays (ensilage)', 'fourrage', 100, 10, 36, [20, 30], [500, 1200], 'eleve', [5.5, 7.5],
  ['limono-sableux', 'limoneux'], { spacing: 'Semis dense 70 x 15 cm', seed: '60-80 kg/ha',
    yld: '35-55 t/ha de matière verte', cal: [4, 5, 9, 10],
    notes: 'Culture d\'ensilage : semis dense, récolte au stade laiteux-pâteux (30-35 % MS). Stocker en silo bâché ou fosse pour l\'alimentation des ruminants en saison sèche.' });

C('Moringa fourrager (haies)', 'Moringa oleifera', 'fourrage', 90, 12, 40, [25, 35], [350, 1200], 'faible', [5.0, 8.0],
  ['sableux'], { spacing: 'Haies 0,5 m sur rang', yld: '20-60 t/ha de feuilles/an', cal: [4, 5, 6, 9, 10],
    notes: 'Haie fourragère à haute teneur protéique pour les chèvres, lapins et volailles.' });

C('Pâturage naturel amélioré / Prairie', 'Chloris / Andropogon / Pennisetum', 'fourrage', 200, 12, 40, [24, 34], [500, 1200], 'faible', [4.5, 7.0],
  ['lateritique', 'sableux', 'ferralitique'], { cal: [5, 6], notes: 'Prairies savanicoles du Nord-Bénin à régénérer : rotation des pâturages, mise en défens saisonnière, légumineuses apportées pour enrichir la valeur fourragère.' });

C('Teff fourrager / Fourrage d\'appoint', '—', 'fourrage', 80, 10, 38, [22, 32], [300, 800], 'faible', [5.0, 8.0],
  ['sableux', 'lateritique'], { cal: [6, 7], notes: 'Fourrage de soudure à cycle ultra-court sur sols marginaux (anicet, teff).' });

/* =====================================================================
   ÉPICES, PLANTES AROMATIQUES ET INDUSTRIELLES DIVERSES
   ===================================================================== */
C('Poivre noir / Poivre de Guinée', 'Piper nigrum / Xylopia aethiopica', 'epice', 1095, 18, 34, [24, 30], [1500, 2500], 'eleve', [5.5, 7.0],
  ['ferralitique'], { spacing: '2 x 2 m avec tuteurs vivants', yld: '1-3 kg de poivre sec/pied',
    cal: [4, 5], notes: 'Cultures pérennes de sous-bois, à l\'ombre partielle : filière de niche à forte valeur.' });

C('Curcuma / Gingembre', 'Curcuma longa / Zingiber officinale', 'epice', 240, 15, 34, [24, 30], [1200, 2000], 'eleve', [5.5, 7.0],
  ['ferralitique', 'limoneux'],
  { spacing: 'Billons 1 m, 25 x 20 cm', seed: '1,5-2,5 t/ha de rhizomes', yld: '15-25 t/ha de rhizomes frais',
    cal: [4, 5, 6], pests: ['Flétrissement bactérien (Ralstonia)', 'Pourriture du rhizome', 'Nématodes', 'Charançon'],
    notes: 'Cultures à très forte valeur ajoutée en transformation (poudre, huile essentielle). Sol meuble, frais, bien drainé, ombrage léger souhaitable. Reposez la parcelle 3-4 ans avant retour (maladie du flétrissement).',
    stages: defaultStages(240, 'epice') });

C('Piment séché / Piment de Cayenne (transformation)', 'Capsicum frutescens', 'epice', 140, 15, 38, [24, 33], [600, 1100], 'eleve', [5.8, 7.5],
  ['limono-sableux'], { cal: [9, 10, 11], yld: '3-8 t/ha séché',
    notes: 'Variétés à haut degré de piquant destinées au séchage (sauce piment, poudre). Séchage solaire à 45-50 °C maximum pour préserver la couleur.' });

C('Vanille', 'Vanilla planifolia', 'epice', 1095, 18, 32, [22, 28], [1500, 2500], 'eleve', [5.5, 7.0],
  ['ferralitique'], { spacing: '1 x 1 m sur tuteurs vivants', yld: '0,5-1 kg de gousses séchées/pied',
    cal: [4, 5], notes: 'Nécessite une pollinisation manuelle fleur par fleur. Filière très exigeante et très rémunératrice en zone forestière humide.' });

C('Ricin, oignon séché, hibiscus (filières de transformation)', '—', 'epice', 150, 12, 38, [24, 32], [450, 1000], 'moyen', [5.5, 8.0],
  ['limono-sableux'], { cal: [6, 7, 10, 11], notes: 'Filières de valorisation locale (transformation, séchage, conditionnement) : utiles aux groupements de producteurs.' });

C('Sésame noir / Nigelle', 'Sesamum / Nigella', 'epice', 100, 15, 40, [25, 34], [400, 800], 'faible', [5.5, 8.0],
  ['sableux'], { cal: [6, 7], notes: 'Épices et graines oléagineuses secondaires à débouché d\'export.' });

C('Papaye / Mangue (séchage et transformation)', 'Carica / Mangifera', 'epice', 400, 14, 38, [22, 32], [800, 1600], 'eleve', [5.5, 7.0],
  ['limono-sableux'], { cal: [4, 5], notes: 'Filière séchage artisanal : réduit les pertes post-récolte et augmente la marge (chips de mangue, papaye séchée).' });

C('Aloès vera', 'Aloe vera', 'epice', 400, 10, 40, [22, 34], [250, 700], 'faible', [6.0, 8.5],
  ['sableux', 'lateritique', 'latéritique'], { spacing: '60 x 60 cm', yld: '8-20 t/ha de feuilles',
    cal: [4, 5, 6, 9, 10], notes: 'Plante CAM qui tolère parfaitement la sécheresse. Utilisée en cosmétique et pharmacopée : filière de niche adaptée aux sols marginaux.' });

/* =====================================================================
   ÉLEVAGE
   ===================================================================== */
C('Poulet de chair', 'Gallus gallus domesticus', 'elevage', 49, 18, 32, [20, 28], [0, 0], 'moyen', [0, 0],
  ['urbaine'],
  { spacing: '10-12 sujets/m²', seed: 'Poussins d\'un jour sexés', yld: '2,0-2,5 kg/sujet en 6-7 semaines',
    cal: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    pests: ['Coccidiose', 'Newcastle', 'Colibacillose', 'Aspergillose', 'Chaleur (stess thermique)>32 °C', 'Rats et prédateurs'],
    notes: 'Neuf étapes : préparation et désinfection du poulailler (10 j avant), source de chaleur (poussinière 32-34 °C la première semaine, -2 à -3 °C par semaine), densité respectée, eau propre à volonté, aliment démarrage (0-3 sem) puis croissance/finition, programme de prophylaxie (vaccins Newcastle + Gumboro), litière sèche et ventilée, contrôle des ambiances. Au-delà de 32 °C, mortalité par stress thermique : ventiler la nuit, agrandir la surface, distribuer l\'aliment aux heures fraîches.',
    stages: [['Préparation / désinfection', 0, 'Désinfecter 10 j avant, litière propre, poussinière à 32-34 °C'],
      ['Démarrage (0-3 semaines)', 21, 'Aliment démarrage, eau tiède propre, lumière 23 h'],
      ['Croissance (3-5 semaines)', 35, 'Ajuster la densité, ventiler, compléter le vaccin Gumboro'],
      ['Finition (5-7 semaines)', 49, 'Aliment finition, tri des sujets, préparation de la vente'],
      ['Vente / vide sanitaire', 56, 'Vide sanitaire de 15 j minimum entre deux bandes']] });

C('Poule pondeuse', 'Gallus gallus domesticus', 'elevage', 500, 18, 32, [20, 28], [0, 0], 'moyen', [0, 0],
  ['urbaine'], { spacing: '5-6 poules/m² (avec aire de parcours)', seed: 'Poulettes de 18 semaines',
    yld: '280-320 œufs/poule/an', cal: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    pests: ['Newcastle', 'Coccidiose', 'Poux rouges', 'Vers intestinaux', 'Moisissures de l\'aliment'],
    notes: 'Phase de ponte de 18 à 90 semaines : 16 h de lumière par jour, aliment ponte calcium à 3,5-4 %, et surtout pas de stress (bruit, chaleur, déplacement). Les poules pondeuses supportent mal la chaleur : abreuvoirs à l\'ombre, ventilation nocturne.',
    stages: defaultStages(500, 'elevage') });

C('Poulet local / Poule locale améliorée', 'Gallus gallus domesticus', 'elevage', 180, 16, 34, [20, 30], [0, 0], 'faible', [0, 0],
  ['urbaine'], { yld: '1,2-1,8 kg en 5-6 mois', cal: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    notes: 'Race rustique très résistante : élevage semi-extensif à faible coût, adapté à l\'autoconsommation et aux marchés de fêtes.' });

C('Pintade', 'Numida meleagris', 'elevage', 150, 16, 36, [22, 32], [0, 0], 'faible', [0, 0],
  ['soudanienne'], { spacing: '8-10/m²', yld: '1,2-1,5 kg en 5 mois', cal: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    pests: ['Rougeole/Newcastle', 'Coccidiose', 'Prédateurs (faucons, rapaces) en divagation'],
    notes: 'Bonne rusticitée et valeur marchande élevée. Les pintadeaux sont fragiles les 3 premières semaines (chaleur, humidité).' });

C('Canard / Canard de Barbarie', 'Cairina moschata', 'elevage', 80, 15, 34, [20, 30], [0, 0], 'moyen', [0, 0],
  ['bas-fond', 'cotiere'], { spacing: '4-5/m²', yld: '2,5-3,5 kg en 10-12 semaines', cal: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    pests: ['Pasteurellose', 'Aspergillose', 'Botulisme (eaux stagnantes)', 'Rats'],
    notes: 'Apprécie un point d\'eau propre. Éviter les mares stagnantes à risque de botulisme. Croissance rapide et bonne rusticité en zone côtière et bas-fonds.',
    stages: defaultStages(80, 'elevage') });

C('Dinde / Dindon', 'Meleagris gallopavo', 'elevage', 140, 18, 32, [20, 28], [0, 0], 'moyen', [0, 0],
  ['urbaine'], { yld: '6-10 kg en 4-5 mois', cal: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    pests: ['Entérite hémorragique', 'Coccidiose', 'Chaleur', 'Blessures et picage'],
    notes: 'Forte valeur pour les fêtes (Noël, Tabaski). Sensible aux courants d\'air : litière épaisse, ambiance stable.' });

C('Caille', 'Coturnix coturnix japonica', 'elevage', 45, 18, 32, [20, 28], [0, 0], 'moyen', [0, 0],
  ['urbaine'], { spacing: '40-50/m² en cages', yld: '150-250 œufs/femelle/an', cal: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    notes: 'Élevage à très forte densité adapté aux espaces urbains réduits : rentabilité rapide, cycle court, faible besoin en surface.' });

C('Lapin', 'Oryctolagus cuniculus', 'elevage', 90, 10, 28, [15, 24], [0, 0], 'moyen', [0, 0],
  ['urbaine', 'montagne'], { spacing: '1 lapin/m² (cages 0,5 m² par adulte)',
    yld: '2,2-2,8 kg en 3 mois (4-6 lapereaux/portée)', cal: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    pests: ['Coccidiose', 'Pasteurellose', 'Gale des oreilles', 'Myxomatose', 'Chaleur (>28 °C = risque de mortalité)'],
    notes: 'Espèce très sensible à la chaleur : au-delà de 28 °C, risque élevé de mort subite. Ventiler la cuniculture naturelle, éviter le plein soleil et l\'humidité. Alimentation : fourrage vert + granulés, eau propre. Bonne source de protéines pour la famille.',
    stages: defaultStages(90, 'elevage') });

C('Chèvre laitière / Chèvre Djallonké', 'Capra aegagrus hircus', 'elevage', 400, 8, 40, [18, 32], [0, 0], 'faible', [0, 0],
  ['sahel', 'soudano-sahel', 'soudanienne'], { spacing: '1,5 m²/caprin en bâtiment',
    yld: '1-2 L de lait/jour (laitière) ou 25-35 kg de poids vif', cal: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    pests: ['Peste des petits ruminants (PPR)', 'Parasites internes', 'Gale', 'Tiques', 'Mortalité des chevreaux'],
    notes: 'Élevage néo-zélandais :Djallonké = race trypanotolérante et prolifique, excellente pour l\'Afrique de l\'Ouest humide. Associé à la chèvre rousse de Maradi pour la production laitière. Soins : déparasitage régulier, vaccination PPR annuelle, abri sec surélevé.',
    stages: defaultStages(400, 'elevage') });

C('Mouton (Djallonké, Sahelien, Peul)', 'Ovis aries', 'elevage', 300, 10, 40, [18, 32], [0, 0], 'faible', [0, 0],
  ['sahel', 'soudano-sahel', 'soudanienne'], { yld: '35-50 kg de poids vif en 12 mois',
    cal: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    pests: ['PPR', 'Strongylose', 'Oestres (mouches nasales)', 'Tiques', 'Douve (zones humides)'],
    notes: 'Filière très liée aux fêtes religieuses (Tabaski) : planifier les naissances 8-10 mois avant pour vendre au meilleur prix. Mouton sahélien à queue courte pour les zones sèches, Djallonké pour la zone humide.',
    stages: defaultStages(300, 'elevage') });

C('Bovin (zébu, taurin, Girolando)', 'Bos taurus indicus', 'elevage', 400, 5, 40, [18, 32], [0, 0], 'moyen', [0, 0],
  ['sahel', 'soudano-sahel', 'soudanienne'], { spacing: '10-15 m²/animal en stabulation',
    yld: '120-180 kg de carcasse (3-4 ans) ou 5-15 L de lait/jour (croisé)', cal: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    pests: ['Trypanosomose (mouche tsé-tsé)', 'Dermatophilose', 'Fièvre aphteuse', 'Tiques', 'Charbon bactéridien'],
    notes: 'Zébu pour la zone nord, taurin trypanotolérant (Baoulé, Somba) pour la zone humide. Embouche paysanne (achat en saison sèche, engraissement), production laitière en croisement Girolando. Abreuvement 30-50 L/jour, complément minéral (pierre à lécher).',
    stages: defaultStages(400, 'elevage') });

C('Porc', 'Sus scrofa domesticus', 'elevage', 180, 12, 30, [18, 26], [0, 0], 'moyen', [0, 0],
  ['urbaine'], { spacing: '1 m²/porc en engraissement, 2 m²/truie + porcelets',
    yld: '80-100 kg en 6-7 mois', cal: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    pests: ['Peste porcine africaine', 'Colibacillose', 'Verminose', 'Chaleur et humidité', 'Encéphalose'],
    notes: 'Le porc convertit bien les sous-produits et déchets (alimentation à moindre coût). Espèce sensible à la chaleur : bâtiment ombragé, sol béton lavable, pédiluve. La peste porcine africaine est sans traitement : biosécurité stricte obligatoire.',
    stages: defaultStages(180, 'elevage') });

C('Aulacode / Aulacodine (rat géant)', 'Thryonomys swinderianus', 'elevage', 240, 15, 32, [22, 28], [0, 0], 'faible', [0, 0],
  ['guineenne', 'soudano-guineenne'], { spacing: '0,5 m²/aulacode',
    yld: '3-5 kg en 7-8 mois (24 kg/an/animal en production)', cal: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    pests: ['Coccidiose', 'Stress et cannibalisme (surdensité)', 'Chaleur', 'Voracité en herbe (alimentation)'],
    notes: 'Viande très appréciée (« viande de brousse » maîtrisée). Alimentation : fourrage vert (graminées, légumineuses, feuilles de manioc), 8-10 kg de fourrage/kg de poids produit. Bâtiment calme, semi-obscur, abrité du vent. Filière en fort développement au Bénin.',
    stages: defaultStages(240, 'elevage') });

C('Héliciculture (escargots géants africains)', 'Achatina achatina', 'elevage', 300, 15, 30, [22, 27], [0, 0], 'faible', [0, 0],
  ['guineenne'], { spacing: '20-30 escargots/m²', yld: '120-200 g/escargot en 10-12 mois',
    cal: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    pests: ['Fourmis (prédateurs)', 'Rats', 'Nématodes', 'Sécheresse (estivation)', 'Excès d\'humidité (pourriture)'],
    notes: 'Élevage à faible investissement dans un enclos grillagé humide et ombragé (sous bananiers). pH du sol entre 7 et 8 (apport de cendre ou de calcaire moulu pour la coquille). Nourrir avec des feuilles (papaye, chou, patate douce, amarante) et du son.',
    stages: defaultStages(300, 'elevage') });

C('Apiculture (abeille mellifère)', 'Apis mellifera adansonii', 'elevage', 365, 12, 40, [20, 35], [400, 1500], 'faible', [0, 0],
  ['soudanienne', 'soudano-guineenne', 'guineenne'], { spacing: 'Ruches espacées de 500 m environ',
    yld: '10-25 kg de miel/ruche/an en bonnes conditions', cal: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    pests: ['Varroa (moins fréquent en Afrique)', 'Grands fourmis', 'Souris', 'Hyènes', 'Abeille parasite (Aethina, faux teigne)'],
    notes: 'L\'abeille est un pollinisateur essentiel : rapprocher les ruches des cultures (fruitiers, cucurbitacées, coton) augmente les rendements. Ruches à barrettes ou ruches modernes. ATTENTION : ne jamais traiter les cultures en fleurs avec des insecticides — respecter la période d\'application et prévenir les apiculteurs du secteur.',
    stages: [['Installation des ruches', 0, 'Emplacement ombragé, orienté, loin du passage des animaux'],
      ['Développement de la colonie', 60, 'Contrôle sanitaire, laisser la colonie se renforcer'],
      ['Récolte principale', 120, 'Récolter le surplus, réserver 3-4 barrettes de miel à la colonie'],
      ['Miellées secondaires', 240, 'Surveiller la famine (saison sèche), nourrir si nécessaire'],
      ['Entretien et division', 365, 'Division des colonies fortes pour multiplier le cheptel']] });

C('Cuniculture urbaine (lapins angora / mixtes)', 'Oryctolagus cuniculus', 'elevage', 120, 12, 28, [16, 24], [0, 0], 'moyen', [0, 0],
  ['urbaine'], { yld: '3-4 kg de fourrure/pelote', cal: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    notes: 'Filière de niche (fourrure, angora), mêmes contraintes thermiques que le lapin ordinaire.' });

C('Élevage mixte intégré (animal + culture + pisciculture)', '—', 'elevage', 365, 10, 40, [18, 32], [0, 0], 'faible', [0, 0],
  ['soudanienne'], { yld: 'Marge globale +30 à 60 % selon l\'intégration', cal: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    notes: 'Système intégré « élevage-volaille-pisciculture-maraîchage » : la litière du poulailler alimente l\'étang (plancton), l\'eau de l\'étang irrigue le maraîchage, le fond de l\'étang fertilise les planches. Boucle les nutriments et réduit les coûts d\'intrants (aliment, engrais).' });

C('Cochon d\'Inde / Micro-élevage protéique', 'Cavia porcellus', 'elevage', 90, 15, 28, [18, 25], [0, 0], 'faible', [0, 0],
  ['urbaine'], { yld: '0,8-1,2 kg en 3 mois', cal: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    notes: 'Copy farming de sécurité alimentaire, très faible coût, adapté aux petits espaces et aux ménages.' });

/* =====================================================================
   PISCICULTURE & AQUACULTURE
   ===================================================================== */
C('Tilapia du Nil', 'Oreochromis niloticus', 'pisciculture', 180, 18, 35, [24, 30], [0, 0], 'moyen', [6.5, 8.5],
  ['bas-fond', 'guineenne', 'cotiere'],
  { spacing: '3-5 poissons/m² (étang), 20-40/m³ (bacs)', seed: '2-3 alevins/m² après sexage',
    yld: '1,5-4 t/ha/an (étang), 20-40 kg/m³ en système intensif', cal: [3, 4, 5, 9, 10],
    pests: ['Streptococcose', 'Saprolegniose (champignons)', 'Manque d\'oxygène (aube)', 'Hérons / Ichtyophages', 'pH acide'],
    notes: 'Espèce la plus adaptée à la pisciculture familiale africaine. Essentiel : utiliser des alevins mâles mono-sexe (uniquement des mâles) pour éviter la surpopulation et obtenir des tailles marchandes en 5-6 mois. Alimentation : son de riz, tourteau de coton, termites, résidus de cuisine — 3-5 % du poids vif/jour en 2-3 rations. Gestion de l\'eau : renouvellement, aération, surveillance de l\'oxygène à l\'aube.',
    stages: [['Préparation du bassin', 0, 'Mise en eau, chaulage, fertilisation (fumier) pour le plancton'],
      ['Empoissonnement', 7, 'Alevins de 10-15 g, sexés, acclimatés'],
      ['Grossissement', 90, 'Alimentation 3-5 % du poids vif, contrôle de l\'oxygène'],
      ['Finition', 150, 'Réduction de la densité si besoin, aliment enrichi'],
      ['Pêche partielle / totale', 180, 'Pêche progressive des gros sujets, vidange et séchage du fond']] });

C('Poisson-chat africain (Clarias)', 'Clarias gariepinus', 'pisciculture', 150, 20, 35, [24, 32], [0, 0], 'moyen', [6.0, 8.5],
  ['bas-fond', 'guineenne'],
  { spacing: '10-15 poissons/m² (étang), 60-100/m³ (bacs)', seed: 'Alevins de 5-10 g',
    yld: '2-5 t/ha/an (étang), jusqu\'à 100-150 kg/m³ en bacs hors sol', cal: [3, 4, 5, 9, 10],
    pests: ['Maladies bactériennes (Aeromonas)', 'Cannibalisme des alevins', 'Effondrement de l\'oxygène', 'Champignons'],
    notes: 'Résiste à des conditions difficiles (faible oxygène, forte densité) car il respire l\'air en surface. Espèce idéale pour la pisciculture hors-sol en bacs ou en étangs de bas-fond. Croissance très rapide (1-1,5 kg en 5 mois) avec un aliment riche en protéines (32-40 %). Éviter la surdensité et trier régulièrement pour limiter le cannibalisme.',
    stages: defaultStages(150, 'pisciculture') });

C('Pisciculture intégrée riz-poisson', 'Oreochromis / Clarias', 'pisciculture', 120, 20, 34, [24, 30], [0, 0], 'moyen', [6.0, 8.5],
  ['bas-fond'], { spacing: 'Rizière avec tranchée refuge de 1 m',
    yld: 'Rendement riz équivalent + 300-600 kg de poisson/ha', cal: [6, 7],
    notes: 'Le poisson dans la rizière consomme les insectes et les mauvaises herbes, et fertilise le riz par ses déjections. Prévoir une tranchée refuge et ne pas épandre d\'insecticides à forte toxicité.' });

C('Gestion de l\'eau et du plancton (bonnes pratiques étang)', '—', 'pisciculture', 180, 15, 38, [20, 32], [0, 0], 'moyen', [6.0, 9.0],
  ['bas-fond'], { cal: [3, 4, 5, 9, 10],
    notes: 'Étapes clés : vidange et séchage du fond entre deux cycles, chaulage (200-500 kg/ha) pour stabiliser le pH, fumure (fumier 1-2 t/ha) pour développer le plancton, contrôle hebdomadaire du pH (6,5-8,5) et de la transparence (disque de Secchi 25-40 cm). Gérer l\'eau de manière à éviter les chutes brusques d\'oxygène à l\'aube.' });

/* =====================================================================
   SYSTEMES & AGROFORESTERIE
   ===================================================================== */
C('Culture associée maïs - niébé - courge', 'Zea mays / Vigna / Cucurbita', 'cereale', 110, 12, 38, [22, 32], [500, 1100], 'moyen', [5.5, 7.5],
  ['soudano-guineenne', 'guineenne', 'soudanienne'],
  { yld: 'Rendement global +15 à 30 % vs monoculture', cal: [4, 5, 6, 7],
    notes: 'Association classique des trois sœurs : maïs comme tuteur, niébé qui fixe l\'azote et couvre le sol, courge qui limite les adventices et l\'érosion. Densité : 20 000-25 000 pieds de maïs/ha + 20 000 pieds de niébé + 3 000 pieds de courge.',
    stages: defaultStages(110, 'cereale') });

C('Agroforesterie cacao / bananier / fruitiers d\'ombrage', 'Theobroma / Musa / Erythrina', 'forestier', 1460, 15, 34, [22, 30], [1400, 2500], 'eleve', [5.5, 7.0],
  ['guineenne', 'ferralitique'], { yld: 'Production étagée sur 5 ans', cal: [4, 5, 6],
    notes: 'Système multi-étages : bananier provisoire d\'ombrage, cacao d\'ombrage semi-permanent, érythrine ou fruitiers hauts. Améliore la fertilité, tamponne les pics de chaleur et diversifie les revenus.' });

C('Warrantage / bonnes pratiques post-récolte', '—', 'cereale', 0, 0, 0, [0, 0], 'faible', [0, 0],
  ['soudanienne'], { cal: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    notes: 'Le warrantage consiste à stocker la récolte dans un magasin de proximité avec un crédit en contrepartie, puis à vendre plus tard au prix élevé. Étape clé : le séchage et le traitement des stocks (silos, sacs hermétiques, piper guinéen) — un grain mal séché perd jusqu\'à 30 % de sa valeur. Mesurez l\'humidité avant stockage (maïs < 13 %, niébé < 12 %).' });

C('Compostage et valorisation de la matière organique', '—', 'fourrage', 45, 15, 45, [300, 2000], 'faible', [0, 0],
  ['urbaine', 'soudanienne'],
  { yld: '2-3 t de compost pour 1 t de fumier frais + résidus', cal: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    notes: 'Fosse compostière en 3 couches alternées : végétaux secs (carbone), déchets verts et fumier (azote), cendre ou terre. Retourner tous les 10 jours, arroser si sec. Compost mûr en 30-45 jours (odeur de terre, plus de vers). 5-10 t/ha de compost remplacent une partie notable des engrais minéraux.',
    stages: [['Mise en place du tas', 0, 'Alternance de couches vertes et sèches'],
      ['Fermentation active', 15, 'Retourner tous les 10 jours, humidifier'],
      ['Maturation', 40, 'Réduire les retournements, laisser refroidir'],
      ['Épandage', 45, 'Épandre 5-10 t/ha avant le semis']] });

C('Association arachide + sorgho / mil (zone sahélienne)', 'Arachis / Sorghum / Pennisetum', 'legumineuse', 110, 12, 40, [22, 33], [350, 900], 'faible', [5.5, 7.5],
  ['sahel', 'soudano-sahel'],
  { yld: 'Sécurité alimentaire renforcée + azote gratuit', cal: [6, 7],
    notes: 'La légumineuse apporte l\'azote et couvre le sol, la céréale domine la hauteur. Densité : céréale à densité normale, légumineuse à 40-50 % de sa densité de monoculture. Semer après les premières pluies utiles.' });

C('Irrigation d\'appoint et petit équipement', '—', 'maraichage', 0, 0, 45, [0, 0], 'moyen', [0, 0],
  ['irrigue', 'soudano-sahel'],
  { cal: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    notes: 'Outils de diagnostic : un simple tensiomètre ou le test du poing permet d\'éviter le sur-arrosage. Arrosoir pour les planches, motopompe pour 0,5-2 ha, goutte à goutte pour les cultures de rente (tomate, piment). POUR L\'IRRIGATION, LA RÈGLE : arroser tôt le matin ou en fin de soirée, jamais entre 11 h et 16 h (pertes par évaporation supérieures à 40 %).' });

C('Contre-saison sèche (décembre-avril) : cultures irriguées', '—', 'maraichage', 110, 10, 35, [0, 0], 'tres_eleve', [5.5, 8.0],
  ['irrigue', 'bas-fond', 'cotiere'],
  { cal: [12, 1, 2, 3],
    notes: 'Contre-saison sur retenue, bas-fond ou eau souterraine peu profonde : oignon, carotte, tomate, piment, laitue et pastèque donnent les meilleurs prix (marché de contre-saison) et permettent 2 à 3 récoltes par an sur la même parcelle.' });

/* =====================================================================
   MARAÎCHAGE URBAN & PÉRI-URBAIN (petits espaces)
   ===================================================================== */
C('Maraîchage urbain en sacs et planches surélevées', '—', 'maraichage', 60, 12, 38, [400, 1200], 'tres_eleve', [6.0, 7.5],
  ['urbaine'],
  { spacing: 'Sacs de 50 L : 1-2 plants par sac', yld: '2-3 kg/m²/mois', cal: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    notes: 'Technique adaptée aux villes : substrat 1/3 terre, 1/3 compost, 1/3 sable lavé, gamay ou sac de jute, arrosage quotidien. Cultures adaptées : laitue, amarante, crincrin, tomate déterminée, piment, oignon vert, persil, gombo nain. Idéal pour les ménages sans terre.',
    stages: defaultStages(60, 'maraichage') });

C('Hydroponie et culture hors-sol (bac, gouttières)', '—', 'maraichage', 45, 15, 35, [0, 0], 'tres_eleve', [5.5, 7.0],
  ['urbaine'],
  { yld: '4-6 kg/m² par cycle pour les cultures feuilles', cal: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    notes: 'Système NFT ou bac sur radeau : solution nutritive renouvelée, pompe d\'oxygénation, suivi du pH (5,5-6,5) et de la conductivité électrique (EC 1,5-2,5). Attention : en cas de coupure d\'électricité, prévoir une solution de secours pour l\'oxygénation. Cultures : laitue, persil, basilic, fraise, tomate en système suspendu.' });

C('Champignonnier : pleurote sur substrat agricole', 'Pleurotus ostreatus', 'maraichage', 35, 18, 30, [25, 28], [0, 0], 'moyen', [6.0, 7.5],
  ['urbaine'],
  { yld: '0,5-1 kg de champignons/kg de substrat sec', cal: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    pests: ['Moisissure verte (Trichoderma)', 'Mouches du champignon', 'Sécheresse du substrat'],
    notes: 'Valorise les résidus agricoles (paille de riz, tiges de coton, sciure de bois) en nourriture riche en protéines. Substrat pasteurisé à 65-70 °C pendant 1 h, ensemencé en couches, incubation à l\'obscurité puis fructification en lumière tamisée à 85-90 % d\'humidité. Excellent complément de revenu en saison sèche.',
    stages: [['Préparation du substrat', 0, 'Paille broyée, pasteurisation à 65-70 °C pendant 1 h'],
      ['Ensemencement / incubation', 18, 'Obscurité à 25-28 °C, 18-21 jours jusqu\'à colonisation blanche'],
      ['Fructification', 28, 'Lumière tamisée, humidité 85-90 %, aération'],
      ['Récoltes échelonnées', 35, 'Cueillette avant que le chapeau ne s\'aplatisse (2-3 vagues)']] });

C('Nurserie / pépinière communautaire', '—', 'forestier', 60, 12, 38, [600, 1800], 'moyen', [5.5, 7.5],
  ['soudano-sahel', 'soudanienne'], { yld: '500-5 000 plants par campagne', cal: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    notes: 'Activité de service à forte valeur : production de plants forestiers, fruitiers greffés et maraîchers pour la revente. Substrat léger (terre de forêt + sable + compost), ombrières à 50 %, arrosage quotidien et ombrage progressif avant la mise au champ.' });

/* =====================================================================
   Construction de la base exploitable
   ===================================================================== */
/* Normalise un stade quel que soit son format d'écriture ([nom, jour, besoins] ou objet) */
function normStage(s) {
  if (Array.isArray(s)) return { name: s[0], days: s[1], key_needs: s[2] };
  return { name: s.name, days: s.days, key_needs: s.key_needs };
}

const CropDB = {
  all: [],
  map: {},
  init: function () {
    this.all = CROP_ROWS.map(function (r, idx) {
      return {
        id: r.id || ('crop-' + r.name.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 42)),
        index: idx,
        name: r.name, sci: r.sci, category: r.category,
        cycle_days: r.cycle, temp_min: r.tmin, temp_max: r.tmax,
        temp_opt_min: r.topt[0], temp_opt_max: r.topt[1],
        rain_min: r.rain[0], rain_max: r.rain[1],
        water_need: r.water, ph_min: r.ph[0], ph_max: r.ph[1],
        soils: r.soils, zones: r.zones, spacing: r.spacing, seed_rate: r.seed,
        yield_range: r.yield, calendar: r.cal, pests: r.pests, notes: r.notes,
        source: r.source, alt: r.alt || null,
        growing_stages: (r.stages || defaultStages(r.cycle, r.category)).map(normStage),
        custom: false
      };
    });
    this.all.forEach(function (c) { CropDB.map[c.id] = c; });
    return this;
  },
  byId: function (id) { return this.map[id] || null; },
  combined: function (custom) {
    return this.all.concat((custom || []).map(CropDB.normalizeCustom));
  },
  normalizeCustom: function (c) {
    return {
      id: c.id, name: c.name, sci: c.sci || '', category: c.category || 'maraichage',
      cycle_days: c.cycle_days || 90, temp_min: c.temp_min, temp_max: c.temp_max,
      temp_opt_min: c.temp_opt_min, temp_opt_max: c.temp_opt_max,
      rain_min: c.rain_min, rain_max: c.rain_max, water_need: c.water_need || 'moyen',
      ph_min: c.ph_min, ph_max: c.ph_max, soils: c.soils || [], zones: c.zones || [],
      spacing: c.spacing || '—', seed_rate: c.seed_rate || '—', yield_range: c.yield_range || '—',
      calendar: c.calendar || [5, 6], pests: c.pests || [], notes: c.notes || '',
      source: c.source || 'Fiche saisie par l\'utilisateur', custom: true,
      growing_stages: (c.growing_stages && c.growing_stages.length ? c.growing_stages : defaultStages(c.cycle_days || 90, c.category || 'cereale')).map(normStage)
    };
  },
  waterRank: function (w) { return WATER_ORDER[w] || 2; }
};

CropDB.init();

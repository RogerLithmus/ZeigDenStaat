import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  Search, 
  Filter, 
  Layers, 
  Building2, 
  Users, 
  Landmark, 
  ChevronRight, 
  X, 
  RotateCcw, 
  HelpCircle, 
  Maximize2,
  Sliders,
  AlertTriangle,
  Flame,
  CheckCircle,
  FileText,
  MapPin,
  TrendingUp,
  Coins,
  Cpu,
  Compass,
  ArrowRight,
  Sparkles,
  Ruler
} from 'lucide-react';
import CustomNode from './CustomNode';

// --- RICH MOCK DATA ---
const staatData = {
  "id": "bund",
  "name": "Bundeskanzleramt (Zentrale)",
  "short": "BKAmt",
  "type": "Staat",
  "budget": "3,9 Mrd. €",
  "employees": "850",
  "head": "Friedrich Merz (Bundeskanzler)",
  "colorKey": "bund",
  "x": 0,
  "y": 0,
  "scandals": "Der geplante 640-Millionen-Euro-Neubau des Kanzleramtes (doppelt so groß wie das Weiße Haus) wird unter Merz fortgeführt, um eine 'Flugtaxi-Landeplattform' zu ergänzen.",
  "achievements": "Erfolgreiche Bildung der Koalition aus CDU/CSU und SPD in Rekordzeit ('Deutschland-Pakt 2.0') und die Einführung der digitalen Kanzler-App 'MerzDirekt'.",
  "description": "Das Machtzentrum der Bundesrepublik Deutschland. Hier werden die Richtlinien der Politik bestimmt und die Staatsmodernisierung koordiniert.",
  "rooms": [
    {
      "name": "Kabinettssaal",
      "desc": "Ort der großen Ministerrunden. Keks-Vorrat: Streng vertraulich.",
      "item": "Roter Knopf (Stufe 10)"
    },
    {
      "name": "Referat Z",
      "desc": "Zentralabteilung für interne Anträge. Bearbeitungszeit: Unbekannt.",
      "item": "1.200 Leitz-Ordner"
    },
    {
      "name": "Kaffeeküche",
      "desc": "Wichtigster politischer Katalysator. Täglicher Verbrauch: 450 Liter Espresso.",
      "item": "Kaffeeautomat (Stufe 2)"
    }
  ],
  "children": [
    {
      "id": "aa",
      "name": "Auswärtiges Amt",
      "short": "AA",
      "type": "Ministerium",
      "budget": "6,7 Mrd. €",
      "employees": "3.100",
      "head": "Johann Wadephul (CDU)",
      "scandals": "Die 'Diplomaten-Pass-Affäre', bei der aus Versehen Pässe an ein fiktives Land namens 'Kloppstein' ausgestellt wurden.",
      "achievements": "Erfolgreiche Vermittlung im arktischen Fischereiabkommen und Stärkung der europäischen Diplomatie-Cloud.",
      "description": "Vertritt die deutschen Interessen in der Welt, pflegt die Beziehungen zu anderen Staaten und koordiniert die europäische Integration.",
      "rooms": [
        {
          "name": "Krisenreaktionszentrum",
          "desc": "Riesige Weltkarte mit blinkenden roten Lichtern. Ständig besetzt.",
          "item": "Rotes Satelliten-Telefon"
        },
        {
          "name": "Diplomaten-Lounge",
          "desc": "Feine Canapés und Champagner. Gespräche über informelle Abkommen.",
          "item": "Kristall-Karaffe"
        }
      ],
      "children": [
        {
          "id": "dai",
          "name": "Deutsches Archäologisches Institut",
          "short": "DAI",
          "type": "Behörde",
          "budget": "65 Mio. €",
          "employees": "350",
          "head": "Friederike Fless (Präsidentin)",
          "scandals": "Streit um die exakte Altersbestimmung einer antiken Kaffeetasse bei Ausgrabungen in Pompeji.",
          "achievements": "Entdeckung der weltweit ältesten Steuerschuldverschreibung in Mesopotamien.",
          "description": "Führt weltweit Forschungen und Ausgrabungen auf dem Gebiet der Archäologie und Altertumswissenschaften durch.",
          "x": 616,
          "y": -74,
          "colorKey": "sub"
        },
        {
          "id": "bfaa",
          "name": "Bundesamt für Auswärtige Angelegenheiten",
          "short": "BfAA",
          "type": "Behörde",
          "budget": "95 Mio. €",
          "employees": "800",
          "head": "Georg Birgelen",
          "scandals": "Verlust von Visa-Antragsformularen wegen eines Fehlers in der automatischen Cloud-Synchronisation mit dem Auslandsnetzwerk.",
          "achievements": "Erfolgreiche Bearbeitung von 500.000 Visa-Anträgen durch ein neues digitales Online-Verfahren.",
          "description": "Unterstützt das Auswärtige Amt bei Visabeantwortungen, der Verwaltung von Auslandsimmobilien und Förderprojekten.",
          "x": 616,
          "y": 74,
          "colorKey": "sub"
        }
      ],
      "x": 480,
      "y": 0,
      "colorKey": "aa"
    },
    {
      "id": "bmi",
      "name": "Bundesministerium des Innern und für Heimat",
      "short": "BMI",
      "type": "Ministerium",
      "budget": "15,4 Mrd. €",
      "employees": "2.100",
      "head": "Alexander Dobrindt (CSU)",
      "scandals": "Die Einführung der 'digitalen Grenzschutzbrille', die bei Regen leider das Bild des bayerischen Heimathimmels einblendet statt der Realität.",
      "achievements": "Erfolgreiche Vernetzung aller Landespolizeibehörden über die neue Schnittstelle 'Patria-1'.",
      "description": "Zuständig für die innere Sicherheit, den Bevölkerungsschutz, die Integration und die Heimatpolitik.",
      "rooms": [
        {
          "name": "Lagezentrum Innere Sicherheit",
          "desc": "Live-Kameras und Notfall-Telefone in Blau.",
          "item": "Blaulicht-Schalter"
        },
        {
          "name": "Referat Heimat",
          "desc": "Gemütlich eingerichtet mit virtuellem Kaminfeuer und Kuckucksuhren.",
          "item": "Dunstabzug-Kuckucksuhr"
        }
      ],
      "children": [
        {
          "id": "bfv",
          "name": "Bundesamt für Verfassungsschutz",
          "short": "BfV",
          "type": "Behörde",
          "budget": "450 Mio. €",
          "employees": "4.200",
          "head": "Thomas Haldenwang (kommissarisch)",
          "scandals": "Vierteilige Aktenschredder-Pannen im Archiv unter dem Vorwand des 'Platzmangels'.",
          "achievements": "Aufdeckung eines internationalen Rings für Spionage per Smart-Home-Kaffeemaschinen.",
          "description": "Der Inlandsnachrichtendienst der Bundesrepublik Deutschland zur Beobachtung verfassungsfeindlicher Bestrebungen.",
          "x": 603,
          "y": 143,
          "colorKey": "sub"
        },
        {
          "id": "bsi",
          "name": "Bundesamt für Sicherheit in der Informationstechnik",
          "short": "BSI",
          "type": "Behörde",
          "budget": "220 Mio. €",
          "employees": "1.500",
          "head": "Claudia Plattner",
          "scandals": "Die BSI-Webseite war wegen eines abgelaufenen SSL-Zertifikats für 12 Stunden offline.",
          "achievements": "Erfolgreiche Zertifizierung des 'sicheren deutschen Faxgeräts v2026'.",
          "description": "Die nationale Cyber-Sicherheitsbehörde für Staat, Wirtschaft und Bürger.",
          "x": 528,
          "y": 325,
          "colorKey": "sub"
        },
        {
          "id": "bbk",
          "name": "Bundesamt für Bevölkerungsschutz und Katastrophenhilfe",
          "short": "BBK",
          "type": "Behörde",
          "budget": "280 Mio. €",
          "employees": "450",
          "head": "Ralph Tiesler",
          "scandals": "Die bundesweite Sirenen-Test-App verspätete sich um 30 Minuten, weil der App-Server ein automatisches Windows-Update durchführte.",
          "achievements": "Verteilung von 10 Millionen Notfall-Kochbüchern für Kochen ohne Strom.",
          "description": "Koordiniert den Katastrophenschutz der Bundesländer und betreibt das nationale Warnsystem.",
          "x": 691,
          "y": 201,
          "colorKey": "sub"
        },
        {
          "id": "bka",
          "name": "Bundeskriminalamt",
          "short": "BKA",
          "type": "Behörde",
          "budget": "980 Mio. €",
          "employees": "8.500",
          "head": "Holger Münch",
          "scandals": "Der geplante Ankauf einer Spionagesoftware, die sich beim ersten Testlauf als veraltetes Computerspiel entpuppte.",
          "achievements": "Zerschlagung eines weltweiten Netzwerks für Ransomware-Erpressungen durch koordinierten Zugriff.",
          "description": "Die Zentralstelle der deutschen Polizei für Kriminalitätsbekämpfung und Koordination mit Interpol.",
          "x": 631,
          "y": 347,
          "colorKey": "sub"
        },
        {
          "id": "bpol",
          "name": "Bundespolizei",
          "short": "BPOL",
          "type": "Behörde",
          "budget": "4,8 Mrd. €",
          "employees": "54.000",
          "head": "Dieter Romann",
          "scandals": "Ein moderner Einsatzhubschrauber musste wegen fehlender Batterien für das Sprechfunkgerät am Boden bleiben.",
          "achievements": "Sicherung von Großveranstaltungen und Grenzübergängen mit hoher Professionalität und mobilem Kontrollzentrum.",
          "description": "Schützt die Bundesgrenzen, Bahnhöfe, Flughäfen und verfassungsrechtliche Organe des Bundes.",
          "x": 775,
          "y": 268,
          "colorKey": "sub"
        },
        {
          "id": "bamf",
          "name": "Bundesamt für Migration und Flüchtlinge",
          "short": "BAMF",
          "type": "Behörde",
          "budget": "1,2 Mrd. €",
          "employees": "8.000",
          "head": "Hans-Eckhard Sommer",
          "scandals": "Die Einführung eines Spracherkennungs-Algorithmus zur Herkunftsbestimmung stufte einen sächsischen Dialekt als 'nicht-europäisch' ein.",
          "achievements": "Verkürzung der Asylverfahrensdauer auf unter 3 Monate.",
          "description": "Zentrale Behörde für Asylverfahren, Integration und Migrationssteuerung in Deutschland.",
          "x": 737,
          "y": 359,
          "colorKey": "sub"
        }
      ],
      "x": 443,
      "y": 184,
      "colorKey": "bmi"
    },
    {
      "id": "bmj",
      "name": "Bundesministerium der Justiz",
      "short": "BMJ",
      "type": "Ministerium",
      "budget": "1,0 Mrd. €",
      "employees": "950",
      "head": "Stefanie Hubig (SPD)",
      "scandals": "Ein Gesetzesentwurf zur Entbürokratisierung musste wegen fehlerhafter Fußnoten dreimal neu gedruckt werden (Verbrauch: 15 Tonnen Papier).",
      "achievements": "Vollständige Digitalisierung der deutschen Grundbücher auf einer verschlüsselten Staats-Datenbank.",
      "description": "Zuständig für die Gesetzgebung im Bereich des Zivil-, Straf- und Wirtschaftsrechts sowie für die Rechtspflege.",
      "rooms": [
        {
          "name": "Gesetzes-Bibliothek",
          "desc": "Historische Folianten und moderne Verordnungen. Duftet nach altem Leder.",
          "item": "BGB in Goldprägung"
        },
        {
          "name": "Prüfstelle für Verfassung",
          "desc": "Wo jedes Wort auf die Goldwaage gelegt wird.",
          "item": "Goldwaage für Paragraphen"
        }
      ],
      "children": [
        {
          "id": "dpma",
          "name": "Deutsches Patent- und Markenamt",
          "short": "DPMA",
          "type": "Behörde",
          "budget": "290 Mio. €",
          "employees": "2.600",
          "head": "Eva Schewior",
          "scandals": "Patentierung des Begriffs 'Beamten-Mikado' durch ein ausländisches Konsortium wurde erst in letzter Sekunde abgewehrt.",
          "achievements": "Rekordzeit bei der Anmeldung von KI-Patenten durch den Einsatz eines teilautomatisierten Prüfsystems.",
          "description": "Das nationale Patentamt mit Sitz in München ist das größte Patentamt Europas.",
          "x": 510,
          "y": 353,
          "colorKey": "sub"
        },
        {
          "id": "bfj",
          "name": "Bundesamt für Justiz",
          "short": "BfJ",
          "type": "Behörde",
          "budget": "90 Mio. €",
          "employees": "1.200",
          "head": "Veronika Keller-Engels",
          "scandals": "Verzug bei der Vollstreckung von Bußgeldern gegen internationale Social-Media-Konzerne wegen Übersetzungsproblemen.",
          "achievements": "Erfolgreiche Verwaltung des zentralen Gewerbezentralregisters mit 99,9% Uptime.",
          "description": "Zentrale Dienstleistungsbehörde der Bundesjustiz, unter anderem zuständig für das Bundeszentralregister.",
          "x": 495,
          "y": 495,
          "colorKey": "sub"
        },
        {
          "id": "gba",
          "name": "Generalbundesanwalt beim Bundesgerichtshof",
          "short": "GBA",
          "type": "Behörde",
          "budget": "110 Mio. €",
          "employees": "350",
          "head": "Jens Rommel",
          "scandals": "Der Aktenordner zu einem Terrorverfahren wurde im ICE nach Karlsruhe vergessen und von einem aufmerksamen Fahrgast zurückgebracht.",
          "achievements": "Konsequente strafrechtliche Verfolgung von Cyber-Terroristen und Saboteuren kritischer Infrastrukturen.",
          "description": "Die oberste Strafverfolgungsbehörde des Bundes zur Bekämpfung von Gefährdungen der inneren und äußeren Sicherheit.",
          "x": 353,
          "y": 510,
          "colorKey": "sub"
        }
      ],
      "x": 339,
      "y": 339,
      "colorKey": "bmj"
    },
    {
      "id": "bmf",
      "name": "Bundesministerium der Finanzen",
      "short": "BMF",
      "type": "Ministerium",
      "budget": "11,2 Mrd. €",
      "employees": "2.200",
      "head": "Lars Klingbeil (SPD)",
      "scandals": "Streit um den exakten Zinssatz für Bundesanleihen führte zu einer 10-stündigen Blockade der Kaffeemaschinen durch unzufriedene Haushälter.",
      "achievements": "Etablierung des 'Klingbeil-Fonds' zur Stärkung kommunaler Haushalte ohne Neuverschuldung.",
      "description": "Verantwortlich für die Bundeskasse, Steuern und die Haushaltsführung des Bundes.",
      "rooms": [
        {
          "name": "Tresorraum",
          "desc": "Verwaltung der Schuldenbremse. Enthält hauptsächlich Verträge.",
          "item": "Schwarze Null (Gusseisen)"
        },
        {
          "name": "Stempellager",
          "desc": "Sitz der echten Finanzgewalt. Jedes Formular braucht vier Stempel.",
          "item": "Stempel-Karussell v19"
        }
      ],
      "children": [
        {
          "id": "bafin",
          "name": "Bundesanstalt für Finanzdienstleistungsaufsicht",
          "short": "BaFin",
          "type": "Behörde",
          "budget": "450 Mio. €",
          "employees": "2.800",
          "head": "Mark Branson",
          "scandals": "Mitarbeiter handelten aktiv mit Wirecard-Aktien während der laufenden Prüfung.",
          "achievements": "Verschärfung der Transparenzregeln für Wertpapiergeschäfte von BaFin-Angestellten.",
          "description": "Aufsichtsbehörde für Banken, Versicherungen und den gesamten Wertpapierhandel.",
          "x": 325,
          "y": 528,
          "colorKey": "sub"
        },
        {
          "id": "zoll",
          "name": "Generalzolldirektion",
          "short": "GZD",
          "type": "Behörde",
          "budget": "1,4 Mrd. €",
          "employees": "44.000",
          "head": "Colette Hercher",
          "scandals": "Einsatz veralteter IT-Systeme bei der Bekämpfung illegaler Beschäftigung.",
          "achievements": "Sicherstellung von Tonnen illegaler Schmuggelwaren und Steuernachzahlungen.",
          "description": "Verwaltet Zölle, Verbrauchsteuern und sichert die Grenzen gegen Warenschmuggel.",
          "x": 143,
          "y": 603,
          "colorKey": "sub"
        },
        {
          "id": "bzst",
          "name": "Bundeszentralamt für Steuern",
          "short": "BZSt",
          "type": "Behörde",
          "budget": "340 Mio. €",
          "employees": "2.200",
          "head": "Brigitte Vossebürger",
          "scandals": "Der 'Steuer-CD-Importfilter' löschte versehentlich die Daten von 100 potenziellen Steuersündern wegen eines Sonderzeichen-Fehlers.",
          "achievements": "Rückforderung von Hunderten Millionen Euro aus Cum-Ex-Geschäften im Jahr 2025.",
          "description": "Zuständig für internationale Steuerangelegenheiten, Bundesbetriebsprüfungen und das steuerliche Identifikationsmerkmal.",
          "x": 323,
          "y": 632,
          "colorKey": "sub"
        },
        {
          "id": "bima",
          "name": "Bundesanstalt für Immobilienaufgaben",
          "short": "BImA",
          "type": "Behörde",
          "budget": "2,8 Mrd. €",
          "employees": "7.000",
          "head": "Christoph Krupp",
          "scandals": "Leerstand von 500 bundeseigenen Wohnungen in Berlin über zwei Jahre wegen fehlender behördlicher Freigabestempel.",
          "achievements": "Sanierung von 50 historischen Dienstgebäuden zu klimaneutralen Vorzeigeobjekten.",
          "description": "Verwaltet das gesamte Immobilienvermögen der Bundesrepublik Deutschland und stellt Bundesflächen bereit.",
          "x": 218,
          "y": 676,
          "colorKey": "sub"
        }
      ],
      "x": 184,
      "y": 443,
      "colorKey": "bmf"
    },
    {
      "id": "bmwi",
      "name": "Bundesministerium für Wirtschaft und Energie",
      "short": "BMWi",
      "type": "Ministerium",
      "budget": "13,8 Mrd. €",
      "employees": "1.500",
      "head": "Katherina Reiche (CDU)",
      "scandals": "Das 'Wasserstoff-Fördermittel-Labyrinth', bei dem Gelder versehentlich an ein Startup ausgezahlt wurden, das Wasserstoff-Wasser für Rennpferde herstellte.",
      "achievements": "Beschleunigung der Zulassungsverfahren für Industrieanlagen auf unter 3 Monate.",
      "description": "Gestaltet die Rahmenbedingungen für wirtschaftliches Handeln, sichert die Energieversorgung und fördert den Mittelstand.",
      "rooms": [
        {
          "name": "Energie-Lagezentrum",
          "desc": "Überwachung des Stromnetzes und Gaslagerstände auf LED-Tafeln.",
          "item": "Mega-Schalter für Trassenzufuhr"
        },
        {
          "name": "Mittelstands-Forum",
          "desc": "Wo die Klagen der Bürokratie-Geschädigten gesammelt werden.",
          "item": "Klage-Briefkasten (Überfüllt)"
        }
      ],
      "children": [
        {
          "id": "bkarta",
          "name": "Bundeskartellamt",
          "short": "BKartA",
          "type": "Behörde",
          "budget": "45 Mio. €",
          "employees": "400",
          "head": "Andreas Mundt",
          "scandals": "Ein Kartellverfahren gegen deutsche Brötchenbäcker dauerte länger als der Bau einer kompletten Großbäckerei.",
          "achievements": "Verhinderung der Fusion zweier dominanter regionaler Kabelnetzbetreiber zum Schutz der Verbraucher.",
          "description": "Unabhängige Wettbewerbsbehörde zum Schutz des Wettbewerbs in Deutschland.",
          "x": 111,
          "y": 610,
          "colorKey": "sub"
        },
        {
          "id": "bnetza",
          "name": "Bundesnetzagentur",
          "short": "BNetzA",
          "type": "Behörde",
          "budget": "290 Mio. €",
          "employees": "3.000",
          "head": "Klaus Müller",
          "scandals": "Die geplante Vergabe von 5G-Mobilfunkfrequenzen verzögerte sich wegen juristischer Spitzfindigkeiten um zwei Jahre.",
          "achievements": "Erfolgreiche Integration von 500.000 Balkonkraftwerken ins deutsche Stromnetz.",
          "description": "Regulierungsbehörde für Elektrizität, Gas, Telekommunikation, Post und Eisenbahnen.",
          "x": 0,
          "y": 700,
          "colorKey": "sub"
        },
        {
          "id": "bafa",
          "name": "Bundesamt für Wirtschaft und Ausfuhrkontrolle",
          "short": "BAFA",
          "type": "Behörde",
          "budget": "150 Mio. €",
          "employees": "1.500",
          "head": "Torsten Safarik",
          "scandals": "Die Genehmigung eines Windparks verzögerte sich, weil der eingereichte digitale Bauplan wegen 'falscher Pixelbreite' abgelehnt wurde.",
          "achievements": "Effiziente Auszahlung von Energieeffizienz-Förderungen für 200.000 Ein-Familien-Häuser.",
          "description": "Zuständig für die Kontrolle von Rüstungs- und Dual-Use-Exporten sowie für Wirtschaftsförderprogramme.",
          "x": -111,
          "y": 610,
          "colorKey": "sub"
        }
      ],
      "x": 0,
      "y": 480,
      "colorKey": "bmwi"
    },
    {
      "id": "bmas",
      "name": "Bundesministerium für Arbeit und Soziales",
      "short": "BMAS",
      "type": "Ministerium",
      "budget": "175,0 Mrd. €",
      "employees": "1.800",
      "head": "Bärbel Bas (SPD)",
      "scandals": "Der Rentenschätzer-Server berechnete aus Versehen für alle Bürger ab 50 ein Renteneintrittsalter von 99 Jahren, was kurzzeitig für Panik sorgte.",
      "achievements": "Erfolgreiche Einführung der automatischen Auszahlung des 'Modernisierungsgeldes' direkt aufs Konto.",
      "description": "Das budgetstärkste Ministerium. Zuständig für den Arbeitsmarkt, das Arbeitsrecht, Arbeitsschutz sowie Renten und soziale Sicherung.",
      "rooms": [
        {
          "name": "Renten-Rechenzentrum",
          "desc": "Supercomputer berechnen Sekunde für Sekunde den demografischen Wandel.",
          "item": "Rentenrechner IBM-9000"
        },
        {
          "name": "Arbeitsschutz-Labor",
          "desc": "Hier werden ergonomische Bürostühle auf maximale Gemütlichkeit geprüft.",
          "item": "Ergo-Stuhl (Stufe 5)"
        }
      ],
      "children": [
        {
          "id": "ba",
          "name": "Bundesagentur für Arbeit",
          "short": "BA",
          "type": "Behörde",
          "budget": "43,0 Mrd. €",
          "employees": "95.000",
          "head": "Andrea Nahles",
          "scandals": "Die Einführung der Jobbörsen-App führte wegen fehlerhafter Algorithmen dazu, dass Chirurgen Stellen als Metzger vorgeschlagen bekamen.",
          "achievements": "Vermittlung von über 2 Millionen Arbeitskräften in zukunftsfähige Berufsfelder im Jahr 2025.",
          "description": "Führt Arbeitsmarktberatung und -vermittlung durch und verwaltet das Arbeitslosengeld.",
          "x": -131,
          "y": 606,
          "colorKey": "sub"
        },
        {
          "id": "baua",
          "name": "Bundesanstalt für Arbeitsschutz und Arbeitsmedizin",
          "short": "BAuA",
          "type": "Behörde",
          "budget": "75 Mio. €",
          "employees": "700",
          "head": "Isabel Rothe",
          "scandals": "Eine 400-seitige Studie zur Gefährdung durch Schreibtischecken stieß auf heftige Kritik wegen Realitätsferne.",
          "achievements": "Erstellung der bundesweit gültigen Leitlinien für sicheres Arbeiten im Home-Office.",
          "description": "Forscht und berät im Bereich Sicherheit und Gesundheit bei der Arbeit.",
          "x": -268,
          "y": 647,
          "colorKey": "sub"
        },
        {
          "id": "bas",
          "name": "Bundesamt für Soziale Sicherung",
          "short": "BAS",
          "type": "Behörde",
          "budget": "180 Mio. €",
          "employees": "750",
          "head": "Frank Plate",
          "scandals": "Eine Verwechslung bei der Zuweisung von Krankenkassenmitteln führte zu einer Fehlbuchung von 50 Millionen Euro auf ein Testkonto.",
          "achievements": "Stabile Verwaltung des Gesundheitsfonds mit einem jährlichen Volumen von über 250 Milliarden Euro.",
          "description": "Aufsichtsbehörde für bundesunmittelbare Sozialversicherungsträger und Verwalter des Gesundheitsfonds.",
          "x": -336,
          "y": 521,
          "colorKey": "sub"
        }
      ],
      "x": -184,
      "y": 443,
      "colorKey": "bmas"
    },
    {
      "id": "bmel",
      "name": "Bundesministerium für Landwirtschaft, Ernährung und Heimat",
      "short": "BMEL",
      "type": "Ministerium",
      "budget": "7,2 Mrd. €",
      "employees": "1.100",
      "head": "Alois Rainer (CSU)",
      "scandals": "'Heimat-Bier-Krise': Förderung einer bayerischen Heimatbrauerei mit EU-Agrargeldern wurde von der EU-Kommission gestoppt.",
      "achievements": "Einführung des einheitlichen digitalen Herkunftslabels 'Deutscher Boden' für tierische Produkte.",
      "description": "Verantwortlich für eine nachhaltige Landwirtschaft, gesunde Ernährung und die Förderung der ländlichen Räume als Heimat.",
      "rooms": [
        {
          "name": "Ernährungs-Prüfküche",
          "desc": "Entwicklung von Standards für gesundes Kantinenessen. Vegan vs. Currywurst-Debatten.",
          "item": "Nutri-Score Prüfstempel"
        },
        {
          "name": "Heimat-Archiv",
          "desc": "Karten ländlicher Regionen, Pläne zur Digitalisierung von Dorfgemeinschaftshäusern.",
          "item": "Modell-Traktor Fendt-Vario"
        }
      ],
      "children": [
        {
          "id": "jki",
          "name": "Julius Kühn-Institut",
          "short": "JKI",
          "type": "Behörde",
          "budget": "90 Mio. €",
          "employees": "1.200",
          "head": "Frank Ordon",
          "scandals": "Entweichen einer Zucht-Kartoffelsorte, die gegen jegliche Frittenfett-Temperaturen resistent war, aus dem Testfeld.",
          "achievements": "Entwicklung einer pilzresistenten Weinsorte, die den Pestizideinsatz um 80% reduziert.",
          "description": "Bundesforschungsinstitut für Kulturpflanzen mit Hauptsitz in Quedlinburg.",
          "x": -353,
          "y": 510,
          "colorKey": "sub"
        },
        {
          "id": "bvl",
          "name": "Bundesamt für Verbraucherschutz und Lebensmittelsicherheit",
          "short": "BVL",
          "type": "Behörde",
          "budget": "110 Mio. €",
          "employees": "850",
          "head": "Friedel Cramer",
          "scandals": "Späte Warnung vor keimbelastetem Ziegenkäse, weil der zuständige Sachbearbeiter im Urlaub war und das E-Mail-Postfach nicht weitergeleitet war.",
          "achievements": "Einführung des bundesweiten Schnellwarnsystems für Rückstände in Lebensmitteln.",
          "description": "Koordiniert die Lebensmittelüberwachung der Länder und lässt Pflanzenschutzmittel zu.",
          "x": -495,
          "y": 495,
          "colorKey": "sub"
        },
        {
          "id": "ble",
          "name": "Bundesanstalt für Landwirtschaft und Ernährung",
          "short": "BLE",
          "type": "Behörde",
          "budget": "310 Mio. €",
          "employees": "1.600",
          "head": "Hanns-Christoph Eiden",
          "scandals": "Das 'Milchüberschuss-Lagerverwaltungssystem' stufte 10 Tonnen Butter irrtümlich als 'Elektroschrott' ein.",
          "achievements": "Reibungslose Abwicklung von EU-Agrarsubventionen für deutsche Familienbetriebe.",
          "description": "Dienstleistungszentrum für Agrarwirtschaft, ländliche Räume und Fischerei.",
          "x": -510,
          "y": 353,
          "colorKey": "sub"
        }
      ],
      "x": -339,
      "y": 339,
      "colorKey": "bmel"
    },
    {
      "id": "bmvg",
      "name": "Bundesministerium der Verteidigung",
      "short": "BMVg",
      "type": "Ministerium",
      "budget": "53,0 Mrd. €",
      "employees": "3.200",
      "head": "Boris Pistorius (SPD)",
      "scandals": "Die Berater-Affäre 2.0: Neue Millionenverträge für IT-Beratung ohne korrekte Ausschreibung, um veraltete Funkgeräte zu patchen.",
      "achievements": "Erfolgreiche Vollausstattung von zwei Divisionen der Bundeswehr und zügige Beschaffung über das Sondervermögen.",
      "description": "Zuständig für die militärische Landesverteidigung und Befehlszentrum der Bundeswehr.",
      "rooms": [
        {
          "name": "Lagezentrum Bundeswehr",
          "desc": "Große Bildschirme. Aktueller Status des Hubschrauber-Fuhrparks: In Arbeit.",
          "item": "Tarn-Kugelschreiber"
        },
        {
          "name": "Musterungskammer",
          "desc": "Verwaltung der Personalstärken. Kaffeeautomat steht still.",
          "item": "Helm-Dackel"
        }
      ],
      "children": [
        {
          "id": "baainbw",
          "name": "Bundesamt für Ausrüstung, Informationstechnik & Nutzung der Bundeswehr",
          "short": "BAAINBw",
          "type": "Behörde",
          "budget": "2,1 Mrd. €",
          "employees": "11.500",
          "head": "Annette Lehnigk-Emden",
          "scandals": "Jahrzehntelange Verzögerungen bei Sturmgewehren, Funkgeräten und Helmen.",
          "achievements": "Verkürzung der Zulassungsdauer für Standard-Militärtransporter.",
          "description": "Sitz in Koblenz. Zuständig für das komplette Beschaffungswesen der Streitkräfte.",
          "x": -521,
          "y": 336,
          "colorKey": "sub"
        },
        {
          "id": "plgabw",
          "name": "Planungsamt der Bundeswehr",
          "short": "PlgABw",
          "type": "Behörde",
          "budget": "150 Mio. €",
          "employees": "600",
          "head": "Generalmajor Christian Freuding",
          "scandals": "Ein strategisches Zukunftspapier zur Drohnenabwehr wurde fälschlicherweise als Powerpoint-Präsentation im öffentlichen Netz hochgeladen.",
          "achievements": "Erfolgreiche Modellierung der zukünftigen Bundeswehrstruktur 2035 mittels KI-Simulationsmodellen.",
          "description": "Gestaltet die langfristige Planung, Konzeption und Rüstungsausrichtung der Bundeswehr.",
          "x": -647,
          "y": 268,
          "colorKey": "sub"
        },
        {
          "id": "bapersbw",
          "name": "Bundesamt für das Personalmanagement der Bundeswehr",
          "short": "BAPersBw",
          "type": "Behörde",
          "budget": "420 Mio. €",
          "employees": "5.000",
          "head": "Georg Sandhofer (Präsident)",
          "scandals": "Eine Recruiting-Kampagne auf TikTok verwendete Musik, die sich nachträglich als Vereinshymne eines ausländischen Sportclubs herausstellte.",
          "achievements": "Erfolgreiche Besetzung von 18.000 militärischen Dienstposten trotz Fachkräftemangels.",
          "description": "Zuständig für die Personalgewinnung, -führung und -entwicklung aller Soldaten und zivilen Angestellten der Bundeswehr.",
          "x": -606,
          "y": 131,
          "colorKey": "sub"
        }
      ],
      "x": -443,
      "y": 184,
      "colorKey": "bmvg"
    },
    {
      "id": "bmg",
      "name": "Bundesministerium für Gesundheit",
      "short": "BMG",
      "type": "Ministerium",
      "budget": "20,1 Mrd. €",
      "employees": "1.200",
      "head": "Nina Warken (CDU)",
      "scandals": "Das elektronische Rezept fiel wegen eines Serverausfalls bundesweit für 6 Stunden aus, weshalb Apotheken wieder auf Papierrezepte zurückgreifen mussten.",
      "achievements": "Einführung der digitalen Patientenakte für alle Bürger mit optimierter Datenschutzkontrolle.",
      "description": "Gestaltet die Gesundheitspolitik, stärkt die Pflegeversicherung und sichert die Qualität des Gesundheitssystems.",
      "rooms": [
        {
          "name": "Pandemie-Stabsraum",
          "desc": "Wo die Inzidenzwerte historisch archiviert werden.",
          "item": "Desinfektionsgel-Brunnen"
        },
        {
          "name": "Medikamenten-Zulassung",
          "desc": "Hier stapeln sich Studien und Testberichte.",
          "item": "Riesen-Lupe für Beipackzettel"
        }
      ],
      "children": [
        {
          "id": "rki",
          "name": "Robert Koch-Institut",
          "short": "RKI",
          "type": "Behörde",
          "budget": "350 Mio. €",
          "employees": "1.400",
          "head": "Lars Schaade",
          "scandals": "Interne Protokolle des Corona-Krisenstabs wurden erst nach einer Klagewelle geschwärzt freigegeben.",
          "achievements": "Erfolgreiche Eindämmung der tropischen Tigermücke durch ein bundesweites Monitoring.",
          "description": "Das nationale Public-Health-Institut zur Erkennung, Verhütung und Bekämpfung von Krankheiten.",
          "x": -610,
          "y": 111,
          "colorKey": "sub"
        },
        {
          "id": "pei",
          "name": "Paul-Ehrlich-Institut",
          "short": "PEI",
          "type": "Behörde",
          "budget": "130 Mio. €",
          "employees": "900",
          "head": "Stefan Vieths (Präsident)",
          "scandals": "Die Zulassung eines neuen Grippe-Impfstoffs verzögerte sich wegen fehlender Papierunterschriften auf dem Postweg um einen Monat.",
          "achievements": "Schnellste Sicherheitsbewertung eines neuartigen Malaria-Impfstoffs für Entwicklungsregionen.",
          "description": "Bundesinstitut für Impfstoffe und biomedizinische Arzneimittel.",
          "x": -700,
          "y": 0,
          "colorKey": "sub"
        },
        {
          "id": "bfarm",
          "name": "Bundesinstitut für Arzneimittel und Medizinprodukte",
          "short": "BfArM",
          "type": "Behörde",
          "budget": "180 Mio. €",
          "employees": "1.100",
          "head": "Karl Broich",
          "scandals": "Ein Engpass-Melder für wichtige Antibiotika stufte die Versorgungslage als 'perfekt' ein, während Apotheken leerstanden.",
          "achievements": "Erfolgreiche und schnelle Zulassung innovativer Krebstherapien im EU-Verfahren.",
          "description": "Die Zulassungsbehörde für Humanarzneimittel in Deutschland mit Sitz in Bonn.",
          "x": -610,
          "y": -111,
          "colorKey": "sub"
        }
      ],
      "x": -480,
      "y": 0,
      "colorKey": "bmg"
    },
    {
      "id": "bmv",
      "name": "Bundesministerium für Verkehr",
      "short": "BMV",
      "type": "Ministerium",
      "budget": "38,4 Mrd. €",
      "employees": "1.650",
      "head": "Patrick Schnieder (CDU)",
      "scandals": "Ein Autobahnausbau-Projekt verteuerte sich um 150%, weil man im Fundament eine seltene Hamsterart fand, die einzeln umgesiedelt werden musste.",
      "achievements": "Start des Programms 'Schiene 2030' mit beschleunigter Sanierung der Hauptkorridore.",
      "description": "Verantwortlich für das Straßennetz, die Bundesschienenwege, die Wasserstraßen und die Luftfahrt.",
      "rooms": [
        {
          "name": "Trassen-Planungsbüro",
          "desc": "Große Ausklapptische mit Autobahnplänen und Eisenbahnnetzen.",
          "item": "Maßstabslineal (1:1000)"
        },
        {
          "name": "Brücken-Lagezentrum",
          "desc": "Überwachung maroder Brücken mit roten Warn-LEDs.",
          "item": "Stützkorsett-Modell für Autobahnbrücken"
        }
      ],
      "children": [
        {
          "id": "eba",
          "name": "Eisenbahn-Bundesamt",
          "short": "EBA",
          "type": "Behörde",
          "budget": "320 Mio. €",
          "employees": "1.400",
          "head": "Gerald Hörster",
          "scandals": "Extrem langwierige Genehmigungsverfahren für neue Weichen und Stellwerke.",
          "achievements": "Erfolgreiche Betriebszulassung des modernisierten ICE-Neo-Modells.",
          "description": "Aufsichts-, Sicherheits- und Zulassungsbehörde für Schienenwege und Züge.",
          "x": -603,
          "y": -143,
          "colorKey": "sub"
        },
        {
          "id": "kba",
          "name": "Kraftfahrt-Bundesamt",
          "short": "KBA",
          "type": "Behörde",
          "budget": "180 Mio. €",
          "employees": "1.100",
          "head": "Richard Damm",
          "scandals": "Späte Aufarbeitung des VW-Diesel-Abgasskandals unter Aufsichtsdruck.",
          "achievements": "Digitaler Abruf des Punktekontos in Flensburg mittels Personalausweis.",
          "description": "Zuständig für Typgenehmigungen von Autos, das Fahreignungsregister und Rückrufe.",
          "x": -528,
          "y": -325,
          "colorKey": "sub"
        },
        {
          "id": "wsv",
          "name": "Wasserstraßen- und Schifffahrtsverwaltung des Bundes",
          "short": "WSV",
          "type": "Behörde",
          "budget": "1,2 Mrd. €",
          "employees": "12.000",
          "head": "Eric Oehlmann",
          "scandals": "Sperrung eines wichtigen Rheinarms für Frachtschiffe, weil die Baggerung der Fahrrinne wegen mangelnder Ausschreibungen nicht rechtzeitig stattfand.",
          "achievements": "Modernisierung von 24 Schleusen im westdeutschen Kanalnetz zur Unterstützung des Binnenschifffahrt-Verkehrs.",
          "description": "Zuständig für die Sicherheit und Leichtigkeit des Verkehrs auf den Bundeswasserstraßen.",
          "x": -676,
          "y": -218,
          "colorKey": "sub"
        },
        {
          "id": "balm",
          "name": "Bundesamt für Logistik und Mobilität",
          "short": "BALM",
          "type": "Behörde",
          "budget": "210 Mio. €",
          "employees": "2.000",
          "head": "Christian Hoffmann",
          "scandals": "Lkw-Kontrollfahrzeuge konnten wochenlang keine Mautverstöße ahnden, weil das Funkmodul der On-Board-IT inkompatibel war.",
          "achievements": "Konsequente Überwachung des schweren Straßengüterverkehrs zur Vermeidung von Schäden an Brücken.",
          "description": "Reguliert und überwacht den Güterkraftverkehr, koordiniert Mautkontrollen und fördert die Fahrradmobilität.",
          "x": -632,
          "y": -323,
          "colorKey": "sub"
        }
      ],
      "x": -443,
      "y": -184,
      "colorKey": "bmv"
    },
    {
      "id": "bmuv",
      "name": "Bundesministerium für Umwelt und Klimaschutz",
      "short": "BMUV",
      "type": "Ministerium",
      "budget": "2,8 Mrd. €",
      "employees": "1.100",
      "head": "Carsten Schneider (SPD)",
      "scandals": "Ein gefördertes Pilotprojekt zur Rückgewinnung von CO2 aus Mooren entpuppte sich als einfacher Komposthaufen mit Internetanschluss.",
      "achievements": "Abschluss des nationalen Abfallvermeidungsplans mit klaren Vorgaben für recyclingfähige Verpackungen.",
      "description": "Schützt Gewässer, Boden, Luft und Biodiversität und treibt den nationalen Klimaschutz voran.",
      "rooms": [
        {
          "name": "Artenschutz-Zentrale",
          "desc": "Statistiken über Wölfe, Biber und Insektenpopulationen an Monitoren.",
          "item": "Wolfsspur-Gipsabdruck"
        },
        {
          "name": "Klimaschutz-Konferenz",
          "desc": "Klimafreundlich gekühlt durch ein innovatives Umluft-Pflanzensystem.",
          "item": "Solar-Ventilator"
        }
      ],
      "children": [
        {
          "id": "uba",
          "name": "Umweltbundesamt",
          "short": "UBA",
          "type": "Behörde",
          "budget": "380 Mio. €",
          "employees": "1.700",
          "head": "Dirk Messner",
          "scandals": "Der Neubau des UBA-Dienstsitzes in Dessau überschritt wegen mangelhafter Holz-Dämmung die Passivhaus-Grenzwerte im Winter.",
          "achievements": "Etablierung des bundesweiten Echtzeit-Messnetzes für Feinstaub und Stickoxide.",
          "description": "Die zentrale Umweltbehörde Deutschlands für wissenschaftliche Beratung und Umweltdaten.",
          "x": -510,
          "y": -353,
          "colorKey": "sub"
        },
        {
          "id": "bfs",
          "name": "Bundesamt für Strahlenschutz",
          "short": "BfS",
          "type": "Behörde",
          "budget": "115 Mio. €",
          "employees": "750",
          "head": "Inge Paulini",
          "scandals": "Ein veralteter Server meldete fälschlicherweise erhöhte kosmische Strahlung, was zu nächtlichen Notrufen von besorgten Sternenguckern führte.",
          "achievements": "Aufbau des nationalen Netzes zur Überwachung von Radon in Innenräumen.",
          "description": "Schützt Mensch und Umwelt vor den Gefahren ionisierender und nichtionisierender Strahlung.",
          "x": -495,
          "y": -495,
          "colorKey": "sub"
        },
        {
          "id": "bfn",
          "name": "Bundesamt für Naturschutz",
          "short": "BfN",
          "type": "Behörde",
          "budget": "85 Mio. €",
          "employees": "420",
          "head": "Sabine Riewenherm",
          "scandals": "Proteste von Landwirten, weil eine Karte geschützter Moore ein Getreidefeld eines Landwirts komplett umschloss.",
          "achievements": "Erfolgreiche Auswilderung des Luchses im Schwarzwald und Aufbau nationaler Biotopverbünde.",
          "description": "Wissenschaftliche Behörde des Bundes für nationalen und internationalen Naturschutz.",
          "x": -353,
          "y": -510,
          "colorKey": "sub"
        }
      ],
      "x": -339,
      "y": -339,
      "colorKey": "bmuv"
    },
    {
      "id": "bmwsb",
      "name": "Bundesministerium für Wohnen, Stadtentwicklung und Bauwesen",
      "short": "BMWSB",
      "type": "Ministerium",
      "budget": "6,1 Mrd. €",
      "employees": "450",
      "head": "Verena Hubertz (SPD)",
      "scandals": "Die 'Bau-Digital-Plattform' war monatelang nicht benutzbar, weil das System nur Dokumente im seltenen TIF-Grafikformat akzeptierte.",
      "achievements": "Rekordförderung von 150.000 neuen Sozialwohnungen über zinsgünstige Darlehen im Jahr 2025.",
      "description": "Verantwortlich für die Wohnungsbaupolitik, das Wohngeld, die Stadtentwicklung und das nachhaltige Bauen.",
      "rooms": [
        {
          "name": "Stadtplanungs-Saal",
          "desc": "Modelle zukünftiger autofreier Stadtviertel und grüner Metropolen.",
          "item": "Stadtmodell aus Recycling-Karton"
        },
        {
          "name": "Bauordnungs-Archiv",
          "desc": "Wo die berüchtigte DIN 18040 und andere Vorschriften lagern.",
          "item": "Prüflehre für Türrahmen"
        }
      ],
      "children": [
        {
          "id": "bbsr",
          "name": "Bundesinstitut für Bau-, Stadt- und Raumforschung",
          "short": "BBSR",
          "type": "Behörde",
          "budget": "45 Mio. €",
          "employees": "300",
          "head": "Sven Buch (kommissarisch)",
          "scandals": "Eine Studie zur 'Lebensqualität in deutschen Mittelstädten' stieß auf Kritik, weil die Forscher nur in Hotels mit mindestens 4 Sternen übernachteten.",
          "achievements": "Bereitstellung des nationalen Raumbeobachtungssystems zur gezielten Bekämpfung von Wohnungsmangel.",
          "description": "Unterstützt das Ministerium wissenschaftlich bei Aufgaben des Wohnungs-, Immobilien- und Bauwesens.",
          "x": -304,
          "y": -540,
          "colorKey": "sub"
        },
        {
          "id": "bbr",
          "name": "Bundesamt für Bauwesen und Raumordnung",
          "short": "BBR",
          "type": "Behörde",
          "budget": "140 Mio. €",
          "employees": "1.400",
          "head": "Petra Wesseler",
          "scandals": "Der Neubau einer Bundesbehörde verzögerte sich um drei Jahre, weil das importierte Holz nicht exakt der DIN-Norm entsprach.",
          "achievements": "Fertigstellung des modernen Erweiterungsbaus des Deutschen Bundestages im Kostenrahmen.",
          "description": "Betreut Bundesbauten im In- und Ausland und berät die Bundesregierung in Raumordnungsfragen.",
          "x": -167,
          "y": -597,
          "colorKey": "sub"
        }
      ],
      "x": -184,
      "y": -443,
      "colorKey": "bmwsb"
    },
    {
      "id": "bmds",
      "name": "Bundesministerium für Digitales und Staatsmodernisierung",
      "short": "BMDS",
      "type": "Ministerium",
      "budget": "2,5 Mrd. €",
      "employees": "600",
      "head": "Karsten Wildberger (parteilos)",
      "scandals": "Der geplante Launch des 'Single-Sign-On-Staatsbürgerportals' musste verschoben werden, weil der zentrale Server durch 100 parallele Anfragen überlastet war.",
      "achievements": "Einführung der digitalen Identität auf dem Smartphone ('E-ID-App') für 25 Millionen Bürger.",
      "description": "Unter Merz neu geschaffenes Schlüsselressort zur Bündelung der Digitalisierung, Staatsmodernisierung und Entbürokratisierung.",
      "rooms": [
        {
          "name": "Digital-War-Room",
          "desc": "Live-Monitore überwachen die Übertragungsgeschwindigkeiten deutscher Mobilfunknetze.",
          "item": "Glasfaser-Kabelstück (Vergoldet)"
        },
        {
          "name": "Entbürokratisierung",
          "desc": "Hier werden alte Formulare geschreddert und durch digitale Workflows ersetzt.",
          "item": "Akten-Schredder (Dauerbetrieb)"
        }
      ],
      "children": [
        {
          "id": "fitko",
          "name": "Föderale IT-Kooperation",
          "short": "FITKO",
          "type": "Behörde",
          "budget": "55 Mio. €",
          "employees": "180",
          "head": "Jörg Kremer",
          "scandals": "Ein Streit um das einheitliche Datenübertragungsformat zwischen Bund und Ländern blockierte ein halbes Jahr lang den Online-Wohngeldantrag.",
          "achievements": "Erfolgreiche Implementierung des einheitlichen Marktplatzes für E-Government-Software.",
          "description": "Die FITKO steuert die Digitalisierungsvorhaben des IT-Planungsrats von Bund und Ländern.",
          "x": -74,
          "y": -616,
          "colorKey": "sub"
        },
        {
          "id": "bva",
          "name": "Bundesverwaltungsamt",
          "short": "BVA",
          "type": "Behörde",
          "budget": "650 Mio. €",
          "employees": "6.200",
          "head": "Christoph Verenkotte",
          "scandals": "Ausfall des BAföG-Rückzahlungssystems für 48 Stunden wegen Datenbank-Überlastung bei Semesterbeginn.",
          "achievements": "Erfolgreiche Bündelung von über 150 Verwaltungsdienstleistungen für Bundesbehörden.",
          "description": "Der zentrale Dienstleister des Bundes, zuständig für BAföG, Bundesbesoldung und Registerbehörden.",
          "x": 74,
          "y": -616,
          "colorKey": "sub"
        }
      ],
      "x": 0,
      "y": -480,
      "colorKey": "bmds"
    },
    {
      "id": "bmftr",
      "name": "Bundesministerium für Forschung, Technologie und Raumfahrt",
      "short": "BMFTR",
      "type": "Ministerium",
      "budget": "18,5 Mrd. €",
      "employees": "1.300",
      "head": "Dorothee Bär (CSU)",
      "scandals": "'Flugtaxi-Debakel': Ein millionenschwer gefördertes Flugtaxi stürzte beim ersten unbemannten Testflug im Kanzleramtsgarten in einen Rosenbusch.",
      "achievements": "Erfolgreicher Start des ersten deutschen Umweltsatelliten 'Bavaria-1' zur präzisen Dürrebeobachtung.",
      "description": "Zuständig für die technologische Spitzenforschung, künstliche Intelligenz, Halbleitertechnologie und das nationale Raumfahrtprogramm.",
      "rooms": [
        {
          "name": "KI-Forschungslabor",
          "desc": "Supercomputer berechnen Sprachmodelle. Roboterhunde patrouillieren auf dem Gang.",
          "item": "Supercomputer-Kühltasse"
        },
        {
          "name": "Raumfahrt-Kontrollraum",
          "desc": "Live-Feed von europäischen Raketenstarts und Satellitenbahnen.",
          "item": "Modell-Teleskop"
        }
      ],
      "children": [
        {
          "id": "dlr",
          "name": "Deutsches Zentrum für Luft- und Raumfahrt",
          "short": "DLR",
          "type": "Behörde",
          "budget": "1,1 Mrd. €",
          "employees": "10.000",
          "head": "Anke Kaysser-Pyzalla",
          "scandals": "Ein autonomer Mars-Rover-Prototyp verwechselte im Testgelände eine Bierflasche mit extraterrestrischem Leben und begann, diese chemisch zu analysieren.",
          "achievements": "Entwicklung eines neuartigen, CO2-neutralen Triebwerks für die zivile Luftfahrt.",
          "description": "Forschungszentrum der Bundesrepublik für Luft- und Raumfahrt sowie Raumfahrtagentur für das deutsche Raumfahrtprogramm.",
          "x": 167,
          "y": -597,
          "colorKey": "sub"
        },
        {
          "id": "bfr",
          "name": "Bundesinstitut für Risikobewertung",
          "short": "BfR",
          "type": "Behörde",
          "budget": "125 Mio. €",
          "employees": "1.000",
          "head": "Andreas Hensel",
          "scandals": "Eine Warnung vor dem Verzehr roher Eier stieß in der gehobenen Gastronomie auf Protest wegen übertriebener Vorsicht.",
          "achievements": "Fundierte Risikoanalyse von Mikroplastik in Lebensmitteln mit internationaler Beachtung.",
          "description": "Erstellt wissenschaftliche Gutachten zur Lebensmittelsicherheit sowie zum Schutz von Verbrauchern.",
          "x": 304,
          "y": -540,
          "colorKey": "sub"
        }
      ],
      "x": 184,
      "y": -443,
      "colorKey": "bmftr"
    },
    {
      "id": "bmfsfj",
      "name": "Bundesministerium für Bildung, Familie, Senioren, Frauen und Jugend",
      "short": "BMFSFJ",
      "type": "Ministerium",
      "budget": "14,2 Mrd. €",
      "employees": "1.200",
      "head": "Karin Prien (CDU)",
      "scandals": "Die geplante 'Digital-Kita-Plattform' scheiterte im ersten Jahr daran, dass die Kitas mangels Breitbandkabeln die Anmeldedaten per USB-Stick einschicken mussten.",
      "achievements": "Erhöhung des BAföG-Höchstsatzes und Einführung des 'Familien-Chancen-Budgets'.",
      "description": "Reorganisiertes Ministerium unter Merz, welches die soziale Bildungsförderung mit Familien- und Generationenpolitik vereint.",
      "rooms": [
        {
          "name": "Kita-Zukunfts-Lab",
          "desc": "Spielecken kombiniert mit Tablets. Prototypen für modernes Lernen.",
          "item": "Holz-Tablet-Attrappe"
        },
        {
          "name": "Generationen-Treff",
          "desc": "Konferenzraum mit barrierefreiem Zugang und digitaler Vorlese-Ecke.",
          "item": "Riesen-Hörbuch-Knopf"
        }
      ],
      "children": [
        {
          "id": "bafza",
          "name": "Bundesamt für Familie und zivilgesellschaftliche Aufgaben",
          "short": "BAFzA",
          "type": "Behörde",
          "budget": "210 Mio. €",
          "employees": "1.100",
          "head": "Helga Roesgen",
          "scandals": "Die Zuweisung von Bundesfreiwilligendienstleistenden an Altenheime verzögerte sich wegen fehlender digitale Signaturen der Träger.",
          "achievements": "Erfolgreiche Koordinierung von über 50.000 Freiwilligen im zivilgesellschaftlichen Bereich.",
          "description": "Führt Aufgaben des Bundesfreiwilligendienstes, der Altenpflegeausbildung und Familienförderung durch.",
          "x": 383,
          "y": -488,
          "colorKey": "sub"
        },
        {
          "id": "bzkj",
          "name": "Bundeszentrale für Kinder- und Jugendmedienschutz",
          "short": "BzKJ",
          "type": "Behörde",
          "budget": "35 Mio. €",
          "employees": "150",
          "head": "Sebastian Gutknecht",
          "scandals": "Die Indizierung eines klassischen pixeligen 90er-Jahre-Spiels führte wegen missverständlicher Beurteilungskriterien zu heftigen Online-Debatten.",
          "achievements": "Erfolgreiche Etablierung des bundesweiten Elternratgebers 'Gutes Aufwachsen mit Medien'.",
          "description": "Prüft und indiziert jugendgefährdende Medien und stärkt den Schutz von Kindern in der digitalen Medienwelt.",
          "x": 488,
          "y": -383,
          "colorKey": "sub"
        }
      ],
      "x": 339,
      "y": -339,
      "colorKey": "bmfsfj"
    },
    {
      "id": "bmz",
      "name": "Bundesministerium für wirtschaftliche Zusammenarbeit und Entwicklung",
      "short": "BMZ",
      "type": "Ministerium",
      "budget": "10,3 Mrd. €",
      "employees": "1.100",
      "head": "Reem Alabali-Radovan (SPD)",
      "scandals": "Ein Projekt zur Förderung nachhaltiger Imkerei in Mittelamerika kaufte versehentlich Luxus-Bienenstöcke aus Mahagoniholz, was den Bundesrechnungshof erzürnte.",
      "achievements": "Etablierung der 'Globalen Partnerschaft für sauberes Wasser', wodurch 5 Millionen Menschen Zugang zu Trinkwasser erhielten.",
      "description": "Zuständig für die deutsche Entwicklungszusammenarbeit und internationale Klimaziele in Entwicklungsländern.",
      "rooms": [
        {
          "name": "Global-Liaison-Office",
          "desc": "Hier werden Videokonferenzen mit Partnern auf allen Kontinenten koordiniert.",
          "item": "Globus mit solarbetriebenem Leuchtring"
        },
        {
          "name": "Projekt-Validierungsstelle",
          "desc": "Prüfung von Nachhaltigkeitskriterien und Mittelverwendung.",
          "item": "Prüfstempel 'NACHHALTIG'"
        }
      ],
      "children": [
        {
          "id": "deval",
          "name": "Deutsches Evaluierungsinstitut der Entwicklungszusammenarbeit",
          "short": "DEval",
          "type": "Behörde",
          "budget": "15 Mio. €",
          "employees": "90",
          "head": "Jörg Faust",
          "scandals": "Eine kritische Studie zur Wirksamkeit von Solaranlagen-Projekten wurde verzögert veröffentlicht, um diplomatische Spannungen zu vermeiden.",
          "achievements": "Etablierung des international anerkannten Standards zur exakten Wirkungsmessung von Bildungsprojekten.",
          "description": "Evaluiert die Maßnahmen der deutschen Entwicklungszusammenarbeit unabhängig auf Wirksamkeit.",
          "x": 540,
          "y": -304,
          "colorKey": "sub"
        },
        {
          "id": "giz",
          "name": "Deutsche Gesellschaft für Internationale Zusammenarbeit",
          "short": "GIZ",
          "type": "Behörde",
          "budget": "4,3 Mrd. €",
          "employees": "25.000",
          "head": "Thorsten Schäfer-Gümbel",
          "scandals": "Die Errichtung einer klimafreundlichen Fischfarm in Afrika scheiterte, weil die Teiche in der Trockenzeit mangels Wasserzufuhr austrockneten.",
          "achievements": "Erfolgreiche Umsetzung von Projekten für erneuerbare Energien in über 120 Partnerländern.",
          "description": "Die staatseigene Durchführungsorganisation der deutschen Entwicklungszusammenarbeit.",
          "x": 597,
          "y": -167,
          "colorKey": "sub"
        }
      ],
      "x": 443,
      "y": -184,
      "colorKey": "bmz"
    },
    {
      "id": "bnd",
      "name": "Bundesnachrichtendienst",
      "short": "BND",
      "type": "Behörde",
      "budget": "1,1 Mrd. €",
      "employees": "6.500",
      "head": "Thomas Haldenwang (Präsident)",
      "colorKey": "sub",
      "x": -90,
      "y": -140,
      "scandals": "Der versehentliche Verlust von vertraulichen Bauplänen des Hauptquartiers in Berlin durch einen unverschlüsselten USB-Stick im Kopierraum.",
      "achievements": "Frühzeitige Entdeckung von Cyber-Bedrohungen durch den Einsatz der neuen 'Operation Quanten-Spur'.",
      "description": "Der deutsche Auslandsnachrichtendienst sammelt zivile und militärische Informationen aus dem Ausland zur Sicherheitsvorsorge."
    },
    {
      "id": "bpa",
      "name": "Presse- und Informationsamt der Bundesregierung",
      "short": "BPA",
      "type": "Behörde",
      "budget": "160 Mio. €",
      "employees": "480",
      "head": "Steffen Hebestreit",
      "colorKey": "sub",
      "x": 90,
      "y": -140,
      "scandals": "Die 'Spätschicht-Social-Media-Panne', bei der auf dem offiziellen Kanal des Kanzlers ein Bild eines schlafenden Koalabären gepostet wurde.",
      "achievements": "Erfolgreiche Aufklärungskampagne zum Bürokratieabbau über humorvolle Erklärvideos.",
      "description": "Informiert Bürger und Medien über die Politik der Bundesregierung und unterrichtet den Bundeskanzler über die Nachrichtenlage."
    }
  ]
};

// --- MOCK BÜROKRATIE-SPRÜCHE ---
const sprueche = [
  "„Eine Behörde ist ein Organismus, der sich selbst beschäftigt.“",
  "„Wer in der Digitalisierung pennt, kriegt erst recht eine Akte geschenkt.“",
  "„Zuständigkeit ist das Recht, eine Sache so lange liegenzulassen, bis sie sich von selbst erledigt.“",
  "„Passierschein A38 liegt in Zimmer 402, Bereich Z. Bringen Sie drei Stempel mit.“",
  "„Der Amtsschimmel schläft nie, er kaut nur Akten.“",
  "„Ein Formular ist ein amtliches Blatt Papier, das das Unmögliche verkompliziert.“",
  "„Deutschland: Wo die Brieftaube schneller ist als das digitale Behördennetz.“"
];

// Node Types for React Flow
const nodeTypes = {
  custom: CustomNode,
};

// Helper to recursively find an entity
function findEntityById(node, id) {
  if (node.id === id) return node;
  if (node.children) {
    for (const child of node.children) {
      const found = findEntityById(child, id);
      if (found) return found;
    }
  }
  return null;
}

// Flat list of all entities for search and indexing
function flattenTree(node, list = []) {
  list.push(node);
  if (node.children) {
    node.children.forEach(child => flattenTree(child, list));
  }
  return list;
}
const flatEntities = flattenTree(staatData);

// React Flow layout algorithm
function computeLayout(tree) {
  const nodes = [];
  const edges = [];
  let leafCount = 0;

  function traverse(node, parentId = null, depth = 0) {
    const currentId = node.id;
    
    const flowNode = {
      id: currentId,
      type: 'custom',
      data: {
        id: node.id,
        name: node.name,
        short: node.short,
        type: node.type,
        budget: node.budget,
        employees: node.employees,
        head: node.head,
        children: node.children
      },
      position: { x: 0, y: depth * 220 + 50 },
    };
    
    nodes.push(flowNode);
    
    if (parentId) {
      edges.push({
        id: `e-${parentId}-${currentId}`,
        source: parentId,
        target: currentId,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#3b82f6', strokeWidth: 2 },
      });
    }

    if (!node.children || node.children.length === 0) {
      flowNode.position.x = leafCount * 320;
      leafCount++;
      return flowNode.position.x;
    } else {
      const childXPositions = [];
      for (const child of node.children) {
        const childX = traverse(child, currentId, depth + 1);
        childXPositions.push(childX);
      }
      const avgX = childXPositions.reduce((a, b) => a + b, 0) / childXPositions.length;
      flowNode.position.x = avgX;
      return avgX;
    }
  }

  traverse(tree);
  return { nodes, edges };
}

const { nodes: initialNodes, edges: initialEdges } = computeLayout(staatData);

const renderArchitecturalBuilding = (entity, isSelected, amtsschimmel) => {
  const budgetNum = parseFloat(entity.budget.replace(',', '.')) || 1.0;
  
  // Calculate floors based on budget (escalating story height)
  let floors = 1;
  if (budgetNum >= 50.0) floors = 6;
  else if (budgetNum >= 30.0) floors = 5;
  else if (budgetNum >= 15.0) floors = 4;
  else if (budgetNum >= 2.0) floors = 3;
  else if (budgetNum >= 0.5) floors = 2;

  const isHighlighted = isSelected;
  const strokeColor = isHighlighted ? '#2563eb' : '#111827'; // Blueprint blue or crisp dark slate
  const strokeWidth = isHighlighted ? 1.8 : 1.2;

  // Render a custom designed building based on the entity id
  switch (entity.id) {
    case 'bund': { // Bundeskanzleramt (Federal Chancellery)
      const wingHeight = floors * 11;
      const wingY = 98 - wingHeight;
      const centerHeight = floors * 11 + 18;
      const centerY = 98 - centerHeight;
      return (
        <svg viewBox="0 0 120 120" className="w-full h-full transition-all duration-300">
          {/* Construction guides if amtsschimmel is active */}
          {amtsschimmel > 20 && (
            <g className="arch-path-dash opacity-35">
              <line x1="10" y1="98" x2="110" y2="98" />
              <line x1="60" y1="10" x2="60" y2="115" />
              <line x1="15" y1="20" x2="15" y2="115" />
              <line x1="105" y1="20" x2="105" y2="115" />
              <circle cx="60" cy={centerY + 22} r="25" />
            </g>
          )}
          {/* Foundation */}
          <rect x="8" y="98" width="104" height="6" className="arch-path-filled" stroke={strokeColor} strokeWidth={strokeWidth} fill="url(#arch-hatch-pattern)" />
          <line x1="8" y1="101" x2="112" y2="101" stroke={strokeColor} strokeWidth="0.8" className="arch-path-thin" />
          
          {/* Left Wing */}
          <rect x="14" y={wingY} width="22" height={wingHeight} className="arch-path-filled" stroke={strokeColor} strokeWidth={strokeWidth} />
          {/* Right Wing */}
          <rect x="84" y={wingY} width="22" height={wingHeight} className="arch-path-filled" stroke={strokeColor} strokeWidth={strokeWidth} />
          
          {/* Central wash machine building */}
          <rect x="36" y={centerY} width="48" height={centerHeight} className="arch-path-filled" stroke={strokeColor} strokeWidth={strokeWidth} />
          
          {/* Giant circle window cutout representing the Waschmaschine */}
          <circle cx="60" cy={centerY + 22} r="14" className="arch-path" stroke={strokeColor} strokeWidth={strokeWidth} />
          <circle cx="60" cy={centerY + 22} r="10" className="arch-path-thin" />
          <line x1="60" y1={centerY + 4} x2="60" y2={centerY + 40} className="arch-path-dash opacity-40" />
          <line x1="42" y1={centerY + 22} x2="78" y2={centerY + 22} className="arch-path-dash opacity-40" />

          {/* Windows inside Wings (Dynamic Floors) */}
          {Array.from({ length: floors }).map((_, i) => {
            const y = wingY + (i * 11) + 2;
            return (
              <g key={`win-bund-${i}`}>
                {/* Left wing windows */}
                <rect x="18" y={y} width="6" height="6" className="arch-path-thin" />
                <rect x="26" y={y} width="6" height="6" className="arch-path-thin" />
                {/* Right wing windows */}
                <rect x="88" y={y} width="6" height="6" className="arch-path-thin" />
                <rect x="96" y={y} width="6" height="6" className="arch-path-thin" />
                {/* Floor grid lines */}
                <line x1="14" y1={y + 8} x2="36" y2={y + 8} className="arch-path-thin" />
                <line x1="84" y1={y + 8} x2="106" y2={y + 8} className="arch-path-thin" />
              </g>
            );
          })}
          
          {/* Entrance Door */}
          <rect x="52" y="80" width="16" height="18" className="arch-path-filled" stroke={strokeColor} strokeWidth={strokeWidth} />
          <line x1="60" y1="80" x2="60" y2="98" className="arch-path-thin" />
          
          {/* German flag on top */}
          <line x1="60" y1={centerY - 18} x2="60" y2={centerY} className="arch-path" stroke={strokeColor} strokeWidth={strokeWidth} />
          <polygon points={`60,${centerY - 18} 74,${centerY - 13} 60,${centerY - 8}`} className="arch-path-filled" stroke={strokeColor} strokeWidth={strokeWidth} fill="url(#arch-hatch-pattern)" />

          {/* CAD measurements labels */}
          {amtsschimmel > 20 && (
            <g className="arch-path-thin opacity-50 font-mono-tech" style={{ fontSize: '6px' }}>
              <text x="9" y={wingY - 4} fill="#4b5563">[H: {12 * floors}m]</text>
              <line x1="10" y1={wingY} x2="10" y2="98" className="arch-path-dash" />
            </g>
          )}
        </svg>
      );
    }
      
    case 'bmf': { // Finanzministerium (Federal Ministry of Finance)
      const baseHeight = 16;
      const baseFloorY = 98 - baseHeight;
      const middleHeight = floors * 11;
      const middleY = baseFloorY - middleHeight;
      const roofY = middleY;
      return (
        <svg viewBox="0 0 120 120" className="w-full h-full transition-all duration-300">
          {/* Construction guidelines */}
          {amtsschimmel > 20 && (
            <g className="arch-path-dash opacity-30">
              <line x1="15" y1={roofY} x2="105" y2={roofY} />
              <line x1="60" y1="10" x2="60" y2="110" />
              <line x1="12" y1="10" x2="12" y2="110" />
              <line x1="108" y1="10" x2="108" y2="110" />
            </g>
          )}
          {/* Base Vault Foundation Block */}
          <rect x="12" y={baseFloorY} width="96" height={baseHeight} className="arch-path-filled" stroke={strokeColor} strokeWidth={strokeWidth} fill="url(#arch-hatch-pattern)" />
          {/* Heavy metal vault door */}
          <rect x="48" y={baseFloorY + 2} width="24" height="14" className="arch-path-filled" stroke={strokeColor} strokeWidth={strokeWidth} />
          <circle cx="60" cy={baseFloorY + 9} r="4" className="arch-path" stroke={strokeColor} strokeWidth={strokeWidth} />
          <line x1="53" y1={baseFloorY + 9} x2="67" y2={baseFloorY + 9} className="arch-path-thin" />
          <line x1="60" y1={baseFloorY + 2} x2="60" y2={baseFloorY + 16} className="arch-path-thin" />

          {/* Stacked Classical Columns and Office Floors */}
          {Array.from({ length: floors }).map((_, i) => {
            const y = baseFloorY - (i * 11) - 11;
            return (
              <g key={`bmf-floor-${i}`}>
                {/* Outer frame */}
                <rect x="12" y={y} width="96" height="11" className="arch-path-filled" stroke={strokeColor} strokeWidth={strokeWidth} />
                {/* Neoclassical pilasters / columns */}
                <rect x="16" y={y} width="4" height="11" className="arch-path-thin" fill="#ffffff" />
                <rect x="36" y={y} width="4" height="11" className="arch-path-thin" fill="#ffffff" />
                <rect x="58" y={y} width="4" height="11" className="arch-path-thin" fill="#ffffff" />
                <rect x="80" y={y} width="4" height="11" className="arch-path-thin" fill="#ffffff" />
                <rect x="100" y={y} width="4" height="11" className="arch-path-thin" fill="#ffffff" />
                {/* Detailed window panes */}
                <rect x="23" y={y + 2} width="10" height="7" className="arch-path-thin" />
                <rect x="44" y={y + 2} width="10" height="7" className="arch-path-thin" />
                <rect x="67" y={y + 2} width="10" height="7" className="arch-path-thin" />
                <rect x="87" y={y + 2} width="10" height="7" className="arch-path-thin" />
              </g>
            );
          })}

          {/* Pediment (Grand Triangle) sitting exactly on top of the stacked floors */}
          <polygon points={`10,${roofY} 60,${roofY - 24} 110,${roofY}`} className="arch-path-filled" stroke={strokeColor} strokeWidth={strokeWidth} fill="url(#arch-hatch-pattern)" />
          <polygon points={`18,${roofY - 2} 60,${roofY - 20} 102,${roofY - 2}`} className="arch-path-thin" />
          
          {/* Balance scales of justice / treasury on top */}
          <line x1="60" y1={roofY - 24} x2="60" y2={roofY - 34} className="arch-path" stroke={strokeColor} strokeWidth={strokeWidth} />
          <line x1="50" y1={roofY - 34} x2="70" y2={roofY - 34} className="arch-path" stroke={strokeColor} strokeWidth={strokeWidth} />
          <line x1="50" y1={roofY - 34} x2="50" y2={roofY - 28} className="arch-path-thin" />
          <line x1="70" y1={roofY - 34} x2="70" y2={roofY - 28} className="arch-path-thin" />
          <circle cx="50" cy={roofY - 28} r="2.5" className="arch-path-filled" stroke={strokeColor} />
          <circle cx="70" cy={roofY - 28} r="2.5" className="arch-path-filled" stroke={strokeColor} />

          {amtsschimmel > 20 && (
            <text x="60" y={roofY - 3} className="font-mono-tech fill-slate-800 text-[6px] text-center" textAnchor="middle">TREASURY</text>
          )}
        </svg>
      );
    }
      
    case 'bmdv':
    case 'bmv': { // Digitales & Verkehr / Verkehr (2026)
      const baseHeight = 14;
      const baseFloorY = 98 - baseHeight;
      const stackHeight = floors * 11;
      const towerY = baseFloorY - stackHeight;
      return (
        <svg viewBox="0 0 120 120" className="w-full h-full transition-all duration-300">
          {/* Foundation and Freeway arches */}
          <rect x="15" y="98" width="90" height="6" className="arch-path-filled" stroke={strokeColor} strokeWidth={strokeWidth} fill="url(#arch-hatch-pattern)" />
          
          {/* Curved high-precision freeway loops */}
          <path d="M 8 98 Q 60 62 112 98" className="arch-path" stroke={strokeColor} strokeWidth={strokeWidth + 0.4} fill="none" />
          <path d="M 8 94 Q 60 58 112 94" className="arch-path-dash" />
          <line x1="30" y1="84" x2="30" y2="98" className="arch-path-thin" />
          <line x1="90" y1="84" x2="90" y2="98" className="arch-path-thin" />
          
          {/* Technical train line layout */}
          <line x1="15" y1="98" x2="105" y2="98" className="arch-path" stroke={strokeColor} strokeWidth={1.5} />
          {Array.from({ length: 15 }).map((_, i) => (
            <line key={`rail-${i}`} x1={18 + i * 6} y1="96" x2={22 + i * 6} y2="100" className="arch-path-thin" />
          ))}

          {/* Central Skyscraper Core (Stacked Floors) */}
          <rect x="36" y={towerY} width="48" height={stackHeight + baseHeight - 4} className="arch-path-filled" stroke={strokeColor} strokeWidth={strokeWidth} />
          
          {/* Grid window rows with structural diagonal CAD truss marks */}
          {Array.from({ length: floors }).map((_, i) => {
            const y = baseFloorY - (i * 11) - 11;
            return (
              <g key={`bmdv-floor-${i}`}>
                {/* Structural bracing */}
                <line x1="36" y1={y} x2="84" y2={y + 11} className="arch-path-thin opacity-40" />
                <line x1="84" y1={y} x2="36" y2={y + 11} className="arch-path-thin opacity-40" />
                
                {/* Server grid windows */}
                <rect x="41" y={y + 2.5} width="8" height="6" className="arch-path-thin" />
                <rect x="52" y={y + 2.5} width="6" height="6" className="arch-path-thin" />
                <rect x="61" y={y + 2.5} width="6" height="6" className="arch-path-thin" />
                <rect x="71" y={y + 2.5} width="8" height="6" className="arch-path-thin" />
                
                {/* Floor separator */}
                <line x1="36" y1={y + 11} x2="84" y2={y + 11} className="arch-path-thin" />
              </g>
            );
          })}
          
          {/* Satellite Dish and Scaffolding Antenna on top */}
          <line x1="60" y1={towerY} x2="60" y2={towerY - 26} className="arch-path" stroke={strokeColor} strokeWidth={strokeWidth} />
          {/* Antenna trusses */}
          <line x1="55" y1={towerY} x2="60" y2={towerY - 14} className="arch-path-thin" />
          <line x1="65" y1={towerY} x2="60" y2={towerY - 14} className="arch-path-thin" />
          
          {/* Concentric broadcast waves */}
          <circle cx="60" cy={towerY - 26} r="4" className="arch-path-filled" stroke={strokeColor} />
          <path d={`M ${60 - 8} ${towerY - 32} A 10,10 0 0,1 ${60 + 8},${towerY - 32}`} className="arch-path-dash" />
          <path d={`M ${60 - 14} ${towerY - 38} A 18,18 0 0,1 ${60 + 14},${towerY - 38}`} className="arch-path-dash" />

          {/* Large parabolic radar on left corner */}
          <path d={`M ${36 - 4} ${towerY + 4} A 6,6 0 0,1 ${36 + 6},${towerY - 6}`} className="arch-path-filled" stroke={strokeColor} strokeWidth={strokeWidth} fill="url(#arch-hatch-pattern)" />
          <line x1={36} y1={towerY} x2={36 - 6} y2={towerY - 10} className="arch-path" stroke={strokeColor} strokeWidth={strokeWidth} />
        </svg>
      );
    }
      
    case 'bmvg': { // Verteidigung (Defense - Tiered Fortress)
      // We stack floors as pyramidal stepped defensive decks
      const deckHeight = 11;
      const baseWidth = 102;
      return (
        <svg viewBox="0 0 120 120" className="w-full h-full transition-all duration-300">
          {/* Foundation */}
          <rect x="6" y="98" width="108" height="6" className="arch-path-filled" stroke={strokeColor} strokeWidth={strokeWidth} fill="url(#arch-hatch-pattern)" />

          {/* Stepped Fortress Decks */}
          {Array.from({ length: floors }).map((_, i) => {
            const w = baseWidth - (i * 12);
            const x = 60 - w / 2;
            const y = 98 - (i * deckHeight) - deckHeight;
            return (
              <g key={`bmvg-fort-${i}`}>
                {/* Crenellated fortress block */}
                <rect x={x} y={y} width={w} height={deckHeight} className="arch-path-filled" stroke={strokeColor} strokeWidth={strokeWidth} />
                
                {/* Heavy brick hatching patterns on side walls */}
                <rect x={x} y={y} width="10" height={deckHeight} className="arch-path" stroke={strokeColor} strokeWidth={0.8} fill="url(#arch-hatch-pattern)" />
                <rect x={x + w - 10} y={y} width="10" height={deckHeight} className="arch-path" stroke={strokeColor} strokeWidth={0.8} fill="url(#arch-hatch-pattern)" />

                {/* Slit defense ports / bunker windows */}
                {Array.from({ length: Math.max(2, 6 - i) }).map((_, wIndex) => {
                  const slitX = x + 16 + wIndex * 12;
                  if (slitX > x + w - 14) return null;
                  return (
                    <rect key={`slit-${i}-${wIndex}`} x={slitX} y={y + 3} width="3" height="5" className="arch-path-filled" fill="#111827" stroke={strokeColor} strokeWidth={0.6} />
                  );
                })}

                {/* Battlement teeth (Crenellations) on the roof of this deck */}
                {Array.from({ length: Math.floor(w / 8) }).map((_, cIndex) => {
                  const toothX = x + cIndex * 8 + 1;
                  if (toothX > x + w - 7) return null;
                  return (
                    <rect key={`tooth-${i}-${cIndex}`} x={toothX} y={y - 2.5} width="5" height="3" className="arch-path-filled" stroke={strokeColor} strokeWidth={0.8} />
                  );
                })}
              </g>
            );
          })}

          {/* Upper Defense Command Deck sitting on the highest tier */}
          {(() => {
            const topW = baseWidth - (floors * 12);
            const topX = 60 - topW / 2;
            const topY = 98 - (floors * deckHeight);
            return (
              <g>
                {/* Dome radar */}
                <path d={`M ${60 - 8} ${topY} A 8,8 0 0,1 ${60 + 8},${topY}`} className="arch-path-filled" stroke={strokeColor} strokeWidth={strokeWidth} fill="url(#arch-hatch-pattern)" />
                {/* Anti-air defensive turret lines */}
                <line x1="48" y1={topY} x2="40" y2={topY - 10} className="arch-path" stroke={strokeColor} strokeWidth={1.8} />
                <line x1="72" y1={topY} x2="80" y2={topY - 10} className="arch-path" stroke={strokeColor} strokeWidth={1.8} />
                {/* Surveillance radio pole */}
                <line x1="60" y1={topY - 8} x2="60" y2={topY - 24} className="arch-path-thin" />
                <line x1="56" y1={topY - 18} x2="64" y2={topY - 18} className="arch-path-thin" />
              </g>
            );
          })()}
        </svg>
      );
    }
      
    case 'bmbf':
    case 'bmftr': { // Bildung & Forschung / Forschung, Technologie & Raumfahrt (2026)
      // Staggered cantilevered modules stacked vertically
      const modHeight = 11;
      const baseFloorY = 98;
      return (
        <svg viewBox="0 0 120 120" className="w-full h-full transition-all duration-300">
          {/* Foundation */}
          <rect x="12" y="98" width="96" height="6" className="arch-path-filled" stroke={strokeColor} strokeWidth={strokeWidth} fill="url(#arch-hatch-pattern)" />

          {/* Stacked scientific laboratory blocks (Alternating/Cantilevered) */}
          {Array.from({ length: floors }).map((_, i) => {
            // Alternate x positions for gorgeous modular architecture
            const isLeft = i % 2 === 0;
            const x = isLeft ? 18 : 46;
            const y = baseFloorY - (i * modHeight) - modHeight;
            const w = 56;
            
            return (
              <g key={`bmbf-mod-${i}`}>
                {/* Cantilever support grid lines underneath the overhangs */}
                {isLeft ? (
                  <line x1="78" y1={y + 11} x2="100" y2={y + 22} className="arch-path-dash opacity-30" />
                ) : (
                  <line x1="16" y1={y + 22} x2="42" y2={y + 11} className="arch-path-dash opacity-30" />
                )}

                {/* Laboratory modular container */}
                <rect x={x} y={y} width={w} height={modHeight} className="arch-path-filled" stroke={strokeColor} strokeWidth={strokeWidth} />
                
                {/* Thematic internal graphics drawn as thin vector lines */}
                {i === 0 && ( // Floor 0: Chemical molecules
                  <g className="opacity-80">
                    <circle cx={x + 12} cy={y + 5.5} r="2" className="arch-path-filled" stroke={strokeColor} strokeWidth={0.8} />
                    <circle cx={x + 24} cy={y + 3.5} r="1.5" className="arch-path-filled" stroke={strokeColor} strokeWidth={0.8} />
                    <circle cx={x + 36} cy={y + 7.5} r="2" className="arch-path-filled" stroke={strokeColor} strokeWidth={0.8} />
                    <line x1={x + 14} y1={y + 5.5} x2={x + 22.5} y2={y + 3.5} className="arch-path-thin" />
                    <line x1={x + 25.5} y1={y + 3.5} x2={x + 34.5} y2={y + 7.5} className="arch-path-thin" />
                  </g>
                )}
                {i === 1 && ( // Floor 1: DNA Double Helix Ladder
                  <g className="opacity-70">
                    <path d={`M ${x + 6} ${y + 2} Q ${x + 24} ${y + 9} ${x + 48} ${y + 2}`} className="arch-path-thin" fill="none" />
                    <path d={`M ${x + 6} ${y + 9} Q ${x + 24} ${y + 2} ${x + 48} ${y + 9}`} className="arch-path-thin" fill="none" />
                    {Array.from({ length: 8 }).map((_, idx) => (
                      <line key={`dna-${idx}`} x1={x + 10 + idx * 5} y1={y + 2} x2={x + 10 + idx * 5} y2={y + 9} className="arch-path-thin" />
                    ))}
                  </g>
                )}
                {i === 2 && ( // Floor 2: Glowing circuit paths
                  <g className="opacity-80">
                    <line x1={x + 8} y1={y + 5.5} x2={x + 24} y2={y + 5.5} className="arch-path-thin" />
                    <line x1={x + 24} y1={y + 5.5} x2={x + 30} y2={y + 2.5} className="arch-path-thin" />
                    <line x1={x + 24} y1={y + 5.5} x2={x + 30} y2={y + 8.5} className="arch-path-thin" />
                    <circle cx={x + 30} cy={y + 2.5} r="1" className="arch-path-filled" stroke={strokeColor} />
                    <circle cx={x + 30} cy={y + 8.5} r="1" className="arch-path-filled" stroke={strokeColor} />
                  </g>
                )}
                {i >= 3 && ( // Floor 3+: Geometric structural solar cells
                  <g className="opacity-70">
                    <line x1={x} y1={y} x2={x + w} y2={y + 11} className="arch-path-thin" />
                    <line x1={x + w} y1={y} x2={x} y2={y + 11} className="arch-path-thin" />
                  </g>
                )}
                
                {/* Modular structural panels / borders */}
                <line x1={x + 14} y1={y} x2={x + 14} y2={y + 11} className="arch-path-thin" />
                <line x1={x + w - 14} y1={y} x2={x + w - 14} y2={y + 11} className="arch-path-thin" />
              </g>
            );
          })}

          {/* Astronomical observatory dome sitting on the top module */}
          {(() => {
            const topIsLeft = (floors - 1) % 2 === 0;
            const topX = topIsLeft ? 18 : 46;
            const topY = baseFloorY - (floors * modHeight);
            return (
              <g>
                {/* Observatory dome frame */}
                <path d={`M ${topX + 16} ${topY} A 12,12 0 0,1 ${topX + 40},${topY}`} className="arch-path-filled" stroke={strokeColor} strokeWidth={strokeWidth} fill="url(#arch-hatch-pattern)" />
                {/* Detailed telescope emerging from the hatch */}
                <line x1={topX + 28} y1={topY - 4} x2={topX + 42} y2={topY - 18} className="arch-path" stroke={strokeColor} strokeWidth={2.4} />
                <line x1={topX + 28} y1={topY - 4} x2={topX + 42} y2={topY - 18} className="arch-path-thin" stroke="#ffffff" strokeWidth={0.8} />
                {/* Telescope focal ring */}
                <circle cx={topX + 42} cy={topY - 18} r="2" className="arch-path-filled" stroke={strokeColor} />
                {/* Target laser dash lines */}
                <line x1={topX + 42} y1={topY - 18} x2={topX + 62} y2={topY - 38} className="arch-path-dash opacity-40" />
              </g>
            );
          })()}
        </svg>
      );
    }
      
    case 'bafin': { // BaFin (Aufsichts-Tower)
      const baseHeight = 16;
      const baseFloorY = 98 - baseHeight;
      const stackHeight = floors * 10;
      const towerY = baseFloorY - stackHeight;
      return (
        <svg viewBox="0 0 120 120" className="w-full h-full transition-all duration-300">
          {/* Foundation */}
          <rect x="25" y="98" width="70" height="6" className="arch-path-filled" stroke={strokeColor} strokeWidth={strokeWidth} fill="url(#arch-hatch-pattern)" />

          {/* Heavy security bank vault base door */}
          <rect x="36" y={baseFloorY} width="48" height={baseHeight} className="arch-path-filled" stroke={strokeColor} strokeWidth={strokeWidth} />
          <circle cx="60" cy={baseFloorY + 8} r="6.5" className="arch-path" stroke={strokeColor} strokeWidth={strokeWidth} />
          {/* Dial lock notches */}
          {Array.from({ length: 8 }).map((_, idx) => {
            const angle = (idx * 45 * Math.PI) / 180;
            const x1 = 60 + Math.cos(angle) * 4;
            const y1 = baseFloorY + 8 + Math.sin(angle) * 4;
            const x2 = 60 + Math.cos(angle) * 6.5;
            const y2 = baseFloorY + 8 + Math.sin(angle) * 6.5;
            return <line key={`dial-${idx}`} x1={x1} y1={y1} x2={x2} y2={y2} className="arch-path-thin" stroke={strokeColor} />;
          })}
          
          {/* High-security Tower stories (Stacked floors) */}
          <rect x="42" y={towerY} width="36" height={stackHeight} className="arch-path-filled" stroke={strokeColor} strokeWidth={strokeWidth} />
          
          {/* Grid lines and security laser windows */}
          <line x1="50" y1={towerY} x2="50" y2={baseFloorY} className="arch-path-thin" />
          <line x1="60" y1={towerY} x2="60" y2={baseFloorY} className="arch-path-thin" />
          <line x1="70" y1={towerY} x2="70" y2={baseFloorY} className="arch-path-thin" />
          
          {Array.from({ length: floors }).map((_, i) => {
            const y = baseFloorY - (i * 10) - 10;
            return (
              <g key={`bafin-h-${i}`}>
                {/* Horizontal deck separator */}
                <line x1="42" y1={y + 10} x2="78" y2={y + 10} className="arch-path-thin" />
                {/* Fine security camera lenses inside windows */}
                <circle cx="46" cy={y + 5} r="1.5" className="arch-path-filled" stroke={strokeColor} />
                <circle cx="55" cy={y + 5} r="1.5" className="arch-path-filled" stroke={strokeColor} />
                <circle cx="65" cy={y + 5} r="1.5" className="arch-path-filled" stroke={strokeColor} />
                <circle cx="74" cy={y + 5} r="1.5" className="arch-path-filled" stroke={strokeColor} />
              </g>
            );
          })}
          
          {/* Panopticon Security Dome and Surveillance Mast on top */}
          <path d={`M ${60 - 10} ${towerY} A 10,10 0 0,1 ${60 + 10},${towerY}`} className="arch-path-filled" stroke={strokeColor} strokeWidth={strokeWidth} fill="url(#arch-hatch-pattern)" />
          
          {/* Scanning radar line vectors (Dashed cones) */}
          <line x1="60" y1={towerY - 1} x2="32" y2={towerY + 24} className="arch-path-dash opacity-30" />
          <line x1="60" y1={towerY - 1} x2="88" y2={towerY + 24} className="arch-path-dash opacity-30" />
          
          {/* Camera housing antenna */}
          <line x1="60" y1={towerY - 10} x2="60" y2={towerY - 22} className="arch-path" stroke={strokeColor} strokeWidth={strokeWidth} />
          <circle cx="60" cy={towerY - 22} r="2.5" className="arch-path-filled" stroke={strokeColor} />
        </svg>
      );
    }
      
    case 'zoll': { // Zoll (Warehouse Cargo Terminal)
      const stackHeight = floors * 11;
      const totalY = 98 - stackHeight;
      return (
        <svg viewBox="0 0 120 120" className="w-full h-full transition-all duration-300">
          {/* Mooring dock and B&W water ripples */}
          <rect x="8" y="98" width="104" height="6" className="arch-path-filled" stroke={strokeColor} strokeWidth={strokeWidth} fill="url(#arch-hatch-pattern)" />
          <path d="M 12 108 C 24 106, 36 110, 48 108 C 60 106, 72 110, 84 108 C 96 106, 108 110, 114 108" className="arch-path-thin opacity-50" fill="none" />
          
          {/* Dock bollards */}
          <rect x="18" y="94" width="4" height="4" className="arch-path-filled" stroke={strokeColor} />
          <rect x="98" y="94" width="4" height="4" className="arch-path-filled" stroke={strokeColor} />

          {/* Logistics Warehouse & Cargo Stack Frame */}
          <rect x="15" y={totalY} width="52" height={stackHeight} className="arch-path-filled" stroke={strokeColor} strokeWidth={strokeWidth} />

          {/* Stacked Cargo containers inside structural framework */}
          {Array.from({ length: floors }).map((_, i) => {
            const y = 98 - (i * 11) - 11;
            return (
              <g key={`container-stack-${i}`}>
                {/* Horizontal steel girder */}
                <line x1="15" y1={y + 11} x2="67" y2={y + 11} className="arch-path" stroke={strokeColor} strokeWidth={1.5} />
                
                {/* Container 1 */}
                <rect x="19" y={y + 1} width="20" height="9" className="arch-path-filled" stroke={strokeColor} strokeWidth={0.8} />
                <line x1="24" y1={y + 1} x2="24" y2={y + 10} className="arch-path-thin" />
                <line x1="29" y1={y + 1} x2="29" y2={y + 10} className="arch-path-thin" />
                <line x1="34" y1={y + 1} x2="34" y2={y + 10} className="arch-path-thin" />
                
                {/* Container 2 */}
                <rect x="42" y={y + 1} width="21" height="9" className="arch-path-filled" stroke={strokeColor} strokeWidth={0.8} fill="url(#arch-hatch-pattern)" />
                <line x1="52.5" y1={y + 1} x2="52.5" y2={y + 10} className="arch-path" stroke={strokeColor} strokeWidth={0.6} />
              </g>
            );
          })}
          
          {/* Heavy Port Gantry Crane on the Right */}
          <polygon points="76,98 84,32 92,32 100,98" className="arch-path-filled" stroke={strokeColor} strokeWidth={strokeWidth} />
          <line x1="88" y1="32" x2="88" y2="98" className="arch-path-thin" />
          <line x1="76" y1="98" x2="100" y2="98" className="arch-path" stroke={strokeColor} strokeWidth={strokeWidth} />
          
          {/* Lattice cross bracings */}
          <line x1="80" y1="65" x2="96" y2="65" className="arch-path-thin" />
          <line x1="82" y1="50" x2="94" y2="50" className="arch-path-thin" />
          <line x1="84" y1="35" x2="92" y2="35" className="arch-path-thin" />
          
          {/* Crane horizontal boom arm exactly above the highest container */}
          <rect x="68" y="24" width="46" height="8" className="arch-path-filled" stroke={strokeColor} strokeWidth={strokeWidth} />
          <line x1="68" y1="28" x2="114" y2="28" className="arch-path-thin" />
          
          {/* Trolley, cables and suspended container hook */}
          <rect x="74" y="32" width="6" height="3" className="arch-path-filled" stroke={strokeColor} />
          <line x1="77" y1="35" x2="77" y2="52" className="arch-path-dash" />
          {/* Suspended Hook holding a tiny vector box */}
          <path d="M 75 52 Q 77 56 79 52" className="arch-path" stroke={strokeColor} strokeWidth={1.5} fill="none" />
          <rect x="70" y="55" width="14" height="7" className="arch-path-filled" stroke={strokeColor} strokeWidth={0.8} />
          <line x1="77" y1="55" x2="77" y2="62" className="arch-path-thin" />
        </svg>
      );
    }
      
    case 'eba': { // Eisenbahn-Bundesamt (Federal Railway Authority)
      const vaultHeight = 11;
      return (
        <svg viewBox="0 0 120 120" className="w-full h-full transition-all duration-300">
          {/* High-precision railway track layouts in foreground */}
          <line x1="5" y1="104" x2="115" y2="104" className="arch-path" stroke={strokeColor} strokeWidth={2.0} />
          <line x1="5" y1="110" x2="115" y2="110" className="arch-path" stroke={strokeColor} strokeWidth={2.0} />
          {Array.from({ length: 22 }).map((_, i) => (
            <line key={`tie-${i}`} x1={5 + i * 5} y1="102" x2={5 + i * 5} y2="112" className="arch-path-thin" />
          ))}
          
          {/* Station platform foundation */}
          <rect x="12" y="98" width="96" height="6" className="arch-path-filled" stroke={strokeColor} strokeWidth={strokeWidth} fill="url(#arch-hatch-pattern)" />

          {/* Historic terminal facade with stacked vaulted glass roofs */}
          <rect x="18" y={98 - (floors * vaultHeight) - 8} width="84" height={(floors * vaultHeight) + 8} className="arch-path-filled" stroke={strokeColor} strokeWidth={strokeWidth} />
          
          {/* Grand Barrel-Vault Glass arches stacking vertically */}
          {Array.from({ length: floors }).map((_, i) => {
            const y = 98 - (i * vaultHeight) - vaultHeight;
            return (
              <g key={`eba-vault-${i}`}>
                {/* Vaulted arch */}
                <path d={`M 26 ${y + 11} A 34,34 0 0,1 94,${y + 11}`} className="arch-path-filled" stroke={strokeColor} strokeWidth={strokeWidth} fill="url(#arch-hatch-pattern)" />
                {/* Fine iron glass panels and trusses */}
                <path d={`M 32 ${y + 11} A 28,28 0 0,1 88,${y + 11}`} className="arch-path-thin" fill="none" />
                <line x1="60" y1={y + 11} x2="60" y2={y - 12} className="arch-path-thin" />
                <line x1="42" y1={y + 11} x2="48" y2={y - 5} className="arch-path-thin" />
                <line x1="78" y1={y + 11} x2="72" y2={y - 5} className="arch-path-thin" />
              </g>
            );
          })}
          
          {/* Victorian railway clock tower rising above the halls */}
          {(() => {
            const towerTopY = 98 - (floors * vaultHeight) - 24;
            return (
              <g>
                <rect x="48" y={towerTopY} width="24" height="24" className="arch-path-filled" stroke={strokeColor} strokeWidth={strokeWidth} />
                {/* Giant station clock face with gears */}
                <circle cx="60" cy={towerTopY + 12} r="8.5" className="arch-path-filled" stroke={strokeColor} strokeWidth={strokeWidth} />
                <circle cx="60" cy={towerTopY + 12} r="6.5" className="arch-path" stroke={strokeColor} strokeWidth={strokeWidth} fill="none" />
                {/* Clock hands */}
                <line x1="60" y1={towerTopY + 12} x2="60" y2={towerTopY + 7} className="arch-path" stroke={strokeColor} strokeWidth={1.5} />
                <line x1="60" y1={towerTopY + 12} x2="65" y2={towerTopY + 14} className="arch-path" stroke={strokeColor} strokeWidth={1.2} />
                {/* Spire and weather vane */}
                <polygon points={`48,${towerTopY} 60,${towerTopY - 14} 72,${towerTopY}`} className="arch-path-filled" stroke={strokeColor} strokeWidth={strokeWidth} fill="url(#arch-hatch-pattern)" />
                <line x1="60" y1={towerTopY - 14} x2="60" y2={towerTopY - 24} className="arch-path" stroke={strokeColor} strokeWidth={strokeWidth} />
              </g>
            );
          })()}
        </svg>
      );
    }
      
    case 'kba': { // Kraftfahrt-Bundesamt (Federal Motor Transport Authority)
      const deckHeight = 10;
      const baseFloorY = 98;
      const totalHeight = floors * deckHeight + 8;
      const topY = baseFloorY - totalHeight;
      return (
        <svg viewBox="0 0 120 120" className="w-full h-full transition-all duration-300">
          {/* Foundation base with coordinates marks */}
          <rect x="20" y="98" width="80" height="6" className="arch-path-filled" stroke={strokeColor} strokeWidth={strokeWidth} fill="url(#arch-hatch-pattern)" />

          {/* Automated multi-story helical parking tower */}
          <rect x="28" y={topY} width="64" height={totalHeight} className="arch-path-filled" stroke={strokeColor} strokeWidth={strokeWidth} />
          
          {/* Central elevator shaft column */}
          <rect x="54" y={topY} width="12" height={totalHeight} className="arch-path-filled" stroke={strokeColor} strokeWidth={strokeWidth} />
          <line x1="60" y1={topY} x2="60" y2="98" className="arch-path-dash" />

          {/* Sloping helical parking decks stacking vertically */}
          {Array.from({ length: floors }).map((_, i) => {
            const y = baseFloorY - (i * deckHeight) - deckHeight - 4;
            return (
              <g key={`kba-deck-${i}`}>
                {/* Spiral ramp lines */}
                <line x1="28" y1={y + 4} x2="54" y2={y + 1} className="arch-path" stroke={strokeColor} strokeWidth={1.5} fill="none" />
                <line x1="66" y1={y + 1} x2="92" y2={y + 4} className="arch-path" stroke={strokeColor} strokeWidth={1.5} fill="none" />
                
                {/* Tiny vector car outlines parked inside */}
                {/* Car left */}
                <path d={`M ${32} ${y + 3.5} L ${34} ${y + 1.5} L ${42} ${y + 1.5} L ${44} ${y + 3.5} Z`} className="arch-path-filled" stroke={strokeColor} strokeWidth={0.8} />
                <circle cx="35.5" cy={y + 4} r="0.8" className="arch-path-filled" fill="#111827" />
                <circle cx="40.5" cy={y + 4} r="0.8" className="arch-path-filled" fill="#111827" />

                {/* Car right */}
                <path d={`M ${76} ${y + 3.5} L ${78} ${y + 1.5} L ${86} ${y + 1.5} L ${88} ${y + 3.5} Z`} className="arch-path-filled" stroke={strokeColor} strokeWidth={0.8} fill="url(#arch-hatch-pattern)" />
                <circle cx="79.5" cy={y + 4} r="0.8" className="arch-path-filled" fill="#111827" />
                <circle cx="84.5" cy={y + 4} r="0.8" className="arch-path-filled" fill="#111827" />

                {/* Deck floor separators */}
                <line x1="28" y1={y + deckHeight} x2="92" y2={y + deckHeight} className="arch-path-thin" />
              </g>
            );
          })}

          {/* Left heavy emission chimney stack and wind tunnel propeller */}
          <rect x="12" y="44" width="12" height="54" className="arch-path-filled" stroke={strokeColor} strokeWidth={strokeWidth} fill="url(#arch-hatch-pattern)" />
          <line x1="18" y1="44" x2="18" y2="30" className="arch-path" stroke={strokeColor} strokeWidth={strokeWidth} />
          {/* Exhaust steam loop guidelines */}
          <path d="M 18 30 Q 23 22 18 16 Q 13 10 18 4" className="arch-path-dash opacity-30" />

          {/* Wind tunnel fan blades housing on top deck */}
          <circle cx="60" cy={topY - 8} r="8" className="arch-path-filled" stroke={strokeColor} strokeWidth={strokeWidth} />
          {/* Fan blades */}
          <line x1="60" y1={topY - 16} x2="60" y2={topY} className="arch-path" stroke={strokeColor} strokeWidth={1.8} />
          <line x1="52" y1={topY - 8} x2="68" y2={topY - 8} className="arch-path" stroke={strokeColor} strokeWidth={1.8} />
        </svg>
      );
    }
      
    case 'baainbw': { // BAAINBw (Military Procurement & Shipbuilding)
      const deckHeight = 11;
      const baseFloorY = 98;
      const totalHeight = floors * deckHeight;
      const topY = baseFloorY - totalHeight;
      return (
        <svg viewBox="0 0 120 120" className="w-full h-full transition-all duration-300">
          {/* Shipyard drydock gates and support lines */}
          <rect x="10" y="98" width="100" height="6" className="arch-path-filled" stroke={strokeColor} strokeWidth={strokeWidth} fill="url(#arch-hatch-pattern)" />
          <line x1="20" y1="98" x2="20" y2="108" className="arch-path-thin" />
          <line x1="100" y1="98" x2="100" y2="108" className="arch-path-thin" />

          {/* Heavy industrial saw-tooth manufacturing halls (Stacked) */}
          {Array.from({ length: floors }).map((_, i) => {
            const y = baseFloorY - (i * deckHeight) - deckHeight;
            return (
              <g key={`baainbw-hall-${i}`}>
                {/* Sawtooth roof boundary path */}
                <polygon 
                  points={`15,${y + 11} 28,${y} 28,${y + 6} 48,${y} 48,${y + 6} 68,${y} 68,${y + 6} 88,${y} 88,${y + 6} 101,${y + 11} 15,${y + 11}`} 
                  className="arch-path-filled" 
                  stroke={strokeColor} 
                  strokeWidth={strokeWidth} 
                />
                
                {/* Heavy mechanical gear assemblies inside */}
                {i === 0 && (
                  <g className="opacity-80">
                    <circle cx="58" cy={y + 7.5} r="4.5" className="arch-path-filled" stroke={strokeColor} strokeWidth={0.8} fill="url(#arch-hatch-pattern)" />
                    <circle cx="58" cy={y + 7.5} r="2.5" className="arch-path-filled" stroke={strokeColor} />
                    <circle cx="47" cy={y + 7.5} r="3" className="arch-path-filled" stroke={strokeColor} strokeWidth={0.8} />
                  </g>
                )}

                {/* Industrial grid windows */}
                <line x1="21" y1={y + 7} x2="21" y2={y + 10} className="arch-path-thin" />
                <line x1="41" y1={y + 7} x2="41" y2={y + 10} className="arch-path-thin" />
                <line x1="61" y1={y + 7} x2="61" y2={y + 10} className="arch-path-thin" />
                <line x1="81" y1={y + 7} x2="81" y2={y + 10} className="arch-path-thin" />
              </g>
            );
          })}
          
          {/* Heavy boiling industrial smokestack on the left */}
          <rect x="103" y={topY} width="9" height={totalHeight} className="arch-path-filled" stroke={strokeColor} strokeWidth={strokeWidth} fill="url(#arch-hatch-pattern)" />
          {/* Smokestack mouth */}
          <rect x="101" y={topY - 3} width="13" height="3" className="arch-path-filled" stroke={strokeColor} strokeWidth={strokeWidth} />
          {/* Scaffold ladder line */}
          <line x1="108" y1={topY} x2="108" y2="98" className="arch-path-thin" />
        </svg>
      );
    }

    default: { // Subordinate General Agency (Modular CAD office block)
      const deckHeight = 11;
      const baseFloorY = 98;
      const totalHeight = floors * deckHeight;
      const topY = baseFloorY - totalHeight;
      return (
        <svg viewBox="0 0 120 120" className="w-full h-full transition-all duration-300">
          {/* Base foundation line with CAD tick marks */}
          <rect x="15" y="98" width="90" height="5" className="arch-path-filled" stroke={strokeColor} strokeWidth={strokeWidth} fill="url(#arch-hatch-pattern)" />
          <line x1="15" y1="101" x2="105" y2="101" className="arch-path-thin" />

          {/* Outer high-precision structural frame */}
          <rect x="22" y={topY} width="76" height={totalHeight} className="arch-path-filled" stroke={strokeColor} strokeWidth={strokeWidth} />

          {/* Stacking modular floors */}
          {Array.from({ length: floors }).map((_, i) => {
            const y = baseFloorY - (i * deckHeight) - deckHeight;
            return (
              <g key={`win-sub-${i}`}>
                {/* Horizontal floor beam */}
                <line x1="22" y1={y + 11} x2="98" y2={y + 11} className="arch-path" stroke={strokeColor} strokeWidth={1.2} />
                
                {/* Precise window subdivisions */}
                <rect x="28" y={y + 2.5} width="10" height="6" className="arch-path-dash" stroke={strokeColor} strokeWidth={0.8} />
                <rect x="44" y={y + 2.5} width="10" height="6" className="arch-path-dash" stroke={strokeColor} strokeWidth={0.8} />
                <rect x="60" y={y + 2.5} width="10" height="6" className="arch-path-dash" stroke={strokeColor} strokeWidth={0.8} />
                <rect x="76" y={y + 2.5} width="10" height="6" className="arch-path-dash" stroke={strokeColor} strokeWidth={0.8} />

                {/* Vertical column grids */}
                <line x1="41" y1={y} x2="41" y2={y + 11} className="arch-path-thin" />
                <line x1="57" y1={y} x2="57" y2={y + 11} className="arch-path-thin" />
                <line x1="73" y1={y} x2="73" y2={y + 11} className="arch-path-thin" />
              </g>
            );
          })}
          
          {/* Parapet rooftop structure and safety rails */}
          <line x1="25" y1={topY - 4} x2="95" y2={topY - 4} className="arch-path" stroke={strokeColor} strokeWidth={strokeWidth} />
          <line x1="28" y1={topY - 4} x2="28" y2={topY} className="arch-path-thin" />
          <line x1="46" y1={topY - 4} x2="46" y2={topY} className="arch-path-thin" />
          <line x1="64" y1={topY - 4} x2="64" y2={topY} className="arch-path-thin" />
          <line x1="82" y1={topY - 4} x2="82" y2={topY} className="arch-path-thin" />

          {/* Precise side measurement tick lines */}
          {amtsschimmel > 20 && (
            <g className="arch-path-thin opacity-55 font-mono-tech" style={{ fontSize: '6px' }}>
              <line x1="16" y1={topY} x2="22" y2={topY} stroke={strokeColor} />
              <line x1="16" y1="98" x2="22" y2="98" stroke={strokeColor} />
              <line x1="18" y1={topY} x2="18" y2="98" className="arch-path-dash" />
              <text x="8" y={(topY + 98) / 2 + 2} fill="#4b5563" className="font-bold">H:{floors * 12}m</text>
            </g>
          )}
        </svg>
      );
    }
  }
};

function ZeigtDenStaatDashboard() {
  const [viewMode, setViewMode] = useState('3d'); // '3d', 'classic' or 'scribble'
  const [selectedEntity, setSelectedEntity] = useState(staatData);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Interactive Viewport Settings for 3D City & Scribble View
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 0.85, rotateZ: -45, rotateX: 58 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [activeScandalPulse, setActiveScandalPulse] = useState(null);
  
  // --- STAATS-KRITZEL-APPARAT STATES ---
  const [stampMode, setStampMode] = useState(false);
  const [selectedStampType, setSelectedStampType] = useState('ABGELEHNT');
  const [stamps, setStamps] = useState([]);
  const [mousePos, setMousePos] = useState(null);
  const [wobbleSeed, setWobbleSeed] = useState(0);

  // Squigglevision animation loop (approx 12Hz)
  useEffect(() => {
    let animFrame;
    let lastTime = 0;
    const animate = (time) => {
      if (time - lastTime > 85) {
        setWobbleSeed(Math.floor(Math.random() * 100));
        lastTime = time;
      }
      animFrame = requestAnimationFrame(animate);
    };
    animFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame);
  }, []);

  // Web Audio wooden mechanical stamp synthesizer
  const playStampSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      // Precision mechanical click thud (sharp pen click / plotter hit)
      const osc = ctx.createOscillator();
      const gainOsc = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(650, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.05);
      
      gainOsc.gain.setValueAtTime(0.4, ctx.currentTime);
      gainOsc.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      
      osc.connect(gainOsc);
      gainOsc.connect(ctx.destination);
      
      // Plotter needle friction / click burst
      const frictionBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.04, ctx.sampleRate);
      const frictionData = frictionBuffer.getChannelData(0);
      for (let i = 0; i < frictionBuffer.length; i++) {
        frictionData[i] = Math.random() * 2 - 1;
      }
      
      const frictionNode = ctx.createBufferSource();
      frictionNode.buffer = frictionBuffer;
      
      const frictionFilter = ctx.createBiquadFilter();
      frictionFilter.type = 'bandpass';
      frictionFilter.frequency.setValueAtTime(1800, ctx.currentTime);
      frictionFilter.Q.setValueAtTime(8.0, ctx.currentTime);
      
      const frictionGain = ctx.createGain();
      frictionGain.gain.setValueAtTime(0.35, ctx.currentTime);
      frictionGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
      
      frictionNode.connect(frictionFilter);
      frictionFilter.connect(frictionGain);
      frictionGain.connect(ctx.destination);
      
      // High click accent
      const osc2 = ctx.createOscillator();
      const gainOsc2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1400, ctx.currentTime);
      gainOsc2.gain.setValueAtTime(0.15, ctx.currentTime);
      gainOsc2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);
      
      osc2.connect(gainOsc2);
      gainOsc2.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
      osc2.start();
      osc2.stop(ctx.currentTime + 0.08);
      frictionNode.start();
      frictionNode.stop(ctx.currentTime + 0.08);
    } catch (err) {
      console.warn("Web Audio failed:", err);
    }
  };

  const triggerStampPlacement = (e) => {
    const container = e.currentTarget.closest('.paper-bg').getBoundingClientRect();
    const clickX = e.clientX - container.left;
    const clickY = e.clientY - container.top;
    
    // Reverse translate coordinates using viewport zoom/pan
    const canvasX = (clickX - viewport.x) / viewport.zoom;
    const canvasY = (clickY - viewport.y) / viewport.zoom;
    
    const newStamp = {
      x: canvasX - 60, // offset half of stamp card width
      y: canvasY - 18,
      type: selectedStampType,
      rotation: Math.random() * 24 - 12
    };
    
    setStamps(prev => [...prev, newStamp]);
    playStampSound();
  };

  const handleScribbleClick = (e, entity) => {
    e.stopPropagation();
    if (stampMode) {
      triggerStampPlacement(e);
    } else {
      setSelectedEntity(entity);
    }
  };

  const handleScribbleCanvasClick = (e) => {
    if (stampMode) {
      triggerStampPlacement(e);
    }
  };

  const handleScribbleMouseMove = (e) => {
    if (isDragging) {
      setViewport(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      }));
    }
    if (stampMode) {
      const rect = e.currentTarget.closest('.paper-bg').getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleScribbleMouseLeave = () => {
    setIsDragging(false);
    setMousePos(null);
  };

  const toggleStampMode = () => {
    setStampMode(prev => !prev);
    setMousePos(null);
  };
  
  const clearStamps = () => {
    setStamps([]);
  };

  const renderScribbleConnections = () => {
    const paths = [];
    
    function traverse(node) {
      if (node.children) {
        node.children.forEach(child => {
          const parentX = node.x + 1000;
          const parentY = node.y + 1000;
          const childX = child.x + 1000;
          const childY = child.y + 1000;
          
          // Technical drafting line connecting elements
          const isSelectedPath = selectedEntity?.id === node.id || selectedEntity?.id === child.id;
          const stroke = isSelectedPath ? '#2563eb' : 'rgba(17, 24, 39, 0.4)';
          const strokeWidth = isSelectedPath ? 1.8 : 1.0;
          const dash = child.colorKey === 'sub' ? '4,4' : 'none';
          
          paths.push(
            <g key={`scribble-edge-${node.id}-${child.id}`}>
              {/* Outer faint technical guidelines */}
              <line
                x1={parentX}
                y1={parentY}
                x2={childX}
                y2={childY}
                stroke={isSelectedPath ? '#2563eb' : 'rgba(17, 24, 39, 0.1)'}
                strokeWidth={isSelectedPath ? 4.0 : 2.0}
                opacity={0.3}
                className="transition-all duration-300"
              />
              {/* Core technical pen line */}
              <line
                x1={parentX}
                y1={parentY}
                x2={childX}
                y2={childY}
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeDasharray={dash}
                className="transition-all duration-300"
              />
              {/* Fine coordinate markers at endpoints */}
              <circle cx={parentX} cy={parentY} r="2" fill={stroke} />
              <circle cx={childX} cy={childY} r="2" fill={stroke} />
            </g>
          );
          traverse(child);
        });
      }
    }
    traverse(staatData);
    return paths;
  };

  // Dynamic Sliders
  const [amtsschimmel, setAmtsschimmel] = useState(40); // 0-100 Bureaucracy slider
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Filters (Classic view)
  const [showMinisterien, setShowMinisterien] = useState(true);
  const [showBehoerden, setShowBehoerden] = useState(true);

  // React Flow hooks
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const reactFlowInstance = useReactFlow();

  // Rotate quotes every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % sprueche.length);
    }, 8500);
    return () => clearInterval(interval);
  }, []);

  // Sync React Flow node styling based on filters and selections
  const styledNodes = useMemo(() => {
    return nodes.map((node) => {
      let isDimmed = false;
      if (node.data.type === 'Ministerium' && !showMinisterien) isDimmed = true;
      if (node.data.type === 'Behörde' && !showBehoerden) isDimmed = true;
      
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = node.data.name.toLowerCase().includes(q) || 
                        (node.data.short && node.data.short.toLowerCase().includes(q));
        if (!matches) isDimmed = true;
      }

      return {
        ...node,
        selected: selectedEntity?.id === node.id,
        style: {
          ...node.style,
          opacity: isDimmed ? 0.2 : 1.0,
          transition: 'all 0.3s ease',
        },
      };
    });
  }, [nodes, showMinisterien, showBehoerden, searchQuery, selectedEntity]);

  // Center on entity in 3D City, Scribble View or React Flow
  const focusOnEntity = useCallback((entity) => {
    if (!entity) return;
    
    if (viewMode === '3d' || viewMode === 'scribble') {
      // Cinematic camera movement to entity's grid coordinates
      // With inverse translation to center on screen
      setViewport(prev => ({
        ...prev,
        x: -entity.x * prev.zoom,
        y: -entity.y * prev.zoom,
        zoom: 1.0, // Zoom in on selection
        rotateX: viewMode === '3d' ? 52 : 0 // flat for scribble view
      }));
    } else {
      // React Flow zoom
      const flowNode = nodes.find((n) => n.id === entity.id);
      if (flowNode && reactFlowInstance) {
        reactFlowInstance.setCenter(flowNode.position.x + 130, flowNode.position.y + 40, {
          zoom: 1.1,
          duration: 700,
        });
      }
    }
  }, [viewMode, nodes, reactFlowInstance]);

  // Handle clicking an entity
  const handleEntitySelect = useCallback((entity) => {
    setSelectedEntity(entity);
    focusOnEntity(entity);
  }, [focusOnEntity]);

  // Trigger building flash on scandal investigation
  const triggerScandalPulse = useCallback((id) => {
    setActiveScandalPulse(id);
    setTimeout(() => setActiveScandalPulse(null), 2500);
  }, []);

  // 3D Grid Pan Handlers
  const handleMouseDown = (e) => {
    if (e.target.closest('.interactive-control')) return; // Avoid drag on UI elements
    setIsDragging(true);
    setDragStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setViewport(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = 1.08;
    setViewport(prev => ({
      ...prev,
      zoom: e.deltaY < 0 ? Math.min(prev.zoom * zoomFactor, 2.0) : Math.max(prev.zoom / zoomFactor, 0.45)
    }));
  };

  // Reset 3D view
  const reset3DView = () => {
    setViewport({ x: 0, y: 0, zoom: 0.85, rotateZ: -45, rotateX: 58 });
    setSelectedEntity(staatData);
  };

  // Generate wobbly connections for grid
  const renderConnectionLines = () => {
    const lines = [];
    
    function traverse(node) {
      if (node.children) {
        node.children.forEach(child => {
          lines.push(
            <line
              key={`line-${node.id}-${child.id}`}
              x1={node.x + 1000} // Centered relative to 2000px grid
              y1={node.y + 1000}
              x2={child.x + 1000}
              y2={child.y + 1000}
              stroke={
                selectedEntity?.id === node.id || selectedEntity?.id === child.id 
                  ? '#fbbf24' 
                  : 'rgba(59, 130, 246, 0.25)'
              }
              strokeWidth={selectedEntity?.id === node.id || selectedEntity?.id === child.id ? 3 : 1.5}
              strokeDasharray="4,6"
              className="transition-all duration-300"
            />
          );
          traverse(child);
        });
      }
    }
    traverse(staatData);
    return lines;
  };

  // Dynamic values based on Amtsschimmel (Bureaucracy Slider)
  const isHighBureaucracy = amtsschimmel > 70;
  const isSlimBureaucracy = amtsschimmel < 25;
  const buildingHeightMultiplier = 1 + (amtsschimmel / 70); // Up to ~2.4x taller buildings

  // Generate wobbly flying paperwork particles
  const paperParticles = useMemo(() => {
    const count = Math.floor(amtsschimmel / 4);
    return Array.from({ length: count }).map((_, i) => {
      // Random coordinates and speeds
      const x = Math.random() * 800 - 400;
      const y = Math.random() * 800 - 400;
      const driftX = Math.random() * 200 - 100;
      const driftY = Math.random() * 200 - 100;
      const duration = 4 + Math.random() * 6;
      const delay = Math.random() * -10;
      const types = ['📄', '📁', '✉️', '📋', '☕'];
      const icon = types[Math.floor(Math.random() * types.length)];
      return { id: i, x, y, driftX, driftY, duration, delay, icon };
    });
  }, [amtsschimmel]);

  // Search Results Filter
  const filteredSearchList = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return flatEntities.filter(e => 
      e.name.toLowerCase().includes(q) || 
      (e.short && e.short.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans select-none">
      
      {/* Global SVG Definitions for patterns and organic blueprint filters */}
      <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
        <defs>
          {/* Blueprint diagonal line hatch pattern (Standard black-and-white drafting pattern) */}
          <pattern id="arch-hatch-pattern" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke="#111827" strokeWidth="0.8" />
          </pattern>
          {/* Technical red hatch pattern for active controversies or scandal highlighting */}
          <pattern id="arch-hatch-red" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke="#ef4444" strokeWidth="0.8" />
          </pattern>
          {/* Stable organic blueprint filters - set scale to 0 when in blueprint mode so lines are perfectly straight and crisp */}
          <filter id="wobble-filter-1" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={viewMode === 'scribble' ? 0 : 2.2} xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="wobble-filter-2" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={viewMode === 'scribble' ? 0 : 1.8} xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="wobble-filter-slow" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={viewMode === 'scribble' ? 0 : 3.5} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* LEFT SIDEBAR: INTERACTIVE PANEL & STATE REGULATORS */}
      <aside className="w-80 bg-slate-900/90 border-r border-slate-800 flex flex-col z-20 backdrop-blur-md">
        
        {/* LOGO BLOCK */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 text-blue-400">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-black bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">
                Zeig den Staat
              </h1>
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mt-0.5">Bürokratiestadt v3.5</p>
            </div>
          </div>
        </div>

        {/* VIEW SELECTOR TOGGLE */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/40">
          <label className="text-[10px] text-slate-500 uppercase font-black tracking-wider mb-2 block">Darstellungsmethode</label>
          <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800/80">
            <button
              onClick={() => { setViewMode('3d'); focusOnEntity(selectedEntity); }}
              className={`flex items-center justify-center gap-1 py-2 px-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer truncate ${
                viewMode === '3d' 
                  ? 'bg-blue-600/20 text-blue-450 border border-blue-550/30 shadow-md' 
                  : 'text-slate-400 hover:bg-slate-900 border border-transparent'
              }`}
              title="3D Bürokratiestadt"
            >
              <Compass className="h-3 w-3 shrink-0" />
              <span>3D Stadt</span>
            </button>
            <button
              onClick={() => { setViewMode('classic'); setTimeout(() => focusOnEntity(selectedEntity), 100); }}
              className={`flex items-center justify-center gap-1 py-2 px-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer truncate ${
                viewMode === 'classic' 
                  ? 'bg-blue-600/20 text-blue-450 border border-blue-550/30 shadow-md' 
                  : 'text-slate-400 hover:bg-slate-900 border border-transparent'
              }`}
              title="Klassischer Graph"
            >
              <Layers className="h-3 w-3 shrink-0" />
              <span>Graph</span>
            </button>
            <button
              onClick={() => { setViewMode('scribble'); focusOnEntity(selectedEntity); }}
              className={`flex items-center justify-center gap-1 py-2 px-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer truncate ${
                viewMode === 'scribble' 
                  ? 'bg-blue-600/20 text-blue-450 border border-blue-550/30 shadow-md' 
                  : 'text-slate-400 hover:bg-slate-900 border border-transparent'
              }`}
              title="Bauplan-Modus"
            >
              <Ruler className="h-3 w-3 shrink-0" />
              <span>Bauplan</span>
            </button>
          </div>
        </div>

        {/* SEARCH BOX */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Behörde / Ressort suchen..." 
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-9 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {/* Dynamic Search Results list */}
          {searchQuery.trim() && (
            <div className="mt-2 max-h-40 overflow-y-auto bg-slate-950 rounded-lg border border-slate-800 p-1 divide-y divide-slate-900/60 z-30 relative">
              {filteredSearchList.length > 0 ? (
                filteredSearchList.map(e => (
                  <button
                    key={e.id}
                    onClick={() => handleEntitySelect(e)}
                    className="w-full text-left px-3 py-2 hover:bg-slate-900 text-xs text-slate-300 hover:text-blue-400 transition-all flex items-center justify-between"
                  >
                    <span className="font-semibold truncate">{e.short || e.name}</span>
                    <span className="text-[9px] uppercase px-1.5 py-0.5 bg-slate-800 rounded text-slate-500">{e.type}</span>
                  </button>
                ))
              ) : (
                <div className="p-3 text-[11px] text-slate-600 text-center">Keine Behörde gefunden.</div>
              )}
            </div>
          )}
        </div>

        {/* STATE CONTROLLERS: DYNAMIC SYSTEM SLIDERS */}
        <div className="p-5 flex-1 overflow-y-auto space-y-6">
          
          <div className="space-y-4">
            <div className="flex items-center justify-between text-slate-300 font-semibold text-xs uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><Sliders className="h-4 w-4 text-indigo-400" /> System-Regler</span>
              <Sparkles className="h-3.5 w-3.5 text-yellow-400 animate-pulse" />
            </div>

            {/* Amtsschimmel Slider (Bureaucracy Regulator) */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-3 shadow-inner">
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider flex items-center gap-1">
                  Amtsschimmel-Index
                </label>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                  isHighBureaucracy ? 'bg-red-500/20 text-red-400' :
                  isSlimBureaucracy ? 'bg-emerald-500/20 text-emerald-400' :
                  'bg-indigo-500/20 text-indigo-400'
                }`}>
                  {amtsschimmel}%
                </span>
              </div>
              
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={amtsschimmel} 
                onChange={(e) => setAmtsschimmel(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              
              <div className="flex justify-between text-[8px] text-slate-500 font-bold">
                <span>SLIM & COOP</span>
                <span>STANDARD</span>
                <span>BEHÖRDEN-INFARKT</span>
              </div>

              {/* Dynamic Bureaucracy Alert Description */}
              <div className={`text-[10px] leading-relaxed p-2.5 rounded-lg border transition-all ${
                isHighBureaucracy ? 'bg-red-500/5 text-red-400/90 border-red-500/10' :
                isSlimBureaucracy ? 'bg-emerald-500/5 text-emerald-400/90 border-emerald-500/10' :
                'bg-slate-900 text-slate-400 border-slate-800/60'
              }`}>
                {isHighBureaucracy && (
                  <span className="flex items-start gap-1.5 font-medium">
                    <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                    <span><strong>Kollaps!</strong> Papierflut im Kanzleramt. Gebäude auf 200% Höhe aufgebläht. Genehmigungen dauern Lichtjahre.</span>
                  </span>
                )}
                {isSlimBureaucracy && (
                  <span className="flex items-start gap-1.5 font-medium">
                    <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span><strong>Reformiert!</strong> Minimaler Overhead. Ämter schlank und digitalisiert. Blitzschnelle Freigaben.</span>
                  </span>
                )}
                {!isHighBureaucracy && !isSlimBureaucracy && (
                  <span>Normale deutsche Aktenlage. Standard-Bürokratiemühle mahlt gemächlich vor sich hin.</span>
                )}
              </div>
            </div>
          </div>

          {/* CLASSIC VIEW FILTERS */}
          {viewMode === 'classic' && (
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <label className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Graph-Filter</label>
              <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={showMinisterien}
                    onChange={(e) => setShowMinisterien(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-800 text-blue-500 focus:ring-blue-500" 
                  />
                  <span className="group-hover:text-slate-100 transition-colors">Ministerien</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={showBehoerden}
                    onChange={(e) => setShowBehoerden(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-800 text-blue-500 focus:ring-blue-500" 
                  />
                  <span className="group-hover:text-slate-100 transition-colors">Untergeordnete Behörden</span>
                </label>
              </div>
            </div>
          )}

          {/* MINI CONTROLS MAP TUTORIAL */}
          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/60 text-[10px] text-slate-500 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-400 uppercase tracking-wider"><HelpCircle className="h-3.5 w-3.5" /> Steuerungshandbuch:</div>
            {viewMode === '3d' ? (
              <ul className="space-y-1.5 list-disc pl-3">
                <li><strong>Linksklick + Ziehen</strong> zum Verschieben der Stadt.</li>
                <li><strong>Mausrad scrollen</strong> zum Rein-/Rauszoomen.</li>
                <li><strong>Gebäude anklicken</strong> öffnet das **3D-Dach**!</li>
                <li>Der Amtsschimmel lässt Gebäude buchstäblich **wachsen**!</li>
              </ul>
            ) : (
              <ul className="space-y-1.5 list-disc pl-3">
                <li><strong>Linksklick + Ziehen</strong> navigiert im Graph-Feld.</li>
                <li>Doppelklick zum Vergrößern der Node-Cards.</li>
                <li>Klick auf Card lädt Detail-Akte.</li>
              </ul>
            )}
          </div>
        </div>

        {/* SATIRICAL LIVE QUOTE FEED */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 min-h-24 flex items-center justify-center relative overflow-hidden">
          <div className="absolute top-1.5 left-3 text-[8px] text-slate-600 uppercase font-black tracking-widest">Amtlicher Ticker:</div>
          <p 
            key={quoteIndex} 
            className="text-[10px] text-indigo-400 italic text-center font-medium px-4 leading-relaxed animate-fade-in transition-all duration-500"
          >
            {sprueche[quoteIndex]}
          </p>
        </div>
      </aside>

      {/* CENTER STAGE: THE PLAYGROUND */}
      <main className="flex-1 relative h-full bg-slate-950 overflow-hidden">
        
        {viewMode === '3d' && (
          /* ==========================================================================
             3D ISOMETRIC BUREAUCRACY CITY METAPHOR
             ========================================================================== */
          <div 
            className="w-full h-full perspective-container cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            {/* AMBIENT BIRDS FLYING OVER THE CITY */}
            <div className="city-bird">🦅</div>
            <div className="city-bird" style={{ animationDelay: '-6s', fontSize: '14px' }}>🐦</div>

            {/* 3D VIEWPORT WITH DRAG & ROTATE DYNAMIC TRANSFORMS */}
            <div 
              className="w-full h-full isometric-viewport"
              style={{
                transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.zoom})`
              }}
            >
              {/* ISOMETRIC GROUND BASE GRID */}
              <div 
                className="isometric-grid"
                style={{
                  transform: `rotateX(${viewport.rotateX}deg) rotateZ(${viewport.rotateZ}deg)`,
                  borderColor: isHighBureaucracy ? 'rgba(239, 68, 68, 0.3)' : 'rgba(51, 65, 85, 0.3)'
                }}
              >
                {/* Street Systems grid (aligned on isometric lanes) */}
                <div className="city-street-h" style={{ top: '30%' }}></div>
                <div className="city-street-h" style={{ top: '50%' }}></div>
                <div className="city-street-h" style={{ top: '70%' }}></div>
                <div className="city-street-v" style={{ left: '30%' }}></div>
                <div className="city-street-v" style={{ left: '50%' }}></div>
                <div className="city-street-v" style={{ left: '70%' }}></div>

                {/* Ground connections SVG (Dotted lines between agencies) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ transform: 'translateZ(1px)' }}>
                  {renderConnectionLines()}
                </svg>

                {/* PAPER AIRPLANE BEZIER FLOWS (Emojis representing bureaucratic requests) */}
                <div className="paper-plane-particle" style={{ '--start-x': '1260px', '--start-y': '760px', '--start-z': '120px', '--end-x': '1000px', '--end-y': '1000px', '--end-z': '150px', '--angle': '-135deg', '--duration': '5s', '--delay': '0s' } }>✈️</div>
                <div className="paper-plane-particle" style={{ '--start-x': '1000px', '--start-y': '1000px', '--start-z': '150px', '--end-x': '740px', '--end-y': '760px', '--end-z': '120px', '--angle': '135deg', '--duration': '6s', '--delay': '-2s' } }>✈️</div>
                <div className="paper-plane-particle" style={{ '--start-x': '760px', '--start-y': '1260px', '--start-z': '100px', '--end-x': '1000px', '--end-y': '1000px', '--end-z': '150px', '--angle': '-45deg', '--duration': '4s', '--delay': '-1s' } }>✈️</div>
                
                {/* DYNAMIC FLOATING DOCUMENT SYSTEM */}
                {paperParticles.map(p => (
                  <div 
                    key={p.id}
                    className="floating-document"
                    style={{
                      left: `${p.x + 1000}px`,
                      top: `${p.y + 1000}px`,
                      '--x': '0px',
                      '--y': '0px',
                      '--drift-x': `${p.driftX}px`,
                      '--drift-y': `${p.driftY}px`,
                      '--duration': `${p.duration}s`,
                      '--delay': `${p.delay}s`,
                    }}
                  >
                    {p.icon}
                  </div>
                ))}

                {/* THE 3D BUILDINGS FOOTPRINTS & RENDERINGS */}
                {/* Recursively map mock data to render as 3D elements */}
                {flatEntities.map((entity) => {
                  const isSelected = selectedEntity?.id === entity.id;
                  const isParentSelected = selectedEntity?.children?.some(c => c.id === entity.id);
                  const isSubordinate = entity.colorKey === 'sub';
                  
                  // Calculate dynamic heights
                  const budgetNum = parseFloat(entity.budget) || 1.0;
                  const baseH = isSubordinate ? 45 : (entity.id === 'bund' ? 90 : 130 + budgetNum * 1.5);
                  // Apply Amtsschimmel multiplier to build height
                  const finalHeight = baseH * (isSubordinate ? 1 : buildingHeightMultiplier);
                  const width = isSubordinate ? 36 : (entity.id === 'bund' ? 70 : 64);
                  const depth = isSubordinate ? 36 : (entity.id === 'bund' ? 70 : 64);

                  // Coordinate layout mapping centered at center of 2000px grid
                  const style3D = {
                    left: `${entity.x + 1000 - width/2}px`,
                    top: `${entity.y + 1000 - depth/2}px`,
                    width: `${width}px`,
                    height: `${depth}px`,
                    '--building-h': `${finalHeight}px`,
                    zIndex: Math.floor(1000 - entity.y),
                    transform: `translateZ(0px) ${isSelected ? 'scale3d(1.08, 1.08, 1.08)' : ''}`,
                  };

                  const isPulser = activeScandalPulse === entity.id;

                  return (
                    <div 
                      key={entity.id}
                      onClick={() => handleEntitySelect(entity)}
                      className={`building-3d ${isPulser ? 'scandal-alert-glow' : ''}`}
                      style={style3D}
                      title={`${entity.name} (Budget: ${entity.budget})`}
                    >
                      {/* Left Wall */}
                      <div className={`face-left left-${entity.colorKey} shadow-inner`}>
                        <div className={`w-full h-full opacity-35 ${isHighBureaucracy ? 'windows-glow-left' : 'windows-left'}`}></div>
                      </div>

                      {/* Right Wall */}
                      <div className={`face-right right-${entity.colorKey} shadow-inner`}>
                        <div className={`w-full h-full opacity-35 ${isHighBureaucracy ? 'windows-glow-right' : 'windows-right'}`}></div>
                      </div>

                      {/* Roof Face (lifts up if selected) */}
                      <div 
                        className={`face-top roof-${entity.colorKey} cursor-pointer flex items-center justify-center transition-all duration-500`}
                        style={{
                          transform: isSelected 
                            ? `translateZ(calc(var(--building-h) + 65px)) rotateX(5deg) rotateY(15deg)`
                            : `translateZ(var(--building-h))`
                        }}
                      >
                        {/* Mini text sticker or emblem on the roof */}
                        <div className="text-[7px] font-black uppercase text-white tracking-widest select-none rotate-45 opacity-80">
                          {entity.short}
                        </div>
                        {isSelected && (
                          <div className="absolute inset-0 bg-yellow-400/20 animate-pulse border border-yellow-400 pointer-events-none"></div>
                        )}
                      </div>

                      {/* Administrative Link Indicator Ring on ground */}
                      <div 
                        className={`absolute inset-0 rounded-lg border-2 pointer-events-none transition-all duration-550 ${
                          isSelected ? 'border-yellow-400 scale-125 opacity-100 shadow-[0_0_15px_rgba(251,191,36,0.5)]' : 
                          isParentSelected ? 'border-blue-500 border-dashed scale-110 opacity-70' :
                          'border-transparent opacity-0'
                        }`}
                        style={{ transform: 'translateZ(0.5px)' }}
                      ></div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* OVERLAID 3D CANVAS FLOATING HEADERS */}
            <div className="absolute top-6 left-6 pointer-events-none">
              <div className="bg-slate-900/80 backdrop-blur-md px-4 py-3 rounded-xl border border-slate-800/80 flex flex-col shadow-2xl">
                <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Interaktiver 3D-Bürgerraum
                </span>
                <span className="text-xs text-slate-200 font-bold mt-1">Bürokratiestadt der Bundesregierung</span>
              </div>
            </div>

            {/* 3D FLOATING HUD CONTROLS */}
            <div className="absolute bottom-6 left-6 flex gap-2.5 interactive-control z-20">
              <button
                onClick={() => focusOnEntity(selectedEntity)}
                title="Kamera zentrieren"
                className="p-3 bg-slate-900/90 border border-slate-850 rounded-xl text-slate-400 hover:text-blue-400 hover:border-blue-500/30 transition-all shadow-xl cursor-pointer"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
              <button
                onClick={reset3DView}
                title="Stadt zurücksetzen"
                className="p-3 bg-slate-900/90 border border-slate-850 rounded-xl text-slate-400 hover:text-blue-400 hover:border-blue-500/30 transition-all shadow-xl cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewport(p => ({ ...p, rotateZ: p.rotateZ - 45 }))}
                title="Nach links drehen"
                className="p-3 bg-slate-900/90 border border-slate-850 rounded-xl text-slate-400 hover:text-blue-400 hover:border-blue-500/30 transition-all shadow-xl cursor-pointer"
              >
                <Compass className="h-4 w-4 rotate-90" />
              </button>
              <button
                onClick={() => setViewport(p => ({ ...p, rotateZ: p.rotateZ + 45 }))}
                title="Nach rechts drehen"
                className="p-3 bg-slate-900/90 border border-slate-850 rounded-xl text-slate-400 hover:text-blue-400 hover:border-blue-500/30 transition-all shadow-xl cursor-pointer"
              >
                <Compass className="h-4 w-4 -rotate-90" />
              </button>
            </div>
          </div>
        )}

        {viewMode === 'classic' && (
          /* ==========================================================================
             CLASSIC FLOW GRAPH REPRESENTATION (REACT FLOW ENGINE)
             ========================================================================== */
          <div className="w-full h-full">
            <ReactFlow
              nodes={styledNodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={(e, node) => handleEntitySelect(findEntityById(staatData, node.id))}
              nodeTypes={nodeTypes}
              fitView
              minZoom={0.4}
              maxZoom={2.0}
            >
              <Background gap={24} size={1} color="#334155" />
              
              <MiniMap 
                nodeColor={(node) => {
                  if (node.data.type === 'Staat') return '#ec4899';
                  if (node.data.type === 'Ministerium') return '#3b82f6';
                  return '#64748b';
                }}
                maskColor="rgba(2, 6, 23, 0.7)"
                style={{ right: 20, bottom: 20 }}
              />

              <div className="absolute left-6 bottom-6 flex flex-col gap-2.5 z-10">
                <button
                  onClick={() => focusOnEntity(selectedEntity)}
                  disabled={!selectedEntity}
                  className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-slate-400 hover:text-blue-400 hover:border-blue-500/30 transition-all disabled:opacity-40 shadow-xl cursor-pointer"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => reactFlowInstance.fitView({ duration: 700 })}
                  className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-slate-400 hover:text-blue-400 hover:border-blue-500/30 transition-all shadow-xl cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>

              <div className="absolute top-6 left-6 bg-slate-900/80 backdrop-blur-md px-4 py-2.5 rounded-lg border border-slate-800/80 pointer-events-none">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Graph-Visualisierung</div>
                <div className="text-xs text-slate-200 font-semibold mt-0.5">Hierarchie der Bundesverwaltung (Organigramm)</div>
              </div>
            </ReactFlow>
          </div>
        )}

        {viewMode === 'scribble' && (
          /* ==========================================================================
             STAATS-BAUPLAN-APPARAT PORTAL (Blueprint/CAD View)
             ========================================================================== */
          <div 
            className="w-full h-full blueprint-grid relative overflow-hidden select-none cursor-grab active:cursor-grabbing animate-fade-in"
            onMouseDown={handleMouseDown}
            onMouseMove={handleScribbleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleScribbleMouseLeave}
            onWheel={handleWheel}
            onClick={handleScribbleCanvasClick}
          >
            {/* DRAFTING CROSSHAIR GUIDES SPAWNING WITH HIGH BUREAUCRACY */}
            {amtsschimmel > 15 && (
              <div 
                className="absolute text-slate-400 font-mono-tech text-[10px] select-none pointer-events-none opacity-40" 
                style={{ left: '12%', top: '18%' }}
              >
                + [ALIGN_MARK_A]
              </div>
            )}
            {amtsschimmel > 45 && (
              <div 
                className="absolute text-slate-400 font-mono-tech text-[10px] select-none pointer-events-none opacity-45 animate-pulse-slow" 
                style={{ right: '18%', bottom: '25%' }}
              >
                + [REF_GRID_Z]
              </div>
            )}
            {amtsschimmel > 75 && (
              <div 
                className="absolute text-slate-400 font-mono-tech text-[10px] select-none pointer-events-none opacity-40" 
                style={{ left: '42%', top: '65%' }}
              >
                + [COORD_CENTER_C]
              </div>
            )}

            {/* FLYING LOOSE PAGES AND PAPERWORK CHUNKS */}
            {paperParticles.map(p => (
              <div 
                key={`scribble-paper-${p.id}`}
                className="flying-blueprint-paper select-none opacity-80 flex items-center justify-center"
                style={{
                  left: `${p.x + 1000}px`,
                  top: `${p.y + 1000}px`,
                  '--x': '0px',
                  '--y': '0px',
                  '--drift-x': `${p.driftX}px`,
                  '--drift-y': `${p.driftY}px`,
                  '--duration': `${p.duration}s`,
                  '--delay': `${p.delay}s`,
                }}
              >
                <div className="text-[9px] font-mono-tech text-blue-800 scale-75 select-none font-bold">CAD</div>
              </div>
            ))}

            {/* PHYSICAL INK STAMPS ON PAPER SHEET */}
            {stamps.map((stamp, i) => (
              <div
                key={`stamp-${i}`}
                className={`blueprint-stamp absolute font-mono-tech ${
                  stamp.type === 'FREIGEGEBEN' ? 'text-emerald-700 border-emerald-700' :
                  stamp.type === 'VETO / GESTOPPT' ? 'text-red-700 border-red-700' :
                  stamp.type === 'REVISION A' ? 'text-blue-700 border-blue-700' :
                  'text-amber-800 border-amber-800'
                }`}
                style={{
                  left: `${stamp.x}px`,
                  top: `${stamp.y}px`,
                  '--stamp-rot': `${stamp.rotation}deg`,
                  transform: `rotate(${stamp.rotation}deg)`
                }}
              >
                {stamp.type}
              </div>
            ))}

            {/* DRAGGABLE MAIN COORDINATE PLATFORM CONTAINER */}
            <div 
              className="absolute w-[2000px] h-[2000px] origin-center"
              style={{
                transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.zoom})`
              }}
            >
              {/* Sketches connections lines SVG overlay */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                {renderScribbleConnections()}
              </svg>

              {/* Hand-drawn SVG buildings representing government agencies */}
              {flatEntities.map((entity) => {
                const isSelected = selectedEntity?.id === entity.id;
                const isSubordinate = entity.colorKey === 'sub';
                
                const left = entity.x + 1000;
                const top = entity.y + 1000;
                const isPulser = activeScandalPulse === entity.id;
                const isControversial = !!entity.scandals;
                
                return (
                  <div
                    key={`scribble-entity-${entity.id}`}
                    onClick={(e) => handleScribbleClick(e, entity)}
                    className={`absolute group cursor-pointer select-none transition-all duration-300 flex flex-col items-center z-10 ${
                      isSelected ? 'scale-115' : 'hover:scale-105'
                    } ${isPulser ? 'animate-bounce' : ''}`}
                    style={{
                      left: `${left - 80}px`,
                      top: `${top - 85}px`,
                      width: '160px',
                      height: '170px'
                    }}
                  >
                    {/* Architectural themed vector shape wrapper */}
                    <div className="relative w-28 h-28 flex items-end justify-center">
                      
                      {/* Chimney smoke if controversial */}
                      {isControversial && (
                        <div className="absolute top-1 left-24 w-4 h-8 border-l border-r border-slate-400 flex flex-col justify-end pointer-events-none opacity-40">
                          <span className="arch-smoke-puff" style={{ top: '-15px', left: '-5px', '--smoke-delay': '0s', '--smoke-dx': '15px' }}>💨</span>
                          <span className="arch-smoke-puff" style={{ top: '-15px', left: '0px', '--smoke-delay': '1.2s', '--smoke-dx': '-12px' }}>💨</span>
                        </div>
                      )}
                      
                      {/* High-precision detailed themed CAD vector building */}
                      {renderArchitecturalBuilding(entity, isSelected, amtsschimmel)}

                      {/* Red pulse visual highlights on active controversies */}
                      {isControversial && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                          <span className="absolute inline-flex h-8 w-8 rounded-full bg-red-400 opacity-20 animate-ping"></span>
                          <span className="relative rounded-full h-4 w-4 bg-red-500 border border-slate-900 flex items-center justify-center text-[8px] font-bold text-white shadow-md">!</span>
                        </div>
                      )}
                    </div>

                    {/* Technical CAD badge card */}
                    <div 
                      className={`mt-2.5 px-3 py-0.5 text-center border font-mono-tech text-[9px] leading-tight select-none shadow-[2px_2px_0px_rgba(17,24,39,0.15)] max-w-[150px] truncate transition-all ${
                        isSelected 
                          ? 'border-blue-600 bg-blue-50 text-blue-800 font-bold' 
                          : 'border-slate-900 bg-white text-slate-800'
                      }`}
                    >
                      {entity.short || entity.name}
                    </div>

                    {/* High-precision technical specs underneath building */}
                    <div className="mt-1 flex items-center gap-2 font-mono-tech text-[8px] font-bold select-none text-slate-500">
                      <div className="flex items-center gap-0.5" title={`Jahresbudget: ${entity.budget}`}>
                        <span>B:</span>
                        <span className={isSelected ? 'text-blue-600' : 'text-slate-700'}>{entity.budget}</span>
                      </div>
                      <div className="flex items-center gap-0.5" title={`Beschäftigte: ${entity.employees}`}>
                        <span>M:</span>
                        <span className={isSelected ? 'text-blue-600' : 'text-slate-700'}>{entity.employees}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* STAMPER MODUS DUST AND CURSOR STICKY GHOST */}
            {stampMode && mousePos && (
              <div 
                className="absolute pointer-events-none z-50 opacity-80 flex flex-col items-center transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
                style={{
                  left: `${mousePos.x}px`,
                  top: `${mousePos.y}px`
                }}
              >
                {/* High precision mechanical plotter pen indicator */}
                <div className="w-1.5 h-16 bg-slate-900 border border-slate-700 shadow-sm flex flex-col items-center">
                  <div className="w-4 h-1 bg-blue-500 mt-2"></div>
                  <div className="w-2.5 h-2 bg-slate-600 rounded-b mt-auto"></div>
                  <div className="w-0.5 h-3 bg-red-500"></div>
                </div>
                <div className={`mt-2 blueprint-stamp font-mono-tech text-[9px] uppercase font-black tracking-wider border-2 border-dashed px-1.5 py-0.5 rounded ${
                  selectedStampType === 'FREIGEGEBEN' ? 'text-emerald-700 border-emerald-700' :
                  selectedStampType === 'VETO / GESTOPPT' ? 'text-red-700 border-red-700' :
                  selectedStampType === 'REVISION A' ? 'text-blue-700 border-blue-700' :
                  'text-amber-700 border-amber-700'
                }`}>
                  {selectedStampType}
                </div>
              </div>
            )}

            {/* TECHNICAL BLUEPRINT SCHEMATIC BANNER HUD */}
            <div className="absolute top-6 left-6 pointer-events-none">
              <div className="bg-white border-2 border-slate-900 p-4 shadow-[4px_4px_0px_rgba(17,24,39,0.15)] flex flex-col font-mono-tech border-double">
                <span className="text-[9px] text-blue-600 uppercase tracking-wider font-extrabold flex items-center gap-1">
                  📐 BUNDES-BAUPLAN-METAPHER
                </span>
                <span className="text-xs text-slate-900 font-bold mt-1 uppercase tracking-tight">Systemischer Struktur-Aufriss (Draft v4.2)</span>
              </div>
            </div>

            {/* INTERACTIVE CONTROLS HUD */}
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between interactive-control z-20 font-mono-tech">
              
              {/* Left tools: Clear and Center */}
              <div className="flex gap-2">
                <button
                  onClick={clearStamps}
                  title="Alle Bauplan-Markierungen aufheben"
                  className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-950 text-xs font-bold text-slate-800 hover:text-red-700 transition-all cursor-pointer flex items-center gap-1.5 shadow-[2px_2px_0px_rgba(17,24,39,0.15)]"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Plan zurücksetzen</span>
                </button>
                <button
                  onClick={() => focusOnEntity(selectedEntity)}
                  title="Auf ausgewählte Akte zentrieren"
                  className="p-2.5 bg-white hover:bg-slate-50 border border-slate-950 text-xs font-bold text-slate-800 transition-all cursor-pointer shadow-[2px_2px_0px_rgba(17,24,39,0.15)] flex items-center gap-1"
                >
                  <span>🎯 Fokus zentrieren</span>
                </button>
                <button
                  onClick={() => setViewport({ x: 0, y: 0, zoom: 0.85, rotateZ: 0, rotateX: 0 })}
                  title="Bauplan glätten & resetten"
                  className="p-2.5 bg-white hover:bg-slate-50 border border-slate-950 text-xs font-bold text-slate-800 transition-all cursor-pointer shadow-[2px_2px_0px_rgba(17,24,39,0.15)] flex items-center gap-1"
                >
                  <span>📐 CAD-Reset</span>
                </button>
              </div>

              {/* Center Stempellager controls */}
              <div className="bg-white border border-slate-950 shadow-[3px_3px_0px_rgba(17,24,39,0.15)] p-2.5 flex items-center gap-3">
                <button
                  onClick={toggleStampMode}
                  className={`px-3 py-1.5 rounded text-xs font-bold border transition-all cursor-pointer ${
                    stampMode 
                      ? 'bg-blue-600 text-white border-blue-700 animate-pulse' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
                  }`}
                >
                  {stampMode ? '🛑 PLOTTER ANHALTEN' : '📐 PLOTTER-STEMPEL'}
                </button>
                
                {stampMode && (
                  <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded border border-slate-200">
                    {['FREIGEGEBEN', 'VETO / GESTOPPT', 'REVISION A', 'SYSTEM-FEHLER'].map(type => (
                      <button
                        key={type}
                        onClick={() => setSelectedStampType(type)}
                        className={`px-2 py-1 text-[9px] font-bold rounded cursor-pointer transition-all ${
                          selectedStampType === type 
                            ? 'bg-slate-900 text-white' 
                            : 'text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Amtsschimmel and instructions banner */}
              <div className="bg-white border border-slate-950 shadow-[2px_2px_0px_rgba(17,24,39,0.15)] px-3.5 py-1.5 text-xs text-slate-850 flex items-center gap-2">
                <Ruler className="h-4.5 w-4.5 text-blue-500" />
                <span>Amtsschimmel-Index: <b>{amtsschimmel}%</b></span>
              </div>
            </div>
          </div>
        )}
      </main>

      <aside 
        className={`w-96 flex flex-col z-20 transition-all duration-300 absolute right-0 top-0 bottom-0 lg:static ${
          selectedEntity ? 'translate-x-0' : 'translate-x-full lg:w-0 lg:border-l-0 lg:overflow-hidden'
        } ${
          viewMode === 'scribble'
            ? 'blueprint-sheet border-l-2 border-slate-900 shadow-[-4px_0_0_rgba(17,24,39,0.15)] text-slate-900 font-mono-tech'
            : 'bg-slate-900 border-l border-slate-800 shadow-2xl text-slate-100 font-sans'
        }`}
      >
        {selectedEntity ? (
          <>
            {/* SIDEBAR HEADER */}
            <div className={`p-6 flex justify-between items-start ${
              viewMode === 'scribble'
                ? 'border-b-2 border-slate-900 bg-slate-50/50'
                : 'border-b border-slate-800 bg-slate-950/20'
            }`}>
              <div>
                <span className={
                  viewMode === 'scribble'
                    ? `text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 border border-slate-950 text-slate-950`
                    : `text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md ${
                        selectedEntity.type === 'Staat' ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20 animate-pulse' :
                        selectedEntity.type === 'Ministerium' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        'bg-slate-800 text-slate-400 border border-slate-700'
                      }`
                }>
                  {selectedEntity.type}
                </span>
                <h2 className={`leading-snug mt-3 font-bold ${
                  viewMode === 'scribble'
                    ? 'text-lg uppercase tracking-tight text-slate-950'
                    : 'text-xl font-black text-slate-100'
                }`}>
                  {selectedEntity.name}
                </h2>
              </div>
              <button 
                onClick={() => setSelectedEntity(null)} 
                className={
                  viewMode === 'scribble'
                    ? 'p-1.5 border border-slate-900 bg-white hover:bg-slate-100 text-slate-900 transition-all cursor-pointer'
                    : 'p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-100 rounded-lg transition-colors cursor-pointer'
                }
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* SIDEBAR SCROLLABLE CONTENT */}
            <div className={`p-6 flex-1 overflow-y-auto space-y-6`}>
              
              {/* Description */}
              <p className={
                viewMode === 'scribble'
                  ? 'text-slate-750 text-xs leading-relaxed border-l-2 border-slate-900 pl-3.5 font-medium'
                  : 'text-slate-400 text-xs leading-relaxed border-l-2 border-slate-700 pl-3 italic'
              }>
                {selectedEntity.description}
              </p>

              {/* Key Metrics Budget & Employees */}
              <div className="grid grid-cols-2 gap-4">
                <div className={
                  viewMode === 'scribble'
                    ? 'bg-slate-50 border border-slate-900 shadow-[2px_2px_0px_rgba(17,24,39,0.15)] p-4 text-slate-950'
                    : 'bg-slate-950 p-4 rounded-xl border border-slate-800/80 shadow-md text-slate-100'
                }>
                  <div className={
                    viewMode === 'scribble'
                      ? 'text-slate-600 text-[8px] uppercase font-bold tracking-widest mb-1.5 flex items-center gap-1.5'
                      : 'text-slate-500 text-[9px] uppercase font-bold tracking-wider mb-1.5 flex items-center gap-1.5'
                  }>
                    <Coins className={`h-3.5 w-3.5 ${viewMode === 'scribble' ? 'text-slate-900' : 'text-emerald-500'}`} /> [BUDGET]
                  </div>
                  <div className={
                    viewMode === 'scribble'
                      ? 'text-base font-extrabold text-slate-950 font-mono-tech'
                      : 'text-lg font-mono text-emerald-400 font-bold'
                  }>
                    {selectedEntity.budget || 'k.A.'}
                  </div>
                </div>
                
                <div className={
                  viewMode === 'scribble'
                    ? 'bg-slate-50 border border-slate-900 shadow-[2px_2px_0px_rgba(17,24,39,0.15)] p-4 text-slate-950'
                    : 'bg-slate-950 p-4 rounded-xl border border-slate-800/80 shadow-md text-slate-100'
                }>
                  <div className={
                    viewMode === 'scribble'
                      ? 'text-slate-600 text-[8px] uppercase font-bold tracking-widest mb-1.5 flex items-center gap-1.5'
                      : 'text-slate-500 text-[9px] uppercase font-bold tracking-wider mb-1.5 flex items-center gap-1.5'
                  }>
                    <Users className={`h-3.5 w-3.5 ${viewMode === 'scribble' ? 'text-slate-900' : 'text-blue-400'}`} /> [MITARBEITER]
                  </div>
                  <div className={
                    viewMode === 'scribble'
                      ? 'text-base font-extrabold text-slate-950 font-mono-tech'
                      : 'text-lg font-mono text-slate-200 font-bold'
                  }>
                    {selectedEntity.employees || 'k.A.'}
                  </div>
                </div>
              </div>

              {/* Administrative metadata */}
              <div className={
                viewMode === 'scribble'
                  ? 'bg-slate-50 border border-slate-900 shadow-[2px_2px_0px_rgba(17,24,39,0.15)] p-4 space-y-4 text-slate-950'
                  : 'bg-slate-950 p-4.5 rounded-xl border border-slate-800/60 space-y-4 shadow-sm text-slate-100'
              }>
                <div className="flex items-start gap-3">
                  <Building2 className={`h-4.5 w-4.5 shrink-0 mt-0.5 ${viewMode === 'scribble' ? 'text-slate-950' : 'text-indigo-400'}`} />
                  <div>
                    <span className={
                      viewMode === 'scribble'
                        ? 'text-slate-600 text-[8px] uppercase font-bold tracking-widest block mb-0.5'
                        : 'text-slate-500 text-[9px] uppercase font-bold tracking-wider block mb-0.5'
                    }>
                      Leitung & Spitze
                    </span>
                    <span className={
                      viewMode === 'scribble'
                        ? 'text-slate-900 text-xs font-bold'
                        : 'text-slate-200 text-xs font-semibold'
                    }>
                      {selectedEntity.head || 'Unbekannt'}
                    </span>
                  </div>
                </div>
                {selectedEntity.short && (
                  <div className={`flex items-start gap-3 pt-3.5 border-t ${
                    viewMode === 'scribble' ? 'border-slate-350' : 'border-slate-900'
                  }`}>
                    <MapPin className={`h-4.5 w-4.5 shrink-0 mt-0.5 ${viewMode === 'scribble' ? 'text-slate-950' : 'text-indigo-400'}`} />
                    <div>
                      <span className={
                        viewMode === 'scribble'
                          ? 'text-slate-600 text-[8px] uppercase font-bold tracking-widest block mb-0.5'
                          : 'text-slate-500 text-[9px] uppercase font-bold tracking-wider block mb-0.5'
                      }>
                        Offizielles Kürzel
                      </span>
                      <span className="text-xs font-bold uppercase font-mono-tech">
                        {selectedEntity.short}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* INTERIOR ROOF DETAIL VIEW (SATIRICAL BEHÖRDEN INHABITANTS) */}
              {(viewMode === '3d' || viewMode === 'scribble') && selectedEntity.rooms && (
                <div className={`pt-4 border-t ${viewMode === 'scribble' ? 'border-slate-900' : 'border-slate-800'}`}>
                  <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${
                    viewMode === 'scribble' ? 'text-slate-950' : 'text-slate-300'
                  }`}>
                    <Cpu className={`h-4 w-4 ${viewMode === 'scribble' ? 'text-slate-950' : 'text-emerald-400'}`} />
                    {viewMode === 'scribble' ? `GEBÄUDE-AUFRISS (${selectedEntity.rooms.length} SEKTIONEN)` : `Blick ins geöffnete Gebäude (${selectedEntity.rooms.length} Etagen)`}
                  </h3>
                  
                  <div className="space-y-3">
                    {selectedEntity.rooms.map((room, idx) => (
                      <div 
                        key={idx} 
                        className={
                          viewMode === 'scribble'
                            ? 'bg-slate-50 border border-slate-900 shadow-[2px_2px_0px_rgba(17,24,39,0.15)] p-3.5 flex flex-col space-y-1.5 transition-all text-slate-950'
                            : 'bg-slate-950/80 p-3.5 rounded-xl border border-slate-850/80 hover:border-emerald-500/20 transition-all flex flex-col space-y-1.5 shadow-md text-slate-150'
                        }
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-950">
                            {room.name}
                          </span>
                          <span className={
                            viewMode === 'scribble'
                              ? 'text-[8px] font-bold px-1.5 py-0.5 bg-slate-200 text-slate-850 border border-slate-900 rounded font-mono-tech'
                              : 'text-[8px] font-mono px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-bold'
                          }>
                            {room.item}
                          </span>
                        </div>
                        <p className={
                          viewMode === 'scribble'
                            ? 'text-[10px] text-slate-650 leading-normal font-mono-tech'
                            : 'text-[10px] text-slate-500 leading-normal'
                        }>
                          {room.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* HISTORIC SCANDALS TAB */}
              {selectedEntity.scandals && (
                <div className={`pt-4 border-t ${viewMode === 'scribble' ? 'border-slate-900' : 'border-t border-slate-800'}`}>
                  <div className={
                    viewMode === 'scribble'
                      ? 'bg-red-50 border border-red-500 shadow-[2px_2px_0px_rgba(239,68,68,0.15)] p-4 space-y-3 relative overflow-hidden text-red-950 font-mono-tech'
                      : 'bg-red-500/5 border border-red-500/15 p-4 rounded-xl space-y-3 shadow-md text-slate-100'
                  }>
                    <div className={`flex items-center gap-2 text-xs font-bold ${
                      viewMode === 'scribble' ? 'text-red-800' : 'text-red-400'
                    }`}>
                      {viewMode === 'scribble' ? <span className="text-sm">⚠️</span> : <Flame className="h-4 w-4 text-red-400" />}
                      Historischer Skandal-Index
                    </div>
                    <p className={
                      viewMode === 'scribble'
                        ? 'text-[10px] text-red-900 leading-relaxed font-mono-tech'
                        : 'text-[10px] text-slate-400 leading-relaxed font-medium'
                    }>
                      {selectedEntity.scandals}
                    </p>
                    {(viewMode === '3d' || viewMode === 'scribble') && (
                      <button
                        onClick={() => triggerScandalPulse(selectedEntity.id)}
                        className={
                          viewMode === 'scribble'
                            ? 'w-full mt-1.5 py-2 px-3 bg-red-100 hover:bg-red-200 border border-red-700 shadow-[2px_2px_0_#b91c1c] text-red-800 hover:text-red-950 font-bold rounded text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer font-mono-tech'
                            : 'w-full mt-1.5 py-2 px-3 bg-red-600/15 hover:bg-red-600/25 border border-red-500/20 hover:border-red-500/40 text-red-400 font-bold rounded-lg text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer'
                        }
                      >
                        <AlertTriangle className="h-3 w-3" />
                        {viewMode === 'scribble' ? '[SKANDAL-ALARM AUSLÖSEN]' : 'Gebäude-Skandal-Alarm pulsen'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* OUTSTANDING ACHIEVEMENTS */}
              {selectedEntity.achievements && (
                <div className={`pt-4 border-t ${viewMode === 'scribble' ? 'border-slate-900' : 'border-t border-slate-800'}`}>
                  <div className={
                    viewMode === 'scribble'
                      ? 'bg-emerald-50 border border-emerald-500 shadow-[2px_2px_0px_rgba(16,185,129,0.15)] p-4 space-y-2 text-emerald-950 font-mono-tech'
                      : 'bg-emerald-500/5 border border-emerald-500/15 p-4 rounded-xl space-y-2 shadow-md text-slate-100'
                  }>
                    <div className={`flex items-center gap-2 text-xs font-bold ${
                      viewMode === 'scribble' ? 'text-emerald-800' : 'text-emerald-400'
                    }`}>
                      {viewMode === 'scribble' ? <span className="text-sm">🩹</span> : <TrendingUp className="h-4 w-4 text-emerald-400" />}
                      Hervorzuhebende Leistung
                    </div>
                    <p className={
                      viewMode === 'scribble'
                        ? 'text-[10px] text-emerald-900 leading-relaxed font-mono-tech'
                        : 'text-[10px] text-slate-400 leading-relaxed'
                    }>
                      {selectedEntity.achievements}
                    </p>
                  </div>
                </div>
              )}

              {/* SUBORDINATE HIERARCHY ACCORDION */}
              {selectedEntity.children && selectedEntity.children.length > 0 && (
                <div className={`pt-4 border-t ${viewMode === 'scribble' ? 'border-slate-900' : 'border-t border-slate-800'}`}>
                  <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${
                    viewMode === 'scribble' ? 'text-slate-950' : 'text-slate-350'
                  }`}>
                    <Layers className={`h-4 w-4 ${viewMode === 'scribble' ? 'text-slate-950' : 'text-blue-400'}`} />
                    Nachgeordnete Behörden ({selectedEntity.children.length})
                  </h3>
                  <div className="space-y-2.5">
                    {selectedEntity.children.map((child) => (
                      <div 
                        key={child.id} 
                        onClick={() => handleEntitySelect(child)}
                        className={
                          viewMode === 'scribble'
                            ? 'p-3 bg-slate-50 hover:bg-slate-100 border border-slate-900 shadow-[2px_2px_0px_rgba(17,24,39,0.15)] hover:shadow-[1px_1px_0px_rgba(17,24,39,0.15)] hover:translate-x-0.5 hover:translate-y-0.5 cursor-pointer transition-all flex items-center justify-between text-slate-950 group'
                            : 'p-3 bg-slate-950 hover:bg-slate-950/80 border border-slate-850 hover:border-blue-500/40 rounded-xl cursor-pointer transition-all group flex items-center justify-between shadow-sm text-slate-100'
                        }
                      >
                        <div className="max-w-[200px]">
                          <div className={`font-bold text-xs transition-colors ${
                            viewMode === 'scribble'
                              ? 'text-slate-950 group-hover:text-blue-700'
                              : 'text-slate-200 group-hover:text-blue-400'
                          }`}>
                            {child.short || child.name}
                          </div>
                          <div className={`text-[9px] truncate mt-0.5 ${
                            viewMode === 'scribble'
                              ? 'text-slate-500 font-mono-tech'
                              : 'text-slate-500'
                          }`} title={child.name}>
                            {child.name}
                          </div>
                        </div>
                        <ChevronRight className={`h-4 w-4 transition-transform group-hover:translate-x-0.5 duration-200 ${
                          viewMode === 'scribble'
                            ? 'text-slate-500 group-hover:text-blue-700'
                            : 'text-slate-600 group-hover:text-blue-400'
                        }`} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className={`flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 ${
            viewMode === 'scribble' ? 'text-slate-500' : 'text-slate-500'
          }`}>
            {viewMode === 'scribble' ? (
              <span className="text-3xl">📐</span>
            ) : (
              <Compass className="h-10 w-10 text-slate-700 animate-spin-slow" />
            )}
            <div className={`font-bold ${viewMode === 'scribble' ? 'text-sm text-slate-950 uppercase tracking-wider' : 'text-sm text-slate-400'}`}>
              CAD-Projektmappe bereit
            </div>
            <p className={`max-w-[240px] leading-relaxed ${
              viewMode === 'scribble' ? 'text-[10px] text-slate-600' : 'text-[10px] text-slate-600'
            }`}>
              {viewMode === 'scribble'
                ? 'Wähle ein Gebäude auf dem Konstruktionsraster aus, um das detaillierte Raum-Aufrissblatt und die Budgets einzusehen!'
                : 'Wähle ein 3D-Ressort oder ein nachgeordnetes Amt aus, um die staatlichen Akten, Budgetströme und Skandale einzusehen.'}
            </p>
            <button
              onClick={() => handleEntitySelect(staatData)}
              className={
                viewMode === 'scribble'
                  ? 'py-2.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-950 shadow-[2px_2px_0px_rgba(17,24,39,0.15)] text-xs font-bold text-slate-950 rounded cursor-pointer transition-all flex items-center gap-1.5'
                  : 'py-2 px-4 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-400 hover:text-slate-200 rounded-lg cursor-pointer transition-all flex items-center gap-1.5 shadow-md'
              }
            >
              Kanzleramt wählen <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}

// Wrap with ReactFlowProvider to support useReactFlow operations correctly
export default function App() {
  return (
    <ReactFlowProvider>
      <ZeigtDenStaatDashboard />
    </ReactFlowProvider>
  );
}

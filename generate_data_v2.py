import math
import json

# Define the 16 ministries and BKAmt with their sub-agencies and metadata under the Merz 2026 government
ministries_data = [
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
            {"name": "Krisenreaktionszentrum", "desc": "Riesige Weltkarte mit blinkenden roten Lichtern. Ständig besetzt.", "item": "Rotes Satelliten-Telefon"},
            {"name": "Diplomaten-Lounge", "desc": "Feine Canapés und Champagner. Gespräche über informelle Abkommen.", "item": "Kristall-Karaffe"}
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
                "description": "Führt weltweit Forschungen und Ausgrabungen auf dem Gebiet der Archäologie und Altertumswissenschaften durch."
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
                "description": "Unterstützt das Auswärtige Amt bei Visabeantwortungen, der Verwaltung von Auslandsimmobilien und Förderprojekten."
            }
        ]
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
            {"name": "Lagezentrum Innere Sicherheit", "desc": "Live-Kameras und Notfall-Telefone in Blau.", "item": "Blaulicht-Schalter"},
            {"name": "Referat Heimat", "desc": "Gemütlich eingerichtet mit virtuellem Kaminfeuer und Kuckucksuhren.", "item": "Dunstabzug-Kuckucksuhr"}
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
                "description": "Der Inlandsnachrichtendienst der Bundesrepublik Deutschland zur Beobachtung verfassungsfeindlicher Bestrebungen."
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
                "description": "Die nationale Cyber-Sicherheitsbehörde für Staat, Wirtschaft und Bürger."
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
                "description": "Koordiniert den Katastrophenschutz der Bundesländer und betreibt das nationale Warnsystem."
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
                "description": "Die Zentralstelle der deutschen Polizei für Kriminalitätsbekämpfung und Koordination mit Interpol."
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
                "description": "Schützt die Bundesgrenzen, Bahnhöfe, Flughäfen und verfassungsrechtliche Organe des Bundes."
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
                "description": "Zentrale Behörde für Asylverfahren, Integration und Migrationssteuerung in Deutschland."
            }
        ]
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
            {"name": "Gesetzes-Bibliothek", "desc": "Historische Folianten und moderne Verordnungen. Duftet nach altem Leder.", "item": "BGB in Goldprägung"},
            {"name": "Prüfstelle für Verfassung", "desc": "Wo jedes Wort auf die Goldwaage gelegt wird.", "item": "Goldwaage für Paragraphen"}
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
                "description": "Das nationale Patentamt mit Sitz in München ist das größte Patentamt Europas."
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
                "description": "Zentrale Dienstleistungsbehörde der Bundesjustiz, unter anderem zuständig für das Bundeszentralregister."
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
                "description": "Die oberste Strafverfolgungsbehörde des Bundes zur Bekämpfung von Gefährdungen der inneren und äußeren Sicherheit."
            }
        ]
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
            {"name": "Tresorraum", "desc": "Verwaltung der Schuldenbremse. Enthält hauptsächlich Verträge.", "item": "Schwarze Null (Gusseisen)"},
            {"name": "Stempellager", "desc": "Sitz der echten Finanzgewalt. Jedes Formular braucht vier Stempel.", "item": "Stempel-Karussell v19"}
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
                "description": "Aufsichtsbehörde für Banken, Versicherungen und den gesamten Wertpapierhandel."
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
                "description": "Verwaltet Zölle, Verbrauchsteuern und sichert die Grenzen gegen Warenschmuggel."
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
                "description": "Zuständig für internationale Steuerangelegenheiten, Bundesbetriebsprüfungen und das steuerliche Identifikationsmerkmal."
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
                "description": "Verwaltet das gesamte Immobilienvermögen der Bundesrepublik Deutschland und stellt Bundesflächen bereit."
            }
        ]
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
            {"name": "Energie-Lagezentrum", "desc": "Überwachung des Stromnetzes und Gaslagerstände auf LED-Tafeln.", "item": "Mega-Schalter für Trassenzufuhr"},
            {"name": "Mittelstands-Forum", "desc": "Wo die Klagen der Bürokratie-Geschädigten gesammelt werden.", "item": "Klage-Briefkasten (Überfüllt)"}
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
                "description": "Unabhängige Wettbewerbsbehörde zum Schutz des Wettbewerbs in Deutschland."
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
                "description": "Regulierungsbehörde für Elektrizität, Gas, Telekommunikation, Post und Eisenbahnen."
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
                "description": "Zuständig für die Kontrolle von Rüstungs- und Dual-Use-Exporten sowie für Wirtschaftsförderprogramme."
            }
        ]
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
            {"name": "Renten-Rechenzentrum", "desc": "Supercomputer berechnen Sekunde für Sekunde den demografischen Wandel.", "item": "Rentenrechner IBM-9000"},
            {"name": "Arbeitsschutz-Labor", "desc": "Hier werden ergonomische Bürostühle auf maximale Gemütlichkeit geprüft.", "item": "Ergo-Stuhl (Stufe 5)"}
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
                "description": "Führt Arbeitsmarktberatung und -vermittlung durch und verwaltet das Arbeitslosengeld."
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
                "description": "Forscht und berät im Bereich Sicherheit und Gesundheit bei der Arbeit."
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
                "description": "Aufsichtsbehörde für bundesunmittelbare Sozialversicherungsträger und Verwalter des Gesundheitsfonds."
            }
        ]
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
            {"name": "Ernährungs-Prüfküche", "desc": "Entwicklung von Standards für gesundes Kantinenessen. Vegan vs. Currywurst-Debatten.", "item": "Nutri-Score Prüfstempel"},
            {"name": "Heimat-Archiv", "desc": "Karten ländlicher Regionen, Pläne zur Digitalisierung von Dorfgemeinschaftshäusern.", "item": "Modell-Traktor Fendt-Vario"}
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
                "description": "Bundesforschungsinstitut für Kulturpflanzen mit Hauptsitz in Quedlinburg."
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
                "description": "Koordiniert die Lebensmittelüberwachung der Länder und lässt Pflanzenschutzmittel zu."
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
                "description": "Dienstleistungszentrum für Agrarwirtschaft, ländliche Räume und Fischerei."
            }
        ]
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
            {"name": "Lagezentrum Bundeswehr", "desc": "Große Bildschirme. Aktueller Status des Hubschrauber-Fuhrparks: In Arbeit.", "item": "Tarn-Kugelschreiber"},
            {"name": "Musterungskammer", "desc": "Verwaltung der Personalstärken. Kaffeeautomat steht still.", "item": "Helm-Dackel"}
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
                "description": "Sitz in Koblenz. Zuständig für das komplette Beschaffungswesen der Streitkräfte."
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
                "description": "Gestaltet die langfristige Planung, Konzeption und Rüstungsausrichtung der Bundeswehr."
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
                "description": "Zuständig für die Personalgewinnung, -führung und -entwicklung aller Soldaten und zivilen Angestellten der Bundeswehr."
            }
        ]
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
            {"name": "Pandemie-Stabsraum", "desc": "Wo die Inzidenzwerte historisch archiviert werden.", "item": "Desinfektionsgel-Brunnen"},
            {"name": "Medikamenten-Zulassung", "desc": "Hier stapeln sich Studien und Testberichte.", "item": "Riesen-Lupe für Beipackzettel"}
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
                "description": "Das nationale Public-Health-Institut zur Erkennung, Verhütung und Bekämpfung von Krankheiten."
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
                "description": "Bundesinstitut für Impfstoffe und biomedizinische Arzneimittel."
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
                "description": "Die Zulassungsbehörde für Humanarzneimittel in Deutschland mit Sitz in Bonn."
            }
        ]
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
            {"name": "Trassen-Planungsbüro", "desc": "Große Ausklapptische mit Autobahnplänen und Eisenbahnnetzen.", "item": "Maßstabslineal (1:1000)"},
            {"name": "Brücken-Lagezentrum", "desc": "Überwachung maroder Brücken mit roten Warn-LEDs.", "item": "Stützkorsett-Modell für Autobahnbrücken"}
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
                "description": "Aufsichts-, Sicherheits- und Zulassungsbehörde für Schienenwege und Züge."
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
                "description": "Zuständig für Typgenehmigungen von Autos, das Fahreignungsregister und Rückrufe."
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
                "description": "Zuständig für die Sicherheit und Leichtigkeit des Verkehrs auf den Bundeswasserstraßen."
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
                "description": "Reguliert und überwacht den Güterkraftverkehr, koordiniert Mautkontrollen und fördert die Fahrradmobilität."
            }
        ]
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
            {"name": "Artenschutz-Zentrale", "desc": "Statistiken über Wölfe, Biber und Insektenpopulationen an Monitoren.", "item": "Wolfsspur-Gipsabdruck"},
            {"name": "Klimaschutz-Konferenz", "desc": "Klimafreundlich gekühlt durch ein innovatives Umluft-Pflanzensystem.", "item": "Solar-Ventilator"}
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
                "description": "Die zentrale Umweltbehörde Deutschlands für wissenschaftliche Beratung und Umweltdaten."
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
                "description": "Schützt Mensch und Umwelt vor den Gefahren ionisierender und nichtionisierender Strahlung."
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
                "description": "Wissenschaftliche Behörde des Bundes für nationalen und internationalen Naturschutz."
            }
        ]
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
            {"name": "Stadtplanungs-Saal", "desc": "Modelle zukünftiger autofreier Stadtviertel und grüner Metropolen.", "item": "Stadtmodell aus Recycling-Karton"},
            {"name": "Bauordnungs-Archiv", "desc": "Wo die berüchtigte DIN 18040 und andere Vorschriften lagern.", "item": "Prüflehre für Türrahmen"}
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
                "description": "Unterstützt das Ministerium wissenschaftlich bei Aufgaben des Wohnungs-, Immobilien- und Bauwesens."
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
                "description": "Betreut Bundesbauten im In- und Ausland und berät die Bundesregierung in Raumordnungsfragen."
            }
        ]
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
            {"name": "Digital-War-Room", "desc": "Live-Monitore überwachen die Übertragungsgeschwindigkeiten deutscher Mobilfunknetze.", "item": "Glasfaser-Kabelstück (Vergoldet)"},
            {"name": "Entbürokratisierung", "desc": "Hier werden alte Formulare geschreddert und durch digitale Workflows ersetzt.", "item": "Akten-Schredder (Dauerbetrieb)"}
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
                "description": "Die FITKO steuert die Digitalisierungsvorhaben des IT-Planungsrats von Bund und Ländern."
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
                "description": "Der zentrale Dienstleister des Bundes, zuständig für BAföG, Bundesbesoldung und Registerbehörden."
            }
        ]
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
            {"name": "KI-Forschungslabor", "desc": "Supercomputer berechnen Sprachmodelle. Roboterhunde patrouillieren auf dem Gang.", "item": "Supercomputer-Kühltasse"},
            {"name": "Raumfahrt-Kontrollraum", "desc": "Live-Feed von europäischen Raketenstarts und Satellitenbahnen.", "item": "Modell-Teleskop"}
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
                "description": "Forschungszentrum der Bundesrepublik für Luft- und Raumfahrt sowie Raumfahrtagentur für das deutsche Raumfahrtprogramm."
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
                "description": "Erstellt wissenschaftliche Gutachten zur Lebensmittelsicherheit sowie zum Schutz von Verbrauchern."
            }
        ]
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
            {"name": "Kita-Zukunfts-Lab", "desc": "Spielecken kombiniert mit Tablets. Prototypen für modernes Lernen.", "item": "Holz-Tablet-Attrappe"},
            {"name": "Generationen-Treff", "desc": "Konferenzraum mit barrierefreiem Zugang und digitaler Vorlese-Ecke.", "item": "Riesen-Hörbuch-Knopf"}
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
                "description": "Führt Aufgaben des Bundesfreiwilligendienstes, der Altenpflegeausbildung und Familienförderung durch."
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
                "description": "Prüft und indiziert jugendgefährdende Medien und stärkt den Schutz von Kindern in der digitalen Medienwelt."
            }
        ]
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
            {"name": "Global-Liaison-Office", "desc": "Hier werden Videokonferenzen mit Partnern auf allen Kontinenten koordiniert.", "item": "Globus mit solarbetriebenem Leuchtring"},
            {"name": "Projekt-Validierungsstelle", "desc": "Prüfung von Nachhaltigkeitskriterien und Mittelverwendung.", "item": "Prüfstempel 'NACHHALTIG'"}
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
                "description": "Evaluiert die Maßnahmen der deutschen Entwicklungszusammenarbeit unabhängig auf Wirksamkeit."
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
                "description": "Die staatseigene Durchführungsorganisation der deutschen Entwicklungszusammenarbeit."
            }
        ]
    }
]

# Assemble the full tree with BKAmt (bund) at the root
bund_root = {
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
        {"name": "Kabinettssaal", "desc": "Ort der großen Ministerrunden. Keks-Vorrat: Streng vertraulich.", "item": "Roter Knopf (Stufe 10)"},
        {"name": "Referat Z", "desc": "Zentralabteilung für interne Anträge. Bearbeitungszeit: Unbekannt.", "item": "1.200 Leitz-Ordner"},
        {"name": "Kaffeeküche", "desc": "Wichtigster politischer Katalysator. Täglicher Verbrauch: 450 Liter Espresso.", "item": "Kaffeeautomat (Stufe 2)"}
    ],
    "children": []
}

# Add Kanzleramt's own subordinate agencies
bnd_agency = {
    "id": "bnd",
    "name": "Bundesnachrichtendienst",
    "short": "BND",
    "type": "Behörde",
    "budget": "1,1 Mrd. €",
    "employees": "6.500",
    "head": "Thomas Haldenwang (Präsident)",
    "colorKey": "sub",
    "x": -90,
    "y": -140, # North-West of Kanzleramt
    "scandals": "Der versehentliche Verlust von vertraulichen Bauplänen des Hauptquartiers in Berlin durch einen unverschlüsselten USB-Stick im Kopierraum.",
    "achievements": "Frühzeitige Entdeckung von Cyber-Bedrohungen durch den Einsatz der neuen 'Operation Quanten-Spur'.",
    "description": "Der deutsche Auslandsnachrichtendienst sammelt zivile und militärische Informationen aus dem Ausland zur Sicherheitsvorsorge."
}

bpa_agency = {
    "id": "bpa",
    "name": "Presse- und Informationsamt der Bundesregierung",
    "short": "BPA",
    "type": "Behörde",
    "budget": "160 Mio. €",
    "employees": "480",
    "head": "Steffen Hebestreit",
    "colorKey": "sub",
    "x": 90,
    "y": -140, # North-East of Kanzleramt
    "scandals": "Die 'Spätschicht-Social-Media-Panne', bei der auf dem offiziellen Kanal des Kanzlers ein Bild eines schlafenden Koalabären gepostet wurde.",
    "achievements": "Erfolgreiche Aufklärungskampagne zum Bürokratieabbau über humorvolle Erklärvideos.",
    "description": "Informiert Bürger und Medien über die Politik der Bundesregierung und unterrichtet den Bundeskanzler über die Nachrichtenlage."
}

# Math calculation for the star layout!
R_parent = 480
num_ministries = len(ministries_data)

# Let's map each ministry around the circle
for i, min_entry in enumerate(ministries_data):
    angle = i * (2 * math.pi / num_ministries)
    
    # Calculate parent coordinates
    x_p = int(round(R_parent * math.cos(angle)))
    y_p = int(round(R_parent * math.sin(angle)))
    
    min_entry["x"] = x_p
    min_entry["y"] = y_p
    min_entry["colorKey"] = min_entry["id"] # Use the ministry id as its colorKey
    
    # Calculate child coordinates
    children = min_entry.get("children", [])
    num_children = len(children)
    
    if num_children == 1:
        # Pushed radially outwards
        child_r = R_parent + 140
        x_c = int(round(child_r * math.cos(angle)))
        y_c = int(round(child_r * math.sin(angle)))
        
        children[0]["x"] = x_c
        children[0]["y"] = y_c
        children[0]["colorKey"] = "sub"
        
    elif num_children == 2:
        # Fan out left/right
        child_r = R_parent + 140
        angle_offset = 0.12 # around 7 degrees
        
        for c_idx, child in enumerate(children):
            c_angle = angle - angle_offset if c_idx == 0 else angle + angle_offset
            x_c = int(round(child_r * math.cos(c_angle)))
            y_c = int(round(child_r * math.sin(c_angle)))
            
            child["x"] = x_c
            child["y"] = y_c
            child["colorKey"] = "sub"
            
    elif num_children == 3:
        # Fan out left, middle (further), right
        angle_offset = 0.18
        
        for c_idx, child in enumerate(children):
            if c_idx == 0:
                c_angle = angle - angle_offset
                child_r = R_parent + 140
            elif c_idx == 1:
                c_angle = angle
                child_r = R_parent + 220 # Staggered further out to avoid overlap!
            else:
                c_angle = angle + angle_offset
                child_r = R_parent + 140
                
            x_c = int(round(child_r * math.cos(c_angle)))
            y_c = int(round(child_r * math.sin(c_angle)))
            
            child["x"] = x_c
            child["y"] = y_c
            child["colorKey"] = "sub"
            
    elif num_children == 4:
        # Fan out two layers (two close, two far)
        for c_idx, child in enumerate(children):
            if c_idx == 0:
                c_angle = angle - 0.16
                child_r = R_parent + 140
            elif c_idx == 1:
                c_angle = angle + 0.16
                child_r = R_parent + 140
            elif c_idx == 2:
                c_angle = angle - 0.08
                child_r = R_parent + 230
            else:
                c_angle = angle + 0.08
                child_r = R_parent + 230
                
            x_c = int(round(child_r * math.cos(c_angle)))
            y_c = int(round(child_r * math.sin(c_angle)))
            
            child["x"] = x_c
            child["y"] = y_c
            child["colorKey"] = "sub"
            
    elif num_children >= 5: # e.g. BMI with 6 children
        # Staggered branch structure (3 layers of 2)
        for c_idx, child in enumerate(children):
            layer = c_idx // 2 # 0, 1, 2
            side = -1 if c_idx % 2 == 0 else 1
            
            child_r = R_parent + 140 + layer * 100
            c_angle = angle + side * (0.16 - layer * 0.05)
            
            x_c = int(round(child_r * math.cos(c_angle)))
            y_c = int(round(child_r * math.sin(c_angle)))
            
            child["x"] = x_c
            child["y"] = y_c
            child["colorKey"] = "sub"

    bund_root["children"].append(min_entry)

# Add BND and BPA to Kanzleramt children
bund_root["children"].append(bnd_agency)
bund_root["children"].append(bpa_agency)

# Output Javascript object representation
js_code = "const staatData = " + json.dumps(bund_root, indent=2, ensure_ascii=False) + ";"

# Write JS code to a file
with open("d:\\Dev\\ZeigDenStaat\\staatData_output.js", "w", encoding="utf-8") as out_f:
    out_f.write(js_code)

print("SUCCESS: Generated expanded staatData structure in d:\\Dev\\ZeigDenStaat\\staatData_output.js")

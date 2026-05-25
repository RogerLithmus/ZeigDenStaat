export interface Agency {
  id: string;
  name: string;
  abbreviation: string;
  budget: number; // in Billion EUR
  employees: number; // headcount
  description: string;
  quirk: string; // satirical quirk
  faxRatio: number; // Fax machines per 10 employees
  coffeeIndex: number; // Litres of coffee per employee per year
}

export interface Ministry {
  id: string;
  name: string;
  abbreviation: string;
  budget: number; // in Billion EUR
  employees: number; // headcount in ministry proper
  foundingYear: number;
  color: string; // hex representation for aesthetics
  gradient: string; // CSS gradient class
  description: string;
  politicalWeight: number; // arbitrary power index 1-10
  ministerName: string;
  quirk: string;
  agencies: Agency[];
}

export const mockStateData: Ministry[] = [
  {
    id: "bkamt",
    name: "Bundeskanzleramt",
    abbreviation: "BKAmt",
    budget: 3.8,
    employees: 950,
    foundingYear: 1949,
    color: "#E2E8F0", // Slate-silver (metallic center)
    gradient: "from-slate-400 to-slate-600",
    description: "Zentrale Koordinationsstelle der deutschen Bundespolitik, geleitet von Bundeskanzler Friedrich Merz im Jahr 2026.",
    politicalWeight: 10,
    ministerName: "Friedrich Merz",
    quirk: "Hat alle Besprechungsräume mit exakt kalibrierten Stoppuhren ausgestattet, um 'sozialdemokratische Redeschleifen' im Keim zu ersticken.",
    agencies: [
      {
        id: "bnd",
        name: "Bundesnachrichtendienst",
        abbreviation: "BND",
        budget: 1.08,
        employees: 6500,
        description: "Der zivile Auslandsnachrichtendienst der Bundesrepublik Deutschland, zuständig für strategische Aufklärung.",
        quirk: "Schreibt geheime Notizen auf wasserlöslichem Papier, das sich beim versehentlichen Kaffeekontakt selbst vernichtet.",
        faxRatio: 1.5,
        coffeeIndex: 480
      },
      {
        id: "bpa",
        name: "Presse- und Informationsamt der Bundesregierung",
        abbreviation: "BPA",
        budget: 0.18,
        employees: 480,
        description: "Informiert Bürgerinnen und Bürger sowie Medien über die Politik der Bundesregierung.",
        quirk: "Betreibt einen geheimen KI-Bot namens 'MerzBot-9000', der Tweets der Opposition auf grammatikalische Fehler scannt.",
        faxRatio: 7.2,
        coffeeIndex: 310
      }
    ]
  },
  {
    id: "bmf",
    name: "Bundesministerium der Finanzen",
    abbreviation: "BMF",
    budget: 11.2,
    employees: 2400,
    foundingYear: 1949,
    color: "#06B6D4", // Cyan
    gradient: "from-cyan-500 to-blue-600",
    description: "Zuständig für die Steuer- und Finanzpolitik des Bundes, mit striktem Sparkurs unter der Regierung Merz 2026.",
    politicalWeight: 10,
    ministerName: "Albert Füracker",
    quirk: "Hat einen goldenen Taschenrechner, der beim Eintippen von 'Steuersenkung' leise Melodien von bayerischen Blasmusikkapellen summt.",
    agencies: [
      {
        id: "gzd",
        name: "Generalzolldirektion",
        abbreviation: "GZD",
        budget: 3.4,
        employees: 44000,
        description: "Verwaltet die Bundessteuern, Zölle und sichert die Grenzen gegen Schmuggel und Schwarzarbeit.",
        quirk: "Hält den inoffiziellen Weltrekord im synchronen Abstempeln von Frachtpapieren mittels mechanischem Doppelstempel.",
        faxRatio: 8.4,
        coffeeIndex: 215
      },
      {
        id: "bzst",
        name: "Bundeszentralamt für Steuern",
        abbreviation: "BZSt",
        budget: 0.38,
        employees: 2300,
        description: "Behandelt steuerliche Angelegenheiten mit Auslandsbezug und erstattet Kapitalertragsteuern.",
        quirk: "Startete ein Pilotprojekt, bei dem hartnäckige Steuersünder Briefe in extrem schnörkeliger Sütterlinschrift erhalten.",
        faxRatio: 9.2,
        coffeeIndex: 240
      },
      {
        id: "bafin",
        name: "Bundesanstalt für Finanzdienstleistungsaufsicht",
        abbreviation: "BaFin",
        budget: 0.28,
        employees: 2700,
        description: "Beaufsichtigt Banken, Versicherer und den gesamten deutschen Wertpapierhandel.",
        quirk: "Überwacht Krypto-Transaktionen manuell, indem Mitarbeiter verdächtige Wallet-IDs auf bunte Karteikarten übertragen.",
        faxRatio: 5.6,
        coffeeIndex: 395
      }
    ]
  },
  {
    id: "bmwk",
    name: "Bundesministerium für Wirtschaft und Klimaschutz",
    abbreviation: "BMWK",
    budget: 13.8,
    employees: 2200,
    foundingYear: 1949,
    color: "#10B981", // Emerald
    gradient: "from-emerald-500 to-teal-600",
    description: "Fokussiert auf wirtschaftliche Dynamisierung, Entlastung des Mittelstandes und marktwirtschaftliche Klimapolitik.",
    politicalWeight: 9,
    ministerName: "Carsten Linnemann",
    quirk: "Verschenkt an jeden neuen Mitarbeiter ein Handbuch zur radikalen Entbürokratisierung mit exakt 850 extrem eng beschriebenen Seiten.",
    agencies: [
      {
        id: "bnetza",
        name: "Bundesnetzagentur",
        abbreviation: "BNetzA",
        budget: 0.31,
        employees: 3100,
        description: "Reguliert Elektrizität, Gas, Telekommunikation, Post und Eisenbahnen zur Sicherung des Wettbewerbs.",
        quirk: "Prüft Mobilfunkfrequenzen auf Kompatibilität mit dem bayerischen Reinheitsgebot für Funkmasten.",
        faxRatio: 7.6,
        coffeeIndex: 290
      },
      {
        id: "bkarta",
        name: "Bundeskartellamt",
        abbreviation: "BKartA",
        budget: 0.045,
        employees: 420,
        description: "Schützt den wirtschaftlichen Wettbewerb durch Kartellverfolgung und Fusionskontrolle.",
        quirk: "Untersucht, ob das gemeinsame Bestellen von Pizza bei Überstunden eine illegale Preisabsprache der Mitarbeiter darstellt.",
        faxRatio: 8.2,
        coffeeIndex: 330
      },
      {
        id: "bafa",
        name: "Bundesamt für Wirtschaft und Ausfuhrkontrolle",
        abbreviation: "BAFA",
        budget: 0.12,
        employees: 1200,
        description: "Zuständig für Außenwirtschaft, Exportkontrolle und Förderung von Energieeffizienz.",
        quirk: "Erstellt wöchentlich Richtlinien zur zollsicheren Ausfuhr von Schwarzwälder Kuckucksuhren in Nicht-EU-Staaten.",
        faxRatio: 6.8,
        coffeeIndex: 280
      }
    ]
  },
  {
    id: "bmvg",
    name: "Bundesministerium der Verteidigung",
    abbreviation: "BMVg",
    budget: 53.5,
    employees: 3400,
    foundingYear: 1955,
    color: "#F59E0B", // Gold/Orange
    gradient: "from-amber-500 to-orange-600",
    description: "Leitet die Landesverteidigung, im Jahr 2026 massiv aufgerüstet zur Stärkung der Bundeswehr unter Kanzler Merz.",
    politicalWeight: 9,
    ministerName: "Roderich Kiesewetter",
    quirk: "Verlangt, dass alle Aktenordner im Ministerium im korrekten militärischen Flecktarn-Muster einsortiert werden.",
    agencies: [
      {
        id: "bundeswehr",
        name: "Streitkräfte der Bundeswehr",
        abbreviation: "Bw",
        budget: 50.2,
        employees: 184000,
        description: "Die Streitkräfte der Bundesrepublik Deutschland zur Bündnis- und Landesverteidigung.",
        quirk: "Betreibt die Kaffeemaschine im Feldlager im Ernstfall durch reine Willenskraft-Dampferzeugung des Hauptmanns.",
        faxRatio: 1.8,
        coffeeIndex: 490
      },
      {
        id: "baainbw",
        name: "Bundesamt für Ausrüstung, Informationstechnik und Nutzung der Bw",
        abbreviation: "BAAINBw",
        budget: 1.3,
        employees: 11500,
        description: "Zuständig für die Ausstattung der Bundeswehr mit modernsten Waffensystemen und Ausrüstung.",
        quirk: "Der Beschaffungsprozess für High-End-Drohnen erfordert einen staatlich geprüften Brieftauben-Testlauf im Innenhof.",
        faxRatio: 9.9,
        coffeeIndex: 220
      }
    ]
  },
  {
    id: "bmi",
    name: "Bundesministerium des Innern und für Heimat",
    abbreviation: "BMI",
    budget: 15.4,
    employees: 2100,
    foundingYear: 1949,
    color: "#EC4899", // Pink
    gradient: "from-pink-500 to-rose-600",
    description: "Zuständig für die innere Sicherheit, den Grenzschutz und die administrative Migrationssteuerung.",
    politicalWeight: 9,
    ministerName: "Alexander Dobrindt",
    quirk: "Hat an den Grenzen unsichtbare 'Heimat-Sensoren' aufgestellt, die die bayerische Gemütlichkeit von Einreisenden messen.",
    agencies: [
      {
        id: "bpol",
        name: "Bundespolizei",
        abbreviation: "BPol",
        budget: 4.8,
        employees: 54000,
        description: "Sichert Grenzen, Bahnhöfe und Flughäfen vor Kriminalität und unbefugtem Grenzübertritt.",
        quirk: "Führt Streifenfahrten auf hochmotorisierten E-Bikes durch, um die CO2-Bilanz der Verbrecherjagd zu optimieren.",
        faxRatio: 4.5,
        coffeeIndex: 390
      },
      {
        id: "bamf",
        name: "Bundesamt für Migration und Flüchtlinge",
        abbreviation: "BAMF",
        budget: 1.9,
        employees: 8500,
        description: "Zuständig für die Durchführung von Asylverfahren und die Integration von Zuwanderern.",
        quirk: "Betreibt einen Warteraum mit beruhigenden Alphorn-Klängen, um den Formulardruck abzubauen.",
        faxRatio: 7.9,
        coffeeIndex: 270
      },
      {
        id: "bsi",
        name: "Bundesamt für Sicherheit in der Informationstechnik",
        abbreviation: "BSI",
        budget: 0.22,
        employees: 1600,
        description: "Das nationale Cyber-Sicherheitsamt, schützt Regierungsnetze vor Hackerangriffen.",
        quirk: "Verwendet Passwörter, die so extrem sicher und lang sind, dass Mitarbeiter sie auf Post-its unter der Tastatur notieren.",
        faxRatio: 1.1,
        coffeeIndex: 380
      },
      {
        id: "bfv",
        name: "Bundesamt für Verfassungsschutz",
        abbreviation: "BfV",
        budget: 0.45,
        employees: 4100,
        description: "Der Inlandsgeheimdienst zur Überwachung verfassungsfeindlicher Bestrebungen.",
        quirk: "Infiltrierte erfolgreich die lokale Kleingartenkolonie 'Sonnenschein', um verbotenen Zucchini-Überanbau zu melden.",
        faxRatio: 3.2,
        coffeeIndex: 410
      }
    ]
  },
  {
    id: "aa",
    name: "Auswärtiges Amt",
    abbreviation: "AA",
    budget: 6.7,
    employees: 3000,
    foundingYear: 1870,
    color: "#8B5CF6", // Violet
    gradient: "from-violet-500 to-purple-600",
    description: "Vertritt die deutschen Interessen im Ausland und koordiniert die europäische und weltweite Diplomatie.",
    politicalWeight: 8,
    ministerName: "Jens Spahn",
    quirk: "Hat ein strenges diplomatisches Protokoll eingeführt, bei dem bilaterale Verstimmungen per verschlüsseltem Emoji-Code übermittelt werden.",
    agencies: [
      {
        id: "botschaften",
        name: "Auslandsvertretungen (Botschaften)",
        abbreviation: "AV",
        budget: 2.1,
        employees: 9200,
        description: "Deutsche Botschaften und Konsulate weltweit zur Unterstützung von Bürgern und zur Diplomatie.",
        quirk: "Verbraucht ca. 90% des diplomatischen Budgets für den Import von bayerischem Senf für Botschaftsempfänge.",
        faxRatio: 5.8,
        coffeeIndex: 305
      },
      {
        id: "bfaa",
        name: "Bundesamt für Auswärtige Angelegenheiten",
        abbreviation: "BfAA",
        budget: 0.15,
        employees: 800,
        description: "Unterstützt den Auswärtigen Dienst bei Visaerteilung, Personal und Fördermittelverwaltung.",
        quirk: "Verfasst interne Arbeitsanweisungen vorsorglich in Latein, um das klassische Bildungsniveau zu wahren.",
        faxRatio: 7.0,
        coffeeIndex: 290
      }
    ]
  },
  {
    id: "bmg",
    name: "Bundesministerium für Gesundheit",
    abbreviation: "BMG",
    budget: 14.8,
    employees: 900,
    foundingYear: 1961,
    color: "#EF4444", // Red
    gradient: "from-red-500 to-orange-500",
    description: "Verantwortlich für die Regulierung des Gesundheitssystems, der Pflegekassen und Arzneimittelsicherheit.",
    politicalWeight: 7,
    ministerName: "Tino Sorge",
    quirk: "Hat die ministeriale Teeküche mit zertifiziertem, entkoffeiniertem Kamillentee zwangsausgestattet, um das Stressniveau zu drosseln.",
    agencies: [
      {
        id: "rki",
        name: "Robert Koch-Institut",
        abbreviation: "RKI",
        budget: 0.38,
        employees: 1350,
        description: "Die zentrale staatliche Einrichtung zur Überwachung und Erforschung von Infektionskrankheiten.",
        quirk: "Programmiert einen KI-Algorithmus, der kommende Grippewellen am durchschnittlichen Hustengeräusch im Bundestagsplenum berechnet.",
        faxRatio: 4.8,
        coffeeIndex: 290
      },
      {
        id: "pei",
        name: "Paul-Ehrlich-Institut",
        abbreviation: "PEI",
        budget: 0.11,
        employees: 850,
        description: "Bundesinstitut für Impfstoffe und biomedizinische Arzneimittel.",
        quirk: "Lagert Prototypen eines 'Anti-Bürokratie-Impfstoffs' in flüssigem Stickstoff bei exakt minus 196 Grad Celsius.",
        faxRatio: 6.9,
        coffeeIndex: 255
      },
      {
        id: "bfarm",
        name: "Bundesinstitut für Arzneimittel und Medizinprodukte",
        abbreviation: "BfArM",
        budget: 0.19,
        employees: 1100,
        description: "Zuständig für die Zulassung und Sicherheitsüberwachung von Arzneimitteln.",
        quirk: "Beschriftet jede einzelne Pillenpackung im Archiv manuell mit hochpräzisen, neongrünen Leuchtstickern.",
        faxRatio: 6.2,
        coffeeIndex: 280
      }
    ]
  },
  {
    id: "bmdv",
    name: "Bundesministerium für Digitales und Verkehr",
    abbreviation: "BMDV",
    budget: 38.2,
    employees: 1600,
    foundingYear: 1949,
    color: "#3B82F6", // Blue
    gradient: "from-blue-500 to-indigo-600",
    description: "Verantwortlich für Schienen-, Straßen- und Breitbandinfrastruktur in ganz Deutschland.",
    politicalWeight: 8,
    ministerName: "Ulrich Lange",
    quirk: "Hat einen Simulator im Büro, bei dem er die täglichen Verspätungsminuten der Deutschen Bahn wie einen Arcade-Highscore sammelt.",
    agencies: [
      {
        id: "kba",
        name: "Kraftfahrt-Bundesamt",
        abbreviation: "KBA",
        budget: 0.15,
        employees: 1100,
        description: "Zuständig für Zulassungen von Kraftfahrzeugen, Führerscheine und das Punkteregister in Flensburg.",
        quirk: "Verleiht heimlich eine goldene Plakette für die kreativste Ausrede bei Geschwindigkeitsüberschreitungen.",
        faxRatio: 8.8,
        coffeeIndex: 270
      },
      {
        id: "eba",
        name: "Eisenbahn-Bundesamt",
        abbreviation: "EBA",
        budget: 0.09,
        employees: 1300,
        description: "Aufsichts- und Genehmigungsbehörde für Eisenbahnen und Eisenbahninfrastruktur.",
        quirk: "Arbeitet an einem Handbuch, das Zugverspätungen durch unvorhersehbare quantenmechanische Verschränkungen rechtfertigt.",
        faxRatio: 9.3,
        coffeeIndex: 295
      },
      {
        id: "dwd",
        name: "Deutscher Wetterdienst",
        abbreviation: "DWD",
        budget: 0.08,
        employees: 950,
        description: "Erstellt meteorologische Dienstleistungen und erfasst Klimadaten.",
        quirk: "Zeichnet Regenwolken auf der Tageskarte vorsichtshalber mit Buntstiften ein, um Serverschäden durch Grafikkartenhitze zu vermeiden.",
        faxRatio: 5.1,
        coffeeIndex: 310
      }
    ]
  },
  {
    id: "bmas",
    name: "Bundesministerium für Arbeit und Soziales",
    abbreviation: "BMAS",
    budget: 172.5, // The heavy giant
    employees: 1200,
    foundingYear: 1949,
    color: "#4F46E5", // Indigo
    gradient: "from-indigo-500 to-indigo-700",
    description: "Zuständig für Arbeitsmarktpolitik, Arbeitsrecht und Sozialversicherung unter dem CDU-Sozialexperten Laumann.",
    politicalWeight: 9,
    ministerName: "Karl-Josef Laumann",
    quirk: "Verteilt anstelle von Info-Flyern kleine Packungen 'Mittelstands-Hustenbonbons' mit scharfem Salbei- und Entlassungs-Aroma.",
    agencies: [
      {
        id: "ba",
        name: "Bundesagentur für Arbeit",
        abbreviation: "BA",
        budget: 38.5,
        employees: 95000,
        description: "Fördert Beschäftigung, vermittelt Arbeitskräfte und zahlt Lohnersatzleistungen.",
        quirk: "Nutzt einen hochentwickelten Algorithmus, der bei Umschulungsvorschlägen eine 90-prozentige Trefferquote für 'Kaffeebohnensortierer' erzielt.",
        faxRatio: 9.1,
        coffeeIndex: 320
      },
      {
        id: "baua",
        name: "Bundesanstalt für Arbeitsschutz und Arbeitsmedizin",
        abbreviation: "BAuA",
        budget: 0.08,
        employees: 650,
        description: "Forscht zu Sicherheit und Gesundheit bei der Arbeit und entwickelt ergonomische Standards.",
        quirk: "Misst den Neigungswinkel aller Bürostühle im Amt mittels eines hochempfindlichen Laser-Militär-Entfernungsmessers.",
        faxRatio: 6.5,
        coffeeIndex: 260
      }
    ]
  },
  {
    id: "bmj",
    name: "Bundesministerium der Justiz",
    abbreviation: "BMJ",
    budget: 2.4,
    employees: 850,
    foundingYear: 1949,
    color: "#6366F1", // Indigo Blue
    gradient: "from-indigo-400 to-blue-500",
    description: "Zuständig für Gesetzgebung im Zivil-, Straf- und Handelsrecht sowie verfassungsrechtliche Prüfungen.",
    politicalWeight: 7,
    ministerName: "Elisabeth Winkelmeier-Becker",
    quirk: "Liest Gesetzestexte nachts mit einer Lupe, um versteckte Kommata zu finden, die die Staatskasse gefährden könnten.",
    agencies: [
      {
        id: "bfj",
        name: "Bundesamt für Justiz",
        abbreviation: "BfJ",
        budget: 0.12,
        employees: 1400,
        description: "Zentrales Registeramt, führt das Bundeszentralregister und treibt Bußgelder ein.",
        quirk: "Archiviert besonders schwere Ordnungswidrigkeiten in einem stillgelegten Salzstollen bei Kassel zum Schutz vor Hackerangriffen.",
        faxRatio: 8.9,
        coffeeIndex: 280
      },
      {
        id: "dpma",
        name: "Deutsches Patent- und Markenamt",
        abbreviation: "DPMA",
        budget: 0.08,
        employees: 2600,
        description: "Das nationale Patentamt, prüft und verwaltet gewerbliche Schutzrechte.",
        quirk: "Hat ein Patent auf einen selbsttätigen Tintennachfüller für Stempel im gehobenen Dienst angemeldet, um Arbeitszeit einzusparen.",
        faxRatio: 7.4,
        coffeeIndex: 340
      }
    ]
  },
  {
    id: "bmel",
    name: "Bundesministerium für Ernährung und Landwirtschaft",
    abbreviation: "BMEL",
    budget: 7.2,
    employees: 1050,
    foundingYear: 1949,
    color: "#84CC16", // Lime Green
    gradient: "from-lime-500 to-lime-700",
    description: "Verantwortlich für die nachhaltige, zukunftssichere Landwirtschaft und Ernährungssicherheit.",
    politicalWeight: 6,
    ministerName: "Gitta Connemann",
    quirk: "Lässt im Ministerium ausschließlich frische Äpfel verteilen, die alle exakt der EU-Krümmungsnorm für Kernobst entsprechen.",
    agencies: [
      {
        id: "ble",
        name: "Bundesanstalt für Landwirtschaft und Ernährung",
        abbreviation: "BLE",
        budget: 0.42,
        employees: 1500,
        description: "Zentrale Behörde für Agrarmärkte, Fischereikontrolle und ländliche Räume.",
        quirk: "Auditiert die Krossheit deutscher Weizenbrötchen nach physikalischen Vibrationsmessungen im Speziallabor.",
        faxRatio: 8.0,
        coffeeIndex: 270
      },
      {
        id: "bfr",
        name: "Bundesinstitut für Risikobewertung",
        abbreviation: "BfR",
        budget: 0.12,
        employees: 900,
        description: "Bewertet gesundheitliche Risiken von Lebensmitteln, Futtermitteln und Chemikalien.",
        quirk: "Untersucht wissenschaftlich, ob staubtrockener Beamtenhumor bei Neuzugängen zu spontanem Niesen führt.",
        faxRatio: 5.9,
        coffeeIndex: 295
      }
    ]
  },
  {
    id: "bmuv",
    name: "Bundesministerium für Umwelt, Naturschutz, nukleare Sicherheit und Verbraucherschutz",
    abbreviation: "BMUV",
    budget: 2.8,
    employees: 1100,
    foundingYear: 1986,
    color: "#059669", // Emerald Green
    gradient: "from-emerald-600 to-green-700",
    description: "Schützt Umwelt und Verbraucher, mit marktkonformen Impulsen zur Kreislaufwirtschaft im Jahr 2026.",
    politicalWeight: 6,
    ministerName: "Andreas Jung",
    quirk: "Hat alle ministeriellen Dienstfahrzeuge auf schwere Elektro-Lastenräder umgestellt, sehr zum Bedauern der Referenten bei Hagelstürmen.",
    agencies: [
      {
        id: "uba",
        name: "Umweltbundesamt",
        abbreviation: "UBA",
        budget: 0.17,
        employees: 1600,
        description: "Zuständig für Gewässer-, Luft- und Bodenschutz sowie die Erfassung von Emissionsdaten.",
        quirk: "Misst die Feinstaubbelastung in den Fluren, indem Mitarbeiter die Staubmäuse unter den Archivschränken wiegen.",
        faxRatio: 5.2,
        coffeeIndex: 285
      },
      {
        id: "bfn",
        name: "Bundesamt für Naturschutz",
        abbreviation: "BfN",
        budget: 0.06,
        employees: 450,
        description: "Berät die Bundesregierung in Fragen des Naturschutzes und der Landschaftspflege.",
        quirk: "Führt eine offizielle rote Liste gefährdeter Büroklammer-Arten und schützt das 'Silberfischchen im Aktenlager' als bedrohte Spezies.",
        faxRatio: 7.0,
        coffeeIndex: 240
      }
    ]
  },
  {
    id: "bmbf",
    name: "Bundesministerium für Bildung und Forschung",
    abbreviation: "BMBF",
    budget: 21.4,
    employees: 1300,
    foundingYear: 1955,
    color: "#D946EF", // Fuchsia
    gradient: "from-fuchsia-500 to-pink-600",
    description: "Gestaltet die Bildungspolitik und fördert die wissenschaftliche Spitzenforschung sowie KI-Innovationen.",
    politicalWeight: 8,
    ministerName: "Karin Prien",
    quirk: "Finanziert eine millionenschwere Langzeitstudie zur Frage, ob Kaffeekonsum die Entdeckungsgeschwindigkeit verlorener Handakten beschleunigt.",
    agencies: [
      {
        id: "bibb",
        name: "Bundesinstitut für Berufsbildung",
        abbreviation: "BiBB",
        budget: 0.08,
        employees: 680,
        description: "Erforscht und entwickelt die berufliche Aus- und Weiterbildung in Deutschland.",
        quirk: "Standardisierte den neuen staatlichen Lehrberuf 'Zertifizierter digitaler Stempel-Operator im gehobenen Dienst'.",
        faxRatio: 8.5,
        coffeeIndex: 265
      }
    ]
  },
  {
    id: "bmfsfj",
    name: "Bundesministerium für Familie, Senioren, Frauen und Jugend",
    abbreviation: "BMFSFJ",
    budget: 13.2,
    employees: 780,
    foundingYear: 1953,
    color: "#F43F5E", // Rose
    gradient: "from-rose-400 to-pink-500",
    description: "Verantwortlich für familienunterstützende Leistungen, Gleichstellung, Senioren und Jugendpolitik.",
    politicalWeight: 5,
    ministerName: "Silvia Breher",
    quirk: "Veranstaltet im Ministerium wöchentlich Turniere im analogen Halma-Spielen, um das generationenübergreifende Verständnis zu erproben.",
    agencies: [
      {
        id: "bafza",
        name: "Bundesamt für Familie und zivilgesellschaftliche Aufgaben",
        abbreviation: "BAFzA",
        budget: 0.25,
        employees: 1200,
        description: "Verwaltet den Bundesfreiwilligendienst und betreut verschiedene Bundesförderprogramme.",
        quirk: "Erstellt die Zertifizierungskriterien für 'Mehrgenerationen-Sandkästen' nach strengsten baurechtlichen Kriterien.",
        faxRatio: 8.2,
        coffeeIndex: 290
      }
    ]
  },
  {
    id: "bmz",
    name: "Bundesministerium für wirtschaftliche Zusammenarbeit und Entwicklung",
    abbreviation: "BMZ",
    budget: 12.1,
    employees: 920,
    foundingYear: 1961,
    color: "#14B8A6", // Teal
    gradient: "from-teal-400 to-cyan-500",
    description: "Plant und koordiniert die bilaterale und multilaterale Entwicklungszusammenarbeit der Bundesrepublik.",
    politicalWeight: 6,
    ministerName: "Thomas Silberhorn",
    quirk: "Misst den Erfolg von Entwicklungsprojekten in fernen Ländern in 'Lächeln pro Quadratkilometer' geförderter Schulen.",
    agencies: [
      {
        id: "deval",
        name: "Deutsches Evaluierungsinstitut der Entwicklungszusammenarbeit",
        abbreviation: "DEval",
        budget: 0.03,
        employees: 120,
        description: "Führt unabhängige Analysen und Bewertungen von Entwicklungsmaßnahmen durch.",
        quirk: "Nutzt ein 400-seitiges Formular, um den ökologischen Fußabdruck von Dienstreisen mit dem Linienbus zu bewerten.",
        faxRatio: 6.4,
        coffeeIndex: 310
      }
    ]
  },
  {
    id: "bmwsb",
    name: "Bundesministerium für Wohnen, Stadtentwicklung und Bauwesen",
    abbreviation: "BMWSB",
    budget: 5.6,
    employees: 620,
    foundingYear: 2021,
    color: "#F97316", // Orange
    gradient: "from-orange-400 to-amber-500",
    description: "Verantwortlich für Bauwesen, Stadtentwicklung, Raumordnung und sozialen Wohnungsbau.",
    politicalWeight: 6,
    ministerName: "Jan-Marco Luczak",
    quirk: "Hat an der Tür seines Büros eine kleine Wasserwaage montiert und richtet schiefe Aktenberge im Zimmer stündlich penibel aus.",
    agencies: [
      {
        id: "bbsr",
        name: "Bundesinstitut für Bau-, Stadt- und Raumforschung",
        abbreviation: "BBSR",
        budget: 0.04,
        employees: 310,
        description: "Berät die Bundesregierung wissenschaftlich bei Stadt- und Raumplanung sowie Bauwesen.",
        quirk: "Erforscht die Trocknungsgeschwindigkeit von Standard-Betonwänden in Hochsicherheitslabors durch stundenlanges Anstarren.",
        faxRatio: 7.9,
        coffeeIndex: 275
      }
    ]
  }
];

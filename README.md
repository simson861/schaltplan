# IHC McCormick 323 – Betriebsanleitung und Schaltplan

Digitalisierte Betriebsanleitung (Stand 12.66) mit Volltextsuche, Wartungsplan und einer farbigen, klickbaren Nachzeichnung des Schaltplans:
Plan **G168** (Schlepper bis 20 km/h, `*`) und **G167** (über 20 km/h, `**`), Bauteil- und Kabelliste S. 49–51 (Kabel 1–94).

- Anleitung: alle 59 Seiten als durchsuchbarer Text, Inhaltsverzeichnis, verlinkte Seiten- und Bildverweise, aufbereitete Abbildungen, Originalseite daneben
- Wartung: Intervalle als Checkliste mit Betriebsstunden-Rechner, Schmiermittel, Schmierplan
- Kabel in echter Aderfarbe, Strichstärke nach Querschnitt
- Zwei Anordnungen: „Übersichtlich“ (nach Funktionsgruppen) und „Wie Original“ (Lage der Bauteile wie in G168/G167)
- Klick auf Kabel oder Bauteil zeigt Farbe, mm², beide Enden und Quelle
- „Stromkreis verfolgen“ markiert alles, was elektrisch zusammenhängt
- Kabelliste, Bauteilliste, Sicherungsbelegung, Originalfotos

## Veröffentlichen mit GitHub Pages

Die App ist statisch: `index.html`, `manual-app.js`, die Daten in `ba/manual.js` und Bilder in `ba/` und `img/`.
Repository → *Settings* → *Pages* → *Deploy from a branch* → Branch wählen, Ordner `/ (root)` → *Save*.

## Datenlage

Alle Verbindungen stammen aus der Kabelliste (Kabel 1–94). Wo dort eine Angabe fehlt
(rechter Rand von S. 50 schon im Druck abgeschnitten), wurde sie im Plan abgelesen und
gekennzeichnet. Details im Reiter **Datenlage**. Die Daten stehen am Anfang des Skripts in `index.html`.

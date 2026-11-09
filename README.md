# IHC McCormick 323 – interaktiver Schaltplan

Farbige, klickbare Nachzeichnung des Schaltplans aus der Betriebsanleitung (Stand 12.66):
Plan **G168** (Schlepper bis 20 km/h, `*`) und **G167** (über 20 km/h, `**`), Kabelliste S. 49–50.

- Kabel in echter Aderfarbe, Strichstärke nach Querschnitt
- Klick auf Kabel oder Bauteil zeigt Farbe, mm², beide Enden und Quelle
- „Stromkreis verfolgen“ markiert alles, was elektrisch zusammenhängt
- Kabelliste, Bauteilliste, Sicherungsbelegung, Originalfotos

## Veröffentlichen mit GitHub Pages

Die App ist eine einzelne statische Datei (`index.html`) plus Fotos in `img/`.
Repository → *Settings* → *Pages* → *Deploy from a branch* → Branch wählen, Ordner `/ (root)` → *Save*.

## Datenlage

Alle Verbindungen stammen aus der Kabelliste. Wo dort ein Wort am Seitenrand abgeschnitten ist,
wurde die Klemme im Plan abgelesen und gekennzeichnet. Seite 51 (Kabel 65–94) lag nicht vor;
diese Kabel sind aufgelistet, aber nur eingezeichnet, wenn der Plan beide Enden eindeutig zeigt.
Details im Reiter **Datenlage**. Die Daten stehen am Anfang des Skripts in `index.html`.

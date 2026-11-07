# Home Assistant Dashboard

Dunkles, edles Dashboard für ein Wand-Tablet im Querformat. Läuft lokal per Docker,
die Verbindung zu Home Assistant baut der Browser direkt auf (URL + langlebiger
Zugangs-Token, beides bleibt nur im Browser des Tablets gespeichert).

## Voraussetzung

- Docker Desktop (https://www.docker.com/products/docker-desktop/) auf dem Mac, unter Windows oder Linux
- Home Assistant im selben Netzwerk

Die Anleitung nennt macOS-Befehle; die Abschnitte „IP herausfinden" unten zeigen die Entsprechungen für Windows und Linux.

## 1. Code aufs MacBook holen

**Mit GitHub (empfohlen):** Projekt in Lovable mit GitHub verbinden, dann auf dem MacBook:

```sh
git clone https://github.com/<dein-user>/<dein-repo>.git
cd <dein-repo>
```

**Ohne GitHub:** Im Lovable-Editor den Code als ZIP herunterladen, entpacken und in den
Ordner wechseln.

## 2. Bauen und starten

```sh
docker compose up -d --build
```

Das Dashboard läuft danach auf Port 3002 (im Container bleibt der interne Port 3000).

## 3. Auf dem Tablet öffnen

Mac-IP herausfinden:

```sh
ipconfig getifaddr en0
```

**Windows** (Eingabeaufforderung): `ipconfig` – die Adresse hinter „IPv4-Adresse" verwenden.

**Linux:** `hostname -I` – die erste Adresse verwenden.

Auf dem Tablet `http://<Mac-IP>:3002` öffnen – unbedingt mit `http://`, sonst kann der
Browser keine Verbindung zum lokalen Home Assistant herstellen.

**Wichtig in Docker Desktop:** Einstellungen → General → „Allow HTTPS-only connections“
ausschalten, sonst blockiert Docker das Laden über `http://` vom Tablet.

## 4. Mit Home Assistant verbinden

Oben rechts auf das Zahnrad klicken und eintragen:

- **URL:** `http://<HA-IP>:8123`
- **Token:** in Home Assistant unter Profil → Sicherheit → „Langlebige Zugangs-Token“ erstellen

Ohne gespeicherte Verbindung zeigt das Dashboard Demo-Daten, damit es nie leer aussieht.

### Energie-Sensoren (optional)

Im selben Fenster gibt es zwei weitere Felder:

- **PV-Sensor (Erzeugung):** Entitäts-ID der aktuellen PV-Leistung, z. B.
  `sensor.wechselrichter_wirkleistung`
- **Hausverbrauch-Sensor:** Entitäts-ID des aktuellen Hausverbrauchs, z. B. `sensor.hausverbrauch`
- **Hausverbrauch heute / Monat:** kWh-Zähler des Hausverbrauchs für die Stromkosten, z. B. `sensor.hausverbrauch_heute`. Leer lassen = automatische Erkennung (PV-Zähler werden ignoriert).

Die ID findest du in Home Assistant unter Einstellungen → Geräte & Dienste → Entitäten.
Bleiben die Felder leer, sucht das Dashboard selbst nach passenden Sensoren (Leistung in W/kW,
Namen wie „PV“, „Solar“, „Wechselrichter“ bzw. „Haus“, „Verbrauch“).

## Aufbau des Dashboards

- **Jetzt aktiv:** alles, was gerade eingeschaltet, offen, entriegelt, heizt oder Alarm meldet
- **Status unbekannt:** Geräte, die Home Assistant gerade nicht erreicht
- **Inaktiv & ausgeschaltet:** einklappbar, darunter alle ausgeschalteten Geräte
- **Immer sichtbar:** Temperatur & Luftfeuchte, Wetter, Energie
- **Kamerastatus oben:** zeigt „Bewegung“ oder „Keine Bewegung“. Unter „Kameras · Bewegungssensor“ den passenden `binary_sensor` aus Home Assistant eintragen und mit „Verbinden“ speichern: `on` = Bewegung, `off` = keine Bewegung. Leer wird nur ein eindeutig kamera-bezogener Bewegungssensor automatisch erkannt. Fehlende, mehrdeutige oder nicht erreichbare Daten erscheinen als „Status unbekannt“. Die bisherige Scharfschaltungsquelle wird nicht als Bewegungssensor übernommen. Im Demo-Modus ist der Status ein Beispiel.
- Rauchmelder erscheinen automatisch, wenn sie in Home Assistant als „Rauch“ eingestuft sind.
- **Anwesenheit:** zeigt pro Person in Home Assistant, ob sie zu Hause oder unterwegs ist (bzw. in welcher Zone).
- **Stromkosten:** unter „Energie“ die Kosten für heute und den Monat. Grundlage sind die Verbrauchs-Sensoren (kWh) und der Strompreis, den du in den Dashboard-Einstellungen in €/kWh einträgst. Der Preis bleibt auf diesem Gerät gespeichert – unabhängig von der Verbindung. Für den Monat braucht es einen Sensor mit „Monat“ im Namen (z. B. `sensor.energie_monat`).
- **Räume:** eine kompakte Auswahlliste statt einzelner Knöpfe, auch bei vielen Räumen nur eine Zeile. Die Räume kommen aus den Bereichen in Home Assistant. „Alle Räume“ bzw. das × setzt den Filter zurück. Der Filter betrifft Geräte und Melder; Temperatur, Wetter und Energie bleiben sichtbar.
- **Stil:** in den Dashboard-Einstellungen zwischen „Dunkel & Gold“, „Graphit & Eis“ und „Dunkel & Salbei“ wechseln. Die Auswahl gilt sofort und bleibt auf diesem Gerät gespeichert – unabhängig von der Verbindung und auch im Demo-Modus.
- **PV-Verlauf:** Kurve der PV-Leistung der letzten 12 Stunden unter „Energie“
- **Wettervorhersage:** kleine Kacheln mit Umschaltung zwischen den nächsten Stunden und Tagen. Die Werte stammen vom Wetteranbieter in Home Assistant (`weather.get_forecasts`); nicht jeder Anbieter unterstützt beide Zeiträume. Ohne verfügbare Vorhersage erscheint ein Hinweis.
- **Hausverbrauch · 7 Tage:** Balken für die letzten sieben abgeschlossenen Kalendertage in kWh, mit Durchschnittslinie und hervorgehobenem Höchstwert. Verwendet denselben Zähler wie „Hausverbrauch heute“. Grundlage sind tägliche Verbrauchsänderungen aus Home Assistants Recorder-Statistiken, keine Schätzung aus der aktuellen Leistung. Der Zähler muss Energie-Statistiken liefern (`state_class: total` oder `total_increasing`); fehlende Tage erscheinen als „–“, nicht als Nullverbrauch. Die Werte werden in kWh angefordert. Wenn keine Statistik vorhanden ist, prüfe den ausgewählten Zähler in Home Assistant.
- **Größte Verbraucher:** Rangliste einzelner Geräte für dieselben sieben abgeschlossenen Kalendertage, mit kWh, Vergleichsbalken und Kosten zum eingestellten Strompreis. In den Einstellungen unter „Größte Verbraucher · Zählerauswahl“ je Gerät genau einen Energiezähler auswählen und mit „Verbinden“ speichern. Zur Auswahl stehen Sensoren in Wh/kWh/MWh mit `state_class: total` oder `total_increasing`; Home Assistant rechnet die Statistik in kWh um. Keine Haus-, PV- oder überlappenden Summenzähler auswählen. Nur vollständig verfügbare sieben Tage werden gereiht; unvollständige Zähler erscheinen mit „–“ und Tagesanzahl, nicht mit einer geschätzten Summe. Aktuelle Wattwerte allein reichen nicht. Es wird kein Anteil am gesamten Hausverbrauch behauptet; die Kosten sind Verbrauch × Tarif, keine Stromrechnung unter Berücksichtigung von PV-Eigenverbrauch oder Grundgebühren. Aktualisierung alle 15 Minuten in einer gemeinsamen Statistikabfrage. Im Demo-Modus sind die drei Geräte Beispielwerte.
- **Rauchalarm:** löst ein Melder aus, wird der ganze Bildschirm rot mit dem Namen des Melders („Gesehen“ blendet aus)
- **Verbraucher-Vorwochenvergleich:** je Gerät erscheint der Verbrauch der vorherigen sieben abgeschlossenen Tage sowie die Änderung in kWh und Prozent: rot mit Aufwärtspfeil bei Anstieg, grün mit Abwärtspfeil bei Rückgang. Die Rangfolge bleibt nach dem Verbrauch der jüngsten sieben Tage sortiert. Alle 14 Tage werden gemeinsam abgefragt; fehlen Werte in einer Woche, erscheint „Vergleich nicht verfügbar“. Bei 0 kWh in der Vorwoche wird keine Prozentzahl berechnet.
- **Nachtuhr:** zwischen 22 und 6 Uhr erscheint nach einer Minute ohne Berührung eine gedimmte Uhr; antippen zeigt wieder das Dashboard
- Der Bildschirm des Tablets bleibt an, solange das Dashboard geöffnet ist (sofern der Browser das unterstützt).

### Shelly und Garagentore

Shelly-Verwaltungsschalter wie `aioshelly_ble_integration` sowie von Home Assistant als
Konfiguration/Diagnose markierte Schalter werden nicht unter Licht angezeigt.
`cover.*`-Entitäten erscheinen unter **Tore & Rollläden**, mit Öffnen/Stoppen/Schließen
entsprechend den in Home Assistant unterstützten Funktionen. Offene oder fahrende Tore
stehen unter „Jetzt aktiv“, geschlossene im einklappbaren Bereich. Relais-Schalter am
selben Home-Assistant-Gerät werden zugunsten des Covers ausgeblendet; ohne Gerätezuordnung
gilt das nur bei identischen IDs hinter dem Punkt (Groß-/Kleinschreibung wird ignoriert).

### Kameras

Kamerabilder bleiben ausgeblendet. Oben erscheint ausschließlich der Bewegungsstatus
aus Home Assistant; es werden keine Bilder oder RTSP-Streams abgerufen.

### „Was war los?“ · KI-Zusammenfassung

1. In der Kachel über das Zahnrad Sensoren auswählen. Die Suche findet sowohl Namen
   (z. B. „Küchenfenster“) als auch Entitäts-IDs. Die Auswahl wird sofort auf diesem
   Gerät gespeichert; nicht mehr verfügbare Sensoren lassen sich dort abwählen.
2. Zeitraum wählen: letzte 1, 3, 6, 12 oder 24 Stunden.
3. **Zusammenfassen** liest den Verlauf dieser Sensoren aus Home Assistants Recorder
   und lässt Lovable AI eine kurze deutsche Zusammenfassung erstellen.

An AI Gateway gehen nur Sensorname, Zustand/Messwert und Uhrzeit, keine HA-Adresse
oder Zugangs-Token. Gleiche aufeinanderfolgende Zustände werden entfernt; höchstens
300 der jüngsten Einträge mit je maximal 200 Zeichen werden übertragen. Der erste
Eintrag kann ein Ausgangszustand sein. Die Ausgabe ist keine verlässliche Alarmierung
und ersetzt keine Rauchmelder oder Sicherheitsmeldungen. Ohne Recorder-Verlauf wird
„keine Verlaufsdaten“ angezeigt, nicht behauptet, dass im Haus nichts passiert sei.
Bei Verbindungsfehlern werden keine erfundenen Aktivitäten zusammengefasst.

Im Demo-Modus stammen die Aktivitäten aus Beispieldaten und sind ausdrücklich als
Demo gekennzeichnet; ein Klick auf Zusammenfassen nutzt trotzdem den echten AI Gateway
und kann KI-Guthaben verbrauchen. Das Dashboard braucht für KI einen Internetzugang.

#### KI im lokalen Docker-Betrieb

`docker-compose.yml` reicht `LOVABLE_API_KEY` ausschließlich beim Start aus der
Deployment-Umgebung in den Container durch. Ohne vorhandenen Schlüssel läuft das
übrige Dashboard unverändert; nur die KI-Zusammenfassung meldet die fehlende Einrichtung.
Der Schlüssel gehört niemals in Quellcode, Dockerfile, Browser, GitHub-Repository
oder Protokolle. Lovable verwaltet ihn in der Vorschau automatisch.

**Noch erforderliche lokale Freigabe:** Lovables verwalteter Schlüssel wird nicht
automatisch auf den Mac oder den selbst gehosteten GitHub-Runner übertragen. Die
Weitergabe im Compose ist vorbereitet, aber dieses Projekt hat keine sichere
automatische Schlüsselübertragung zum lokalen Rechner. Daher ist die KI dort erst
einsatzbereit, wenn eine autorisierte Deployment-Umgebung den Schlüssel bereitstellt.
Ein `sh update.sh` allein richtet diese Freigabe nicht ein. Keine geheimen Werte in
Chat oder Repository kopieren. Die lokale KI-Freigabe ist hier nicht verifiziert.

Bei fehlendem KI-Guthaben oder verweigertem Zugriff erscheint eine Fehlermeldung;
es erfolgen keine automatischen Wiederholungen. Ein erneuter Klick startet eine neue
Anfrage. Tests ausführen: `bun run test`; echte lokale HA-Daten sind aus der
Lovable-Vorschau nicht erreichbar.

## Änderungen übernehmen

Nach jeder Änderung in Lovable auf dem MacBook im Projektordner:

```sh
sh update.sh
```

(entspricht `git pull` und `docker compose up -d --build`), danach die Seite auf dem Tablet neu laden.

Oben rechts steht eine Versionsnummer (z. B. `v1.1`). Sie ist der Deploy-Marker:
nach jedem Update wird sie in `src/lib/version.ts` erhöht. Erscheint die neue Nummer
auf dem Tablet, war der Deploy über GitHub erfolgreich.

## Nützlich

```sh
docker compose logs -f        # Protokoll ansehen
docker compose restart        # neu starten
docker compose down           # stoppen
```

Damit das Dashboard nach einem Neustart des Rechners automatisch wieder läuft, in
Docker Desktop „Start Docker Desktop when you sign in to your computer“ aktivieren
und den Rechner nicht in den Ruhezustand versetzen (oder die IP im Router fest
vergeben, damit sich die Adresse des Tablets nicht ändert).

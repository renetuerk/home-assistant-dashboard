# Home Assistant Dashboard

Dunkles, edles Dashboard für ein Wand-Tablet im Querformat. Läuft lokal per Docker,
die Verbindung zu Home Assistant baut der Browser direkt auf (URL + langlebiger
Zugangs-Token, beides bleibt nur im Browser des Tablets gespeichert).

## Voraussetzung

- Docker Desktop auf dem MacBook (https://www.docker.com/products/docker-desktop/)
- Home Assistant im selben Netzwerk

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

Das Dashboard läuft danach auf Port 3000.

## 3. Auf dem Tablet öffnen

Mac-IP herausfinden:

```sh
ipconfig getifaddr en0
```

Auf dem Tablet `http://<Mac-IP>:3000` öffnen – unbedingt mit `http://`, sonst kann der
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

Die ID findest du in Home Assistant unter Einstellungen → Geräte & Dienste → Entitäten.
Bleiben die Felder leer, sucht das Dashboard selbst nach passenden Sensoren (Leistung in W/kW,
Namen wie „PV“, „Solar“, „Wechselrichter“ bzw. „Haus“, „Verbrauch“).

## Aufbau des Dashboards

- **Jetzt aktiv:** alles, was gerade eingeschaltet, offen, entriegelt, heizt oder Alarm meldet
- **Status unbekannt:** Geräte, die Home Assistant gerade nicht erreicht
- **Inaktiv & ausgeschaltet:** einklappbar, darunter alle ausgeschalteten Geräte
- **Immer sichtbar:** Temperatur & Luftfeuchte, Kameras, Wetter, Energie
- Rauchmelder erscheinen automatisch, wenn sie in Home Assistant als „Rauch“ eingestuft sind.
- **Anwesenheit:** zeigt pro Person in Home Assistant, ob sie zu Hause oder unterwegs ist (bzw. in welcher Zone).
- **Stromkosten:** unter „Energie“ die Kosten für heute und den Monat. Grundlage sind die Verbrauchs-Sensoren (kWh) und der Strompreis, den du in den Dashboard-Einstellungen in €/kWh einträgst. Der Preis bleibt auf diesem Gerät gespeichert – unabhängig von der Verbindung. Für den Monat braucht es einen Sensor mit „Monat“ im Namen (z. B. `sensor.energie_monat`).
- **Räume:** eine kompakte Auswahlliste statt einzelner Knöpfe, auch bei vielen Räumen nur eine Zeile. Die Räume kommen aus den Bereichen in Home Assistant. „Alle Räume“ bzw. das × setzt den Filter zurück. Der Filter betrifft Geräte und Melder; Temperatur, Wetter und Energie bleiben sichtbar.
- **Stil:** in den Dashboard-Einstellungen zwischen „Dunkel & Gold“, „Graphit & Eis“ und „Dunkel & Salbei“ wechseln. Die Auswahl gilt sofort und bleibt auf diesem Gerät gespeichert – unabhängig von der Verbindung und auch im Demo-Modus.
- **PV-Verlauf:** Kurve der PV-Leistung der letzten 12 Stunden unter „Energie“
- **Rauchalarm:** löst ein Melder aus, wird der ganze Bildschirm rot mit dem Namen des Melders („Gesehen“ blendet aus)
- **Nachtuhr:** zwischen 22 und 6 Uhr erscheint nach einer Minute ohne Berührung eine gedimmte Uhr; antippen zeigt wieder das Dashboard
- Der Bildschirm des Tablets bleibt an, solange das Dashboard geöffnet ist (sofern der Browser das unterstützt).

## Änderungen übernehmen

Nach jeder Änderung in Lovable auf dem MacBook im Projektordner:

```sh
sh update.sh
```

(entspricht `git pull` und `docker compose up -d --build`), danach die Seite auf dem Tablet neu laden.

## Nützlich

```sh
docker compose logs -f        # Protokoll ansehen
docker compose restart        # neu starten
docker compose down           # stoppen
```

Damit das Dashboard nach einem Neustart des MacBooks automatisch wieder läuft, in
Docker Desktop „Start Docker Desktop when you sign in to your computer“ aktivieren
und den Rechner nicht in den Ruhezustand versetzen (oder die IP im Router fest
vergeben, damit sich die Adresse des Tablets nicht ändert).

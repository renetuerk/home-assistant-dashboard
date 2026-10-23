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

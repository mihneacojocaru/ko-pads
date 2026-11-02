# KO Pads

Mini-Sampler als 3D-Hardware-Look, inspiriert vom Teenage Engineering EP-133 K.O. II. Reines HTML, CSS und Web Audio, kein Build, keine Abhängigkeiten.

- 12 Pads mit synthetisierten Sounds (Web Audio API), 4 Groups: Drums, Perc, Lo-Fi, Synth
- PLAY spielt einen Demo-Loop (`demo-loop.wav`) in Schleife
- RECORD nimmt Pad-Schläge über dem Loop auf und spielt sie bei jedem Durchlauf mit, ERASE löscht sie
- Regler X (Filter) und Y (Pitch), −/+ für die Lautstärke
- Tastatur: `0`–`9`, `.`, `Enter` für Pads, `A`–`D` Group, Leertaste Play, `R` Record, `E` Erase

## Aufbau

Vanilla JavaScript als ES-Module, je eine Klasse pro Verantwortung:

| Datei | Aufgabe |
| --- | --- |
| `src/AudioEngine.js` | AudioContext, Master-Gain, Filter, Pegel-Analyse, Audio-Bausteine |
| `src/Instrument.js` | Synthetisierte Klänge (Kick, Snare, Hats, Pluck …) |
| `src/SoundGroup.js` | Basisklasse `SoundGroup` mit `DrumGroup` und `NoteGroup` (Polymorphie) |
| `src/Looper.js` | Demo-Loop, Aufnahme und Lookahead-Scheduling, meldet `hit`/`step` als Events |
| `src/Display.js` | LCD, Step-Anzeige und Pegel-LEDs |
| `src/Knob.js` | Drehregler mit Maus, Touch, Mausrad und Tastatur, meldet `change` |
| `src/Sampler.js` | Controller: verbindet UI, Audio und Looper |
| `src/main.js` | Einstiegspunkt |

## Lokal starten

```sh
python3 -m http.server 8133
```

Den Demo-Loop neu erzeugen:

```sh
python3 tools/make-demo.py demo-loop.wav
```

## Credits

Inspiriert vom Teenage Engineering EP-133 K.O. II. Kein offizielles Produkt, keine Verbindung zu Teenage Engineering.

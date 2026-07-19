# Mannino Maker — sito statico senza pagina admin

Il sito non usa Jekyll, Liquid, Supabase, database, login o altri servizi esterni. Tutti i percorsi sono relativi, quindi funziona anche dentro una sottocartella come `http://localhost/miosito/` e in un repository GitHub Pages.

## Aggiungere un progetto

1. Copia `_modelli/TEMPLATE_PROGETTO_DA_COMPILARE.html` nella cartella `progetti`.
2. Rinomina il file, per esempio `wirelens-lite.html`.
3. Modifica il blocco JSON `mm-project-data` all'inizio della pagina.
4. Modifica il contenuto della pagina.
5. Carica il file su GitHub.

Il workflow incluso genera automaticamente `projects.json`: scheda, ricerca, categorie, filtri, contatori e sezione in evidenza si aggiornano senza modificare la home.


## Template e manuale

Nella cartella `_modelli` trovi:

- `TEMPLATE_PROGETTO_DA_COMPILARE.html`: il file da copiare per ogni nuovo progetto;
- `ESEMPIO_PROGETTO_COMPLETO.html`: un progetto dimostrativo già compilato.

Il file `MANUALE_INSERIMENTO_PROGETTI_MANNINO_MAKER.docx` spiega tutti i campi, la gestione di `featured`, `published`, ordine, categorie, immagini, galleria, download e collegamento GitHub.

## Modificare o eliminare

Per modificare un progetto apri soltanto la sua pagina in `progetti`. Per eliminarlo cancella il file. Per nasconderlo imposta `"published": false` nel JSON.

## Prova locale

Il pacchetto contiene già il catalogo generato. Avvia la cartella con XAMPP, Apache, Live Server o un altro server locale. Dopo aver aggiunto una nuova pagina sul PC, fai doppio clic su `AGGIORNA_CATALOGO.bat` per aggiornare anche l'anteprima locale. Su GitHub questo passaggio è automatico.

## Pubblicazione GitHub Pages

Carica tutto nella root del repository. In `Settings > Pages`, scegli `GitHub Actions` come origine. Il file `.github/workflows/deploy-pages.yml` pubblica il sito a ogni modifica del ramo `main`.

## Esempi inclusi

Sono presenti numerose schede dimostrative, tra cui MakerBox, WireLens Lite, Presenze Tecnici ESP8266, FlexMat, Mini Andon MQTT e Controller Marcatrice a Punzone. Possono essere modificate o eliminate liberamente.


## Link GitHub del progetto

Dentro il JSON di ogni pagina progetto trovi il campo:

```json
"project_url": "https://github.com/tuo-account/tuo-repository"
```

Quando il campo contiene un indirizzo, nella pagina dettagli compare il pulsante **PROGETTO** subito sotto **File e formati**. Lasciando il valore vuoto (`"project_url": ""`) il pulsante resta visibile ma disattivato, così è chiaro dove inserire il collegamento.

Le schede della home sono interamente cliccabili: non è più presente il pulsante “Vedi progetto”.

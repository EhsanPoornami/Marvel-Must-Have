# Marvel Must-Have – La mia collezione

App web personale per catalogare la collana **Marvel Must-Have** di Panini Comics Italia: vedi tutti i volumi,
segni quelli che possiedi e sai subito cosa ti manca e quanto costa completare la collana.

Gira in locale nel browser, senza server e senza account.

## Requisiti

- [Node.js](https://nodejs.org/) LTS (versione 20 o successiva).

## Avvio

Apri un terminale (PowerShell) nella cartella del progetto e lancia:

```powershell
npm install      # solo la prima volta (o dopo aver aggiornato il progetto)
npm run dev      # avvia l'app
```

Poi apri **http://localhost:5173** nel browser. Per fermarla premi `Ctrl+C` nel terminale.

### Dal telefono

`npm run dev` mostra anche un indirizzo **Network**, ad es. `http://192.168.1.20:5173`. Aprilo dal telefono
mentre sei sulla stessa rete Wi-Fi del PC. Se non si apre, consenti a Node.js l'accesso alle reti private
quando Windows Firewall lo chiede.

> **Attenzione:** ogni browser e ogni dispositivo ha i suoi dati, salvati separatamente. Per portare la
> collezione dal PC al telefono, o viceversa, usa **Backup → Esporta backup** su un dispositivo e
> **Importa backup** sull'altro. In fumetteria, se il PC non è raggiungibile, usa **Mi mancano → Copia lista**
> e incolla la lista in una nota o in un messaggio.

### Versione ottimizzata (opzionale)

```powershell
npm run build    # crea la cartella dist/
npm run preview  # serve dist/ su http://localhost:4173
```

## Come si usa

| Schermata | Cosa fa |
|---|---|
| **Dashboard** | Percentuale di completamento, volumi posseduti e mancanti, spesa totale, costo stimato per completare, wishlist e ultime uscite. |
| **Collezione** | Tutti i volumi, in griglia con copertine o in elenco. **Tocca un volume** per segnarlo come posseduto (tocca di nuovo per annullare, oppure usa "Annulla" nel messaggio in basso). La **matita** apre i dettagli: stato (Posseduto / Mancante / Ordinato / Wishlist), condizioni, prezzo pagato, data di acquisto, note e dati del volume. Ricerca per titolo, personaggio, autore o `#numero`, e filtri per stato. |
| **Mi mancano** | Solo i volumi che non hai, ordinabili per priorità (prima la wishlist), numero o prezzo. Con **Copia lista** e **Scarica .txt** ottieni un elenco da portare in fumetteria. |
| **Backup** | Esporta e importa tutti i tuoi dati in JSON, esporta in CSV per Excel, ripristina il catalogo originale o azzera tutto. |

## Dove sono i dati

- **Catalogo base:** `public/data/volumi.json`. È l'elenco dei volumi della collana.
- **I tuoi dati:** stati, acquisti, note e i volumi aggiunti o modificati dall'app. Sono salvati nel
  `localStorage` del browser, **separati** dal catalogo.

Il collegamento tra i due è il campo `id` di ogni volume (es. `mmh-042`). Quando aggiorni `volumi.json`, la
tua collezione resta intatta, a patto di **non cambiare gli `id` esistenti**.

**Fai un backup ogni tanto** (Backup → Esporta backup). Se cancelli i dati di navigazione del browser,
il `localStorage` viene svuotato.

## Account e sincronizzazione

Con l'accesso (Google o email e password) la collezione è salvata online in **Firebase** e resta aggiornata su
tutti i dispositivi in cui entri con lo stesso account. Ogni utente vede solo i propri dati.

- **Senza accesso** l'app funziona come prima: i dati restano solo nel browser di quel dispositivo.
- **Al primo accesso** da un dispositivo che ha già dati salvati, l'app chiede se caricarli nel tuo account.
- **Offline**, ad esempio in fumetteria senza segnale, puoi continuare a usarla: le modifiche partono appena
  torna la connessione. Il pallino sull'avatar diventa giallo quando ci sono modifiche in attesa.

### Configurazione di Firebase (una volta sola)

1. Su https://console.firebase.google.com crea un progetto e registra un'**app Web** (icona `</>`).
2. Copia `.env.example` in `.env` e inserisci i valori di `firebaseConfig`. Li trovi in Impostazioni
   progetto → Generali → Le tue app → Config. Non sono segreti.
3. In **Authentication → Sign-in method** attiva **Google** e **Email/Password**.
4. In **Authentication → Settings → Authorized domains** aggiungi il dominio del sito pubblicato, ad es.
   `zesty-biscochitos-a6d1f9.netlify.app`.
5. In **Firestore Database** crea il database in modalità produzione. Poi, nella scheda **Regole**, incolla il
   contenuto di `firestore.rules` e premi **Pubblica**.
6. Lancia `npm run build` e ricarica la cartella `dist` su Netlify.

Se `.env` è vuoto o manca, l'app funziona in modalità solo locale, senza la pagina di accesso.

## Aggiornare l'elenco dei volumi

La collana esce ogni mese. Hai due strade.

### 1. Dall'app (la più semplice)

In **Collezione** premi **+ Nuovo volume**, compila numero, titolo, prezzo e il resto, poi premi **Salva**.
Per correggere un volume esistente apri la matita, premi **Modifica dati** e salva.

Le aggiunte e le modifiche fatte dall'app sono salvate nel browser e finiscono nel backup JSON. Hanno la
precedenza su `volumi.json`: un volume che modifichi dall'app non viene più aggiornato dal file.
**Backup → Ripristina catalogo** annulla queste modifiche e torna al file.

### 2. Modificando `public/data/volumi.json`

Apri il file con un editor di testo (ad es. Blocco note o VS Code) e aggiungi un oggetto in fondo
all'array. Ricordati la virgola dopo il volume precedente:

```json
{
  "id": "mmh-157",
  "numero": 157,
  "titolo": "Titolo del volume",
  "trama": "Due o tre frasi che introducono la storia, senza spoiler.",
  "personaggi": ["Spider-Man"],
  "sceneggiatura": ["Nome Autore"],
  "disegni": ["Nome Disegnatore"],
  "dataUscita": "2026-11",
  "prezzo": 15,
  "isbn": "",
  "copertinaUrl": "",
  "note": "",
  "daVerificare": true
}
```

Regole:

- `id` deve essere **unico** e non va più cambiato. Per i numeri della collana usa `mmh-` seguito dal numero a
  tre cifre (`mmh-157`).
- `trama` è l'introduzione alla storia mostrata nella scheda del volume e passando col mouse sulla copertina.
  Se non la conosci lascia `""`.
- `dataUscita` ha il formato `AAAA-MM` oppure `AAAA-MM-GG`.
- `prezzo` è un numero con il punto come separatore decimale (`15.9`), oppure `null` se non lo conosci.
- I campi testuali che non conosci restano `""`. Aggiungi `"daVerificare": true` per ritrovarli col filtro
  **Da verificare**.

Salva e ricarica la pagina: non serve riavviare. Se il file contiene un errore di sintassi, l'app lo segnala.

## Fonti dei dati iniziali

`volumi.json` è stato compilato a ottobre 2026 da queste fonti:

- **Numeri, titoli, mesi di uscita, autori, personaggi e copertine:** schede di [ComicsBox](https://www.comicsbox.it/serie/MARVELMUST)
  (volumi 1–156). Le copertine sono caricate direttamente da ComicsBox: senza connessione vedrai un segnaposto
  con numero e titolo.
- **Prezzi di copertina:** listino del negozio [Funside](https://funside.it/collections/marvel-must-have).
  È il prezzo attuale, che per le ristampe può differire da quello della prima uscita.
- **ISBN:** solo quelli confermati dal sito Panini (n. 1 e n. 32). Gli altri sono vuoti.

I volumi con dati incerti hanno `"daVerificare": true`, e il campo `campiDaVerificare` dice cosa controllare.
Nell'app li trovi col filtro **Da verificare**.

## Struttura del progetto

```
public/data/volumi.json   catalogo base
src/types.ts              modello dati
src/lib/                  storage, unione catalogo, statistiche, export/import, formattazione
src/store.tsx             stato dell'app (React context), salvataggio locale e sincronizzazione online
src/lib/firebase.ts       configurazione Firebase (letta da .env)
src/lib/cloud.ts          lettura/scrittura della collezione su Firestore
firestore.rules           regole di sicurezza del database
src/components/           card, righe, badge, scheda volume, layout
src/pages/                Dashboard, Collezione, Mi mancano, Backup
```

Tecnologie: React, Vite, TypeScript, Tailwind CSS e Firebase (Authentication e Firestore).

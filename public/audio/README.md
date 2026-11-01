# Cartella Audio per Dettati in Lingua Coreana

In questa cartella puoi inserire i tuoi file audio in formato **MP3** (es. `lezione1.mp3`, `topik1_dialogo.mp3`).

## Come aggiungere un nuovo dettato in coreano:
1. Copia il tuo file `.mp3` in questa cartella: `/public/audio/tuo_file.mp3`
2. Modifica il file `/public/audio/dettati.txt` aggiungendo una riga nel formato:
   `Difficoltà | tuo_file.mp3 | Titolo Esercizio | Frase in coreano (Hangul)`

L'app supporta:
- Riproduzione diretta di file MP3 reali
- Sintesi vocale nativa coreana ad alta fedeltà (`Web Speech API ko-KR`) con controllo di velocità e pause
- Esercizi di trascrizione Hangul con calcolo del punteggio e correzione sillaba per sillaba

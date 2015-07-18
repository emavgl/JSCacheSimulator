/* global $, document */

/*
Copyright (C) 2014  Emanuele Viglianisi

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see http://www.gnu.org/licenses/.
*/

var myCache;

//Funzione che viene chiamata quando tutta la pagina HTML è stata caricata
$(function() {
    "use strict"

    /*
        Posizioni div dove inserire roba
    */
    var divCache = $("#tdirect");
    var tabellaAccessi = $("#tabellaPlace");
    var textArea = $("#textarea1");
    var divTabella = $("#ByteAddress");
    var statistics = $("#statistics");
    var addTabHead = $("#addHeadTable");
    var mappingMethod = null;
    var arrayIngressi;

    /*
        Variabili di impostazione del simulatore inserite dall'utente e derivanti.
        Tutti i valori sono calcolati come esponenti.
        Ad esempio, se scelgo una memoria da 16MB allora memorySize = 24.
        Poiché pow(2, 24) = 16MB.

        Questa scelta è determinata dalla facilità di fare calcoli tra numeri grossi semplicemente
        sottraendo o sommando gli esponenti, poiché con stessa base.
    */

    var memorySize;
    var cacheSize;
    var blockSize;
    var setSize;
    var algorithm;
    var blocksInCache;
    var bitsInTag;
    var offSet;
    var setsInCache;
    var numeroHIT;
    var numeroMISS;
    var indice = 0; //Indice che rappresenta la posizione attuale per iterare l'array di accessi in RAM

/*
	Funzione che viene chiamata quando viene scelto di generare un input casuale per il simulatore
	La funzione restituisce una stringa di accessi in memoria generate in modo casuale tramite dei sotto algoritmi che simulano
	- il comportamento di un ciclo while (ripete accessi precedenti)
	- un singolo accesso in memoria
	- la lettura di un array
*/

function simulaOperazione() {
    var dimIndirizzo = parseInt($("#sceltaRam").val());
    var quantiCaratteriHex = 6;
    var rangeMin = 0;
    var rangeMax = Math.pow(2, dimIndirizzo);
    var quantiAccessi = Math.floor(Math.random() * 220) + 15; //Numero di accessi in un intervallo [15, 110]
    var used = []; //Array che contiene i valori già inseriti
    var arrayUsed = [];
    var stringToInput = [];
    var newValue;

    for (var i = 0; i < quantiAccessi; i++) {
        var scelta = Math.floor(Math.random() * 7) + 1;
        switch (scelta) {
            default: //Simula un semplice accesso in memoria non presente tra quelli usati
            newValue = Math.floor(Math.random() * rangeMax);
            stringToInput.push(DecToHex(newValue, quantiCaratteriHex));
            used.push(DecToHex(newValue, quantiCaratteriHex));
            break;

            case 1: //Simula l'uso di un array
                var scelta2 = Math.floor(Math.random() * 1) + 0;
                if (arrayUsed.length == 0) scelta2 = 0;
                if (scelta2 == 0) //Se è zero crea un array nuovo e ne simula gli accessi
                {
                    newValue = Math.floor(Math.random() * rangeMax);
                    var dimArray = Math.floor(Math.random() * 20) + 1;
                    for (var j = 0; j < dimArray; j++) {
                        stringToInput.push(DecToHex(newValue + j, quantiCaratteriHex));
                    }
                    var nuovoArray = new accessoArray(newValue, dimArray);
                    arrayUsed.push(nuovoArray);

                } else { //Accede ad un array già creato in precedenza
                    var oldArrayIndex = Math.floor(Math.random() * arrayUsed.length - 1) + 0;
                    for (var j = 0; j < arrayUsed[oldArrayIndex].size; j++) {
                        stringToInput.push(DecToHex(arrayUsed[oldArrayIndex].starterValue + j, quantiCaratteriHex));
                    }
                }
                break;
            case 2: //Rifà accessi simulando un for
                var fromIns = Math.floor(Math.random() * ((used.length - 1) - 0 + 1) + 0);
                var toIns = Math.floor(Math.random() * ((used.length - 1) - fromIns + 1) + fromIns);
                var j = fromIns;
                for (j = fromIns; j < toIns; j++) {
                    stringToInput.push(used[j]);
                }
                break;
        }
    }

    textArea.val(stringToInput.join('\n'));
    return;
}

    /*
        Funzione che viene chiamata se si preme il pulsante per generare un input casuale.
        Come funziona:

    */
    $("#randomInputButton").on("click", simulaOperazione);


	/*
		Funzione che si occupa di convertire un numero decimale
		in una stringa HEX di lunghezza "numCaratteri"
	*/
    function DecToHex(decimale, numCaratteri) {
        var hexString = decimale.toString(16);
        var lunghezza = hexString.length;
        if (lunghezza < numCaratteri) {
            var quantiZeri = numCaratteri - lunghezza;
            for (var i = 0; i < quantiZeri; i++) {
                hexString = "0" + hexString;
            }
        }
        return hexString.toUpperCase();
    }


	/*
		Funzione che gestisce l'upload dell'input da file txt
	*/
    if (window.File && window.FileList && window.FileReader) {
        var filesInput = document.getElementById("importFromFileButton");

        filesInput.addEventListener("change", function(event) {

            var file = event.target.files[0];

            //Only plain text
            if (!file.type.match('plain')) {
                alert("filetype not supported");
                return false;
            }

            var picReader = new FileReader();

            picReader.addEventListener("load", function(event) {
                var textFile = event.target.result;
                textArea.val(textFile);
            });

            //Read the text file
            picReader.readAsText(file);

        });
    }


    /*
        CreateNewStatistics()
        Funzione che crea un nuovo blocco di statistiche.
        Inizializza il nuovo blocco con le impostazioni della simulazione corrente.

        Questa funzione viene chiamata ogni qual volta si avvia una nuova simulazione.
        Cosa deve fare? Deve creare un nuovo blocco che sarà renderizzato ogni istruzione.
        Il nuovo blocco non deve sostituire quello vecchio, ma porsi sopra. In modo da
        poter comparare le varie simulazioni.

        - Se esiste già un elemento "simulazione_corrente" allora rimuove a quell'elemento l'id.
        - crea un nuovo blocco e gli assegna l'etichetta si "simulazione_corrente".

        Il passaggio di etichetta è importante, così mi permette di renderizzare ogni istruzione
        solo il blocco relativo alla simulazione in atto.
    */

    function createNewStatistics() {
        var a = $("#nuovoStat");

        if (a != undefined) {
            a.removeAttr('id');
        }

        if (mappingMethod == "Direct") {
            statistics.prepend('<div class="well well-sm" id="nuovoStat"><table class="tableStat"><tr><td><b>Memory Size:</b> 2<sup>' + memorySize + '</sup></td><td><b>Cache Size:</b> 2<sup>' + cacheSize + '</sup></td><td><b>Block Size:</b> 2<sup>' + blockSize + '</sup></td><td><b>Set Size:</b> -- </sup></td><td><b>Mapping Method:</b> ' + mappingMethod + '</td><td><b>Algorithm:</b> -- </td></tr></table></div>');
        }

        if (mappingMethod == "Fully") {
            statistics.prepend('<div class="well well-sm" id="nuovoStat"><table class="tableStat"><tr><td><b>Memory Size:</b> 2<sup>' + memorySize + '</sup></td><td><b>Cache Size:</b> 2<sup>' + cacheSize + '</sup></td><td><b>Block Size:</b> 2<sup>' + blockSize + '</sup></td><td><b>Set Size:</b>' + myCache.capienza + '</td><td><b>Mapping Method:</b> ' + mappingMethod + '</td><td><b>Algorithm:</b> ' + algorithm + '</td></tr></table></div>');
        }

        if (mappingMethod == "Set") {
            statistics.prepend('<div class="well well-sm" id="nuovoStat"><table class="tableStat"><tr><td><b>Memory Size:</b> 2<sup>' + memorySize + '</sup></td><td><b>Cache Size:</b> 2<sup>' + cacheSize + '</sup></td><td><b>Block Size:</b> 2<sup>' + blockSize + '</sup></td><td><b>Set Size:</b> 2<sup>' + setSize + '</sup></td><td><b>Mapping Method:</b> ' + mappingMethod + '</td><td><b>Algorithm:</b> ' + algorithm + '</td></tr></table></div>');

            currentStatistic = $("#nuovoStat");
        }
    }

	/*
		funzione strettamente legata alla funzione submit.
		leggere la descrizione della funzione submit();
	*/
    function init() {
        //Ora settiamo i 3 parametri dell'indirizzo
        if (mappingMethod == "Direct") {

            offSet = blockSize;
            blocksInCache = cacheSize - offSet;
            bitsInTag = memorySize - blocksInCache - offSet;
            var temp = Math.pow(2, blocksInCache);
            myCache = new CacheDirect(temp);
        }

        if (mappingMethod == "Fully") {
            blocksInCache = 0;
            offSet = blockSize;
            bitsInTag = memorySize - offSet;
            var bic = cacheSize - blockSize;
            var temp = Math.pow(2, bic);
            myCache = new CacheFAssociative(temp);
        }

        if (mappingMethod == "Set") {
            offSet = blockSize;
            setsInCache = cacheSize - setSize - blockSize;
            bitsInTag = memorySize - setsInCache - offSet;
            if (setsInCache == 0) {

                mappingMethod = "Fully";
                alert("For the chosen input values the cache mapping method corresponds to a Fully Associative method.");
                return init();
            }
            var temp = Math.pow(2, cacheSize - blockSize);
            myCache = new CacheSAssociative(temp, Math.pow(2, setSize));
        }

        numeroHIT = 0;
        numeroMISS = 0;
        renderizzaTabellaAccessiInMemoria(textArea, tabellaAccessi); //Crea la tabella degli accessi
        createNewStatistics();
        if (mappingMethod == "Set") {
            renderizzaCacheSetAssociative(divCache, myCache);
        } else {
            renderizzaCache(divCache, myCache);
        }
        //Crea la cache in base ai dati in accesso
        $("#nextStepButton").prop('disabled', false); //Rende cliccabile il bottone "Next Step"
        $("#runButton").prop('disabled', false);
        $("#compareButton").prop('disabled', false);
    }

    /*
        Funzione che viene chiamata quando si clicca sul pulsante 'Crea'
        Cosa deve fare:
        - Deve inizializzare variabili globali
        - Ed impostare graficamente la cache con i dati in possesso

        La funzione è divisa in due. La funzione submit chiama la funzione init
        che inizializza le variabili relative alle impostazioni inserite.

        La funzione è divisa in due poiché, nel caso in cui la Set Associative si trasforma
        in una Fully Associative viene fatta una chiamata ricorsiva alla funzione init.
    */
    function submit() {

        var isOk = textArea.val().split('\n').every(isHex);
        if (!isOk) {
            alert("There's an error in the input data.");
            return false;
        }
        indice = 0;
        memorySize = parseInt($("#sceltaRam").val());
        cacheSize = parseInt($("#cachesize").val());
        blockSize = parseInt($("#blocksize").val());
        setSize = parseInt($("#setsize").val());
        mappingMethod = $("#method").val();
        algorithm = $("#algorithm").val();
        return init()
    }

	/*
		Funzione che controlla se il valore passato è effettivamente una stringa HEX
	*/
    function isHex(value) {
        return /^[0-9A-F]+$/i.test(value);
    }


    /*
        Ogni qualvolta viene cliccato il bottone "Save Changes" della finistre di input
        viene chiamata la funzione submit che si occuperà di inizializzare i dati per la nuova
        simulazione.
    */
    $("#submitButton").on("click", submit);

    /*
        Funzione debita ad aggiornare le statistiche nel blocco di statistiche corrente.
    */
    function updateStatistics() {
        var div = $("#nuovoStat");
        div.empty();

        if (mappingMethod == "Direct") {
            div.append('<table class="tableStat"><tr><td><b>Memory Size:</b> 2<sup>' + memorySize + '</sup></td><td><b>Cache Size:</b> 2<sup>' + cacheSize + '</sup></td><td><b>Block Size:</b> 2<sup>' + blockSize + '</sup></td><td><b>Set Size:</b> -- </sup></td><td><b>Mapping Method:</b> ' + mappingMethod + '</td><td><b>Algorithm:</b> -- </td></tr><tr><td><b>Accesses:</b>' + indice + '</td><td> <b>Hits: </b>' + numeroHIT + ' (' + (((numeroHIT) / indice) * 100).toFixed(2) + '%) </td><td><b>Misses: </b>' + numeroMISS + ' (' + (((numeroMISS) / indice) * 100).toFixed(2) + '%)</td></tr></table></div>');
        }

        if (mappingMethod == "Fully") {
            div.append('<table class="tableStat"><tr><td><b>Memory Size:</b> 2<sup>' + memorySize + '</sup></td><td><b>Cache Size:</b> 2<sup>' + cacheSize + '</sup></td><td><b>Block Size:</b> 2<sup>' + blockSize + '</sup></td><td><b>Set Size:</b>' + myCache.capienza + '</td><td><b>Mapping Method:</b> ' + mappingMethod + '</td><td><b>Algorithm:</b> ' + algorithm + '</td></tr><tr><td><b>Accesses:</b>' + indice + '</td><td> <b>Hits: </b>' + numeroHIT + ' (' + (((numeroHIT) / indice) * 100).toFixed(2) + '%) </td><td><b>Misses: </b>' + numeroMISS + ' (' + (((numeroMISS) / indice) * 100).toFixed(2) + '%)</td></tr></table></table></div>');
        }

        if (mappingMethod == "Set") {
            div.append('<table class="tableStat"><tr><td><b>Memory Size:</b> 2<sup>' + memorySize + '</sup></td><td><b>Cache Size:</b> 2<sup>' + cacheSize + '</sup></td><td><b>Block Size:</b> 2<sup>' + blockSize + '</sup></td><td><b>Set Size:</b> 2<sup>' + setSize + '</sup></td><td><b>Mapping Method:</b> ' + mappingMethod + '</td><td><b>Algorithm:</b> ' + algorithm + '</td></tr><tr><td><b>Accesses:</b>' + indice + '</td><td> <b>Hits: </b>' + numeroHIT + ' (' + (((numeroHIT) / indice) * 100).toFixed(2) + '%) </td><td><b>Misses: </b>' + numeroMISS + ' (' + (((numeroMISS) / indice) * 100).toFixed(2) + '%)</td></tr></table></div>');
        }

    }

    var size;
    var offSetBinaryBit;
    var indexBinaryBit;
    var tagBinaryBit;
    var numeroInDecimale;
    var numeroInBinario;
    var currentStatistic;

    /*
        Funzione Step().
        Funzione che viene chiamata ogni qual volta si preme il pulsante "Step".
        Il suo compito è:
        - quello di prendere l'accesso in memoria corrente ed inserirlo nella cache.
        - dividere l'indirizzo in blocchi
        - chiamare le varie funzioni renderizza
    */
    function step() {
        if (indice < arrayIngressi.length) {
            selezionaElementoTabellaAccessi(arrayIngressi, indice);
            var element = arrayIngressi[indice];
            numeroInDecimale = parseInt(element, 16);
            numeroInBinario = decToBinaryString(numeroInDecimale);
            if (mappingMethod == "Direct") {
                offSetBinaryBit = getPartOfBinary(numeroInBinario, (memorySize - offSet), memorySize);
                indexBinaryBit = getPartOfBinary(numeroInBinario, bitsInTag, blocksInCache + bitsInTag);
                tagBinaryBit = getPartOfBinary(numeroInBinario, 0, bitsInTag);
            }

            if (mappingMethod == "Fully") {
                tagBinaryBit = getPartOfBinary(numeroInBinario, 0, bitsInTag);
                offSetBinaryBit = getPartOfBinary(numeroInBinario, (memorySize - offSet), memorySize);
            }

            if (mappingMethod == "Set") {
                offSetBinaryBit = getPartOfBinary(numeroInBinario, (memorySize - offSet), memorySize);
                indexBinaryBit = getPartOfBinary(numeroInBinario, bitsInTag, setsInCache + bitsInTag);
                tagBinaryBit = getPartOfBinary(numeroInBinario, 0, bitsInTag);
            }

            renderTabellaIndirizzo(element);
            var nBlocco = parseInt(indexBinaryBit, 2);
            var nTag = parseInt(tagBinaryBit, 2);
            posizionaBlocco(nBlocco, nTag, element);
            renderTabellaIndirizzo(element);
            indice++;
            updateStatistics();
        } else {
            alert("All memory accesses have been executed\nPress 'New' to setup a new simulation");
        }
    }

    /*
        Ogni qual volta che il bottone step viene cliccato viene chiamata la funzione step
    */
    $("#nextStepButton").on("click", step);

    function runStep() {
        //selezionaElementoTabellaAccessi(arrayIngressi, indice);
        var element = arrayIngressi[indice];
        numeroInDecimale = parseInt(element, 16);
        numeroInBinario = decToBinaryString(numeroInDecimale);
        if (mappingMethod == "Direct") {
            //offSetBinaryBit = getPartOfBinary(numeroInBinario, (memorySize - offSet), memorySize);
            indexBinaryBit = getPartOfBinary(numeroInBinario, bitsInTag, blocksInCache + bitsInTag);
            tagBinaryBit = getPartOfBinary(numeroInBinario, 0, bitsInTag);
        } else if (mappingMethod == "Fully") {
            tagBinaryBit = getPartOfBinary(numeroInBinario, 0, bitsInTag);
            //offSetBinaryBit = getPartOfBinary(numeroInBinario, (memorySize - offSet), memorySize);
        } else if (mappingMethod == "Set") {
            //offSetBinaryBit = getPartOfBinary(numeroInBinario, (memorySize - offSet), memorySize);
            indexBinaryBit = getPartOfBinary(numeroInBinario, bitsInTag, setsInCache + bitsInTag);
            tagBinaryBit = getPartOfBinary(numeroInBinario, 0, bitsInTag);
        }

        var nBlocco = parseInt(indexBinaryBit, 2);
        var nTag = parseInt(tagBinaryBit, 2);
        posizionaBloccoRun(nBlocco, nTag, element);
        indice++;
    }

    /*
        Quando si preme il pulsante RUN.
        Viene chiamata per tutte gli accessi in memoria rimanenti la funzione step.
    */
    $("#runButton").on("click", function() {
        for (var i = indice; i < arrayIngressi.length; i++) {
            runStep();
        }
        updateStatistics();
        alert("Simulation is end. There is no graphics for Run functions. You can view statistics below.")
    });

    /*
        La funzione posiziona blocco si occupa di chiamare il metodo posiziona blocco presente
        nell'oggetto MyCache.
        Inoltre si occupa di chiamare le funzioni renderizzaCache.

        La variabile result si occupa di immagazzinare il risultato del posizionamento.
        Ovvero se vi è stata una cache HIT o una cache MISS.
    */
    var result;

    function posizionaBlocco(blocco, tag, indirizzoAccesso) {
        result = myCache.posizionaBlocco(blocco, tag, indirizzoAccesso, algorithm);
        if (mappingMethod == "Set") {
            renderizzaCacheSetAssociative(divCache, myCache);
        } else {
            renderizzaCache(divCache, myCache);
        }
        if (result == 0) {
            numeroHIT++;
        } else {
            numeroMISS++;
        }
    }

    function posizionaBloccoRun(blocco, tag, indirizzoAccesso) {
        result = myCache.posizionaBlocco(blocco, tag, indirizzoAccesso, algorithm);
        if (result == 0) {
            numeroHIT++;
        } else {
            numeroMISS++;
        }
    }

    /*
        Funzione Ausiliaria utilizzata nella Funzione STEP.
        Presa una stringa e delle posizioni di inizio e di fine
        si occupa di restituire una porzione di stringa.
    */
    function getPartOfBinary(v, inizio, fine) {
        var nuova = "";
        for (var i = inizio; i < fine; i++) {
            nuova += v[i];
        }
        return nuova;
    }

    /*
        Funzione Ausiliaria utilizzata nella Funzione STEP.
        Preso un numero si occupa di convertirlo in numero BINARIO
        e di aggiungere nei bit più significativi 0 se questo non arriva
        alla dimensione dell'indirizzo.
    */
    function decToBinaryString(number) {
        var temp = number.toString(2);
        if (temp.length < memorySize) {
            var daAggiungere = "";
            for (var i = 0; i < memorySize - temp.length; i++) {
                daAggiungere += "0";
            }
            temp = daAggiungere + temp;
        }
        return temp;
    }

    /*
        Funzione che si occupa del rendering della TABELLA dei dettagli dell'indirizzo corrente.
    */
    function renderTabellaIndirizzo(indirizzo) {
        var tabella = $("#ByteAddress");
        tabella.empty();
        tabella.append('<table id="addresstable" class="table table-striped"><thead><tr><th>' + indirizzo + '</th></tr></thead><tbody id="taddress"></tbody></table>');
        var postocolonne = $("#taddress");
        postocolonne.append('<tr><td>-------------------</td><td>' + memorySize + ' b Address</td><td>-------------------</td></tr>');
        if (mappingMethod == "Direct") {
            postocolonne.append('<tr><td>Tag: ' + bitsInTag + ' b</td><td>Index: ' + blocksInCache + ' b</td><td>Offset: ' + offSet + ' b</td></tr>');
            postocolonne.append('<tr><td>' + tagBinaryBit + '</td><td>' + indexBinaryBit + '</td><td>' + offSetBinaryBit + '</td></tr>');
            divTabella.append('INDEX = Identifies a blockposition in cache <b>' + parseInt(indexBinaryBit, 2) + '</b><br>');
            divTabella.append("OFFSET = Identifies the bytes sequence inside the block<br>");
            divTabella.append("TAG = Label associated with the position of the block<br><br>");
        }
        if (mappingMethod == "Fully") {
            postocolonne.append('<tr><td>Tag: ' + bitsInTag + ' b</td><td> </td><td>Offset: ' + offSet + ' b</td></tr>');
            postocolonne.append('<tr><td>' + tagBinaryBit + '</td><td> </td><td>' + offSetBinaryBit + '</td></tr>');
            divTabella.append("OFFSET = Identifies the bytes sequence inside the block<br>");
            divTabella.append("TAG = Label associated with the position of the block<br><br>");
        }
        if (mappingMethod == "Set") {
            postocolonne.append('<tr><td>Tag: ' + bitsInTag + ' b</td><td>Index: ' + setsInCache + ' b</td><td>Offset: ' + offSet + ' b</td></tr>');
            postocolonne.append('<tr><td>' + tagBinaryBit + '</td><td>' + indexBinaryBit + '</td><td>' + offSetBinaryBit + '</td></tr>');
            divTabella.append('INDEX = Identifies a blockposition in cache <b>' + parseInt(indexBinaryBit, 2) + '</b><br>');
            divTabella.append("OFFSET = Identifies the bytes sequence inside the block<br>");
            divTabella.append("TAG = Label associated with the position of the block<br><br>");
        }
        if (result == 0) {
            divTabella.append("This memory block is already in cache - <b>HIT</b>");
        } else {
            divTabella.append("This memory block isn't in cache - <b>MISS</b>");
        }
    }

    /*
        Funzione che si occupa del rendering della TABELLA degli indirizzi di accesso in memoria.
        Seleziona quello corrente e fa in modo che sia al centro della tabella utilizzando un autoscroll.
    */
    function selezionaElementoTabellaAccessi(arrayIngressi, indice) {
        var tabella = tabellaAccessi;
        tabella.empty();
        tabella.append('<div class="div-table-content"><table id="accesstable" class="table table-striped"><thead><tr><th>Memory Access</th></tr></thead><tbody id="tmemoryaccess"></tbody></table></div>');
        var postoRighe = $("#tmemoryaccess");
        arrayIngressi.forEach(function(lines, i) {
            if (indice == i) {
                postoRighe.append('<tr><td class="pieno" id="selectedAccess" style="color: white;">' + lines + '</td></tr>');
                var el = document.getElementById("selectedAccess");
                el.scrollIntoView(false);
            } else {
                postoRighe.append('<tr><td>' + lines + '</td></tr>');
            }
        });
    }


    /*
        Funzione che si occupa del rendering della TABELLA degli indirizzi di accesso in memoria.
        Questa funzione viene chiamata sola una volta, quando viene avviata una nuova simulazione.
    */
    function renderizzaTabellaAccessiInMemoria(area, tabella) {
        tabella.empty();
        tabella.append('<div class="div-table-content"><table id="accesstable" class="table table-striped"><thead><tr><th>Memory Access</th></tr></thead><tbody id="tmemoryaccess"></tbody></table></div>');
        var postoRighe = $("#tmemoryaccess");
        var arrayOfLines = area.val().split('\n');
        arrayIngressi = arrayOfLines;
        size = arrayOfLines.length;
        arrayOfLines.forEach(function(lines, i) {
            postoRighe.append('<tr><td>' + lines + '</td></tr>');
        });
    }

    /*
        Di seguito - le funzioni che si occupano del render le cache
    */
    function renderizzaCacheSetAssociative(elemento, cache) {
        elemento.empty();
        cache.sets.forEach(function(set, i) {
            addTabHead.empty();
            addTabHead.append("<th>Sets</th><th>Frames</th>");
            var container = $(document.createElement("div"));
            renderizzaCacheTempAssociative(container, set);
            container.children('tr').first().prepend('<td rowspan="' + Math.pow(2, setSize) + '"> ' + i + '</td>');
            elemento.append(container.children());
        });
    }

    function renderizzaCacheTempAssociative(elemento, cache) {
        elemento.empty();
        cache.frames.forEach(function(frame, i) {
            if (cache.indiceUltimaOperazione === i) {
                if (frame.isPieno) {
                    elemento.append('<tr><td class="pieno ultimo" style="color: white;">Frame ' + i + " [T: " + frame.tag + '] [L.A ' + frame.ultimoAccesso + ']</td></tr>');
                } else {
                    elemento.append('<tr><td>Frame ' + i + '</td></tr>');
                }
            } else {
                if (frame.isPieno()) {
                    elemento.append('<tr><td class="pieno" style="color: white;">Frame ' + i + " [T: " + frame.tag + '] [L.A: ' + frame.ultimoAccesso + ']</td></tr>');
                } else {
                    elemento.append('<tr><td>Frame ' + i + '</td></tr>');
                }
            }
        });
    }

    function renderizzaCache(elemento, cache) {
        elemento.empty();
        addTabHead.empty();
        addTabHead.append("<th>Frames</th>");
        cache.frames.forEach(function(frame, i) {

            if (mappingMethod == "Direct") {
                if (cache.indiceUltimaOperazione === i) {
                    if (frame.isPieno) {
                        elemento.append('<tr><td class="pieno ultimo" style="color: white;">Frame ' + i + " [T: " + frame.tag + '] [L.A : ' + frame.ultimoAccesso + ']</td></tr>');
                    } else {
                        elemento.append('<tr><td>Frame ' + i + '</td></tr>');
                    }
                } else {
                    if (frame.isPieno()) {
                        elemento.append('<tr><td class="pieno" style="color: white;">Frame ' + i + " [T: " + frame.tag + '] [L.A: ' + frame.ultimoAccesso + ']</td></tr>');
                    } else {
                        elemento.append('<tr><td>Frame ' + i + '</td></tr>');
                    }
                }
            }

            if (mappingMethod == "Fully") {
                if (cache.indiceUltimaOperazione === i) {
                    if (frame.isPieno) {
                        elemento.append('<tr><td class="pieno ultimo" style="color: white;">Frame ' + i + " [T: " + frame.tag + '] [L.A: ' + frame.ultimoAccesso + ']' + /* (' + frame.lruindex + ')</td>*/ '</tr>');
                    } else {
                        elemento.append('<tr><td>Frame ' + i + '</td></tr>');
                    }
                } else {
                    if (frame.isPieno()) {
                        elemento.append('<tr><td class="pieno ultimo" style="color: white;">Frame ' + i + " [T: " + frame.tag + '] [L.A: ' + frame.ultimoAccesso + ']' + /* (' + frame.lruindex + ')</td>*/ '</tr>');
                    } else {
                        elemento.append('<tr><td>Frame ' + i + '</td></tr>');
                    }
                }
            }

        });



    }
});

/* global Cache */

function CacheFAssociative(numeroFrame) {
    Cache.apply(this, [numeroFrame]); //Costruttore SUPER, chiama il costruttore di cache e passa i parametri.
}

CacheFAssociative.prototype = Object.create(Cache.prototype); //Ha fatto il modo che il prototype sia qualcosa che deriva dal prototype di cache

CacheFAssociative.prototype.marcaBlocco = function (numeroBlocco) {
    for (var i = 0; i < this.capienza; i++) {
        this.frames[i].numeroBlocco = numeroBlocco;
    }
};

CacheFAssociative.prototype.origineFrame = function (numeroFrame, numeroBlocchiRam) {
    var possibiliIndex = [];
    for (var i = 0; i < numeroBlocchiRam; i++) {
        possibiliIndex.push(i);
    }
    return possibiliIndex;
};

CacheFAssociative.prototype.cancellaRANDOM = function () {
    var index = Math.floor((Math.random() * this.capienza) + 0); //index = numero random tra 0 e capienza
    return index;
};

CacheFAssociative.prototype.cancellaFIFO = function () {

    /*
        Ogni frame ha il campo fifoIndex.
        Al momento di un aggiunta fifoIndex = capienza +1.
        Quindi, per prendere l'elemento aggiunto per prima mi serve cercare il frame con fifoIndex minimo
   */

    var min = 0;
    for (var i = 0; i < this.capienza; i++) {
        if (this.frames[i].fifoindex < this.frames[min].fifoindex) {
            min = i;
        }
    }
    return min;

};

CacheFAssociative.prototype.ricalcolaLRU = function (index) {
    this.frames[index].lruindex = 0;
    for (var i = 0; i < this.blocchiInseriti; i++) {
        this.frames[i].lruindex += 1;
    }
};

CacheFAssociative.prototype.cancellaLRU = function () {

    /*
        Ogni frame ha il campo lruindex.
        lru index ogni volta che chiamo la funzione posiziona blocco:
        mi setta a 1 l'elemento che ho aggiunto ora o che ho usato recentemente
        fa un +1 l'indice di tutti gli altri elementi
        
        Mi basta prendere l'elemento che ha lruindex più alto.
    */

    var max = 0;
    for (var i = 0; i < this.capienza; i++) {
        console.log(this.frames[i].lruindex);
        if (this.frames[i].lruindex > this.frames[max].lruindex) max = i;
    }
    return max;

};


CacheFAssociative.prototype.posizionaBlocco = function (numeroBlocco, xtag, lastAccess, algoritmoRimozione) {
    var inserito = false;
    var trovato = false;
    //1. Si scorre tutti i blocchi fin ora inseriti e vede se c'è già il blocco in cache
    for (var i = 0; i < this.blocchiInseriti; i++) {
        if (this.frames[i].tag === xtag) {
            trovato = true;
            this.frames[i].ultimoAccesso = lastAccess;
            this.ricalcolaLRU(i);
            this.indiceUltimaOperazione = i;
        }
    }

    if (trovato === true) {
        return 0;
    }

    //2. Il blocco non è presente tra quelli inseriti
    //--> Controlla se tutti i posti sono occupati, se no aggiunge un nuovo blocco
    //--> Se tutti i posti sono occupati allora chiama la cancellazione e poi aggiunge
    if (this.blocchiInseriti < this.capienza) {
        this.frames[this.blocchiInseriti].numeroBlocco = numeroBlocco;
        this.frames[this.blocchiInseriti].tag = xtag;
        this.frames[this.blocchiInseriti].fifoindex = this.blocchiInseriti + 1;
        this.frames[this.blocchiInseriti].ultimoAccesso = lastAccess;
        var n = this.blocchiInseriti;
        this.blocchiInseriti += 1;
        this.ricalcolaLRU(n);
        this.indiceUltimaOperazione = n;
    } else {
        var free;
        if (algoritmoRimozione == "LRU") {
            free = this.cancellaLRU();
        }
        if (algoritmoRimozione == "Random") {
            free = this.cancellaRANDOM();
        }
        if (algoritmoRimozione == "FIFO") {
            free = this.cancellaFIFO();
        }

        //Abbiamo ora ottenuta una porzione libera:
        //posizioniamo il nuovo blocco
        this.frames[free].numeroBlocco = numeroBlocco;
        this.frames[free].tag = xtag;
        this.frames[free].fifoindex = this.blocchiInseriti + 1;
        this.frames[free].ultimoAccesso = lastAccess;
        this.ricalcolaLRU(free);
        this.indiceUltimaOperazione = free;
    }

    return 1;

};
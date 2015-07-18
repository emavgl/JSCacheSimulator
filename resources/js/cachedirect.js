/* global Cache*/

/*
    Classe che definisce il tipo di cache Direct.
    Classe cache Direct è comunque una cache. Quindi, deriva dalla classe cache.
    Vengono derivate sia variabili che metodi.
    
    Inoltre sono ridefinite le funzioni:
        -marcaBlocco    -> prende il numero di blocco cliccato nella RAM e marca il frame corrispondente
        -origineFrame   -> prende il numero del frame selezionato e marca il blocco di ram corrispondente
*/

function CacheDirect(numeroFrame) {
    Cache.apply(this, [numeroFrame]); //Costruttore SUPER, chiama il costruttore di cache e passa i parametri.
}

CacheDirect.prototype = Object.create(Cache.prototype); //Ha fatto il modo che il prototype sia qualcosa che deriva dal prototype di cache

CacheDirect.prototype.marcaBlocco = function (numeroBlocco) {
    var posizioneDelBlocco = numeroBlocco % this.capienza;
    this.frames[posizioneDelBlocco].numeroBlocco = numeroBlocco;
};

CacheDirect.prototype.origineFrame = function (numeroFrame, numeroBlocchiRam) {
    var possibiliIndex = [];
    for (var i = numeroFrame; i < numeroBlocchiRam; i = i + this.capienza) {
        possibiliIndex.push(i);
    }
    return possibiliIndex;
};

CacheDirect.prototype.posizionaBlocco = function (blocco, xtag, lastAccess, algoritmoCancellazione) {
    var posizioneDelBlocco = blocco % this.capienza;
    var hoSostituitoQualcosa = 1;
    if (this.frames[posizioneDelBlocco].isPieno() === true) {
        if (this.frames[posizioneDelBlocco].tag === xtag) {
            hoSostituitoQualcosa = 0;
            this.frames[posizioneDelBlocco].ultimoAccesso = lastAccess;
        } else {
            this.frames[posizioneDelBlocco].numeroBlocco = blocco;
            this.frames[posizioneDelBlocco].tag = xtag;
            this.frames[posizioneDelBlocco].ultimoAccesso = lastAccess;
            this.blocchiInseriti += 1;
        }
    } else {
        this.frames[posizioneDelBlocco].numeroBlocco = blocco;
        this.frames[posizioneDelBlocco].tag = xtag;
        this.frames[posizioneDelBlocco].ultimoAccesso = lastAccess;
        this.blocchiInseriti += 1;
    }
    this.indiceUltimaOperazione = posizioneDelBlocco;
    return hoSostituitoQualcosa;
};
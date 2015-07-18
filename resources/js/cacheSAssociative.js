/* global Cache, CacheFAssociative */

CacheSAssociative.prototype = Object.create(Cache.prototype); //Ha fatto il modo che il prototype sia qualcosa che deriva dal prototype di cache

function CacheSAssociative(capienza, associativita) {
    Cache.apply(this, [capienza]); //Costruttore SUPER, chiama il costruttore di cache e passa i parametri.
    this.sets = [];

    this.numeroSet = capienza / associativita;

    for (var i = 0; i < this.numeroSet; i++) {
        this.sets.push(new CacheFAssociative(associativita));
    }
}

CacheSAssociative.prototype.marcaBlocco = function (numeroBlocco) {
    var setAssegnato = numeroBlocco % this.numeroSet;
    var set = this.sets[setAssegnato];
    set.marcaBlocco(numeroBlocco);
};

CacheSAssociative.prototype.origineFrame = function (nSet, numeroBlocchiRam) {
    var numeroIniziale = nSet;
    var possibiliIndex = [];
    for (var i = numeroIniziale; i < numeroBlocchiRam; i = i + this.numeroSet) {
        possibiliIndex.push(i);
    }
    return possibiliIndex;
};

CacheSAssociative.prototype.annullaIndiciUltimaOperazione = function () {
    for (var i = 0; i < this.numeroSet; i++) {
        this.sets[i].indiceUltimaOperazione = -1;
    }
};

CacheSAssociative.prototype.posizionaBlocco = function (numeroBlocco, xtag, lastAccess, algoritmoRimozione) {
    var setDelBlocco = numeroBlocco % (this.numeroSet);
    this.annullaIndiciUltimaOperazione();
    return this.sets[setDelBlocco].posizionaBlocco(numeroBlocco, xtag, lastAccess, algoritmoRimozione);
};
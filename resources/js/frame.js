/*
    In questo file viene definito un oggetto FRAME
    ogni oggetto frame contiene le determinate variabili:
        numeroBlocco;
        tag;
        contenuto;
    
    Inoltre, il blocco contiene una funzione chiamata:
        isPieno -> se il numeroBlocco è vuoto ritorna false, altrimenti true.
*/

function Frame() {
    this.numeroBlocco = null;
    this.tag = null;
    this.contenuto = null;
    this.ultimoAccesso = null;
    this.fifoindex = null;
    this.lruindex = null;
}

Frame.prototype.isPieno = function () {
    if (this.numeroBlocco === null) {
        return false;
    }
    return true;
};



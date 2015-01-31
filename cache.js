/* global Frame */

function Cache(numeroFrame) {
    this.capienza = numeroFrame;
    this.blocchiInseriti = 0;
    this.indiceUltimaOperazione = -1;
    this.frames = [];
    for (var i = 0; i < numeroFrame; i++) {
        this.frames.push(new Frame());
    }
}
function scoreS(p1, px, p2, e1, ex, e2) {
    var checksum1 = p1 + px + p2;
    var checksum2 = e1 + ex + e2;
    if (checksum1 > 0 && checksum2 > 0) {
        p1 = p1 / checksum1;
        px = px / checksum1;
        p2 = p2 / checksum1;
        e1 = e1 / checksum2;
        ex = ex / checksum2;
        e2 = e2 / checksum2;
        return 100 - 50 * ((e1 - p1) * (e1 - p1) + (ex - px) * (ex - px) + (e2 - p2) * (e2 - p2));
    } else return 0;
}

//funzione di score T con ass. prob. (p1,px,p2) e risultato di verità (e1,ex,e2)
function scoreT(p1, px, p2, e1, ex, e2) {
    var checksum1 = p1 + px + p2;
    var checksum2 = e1 + ex + e2;
    if (checksum1 > 0 && checksum2 > 0) {
        p1 = p1 / checksum1;
        px = px / checksum1;
        p2 = p2 / checksum1;
        e1 = e1 / checksum2;
        ex = ex / checksum2;
        e2 = e2 / checksum2;
        var v1 = e1 - p1,
            v2 = v1 + ex - px;
        return 100 - 50 * (v1 * v1 + v2 * v2);
    } else return 0;

}


function calcola_classifica_scoreS(array_giocatori, array_risultati) {
    var ret = [];
    var c, d, iniz_giocatori = 0,
        score_non_valido = 0;
    var temp = [],
        temp2 = [],
        tt = 0;
    var min_score, lista_score_mancanti = [];

    for (var week in array_risultati) {
        for (var partita in array_risultati[week]) {
            c = 0;
            d = 0;
            lista_score_mancanti = [];
            min_score = 100;
            for (var giocatore in array_giocatori) {
                if (iniz_giocatori == 0) {
                    temp[c] = array_giocatori[giocatore]["name"];
                    temp2[c] = 0;
                }

                var p = [];
                if (array_giocatori[giocatore]["bets"] && array_giocatori[giocatore]["bets"][week] && array_giocatori[giocatore]["bets"][week][partita]) {
                    p = array_giocatori[giocatore]["bets"][week][partita];
                    if (!isNaN(p[0]) && !isNaN(p[2]) && !isNaN(p[1])) {
                        var e = [];
                        p = array_giocatori[giocatore]["bets"][week][partita];
                        e = array_risultati[week][partita];
                        tt = scoreS(p[0] / 100, p[1] / 100, p[2] / 100, e[0], e[1], e[2]);
                        if (tt <= min_score) {
                            min_score = tt;
                        }
                        temp2[c] += tt;
                    } else
                        score_non_valido = 1;

                } else
                    score_non_valido = 1;

                if (score_non_valido == 1) {
                    lista_score_mancanti[d] = c;
                    d++;
                    score_non_valido = 0;
                }

                c++;
            }
            if (d > 0)
                for (var i = 0; i < d; i++)
                    temp2[lista_score_mancanti[i]] += min_score;

            iniz_giocatori = 1;
        }
    }

    return toArray(temp, temp2, c);

}

//score tipo T
function calcola_classifica_scoreT(array_giocatori, array_risultati) {
    var ret = [];
    var c, d, iniz_giocatori = 0,
        score_non_valido = 0;
    var temp = [],
        temp2 = [],
        tt = 0;

    var min_score, lista_score_mancanti = [];

    for (var week in array_risultati) {
        for (var partita in array_risultati[week]) {
            c = 0;
            d = 0;
            lista_score_mancanti = [];
            min_score = 100;
            for (var giocatore in array_giocatori) {
                if (iniz_giocatori == 0) {
                    temp[c] = array_giocatori[giocatore]["name"];
                    temp2[c] = 0;
                }

                var p = [];
                if (array_giocatori[giocatore]["bets"] && array_giocatori[giocatore]["bets"][week] && array_giocatori[giocatore]["bets"][week][partita]) {
                    p = array_giocatori[giocatore]["bets"][week][partita];
                    if (!isNaN(p[0]) && !isNaN(p[2]) && !isNaN(p[1])) {
                        var e = [];
                        p = array_giocatori[giocatore]["bets"][week][partita];
                        e = array_risultati[week][partita];
                        tt = scoreT(p[0] / 100, p[1] / 100, p[2] / 100, e[0], e[1], e[2]);
                        if (tt <= min_score) {
                            min_score = tt;
                        }
                        temp2[c] += tt;
                    } else
                        score_non_valido = 1;

                } else
                    score_non_valido = 1;

                if (score_non_valido == 1) {
                    lista_score_mancanti[d] = c;
                    d++;
                    score_non_valido = 0;
                }

                c++;
            }
            if (d > 0)
                for (var i = 0; i < d; i++)
                    temp2[lista_score_mancanti[i]] += min_score;

            iniz_giocatori = 1;

        }
    }

    return toArray(temp, temp2, c);
}

function toArray(origin, origin2, count) {

    var ret = [];

    for (var i = 0; i < count; i++)
        ret.push({
            name: origin[i],
            score: parseFloat(origin2[i].toFixed(2))
        });

    return ret.sort(function(a, b) {
        return a.score < b.score;
    });

}

exports.calcola_classifica_scoreS = calcola_classifica_scoreS;
exports.calcola_classifica_scoreT = calcola_classifica_scoreT;
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

function calcola_classifica_scoreT(array_giocatori, array_risultati) {
    var ret = [];
    var quota_settimanale = 1;
    //quota per testa per settimana
    var c, d, cc, iniz_giocatori = 0,
        score_non_valido = 0;
    var temp = [],
        temp2 = [],
        temp3 = [],
        temp4 = [],
        ts = [],
        tt = 0;
    w = 0;
    gioc_week = 0;
    var min_score, lista_score_mancanti = [];
    var numero_giocatori = 0,
        numero_partite;
    var somma_punteggi = [],
        somma_vincite = [];
    var p_med = [],
        sp_med = [];
    pronostici = [];

    for (var giocatore in array_giocatori) {
        numero_giocatori++;
    }
    for (var i = 0; i < numero_giocatori; i++) {
        pronostici[i] = [];
    }

    for (var week in array_risultati) {
        w++;
        numero_partite = 0;
        gioc_week = 0;
        for (var i = 0; i < numero_giocatori; i++) {
            pronostici[i][week] = [];
        }
        for (var giocatore in array_giocatori) {
            if ((array_giocatori[giocatore]["from"] || 1) <= w)
                gioc_week++;

        }

        d = 0;
        for (var wt in array_risultati[week]) {
            numero_partite++;
        }
        for (var i = 0; i < numero_giocatori; i++) {
            ts[i] = 0;
        }

        p_med[week] = [];
        sp_med[week] = [];
        for (var partita in array_risultati[week]) {
            for (var i = 0; i < numero_giocatori; i++) {
                pronostici[i][week][partita] = [];
            }
            var e = [];
            c = 0;
            d = 0;
            cc = 0;
            lista_score_mancanti = [];
            p_med[week][partita] = {
                "p1": 0,
                "px": 0,
                "p2": 0
            };
            sp_med[week][partita] = 0;

            for (var giocatore in array_giocatori) {
                if (iniz_giocatori == 0) {
                    temp[c] = array_giocatori[giocatore]["name"];
                    temp2[c] = 0;
                    temp3[c] = [];
                    temp4[c] = array_giocatori[giocatore]["from"];
                }

                var p = [];

                if (array_giocatori[giocatore]["bets"] && array_giocatori[giocatore]["bets"][week] && array_giocatori[giocatore]["bets"][week][partita]) {

                    p = array_giocatori[giocatore]["bets"][week][partita];
                    if (!isNaN(p[0]) && !isNaN(p[2]) && !isNaN(p[1])) {
                        cc++;
                        p = array_giocatori[giocatore]["bets"][week][partita];
                        e = array_risultati[week][partita];
                        pronostici[c][week][partita] = p;
                        p_med[week][partita]["p1"] += p[0];
                        p_med[week][partita]["px"] += p[1];
                        p_med[week][partita]["p2"] += p[2];
                        tt = scoreT(p[0] / 100, p[1] / 100, p[2] / 100, e[0], e[1], e[2]);
                        temp2[c] += tt;
                        ts[c] += tt;
                    } else {
                        score_non_valido = 1;
                    }
                } else {
                    score_non_valido = 1;
                }

                if (score_non_valido == 1) {
                    lista_score_mancanti[d] = c;
                    d++;
                    score_non_valido = 0;
                    ts[c] = -1;
                }

                c++;
            }
            e = array_risultati[week][partita];
            p_med[week][partita]["p1"] = p_med[week][partita]["p1"] / cc;
            p_med[week][partita]["px"] = p_med[week][partita]["px"] / cc;
            p_med[week][partita]["p2"] = p_med[week][partita]["p2"] / cc;

            sp_med[week][partita] = scoreT(p_med[week][partita]["p1"] / 100, p_med[week][partita]["px"] / 100, p_med[week][partita]["p2"] / 100, e[0], e[1], e[2]);

            iniz_giocatori = 1;
        }

        min_score = 1000;
        for (var i = 0; i < numero_giocatori; i++) {
            if (ts[i] <= min_score && ts[i] >= 0) {
                min_score = ts[i];
            }
        }

        for (var i = 0; i < numero_giocatori; i++) {
            if (ts[i] == -1) {
                temp2[i] = min_score;
            }
        }
        somma_punteggi[week] = 0;
        for (var i = 0; i < c; i++) {
            if (ts[i] >= 0)
                somma_punteggi[week] += ts[i];
            else
                somma_punteggi[week] += min_score;
        }
        somma_punteggi[week] = Math.ceil(100 * somma_punteggi[week] / numero_giocatori) / 100;

        var sum = 0;
        min_score = 1000;
        for (var i = 0; i < c; i++) {
            if (ts[i] <= min_score && ts[i] >= 0) {
                min_score = ts[i];
            }
        }
        for (var i = 0; i < c; i++)
            if (ts[i] > -1) {
                temp3[i][week] = (ts[i] - min_score);
                sum += temp3[i][week];
            } else
                temp3[i][week] = 0;
        if (sum > 0) {
            for (var i = 0; i < c; i++)
                temp3[i][week] = Math.floor(100 * temp3[i][week] * quota_settimanale * gioc_week / sum) / 100;
        } else {
            var i = 0;
            for (var giocatore in array_giocatori) {
                if ((array_giocatori[giocatore]["from"] || 1) <= w && ts[i] >= 0) {
                    temp3[i][week] = quota_settimanale;
                }
                i++;
            }
        }

        somma_vincite[week] = 0;
        for (var i = 0; i < c; i++)
            somma_vincite[week] += temp3[i][week];
        somma_vincite[week] = Math.floor(100 * somma_vincite[week] / numero_giocatori) / 100;
    }

    array = [];

    for (var i = 0; i < c; i++)
        array.push({
            name: temp[i],
            score: Math.ceil(100 * temp2[i]) / 100,
            cash: temp3[i],
            prognostics: pronostici[i],
            from: temp4[i]
        });

    array.sort(function(a, b) {
        return b.score - a.score;
    });

    var result = {
        data: array,
        m_score: somma_punteggi,
        m_wins: somma_vincite,
        m_prognostic: p_med,
        score_m_prognostic: sp_med
    }

    return result;
}

function toArray(origin, origin2, count) {

    var ret = [];

    for (var i = 0; i < count; i++)
        ret.push({
            name: origin[i],
            score: parseFloat(origin2[i].toFixed(2))
        });

    return ret.sort(function(a, b) {
        return b.score - a.score;
    });

}

exports.calcola_classifica_scoreS = calcola_classifica_scoreS;
exports.calcola_classifica_scoreT = calcola_classifica_scoreT;
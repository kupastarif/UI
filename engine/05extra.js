/**
 * =============================================================================
 * FILE        : /engine/05extra.js
 * VERSI FILE  : 1.0.0-rev1
 * ENGINE      : 1.0.0-beta
 * DATA SOURCE : Excel "v9.7j masterapp.xlsx" — Sheet "v9.7j-All"
 */
const Extra = (function() {
    'use strict';

    const F_V = '1.0.0-rev1';

    function E998(area) {
        if (area === 'Jabodetabek') return DATA.E305;
        if (area === 'SumatraJawa') return DATA.E306;
        if (area === 'TimurIndonesia') return DATA.E307;
        return DATA.E305;
    }

    function E999(bebanTotalEst, jarakJemputAntarOrderKerja) { return bebanTotalEst / jarakJemputAntarOrderKerja; }
    function E1000(bebanTotalReal, totalJarakReal) { return bebanTotalReal / totalJarakReal; }
    function E1001(umr) { return (umr / DATA.E465) / DATA.E295; }
    function E1002(mode) { return mode === 'Mobil' ? DATA.E457 : DATA.E458; }

    function E1007(jarakAntarOrderKerja) {
        if (jarakAntarOrderKerja < 3) return DATA.E168;
        if (jarakAntarOrderKerja <= 7) return DATA.E169;
        return DATA.E170;
    }

    function E1008(seatType) { return seatType === '4seat' ? DATA.E166 : DATA.E167; }
    function E1009(tarifAngkot, jumlahPenumpang, jarakAntarOrderKerja) { return (tarifAngkot * jumlahPenumpang) / jarakAntarOrderKerja; }
    function E1010(tarifJarakOrder, konversiTarifAngkotPerKm) { return (tarifJarakOrder - konversiTarifAngkotPerKm) / konversiTarifAngkotPerKm; }
    function E1012() { return DATA.E177; }
    function E1013() { return DATA.E183; }
    function E1014(tarifTransjakarta, jumlahPenumpang) { return (tarifTransjakarta * jumlahPenumpang) / DATA.E179; }
    function E1015(tarifJarakOrder, konversiTarifTransjakartaPerKm) { return (tarifJarakOrder - konversiTarifTransjakartaPerKm) / konversiTarifTransjakartaPerKm; }

    function E1021(bebanBBMTotalEst, totalWaktuOrder) { return bebanBBMTotalEst / totalWaktuOrder; }
    function E1022(bebanNonBBMTotalEst, totalWaktuOrder) { return bebanNonBBMTotalEst / totalWaktuOrder; }
    function E1023(bebanTotalEst, totalWaktuOrder) { return bebanTotalEst / totalWaktuOrder; }
    function E1025(bebanBBMTotalEst, jarakJemputAntarOrderKerja) { return bebanBBMTotalEst / jarakJemputAntarOrderKerja; }
    function E1026(bebanNonBBMTotalEst, jarakJemputAntarOrderKerja) { return bebanNonBBMTotalEst / jarakJemputAntarOrderKerja; }
    function E1027(bebanTotalEst, jarakJemputAntarOrderKerja) { return bebanTotalEst / jarakJemputAntarOrderKerja; }
    function E1029(pendapatanDriverEst, totalWaktuOrder) { return pendapatanDriverEst / totalWaktuOrder; }
    function E1030(pendapatanAplikasiEst, totalWaktuOrder) { return pendapatanAplikasiEst / totalWaktuOrder; }
    function E1031(totalDibayarPenumpang, totalWaktuOrder) { return totalDibayarPenumpang / totalWaktuOrder; }
    function E1033(pendapatanDriverEst, jarakJemputAntarOrderKerja) { return pendapatanDriverEst / jarakJemputAntarOrderKerja; }
    function E1034(pendapatanAplikasiEst, jarakJemputAntarOrderKerja) { return pendapatanAplikasiEst / jarakJemputAntarOrderKerja; }
    function E1035(totalDibayarPenumpang, jarakJemputAntarOrderKerja) { return totalDibayarPenumpang / jarakJemputAntarOrderKerja; }

    function E1041(bebanBBMTotalReal, totalWaktuReal) { return bebanBBMTotalReal / totalWaktuReal; }
    function E1042(bebanNonBBMTotalReal, totalWaktuReal) { return bebanNonBBMTotalReal / totalWaktuReal; }
    function E1043(bebanTotalReal, totalWaktuReal) { return bebanTotalReal / totalWaktuReal; }
    function E1045(bebanBBMTotalReal, totalJarakReal) { return bebanBBMTotalReal / totalJarakReal; }
    function E1046(bebanNonBBMTotalReal, totalJarakReal) { return bebanNonBBMTotalReal / totalJarakReal; }
    function E1047(bebanTotalReal, totalJarakReal) { return bebanTotalReal / totalJarakReal; }
    function E1049(pendapatanDriverReal, totalWaktuReal) { return pendapatanDriverReal / totalWaktuReal; }
    function E1050(pendapatanAplikasiReal, totalWaktuReal) { return pendapatanAplikasiReal / totalWaktuReal; }
    function E1051(totalDibayarPenumpang, totalWaktuReal) { return totalDibayarPenumpang / totalWaktuReal; }
    function E1053(pendapatanDriverReal, totalJarakReal) { return pendapatanDriverReal / totalJarakReal; }
    function E1054(pendapatanAplikasiReal, totalJarakReal) { return pendapatanAplikasiReal / totalJarakReal; }
    function E1055(totalDibayarPenumpang, totalJarakReal) { return totalDibayarPenumpang / totalJarakReal; }

    function E1061(targetBulanan, pendapatanDriverPerMenitReal) { return ((targetBulanan / pendapatanDriverPerMenitReal) / DATA.E295) / DATA.E300; }
    function E1062(pendapatanDriverPerMenitReal, jamSampingan) { return ((pendapatanDriverPerMenitReal * DATA.E295) * jamSampingan) * DATA.E300; }
    function E1063(pendapatanDriverPerMenitReal, jamFulltime) { return ((pendapatanDriverPerMenitReal * DATA.E295) * jamFulltime) * DATA.E300; }
    function E1064(pendapatanDriverPerMenitReal, jamLembur) { return ((pendapatanDriverPerMenitReal * DATA.E295) * jamLembur) * DATA.E300; }
    function E1066(targetBulanan, pendapatanAplikasiPerMenitReal, orderType) {
        if (orderType === 'offline') return 0;
        return ((targetBulanan / pendapatanAplikasiPerMenitReal) / DATA.E295) / DATA.E300;
    }
    function E1067(pendapatanAplikasiPerMenitReal, jamSampingan) { return ((pendapatanAplikasiPerMenitReal * DATA.E295) * jamSampingan) * DATA.E300; }
    function E1068(pendapatanAplikasiPerMenitReal, jamFulltime) { return ((pendapatanAplikasiPerMenitReal * DATA.E295) * jamFulltime) * DATA.E300; }
    function E1069(pendapatanAplikasiPerMenitReal, jamLembur) { return ((pendapatanAplikasiPerMenitReal * DATA.E295) * jamLembur) * DATA.E300; }
    function E1071(targetBulanan, biayaOperasionalPerMenitReal) { return ((targetBulanan / biayaOperasionalPerMenitReal) / DATA.E295) / DATA.E300; }
    function E1072(biayaOperasionalPerMenitReal, jamSampingan) { return ((biayaOperasionalPerMenitReal * DATA.E295) * jamSampingan) * DATA.E300; }
    function E1073(biayaOperasionalPerMenitReal, jamFulltime) { return ((biayaOperasionalPerMenitReal * DATA.E295) * jamFulltime) * DATA.E300; }
    function E1074(biayaOperasionalPerMenitReal, jamLembur) { return ((biayaOperasionalPerMenitReal * DATA.E295) * jamLembur) * DATA.E300; }
    function E1076(targetBulanan, biayaPenumpangPerMenitReal) { return ((targetBulanan / biayaPenumpangPerMenitReal) / DATA.E295) / DATA.E300; }
    function E1077(biayaPenumpangPerMenitReal, jamSampingan) { return ((biayaPenumpangPerMenitReal * DATA.E295) * jamSampingan) * DATA.E300; }
    function E1078(biayaPenumpangPerMenitReal, jamFulltime) { return ((biayaPenumpangPerMenitReal * DATA.E295) * jamFulltime) * DATA.E300; }
    function E1079(biayaPenumpangPerMenitReal, jamLembur) { return ((biayaPenumpangPerMenitReal * DATA.E295) * jamLembur) * DATA.E300; }

    function E1085(jarakRerataCariOrder, biayaOperasionalPerKmReal) { return jarakRerataCariOrder * biayaOperasionalPerKmReal; }
    function E1086(pendapatanDriverReal, biayaModalGeser, totalWaktuReal, waktuTambahVendor) { return (pendapatanDriverReal - biayaModalGeser) / (totalWaktuReal + waktuTambahVendor); }
    function E1087(umr, pendapatanVendorPerMenit) { return ((umr / pendapatanVendorPerMenit) / DATA.E295) / DATA.E300; }
    function E1088(pendapatanVendorPerMenit, jamSampingan) { return ((pendapatanVendorPerMenit * DATA.E295) * jamSampingan) * DATA.E300; }
    function E1089(pendapatanVendorPerMenit, jamFulltime) { return ((pendapatanVendorPerMenit * DATA.E295) * jamFulltime) * DATA.E300; }
    function E1090(pendapatanVendorPerMenit, jamLembur) { return ((pendapatanVendorPerMenit * DATA.E295) * jamLembur) * DATA.E300; }
    function E1092(pendapatanDriverReal, biayaModalGeser, totalWaktuReal, waktuTambahIndividu) { return (pendapatanDriverReal - biayaModalGeser) / (totalWaktuReal + waktuTambahIndividu); }
    function E1093(umr, pendapatanIndividuPerMenit) { return ((umr / pendapatanIndividuPerMenit) / DATA.E295) / DATA.E300; }
    function E1094(pendapatanIndividuPerMenit, jamSampingan) { return ((pendapatanIndividuPerMenit * DATA.E295) * jamSampingan) * DATA.E300; }
    function E1095(pendapatanIndividuPerMenit, jamFulltime) { return ((pendapatanIndividuPerMenit * DATA.E295) * jamFulltime) * DATA.E300; }
    function E1096(pendapatanIndividuPerMenit, jamLembur) { return ((pendapatanIndividuPerMenit * DATA.E295) * jamLembur) * DATA.E300; }

    function E1102(pendapatanDriverEst, pendapatanAplikasiEst, omsetMinimum) {
        if (pendapatanDriverEst < 0) return 'wkwkwk';
        if (pendapatanAplikasiEst >= pendapatanDriverEst) return 'warning';
        if (pendapatanDriverEst < omsetMinimum) return 'warning';
        return 'aman';
    }

    function E1103(persentaseAplikasiEst, persentaseTotalAplikasi) { return persentaseAplikasiEst >= persentaseTotalAplikasi ? 'up' : 'down'; }
    function E1104(tarifJarakOrder, tarifDasarOffline) { return tarifJarakOrder < tarifDasarOffline ? 'danger' : 'success'; }
    function E1105(jarakInputApp) {
        if (jarakInputApp == null) return 'blind';
        return jarakInputApp > 0 ? '' : 'blind';
    }

    function E1106(orderType, mode, tarifJarakOrder, tarifMinZona, tarifDasarOffline) {
        if (orderType === 'online') return 'app';
        if (mode === 'Mobil') {
            if (tarifJarakOrder < tarifMinZona) return 'abnormal';
            if (tarifJarakOrder <= tarifMinZona * 1.3) return 'minimal';
            if (tarifJarakOrder <= tarifDasarOffline * 1.3) return 'wajar';
            return 'waktu';
        } else {
            if (tarifJarakOrder < tarifMinZona) return 'abnormal';
            if (tarifJarakOrder <= tarifMinZona * 1.25) return 'minimal';
            if (tarifJarakOrder <= tarifDasarOffline * 1.25) return 'wajar';
            return 'waktu';
        }
    }

    function E1107(biayaAplikasiPenumpang, biayaAplikasiWajar) { return biayaAplikasiPenumpang > biayaAplikasiWajar ? 'serakah' : 'wajar'; }

    function E1112(pendapatanDriverReal, omsetMinimum) {
        if (pendapatanDriverReal < 0) return 'wkwkwk';
        if (pendapatanDriverReal < omsetMinimum * 0.5) return 'kritis';
        if (pendapatanDriverReal < omsetMinimum * 0.75) return 'rendah';
        if (pendapatanDriverReal < omsetMinimum) return 'cukup';
        if (pendapatanDriverReal < omsetMinimum * 2) return 'normal';
        return 'bagus';
    }

    function E1113(pendapatanDriverReal, pendapatanAplikasiReal) {
        if (pendapatanDriverReal < 0) return 'wkwkwk';
        if (pendapatanAplikasiReal > pendapatanDriverReal * 2) return 'sedekah';
        if (pendapatanAplikasiReal > pendapatanDriverReal) return 'serakah';
        if (pendapatanDriverReal > pendapatanAplikasiReal * 1.5) return 'ajaib';
        if (pendapatanDriverReal > pendapatanAplikasiReal) return 'biasa';
        return 'imbang';
    }

    function getExtraBase(v, est, real) {
        const e998 = E998(v.E20);
        const e999 = est ? E999(est.E946, est.E709) : 0;
        const e1000 = real ? E1000(real.E960, real.E752) : 0;
        const e1001 = E1001(e998);
        const e1002 = E1002(v.E10);
        return { E998: e998, E999: e999, E1000: e1000, E1001: e1001, E1002: e1002 };
    }

    function getComparison(est) {
        const e1007 = E1007(est.E708);
        const e1008 = E1008(est.E662);
        const e1009 = E1009(e1007, e1008, est.E708);
        const e1010 = E1010(est.E713, e1009);
        const e1012 = E1012();
        const e1013 = E1013();
        const e1014 = E1014(e1012, e1013);
        const e1015 = E1015(est.E713, e1014);
        return { E1007: e1007, E1008: e1008, E1009: e1009, E1010: e1010,
                 E1012: e1012, E1013: e1013, E1014: e1014, E1015: e1015 };
    }

    function getEstDetail(est) {
        return {
            E1021: E1021(est.E903, est.E716), E1022: E1022(est.E949, est.E716), E1023: E1023(est.E946, est.E716),
            E1025: E1025(est.E903, est.E709), E1026: E1026(est.E949, est.E709), E1027: E1027(est.E946, est.E709),
            E1029: E1029(est.E969, est.E716), E1030: E1030(est.E970, est.E716), E1031: E1031(est.E697, est.E716),
            E1033: E1033(est.E969, est.E709), E1034: E1034(est.E970, est.E709), E1035: E1035(est.E697, est.E709)
        };
    }

    function getRealDetail(valid, real) {
        return {
            E1041: E1041(real.E911, real.E753), E1042: E1042(real.E963, real.E753), E1043: E1043(real.E960, real.E753),
            E1045: E1045(real.E911, real.E752), E1046: E1046(real.E963, real.E752), E1047: E1047(real.E960, real.E752),
            E1049: E1049(real.E981, real.E753), E1050: E1050(real.E982, real.E753), E1051: E1051(real.E697, real.E753),
            E1053: E1053(real.E981, real.E752), E1054: E1054(real.E982, real.E752), E1055: E1055(real.E697, real.E752)
        };
    }

    function getTargetProj(rd, target, orderType) {
        const perJamDriver = rd.E1049;
        const perJamApp = rd.E1050;
        const perJamCost = rd.E1043;
        const perJamPnp = rd.E1051;
        return {
            E1061: E1061(target, perJamDriver), E1062: E1062(perJamDriver, DATA.E459),
            E1063: E1063(perJamDriver, DATA.E460), E1064: E1064(perJamDriver, DATA.E461),
            E1066: E1066(target, perJamApp, orderType), E1067: E1067(perJamApp, DATA.E459),
            E1068: E1068(perJamApp, DATA.E460), E1069: E1069(perJamApp, DATA.E461),
            E1071: E1071(target, perJamCost), E1072: E1072(perJamCost, DATA.E459),
            E1073: E1073(perJamCost, DATA.E460), E1074: E1074(perJamCost, DATA.E461),
            E1076: E1076(target, perJamPnp), E1077: E1077(perJamPnp, DATA.E459),
            E1078: E1078(perJamPnp, DATA.E460), E1079: E1079(perJamPnp, DATA.E461)
        };
    }

    function getRealProj(v, real, umr, costPerKmReal) {
        const e1085 = E1085(DATA.E464, costPerKmReal);
        const totalWaktu = v.E80 + v.E84;
        const e1086 = E1086(real.E981, e1085, totalWaktu, DATA.E462);
        const e1092 = E1092(real.E981, e1085, totalWaktu, DATA.E463);
        return {
            E1085: e1085, E1086: e1086,
            E1087: E1087(umr, e1086), E1088: E1088(e1086, DATA.E459), E1089: E1089(e1086, DATA.E460), E1090: E1090(e1086, DATA.E461),
            E1092: e1092,
            E1093: E1093(umr, e1092), E1094: E1094(e1092, DATA.E459), E1095: E1095(e1092, DATA.E460), E1096: E1096(e1092, DATA.E461)
        };
    }

    function getEstBadges(v, est) {
        return {
            E1102: E1102(est.E969, est.E970, est.E663),
            E1103: E1103(est.E971, est.E657),
            E1104: E1104(est.E713, est.E677),
            E1105: E1105(v.E58),
            E1106: E1106(v.E36, v.E10, est.E713, est.E660, est.E677),
            E1107: E1107(est.E692, DATA.E119)
        };
    }

    function getRealBadges(real, est) {
        return {
            E1112: E1112(real.E981, est.E663),
            E1113: E1113(real.E981, real.E982)
        };
    }

    function calculateAllExtras(valid, real, est) {
        const base = getExtraBase(valid, est, real);
        const comparison = getComparison(est);
        const estDetail = getEstDetail(est);
        const realDetail = getRealDetail(valid, real);
        const targetProj = getTargetProj(realDetail, base.E1002, valid.E36);
        const realProj = getRealProj(valid, real, base.E998, base.E1000);
        const estBadges = getEstBadges(valid, est);
        const realBadges = getRealBadges(real, est);
        return Object.assign({}, base, comparison, estDetail, realDetail, targetProj, realProj, estBadges, realBadges);
    }

    return {
        F_V,
        E998, E999, E1000, E1001, E1002,
        E1007, E1008, E1009, E1010, E1012, E1013, E1014, E1015,
        E1021, E1022, E1023, E1025, E1026, E1027,
        E1029, E1030, E1031, E1033, E1034, E1035,
        E1041, E1042, E1043, E1045, E1046, E1047,
        E1049, E1050, E1051, E1053, E1054, E1055,
        E1061, E1062, E1063, E1064, E1066, E1067, E1068, E1069,
        E1071, E1072, E1073, E1074, E1076, E1077, E1078, E1079,
        E1085, E1086, E1087, E1088, E1089, E1090,
        E1092, E1093, E1094, E1095, E1096,
        E1102, E1103, E1104, E1105, E1106, E1107,
        E1112, E1113,
        getExtraBase, getComparison, getEstDetail, getRealDetail,
        getTargetProj, getRealProj, getEstBadges, getRealBadges,
        calculateAllExtras
    };
})();

if (typeof window !== 'undefined') {
    window.Extra = Extra;
    console.log('[EXTRA] v' + Extra.F_V + ' dimuat');
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Extra };
}

// ================================ End Of File ================================

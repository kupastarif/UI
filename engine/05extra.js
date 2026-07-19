/**
 * =============================================================================
 * FILE        : /engine/05extra.js
 * VERSI FILE  : 1.0.1-rev0
 * ENGINE      : 1.0.1-beta
 * DATE        : 16 Juli 2026
 * AUTHOR      : gk
 *
 * DATA SOURCE : Excel "v9.7k masterapp.xlsx" — Sheet "v9.7k-All"
 *
 * DESKRIPSI   :
 *   Modul ringkasan, perbandingan, proyeksi bulanan, dan badge.
 *   Setiap sel formula dari Excel (E998, E1007, …) diimplementasikan sebagai
 *   pure function dengan signature `(temp) => value` dan properti `deps`.
 *   Tidak ada wrapper internal – orkestrasi diserahkan ke 06api.js.
 *
 * =============================================================================
 */

const Extra = (function() {
    'use strict';

    // ==================== VERSI FILE ====================
    const F_V = '1.0.1-rev0';

    // ==================== FUNGSI CELL ====================

    // ---------- BASE ----------
    /**
     * E998 - UMR sesuai area (Rp/bulan)
     * Excel: =IFS(E20="Jabodetabek",E305, E20="SumatraJawa",E306, ...)
     * @param {Object} temp
     * @returns {number}
     */
    function E998(temp) {
        const area = temp.E20;
        if (area === 'Jabodetabek') return DATA.E305;
        if (area === 'SumatraJawa') return DATA.E306;
        if (area === 'TimurIndonesia') return DATA.E307;
        return DATA.E305;
    }
    E998.deps = ['E20'];

    /**
     * E999 - biaya operasional estimasi per km (Rp/km)
     * Excel: =E946/E709
     * @param {Object} temp
     * @returns {number}
     */
    function E999(temp) {
        return temp.E946 / temp.E709;
    }
    E999.deps = ['E946', 'E709'];

    /**
     * E1000 - biaya operasional real per km (Rp/km)
     * Excel: =E960/E752
     * @param {Object} temp
     * @returns {number}
     */
    function E1000(temp) {
        return temp.E960 / temp.E752;
    }
    E1000.deps = ['E960', 'E752'];

    /**
     * E1001 - UMR per menit (Rp/menit)
     * Excel: =(E998/E465)/E295
     * @param {Object} temp
     * @returns {number}
     */
    function E1001(temp) {
        return (temp.E998 / DATA.E465) / DATA.E295;
    }
    E1001.deps = ['E998'];

    /**
     * E1002 - target pendapatan per bulan (Rp)
     * Excel: =IF(E10="Mobil",E457,E458)
     * @param {Object} temp
     * @returns {number}
     */
    function E1002(temp) {
        return temp.E10 === 'Mobil' ? DATA.E457 : DATA.E458;
    }
    E1002.deps = ['E10'];

    // ---------- PERBANDINGAN ----------
    /**
     * E1007 - setara tarif angkot real (Rp)
     * Excel: =IFS(E708<3,E168, E708<=7,E169, TRUE,E170)
     * @param {Object} temp
     * @returns {number}
     */
    function E1007(temp) {
        const jarak = temp.E708;
        if (jarak < 3) return DATA.E168;
        if (jarak <= 7) return DATA.E169;
        return DATA.E170;
    }
    E1007.deps = ['E708'];

    /**
     * E1008 - jumlah penumpang angkot real
     * Excel: =IF(E662="4seat",E166,E167)
     * @param {Object} temp
     * @returns {number}
     */
    function E1008(temp) {
        return temp.E662 === '4seat' ? DATA.E166 : DATA.E167;
    }
    E1008.deps = ['E662'];

    /**
     * E1009 - konversi tarif angkot per km (Rp/km)
     * Excel: =(E1007*E1008)/E708
     * @param {Object} temp
     * @returns {number}
     */
    function E1009(temp) {
        return (temp.E1007 * temp.E1008) / temp.E708;
    }
    E1009.deps = ['E1007', 'E1008', 'E708'];

    /**
     * E1010 - persentase selisih dengan angkot (%)
     * Excel: =(E713-E1009)/E1009
     * @param {Object} temp
     * @returns {number}
     */
    function E1010(temp) {
        return (temp.E713 - temp.E1009) / temp.E1009;
    }
    E1010.deps = ['E713', 'E1009'];

    /**
     * E1012 - setara tarif transjakarta (Rp) - diambil tarif jam sibuk
     * Excel: =E177
     * @param {Object} temp
     * @returns {number}
     */
    function E1012(temp) {
        return DATA.E177;
    }
    E1012.deps = [];

    /**
     * E1013 - jumlah penumpang transjakarta
     * Excel: =E183
     * @param {Object} temp
     * @returns {number}
     */
    function E1013(temp) {
        return DATA.E183;
    }
    E1013.deps = [];

    /**
     * E1014 - konversi tarif transjakarta per km (Rp/km)
     * Excel: =(E1012*E1013)/E179
     * @param {Object} temp
     * @returns {number}
     */
    function E1014(temp) {
        return (temp.E1012 * temp.E1013) / DATA.E179;
    }
    E1014.deps = ['E1012', 'E1013'];

    /**
     * E1015 - persentase selisih dengan transjakarta (%)
     * Excel: =(E713-E1014)/E1014
     * @param {Object} temp
     * @returns {number}
     */
    function E1015(temp) {
        return (temp.E713 - temp.E1014) / temp.E1014;
    }
    E1015.deps = ['E713', 'E1014'];

    // ---------- ESTIMATE DETAIL ----------
    /**
     * E1021 - biaya BBM per menit estimasi
     * Excel: =E903/E716
     */
    function E1021(temp) { return temp.E903 / temp.E716; }
    E1021.deps = ['E903', 'E716'];

    /**
     * E1022 - biaya non-BBM per menit estimasi
     * Excel: =E949/E716
     */
    function E1022(temp) { return temp.E949 / temp.E716; }
    E1022.deps = ['E949', 'E716'];

    /**
     * E1023 - biaya operasional per menit estimasi
     * Excel: =E946/E716
     */
    function E1023(temp) { return temp.E946 / temp.E716; }
    E1023.deps = ['E946', 'E716'];

    /**
     * E1025 - biaya BBM per km estimasi
     * Excel: =E903/E709
     */
    function E1025(temp) { return temp.E903 / temp.E709; }
    E1025.deps = ['E903', 'E709'];

    /**
     * E1026 - biaya non-BBM per km estimasi
     * Excel: =E949/E709
     */
    function E1026(temp) { return temp.E949 / temp.E709; }
    E1026.deps = ['E949', 'E709'];

    /**
     * E1027 - biaya operasional per km estimasi
     * Excel: =E946/E709
     */
    function E1027(temp) { return temp.E946 / temp.E709; }
    E1027.deps = ['E946', 'E709'];

    /**
     * E1029 - pendapatan driver per menit estimasi
     * Excel: =E969/E716
     */
    function E1029(temp) { return temp.E969 / temp.E716; }
    E1029.deps = ['E969', 'E716'];

    /**
     * E1030 - pendapatan aplikasi per menit estimasi
     * Excel: =E970/E716
     */
    function E1030(temp) { return temp.E970 / temp.E716; }
    E1030.deps = ['E970', 'E716'];

    /**
     * E1031 - biaya penumpang per menit estimasi
     * Excel: =E697/E716
     */
    function E1031(temp) { return temp.E697 / temp.E716; }
    E1031.deps = ['E697', 'E716'];

    /**
     * E1033 - pendapatan driver per km estimasi
     * Excel: =E969/E709
     */
    function E1033(temp) { return temp.E969 / temp.E709; }
    E1033.deps = ['E969', 'E709'];

    /**
     * E1034 - pendapatan aplikasi per km estimasi
     * Excel: =E970/E709
     */
    function E1034(temp) { return temp.E970 / temp.E709; }
    E1034.deps = ['E970', 'E709'];

    /**
     * E1035 - pembayaran penumpang per km estimasi
     * Excel: =E697/E709
     */
    function E1035(temp) { return temp.E697 / temp.E709; }
    E1035.deps = ['E697', 'E709'];

    // ---------- REALITY DETAIL ----------
    /**
     * E1041 - biaya BBM per menit real
     * Excel: =E911/E753
     */
    function E1041(temp) { return temp.E911 / temp.E753; }
    E1041.deps = ['E911', 'E753'];

    /**
     * E1042 - biaya non-BBM per menit real
     * Excel: =E963/E753
     */
    function E1042(temp) { return temp.E963 / temp.E753; }
    E1042.deps = ['E963', 'E753'];

    /**
     * E1043 - biaya operasional per menit real
     * Excel: =E960/E753
     */
    function E1043(temp) { return temp.E960 / temp.E753; }
    E1043.deps = ['E960', 'E753'];

    /**
     * E1045 - biaya BBM per km real
     * Excel: =E911/E752
     */
    function E1045(temp) { return temp.E911 / temp.E752; }
    E1045.deps = ['E911', 'E752'];

    /**
     * E1046 - biaya non-BBM per km real
     * Excel: =E963/E752
     */
    function E1046(temp) { return temp.E963 / temp.E752; }
    E1046.deps = ['E963', 'E752'];

    /**
     * E1047 - biaya operasional per km real
     * Excel: =E960/E752
     */
    function E1047(temp) { return temp.E960 / temp.E752; }
    E1047.deps = ['E960', 'E752'];

    /**
     * E1049 - pendapatan driver per menit real
     * Excel: =E981/E753
     */
    function E1049(temp) { return temp.E981 / temp.E753; }
    E1049.deps = ['E981', 'E753'];

    /**
     * E1050 - pendapatan aplikasi per menit real
     * Excel: =E982/E753
     */
    function E1050(temp) { return temp.E982 / temp.E753; }
    E1050.deps = ['E982', 'E753'];

    /**
     * E1051 - biaya penumpang per menit real
     * Excel: =E697/E753
     */
    function E1051(temp) { return temp.E697 / temp.E753; }
    E1051.deps = ['E697', 'E753'];

    /**
     * E1053 - pendapatan driver per km real
     * Excel: =E981/E752
     */
    function E1053(temp) { return temp.E981 / temp.E752; }
    E1053.deps = ['E981', 'E752'];

    /**
     * E1054 - pendapatan aplikasi per km real
     * Excel: =E982/E752
     */
    function E1054(temp) { return temp.E982 / temp.E752; }
    E1054.deps = ['E982', 'E752'];

    /**
     * E1055 - pembayaran penumpang per km real
     * Excel: =E697/E752
     */
    function E1055(temp) { return temp.E697 / temp.E752; }
    E1055.deps = ['E697', 'E752'];

    // ---------- TARGET PROYEKSI ----------
    /**
     * E1061 - pendapatan driver sebulan target (jam)
     * Excel: =((E1002/E1049)/E295)/E300
     */
    function E1061(temp) {
        return ((temp.E1002 / temp.E1049) / DATA.E295) / DATA.E300;
    }
    E1061.deps = ['E1002', 'E1049'];

    /**
     * E1062 - pendapatan driver sampingan (Rp/bulan)
     */
    function E1062(temp) {
        return ((temp.E1049 * DATA.E295) * DATA.E459) * DATA.E300;
    }
    E1062.deps = ['E1049'];

    /**
     * E1063 - pendapatan driver fulltime (Rp/bulan)
     */
    function E1063(temp) {
        return ((temp.E1049 * DATA.E295) * DATA.E460) * DATA.E300;
    }
    E1063.deps = ['E1049'];

    /**
     * E1064 - pendapatan driver lembur (Rp/bulan)
     */
    function E1064(temp) {
        return ((temp.E1049 * DATA.E295) * DATA.E461) * DATA.E300;
    }
    E1064.deps = ['E1049'];

    /**
     * E1066 - pendapatan aplikasi sebulan target (jam)
     * Excel: =IF(E36="offline",0, ((E1002/E1050)/E295)/E300)
     */
    function E1066(temp) {
        if (temp.E36 === 'offline') return 0;
        return ((temp.E1002 / temp.E1050) / DATA.E295) / DATA.E300;
    }
    E1066.deps = ['E36', 'E1002', 'E1050'];

    /**
     * E1067 - pendapatan aplikasi sampingan (Rp/bulan)
     */
    function E1067(temp) {
        return ((temp.E1050 * DATA.E295) * DATA.E459) * DATA.E300;
    }
    E1067.deps = ['E1050'];

    /**
     * E1068 - pendapatan aplikasi fulltime (Rp/bulan)
     */
    function E1068(temp) {
        return ((temp.E1050 * DATA.E295) * DATA.E460) * DATA.E300;
    }
    E1068.deps = ['E1050'];

    /**
     * E1069 - pendapatan aplikasi lembur (Rp/bulan)
     */
    function E1069(temp) {
        return ((temp.E1050 * DATA.E295) * DATA.E461) * DATA.E300;
    }
    E1069.deps = ['E1050'];

    /**
     * E1071 - biaya perjalanan sebulan target (jam)
     */
    function E1071(temp) {
        return ((temp.E1002 / temp.E1043) / DATA.E295) / DATA.E300;
    }
    E1071.deps = ['E1002', 'E1043'];

    /**
     * E1072 - biaya perjalanan sampingan (Rp/bulan)
     */
    function E1072(temp) {
        return ((temp.E1043 * DATA.E295) * DATA.E459) * DATA.E300;
    }
    E1072.deps = ['E1043'];

    /**
     * E1073 - biaya perjalanan fulltime (Rp/bulan)
     */
    function E1073(temp) {
        return ((temp.E1043 * DATA.E295) * DATA.E460) * DATA.E300;
    }
    E1073.deps = ['E1043'];

    /**
     * E1074 - biaya perjalanan lembur (Rp/bulan)
     */
    function E1074(temp) {
        return ((temp.E1043 * DATA.E295) * DATA.E461) * DATA.E300;
    }
    E1074.deps = ['E1043'];

    /**
     * E1076 - biaya penumpang sebulan target (jam)
     */
    function E1076(temp) {
        return ((temp.E1002 / temp.E1051) / DATA.E295) / DATA.E300;
    }
    E1076.deps = ['E1002', 'E1051'];

    /**
     * E1077 - biaya penumpang sampingan (Rp/bulan)
     */
    function E1077(temp) {
        return ((temp.E1051 * DATA.E295) * DATA.E459) * DATA.E300;
    }
    E1077.deps = ['E1051'];

    /**
     * E1078 - biaya penumpang fulltime (Rp/bulan)
     */
    function E1078(temp) {
        return ((temp.E1051 * DATA.E295) * DATA.E460) * DATA.E300;
    }
    E1078.deps = ['E1051'];

    /**
     * E1079 - biaya penumpang lembur (Rp/bulan)
     */
    function E1079(temp) {
        return ((temp.E1051 * DATA.E295) * DATA.E461) * DATA.E300;
    }
    E1079.deps = ['E1051'];

    // ---------- REALISTIS PROYEKSI ----------
    /**
     * E1085 - gross modal geser posisi
     * Excel: =E464*E1000
     */
    function E1085(temp) {
        return DATA.E464 * temp.E1000;
    }
    E1085.deps = ['E1000'];

    /**
     * E1086 - pendapatan driver vendor per menit realistis
     * Excel: =(E981-E1085)/(E80+E84+E462)
     */
    function E1086(temp) {
        const totalWaktu = temp.E80 + temp.E84;
        return (temp.E981 - temp.E1085) / (totalWaktu + DATA.E462);
    }
    E1086.deps = ['E80', 'E84', 'E981', 'E1085'];

    /**
     * E1087 - pendapatan vendor sebulan UMR (jam)
     * Excel: =((E998/E1086)/E295)/E300
     */
    function E1087(temp) {
        return ((temp.E998 / temp.E1086) / DATA.E295) / DATA.E300;
    }
    E1087.deps = ['E998', 'E1086'];

    /**
     * E1088 - pendapatan vendor sampingan (Rp/bulan)
     */
    function E1088(temp) {
        return ((temp.E1086 * DATA.E295) * DATA.E459) * DATA.E300;
    }
    E1088.deps = ['E1086'];

    /**
     * E1089 - pendapatan vendor fulltime (Rp/bulan)
     */
    function E1089(temp) {
        return ((temp.E1086 * DATA.E295) * DATA.E460) * DATA.E300;
    }
    E1089.deps = ['E1086'];

    /**
     * E1090 - pendapatan vendor lembur (Rp/bulan)
     */
    function E1090(temp) {
        return ((temp.E1086 * DATA.E295) * DATA.E461) * DATA.E300;
    }
    E1090.deps = ['E1086'];

    /**
     * E1092 - pendapatan driver individu per menit realistis
     * Excel: =(E981-E1085)/(E80+E84+E463)
     */
    function E1092(temp) {
        const totalWaktu = temp.E80 + temp.E84;
        return (temp.E981 - temp.E1085) / (totalWaktu + DATA.E463);
    }
    E1092.deps = ['E80', 'E84', 'E981', 'E1085'];

    /**
     * E1093 - pendapatan individu sebulan UMR (jam)
     * Excel: =((E998/E1092)/E295)/E300
     */
    function E1093(temp) {
        return ((temp.E998 / temp.E1092) / DATA.E295) / DATA.E300;
    }
    E1093.deps = ['E998', 'E1092'];

    /**
     * E1094 - pendapatan individu sampingan (Rp/bulan)
     */
    function E1094(temp) {
        return ((temp.E1092 * DATA.E295) * DATA.E459) * DATA.E300;
    }
    E1094.deps = ['E1092'];

    /**
     * E1095 - pendapatan individu fulltime (Rp/bulan)
     */
    function E1095(temp) {
        return ((temp.E1092 * DATA.E295) * DATA.E460) * DATA.E300;
    }
    E1095.deps = ['E1092'];

    /**
     * E1096 - pendapatan individu lembur (Rp/bulan)
     */
    function E1096(temp) {
        return ((temp.E1092 * DATA.E295) * DATA.E461) * DATA.E300;
    }
    E1096.deps = ['E1092'];

    // ---------- BADGES ----------
    /**
     * E1102 - badge estimate net driver
     * Excel: =IFS(E969<0,"wkwkwk", E970>=E969,"warning", E969<E663,"warning", TRUE,"aman")
     * @param {Object} temp
     * @returns {string}
     */
    function E1102(temp) {
        if (temp.E969 < 0) return 'wkwkwk';
        if (temp.E970 >= temp.E969) return 'warning';
        if (temp.E969 < temp.E663) return 'warning';
        return 'aman';
    }
    E1102.deps = ['E969', 'E970', 'E663'];

    /**
     * E1103 - badge estimate up/down app
     * Excel: =IF(E971>=E657,"up","down")
     * @param {Object} temp
     * @returns {string}
     */
    function E1103(temp) {
        return temp.E971 >= temp.E657 ? 'up' : 'down';
    }
    E1103.deps = ['E971', 'E657'];

    /**
     * E1104 - badge estimate blink tarif
     * Excel: =IF(E713<E677,"danger","success")
     * @param {Object} temp
     * @returns {string}
     */
    function E1104(temp) {
        return temp.E713 < temp.E677 ? 'danger' : 'success';
    }
    E1104.deps = ['E713', 'E677'];

    /**
     * E1105 - badge estimate jarak hide
     * Excel: =IF(E58>0,"","blind")
     * @param {Object} temp
     * @returns {string} '' jika jarak > 0, 'blind' jika 0 atau null/undefined
     */
    function E1105(temp) {
        const jarak = temp.E58;
        if (jarak == null) return 'blind';
        return jarak > 0 ? '' : 'blind';
    }
    E1105.deps = ['E58'];

    /**
     * E1106 - tipe kenaikan tarif
     * Excel: =IF(E36="online","app",IF(E10="Mobil",IFS(...),IFS(...)))
     * @param {Object} temp
     * @returns {string}
     */
    function E1106(temp) {
        const orderType = temp.E36;
        const mode = temp.E10;
        const tarifJarak = temp.E713;
        const tarifMinZona = temp.E660;
        const tarifDasarOff = temp.E677;
        if (orderType === 'online') return 'app';
        if (mode === 'Mobil') {
            if (tarifJarak < tarifMinZona) return 'abnormal';
            if (tarifJarak <= tarifMinZona * 1.3) return 'minimal';
            if (tarifJarak <= tarifDasarOff * 1.3) return 'wajar';
            return 'waktu';
        } else {
            if (tarifJarak < tarifMinZona) return 'abnormal';
            if (tarifJarak <= tarifMinZona * 1.25) return 'minimal';
            if (tarifJarak <= tarifDasarOff * 1.25) return 'wajar';
            return 'waktu';
        }
    }
    E1106.deps = ['E36', 'E10', 'E713', 'E660', 'E677'];

    /**
     * E1107 - tipe biaya aplikasi
     * Excel: =IF(E692>E119,"serakah","wajar")
     * @param {Object} temp
     * @returns {string}
     */
    function E1107(temp) {
        return temp.E692 > DATA.E119 ? 'serakah' : 'wajar';
    }
    E1107.deps = ['E692'];

    /**
     * E1112 - tracking driver value live real
     * Excel: =IFS(E981<0,"wkwkwk", E981<E663*0.5,"kritis", ...)
     * @param {Object} temp
     * @returns {string}
     */
    function E1112(temp) {
        const pendapatan = temp.E981;
        const minimum = temp.E663;
        if (pendapatan < 0) return 'wkwkwk';
        if (pendapatan < minimum * 0.5) return 'kritis';
        if (pendapatan < minimum * 0.75) return 'rendah';
        if (pendapatan < minimum) return 'cukup';
        if (pendapatan < minimum * 2) return 'normal';
        return 'bagus';
    }
    E1112.deps = ['E981', 'E663'];

    /**
     * E1113 - app sarcasm badge
     * Excel: =IFS(E981<0,"wkwkwk", E982>E981*2,"sedekah", ...)
     * @param {Object} temp
     * @returns {string}
     */
    function E1113(temp) {
        const pendapatanDriver = temp.E981;
        const pendapatanAplikasi = temp.E982;
        if (pendapatanDriver < 0) return 'wkwkwk';
        if (pendapatanAplikasi > pendapatanDriver * 2) return 'sedekah';
        if (pendapatanAplikasi > pendapatanDriver) return 'serakah';
        if (pendapatanDriver > pendapatanAplikasi * 1.5) return 'ajaib';
        if (pendapatanDriver > pendapatanAplikasi) return 'biasa';
        return 'imbang';
    }
    E1113.deps = ['E981', 'E982'];

    // ==================== EKSPOR ====================
    return {
        F_V,

        // Semua fungsi sel
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
        E1112, E1113
    };
})();

if (typeof window !== 'undefined') {
    window.Extra = Extra;
    console.log('[EXTRA] v' + Extra.F_V + ' dimuat');
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Extra };
}

// ================================= CHANGELOG =================================
// 1.0.1-rev0 : Seluruh fungsi sel diubah menjadi (temp) => value + properti
//              deps. Wrapper internal dihapus. Parameter buatan dihilangkan.
//              Komentar tetap merujuk ke sel Excel untuk sinkronisasi.
// ================================ End Of File ================================
/**
 * =============================================================================
 * FILE        : /engine/03fare.js
 * VERSI FILE  : 1.0.1-rev0
 * ENGINE      : 1.0.1-beta
 * DATE        : 16 Juli 2026
 * AUTHOR      : gk
 *
 * DATA SOURCE : Excel "v9.7k masterapp.xlsx" — Sheet "v9.7k-All"
 *
 * DESKRIPSI   :
 *   Modul kalkulasi tarif (fare) berbasis objek kalkulasi sementara `temp`.
 *   Setiap sel formula dari Excel (E655, E656, …) diimplementasikan sebagai
 *   pure function dengan signature `(temp) => value` dan properti `deps`
 *   yang mendeklarasikan sel‑sel lain yang diperlukan.
 *   Semua wrapper internal dihapus — orkestrasi dilakukan oleh 06api.js.
 *
 * CATATAN     :
 *   - Seluruh akses ke konstanta diambil dari DATA (global).
 *   - `temp.E71` (uiStateE71) disediakan oleh wrapper untuk mode offline "app".
 *   - Fallback `temp.E71` ke `temp.E677` jika bukan number tetap dipertahankan.
 *   - Komentar pada setiap fungsi sel merujuk langsung ke sel Excel untuk
 *     memudahkan sinkronisasi.
 * =============================================================================
 */

const Fare = (function() {
    'use strict';

    // ==================== VERSI FILE ====================
    const F_V = '1.0.1-rev0';

    // ==================== FUNGSI CELL ====================

    /**
     * E655 - Persentase aplikasi (komisi per layanan)
     * Excel: =IF(E10="Mobil", IFS(...), IF(E10="Motor", IFS(...), E201))
     * @param {Object} temp - objek kalkulasi sementara
     * @returns {number}
     */
    function E655(temp) {
        const mode = temp.E10;
        const layanan = temp.E46;
        if (mode === 'Mobil') {
            const map = {
                'Hemat': DATA.E200, 'Standar': DATA.E201, 'XL': DATA.E202,
                'Prioritas': DATA.E203, 'Premium': DATA.E204, 'Premium XL': DATA.E205
            };
            return map[layanan] !== undefined ? map[layanan] : DATA.E201;
        } else if (mode === 'Motor') {
            const map = {
                'Hemat': DATA.E210, 'Standar': DATA.E211, 'XL': DATA.E212,
                'Prioritas': DATA.E213, 'Premium': DATA.E214, 'Premium XL': DATA.E215
            };
            return map[layanan] !== undefined ? map[layanan] : DATA.E211;
        }
        return DATA.E201; // fallback
    }
    E655.deps = ['E10', 'E46'];

    /**
     * E656 - Persentase driver tapi aplikasi (kesejahteraan)
     * Excel: =IF(E10="Mobil", IFS(...), IF(E10="Motor", IFS(...), E221))
     * @param {Object} temp
     * @returns {number}
     */
    function E656(temp) {
        const mode = temp.E10;
        const layanan = temp.E46;
        if (mode === 'Mobil') {
            const map = {
                'Hemat': DATA.E220, 'Standar': DATA.E221, 'XL': DATA.E222,
                'Prioritas': DATA.E223, 'Premium': DATA.E224, 'Premium XL': DATA.E225
            };
            return map[layanan] !== undefined ? map[layanan] : DATA.E221;
        } else if (mode === 'Motor') {
            const map = {
                'Hemat': DATA.E230, 'Standar': DATA.E231, 'XL': DATA.E232,
                'Prioritas': DATA.E233, 'Premium': DATA.E234, 'Premium XL': DATA.E235
            };
            return map[layanan] !== undefined ? map[layanan] : DATA.E231;
        }
        return DATA.E221;
    }
    E656.deps = ['E10', 'E46'];

    /**
     * E657 - Total persentase aplikasi
     * Excel: =E655+E656
     * @param {Object} temp
     * @returns {number}
     */
    function E657(temp) {
        return temp.E655 + temp.E656;
    }
    E657.deps = ['E655', 'E656'];

    /**
     * E658 - Persentase driver
     * Excel: =1-E657
     * @param {Object} temp
     * @returns {number}
     */
    function E658(temp) {
        return 1 - temp.E657;
    }
    E658.deps = ['E657'];

    /**
     * E659 - Harga energi (BBM/Listrik)
     * Excel: =IFS(E24="Pertalite",E302,...)
     * @param {Object} temp
     * @returns {number} Rp/liter atau Rp/kWh
     */
    function E659(temp) {
        const bbm = temp.E24;
        const map = {
            'Pertalite': DATA.E302,
            'Bio Solar': DATA.E303,
            'SPKLU+': DATA.E308,
            'Swap Battery': DATA.E309,
            'Pertamax': DATA.E304
        };
        return map[bbm] !== undefined ? map[bbm] : DATA.E302;
    }
    E659.deps = ['E24'];

    /**
     * E660 - Tarif minimum zona
     * Excel: =IFS(AND(E10="Mobil",E20="Jabodetabek"),E124,...)
     * @param {Object} temp
     * @returns {number} Rp/km
     */
    function E660(temp) {
        const mode = temp.E10;
        const area = temp.E20;
        if (mode === 'Mobil') {
            if (area === 'Jabodetabek') return DATA.E124;
            if (area === 'SumatraJawa') return DATA.E125;
            if (area === 'TimurIndonesia') return DATA.E126;
            return DATA.E124;
        } else if (mode === 'Motor') {
            if (area === 'Jabodetabek') return DATA.E140;
            if (area === 'SumatraJawa') return DATA.E141;
            if (area === 'TimurIndonesia') return DATA.E142;
            return DATA.E140;
        }
        return DATA.E124;
    }
    E660.deps = ['E10', 'E20'];

    /**
     * E661 - Tarif min driver (setelah potongan)
     * Excel: =E660-(E660*E657)
     * @param {Object} temp
     * @returns {number} Rp/km
     */
    function E661(temp) {
        return temp.E660 - (temp.E660 * temp.E657);
    }
    E661.deps = ['E660', 'E657'];

    /**
     * E662 - Tipe seat ("4seat" atau "6seat")
     * Excel: =IF(OR(E46="XL",E46="Premium XL"),"6seat","4seat")
     * @param {Object} temp
     * @returns {string}
     */
    function E662(temp) {
        const layanan = temp.E46;
        return (layanan === 'XL' || layanan === 'Premium XL') ? '6seat' : '4seat';
    }
    E662.deps = ['E46'];

    /**
     * E663 - Omset minimum (Rp)
     * Excel: =IF(E10="Mobil",E274,E275)
     * @param {Object} temp
     * @returns {number}
     */
    function E663(temp) {
        return temp.E10 === 'Mobil' ? DATA.E274 : DATA.E275;
    }
    E663.deps = ['E10'];

    /**
     * E668 - Persen tarif layanan (markup)
     * Excel: =IFS(E46="Hemat",E285,...)
     * @param {Object} temp
     * @returns {number}
     */
    function E668(temp) {
        const layanan = temp.E46;
        const map = {
            'Hemat': DATA.E285,
            'Standar': DATA.E286,
            'XL': DATA.E287,
            'Prioritas': DATA.E288,
            'Premium': DATA.E289,
            'Premium XL': DATA.E290
        };
        return map[layanan] !== undefined ? map[layanan] : DATA.E286;
    }
    E668.deps = ['E46'];

    /**
     * E669 - Tarif layanan (E660 + markup)
     * Excel: =E660+(E660*E668)
     * @param {Object} temp
     * @returns {number} Rp/km
     */
    function E669(temp) {
        return temp.E660 + (temp.E660 * temp.E668);
    }
    E669.deps = ['E660', 'E668'];

    /**
     * E670 - Tarif layanan minimum driver
     * Excel: =E669-(E669*E657)
     * @param {Object} temp
     * @returns {number} Rp/km
     */
    function E670(temp) {
        return temp.E669 - (temp.E669 * temp.E657);
    }
    E670.deps = ['E669', 'E657'];

    /**
     * E671 - Estimasi rerata waktu jemput (menit)
     * Excel: =E268+E269
     * @param {Object} temp
     * @returns {number}
     */
    function E671(temp) {
        return DATA.E268 + DATA.E269;
    }
    E671.deps = [];

    /**
     * E677 - Tarif dasar offline (Rp/km)
     * Excel: =IF(E10="Mobil",E133,E149)
     * @param {Object} temp
     * @returns {number}
     */
    function E677(temp) {
        return temp.E10 === 'Mobil' ? DATA.E133 : DATA.E149;
    }
    E677.deps = ['E10'];

    /**
     * E678 - Tarif offline yang diterapkan
     * Excel: =IFS(AND(E10="Mobil",E38="wajar"),E660+(E660*E40), ...)
     * Mode "app" mengambil dari E71 (uiStateE71).
     * Fallback ke E677 jika E71 bukan number.
     * @param {Object} temp
     * @returns {number} Rp/km
     */
    function E678(temp) {
        const mode = temp.E10;
        const tipe = temp.E38;
        const e660 = temp.E660;
        const e661 = temp.E661;
        const e677 = temp.E677;
        const e40 = temp.E40;

        if (mode === 'Mobil') {
            if (tipe === 'wajar') return e660 + (e660 * e40);
            if (tipe === 'minimal') return e660;
            if (tipe === 'abnormal') return e661;
            if (tipe === 'app') return (typeof temp.E71 === 'number') ? temp.E71 : e677;
        } else if (mode === 'Motor') {
            if (tipe === 'wajar') return e660 + (e660 * e40);
            if (tipe === 'minimal') return e660;
            if (tipe === 'abnormal') return e661;
            if (tipe === 'app') return (typeof temp.E71 === 'number') ? temp.E71 : e677;
        }
        return e677;
    }
    E678.deps = ['E10', 'E38', 'E660', 'E661', 'E677', 'E40', 'E71'];

    /**
     * E679 - Tarif layanan offline (setelah markup)
     * Excel: =E678+(E678*E668)
     * @param {Object} temp
     * @returns {number} Rp/km
     */
    function E679(temp) {
        return temp.E678 + (temp.E678 * temp.E668);
    }
    E679.deps = ['E678', 'E668'];

    /**
     * E680 - Tarif waktu offline (Rp/menit)
     * Excel: =IF(E10="Mobil", E134 + MAX(0, E68 - E265) * E263, ...)
     * @param {Object} temp
     * @returns {number}
     */
    function E680(temp) {
        const mode = temp.E10;
        const jarakOff = temp.E68;
        if (mode === 'Mobil') {
            return DATA.E134 + Math.max(0, jarakOff - DATA.E265) * DATA.E263;
        } else {
            return DATA.E150 + Math.max(0, jarakOff - DATA.E265) * DATA.E264;
        }
    }
    E680.deps = ['E10', 'E68'];

    // --- FUNGSI ONLINE / OFFLINE UMUM ---

    /**
     * E692 - Biaya aplikasi penumpang estimasi
     * Online: sesuai layanan; Offline: 0
     * @param {Object} temp
     * @returns {number} Rp
     */
    function E692(temp) {
        if (temp.E36 === 'offline') return 0;
        const mode = temp.E10;
        const layanan = temp.E46;
        const map = {
            Mobil: { Hemat: DATA.E127, Standar: DATA.E128, XL: DATA.E129, Prioritas: DATA.E130, Premium: DATA.E131, 'Premium XL': DATA.E132 },
            Motor: { Hemat: DATA.E143, Standar: DATA.E144, XL: DATA.E145, Prioritas: DATA.E146, Premium: DATA.E147, 'Premium XL': DATA.E148 }
        };
        const modeMap = map[mode];
        if (modeMap && modeMap[layanan] !== undefined) return modeMap[layanan];
        return mode === 'Motor' ? DATA.E144 : DATA.E128;
    }
    E692.deps = ['E36', 'E10', 'E46'];

    /**
     * E693 - Biaya aplikasi penumpang REAL
     * Online: input E92 jika ada, else E692; Offline: 0
     * @param {Object} temp
     * @returns {number} Rp
     */
    function E693(temp) {
        if (temp.E36 === 'offline') return 0;
        if (typeof temp.E92 === 'number' && temp.E92 !== 0) return temp.E92;
        return temp.E692;
    }
    E693.deps = ['E36', 'E92', 'E692'];

    /**
     * E694 - Fare Mdriver (sebelum potongan)
     * Online: E56/(1-E657); Offline: E686
     * @param {Object} temp
     * @returns {number} Rp
     */
    function E694(temp) {
        if (temp.E36 === 'offline') return temp.E686;
        return temp.E56 / (1 - temp.E657);
    }
    E694.deps = ['E36', 'E56', 'E657', 'E686'];

    /**
     * E695 - Potongan aplikasi Mdriver
     * Online: E694 - E56; Offline: 0
     * @param {Object} temp
     * @returns {number} Rp
     */
    function E695(temp) {
        if (temp.E36 === 'offline') return 0;
        return temp.E694 - temp.E56;
    }
    E695.deps = ['E36', 'E694', 'E56'];

    /**
     * E696 - Total dibayarkan penumpang estimasi
     * Online: E56 + E692 + E695; Offline: E687
     * @param {Object} temp
     * @returns {number} Rp
     */
    function E696(temp) {
        if (temp.E36 === 'offline') return temp.E687;
        return temp.E56 + temp.E692 + temp.E695;
    }
    E696.deps = ['E36', 'E56', 'E692', 'E695', 'E687'];

    /**
     * E697 - Total dibayarkan penumpang ditetapkan
     * Online: Driver?E696:E54; Offline: E687
     * @param {Object} temp
     * @returns {number} Rp
     */
    function E697(temp) {
        if (temp.E36 === 'offline') return temp.E687;
        return (temp.E12 === 'Driver') ? temp.E696 : temp.E54;
    }
    E697.deps = ['E36', 'E687', 'E12', 'E696', 'E54'];

    /**
     * E698 - Fare penumpang setelah biaya aplikasi
     * Online: E697 - E693; Offline: E697 - E684
     * @param {Object} temp
     * @returns {number} Rp
     */
    function E698(temp) {
        const e697 = temp.E697;
        return (temp.E36 === 'offline') ? e697 - temp.E684 : e697 - temp.E693;
    }
    E698.deps = ['E36', 'E697', 'E684', 'E693'];

    /**
     * E699 - Biaya aplikasi driver
     * Online: E698 * E657; Offline: 0
     * @param {Object} temp
     * @returns {number} Rp
     */
    function E699(temp) {
        if (temp.E36 === 'offline') return 0;
        return temp.E698 * temp.E657;
    }
    E699.deps = ['E36', 'E698', 'E657'];

    /**
     * E700 - Base fare diterima driver (omset)
     * Excel: =E698-E699
     * @param {Object} temp
     * @returns {number} Rp
     */
    function E700(temp) {
        return temp.E698 - temp.E699;
    }
    E700.deps = ['E698', 'E699'];

    /**
     * E701 - Kesejahteraan driver tapi aplikasi
     * Online: E698 * E656; Offline: 0
     * @param {Object} temp
     * @returns {number} Rp
     */
    function E701(temp) {
        if (temp.E36 === 'offline') return 0;
        return temp.E656 * temp.E698;
    }
    E701.deps = ['E36', 'E656', 'E698'];

    /**
     * E706 - Jarak antar order hide (km)
     * Online: (E698/E669) / (1 + E60/100); Offline: E697 / E679
     * @param {Object} temp
     * @returns {number}
     */
    function E706(temp) {
        if (temp.E36 === 'offline') return temp.E697 / temp.E679;
        return (temp.E698 / temp.E669) / (1 + temp.E60 / 100);
    }
    E706.deps = ['E36', 'E697', 'E679', 'E698', 'E669', 'E60'];

    /**
     * E707 - Jarak antar order ditetapkan
     * Online: E58>0 ? E58 : E706; Offline: E68
     * @param {Object} temp
     * @returns {number} km
     */
    function E707(temp) {
        if (temp.E36 === 'offline') return temp.E68;
        return (temp.E58 > 0) ? temp.E58 : temp.E706;
    }
    E707.deps = ['E36', 'E68', 'E58', 'E706'];

    /**
     * E708 - Jarak antar order kerja (+E271)
     * Excel: =E707+E271
     * @param {Object} temp
     * @returns {number} km
     */
    function E708(temp) {
        return temp.E707 + DATA.E271;
    }
    E708.deps = ['E707'];

    /**
     * E709 - Jarak jemput antar order kerja (+E260)
     * Excel: =E707+E260
     * @param {Object} temp
     * @returns {number} km
     */
    function E709(temp) {
        return temp.E707 + DATA.E260;
    }
    E709.deps = ['E707'];

    /**
     * E713 - Tarif jarak order (Rp/km)
     * Excel: =E698/E707
     * @param {Object} temp
     * @returns {number}
     */
    function E713(temp) {
        return temp.E698 / temp.E707;
    }
    E713.deps = ['E698', 'E707'];

    /**
     * E714 - Tarif waktu order (Rp/menit)
     * Online: sesuai rumus; Offline: E680
     * @param {Object} temp
     * @returns {number}
     */
    function E714(temp) {
        if (temp.E36 === 'offline') return temp.E680;
        const e707 = temp.E707;
        if (temp.E10 === 'Motor') {
            return DATA.E262 + Math.max(0, e707 - DATA.E265) * DATA.E264;
        } else {
            return DATA.E261 + Math.max(0, e707 - DATA.E265) * DATA.E263;
        }
    }
    E714.deps = ['E36', 'E680', 'E707', 'E10'];

    /**
     * E715 - Waktu antar order (menit)
     * Excel: =E698/E714
     * @param {Object} temp
     * @returns {number}
     */
    function E715(temp) {
        return temp.E698 / temp.E714;
    }
    E715.deps = ['E698', 'E714'];

    /**
     * E716 - Waktu jemput antar order kerja (menit)
     * Excel: =E715+E671
     * @param {Object} temp
     * @returns {number}
     */
    function E716(temp) {
        return temp.E715 + temp.E671;
    }
    E716.deps = ['E715', 'E671'];

    /**
     * E717 - Kenaikan tarif dasar jarak (%)
     * Excel: =(E713-E660)/E660
     * @param {Object} temp
     * @returns {number}
     */
    function E717(temp) {
        return (temp.E713 - temp.E660) / temp.E660;
    }
    E717.deps = ['E713', 'E660'];

    /**
     * E718 - Kenaikan tarif dasar waktu (%)
     * Excel: =IF(E10="Mobil",(E714-E261)/E261,(E714-E262)/E262)
     * @param {Object} temp
     * @returns {number}
     */
    function E718(temp) {
        const e714 = temp.E714;
        return (temp.E10 === 'Mobil') ? ((e714 - DATA.E261) / DATA.E261) : ((e714 - DATA.E262) / DATA.E262);
    }
    E718.deps = ['E714', 'E10'];

    /**
     * E719 - Tipe tarif order offline ("jarak" atau "waktu")
     * Excel: =IF(E682>E683,"jarak","waktu")
     * @param {Object} temp
     * @returns {string}
     */
    function E719(temp) {
        if (temp.E36 !== 'offline') return '';
        return temp.E682 > temp.E683 ? 'jarak' : 'waktu';
    }
    E719.deps = ['E36', 'E682', 'E683'];

    // --- FUNGSI OFFLINE SPESIFIK ---

    /**
     * E682 - Fare jarak offline
     * Excel: =IF(E68<1, E679, E68*E679)
     * @param {Object} temp
     * @returns {number} Rp
     */
    function E682(temp) {
        const e68 = temp.E68;
        return (e68 < 1) ? temp.E679 : e68 * temp.E679;
    }
    E682.deps = ['E68', 'E679'];

    /**
     * E683 - Fare waktu offline
     * Excel: =E70*E680
     * @param {Object} temp
     * @returns {number} Rp
     */
    function E683(temp) {
        return temp.E70 * temp.E680;
    }
    E683.deps = ['E70', 'E680'];

    /**
     * E684 - Biaya jemput offline layanan
     * Online: 0; Offline: sesuai layanan
     * @param {Object} temp
     * @returns {number} Rp
     */
    function E684(temp) {
        if (temp.E36 === 'online') return 0;
        const mode = temp.E10;
        const layanan = temp.E46;
        const map = {
            Mobil: { Hemat: DATA.E127, Standar: DATA.E128, XL: DATA.E129, Prioritas: DATA.E130, Premium: DATA.E131, 'Premium XL': DATA.E132 },
            Motor: { Hemat: DATA.E143, Standar: DATA.E144, XL: DATA.E145, Prioritas: DATA.E146, Premium: DATA.E147, 'Premium XL': DATA.E148 }
        };
        const modeMap = map[mode];
        if (modeMap && modeMap[layanan] !== undefined) return modeMap[layanan];
        return mode === 'Motor' ? DATA.E144 : DATA.E128;
    }
    E684.deps = ['E36', 'E10', 'E46'];

    /**
     * E686 - Estimasi fare penumpang offline (max jarak/waktu)
     * Excel: =IF(E682>E683, E682, E683)
     * @param {Object} temp
     * @returns {number} Rp
     */
    function E686(temp) {
        return Math.max(temp.E682, temp.E683);
    }
    E686.deps = ['E682', 'E683'];

    /**
     * E687 - Estimasi pembayaran penumpang offline (+biaya jemput)
     * Excel: =E686+E684
     * @param {Object} temp
     * @returns {number} Rp
     */
    function E687(temp) {
        return temp.E686 + temp.E684;
    }
    E687.deps = ['E686', 'E684'];

    // --- ADJUSTMENT REALITAS ---

    /**
     * E725 - Selisih jarak jemput ideal-real (km)
     * Excel: =E260-E78
     * @param {Object} temp
     * @returns {number}
     */
    function E725(temp) {
        return DATA.E260 - temp.E78;
    }
    E725.deps = ['E78'];

    /**
     * E726 - Selisih waktu jemput ideal-real (menit)
     * Excel: =E267-E80
     * @param {Object} temp
     * @returns {number}
     */
    function E726(temp) {
        return DATA.E267 - temp.E80;
    }
    E726.deps = ['E80'];

    /**
     * E727 - Selisih jarak antar ideal-real
     * Excel: =E707-E82
     * @param {Object} temp
     * @returns {number}
     */
    function E727(temp) {
        return temp.E707 - temp.E82;
    }
    E727.deps = ['E707', 'E82'];

    /**
     * E728 - Selisih waktu antar ideal-real
     * Excel: =E715-E84
     * @param {Object} temp
     * @returns {number}
     */
    function E728(temp) {
        return temp.E715 - temp.E84;
    }
    E728.deps = ['E715', 'E84'];

    /**
     * E729 - Tagihan selisih jarak jemput
     * Excel: =E713*E725
     * @param {Object} temp
     * @returns {number} Rp
     */
    function E729(temp) {
        return temp.E713 * temp.E725;
    }
    E729.deps = ['E713', 'E725'];

    /**
     * E730 - Tagihan selisih waktu jemput
     * Excel: =E714*E726
     * @param {Object} temp
     * @returns {number} Rp
     */
    function E730(temp) {
        return temp.E714 * temp.E726;
    }
    E730.deps = ['E714', 'E726'];

    /**
     * E731 - Tagihan selisih jarak antar
     * Excel: =E713*E727
     * @param {Object} temp
     * @returns {number} Rp
     */
    function E731(temp) {
        return temp.E713 * temp.E727;
    }
    E731.deps = ['E713', 'E727'];

    /**
     * E732 - Tagihan selisih waktu antar
     * Excel: =E714*E728
     * @param {Object} temp
     * @returns {number} Rp
     */
    function E732(temp) {
        return temp.E714 * temp.E728;
    }
    E732.deps = ['E714', 'E728'];

    /**
     * E738 - Ditagih selisih jarak jemput (>=0)
     * Excel: =IF(E729<0, ABS(E729), 0)
     * @param {Object} temp
     * @returns {number} Rp
     */
    function E738(temp) {
        const val = temp.E729;
        return val < 0 ? Math.abs(val) : 0;
    }
    E738.deps = ['E729'];

    /**
     * E739 - Ditagih selisih waktu jemput
     * @param {Object} temp
     * @returns {number} Rp
     */
    function E739(temp) {
        const val = temp.E730;
        return val < 0 ? Math.abs(val) : 0;
    }
    E739.deps = ['E730'];

    /**
     * E740 - Ditagih selisih jarak antar
     * @param {Object} temp
     * @returns {number} Rp
     */
    function E740(temp) {
        const val = temp.E731;
        return val < 0 ? Math.abs(val) : 0;
    }
    E740.deps = ['E731'];

    /**
     * E741 - Ditagih selisih waktu antar
     * @param {Object} temp
     * @returns {number} Rp
     */
    function E741(temp) {
        const val = temp.E732;
        return val < 0 ? Math.abs(val) : 0;
    }
    E741.deps = ['E732'];

    /**
     * E742 - Ditagih jemput (max E738, E739)
     * Excel: =IF(E738>E739, E738, E739)
     * @param {Object} temp
     * @returns {number} Rp
     */
    function E742(temp) {
        return Math.max(temp.E738, temp.E739);
    }
    E742.deps = ['E738', 'E739'];

    /**
     * E743 - Ditagih antar (max E740, E741)
     * @param {Object} temp
     * @returns {number} Rp
     */
    function E743(temp) {
        return Math.max(temp.E740, temp.E741);
    }
    E743.deps = ['E740', 'E741'];

    /**
     * E744 - Total biaya tambahan (parkir + tol + lainnya)
     * Excel: =E100+E102+E104
     * @param {Object} temp
     * @returns {number} Rp
     */
    function E744(temp) {
        return temp.E100 + temp.E102 + temp.E104;
    }
    E744.deps = ['E100', 'E102', 'E104'];

    /**
     * E745 - Ditagih total (jemput + antar)
     * Excel: =E742+E743
     * @param {Object} temp
     * @returns {number} Rp
     */
    function E745(temp) {
        return temp.E742 + temp.E743;
    }
    E745.deps = ['E742', 'E743'];

    /**
     * E746 - Ditagih total plus (E745 + E744)
     * @param {Object} temp
     * @returns {number} Rp
     */
    function E746(temp) {
        return temp.E745 + temp.E744;
    }
    E746.deps = ['E745', 'E744'];

    /**
     * E752 - Total jarak jemput-antar real
     * Excel: =E78+E82
     * @param {Object} temp
     * @returns {number} km
     */
    function E752(temp) {
        return temp.E78 + temp.E82;
    }
    E752.deps = ['E78', 'E82'];

    /**
     * E753 - Total waktu jemput-antar real
     * Excel: =E80+E84
     * @param {Object} temp
     * @returns {number} menit
     */
    function E753(temp) {
        return temp.E80 + temp.E84;
    }
    E753.deps = ['E80', 'E84'];

    /**
     * E754 - Tarif jarak efektif real (Rp/km)
     * Excel: =E698/E752
     * @param {Object} temp
     * @returns {number}
     */
    function E754(temp) {
        return temp.E698 / temp.E752;
    }
    E754.deps = ['E698', 'E752'];

    /**
     * E755 - Tarif waktu efektif real (Rp/menit)
     * Excel: =E698/E753
     * @param {Object} temp
     * @returns {number}
     */
    function E755(temp) {
        return temp.E698 / temp.E753;
    }
    E755.deps = ['E698', 'E753'];

    // ==================== EKSPOR ====================
    return {
        F_V,

        // Semua fungsi sel
        E655, E656, E657, E658, E659, E660, E661, E662, E663,
        E668, E669, E670, E671, E677, E678, E679, E680,
        E682, E683, E684, E686, E687,
        E692, E693, E694, E695, E696, E697, E698, E699, E700, E701,
        E706, E707, E708, E709,
        E713, E714, E715, E716, E717, E718, E719,
        E725, E726, E727, E728, E729, E730, E731, E732,
        E738, E739, E740, E741, E742, E743, E744, E745, E746,
        E752, E753, E754, E755
    };
})();

// ==================== EKSPOR GLOBAL & LOG FILE VERSION ====================
if (typeof window !== 'undefined') {
    window.Fare = Fare;
    console.log('[FARE] v' + Fare.F_V + ' dimuat');
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Fare };
}

// ================================= CHANGELOG =================================
// 1.0.1-rev0 : Seluruh fungsi sel diubah menjadi (temp) => value + properti
//              deps. Wrapper internal (getFareParams, calcOnlineFare, dll.)
//              dihapus. Parameter buatan dihilangkan. Komentar tetap merujuk
//              ke sel Excel untuk sinkronisasi.
// ================================ End Of File ================================
/**
 * =============================================================================
 * FILE        : /engine/03fare.js
 * VERSI FILE  : 1.0.0-rev3
 * ENGINE      : 1.0.0-beta
 * DATA SOURCE : Excel "v9.7j masterapp.xlsx" — Sheet "v9.7j-All"
 */
const Fare = (function() {
    'use strict';

    const F_V = '1.0.0-rev3';

    function E655(v) {
        const mode = v.E10;
        const layanan = v.E46;
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
        return DATA.E201;
    }

    function E656(v) {
        const mode = v.E10;
        const layanan = v.E46;
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

    function E657(v) {
        return E655(v) + E656(v);
    }

    function E658(v) {
        return 1 - E657(v);
    }

    function E659(v) {
        const bbm = v.E24;
        const map = {
            'Pertalite': DATA.E302,
            'Bio Solar': DATA.E303,
            'SPKLU+': DATA.E308,
            'Swap Battery': DATA.E309,
            'Pertamax': DATA.E304
        };
        return map[bbm] !== undefined ? map[bbm] : DATA.E302;
    }

    function E660(v) {
        const mode = v.E10;
        const area = v.E20;
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

    function E661(v) {
        return E660(v) - (E660(v) * E657(v));
    }

    function E662(v) {
        const layanan = v.E46;
        if (layanan === 'XL' || layanan === 'Premium XL') return '6seat';
        return '4seat';
    }

    function E663(v) {
        return v.E10 === 'Mobil' ? DATA.E274 : DATA.E275;
    }

    function E668(v) {
        const layanan = v.E46;
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

    function E669(v) {
        return E660(v) + (E660(v) * E668(v));
    }

    function E670(v) {
        return E669(v) - (E669(v) * E657(v));
    }

    function E671() {
        return DATA.E268 + DATA.E269;
    }

    function E677(v) {
        return v.E10 === 'Mobil' ? DATA.E133 : DATA.E149;
    }

    function E678(v, fareParams, uiStateE71) {
        const mode = v.E10;
        const tipe = v.E38;
        const e660 = fareParams ? fareParams.E660 : E660(v);
        const e661 = fareParams ? fareParams.E661 : E661(v);
        const e677 = fareParams ? fareParams.E677 : E677(v);
        const e40 = v.E40;

        if (mode === 'Mobil') {
            if (tipe === 'wajar') return e660 + (e660 * e40);
            if (tipe === 'minimal') return e660;
            if (tipe === 'abnormal') return e661;
            if (tipe === 'app') return (typeof uiStateE71 === 'number') ? uiStateE71 : e677;
        } else if (mode === 'Motor') {
            if (tipe === 'wajar') return e660 + (e660 * e40);
            if (tipe === 'minimal') return e660;
            if (tipe === 'abnormal') return e661;
            if (tipe === 'app') return (typeof uiStateE71 === 'number') ? uiStateE71 : e677;
        }
        return e677;
    }

    function E679(v, fareParams, uiStateE71) {
        const e678 = E678(v, fareParams, uiStateE71);
        const e668 = fareParams ? fareParams.E668 : E668(v);
        return e678 + (e678 * e668);
    }

    function E680(v) {
        const mode = v.E10;
        const jarakOff = v.E68;
        if (mode === 'Mobil') {
            return DATA.E134 + Math.max(0, jarakOff - DATA.E265) * DATA.E263;
        } else {
            return DATA.E150 + Math.max(0, jarakOff - DATA.E265) * DATA.E264;
        }
    }

    function E692(v) {
        if (v.E36 === 'offline') return 0;
        const mode = v.E10;
        const layanan = v.E46;
        const map = {
            Mobil: { Hemat: DATA.E127, Standar: DATA.E128, XL: DATA.E129, Prioritas: DATA.E130, Premium: DATA.E131, 'Premium XL': DATA.E132 },
            Motor: { Hemat: DATA.E143, Standar: DATA.E144, XL: DATA.E145, Prioritas: DATA.E146, Premium: DATA.E147, 'Premium XL': DATA.E148 }
        };
        const modeMap = map[mode];
        if (modeMap && modeMap[layanan] !== undefined) return modeMap[layanan];
        return mode === 'Motor' ? DATA.E144 : DATA.E128;
    }

    function E693(v) {
        if (v.E36 === 'offline') return 0;
        if (typeof v.E92 === 'number' && v.E92 !== 0) return v.E92;
        return E692(v);
    }

    function E694(v, fp) {
        if (v.E36 === 'offline') return E686(v, fp);
        return v.E56 / (1 - fp.E657);
    }

    function E695(v, fp) {
        if (v.E36 === 'offline') return 0;
        const e694 = E694(v, fp);
        return e694 - v.E56;
    }

    function E696(v, fp) {
        if (v.E36 === 'offline') return E687(v, fp);
        const e56 = v.E56;
        const e692 = E692(v);
        const e695 = E695(v, fp);
        return e56 + e692 + e695;
    }

    function E697(v, fp) {
        if (v.E36 === 'offline') return E687(v, fp);
        if (v.E12 === 'Driver') return E696(v, fp);
        return v.E54;
    }

    function E698(v, fp) {
        const e697 = E697(v, fp);
        if (v.E36 === 'offline') return e697 - E684(v);
        return e697 - E693(v);
    }

    function E699(v, fp) {
        const e698 = E698(v, fp);
        if (v.E36 === 'offline') return e698 * 0;
        return e698 * fp.E657;
    }

    function E700(v, fp) {
        const e698 = E698(v, fp);
        const e699 = E699(v, fp);
        return e698 - e699;
    }

    function E701(v, fp) {
        const e698 = E698(v, fp);
        if (v.E36 === 'offline') return e698 * 0;
        return fp.E656 * e698;
    }

    function E706(v, fp) {
        const e697 = E697(v, fp);
        if (v.E36 === 'offline') return e697 / fp.E679;
        const e698 = E698(v, fp);
        const e669 = fp.E669;
        const e60 = v.E60;
        return (e698 / e669) / (1 + e60 / 100);
    }

    function E707(v, fp) {
        if (v.E36 === 'offline') return v.E68;
        if (v.E58 > 0) return v.E58;
        return E706(v, fp);
    }

    function E708(v, fp) {
        const e707 = E707(v, fp);
        return e707 + DATA.E271;
    }

    function E709(v, fp) {
        const e707 = E707(v, fp);
        return e707 + DATA.E260;
    }

    function E713(v, fp) {
        const e698 = E698(v, fp);
        const e707 = E707(v, fp);
        return e698 / e707;
    }

    function E714(v, fp) {
        if (v.E36 === 'offline') return E680(v);
        const e10 = v.E10;
        const e707 = E707(v, fp);
        if (e10 === 'Motor') {
            return DATA.E262 + Math.max(0, e707 - DATA.E265) * DATA.E264;
        } else {
            return DATA.E261 + Math.max(0, e707 - DATA.E265) * DATA.E263;
        }
    }

    function E715(v, fp) {
        const e698 = E698(v, fp);
        const e714 = E714(v, fp);
        return e698 / e714;
    }

    function E716(v, fp) {
        const e715 = E715(v, fp);
        const e671 = fp.E671;
        return e715 + e671;
    }

    function E717(v, fp) {
        const e713 = E713(v, fp);
        const e660 = fp.E660;
        return (e713 - e660) / e660;
    }

    function E718(v, fp) {
        const e714 = E714(v, fp);
        const e261 = DATA.E261;
        const e262 = DATA.E262;
        const e10 = v.E10;
        if (e10 === 'Mobil') return (e714 - e261) / e261;
        return (e714 - e262) / e262;
    }

    function E719(v, fp) {
        if (v.E36 !== 'offline') return '';
        const e682 = E682(v, fp);
        const e683 = E683(v, fp);
        return e682 > e683 ? 'jarak' : 'waktu';
    }

    function E682(v, fp) {
        const e68 = v.E68;
        const e679 = fp.E679;
        return (e68 < 1) ? e679 : e68 * e679;
    }

    function E683(v, fp) {
        const e70 = v.E70;
        const e680 = E680(v);
        return e70 * e680;
    }

    function E684(v) {
        if (v.E36 === 'online') return 0;
        const mode = v.E10;
        const layanan = v.E46;
        const map = {
            Mobil: { Hemat: DATA.E127, Standar: DATA.E128, XL: DATA.E129, Prioritas: DATA.E130, Premium: DATA.E131, 'Premium XL': DATA.E132 },
            Motor: { Hemat: DATA.E143, Standar: DATA.E144, XL: DATA.E145, Prioritas: DATA.E146, Premium: DATA.E147, 'Premium XL': DATA.E148 }
        };
        const modeMap = map[mode];
        if (modeMap && modeMap[layanan] !== undefined) return modeMap[layanan];
        return mode === 'Motor' ? DATA.E144 : DATA.E128;
    }

    function E686(v, fp) {
        const e682 = E682(v, fp);
        const e683 = E683(v, fp);
        return Math.max(e682, e683);
    }

    function E687(v, fp) {
        const e686 = E686(v, fp);
        const e684 = E684(v);
        return e686 + e684;
    }

    function E725(est, v) {
        return DATA.E260 - v.E78;
    }

    function E726(est, v) {
        return DATA.E267 - v.E80;
    }

    function E727(est, v) {
        return est.E707 - v.E82;
    }

    function E728(est, v) {
        return est.E715 - v.E84;
    }

    function E729(est, v) {
        return est.E713 * E725(est, v);
    }

    function E730(est, v) {
        return est.E714 * E726(est, v);
    }

    function E731(est, v) {
        return est.E713 * E727(est, v);
    }

    function E732(est, v) {
        return est.E714 * E728(est, v);
    }

    function E738(est, v) {
        const val = E729(est, v);
        return val < 0 ? Math.abs(val) : 0;
    }

    function E739(est, v) {
        const val = E730(est, v);
        return val < 0 ? Math.abs(val) : 0;
    }

    function E740(est, v) {
        const val = E731(est, v);
        return val < 0 ? Math.abs(val) : 0;
    }

    function E741(est, v) {
        const val = E732(est, v);
        return val < 0 ? Math.abs(val) : 0;
    }

    function E742(est, v) {
        return Math.max(E738(est, v), E739(est, v));
    }

    function E743(est, v) {
        return Math.max(E740(est, v), E741(est, v));
    }

    function E744(v) {
        return v.E100 + v.E102 + v.E104;
    }

    function E745(est, v) {
        return E742(est, v) + E743(est, v);
    }

    function E746(est, v) {
        return E745(est, v) + E744(v);
    }

    function E752(v) {
        return v.E78 + v.E82;
    }

    function E753(v) {
        return v.E80 + v.E84;
    }

    function E754(est, v) {
        return est.E698 / E752(v);
    }

    function E755(est, v) {
        return est.E698 / E753(v);
    }

    function getFareParams(valid, uiStateE71) {
        const fp = {};
        fp.E655 = E655(valid);
        fp.E656 = E656(valid);
        fp.E657 = E657(valid);
        fp.E658 = E658(valid);
        fp.E659 = E659(valid);
        fp.E660 = E660(valid);
        fp.E661 = E661(valid);
        fp.E662 = E662(valid);
        fp.E663 = E663(valid);
        fp.E668 = E668(valid);
        fp.E669 = E669(valid);
        fp.E670 = E670(valid);
        fp.E671 = E671();
        fp.E677 = E677(valid);
        fp.E678 = E678(valid, fp, uiStateE71);
        fp.E679 = E679(valid, fp, uiStateE71);
        return fp;
    }

    function calcOnlineFare(valid, fp) {
        const res = {};
        res.E692 = E692(valid);
        res.E693 = E693(valid);
        res.E694 = E694(valid, fp);
        res.E695 = E695(valid, fp);
        res.E696 = E696(valid, fp);
        res.E697 = E697(valid, fp);
        res.E698 = E698(valid, fp);
        res.E699 = E699(valid, fp);
        res.E700 = E700(valid, fp);
        res.E701 = E701(valid, fp);
        res.E706 = E706(valid, fp);
        res.E707 = E707(valid, fp);
        res.E708 = E708(valid, fp);
        res.E709 = E709(valid, fp);
        res.E713 = E713(valid, fp);
        res.E714 = E714(valid, fp);
        res.E715 = E715(valid, fp);
        res.E716 = E716(valid, fp);
        res.E717 = E717(valid, fp);
        res.E718 = E718(valid, fp);
        return res;
    }

    function calcOfflineFare(valid, fp) {
        const res = {};
        res.E680 = E680(valid);
        res.E682 = E682(valid, fp);
        res.E683 = E683(valid, fp);
        res.E684 = E684(valid);
        res.E686 = E686(valid, fp);
        res.E687 = E687(valid, fp);
        res.E692 = E692(valid);
        res.E693 = E693(valid);
        res.E694 = E694(valid, fp);
        res.E695 = E695(valid, fp);
        res.E696 = E696(valid, fp);
        res.E697 = E697(valid, fp);
        res.E698 = E698(valid, fp);
        res.E699 = E699(valid, fp);
        res.E700 = E700(valid, fp);
        res.E701 = E701(valid, fp);
        res.E706 = E706(valid, fp);
        res.E707 = E707(valid, fp);
        res.E708 = E708(valid, fp);
        res.E709 = E709(valid, fp);
        res.E713 = E713(valid, fp);
        res.E714 = E714(valid, fp);
        res.E715 = E715(valid, fp);
        res.E716 = E716(valid, fp);
        res.E717 = E717(valid, fp);
        res.E718 = E718(valid, fp);
        res.E719 = E719(valid, fp);
        return res;
    }

    function calcPickupAdj(est, valid) {
        return {
            E725: E725(est, valid),
            E726: E726(est, valid),
            E729: E729(est, valid),
            E730: E730(est, valid),
            E738: E738(est, valid),
            E739: E739(est, valid),
            E742: E742(est, valid)
        };
    }

    function calcDropoffAdj(est, valid) {
        return {
            E727: E727(est, valid),
            E728: E728(est, valid),
            E731: E731(est, valid),
            E732: E732(est, valid),
            E740: E740(est, valid),
            E741: E741(est, valid),
            E743: E743(est, valid),
            E744: E744(valid),
            E745: E745(est, valid),
            E746: E746(est, valid),
            E752: E752(valid),
            E753: E753(valid),
            E754: E754(est, valid),
            E755: E755(est, valid)
        };
    }

    return {
        F_V,
        E655, E656, E657, E658, E659, E660, E661, E662, E663,
        E668, E669, E670, E671, E677, E678, E679, E680,
        E692, E693, E694, E695, E696, E697, E698, E699, E700, E701,
        E706, E707, E708, E709,
        E713, E714, E715, E716, E717, E718, E719,
        E682, E683, E684, E686, E687,
        E725, E726, E727, E728, E729, E730, E731, E732,
        E738, E739, E740, E741, E742, E743, E744, E745, E746,
        E752, E753, E754, E755,
        getFareParams,
        calcOnlineFare,
        calcOfflineFare,
        calcPickupAdj,
        calcDropoffAdj
    };
})();

if (typeof window !== 'undefined') {
    window.Fare = Fare;
    console.log('[FARE] v' + Fare.F_V + ' dimuat');
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Fare };
}

// ================================ End Of File ================================

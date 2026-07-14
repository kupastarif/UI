/**
 * =============================================================================
 * FILE        : /engine/04cost.js
 * VERSI FILE  : 1.0.0-rev3
 * ENGINE      : 1.0.0-beta
 * DATA SOURCE : Excel "v9.7j masterapp.xlsx" — Sheet "v9.7j-All"
 */
const Cost = (function() {
    'use strict';

    const F_V = '1.0.0-rev3';

    function getAFC(speed, mode, energi) {
        if (typeof DATA === 'undefined' || !DATA.AFC_TABLE) {
            throw new Error('[Cost] DATA.AFC_TABLE tidak tersedia. Pastikan 01data.js sudah dimuat.');
        }
        const table = DATA.AFC_TABLE[mode][energi];
        const defaultValue = table[table.length - 1].value;
        if (speed < 0) return defaultValue;
        if (speed > 80) return defaultValue;
        if (speed === 80) return table[table.length - 2].value;
        for (let i = 0; i < table.length; i++) {
            if (speed < table[i].maxSpeed) return table[i].value;
        }
        return defaultValue;
    }

    function getPerawatanSpeedFactor(speed) {
        if (speed > 0 && speed <= 20) return DATA.E315;
        if (speed > 20 && speed <= 60) return DATA.E316;
        if (speed > 60 && speed <= 90) return DATA.E317;
        if (speed > 90 && speed <= 120) return DATA.E318;
        return DATA.E315;
    }

    function getTotalTaxPerYear(mode, cc) {
        const items = DATA.getTaxItems(mode, cc);
        let total = 0;
        for (const item of items) {
            if (item.dcell > 0 && item.ecell > 0) total += item.dcell / (item.ecell / 365);
        }
        return total;
    }

    function getTotalAttributePerYear(mode) {
        const items = DATA.getAttributeItems(mode);
        let total = 0;
        for (const item of items) {
            if (item.dcell > 0 && item.ecell > 0) total += item.dcell / (item.ecell / 365);
        }
        return total;
    }

    function getTotalMaintenancePerKm(mode, cc) {
        const items = DATA.getMaintenanceItems(mode, cc);
        let total = 0;
        for (const item of items) {
            if (item.dcell > 0 && item.ecell > 0) total += item.dcell / item.ecell;
        }
        return total;
    }

    function getDepreciationPerMenit(mode, cc) {
        const dep = DATA.getDepreciation(mode, cc);
        if (!dep) return 0;
        const selisih = dep.beli - dep.jual;
        const umurTahun = dep.umur;
        const menitPerTahun = DATA.E301 * DATA.E296;
        return selisih / umurTahun / menitPerTahun;
    }

    function E787(seatType) { return seatType === '6seat' ? DATA.E445 : DATA.E444; }
    function E788(cc) {
        if (cc === '1000cc' || cc === '125cc') return DATA.E446;
        if (cc === '1500cc' || cc === '160cc') return DATA.E447;
        if (cc === '2000cc' || cc === '200cc') return DATA.E448;
        return DATA.E446;
    }
    function E789(transmisi) { return transmisi === 'matic' ? DATA.E450 : DATA.E449; }
    function E790(bbm) { return bbm === 'Bio Solar' ? DATA.E452 : DATA.E451; }

    function E791(mode, cc, transmisi, bbm) {
        const base = mode === 'Mobil' ? DATA.E442 : DATA.E443;
        return base + E788(cc) + E789(transmisi) + E790(bbm);
    }

    function E792(seatType, cc, transmisi, bbm) {
        return E787(seatType) + E788(cc) + E789(transmisi) + E790(bbm);
    }

    function E797(mode, cc) { const dep = DATA.getDepreciation(mode, cc); return dep ? dep.beli - dep.jual : 0; }
    function E798(mode, cc) { return getDepreciationPerMenit(mode, cc); }
    function E799(mode, cc) { return getTotalTaxPerYear(mode, cc); }
    function E800(mode, cc) { return E799(mode, cc) / (DATA.E301 * DATA.E296); }
    function E801(mode) { return getTotalAttributePerYear(mode) / (DATA.E301 * DATA.E296); }
    function E802(mode, cc) { return getTotalMaintenancePerKm(mode, cc); }
    function E803(cc) {
        if (cc === '1000cc' || cc === '125cc' || cc === 'Listrik') return DATA.E319;
        if (cc === '1500cc' || cc === '160cc') return DATA.E320;
        if (cc === '2000cc' || cc === '200cc') return DATA.E321;
        return DATA.E319;
    }

    function E805(v) {
        if (v.E36 === 'offline') return 0;
        const map = v.E10 === 'Mobil' ? DATA.BIAYA_LANGGANAN_LAYANAN.Mobil : DATA.BIAYA_LANGGANAN_LAYANAN.Motor;
        return map[v.E46] !== undefined ? map[v.E46] : 0;
    }
    function E806(orderType) { return orderType === 'offline' ? 0 : DATA.E116 * DATA.E117; }
    function E807(orderType) { return orderType === 'offline' ? 0 : DATA.E116 * DATA.E117 * DATA.E118; }
    function E808(biayaLangganan) { return biayaLangganan; }
    function E809(orderType) { return orderType === 'online' ? E807(orderType) : 0; }

    function E863(jarakJemput, waktuJemputEst) { return jarakJemput / (waktuJemputEst / DATA.E295); }
    function E879(mode, cc, kecepatan) { if (mode === 'Motor') return 1; return getAFC(kecepatan, 'Mobil', DATA.getEnergyType(cc)); }
    function E880(mode, cc, kecepatan) { if (mode === 'Mobil') return 1; return getAFC(kecepatan, 'Motor', DATA.getEnergyType(cc)); }
    function E881(mode, cc, kecepatan, totalSelisihBBMJemput) {
        const energi = DATA.getEnergyType(cc);
        const afc = getAFC(kecepatan, mode, energi);
        return afc - (afc * totalSelisihBBMJemput);
    }
    function E901(jarakJemput, afcJemput, hargaBBM) { return (jarakJemput / afcJemput) * hargaBBM; }
    function E917(kecepatan) { return getPerawatanSpeedFactor(kecepatan); }
    function E919(perawatanPerKm, faktorCC, faktorKecepatan) { return perawatanPerKm * (1 + faktorCC) * (1 + faktorKecepatan); }
    function E921(jarakJemput, perawatanPerKmJemput) { return jarakJemput * perawatanPerKmJemput; }
    function E815(waktu, penyusutan) { return waktu * penyusutan; }
    function E831(waktu, pajak) { return waktu * pajak; }
    function E847(waktu, atribut) { return waktu * atribut; }
    function E944(p, b, a, t, s) { return p + b + a + t + s; }
    function E947(p, a, t, s) { return p + a + t + s; }

    function E864(j, w) { return j / (w / DATA.E295); }
    function E865(j1, j2, w1, w2) { return (j1 + j2) / ((w1 + w2) / DATA.E295); }
    function E882(mode, cc, k) { if (mode === 'Motor') return 1; return getAFC(k, 'Mobil', DATA.getEnergyType(cc)); }
    function E883(mode, cc, k) { if (mode === 'Mobil') return 1; return getAFC(k, 'Motor', DATA.getEnergyType(cc)); }
    function E884(mode, cc, k, s) { const e = DATA.getEnergyType(cc); const a = getAFC(k, mode, e); return a - (a * s); }
    function E902(j, a, h) { return (j / a) * h; }
    function E903(a, b) { return a + b; }
    function E918(k) { return getPerawatanSpeedFactor(k); }
    function E920(p, f, k) { return p * (1 + f) * (1 + k); }
    function E922(j, p) { return j * p; }
    function E923(a, b) { return a + b; }
    function E816(w, s) { return w * s; }
    function E817(a, b) { return a + b; }
    function E832(w, p) { return w * p; }
    function E833(a, b) { return a + b; }
    function E848(w, a) { return w * a; }
    function E849(a, b) { return a + b; }
    function E941(a, b) { return a + b; }
    function E942(a, b) { return a + b; }
    function E943(a, b) { return a + b; }
    function E945(a, b, c, d, e) { return a + b + c + d + e; }
    function E948(a, b, c, d) { return a + b + c + d; }
    function E946(a, b) { return a + b; }
    function E949(a, b) { return a + b; }

    function E969(ot, total, appEst, appDrv, beban, lain, jemputOff) {
        if (ot === 'online') return (total - appEst - appDrv - beban) - lain;
        return (total - appEst - appDrv - beban) + jemputOff;
    }
    function E970(appEst, appDrv, lain, bebanApp) { return (appEst + appDrv + lain) - bebanApp; }
    function E971(pApp, total) { return pApp / total; }
    function E972(pDrv, total) { return pDrv / total; }
    function E973(beban, total) { return beban / total; }
    function E974(bApp, total) { return bApp / total; }
    function E975(a, b, c, d) { return a + b + c + d; }

    function E871(j, w) { return j / (w / DATA.E295); }
    function E890(mode, cc, k) { if (mode === 'Motor') return 1; return getAFC(k, 'Mobil', DATA.getEnergyType(cc)); }
    function E891(mode, cc, k) { if (mode === 'Mobil') return 1; return getAFC(k, 'Motor', DATA.getEnergyType(cc)); }
    function E892(mode, cc, k, s) { const e = DATA.getEnergyType(cc); const a = getAFC(k, mode, e); return a - (a * s); }
    function E909(j, a, h) { return (j / a) * h; }
    function E929(k) { return getPerawatanSpeedFactor(k); }
    function E931(p, f, k) { return p * (1 + f) * (1 + k); }
    function E933(j, p) { return j * p; }
    function E823(w, s) { return w * s; }
    function E839(w, p) { return w * p; }
    function E855(w, a) { return w * a; }
    function E958(p, b, a, t, s) { return p + b + a + t + s; }
    function E961(p, a, t, s) { return p + a + t + s; }

    function E872(j, w) { return j / (w / DATA.E295); }
    function E873(j1, j2, w1, w2) { return (j1 + j2) / ((w1 + w2) / DATA.E295); }
    function E893(mode, cc, k) { if (mode === 'Motor') return 1; return getAFC(k, 'Mobil', DATA.getEnergyType(cc)); }
    function E894(mode, cc, k) { if (mode === 'Mobil') return 1; return getAFC(k, 'Motor', DATA.getEnergyType(cc)); }
    function E895(mode, cc, k, s) { const e = DATA.getEnergyType(cc); const a = getAFC(k, mode, e); return a - (a * s); }
    function E910(j, a, h) { return (j / a) * h; }
    function E911(a, b) { return a + b; }
    function E930(k) { return getPerawatanSpeedFactor(k); }
    function E932(p, f, k) { return p * (1 + f) * (1 + k); }
    function E934(j, p) { return j * p; }
    function E935(a, b) { return a + b; }
    function E824(w, s) { return w * s; }
    function E825(a, b) { return a + b; }
    function E840(w, p) { return w * p; }
    function E841(a, b) { return a + b; }
    function E856(w, a) { return w * a; }
    function E857(a, b) { return a + b; }
    function E955(a, b) { return a + b; }
    function E956(a, b) { return a + b; }
    function E957(a, b) { return a + b; }
    function E959(a, b, c, d, e) { return a + b + c + d + e; }
    function E962(a, b, c, d) { return a + b + c + d; }
    function E960(a, b) { return a + b; }
    function E963(a, b) { return a + b; }

    function E981(ot, omset, beban, lain, jemputOff) {
        if (ot === 'online') return (omset - beban) - lain;
        return (omset - beban) + jemputOff;
    }
    function E982(appR, appDrv, lain, bApp) { return (appR + appDrv + lain) - bApp; }
    function E983(pApp, tot) { return pApp / tot; }
    function E984(pDrv, tot) { return pDrv / tot; }
    function E985(beban, tot) { return beban / tot; }
    function E986(bApp, tot) { return bApp / tot; }
    function E987(a, b, c, d) { return a + b + c + d; }

    function getCostParams(v, seatType) {
        const mode = v.E10;
        const cc = v.E22;
        const tr = v.E26;
        const bbm = v.E24;
        const ot = v.E36;
        return {
            E787: E787(seatType), E788: E788(cc), E789: E789(tr), E790: E790(bbm),
            E791: E791(mode, cc, tr, bbm), E792: E792(seatType, cc, tr, bbm),
            E797: E797(mode, cc), E798: E798(mode, cc), E799: E799(mode, cc),
            E800: E800(mode, cc), E801: E801(mode), E802: E802(mode, cc), E803: E803(cc),
            E805: E805(v), E806: E806(ot), E807: E807(ot), E808: E808(E805(v)), E809: E809(ot)
        };
    }

    function calcPickupEstimate(fp, cp, mode, cc, hargaBBM) {
        const j = DATA.E260;
        const w = fp.E671;
        const e863 = E863(j, w);
        const e881 = E881(mode, cc, e863, cp.E791);
        const e901 = E901(j, e881, hargaBBM);
        const e917 = E917(e863);
        const e919 = E919(cp.E802, cp.E803, e917);
        const e921 = E921(j, e919);
        const e815 = E815(w, cp.E798);
        const e831 = E831(w, cp.E800);
        const e847 = E847(w, cp.E801);
        return {
            E863: e863,
            E879: E879(mode, cc, e863), E880: E880(mode, cc, e863), E881: e881,
            E901: e901, E917: e917, E919: e919, E921: e921,
            E815: e815, E831: e831, E847: e847,
            E944: E944(e921, e901, e847, e831, e815), E947: E947(e921, e847, e831, e815)
        };
    }

    function calcDropoffEstimate(v, fp, cp, mode, cc, hargaBBM, df, pu) {
        const ja = df.E708;
        const wa = df.E715;
        const e864 = E864(ja, wa);
        const e884 = E884(mode, cc, e864, cp.E792);
        const e902 = E902(ja, e884, hargaBBM);
        const e918 = E918(e864);
        const e920 = E920(cp.E802, cp.E803, e918);
        const e922 = E922(ja, e920);
        const e816 = E816(wa, cp.E798);
        const e832 = E832(wa, cp.E800);
        const e848 = E848(wa, cp.E801);
        const e945 = E945(e922, e902, e848, e832, e816);
        const e948 = E948(e922, e848, e832, e816);
        const beban = E946(pu.E944, e945);
        const nonBeban = E949(pu.E947, e948);
        const jemputOff = v.E36 === 'offline' ? df.E684 : 0;
        const e969 = E969(v.E36, df.E697, df.E692, df.E699, beban, cp.E808, jemputOff);
        const e970 = E970(df.E692, df.E699, cp.E808, cp.E809);
        const total = df.E697;
        const e971 = E971(e970, total);
        const e972 = E972(e969, total);
        const e973 = E973(beban, total);
        const e974 = E974(cp.E809, total);
        return {
            E864: e864, E865: E865(DATA.E260, ja, fp.E671, wa),
            E882: E882(mode, cc, e864), E883: E883(mode, cc, e864), E884: e884,
            E902: e902, E903: E903(pu.E901, e902),
            E918: e918, E920: e920, E922: e922, E923: E923(pu.E921, e922),
            E816: e816, E817: E817(pu.E815, e816),
            E832: e832, E833: E833(pu.E831, e832),
            E848: e848, E849: E849(pu.E847, e848),
            E941: E941(pu.E831, pu.E847), E942: E942(e832, e848), E943: E943(E833(pu.E831, e832), E849(pu.E847, e848)),
            E945: e945, E948: e948,
            E946: beban, E949: nonBeban,
            E969: e969, E970: e970, E971: e971, E972: e972, E973: e973, E974: e974,
            E975: E975(e971, e972, e973, e974)
        };
    }

    function calcPickupReality(v, fp, cp, mode, cc, hargaBBM) {
        const j = v.E78;
        const w = v.E80;
        const e871 = E871(j, w);
        const e892 = E892(mode, cc, e871, cp.E791);
        const e909 = E909(j, e892, hargaBBM);
        const e929 = E929(e871);
        const e931 = E931(cp.E802, cp.E803, e929);
        const e933 = E933(j, e931);
        const e823 = E823(w, cp.E798);
        const e839 = E839(w, cp.E800);
        const e855 = E855(w, cp.E801);
        return {
            E871: e871,
            E890: E890(mode, cc, e871), E891: E891(mode, cc, e871), E892: e892,
            E909: e909, E929: e929, E931: e931, E933: e933,
            E823: e823, E839: e839, E855: e855,
            E958: E958(e933, e909, e855, e839, e823), E961: E961(e933, e855, e839, e823)
        };
    }

    function calcDropoffReality(v, fp, cp, mode, cc, hargaBBM, est, puReal) {
        const ja = v.E82;
        const wa = v.E84;
        const e872 = E872(ja, wa);
        const e895 = E895(mode, cc, e872, cp.E792);
        const e910 = E910(ja, e895, hargaBBM);
        const e930 = E930(e872);
        const e932 = E932(cp.E802, cp.E803, e930);
        const e934 = E934(ja, e932);
        const e824 = E824(wa, cp.E798);
        const e840 = E840(wa, cp.E800);
        const e856 = E856(wa, cp.E801);
        const e959 = E959(e934, e910, e856, e840, e824);
        const beban = E960(puReal.E958, e959);
        const biayaAppR = v.E36 === 'offline' ? 0 : est.E693;
        const biayaAppDrv = v.E36 === 'offline' ? 0 : est.E699;
        const jemputOff = v.E36 === 'offline' ? est.E684 : 0;
        const omset = est.E700;
        const e981 = E981(v.E36, omset, beban, cp.E808, jemputOff);
        const e982 = E982(biayaAppR, biayaAppDrv, cp.E808, cp.E809);
        const total = est.E697;
        const e983 = E983(e982, total);
        const e984 = E984(e981, total);
        const e985 = E985(beban, total);
        const e986 = E986(cp.E809, total);
        return {
            E872: e872, E873: E873(v.E78, ja, v.E80, wa),
            E893: E893(mode, cc, e872), E894: E894(mode, cc, e872), E895: e895,
            E910: e910, E911: E911(puReal.E909, e910),
            E930: e930, E932: e932, E934: e934, E935: E935(puReal.E933, e934),
            E824: e824, E825: E825(puReal.E823, e824),
            E840: e840, E841: E841(puReal.E839, e840),
            E856: e856, E857: E857(puReal.E855, e856),
            E955: E955(puReal.E839, puReal.E855), E956: E956(e840, e856), E957: E957(E841(puReal.E839, e840), E857(puReal.E855, e856)),
            E959: e959, E962: E962(e934, e856, e840, e824),
            E960: beban, E963: E963(puReal.E961, E962(e934, e856, e840, e824)),
            E981: e981, E982: e982, E983: e983, E984: e984, E985: e985, E986: e986,
            E987: E987(e983, e984, e985, e986)
        };
    }

    function calcOperationalCost(mode, cc, transmisi, bbm, distance, time) {
        const energi = DATA.getEnergyType(cc);
        const speed = time > 0 ? (distance / (time / 60)) : 0;
        const afc = getAFC(speed, mode, energi);
        const totalSelisih = E791(mode, cc, transmisi, bbm);
        const afcAdj = afc - (afc * totalSelisih);
        const hargaBBM = (() => {
            const m = { 'Pertalite': DATA.E302, 'Bio Solar': DATA.E303, 'SPKLU+': DATA.E308, 'Swap Battery': DATA.E309, 'Pertamax': DATA.E304 };
            return m[bbm] || DATA.E302;
        })();
        const costBBM = (distance / afcAdj) * hargaBBM;
        const maintPerKm = E802(mode, cc);
        const faktorCC = E803(cc);
        const faktorKec = getPerawatanSpeedFactor(speed);
        const maintPerKmAdj = E920(maintPerKm, faktorCC, faktorKec);
        const costMaint = distance * maintPerKmAdj;
        const penyusutanPerMenit = E798(mode, cc);
        const costDep = time * penyusutanPerMenit;
        const pajakPerMenit = E800(mode, cc);
        const costTax = time * pajakPerMenit;
        const atributPerMenit = E801(mode);
        const costAttr = time * atributPerMenit;
        return {
            bbm: costBBM,
            maintenance: costMaint,
            depreciation: costDep,
            tax: costTax,
            attribute: costAttr,
            total: costBBM + costMaint + costDep + costTax + costAttr
        };
    }

    return {
        F_V,
        E787, E788, E789, E790, E791, E792, E797, E798, E799, E800, E801, E802, E803, E805, E806, E807, E808, E809,
        E815, E831, E847, E863, E879, E880, E881, E901, E917, E919, E921, E944, E947,
        E864, E865, E882, E883, E884, E902, E903, E918, E920, E922, E923, E816, E817, E832, E833, E848, E849,
        E941, E942, E943, E945, E948, E946, E949,
        E969, E970, E971, E972, E973, E974, E975,
        E871, E890, E891, E892, E909, E929, E931, E933, E823, E839, E855, E958, E961,
        E872, E873, E893, E894, E895, E910, E911, E930, E932, E934, E935, E824, E825, E840, E841, E856, E857,
        E955, E956, E957, E959, E962, E960, E963,
        E981, E982, E983, E984, E985, E986, E987,
        getCostParams,
        calcPickupEstimate,
        calcDropoffEstimate,
        calcPickupReality,
        calcDropoffReality,
        calcOperationalCost,
        getAFC,
        getPerawatanSpeedFactor,
        getTotalTaxPerYear,
        getTotalAttributePerYear,
        getTotalMaintenancePerKm,
        getDepreciationPerMenit
    };
})();

if (typeof window !== 'undefined') {
    window.Cost = Cost;
    console.log('[COST] v' + Cost.F_V + ' dimuat');
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Cost };
}

// ================================ End Of File ================================

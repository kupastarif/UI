/**
 * =============================================================================
 * FILE        : /engine/06api.js
 * VERSI FILE  : 1.0.0-rev5
 * ENGINE      : 1.0.0-beta
 * DATA SOURCE : Excel "v9.7j masterapp.xlsx" — Sheet "v9.7j-All"
 */
const Engine = (function() {
    'use strict';

    const ENGINE_VERSION = '1.0.0-beta';
    const F_V = '1.0.0-rev5';

    const ValidModule = window.Valid;
    const FareModule  = window.Fare;
    const CostModule  = window.Cost;
    const ExtraModule = window.Extra;

    const Valid = {
        E10: ValidModule.E10, E12: ValidModule.E12, E20: ValidModule.E20,
        E22: ValidModule.E22, E24: ValidModule.E24, E26: ValidModule.E26,
        E28: ValidModule.E28, E36: ValidModule.E36, E38: ValidModule.E38,
        E40: ValidModule.E40, E46: ValidModule.E46, E54: ValidModule.E54,
        E56: ValidModule.E56, E58: ValidModule.E58, E60: ValidModule.E60,
        E68: ValidModule.E68, E70: ValidModule.E70, E78: ValidModule.E78,
        E80: ValidModule.E80, E82: ValidModule.E82, E84: ValidModule.E84,
        E92: ValidModule.E92, E100: ValidModule.E100, E102: ValidModule.E102,
        E104: ValidModule.E104,
        validateHome: ValidModule.validateHome,
        validateOrder: ValidModule.validateOrder,
        validateEstimate: ValidModule.validateEstimate,
        validateReality: ValidModule.validateReality,
        validate: ValidModule.validate,
        validateCell: ValidModule.validateCell,
        getDropdownOptions: ValidModule.getDropdownOptions,
        getServiceOptions: ValidModule.getServiceOptions,
        getValidationRange: ValidModule.getValidationRange,
        getDefaultValues: ValidModule.getDefaultValues
    };

    const Fare = {
        E655: FareModule.E655, E656: FareModule.E656, E657: FareModule.E657,
        E658: FareModule.E658, E659: FareModule.E659, E660: FareModule.E660,
        E661: FareModule.E661, E662: FareModule.E662, E663: FareModule.E663,
        E668: FareModule.E668, E669: FareModule.E669, E670: FareModule.E670,
        E671: FareModule.E671, E677: FareModule.E677, E678: FareModule.E678,
        E679: FareModule.E679, E680: FareModule.E680,
        E682: FareModule.E682, E683: FareModule.E683, E684: FareModule.E684,
        E686: FareModule.E686, E687: FareModule.E687,
        E692: FareModule.E692, E693: FareModule.E693, E694: FareModule.E694,
        E695: FareModule.E695, E696: FareModule.E696, E697: FareModule.E697,
        E698: FareModule.E698, E699: FareModule.E699, E700: FareModule.E700,
        E701: FareModule.E701,
        E706: FareModule.E706, E707: FareModule.E707, E708: FareModule.E708,
        E709: FareModule.E709,
        E713: FareModule.E713, E714: FareModule.E714, E715: FareModule.E715,
        E716: FareModule.E716, E717: FareModule.E717, E718: FareModule.E718,
        E719: FareModule.E719,
        E725: FareModule.E725, E726: FareModule.E726, E727: FareModule.E727,
        E728: FareModule.E728, E729: FareModule.E729, E730: FareModule.E730,
        E731: FareModule.E731, E732: FareModule.E732,
        E738: FareModule.E738, E739: FareModule.E739, E740: FareModule.E740,
        E741: FareModule.E741, E742: FareModule.E742, E743: FareModule.E743,
        E744: FareModule.E744, E745: FareModule.E745, E746: FareModule.E746,
        E752: FareModule.E752, E753: FareModule.E753, E754: FareModule.E754,
        E755: FareModule.E755,
        getFareParams: FareModule.getFareParams,
        calcOnlineFare: FareModule.calcOnlineFare,
        calcOfflineFare: FareModule.calcOfflineFare,
        calcPickupAdj: FareModule.calcPickupAdj,
        calcDropoffAdj: FareModule.calcDropoffAdj
    };

    const Cost = {
        E787: CostModule.E787, E788: CostModule.E788, E789: CostModule.E789,
        E790: CostModule.E790, E791: CostModule.E791, E792: CostModule.E792,
        E797: CostModule.E797, E798: CostModule.E798, E799: CostModule.E799,
        E800: CostModule.E800, E801: CostModule.E801, E802: CostModule.E802,
        E803: CostModule.E803,
        E805: CostModule.E805, E806: CostModule.E806, E807: CostModule.E807,
        E808: CostModule.E808, E809: CostModule.E809,
        E815: CostModule.E815, E831: CostModule.E831, E847: CostModule.E847,
        E863: CostModule.E863, E879: CostModule.E879, E880: CostModule.E880,
        E881: CostModule.E881, E901: CostModule.E901, E917: CostModule.E917,
        E919: CostModule.E919, E921: CostModule.E921, E944: CostModule.E944,
        E947: CostModule.E947,
        E864: CostModule.E864, E865: CostModule.E865, E882: CostModule.E882,
        E883: CostModule.E883, E884: CostModule.E884, E902: CostModule.E902,
        E903: CostModule.E903, E918: CostModule.E918, E920: CostModule.E920,
        E922: CostModule.E922, E923: CostModule.E923,
        E816: CostModule.E816, E817: CostModule.E817,
        E832: CostModule.E832, E833: CostModule.E833,
        E848: CostModule.E848, E849: CostModule.E849,
        E941: CostModule.E941, E942: CostModule.E942, E943: CostModule.E943,
        E945: CostModule.E945, E948: CostModule.E948,
        E946: CostModule.E946, E949: CostModule.E949,
        E969: CostModule.E969, E970: CostModule.E970, E971: CostModule.E971,
        E972: CostModule.E972, E973: CostModule.E973, E974: CostModule.E974,
        E975: CostModule.E975,
        E871: CostModule.E871, E890: CostModule.E890, E891: CostModule.E891,
        E892: CostModule.E892, E909: CostModule.E909, E929: CostModule.E929,
        E931: CostModule.E931, E933: CostModule.E933,
        E823: CostModule.E823, E839: CostModule.E839, E855: CostModule.E855,
        E958: CostModule.E958, E961: CostModule.E961,
        E872: CostModule.E872, E873: CostModule.E873, E893: CostModule.E893,
        E894: CostModule.E894, E895: CostModule.E895,
        E910: CostModule.E910, E911: CostModule.E911,
        E930: CostModule.E930, E932: CostModule.E932,
        E934: CostModule.E934, E935: CostModule.E935,
        E824: CostModule.E824, E825: CostModule.E825,
        E840: CostModule.E840, E841: CostModule.E841,
        E856: CostModule.E856, E857: CostModule.E857,
        E955: CostModule.E955, E956: CostModule.E956, E957: CostModule.E957,
        E959: CostModule.E959, E962: CostModule.E962,
        E960: CostModule.E960, E963: CostModule.E963,
        E981: CostModule.E981, E982: CostModule.E982, E983: CostModule.E983,
        E984: CostModule.E984, E985: CostModule.E985, E986: CostModule.E986,
        E987: CostModule.E987,
        getAFC: CostModule.getAFC,
        getPerawatanSpeedFactor: CostModule.getPerawatanSpeedFactor,
        getTotalTaxPerYear: CostModule.getTotalTaxPerYear,
        getTotalAttributePerYear: CostModule.getTotalAttributePerYear,
        getTotalMaintenancePerKm: CostModule.getTotalMaintenancePerKm,
        getDepreciationPerMenit: CostModule.getDepreciationPerMenit,
        getCostParams: CostModule.getCostParams,
        calcPickupEstimate: CostModule.calcPickupEstimate,
        calcDropoffEstimate: CostModule.calcDropoffEstimate,
        calcPickupReality: CostModule.calcPickupReality,
        calcDropoffReality: CostModule.calcDropoffReality,
        calcOperationalCost: CostModule.calcOperationalCost
    };

    const Extra = {
        E998: ExtraModule.E998, E999: ExtraModule.E999, E1000: ExtraModule.E1000,
        E1001: ExtraModule.E1001, E1002: ExtraModule.E1002,
        E1007: ExtraModule.E1007, E1008: ExtraModule.E1008, E1009: ExtraModule.E1009,
        E1010: ExtraModule.E1010, E1012: ExtraModule.E1012, E1013: ExtraModule.E1013,
        E1014: ExtraModule.E1014, E1015: ExtraModule.E1015,
        E1021: ExtraModule.E1021, E1022: ExtraModule.E1022, E1023: ExtraModule.E1023,
        E1025: ExtraModule.E1025, E1026: ExtraModule.E1026, E1027: ExtraModule.E1027,
        E1029: ExtraModule.E1029, E1030: ExtraModule.E1030, E1031: ExtraModule.E1031,
        E1033: ExtraModule.E1033, E1034: ExtraModule.E1034, E1035: ExtraModule.E1035,
        E1041: ExtraModule.E1041, E1042: ExtraModule.E1042, E1043: ExtraModule.E1043,
        E1045: ExtraModule.E1045, E1046: ExtraModule.E1046, E1047: ExtraModule.E1047,
        E1049: ExtraModule.E1049, E1050: ExtraModule.E1050, E1051: ExtraModule.E1051,
        E1053: ExtraModule.E1053, E1054: ExtraModule.E1054, E1055: ExtraModule.E1055,
        E1061: ExtraModule.E1061, E1062: ExtraModule.E1062, E1063: ExtraModule.E1063,
        E1064: ExtraModule.E1064,
        E1066: ExtraModule.E1066, E1067: ExtraModule.E1067, E1068: ExtraModule.E1068,
        E1069: ExtraModule.E1069,
        E1071: ExtraModule.E1071, E1072: ExtraModule.E1072, E1073: ExtraModule.E1073,
        E1074: ExtraModule.E1074,
        E1076: ExtraModule.E1076, E1077: ExtraModule.E1077, E1078: ExtraModule.E1078,
        E1079: ExtraModule.E1079,
        E1085: ExtraModule.E1085, E1086: ExtraModule.E1086, E1087: ExtraModule.E1087,
        E1088: ExtraModule.E1088, E1089: ExtraModule.E1089, E1090: ExtraModule.E1090,
        E1092: ExtraModule.E1092, E1093: ExtraModule.E1093, E1094: ExtraModule.E1094,
        E1095: ExtraModule.E1095, E1096: ExtraModule.E1096,
        E1102: ExtraModule.E1102, E1103: ExtraModule.E1103, E1104: ExtraModule.E1104,
        E1105: ExtraModule.E1105, E1106: ExtraModule.E1106, E1107: ExtraModule.E1107,
        E1112: ExtraModule.E1112, E1113: ExtraModule.E1113,
        getExtraBase: ExtraModule.getExtraBase,
        getComparison: ExtraModule.getComparison,
        getEstDetail: ExtraModule.getEstDetail,
        getRealDetail: ExtraModule.getRealDetail,
        getTargetProj: ExtraModule.getTargetProj,
        getRealProj: ExtraModule.getRealProj,
        getEstBadges: ExtraModule.getEstBadges,
        getRealBadges: ExtraModule.getRealBadges,
        calculateAllExtras: ExtraModule.calculateAllExtras
    };

    function _extractFp(est) {
        return {
            E655: est.E655, E656: est.E656, E657: est.E657, E658: est.E658,
            E659: est.E659, E660: est.E660, E661: est.E661, E662: est.E662,
            E663: est.E663, E668: est.E668, E669: est.E669, E670: est.E670,
            E671: est.E671, E677: est.E677, E678: est.E678, E679: est.E679
        };
    }

    function _extractCp(est) {
        return {
            E787: est.E787, E788: est.E788, E789: est.E789, E790: est.E790,
            E791: est.E791, E792: est.E792,
            E797: est.E797, E798: est.E798, E799: est.E799,
            E800: est.E800, E801: est.E801, E802: est.E802, E803: est.E803,
            E805: est.E805, E806: est.E806, E807: est.E807,
            E808: est.E808, E809: est.E809
        };
    }

    function _refreshEstFare(valid, est, fp) {
        const updatedEst = Object.assign({}, est);
        updatedEst.E693 = Fare.E693(valid);
        updatedEst.E698 = Fare.E698(valid, fp);
        updatedEst.E699 = Fare.E699(valid, fp);
        updatedEst.E700 = Fare.E700(valid, fp);
        return updatedEst;
    }

    function estimatePickup(valid, uiStateE71) {
        const fp = Fare.getFareParams(valid, uiStateE71);
        const cp = Cost.getCostParams(valid, fp.E662);
        const mode = valid.E10;
        const cc = valid.E22;
        const hargaBBM = fp.E659;
        const pickupCost = Cost.calcPickupEstimate(fp, cp, mode, cc, hargaBBM);
        return Object.assign({}, fp, cp, pickupCost);
    }

    function estimateDropoff(valid, pickupEst) {
        const fp = _extractFp(pickupEst);
        const cp = _extractCp(pickupEst);
        const mode = valid.E10;
        const cc = valid.E22;
        const hargaBBM = fp.E659;
        let dynamicFare;
        if (valid.E36 === 'online') {
            dynamicFare = Fare.calcOnlineFare(valid, fp);
        } else {
            dynamicFare = Fare.calcOfflineFare(valid, fp);
        }
        const dropoffCost = Cost.calcDropoffEstimate(valid, fp, cp, mode, cc, hargaBBM, dynamicFare, pickupEst);
        const est = Object.assign({}, fp, cp, pickupEst, dynamicFare, dropoffCost);
        const extraBase = Extra.getExtraBase(valid, est, null);
        const comparison = Extra.getComparison(est);
        const estDetail = Extra.getEstDetail(est);
        const estBadges = Extra.getEstBadges(valid, est);
        return Object.assign({}, est, extraBase, comparison, estDetail, estBadges);
    }

    function realityPickup(valid, est) {
        const fp = _extractFp(est);
        const cp = _extractCp(est);
        const mode = valid.E10;
        const cc = valid.E22;
        const hargaBBM = fp.E659;
        const pickupCostReal = Cost.calcPickupReality(valid, fp, cp, mode, cc, hargaBBM);
        const pickupAdj = Fare.calcPickupAdj(est, valid);
        return Object.assign({}, pickupCostReal, pickupAdj);
    }

    function realityDropoff(valid, est, pickupReal) {
        const fp = _extractFp(est);
        const cp = _extractCp(est);
        const mode = valid.E10;
        const cc = valid.E22;
        const hargaBBM = fp.E659;
        const refreshedEst = _refreshEstFare(valid, est, fp);
        const dropoffCostReal = Cost.calcDropoffReality(valid, fp, cp, mode, cc, hargaBBM, refreshedEst, pickupReal);
        const dropoffAdj = Fare.calcDropoffAdj(refreshedEst, valid);
        const real = Object.assign({}, refreshedEst, pickupReal, dropoffCostReal, dropoffAdj);
        const extraBase = Extra.getExtraBase(valid, refreshedEst, real);
        const realDetail = Extra.getRealDetail(valid, real);
        const targetProj = Extra.getTargetProj(realDetail, extraBase.E1002, valid.E36);
        const realProj = Extra.getRealProj(valid, real, extraBase.E998, extraBase.E1000);
        const realBadges = Extra.getRealBadges(real, refreshedEst);
        return Object.assign({}, real, extraBase, realDetail, targetProj, realProj, realBadges);
    }

    function reality(valid, est, uiStateE71) {
        if (!est) {
            const pickupEst = estimatePickup(valid, uiStateE71);
            est = estimateDropoff(valid, pickupEst);
        }
        const pickupReal = realityPickup(valid, est);
        return realityDropoff(valid, est, pickupReal);
    }

    function complete(valid, uiStateE71) {
        return reality(valid, null, uiStateE71);
    }

    function getMaxPickupDistance() {
        return DATA.E260;
    }

    function getMaxPickupTime() {
        return DATA.E267;
    }

    function getOperationalCost(valid, distance, time) {
        return Cost.calcOperationalCost(valid.E10, valid.E22, valid.E26, valid.E24, distance, time);
    }

    return {
        ENGINE_VERSION,
        F_V,
        Valid,
        Fare,
        Cost,
        Extra,
        estimatePickup,
        estimateDropoff,
        realityPickup,
        realityDropoff,
        reality,
        complete,
        getMaxPickupDistance,
        getMaxPickupTime,
        getOperationalCost
    };
})();

if (typeof window !== 'undefined') {
    window.Engine = Engine;
    console.log('[API] Engine v' + Engine.ENGINE_VERSION + ' (file v' + Engine.F_V + ') dimuat');
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Engine };
}

// ================================ End Of File ================================

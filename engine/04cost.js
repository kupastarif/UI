/**
 * =============================================================================
 * FILE        : /engine/04cost.js
 * VERSI FILE  : 1.0.1-rev0
 * ENGINE      : 1.0.1-beta
 * DATE        : 16 Juli 2026
 * AUTHOR      : gk
 *
 * DATA SOURCE : Excel "v9.7k masterapp.xlsx" — Sheet "v9.7k-All"
 *
 * DESKRIPSI   :
 *   Modul kalkulasi biaya (cost) berbasis objek kalkulasi sementara `temp`.
 *   Setiap sel formula dari Excel (E787, E788, …) diimplementasikan sebagai
 *   pure function dengan signature `(temp) => value` dan properti `deps` yang
 *   mendeklarasikan sel‑sel lain yang diperlukan.
 *   Seluruh wrapper internal (getCostParams, calcPickupEstimate, dll.) dihapus
 *   – orkestrasi diserahkan ke 06api.js.
 *
 *   Fungsi convenience calcOperationalCost tetap dipertahankan untuk menghitung
 *   biaya operasional murni tanpa melalui `temp`.
 *   Tersedia hook `setLookupCache` untuk injeksi tabel prekomputasi oleh cache
 *   (07cache.js) sehingga mode maksimal dapat berjalan lebih cepat.
 *
 * CATATAN     :
 *   - Seluruh akses ke konstanta diambil dari DATA (global).
 *   - Helper getAFC dan getPerawatanSpeedFactor dapat menggunakan cache
 *     internal jika telah diisi melalui setLookupCache.
 *   - Komentar pada setiap fungsi sel merujuk langsung ke sel Excel untuk
 *     memudahkan sinkronisasi.
 * =============================================================================
 */

const Cost = (function() {
    'use strict';

    // ==================== VERSI FILE ====================
    const F_V = '1.0.1-rev0';

    // ==================== LOOKUP CACHE (untuk mode maksimal) ====================
    let _afcCache = null;         // Map: 'mode_energi_speed' -> value
    let _maintCache = null;       // Map: speed -> factor

    /**
     * Dipanggil oleh 07cache.js untuk menginjeksi tabel prekomputasi.
     * @param {Map} afcTable   - Map dengan key 'mode_energi_speed'
     * @param {Map} maintTable - Map dengan key kecepatan bulat
     */
    function setLookupCache(afcTable, maintTable) {
        _afcCache = afcTable || null;
        _maintCache = maintTable || null;
    }

    // ==================== HELPER INTERNAL ====================

    /**
     * Mencari nilai AFC (km/liter atau km/kWh) berdasarkan kecepatan.
     * Untuk kecepatan di luar rentang 0-80 km/jam, dikembalikan nilai default.
     * Jika _afcCache tersedia (mode maksimal), pencarian diambil dari tabel.
     *
     * @param {number} speed  - kecepatan (km/jam)
     * @param {string} mode   - 'Mobil' atau 'Motor'
     * @param {string} energi - 'Bensin' atau 'Listrik'
     * @returns {number}
     */
    function getAFC(speed, mode, energi) {
        if (typeof DATA === 'undefined' || !DATA.AFC_TABLE) {
            throw new Error('[Cost] DATA.AFC_TABLE tidak tersedia. Pastikan 01data.js sudah dimuat.');
        }
        // Gunakan cache jika tersedia dan kecepatan valid
        if (_afcCache && speed >= 0 && speed <= 80) {
            const rounded = (Math.round(speed * 2) / 2).toFixed(1);
            const key = mode + '_' + energi + '_' + rounded;
            if (_afcCache.has(key)) return _afcCache.get(key);
        }
        const table = DATA.AFC_TABLE[mode][energi];
        const defaultValue = table[table.length - 1].value; // entri terakhir (Infinity)
        if (speed < 0) return defaultValue;
        // if (speed > 80) return defaultValue;
        // if (speed === 80) return table[table.length - 2].value;
        for (let i = 0; i < table.length; i++) {
            if (speed < table[i].maxSpeed) return table[i].value;
        }
        return defaultValue;
    }

    /**
     * Faktor perawatan berdasarkan kecepatan (E315..E318).
     * Jika _maintCache tersedia, gunakan tabel internal.
     *
     * @param {number} speed
     * @returns {number}
     */
    function getPerawatanSpeedFactor(speed) {
        if (_maintCache) {
            const rounded = Math.round(speed);
            if (_maintCache.has(rounded)) return _maintCache.get(rounded);
        }
        if (speed > 0 && speed <= 20) return DATA.E315;
        if (speed > 20 && speed <= 60) return DATA.E316;
        if (speed > 60 && speed <= 90) return DATA.E317;
        if (speed > 90 && speed <= 120) return DATA.E318;
        return DATA.E315;
    }

    /**
     * Total pajak per tahun (Rp/tahun) berdasarkan item pajak.
     * @param {string} mode
     * @param {string} cc
     * @returns {number}
     */
    function getTotalTaxPerYear(mode, cc) {
        const items = DATA.getTaxItems(mode, cc);
        let total = 0;
        for (const item of items) {
            if (item.dcell > 0 && item.ecell > 0) {
                total += item.dcell / (item.ecell / 365); // ecell dalam hari -> konversi ke tahun
            }
        }
        return total;
    }

    /**
     * Total biaya atribut per tahun (Rp/tahun).
     * @param {string} mode
     * @returns {number}
     */
    function getTotalAttributePerYear(mode) {
        const items = DATA.getAttributeItems(mode);
        let total = 0;
        for (const item of items) {
            if (item.dcell > 0 && item.ecell > 0) {
                total += item.dcell / (item.ecell / 365);
            }
        }
        return total;
    }

    /**
     * Total biaya perawatan per km (Rp/km).
     * @param {string} mode
     * @param {string} cc
     * @returns {number}
     */
    function getTotalMaintenancePerKm(mode, cc) {
        const items = DATA.getMaintenanceItems(mode, cc);
        let total = 0;
        for (const item of items) {
            if (item.dcell > 0 && item.ecell > 0) {
                total += item.dcell / item.ecell;
            }
        }
        return total;
    }

    /**
     * Penyusutan per menit (Rp/menit).
     * @param {string} mode
     * @param {string} cc
     * @returns {number}
     */
    function getDepreciationPerMenit(mode, cc) {
        const dep = DATA.getDepreciation(mode, cc);
        if (!dep) return 0;
        const selisih = dep.beli - dep.jual;
        const menitPerTahun = DATA.E301 * DATA.E296;
        return selisih / dep.umur / menitPerTahun;
    }

    // ==================== FUNGSI CELL PARAMETER BIAYA STATIS ====================

    /**
     * E787 - selisih BBM seat
     * Excel: =IF(E662="6seat",E445,E444)
     */
    function E787(temp) {
        return temp.E662 === '6seat' ? DATA.E445 : DATA.E444;
    }
    E787.deps = ['E662'];

    /**
     * E788 - selisih BBM cc
     * Excel: =IFS(E22="1000cc",E446, E22="125cc",E446, ...)
     */
    function E788(temp) {
        const cc = temp.E22;
        if (cc === '1000cc' || cc === '125cc') return DATA.E446;
        if (cc === '1500cc' || cc === '160cc') return DATA.E447;
        if (cc === '2000cc' || cc === '200cc') return DATA.E448;
        return DATA.E446; // Listrik
    }
    E788.deps = ['E22'];

    /**
     * E789 - selisih BBM transmisi
     * Excel: =IF(E26="matic",E450,E449)
     */
    function E789(temp) {
        return temp.E26 === 'matic' ? DATA.E450 : DATA.E449;
    }
    E789.deps = ['E26'];

    /**
     * E790 - selisih BBM minyak
     * Excel: =IF(E24="Bio Solar",E452,E451)
     */
    function E790(temp) {
        return temp.E24 === 'Bio Solar' ? DATA.E452 : DATA.E451;
    }
    E790.deps = ['E24'];

    /**
     * E791 - total selisih BBM jemput
     * Excel: =IF(E10="Mobil",E442+E788+E789+E790, E443+E788+E789+E790)
     */
    function E791(temp) {
        const base = temp.E10 === 'Mobil' ? DATA.E442 : DATA.E443;
        return base + temp.E788 + temp.E789 + temp.E790;
    }
    E791.deps = ['E10', 'E788', 'E789', 'E790'];

    /**
     * E792 - total selisih BBM antar
     * Excel: =E787+E788+E789+E790
     */
    function E792(temp) {
        return temp.E787 + temp.E788 + temp.E789 + temp.E790;
    }
    E792.deps = ['E787', 'E788', 'E789', 'E790'];

    /**
     * E797 - harga penyusutan (Rp)
     * Excel: =IFS(E10="Mobil",E22="1000cc",E327-E328, ...)
     */
    function E797(temp) {
        const dep = DATA.getDepreciation(temp.E10, temp.E22);
        return dep ? dep.beli - dep.jual : 0;
    }
    E797.deps = ['E10', 'E22'];

    /**
     * E798 - penyusutan per menit (Rp/menit)
     * Excel: =IF(E10="Mobil", ((E797/E335)/E301)/E296, ...)
     */
    function E798(temp) {
        return getDepreciationPerMenit(temp.E10, temp.E22);
    }
    E798.deps = ['E10', 'E22'];

    /**
     * E799 - total pajak per tahun (Rp)
     */
    function E799(temp) {
        return getTotalTaxPerYear(temp.E10, temp.E22);
    }
    E799.deps = ['E10', 'E22'];

    /**
     * E800 - pajak per menit (Rp/menit)
     * Excel: =(E799/E301)/E296
     */
    function E800(temp) {
        return temp.E799 / (DATA.E301 * DATA.E296);
    }
    E800.deps = ['E799'];

    /**
     * E801 - atribut per menit (Rp/menit)
     * Excel: =IF(E10="Mobil", (E770/E301)/E296, (E781/E301)/E296)
     */
    function E801(temp) {
        return getTotalAttributePerYear(temp.E10) / (DATA.E301 * DATA.E296);
    }
    E801.deps = ['E10'];

    /**
     * E802 - total perawatan per km (Rp/km)
     * Excel: =IF(E10="Mobil", E771, E782)
     */
    function E802(temp) {
        return getTotalMaintenancePerKm(temp.E10, temp.E22);
    }
    E802.deps = ['E10', 'E22'];

    /**
     * E803 - faktor perawatan sesuai cc
     * Excel: =IFS(E22="1000cc",E319, ...)
     */
    function E803(temp) {
        const cc = temp.E22;
        if (cc === '1000cc' || cc === '125cc' || cc === 'Listrik') return DATA.E319;
        if (cc === '1500cc' || cc === '160cc') return DATA.E320;
        if (cc === '2000cc' || cc === '200cc') return DATA.E321;
        return DATA.E319;
    }
    E803.deps = ['E22'];

    /**
     * E805 - biaya langganan agar dapat order (driver)
     * Excel: =IFS(AND(E10="Mobil",E36="online",E46="Hemat"),E240, ...)
     */
    function E805(temp) {
        if (temp.E36 === 'offline') return 0;
        const map = temp.E10 === 'Mobil' ? DATA.BIAYA_LANGGANAN_LAYANAN.Mobil : DATA.BIAYA_LANGGANAN_LAYANAN.Motor;
        return map[temp.E46] !== undefined ? map[temp.E46] : 0;
    }
    E805.deps = ['E36', 'E10', 'E46'];

    /**
     * E806 - beban load google map per sesi (Rp)
     * Excel: =IF(E36="offline",0, E116*E117)
     */
    function E806(temp) {
        return temp.E36 === 'offline' ? 0 : DATA.E116 * DATA.E117;
    }
    E806.deps = ['E36'];

    /**
     * E807 - beban load google map per order (Rp)
     * Excel: =IF(E36="offline",0, E116*E117*E118)
     */
    function E807(temp) {
        return temp.E36 === 'offline' ? 0 : DATA.E116 * DATA.E117 * DATA.E118;
    }
    E807.deps = ['E36'];

    /**
     * E808 - total beban lainnya driver (kepada aplikasi)
     * Excel: =E805
     */
    function E808(temp) {
        return temp.E805;
    }
    E808.deps = ['E805'];

    /**
     * E809 - total beban lainnya aplikasi
     * Excel: =IF(E36="online", E807, 0)
     */
    function E809(temp) {
        return temp.E36 === 'online' ? temp.E807 : 0;
    }
    E809.deps = ['E36', 'E807'];

    // ==================== FUNGSI CELL ESTIMASI PICKUP ====================

    /**
     * E863 - kecepatan penjemputan est (km/jam)
     * Excel: =E260/(E671/E295)
     */
    function E863(temp) {
        return (DATA.E260 / (temp.E671 / DATA.E295));
    }
    E863.deps = ['E671'];

    /**
     * E879 - afc jemput mobil only est
     * Excel (mobil): lookup AFC berdasarkan kecepatan, untuk motor = 1
     */
    function E879(temp) {
        if (temp.E10 === 'Motor') return 1;
        const energi = DATA.getEnergyType(temp.E22);
        return getAFC(temp.E863, 'Mobil', energi);
    }
    E879.deps = ['E10', 'E22', 'E863'];

    /**
     * E880 - afc jemput motor only est
     */
    function E880(temp) {
        if (temp.E10 === 'Mobil') return 1;
        const energi = DATA.getEnergyType(temp.E22);
        return getAFC(temp.E863, 'Motor', energi);
    }
    E880.deps = ['E10', 'E22', 'E863'];

    /**
     * E881 - penyesuaian kendaraan afc jemput est
     * Excel: =IF(E10="Mobil", E879-(E879*E791), E880-(E880*E791))
     */
    function E881(temp) {
        const energi = DATA.getEnergyType(temp.E22);
        const afcMentah = getAFC(temp.E863, temp.E10, energi);
        return afcMentah - (afcMentah * temp.E791);
    }
    E881.deps = ['E10', 'E22', 'E863', 'E791'];

    /**
     * E901 - beban BBM penjemputan est (Rp)
     * Excel: =(E260/E881)*E659
     */
    function E901(temp) {
        return (DATA.E260 / temp.E881) * temp.E659;
    }
    E901.deps = ['E881', 'E659'];

    /**
     * E917 - perawatan sesuai kecepatan jemput est
     * Excel: =IFS(E863>0...)
     */
    function E917(temp) {
        return getPerawatanSpeedFactor(temp.E863);
    }
    E917.deps = ['E863'];

    /**
     * E919 - perawatan per km jemput est (Rp/km)
     * Excel: =E802*(1+E803)*(1+E917)
     */
    function E919(temp) {
        return temp.E802 * (1 + temp.E803) * (1 + temp.E917);
    }
    E919.deps = ['E802', 'E803', 'E917'];

    /**
     * E921 - perawatan jemput total est (Rp)
     * Excel: =E260*E919
     */
    function E921(temp) {
        return DATA.E260 * temp.E919;
    }
    E921.deps = ['E919'];

    /**
     * E815 - penyusutan jemput est (Rp)
     * Excel: =E671*E798
     */
    function E815(temp) {
        return temp.E671 * temp.E798;
    }
    E815.deps = ['E671', 'E798'];

    /**
     * E831 - pajak jemput est (Rp)
     * Excel: =E671*E800
     */
    function E831(temp) {
        return temp.E671 * temp.E800;
    }
    E831.deps = ['E671', 'E800'];

    /**
     * E847 - atribut jemput est (Rp)
     * Excel: =E671*E801
     */
    function E847(temp) {
        return temp.E671 * temp.E801;
    }
    E847.deps = ['E671', 'E801'];

    /**
     * E944 - beban total jemput est (Rp)
     * Excel: =E921+E901+E847+E831+E815
     */
    function E944(temp) {
        return temp.E921 + temp.E901 + temp.E847 + temp.E831 + temp.E815;
    }
    E944.deps = ['E921', 'E901', 'E847', 'E831', 'E815'];

    /**
     * E947 - beban non BBM total jemput est (Rp)
     * Excel: =E921+E847+E831+E815
     */
    function E947(temp) {
        return temp.E921 + temp.E847 + temp.E831 + temp.E815;
    }
    E947.deps = ['E921', 'E847', 'E831', 'E815'];

    // ==================== FUNGSI CELL ESTIMASI DROPOFF ====================

    /**
     * E864 - kecepatan pengantaran est (km/jam)
     * Excel: =E708/(E715/E295)
     */
    function E864(temp) {
        return (temp.E708 / (temp.E715 / DATA.E295));
    }
    E864.deps = ['E708', 'E715'];

    /**
     * E865 - kecepatan total est
     * Excel: =(E260+E708)/((E671+E715)/E295)
     */
    function E865(temp) {
        return (DATA.E260 + temp.E708) / ((temp.E671 + temp.E715) / DATA.E295);
    }
    E865.deps = ['E708', 'E671', 'E715'];

    /**
     * E882 - afc antar mobil only est
     */
    function E882(temp) {
        if (temp.E10 === 'Motor') return 1;
        const energi = DATA.getEnergyType(temp.E22);
        return getAFC(temp.E864, 'Mobil', energi);
    }
    E882.deps = ['E10', 'E22', 'E864'];

    /**
     * E883 - afc antar motor only est
     */
    function E883(temp) {
        if (temp.E10 === 'Mobil') return 1;
        const energi = DATA.getEnergyType(temp.E22);
        return getAFC(temp.E864, 'Motor', energi);
    }
    E883.deps = ['E10', 'E22', 'E864'];

    /**
     * E884 - penyesuaian kendaraan afc antar est
     * Excel: =IF(E10="Mobil", E882-(E882*E792), E883-(E883*E792))
     */
    function E884(temp) {
        const energi = DATA.getEnergyType(temp.E22);
        const afcMentah = getAFC(temp.E864, temp.E10, energi);
        return afcMentah - (afcMentah * temp.E792);
    }
    E884.deps = ['E10', 'E22', 'E864', 'E792'];

    /**
     * E902 - beban BBM pengantaran est (Rp)
     * Excel: =(E708/E884)*E659
     */
    function E902(temp) {
        return (temp.E708 / temp.E884) * temp.E659;
    }
    E902.deps = ['E708', 'E884', 'E659'];

    /**
     * E903 - beban BBM total est
     * Excel: =E901+E902
     */
    function E903(temp) {
        return temp.E901 + temp.E902;
    }
    E903.deps = ['E901', 'E902'];

    /**
     * E918 - perawatan sesuai kecepatan antar est
     */
    function E918(temp) {
        return getPerawatanSpeedFactor(temp.E864);
    }
    E918.deps = ['E864'];

    /**
     * E920 - perawatan per km antar est (Rp/km)
     * Excel: =E802*(1+E803)*(1+E918)
     */
    function E920(temp) {
        return temp.E802 * (1 + temp.E803) * (1 + temp.E918);
    }
    E920.deps = ['E802', 'E803', 'E918'];

    /**
     * E922 - perawatan antar total est (Rp)
     * Excel: =E708*E920
     */
    function E922(temp) {
        return temp.E708 * temp.E920;
    }
    E922.deps = ['E708', 'E920'];

    /**
     * E923 - perawatan jemput+antar est
     * Excel: =E921+E922
     */
    function E923(temp) {
        return temp.E921 + temp.E922;
    }
    E923.deps = ['E921', 'E922'];

    /**
     * E816 - penyusutan antar est (Rp)
     * Excel: =E715*E798
     */
    function E816(temp) {
        return temp.E715 * temp.E798;
    }
    E816.deps = ['E715', 'E798'];

    /**
     * E817 - penyusutan total est
     * Excel: =E815+E816
     */
    function E817(temp) {
        return temp.E815 + temp.E816;
    }
    E817.deps = ['E815', 'E816'];

    /**
     * E832 - pajak antar est (Rp)
     * Excel: =E715*E800
     */
    function E832(temp) {
        return temp.E715 * temp.E800;
    }
    E832.deps = ['E715', 'E800'];

    /**
     * E833 - pajak total est
     * Excel: =E831+E832
     */
    function E833(temp) {
        return temp.E831 + temp.E832;
    }
    E833.deps = ['E831', 'E832'];

    /**
     * E848 - atribut antar est (Rp)
     * Excel: =E715*E801
     */
    function E848(temp) {
        return temp.E715 * temp.E801;
    }
    E848.deps = ['E715', 'E801'];

    /**
     * E849 - atribut total est
     * Excel: =E847+E848
     */
    function E849(temp) {
        return temp.E847 + temp.E848;
    }
    E849.deps = ['E847', 'E848'];

    /**
     * E941 - beban pajak dan iuran jemput est
     * Excel: =E831+E847
     */
    function E941(temp) {
        return temp.E831 + temp.E847;
    }
    E941.deps = ['E831', 'E847'];

    /**
     * E942 - beban pajak dan iuran antar est
     * Excel: =E832+E848
     */
    function E942(temp) {
        return temp.E832 + temp.E848;
    }
    E942.deps = ['E832', 'E848'];

    /**
     * E943 - beban pajak dan iuran total est
     * Excel: =E833+E849
     */
    function E943(temp) {
        return temp.E833 + temp.E849;
    }
    E943.deps = ['E833', 'E849'];

    /**
     * E945 - beban total antar est
     * Excel: =E922+E902+E848+E832+E816
     */
    function E945(temp) {
        return temp.E922 + temp.E902 + temp.E848 + temp.E832 + temp.E816;
    }
    E945.deps = ['E922', 'E902', 'E848', 'E832', 'E816'];

    /**
     * E948 - beban non BBM antar est
     * Excel: =E922+E848+E832+E816
     */
    function E948(temp) {
        return temp.E922 + temp.E848 + temp.E832 + temp.E816;
    }
    E948.deps = ['E922', 'E848', 'E832', 'E816'];

    /**
     * E946 - beban total jemput-antar est
     * Excel: =E944+E945
     */
    function E946(temp) {
        return temp.E944 + temp.E945;
    }
    E946.deps = ['E944', 'E945'];

    /**
     * E949 - beban non BBM total est
     * Excel: =E947+E948
     */
    function E949(temp) {
        return temp.E947 + temp.E948;
    }
    E949.deps = ['E947', 'E948'];

    // --- Pendapatan & Persentase Est ---
    /**
     * E969 - pendapatan driver estimasi (Rp)
     * Excel: =IF(E36="online", (E697-E692-E699-E946)-E808, (E700-E946)+E684)
     */
    function E969(temp) {
        if (temp.E36 === 'online') {
            return (temp.E697 - temp.E692 - temp.E699 - temp.E946) - temp.E808;
        } else {
            return (temp.E700 - temp.E946) + temp.E684;
        }
    }
    E969.deps = ['E36', 'E697', 'E692', 'E699', 'E946', 'E808', 'E700', 'E684'];

    /**
     * E970 - pendapatan aplikasi estimasi (Rp)
     * Excel: =(E692+E699+E808)-E809
     */
    function E970(temp) {
        return (temp.E692 + temp.E699 + temp.E808) - temp.E809;
    }
    E970.deps = ['E692', 'E699', 'E808', 'E809'];

    /**
     * E971 - persentase pendapatan aplikasi estimasi
     * Excel: =E970/E697
     */
    function E971(temp) {
        return temp.E970 / temp.E697;
    }
    E971.deps = ['E970', 'E697'];

    /**
     * E972 - persentase pendapatan driver estimasi
     */
    function E972(temp) {
        return temp.E969 / temp.E697;
    }
    E972.deps = ['E969', 'E697'];

    /**
     * E973 - persentase operasional estimasi
     */
    function E973(temp) {
        return temp.E946 / temp.E697;
    }
    E973.deps = ['E946', 'E697'];

    /**
     * E974 - persentase beban aplikasi estimasi
     */
    function E974(temp) {
        return temp.E809 / temp.E697;
    }
    E974.deps = ['E809', 'E697'];

    /**
     * E975 - verify persentase penumpang est (100%)
     * Excel: =E971+E972+E973+E974
     */
    function E975(temp) {
        return temp.E971 + temp.E972 + temp.E973 + temp.E974;
    }
    E975.deps = ['E971', 'E972', 'E973', 'E974'];

    // ==================== FUNGSI CELL REALITAS PICKUP ====================

    /**
     * E871 - kecepatan penjemputan real (km/jam)
     * Excel: =E78/(E80/E295)
     */
    function E871(temp) {
        return (temp.E78 / (temp.E80 / DATA.E295));
    }
    E871.deps = ['E78', 'E80'];

    /**
     * E890 - afc jemput mobil only real
     */
    function E890(temp) {
        if (temp.E10 === 'Motor') return 1;
        const energi = DATA.getEnergyType(temp.E22);
        return getAFC(temp.E871, 'Mobil', energi);
    }
    E890.deps = ['E10', 'E22', 'E871'];

    /**
     * E891 - afc jemput motor only real
     */
    function E891(temp) {
        if (temp.E10 === 'Mobil') return 1;
        const energi = DATA.getEnergyType(temp.E22);
        return getAFC(temp.E871, 'Motor', energi);
    }
    E891.deps = ['E10', 'E22', 'E871'];

    /**
     * E892 - penyesuaian afc jemput real
     */
    function E892(temp) {
        const energi = DATA.getEnergyType(temp.E22);
        const afcMentah = getAFC(temp.E871, temp.E10, energi);
        return afcMentah - (afcMentah * temp.E791);
    }
    E892.deps = ['E10', 'E22', 'E871', 'E791'];

    /**
     * E909 - beban BBM penjemputan real (Rp)
     * Excel: =(E78/E892)*E659
     */
    function E909(temp) {
        return (temp.E78 / temp.E892) * temp.E659;
    }
    E909.deps = ['E78', 'E892', 'E659'];

    /**
     * E929 - perawatan sesuai kecepatan jemput real
     */
    function E929(temp) {
        return getPerawatanSpeedFactor(temp.E871);
    }
    E929.deps = ['E871'];

    /**
     * E931 - perawatan per km jemput real (Rp/km)
     */
    function E931(temp) {
        return temp.E802 * (1 + temp.E803) * (1 + temp.E929);
    }
    E931.deps = ['E802', 'E803', 'E929'];

    /**
     * E933 - perawatan jemput real (Rp)
     */
    function E933(temp) {
        return temp.E78 * temp.E931;
    }
    E933.deps = ['E78', 'E931'];

    /**
     * E823 - penyusutan jemput real
     */
    function E823(temp) {
        return temp.E80 * temp.E798;
    }
    E823.deps = ['E80', 'E798'];

    /**
     * E839 - pajak jemput real
     */
    function E839(temp) {
        return temp.E80 * temp.E800;
    }
    E839.deps = ['E80', 'E800'];

    /**
     * E855 - atribut jemput real
     */
    function E855(temp) {
        return temp.E80 * temp.E801;
    }
    E855.deps = ['E80', 'E801'];

    /**
     * E958 - beban total jemput real
     */
    function E958(temp) {
        return temp.E933 + temp.E909 + temp.E855 + temp.E839 + temp.E823;
    }
    E958.deps = ['E933', 'E909', 'E855', 'E839', 'E823'];

    /**
     * E961 - beban non BBM jemput real
     */
    function E961(temp) {
        return temp.E933 + temp.E855 + temp.E839 + temp.E823;
    }
    E961.deps = ['E933', 'E855', 'E839', 'E823'];

    // ==================== FUNGSI CELL REALITAS DROPOFF ====================

    /**
     * E872 - kecepatan pengantaran real
     */
    function E872(temp) {
        return (temp.E82 / (temp.E84 / DATA.E295));
    }
    E872.deps = ['E82', 'E84'];

    /**
     * E873 - kecepatan total real
     */
    function E873(temp) {
        return (temp.E78 + temp.E82) / ((temp.E80 + temp.E84) / DATA.E295);
    }
    E873.deps = ['E78', 'E82', 'E80', 'E84'];

    /**
     * E893 - afc antar mobil only real
     */
    function E893(temp) {
        if (temp.E10 === 'Motor') return 1;
        const energi = DATA.getEnergyType(temp.E22);
        return getAFC(temp.E872, 'Mobil', energi);
    }
    E893.deps = ['E10', 'E22', 'E872'];

    /**
     * E894 - afc antar motor only real
     */
    function E894(temp) {
        if (temp.E10 === 'Mobil') return 1;
        const energi = DATA.getEnergyType(temp.E22);
        return getAFC(temp.E872, 'Motor', energi);
    }
    E894.deps = ['E10', 'E22', 'E872'];

    /**
     * E895 - penyesuaian afc antar real
     */
    function E895(temp) {
        const energi = DATA.getEnergyType(temp.E22);
        const afcMentah = getAFC(temp.E872, temp.E10, energi);
        return afcMentah - (afcMentah * temp.E792);
    }
    E895.deps = ['E10', 'E22', 'E872', 'E792'];

    /**
     * E910 - beban BBM pengantaran real (Rp)
     */
    function E910(temp) {
        return (temp.E82 / temp.E895) * temp.E659;
    }
    E910.deps = ['E82', 'E895', 'E659'];

    /**
     * E911 - beban BBM total real
     */
    function E911(temp) {
        return temp.E909 + temp.E910;
    }
    E911.deps = ['E909', 'E910'];

    /**
     * E930 - perawatan sesuai kecepatan antar real
     */
    function E930(temp) {
        return getPerawatanSpeedFactor(temp.E872);
    }
    E930.deps = ['E872'];

    /**
     * E932 - perawatan per km antar real (Rp/km)
     */
    function E932(temp) {
        return temp.E802 * (1 + temp.E803) * (1 + temp.E930);
    }
    E932.deps = ['E802', 'E803', 'E930'];

    /**
     * E934 - perawatan antar real (Rp)
     */
    function E934(temp) {
        return temp.E82 * temp.E932;
    }
    E934.deps = ['E82', 'E932'];

    /**
     * E935 - perawatan total real
     */
    function E935(temp) {
        return temp.E933 + temp.E934;
    }
    E935.deps = ['E933', 'E934'];

    /**
     * E824 - penyusutan antar real
     */
    function E824(temp) {
        return temp.E84 * temp.E798;
    }
    E824.deps = ['E84', 'E798'];

    /**
     * E825 - penyusutan total real
     */
    function E825(temp) {
        return temp.E823 + temp.E824;
    }
    E825.deps = ['E823', 'E824'];

    /**
     * E840 - pajak antar real
     */
    function E840(temp) {
        return temp.E84 * temp.E800;
    }
    E840.deps = ['E84', 'E800'];

    /**
     * E841 - pajak total real
     */
    function E841(temp) {
        return temp.E839 + temp.E840;
    }
    E841.deps = ['E839', 'E840'];

    /**
     * E856 - atribut antar real
     */
    function E856(temp) {
        return temp.E84 * temp.E801;
    }
    E856.deps = ['E84', 'E801'];

    /**
     * E857 - atribut total real
     */
    function E857(temp) {
        return temp.E855 + temp.E856;
    }
    E857.deps = ['E855', 'E856'];

    /**
     * E955 - beban pajak dan iuran jemput real
     */
    function E955(temp) {
        return temp.E839 + temp.E855;
    }
    E955.deps = ['E839', 'E855'];

    /**
     * E956 - beban pajak dan iuran antar real
     */
    function E956(temp) {
        return temp.E840 + temp.E856;
    }
    E956.deps = ['E840', 'E856'];

    /**
     * E957 - beban pajak dan iuran total real
     */
    function E957(temp) {
        return temp.E841 + temp.E857;
    }
    E957.deps = ['E841', 'E857'];

    /**
     * E959 - beban total antar real
     */
    function E959(temp) {
        return temp.E934 + temp.E910 + temp.E856 + temp.E840 + temp.E824;
    }
    E959.deps = ['E934', 'E910', 'E856', 'E840', 'E824'];

    /**
     * E962 - beban non BBM antar real
     */
    function E962(temp) {
        return temp.E934 + temp.E856 + temp.E840 + temp.E824;
    }
    E962.deps = ['E934', 'E856', 'E840', 'E824'];

    /**
     * E960 - beban total real
     */
    function E960(temp) {
        return temp.E958 + temp.E959;
    }
    E960.deps = ['E958', 'E959'];

    /**
     * E963 - beban non BBM total real
     */
    function E963(temp) {
        return temp.E961 + temp.E962;
    }
    E963.deps = ['E961', 'E962'];

    // --- Pendapatan & Persentase Realitas ---
    /**
     * E981 - pendapatan driver real (Rp)
     * Excel: =IF(E36="online", (E700-E960)-E808, (E700-E960)+E684)
     */
    function E981(temp) {
        if (temp.E36 === 'online') {
            return (temp.E700 - temp.E960) - temp.E808;
        } else {
            return (temp.E700 - temp.E960) + temp.E684;
        }
    }
    E981.deps = ['E36', 'E700', 'E960', 'E808', 'E684'];

    /**
     * E982 - pendapatan aplikasi real
     * Excel: =(E693+E699+E808)-E809
     */
    function E982(temp) {
        return (temp.E693 + temp.E699 + temp.E808) - temp.E809;
    }
    E982.deps = ['E693', 'E699', 'E808', 'E809'];

    /**
     * E983 - persentase pendapatan aplikasi real
     */
    function E983(temp) {
        return temp.E982 / temp.E697;
    }
    E983.deps = ['E982', 'E697'];

    /**
     * E984 - persentase pendapatan driver real
     */
    function E984(temp) {
        return temp.E981 / temp.E697;
    }
    E984.deps = ['E981', 'E697'];

    /**
     * E985 - persentase operasional real
     */
    function E985(temp) {
        return temp.E960 / temp.E697;
    }
    E985.deps = ['E960', 'E697'];

    /**
     * E986 - persentase beban aplikasi real
     */
    function E986(temp) {
        return temp.E809 / temp.E697;
    }
    E986.deps = ['E809', 'E697'];

    /**
     * E987 - verify persentase penumpang real (100%)
     */
    function E987(temp) {
        return temp.E983 + temp.E984 + temp.E985 + temp.E986;
    }
    E987.deps = ['E983', 'E984', 'E985', 'E986'];

    // ==================== FUNGSI OPERASIONAL MANDIRI ====================
    /**
     * calcOperationalCost
     * Menghitung biaya operasional murni tanpa order.
     * Tidak bergantung pada `temp` – seluruh input diterima sebagai parameter.
     *
     * @param {string} mode     - 'Mobil' / 'Motor'
     * @param {string} cc       - kapasitas mesin
     * @param {string} transmisi - 'manual' / 'matic'
     * @param {string} bbm      - tipe energi
     * @param {number} distance - jarak (km)
     * @param {number} time     - waktu (menit)
     * @returns {{ bbm: number, maintenance: number, depreciation: number, tax: number, attribute: number, total: number }}
     */
    function calcOperationalCost(mode, cc, transmisi, bbm, distance, time) {
        const energi = DATA.getEnergyType(cc);
        const speed = time > 0 ? (distance / (time / 60)) : 0;

        // AFC
        const afc = getAFC(speed, mode, energi);
        const totalSelisihBBM = (
            (mode === 'Mobil' ? DATA.E442 : DATA.E443)
            + (cc === '1000cc' || cc === '125cc' ? DATA.E446 : cc === '1500cc' || cc === '160cc' ? DATA.E447 : cc === '2000cc' || cc === '200cc' ? DATA.E448 : DATA.E446)
            + (transmisi === 'matic' ? DATA.E450 : DATA.E449)
            + (bbm === 'Bio Solar' ? DATA.E452 : DATA.E451)
        );
        const afcAdjusted = afc - (afc * totalSelisihBBM);

        const hargaBBM_map = {
            'Pertalite': DATA.E302, 'Bio Solar': DATA.E303,
            'SPKLU+': DATA.E308, 'Swap Battery': DATA.E309, 'Pertamax': DATA.E304
        };
        const hargaBBM = hargaBBM_map[bbm] || DATA.E302;
        const costBBM = (distance / afcAdjusted) * hargaBBM;

        const maintPerKm = getTotalMaintenancePerKm(mode, cc);
        const faktorCC = (cc === '1000cc' || cc === '125cc' || cc === 'Listrik') ? DATA.E319 :
                         (cc === '1500cc' || cc === '160cc') ? DATA.E320 : DATA.E321;
        const faktorKecepatan = getPerawatanSpeedFactor(speed);
        const maintPerKmAdj = maintPerKm * (1 + faktorCC) * (1 + faktorKecepatan);
        const costMaintenance = distance * maintPerKmAdj;

        const penyusutanPerMenit = getDepreciationPerMenit(mode, cc);
        const costDepreciation = time * penyusutanPerMenit;

        const pajakPerMenit = getTotalTaxPerYear(mode, cc) / (DATA.E301 * DATA.E296);
        const costTax = time * pajakPerMenit;

        const atributPerMenit = getTotalAttributePerYear(mode) / (DATA.E301 * DATA.E296);
        const costAttribute = time * atributPerMenit;

        return {
            bbm: costBBM,
            maintenance: costMaintenance,
            depreciation: costDepreciation,
            tax: costTax,
            attribute: costAttribute,
            total: costBBM + costMaintenance + costDepreciation + costTax + costAttribute
        };
    }

    // ==================== EKSPOR ====================
    return {
        F_V,

        // Semua fungsi cell
        E787, E788, E789, E790, E791, E792, E797, E798, E799, E800, E801, E802, E803,
        E805, E806, E807, E808, E809,
        E815, E831, E847, E863, E879, E880, E881, E901, E917, E919, E921, E944, E947,
        E864, E865, E882, E883, E884, E902, E903, E918, E920, E922, E923,
        E816, E817, E832, E833, E848, E849,
        E941, E942, E943, E945, E948, E946, E949,
        E969, E970, E971, E972, E973, E974, E975,
        E871, E890, E891, E892, E909, E929, E931, E933, E823, E839, E855, E958, E961,
        E872, E873, E893, E894, E895, E910, E911, E930, E932, E934, E935,
        E824, E825, E840, E841, E856, E857,
        E955, E956, E957, E959, E962, E960, E963,
        E981, E982, E983, E984, E985, E986, E987,

        // Convenience & helpers
        calcOperationalCost,
        getAFC,
        getPerawatanSpeedFactor,
        setLookupCache
    };
})();

if (typeof window !== 'undefined') {
    window.Cost = Cost;
    console.log('[COST] v' + Cost.F_V + ' dimuat');
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Cost };
}

// ================================= CHANGELOG =================================
// 1.0.1-rev0 : Seluruh fungsi cell diubah menjadi (temp) => value + properti
//              deps. Wrapper internal dihapus. Parameter buatan dihilangkan.
//              Ditambahkan setLookupCache untuk injeksi tabel prekomputasi
//              oleh cache eksternal. Helper getAFC dan getPerawatanSpeedFactor
//              dapat menggunakan cache internal.
// ================================ End Of File ================================
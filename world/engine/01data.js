/**
 * =============================================================================
 * FILE        : /engine/01data.js
 * VERSI FILE  : 1.0.0-rev3
 * ENGINE      : 1.0.0-beta
 * DATE        : 29 Juni 2026
 * AUTHOR      : gk
 * 
 * DATA SOURCE : Excel "v9.7j masterapp.xlsx" — Sheet "v9.7j-All"
 * 
 * DESKRIPSI   :
 *   Modul penyedia seluruh konstanta, tarif, komisi, data depresiasi,
 *   pajak, perawatan, tabel efisiensi bahan bakar (AFC), dan lookup lainnya.
 *   Semua nilai diambil dari Excel v9.7j dan bersifat read‑only.
 *   Modul ini TIDAK melakukan kalkulasi — hanya menyediakan data mentah
 *   yang akan digunakan oleh modul fare, cost, extra, dan UI.
 * 
 * =============================================================================
 */

const DATA = (function() {
    'use strict';

    // ==================== VERSI FILE ====================
    const F_V = '1.0.0-rev3';

    // ==================== GRUP BIAYA APLIKASI (E116-E119) ====================
    const E116 = 100.0;    // Biaya Muat Peta per Order (Google Map) (Rp)
    const E117 = 2.0;      // Jumlah Pengguna per Order (num)
    const E118 = 2.0;      // Jumlah Muat per Pengguna (num)
    const E119 = 2000.0;   // biaya aplikasi wajar (Rp)

    // ==================== GRUP TARIF MOBIL (E124-E134) ====================
    const E124 = 3500.0;   // Tarif per Km Mobil Jabodetabek (Rp/km)
    const E125 = 3500.0;   // Tarif per Km Mobil SumatraJawa (Rp/km)
    const E126 = 3700.0;   // Tarif per Km Mobil TimurIndonesia (Rp/km)
    const E127 = 6000.0;   // Rerata Biaya Aplikasi Penumpang Mobil Hemat (Rp)
    const E128 = 8000.0;   // Rerata Biaya Aplikasi Penumpang Mobil Standar (Rp)
    const E129 = 10000.0;  // Rerata Biaya Aplikasi Penumpang Mobil XL (Rp)
    const E130 = 12000.0;  // Rerata Biaya Aplikasi Penumpang Mobil Prioritas (Rp)
    const E131 = 15000.0;  // Rerata Biaya Aplikasi Penumpang Mobil Premium (Rp)
    const E132 = 18000.0;  // Rerata Biaya Aplikasi Penumpang Mobil Premium XL (Rp)
    const E133 = 6000.0;   // Tarif Dasar Offline Mobil (Rp/km)
    const E134 = 1500.0;   // Tarif Waktu Offline Mobil (Rp/mnt)

    // ==================== GRUP TARIF MOTOR (E140-E151) ====================
    const E140 = 2600.0;   // Tarif per Km Motor Jabodetabek (Rp/km)
    const E141 = 1800.0;   // Tarif per Km Motor SumatraJawa (Rp/km)
    const E142 = 2100.0;   // Tarif per Km Motor TimurIndonesia (Rp/km)
    const E143 = 3000.0;   // Rerata Biaya Aplikasi Penumpang Motor Hemat (Rp)
    const E144 = 3000.0;   // Rerata Biaya Aplikasi Penumpang Motor Standar (Rp)
    const E145 = 5000.0;   // Rerata Biaya Aplikasi Penumpang Motor XL (Rp)
    const E146 = 6000.0;   // Rerata Biaya Aplikasi Penumpang Motor Prioritas (Rp)
    const E147 = 7000.0;   // Rerata Biaya Aplikasi Penumpang Motor Premium (Rp)
    const E148 = 8000.0;   // Rerata Biaya Aplikasi Penumpang Motor Premium XL (Rp)
    const E149 = 3500.0;   // Tarif Dasar Offline Motor (Rp/km)
    const E150 = 1000.0;   // Tarif Waktu Offline Motor (Rp/mnt)
    const E151 = 2500.0;   // Biaya Langganan Gacor (Rp)

    // ==================== GRUP TARIF TAKSI (E157-E160) ====================
    // Belum diimplementasikan, disimpan untuk pengembangan masa depan
    const E157 = 5000.0;   // Tarif per Km Taksi Jabodetabek (Rp/km)
    const E158 = 5000.0;   // Tarif per Km Taksi SumatraJawa (Rp/km)
    const E159 = 5000.0;   // Tarif per Km Taksi TimurIndonesia (Rp/km)
    const E160 = 7000.0;   // Rerata Biaya Aplikasi Penumpang Taksi Standar (Rp)

    // ==================== GRUP TARIF ANGKOT (E166-E170) ====================
    const E166 = 4.0;      // Rerata Berangkat Jumlah Penumpang (num)
    const E167 = 10.0;     // Rerata Angkot Penuh (num)
    const E168 = 4000.0;   // Tarif Jarak Dekat (< 3 km) (Rp)
    const E169 = 7000.0;   // Tarif Jarak Medium (3-7 km) (Rp)
    const E170 = 10000.0;  // Tarif Jarak Jauh (7-12 km) (Rp)

    // ==================== GRUP TARIF TRANSJAKARTA (E176-E183) ====================
    const E176 = 2000.0;   // Tarif Jam Sepi (Rp)
    const E177 = 3500.0;   // Tarif Jam Sibuk (Rp)
    const E178 = 250.0;    // Jarak Total (km)
    const E179 = 15.0;     // Rerata Jarak per Bis (km)
    const E180 = 30.0;     // Jumlah Kursi Penumpang (num)
    const E181 = 30.0;     // Jumlah Penumpang Jam Sepi (num)
    const E182 = 120.0;    // Jumlah Penumpang Jam Sibuk (num)
    const E183 = 60.0;     // Rerata Jumlah Penumpang (num)

    // ==================== GRUP KOMISI (E188-E195) ====================
    const E188 = 0.08;     // Persentase Ride Bike (num)
    const E189 = 0.05;     // Sejahtera Aplikasi (num)
    const E190 = 0.15;     // Potongan Aplikasi (num)
    const E191 = 0.8;      // Jatah Driver (num)
    const E192 = 0.6;      // Potongan Taksi (num)
    const E193 = 0.4;      // Jatah Driver Taksi (num)
    const E194 = 0.0;      // Potongan Mode Offline (num)
    const E195 = 0.0;      // Potongan Metode Pembayaran (Rp)

    // ==================== GRUP KOMISI PER LAYANAN MOBIL (E200-E205) ====================
    const E200 = 0.15;     // Hemat
    const E201 = 0.15;     // Standar
    const E202 = 0.15;     // XL
    const E203 = 0.15;     // Prioritas
    const E204 = 0.15;     // Premium
    const E205 = 0.15;     // Premium XL

    // ==================== GRUP KOMISI PER LAYANAN MOTOR (E210-E215) ====================
    const E210 = 0.08;     // Hemat
    const E211 = 0.15;     // Standar
    const E212 = 0.15;     // XL
    const E213 = 0.15;     // Prioritas
    const E214 = 0.15;     // Premium
    const E215 = 0.15;     // Premium XL

    // ==================== GRUP KESEJAHTERAAN APLIKASI PER LAYANAN MOBIL (E220-E225) ====================
    const E220 = 0.05;     // Hemat
    const E221 = 0.05;     // Standar
    const E222 = 0.05;     // XL
    const E223 = 0.05;     // Prioritas
    const E224 = 0.05;     // Premium
    const E225 = 0.05;     // Premium XL

    // ==================== GRUP KESEJAHTERAAN APLIKASI PER LAYANAN MOTOR (E230-E235) ====================
    const E230 = 0.00;     // Hemat
    const E231 = 0.05;     // Standar
    const E232 = 0.05;     // XL
    const E233 = 0.05;     // Prioritas
    const E234 = 0.05;     // Premium
    const E235 = 0.05;     // Premium XL

    // ==================== GRUP BIAYA LANGGANAN PER LAYANAN MOBIL (E240-E245) ====================
    const E240 = 0.0;      // Hemat
    const E241 = 0.0;      // Standar
    const E242 = 0.0;      // XL
    const E243 = 0.0;      // Prioritas
    const E244 = 0.0;      // Premium
    const E245 = 0.0;      // Premium XL

    // ==================== GRUP BIAYA LANGGANAN PER LAYANAN MOTOR (E250-E255) ====================
    const E250 = 0.0;   // Hemat
    const E251 = 0.0;      // Standar
    const E252 = 0.0;      // XL
    const E253 = 0.0;      // Prioritas
    const E254 = 0.0;      // Premium
    const E255 = 0.0;      // Premium XL

    // ==================== GRUP ORDER (E260-E280) ====================
    const E260 = 2.0;      // Rerata Jarak Jemput (0-7 km) (km)
    const E261 = 1250.0;   // Tarif Waktu Minimum Mobil (Rp)
    const E262 = 900.0;    // Tarif Waktu Minimum Motor (Rp)
    const E263 = 15.0;     // Kenaikan Tarif per Km Perjalanan Mobil (Rp)
    const E264 = 10.0;     // Kenaikan Tarif per Km Perjalanan Motor (Rp)
    const E265 = 1.0;      // Jarak Minimum Tanpa Tarif Waktu (km)
    const E266 = 2.0;      // Jarak Jemput Ideal Maksimal (km)
    const E267 = 15.0;     // Waktu Jemput dan Tunggu Ideal Maksimal (mnt)
    const E268 = 10.0;     // Rerata Waktu Jemput (0-30 menit, force 10) (mnt)
    const E269 = 5.0;      // Rerata Waktu Tunggu Penumpang (0-10 menit) (mnt)
    const E270 = 0;        // Rerata Selisih Waktu Perjalanan (-5 s.d. +35 menit) (mnt)
    const E271 = 0.0;      // Rerata Selisih Jarak Perjalanan dengan Tarif (-1-2 km, force 0) (km)
    const E272 = 6000.0;   // Tarif Minimum Mobil Ideal (Rp)
    const E273 = 3500.0;   // Tarif Minimum Motor Ideal (Rp)
    const E274 = 20000.0;  // Pendapatan Bersih Minimal Mobil Ideal (Rp)
    const E275 = 15000.0;  // Pendapatan Bersih Minimal Motor Ideal (Rp)
    const E276 = 0.2;      // Persentase Maksimal Pendapatan Aplikasi vs Driver Ideal (num)
    const E277 = 1500.0;   // Tarif Waktu Penyesuaian Mobil (Rp)
    const E278 = 1150.0;   // Tarif Waktu Penyesuaian Motor (Rp)
    const E279 = 50.0;     // Kecepatan Maksimal Mobil Sesuai Aplikasi (km/jam)
    const E280 = 80.0;     // Kecepatan Maksimal Motor Sesuai Aplikasi (km/jam)

    // ==================== GRUP LAYANAN (E285-E290) ====================
    const E285 = 0.0;      // Hemat
    const E286 = 0.0;      // Standar
    const E287 = 0.08;     // XL
    const E288 = 0.08;     // Prioritas
    const E289 = 0.1;      // Premium
    const E290 = 0.18;     // Premium XL

    // ==================== GRUP LAINNYA (E295-E310) ====================
    const E295 = 60.0;      // Menit per Jam (mnt)
    const E296 = 1440.0;    // Menit per Hari (mnt)
    const E297 = 43200.0;   // Menit per Bulan (mnt)
    const E298 = 24.0;      // Jam per Hari (jam)
    const E299 = 720.0;     // Jam per Bulan (jam)
    const E300 = 30.0;      // Hari per Bulan (hari)
    const E301 = 365.0;     // Hari per Tahun (hari)
    const E302 = 10000.0;   // Harga Pertalite per Liter (Rp)
    const E303 = 6500.0;    // Harga Bio Solar (Rp)
    const E304 = 14000.0;   // Harga Pertamax (Rp)
    const E305 = 6000000.0; // UMR Jabodetabek (Rp)
    const E306 = 4000000.0; // UMR SumatraJawa (Rp)
    const E307 = 4000000.0; // UMR TimurIndonesia (Rp)
    const E308 = 5000.0;    // Biaya SPKLU+ per kWh (Rp)
    const E309 = 3500.0;    // Biaya Swap Battery per Sesi (Rp)
    const E310 = 0.0;       // Biaya Pendaftaran Driver (Rp)

    // ==================== GRUP PERAWATAN KECEPATAN (E315-E321) ====================
    const E315 = 0.3;       // Kecepatan Parah (< 20 km/jam)
    const E316 = 0.15;      // Kecepatan Rendah (< 60 km/jam)
    const E317 = 0.0;       // Kecepatan Standar
    const E318 = 0.1;       // Kecepatan Tinggi (> 90 km/jam)
    const E319 = 0.0;       // Perawatan 1000cc 125cc Listrik
    const E320 = 0.05;      // Perawatan 1500cc 160cc
    const E321 = 0.1;       // Perawatan 2000cc 200cc

    // ==================== GRUP DEPRESIASI MOBIL (E327-E335) ====================
    const E327 = 165000000.0;  // Harga Beli 5 Tahun 1000cc (Rp)
    const E328 = 100000000.0;  // Harga Jual 1000cc Saat Ini (Rp)
    const E329 = 230000000.0;  // Harga Beli 5 Tahun 1500cc (Rp)
    const E330 = 180000000.0;  // Harga Jual 1500cc Saat Ini (Rp)
    const E331 = 370000000.0;  // Harga Beli 5 Tahun 2000cc (Rp)
    const E332 = 300000000.0;  // Harga Jual 2000cc Saat Ini (Rp)
    const E333 = 385000000.0;  // Harga Beli 5 Tahun Listrik (Mid) (Rp)
    const E334 = 220000000.0;  // Harga Jual Listrik (Mid) Saat Ini (Rp)
    const E335 = 5.0;          // Umur Penyusutan (tahun)

    // ==================== GRUP DEPRESIASI MOTOR (E341-E349) ====================
    const E341 = 22000000.0;   // Harga Beli 7 Tahun 125cc (Rp)
    const E342 = 10000000.0;   // Harga Jual 125cc Saat Ini (Rp)
    const E343 = 27000000.0;   // Harga Beli 7 Tahun 160cc (Rp)
    const E344 = 15000000.0;   // Harga Jual 160cc Saat Ini (Rp)
    const E345 = 35000000.0;   // Harga Beli 7 Tahun 200cc (Rp)
    const E346 = 18000000.0;   // Harga Jual 200cc Saat Ini (Rp)
    const E347 = 35000000.0;   // Harga Beli 7 Tahun Listrik (Mid) (Rp)
    const E348 = 15000000.0;   // Harga Jual Listrik (Mid) Saat Ini (Rp)
    const E349 = 7.0;          // Umur Penyusutan (tahun)

    // ==================== AFC MOBIL BENSIN (E355-E371) ====================
    const E355 = 0.5;    // 0 - < 1 km/jam
    const E356 = 1.5;    // < 2 km/jam
    const E357 = 2.0;    // < 3 km/jam
    const E358 = 4.0;    // < 4 km/jam
    const E359 = 5.0;    // < 5 km/jam
    const E360 = 6.0;    // < 7 km/jam
    const E361 = 7.0;    // < 10 km/jam
    const E362 = 9.0;    // < 15 km/jam
    const E363 = 11.0;   // < 20 km/jam
    const E364 = 12.5;   // < 25 km/jam
    const E365 = 14.0;   // < 30 km/jam
    const E366 = 15.5;   // < 40 km/jam
    const E367 = 17.0;   // < 50 km/jam
    const E368 = 18.0;   // < 60 km/jam
    const E369 = 18.5;   // < 70 km/jam
    const E370 = 18.0;   // < 80 km/jam
    const E371 = 16.5;   // >= 80 km/jam

    // ==================== AFC MOBIL LISTRIK (E377-E393) ====================
    const E377 = 0.3;    // 0 - < 1 km/jam
    const E378 = 0.7;    // < 2 km/jam
    const E379 = 1.1;    // < 3 km/jam
    const E380 = 1.5;    // < 4 km/jam
    const E381 = 2.0;    // < 5 km/jam
    const E382 = 2.6;    // < 7 km/jam
    const E383 = 3.3;    // < 10 km/jam
    const E384 = 4.1;    // < 15 km/jam
    const E385 = 4.9;    // < 20 km/jam
    const E386 = 5.6;    // < 25 km/jam
    const E387 = 6.0;    // < 30 km/jam
    const E388 = 6.3;    // < 40 km/jam
    const E389 = 6.6;    // < 50 km/jam
    const E390 = 6.8;    // < 60 km/jam
    const E391 = 6.4;    // < 70 km/jam
    const E392 = 5.8;    // < 80 km/jam
    const E393 = 5.2;    // >= 80 km/jam

    // ==================== AFC MOTOR BENSIN (E399-E415) ====================
    const E399 = 2.0;    // 0 - < 1 km/jam
    const E400 = 3.5;    // < 2 km/jam
    const E401 = 6.0;    // < 3 km/jam
    const E402 = 7.5;    // < 4 km/jam
    const E403 = 9.0;    // < 5 km/jam
    const E404 = 10.0;   // < 7 km/jam
    const E405 = 12.0;   // < 10 km/jam
    const E406 = 15.0;   // < 15 km/jam
    const E407 = 18.0;   // < 20 km/jam
    const E408 = 24.0;   // < 25 km/jam
    const E409 = 28.0;   // < 30 km/jam
    const E410 = 32.0;   // < 40 km/jam
    const E411 = 38.0;   // < 50 km/jam
    const E412 = 42.0;   // < 60 km/jam
    const E413 = 39.0;   // < 70 km/jam
    const E414 = 35.0;   // < 80 km/jam
    const E415 = 30.0;   // >= 80 km/jam

    // ==================== AFC MOTOR LISTRIK (E421-E437) ====================
    const E421 = 2.5;    // 0 - < 1 km/jam
    const E422 = 5.0;    // < 2 km/jam
    const E423 = 8.0;    // < 3 km/jam
    const E424 = 11.0;   // < 4 km/jam
    const E425 = 14.0;   // < 5 km/jam
    const E426 = 17.0;   // < 7 km/jam
    const E427 = 22.0;   // < 10 km/jam
    const E428 = 27.0;   // < 15 km/jam
    const E429 = 32.0;   // < 20 km/jam
    const E430 = 35.0;   // < 25 km/jam
    const E431 = 36.5;   // < 30 km/jam
    const E432 = 37.0;   // < 40 km/jam
    const E433 = 34.0;   // < 50 km/jam
    const E434 = 29.0;   // < 60 km/jam
    const E435 = 23.0;   // < 70 km/jam
    const E436 = 17.0;   // < 80 km/jam
    const E437 = 13.0;   // >= 80 km/jam

    // ==================== GRUP SELISIH AFC (E442-E452) ====================
    const E442 = -0.05;    // Selisih Konsumsi Penjemputan (1 Orang Non AC)
    const E443 = 0.0;      // Selisih Konsumsi 0 Seat (Hanya Driver)
    const E444 = 0.1;      // Selisih Konsumsi 4 Seat (5 Orang) Motor 1 Seat
    const E445 = 0.2;      // Selisih Konsumsi 6 Seat (7 Orang) Motor 2 Seat
    const E446 = 0.0;      // Selisih Konsumsi 1000cc 125cc (Listrik 0%)
    const E447 = 0.15;     // Selisih Konsumsi 1500cc 160cc
    const E448 = 0.25;     // Selisih Konsumsi 2000cc 200cc
    const E449 = 0.0;      // Selisih Konsumsi Manual (Listrik 0%)
    const E450 = 0.05;     // Selisih Konsumsi Matic
    const E451 = 0.0;      // Selisih Tipe Bensin (Pertalite Listrik 0%)
    const E452 = -0.1;     // Selisih Tipe Solar

    // ==================== GRUP BULANAN (E457-E465) ====================
    const E457 = 14000000.0;   // Klaim Pendapatan per Bulan per Orang Mobil (Rp)
    const E458 = 8000000.0;    // Klaim Pendapatan per Bulan per Orang Motor (Rp)
    const E459 = 4.0;          // Pembanding Jam Kerja Sampingan (jam)
    const E460 = 8.0;          // Pembanding Jam Kerja Fulltime (jam)
    const E461 = 12.0;         // Pembanding Jam Kerja Lembur (jam)
    const E462 = 30.0;         // Rerata Mencari Order Berikutnya Vendor (0-60 menit) (mnt)
    const E463 = 60.0;         // Rerata Mencari Order Berikutnya Individu (0-120 menit) (mnt)
    const E464 = 5.0;          // Rerata Berkeliling Mencari Order (0-10 km) (km)
    const E465 = 173.0;        // Jam Kerja Sebulan (jam)

    // ==================== TABEL LOOKUP (DENGAN NILAI LANGSUNG) ====================

    // ---------- PAJAK MOBIL ----------
    // Range: E472-E479 | Interval type: day (hari)
    const PAJAK_MOBIL = [
        { cc: '1000cc', dcell: 2500000, ecell: 365, label: 'pajak tahunan 1000cc' },
        { cc: '1000cc', dcell: 600000, ecell: 1825, label: 'selisih pajak 5 tahunan 1000cc' },
        { cc: '1500cc', dcell: 3500000, ecell: 365, label: 'pajak tahunan 1500cc' },
        { cc: '1500cc', dcell: 600000, ecell: 1825, label: 'selisih pajak 5 tahunan 1500cc' },
        { cc: '2000cc', dcell: 5000000, ecell: 365, label: 'pajak tahunan 2000cc' },
        { cc: '2000cc', dcell: 600000, ecell: 1825, label: 'selisih pajak 5 tahunan 2000cc' },
        { cc: 'Listrik', dcell: 2500000, ecell: 365, label: 'pajak tahunan listrik' },
        { cc: 'Listrik', dcell: 600000, ecell: 1825, label: 'selisih pajak 5 tahunan listrik' }
    ];

    // ---------- PAJAK MOTOR ----------
    // Range: E486-E493 | Interval type: day (hari)
    const PAJAK_MOTOR = [
        { cc: '125cc', dcell: 300000, ecell: 365, label: 'pajak tahunan 125cc' },
        { cc: '125cc', dcell: 350000, ecell: 1825, label: 'selisih pajak 5 tahunan 125cc' },
        { cc: '160cc', dcell: 500000, ecell: 365, label: 'pajak tahunan 160cc' },
        { cc: '160cc', dcell: 350000, ecell: 1825, label: 'selisih pajak 5 tahunan 160cc' },
        { cc: '200cc', dcell: 600000, ecell: 365, label: 'pajak tahunan 200cc' },
        { cc: '200cc', dcell: 350000, ecell: 1825, label: 'selisih pajak 5 tahunan 200cc' },
        { cc: 'Listrik', dcell: 300000, ecell: 365, label: 'pajak tahunan listrik' },
        { cc: 'Listrik', dcell: 350000, ecell: 1825, label: 'selisih pajak 5 tahunan listrik' }
    ];

    // ---------- ATRIBUT MOBIL ----------
    // Range: E500-E502 | Interval type: day (hari)
    const ATRIBUT_MOBIL = [
        { dcell: 520000, ecell: 365, label: 'KESP (52 mingguan)' },
        { dcell: 0, ecell: 1095, label: 'Seragam' },
        { dcell: 0, ecell: 1825, label: 'seragam cadangan' }
    ];

    // ---------- ATRIBUT MOTOR ----------
    // Range: E509-E513 | Interval type: day (hari)
    const ATRIBUT_MOTOR = [
        { dcell: 250000, ecell: 1095, label: 'Seragam' },
        { dcell: 250000, ecell: 1825, label: 'seragam cadangan' },
        { dcell: 150000, ecell: 1095, label: 'helm' },
        { dcell: 150000, ecell: 1825, label: 'helm cadangan' },
        { dcell: 0, ecell: 1825, label: 'jas hujan' }
    ];

    // ---------- PERAWATAN MOBIL BENSIN ----------
    // Range: E520-E557 | Interval type: km
    const PERAWATAN_MOBIL = [
        { dcell: 300000, ecell: 5000, label: 'Oli Mesin' },
        { dcell: 0, ecell: 50000, label: 'Oli Gardan' },
        { dcell: 200000, ecell: 50000, label: 'Oli Transmisi' },
        { dcell: 150000, ecell: 50000, label: 'Air Radiator' },
        { dcell: 1000000, ecell: 75000, label: 'Ban Depan' },
        { dcell: 1000000, ecell: 50000, label: 'Ban Belakang' },
        { dcell: 40000, ecell: 1000, label: 'Cuci (konversi waktu ke jarak)' },
        { dcell: 100000, ecell: 5000, label: 'Cuci Interior (konversi waktu ke jarak)' },
        { dcell: 300000, ecell: 25000, label: 'Kampas Rem Depan' },
        { dcell: 360000, ecell: 50000, label: 'Kampas Rem Belakang' },
        { dcell: 900000, ecell: 75000, label: 'Aki (konversi waktu ke jarak)' },
        { dcell: 450000, ecell: 50000, label: 'Busi' },
        { dcell: 50000, ecell: 20000, label: 'Filter Udara' },
        { dcell: 30000, ecell: 20000, label: 'Filter AC' },
        { dcell: 35000, ecell: 5000, label: 'Filter Oli' },
        { dcell: 150000, ecell: 50000, label: 'Minyak Rem' },
        { dcell: 250000, ecell: 50000, label: 'Belt' },
        { dcell: 50000, ecell: 20000, label: 'Filter Bensin' },
        { dcell: 1000000, ecell: 50000, label: 'Service Kaki' },
        { dcell: 700000, ecell: 150000, label: 'Stabilizer Link' },
        { dcell: 300000, ecell: 100000, label: 'Karet Boot CV Joint' },
        { dcell: 2000000, ecell: 250000, label: 'CV Joint' },
        { dcell: 2000000, ecell: 250000, label: 'Rack Steer' },
        { dcell: 1500000, ecell: 500000, label: 'Alternator' },
        { dcell: 750000, ecell: 500000, label: 'Kipas Pendingin' },
        { dcell: 200000, ecell: 250000, label: 'Pompa Radiator' },
        { dcell: 750000, ecell: 500000, label: 'Radiator Set' },
        { dcell: 350000, ecell: 200000, label: 'Magnet Clutch AC' },
        { dcell: 2000000, ecell: 500000, label: 'Kompresor AC' },
        { dcell: 1000000, ecell: 500000, label: 'AC Pipa System' },
        { dcell: 300000, ecell: 50000, label: 'Spooring Balancing' },
        { dcell: 300000, ecell: 20000, label: 'Tuneup Service Ringan' },
        { dcell: 0, ecell: 150000, label: 'Kopling Matic Set' },
        { dcell: 2000000, ecell: 150000, label: 'Kopling Manual Set' },
        { dcell: 25000, ecell: 5000, label: 'Pengharum (konversi waktu ke jarak)' },
        { dcell: 2000000, ecell: 80000, label: 'Shock Breaker' },
        { dcell: 1200000, ecell: 100000, label: 'Engine Mounting' },
        { dcell: 10, ecell: 1, label: 'Penyusutan Extra Km Gemuk (bekas ojol)' }
    ];

    // ---------- PERAWATAN MOBIL LISTRIK ----------
    // Range: E564-E592 | Interval type: km
    const PERAWATAN_MOBIL_LISTRIK = [
        { dcell: 300000, ecell: 50000, label: 'Coolant Battery' },
        { dcell: 250000, ecell: 50000, label: 'Coolant Inverter' },
        { dcell: 250000, ecell: 80000, label: 'Reduction Oil Gear' },
        { dcell: 180000000, ecell: 500000, label: 'Battery Utama' },
        { dcell: 1000000, ecell: 60000, label: 'Ban Depan' },
        { dcell: 1000000, ecell: 40000, label: 'Ban Belakang' },
        { dcell: 40000, ecell: 1000, label: 'Cuci (konversi waktu ke jarak)' },
        { dcell: 100000, ecell: 5000, label: 'Cuci Interior (konversi waktu ke jarak)' },
        { dcell: 300000, ecell: 35000, label: 'Kampas Rem Depan' },
        { dcell: 360000, ecell: 70000, label: 'Kampas Rem Belakang' },
        { dcell: 900000, ecell: 75000, label: 'Aki (konversi waktu ke jarak)' },
        { dcell: 50000, ecell: 20000, label: 'Filter Udara' },
        { dcell: 30000, ecell: 20000, label: 'Filter AC' },
        { dcell: 150000, ecell: 50000, label: 'Minyak Rem' },
        { dcell: 1000000, ecell: 50000, label: 'Service Kaki' },
        { dcell: 700000, ecell: 150000, label: 'Stabilizer Link' },
        { dcell: 300000, ecell: 100000, label: 'Karet Boot CV Joint' },
        { dcell: 2000000, ecell: 250000, label: 'CV Joint' },
        { dcell: 2000000, ecell: 250000, label: 'Rack Steer' },
        { dcell: 1500000, ecell: 500000, label: 'Alternator' },
        { dcell: 750000, ecell: 500000, label: 'Kipas Pendingin' },
        { dcell: 2000000, ecell: 500000, label: 'Kompresor AC' },
        { dcell: 1000000, ecell: 500000, label: 'AC Pipa System' },
        { dcell: 300000, ecell: 50000, label: 'Spooring Balancing' },
        { dcell: 300000, ecell: 20000, label: 'Tuneup Service Ringan' },
        { dcell: 25000, ecell: 5000, label: 'Pengharum (konversi waktu ke jarak)' },
        { dcell: 2000000, ecell: 80000, label: 'Shock Breaker' },
        { dcell: 1200000, ecell: 100000, label: 'Engine Mounting' },
        { dcell: 10, ecell: 1, label: 'Penyusutan Extra Km Gemuk (bekas ojol)' }
    ];

    // ---------- PERAWATAN MOTOR BENSIN ----------
    // Range: E599-E621 | Interval type: km
    const PERAWATAN_MOTOR = [
        { dcell: 60000, ecell: 2500, label: 'Oli Mesin' },
        { dcell: 25000, ecell: 10000, label: 'Oli Gardan' },
        { dcell: 0, ecell: 1, label: 'Oli Transmisi' },
        { dcell: 50000, ecell: 20000, label: 'Air Radiator' },
        { dcell: 200000, ecell: 20000, label: 'Ban Depan' },
        { dcell: 200000, ecell: 15000, label: 'Ban Belakang' },
        { dcell: 20000, ecell: 1000, label: 'Cuci (konversi waktu ke jarak)' },
        { dcell: 50000, ecell: 20000, label: 'Kampas Rem Depan' },
        { dcell: 35000, ecell: 25000, label: 'Kampas Rem Belakang' },
        { dcell: 250000, ecell: 50000, label: 'Aki (konversi waktu ke jarak)' },
        { dcell: 35000, ecell: 10000, label: 'Busi' },
        { dcell: 35000, ecell: 15000, label: 'Filter Udara' },
        { dcell: 100000, ecell: 20000, label: 'Jas Hujan Driver (konversi waktu ke jarak)' },
        { dcell: 10000, ecell: 1000, label: 'Jas Hujan Penumpang (konversi waktu ke jarak)' },
        { dcell: 35000, ecell: 20000, label: 'Minyak Rem' },
        { dcell: 250000, ecell: 25000, label: 'Belt' },
        { dcell: 25000, ecell: 20000, label: 'Filter Bensin' },
        { dcell: 750000, ecell: 100000, label: 'Shock Depan' },
        { dcell: 1000000, ecell: 75000, label: 'Shock Belakang' },
        { dcell: 100000, ecell: 20000, label: 'Roler CVT' },
        { dcell: 100000, ecell: 200000, label: 'Kipas Pendingin' },
        { dcell: 100000, ecell: 10000, label: 'Tuneup Service Ringan' },
        { dcell: 1, ecell: 1, label: 'Penyusutan Extra Km Gemuk (bekas ojol)' }
    ];

    // ---------- PERAWATAN MOTOR LISTRIK ----------
    // Range: E628-E644 | Interval type: km
    const PERAWATAN_MOTOR_LISTRIK = [
        { dcell: 10, ecell: 1, label: 'Swap Battery Langganan' },
        { dcell: 25000, ecell: 20000, label: 'Reduction Oil Gear' },
        { dcell: 50000, ecell: 20000, label: 'Air Radiator' },
        { dcell: 200000, ecell: 20000, label: 'Ban Depan' },
        { dcell: 200000, ecell: 15000, label: 'Ban Belakang' },
        { dcell: 20000, ecell: 1000, label: 'Cuci (konversi waktu ke jarak)' },
        { dcell: 50000, ecell: 20000, label: 'Kampas Rem Depan' },
        { dcell: 35000, ecell: 25000, label: 'Kampas Rem Belakang' },
        { dcell: 150000, ecell: 40000, label: 'Aki (konversi waktu ke jarak)' },
        { dcell: 100000, ecell: 20000, label: 'Jas Hujan Driver (konversi waktu ke jarak)' },
        { dcell: 10000, ecell: 1000, label: 'Jas Hujan Penumpang (konversi waktu ke jarak)' },
        { dcell: 35000, ecell: 20000, label: 'Minyak Rem' },
        { dcell: 750000, ecell: 100000, label: 'Shock Depan' },
        { dcell: 1000000, ecell: 75000, label: 'Shock Belakang' },
        { dcell: 100000, ecell: 200000, label: 'Kipas Pendingin' },
        { dcell: 100000, ecell: 10000, label: 'Tuneup Service Ringan' },
        { dcell: 1, ecell: 1, label: 'Penyusutan Extra Km Gemuk (bekas ojol)' }
    ];

    // ==================== AFC ARRAY (LOOKUP) ====================
    const AFC_MOBIL_BENSIN = [
        { maxSpeed: 1, value: E355 }, { maxSpeed: 2, value: E356 }, { maxSpeed: 3, value: E357 },
        { maxSpeed: 4, value: E358 }, { maxSpeed: 5, value: E359 }, { maxSpeed: 7, value: E360 },
        { maxSpeed: 10, value: E361 }, { maxSpeed: 15, value: E362 }, { maxSpeed: 20, value: E363 },
        { maxSpeed: 25, value: E364 }, { maxSpeed: 30, value: E365 }, { maxSpeed: 40, value: E366 },
        { maxSpeed: 50, value: E367 }, { maxSpeed: 60, value: E368 }, { maxSpeed: 70, value: E369 },
        { maxSpeed: 80, value: E370 }, { maxSpeed: Infinity, value: E371 }
    ];

    const AFC_MOBIL_LISTRIK = [
        { maxSpeed: 1, value: E377 }, { maxSpeed: 2, value: E378 }, { maxSpeed: 3, value: E379 },
        { maxSpeed: 4, value: E380 }, { maxSpeed: 5, value: E381 }, { maxSpeed: 7, value: E382 },
        { maxSpeed: 10, value: E383 }, { maxSpeed: 15, value: E384 }, { maxSpeed: 20, value: E385 },
        { maxSpeed: 25, value: E386 }, { maxSpeed: 30, value: E387 }, { maxSpeed: 40, value: E388 },
        { maxSpeed: 50, value: E389 }, { maxSpeed: 60, value: E390 }, { maxSpeed: 70, value: E391 },
        { maxSpeed: 80, value: E392 }, { maxSpeed: Infinity, value: E393 }
    ];

    const AFC_MOTOR_BENSIN = [
        { maxSpeed: 1, value: E399 }, { maxSpeed: 2, value: E400 }, { maxSpeed: 3, value: E401 },
        { maxSpeed: 4, value: E402 }, { maxSpeed: 5, value: E403 }, { maxSpeed: 7, value: E404 },
        { maxSpeed: 10, value: E405 }, { maxSpeed: 15, value: E406 }, { maxSpeed: 20, value: E407 },
        { maxSpeed: 25, value: E408 }, { maxSpeed: 30, value: E409 }, { maxSpeed: 40, value: E410 },
        { maxSpeed: 50, value: E411 }, { maxSpeed: 60, value: E412 }, { maxSpeed: 70, value: E413 },
        { maxSpeed: 80, value: E414 }, { maxSpeed: Infinity, value: E415 }
    ];

    const AFC_MOTOR_LISTRIK = [
        { maxSpeed: 1, value: E421 }, { maxSpeed: 2, value: E422 }, { maxSpeed: 3, value: E423 },
        { maxSpeed: 4, value: E424 }, { maxSpeed: 5, value: E425 }, { maxSpeed: 7, value: E426 },
        { maxSpeed: 10, value: E427 }, { maxSpeed: 15, value: E428 }, { maxSpeed: 20, value: E429 },
        { maxSpeed: 25, value: E430 }, { maxSpeed: 30, value: E431 }, { maxSpeed: 40, value: E432 },
        { maxSpeed: 50, value: E433 }, { maxSpeed: 60, value: E434 }, { maxSpeed: 70, value: E435 },
        { maxSpeed: 80, value: E436 }, { maxSpeed: Infinity, value: E437 }
    ];

    const AFC_TABLE = {
        Mobil: {
            Bensin: AFC_MOBIL_BENSIN,
            Listrik: AFC_MOBIL_LISTRIK
        },
        Motor: {
            Bensin: AFC_MOTOR_BENSIN,
            Listrik: AFC_MOTOR_LISTRIK
        }
    };

    // ==================== MAPPING UNTUK AKSES CEPAT ====================
    const TARIF_ZONA = {
        Mobil: { Jabodetabek: E124, SumatraJawa: E125, TimurIndonesia: E126 },
        Motor: { Jabodetabek: E140, SumatraJawa: E141, TimurIndonesia: E142 }
    };

    const BIAYA_APLIKASI = {
        Mobil: { Hemat: E127, Standar: E128, XL: E129, Prioritas: E130, Premium: E131, 'Premium XL': E132 },
        Motor: { Hemat: E143, Standar: E144, XL: E145, Prioritas: E146, Premium: E147, 'Premium XL': E148 }
    };

    const KOMISI_LAYANAN = {
        Mobil: { Hemat: E200, Standar: E201, XL: E202, Prioritas: E203, Premium: E204, 'Premium XL': E205 },
        Motor: { Hemat: E210, Standar: E211, XL: E212, Prioritas: E213, Premium: E214, 'Premium XL': E215 }
    };

    const KESEJAHTERAAN_LAYANAN = {
        Mobil: { Hemat: E220, Standar: E221, XL: E222, Prioritas: E223, Premium: E224, 'Premium XL': E225 },
        Motor: { Hemat: E230, Standar: E231, XL: E232, Prioritas: E233, Premium: E234, 'Premium XL': E235 }
    };

    const BIAYA_LANGGANAN_LAYANAN = {
        Mobil: { Hemat: E240, Standar: E241, XL: E242, Prioritas: E243, Premium: E244, 'Premium XL': E245 },
        Motor: { Hemat: E250, Standar: E251, XL: E252, Prioritas: E253, Premium: E254, 'Premium XL': E255 }
    };

    const TARIF_LAYANAN = {
        Hemat: E285, Standar: E286, XL: E287, Prioritas: E288, Premium: E289, 'Premium XL': E290
    };

    const TARIF_DASAR_OFFLINE = { Mobil: E133, Motor: E149 };
    const TARIF_WAKTU_OFFLINE = { Mobil: E134, Motor: E150 };
    const TARIF_WAKTU_MINIMUM = { Mobil: E261, Motor: E262 };
    const KENAIKAN_TARIF_PER_KM = { Mobil: E263, Motor: E264 };
    const TARGET_BULANAN = { Mobil: E457, Motor: E458 };
    const SELISIH_BBM_JEMPUT_BASE = { Mobil: E442, Motor: E443 };

    // ==================== HELPER ====================

    function getEnergyType(cc) {
        return cc === 'Listrik' ? 'Listrik' : 'Bensin';
    }

    /**
     * getLookupItems(tableName, filters?)
     * Mengambil item dari tabel lookup dengan filter opsional.
     *
     * @param {string} tableName - Nama tabel (misal 'PAJAK_MOBIL')
     * @param {Object} [filters] - Key-value untuk filter (misal {cc: '1000cc'})
     * @returns {Array<{dcell: number, ecell: number, label: string}>}
     */
    function getLookupItems(tableName, filters = {}) {
        const table = DATA[tableName];
        if (!Array.isArray(table)) return [];
        if (Object.keys(filters).length === 0) return table.slice();
        return table.filter(item => {
            for (let key in filters) {
                if (item[key] !== filters[key]) return false;
            }
            return true;
        });
    }

    /**
     * getTaxItems(mode, cc)
     * Mengambil item pajak untuk mode dan cc tertentu.
     *
     * @param {string} mode - 'Mobil' atau 'Motor'
     * @param {string} cc
     * @returns {Array<{dcell: number, ecell: number, label: string}>}
     */
    function getTaxItems(mode, cc) {
        const tableName = mode === 'Mobil' ? 'PAJAK_MOBIL' : 'PAJAK_MOTOR';
        return getLookupItems(tableName, { cc });
    }

    /**
     * getAttributeItems(mode)
     * Mengambil item atribut untuk mode kendaraan.
     *
     * @param {string} mode - 'Mobil' atau 'Motor'
     * @returns {Array<{dcell: number, ecell: number, label: string}>}
     */
    function getAttributeItems(mode) {
        const tableName = mode === 'Mobil' ? 'ATRIBUT_MOBIL' : 'ATRIBUT_MOTOR';
        return getLookupItems(tableName);
    }

    /**
     * getMaintenanceItems(mode, cc)
     * Mengambil item perawatan berdasarkan mode dan cc (termasuk tipe energi).
     *
     * @param {string} mode - 'Mobil' atau 'Motor'
     * @param {string} cc
     * @returns {Array<{dcell: number, ecell: number, label: string}>}
     */
    function getMaintenanceItems(mode, cc) {
        const energi = getEnergyType(cc);
        let tableName;
        if (mode === 'Mobil') {
            tableName = energi === 'Listrik' ? 'PERAWATAN_MOBIL_LISTRIK' : 'PERAWATAN_MOBIL';
        } else {
            tableName = energi === 'Listrik' ? 'PERAWATAN_MOTOR_LISTRIK' : 'PERAWATAN_MOTOR';
        }
        return getLookupItems(tableName);
    }

    /**
     * getDepreciation(mode, cc)
     * Mengembalikan data depresiasi untuk mode dan cc.
     *
     * @param {string} mode - 'Mobil' atau 'Motor'
     * @param {string} cc
     * @returns {{ beli: number, jual: number, umur: number } | null}
     */
    function getDepreciation(mode, cc) {
        const map = {
            Mobil: {
                '1000cc': { beli: E327, jual: E328, umur: E335 },
                '1500cc': { beli: E329, jual: E330, umur: E335 },
                '2000cc': { beli: E331, jual: E332, umur: E335 },
                'Listrik': { beli: E333, jual: E334, umur: E335 }
            },
            Motor: {
                '125cc': { beli: E341, jual: E342, umur: E349 },
                '160cc': { beli: E343, jual: E344, umur: E349 },
                '200cc': { beli: E345, jual: E346, umur: E349 },
                'Listrik': { beli: E347, jual: E348, umur: E349 }
            }
        };
        return map[mode]?.[cc] || null;
    }

    /**
     * getConst(cell)
     * Mengembalikan nilai sel satuan untuk debugging/antisipasi.
     * Catatan: sel‑sel yang kini hanya ada di dalam lookup table (E472, E473, …)
     * tidak lagi tersedia melalui fungsi ini.
     *
     * @param {string} cell - Nama sel (contoh: 'E116')
     * @returns {*} Nilai konstanta, atau undefined.
     */
    function getConst(cell) {
        const exports = {
            E116, E117, E118, E119,
            E124, E125, E126, E127, E128, E129, E130, E131, E132, E133, E134,
            E140, E141, E142, E143, E144, E145, E146, E147, E148, E149, E150, E151,
            E157, E158, E159, E160,
            E166, E167, E168, E169, E170,
            E176, E177, E178, E179, E180, E181, E182, E183,
            E188, E189, E190, E191, E192, E193, E194, E195,
            E200, E201, E202, E203, E204, E205,
            E210, E211, E212, E213, E214, E215,
            E220, E221, E222, E223, E224, E225,
            E230, E231, E232, E233, E234, E235,
            E240, E241, E242, E243, E244, E245,
            E250, E251, E252, E253, E254, E255,
            E260, E261, E262, E263, E264, E265, E266, E267, E268, E269, E270,
            E271, E272, E273, E274, E275, E276, E277, E278, E279, E280,
            E285, E286, E287, E288, E289, E290,
            E295, E296, E297, E298, E299, E300, E301, E302, E303, E304, E305, E306, E307, E308, E309, E310,
            E315, E316, E317, E318, E319, E320, E321,
            E327, E328, E329, E330, E331, E332, E333, E334, E335,
            E341, E342, E343, E344, E345, E346, E347, E348, E349,
            E355, E356, E357, E358, E359, E360, E361, E362, E363, E364, E365,
            E366, E367, E368, E369, E370, E371,
            E377, E378, E379, E380, E381, E382, E383, E384, E385, E386, E387,
            E388, E389, E390, E391, E392, E393,
            E399, E400, E401, E402, E403, E404, E405, E406, E407, E408, E409,
            E410, E411, E412, E413, E414, E415,
            E421, E422, E423, E424, E425, E426, E427, E428, E429, E430, E431,
            E432, E433, E434, E435, E436, E437,
            E442, E443, E444, E445, E446, E447, E448, E449, E450, E451, E452,
            E457, E458, E459, E460, E461, E462, E463, E464, E465
        };
        return exports[cell];
    }

    // ==================== EKSPOR ====================
    return {
        F_V,

        getConst,
        getEnergyType,
        getLookupItems,
        getTaxItems,
        getAttributeItems,
        getMaintenanceItems,
        getDepreciation,

        // Biaya Aplikasi
        E116, E117, E118, E119,
        // Tarif Mobil
        E124, E125, E126, E127, E128, E129, E130, E131, E132, E133, E134,
        // Tarif Motor
        E140, E141, E142, E143, E144, E145, E146, E147, E148, E149, E150, E151,
        // Tarif Taksi
        E157, E158, E159, E160,
        // Tarif Angkot
        E166, E167, E168, E169, E170,
        // Tarif Transjakarta
        E176, E177, E178, E179, E180, E181, E182, E183,
        // Komisi
        E188, E189, E190, E191, E192, E193, E194, E195,
        // Komisi per Layanan Mobil
        E200, E201, E202, E203, E204, E205,
        // Komisi per Layanan Motor
        E210, E211, E212, E213, E214, E215,
        // Kesejahteraan per Layanan Mobil
        E220, E221, E222, E223, E224, E225,
        // Kesejahteraan per Layanan Motor
        E230, E231, E232, E233, E234, E235,
        // Biaya Langganan per Layanan Mobil
        E240, E241, E242, E243, E244, E245,
        // Biaya Langganan per Layanan Motor
        E250, E251, E252, E253, E254, E255,
        // Order
        E260, E261, E262, E263, E264, E265, E266, E267, E268, E269, E270,
        E271, E272, E273, E274, E275, E276, E277, E278, E279, E280,
        // Layanan
        E285, E286, E287, E288, E289, E290,
        // Lainnya
        E295, E296, E297, E298, E299, E300, E301, E302, E303, E304, E305, E306, E307, E308, E309, E310,
        // Perawatan KMJ
        E315, E316, E317, E318, E319, E320, E321,
        // Depresiasi Mobil
        E327, E328, E329, E330, E331, E332, E333, E334, E335,
        // Depresiasi Motor
        E341, E342, E343, E344, E345, E346, E347, E348, E349,
        // AFC Mobil Bensin
        E355, E356, E357, E358, E359, E360, E361, E362, E363, E364, E365,
        E366, E367, E368, E369, E370, E371,
        // AFC Mobil Listrik
        E377, E378, E379, E380, E381, E382, E383, E384, E385, E386, E387,
        E388, E389, E390, E391, E392, E393,
        // AFC Motor Bensin
        E399, E400, E401, E402, E403, E404, E405, E406, E407, E408, E409,
        E410, E411, E412, E413, E414, E415,
        // AFC Motor Listrik
        E421, E422, E423, E424, E425, E426, E427, E428, E429, E430, E431,
        E432, E433, E434, E435, E436, E437,
        // AFC Tipe
        E442, E443, E444, E445, E446, E447, E448, E449, E450, E451, E452,
        // Bulanan
        E457, E458, E459, E460, E461, E462, E463, E464, E465,
        // Tabel Lookup
        PAJAK_MOBIL,
        PAJAK_MOTOR,
        ATRIBUT_MOBIL,
        ATRIBUT_MOTOR,
        PERAWATAN_MOBIL,
        PERAWATAN_MOBIL_LISTRIK,
        PERAWATAN_MOTOR,
        PERAWATAN_MOTOR_LISTRIK,
        // Mapping
        TARIF_ZONA,
        BIAYA_APLIKASI,
        KOMISI_LAYANAN,
        KESEJAHTERAAN_LAYANAN,
        BIAYA_LANGGANAN_LAYANAN,
        TARIF_LAYANAN,
        TARIF_DASAR_OFFLINE,
        TARIF_WAKTU_OFFLINE,
        TARIF_WAKTU_MINIMUM,
        KENAIKAN_TARIF_PER_KM,
        TARGET_BULANAN,
        SELISIH_BBM_JEMPUT_BASE,
        // AFC Table
        AFC_TABLE,
        AFC_MOBIL_BENSIN,
        AFC_MOBIL_LISTRIK,
        AFC_MOTOR_BENSIN,
        AFC_MOTOR_LISTRIK
    };
})();

// ==================== EKSPOR GLOBAL & LOG FILE VERSION ====================
if (typeof window !== 'undefined') {
    window.DATA = DATA;
    console.log('[DATA] v' + DATA.F_V + ' dimuat');
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DATA };
}

// ================================= CHANGELOG =================================
// 1.0.0-rev3 : Seluruh tabel lookup (PAJAK_*, ATRIBUT_*, PERAWATAN_*) kini
//              menggunakan nilai dcell/ecell langsung. Konstanta satuan yang
//              sebelumnya digunakan oleh lookup dihapus. Perbaikan bug
//              deklarasi yang menyebabkan ReferenceError.
// 1.0.0-rev2 : Penyeragaman lookup dengan dcell/ecell, penambahan komentar range.
// 1.0.0-rev0 : Rilis awal.
//
// =============================== FUTURE UPDATE ===============================
// - Tidak ada
//
// ================================ End Of File ================================
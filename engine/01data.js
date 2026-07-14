/**
 * =============================================================================
 * FILE        : /engine/01data.js
 * VERSI FILE  : 1.0.0-rev3
 * ENGINE      : 1.0.0-beta
 * DATA SOURCE : Excel "v9.7j masterapp.xlsx" — Sheet "v9.7j-All"
 */
const DATA = (function() {
    'use strict';

    const F_V = '1.0.0-rev3';

    const E116 = 100.0;
    const E117 = 2.0;
    const E118 = 2.0;
    const E119 = 2000.0;

    const E124 = 3500.0;
    const E125 = 3500.0;
    const E126 = 3700.0;
    const E127 = 6000.0;
    const E128 = 8000.0;
    const E129 = 10000.0;
    const E130 = 12000.0;
    const E131 = 15000.0;
    const E132 = 18000.0;
    const E133 = 6000.0;
    const E134 = 1500.0;

    const E140 = 2600.0;
    const E141 = 1800.0;
    const E142 = 2100.0;
    const E143 = 3000.0;
    const E144 = 3000.0;
    const E145 = 5000.0;
    const E146 = 6000.0;
    const E147 = 7000.0;
    const E148 = 8000.0;
    const E149 = 3500.0;
    const E150 = 1000.0;
    const E151 = 2500.0;

    const E157 = 5000.0;
    const E158 = 5000.0;
    const E159 = 5000.0;
    const E160 = 7000.0;

    const E166 = 4.0;
    const E167 = 10.0;
    const E168 = 4000.0;
    const E169 = 7000.0;
    const E170 = 10000.0;

    const E176 = 2000.0;
    const E177 = 3500.0;
    const E178 = 250.0;
    const E179 = 15.0;
    const E180 = 30.0;
    const E181 = 30.0;
    const E182 = 120.0;
    const E183 = 60.0;

    const E188 = 0.08;
    const E189 = 0.05;
    const E190 = 0.15;
    const E191 = 0.8;
    const E192 = 0.6;
    const E193 = 0.4;
    const E194 = 0.0;
    const E195 = 0.0;

    const E200 = 0.15;
    const E201 = 0.15;
    const E202 = 0.15;
    const E203 = 0.15;
    const E204 = 0.15;
    const E205 = 0.15;

    const E210 = 0.08;
    const E211 = 0.08;
    const E212 = 0.08;
    const E213 = 0.08;
    const E214 = 0.08;
    const E215 = 0.08;

    const E220 = 0.05;
    const E221 = 0.05;
    const E222 = 0.05;
    const E223 = 0.05;
    const E224 = 0.05;
    const E225 = 0.05;

    const E230 = 0.00;
    const E231 = 0.00;
    const E232 = 0.00;
    const E233 = 0.00;
    const E234 = 0.00;
    const E235 = 0.00;

    const E240 = 0.0;
    const E241 = 0.0;
    const E242 = 0.0;
    const E243 = 0.0;
    const E244 = 0.0;
    const E245 = 0.0;

    const E250 = 2500.0;
    const E251 = 0.0;
    const E252 = 0.0;
    const E253 = 0.0;
    const E254 = 0.0;
    const E255 = 0.0;

    const E260 = 2.0;
    const E261 = 1250.0;
    const E262 = 900.0;
    const E263 = 15.0;
    const E264 = 10.0;
    const E265 = 1.0;
    const E266 = 2.0;
    const E267 = 15.0;
    const E268 = 10.0;
    const E269 = 5.0;
    const E270 = 0;
    const E271 = 0.0;
    const E272 = 6000.0;
    const E273 = 3500.0;
    const E274 = 20000.0;
    const E275 = 15000.0;
    const E276 = 0.2;
    const E277 = 1500.0;
    const E278 = 1150.0;
    const E279 = 50.0;
    const E280 = 80.0;

    const E285 = 0.0;
    const E286 = 0.0;
    const E287 = 0.08;
    const E288 = 0.08;
    const E289 = 0.1;
    const E290 = 0.18;

    const E295 = 60.0;
    const E296 = 1440.0;
    const E297 = 43200.0;
    const E298 = 24.0;
    const E299 = 720.0;
    const E300 = 30.0;
    const E301 = 365.0;
    const E302 = 10000.0;
    const E303 = 6500.0;
    const E304 = 14000.0;
    const E305 = 6000000.0;
    const E306 = 4000000.0;
    const E307 = 4000000.0;
    const E308 = 5000.0;
    const E309 = 3500.0;
    const E310 = 0.0;

    const E315 = 0.3;
    const E316 = 0.15;
    const E317 = 0.0;
    const E318 = 0.1;
    const E319 = 0.0;
    const E320 = 0.05;
    const E321 = 0.1;

    const E327 = 165000000.0;
    const E328 = 100000000.0;
    const E329 = 230000000.0;
    const E330 = 180000000.0;
    const E331 = 370000000.0;
    const E332 = 300000000.0;
    const E333 = 385000000.0;
    const E334 = 220000000.0;
    const E335 = 5.0;

    const E341 = 22000000.0;
    const E342 = 10000000.0;
    const E343 = 27000000.0;
    const E344 = 15000000.0;
    const E345 = 35000000.0;
    const E346 = 18000000.0;
    const E347 = 35000000.0;
    const E348 = 15000000.0;
    const E349 = 7.0;

    const E355 = 0.5;
    const E356 = 1.5;
    const E357 = 2.0;
    const E358 = 4.0;
    const E359 = 5.0;
    const E360 = 6.0;
    const E361 = 7.0;
    const E362 = 9.0;
    const E363 = 11.0;
    const E364 = 12.5;
    const E365 = 14.0;
    const E366 = 15.5;
    const E367 = 17.0;
    const E368 = 18.0;
    const E369 = 18.5;
    const E370 = 18.0;
    const E371 = 16.5;

    const E377 = 0.3;
    const E378 = 0.7;
    const E379 = 1.1;
    const E380 = 1.5;
    const E381 = 2.0;
    const E382 = 2.6;
    const E383 = 3.3;
    const E384 = 4.1;
    const E385 = 4.9;
    const E386 = 5.6;
    const E387 = 6.0;
    const E388 = 6.3;
    const E389 = 6.6;
    const E390 = 6.8;
    const E391 = 6.4;
    const E392 = 5.8;
    const E393 = 5.2;

    const E399 = 2.0;
    const E400 = 3.5;
    const E401 = 6.0;
    const E402 = 7.5;
    const E403 = 9.0;
    const E404 = 10.0;
    const E405 = 12.0;
    const E406 = 15.0;
    const E407 = 18.0;
    const E408 = 24.0;
    const E409 = 28.0;
    const E410 = 32.0;
    const E411 = 38.0;
    const E412 = 42.0;
    const E413 = 39.0;
    const E414 = 35.0;
    const E415 = 30.0;

    const E421 = 2.5;
    const E422 = 5.0;
    const E423 = 8.0;
    const E424 = 11.0;
    const E425 = 14.0;
    const E426 = 17.0;
    const E427 = 22.0;
    const E428 = 27.0;
    const E429 = 32.0;
    const E430 = 35.0;
    const E431 = 36.5;
    const E432 = 37.0;
    const E433 = 34.0;
    const E434 = 29.0;
    const E435 = 23.0;
    const E436 = 17.0;
    const E437 = 13.0;

    const E442 = -0.05;
    const E443 = 0.0;
    const E444 = 0.1;
    const E445 = 0.2;
    const E446 = 0.0;
    const E447 = 0.15;
    const E448 = 0.25;
    const E449 = 0.0;
    const E450 = 0.05;
    const E451 = 0.0;
    const E452 = -0.1;

    const E457 = 14000000.0;
    const E458 = 8000000.0;
    const E459 = 4.0;
    const E460 = 8.0;
    const E461 = 12.0;
    const E462 = 30.0;
    const E463 = 60.0;
    const E464 = 5.0;
    const E465 = 173.0;

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

    const ATRIBUT_MOBIL = [
        { dcell: 520000, ecell: 365, label: 'KESP (52 mingguan)' },
        { dcell: 0, ecell: 1095, label: 'Seragam' },
        { dcell: 0, ecell: 1825, label: 'seragam cadangan' }
    ];

    const ATRIBUT_MOTOR = [
        { dcell: 250000, ecell: 1095, label: 'Seragam' },
        { dcell: 250000, ecell: 1825, label: 'seragam cadangan' },
        { dcell: 150000, ecell: 1095, label: 'helm' },
        { dcell: 150000, ecell: 1825, label: 'helm cadangan' },
        { dcell: 0, ecell: 1825, label: 'jas hujan' }
    ];

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
        Mobil: { Bensin: AFC_MOBIL_BENSIN, Listrik: AFC_MOBIL_LISTRIK },
        Motor: { Bensin: AFC_MOTOR_BENSIN, Listrik: AFC_MOTOR_LISTRIK }
    };

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

    function getEnergyType(cc) {
        return cc === 'Listrik' ? 'Listrik' : 'Bensin';
    }

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

    function getTaxItems(mode, cc) {
        const tableName = mode === 'Mobil' ? 'PAJAK_MOBIL' : 'PAJAK_MOTOR';
        return getLookupItems(tableName, { cc });
    }

    function getAttributeItems(mode) {
        const tableName = mode === 'Mobil' ? 'ATRIBUT_MOBIL' : 'ATRIBUT_MOTOR';
        return getLookupItems(tableName);
    }

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

    return {
        F_V,
        getConst,
        getEnergyType,
        getLookupItems,
        getTaxItems,
        getAttributeItems,
        getMaintenanceItems,
        getDepreciation,
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
        E457, E458, E459, E460, E461, E462, E463, E464, E465,
        PAJAK_MOBIL,
        PAJAK_MOTOR,
        ATRIBUT_MOBIL,
        ATRIBUT_MOTOR,
        PERAWATAN_MOBIL,
        PERAWATAN_MOBIL_LISTRIK,
        PERAWATAN_MOTOR,
        PERAWATAN_MOTOR_LISTRIK,
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
        AFC_TABLE,
        AFC_MOBIL_BENSIN,
        AFC_MOBIL_LISTRIK,
        AFC_MOTOR_BENSIN,
        AFC_MOTOR_LISTRIK
    };
})();

if (typeof window !== 'undefined') {
    window.DATA = DATA;
    console.log('[DATA] v' + DATA.F_V + ' dimuat');
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DATA };
}

// ================================ End Of File ================================

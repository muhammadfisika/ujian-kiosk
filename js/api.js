/*
==================================================
KONFIGURASI API
==================================================

GANTI URL DI BAWAH DENGAN URL WEB APP APPS SCRIPT.

Contoh:

https://script.google.com/macros/s/XXXXXXXX/exec

*/

const API_URL =
    "https://script.google.com/macros/s/AKfycbxhX_dqMQJeRlSubQ0MlKAi13TwNV7j2puNU3sWSJrbUPDSUk07QD4IbUSaaHz4xoKG/exec";


/*
==================================================
FUNGSI API UTAMA
==================================================
*/

async function apiRequest(action, payload = {}) {

    if (
        !API_URL ||
        API_URL.includes("PASTE_URL")
    ) {

        throw new Error(
            "URL Apps Script belum dimasukkan."
        );

    }


    const response = await fetch(
        API_URL,
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "text/plain;charset=utf-8"
            },

            body: JSON.stringify({
                action: action,
                payload: payload
            })
        }
    );


    if (!response.ok) {

        throw new Error(
            "Server tidak dapat dihubungi."
        );

    }


    const result =
        await response.json();


    if (!result.ok) {

        throw new Error(
            result.error ||
            "Terjadi kesalahan server."
        );

    }


    return result.data;
}


/*
==================================================
AMBIL KONFIGURASI
==================================================
*/

async function getConfig() {

    return await apiRequest(
        "getConfig"
    );

}


/*
==================================================
VERIFIKASI PASSWORD
==================================================
*/

async function verifyExitPassword(
    password
) {

    return await apiRequest(
        "verifyExitPassword",
        {
            password: password
        }
    );

}


/*
==================================================
LOG AKTIVITAS
==================================================
*/

async function logEvent(
    event,
    student,
    className
) {

    return await apiRequest(
        "logEvent",
        {
            event: event,
            student: student,
            className: className
        }
    );

}
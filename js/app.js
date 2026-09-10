let config = null;

let qrScanner = null;

let scannerRunning = false;


/*
==================================================
HELPER
==================================================
*/

function getElement(id) {

    return document.getElementById(id);

}


/*
==================================================
PINDAH HALAMAN
==================================================
*/

function showPage(pageId) {

    document
        .querySelectorAll(".page")
        .forEach(function(page) {

            page.classList.remove("active");

        });


    getElement(pageId)
        .classList.add("active");

}


/*
==================================================
LOAD CONFIG
==================================================
*/

async function loadConfiguration() {

    const status =
        getElement("status");


    status.textContent =
        "Menghubungkan ke server...";


    try {

        config =
            await getConfig();


        getElement("schoolName")
            .textContent =
            config.schoolName ||
            "UJIAN KIOSK";


        getElement("examTitle")
            .textContent =
            config.examTitle ||
            "UJIAN";


        status.textContent =
            "Server terhubung ✓";


    }

    catch (error) {

        console.error(error);


        status.textContent =
            "Gagal terhubung ke server: " +
            error.message;

    }

}


/*
==================================================
MULAI UJIAN
==================================================
*/

async function startExam() {

    const studentName =
        getElement("studentName")
            .value
            .trim();


    const studentClass =
        getElement("studentClass")
            .value
            .trim();


    if (!studentName) {

        alert(
            "Silakan masukkan nama lengkap."
        );

        return;

    }


    if (!studentClass) {

        alert(
            "Silakan masukkan kelas."
        );

        return;

    }


    if (
        config &&
        config.examStatus !== "AKTIF"
    ) {

        alert(
            "Ujian sedang tidak aktif."
        );

        return;

    }


    getElement("studentInfo")
        .textContent =
        studentName +
        " • " +
        studentClass;


    getElement("examHeaderTitle")
        .textContent =
        config.examTitle ||
        "UJIAN";


    showPage("scanPage");


    await startQRScanner();


    await logEvent(
        "OPEN_SCAN",
        studentName,
        studentClass
    ).catch(console.error);

}


/*
==================================================
QR CODE SCANNER
==================================================
*/

async function startQRScanner() {

    const status =
        getElement("qr-status");


    status.textContent =
        "Meminta izin kamera...";


    /*
    Jika scanner sebelumnya masih aktif,
    hentikan terlebih dahulu.
    */

    if (qrScanner) {

        try {

            await qrScanner.stop();

            qrScanner.clear();

        }

        catch (error) {

            console.log(
                "Scanner sebelumnya sudah berhenti."
            );

        }

    }


    qrScanner =
        new Html5Qrcode(
            "qr-reader"
        );


    try {

        await qrScanner.start(

            {
                facingMode: "environment"
            },

            {
                fps: 10,

                qrbox: {
                    width: 250,
                    height: 250
                }

            },

            onQRCodeSuccess,

            onQRCodeError

        );


        scannerRunning = true;


        status.textContent =
            "Kamera aktif. Silakan scan QR Code.";


    }

    catch (error) {

        console.error(error);


        scannerRunning = false;


        status.innerHTML =
            "❌ Kamera tidak dapat digunakan.<br>" +
            "Pastikan izin kamera diberikan.";

    }

}


/*
==================================================
KETIKA QR BERHASIL DIBACA
==================================================
*/

async function onQRCodeSuccess(decodedText) {

    console.log(
        "QR:",
        decodedText
    );


    /*
    Hentikan scanner supaya
    kamera tidak terus membaca QR.
    */

    await stopQRScanner();


    /*
    Validasi link
    */

    if (!isGoogleFormUrl(decodedText)) {

        alert(
            "QR Code tidak berisi link Google Form yang valid."
        );


        /*
        Jalankan scanner kembali
        */

        await startQRScanner();

        return;

    }


    /*
    Google Form valid
    */

    openGoogleForm(decodedText);

}


/*
==================================================
KETIKA QR GAGAL DIBACA
==================================================
*/

function onQRCodeError(errorMessage) {

    /*
    Tidak perlu menampilkan error
    karena scanner akan terus mencoba.
    */

}


/*
==================================================
HENTIKAN SCANNER
==================================================
*/

async function stopQRScanner() {

    if (
        qrScanner &&
        scannerRunning
    ) {

        try {

            await qrScanner.stop();

            qrScanner.clear();

        }

        catch (error) {

            console.error(error);

        }

    }


    scannerRunning = false;

}


/*
==================================================
VALIDASI GOOGLE FORM
==================================================
*/

function isGoogleFormUrl(url) {

    try {

        const parsed =
            new URL(url);


        /*
        Google Forms menggunakan
        docs.google.com/forms
        */

        if (
            parsed.hostname !==
            "docs.google.com"
        ) {

            return false;

        }


        if (
            !parsed.pathname
                .startsWith("/forms/")
        ) {

            return false;

        }


        return true;

    }

    catch (error) {

        return false;

    }

}


/*
==================================================
BUKA GOOGLE FORM
==================================================
*/

function openGoogleForm(url) {

    const studentName =
        getElement("studentName")
            .value
            .trim();


    const studentClass =
        getElement("studentClass")
            .value
            .trim();


    /*
    Simpan data siswa
    */

    sessionStorage.setItem(
        "studentName",
        studentName
    );


    sessionStorage.setItem(
        "studentClass",
        studentClass
    );


    sessionStorage.setItem(
        "formUrl",
        url
    );


    /*
    Masukkan Google Form
    ke iframe
    */

    const iframe =
        document.createElement(
            "iframe"
        );


    iframe.src = url;

    iframe.title =
        "Google Form Ujian";

    iframe.allow =
        "camera; microphone";


    iframe.style.width =
        "100%";

    iframe.style.height =
        "calc(100vh - 65px)";

    iframe.style.border =
        "none";


    /*
    Hapus tampilan lama
    */

    const oldForm =
        getElement("form-placeholder");


    if (oldForm) {

        oldForm.remove();

    }


    /*
    Cari exam page
    */

    const examPage =
        getElement("examPage");


    /*
    Jika iframe sudah ada,
    jangan membuat dua.
    */

    const oldIframe =
        examPage.querySelector(
            ".google-form-frame"
        );


    if (oldIframe) {

        oldIframe.remove();

    }


    iframe.className =
        "google-form-frame";


    examPage.appendChild(
        iframe
    );


    /*
    Pindah ke halaman ujian
    */

    showPage(
        "examPage"
    );


    /*
    Fullscreen
    */

    if (
        document.documentElement
            .requestFullscreen
    ) {

        document.documentElement
            .requestFullscreen()
            .catch(function() {});

    }


    /*
    Catat aktivitas
    */

    logEvent(
        "OPEN_GOOGLE_FORM",
        studentName,
        studentClass
    ).catch(console.error);

}


/*
==================================================
INPUT LINK MANUAL
==================================================
*/

function manualForm() {

    const url =
        prompt(
            "Masukkan link Google Form:"
        );


    if (!url) {

        return;

    }


    if (
        !isGoogleFormUrl(
            url.trim()
        )
    ) {

        alert(
            "Link Google Form tidak valid."
        );

        return;

    }


    stopQRScanner();

    openGoogleForm(
        url.trim()
    );

}


/*
==================================================
KEMBALI
==================================================
*/

async function backHome() {

    await stopQRScanner();

    showPage(
        "homePage"
    );

}


/*
==================================================
MODAL PASSWORD
==================================================
*/

function openPasswordModal() {

    getElement(
        "passwordModal"
    )
        .classList
        .remove("hidden");


    getElement(
        "passwordInput"
    ).value = "";


    getElement(
        "passwordMessage"
    ).textContent = "";


    getElement(
        "passwordInput"
    ).focus();

}


function closePasswordModal() {

    getElement(
        "passwordModal"
    )
        .classList
        .add("hidden");

}


/*
==================================================
VERIFIKASI PASSWORD
==================================================
*/

async function verifyPassword() {

    const password =
        getElement(
            "passwordInput"
        )
        .value
        .trim();


    const message =
        getElement(
            "passwordMessage"
        );


    if (!password) {

        message.textContent =
            "Password harus diisi.";

        return;

    }


    message.textContent =
        "Memeriksa password...";


    try {

        const result =
            await verifyExitPassword(
                password
            );


        if (result.valid) {

            message.textContent =
                "Password benar ✓";


            const studentName =
                getElement(
                    "studentName"
                )
                .value
                .trim();


            const studentClass =
                getElement(
                    "studentClass"
                )
                .value
                .trim();


            await logEvent(
                "EXIT",
                studentName,
                studentClass
            );


            await stopQRScanner();


            if (
                document.fullscreenElement
            ) {

                await document
                    .exitFullscreen()
                    .catch(function() {});

            }


            setTimeout(
                function() {

                    closePasswordModal();

                    showPage(
                        "homePage"
                    );

                },
                500
            );

        }

        else {

            message.textContent =
                "❌ Password salah.";

        }

    }

    catch (error) {

        message.textContent =
            "Gagal memeriksa password: " +
            error.message;

    }

}


/*
==================================================
EVENT LISTENER
==================================================
*/

document.addEventListener(
    "DOMContentLoaded",
    function() {

        getElement(
            "startButton"
        )
        .addEventListener(
            "click",
            startExam
        );


        getElement(
            "backButton"
        )
        .addEventListener(
            "click",
            backHome
        );


        getElement(
            "manualFormButton"
        )
        .addEventListener(
            "click",
            manualForm
        );


        getElement(
            "exitButton"
        )
        .addEventListener(
            "click",
            openPasswordModal
        );


        getElement(
            "cancelPassword"
        )
        .addEventListener(
            "click",
            closePasswordModal
        );


        getElement(
            "verifyPassword"
        )
        .addEventListener(
            "click",
            verifyPassword
        );


        getElement(
            "passwordInput"
        )
        .addEventListener(
            "keydown",
            function(event) {

                if (
                    event.key ===
                    "Enter"
                ) {

                    verifyPassword();

                }

            }
        );


        loadConfiguration();

    }
);
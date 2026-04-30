// =======================
// DISPLAY USER INFO
// =======================
function displayWelcome() {
    const user = JSON.parse(localStorage.getItem("user"));

    if (user) {
        const nameEl = document.getElementById("userName");
        const messageEl = document.getElementById("welcomeMessage");

        if (nameEl) {
            nameEl.textContent = user.name || user.email;
        }

        if (messageEl) {
            messageEl.textContent = `Halo, ${user.name}! Selamat datang di Amoxicillin Health System.`;
        }
    }
}

// =======================
// EDUCATION CONTENT
// =======================
const educationTopics = {
    handwash: {
        title: "Cuci Tangan yang Benar",
        topMedia: [
            {
                type: "video",
                src: "https://www.youtube.com/embed/IisgnbMfKvI",
                alt: "Video demonstrasi langkah mencuci tangan"
            }
        ],
        inlineMedia: [
            {
                type: "image",
                src: "images/Cuci_Tangan.png",
                alt: "Ilustrasi mencuci tangan dengan benar"
            }
        ],
        insertInlineAfterSectionIndex: 4,
        sections: [
        {
            heading: "Apa Itu Cuci Tangan yang Benar",
            text: "Cuci tangan merupakan salah satu langkah paling sederhana namun sangat penting dalam menjaga kesehatan. Aktivitas ini bertujuan untuk membersihkan tangan dari kotoran, kuman, bakteri, serta virus yang dapat menyebabkan berbagai penyakit. Tangan menjadi media utama perpindahan mikroorganisme karena sering bersentuhan dengan berbagai benda, seperti gagang pintu, uang, ponsel, hingga makanan. Tanpa disadari, kebiasaan menyentuh wajah—terutama area mata, hidung, dan mulut—dapat menjadi jalur masuknya kuman ke dalam tubuh. Oleh karena itu, mencuci tangan dengan benar bukan hanya sekadar kebiasaan, tetapi merupakan bagian penting dari upaya pencegahan penyakit, terutama infeksi saluran pernapasan dan pencernaan."
        },
        {
            heading: "Apa Penyebab Tangan Mudah Terpapar Kuman",
            text: "Tangan mudah terpapar kuman karena aktivitas sehari-hari yang melibatkan kontak langsung dengan berbagai permukaan yang belum tentu bersih. Misalnya, setelah menggunakan transportasi umum, memegang benda di tempat umum, atau setelah menggunakan toilet. Selain itu, kurangnya kesadaran akan pentingnya kebersihan tangan juga menjadi faktor utama. Banyak orang yang hanya membilas tangan dengan air tanpa menggunakan sabun, atau bahkan tidak mencuci tangan sama sekali sebelum makan. Padahal, sabun memiliki peran penting dalam mengangkat kotoran dan membunuh kuman yang menempel di kulit. Lingkungan yang tidak higienis juga turut memperbesar risiko tangan terkontaminasi mikroorganisme berbahaya."
        },
        {
            heading: "Apa yang Terjadi Jika Tidak Mencuci Tangan",
            text: "Tidak mencuci tangan dengan benar dapat meningkatkan risiko terkena berbagai penyakit infeksi. Beberapa penyakit yang umum terjadi akibat kebersihan tangan yang buruk antara lain diare, flu, infeksi saluran pernapasan, hingga keracunan makanan. Kuman yang menempel di tangan dapat dengan mudah berpindah ke makanan atau masuk ke dalam tubuh saat seseorang makan tanpa mencuci tangan terlebih dahulu. Dalam jangka panjang, kebiasaan ini juga dapat menyebabkan penyebaran penyakit di lingkungan sekitar, terutama di tempat-tempat umum seperti sekolah, rumah sakit, dan kantor. Oleh karena itu, menjaga kebersihan tangan sangat penting untuk melindungi diri sendiri maupun orang lain."
        },
        {
            heading: "Cara Mencuci Tangan yang Benar",
            text: "Mencuci tangan yang benar sebaiknya dilakukan menggunakan air mengalir dan sabun selama minimal 20 detik. Langkah pertama adalah membasahi tangan dengan air, kemudian mengoleskan sabun secukupnya. Gosok telapak tangan, punggung tangan, sela-sela jari, ujung jari, dan kuku secara menyeluruh. Pastikan semua bagian tangan terkena sabun. Setelah itu, bilas tangan hingga bersih dan keringkan menggunakan handuk bersih atau tisu sekali pakai. Jika tidak tersedia air dan sabun, penggunaan hand sanitizer berbasis alkohol dapat menjadi alternatif, meskipun tidak seefektif mencuci tangan dengan sabun dalam menghilangkan kotoran yang terlihat."
        },
        {
            heading: "Kapan Harus Mencuci Tangan",
            text: "Mencuci tangan sebaiknya dilakukan pada waktu-waktu penting, seperti sebelum dan sesudah makan, setelah menggunakan toilet, setelah batuk atau bersin, setelah menyentuh hewan, serta setelah beraktivitas di luar rumah. Selain itu, mencuci tangan juga dianjurkan sebelum menyentuh luka atau merawat orang yang sedang sakit. Kebiasaan ini sangat penting untuk mencegah penyebaran penyakit, terutama di lingkungan dengan risiko tinggi seperti rumah sakit atau fasilitas umum."
        },
        {
            heading: "Kapan Harus Periksa ke Dokter",
            text: "Meskipun mencuci tangan dapat membantu mencegah berbagai penyakit, ada beberapa kondisi yang memerlukan perhatian medis. Jika muncul gejala seperti luka pada tangan yang tidak kunjung sembuh, pembengkakan, kemerahan, atau rasa nyeri yang semakin parah, sebaiknya segera konsultasikan ke dokter. Selain itu, jika Anda mengalami gejala infeksi seperti demam, diare, atau gangguan pernapasan yang tidak membaik, pemeriksaan lebih lanjut sangat diperlukan untuk mendapatkan penanganan yang tepat."
        },
        {
            heading: "Perawatan Sementara di Rumah",
            text: "Untuk menjaga kesehatan tangan di rumah, Anda dapat menggunakan hand sanitizer saat tidak tersedia air dan sabun. Selain itu, gunakan pelembap untuk mencegah kulit tangan menjadi kering akibat terlalu sering mencuci tangan. Hindari juga kebiasaan menyentuh wajah dengan tangan yang belum bersih. Menjaga kebersihan lingkungan sekitar, seperti membersihkan permukaan yang sering disentuh, juga dapat membantu mengurangi risiko penyebaran kuman."
        }
    ]
},
    mask: {
        title: "Mengapa Masker Penting",
        topMedia: [
            {
                type: "image",
                src: "images/Masker.jpg",
                alt: "Ilustrasi orang menggunakan masker"
            }
        ],
        sections: [
            {
                heading: "Apa Masalahnya",
                text: "Tanpa masker, droplet kecil dari batuk, bersin, atau bicara dapat mengandung virus dan bakteri yang mudah tersebar ke udara sekitar. Di ruang rawat atau area umum, partikel ini dapat diterima oleh orang lain yang berdekatan, sehingga risiko penularan penyakit meningkat."
            },
            {
                heading: "Apa Penyebabnya",
                text: "Penyebaran terjadi ketika seseorang tidak memakai masker saat berinteraksi dengan orang lain, atau menggunakan masker yang tidak pas dan tidak menutupi hidung dan mulut sepenuhnya. Masker sekali pakai yang sudah lembap atau kotornya juga mengurangi efektivitasnya."
            },
            {
                heading: "Apa yang Harus Dilakukan",
                text: "Pilih masker yang bersih dan berkualitas, serta kenakan dengan posisi yang tepat: menutupi hidung, mulut, dan dagu. Hindari menyentuh bagian depan masker saat dipakai, dan ganti segera jika masker basah atau kotor. Pastikan juga tangan dicuci sebelum memasang dan setelah melepas masker."
            },
            {
                heading: "Kapan Harus Periksa Dokter",
                text: "Segera cari bantuan medis jika Anda merasa sesak napas, nyeri dada, atau mengalami demam tinggi setelah menggunakan masker dalam kondisi sakit. Reaksi alergi terhadap bahan masker juga harus dievaluasi oleh dokter jika menyebabkan iritasi kulit atau pembengkakan."
            },
            {
                heading: "Perawatan Sementara di Rumah",
                text: "Jika Anda tidak dapat langsung menggunakan masker medis, gunakan masker kain yang bersih sebagai langkah awal dan pastikan tetap ganti setiap hari. Jaga jarak dari orang lain, buka jendela untuk sirkulasi udara, serta bersihkan permukaan yang sering disentuh untuk mengurangi risiko penularan."
            }
        ]
    },
    nutrition: {
        title: "Gizi Seimbang untuk Pemulihan",
        topMedia: [
            {
                type: "image",
                src: "images/Makanan.jpg",
                alt: "Ilustrasi makanan sehat untuk pemulihan"
            }
        ],
        sections: [
            {
                heading: "Apa Masalahnya",
                text: "Saat tubuh sedang berjuang melawan penyakit, kebutuhan nutrisi meningkat. Jika asupan tidak mencukupi, tubuh tidak mendapatkan energi dan zat gizi penting untuk memperbaiki sel, mempertahankan fungsi organ, dan mendukung sistem imun. Akibatnya, pemulihan jadi lebih lambat dan risiko komplikasi meningkat."
            },
            {
                heading: "Apa Penyebabnya",
                text: "Banyak pasien makan terlalu sedikit karena nafsu makan menurun atau memilih makanan ringan yang kurang bergizi. Kebiasaan makan tidak teratur, konsumsi makanan olahan, serta minim minum air juga dapat menyebabkan tubuh kekurangan vitamin, mineral, dan protein yang diperlukan untuk penyembuhan."
            },
            {
                heading: "Apa yang Harus Dilakukan",
                text: "Fokus pada pola makan seimbang dengan porsi sayur, buah, sumber protein sehat, dan karbohidrat kompleks. Pilih juga makanan kaya vitamin seperti jeruk, bayam, dan yoghurt, serta pastikan tubuh terhidrasi dengan baik melalui air putih dan sup hangat. Jika perlu, konsultasikan menu dengan tenaga medis agar cocok untuk kondisi kesehatan Anda."
            },
            {
                heading: "Kapan Harus Periksa Dokter",
                text: "Jika nafsu makan terus menurun, berat badan turun drastis, Anda merasa lemas terus-menerus, atau ada gangguan pencernaan yang tidak kunjung pulih, segera periksa dokter. Dokter dapat memeriksa apakah ada kebutuhan nutrisi tambahan atau masalah medis yang memerlukan penanganan spesifik."
            },
            {
                heading: "Perawatan Sementara di Rumah",
                text: "Makan dalam porsi kecil tapi sering jika nafsu makan rendah, pilih makanan mudah dicerna seperti bubur, sup, dan buah halus. Minum air putih secara rutin, serta tambahkan camilan sehat seperti kacang-kacangan dan pisang untuk mendukung energi dan pemulihan."
            }
        ]
    },
    basics: {
        title: "Rawat Tubuh Anda Sendiri!",
        topMedia: [
            {
                type: "image",
                src: "images/Merawat_diri_sendiri.png",
                alt: "Ilustrasi perawatan dasar di rumah sakit"
            }
        ],
        sections: [
            {
                heading: "Apa Masalahnya",
                text: "Banyak pasien merasa kesulitan menjaga kesehatan diri saat berada di rumah sakit atau sedang proses pemulihan. Kondisi ini dapat menyebabkan stres, kelelahan, serta memperlambat proses penyembuhan jika kebersihan, istirahat, dan pola hidup tidak diperhatikan."
            },
            {
                heading: "Apa Penyebabnya",
                text: "Kurang tidur, lingkungan yang tidak bersih, dan mengabaikan anjuran dokter atau perawat membuat tubuh tidak mendapatkan dukungan optimal. Selain itu, interaksi sosial yang tidak terkendali dan stres juga dapat melemahkan daya tahan tubuh."
            },
            {
                heading: "Apa yang Harus Dilakukan",
                text: "Mulailah dengan menjaga rutinitas harian sederhana: tidur cukup, minum air yang cukup, dan mengikuti saran medis. Jaga kebersihan pribadi serta ruangan, lap permukaan yang sering disentuh, dan luangkan waktu untuk istirahat tanpa gangguan."
            },
            {
                heading: "Kapan Harus Periksa Dokter",
                text: "Jika muncul gejala baru seperti demam tinggi, pembengkakan, nyeri tak wajar, atau kondisi Anda terasa semakin memburuk, segera konsultasikan ke dokter. Jangan menunda bila perawatan saat ini tidak memberikan perubahan positif."
            },
            {
                heading: "Perawatan Sementara di Rumah",
                text: "Istirahat di tempat tidur dengan nyaman, gunakan kompres hangat atau dingin sesuai kebutuhan, dan catat gejala yang muncul. Terapkan kebersihan tangan dan pakaian, serta minta bantuan keluarga atau tenaga medis bila memerlukan bantuan untuk aktivitas harian."
            }
        ]
    }
};

function showEducation(topic) {
    const data = educationTopics[topic];
    if (!data) return;

    document.getElementById("educationTitle").textContent = data.title;
    const contentEl = document.getElementById("educationContent");

    const renderMediaHtml = media => {
        if (media.type === "image") {
            return `<div class="education-media"><img src="${media.src}" alt="${media.alt}"></div>`;
        }
        if (media.type === "video") {
            return `<div class="education-media"><iframe src="${media.src}" title="${media.alt}" allowfullscreen loading="lazy"></iframe></div>`;
        }
        return "";
    };

    const topMediaHtml = (data.topMedia || data.media || []).map(renderMediaHtml).join("");
    const inlineMediaHtml = (data.inlineMedia || []).map(renderMediaHtml).join("");

    const insertIndex = Number.isInteger(data.insertInlineAfterSectionIndex) ? data.insertInlineAfterSectionIndex : null;
    const sectionsHtml = data.sections.map((section, index) => {
        const sectionHtml = `
            <div class="education-section">
                <h3>${section.heading}</h3>
                <p>${section.text}</p>
            </div>
        `;

        if (insertIndex !== null && index === insertIndex - 1) {
            return sectionHtml + inlineMediaHtml;
        }

        return sectionHtml;
    }).join("");

    contentEl.innerHTML = `${topMediaHtml}${sectionsHtml}`;

    const modal = document.getElementById("educationModal");
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
}

function closeEducation() {
    const modal = document.getElementById("educationModal");
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
}

// Close modal when clicking outside the content
window.addEventListener("click", event => {
    const modal = document.getElementById("educationModal");
    if (event.target === modal) {
        closeEducation();
    }
});

// =======================
// INIT
// =======================
document.addEventListener("DOMContentLoaded", () => {
    displayUserInfo();
    displayWelcome();
});

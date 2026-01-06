const TMDB_API_KEY = '195c3a3949d344fb58e20ae881573f55';
let allReviews = [];
let remainingReviews = [];
let correctAnswer = "";
let score = 0;
let totalQuestionsRequested = 45;
let currentQuestionNumber = 0;
let currentLang = 'fr'; // Langue par défaut

// --- SYSTÈME DE TRADUCTION ---
const translations = {
    fr: {
        helpTitle: "Aide & Informations",
        helpQ1: "Comment jouer ?",
        helpA1: "Le but est de retrouver l'affiche du film correspondant à une critique extraite de votre propre profil Letterboxd. Pour commencer, vous devez importer votre fichier .zip.",
        helpQ2: "Confidentialité",
        helpA2: "Vos données restent privées. Le fichier ZIP est lu localement par votre navigateur. Aucune information n'est envoyée vers nos serveurs. Effet sonore par <strong>pixabay.com</strong> ",
        helpQ3: "Un bug ou une suggestion ?",
        helpA3: "Si vous avez des idées d'amélioration, contactez-nous par mail.",
        backBtn: "Retour au site",
        mainTitle: "Quiz Photo Letterboxd",
        downloadLink: "Cliquez ici pour télécharger votre fichier ZIP Letterboxd",
        howToLink: "ou cliquez ici pour voir comment faire",
        dropZoneText: "Glisse ton fichier <strong>.zip</strong> ici <br> ou clique pour parcourir",
        noFile: "Aucun fichier sélectionné",
        questionCountLabel: "Combien de questions veux-tu ?",
        otherPlaceholder: "Autre",
        loadZipFirst: "Charger le ZIP d'abord",
        launchBtn: "Lancer le Quiz",
        creditsText: "Site web entièrement conçu de A à Z avec l'aide de",
        contactUs: "nous contacter",
        homeBtn: "🏠 Accueil",
        loading: "Chargement...",
        whichPoster: "Quelle est la bonne affiche ?",
        continueBtn: "Continuer",
        tutoTitle: "Comment obtenir votre fichier .zip ?",
        step1: "Cliquez sur votre pseudo Letterboxd.",
        step2: "Allez dans l'onglet Settings.",
        step3: "Allez dans l'onglet Data.",
        step4: "Cliquez sur Export Your Data.",
        step5: "Cliquez sur Export Data.",
        quitConfirm: "Quitter la partie ?",
        zipError: "reviews.csv introuvable !",
        zipLoadError: "Erreur lors de la lecture du ZIP",
        finished: "Terminé !",
        scoreText: "Score :",
        replay: "Rejouer"
    },
    en: {
        helpTitle: "Help & Information",
        helpQ1: "How to play?",
        helpA1: "The goal is to find the movie poster corresponding to a review taken from your own Letterboxd profile. To start, you need to import your .zip file.",
        helpQ2: "Privacy",
        helpA2: "Your data stays private. The ZIP file is read locally by your browser. No information is sent to our servers. Sounds effect by <strong>pixabay.com</strong>",
        helpQ3: "Bug or suggestion?",
        helpA3: "If you have ideas for improvement, contact us by email.",
        backBtn: "Back to site",
        mainTitle: "Letterboxd Photo Quiz",
        downloadLink: "Click here to download your Letterboxd ZIP file",
        howToLink: "or click here to see how to do it",
        dropZoneText: "Drag your <strong>.zip</strong> file here <br> or click to browse",
        noFile: "No file selected",
        questionCountLabel: "How many questions do you want?",
        otherPlaceholder: "Other",
        loadZipFirst: "Load ZIP first",
        launchBtn: "Start Quiz",
        creditsText: "Website entirely designed from A to Z with the help of",
        contactUs: "contact us",
        homeBtn: "🏠 Home",
        loading: "Loading...",
        whichPoster: "Which is the correct poster?",
        continueBtn: "Continue",
        tutoTitle: "How to get your .zip file?",
        step1: "Click on your Letterboxd username.",
        step2: "Go to the Settings tab.",
        step3: "Go to the Data tab.",
        step4: "Click on Export Your Data.",
        step5: "Click on Export Data.",
        quitConfirm: "Quit the game?",
        zipError: "reviews.csv not found!",
        zipLoadError: "Error reading ZIP file",
        finished: "Finished!",
        scoreText: "Score:",
        replay: "Play Again"
    }
};

function updateLanguage(lang) {
    currentLang = lang;
    // On met à jour tous les éléments qui ont l'attribut data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) {
            el.innerHTML = translations[lang][key];
        }
    });
    // On met à jour les placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[lang][key]) {
            el.placeholder = translations[lang][key];
        }
    });

    // Mise à jour spéciale pour le bouton start s'il est désactivé
    const startBtn = document.getElementById('start-game-btn');
    if (startBtn.disabled) {
        startBtn.innerText = translations[lang].loadZipFirst;
    } else if (allReviews.length === 0) {
        startBtn.innerText = translations[lang].launchBtn;
    }
}

// Écouteur pour le menu déroulant de langue
document.getElementById('language-select').addEventListener('change', (e) => {
    updateLanguage(e.target.value);
});

// --- GESTION DES SONS ---
function playSound(id) {
    const sound = document.getElementById(id);
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(e => console.log("Audio bloqué"));
    }
}

// --- GESTION DU TUTORIEL ET DU ZOOM ---
const tutoModal = document.getElementById('tutorial-modal');
const tutoLink = document.querySelector('.tutorial-link');
const tutoClose = document.getElementById('close-tuto');
const zoomOverlay = document.getElementById('image-zoom-overlay');
const zoomedImage = document.getElementById('zoomed-image');

if (tutoLink) {
    tutoLink.addEventListener('click', (e) => {
        e.preventDefault();
        tutoModal.classList.remove('hidden');
    });
}

if (tutoClose) {
    tutoClose.addEventListener('click', () => {
        tutoModal.classList.add('hidden');
    });
}

document.querySelectorAll('.step img').forEach(img => {
    img.addEventListener('click', () => {
        zoomedImage.src = img.src;
        zoomOverlay.classList.remove('hidden');
    });
});

if (zoomOverlay) {
    zoomOverlay.addEventListener('click', () => {
        zoomOverlay.classList.add('hidden');
    });
}

window.addEventListener('click', (e) => {
    if (e.target === tutoModal) tutoModal.classList.add('hidden');
});

// --- INITIALISATION DU JEU ---
const fileInput = document.getElementById('zip-file');
const startBtn = document.getElementById('start-game-btn');

fileInput.addEventListener('change', handleFileSelect);
document.getElementById('next-btn').addEventListener('click', generateQuestion);

document.getElementById('home-btn').addEventListener('click', () => {
    if (confirm(translations[currentLang].quitConfirm)) location.reload();
});

document.querySelectorAll('.num-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.num-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        totalQuestionsRequested = parseInt(e.target.dataset.value);
    });
});

// --- LOGIQUE FICHIER ---
function handleFileSelect(event) {
    const file = event.target.files[0] || event.dataTransfer.files[0];
    if (!file) return;
    document.getElementById('file-name-display').innerText = file.name;
    startBtn.disabled = false;
    startBtn.innerText = translations[currentLang].launchBtn;
    
    startBtn.onclick = async () => {
        const jszip = new JSZip();
        try {
            const zip = await jszip.loadAsync(file);
            const reviewFile = zip.file("reviews.csv");
            if (!reviewFile) return alert(translations[currentLang].zipError);
            const content = await reviewFile.async("string");
            parseCSV(content);
        } catch (e) { alert(translations[currentLang].zipLoadError); }
    };
}

function parseCSV(data) {
    const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
    const lines = data.split(/\r?\n/);
    const reviewsFound = [];
    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(regex);
        if (cols.length >= 7) {
            let title = cols[1].replace(/"/g, "").trim();
            let year = cols[2].replace(/"/g, "").trim();
            let text = cols[6] ? cols[6].replace(/^"|"$/g, "").trim() : "";
            if (text.length > 10) reviewsFound.push({ title, year, text });
        }
    }
    allReviews = reviewsFound;
    remainingReviews = [...allReviews].sort(() => 0.5 - Math.random()).slice(0, totalQuestionsRequested);
    document.getElementById('setup-area').classList.add('hidden');
    document.getElementById('game-area').classList.remove('hidden');
    generateQuestion();
}

// --- LOGIQUE JEU ---
async function getPosterFromTMDB(title, year) {
    try {
        let langCode = currentLang === 'fr' ? 'fr-FR' : 'en-US';
        let url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&language=${langCode}`;
        if (year) url += `&year=${year}`;
        const res = await fetch(url);
        const data = await res.json();
        return data.results?.[0]?.poster_path ? `https://image.tmdb.org/t/p/w500${data.results[0].poster_path}` : null;
    } catch (e) { return null; }
}

async function generateQuestion() {
    if (remainingReviews.length === 0) return showEndScreen();
    currentQuestionNumber++;
    const progress = (currentQuestionNumber / totalQuestionsRequested) * 100;
    document.getElementById('progress-bar').style.width = `${progress}%`;
    document.getElementById('question-counter').innerText = `Question ${currentQuestionNumber}/${totalQuestionsRequested}`;

    const container = document.getElementById('options-container');
    container.innerHTML = `<p>${translations[currentLang].loading}</p>`;
    document.getElementById('next-btn').classList.add('hidden');
    document.getElementById('feedback').innerText = "";

    const quizItem = remainingReviews.pop();
    correctAnswer = quizItem.title;
    const mainPoster = await getPosterFromTMDB(correctAnswer, quizItem.year);
    if (!mainPoster) return generateQuestion();

    document.getElementById('review-text').innerHTML = `"${quizItem.text.replace(new RegExp(correctAnswer, 'gi'), "<strong>[FILM]</strong>")}"`;

    let choices = [{ title: correctAnswer, poster: mainPoster }];
    let others = allReviews.filter(r => r.title !== correctAnswer).sort(() => 0.5 - Math.random());
    
    for (let i = 0; i < others.length && choices.length < 3; i++) {
        const p = await getPosterFromTMDB(others[i].title, others[i].year);
        if (p) choices.push({ title: others[i].title, poster: p });
    }

    container.innerHTML = "";
    choices.sort(() => 0.5 - Math.random()).forEach(choice => {
        const div = document.createElement('div');
        div.classList.add('poster-option');
        div.innerHTML = `<img src="${choice.poster}" alt="${choice.title}">`;
        div.onclick = () => {
            document.querySelectorAll('.poster-option').forEach(o => o.style.pointerEvents = "none");
            if (choice.title === correctAnswer) {
                playSound('sound-success');
                div.classList.add('correct');
                score++;
            } else {
                playSound('sound-wrong');
                div.classList.add('wrong');
                document.querySelectorAll('.poster-option').forEach(o => {
                    if (o.querySelector('img').alt === correctAnswer) o.classList.add('correct');
                });
            }
            document.getElementById('next-btn').classList.remove('hidden');
        };
        container.appendChild(div);
    });
}

function showEndScreen() {
    playSound('sound-finish');
    const t = translations[currentLang];
    document.getElementById('game-area').innerHTML = `
        <h2>${t.finished}</h2>
        <p>${t.scoreText} ${score}/${totalQuestionsRequested}</p>
        <button onclick="location.reload()">${t.replay}</button>
    `;
}

// Initialisation au chargement
updateLanguage('en');
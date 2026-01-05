const TMDB_API_KEY = '195c3a3949d344fb58e20ae881573f55';
let allReviews = [];
let remainingReviews = [];
let correctAnswer = "";
let score = 0;
let totalQuestionsRequested = 45; // Valeur par défaut
let currentQuestionNumber = 0;

// --- GESTION DES SONS ---

function playSound(id) {
    const sound = document.getElementById(id);
    if (sound) {
        sound.currentTime = 0; // Permet de rejouer le son immédiatement même s'il n'est pas fini
        sound.play().catch(e => console.log("L'audio n'a pas pu être lu :", e));
    }
}

// --- INITIALISATION DES ÉCOUTEURS ---

const fileInput = document.getElementById('zip-file');
const startBtn = document.getElementById('start-game-btn');
const dropZone = document.getElementById('drop-zone');

fileInput.addEventListener('change', handleFileSelect);
document.getElementById('next-btn').addEventListener('click', generateQuestion);

document.getElementById('home-btn').addEventListener('click', () => {
    if (confirm("Voulez-vous vraiment quitter la partie et revenir à l'accueil ?")) {
        location.reload();
    }
});

document.querySelectorAll('.num-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.num-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        totalQuestionsRequested = parseInt(e.target.dataset.value);
        document.getElementById('custom-num').value = "";
    });
});

document.getElementById('custom-num').addEventListener('input', (e) => {
    document.querySelectorAll('.num-btn').forEach(b => b.classList.remove('active'));
    totalQuestionsRequested = parseInt(e.target.value) || 0;
});

['dragenter', 'dragover'].forEach(name => {
    dropZone.addEventListener(name, (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
});
['dragleave', 'drop'].forEach(name => {
    dropZone.addEventListener(name, (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
    });
});

// --- LOGIQUE DE FICHIER ---

function handleFileSelect(event) {
    const file = event.target.files[0] || event.dataTransfer.files[0];
    if (!file) return;

    document.getElementById('file-name-display').innerText = file.name;
    startBtn.disabled = false;
    startBtn.innerText = "Lancer le Quiz";
    
    startBtn.onclick = async () => {
        const jszip = new JSZip();
        try {
            const zip = await jszip.loadAsync(file);
            const reviewFile = zip.file("reviews.csv");
            if (!reviewFile) {
                alert("Fichier 'reviews.csv' introuvable dans le ZIP.");
                return;
            }
            const content = await reviewFile.async("string");
            parseCSV(content);
        } catch (e) {
            alert("Erreur lors de la lecture du ZIP.");
        }
    };
}

dropZone.addEventListener('drop', handleFileSelect);

function parseCSV(data) {
    const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
    const lines = data.split(/\r?\n/);
    const reviewsFound = [];

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const cols = lines[i].split(regex);
        if (cols.length >= 7) {
            let title = cols[1].replace(/"/g, "").trim(); 
            let year = cols[2].replace(/"/g, "").trim(); 
            let text = cols[6] ? cols[6].replace(/^"|"$/g, "").trim() : "";

            if (text.length > 10) {
                reviewsFound.push({ title, year, text });
            }
        }
    }

    if (reviewsFound.length < 3) {
        alert("Pas assez de critiques trouvées.");
        return;
    }

    allReviews = reviewsFound;
    let shuffled = [...allReviews].sort(() => 0.5 - Math.random());
    
    if (totalQuestionsRequested > allReviews.length) {
        totalQuestionsRequested = allReviews.length;
    }

    remainingReviews = shuffled.slice(0, totalQuestionsRequested);
    score = 0;
    currentQuestionNumber = 0;

    document.getElementById('setup-area').classList.add('hidden');
    document.getElementById('game-area').classList.remove('hidden');
    
    generateQuestion();
}

// --- LOGIQUE DU JEU ---

async function getPosterFromTMDB(title, year) {
    try {
        let cleanTitle = title.replace(/"/g, "");
        let url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleanTitle)}&language=fr-FR&include_adult=false`;
        if (year) url += `&year=${year}`;

        const res = await fetch(url);
        const data = await res.json();
        if (data.results && data.results.length > 0) {
            const bestMatch = data.results.sort((a, b) => b.popularity - a.popularity)[0];
            return bestMatch.poster_path ? `https://image.tmdb.org/t/p/w500${bestMatch.poster_path}` : null;
        }
    } catch (e) { return null; }
    return null;
}

function updateProgressBar() {
    const progress = (currentQuestionNumber / totalQuestionsRequested) * 100;
    document.getElementById('progress-bar').style.width = `${progress}%`;
    document.getElementById('question-counter').innerText = `Question ${currentQuestionNumber} / ${totalQuestionsRequested}`;
}

async function generateQuestion() {
    if (remainingReviews.length === 0) {
        showEndScreen();
        return;
    }

    currentQuestionNumber++;
    updateProgressBar();

    const container = document.getElementById('options-container');
    container.innerHTML = "<p>Recherche des affiches...</p>";
    document.getElementById('feedback').innerText = "";
    document.getElementById('next-btn').classList.add('hidden');

    const quizItem = remainingReviews.pop();
    correctAnswer = quizItem.title.replace(/"/g, "");

    const mainPoster = await getPosterFromTMDB(correctAnswer, quizItem.year);
    if (!mainPoster) { 
        currentQuestionNumber--; 
        generateQuestion(); 
        return; 
    }

    const escapedTitle = correctAnswer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let safeText = quizItem.text.replace(new RegExp(escapedTitle, 'gi'), "<strong>[NOM DU FILM]</strong>");
    document.getElementById('review-text').innerHTML = `"${safeText}"`;

    let choices = [{ title: correctAnswer, poster: mainPoster }];
    let others = [...allReviews]
        .filter(r => r.title.replace(/"/g, "").toLowerCase() !== correctAnswer.toLowerCase())
        .sort(() => 0.5 - Math.random());

    for (let i = 0; i < others.length && choices.length < 3; i++) {
        let otherTitle = others[i].title.replace(/"/g, "");
        const p = await getPosterFromTMDB(otherTitle, others[i].year);
        if (p && !choices.find(c => c.title === otherTitle)) {
            choices.push({ title: otherTitle, poster: p });
        }
    }

    container.innerHTML = "";
    choices.sort(() => 0.5 - Math.random()).forEach(choice => {
        const div = document.createElement('div');
        div.classList.add('poster-option');
        div.innerHTML = `<img src="${choice.poster}" alt="${choice.title}">`;
        div.onclick = () => checkAnswer(div, choice.title);
        container.appendChild(div);
    });
}

function checkAnswer(selectedEl, title) {
    const options = document.querySelectorAll('.poster-option');
    options.forEach(opt => opt.style.pointerEvents = "none");

    if (title === correctAnswer) {
        playSound('sound-success'); // SON : BONNE RÉPONSE
        selectedEl.classList.add('correct');
        document.getElementById('feedback').innerText = "Bravo ! 🎉";
        score++;
    } else {
        playSound('sound-wrong'); // SON : MAUVAISE RÉPONSE
        selectedEl.classList.add('wrong');
        document.getElementById('feedback').innerText = `Perdu ! C'était : ${correctAnswer}`;
        options.forEach(opt => {
            if (opt.querySelector('img').alt === correctAnswer) opt.classList.add('correct');
        });
    }
    document.getElementById('next-btn').classList.remove('hidden');
}

function showEndScreen() {
    playSound('sound-finish'); // SON : FIN DU JEU
    document.getElementById('progress-bar').style.width = `100%`;
    document.getElementById('game-area').innerHTML = `
        <div class="end-screen">
            <h2>Partie terminée !</h2>
            <p style="font-size: 1.5rem; margin: 20px 0;">Score final : <strong>${score} / ${totalQuestionsRequested}</strong></p>
            <button onclick="location.reload()" class="main-btn">Rejouer</button>
        </div>
    `;
}
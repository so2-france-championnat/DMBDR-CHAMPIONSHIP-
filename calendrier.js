
(() => {
    const DATA_URL = "./codes_calendrier.json";
    const IMAGE_FOLDER = "images-calendrier/";
    const GRID_IMAGE = IMAGE_FOLDER + "porte-dmdr.jpg";
    const LOOSE_IMAGE = IMAGE_FOLDER + "loose.jpg";
    const STORAGE_KEY = "so2_calendar_used_codes_v1";

    const grid = document.getElementById("calendarGrid");
    if (!grid) return;

    const title = document.getElementById("calendarDayTitle");
    const preview = document.getElementById("calendarRewardImage");
    const rewardName = document.getElementById("calendarRewardName");
    const input = document.getElementById("calendarCodeInput");
    const validate = document.getElementById("calendarValidateBtn");
    const message = document.getElementById("calendarMessage");
    const track = document.getElementById("calendarRouletteTrack");

    let calendarData = {};
    let selectedDay = null;
    let isRolling = false;

    /* =========================
       CODES UTILISÉS
    ========================= */

    function getUsedCodes() {
        try {
            const saved = JSON.parse(
                localStorage.getItem(STORAGE_KEY) || "[]"
            );

            return Array.isArray(saved) ? saved : [];
        } catch {
            return [];
        }
    }

    function saveUsedCode(code) {
        const used = getUsedCodes();

        if (!used.includes(code)) {
            used.push(code);
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(used)
            );
        }
    }

    function getCodeValue(item) {
        if (typeof item === "string") {
            return item;
        }

        return item.code || item.value || item.text || "";
    }

    function getDayData(day) {
        return calendarData[String(day)];
    }

    function getRewardImage(day) {
        return IMAGE_FOLDER +
            "jour-" + String(day).padStart(2, "0") + ".jpg";
    }

    function setMessage(text, type = "") {
        message.textContent = text;
        message.className = "calendar-message " + type;
    }

    function dayHasBeenUsed(day) {
        const data = getDayData(day);

        if (!data || !Array.isArray(data.codes)) {
            return false;
        }

        const used = getUsedCodes();

        return data.codes.some(item =>
            used.includes(
                getCodeValue(item).trim().toUpperCase()
            )
        );
    }

    /* =========================
       AFFICHAGE DES 25 CASES
    ========================= */

    function renderGrid() {
        grid.textContent = "";

        for (let day = 1; day <= 25; day++) {
            const button = document.createElement("button");

            button.type = "button";
            button.className = "calendar-day";
            button.dataset.day = day;

            const img = document.createElement("img");

            // Même image DMBDR pour les 25 cases
            img.src = GRID_IMAGE;
            img.alt = "Calendrier DMBDR - Case " + day;
            img.loading = "lazy";
            img.decoding = "async";

            const number = document.createElement("span");
            number.textContent = "JOUR " + day;

            button.append(img, number);

            if (dayHasBeenUsed(day)) {
                button.classList.add("completed");
            }

            grid.appendChild(button);
        }
    }

    /* =========================
       SÉLECTION D'UNE CASE
    ========================= */

    function selectDay(day) {
        if (isRolling) return;

        selectedDay = day;

        const data = getDayData(day);

        if (!data) {
            setMessage(
                "Les données de cette case sont introuvables.",
                "error"
            );
            return;
        }

        grid.querySelectorAll(".calendar-day").forEach(button => {
            button.classList.toggle(
                "selected",
                Number(button.dataset.day) === day
            );
        });

        title.textContent = "CASE " + day;

        rewardName.textContent =
            data.reward || "Récompense mystère";

        // Image individuelle de la récompense
        preview.src = getRewardImage(day);

        input.disabled = false;
        validate.disabled = false;
        input.value = "";

        track.textContent = "";
        track.style.transition = "none";
        track.style.transform = "translateX(0)";

        setMessage(
            "Entre le code correspondant à la case " + day + "."
        );

        input.focus();
    }

    /* =========================
       CARTES DE LA ROULETTE
    ========================= */

    function createRouletteCard(image, isWinner = false) {
        const card = document.createElement("div");

        card.className = "calendar-roulette-card";

        if (isWinner) {
            card.classList.add("winner");
        }

        const img = document.createElement("img");

        img.src = image;
        img.alt = isWinner
            ? "Récompense gagnée"
            : "Résultat roulette";

        img.loading = "eager";
        img.decoding = "async";

        card.appendChild(img);

        return card;
    }

    /* =========================
       ROULETTE 8 SECONDES
    ========================= */

    function runRoulette(won, day) {
        return new Promise(resolve => {
            track.textContent = "";

            const rewardImage = getRewardImage(day);

            // Position du résultat final
            const targetIndex = 38;
            const totalCards = 45;

            // Mélange des images gagnantes et LOSE
            for (let i = 0; i < totalCards; i++) {
                const isTarget = i === targetIndex;

                let image;

                if (isTarget) {
                    image = won
                        ? rewardImage
                        : LOOSE_IMAGE;
                } else {
                    image = Math.random() < 0.5
                        ? rewardImage
                        : LOOSE_IMAGE;
                }

                track.appendChild(
                    createRouletteCard(
                        image,
                        isTarget && won
                    )
                );
            }

            const target = track.children[targetIndex];

            const containerWidth =
                track.parentElement.clientWidth;

            const targetCenter =
                target.offsetLeft +
                target.offsetWidth / 2;

            const offset =
                targetCenter - containerWidth / 2;

            track.style.transition = "none";
            track.style.transform = "translateX(0)";

            let finished = false;

            function finish() {
                if (finished) return;

                finished = true;
                resolve();
            }

            track.addEventListener(
                "transitionend",
                finish,
                { once: true }
            );

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    track.style.transition =
                        "transform 8s cubic-bezier(.08,.75,.12,1)";

                    track.style.transform =
                        "translateX(-" + offset + "px)";
                });
            });

            // Sécurité si transitionend ne se déclenche pas
            setTimeout(finish, 8500);
        });
    }

    /* =========================
       VALIDATION DU CODE
    ========================= */

    async function validateCode() {
        if (isRolling) return;

        if (!selectedDay) {
            setMessage(
                "Sélectionne d'abord une case.",
                "error"
            );
            return;
        }

        const enteredCode =
            input.value.trim().toUpperCase();

        if (!enteredCode) {
            setMessage(
                "Entre ton code avant de valider.",
                "error"
            );

            input.focus();
            return;
        }

        const data = getDayData(selectedDay);

        if (!data || !Array.isArray(data.codes)) {
            setMessage(
                "Impossible de charger les codes de cette case.",
                "error"
            );
            return;
        }

        const used = getUsedCodes();

        if (used.includes(enteredCode)) {
            setMessage(
                "Ce code a déjà été utilisé sur ce navigateur.",
                "error"
            );
            return;
        }

        const matchingCode = data.codes.find(item =>
            getCodeValue(item).trim().toUpperCase() === enteredCode
        );

        if (!matchingCode) {
            setMessage(
                "Code invalide pour cette case.",
                "error"
            );
            return;
        }

        const won =
            typeof matchingCode === "object" &&
            (
                matchingCode.winner === true ||
                matchingCode.winner === "true"
            );

        isRolling = true;

        input.disabled = true;
        validate.disabled = true;

        setMessage("🎰 TIRAGE EN COURS...");

        saveUsedCode(enteredCode);

        const currentDay = selectedDay;

        await runRoulette(won, currentDay);

        isRolling = false;

        grid.querySelector(
            '[data-day="' + currentDay + '"]'
        )?.classList.add("completed");

        if (won) {
            setMessage(
                "🎉 FÉLICITATIONS ! TU AS GAGNÉ : " +
                data.reward,
                "success"
            );
        } else {
            setMessage(
                "❄️ DOMMAGE ! Tu n'as pas gagné cette fois.",
                "error"
            );
        }

        input.value = "";
    }

    /* =========================
       ÉVÉNEMENTS
    ========================= */

    grid.addEventListener("click", event => {
        const button = event.target.closest(".calendar-day");

        if (!button) return;

        selectDay(Number(button.dataset.day));
    });

    validate.addEventListener(
        "click",
        validateCode
    );

    input.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            validateCode();
        }
    });

    /* =========================
       CHARGEMENT DES DONNÉES
    ========================= */

    fetch(DATA_URL)
        .then(response => {
            if (!response.ok) {
                throw new Error(
                    "Fichier JSON introuvable"
                );
            }

            return response.json();
        })
        .then(data => {
            calendarData = data;

            renderGrid();

            console.log(
                "🎄 CALENDRIER DMBDR CHARGÉ"
            );
        })
        .catch(error => {
            console.error(
                "Calendrier :",
                error
            );

            setMessage(
                "Erreur de chargement des codes du calendrier.",
                "error"
            );
        });

})();

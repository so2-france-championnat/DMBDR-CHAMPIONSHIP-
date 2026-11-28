
(() => {
    /* =========================
       CONFIGURATION
    ========================= */

    const DATA_URL = "./codes_calendrier.json";
    const IMAGE_FOLDER = "images-calendrier/";

    // Image commune aux 25 cases
    const GRID_IMAGE =
        IMAGE_FOLDER + "caisse-dmdr-noel.png";

    // Image de défaite
    const LOOSE_IMAGE =
        IMAGE_FOLDER + "loose.jpg";

    const STORAGE_KEY =
        "so2_calendar_used_codes_v1";

    // Durée de la roulette : 12 secondes
    const ROULETTE_DURATION = 12000;

    const grid =
        document.getElementById("calendarGrid");

    if (!grid) return;

    const title =
        document.getElementById("calendarDayTitle");

    const preview =
        document.getElementById("calendarRewardImage");

    const rewardName =
        document.getElementById("calendarRewardName");

    const input =
        document.getElementById("calendarCodeInput");

    const validate =
        document.getElementById("calendarValidateBtn");

    const message =
        document.getElementById("calendarMessage");

    const track =
        document.getElementById("calendarRouletteTrack");

    if (
        !title ||
        !preview ||
        !rewardName ||
        !input ||
        !validate ||
        !message ||
        !track
    ) {
        console.error(
            "❌ Éléments HTML du calendrier manquants."
        );
        return;
    }

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

        if (!item || typeof item !== "object") {
            return "";
        }

        return item.code || item.value || item.text || "";
    }

    function getDayData(day) {
        return calendarData[String(day)];
    }

    /* =========================
       IMAGES DES RÉCOMPENSES
    ========================= */

    function getRewardImage(day) {
        return IMAGE_FOLDER +
            "jour-" +
            String(day).padStart(2, "0") +
            ".jpg";
    }

    function setMessage(text, type = "") {
        message.textContent = text;
        message.className =
            "calendar-message " + type;
    }

    /* =========================
       CODES DÉJÀ UTILISÉS
    ========================= */

    function dayHasBeenUsed(day) {
        const data = getDayData(day);

        if (!data || !Array.isArray(data.codes)) {
            return false;
        }

        const used = getUsedCodes();

        return data.codes.some(item => {
            const code = getCodeValue(item)
                .trim()
                .toUpperCase();

            return used.includes(code);
        });
    }

    /* =========================
       AFFICHAGE DES 25 CASES
    ========================= */

    function renderGrid() {
        grid.textContent = "";

        for (let day = 1; day <= 25; day++) {
            const button =
                document.createElement("button");

            button.type = "button";
            button.className = "calendar-day";
            button.dataset.day = day;

            const img =
                document.createElement("img");

            img.src = GRID_IMAGE;
            img.alt =
                "Caisse DMBDR Noël - Jour " + day;

            img.loading = "lazy";
            img.decoding = "async";

            const number =
                document.createElement("span");

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

        grid.querySelectorAll(
            ".calendar-day"
        ).forEach(button => {
            button.classList.toggle(
                "selected",
                Number(button.dataset.day) === day
            );
        });

        title.textContent = "CASE " + day;

        // La récompense reste secrète avant le tirage
        rewardName.textContent =
            "CAISSE DMBDR NOËL";

        preview.src = GRID_IMAGE;
        preview.alt = "Caisse DMBDR Noël";

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

    function createRouletteCard(image) {
        const card =
            document.createElement("div");

        card.className =
            "calendar-roulette-card";

        const img =
            document.createElement("img");

        img.src = image;
        img.alt = "Résultat roulette";
        img.loading = "eager";
        img.decoding = "async";

        card.appendChild(img);

        return card;
    }

    /* =========================
       MÉLANGE ALÉATOIRE
    ========================= */

    function shuffle(array) {
        const result = [...array];

        for (
            let i = result.length - 1;
            i > 0;
            i--
        ) {
            const j =
                Math.floor(Math.random() * (i + 1));

            [result[i], result[j]] =
                [result[j], result[i]];
        }

        return result;
    }

    /* =========================
       PRÉCHARGEMENT DES IMAGES
    ========================= */

    function preloadImage(src) {
        return new Promise(resolve => {
            const img = new Image();

            img.onload = resolve;
            img.onerror = () => {
                console.warn("Image introuvable :", src);
                resolve();
            };

            img.src = src;
        });
    }

    /* =========================
       ROULETTE 12 SECONDES
       26 IMAGES
    ========================= */

    async function runRoulette(won, day) {

        // Image correspondant au résultat réel
        const rewardImage =
            getRewardImage(day);

        // Résultat déterminé par le code
        const finalImage = won
            ? rewardImage
            : LOOSE_IMAGE;

        // Les 25 récompenses + LOOSE
        const allImages = [];

        for (let i = 1; i <= 25; i++) {
            allImages.push(getRewardImage(i));
        }

        allImages.push(LOOSE_IMAGE);

        // Préchargement des 26 images
        await Promise.all(
            allImages.map(src => preloadImage(src))
        );

        track.textContent = "";

        /*
         * POSITION DU RÉSULTAT
         *
         * Le résultat est à la position 72.
         * Il reste encore 10 cartes après lui.
         * Il n'est donc PAS la dernière image
         * de la roulette.
         */

        const targetIndex = 72;
        const extraCardsAfterResult = 10;

        let imageSequence = [];

        // Première série : les 26 images mélangées
        imageSequence.push(...shuffle(allImages));

        // Remplir jusqu'à la position du résultat
        while (imageSequence.length < targetIndex) {
            const randomImage =
                allImages[
                    Math.floor(
                        Math.random() * allImages.length
                    )
                ];

            imageSequence.push(randomImage);
        }

        // Insérer le vrai résultat à la position 72
        imageSequence.push(finalImage);

        // Ajouter des images APRÈS le résultat
        for (
            let i = 0;
            i < extraCardsAfterResult;
            i++
        ) {
            const randomImage =
                allImages[
                    Math.floor(
                        Math.random() * allImages.length
                    )
                ];

            imageSequence.push(randomImage);
        }

        // Création de toutes les cartes
        imageSequence.forEach(image => {
            track.appendChild(
                createRouletteCard(image)
            );
        });

        // Attendre l'affichage des cartes
        await new Promise(resolve => {
            requestAnimationFrame(() => {
                requestAnimationFrame(resolve);
            });
        });

        // Récupérer précisément la carte du résultat
        const target =
            track.children[targetIndex];

        if (!target) {
            throw new Error(
                "Carte du résultat introuvable."
            );
        }

        // Calcul du centrage sous la barre jaune
        const containerWidth =
            track.parentElement.clientWidth;

        const targetCenter =
            target.offsetLeft +
            target.offsetWidth / 2;

        const offset =
            targetCenter - containerWidth / 2;

        // Réinitialiser la roulette
        track.style.transition = "none";
        track.style.transform = "translateX(0)";

        // Animation de 12 secondes
        await new Promise(resolve => {

            let finished = false;

            function finish() {
                if (finished) return;

                finished = true;
                resolve();
            }

            function onTransitionEnd(event) {
                if (event.propertyName !== "transform") {
                    return;
                }

                track.removeEventListener(
                    "transitionend",
                    onTransitionEnd
                );

                finish();
            }

            track.addEventListener(
                "transitionend",
                onTransitionEnd
            );

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {

                    track.style.transition =
                        "transform " +
                        ROULETTE_DURATION +
                        "ms cubic-bezier(.06,.72,.08,1)";

                    track.style.transform =
                        "translateX(-" + offset + "px)";
                });
            });

            // Sécurité en cas de transitionend absent
            setTimeout(finish, ROULETTE_DURATION + 500);
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

        const data =
            getDayData(selectedDay);

        if (
            !data ||
            !Array.isArray(data.codes)
        ) {
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

        const matchingCode =
            data.codes.find(item =>
                getCodeValue(item)
                    .trim()
                    .toUpperCase() === enteredCode
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

        const currentDay = selectedDay;

        isRolling = true;

        input.disabled = true;
        validate.disabled = true;

        setMessage("🎰 TIRAGE EN COURS...");

        // Le code est marqué comme utilisé
        saveUsedCode(enteredCode);

        try {
            await runRoulette(
                won,
                currentDay
            );

            // Marquer la case comme terminée
            grid.querySelector(
                '[data-day="' + currentDay + '"]'
            )?.classList.add("completed");

            // RÉVÉLATION DU RÉSULTAT
            if (won) {
                preview.src =
                    getRewardImage(currentDay);

                preview.alt =
                    "Récompense gagnée";

                rewardName.textContent =
                    data.reward || "Récompense gagnée";

                setMessage(
                    "🎉 FÉLICITATIONS ! TU AS GAGNÉ : " +
                    (data.reward || "Récompense mystère"),
                    "success"
                );

            } else {
                preview.src = LOOSE_IMAGE;
                preview.alt = "Aucune récompense";

                rewardName.textContent =
                    "AUCUNE RÉCOMPENSE";

                setMessage(
                    "❄️ DOMMAGE ! Tu n'as pas gagné cette fois.",
                    "error"
                );
            }

            input.value = "";

        } catch (error) {
            console.error(
                "Erreur roulette :",
                error
            );

            setMessage(
                "Une erreur est survenue pendant le tirage.",
                "error"
            );

        } finally {
            isRolling = false;
        }
    }

    /* =========================
       ÉVÉNEMENTS
    ========================= */

    grid.addEventListener(
        "click",
        event => {
            const button =
                event.target.closest(".calendar-day");

            if (!button) return;

            selectDay(
                Number(button.dataset.day)
            );
        }
    );

    validate.addEventListener(
        "click",
        validateCode
    );

    input.addEventListener(
        "keydown",
        event => {
            if (event.key === "Enter") {
                validateCode();
            }
        }
    );

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

            // Aperçu initial : caisse DMBDR
            preview.src = GRID_IMAGE;
            rewardName.textContent =
                "Choisis une case pour commencer";

            console.log(
                "🎄 CALENDRIER DMBDR CHARGÉ"
            );

            console.log(
                "25 cases / 26 images / Roulette 12 secondes"
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

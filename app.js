let teams = [];
let players = [];
let matches = [];


/* =========================
        LOAD TEAMS
========================= */

async function loadTeams(){

    const response =
        await fetch("data/teams.json");

    if(!response.ok){
        throw new Error("teams.json introuvable");
    }

    const data =
        await response.json();

    teams =
        data.teams || [];

    renderTeams();
    renderRanking();
    updateCounts();

}


/* =========================
        LOAD PLAYERS
========================= */

async function loadPlayers(){

    const response =
        await fetch("data/players.json");

    if(!response.ok){
        throw new Error("players.json introuvable");
    }

    const data =
        await response.json();

    players =
        data.players || [];

    renderPlayers();
    updateCounts();

}

/* =========================
        LOAD MATCHES
========================= */

async function loadMatches(){

    try{

        const response =
            await fetch("./data/matches.json");

        if(!response.ok){
            throw new Error(
                `matches.json : HTTP ${response.status}`
            );
        }

        const data =
            await response.json();

        if(!Array.isArray(data.matches)){
            throw new Error(
                "matches.json : propriété 'matches' introuvable"
            );
        }

        matches = data.matches;

        console.log(
            "✅ MATCHES CHARGÉS :",
            matches.length
        );

    }
    catch(error){

        console.error(
            "❌ ERREUR MATCHES :",
            error
        );

        matches = [];

    }

}

/* =========================
        KD
========================= */

function getKD(player){

    if(player.deaths === 0){

        if(player.kills === 0){
            return 0;
        }

        return player.kills;

    }

    return player.kills / player.deaths;

}

/* =========================
   CALCUL AUTOMATIQUE STATS
========================= */

function calculateChampionshipStats(){

    /* =========================
       RESET EQUIPES
    ========================= */

    teams.forEach(team => {

        team.points = 0;
        team.roundsWon = 0;
        team.roundsLost = 0;
        team.rd = 0;

    });


    /* =========================
       RESET JOUEURS ACTUELS
    ========================= */

    players.forEach(player => {

        player.kills = 0;
        player.assists = 0;
        player.deaths = 0;
        player.mvp = 0;

    });


    /* =========================
       CALCUL DES MATCHS
    ========================= */

    matches.forEach(match => {

        if(match.status !== "played"){
            return;
        }


        const team1 =
            teams.find(
                team =>
                    team.name === match.team1
            );

        const team2 =
            teams.find(
                team =>
                    team.name === match.team2
            );


        if(!team1 || !team2){
            return;
        }


        const score1 =
            Number(match.score1 || 0);

        const score2 =
            Number(match.score2 || 0);


        /* =========================
           ROUNDS
        ========================= */

        team1.roundsWon += score1;
        team1.roundsLost += score2;

        team2.roundsWon += score2;
        team2.roundsLost += score1;


        /* =========================
           RD
        ========================= */

        team1.rd += score1 - score2;

        team2.rd += score2 - score1;


        /* =========================
           POINTS
        ========================= */

        if(score1 > score2){

            team1.points += 3;

        }
        else if(score2 > score1){

            team2.points += 3;

        }


        /* =========================
           STATS JOUEURS
        ========================= */

        if(Array.isArray(match.stats)){

            match.stats.forEach(stat => {

                const player =
                    players.find(
                        p =>
                            p.name ===
                            stat.player
                    );


                /*
                 * Si le joueur n'existe plus
                 * dans players.json,
                 * on ignore ses stats globales.
                 */

                if(!player){
                    return;
                }


                player.kills +=
                    Number(stat.kills || 0);

                player.assists +=
                    Number(stat.assists || 0);

                player.deaths +=
                    Number(stat.deaths || 0);

            });

        }


        /* =========================
           MVP
        ========================= */

        if(match.mvp){

            const mvpPlayer =
                players.find(
                    player =>
                        player.name ===
                        match.mvp.name
                );


            /*
             * Les MVP des anciens joueurs
             * ne sont pas comptabilisés
             * dans les stats actuelles.
             */

            if(mvpPlayer){

                mvpPlayer.mvp += 1;

            }

        }

    });


    console.log(
        "📊 STATISTIQUES CHAMPIONNAT CALCULÉES"
    );

}

/* =========================
        TEAMS
========================= */

function renderTeams(){

    const container =
        document.getElementById("teamList");

    if(!container) return;


    container.innerHTML =
        teams.map(team => `

        <div
            class="team-card clickable"
            onclick="openTeam('${team.id}')"
        >

            <div class="team-card-logo">

                <img
                    src="${team.logo}"
                    alt="${team.name}"
                >

            </div>

            <div class="team-card-info">

                <div class="team-card-name">
                    ${team.name}
                </div>

                <div class="team-card-players">

                    ${
                        Array.isArray(team.players)
                        ? team.players.length
                        : 0
                    }

                    PLAYER${
                        Array.isArray(team.players) &&
                        team.players.length > 1
                        ? "S"
                        : ""
                    }

                </div>

            </div>

        </div>

        `).join("");

}


/* =========================
        TEAM PROFILE
========================= */

function openTeam(teamId){

    const team =
        teams.find(
            t =>
                String(t.id) ===
                String(teamId)
        );

    if(!team) return;


    const list =
        document.getElementById(
            "teamList"
        );

    const details =
        document.getElementById(
            "teamDetails"
        );


    if(!list || !details) return;


    /*
     * Les joueurs sont récupérés
     * depuis players.json
     */

    const teamPlayers =
        players.filter(
            player =>
                player.team ===
                team.name
        );


    /*
     * Si aucun joueur n'est trouvé
     * dans players.json, on utilise
     * le roster présent dans teams.json.
     */

    let roster =
        teamPlayers;


    if(
        roster.length === 0 &&
        Array.isArray(team.players)
    ){

        roster =
            team.players.map(
                player => {

                    if(typeof player === "string"){

                        return {
                            name: player,
                            kills: 0,
                            assists: 0,
                            deaths: 0,
                            mvp: 0
                        };

                    }

                    return player;

                }
            );

    }


    list.style.display =
        "none";


    details.innerHTML = `

        <button
            class="back-button"
            onclick="closeTeam()"
        >
            ← BACK TO TEAMS
        </button>


        <div class="team-simple-header">

            <div class="team-simple-logo">

                <img
                    src="${team.logo}"
                    alt="${team.name}"
                >

            </div>


            <div>

                <span>
                    TEAM ROSTER
                </span>

                <h2>
                    ${team.name}
                </h2>

            </div>

        </div>


        <div class="team-roster-count">

            <span>
                PLAYERS
            </span>

            <strong>
                ${roster.length}
            </strong>

        </div>


        <div class="section-title">

            <span></span>

            PLAYERS

            <span></span>

        </div>


        <div class="simple-roster">

            ${
                roster.length

                ?

                roster.map(
                    (player,index) => {

                        const kills =
                            Number(
                                player.kills || 0
                            );

                        const assists =
                            Number(
                                player.assists || 0
                            );

                        const deaths =
                            Number(
                                player.deaths || 0
                            );


                        const kd =
                            deaths === 0
                            ? kills
                            : kills / deaths;


                        const kdClass =
                            kd >= 2
                            ? "kd-good"
                            : kd >= 1
                            ? "kd-mid"
                            : "kd-bad";


                        return `

                        <div
                            class="simple-roster-player"
                        >

                            <div
                                class="
                                    simple-roster-number
                                "
                            >

                                ${String(
                                    index + 1
                                ).padStart(2,"0")}

                            </div>


                            <div
                                class="
                                    simple-roster-info
                                "
                            >

                                <strong>
                                    ${player.name}
                                </strong>

                                <span>

                                    ${kills} K
                                    •
                                    ${assists} A
                                    •
                                    ${deaths} D

                                </span>

                            </div>


                            <div
                                class="
                                    simple-roster-kd
                                    ${kdClass}
                                "
                            >

                                ${kd.toFixed(2)}

                                <small>
                                    KD
                                </small>

                            </div>

                        </div>

                        `;

                    }
                ).join("")

                :

                `

                <div class="empty-card">

                    <div class="empty-icon">
                        ♙
                    </div>

                    <strong>
                        NO PLAYERS
                    </strong>

                    <p>
                        No players found for this team.
                    </p>

                </div>

                `
            }

        </div>

    `;


    details.classList.add(
        "active"
    );


    window.scrollTo({
        top:0,
        behavior:"smooth"
    });

}


/* =========================
        CLOSE TEAM
========================= */

function closeTeam(){

    const list =
        document.getElementById(
            "teamList"
        );

    const details =
        document.getElementById(
            "teamDetails"
        );


    if(!list || !details) return;


    details.classList.remove(
        "active"
    );

    details.innerHTML = "";


    list.style.display =
        "";

}

/* =========================
        RENDER MATCH TEAMS
========================= */

function renderMatchTeams(){

    const container =
        document.getElementById(
            "matchTeamList"
        );

    if(!container) return;


    /* =========================
            FILTRE
    ========================= */

    let filteredMatches =
        [...matches];


    if(
        typeof currentMatchFilter !== "undefined"
    ){

        if(currentMatchFilter === "played"){

            filteredMatches =
                filteredMatches.filter(
                    match =>
                        match.status === "played"
                );

        }


        if(currentMatchFilter === "upcoming"){

            filteredMatches =
                filteredMatches.filter(
                    match =>
                        match.status !== "played"
                );

        }

    }


    /* =========================
            AUCUN MATCH
    ========================= */

    if(filteredMatches.length === 0){

        container.innerHTML = `

            <div class="empty-card">

                <div class="empty-icon">
                    ⚔
                </div>

                <strong>
                    NO MATCHES
                </strong>

                <p>
                    No matches found.
                </p>

            </div>

        `;

        return;

    }


    /* =========================
            AFFICHAGE
    ========================= */

    container.innerHTML =
        filteredMatches.map(
            match => {

                const team1 =
                    teams.find(
                        team =>
                            team.name ===
                            match.team1
                    );


                const team2 =
                    teams.find(
                        team =>
                            team.name ===
                            match.team2
                    );


                const score1 =
                    Number(
                        match.score1 || 0
                    );


                const score2 =
                    Number(
                        match.score2 || 0
                    );


                const played =
                    match.status === "played";


                let resultClass =
                    "match-card-upcoming";


                if(played){

                    if(score1 > score2){

                        resultClass =
                            "match-card-win";

                    }
                    else if(score2 > score1){

                        resultClass =
                            "match-card-loss";

                    }

                }


                const scoreHTML =
                    played

                    ?

                    `
                    <span class="${
                        score1 > score2
                        ? "score-win"
                        : "score-loss"
                    }">
                        ${score1}
                    </span>

                    <b>-</b>

                    <span class="${
                        score2 > score1
                        ? "score-win"
                        : "score-loss"
                    }">
                        ${score2}
                    </span>
                    `

                    :

                    `
                    <span class="score-upcoming">
                        VS
                    </span>
                    `;


                return `

                <div
                    class="
                        match-v2-card
                        ${resultClass}
                    "
                    onclick="openMatch('${match.id}')"
                >

                    <div class="match-v2-top">

                        <span>
                            MATCH ${match.id}
                        </span>


                        <strong>

                            ${
                                played
                                ? (
                                    score1 > score2
                                    ? match.team1 + " WIN"
                                    : score2 > score1
                                    ? match.team2 + " WIN"
                                    : "DRAW"
                                )
                                : "UPCOMING"
                            }

                        </strong>

                    </div>


                    <div class="match-v2-versus">


                        <div class="match-v2-team">

                            ${
                                team1
                                ?

                                `
                                <img
                                    src="${team1.logo}"
                                    alt="${match.team1}"
                                >
                                `

                                :

                                ""
                            }

                            <span>
                                ${match.team1}
                            </span>

                        </div>


                        <div class="match-v2-score">

                            <strong>

                                ${scoreHTML}

                            </strong>

                        </div>


                        <div class="match-v2-team">

                            ${
                                team2
                                ?

                                `
                                <img
                                    src="${team2.logo}"
                                    alt="${match.team2}"
                                >
                                `

                                :

                                ""
                            }

                            <span>
                                ${match.team2}
                            </span>

                        </div>


                    </div>


                    ${
                        match.mvp

                        ?

                        `
                        <div class="match-v2-mvp">

                            👑 MVP

                            <strong>
                                ${match.mvp.name}
                            </strong>

                        </div>
                        `

                        :

                        ""
                    }


                    ${
                        !played

                        ?

                        `
                        <div class="match-v2-status">

                            UPCOMING MATCH

                        </div>
                        `

                        :

                        ""
                    }

                </div>

                `;

            }
        ).join("");

}

/* =========================
        MATCH FILTERS
========================= */

function setupMatchFilters(){

    document.querySelectorAll(
        "[data-match-filter]"
    ).forEach(button => {

        button.addEventListener(
            "click",
            () => {

                currentMatchFilter =
                    button.dataset.matchFilter;


                document
                    .querySelectorAll(
                        "[data-match-filter]"
                    )
                    .forEach(
                        btn =>
                            btn.classList.remove(
                                "active"
                            )
                    );


                button.classList.add(
                    "active"
                );


                if(selectedMatchTeam){

                    const team =
                        teams.find(
                            t =>
                                t.name ===
                                selectedMatchTeam
                        );


                    if(team){

                        renderTeamMatchHistory(
                            team
                        );

                    }

                }

            }
        );

    });

}


/* =========================
        MATCH COUNT
========================= */

function updateMatchCount(){

    const count =
        document.getElementById(
            "matchPageCount"
        );

    if(!count) return;


    count.textContent =
        matches.length;

}

/* =========================
        MATCH DETAILS
========================= */

function openMatch(matchId){

    const match =
        matches.find(
            m => String(m.id) === String(matchId)
        );

    if(!match) return;


    /*
     * Il existe maintenant deux contextes :
     *
     * 1. Match ouvert depuis TEAMS
     * 2. Match ouvert depuis MATCHES
     *
     * Les deux ont leur propre conteneur.
     */

    const teamsPage =
        document.getElementById("teams");

    const matchesPage =
        document.getElementById("matches");


    const openedFromTeams =
        teamsPage &&
        teamsPage.classList.contains("active");


    const details =
        openedFromTeams
        ? document.getElementById("teamMatchDetails")
        : document.getElementById("matchDetails");


    if(!details) return;


    const team1 =
        teams.find(
            team => team.name === match.team1
        );

    const team2 =
        teams.find(
            team => team.name === match.team2
        );


    const score1 =
        Number(match.score1 || 0);

    const score2 =
        Number(match.score2 || 0);


    const team1Won =
        score1 > score2;


    const team2Won =
        score2 > score1;


    /*
     * Si le match est ouvert depuis TEAMS,
     * on masque le profil de l'équipe.
     */

    if(openedFromTeams){

        const teamDetails =
            document.getElementById("teamDetails");

        const teamList =
            document.getElementById("teamList");


        if(teamDetails){

            teamDetails.classList.remove(
                "active"
            );

        }


        if(teamList){

            teamList.style.display =
                "none";

        }

    }


    /*
     * Si le match est ouvert depuis MATCHES,
     * on masque les autres vues de MATCHES.
     */

    else{

        const teamList =
            document.getElementById(
                "matchTeamList"
            );

        const matchTeamDetails =
            document.getElementById(
                "matchTeamDetails"
            );


        if(teamList){

            teamList.style.display =
                "none";

        }


        if(matchTeamDetails){

            matchTeamDetails.classList.remove(
                "active"
            );

        }

    }


    details.innerHTML = `

        <button
            class="back-button"
            onclick="closeMatch()"
        >
            ← BACK
        </button>


        <div class="match-detail-header">

            <span>
                MATCH ${match.id}
            </span>

            <strong>
                ${match.status === "played"
                    ? "PLAYED"
                    : "UPCOMING"
                }
            </strong>

        </div>


        <div class="match-detail-scoreboard">

            <div class="
                match-detail-team
                ${team1Won ? "match-winner" : ""}
            ">

                <img
                    src="${team1 ? team1.logo : ""}"
                    alt="${match.team1}"
                >

                <strong>
                    ${match.team1}
                </strong>

            </div>


            <div class="match-detail-score">

                <span class="${
                    team1Won
                    ? "history-score-win"
                    : team2Won
                    ? "history-score-loss"
                    : ""
                }">

                    ${score1}

                </span>


                <b>
                    -
                </b>


                <span class="${
                    team2Won
                    ? "history-score-win"
                    : team1Won
                    ? "history-score-loss"
                    : ""
                }">

                    ${score2}

                </span>

            </div>


            <div class="
                match-detail-team
                ${team2Won ? "match-winner" : ""}
            ">

                <img
                    src="${team2 ? team2.logo : ""}"
                    alt="${match.team2}"
                >

                <strong>
                    ${match.team2}
                </strong>

            </div>

        </div>


        <div class="match-result">

            ${
                team1Won
                ? `${match.team1} WIN`
                : team2Won
                ? `${match.team2} WIN`
                : "DRAW"
            }

        </div>


        ${
            match.mvp

            ?

            `

            <div class="match-mvp-card">

                <div class="match-mvp-title">
                    👑 MATCH MVP
                </div>

                <strong>
                    ${match.mvp.name}
                </strong>

                <div>

                    ${match.mvp.kills} K
                    •
                    ${match.mvp.assists} A
                    •
                    ${match.mvp.deaths} D

                    <span>
                        KD ${Number(match.mvp.kd).toFixed(2)}
                    </span>

                </div>

            </div>

            `

            :

            ""

        }


        <div class="section-title">

            <span></span>

            PLAYER STATS

            <span></span>

        </div>


        <div class="match-player-columns">

            <div class="
    match-player-team
    ${
        team1Won
        ? "match-player-team-win"
        : team2Won
        ? "match-player-team-loss"
        : ""
    }
">

    <div class="match-player-team-title">

        ${match.team1}

    </div>


                ${
                    match.stats

                    ?

                    match.stats
                        .filter(
                            player =>
                                player.team ===
                                match.team1
                        )
                        .map(
                            player => {

                                const kd =
                                    player.deaths === 0
                                    ? player.kills
                                    : player.kills /
                                      player.deaths;


                                return `

                                <div class="match-player-card">

                                    <div>

                                        <strong>
                                            ${player.player}
                                        </strong>

                                        <span>
                                            ${player.kills} K
                                            •
                                            ${player.assists} A
                                            •
                                            ${player.deaths} D
                                        </span>

                                    </div>


                                    <strong class="
                                        ${
                                            kd >= 2
                                            ? "kd-good"
                                            : kd >= 1
                                            ? "kd-mid"
                                            : "kd-bad"
                                        }
                                    ">

                                        ${kd.toFixed(2)}

                                        <small>
                                            KD
                                        </small>

                                    </strong>

                                </div>

                                `;

                            }
                        )
                        .join("")

                    :

                    ""

                }

            </div>


            <div class="
    match-player-team
    ${
        team2Won
        ? "match-player-team-win"
        : team1Won
        ? "match-player-team-loss"
        : ""
    }
">

    <div class="match-player-team-title">

        ${match.team2}

    </div>


                ${
                    match.stats

                    ?

                    match.stats
                        .filter(
                            player =>
                                player.team ===
                                match.team2
                        )
                        .map(
                            player => {

                                const kd =
                                    player.deaths === 0
                                    ? player.kills
                                    : player.kills /
                                      player.deaths;


                                return `

                                <div class="match-player-card">

                                    <div>

                                        <strong>
                                            ${player.player}
                                        </strong>

                                        <span>
                                            ${player.kills} K
                                            •
                                            ${player.assists} A
                                            •
                                            ${player.deaths} D
                                        </span>

                                    </div>


                                    <strong class="
                                        ${
                                            kd >= 2
                                            ? "kd-good"
                                            : kd >= 1
                                            ? "kd-mid"
                                            : "kd-bad"
                                        }
                                    ">

                                        ${kd.toFixed(2)}

                                        <small>
                                            KD
                                        </small>

                                    </strong>

                                </div>

                                `;

                            }
                        )
                        .join("")

                    :

                    ""

                }

            </div>

        </div>

    `;


    details.classList.add(
        "active"
    );


    window.scrollTo({
        top:0,
        behavior:"smooth"
    });

}


/* =========================
        CLOSE MATCH
========================= */

function closeMatch(){

    const matchDetails =
        document.getElementById(
            "matchDetails"
        );

    const teamMatchDetails =
        document.getElementById(
            "teamMatchDetails"
        );


    /*
     * Fermer le détail MATCHES
     */

    if(matchDetails){

        matchDetails.classList.remove(
            "active"
        );

        matchDetails.innerHTML = "";

    }


    /*
     * Fermer le détail ouvert
     * depuis TEAMS
     */

    if(teamMatchDetails){

        teamMatchDetails.classList.remove(
            "active"
        );

        teamMatchDetails.innerHTML = "";

    }


    /*
     * Restaurer les équipes de MATCHES
     */

    const matchTeamList =
        document.getElementById(
            "matchTeamList"
        );

    const matchTeamDetails =
        document.getElementById(
            "matchTeamDetails"
        );


    if(matchTeamList){

        matchTeamList.style.display = "";

    }


    if(matchTeamDetails){

        matchTeamDetails.classList.remove(
            "active"
        );

    }


    /*
     * Restaurer le profil / la liste TEAMS
     */

    const teamList =
        document.getElementById(
            "teamList"
        );

    const teamDetails =
        document.getElementById(
            "teamDetails"
        );


    if(teamDetails){

        teamDetails.classList.remove(
            "active"
        );

        teamDetails.innerHTML = "";

    }


    if(teamList){

        teamList.style.display = "";

    }

}

/* =========================
        CLOSE TEAM
========================= */

function closeTeam(){

    const list =
        document.getElementById(
            "teamList"
        );

    const details =
        document.getElementById(
            "teamDetails"
        );

    const teamMatchDetails =
        document.getElementById(
            "teamMatchDetails"
        );


    if(details){

        details.classList.remove(
            "active"
        );

        details.innerHTML = "";

    }


    if(teamMatchDetails){

        teamMatchDetails.classList.remove(
            "active"
        );

        teamMatchDetails.innerHTML = "";

    }


    if(list){

        list.style.display = "";

    }

}


/* =========================
        PLAYERS
========================= */

function renderPlayers(sortMode = "leaderboard"){

    const container =
        document.getElementById("playerList");

    if(!container) return;


    /* =========================
            SORT PLAYERS
    ========================= */

    const sortedPlayers =
        [...players].sort(
            (a,b) => {

                /* =========================
                    LEADERBOARD
                    KD → KILLS → ASSISTS
                ========================= */

                if(sortMode === "leaderboard"){

                    const kdA =
                        getKD(a);

                    const kdB =
                        getKD(b);


                    if(kdB !== kdA){

                        return kdB - kdA;

                    }


                    if(b.kills !== a.kills){

                        return b.kills - a.kills;

                    }


                    return b.assists - a.assists;

                }


                /* =========================
                        KD
                ========================= */

                if(sortMode === "kd"){

                    return getKD(b) - getKD(a);

                }


                /* =========================
                        KILLS
                ========================= */

                if(sortMode === "kills"){

                    return b.kills - a.kills;

                }


                /* =========================
                        MVP
                ========================= */

                if(sortMode === "mvp"){

                    return b.mvp - a.mvp;

                }


                return 0;

            }
        );


    /* =========================
            DISPLAY PLAYERS
    ========================= */

    container.innerHTML =
        sortedPlayers.map(
            (player,index) => {


                const kd =
                    getKD(player);


                /* =========================
                        KD COLOR
                ========================= */

                let kdClass =
                    "kd-bad";


                if(kd >= 2){

                    kdClass =
                        "kd-good";

                }
                else if(kd >= 1){

                    kdClass =
                        "kd-mid";

                }


                /* =========================
                        RANK COLOR
                ========================= */

                let rankClass =
                    "player-rank-normal";


                /* 🥇 #1 */

                if(index === 0){

                    rankClass =
                        "player-rank-first";

                }


                /* 🥈 #2 */

                else if(index === 1){

                    rankClass =
                        "player-rank-second";

                }


                /* 🥉 #3 */

                else if(index === 2){

                    rankClass =
                        "player-rank-third";

                }


                /* 🔴 3 DERNIERS */

                else if(
                    index >=
                    sortedPlayers.length - 3
                ){

                    rankClass =
                        "player-rank-last";

                }


                /* =========================
                        TEAM LOGO
                ========================= */

                const playerTeam =
                    teams.find(
                        team =>
                            team.name ===
                            player.team
                    );


                const teamLogo =
                    playerTeam
                    ? playerTeam.logo
                    : "";


                /* =========================
                        PLAYER CARD
                ========================= */

                return `

                <div class="player-card">


                    <div
                        class="
                            player-rank
                            ${rankClass}
                        "
                    >

                        ${index + 1}

                    </div>


                    <div class="player-team-logo">

                        ${
                            teamLogo

                            ?

                            `
                            <img
                                src="${teamLogo}"
                                alt="${player.team}"
                            >
                            `

                            :

                            `
                            <div class="player-team-logo-empty">
                                ?
                            </div>
                            `
                        }

                    </div>


                    <div class="player-info">

                        <div class="player-name">

                            ${player.name}

                        </div>


                        <div class="player-team">

                            ${player.team}

                        </div>

                    </div>


                    <div class="player-stats">

                        <span>
                            ${player.kills} K
                        </span>


                        <span>
                            ${player.assists} A
                        </span>


                        <span>
                            ${player.deaths} D
                        </span>


                        <strong class="${kdClass}">

                            ${kd.toFixed(2)} KD

                        </strong>


                        <span>
                            👑 ${player.mvp || 0} MVP
                        </span>

                    </div>


                </div>

                `;

            }
        ).join("");

}

/* =========================
        PLAYER FILTERS
========================= */

function setupPlayerFilters(){

    const filters =
        document.querySelectorAll(
            ".filter"
        );


    filters.forEach(
        filter => {

            filter.addEventListener(
                "click",
                () => {


                    /* =========================
                            ACTIVE BUTTON
                    ========================= */

                    filters.forEach(
                        button => {

                            button.classList.remove(
                                "active"
                            );

                        }
                    );


                    filter.classList.add(
                        "active"
                    );


                    /* =========================
                            SORT MODE
                    ========================= */

                    const sortMode =
                        filter.dataset.sort;


                    renderPlayers(
                        sortMode
                    );

                }
            );

        }
    );

}

/* =========================
        RANKING
========================= */

function renderRanking(){

    const container =
        document.getElementById("rankingList");

    if(!container) return;


    const sorted =
        [...teams].sort(
            (a,b) => {

                if(
                    Number(b.points) !==
                    Number(a.points)
                ){

                    return (
                        Number(b.points) -
                        Number(a.points)
                    );

                }

                return (
                    Number(b.rd) -
                    Number(a.rd)
                );

            }
        );


    container.innerHTML =
        sorted.map(
            (team,index) => {

                let rankClass =
                    "rank-normal";

                if(index === 0){
                    rankClass =
                        "rank-first";
                }
                else if(index === 1){
                    rankClass =
                        "rank-second";
                }
                else if(index === 2){
                    rankClass =
                        "rank-third";
                }


                return `

                <div
                    class="
                        ranking-card
                        ${rankClass}
                    "
                >

                    <div class="ranking-position">
                        #${index + 1}
                    </div>


                    <img
                        src="${team.logo}"
                        class="ranking-logo"
                        alt="${team.name}"
                    >


                    <div class="ranking-team">

                        <strong>
                            ${team.name}
                        </strong>

                        <span>

                            RD

                            ${
                                Number(team.rd) >= 0
                                ? "+"
                                : ""
                            }

                            ${team.rd}

                        </span>

                    </div>


                    <div class="ranking-points">

                        ${team.points}

                        <span>
                            PTS
                        </span>

                    </div>

                </div>

                `;

            }
        ).join("");

}


/* =========================
        COUNTS
========================= */

function updateCounts(){

    const teamCount =
        document.getElementById(
            "homeTeamCount"
        );

    const playerCount =
        document.getElementById(
            "homePlayerCount"
        );

    const teamPageCount =
        document.getElementById(
            "teamPageCount"
        );

    const playerPageCount =
        document.getElementById(
            "playerPageCount"
        );


    if(teamCount){
        teamCount.textContent =
            teams.length;
    }


    if(playerCount){
        playerCount.textContent =
            players.length;
    }


    if(teamPageCount){
        teamPageCount.textContent =
            teams.length;
    }


    if(playerPageCount){
        playerPageCount.textContent =
            players.length;
    }

}


/* =========================
        NAVIGATION
========================= */

function showPage(pageId, button){

    document.querySelectorAll(".page")
        .forEach(page => {

            page.classList.remove("active");

        });


    const page =
        document.getElementById(pageId);

    if(!page) return;


    page.classList.add("active");


    document.querySelectorAll(".nav-button")
        .forEach(btn => {

            btn.classList.remove("active");

        });


    if(button){
        button.classList.add("active");
    }


    if(pageId !== "teams"){
        closeTeam();
    }


    window.scrollTo({
        top:0,
        behavior:"smooth"
    });

}


/* =========================
        PAGE BY ID
========================= */

function showPageById(pageId){

    const button =
        [...document.querySelectorAll(".nav-button")]
        .find(btn =>
            btn.getAttribute("onclick")
                ?.includes(`'${pageId}'`)
        );


    showPage(
        pageId,
        button
    );

}


/* =========================
        EXTERNAL LINKS
========================= */

function openLink(url){

    window.open(
        url,
        "_blank",
        "noopener,noreferrer"
    );

}


/* =========================
        INIT
========================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log(
            "DMBDR CHAMPIONSHIP V2 — ONLINE"
        );


        try{

            await loadTeams();

            await loadPlayers();

            await loadMatches();


            /* =========================
               CALCUL CHAMPIONNAT
            ========================= */

            calculateChampionshipStats();


            /* =========================
               RAFRAÎCHISSEMENT AFFICHAGE
            ========================= */

            renderTeams();

renderPlayers("leaderboard");

renderRanking();

renderMatchTeams();

updateCounts();

updateMatchCount();

setupPlayerFilters();

setupMatchFilters();


            console.log(
                teams.length +
                " équipes chargées"
            );


            console.log(
                players.length +
                " joueurs chargés"
            );


            console.log(
                matches.length +
                " matchs chargés"
            );

        }
        catch(error){

            console.error(
                "Erreur chargement données :",
                error
            );

        }

    }
);

let teams = [];
let players = [];
let matches = [];

/* =========================
        DISCORD BOOSTERS
========================= */

const boosters = [
    "Akra",
    "Manji",
    "Nounours",
    "Sharko",
    "Narvalow"
];

let currentMatchFilter = "all";
let selectedMatchTeam = null;

/* =========================
        RENDER BOOSTERS
========================= */

function renderBoosters(){

    const container =
        document.getElementById("boostersList");

    if(!container) return;

    container.innerHTML =
        boosters.map(player => `

            <div class="booster-player">

                <div class="booster-image">
                    <img src="boost.jpg" alt="Discord Booster">
                </div>

                <div class="booster-name">
                    ${player}
                </div>

            </div>

        `).join("");

}

/* =========================
        LOAD TEAMS
========================= */

async function loadTeams(){

    const response =
        await fetch("data/teams.json");

    if(!response.ok){
        throw new Error("teams.json introuvable");
    }

    const data = await response.json();

    teams = Array.isArray(data)
        ? data
        : data.teams || [];

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

    const data = await response.json();

    players = Array.isArray(data)
        ? data
        : data.players || [];

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

        const data = await response.json();

        /*
         * Accepte les deux formats :
         *
         * [
         *   { ... }
         * ]
         *
         * ou :
         *
         * {
         *   "matches": [...]
         * }
         */

        matches = Array.isArray(data)
            ? data
            : Array.isArray(data.matches)
            ? data.matches
            : [];

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

    const kills = Number(player.kills || 0);
    const deaths = Number(player.deaths || 0);

    if(deaths === 0){
        return kills;
    }

    return kills / deaths;

}

/* =========================
   CALCUL AUTOMATIQUE STATS
========================= */

function calculateChampionshipStats(){

    /* RESET EQUIPES */

    teams.forEach(team => {

        team.points = 0;
        team.roundsWon = 0;
        team.roundsLost = 0;
        team.rd = 0;

    });

    /* RESET JOUEURS */

    players.forEach(player => {

        player.kills = 0;
        player.assists = 0;
        player.deaths = 0;
        player.mvp = 0;

    });

    /* CALCUL DES MATCHS */

    matches.forEach(match => {

        if(match.status !== "played"){
            return;
        }

        const team1 =
            teams.find(team =>
                team.name === match.team1
            );

        const team2 =
            teams.find(team =>
                team.name === match.team2
            );

        if(!team1 || !team2){
            return;
        }

        const score1 =
            Number(match.score1 || 0);

        const score2 =
            Number(match.score2 || 0);

        /* ROUNDS */

        team1.roundsWon += score1;
        team1.roundsLost += score2;

        team2.roundsWon += score2;
        team2.roundsLost += score1;

        /* RD */

        team1.rd += score1 - score2;
        team2.rd += score2 - score1;

        /* POINTS */

        if(score1 > score2){
            team1.points += 3;
        }
        else if(score2 > score1){
            team2.points += 3;
        }

        /* STATS JOUEURS */

        if(Array.isArray(match.stats)){

            match.stats.forEach(stat => {

                const player =
                    players.find(p =>
                        p.name === stat.player
                    );

                if(!player) return;

                player.kills +=
                    Number(stat.kills || 0);

                player.assists +=
                    Number(stat.assists || 0);

                player.deaths +=
                    Number(stat.deaths || 0);

            });

        }

        /* MVP */

        if(match.mvp){

            const mvpPlayer =
                players.find(player =>
                    player.name === match.mvp.name
                );

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
        teams.map(team => {

            /*
             * Utilise le chemin de bannière
             * défini dans teams.json.
             */

            const banner =
                team.banner || "";

            const playerCount =
                Array.isArray(team.players)
                ? team.players.length
                : 0;

            return `

            <div
                class="team-card clickable"
                onclick="openTeam('${team.id}')"
            >

                <img
                    class="team-card-banner"
                    src="${banner}"
                    alt="${team.name}"
                >

                <div class="team-card-overlay"></div>

                <div class="team-card-content">

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

                            ${playerCount}

                            PLAYER${playerCount > 1 ? "S" : ""}

                        </div>

                    </div>

                </div>

            </div>

            `;

        }).join("");

}

/* =========================
        TEAM PROFILE
========================= */

function openTeam(teamId){

    const team =
        teams.find(t =>
            String(t.id) === String(teamId)
        );

    if(!team) return;

    const list =
        document.getElementById("teamList");

    const details =
        document.getElementById("teamDetails");

    if(!list || !details) return;

    /*
     * Joueurs récupérés depuis players.json.
     * Les remplaçants sont également affichés.
     */

    const teamPlayers =
        players.filter(player =>
            player.team === team.name
        );

    let roster = teamPlayers;

    /*
     * Solution de secours si players.json
     * ne contient aucun joueur pour l'équipe.
     */

    if(
        roster.length === 0 &&
        Array.isArray(team.players)
    ){

        roster = team.players.map(player => {

            if(typeof player === "string"){

                return {
                    name: player,
                    team: team.name,
                    kills: 0,
                    assists: 0,
                    deaths: 0,
                    mvp: 0
                };

            }

            return player;

        });

    }

    list.style.display = "none";

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

                <span>TEAM ROSTER</span>

                <h2>${team.name}</h2>

            </div>

        </div>

        <div class="team-roster-count">

            <span>PLAYERS</span>

            <strong>${roster.length}</strong>

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
                roster.map((player,index) => {

                    const kills =
                        Number(player.kills || 0);

                    const assists =
                        Number(player.assists || 0);

                    const deaths =
                        Number(player.deaths || 0);

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

                    /*
                     * Photo individuelle si disponible.
                     * Sinon, logo de l'équipe.
                     */

                    const playerTeam =
                        teams.find(t =>
                            t.name === player.team
                        );

                    const playerPhoto =
                        player.photo ||
                        player.avatar ||
                        (playerTeam ? playerTeam.logo : team.logo);

                    return `

                    <div class="simple-roster-player">

                        <div class="simple-roster-number">
                            ${String(index + 1).padStart(2,"0")}
                        </div>

                        <div class="simple-roster-info">

                            <div class="simple-roster-photo">

                                <img
                                    src="${playerPhoto}"
                                    alt="${player.name}"
                                >

                            </div>

                            <div>

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

                                ${
                                    player.role === "substitute"
                                    ? `<small>SUBSTITUTE</small>`
                                    : ""
                                }

                            </div>

                        </div>

                        <div class="simple-roster-kd ${kdClass}">

                            ${kd.toFixed(2)}

                            <small>KD</small>

                        </div>

                    </div>

                    `;

                }).join("")
                :
                `

                <div class="empty-card">

                    <div class="empty-icon">♙</div>

                    <strong>NO PLAYERS</strong>

                    <p>No players found for this team.</p>

                </div>

                `
            }

        </div>

    `;

    details.classList.add("active");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}

/* =========================
        CLOSE TEAM
========================= */

function closeTeam(){

    const list =
        document.getElementById("teamList");

    const details =
        document.getElementById("teamDetails");

    const teamMatchDetails =
        document.getElementById("teamMatchDetails");

    if(details){
        details.classList.remove("active");
        details.innerHTML = "";
    }

    if(teamMatchDetails){
        teamMatchDetails.classList.remove("active");
        teamMatchDetails.innerHTML = "";
    }

    if(list){
        list.style.display = "";
    }

}

/* =========================
        RENDER MATCH TEAMS
========================= */

function renderMatchTeams(){

    const container =
        document.getElementById("matchTeamList");

    if(!container) return;

    selectedMatchTeam = null;

    let visibleTeams =
        teams.filter(team => {

            const teamMatches =
                matches.filter(match =>
                    match.team1 === team.name ||
                    match.team2 === team.name
                );

            if(currentMatchFilter === "played"){

                return teamMatches.some(match =>
                    match.status === "played"
                );

            }

            if(currentMatchFilter === "upcoming"){

                return teamMatches.some(match =>
                    match.status !== "played"
                );

            }

            return teamMatches.length > 0;

        });

    if(visibleTeams.length === 0){

        container.innerHTML = `

            <div class="empty-card">

                <div class="empty-icon">⚔</div>

                <strong>NO MATCHES</strong>

                <p>No matches found for this filter.</p>

            </div>

        `;

        return;

    }

    container.innerHTML =
        visibleTeams.map(team => {

            const teamMatches =
                matches.filter(match =>
                    match.team1 === team.name ||
                    match.team2 === team.name
                );

            const playedCount =
                teamMatches.filter(match =>
                    match.status === "played"
                ).length;

            const upcomingCount =
                teamMatches.filter(match =>
                    match.status !== "played"
                ).length;

            return `

            <div
                class="match-team-card"
                onclick="openMatchTeam('${team.name}')"
            >

                <div class="match-team-logo">

                    <img
                        src="${team.logo}"
                        alt="${team.name}"
                    >

                </div>

                <div class="match-team-info">

                    <strong>${team.name}</strong>

                    <span>
                        ${teamMatches.length}
                        MATCH${teamMatches.length > 1 ? "S" : ""}
                    </span>

                </div>

                <div class="match-team-status">

                    ${
                        playedCount > 0
                        ?
                        `<span class="match-team-played">
                            ${playedCount} PLAYED
                        </span>`
                        :
                        ""
                    }

                    ${
                        upcomingCount > 0
                        ?
                        `<span class="match-team-upcoming">
                            ${upcomingCount} UPCOMING
                        </span>`
                        :
                        ""
                    }

                </div>

            </div>

            `;

        }).join("");

}

/* =========================
        OPEN TEAM MATCHES
========================= */

function openMatchTeam(teamName){

    const team =
        teams.find(t =>
            t.name === teamName
        );

    if(!team) return;

    selectedMatchTeam = team.name;

    const list =
        document.getElementById("matchTeamList");

    const details =
        document.getElementById("matchTeamDetails");

    if(!list || !details) return;

    list.style.display = "none";

    renderTeamMatchHistory(team);

    details.classList.add("active");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}

/* =========================
        TEAM MATCH HISTORY
========================= */

function renderTeamMatchHistory(team){

    const details =
        document.getElementById("matchTeamDetails");

    if(!details) return;

    let teamMatches =
        matches.filter(match =>
            match.team1 === team.name ||
            match.team2 === team.name
        );

    if(currentMatchFilter === "played"){

        teamMatches =
            teamMatches.filter(match =>
                match.status === "played"
            );

    }

    if(currentMatchFilter === "upcoming"){

        teamMatches =
            teamMatches.filter(match =>
                match.status !== "played"
            );

    }

    teamMatches.sort((a,b) =>
        Number(a.id) - Number(b.id)
    );

    details.innerHTML = `

        <button
            class="back-button"
            onclick="closeMatch()"
        >
            ← BACK TO TEAMS
        </button>

        <div class="match-team-profile">

            <div class="match-team-profile-logo">

                <img
                    src="${team.logo}"
                    alt="${team.name}"
                >

            </div>

            <div>

                <span>MATCH HISTORY</span>

                <h2>${team.name}</h2>

            </div>

        </div>

        <div class="match-team-filter-info">

            <span>
                ${
                    currentMatchFilter === "all"
                    ? "ALL MATCHES"
                    : currentMatchFilter === "played"
                    ? "PLAYED MATCHES"
                    : "UPCOMING MATCHES"
                }
            </span>

            <strong>${teamMatches.length}</strong>

        </div>

        <div class="match-history-list">

            ${
                teamMatches.length
                ?
                teamMatches.map(match => {

                    const team1 =
                        teams.find(t =>
                            t.name === match.team1
                        );

                    const team2 =
                        teams.find(t =>
                            t.name === match.team2
                        );

                    const played =
                        match.status === "played";

                    const score1 =
                        Number(match.score1 || 0);

                    const score2 =
                        Number(match.score2 || 0);

                    const isTeam1 =
                        match.team1 === team.name;

                    let resultClass =
                        "match-card-upcoming";

                    if(played){

                        const teamWon =
                            isTeam1
                            ? score1 > score2
                            : score2 > score1;

                        resultClass =
                            teamWon
                            ? "match-card-win"
                            : score1 === score2
                            ? "match-card-upcoming"
                            : "match-card-loss";

                    }

                    const scoreHTML =
                        played
                        ?
                        `
                        <span class="${
                            score1 > score2
                            ? "score-win"
                            : score1 < score2
                            ? "score-loss"
                            : ""
                        }">
                            ${score1}
                        </span>

                        <b>-</b>

                        <span class="${
                            score2 > score1
                            ? "score-win"
                            : score2 < score1
                            ? "score-loss"
                            : ""
                        }">
                            ${score2}
                        </span>
                        `
                        :
                        `<span class="score-upcoming">VS</span>`;

                    return `

                    <div
                        class="match-v2-card ${resultClass}"
                        onclick="openMatch('${match.id}')"
                    >

                        <div class="match-v2-top">

                            <span>MATCH ${match.id}</span>

                            <strong>

                                ${
                                    played
                                    ?
                                    (
                                        score1 === score2
                                        ? "DRAW"
                                        : score1 > score2
                                        ? `${match.team1} WIN`
                                        : `${match.team2} WIN`
                                    )
                                    :
                                    "UPCOMING"
                                }

                            </strong>

                        </div>

                        <div class="match-v2-versus">

                            <div class="match-v2-team">

                                ${
                                    team1
                                    ?
                                    `<img src="${team1.logo}" alt="${match.team1}">`
                                    :
                                    ""
                                }

                                <span>${match.team1}</span>

                            </div>

                            <div class="match-v2-score">

                                <strong>${scoreHTML}</strong>

                            </div>

                            <div class="match-v2-team">

                                ${
                                    team2
                                    ?
                                    `<img src="${team2.logo}" alt="${match.team2}">`
                                    :
                                    ""
                                }

                                <span>${match.team2}</span>

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
                            `<div class="match-v2-status">
                                UPCOMING MATCH
                            </div>`
                            :
                            ""
                        }

                    </div>

                    `;

                }).join("")
                :
                `

                <div class="empty-card">

                    <div class="empty-icon">⚔</div>

                    <strong>NO MATCHES</strong>

                    <p>No matches found for this filter.</p>

                </div>

                `
            }

        </div>

    `;

}

/* =========================
        MATCH FILTERS
========================= */

function setupMatchFilters(){

    document.querySelectorAll("[data-match-filter]")
        .forEach(button => {

            button.addEventListener("click", () => {

                currentMatchFilter =
                    button.dataset.matchFilter;

                document.querySelectorAll("[data-match-filter]")
                    .forEach(btn =>
                        btn.classList.remove("active")
                    );

                button.classList.add("active");

                if(selectedMatchTeam){

                    const team =
                        teams.find(t =>
                            t.name === selectedMatchTeam
                        );

                    if(team){
                        renderTeamMatchHistory(team);
                    }

                    return;

                }

                renderMatchTeams();

            });

        });

}

/* =========================
        MATCH COUNT
========================= */

function updateMatchCount(){

    const count =
        document.getElementById("matchPageCount");

    if(!count) return;

    count.textContent = matches.length;

}

/* =========================
        MATCH DETAILS
========================= */

function openMatch(matchId){

    const match =
        matches.find(m =>
            String(m.id) === String(matchId)
        );

    if(!match) return;

    const teamsPage =
        document.getElementById("teams");

    const openedFromTeams =
        teamsPage &&
        teamsPage.classList.contains("active");

    const details =
        openedFromTeams
        ? document.getElementById("teamMatchDetails")
        : document.getElementById("matchDetails");

    if(!details) return;

    const team1 =
        teams.find(team =>
            team.name === match.team1
        );

    const team2 =
        teams.find(team =>
            team.name === match.team2
        );

    const score1 =
        Number(match.score1 || 0);

    const score2 =
        Number(match.score2 || 0);

    const team1Won =
        score1 > score2;

    const team2Won =
        score2 > score1;

    if(openedFromTeams){

        const teamDetails =
            document.getElementById("teamDetails");

        const teamList =
            document.getElementById("teamList");

        if(teamDetails){
            teamDetails.classList.remove("active");
        }

        if(teamList){
            teamList.style.display = "none";
        }

    }
    else{

        const teamList =
            document.getElementById("matchTeamList");

        const matchTeamDetails =
            document.getElementById("matchTeamDetails");

        if(teamList){
            teamList.style.display = "none";
        }

        if(matchTeamDetails){
            matchTeamDetails.classList.remove("active");
        }

    }

    const stats =
        Array.isArray(match.stats)
        ? match.stats
        : [];

    /*
     * Accepte les liens YouTube youtu.be
     * et youtube.com/watch?v=
     */

    let videoId = "";

    if(match.video){

        const videoURL = match.video;

        const shortMatch =
            videoURL.match(/youtu\.be\/([^?&]+)/);

        const longMatch =
            videoURL.match(/[?&]v=([^?&]+)/);

        const embedMatch =
            videoURL.match(/youtube\.com\/embed\/([^?&]+)/);

        videoId =
            shortMatch?.[1] ||
            longMatch?.[1] ||
            embedMatch?.[1] ||
            "";

    }

    details.innerHTML = `

        <button
            class="back-button"
            onclick="closeMatch()"
        >
            ← BACK
        </button>

        <div class="match-detail-header">

            <span>MATCH ${match.id}</span>

            <strong>
                ${match.status === "played" ? "PLAYED" : "UPCOMING"}
            </strong>

        </div>

        <div class="match-detail-scoreboard">

            <div class="match-detail-team ${team1Won ? "match-winner" : ""}">

                <img
                    src="${team1 ? team1.logo : ""}"
                    alt="${match.team1}"
                >

                <strong>${match.team1}</strong>

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

                <b>-</b>

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

            <div class="match-detail-team ${team2Won ? "match-winner" : ""}">

                <img
                    src="${team2 ? team2.logo : ""}"
                    alt="${match.team2}"
                >

                <strong>${match.team2}</strong>

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

                <strong>${match.mvp.name}</strong>

                <div>

                    ${match.mvp.kills || 0} K
                    •
                    ${match.mvp.assists || 0} A
                    •
                    ${match.mvp.deaths || 0} D

                    <span>
                        KD ${Number(match.mvp.kd || 0).toFixed(2)}
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
                    stats
                        .filter(player =>
                            player.team === match.team1
                        )
                        .map(player => {

                            const kills =
                                Number(player.kills || 0);

                            const assists =
                                Number(player.assists || 0);

                            const deaths =
                                Number(player.deaths || 0);

                            const kd =
                                deaths === 0
                                ? kills
                                : kills / deaths;

                            return `

                            <div class="match-player-card">

                                <div>

                                    <strong>${player.player}</strong>

                                    <span>
                                        ${kills} K
                                        •
                                        ${assists} A
                                        •
                                        ${deaths} D
                                    </span>

                                </div>

                                <strong class="${
                                    kd >= 2
                                    ? "kd-good"
                                    : kd >= 1
                                    ? "kd-mid"
                                    : "kd-bad"
                                }">

                                    ${kd.toFixed(2)}

                                    <small>KD</small>

                                </strong>

                            </div>

                            `;

                        }).join("")
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
                    stats
                        .filter(player =>
                            player.team === match.team2
                        )
                        .map(player => {

                            const kills =
                                Number(player.kills || 0);

                            const assists =
                                Number(player.assists || 0);

                            const deaths =
                                Number(player.deaths || 0);

                            const kd =
                                deaths === 0
                                ? kills
                                : kills / deaths;

                            return `

                            <div class="match-player-card">

                                <div>

                                    <strong>${player.player}</strong>

                                    <span>
                                        ${kills} K
                                        •
                                        ${assists} A
                                        •
                                        ${deaths} D
                                    </span>

                                </div>

                                <strong class="${
                                    kd >= 2
                                    ? "kd-good"
                                    : kd >= 1
                                    ? "kd-mid"
                                    : "kd-bad"
                                }">

                                    ${kd.toFixed(2)}

                                    <small>KD</small>

                                </strong>

                            </div>

                            `;

                        }).join("")
                }

            </div>

        </div>

        ${
            match.status === "played" && videoId
            ?
            `
            <div class="match-video-section">

                ${
                    match.publication
                    ?
                    `
                    <div class="match-publication-number">
                        PUBLICATION #${match.publication}
                    </div>
                    `
                    :
                    ""
                }

                <div class="match-video-player">

                    <iframe
                        src="https://www.youtube.com/embed/${videoId}"
                        title="MATCH ${match.id}"
                        frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowfullscreen>
                    </iframe>

                </div>

            </div>
            `
            :
            ""
        }

    `;

    details.classList.add("active");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}

/* =========================
        CLOSE MATCH
========================= */

function closeMatch(){

    const matchDetails =
        document.getElementById("matchDetails");

    const teamMatchDetails =
        document.getElementById("teamMatchDetails");

    if(matchDetails){
        matchDetails.classList.remove("active");
        matchDetails.innerHTML = "";
    }

    if(teamMatchDetails){
        teamMatchDetails.classList.remove("active");
        teamMatchDetails.innerHTML = "";
    }

    const matchTeamList =
        document.getElementById("matchTeamList");

    const matchTeamDetails =
        document.getElementById("matchTeamDetails");

    if(matchTeamList){
        matchTeamList.style.display = "";
    }

    if(matchTeamDetails){
        matchTeamDetails.classList.remove("active");
    }

    const teamList =
        document.getElementById("teamList");

    const teamDetails =
        document.getElementById("teamDetails");

    if(teamDetails){
        teamDetails.classList.remove("active");
        teamDetails.innerHTML = "";
    }

    if(teamList){
        teamList.style.display = "";
    }

}

/* =========================
        PLAYERS
========================= */

function renderPlayers(sortMode = "leaderboard"){

    const container =
        document.getElementById("playerList");

    if(!container) return;

    /*
     * Les remplaçants restent visibles
     * dans le classement des joueurs.
     */

    const sortedPlayers =
        [...players].sort((a,b) => {

            if(sortMode === "leaderboard"){

                const kdA = getKD(a);
                const kdB = getKD(b);

                if(kdB !== kdA){
                    return kdB - kdA;
                }

                if(b.kills !== a.kills){
                    return b.kills - a.kills;
                }

                return b.assists - a.assists;

            }

            if(sortMode === "kd"){
                return getKD(b) - getKD(a);
            }

            if(sortMode === "kills"){
                return b.kills - a.kills;
            }

            if(sortMode === "mvp"){
                return b.mvp - a.mvp;
            }

            return 0;

        });

    container.innerHTML =
        sortedPlayers.map((player,index) => {

            const kd = getKD(player);

            let kdClass = "kd-bad";

            if(kd >= 2){
                kdClass = "kd-good";
            }
            else if(kd >= 1){
                kdClass = "kd-mid";
            }

            let rankClass = "player-rank-normal";

            if(index === 0){
                rankClass = "player-rank-first";
            }
            else if(index === 1){
                rankClass = "player-rank-second";
            }
            else if(index === 2){
                rankClass = "player-rank-third";
            }
            else if(index >= sortedPlayers.length - 3){
                rankClass = "player-rank-last";
            }

            const playerTeam =
                teams.find(team =>
                    team.name === player.team
                );

            /*
             * Photo du joueur si renseignée.
             * Sinon logo de son équipe.
             */

            const playerPhoto =
                player.photo ||
                player.avatar ||
                (playerTeam ? playerTeam.logo : "");

            return `

            <div class="player-card">

                <div class="player-rank ${rankClass}">
                    ${index + 1}
                </div>

                <div class="player-team-logo">

                    ${
                        playerPhoto
                        ?
                        `
                        <img
                            src="${playerPhoto}"
                            alt="${player.name}"
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
                        ${
                            player.role === "substitute"
                            ? " • SUBSTITUTE"
                            : ""
                        }
                    </div>

                </div>

                <div class="player-stats">

                    <span>${player.kills} K</span>

                    <span>${player.assists} A</span>

                    <span>${player.deaths} D</span>

                    <strong class="${kdClass}">
                        ${kd.toFixed(2)} KD
                    </strong>

                    <span>
                        👑 ${player.mvp || 0} MVP
                    </span>

                </div>

            </div>

            `;

        }).join("");

}

/* =========================
        PLAYER FILTERS
========================= */

function setupPlayerFilters(){

    const filters =
        document.querySelectorAll(".filter");

    filters.forEach(filter => {

        filter.addEventListener("click", () => {

            filters.forEach(button => {
                button.classList.remove("active");
            });

            filter.classList.add("active");

            const sortMode =
                filter.dataset.sort;

            renderPlayers(sortMode);

        });

    });

}

/* =========================
        RANKING
========================= */

function renderRanking(){

    const container =
        document.getElementById("rankingList");

    if(!container) return;

    const sorted =
        [...teams].sort((a,b) => {

            const pointsA =
                Number(a.points || 0);

            const pointsB =
                Number(b.points || 0);

            const rdA =
                Number(a.rd || 0);

            const rdB =
                Number(b.rd || 0);

            if(pointsB !== pointsA){
                return pointsB - pointsA;
            }

            return rdB - rdA;

        });

    container.innerHTML =
        sorted.map((team,index) => {

            let rankClass = "rank-normal";

            if(index === 0){
                rankClass = "rank-first";
            }
            else if(index === 1){
                rankClass = "rank-second";
            }
            else if(index === 2){
                rankClass = "rank-third";
            }
            else if(index === sorted.length - 1){
                rankClass = "rank-last";
            }

            const points =
                Number(team.points || 0);

            const rd =
                Number(team.rd || 0);

            const rdText =
                rd >= 0
                ? `+${rd}`
                : `${rd}`;

            return `

            <div class="ranking-card ${rankClass}">

                <div class="ranking-position">
                    ${index + 1}.
                </div>

                <img
                    src="${team.logo}"
                    class="ranking-logo"
                    alt="${team.name}"
                >

                <div class="ranking-team">

                    <strong>${team.name}</strong>

                </div>

                <div class="ranking-stats">

                    <strong>${points} pts</strong>

                    <span>RD ${rdText}</span>

                </div>

            </div>

            `;

        }).join("");

}

/* =========================
        COUNTS
========================= */

function updateCounts(){

    const teamCount =
        document.getElementById("homeTeamCount");

    const playerCount =
        document.getElementById("homePlayerCount");

    const teamPageCount =
        document.getElementById("teamPageCount");

    const playerPageCount =
        document.getElementById("playerPageCount");

    if(teamCount){
        teamCount.textContent = teams.length;
    }

    if(playerCount){
        playerCount.textContent = players.length;
    }

    if(teamPageCount){
        teamPageCount.textContent = teams.length;
    }

    if(playerPageCount){
        playerPageCount.textContent = players.length;
    }

}

/* =========================
        NAVIGATION
========================= */

function showPage(pageId,button){

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
        top: 0,
        behavior: "smooth"
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

    showPage(pageId,button);

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
        LATEST VIDEO
========================= */

function renderLatestVideo(){

    const container =
        document.getElementById("latestVideo");

    if(!container) return;

    const videos =
        matches.filter(match =>
            match.status === "played" &&
            match.video &&
            match.publication
        );

    if(videos.length === 0){

        container.innerHTML = "";

        return;

    }

    const latest =
        [...videos].sort((a,b) =>
            Number(b.publication) -
            Number(a.publication)
        )[0];

    let videoId = "";

    const videoURL = latest.video;

    const shortMatch =
        videoURL.match(/youtu\.be\/([^?&]+)/);

    const longMatch =
        videoURL.match(/[?&]v=([^?&]+)/);

    const embedMatch =
        videoURL.match(/youtube\.com\/embed\/([^?&]+)/);

    videoId =
        shortMatch?.[1] ||
        longMatch?.[1] ||
        embedMatch?.[1] ||
        "";

    if(!videoId){

        container.innerHTML = "";

        return;

    }

    container.innerHTML = `

        <div class="latest-video-card">

            <div class="latest-video-title">

                <span></span>

                <strong>LATEST VIDEO</strong>

                <span></span>

            </div>

            <div class="latest-video-player">

                <iframe
                    src="https://www.youtube.com/embed/${videoId}"
                    title="Latest video"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowfullscreen>
                </iframe>

            </div>

        </div>

    `;

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

            /* CALCUL CHAMPIONNAT */

            calculateChampionshipStats();

            /* RAFRAÎCHISSEMENT AFFICHAGE */

            renderTeams();

            renderRanking();

            renderPlayers();

            renderMatchTeams();

            updateCounts();

            updateMatchCount();

            setupPlayerFilters();

            setupMatchFilters();

            renderLatestVideo();

            renderBoosters();

            console.log(
                teams.length + " équipes chargées"
            );

            console.log(
                players.length + " joueurs chargés"
            );

            console.log(
                matches.length + " matchs chargés"
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

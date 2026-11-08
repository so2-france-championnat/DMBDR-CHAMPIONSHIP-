
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
   OUTILS
========================= */

function getKD(player) {
    const kills = Number(player.kills || 0);
    const deaths = Number(player.deaths || 0);

    return deaths === 0 ? kills : kills / deaths;
}

function getKDClass(kd) {
    if (kd >= 2) return "kd-good";
    if (kd >= 1) return "kd-mid";
    return "kd-bad";
}

function getTeam(name) {
    return teams.find(team => team.name === name);
}

function getVideoId(url) {
    if (!url || typeof url !== "string") return "";

    return (
        url.match(/youtu\.be\/([^?&#/]+)/)?.[1] ||
        url.match(/[?&]v=([^?&#/]+)/)?.[1] ||
        url.match(/youtube\.com\/embed\/([^?&#/]+)/)?.[1] ||
        url.match(/youtube\.com\/shorts\/([^?&#/]+)/)?.[1] ||
        ""
    );
}

/* =========================
   BOOSTERS
========================= */

function renderBoosters() {
    const container = document.getElementById("boostersList");

    if (!container) return;

    container.innerHTML = boosters.map(player => `
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
   CHARGEMENT DES ÉQUIPES
========================= */

async function loadTeams() {
    const response = await fetch("./data/teams.json");

    if (!response.ok) {
        throw new Error("Impossible de charger data/teams.json");
    }

    const data = await response.json();

    teams = Array.isArray(data)
        ? data
        : Array.isArray(data.teams)
            ? data.teams
            : [];

    teams.forEach(team => {
        team.points = 0;
        team.roundsWon = 0;
        team.roundsLost = 0;
        team.rd = 0;
        team.wins = 0;
        team.losses = 0;
        team.draws = 0;
        team.played = 0;
    });

    console.log("ÉQUIPES CHARGÉES :", teams.length);
}

/* =========================
   GÉNÉRATION AUTOMATIQUE
   DES JOUEURS
========================= */

function buildPlayers() {
    players = [];

    teams.forEach(team => {
        const starters = Array.isArray(team.players)
            ? team.players
            : [];

        const substitutes = Array.isArray(team.substitutes)
            ? team.substitutes
            : [];

        starters.forEach(item => {
            const name = typeof item === "string"
                ? item
                : item?.name;

            if (!name) return;

            players.push({
                name,
                team: team.name,
                role: "starter",
                logo: team.logo,
                kills: 0,
                assists: 0,
                deaths: 0,
                mvp: 0
            });
        });

        substitutes.forEach(item => {
            const name = typeof item === "string"
                ? item
                : item?.name;

            if (!name) return;

            const existing = players.find(player =>
                player.name === name &&
                player.team === team.name
            );

            if (existing) {
                existing.role = "substitute";
                return;
            }

            players.push({
                name,
                team: team.name,
                role: "substitute",
                logo: team.logo,
                kills: 0,
                assists: 0,
                deaths: 0,
                mvp: 0
            });
        });
    });

    console.log("JOUEURS GÉNÉRÉS :", players.length);
}

/* =========================
   CHARGEMENT DES MATCHS
========================= */

async function loadMatches() {
    try {
        const response = await fetch("./data/matches.json");

        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }

        const data = await response.json();

        matches = Array.isArray(data)
            ? data
            : Array.isArray(data.matches)
                ? data.matches
                : [];

        console.log("MATCHS CHARGÉS :", matches.length);

    } catch (error) {
        console.error("Erreur matches.json :", error);
        matches = [];
    }
}

/* =========================
   AUTOMATISATION COMPLÈTE
   DU CHAMPIONNAT
========================= */

function calculateChampionshipStats() {

    /* RESET ÉQUIPES */

    teams.forEach(team => {
        team.points = 0;
        team.roundsWon = 0;
        team.roundsLost = 0;
        team.rd = 0;
        team.wins = 0;
        team.losses = 0;
        team.draws = 0;
        team.played = 0;
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

        if (match.status !== "played") return;

        const team1 = getTeam(match.team1);
        const team2 = getTeam(match.team2);

        if (!team1 || !team2) {
            console.warn(
                "Équipe introuvable pour le match :",
                match.id
            );
            return;
        }

        const score1 = Number(match.score1);
        const score2 = Number(match.score2);

        if (
            !Number.isFinite(score1) ||
            !Number.isFinite(score2) ||
            score1 < 0 ||
            score2 < 0
        ) {
            console.warn("Score invalide :", match.id);
            return;
        }

        /* MATCHS JOUÉS */

        team1.played += 1;
        team2.played += 1;

        /* ROUNDS */

        team1.roundsWon += score1;
        team1.roundsLost += score2;

        team2.roundsWon += score2;
        team2.roundsLost += score1;

        /* DIFFÉRENCE DE ROUNDS */

        team1.rd += score1 - score2;
        team2.rd += score2 - score1;

        /* POINTS */

        if (score1 > score2) {
            team1.points += 3;
            team1.wins += 1;
            team2.losses += 1;

        } else if (score2 > score1) {
            team2.points += 3;
            team2.wins += 1;
            team1.losses += 1;

        } else {
            team1.points += 1;
            team2.points += 1;

            team1.draws += 1;
            team2.draws += 1;
        }

        /* STATISTIQUES DES JOUEURS */

        if (Array.isArray(match.stats)) {
            match.stats.forEach(stat => {
                const playerName = stat.player || stat.name;

                const player = players.find(p =>
                    p.name === playerName &&
                    p.team === stat.team
                );

                if (!player) {
                    console.warn(
                        "Joueur introuvable :",
                        playerName,
                        stat.team
                    );
                    return;
                }

                player.kills += Number(stat.kills || 0);
                player.assists += Number(stat.assists || 0);
                player.deaths += Number(stat.deaths || 0);
            });
        }

        /* MVP */

        if (match.mvp) {
            const mvpName = typeof match.mvp === "string"
                ? match.mvp
                : match.mvp.name;

            const mvpTeam = typeof match.mvp === "object"
                ? match.mvp.team
                : null;

            const mvpPlayer = players.find(player =>
                player.name === mvpName &&
                (!mvpTeam || player.team === mvpTeam)
            );

            if (mvpPlayer) {
                mvpPlayer.mvp += 1;
            }
        }
    });

    console.log("STATISTIQUES CHAMPIONNAT RECALCULÉES");
}

/* =========================
   AFFICHAGE DES ÉQUIPES
========================= */

function renderTeams() {
    const container = document.getElementById("teamList");

    if (!container) return;

    container.innerHTML = teams.map(team => {
        const playerCount = players.filter(player =>
            player.team === team.name &&
            player.role !== "substitute"
        ).length;

        return `
            <div
                class="team-card clickable"
                onclick="openTeam('${team.id}')"
            >
                <img
                    class="team-card-banner"
                    src="${team.banner || ""}"
                    alt="${team.name}"
                >

                <div class="team-card-overlay"></div>

                <div class="team-card-content">
                    <div class="team-card-logo">
                        <img
                            src="${team.logo || ""}"
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
   PROFIL D'UNE ÉQUIPE
========================= */

function openTeam(teamId) {
    const team = teams.find(t =>
        String(t.id) === String(teamId)
    );

    if (!team) return;

    const list = document.getElementById("teamList");
    const details = document.getElementById("teamDetails");

    if (!list || !details) return;

    const roster = players.filter(player =>
        player.team === team.name
    );

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
                <img src="${team.logo || ""}" alt="${team.name}">
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
                ? roster.map((player, index) => {
                    const kd = getKD(player);

                    return `
                        <div class="simple-roster-player">
                            <div class="simple-roster-number">
                                ${String(index + 1).padStart(2, "0")}
                            </div>

                            <div class="simple-roster-info">
                                <div class="simple-roster-photo">
                                    <img
                                        src="${team.logo || ""}"
                                        alt="${team.name}"
                                    >
                                </div>

                                <div>
                                    <strong>${player.name}</strong>

                                    <span>
                                        ${player.kills} K
                                        • ${player.assists} A
                                        • ${player.deaths} D
                                    </span>

                                    ${
                                        player.role === "substitute"
                                        ? "<small>SUBSTITUTE</small>"
                                        : ""
                                    }
                                </div>
                            </div>

                            <div class="simple-roster-kd ${getKDClass(kd)}">
                                ${kd.toFixed(2)}
                                <small>KD</small>
                            </div>
                        </div>
                    `;
                }).join("")
                : `
                    <div class="empty-card">
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

function closeTeam() {
    const list = document.getElementById("teamList");
    const details = document.getElementById("teamDetails");

    if (details) {
        details.classList.remove("active");
        details.innerHTML = "";
    }

    if (list) {
        list.style.display = "";
    }
}

/* =========================
   MATCHS PAR ÉQUIPE
========================= */

function renderMatchTeams() {
    const container = document.getElementById("matchTeamList");

    if (!container) return;

    selectedMatchTeam = null;

    const visibleTeams = teams.filter(team => {
        const teamMatches = matches.filter(match =>
            match.team1 === team.name ||
            match.team2 === team.name
        );

        if (currentMatchFilter === "played") {
            return teamMatches.some(match =>
                match.status === "played"
            );
        }

        if (currentMatchFilter === "upcoming") {
            return teamMatches.some(match =>
                match.status !== "played"
            );
        }

        return teamMatches.length > 0;
    });

    if (!visibleTeams.length) {
        container.innerHTML = `
            <div class="empty-card">
                <div class="empty-icon">⚔</div>
                <strong>NO MATCHES</strong>
                <p>No matches found for this filter.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = visibleTeams.map(team => {
        const teamMatches = matches.filter(match =>
            match.team1 === team.name ||
            match.team2 === team.name
        );

        const playedCount = teamMatches.filter(match =>
            match.status === "played"
        ).length;

        const upcomingCount = teamMatches.length - playedCount;

        return `
            <div
                class="match-team-card"
                onclick="openMatchTeam('${team.name}')"
            >
                <div class="match-team-logo">
                    <img src="${team.logo || ""}" alt="${team.name}">
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
                        ? `<span class="match-team-played">${playedCount} PLAYED</span>`
                        : ""
                    }

                    ${
                        upcomingCount > 0
                        ? `<span class="match-team-upcoming">${upcomingCount} UPCOMING</span>`
                        : ""
                    }
                </div>
            </div>
        `;
    }).join("");
}

function openMatchTeam(teamName) {
    const team = getTeam(teamName);

    if (!team) return;

    selectedMatchTeam = team.name;

    const list = document.getElementById("matchTeamList");
    const details = document.getElementById("matchTeamDetails");

    if (!list || !details) return;

    list.style.display = "none";

    renderTeamMatchHistory(team);

    details.classList.add("active");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

/* =========================
   HISTORIQUE DES MATCHS
========================= */

function renderTeamMatchHistory(team) {
    const details = document.getElementById("matchTeamDetails");

    if (!details) return;

    let teamMatches = matches.filter(match =>
        match.team1 === team.name ||
        match.team2 === team.name
    );

    if (currentMatchFilter === "played") {
        teamMatches = teamMatches.filter(match =>
            match.status === "played"
        );
    }

    if (currentMatchFilter === "upcoming") {
        teamMatches = teamMatches.filter(match =>
            match.status !== "played"
        );
    }

    teamMatches.sort((a, b) =>
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
                <img src="${team.logo || ""}" alt="${team.name}">
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
                ? teamMatches.map(match => {
                    const team1 = getTeam(match.team1);
                    const team2 = getTeam(match.team2);

                    const played = match.status === "played";

                    const score1 = Number(match.score1 || 0);
                    const score2 = Number(match.score2 || 0);

                    const isTeam1 = match.team1 === team.name;

                    let resultClass = "match-card-upcoming";

                    if (played) {
                        const won = isTeam1
                            ? score1 > score2
                            : score2 > score1;

                        resultClass = won
                            ? "match-card-win"
                            : score1 === score2
                                ? "match-card-upcoming"
                                : "match-card-loss";
                    }

                    const scoreHTML = played
                        ? `
                            <span class="${
                                score1 > score2
                                ? "score-win"
                                : score1 < score2
                                    ? "score-loss"
                                    : ""
                            }">${score1}</span>

                            <b>-</b>

                            <span class="${
                                score2 > score1
                                ? "score-win"
                                : score2 < score1
                                    ? "score-loss"
                                    : ""
                            }">${score2}</span>
                        `
                        : `<span class="score-upcoming">VS</span>`;

                    const mvpName = match.mvp
                        ? typeof match.mvp === "string"
                            ? match.mvp
                            : match.mvp.name
                        : "";

                    return `
                        <div
                            class="match-v2-card ${resultClass}"
                            onclick="openMatch('${match.id}')"
                        >
                            <div class="match-v2-top">
                                <span>MATCH ${match.id}</span>

                                <strong>
                                    ${
                                        !played
                                        ? "UPCOMING"
                                        : score1 === score2
                                            ? "DRAW"
                                            : score1 > score2
                                                ? `${match.team1} WIN`
                                                : `${match.team2} WIN`
                                    }
                                </strong>
                            </div>

                            <div class="match-v2-versus">
                                <div class="match-v2-team">
                                    ${
                                        team1
                                        ? `<img src="${team1.logo}" alt="${match.team1}">`
                                        : ""
                                    }

                                    <span>${match.team1}</span>
                                </div>

                                <div class="match-v2-score">
                                    <strong>${scoreHTML}</strong>
                                </div>

                                <div class="match-v2-team">
                                    ${
                                        team2
                                        ? `<img src="${team2.logo}" alt="${match.team2}">`
                                        : ""
                                    }

                                    <span>${match.team2}</span>
                                </div>
                            </div>

                            ${
                                played && mvpName
                                ? `
                                    <div class="match-v2-mvp">
                                        👑 MVP
                                        <strong>${mvpName}</strong>
                                    </div>
                                `
                                : ""
                            }

                            ${
                                !played
                                ? `
                                    <div class="match-v2-status">
                                        UPCOMING MATCH
                                    </div>
                                `
                                : ""
                            }
                        </div>
                    `;
                }).join("")
                : `
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
   FILTRES DES MATCHS
========================= */

function setupMatchFilters() {
    document.querySelectorAll("[data-match-filter]").forEach(button => {
        button.addEventListener("click", () => {
            currentMatchFilter = button.dataset.matchFilter;

            document.querySelectorAll("[data-match-filter]").forEach(btn => {
                btn.classList.remove("active");
            });

            button.classList.add("active");

            if (selectedMatchTeam) {
                const team = getTeam(selectedMatchTeam);

                if (team) {
                    renderTeamMatchHistory(team);
                }
            } else {
                renderMatchTeams();
            }
        });
    });
}

function updateMatchCount() {
    const count = document.getElementById("matchPageCount");

    if (count) {
        count.textContent = matches.length;
    }
}

/* =========================
   DÉTAIL D'UN MATCH
========================= */

function openMatch(matchId) {
    const match = matches.find(m =>
        String(m.id) === String(matchId)
    );

    if (!match) return;

    const teamsPage = document.getElementById("teams");

    const openedFromTeams = teamsPage &&
        teamsPage.classList.contains("active");

    const details = openedFromTeams
        ? document.getElementById("teamMatchDetails")
        : document.getElementById("matchDetails");

    if (!details) return;

    const team1 = getTeam(match.team1);
    const team2 = getTeam(match.team2);

    const score1 = Number(match.score1 || 0);
    const score2 = Number(match.score2 || 0);

    const played = match.status === "played";

    const team1Won = played && score1 > score2;
    const team2Won = played && score2 > score1;

    if (openedFromTeams) {
        const teamDetails = document.getElementById("teamDetails");
        const teamList = document.getElementById("teamList");

        if (teamDetails) {
            teamDetails.classList.remove("active");
        }

        if (teamList) {
            teamList.style.display = "none";
        }
    } else {
        const teamList = document.getElementById("matchTeamList");
        const matchTeamDetails = document.getElementById("matchTeamDetails");

        if (teamList) {
            teamList.style.display = "none";
        }

        if (matchTeamDetails) {
            matchTeamDetails.classList.remove("active");
        }
    }

    const stats = Array.isArray(match.stats)
        ? match.stats
        : [];

    const videoId = getVideoId(match.video);

    const mvpName = match.mvp
        ? typeof match.mvp === "string"
            ? match.mvp
            : match.mvp.name
        : "";

    details.innerHTML = `
        <button
            class="back-button"
            onclick="closeMatch()"
        >
            ← BACK
        </button>

        <div class="match-detail-header">
            <span>MATCH ${match.id}</span>
            <strong>${played ? "PLAYED" : "UPCOMING"}</strong>
        </div>

        <div class="match-detail-scoreboard">
            <div class="match-detail-team ${team1Won ? "match-winner" : ""}">
                ${
                    team1
                    ? `<img src="${team1.logo}" alt="${match.team1}">`
                    : ""
                }

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
                    ${played ? score1 : "—"}
                </span>

                <b>-</b>

                <span class="${
                    team2Won
                    ? "history-score-win"
                    : team1Won
                        ? "history-score-loss"
                        : ""
                }">
                    ${played ? score2 : "—"}
                </span>
            </div>

            <div class="match-detail-team ${team2Won ? "match-winner" : ""}">
                ${
                    team2
                    ? `<img src="${team2.logo}" alt="${match.team2}">`
                    : ""
                }

                <strong>${match.team2}</strong>
            </div>
        </div>

        <div class="match-result">
            ${
                !played
                ? "UPCOMING MATCH"
                : team1Won
                    ? `${match.team1} WIN`
                    : team2Won
                        ? `${match.team2} WIN`
                        : "DRAW"
            }
        </div>

        ${
            played && mvpName
            ? `
                <div class="match-mvp-card">
                    <div class="match-mvp-title">
                        👑 MATCH MVP
                    </div>

                    <strong>${mvpName}</strong>

                    ${
                        typeof match.mvp === "object"
                        ? `
                            <div>
                                ${match.mvp.kills || 0} K
                                • ${match.mvp.assists || 0} A
                                • ${match.mvp.deaths || 0} D

                                <span>
                                    KD ${Number(
                                        match.mvp.kd ??
                                        getKD(match.mvp)
                                    ).toFixed(2)}
                                </span>
                            </div>
                        `
                        : ""
                    }
                </div>
            `
            : ""
        }

        <div class="section-title">
            <span></span>
            PLAYER STATS
            <span></span>
        </div>

        <div class="match-player-columns">
            ${renderMatchPlayerColumn(match.team1, stats, team1Won, team2Won)}
            ${renderMatchPlayerColumn(match.team2, stats, team2Won, team1Won)}
        </div>

        ${
            played && videoId
            ? `
                <div class="match-video-section">
                    ${
                        match.publication
                        ? `
                            <div class="match-publication-number">
                                PUBLICATION #${match.publication}
                            </div>
                        `
                        : ""
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
            : ""
        }
    `;

    details.classList.add("active");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

/* =========================
   STATS DES JOUEURS
   DANS UN MATCH
========================= */

function renderMatchPlayerColumn(teamName, stats, won, lost) {
    const teamStats = stats.filter(player =>
        player.team === teamName
    );

    return `
        <div class="match-player-team ${
            won
            ? "match-player-team-win"
            : lost
                ? "match-player-team-loss"
                : ""
        }">
            <div class="match-player-team-title">
                ${teamName}
            </div>

            ${
                teamStats.map(player => {
                    const kills = Number(player.kills || 0);
                    const assists = Number(player.assists || 0);
                    const deaths = Number(player.deaths || 0);

                    const kd = deaths === 0
                        ? kills
                        : kills / deaths;

                    return `
                        <div class="match-player-card">
                            <div>
                                <strong>
                                    ${player.player || player.name}
                                </strong>

                                <span>
                                    ${kills} K
                                    • ${assists} A
                                    • ${deaths} D
                                </span>
                            </div>

                            <strong class="${getKDClass(kd)}">
                                ${kd.toFixed(2)}
                                <small>KD</small>
                            </strong>
                        </div>
                    `;
                }).join("")
            }
        </div>
    `;
}

/* =========================
   FERMER UN MATCH
========================= */

function closeMatch() {
    const matchDetails = document.getElementById("matchDetails");
    const teamMatchDetails = document.getElementById("teamMatchDetails");
    const matchTeamDetails = document.getElementById("matchTeamDetails");
    const matchTeamList = document.getElementById("matchTeamList");

    if (matchDetails) {
        matchDetails.classList.remove("active");
        matchDetails.innerHTML = "";
    }

    if (teamMatchDetails) {
        teamMatchDetails.classList.remove("active");
        teamMatchDetails.innerHTML = "";
    }

    if (matchTeamDetails) {
        matchTeamDetails.classList.remove("active");
        matchTeamDetails.innerHTML = "";
    }

    if (matchTeamList) {
        matchTeamList.style.display = "";
    }

    const teamList = document.getElementById("teamList");
    const teamDetails = document.getElementById("teamDetails");

    if (teamDetails) {
        teamDetails.classList.remove("active");
        teamDetails.innerHTML = "";
    }

    if (teamList) {
        teamList.style.display = "";
    }

    selectedMatchTeam = null;
}

/* =========================
   CLASSEMENT DES JOUEURS
========================= */

function renderPlayers(sortMode = "leaderboard") {
    const container = document.getElementById("playerList");

    if (!container) return;

    const sortedPlayers = [...players].sort((a, b) => {
        if (sortMode === "kills") {
            return b.kills - a.kills;
        }

        if (sortMode === "mvp") {
            return b.mvp - a.mvp;
        }

        if (sortMode === "kd") {
            return getKD(b) - getKD(a);
        }

        const kdDifference = getKD(b) - getKD(a);

        if (kdDifference !== 0) {
            return kdDifference;
        }

        if (b.kills !== a.kills) {
            return b.kills - a.kills;
        }

        return b.assists - a.assists;
    });

    container.innerHTML = sortedPlayers.map((player, index) => {
        const kd = getKD(player);

        let rankClass = "player-rank-normal";

        if (index === 0) {
            rankClass = "player-rank-first";
        } else if (index === 1) {
            rankClass = "player-rank-second";
        } else if (index === 2) {
            rankClass = "player-rank-third";
        } else if (index >= sortedPlayers.length - 3) {
            rankClass = "player-rank-last";
        }

        const team = getTeam(player.team);
        const logo = team ? team.logo : "";

        return `
            <div class="player-card">
                <div class="player-rank ${rankClass}">
                    ${index + 1}
                </div>

                <div class="player-team-logo">
                    ${
                        logo
                        ? `
                            <img
                                src="${logo}"
                                alt="${player.team}"
                            >
                        `
                        : `
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

                    <strong class="${getKDClass(kd)}">
                        ${kd.toFixed(2)} KD
                    </strong>

                    <span>
                        👑 ${player.mvp} MVP
                    </span>
                </div>
            </div>
        `;
    }).join("");
}

/* =========================
   FILTRES DES JOUEURS
========================= */

function setupPlayerFilters() {
    const filters = document.querySelectorAll(".filter");

    filters.forEach(filter => {
        filter.addEventListener("click", () => {
            filters.forEach(button => {
                button.classList.remove("active");
            });

            filter.classList.add("active");

            renderPlayers(filter.dataset.sort);
        });
    });
}

/* =========================
   CLASSEMENT DES ÉQUIPES
========================= */

function renderRanking() {
    const container = document.getElementById("rankingList");

    if (!container) return;

    const sorted = [...teams].sort((a, b) => {
        if (b.points !== a.points) {
            return b.points - a.points;
        }

        if (b.rd !== a.rd) {
            return b.rd - a.rd;
        }

        return b.roundsWon - a.roundsWon;
    });

    container.innerHTML = sorted.map((team, index) => {
        let rankClass = "rank-normal";

        if (index === 0) {
            rankClass = "rank-first";
        } else if (index === 1) {
            rankClass = "rank-second";
        } else if (index === 2) {
            rankClass = "rank-third";
        } else if (index === sorted.length - 1) {
            rankClass = "rank-last";
        }

        const rdText = team.rd >= 0
            ? `+${team.rd}`
            : `${team.rd}`;

        return `
            <div class="ranking-card ${rankClass}">
                <div class="ranking-position">
                    ${index + 1}.
                </div>

                <img
                    src="${team.logo || ""}"
                    class="ranking-logo"
                    alt="${team.name}"
                >

                <div class="ranking-team">
                    <strong>${team.name}</strong>
                </div>

                <div class="ranking-stats">
                    <strong>${team.points} pts</strong>
                    <span>RD ${rdText}</span>
                </div>
            </div>
        `;
    }).join("");
}

/* =========================
   STATISTIQUES GÉNÉRALES
========================= */

function renderDashboardStats() {
    const boxes = document.querySelectorAll(
        ".stats-dashboard .big-stat"
    );

    if (boxes.length < 4) return;

    const topKD = [...players]
        .filter(player => player.kills > 0 || player.deaths > 0)
        .sort((a, b) => getKD(b) - getKD(a))[0];

    const topKills = [...players]
        .filter(player => player.kills > 0)
        .sort((a, b) => b.kills - a.kills)[0];

    const topAssists = [...players]
        .filter(player => player.assists > 0)
        .sort((a, b) => b.assists - a.assists)[0];

    const topMVP = [...players]
        .filter(player => player.mvp > 0)
        .sort((a, b) => b.mvp - a.mvp)[0];

    boxes[0].querySelector("strong").textContent =
        topKD
        ? `${topKD.name} (${getKD(topKD).toFixed(2)})`
        : "—";

    boxes[1].querySelector("strong").textContent =
        topKills
        ? `${topKills.name} (${topKills.kills})`
        : "—";

    boxes[2].querySelector("strong").textContent =
        topAssists
        ? `${topAssists.name} (${topAssists.assists})`
        : "—";

    boxes[3].querySelector("strong").textContent =
        topMVP
        ? `${topMVP.name} (${topMVP.mvp})`
        : "—";
}

/* =========================
   COMPTEURS
========================= */

function updateCounts() {
    const elements = {
        homeTeamCount: teams.length,
        homePlayerCount: players.length,
        teamPageCount: teams.length,
        playerPageCount: players.length
    };

    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = value;
        }
    });
}

/* =========================
   NAVIGATION
========================= */

function showPage(pageId, button) {
    const page = document.getElementById(pageId);

    if (!page) return;

    document.querySelectorAll(".page").forEach(item => {
        item.classList.remove("active");
    });

    page.classList.add("active");

    document.querySelectorAll(".nav-button").forEach(btn => {
        btn.classList.remove("active");
    });

    if (button) {
        button.classList.add("active");
    }

    if (pageId !== "teams") {
        closeTeam();
    }

    if (pageId !== "matches") {
        closeMatch();
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function showPageById(pageId) {
    const button = [...document.querySelectorAll(".nav-button")]
        .find(btn =>
            btn.getAttribute("onclick")
                ?.includes(`'${pageId}'`)
        );

    showPage(pageId, button);
}

/* =========================
   LIENS EXTERNES
========================= */

function openLink(url) {
    window.open(
        url,
        "_blank",
        "noopener,noreferrer"
    );
}

/* =========================
   DERNIÈRE VIDÉO
========================= */

function renderLatestVideo() {
    const container = document.getElementById("latestVideo");

    if (!container) return;

    const videos = matches.filter(match =>
        match.status === "played" &&
        match.video &&
        match.publication
    );

    if (!videos.length) {
        container.innerHTML = "";
        return;
    }

    const latest = [...videos].sort((a, b) =>
        Number(b.publication) - Number(a.publication)
    )[0];

    const videoId = getVideoId(latest.video);

    if (!videoId) {
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
   ACTUALISATION DU SITE
========================= */

function refreshChampionship() {
    calculateChampionshipStats();

    renderTeams();
    renderPlayers();
    renderRanking();
    renderMatchTeams();
    renderDashboardStats();

    updateCounts();
    updateMatchCount();

    renderLatestVideo();
    renderBoosters();
}

/* =========================
   INITIALISATION
========================= */

document.addEventListener("DOMContentLoaded", async () => {
    console.log("DMBDR CHAMPIONSHIP SEASON 2 — ONLINE");

    try {
        /* 1. CHARGEMENT DES ÉQUIPES */
        await loadTeams();

        /* 2. GÉNÉRATION DES JOUEURS */
        buildPlayers();

        /* 3. CHARGEMENT DES MATCHS */
        await loadMatches();

        /* 4. CALCUL ET AFFICHAGE */
        refreshChampionship();

        /* 5. ACTIVATION DES FILTRES */
        setupPlayerFilters();
        setupMatchFilters();

        console.log("ÉQUIPES :", teams.length);
        console.log("JOUEURS :", players.length);
        console.log("MATCHS :", matches.length);

        console.log("CHAMPIONNAT INITIALISÉ");

    } catch (error) {
        console.error(
            "ERREUR INITIALISATION :",
            error
        );
    }
});

let teams = [];
let players = [];


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

                    ${team.players.length}
                    PLAYER${team.players.length > 1 ? "S" : ""}

                </div>

            </div>

        </div>

    `).join("");

}


/* =========================
        TEAM DETAILS
========================= */

function openTeam(teamId){

    const team =
        teams.find(
            t => String(t.id) === String(teamId)
        );

    if(!team) return;


    const list =
        document.getElementById("teamList");

    const details =
        document.getElementById("teamDetails");

    if(!list || !details) return;


    /* =========================
            POSITION
    ========================= */

    const sortedTeams =
        [...teams].sort((a,b) => {

            const pointsA =
                Number(a.points ?? a.pts ?? 0);

            const pointsB =
                Number(b.points ?? b.pts ?? 0);

            const rdA =
                Number(a.rd ?? 0);

            const rdB =
                Number(b.rd ?? 0);


            if(pointsB !== pointsA){
                return pointsB - pointsA;
            }

            return rdB - rdA;

        });


    const position =
        sortedTeams.findIndex(
            t =>
                String(t.id) ===
                String(team.id)
        ) + 1;


    /* =========================
            TEAM DATA
    ========================= */

    const points =
        Number(team.points ?? team.pts ?? 0);

    const rd =
        Number(team.rd ?? 0);

    const roundsWon =
        Number(
            team.roundsWon ??
            team.rounds_won ??
            0
        );

    const roundsLost =
        Number(
            team.roundsLost ??
            team.rounds_lost ??
            0
        );


    /* =========================
            PLAYERS
    ========================= */

    const teamPlayers =
        players.filter(
            player =>
                player.team === team.name
        );


    /* =========================
            HIDE TEAM LIST
    ========================= */

    list.style.display = "none";


    /* =========================
            TEAM PROFILE
    ========================= */

    details.innerHTML = `

        <button
            class="back-button"
            onclick="closeTeam()"
        >
            ← BACK TO TEAMS
        </button>


        <!-- TEAM HEADER -->

        <div class="team-hero-card">

            <div class="team-hero-logo">

                <img
                    src="${team.logo}"
                    alt="${team.name}"
                >

            </div>


            <div class="team-hero-name">

                <span>
                    TEAM PROFILE
                </span>

                <h2>
                    ${team.name}
                </h2>

            </div>

        </div>


        <!-- CHAMPIONSHIP STATS -->

        <div class="team-position">

            <div>

                <span>
                    RANK
                </span>

                <strong>
                    #${position}
                </strong>

            </div>


            <div>

                <span>
                    POINTS
                </span>

                <strong>
                    ${points}
                </strong>

            </div>


            <div>

                <span>
                    RD
                </span>

                <strong class="
                    ${rd > 0
                        ? "rd-positive"
                        : rd < 0
                        ? "rd-negative"
                        : ""
                    }
                ">

                    ${rd >= 0 ? "+" : ""}
                    ${rd}

                </strong>

            </div>

        </div>


        <!-- ROUNDS -->

        <div class="team-record-grid">

            <div class="team-record rounds-win">

                <span>
                    ROUNDS WON
                </span>

                <strong>
                    ${roundsWon}
                </strong>

            </div>


            <div class="team-record rounds-loss">

                <span>
                    ROUNDS LOST
                </span>

                <strong>
                    ${roundsLost}
                </strong>

            </div>

        </div>


        <!-- ROSTER -->

        <div class="section-title">

            <span></span>

            ROSTER

            <span></span>

        </div>


        <div class="roster-list">

            ${
                teamPlayers.length

                ?

                teamPlayers.map(
                    (player,index) => {

                        const kd =
                            getKD(player);

                        const kdClass =
                            kd >= 2
                            ? "kd-good"
                            : kd >= 1
                            ? "kd-mid"
                            : "kd-bad";


                        return `

                        <div
                            class="roster-player"
                        >

                            <div
                                class="roster-number"
                            >

                                ${String(
                                    index + 1
                                ).padStart(2,"0")}

                            </div>


                            <div
                                class="roster-info"
                            >

                                <strong>
                                    ${player.name}
                                </strong>

                                <span>

                                    ${player.kills} K

                                    •

                                    ${player.assists} A

                                    •

                                    ${player.deaths} D

                                </span>

                            </div>


                            <div
                                class="
                                    roster-kd
                                    ${kdClass}
                                "
                            >

                                ${kd.toFixed(2)}

                                <span>
                                    KD
                                </span>

                            </div>

                        </div>

                        `;

                    }
                ).join("")

                :

                `

                <div class="empty-card">

                    NO PLAYERS FOUND

                </div>

                `
            }

        </div>


        <!-- MATCH HISTORY -->

        <div class="section-title">

            <span></span>

            MATCH HISTORY

            <span></span>

        </div>


        <div class="team-match-history">

            <div class="empty-card">

                <div class="empty-icon">
                    ⚔
                </div>

                <strong>
                    MATCH HISTORY
                </strong>

                <p>
                    Match results will appear here.
                </p>

            </div>

        </div>

    `;


    details.classList.add("active");


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
        document.getElementById("teamList");

    const details =
        document.getElementById("teamDetails");

    if(!list || !details) return;


    details.classList.remove("active");

    details.innerHTML = "";

    list.style.display = "";

}


/* =========================
        PLAYERS
========================= */

function renderPlayers(){

    const container =
        document.getElementById("playerList");

    if(!container) return;


    const sortedPlayers =
        [...players].sort(
            (a,b) => {

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
        );


    container.innerHTML =
        sortedPlayers.map(
            (player,index) => {

                const kd =
                    getKD(player);

                let kdClass =
                    "kd-bad";

                if(kd >= 2){
                    kdClass = "kd-good";
                }
                else if(kd >= 1){
                    kdClass = "kd-mid";
                }


                return `

                <div class="player-card">

                    <div class="player-rank">
                        ${index + 1}
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

                    </div>

                </div>

                `;

            }
        ).join("");

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


            console.log(
                teams.length +
                " équipes chargées"
            );


            console.log(
                players.length +
                " joueurs chargés"
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

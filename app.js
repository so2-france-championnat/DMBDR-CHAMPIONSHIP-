let teams = [];
let players = [];


/* =========================
        CHARGEMENT TEAMS
========================= */

async function loadTeams(){

    const response =
        await fetch("data/teams.json");

    if(!response.ok){
        throw new Error("teams.json introuvable");
    }

    const data =
        await response.json();

    teams = data.teams || [];

    renderTeams();
    updateCounts();

}


/* =========================
        CHARGEMENT PLAYERS
========================= */

async function loadPlayers(){

    const response =
        await fetch("data/players.json");

    if(!response.ok){
        throw new Error("players.json introuvable");
    }

    const data =
        await response.json();

    players = data.players || [];

    renderPlayers();
    updateCounts();

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

        <div class="team-card">

            <div class="team-card-logo">

                <img
                    src="${team.logo}"
                    alt="${team.name}"
                    onerror="this.style.display='none'"
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

            <div class="team-card-points">

                ${team.points}

                <span>
                    PTS
                </span>

            </div>

        </div>

    `).join("");

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
        PLAYERS
========================= */

function renderPlayers(){

    const container =
        document.getElementById("playerList");

    if(!container) return;


    const sortedPlayers =
        [...players].sort(
            (a,b) => getKD(b) - getKD(a)
        );


    container.innerHTML =
        sortedPlayers.map((player,index) => {

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

        }).join("");

}


/* =========================
        COMPTEURS
========================= */

function updateCounts(){

    const statCards =
        document.querySelectorAll(
            ".stat-card"
        );


    /* TEAMS */

    if(statCards[0]){

        const value =
            statCards[0]
                .querySelector(".stat-value");

        if(value){
            value.textContent =
                teams.length;
        }

    }


    /* PLAYERS */

    if(statCards[1]){

        const value =
            statCards[1]
                .querySelector(".stat-value");

        if(value){
            value.textContent =
                players.length;
        }

    }


    /* PAGE TEAMS */

    document.querySelectorAll(".page-header")
        .forEach(header => {

            const title =
                header.querySelector("h2");

            const count =
                header.querySelector(".page-count");

            if(!title || !count) return;


            if(
                title.textContent
                    .trim()
                    .toUpperCase()
                === "TEAMS"
            ){

                count.textContent =
                    teams.length;

            }


            if(
                title.textContent
                    .trim()
                    .toUpperCase()
                === "PLAYERS"
            ){

                count.textContent =
                    players.length;

            }

        });

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


    window.scrollTo({
        top:0,
        behavior:"smooth"
    });

}


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
        LIENS
========================= */

function openLink(url){

    window.open(
        url,
        "_blank",
        "noopener,noreferrer"
    );

}


/* =========================
        INITIALISATION
========================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log(
            "DMBDR CHAMPIONSHIP V2"
        );

        try{

            await loadTeams();
            await loadPlayers();

            console.log(
                `${teams.length} équipes chargées`
            );

            console.log(
                `${players.length} joueurs chargés`
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

/* =========================
        DMBDR V2
        APP CORE
========================= */

let teams = [];


/* =========================
        CHARGEMENT DES DONNÉES
========================= */

async function loadTeams(){

    try{

        const response = await fetch("data/teams.json");

        if(!response.ok){
            throw new Error("Impossible de charger teams.json");
        }

        const data = await response.json();

        teams = data.teams || [];

        console.log("Équipes chargées :", teams);

        renderTeams();
        updateTeamCount();

    }catch(error){

        console.error(
            "Erreur lors du chargement des équipes :",
            error
        );

    }

}


/* =========================
        AFFICHER LES ÉQUIPES
========================= */

function renderTeams(){

    const teamList =
        document.getElementById("teamList");

    if(!teamList) return;


    if(teams.length === 0){

        teamList.innerHTML = `
            <div class="empty-card">
                Aucune équipe disponible.
            </div>
        `;

        return;
    }


    teamList.innerHTML = teams.map(team => `

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
        COMPTEUR ÉQUIPES
========================= */

function updateTeamCount(){

    document.querySelectorAll(".page-count")
        .forEach(element => {

            const header =
                element.closest(".page-header");

            if(!header) return;

            const title =
                header.querySelector("h2");

            if(!title) return;


            if(
                title.textContent
                    .trim()
                    .toUpperCase()
                === "TEAMS"
            ){

                element.textContent =
                    teams.length;

            }

        });


    /* Compteur HOME */

    const homeCards =
        document.querySelectorAll(".stat-card");


    if(homeCards.length > 0){

        const teamsCard =
            homeCards[0];

        const value =
            teamsCard.querySelector(".stat-value");

        if(value){
            value.textContent =
                teams.length;
        }

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


    window.scrollTo({
        top:0,
        behavior:"smooth"
    });

}


/* =========================
        OUVRIR UNE PAGE
========================= */

function showPageById(pageId){

    const button =
        [...document.querySelectorAll(".nav-button")]
        .find(btn =>
            btn.getAttribute("onclick")
                ?.includes(`'${pageId}'`)
        );


    showPage(pageId, button);

}


/* =========================
        LIENS EXTERNES
========================= */

function openLink(url){

    window.open(
        url,
        "_blank",
        "noopener,noreferrer"
    );

}


/* =========================
        DÉMARRAGE
========================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "DMBDR CHAMPIONSHIP V2 — ONLINE"
        );

        loadTeams();

    }
);

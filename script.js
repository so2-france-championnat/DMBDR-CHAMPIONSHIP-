/* =========================
        DMBDR V2
        APP CORE
========================= */


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
        OPEN PAGE
========================= */

function showPageById(pageId){

    const button =
        [...document.querySelectorAll(".nav-button")]
        .find(btn =>
            btn.getAttribute("onclick")?.includes(
                `'${pageId}'`
            )
        );


    showPage(pageId, button);
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
        STARTUP
========================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "DMBDR CHAMPIONSHIP V2 — ONLINE"
        );

    }
);

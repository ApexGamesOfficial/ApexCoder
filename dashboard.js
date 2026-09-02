const accountCard =
    document.getElementById(
        "accountCard"
    );

const accountAvatar =
    document.getElementById(
        "accountAvatar"
    );

const accountGamertag =
    document.getElementById(
        "accountGamertag"
    );

const welcomeName =
    document.getElementById(
        "welcomeName"
    );

const gamesProjects =
    document.getElementById(
        "gamesProjects"
    );

const websiteProjects =
    document.getElementById(
        "websiteProjects"
    );

const malwareProjects =
    document.getElementById(
        "malwareProjects"
    );


let currentUser = null;


/* =========================
   SAFE HTML
========================= */

function escapeHTML(text) {

    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================
   PROJECT SYMBOL
========================= */

function getProjectSymbol(type) {

    if (type === "game") {
        return "◇";
    }


    if (type === "website") {
        return "</>";
    }


    if (type === "malware") {
        return "⌁";
    }


    return "•";
}


/* =========================
   PROJECT LABEL
========================= */

function getProjectLabel(type) {

    if (type === "game") {
        return "Game";
    }


    if (type === "website") {
        return "Website";
    }


    if (type === "malware") {
        return "Malware Sandbox";
    }


    return "Project";
}


/* =========================
   LOAD DASHBOARD
========================= */

async function loadDashboard() {

    const {
        data: { session }
    } =
        await supabaseClient
            .auth
            .getSession();


    if (!session?.user) {

        window.location.href =
            "login.html";

        return;
    }


    currentUser =
        session.user;


    await Promise.all([
        loadProfile(),
        loadProjects()
    ]);
}


/* =========================
   LOAD PROFILE
========================= */

async function loadProfile() {

    const {
        data: profile,
        error
    } =
        await supabaseClient
            .from("profiles")
            .select(`
                gamertag,
                display_name,
                avatar_url
            `)
            .eq(
                "id",
                currentUser.id
            )
            .single();


    if (error || !profile) {

        console.error(
            "Unable to load profile:",
            error
        );


        accountGamertag.textContent =
            "Account";


        welcomeName.textContent =
            "Developer";


        return;
    }


    accountAvatar.src =
        profile.avatar_url ||
        "Default Apex Games Profile Picture.png";


    accountGamertag.textContent =
        profile.gamertag;


    welcomeName.textContent =
        profile.display_name ||
        profile.gamertag;
}


/* =========================
   LOAD PROJECTS
========================= */

async function loadProjects() {

    const {
        data: projects,
        error
    } =
        await supabaseClient
            .from("projects")
            .select(`
                id,
                name,
                type,
                updated_at
            `)
            .eq(
                "owner_id",
                currentUser.id
            )
            .order(
                "updated_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Unable to load projects:",
            error
        );


        return;
    }


    const allProjects =
        projects || [];


    const games =
        allProjects
            .filter(
                project =>
                    project.type ===
                    "game"
            )
            .slice(0, 3);


    const websites =
        allProjects
            .filter(
                project =>
                    project.type ===
                    "website"
            )
            .slice(0, 3);


    const malware =
        allProjects
            .filter(
                project =>
                    project.type ===
                    "malware"
            )
            .slice(0, 3);


    renderProjects(
        gamesProjects,
        games
    );


    renderProjects(
        websiteProjects,
        websites
    );


    renderProjects(
        malwareProjects,
        malware
    );
}


/* =========================
   RENDER PROJECTS
========================= */

function renderProjects(
    container,
    projects
) {

    if (!container) {
        return;
    }


    /*
        Keep the New Project card.

        Only remove saved project
        cards from a previous render.
    */

    container
        .querySelectorAll(
            ".saved-project-card"
        )
        .forEach(card => {
            card.remove();
        });


    projects.forEach(project => {

        const card =
            document.createElement(
                "button"
            );


        card.type =
            "button";


        card.className =
            "project-card saved-project-card";


        card.innerHTML = `
            <span class="saved-project-icon">
                ${escapeHTML(
                    getProjectSymbol(
                        project.type
                    )
                )}
            </span>

            <span class="saved-project-type">
                ${escapeHTML(
                    getProjectLabel(
                        project.type
                    )
                )}
            </span>

            <span class="project-name">
                ${escapeHTML(
                    project.name
                )}
            </span>

            <span class="project-description">
                Continue project
            </span>
        `;


        card.addEventListener(
            "click",
            () => {

                openProject(
                    project.id
                );
            }
        );


        container.appendChild(
            card
        );
    });
}


/* =========================
   OPEN PROJECT
========================= */

function openProject(projectId) {

    window.location.href =
        `editor.html?project=${encodeURIComponent(projectId)}`;
}


/* =========================
   NEW PROJECT CARDS
========================= */

document
    .querySelectorAll(
        "[data-project-type]"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const type =
                    button.dataset
                        .projectType;


                window.location.href =
                    `new-project.html?type=${encodeURIComponent(type)}`;
            }
        );
    });


/* =========================
   ACCOUNT CARD
========================= */

if (accountCard) {

    accountCard.addEventListener(
        "click",
        () => {

            window.location.href =
                "settings.html";
        }
    );
}


/* =========================
   START
========================= */

loadDashboard();

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

const newProjectButton =
    document.getElementById(
        "newProjectButton"
    );

const projectSearch =
    document.getElementById(
        "projectSearch"
    );

const projectsGrid =
    document.getElementById(
        "projectsGrid"
    );

const emptyState =
    document.getElementById(
        "emptyState"
    );

const filterTabs =
    document.querySelectorAll(
        ".filter-tab"
    );


let currentUser = null;

let currentFilter =
    "all";

let loadedProjects =
    [];


/* =========================
   ACCOUNT
========================= */

async function loadAccount() {

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


    const {
        data: profile,
        error
    } =
        await supabaseClient
            .from("profiles")
            .select(`
                gamertag,
                avatar_url
            `)
            .eq(
                "id",
                currentUser.id
            )
            .single();


    if (
        error ||
        !profile
    ) {

        console.error(
            "Unable to load account:",
            error
        );


        accountGamertag.textContent =
            "Account";

    } else {

        accountGamertag.textContent =
            profile.gamertag;


        accountAvatar.src =
            profile.avatar_url ||
            "Default Apex Games Profile Picture.png";

    }


    await loadProjects();

}


/* =========================
   LOAD PROJECTS
========================= */

async function loadProjects() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("projects")
            .select(`
                id,
                name,
                type,
                created_at,
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


    loadedProjects =
        data || [];


    renderProjects();

}


/* =========================
   SAFE TEXT
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
   PROJECT LABELS
========================= */

function getProjectLabel(type) {

    if (
        type ===
        "game"
    ) {
        return "Game";
    }


    if (
        type ===
        "website"
    ) {
        return "Website";
    }


    if (
        type ===
        "malware"
    ) {
        return "Malware Sandbox";
    }


    return "Project";
}


function getProjectSymbol(type) {

    if (
        type ===
        "game"
    ) {
        return "◇";
    }


    if (
        type ===
        "website"
    ) {
        return "</>";
    }


    if (
        type ===
        "malware"
    ) {
        return "⌁";
    }


    return "•";
}


/* =========================
   OPEN PROJECT
========================= */

function openProject(project) {

    if (!project?.id) {
        return;
    }


    const projectId =
        encodeURIComponent(
            project.id
        );


    if (
        project.type ===
        "game"
    ) {

        window.location.href =
            `game-editor.html?project=${projectId}`;

        return;
    }


    if (
        project.type ===
        "website"
    ) {

        window.location.href =
            `editor.html?project=${projectId}`;

        return;
    }


    if (
        project.type ===
        "malware"
    ) {

        alert(
            "The ApexCoder Malware Sandbox Editor is coming soon."
        );

        return;
    }


    alert(
        "ApexCoder doesn't recognize this project type."
    );

}


/* =========================
   RENDER
========================= */

function renderProjects() {

    const search =
        projectSearch.value
            .trim()
            .toLowerCase();


    const visibleProjects =
        loadedProjects.filter(
            project => {

                const matchesFilter =
                    currentFilter ===
                        "all" ||
                    project.type ===
                        currentFilter;


                const matchesSearch =
                    project.name
                        .toLowerCase()
                        .includes(
                            search
                        );


                return (
                    matchesFilter &&
                    matchesSearch
                );

            }
        );


    projectsGrid.innerHTML =
        "";


    visibleProjects.forEach(
        project => {

            const card =
                document.createElement(
                    "button"
                );


            card.type =
                "button";


            card.className =
                "project-card saved-project-card";


            card.dataset.projectType =
                project.type;


            card.innerHTML = `
                <span class="project-icon">
                    ${escapeHTML(
                        getProjectSymbol(
                            project.type
                        )
                    )}
                </span>

                <span class="project-type-label">
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

                <span class="project-meta">
                    Open project
                </span>
            `;


            card.addEventListener(
                "click",
                () => {

                    openProject(
                        project
                    );

                }
            );


            projectsGrid.appendChild(
                card
            );

        }
    );


    addCreateCards();


    const hasVisibleContent =
        visibleProjects.length > 0 ||
        currentFilter === "all" ||
        currentFilter === "game" ||
        currentFilter === "website" ||
        currentFilter === "malware";


    emptyState.hidden =
        hasVisibleContent;

}


/* =========================
   CREATE CARDS
========================= */

function addCreateCards() {

    const createTypes = [
        {
            type: "game",
            name: "New Game",
            meta: "Start a game project"
        },

        {
            type: "website",
            name: "New Website",
            meta: "Start a website project"
        },

        {
            type: "malware",
            name: "New Malware",
            meta: "Create in a safe sandbox"
        }
    ];


    createTypes.forEach(
        item => {

            if (
                currentFilter !==
                    "all" &&
                currentFilter !==
                    item.type
            ) {
                return;
            }


            const search =
                projectSearch.value
                    .trim()
                    .toLowerCase();


            const searchText =
                `${item.name} ${item.meta}`
                    .toLowerCase();


            if (
                search &&
                !searchText.includes(
                    search
                )
            ) {
                return;
            }


            const card =
                document.createElement(
                    "button"
                );


            card.type =
                "button";


            card.className =
                item.type ===
                "malware"
                    ? "project-card create-card sandbox"
                    : "project-card create-card";


            card.dataset.createType =
                item.type;


            card.innerHTML = `
                <span class="project-icon">
                    +
                </span>

                <span class="project-name">
                    ${escapeHTML(
                        item.name
                    )}
                </span>

                <span class="project-meta">
                    ${escapeHTML(
                        item.meta
                    )}
                </span>
            `;


            card.addEventListener(
                "click",
                () => {

                    window.location.href =
                        `new-project.html?type=${encodeURIComponent(item.type)}`;

                }
            );


            projectsGrid.appendChild(
                card
            );

        }
    );

}


/* =========================
   FILTERS
========================= */

filterTabs.forEach(
    tab => {

        tab.addEventListener(
            "click",
            () => {

                filterTabs.forEach(
                    button => {

                        button.classList.remove(
                            "active"
                        );

                    }
                );


                tab.classList.add(
                    "active"
                );


                currentFilter =
                    tab.dataset.filter;


                renderProjects();

            }
        );

    }
);


/* =========================
   SEARCH
========================= */

projectSearch.addEventListener(
    "input",
    renderProjects
);


/* =========================
   NEW PROJECT
========================= */

newProjectButton.addEventListener(
    "click",
    () => {

        window.location.href =
            "new-project.html";

    }
);


/* =========================
   ACCOUNT CARD
========================= */

accountCard.addEventListener(
    "click",
    () => {

        window.location.href =
            "settings.html";

    }
);


/* =========================
   START
========================= */

loadAccount();

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

const discoverSearch =
    document.getElementById(
        "discoverSearch"
    );

const projectGrid =
    document.getElementById(
        "projectGrid"
    );

const emptyState =
    document.getElementById(
        "emptyState"
    );

const filterTabs =
    document.querySelectorAll(
        ".filter-tab"
    );


let currentFilter = "all";


/* =========================
   DEMO DISCOVER PROJECTS

   Temporary until publishing
   is connected to Supabase.
========================= */

const discoverProjects = [
    {
        id: "demo-1",
        name: "Neon Runner",
        type: "game",
        creator: "PixelByte",
        description:
            "A fast arcade-style runner built inside ApexCoder."
    },

    {
        id: "demo-2",
        name: "Orbit",
        type: "website",
        creator: "NovaDev",
        description:
            "A minimal space-themed landing page with animated sections."
    },

    {
        id: "demo-3",
        name: "Packet Lab",
        type: "malware",
        creator: "CyberWolf",
        description:
            "A safe simulation project for learning how suspicious network behavior can be identified."
    },

    {
        id: "demo-4",
        name: "Block Quest",
        type: "game",
        creator: "CodeKnight",
        description:
            "A small adventure prototype focused on movement and exploration."
    },

    {
        id: "demo-5",
        name: "Pulse Portfolio",
        type: "website",
        creator: "WebForge",
        description:
            "A clean developer portfolio with responsive project cards."
    },

    {
        id: "demo-6",
        name: "Threat Scanner",
        type: "malware",
        creator: "ByteGuard",
        description:
            "An isolated cybersecurity learning demo for recognizing suspicious files and behavior."
    }
];


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
                session.user.id
            )
            .single();


    if (error || !profile) {

        console.error(
            "Unable to load account:",
            error
        );

        accountGamertag.textContent =
            "Account";

        return;
    }


    accountGamertag.textContent =
        profile.gamertag;


    accountAvatar.src =
        profile.avatar_url ||
        "Default Apex Games Profile Picture.png";
}


/* =========================
   LABELS
========================= */

function getTypeLabel(type) {

    if (type === "game") {
        return "Game";
    }


    if (type === "website") {
        return "Website";
    }


    if (type === "malware") {
        return "Sandbox";
    }


    return "Project";
}


function getTypeSymbol(type) {

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
   RENDER
========================= */

function renderProjects() {

    const search =
        discoverSearch.value
            .trim()
            .toLowerCase();


    const filteredProjects =
        discoverProjects.filter(
            project => {

                const matchesFilter =
                    currentFilter === "all" ||
                    project.type ===
                        currentFilter;


                const searchText =
                    `
                        ${project.name}
                        ${project.creator}
                        ${project.description}
                    `.toLowerCase();


                const matchesSearch =
                    searchText.includes(
                        search
                    );


                return (
                    matchesFilter &&
                    matchesSearch
                );
            }
        );


    projectGrid.innerHTML = "";


    filteredProjects.forEach(
        project => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "community-card";


            card.innerHTML = `
                <div class="card-top">

                    <span class="project-type">
                        ${escapeHTML(
                            getTypeLabel(
                                project.type
                            )
                        )}
                    </span>

                    <span class="project-symbol">
                        ${escapeHTML(
                            getTypeSymbol(
                                project.type
                            )
                        )}
                    </span>

                </div>

                <h3>
                    ${escapeHTML(
                        project.name
                    )}
                </h3>

                <p class="project-description">
                    ${escapeHTML(
                        project.description
                    )}
                </p>

                <div class="card-bottom">

                    <span class="creator">
                        by @${escapeHTML(
                            project.creator
                        )}
                    </span>

                    <button
                        class="open-button"
                        type="button"
                        data-project-id="${escapeHTML(
                            project.id
                        )}"
                    >
                        View Project
                    </button>

                </div>
            `;


            projectGrid.appendChild(
                card
            );
        }
    );


    emptyState.hidden =
        filteredProjects.length !== 0;


    document
        .querySelectorAll(
            ".open-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    /*
                        Public project pages
                        come later.

                        For now, this keeps
                        the button alive
                        without pretending
                        publishing exists.
                    */

                    alert(
                        "Public project viewing is coming soon."
                    );
                }
            );
        });
}


/* =========================
   FILTERS
========================= */

filterTabs.forEach(tab => {

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
});


/* =========================
   SEARCH
========================= */

discoverSearch.addEventListener(
    "input",
    renderProjects
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
renderProjects();

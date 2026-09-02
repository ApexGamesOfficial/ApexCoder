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
let currentFilter = "all";


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
   FILTERING
========================= */

function updateProjectVisibility() {

    const search =
        projectSearch.value
            .trim()
            .toLowerCase();


    const cards =
        projectsGrid.querySelectorAll(
            ".project-card"
        );


    let visibleCount = 0;


    cards.forEach(card => {

        const type =
            card.dataset.createType ||
            card.dataset.projectType ||
            "";


        const name =
            card.textContent
                .toLowerCase();


        const matchesFilter =
            currentFilter === "all" ||
            type === currentFilter;


        const matchesSearch =
            name.includes(search);


        const visible =
            matchesFilter &&
            matchesSearch;


        card.hidden =
            !visible;


        if (visible) {
            visibleCount++;
        }
    });


    emptyState.hidden =
        visibleCount !== 0;
}


/* =========================
   FILTER BUTTONS
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


            updateProjectVisibility();
        }
    );
});


/* =========================
   SEARCH
========================= */

projectSearch.addEventListener(
    "input",
    updateProjectVisibility
);


/* =========================
   CREATE PROJECT
========================= */

function goToCreateProject(type) {

    window.location.href =
        `new-project.html?type=${encodeURIComponent(type)}`;
}


document
    .querySelectorAll(
        "[data-create-type]"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                goToCreateProject(
                    button.dataset.createType
                );
            }
        );
    });


newProjectButton.addEventListener(
    "click",
    () => {

        /*
            No type selected yet.
            The new-project page can
            ask what they're creating.
        */

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

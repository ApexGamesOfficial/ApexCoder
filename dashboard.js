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


let currentUser = null;


/* =========================
   LOAD ACCOUNT
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


    const avatar =
        profile.avatar_url ||
        "Default Apex Games Profile Picture.png";


    const displayName =
        profile.display_name ||
        profile.gamertag;


    accountAvatar.src =
        avatar;


    accountGamertag.textContent =
        profile.gamertag;


    welcomeName.textContent =
        displayName;
}


/* =========================
   ACCOUNT CARD
========================= */

accountCard.addEventListener(
    "click",
    () => {

        /*
            For now this can go
            to Settings.

            Later we can give
            ApexCoder its own
            account/profile popup.
        */

        window.location.href =
            "settings.html";
    }
);


/* =========================
   NEW PROJECT BUTTONS
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
                    button.dataset.projectType;


                /*
                    Temporary route.

                    Later these will open
                    their own project
                    creation screens.
                */

                window.location.href =
                    `new-project.html?type=${encodeURIComponent(type)}`;
            }
        );
    });


/* =========================
   START
========================= */

loadDashboard();

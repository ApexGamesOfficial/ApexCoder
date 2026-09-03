const DEFAULT_AVATAR =
    "Default Apex Games Profile Picture.png";


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


const notifyButton =
    document.getElementById(
        "notifyButton"
    );

const planNotifyButton =
    document.getElementById(
        "planNotifyButton"
    );


const notice =
    document.getElementById(
        "notice"
    );

const noticeText =
    document.getElementById(
        "noticeText"
    );

const closeNotice =
    document.getElementById(
        "closeNotice"
    );


let currentUser = null;


/* =========================
   START
========================= */

async function startPage() {

    const {
        data: {
            session
        }
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


    await loadAccount();
}


/* =========================
   ACCOUNT
========================= */

async function loadAccount() {

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


        setAvatar(
            accountAvatar,
            null
        );


        return;
    }


    accountGamertag.textContent =
        profile.gamertag ||
        "Account";


    setAvatar(
        accountAvatar,
        profile.avatar_url
    );
}


/* =========================
   AVATAR
========================= */

function setAvatar(
    image,
    url
) {

    image.onerror =
        () => {

            image.onerror =
                null;

            image.src =
                DEFAULT_AVATAR;
        };


    image.src =
        url ||
        DEFAULT_AVATAR;
}


/* =========================
   NOTICE
========================= */

function showNotice(
    text
) {

    noticeText.textContent =
        text;

    notice.hidden =
        false;
}


notifyButton.addEventListener(
    "click",
    () => {

        showNotice(
            "Nexus notifications will become available closer to launch."
        );
    }
);


planNotifyButton.addEventListener(
    "click",
    () => {

        showNotice(
            "Nexus is coming soon. Pricing and membership benefits will be announced later."
        );
    }
);


closeNotice.addEventListener(
    "click",
    () => {

        notice.hidden =
            true;
    }
);


/* =========================
   ACCOUNT LINK
========================= */

accountCard.addEventListener(
    "click",
    () => {

        window.location.href =
            "settings.html";
    }
);


/* =========================
   GO
========================= */

startPage();

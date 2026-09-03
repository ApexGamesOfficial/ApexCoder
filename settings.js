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


const profileAvatar =
    document.getElementById(
        "profileAvatar"
    );

const profileGamertag =
    document.getElementById(
        "profileGamertag"
    );

const profileDisplayName =
    document.getElementById(
        "profileDisplayName"
    );


const manageProfileButton =
    document.getElementById(
        "manageProfileButton"
    );

const statusSelect =
    document.getElementById(
        "statusSelect"
    );


const notificationsToggle =
    document.getElementById(
        "notificationsToggle"
    );

const messageSoundsToggle =
    document.getElementById(
        "messageSoundsToggle"
    );

const autosaveToggle =
    document.getElementById(
        "autosaveToggle"
    );

const wordWrapToggle =
    document.getElementById(
        "wordWrapToggle"
    );

const compactToggle =
    document.getElementById(
        "compactToggle"
    );

const fontSizeSelect =
    document.getElementById(
        "fontSizeSelect"
    );

const tabSizeSelect =
    document.getElementById(
        "tabSizeSelect"
    );


const signOutButton =
    document.getElementById(
        "signOutButton"
    );

const saveToast =
    document.getElementById(
        "saveToast"
    );


let currentUser = null;

let toastTimer = null;


/* =========================
   STORAGE KEYS
========================= */

const SETTINGS = {
    notifications:
        "apexcoder_notifications",

    messageSounds:
        "apexcoder_message_sounds",

    autosave:
        "apexcoder_editor_autosave",

    wordWrap:
        "apexcoder_editor_word_wrap",

    fontSize:
        "apexcoder_editor_font_size",

    tabSize:
        "apexcoder_editor_tab_size",

    compact:
        "apexcoder_compact_ui"
};


/* =========================
   START
========================= */

async function startSettings() {

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


    loadLocalSettings();

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
                display_name,
                avatar_url,
                status
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
            "Unable to load profile:",
            error
        );

        return;
    }


    accountGamertag.textContent =
        profile.gamertag ||
        "Account";


    profileGamertag.textContent =
        profile.gamertag ||
        "Account";


    profileDisplayName.textContent =
        profile.display_name ||
        "No display name";


    setAvatar(
        accountAvatar,
        profile.avatar_url
    );


    setAvatar(
        profileAvatar,
        profile.avatar_url
    );


    statusSelect.value =
        normalizeStatus(
            profile.status
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
   STATUS
========================= */

function normalizeStatus(
    status
) {

    if (
        status === "online" ||
        status === "away" ||
        status === "dnd" ||
        status === "offline"
    ) {

        return status;
    }


    return "online";
}


statusSelect.addEventListener(
    "change",
    async () => {

        if (!currentUser) {
            return;
        }


        const status =
            normalizeStatus(
                statusSelect.value
            );


        const {
            error
        } =
            await supabaseClient
                .from("profiles")
                .update({
                    status
                })
                .eq(
                    "id",
                    currentUser.id
                );


        if (error) {

            console.error(
                "Unable to update status:",
                error
            );


            showToast(
                "Status couldn't be saved"
            );

            return;
        }


        showToast(
            "Status saved"
        );
    }
);


/* =========================
   LOCAL SETTINGS
========================= */

function getBoolean(
    key,
    fallback
) {

    const value =
        localStorage.getItem(
            key
        );


    if (value === null) {

        return fallback;
    }


    return value ===
        "true";
}


function loadLocalSettings() {

    notificationsToggle.checked =
        getBoolean(
            SETTINGS.notifications,
            false
        );


    messageSoundsToggle.checked =
        getBoolean(
            SETTINGS.messageSounds,
            true
        );


    autosaveToggle.checked =
        getBoolean(
            SETTINGS.autosave,
            true
        );


    wordWrapToggle.checked =
        getBoolean(
            SETTINGS.wordWrap,
            true
        );


    compactToggle.checked =
        getBoolean(
            SETTINGS.compact,
            false
        );


    fontSizeSelect.value =
        localStorage.getItem(
            SETTINGS.fontSize
        ) ||
        "14";


    tabSizeSelect.value =
        localStorage.getItem(
            SETTINGS.tabSize
        ) ||
        "4";
}


/* =========================
   SAVE LOCAL SETTING
========================= */

function saveBooleanSetting(
    element,
    key
) {

    element.addEventListener(
        "change",
        () => {

            localStorage.setItem(
                key,
                String(
                    element.checked
                )
            );


            showToast(
                "Settings saved"
            );
        }
    );
}


saveBooleanSetting(
    notificationsToggle,
    SETTINGS.notifications
);

saveBooleanSetting(
    messageSoundsToggle,
    SETTINGS.messageSounds
);

saveBooleanSetting(
    autosaveToggle,
    SETTINGS.autosave
);

saveBooleanSetting(
    wordWrapToggle,
    SETTINGS.wordWrap
);

saveBooleanSetting(
    compactToggle,
    SETTINGS.compact
);


/* =========================
   SELECT SETTINGS
========================= */

fontSizeSelect.addEventListener(
    "change",
    () => {

        localStorage.setItem(
            SETTINGS.fontSize,
            fontSizeSelect.value
        );


        showToast(
            "Editor font size saved"
        );
    }
);


tabSizeSelect.addEventListener(
    "change",
    () => {

        localStorage.setItem(
            SETTINGS.tabSize,
            tabSizeSelect.value
        );


        showToast(
            "Editor tab size saved"
        );
    }
);


/* =========================
   PROFILE
========================= */

manageProfileButton.addEventListener(
    "click",
    () => {

        window.location.href =
            "https://apexgamesofficial.github.io/Apex-Games/profile.html";
    }
);


accountCard.addEventListener(
    "click",
    () => {

        window.location.href =
            "https://apexgamesofficial.github.io/Apex-Games/profile.html";
    }
);


/* =========================
   SIGN OUT
========================= */

signOutButton.addEventListener(
    "click",
    async () => {

        signOutButton.disabled =
            true;


        const {
            error
        } =
            await supabaseClient
                .auth
                .signOut();


        if (error) {

            console.error(
                "Unable to sign out:",
                error
            );


            showToast(
                "Sign out failed"
            );


            signOutButton.disabled =
                false;

            return;
        }


        window.location.href =
            "login.html";
    }
);


/* =========================
   TOAST
========================= */

function showToast(
    text
) {

    saveToast.textContent =
        text;


    saveToast.hidden =
        false;


    if (toastTimer) {

        clearTimeout(
            toastTimer
        );
    }


    toastTimer =
        setTimeout(
            () => {

                saveToast.hidden =
                    true;
            },
            1800
        );
}


/* =========================
   GO
========================= */

startSettings();

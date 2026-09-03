const projectForm =
    document.getElementById(
        "projectForm"
    );

const projectName =
    document.getElementById(
        "projectName"
    );

const projectType =
    document.getElementById(
        "projectType"
    );

const createButton =
    document.getElementById(
        "createButton"
    );

const formMessage =
    document.getElementById(
        "formMessage"
    );

const typeCards =
    document.querySelectorAll(
        ".type-card"
    );


let currentUser = null;


/* =========================
   LOGIN CHECK
========================= */

async function loadUser() {

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


    selectTypeFromURL();
}


/* =========================
   TYPE SELECTION
========================= */

function setProjectType(type) {

    const validTypes = [
        "game",
        "website",
        "malware"
    ];


    if (
        !validTypes.includes(type)
    ) {
        return;
    }


    projectType.value =
        type;


    typeCards.forEach(
        card => {

            card.classList.toggle(
                "selected",
                card.dataset.type ===
                type
            );

        }
    );


    updateCreateButton();
}


typeCards.forEach(
    card => {

        card.addEventListener(
            "click",
            () => {

                setProjectType(
                    card.dataset.type
                );

            }
        );

    }
);


function selectTypeFromURL() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const type =
        params.get(
            "type"
        );


    if (type) {

        setProjectType(
            type
        );

    }
}


/* =========================
   BUTTON STATE
========================= */

function updateCreateButton() {

    const hasName =
        projectName.value
            .trim()
            .length > 0;


    const hasType =
        projectType.value !==
        "";


    createButton.disabled =
        !(
            hasName &&
            hasType
        );
}


projectName.addEventListener(
    "input",
    updateCreateButton
);


/* =========================
   PROJECT ROUTING
========================= */

function openCreatedProject(
    project
) {

    if (
        !project ||
        !project.id
    ) {

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

        formMessage.textContent =
            "Malware Sandbox editor is coming soon.";


        formMessage.className =
            "form-message success";


        createButton.disabled =
            false;


        createButton.textContent =
            "Create Project";


        return;
    }


    formMessage.textContent =
        "Unknown project type.";


    formMessage.className =
        "form-message error";


    createButton.disabled =
        false;


    createButton.textContent =
        "Create Project";
}


/* =========================
   CREATE PROJECT
========================= */

projectForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        if (!currentUser) {

            return;
        }


        const name =
            projectName.value
                .trim();


        const type =
            projectType.value;


        if (
            !name ||
            !type
        ) {

            return;
        }


        createButton.disabled =
            true;


        createButton.textContent =
            "Creating...";


        formMessage.textContent =
            "";


        formMessage.className =
            "form-message";


        const {
            data: project,
            error
        } =
            await supabaseClient
                .from(
                    "projects"
                )
                .insert({
                    owner_id:
                        currentUser.id,

                    name:
                        name,

                    type:
                        type
                })
                .select(`
                    id,
                    name,
                    type,
                    owner_id
                `)
                .single();


        if (error) {

            console.error(
                "Unable to create project:",
                error
            );


            formMessage.textContent =
                "Unable to create project: " +
                error.message;


            formMessage.className =
                "form-message error";


            createButton.disabled =
                false;


            createButton.textContent =
                "Create Project";


            return;
        }


        formMessage.textContent =
            "Project created!";


        formMessage.className =
            "form-message success";


        openCreatedProject(
            project
        );
    }
);


/* =========================
   START
========================= */

loadUser();

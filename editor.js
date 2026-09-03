const DEFAULT_FILES = [
    {
        path: "index.html",
        language: "html",
        content:
`<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>My Website</title>

    <link
        rel="stylesheet"
        href="style.css"
    >
</head>

<body>

    <h1>
        Hello from ApexCoder!
    </h1>

    <script src="script.js"><\/script>

</body>

</html>`
    },

    {
        path: "style.css",
        language: "css",
        content:
`body {
    margin: 0;

    padding: 40px;

    background: #101010;
    color: white;

    font-family:
        Arial,
        sans-serif;
}

h1 {
    margin: 0;
}`
    },

    {
        path: "script.js",
        language: "javascript",
        content:
`console.log("Hello from ApexCoder!");`
    }
];


const editorLoading =
    document.getElementById(
        "editorLoading"
    );

const editorApp =
    document.getElementById(
        "editorApp"
    );

const errorScreen =
    document.getElementById(
        "errorScreen"
    );

const errorTitle =
    document.getElementById(
        "errorTitle"
    );

const errorMessage =
    document.getElementById(
        "errorMessage"
    );


const projectName =
    document.getElementById(
        "projectName"
    );

const explorerProjectName =
    document.getElementById(
        "explorerProjectName"
    );


const fileList =
    document.getElementById(
        "fileList"
    );

const editorTabs =
    document.getElementById(
        "editorTabs"
    );

const editorEmpty =
    document.getElementById(
        "editorEmpty"
    );

const monacoEditor =
    document.getElementById(
        "monacoEditor"
    );


const saveButton =
    document.getElementById(
        "saveButton"
    );

const runButton =
    document.getElementById(
        "runButton"
    );

const previewRunButton =
    document.getElementById(
        "previewRunButton"
    );

const newFileButton =
    document.getElementById(
        "newFileButton"
    );


const saveStatus =
    document.getElementById(
        "saveStatus"
    );

const statusFile =
    document.getElementById(
        "statusFile"
    );

const statusLanguage =
    document.getElementById(
        "statusLanguage"
    );

const statusCursor =
    document.getElementById(
        "statusCursor"
    );


let currentUser =
    null;

let currentProject =
    null;

let files =
    [];

let openFiles =
    [];

let activeFile =
    null;

let editor =
    null;

let editorReady =
    false;

let switchingFile =
    false;


/* =========================
   SETTINGS
========================= */

function getEditorSettings() {

    return {
        autosave:
            localStorage.getItem(
                "apexcoder_editor_autosave"
            ) !== "false",

        wordWrap:
            localStorage.getItem(
                "apexcoder_editor_word_wrap"
            ) !== "false",

        fontSize:
            Number(
                localStorage.getItem(
                    "apexcoder_editor_font_size"
                ) ||
                14
            ),

        tabSize:
            Number(
                localStorage.getItem(
                    "apexcoder_editor_tab_size"
                ) ||
                4
            )
    };
}


/* =========================
   START
========================= */

async function startEditor() {

    try {

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


        const params =
            new URLSearchParams(
                window.location.search
            );


        const projectId =
            params.get(
                "project"
            );


        if (!projectId) {

            showError(
                "No project selected",
                "Open a project from your ApexCoder Projects page."
            );

            return;
        }


        const loaded =
            await loadProject(
                projectId
            );


        if (!loaded) {
            return;
        }


        await loadProjectFiles();


        await initializeMonaco();


        renderExplorer();


        editorLoading.hidden =
            true;

        editorApp.hidden =
            false;


        if (files.length > 0) {

            openFile(
                files[0]
            );
        }

    }
    catch (error) {

        console.error(
            "Editor startup failed:",
            error
        );


        showError(
            "Editor failed to start",
            "ApexCoder encountered an unexpected problem while opening this project."
        );
    }
}


/* =========================
   PROJECT
========================= */

async function loadProject(
    projectId
) {

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
                owner_id
            `)
            .eq(
                "id",
                projectId
            )
            .single();


    if (
        error ||
        !data
    ) {

        console.error(
            "Unable to load project:",
            error
        );


        showError(
            "Project unavailable",
            "This project doesn't exist or your account doesn't have access to it."
        );


        return false;
    }


    if (
        data.owner_id !==
        currentUser.id
    ) {

        showError(
            "Access denied",
            "You don't have permission to open this project."
        );


        return false;
    }


    if (
        data.type !==
        "website"
    ) {

        showError(
            "Editor not available yet",
            "Website projects are supported first. The ApexCoder Game Editor is coming later."
        );


        return false;
    }


    currentProject =
        data;


    projectName.textContent =
        data.name;


    explorerProjectName.textContent =
        data.name;


    document.title =
        `${data.name} | ApexCoder`;


    return true;
}


/* =========================
   FILES
========================= */

async function loadProjectFiles() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("project_files")
            .select(`
                id,
                project_id,
                path,
                content,
                language,
                created_at,
                updated_at
            `)
            .eq(
                "project_id",
                currentProject.id
            )
            .order(
                "path",
                {
                    ascending: true
                }
            );


    if (error) {

        throw error;
    }


    if (
        !data ||
        data.length === 0
    ) {

        await createDefaultFiles();

        return;
    }


    files =
        data.map(
            file => ({
                ...file,

                dirty:
                    false,

                model:
                    null
            })
        );
}


/* =========================
   DEFAULT FILES
========================= */

async function createDefaultFiles() {

    const rows =
        DEFAULT_FILES.map(
            file => ({
                project_id:
                    currentProject.id,

                path:
                    file.path,

                content:
                    file.content,

                language:
                    file.language
            })
        );


    const {
        data,
        error
    } =
        await supabaseClient
            .from("project_files")
            .insert(
                rows
            )
            .select();


    if (error) {

        throw error;
    }


    files =
        (data || [])
            .map(
                file => ({
                    ...file,

                    dirty:
                        false,

                    model:
                        null
                })
            )
            .sort(
                (a, b) =>
                    a.path.localeCompare(
                        b.path
                    )
            );
}


/* =========================
   MONACO
========================= */

function initializeMonaco() {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            if (
                typeof require !==
                "function"
            ) {

                reject(
                    new Error(
                        "Monaco loader is unavailable."
                    )
                );

                return;
            }


            require.config({
                paths: {
                    vs:
                        "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs"
                }
            });


            require(
                [
                    "vs/editor/editor.main"
                ],
                () => {

                    const settings =
                        getEditorSettings();


                    editor =
                        monaco.editor.create(
                            monacoEditor,
                            {
                                value:
                                    "",

                                language:
                                    "plaintext",

                                theme:
                                    "vs-dark",

                                automaticLayout:
                                    true,

                                fontSize:
                                    settings.fontSize,

                                wordWrap:
                                    settings.wordWrap
                                        ? "on"
                                        : "off",

                                tabSize:
                                    settings.tabSize,

                                insertSpaces:
                                    true,

                                minimap: {
                                    enabled:
                                        true
                                },

                                smoothScrolling:
                                    true,

                                scrollBeyondLastLine:
                                    false,

                                padding: {
                                    top:
                                        12
                                },

                                renderWhitespace:
                                    "selection",

                                bracketPairColorization: {
                                    enabled:
                                        true
                                }
                            }
                        );


                    editor.onDidChangeModelContent(
                        handleEditorChange
                    );


                    editor.onDidChangeCursorPosition(
                        event => {

                            statusCursor.textContent =
                                `Ln ${event.position.lineNumber}, Col ${event.position.column}`;
                        }
                    );


                    editor.addCommand(
                        monaco.KeyMod.CtrlCmd |
                        monaco.KeyCode.KeyS,
                        () => {

                            saveAllFiles();
                        }
                    );


                    editorReady =
                        true;


                    resolve();
                },
                reject
            );
        }
    );
}


/* =========================
   EXPLORER
========================= */

function renderExplorer() {

    fileList.innerHTML =
        "";


    files.forEach(
        file => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "file-item";


            if (
                activeFile?.id ===
                file.id
            ) {

                button.classList.add(
                    "active"
                );
            }


            const icon =
                document.createElement(
                    "span"
                );


            icon.className =
                "file-icon";


            icon.textContent =
                fileIcon(
                    file.path
                );


            const name =
                document.createElement(
                    "span"
                );


            name.className =
                "file-name";


            name.textContent =
                file.path;


            button.append(
                icon,
                name
            );


            button.addEventListener(
                "click",
                () => {

                    openFile(
                        file
                    );
                }
            );


            fileList.appendChild(
                button
            );
        }
    );
}


/* =========================
   FILE ICON
========================= */

function fileIcon(
    path
) {

    const extension =
        path
            .split(".")
            .pop()
            .toLowerCase();


    if (extension === "html") {
        return "<>";
    }


    if (extension === "css") {
        return "#";
    }


    if (
        extension === "js" ||
        extension === "mjs"
    ) {

        return "JS";
    }


    if (extension === "json") {
        return "{}";
    }


    return "•";
}


/* =========================
   OPEN FILE
========================= */

function openFile(
    file
) {

    if (
        !editorReady ||
        !file
    ) {

        return;
    }


    if (
        !openFiles.some(
            item =>
                item.id ===
                file.id
        )
    ) {

        openFiles.push(
            file
        );
    }


    activeFile =
        file;


    if (!file.model) {

        file.model =
            monaco.editor.createModel(
                file.content,
                monacoLanguage(
                    file.language,
                    file.path
                )
            );
    }


    switchingFile =
        true;


    editor.setModel(
        file.model
    );


    switchingFile =
        false;


    editorEmpty.hidden =
        true;

    monacoEditor.hidden =
        false;


    statusFile.textContent =
        file.path;


    statusLanguage.textContent =
        languageLabel(
            file.language
        );


    renderExplorer();

    renderTabs();


    editor.focus();
}


/* =========================
   LANGUAGE
========================= */

function monacoLanguage(
    language,
    path
) {

    const extension =
        path
            .split(".")
            .pop()
            .toLowerCase();


    if (
        language === "html" ||
        extension === "html"
    ) {

        return "html";
    }


    if (
        language === "css" ||
        extension === "css"
    ) {

        return "css";
    }


    if (
        language === "javascript" ||
        extension === "js"
    ) {

        return "javascript";
    }


    if (extension === "json") {

        return "json";
    }


    return "plaintext";
}


function languageLabel(
    language
) {

    if (language === "html") {
        return "HTML";
    }


    if (language === "css") {
        return "CSS";
    }


    if (language === "javascript") {
        return "JavaScript";
    }


    return "Plain Text";
}


/* =========================
   TABS
========================= */

function renderTabs() {

    editorTabs.innerHTML =
        "";


    openFiles.forEach(
        file => {

            const tab =
                document.createElement(
                    "button"
                );


            tab.type =
                "button";


            tab.className =
                "editor-tab";


            if (
                activeFile?.id ===
                file.id
            ) {

                tab.classList.add(
                    "active"
                );
            }


            const icon =
                document.createElement(
                    "span"
                );


            icon.className =
                "file-icon";


            icon.textContent =
                fileIcon(
                    file.path
                );


            const name =
                document.createElement(
                    "span"
                );


            name.className =
                "tab-name";


            name.textContent =
                file.path;


            const dirty =
                document.createElement(
                    "span"
                );


            dirty.className =
                "tab-dirty";


            dirty.hidden =
                !file.dirty;


            tab.append(
                icon,
                name,
                dirty
            );


            tab.addEventListener(
                "click",
                () => {

                    openFile(
                        file
                    );
                }
            );


            editorTabs.appendChild(
                tab
            );
        }
    );
}


/* =========================
   CHANGES
========================= */

function handleEditorChange() {

    if (
        switchingFile ||
        !activeFile ||
        !editor
    ) {

        return;
    }


    activeFile.content =
        editor.getValue();


    activeFile.dirty =
        true;


    saveStatus.textContent =
        "Unsaved";


    renderTabs();
}


/* =========================
   SAVE PLACEHOLDER
========================= */

async function saveAllFiles() {

    saveStatus.textContent =
        "Saving...";


    // Database saving is the next checkpoint.


    setTimeout(
        () => {

            saveStatus.textContent =
                "Save system next";
        },
        350
    );
}


saveButton.addEventListener(
    "click",
    saveAllFiles
);


/* =========================
   RUN PLACEHOLDER
========================= */

function runProject() {

    alert(
        "Live Preview is the next Editor checkpoint."
    );
}


runButton.addEventListener(
    "click",
    runProject
);


previewRunButton.addEventListener(
    "click",
    runProject
);


/* =========================
   NEW FILE PLACEHOLDER
========================= */

newFileButton.addEventListener(
    "click",
    () => {

        alert(
            "New File is coming in the file-management checkpoint."
        );
    }
);


/* =========================
   ERROR
========================= */

function showError(
    title,
    message
) {

    editorLoading.hidden =
        true;

    editorApp.hidden =
        true;

    errorScreen.hidden =
        false;


    errorTitle.textContent =
        title;


    errorMessage.textContent =
        message;
}


/* =========================
   GO
========================= */

startEditor();

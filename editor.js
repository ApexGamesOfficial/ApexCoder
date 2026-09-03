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


/* =========================================================
   ELEMENTS
========================================================= */

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


const previewWorkspace =
    document.getElementById(
        "previewWorkspace"
    );

const previewStage =
    document.getElementById(
        "previewStage"
    );

const codeWorkspace =
    document.getElementById(
        "codeWorkspace"
    );


const previewTab =
    document.getElementById(
        "previewTab"
    );

const previewModeButton =
    document.getElementById(
        "previewModeButton"
    );

const codeModeButton =
    document.getElementById(
        "codeModeButton"
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

const refreshPreviewButton =
    document.getElementById(
        "refreshPreviewButton"
    );

const activityRunButton =
    document.getElementById(
        "activityRunButton"
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


const propertiesEmpty =
    document.getElementById(
        "propertiesEmpty"
    );

const propertiesContent =
    document.getElementById(
        "propertiesContent"
    );

const propertyName =
    document.getElementById(
        "propertyName"
    );

const propertyType =
    document.getElementById(
        "propertyType"
    );

const propertyLanguage =
    document.getElementById(
        "propertyLanguage"
    );


const outputTabButton =
    document.getElementById(
        "outputTabButton"
    );

const problemsTabButton =
    document.getElementById(
        "problemsTabButton"
    );

const consoleTabButton =
    document.getElementById(
        "consoleTabButton"
    );

const clearPanelButton =
    document.getElementById(
        "clearPanelButton"
    );


const outputPanel =
    document.getElementById(
        "outputPanel"
    );

const problemsPanel =
    document.getElementById(
        "problemsPanel"
    );

const consolePanel =
    document.getElementById(
        "consolePanel"
    );


const outputMessages =
    document.getElementById(
        "outputMessages"
    );

const problemMessages =
    document.getElementById(
        "problemMessages"
    );

const consoleMessages =
    document.getElementById(
        "consoleMessages"
    );


const outputEmpty =
    document.getElementById(
        "outputEmpty"
    );

const problemsEmpty =
    document.getElementById(
        "problemsEmpty"
    );

const consoleEmpty =
    document.getElementById(
        "consoleEmpty"
    );


const problemsCount =
    document.getElementById(
        "problemsCount"
    );


/* =========================================================
   STATE
========================================================= */

let currentUser = null;

let currentProject = null;

let files = [];

let openFiles = [];

let activeFile = null;

let editor = null;

let editorReady = false;

let switchingFile = false;

let currentMode =
    "preview";


let saveInProgress =
    false;

let saveRequestedAgain =
    false;

let autosaveTimer =
    null;

let previewFrame =
    null;

let currentBottomPanel =
    "output";

let runtimeProblems =
    [];


/* =========================================================
   SETTINGS
========================================================= */

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


/* =========================================================
   START
========================================================= */

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
                "Open a website project from your Projects page."
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


        showPreview();

    }
    catch (error) {

        console.error(
            "Editor startup failed:",
            error
        );


        showError(
            "Editor failed to start",
            "ApexCoder encountered a problem while opening this project."
        );
    }
}


/* =========================================================
   PROJECT
========================================================= */

async function loadProject(
    projectId
) {

    const {
        data,
        error
    } =
        await supabaseClient
            .from(
                "projects"
            )
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
            error
        );


        showError(
            "Project unavailable",
            "This project doesn't exist or you don't have access to it."
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
            "Editor unavailable",
            "This version of ApexCoder Studio currently supports website projects."
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
        `${data.name} | ApexCoder Studio`;


    return true;
}


/* =========================================================
   LOAD FILES
========================================================= */

async function loadProjectFiles() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from(
                "project_files"
            )
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
                    ascending:
                        true
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


/* =========================================================
   DEFAULT FILES
========================================================= */

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
            .from(
                "project_files"
            )
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
                (
                    a,
                    b
                ) =>
                    a.path.localeCompare(
                        b.path
                    )
            );
}


/* =========================================================
   MONACO
========================================================= */

function initializeMonaco() {

    return new Promise(
        (
            resolve,
            reject
        ) => {

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


                    monaco.editor.defineTheme(
                        "apexcoder-studio",
                        {
                            base:
                                "vs-dark",

                            inherit:
                                true,

                            rules:
                                [],

                            colors: {
                                "editor.background":
                                    "#1f2023",

                                "editor.foreground":
                                    "#e6e6e6",

                                "editorLineNumber.foreground":
                                    "#77787c",

                                "editorLineNumber.activeForeground":
                                    "#d7d7d7",

                                "editorCursor.foreground":
                                    "#ffffff",

                                "editor.selectionBackground":
                                    "#45474d",

                                "editor.lineHighlightBackground":
                                    "#25262a",

                                "editorIndentGuide.background1":
                                    "#35363a",

                                "editorIndentGuide.activeBackground1":
                                    "#57585d",

                                "editorGutter.background":
                                    "#1f2023",

                                "minimap.background":
                                    "#1f2023"
                            }
                        }
                    );


                    editor =
                        monaco.editor.create(
                            monacoEditor,
                            {
                                value:
                                    "",

                                language:
                                    "plaintext",

                                theme:
                                    "apexcoder-studio",

                                automaticLayout:
                                    true,

                                fontSize:
                                    settings.fontSize,

                                lineHeight:
                                    20,

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
                                        true,

                                    scale:
                                        1
                                },

                                scrollBeyondLastLine:
                                    false,

                                smoothScrolling:
                                    true,

                                padding: {
                                    top:
                                        8
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


/* =========================================================
   EXPLORER
========================================================= */

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


            button.addEventListener(
                "contextmenu",

                event => {

                    showFileMenu(
                        event,
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


/* =========================================================
   FILE ICON
========================================================= */

function fileIcon(
    path
) {

    const extension =
        path
            .split(".")
            .pop()
            .toLowerCase();


    if (
        extension ===
        "html"
    ) {

        return "<>";
    }


    if (
        extension ===
        "css"
    ) {

        return "#";
    }


    if (
        extension ===
        "js"
    ) {

        return "JS";
    }


    if (
        extension ===
        "json"
    ) {

        return "{}";
    }


    return "•";
}


/* =========================================================
   OPEN FILE
========================================================= */

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


    updateProperties(
    file
);


renderExplorer();

renderTabs();


showCode();

editor.focus();
}


/* =========================================================
   PROPERTIES
========================================================= */
function updateProperties(
    file
) {

    propertiesEmpty.hidden =
        true;

    propertiesContent.hidden =
        false;


    propertyName.textContent =
        file.path;


    propertyType.textContent =
        fileExtension(
            file.path
        );


    propertyLanguage.textContent =
        languageLabel(
            file.language
        );
}


function fileExtension(
    path
) {

    const parts =
        path.split(".");


    if (
        parts.length <
        2
    ) {

        return "File";
    }


    return parts
        .pop()
        .toUpperCase();
}


/* =========================================================
   LANGUAGE
========================================================= */

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


    if (
        language === "json" ||
        extension === "json"
    ) {

        return "json";
    }


    return "plaintext";
}


function languageLabel(
    language
) {

    if (
        language ===
        "html"
    ) {

        return "HTML";
    }


    if (
        language ===
        "css"
    ) {

        return "CSS";
    }


    if (
        language ===
        "javascript"
    ) {

        return "JavaScript";
    }


    if (
        language ===
        "json"
    ) {

        return "JSON";
    }


    return "Plain Text";
}


/* =========================================================
   TABS
========================================================= */

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
                currentMode === "code" &&
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


/* =========================================================
   MODES
========================================================= */

function showPreview() {

    currentMode =
        "preview";


    previewWorkspace.hidden =
        false;

    codeWorkspace.hidden =
        true;


    previewTab.classList.add(
        "active"
    );


    previewModeButton.classList.add(
        "active"
    );


    codeModeButton.classList.remove(
        "active"
    );


    renderTabs();


    statusFile.textContent =
        "Preview";

    statusLanguage.textContent =
        "Website";
}


function showCode() {

    currentMode =
        "code";


    previewWorkspace.hidden =
        true;

    codeWorkspace.hidden =
        false;


    previewTab.classList.remove(
        "active"
    );


    previewModeButton.classList.remove(
        "active"
    );


    codeModeButton.classList.add(
        "active"
    );


    renderTabs();


    if (activeFile) {

        statusFile.textContent =
            activeFile.path;


        statusLanguage.textContent =
            languageLabel(
                activeFile.language
            );
    }
}


/* =========================================================
   EDITOR CHANGES
========================================================= */

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


    scheduleAutosave();
}


/* =========================================================
   AUTOSAVE
========================================================= */

function scheduleAutosave() {

    const settings =
        getEditorSettings();


    if (!settings.autosave) {

        return;
    }


    clearTimeout(
        autosaveTimer
    );


    saveStatus.textContent =
        "Autosave pending";


    autosaveTimer =
        setTimeout(
            () => {

                saveAllFiles(
                    true
                );
            },

            1100
        );
}


/* =========================================================
   SAVE
========================================================= */

async function saveAllFiles(
    fromAutosave = false
) {

    clearTimeout(
        autosaveTimer
    );


    const dirtyFiles =
        files.filter(
            file =>
                file.dirty
        );


    if (
        dirtyFiles.length ===
        0
    ) {

        saveStatus.textContent =
            "Saved";

        return true;
    }


    if (saveInProgress) {

        saveRequestedAgain =
            true;

        return false;
    }


    saveInProgress =
        true;


    saveButton.disabled =
        true;


    saveStatus.textContent =
        fromAutosave
            ? "Autosaving..."
            : "Saving...";


    /*
        Snapshot the exact version being saved.

        If the user types while the network
        request is running, the newer version
        stays dirty and gets saved afterward.
    */

    const snapshots =
        dirtyFiles.map(
            file => ({
                file,
                content:
                    file.content,
                language:
                    file.language
            })
        );


    try {

        const results =
            await Promise.all(
                snapshots.map(
                    snapshot => {

                        return supabaseClient
                            .from(
                                "project_files"
                            )
                            .update({
                                content:
                                    snapshot.content,

                                language:
                                    snapshot.language
                            })
                            .eq(
                                "id",
                                snapshot.file.id
                            )
                            .eq(
                                "project_id",
                                currentProject.id
                            )
                            .select(
                                "id"
                            )
                            .single();
                    }
                )
            );


        const failed =
            results.find(
                result =>
                    result.error
            );


        if (failed) {

            throw failed.error;
        }


        /*
            Only mark the file clean when its
            contents still match the snapshot
            that actually reached Supabase.
        */

        snapshots.forEach(
            snapshot => {

                const file =
                    snapshot.file;


                if (
                    file.content ===
                        snapshot.content &&
                    file.language ===
                        snapshot.language
                ) {

                    file.dirty =
                        false;
                }
            }
        );


        const {
            error: projectUpdateError
        } =
            await supabaseClient
                .from(
                    "projects"
                )
                .update({
                    updated_at:
                        new Date()
                            .toISOString()
                })
                .eq(
                    "id",
                    currentProject.id
                )
                .eq(
                    "owner_id",
                    currentUser.id
                );


        if (projectUpdateError) {

            console.warn(
                "Project timestamp couldn't update:",
                projectUpdateError
            );
        }


        const stillDirty =
            files.some(
                file =>
                    file.dirty
            );


        saveStatus.textContent =
            stillDirty
                ? "Unsaved"
                : "Saved";


        renderTabs();


        return true;
    }

    catch (error) {

        console.error(
            "Save failed:",
            error
        );


        saveStatus.textContent =
            "Save failed";


        return false;
    }

    finally {

        saveInProgress =
            false;


        saveButton.disabled =
            false;


        if (
            saveRequestedAgain
        ) {

            saveRequestedAgain =
                false;


            if (
                files.some(
                    file =>
                        file.dirty
                )
            ) {

                saveAllFiles(
                    true
                );
            }
        }

        else if (
            files.some(
                file =>
                    file.dirty
            )
        ) {

            scheduleAutosave();
        }
    }
}


/* =========================================================
   PREVIEW FILE LOOKUP
========================================================= */

function getFileByPath(
    path
) {

    const normalizedPath =
        normalizePath(
            path
        );


    return files.find(
        file =>
            normalizePath(
                file.path
            ) ===
            normalizedPath
    );
}


function normalizePath(
    path
) {

    return String(
        path || ""
    )
        .replace(
            /^\.?\//,
            ""
        )
        .split("?")[0]
        .split("#")[0];
}


/* =========================================================
   BUILD WEBSITE DOCUMENT
========================================================= */

function buildPreviewDocument() {

    const htmlFile =
        getFileByPath(
            "index.html"
        );


    if (!htmlFile) {

        return `
<!DOCTYPE html>

<html>

<head>

    <meta charset="UTF-8">

    <style>

        body {
            margin: 0;

            padding: 40px;

            background: #ffffff;

            color: #222222;

            font-family:
                Arial,
                sans-serif;
        }

    </style>

</head>

<body>

    <h2>
        No index.html file found
    </h2>

    <p>
        ApexCoder needs an index.html file
        to run this website.
    </p>

</body>

</html>
        `;
    }


    let html =
        htmlFile.content;


    /*
        Replace local stylesheet links with
        the current in-memory project CSS.
    */

    html =
        html.replace(
            /<link\b([^>]*?)href=["']([^"']+)["']([^>]*?)>/gi,

            (
                fullMatch,
                beforeHref,
                href,
                afterHref
            ) => {

                const linkedFile =
                    getFileByPath(
                        href
                    );


                if (
                    !linkedFile ||
                    monacoLanguage(
                        linkedFile.language,
                        linkedFile.path
                    ) !== "css"
                ) {

                    return fullMatch;
                }


                return `
<style data-apexcoder-file="${escapeAttribute(
                    linkedFile.path
                )}">
${linkedFile.content}
</style>
                `;
            }
        );


    /*
        Replace local JavaScript files with
        their current in-memory contents.
    */

    html =
        html.replace(
            /<script\b([^>]*?)src=["']([^"']+)["']([^>]*)>\s*<\/script>/gi,

            (
                fullMatch,
                beforeSrc,
                src,
                afterSrc
            ) => {

                const linkedFile =
                    getFileByPath(
                        src
                    );


                if (
                    !linkedFile ||
                    monacoLanguage(
                        linkedFile.language,
                        linkedFile.path
                    ) !== "javascript"
                ) {

                    return fullMatch;
                }


                const safeScript =
                    linkedFile.content.replace(
                        /<\/script/gi,
                        "<\\/script"
                    );


                return `
<script
    data-apexcoder-file="${escapeAttribute(
        linkedFile.path
    )}"
>
${safeScript}
//# sourceURL=apexcoder://${encodeURI(
                    linkedFile.path
                )}
<\/script>
                `;
            }
        );


    /*
        The debug bridge is inserted into the
        document HEAD so it starts listening
        before the user's normal body scripts
        execute.
    */

    const debugBridge =
        createDebugBridge();


    if (
        /<head[\s>]/i.test(
            html
        )
    ) {

        html =
            html.replace(
                /<head([^>]*)>/i,

                match =>
                    `${match}${debugBridge}`
            );
    }

    else {

        html =
            debugBridge +
            html;
    }


    return html;
}


/* =========================================================
   ATTRIBUTE ESCAPING
========================================================= */

function escapeAttribute(
    value
) {

    return String(
        value
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        );
}


/* =========================================================
   PREVIEW DEBUG BRIDGE
========================================================= */

function createDebugBridge() {

    return `
<script>
(function () {

    const send = (
        type,
        payload = {}
    ) => {

        window.parent.postMessage(
            {
                source:
                    "apexcoder-preview",

                type,

                ...payload
            },

            "*"
        );
    };


    function serialize(
        value
    ) {

        try {

            if (
                typeof value ===
                "string"
            ) {

                return value;
            }


            if (
                value ===
                undefined
            ) {

                return "undefined";
            }


            if (
                value ===
                null
            ) {

                return "null";
            }


            if (
                typeof value ===
                "function"
            ) {

                return value.toString();
            }


            if (
                typeof value ===
                "object"
            ) {

                return JSON.stringify(
                    value,
                    null,
                    2
                );
            }


            return String(
                value
            );
        }

        catch {

            return String(
                value
            );
        }
    }


    function serializeArguments(
        args
    ) {

        return Array
            .from(
                args
            )
            .map(
                serialize
            )
            .join(
                " "
            );
    }


    const originalLog =
        console.log.bind(
            console
        );

    const originalInfo =
        console.info.bind(
            console
        );

    const originalWarn =
        console.warn.bind(
            console
        );

    const originalError =
        console.error.bind(
            console
        );


    console.log =
        function (...args) {

            originalLog(
                ...args
            );


            send(
                "console",
                {
                    level:
                        "log",

                    message:
                        serializeArguments(
                            args
                        )
                }
            );
        };


    console.info =
        function (...args) {

            originalInfo(
                ...args
            );


            send(
                "console",
                {
                    level:
                        "info",

                    message:
                        serializeArguments(
                            args
                        )
                }
            );
        };


    console.warn =
        function (...args) {

            originalWarn(
                ...args
            );


            send(
                "console",
                {
                    level:
                        "warn",

                    message:
                        serializeArguments(
                            args
                        )
                }
            );
        };


    console.error =
        function (...args) {

            originalError(
                ...args
            );


            send(
                "console",
                {
                    level:
                        "error",

                    message:
                        serializeArguments(
                            args
                        )
                }
            );
        };


    window.addEventListener(
        "error",

        event => {

            send(
                "runtime-error",
                {
                    message:
                        event.message ||
                        "Unknown JavaScript error",

                    filename:
                        event.filename ||
                        "script.js",

                    line:
                        event.lineno ||
                        null,

                    column:
                        event.colno ||
                        null
                }
            );
        }
    );


    window.addEventListener(
        "unhandledrejection",

        event => {

            let message =
                "Unhandled Promise rejection";


            try {

                if (
                    event.reason &&
                    event.reason.message
                ) {

                    message =
                        event.reason.message;
                }

                else if (
                    event.reason !==
                    undefined
                ) {

                    message =
                        serialize(
                            event.reason
                        );
                }
            }

            catch {}


            send(
                "runtime-error",
                {
                    message,

                    filename:
                        "script.js",

                    line:
                        null,

                    column:
                        null
                }
            );
        }
    );


    send(
        "preview-ready"
    );

})();
<\/script>
    `;
}


/* =========================================================
   BOTTOM PANEL
========================================================= */

function showBottomPanel(
    panel
) {

    currentBottomPanel =
        panel;


    const panels = {
        output:
            outputPanel,

        problems:
            problemsPanel,

        console:
            consolePanel
    };


    const buttons = {
        output:
            outputTabButton,

        problems:
            problemsTabButton,

        console:
            consoleTabButton
    };


    Object.values(
        panels
    ).forEach(
        element => {

            element.hidden =
                true;


            element.classList.remove(
                "active"
            );
        }
    );


    Object.values(
        buttons
    ).forEach(
        button => {

            button.classList.remove(
                "active"
            );
        }
    );


    panels[
        panel
    ].hidden =
        false;


    panels[
        panel
    ].classList.add(
        "active"
    );


    buttons[
        panel
    ].classList.add(
        "active"
    );
}


/* =========================================================
   OUTPUT
========================================================= */

function addOutputMessage(
    message,
    type = "info"
) {

    outputEmpty.hidden =
        true;


    const row =
        document.createElement(
            "div"
        );


    row.className =
        `debug-row ${type}`;


    const time =
        document.createElement(
            "span"
        );


    time.className =
        "debug-time";


    time.textContent =
        new Date()
            .toLocaleTimeString(
                [],
                {
                    hour:
                        "2-digit",

                    minute:
                        "2-digit",

                    second:
                        "2-digit"
                }
            );


    const text =
        document.createElement(
            "span"
        );


    text.className =
        "debug-message";


    text.textContent =
        message;


    row.append(
        time,
        text
    );


    outputMessages.appendChild(
        row
    );


    outputPanel.scrollTop =
        outputPanel.scrollHeight;
}


/* =========================================================
   CONSOLE
========================================================= */

function addConsoleMessage(
    level,
    message
) {

    consoleEmpty.hidden =
        true;


    const row =
        document.createElement(
            "div"
        );


    row.className =
        `console-row ${level}`;


    const icon =
        document.createElement(
            "span"
        );


    icon.className =
        "console-icon";


    if (
        level ===
        "error"
    ) {

        icon.textContent =
            "×";
    }

    else if (
        level ===
        "warn"
    ) {

        icon.textContent =
            "!";
    }

    else {

        icon.textContent =
            "›";
    }


    const text =
        document.createElement(
            "span"
        );


    text.className =
        "console-message";


    text.textContent =
        message;


    row.append(
        icon,
        text
    );


    consoleMessages.appendChild(
        row
    );


    consolePanel.scrollTop =
        consolePanel.scrollHeight;
}


/* =========================================================
   PROBLEMS
========================================================= */

function updateProblemsCount() {

    const count =
        runtimeProblems.length;


    problemsCount.textContent =
        String(
            count
        );


    problemsCount.hidden =
        count === 0;
}


function findProblemFile(
    filename
) {

    if (!filename) {

        return getFileByPath(
            "script.js"
        );
    }


    let normalized =
        String(
            filename
        );


    /*
        sourceURL errors can look like:
        apexcoder://script.js
    */

    normalized =
        normalized.replace(
            /^apexcoder:\/\//i,
            ""
        );


    try {

        normalized =
            decodeURI(
                normalized
            );
    }

    catch {}


    normalized =
        normalizePath(
            normalized
        );


    const exact =
        files.find(
            file =>
                normalizePath(
                    file.path
                ) ===
                normalized
        );


    if (exact) {

        return exact;
    }


    const endingMatch =
        files.find(
            file =>
                normalized.endsWith(
                    normalizePath(
                        file.path
                    )
                )
        );


    if (endingMatch) {

        return endingMatch;
    }


    return getFileByPath(
        "script.js"
    );
}


function addRuntimeProblem({
    message,
    filename,
    line,
    column
}) {

    const duplicate =
        runtimeProblems.some(
            problem =>

                problem.message ===
                    message &&

                problem.filename ===
                    filename &&

                problem.line ===
                    line &&

                problem.column ===
                    column
        );


    if (duplicate) {

        return;
    }


    const problem = {
        message,

        filename:
            filename ||
            "script.js",

        line,

        column
    };


    runtimeProblems.push(
        problem
    );


    problemsEmpty.hidden =
        true;


    const row =
        document.createElement(
            "button"
        );


    row.type =
        "button";


    row.className =
        "problem-row";


    const icon =
        document.createElement(
            "span"
        );


    icon.className =
        "problem-icon";


    icon.textContent =
        "×";


    const body =
        document.createElement(
            "span"
        );


    body.className =
        "problem-body";


    const messageElement =
        document.createElement(
            "strong"
        );


    messageElement.textContent =
        problem.message;


    const location =
        document.createElement(
            "span"
        );


    let locationText =
        problem.filename;


    if (
        problem.line
    ) {

        locationText +=
            `:${problem.line}`;


        if (
            problem.column
        ) {

            locationText +=
                `:${problem.column}`;
        }
    }


    location.textContent =
        locationText;


    body.append(
        messageElement,
        location
    );


    row.append(
        icon,
        body
    );


    row.addEventListener(
        "click",

        () => {

            const matchingFile =
                findProblemFile(
                    problem.filename
                );


            if (!matchingFile) {

                return;
            }


            openFile(
                matchingFile
            );


            if (
                problem.line &&
                editor
            ) {

                const lineCount =
                    editor
                        .getModel()
                        ?.getLineCount() ||
                    1;


                const safeLine =
                    Math.min(
                        Math.max(
                            problem.line,
                            1
                        ),

                        lineCount
                    );


                const lineLength =
                    editor
                        .getModel()
                        ?.getLineLength(
                            safeLine
                        ) ||
                    0;


                const safeColumn =
                    Math.min(
                        Math.max(
                            problem.column ||
                            1,

                            1
                        ),

                        lineLength + 1
                    );


                editor.revealLineInCenter(
                    safeLine
                );


                editor.setPosition({
                    lineNumber:
                        safeLine,

                    column:
                        safeColumn
                });


                editor.focus();
            }
        }
    );


    problemMessages.appendChild(
        row
    );


    updateProblemsCount();


    addOutputMessage(
        `Error: ${problem.message}`,
        "error"
    );
}


/* =========================================================
   CLEAR DEBUG RESULTS
========================================================= */

function clearDebugResults() {

    runtimeProblems =
        [];


    outputMessages.innerHTML =
        "";

    problemMessages.innerHTML =
        "";

    consoleMessages.innerHTML =
        "";


    outputEmpty.hidden =
        false;

    problemsEmpty.hidden =
        false;

    consoleEmpty.hidden =
        false;


    outputEmpty.textContent =
        "Running project...";


    problemsEmpty.textContent =
        "No problems detected.";


    consoleEmpty.textContent =
        "Waiting for console output...";


    updateProblemsCount();
}


/* =========================================================
   PREVIEW MESSAGE RECEIVER
========================================================= */

window.addEventListener(
    "message",

    event => {

        /*
            Only accept messages coming from
            the active sandboxed preview frame.
        */

        if (
            !previewFrame ||
            event.source !==
                previewFrame.contentWindow
        ) {

            return;
        }


        const data =
            event.data;


        if (
            !data ||
            data.source !==
                "apexcoder-preview"
        ) {

            return;
        }


        if (
            data.type ===
            "preview-ready"
        ) {

            outputEmpty.hidden =
                true;


            addOutputMessage(
                "Website preview started.",
                "success"
            );


            return;
        }


        if (
            data.type ===
            "console"
        ) {

            addConsoleMessage(
                data.level ||
                "log",

                data.message ||
                ""
            );


            return;
        }


        if (
            data.type ===
            "runtime-error"
        ) {

            addRuntimeProblem({
                message:
                    data.message ||
                    "Unknown JavaScript error",

                filename:
                    data.filename ||
                    "script.js",

                line:
                    data.line ||
                    null,

                column:
                    data.column ||
                    null
            });
        }
    }
);


/* =========================================================
   RUN PROJECT
========================================================= */

function runProject() {

    clearDebugResults();


    showPreview();


    const source =
        buildPreviewDocument();


    if (!previewFrame) {

        previewStage.innerHTML =
            "";


        previewFrame =
            document.createElement(
                "iframe"
            );


        previewFrame.className =
            "apexcoder-preview-frame";


        /*
            The website may execute scripts,
            but it does NOT get same-origin
            access to ApexCoder itself.
        */

        previewFrame.setAttribute(
            "sandbox",
            "allow-scripts allow-forms allow-modals"
        );


        previewFrame.setAttribute(
            "title",
            "ApexCoder Website Preview"
        );


        previewStage.appendChild(
            previewFrame
        );
    }


    previewFrame.srcdoc =
        source;
}
/* =========================================================
   FILE MANAGEMENT
========================================================= */

function cleanFilePath(
    value
) {

    return String(
        value || ""
    )
        .trim()
        .replace(
            /\\/g,
            "/"
        )
        .replace(
            /^\/+/,
            ""
        );
}


function getLanguageFromPath(
    path
) {

    const extension =
        path
            .split(".")
            .pop()
            .toLowerCase();


    if (
        extension ===
        "html"
    ) {

        return "html";
    }


    if (
        extension ===
        "css"
    ) {

        return "css";
    }


    if (
        extension ===
        "js"
    ) {

        return "javascript";
    }


    if (
        extension ===
        "json"
    ) {

        return "json";
    }


    return "plaintext";
}


function isValidFilePath(
    path
) {

    if (!path) {

        return false;
    }


    if (
        path.length >
        255
    ) {

        return false;
    }


    if (
        path === "." ||
        path === ".."
    ) {

        return false;
    }


    if (
        path.includes("../") ||
        path.includes("/../")
    ) {

        return false;
    }


    return true;
}


function fileAlreadyExists(
    path,
    ignoredFileId = null
) {

    const normalized =
        path.toLowerCase();


    return files.some(
        file =>
            file.id !==
                ignoredFileId &&

            file.path
                .toLowerCase() ===
                normalized
    );
}


/* =========================================================
   NEW FILE
========================================================= */

async function createNewFile() {

    const enteredName =
        prompt(
            "New file name:",
            "new-file.html"
        );


    if (
        enteredName ===
        null
    ) {

        return;
    }


    const path =
        cleanFilePath(
            enteredName
        );


    if (
        !isValidFilePath(
            path
        )
    ) {

        alert(
            "Enter a valid file name."
        );

        return;
    }


    if (
        fileAlreadyExists(
            path
        )
    ) {

        alert(
            "A file with that name already exists."
        );

        return;
    }


    const language =
        getLanguageFromPath(
            path
        );


    saveStatus.textContent =
        "Creating...";


    newFileButton.disabled =
        true;


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from(
                    "project_files"
                )
                .insert({
                    project_id:
                        currentProject.id,

                    path,

                    content:
                        "",

                    language
                })
                .select(`
                    id,
                    project_id,
                    path,
                    content,
                    language,
                    created_at,
                    updated_at
                `)
                .single();


        if (error) {

            throw error;
        }


        const newFile = {
            ...data,

            dirty:
                false,

            model:
                null
        };


        files.push(
            newFile
        );


        files.sort(
            (
                a,
                b
            ) =>
                a.path.localeCompare(
                    b.path
                )
        );


        renderExplorer();


        saveStatus.textContent =
            "Saved";


        openFile(
            newFile
        );
    }

    catch (error) {

        console.error(
            "Create file failed:",
            error
        );


        saveStatus.textContent =
            "Create failed";


        alert(
            "ApexCoder couldn't create that file."
        );
    }

    finally {

        newFileButton.disabled =
            false;
    }
}


/* =========================================================
   RENAME FILE
========================================================= */

async function renameFile(
    file
) {

    if (!file) {

        return;
    }


    if (
        file.dirty
    ) {

        const saved =
            await saveAllFiles(
                false
            );


        if (!saved) {

            alert(
                "Save this file before renaming it."
            );

            return;
        }
    }


    const enteredName =
        prompt(
            "Rename file:",
            file.path
        );


    if (
        enteredName ===
        null
    ) {

        return;
    }


    const newPath =
        cleanFilePath(
            enteredName
        );


    if (
        !isValidFilePath(
            newPath
        )
    ) {

        alert(
            "Enter a valid file name."
        );

        return;
    }


    if (
        newPath ===
        file.path
    ) {

        return;
    }


    if (
        fileAlreadyExists(
            newPath,
            file.id
        )
    ) {

        alert(
            "A file with that name already exists."
        );

        return;
    }


    const newLanguage =
        getLanguageFromPath(
            newPath
        );


    saveStatus.textContent =
        "Renaming...";


    try {

        const {
            error
        } =
            await supabaseClient
                .from(
                    "project_files"
                )
                .update({
                    path:
                        newPath,

                    language:
                        newLanguage
                })
                .eq(
                    "id",
                    file.id
                )
                .eq(
                    "project_id",
                    currentProject.id
                );


        if (error) {

            throw error;
        }


        file.path =
            newPath;


        file.language =
            newLanguage;


        if (
            file.model
        ) {

            monaco.editor
                .setModelLanguage(
                    file.model,

                    monacoLanguage(
                        newLanguage,
                        newPath
                    )
                );
        }


        files.sort(
            (
                a,
                b
            ) =>
                a.path.localeCompare(
                    b.path
                )
        );


        renderExplorer();

        renderTabs();


        if (
            activeFile?.id ===
            file.id
        ) {

            updateProperties(
                file
            );


            statusFile.textContent =
                file.path;


            statusLanguage.textContent =
                languageLabel(
                    file.language
                );
        }


        saveStatus.textContent =
            "Saved";
    }

    catch (error) {

        console.error(
            "Rename failed:",
            error
        );


        saveStatus.textContent =
            "Rename failed";


        alert(
            "ApexCoder couldn't rename that file."
        );
    }
}


/* =========================================================
   DELETE FILE
========================================================= */

async function deleteFile(
    file
) {

    if (!file) {

        return;
    }


    const confirmed =
        confirm(
            `Delete "${file.path}"?\n\nThis cannot be undone.`
        );


    if (!confirmed) {

        return;
    }


    saveStatus.textContent =
        "Deleting...";


    try {

        const {
            error
        } =
            await supabaseClient
                .from(
                    "project_files"
                )
                .delete()
                .eq(
                    "id",
                    file.id
                )
                .eq(
                    "project_id",
                    currentProject.id
                );


        if (error) {

            throw error;
        }


        if (
            file.model
        ) {

            if (
                editor &&
                editor.getModel() ===
                    file.model
            ) {

                editor.setModel(
                    null
                );
            }


            file.model.dispose();


            file.model =
                null;
        }


        files =
            files.filter(
                item =>
                    item.id !==
                    file.id
            );


        openFiles =
            openFiles.filter(
                item =>
                    item.id !==
                    file.id
            );


        if (
            activeFile?.id ===
            file.id
        ) {

            activeFile =
                null;


            editorEmpty.hidden =
                false;


            monacoEditor.hidden =
                true;


            propertiesContent.hidden =
                true;


            propertiesEmpty.hidden =
                false;


            statusFile.textContent =
                "No file";


            statusLanguage.textContent =
                "Website";


            statusCursor.textContent =
                "Ln 1, Col 1";


            /*
                If another file is still open,
                automatically switch to it.
            */

            const fallbackFile =
                openFiles[
                    openFiles.length - 1
                ];


            if (
                fallbackFile
            ) {

                openFile(
                    fallbackFile
                );
            }

            else {

                showPreview();
            }
        }


        renderExplorer();

        renderTabs();


        saveStatus.textContent =
            "Saved";
    }

    catch (error) {

        console.error(
            "Delete failed:",
            error
        );


        saveStatus.textContent =
            "Delete failed";


        alert(
            "ApexCoder couldn't delete that file."
        );
    }
}


/* =========================================================
   FILE CONTEXT MENU
========================================================= */

function showFileMenu(
    event,
    file
) {

    event.preventDefault();

    event.stopPropagation();


    closeFileMenu();


    const menu =
        document.createElement(
            "div"
        );


    menu.className =
        "file-context-menu";


    const renameButton =
        document.createElement(
            "button"
        );


    renameButton.type =
        "button";


    renameButton.textContent =
        "Rename";


    renameButton.addEventListener(
        "click",

        () => {

            closeFileMenu();


            renameFile(
                file
            );
        }
    );


    const deleteButton =
        document.createElement(
            "button"
        );


    deleteButton.type =
        "button";


    deleteButton.textContent =
        "Delete";


    deleteButton.className =
        "danger";


    deleteButton.addEventListener(
        "click",

        () => {

            closeFileMenu();


            deleteFile(
                file
            );
        }
    );


    menu.append(
        renameButton,
        deleteButton
    );


    document.body.appendChild(
        menu
    );


    const menuWidth =
        130;


    const menuHeight =
        70;


    let x =
        event.clientX;


    let y =
        event.clientY;


    if (
        x + menuWidth >
        window.innerWidth
    ) {

        x =
            window.innerWidth -
            menuWidth -
            5;
    }


    if (
        y + menuHeight >
        window.innerHeight
    ) {

        y =
            window.innerHeight -
            menuHeight -
            5;
    }


    menu.style.left =
        `${x}px`;


    menu.style.top =
        `${y}px`;
}


function closeFileMenu() {

    document
        .querySelectorAll(
            ".file-context-menu"
        )
        .forEach(
            menu =>
                menu.remove()
        );
}


/* =========================================================
   GENERAL EVENTS
========================================================= */

document.addEventListener(
    "click",
    closeFileMenu
);


window.addEventListener(
    "blur",
    closeFileMenu
);


/* =========================================================
   SAVE / RUN EVENTS
========================================================= */

saveButton.addEventListener(
    "click",

    () => {

        saveAllFiles(
            false
        );
    }
);


runButton.addEventListener(
    "click",
    runProject
);


previewRunButton.addEventListener(
    "click",
    runProject
);


activityRunButton.addEventListener(
    "click",
    runProject
);


refreshPreviewButton.addEventListener(
    "click",
    runProject
);


/* =========================================================
   MODE EVENTS
========================================================= */

previewTab.addEventListener(
    "click",
    showPreview
);


previewModeButton.addEventListener(
    "click",
    showPreview
);


codeModeButton.addEventListener(
    "click",

    () => {

        showCode();


        if (
            editor &&
            activeFile
        ) {

            editor.focus();
        }
    }
);


/* =========================================================
   BOTTOM PANEL EVENTS
========================================================= */

outputTabButton.addEventListener(
    "click",

    () => {

        showBottomPanel(
            "output"
        );
    }
);


problemsTabButton.addEventListener(
    "click",

    () => {

        showBottomPanel(
            "problems"
        );
    }
);


consoleTabButton.addEventListener(
    "click",

    () => {

        showBottomPanel(
            "console"
        );
    }
);


clearPanelButton.addEventListener(
    "click",

    () => {

        runtimeProblems =
            [];


        outputMessages.innerHTML =
            "";


        problemMessages.innerHTML =
            "";


        consoleMessages.innerHTML =
            "";


        outputEmpty.hidden =
            false;


        problemsEmpty.hidden =
            false;


        consoleEmpty.hidden =
            false;


        outputEmpty.textContent =
            "Output cleared.";


        problemsEmpty.textContent =
            "No problems detected.";


        consoleEmpty.textContent =
            "Console cleared.";


        updateProblemsCount();
    }
);


/* =========================================================
   NEW FILE EVENT
========================================================= */

newFileButton.addEventListener(
    "click",
    createNewFile
);


/* =========================================================
   KEYBOARD SHORTCUTS
========================================================= */

window.addEventListener(
    "keydown",

    event => {

        const control =
            event.ctrlKey ||
            event.metaKey;


        if (
            control &&
            event.key.toLowerCase() ===
                "s"
        ) {

            event.preventDefault();


            saveAllFiles(
                false
            );
        }


        if (
            control &&
            event.key ===
                "Enter"
        ) {

            event.preventDefault();


            runProject();
        }
    }
);


/* =========================================================
   WARN ABOUT UNSAVED WORK
========================================================= */

window.addEventListener(
    "beforeunload",

    event => {

        const hasUnsavedFiles =
            files.some(
                file =>
                    file.dirty
            );


        if (
            !hasUnsavedFiles
        ) {

            return;
        }


        event.preventDefault();


        event.returnValue =
            "";
    }
);


/* =========================================================
   ERROR SCREEN
========================================================= */

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


/* =========================================================
   START EDITOR
========================================================= */

startEditor();

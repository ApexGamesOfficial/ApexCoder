/* =========================================================
   APEXCODER GAME EDITOR
   V0.2 — WORLD EDITING FOUNDATION
========================================================= */

(() => {

    "use strict";


    /* =====================================================
       DOM
    ====================================================== */

    const editorLoading =
        document.getElementById(
            "editorLoading"
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

    const gameEditor =
        document.getElementById(
            "gameEditor"
        );

    const projectName =
        document.getElementById(
            "projectName"
        );

    const explorerProjectName =
        document.getElementById(
            "explorerProjectName"
        );

    const statusProject =
        document.getElementById(
            "statusProject"
        );

    const rendererStatus =
        document.getElementById(
            "rendererStatus"
        );

    const objectCountStatus =
        document.getElementById(
            "objectCountStatus"
        );

    const viewportContainer =
        document.getElementById(
            "viewportContainer"
        );

    const canvas =
        document.getElementById(
            "gameCanvas"
        );

    const resetCameraButton =
        document.getElementById(
            "resetCameraButton"
        );

    const homeCameraButton =
        document.getElementById(
            "homeCameraButton"
        );

    const workspaceTreeItem =
        document.getElementById(
            "workspaceTreeItem"
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

    const propertyPosition =
        document.getElementById(
            "propertyPosition"
        );

    const propertyRotation =
        document.getElementById(
            "propertyRotation"
        );

    const propertyScale =
        document.getElementById(
            "propertyScale"
        );

    const selectToolButton =
        document.getElementById(
            "selectToolButton"
        );

    const moveToolButton =
        document.getElementById(
            "moveToolButton"
        );

    const rotateToolButton =
        document.getElementById(
            "rotateToolButton"
        );

    const scaleToolButton =
        document.getElementById(
            "scaleToolButton"
        );

    const addPartButton =
        document.getElementById(
            "addPartButton"
        );


    const explorerAddButton =
        document.getElementById(
            "explorerAddButton"
        );


    const saveStatus =
        document.getElementById(
            "saveStatus"
        );


    const sceneActivityButton =
        document.getElementById(
            "sceneActivityButton"
        );

    const scriptsActivityButton =
        document.getElementById(
            "scriptsActivityButton"
        );

    const viewportTabButton =
        document.getElementById(
            "viewportTabButton"
        );

    const scriptTabButton =
        document.getElementById(
            "scriptTabButton"
        );

    const viewportHints =
        document.getElementById(
            "viewportHints"
        );

    const scriptHeaderStatus =
        document.getElementById(
            "scriptHeaderStatus"
        );

    const scriptWorkspace =
        document.getElementById(
            "scriptWorkspace"
        );

    const scriptList =
        document.getElementById(
            "scriptList"
        );

    const newScriptButton =
        document.getElementById(
            "newScriptButton"
        );

    const renameScriptButton =
        document.getElementById(
            "renameScriptButton"
        );

    const deleteScriptButton =
        document.getElementById(
            "deleteScriptButton"
        );

    const activeScriptName =
        document.getElementById(
            "activeScriptName"
        );

    const scriptSaveState =
        document.getElementById(
            "scriptSaveState"
        );

    const scriptDirtyDot =
        document.getElementById(
            "scriptDirtyDot"
        );

    const monacoEditorHost =
        document.getElementById(
            "monacoEditor"
        );

    const monacoFallback =
        document.getElementById(
            "monacoFallback"
        );

    const monacoFallbackText =
        document.getElementById(
            "monacoFallbackText"
        );


    /* =====================================================
       STATE
    ====================================================== */

    let currentSession =
        null;

    let currentProject =
        null;


    let THREE =
        null;

    let OrbitControls =
        null;

    let TransformControls =
        null;


    let renderer =
        null;

    let scene =
        null;

    let camera =
        null;

    let controls =
        null;

    let transformControls =
        null;

    let transformHelper =
        null;


    let baseplate =
        null;

    let selectedSceneObject =
        null;

    let selectionHelper =
        null;


    let raycaster =
        null;

    let pointer =
        null;


    let resizeObserver =
        null;

    let animationFrame =
        null;


    let currentTool =
        "select";


    let partCounter =
        1;


    let explorerExpanded =
        true;


    let explorerContextMenu =
        null;


    let currentWorkspaceMode =
        "viewport";

    let projectScripts =
        [];

    let activeScriptId =
        null;

    let monacoInstance =
        null;

    let monacoLoadingPromise =
        null;

    let scriptSaveTimer =
        null;

    let suppressMonacoChange =
        false;


    const sceneObjects =
        [];


    /* =====================================================
       START
    ====================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        boot
    );


    async function boot() {

        try {

            await waitForSupabase();

            await loadSession();

            await loadProject();

            loadProjectScripts();

            await loadThree();

            createStudioScene();

            connectInterface();

            renderExplorer();

            showEditor();

        }

        catch (error) {

            console.error(
                "ApexCoder Game Editor startup error:",
                error
            );


            showError(
                "Unable to open Game Editor",
                error?.message ||
                "An unexpected startup error occurred."
            );

        }

    }


    /* =====================================================
       WAIT FOR SUPABASE
    ====================================================== */

    async function waitForSupabase() {

        const maxAttempts =
            100;


        for (
            let attempt = 0;
            attempt < maxAttempts;
            attempt++
        ) {

            if (
                typeof supabaseClient !==
                "undefined"
            ) {

                return;

            }


            await sleep(
                50
            );

        }


        throw new Error(
            "ApexCoder could not connect to the account system."
        );

    }


    function sleep(
        milliseconds
    ) {

        return new Promise(
            resolve => {

                setTimeout(
                    resolve,
                    milliseconds
                );

            }
        );

    }


    /* =====================================================
       SESSION
    ====================================================== */

    async function loadSession() {

        const {
            data,
            error
        } =
            await supabaseClient
                .auth
                .getSession();


        if (error) {

            throw error;

        }


        currentSession =
            data?.session ||
            null;


        if (!currentSession) {

            window.location.href =
                "login.html";


            throw new Error(
                "No active Apex Games Account session."
            );

        }

    }


    /* =====================================================
       PROJECT
    ====================================================== */

    async function loadProject() {

        const parameters =
            new URLSearchParams(
                window.location.search
            );


        const projectId =
            parameters.get(
                "project"
            );


        if (!projectId) {

            throw new Error(
                "No game project was provided."
            );

        }


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
                    owner_id,
                    name,
                    type,
                    created_at,
                    updated_at
                `)
                .eq(
                    "id",
                    projectId
                )
                .single();


        if (error) {

            throw error;

        }


        if (!data) {

            throw new Error(
                "This project could not be found."
            );

        }


        if (
            data.owner_id !==
            currentSession.user.id
        ) {

            throw new Error(
                "You do not have access to this project."
            );

        }


        if (
            data.type !==
            "game"
        ) {

            throw new Error(
                "This project is not an ApexCoder game project."
            );

        }


        currentProject =
            data;


        projectName.textContent =
            currentProject.name;


        explorerProjectName.textContent =
            currentProject.name;


        statusProject.textContent =
            currentProject.name;


        document.title =
            `${currentProject.name} — ApexCoder Game Editor`;

    }


    /* =====================================================
       THREE.JS
    ====================================================== */

    async function loadThree() {

        rendererStatus.textContent =
            "Loading 3D Engine";


        const threeModule =
            await import(
                "three"
            );


        const orbitModule =
            await import(
                "three/addons/controls/OrbitControls.js"
            );


        const transformModule =
            await import(
                "three/addons/controls/TransformControls.js"
            );


        THREE =
            threeModule;


        OrbitControls =
            orbitModule
                .OrbitControls;


        TransformControls =
            transformModule
                .TransformControls;


        rendererStatus.textContent =
            "Three.js";

    }


    /* =====================================================
       SCENE CREATION
    ====================================================== */

    function createStudioScene() {

        renderer =
            new THREE.WebGLRenderer({
                canvas:
                    canvas,

                antialias:
                    true,

                alpha:
                    false
            });


        renderer.setPixelRatio(
            Math.min(
                window.devicePixelRatio ||
                1,

                2
            )
        );


        renderer.shadowMap.enabled =
            true;


        renderer.shadowMap.type =
            THREE.PCFSoftShadowMap;


        renderer.outputColorSpace =
            THREE.SRGBColorSpace;


        scene =
            new THREE.Scene();


        scene.background =
            new THREE.Color(
                0x1c1d20
            );


        scene.fog =
            new THREE.Fog(
                0x1c1d20,
                75,
                220
            );


        /* =============================
           CAMERA
        ============================= */

        camera =
            new THREE.PerspectiveCamera(
                55,
                1,
                0.1,
                1000
            );


        resetCamera();


        /* =============================
           ORBIT CONTROLS
        ============================= */

        controls =
            new OrbitControls(
                camera,
                renderer.domElement
            );


        controls.enableDamping =
            true;


        controls.dampingFactor =
            0.08;


        controls.enablePan =
            true;


        controls.screenSpacePanning =
            true;


        controls.minDistance =
            3;


        controls.maxDistance =
            180;


        controls.target.set(
            0,
            2,
            0
        );


        controls.update();


        /* =============================
           RAYCASTING
        ============================= */

        raycaster =
            new THREE.Raycaster();


        pointer =
            new THREE.Vector2();


        /* =============================
           GRID
        ============================= */

        const grid =
            new THREE.GridHelper(
                200,
                200,
                0x5f6064,
                0x343539
            );


        grid.position.y =
            0.01;


        grid.userData.editorOnly =
            true;


        scene.add(
            grid
        );


        /* =============================
           BASEPLATE
        ============================= */

        const baseplateGeometry =
            new THREE.BoxGeometry(
                40,
                0.5,
                40
            );


        const baseplateMaterial =
            new THREE.MeshStandardMaterial({
                color:
                    0x64666b,

                roughness:
                    0.9,

                metalness:
                    0
            });


        baseplate =
            new THREE.Mesh(
                baseplateGeometry,
                baseplateMaterial
            );


        baseplate.name =
            "Baseplate";


        baseplate.position.set(
            0,
            -0.25,
            0
        );


        baseplate.receiveShadow =
            true;


        baseplate.userData.apexObject =
            true;


        baseplate.userData.objectType =
            "Baseplate";


        baseplate.userData.locked =
            true;


        scene.add(
            baseplate
        );


        registerSceneObject(
            baseplate
        );


        /* =============================
           ENVIRONMENT LIGHT
        ============================= */

        const hemisphereLight =
            new THREE.HemisphereLight(
                0xffffff,
                0x35363a,
                1.45
            );


        hemisphereLight.name =
            "Environment Light";


        hemisphereLight.userData.editorOnly =
            true;


        scene.add(
            hemisphereLight
        );


        /* =============================
           SUN
        ============================= */

        const sunLight =
            new THREE.DirectionalLight(
                0xffffff,
                2.35
            );


        sunLight.name =
            "Sun";


        sunLight.position.set(
            18,
            32,
            16
        );


        sunLight.castShadow =
            true;


        sunLight.shadow.mapSize.width =
            2048;


        sunLight.shadow.mapSize.height =
            2048;


        sunLight.shadow.camera.left =
            -45;


        sunLight.shadow.camera.right =
            45;


        sunLight.shadow.camera.top =
            45;


        sunLight.shadow.camera.bottom =
            -45;


        sunLight.userData.editorOnly =
            true;


        scene.add(
            sunLight
        );


        /* =============================
           STARTING PART
        ============================= */

        const starterPart =
            createPartObject(
                "SpawnPart"
            );


        starterPart.position.set(
            0,
            1,
            0
        );


        scene.add(
            starterPart
        );


        registerSceneObject(
            starterPart
        );


        /* =============================
           TRANSFORM CONTROLS
        ============================= */

        transformControls =
            new TransformControls(
                camera,
                renderer.domElement
            );


        /*
            Newer Three.js versions expose
            the visible gizmo through getHelper().
        */

        if (
            typeof transformControls
                .getHelper ===
            "function"
        ) {

            transformHelper =
                transformControls
                    .getHelper();


            scene.add(
                transformHelper
            );

        }


        transformControls
            .addEventListener(
                "dragging-changed",
                event => {

                    if (controls) {

                        controls.enabled =
                            !event.value;

                    }

                }
            );


        transformControls
            .addEventListener(
                "objectChange",
                () => {

                    if (
                        !selectedSceneObject
                    ) {

                        return;

                    }


                    updateProperties(
                        selectedSceneObject
                    );


                    updateSelectionHelper();


                    setEditorStatus(
                        "Scene updated"
                    );

                }
            );


        /* =============================
           RESIZE
        ============================= */

        resizeRenderer();


        resizeObserver =
            new ResizeObserver(
                resizeRenderer
            );


        resizeObserver.observe(
            viewportContainer
        );


        window.addEventListener(
            "resize",
            resizeRenderer
        );


        /* =============================
           START LOOP
        ============================= */

        animate();


        updateObjectCount();

    }


    /* =====================================================
       PARTS
    ====================================================== */

    function createPartObject(
        requestedName = null
    ) {

        const geometry =
            new THREE.BoxGeometry(
                2,
                2,
                2
            );


        const material =
            new THREE.MeshStandardMaterial({
                color:
                    0xb7b9bd,

                roughness:
                    0.72,

                metalness:
                    0
            });


        const part =
            new THREE.Mesh(
                geometry,
                material
            );


        if (requestedName) {

            part.name =
                requestedName;

        }

        else {

            part.name =
                `Part${partCounter}`;


            partCounter++;

        }


        part.castShadow =
            true;


        part.receiveShadow =
            true;


        part.userData.apexObject =
            true;


        part.userData.objectType =
            "Part";


        part.userData.locked =
            false;


        return part;

    }


    function addPart() {

        if (
            !scene ||
            !camera
        ) {

            return;

        }


        const part =
            createPartObject();


        const direction =
            new THREE.Vector3();


        camera.getWorldDirection(
            direction
        );


        const spawnPosition =
            camera.position
                .clone()
                .add(
                    direction
                        .multiplyScalar(
                            8
                        )
                );


        spawnPosition.y =
            Math.max(
                1,
                spawnPosition.y
            );


        part.position.copy(
            spawnPosition
        );


        scene.add(
            part
        );


        registerSceneObject(
            part
        );


        renderExplorer();


        selectSceneObject(
            part
        );


        setTool(
            "move"
        );


        updateObjectCount();


        setEditorStatus(
            "Part added"
        );

    }


    /* =====================================================
       OBJECT REGISTRATION
    ====================================================== */

    function registerSceneObject(
        object
    ) {

        if (!object) {
            return;
        }


        if (
            sceneObjects.includes(
                object
            )
        ) {

            return;

        }


        sceneObjects.push(
            object
        );

    }


    /* =====================================================
       TREE SELECTION
    ====================================================== */

    function clearTreeSelection() {

        document
            .querySelectorAll(
                ".tree-item.selected"
            )
            .forEach(
                item => {

                    item.classList.remove(
                        "selected"
                    );

                }
            );

    }


    /* =====================================================
       VIEWPORT SELECTION
    ====================================================== */

    function handleViewportPointerDown(
        event
    ) {

        if (
            event.button !==
            0
        ) {

            return;

        }


        if (
            transformControls
                ?.dragging
        ) {

            return;

        }


        const rect =
            renderer
                .domElement
                .getBoundingClientRect();


        pointer.x =
            (
                (
                    event.clientX -
                    rect.left
                ) /
                rect.width
            ) *
            2 -
            1;


        pointer.y =
            -(
                (
                    event.clientY -
                    rect.top
                ) /
                rect.height
            ) *
            2 +
            1;


        raycaster.setFromCamera(
            pointer,
            camera
        );


        const intersections =
            raycaster.intersectObjects(
                sceneObjects,
                false
            );


        if (
            intersections.length ===
            0
        ) {

            clearSelection();

            return;

        }


        const hitObject =
            intersections[0]
                .object;


        selectSceneObject(
            hitObject
        );

    }


    /* =====================================================
       SELECT OBJECT
    ====================================================== */

    function selectSceneObject(
        object
    ) {

        if (!object) {

            clearSelection();

            return;

        }


        selectedSceneObject =
            object;


        updateProperties(
            object
        );


        highlightExplorerObject(
            object
        );


        createSelectionHelper(
            object
        );


        if (
            object.userData
                ?.locked
        ) {

            transformControls
                ?.detach();


            currentTool =
                "select";


            updateToolButtons();


            return;

        }


        attachTransformForCurrentTool();

    }


    function clearSelection() {

        selectedSceneObject =
            null;


        transformControls
            ?.detach();


        removeSelectionHelper();


        clearTreeSelection();


        hideProperties();

    }


    /* =====================================================
       SELECTION OUTLINE
    ====================================================== */

    function createSelectionHelper(
        object
    ) {

        removeSelectionHelper();


        if (
            !object ||
            !object.geometry
        ) {

            return;

        }


        selectionHelper =
            new THREE.BoxHelper(
                object,
                0xffffff
            );


        if (
            selectionHelper.material
        ) {

            selectionHelper.material
                .depthTest =
                false;


            selectionHelper.material
                .transparent =
                true;


            selectionHelper.material
                .opacity =
                0.85;

        }


        selectionHelper.renderOrder =
            999;


        scene.add(
            selectionHelper
        );

    }


    function updateSelectionHelper() {

        if (
            !selectionHelper ||
            !selectedSceneObject
        ) {

            return;

        }


        selectionHelper.update();

    }


    function removeSelectionHelper() {

        if (
            !selectionHelper
        ) {

            return;

        }


        scene.remove(
            selectionHelper
        );


        selectionHelper.geometry
            ?.dispose();


        if (
            Array.isArray(
                selectionHelper.material
            )
        ) {

            selectionHelper.material
                .forEach(
                    material => {

                        material.dispose();

                    }
                );

        }

        else {

            selectionHelper.material
                ?.dispose();

        }


        selectionHelper =
            null;

    }


    /* =====================================================
       TOOLS
    ====================================================== */

    function setTool(
        tool
    ) {

        currentTool =
            tool;


        updateToolButtons();


        attachTransformForCurrentTool();

    }


    function updateToolButtons() {

        const buttons = [
            selectToolButton,
            moveToolButton,
            rotateToolButton,
            scaleToolButton
        ];


        buttons.forEach(
            button => {

                button
                    ?.classList
                    .remove(
                        "active"
                    );

            }
        );


        if (
            currentTool ===
            "select"
        ) {

            selectToolButton
                ?.classList
                .add(
                    "active"
                );

        }


        if (
            currentTool ===
            "move"
        ) {

            moveToolButton
                ?.classList
                .add(
                    "active"
                );

        }


        if (
            currentTool ===
            "rotate"
        ) {

            rotateToolButton
                ?.classList
                .add(
                    "active"
                );

        }


        if (
            currentTool ===
            "scale"
        ) {

            scaleToolButton
                ?.classList
                .add(
                    "active"
                );

        }

    }


    function attachTransformForCurrentTool() {

        if (
            !transformControls
        ) {

            return;

        }


        if (
            !selectedSceneObject
        ) {

            transformControls.detach();

            return;

        }


        if (
            selectedSceneObject
                .userData
                ?.locked
        ) {

            transformControls.detach();

            return;

        }


        if (
            currentTool ===
            "select"
        ) {

            transformControls.detach();

            return;

        }


        transformControls.attach(
            selectedSceneObject
        );


        if (
            currentTool ===
            "move"
        ) {

            transformControls.setMode(
                "translate"
            );

        }


        else if (
            currentTool ===
            "rotate"
        ) {

            transformControls.setMode(
                "rotate"
            );

        }


        else if (
            currentTool ===
            "scale"
        ) {

            transformControls.setMode(
                "scale"
            );

        }

    }


    /* =====================================================
       EXPLORER
    ====================================================== */

    function renderExplorer() {

        const treeChildren =
            document.querySelector(
                ".tree-children"
            );


        if (!treeChildren) {

            return;

        }


        treeChildren.innerHTML =
            "";


        treeChildren.classList.toggle(
            "collapsed",
            !explorerExpanded
        );


        const rootArrow =
            workspaceTreeItem
                ?.querySelector(
                    ".tree-arrow"
                );


        if (rootArrow) {

            rootArrow.textContent =
                explorerExpanded
                    ? "▾"
                    : "▸";

        }


        sceneObjects.forEach(
            object => {

                const button =
                    document.createElement(
                        "button"
                    );


                button.type =
                    "button";


                button.className =
                    "tree-item child-item";


                button.dataset
                    .objectUuid =
                    object.uuid;


                const icon =
                    object.userData
                        ?.objectType ===
                    "Baseplate"
                        ? "▣"
                        : "■";


                button.innerHTML = `
                    <span class="tree-indent"></span>

                    <span class="tree-icon">
                        ${icon}
                    </span>

                    <span class="tree-name"></span>
                `;


                const nameElement =
                    button.querySelector(
                        ".tree-name"
                    );


                nameElement.textContent =
                    object.name;


                button.addEventListener(
                    "click",
                    () => {

                        selectSceneObject(
                            object
                        );

                    }
                );


                button.addEventListener(
                    "dblclick",
                    event => {

                        event.preventDefault();
                        event.stopPropagation();


                        beginRenameObject(
                            object
                        );

                    }
                );


                button.addEventListener(
                    "contextmenu",
                    event => {

                        event.preventDefault();
                        event.stopPropagation();


                        selectSceneObject(
                            object
                        );


                        openExplorerContextMenu(
                            event.clientX,
                            event.clientY,
                            object
                        );

                    }
                );


                treeChildren.appendChild(
                    button
                );

            }
        );


        /* =============================
           CAMERA
        ============================= */

        const cameraButton =
            createSpecialTreeItem(
                "◉",
                "Camera"
            );


        cameraButton.dataset.special =
            "camera";


        cameraButton.addEventListener(
            "click",
            () => {

                clearTreeSelection();


                cameraButton
                    .classList
                    .add(
                        "selected"
                    );


                selectedSceneObject =
                    camera;


                transformControls
                    ?.detach();


                removeSelectionHelper();


                updateProperties(
                    camera,
                    "Camera"
                );

            }
        );


        treeChildren.appendChild(
            cameraButton
        );


        /* =============================
           LIGHTING
        ============================= */

        const lightingButton =
            createSpecialTreeItem(
                "☀",
                "Lighting"
            );


        lightingButton.dataset.special =
            "lighting";


        lightingButton.addEventListener(
            "click",
            () => {

                clearTreeSelection();


                lightingButton
                    .classList
                    .add(
                        "selected"
                    );


                selectedSceneObject =
                    null;


                transformControls
                    ?.detach();


                removeSelectionHelper();


                showLightingProperties();

            }
        );


        treeChildren.appendChild(
            lightingButton
        );


        if (
            selectedSceneObject &&
            sceneObjects.includes(
                selectedSceneObject
            )
        ) {

            highlightExplorerObject(
                selectedSceneObject
            );

        }

        else if (
            selectedSceneObject ===
            camera
        ) {

            cameraButton
                .classList
                .add(
                    "selected"
                );

        }

    }


    function createSpecialTreeItem(
        icon,
        name
    ) {

        const button =
            document.createElement(
                "button"
            );


        button.type =
            "button";


        button.className =
            "tree-item child-item";


        button.innerHTML = `
            <span class="tree-indent"></span>

            <span class="tree-icon">
                ${icon}
            </span>

            <span class="tree-name"></span>
        `;


        button
            .querySelector(
                ".tree-name"
            )
            .textContent =
            name;


        return button;

    }


    function highlightExplorerObject(
        object
    ) {

        clearTreeSelection();


        if (!object) {

            return;

        }


        const item =
            document.querySelector(
                `.tree-item[data-object-uuid="${object.uuid}"]`
            );


        if (item) {

            item.classList.add(
                "selected"
            );

        }

    }


    function toggleExplorer() {

        explorerExpanded =
            !explorerExpanded;


        renderExplorer();

    }


    function beginRenameObject(
        object
    ) {

        if (
            !object ||
            !sceneObjects.includes(
                object
            )
        ) {

            return;

        }


        closeExplorerContextMenu();


        const item =
            document.querySelector(
                `.tree-item[data-object-uuid="${object.uuid}"]`
            );


        const nameElement =
            item?.querySelector(
                ".tree-name"
            );


        if (
            !item ||
            !nameElement
        ) {

            return;

        }


        const input =
            document.createElement(
                "input"
            );


        input.type =
            "text";


        input.className =
            "tree-rename-input";


        input.value =
            object.name ||
            "Object";


        input.maxLength =
            60;


        nameElement.replaceWith(
            input
        );


        input.focus();
        input.select();


        let finished =
            false;


        const finish =
            save => {

                if (finished) {
                    return;
                }


                finished =
                    true;


                const nextName =
                    input.value
                        .trim();


                if (
                    save &&
                    nextName
                ) {

                    object.name =
                        nextName;


                    updateProperties(
                        object
                    );


                    setEditorStatus(
                        "Object renamed"
                    );

                }


                renderExplorer();

            };


        input.addEventListener(
            "click",
            event => {
                event.stopPropagation();
            }
        );


        input.addEventListener(
            "keydown",
            event => {

                event.stopPropagation();


                if (
                    event.key ===
                    "Enter"
                ) {

                    event.preventDefault();

                    finish(
                        true
                    );

                }

                else if (
                    event.key ===
                    "Escape"
                ) {

                    event.preventDefault();

                    finish(
                        false
                    );

                }

            }
        );


        input.addEventListener(
            "blur",
            () => {

                finish(
                    true
                );

            }
        );

    }


    function makeCopyName(
        sourceName
    ) {

        const baseName =
            `${sourceName || "Part"} Copy`;


        let candidate =
            baseName;


        let suffix =
            2;


        const names =
            new Set(
                sceneObjects.map(
                    object =>
                        object.name
                )
            );


        while (
            names.has(
                candidate
            )
        ) {

            candidate =
                `${baseName} ${suffix}`;


            suffix++;

        }


        return candidate;

    }


    function duplicateSelectedObject() {

        const source =
            selectedSceneObject;


        if (
            !source ||
            !sceneObjects.includes(
                source
            ) ||
            source.userData
                ?.locked
        ) {

            return;

        }


        const copy =
            source.clone();


        if (
            source.geometry &&
            typeof source.geometry.clone ===
            "function"
        ) {

            copy.geometry =
                source.geometry.clone();

        }


        if (
            Array.isArray(
                source.material
            )
        ) {

            copy.material =
                source.material.map(
                    material =>
                        material.clone()
                );

        }

        else if (
            source.material &&
            typeof source.material.clone ===
            "function"
        ) {

            copy.material =
                source.material.clone();

        }


        copy.name =
            makeCopyName(
                source.name
            );


        copy.position.x +=
            1;


        copy.position.z +=
            1;


        copy.userData = {
            ...source.userData,
            apexObject: true,
            locked: false
        };


        scene.add(
            copy
        );


        registerSceneObject(
            copy
        );


        renderExplorer();


        selectSceneObject(
            copy
        );


        setTool(
            "move"
        );


        updateObjectCount();


        setEditorStatus(
            "Object duplicated"
        );

    }


    function deleteSelectedObject() {

        const object =
            selectedSceneObject;


        if (
            !object ||
            !sceneObjects.includes(
                object
            ) ||
            object.userData
                ?.locked
        ) {

            return;

        }


        transformControls
            ?.detach();


        removeSelectionHelper();


        scene.remove(
            object
        );


        const index =
            sceneObjects.indexOf(
                object
            );


        if (
            index !==
            -1
        ) {

            sceneObjects.splice(
                index,
                1
            );

        }


        object.geometry
            ?.dispose();


        if (
            Array.isArray(
                object.material
            )
        ) {

            object.material.forEach(
                material => {
                    material.dispose();
                }
            );

        }

        else {

            object.material
                ?.dispose();

        }


        selectedSceneObject =
            null;


        clearTreeSelection();
        hideProperties();
        renderExplorer();
        updateObjectCount();


        setTool(
            "select"
        );


        setEditorStatus(
            "Object deleted"
        );

    }


    function ensureExplorerContextMenu() {

        if (
            explorerContextMenu
        ) {

            return;

        }


        explorerContextMenu =
            document.createElement(
                "div"
            );


        explorerContextMenu.className =
            "explorer-context-menu hidden";


        explorerContextMenu.innerHTML = `
            <button type="button" data-action="rename">
                Rename
            </button>

            <button type="button" data-action="duplicate">
                Duplicate
            </button>

            <div class="explorer-context-separator"></div>

            <button type="button" data-action="delete" class="danger-action">
                Delete
            </button>
        `;


        document.body.appendChild(
            explorerContextMenu
        );

    }


    function openExplorerContextMenu(
        clientX,
        clientY,
        object
    ) {

        ensureExplorerContextMenu();


        const locked =
            Boolean(
                object?.userData
                    ?.locked
            );


        const renameButton =
            explorerContextMenu
                .querySelector(
                    '[data-action="rename"]'
                );


        const duplicateButton =
            explorerContextMenu
                .querySelector(
                    '[data-action="duplicate"]'
                );


        const deleteButton =
            explorerContextMenu
                .querySelector(
                    '[data-action="delete"]'
                );


        renameButton.disabled =
            false;


        duplicateButton.disabled =
            locked;


        deleteButton.disabled =
            locked;


        renameButton.onclick =
            () => {

                closeExplorerContextMenu();

                beginRenameObject(
                    object
                );

            };


        duplicateButton.onclick =
            () => {

                closeExplorerContextMenu();

                duplicateSelectedObject();

            };


        deleteButton.onclick =
            () => {

                closeExplorerContextMenu();

                deleteSelectedObject();

            };


        explorerContextMenu
            .classList
            .remove(
                "hidden"
            );


        const menuWidth =
            explorerContextMenu
                .offsetWidth;


        const menuHeight =
            explorerContextMenu
                .offsetHeight;


        const left =
            Math.min(
                clientX,
                window.innerWidth -
                menuWidth -
                8
            );


        const top =
            Math.min(
                clientY,
                window.innerHeight -
                menuHeight -
                8
            );


        explorerContextMenu.style.left =
            `${Math.max(8, left)}px`;


        explorerContextMenu.style.top =
            `${Math.max(8, top)}px`;

    }


    function closeExplorerContextMenu() {

        explorerContextMenu
            ?.classList
            .add(
                "hidden"
            );

    }


    function setEditorStatus(
        message
    ) {

        if (!saveStatus) {

            return;

        }


        saveStatus.textContent =
            message;


        window.clearTimeout(
            setEditorStatus.timeoutId
        );


        window.clearTimeout(
            scriptSaveTimer
        );


        saveActiveScript();


        monacoInstance
            ?.dispose();


        monacoInstance =
            null;


        setEditorStatus.timeoutId =
            window.setTimeout(
                () => {

                    if (saveStatus) {

                        saveStatus.textContent =
                            "Ready";

                    }

                },
                1500
            );

    }


    /* =====================================================
       CAMERA
    ====================================================== */

    function resetCamera() {

        if (!camera) {

            return;

        }


        camera.position.set(
            16,
            13,
            18
        );


        if (controls) {

            controls.target.set(
                0,
                2,
                0
            );


            controls.update();

        }

        else {

            camera.lookAt(
                0,
                2,
                0
            );

        }

    }


    /* =====================================================
       ANIMATION
    ====================================================== */

    function animate() {

        animationFrame =
            requestAnimationFrame(
                animate
            );


        controls
            ?.update();


        updateSelectionHelper();


        if (
            renderer &&
            scene &&
            camera
        ) {

            renderer.render(
                scene,
                camera
            );

        }

    }


    /* =====================================================
       RESIZE
    ====================================================== */

    function resizeRenderer() {

        if (
            !renderer ||
            !camera ||
            !viewportContainer
        ) {

            return;

        }


        const width =
            viewportContainer
                .clientWidth;


        const height =
            viewportContainer
                .clientHeight;


        if (
            width <= 0 ||
            height <= 0
        ) {

            return;

        }


        renderer.setSize(
            width,
            height,
            false
        );


        camera.aspect =
            width /
            height;


        camera
            .updateProjectionMatrix();

    }


    /* =====================================================
       SCRIPT WORKSPACE - V0.4
    ====================================================== */

    function getScriptStorageKey() {

        return `apexcoder-game-scripts:${currentProject?.id || "unknown"}`;

    }


    function createDefaultScript() {

        return {
            id:
                createScriptId(),

            name:
                "GameManager.js",

            code:
`// ApexCoder Game Studio
// Project script foundation

export function start(context) {
    console.log("Game started", context);
}

export function update(context, deltaTime) {
    // Called every frame once runtime scripting is enabled.
}
`,

            createdAt:
                Date.now(),

            updatedAt:
                Date.now()
        };

    }


    function createScriptId() {

        if (
            window.crypto &&
            typeof window.crypto.randomUUID ===
            "function"
        ) {

            return window.crypto.randomUUID();

        }


        return `script-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    }


    function loadProjectScripts() {

        try {

            const raw =
                window.localStorage.getItem(
                    getScriptStorageKey()
                );


            const parsed =
                raw
                    ? JSON.parse(raw)
                    : null;


            if (
                Array.isArray(parsed) &&
                parsed.length > 0
            ) {

                projectScripts =
                    parsed.filter(
                        item =>
                            item &&
                            typeof item.id ===
                            "string" &&
                            typeof item.name ===
                            "string" &&
                            typeof item.code ===
                            "string"
                    );

            }

        }

        catch (error) {

            console.warn(
                "ApexCoder could not load local project scripts:",
                error
            );

        }


        if (
            projectScripts.length ===
            0
        ) {

            projectScripts = [
                createDefaultScript()
            ];


            persistProjectScripts();

        }


        activeScriptId =
            projectScripts[0]
                ?.id ||
            null;

    }


    function persistProjectScripts() {

        try {

            window.localStorage.setItem(
                getScriptStorageKey(),
                JSON.stringify(
                    projectScripts
                )
            );

        }

        catch (error) {

            console.error(
                "ApexCoder could not save local project scripts:",
                error
            );


            setScriptSaveState(
                "Save failed",
                false
            );

        }

    }


    function getActiveScript() {

        return projectScripts.find(
            script =>
                script.id ===
                activeScriptId
        ) || null;

    }


    function renderScriptList() {

        if (!scriptList) {
            return;
        }


        scriptList.innerHTML =
            "";


        projectScripts.forEach(
            script => {

                const button =
                    document.createElement(
                        "button"
                    );


                button.type =
                    "button";


                button.className =
                    "script-list-item";


                if (
                    script.id ===
                    activeScriptId
                ) {

                    button.classList.add(
                        "active"
                    );

                }


                button.innerHTML = `
                    <span class="script-list-icon">JS</span>
                    <span class="script-list-name"></span>
                `;


                button
                    .querySelector(
                        ".script-list-name"
                    )
                    .textContent =
                    script.name;


                button.addEventListener(
                    "click",
                    () => {

                        selectScript(
                            script.id
                        );

                    }
                );


                button.addEventListener(
                    "dblclick",
                    () => {

                        selectScript(
                            script.id
                        );


                        renameActiveScript();

                    }
                );


                scriptList.appendChild(
                    button
                );

            }
        );

    }


    function selectScript(
        scriptId
    ) {

        saveActiveScript();


        activeScriptId =
            scriptId;


        renderScriptList();


        syncActiveScriptToEditor();

    }


    function syncActiveScriptToEditor() {

        const script =
            getActiveScript();


        if (activeScriptName) {

            activeScriptName.textContent =
                script?.name ||
                "No script selected";

        }


        if (renameScriptButton) {

            renameScriptButton.disabled =
                !script;

        }


        if (deleteScriptButton) {

            deleteScriptButton.disabled =
                !script ||
                projectScripts.length <=
                1;

        }


        if (
            !monacoInstance ||
            !script
        ) {

            return;

        }


        suppressMonacoChange =
            true;


        monacoInstance.setValue(
            script.code ||
            ""
        );


        suppressMonacoChange =
            false;


        monacoInstance.focus();


        markScriptClean();

    }


    function normalizeScriptName(
        name
    ) {

        let value =
            String(
                name ||
                ""
            )
                .trim()
                .replace(
                    /[\\/:*?"<>|]+/g,
                    "-"
                );


        if (!value) {

            value =
                "Script";

        }


        if (
            !value
                .toLowerCase()
                .endsWith(
                    ".js"
                )
        ) {

            value +=
                ".js";

        }


        return value;

    }


    function getUniqueScriptName(
        requestedName,
        ignoredId = null
    ) {

        const normalized =
            normalizeScriptName(
                requestedName
            );


        const extension =
            ".js";


        const base =
            normalized.slice(
                0,
                -extension.length
            );


        let candidate =
            normalized;


        let counter =
            2;


        while (
            projectScripts.some(
                script =>
                    script.id !==
                    ignoredId &&
                    script.name
                        .toLowerCase() ===
                    candidate
                        .toLowerCase()
            )
        ) {

            candidate =
                `${base}${counter}${extension}`;


            counter++;

        }


        return candidate;

    }


    function createNewScript() {

        saveActiveScript();


        const requested =
            window.prompt(
                "New script name:",
                "Script.js"
            );


        if (requested === null) {
            return;
        }


        const name =
            getUniqueScriptName(
                requested
            );


        const script = {
            id:
                createScriptId(),

            name,

            code:
`// ${name}

export function start(context) {
    // Runs when the game starts.
}

export function update(context, deltaTime) {
    // Runs every frame once runtime scripting is enabled.
}
`,

            createdAt:
                Date.now(),

            updatedAt:
                Date.now()
        };


        projectScripts.push(
            script
        );


        activeScriptId =
            script.id;


        persistProjectScripts();


        renderScriptList();


        syncActiveScriptToEditor();


        setEditorStatus(
            `Created ${script.name}`
        );

    }


    function renameActiveScript() {

        const script =
            getActiveScript();


        if (!script) {
            return;
        }


        saveActiveScript();


        const requested =
            window.prompt(
                "Rename script:",
                script.name
            );


        if (requested === null) {
            return;
        }


        script.name =
            getUniqueScriptName(
                requested,
                script.id
            );


        script.updatedAt =
            Date.now();


        persistProjectScripts();


        renderScriptList();


        syncActiveScriptToEditor();


        setEditorStatus(
            "Script renamed"
        );

    }


    function deleteActiveScript() {

        const script =
            getActiveScript();


        if (
            !script ||
            projectScripts.length <=
            1
        ) {

            return;

        }


        const confirmed =
            window.confirm(
                `Delete ${script.name}?`
            );


        if (!confirmed) {
            return;
        }


        const index =
            projectScripts.findIndex(
                item =>
                    item.id ===
                    script.id
            );


        projectScripts.splice(
            index,
            1
        );


        activeScriptId =
            projectScripts[
                Math.max(
                    0,
                    index - 1
                )
            ]?.id ||
            projectScripts[0]?.id ||
            null;


        persistProjectScripts();


        renderScriptList();


        syncActiveScriptToEditor();


        setEditorStatus(
            "Script deleted"
        );

    }


    function markScriptDirty() {

        scriptDirtyDot
            ?.classList
            .remove(
                "hidden"
            );


        setScriptSaveState(
            "Unsaved"
        );

    }


    function markScriptClean() {

        scriptDirtyDot
            ?.classList
            .add(
                "hidden"
            );


        setScriptSaveState(
            "Saved locally"
        );

    }


    function setScriptSaveState(
        message
    ) {

        if (scriptSaveState) {

            scriptSaveState.textContent =
                message;

        }

    }


    function queueScriptSave() {

        window.clearTimeout(
            scriptSaveTimer
        );


        scriptSaveTimer =
            window.setTimeout(
                saveActiveScript,
                500
            );

    }


    function saveActiveScript() {

        const script =
            getActiveScript();


        if (
            !script ||
            !monacoInstance
        ) {

            return;

        }


        script.code =
            monacoInstance.getValue();


        script.updatedAt =
            Date.now();


        persistProjectScripts();


        markScriptClean();

    }


    function switchWorkspaceMode(
        mode
    ) {

        currentWorkspaceMode =
            mode ===
            "scripts"
                ? "scripts"
                : "viewport";


        const scriptsOpen =
            currentWorkspaceMode ===
            "scripts";


        viewportContainer
            ?.classList
            .toggle(
                "hidden",
                scriptsOpen
            );


        scriptWorkspace
            ?.classList
            .toggle(
                "hidden",
                !scriptsOpen
            );


        viewportTabButton
            ?.classList
            .toggle(
                "active",
                !scriptsOpen
            );


        scriptTabButton
            ?.classList
            .toggle(
                "active",
                scriptsOpen
            );


        sceneActivityButton
            ?.classList
            .toggle(
                "active",
                !scriptsOpen
            );


        scriptsActivityButton
            ?.classList
            .toggle(
                "active",
                scriptsOpen
            );


        viewportHints
            ?.classList
            .toggle(
                "hidden",
                scriptsOpen
            );


        scriptHeaderStatus
            ?.classList
            .toggle(
                "hidden",
                !scriptsOpen
            );


        if (scriptsOpen) {

            renderScriptList();


            ensureMonacoLoaded()
                .then(
                    () => {

                        syncActiveScriptToEditor();


                        window.setTimeout(
                            () => {

                                monacoInstance
                                    ?.layout();

                            },
                            0
                        );

                    }
                )
                .catch(
                    error => {

                        console.error(
                            "ApexCoder Monaco startup error:",
                            error
                        );


                        if (monacoFallbackText) {

                            monacoFallbackText.textContent =
                                "Monaco Editor could not load. Check your network connection.";

                        }

                    }
                );

        }

        else {

            requestAnimationFrame(
                resizeRenderer
            );

        }

    }


    function ensureMonacoLoaded() {

        if (monacoInstance) {

            return Promise.resolve(
                monacoInstance
            );

        }


        if (monacoLoadingPromise) {

            return monacoLoadingPromise;

        }


        monacoLoadingPromise =
            new Promise(
                (resolve, reject) => {

                    if (monacoFallbackText) {

                        monacoFallbackText.textContent =
                            "Loading Monaco Editor...";

                    }


                    const startMonaco =
                        () => {

                            if (
                                typeof window.require !==
                                "function" ||
                                typeof window.require.config !==
                                "function"
                            ) {

                                reject(
                                    new Error(
                                        "Monaco loader did not become available."
                                    )
                                );

                                return;

                            }


                            window.require.config({
                                paths: {
                                    vs:
                                        "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs"
                                }
                            });


                            window.require(
                                [
                                    "vs/editor/editor.main"
                                ],
                                () => {

                                    try {

                                        createMonacoEditor();


                                        resolve(
                                            monacoInstance
                                        );

                                    }

                                    catch (error) {

                                        reject(
                                            error
                                        );

                                    }

                                },
                                reject
                            );

                        };


                    if (
                        typeof window.require ===
                        "function" &&
                        typeof window.require.config ===
                        "function"
                    ) {

                        startMonaco();

                        return;

                    }


                    const existingLoader =
                        document.querySelector(
                            'script[data-apexcoder-monaco-loader="true"]'
                        );


                    if (existingLoader) {

                        existingLoader.addEventListener(
                            "load",
                            startMonaco,
                            {
                                once:
                                    true
                            }
                        );


                        existingLoader.addEventListener(
                            "error",
                            () => {

                                reject(
                                    new Error(
                                        "Monaco Editor could not be loaded."
                                    )
                                );

                            },
                            {
                                once:
                                    true
                            }
                        );


                        return;

                    }


                    const loaderScript =
                        document.createElement(
                            "script"
                        );


                    loaderScript.src =
                        "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs/loader.js";


                    loaderScript.async =
                        true;


                    loaderScript.dataset
                        .apexcoderMonacoLoader =
                        "true";


                    loaderScript.addEventListener(
                        "load",
                        startMonaco,
                        {
                            once:
                                true
                        }
                    );


                    loaderScript.addEventListener(
                        "error",
                        () => {

                            reject(
                                new Error(
                                    "Monaco Editor could not be loaded."
                                )
                            );

                        },
                        {
                            once:
                                true
                        }
                    );


                    document.head.appendChild(
                        loaderScript
                    );

                }
            )
                .catch(
                    error => {

                        monacoLoadingPromise =
                            null;


                        throw error;

                    }
                );


        return monacoLoadingPromise;

    }


    function createMonacoEditor() {

        if (
            monacoInstance ||
            !monacoEditorHost ||
            !window.monaco
        ) {

            return;

        }


        window.monaco.editor.defineTheme(
            "apexcoder-dark",
            {
                base:
                    "vs-dark",

                inherit:
                    true,

                rules: [],

                colors: {
                    "editor.background":
                        "#1e1e1e",
                    "editorLineNumber.foreground":
                        "#66676b",
                    "editorLineNumber.activeForeground":
                        "#c1c2c4",
                    "editor.selectionBackground":
                        "#3c4453",
                    "editor.inactiveSelectionBackground":
                        "#30353e"
                }
            }
        );


        monacoInstance =
            window.monaco.editor.create(
                monacoEditorHost,
                {
                    value:
                        "",

                    language:
                        "javascript",

                    theme:
                        "apexcoder-dark",

                    automaticLayout:
                        true,

                    minimap: {
                        enabled:
                            true
                    },

                    fontSize:
                        12,

                    lineHeight:
                        19,

                    fontFamily:
                        "SFMono-Regular, Consolas, 'Liberation Mono', monospace",

                    tabSize:
                        4,

                    insertSpaces:
                        true,

                    wordWrap:
                        "off",

                    smoothScrolling:
                        true,

                    scrollBeyondLastLine:
                        false,

                    renderWhitespace:
                        "selection",

                    bracketPairColorization: {
                        enabled:
                            true
                    },

                    guides: {
                        bracketPairs:
                            true,
                        indentation:
                            true
                    },

                    padding: {
                        top:
                            10
                    }
                }
            );


        monacoInstance.onDidChangeModelContent(
            () => {

                if (suppressMonacoChange) {
                    return;
                }


                markScriptDirty();


                queueScriptSave();

            }
        );


        monacoInstance.addCommand(
            window.monaco.KeyMod.CtrlCmd |
            window.monaco.KeyCode.KeyS,
            () => {

                saveActiveScript();


                setEditorStatus(
                    "Script saved"
                );

            }
        );


        monacoFallback
            ?.classList
            .add(
                "hidden"
            );


        syncActiveScriptToEditor();

    }


    /* =====================================================
       UI
    ====================================================== */

    function connectInterface() {

        resetCameraButton
            ?.addEventListener(
                "click",
                resetCamera
            );


        homeCameraButton
            ?.addEventListener(
                "click",
                resetCamera
            );


        workspaceTreeItem
            ?.addEventListener(
                "click",
                () => {

                    clearTreeSelection();


                    workspaceTreeItem
                        .classList
                        .add(
                            "selected"
                        );


                    selectedSceneObject =
                        null;


                    transformControls
                        ?.detach();


                    removeSelectionHelper();


                    showWorkspaceProperties();

                }
            );


        /* =============================
           ENABLE TOOLS
        ============================= */

        selectToolButton.disabled =
            false;


        moveToolButton.disabled =
            false;


        rotateToolButton.disabled =
            false;


        scaleToolButton.disabled =
            false;


        addPartButton.disabled =
            false;


        if (explorerAddButton) {

            explorerAddButton.disabled =
                false;

        }


        /* =============================
           TOOL EVENTS
        ============================= */

        selectToolButton
            .addEventListener(
                "click",
                () => {

                    setTool(
                        "select"
                    );

                }
            );


        moveToolButton
            .addEventListener(
                "click",
                () => {

                    setTool(
                        "move"
                    );

                }
            );


        rotateToolButton
            .addEventListener(
                "click",
                () => {

                    setTool(
                        "rotate"
                    );

                }
            );


        scaleToolButton
            .addEventListener(
                "click",
                () => {

                    setTool(
                        "scale"
                    );

                }
            );


        addPartButton
            .addEventListener(
                "click",
                addPart
            );


        explorerAddButton
            ?.addEventListener(
                "click",
                addPart
            );


        if (scriptsActivityButton) {

            scriptsActivityButton.disabled =
                false;

        }


        sceneActivityButton
            ?.addEventListener(
                "click",
                () =>
                    switchWorkspaceMode(
                        "viewport"
                    )
            );


        scriptsActivityButton
            ?.addEventListener(
                "click",
                () =>
                    switchWorkspaceMode(
                        "scripts"
                    )
            );


        viewportTabButton
            ?.addEventListener(
                "click",
                () =>
                    switchWorkspaceMode(
                        "viewport"
                    )
            );


        scriptTabButton
            ?.addEventListener(
                "click",
                () =>
                    switchWorkspaceMode(
                        "scripts"
                    )
            );


        newScriptButton
            ?.addEventListener(
                "click",
                createNewScript
            );


        renameScriptButton
            ?.addEventListener(
                "click",
                renameActiveScript
            );


        deleteScriptButton
            ?.addEventListener(
                "click",
                deleteActiveScript
            );


        const workspaceArrow =
            workspaceTreeItem
                ?.querySelector(
                    ".tree-arrow"
                );


        workspaceArrow
            ?.addEventListener(
                "click",
                event => {

                    event.preventDefault();
                    event.stopPropagation();

                    toggleExplorer();

                }
            );


        document.addEventListener(
            "pointerdown",
            event => {

                if (
                    explorerContextMenu &&
                    !explorerContextMenu
                        .contains(
                            event.target
                        )
                ) {

                    closeExplorerContextMenu();

                }

            }
        );


        window.addEventListener(
            "blur",
            closeExplorerContextMenu
        );


        /* =============================
           VIEWPORT
        ============================= */

        renderer
            .domElement
            .addEventListener(
                "pointerdown",
                handleViewportPointerDown
            );


        renderer
            .domElement
            .addEventListener(
                "contextmenu",
                event => {

                    event.preventDefault();

                }
            );


        /* =============================
           KEYBOARD
        ============================= */

        window.addEventListener(
            "keydown",
            handleKeyboardShortcuts
        );


        window.addEventListener(
            "beforeunload",
            cleanupEditor
        );

    }


    /* =====================================================
       KEYBOARD SHORTCUTS
    ====================================================== */

    function handleKeyboardShortcuts(
        event
    ) {

        if (
            event.target
                instanceof
                HTMLInputElement ||
            event.target
                instanceof
                HTMLTextAreaElement ||
            event.target
                ?.closest?.(
                    ".monaco-editor"
                )
        ) {

            return;

        }


        const key =
            event.key
                .toLowerCase();


        if (
            key ===
            "f2"
        ) {

            event.preventDefault();

            beginRenameObject(
                selectedSceneObject
            );

            return;

        }


        if (
            (
                event.ctrlKey ||
                event.metaKey
            ) &&
            key ===
            "d"
        ) {

            event.preventDefault();

            duplicateSelectedObject();

            return;

        }


        if (
            key ===
            "delete" ||
            key ===
            "backspace"
        ) {

            if (
                selectedSceneObject &&
                sceneObjects.includes(
                    selectedSceneObject
                ) &&
                !selectedSceneObject
                    .userData
                    ?.locked
            ) {

                event.preventDefault();

                deleteSelectedObject();

            }

            return;

        }


        if (
            key ===
            "q"
        ) {

            setTool(
                "select"
            );

        }


        else if (
            key ===
            "w"
        ) {

            setTool(
                "move"
            );

        }


        else if (
            key ===
            "e"
        ) {

            setTool(
                "rotate"
            );

        }


        else if (
            key ===
            "r"
        ) {

            setTool(
                "scale"
            );

        }

    }


    /* =====================================================
       PROPERTIES
    ====================================================== */

    function updateProperties(
        object,
        forcedType = null
    ) {

        if (!object) {

            hideProperties();

            return;

        }


        propertiesEmpty
            .classList
            .add(
                "hidden"
            );


        propertiesContent
            .classList
            .remove(
                "hidden"
            );


        propertyName.textContent =
            object.name ||
            "Object";


        propertyType.textContent =
            forcedType ||
            object.userData
                ?.objectType ||
            object.type ||
            "Object";


        propertyPosition.textContent =
            formatVector(
                object.position
            );


        propertyRotation.textContent =
            formatRotation(
                object.rotation
            );


        propertyScale.textContent =
            formatVector(
                object.scale
            );

    }


    function showWorkspaceProperties() {

        propertiesEmpty
            .classList
            .add(
                "hidden"
            );


        propertiesContent
            .classList
            .remove(
                "hidden"
            );


        propertyName.textContent =
            currentProject?.name ||
            "Workspace";


        propertyType.textContent =
            "Workspace";


        propertyPosition.textContent =
            "—";


        propertyRotation.textContent =
            "—";


        propertyScale.textContent =
            "—";

    }


    function showLightingProperties() {

        propertiesEmpty
            .classList
            .add(
                "hidden"
            );


        propertiesContent
            .classList
            .remove(
                "hidden"
            );


        propertyName.textContent =
            "Lighting";


        propertyType.textContent =
            "Environment";


        propertyPosition.textContent =
            "—";


        propertyRotation.textContent =
            "—";


        propertyScale.textContent =
            "—";

    }


    function hideProperties() {

        propertiesContent
            .classList
            .add(
                "hidden"
            );


        propertiesEmpty
            .classList
            .remove(
                "hidden"
            );

    }


    function formatVector(
        vector
    ) {

        if (!vector) {

            return "—";

        }


        return [
            cleanNumber(
                vector.x
            ),

            cleanNumber(
                vector.y
            ),

            cleanNumber(
                vector.z
            )
        ].join(
            ", "
        );

    }


    function formatRotation(
        rotation
    ) {

        if (!rotation) {

            return "—";

        }


        return [
            cleanNumber(
                THREE.MathUtils
                    .radToDeg(
                        rotation.x
                    )
            ),

            cleanNumber(
                THREE.MathUtils
                    .radToDeg(
                        rotation.y
                    )
            ),

            cleanNumber(
                THREE.MathUtils
                    .radToDeg(
                        rotation.z
                    )
            )
        ].join(
            ", "
        );

    }


    function cleanNumber(
        number
    ) {

        if (
            !Number.isFinite(
                number
            )
        ) {

            return "0";

        }


        const rounded =
            Math.round(
                number *
                100
            ) /
            100;


        if (
            Object.is(
                rounded,
                -0
            )
        ) {

            return "0";

        }


        return String(
            rounded
        );

    }


    /* =====================================================
       OBJECT COUNT
    ====================================================== */

    function updateObjectCount() {

        if (
            !objectCountStatus
        ) {

            return;

        }


        objectCountStatus.textContent =
            `${sceneObjects.length} ${
                sceneObjects.length ===
                1
                    ? "Object"
                    : "Objects"
            }`;

    }


    /* =====================================================
       SHOW EDITOR
    ====================================================== */

    function showEditor() {

        editorLoading
            .classList
            .add(
                "hidden"
            );


        errorScreen
            .classList
            .add(
                "hidden"
            );


        gameEditor
            .classList
            .remove(
                "hidden"
            );


        requestAnimationFrame(
            resizeRenderer
        );


        renderScriptList();


        syncActiveScriptToEditor();


        const starterPart =
            sceneObjects.find(
                object =>
                    object.userData
                        ?.objectType ===
                    "Part"
            );


        if (starterPart) {

            selectSceneObject(
                starterPart
            );

        }

        else {

            selectSceneObject(
                baseplate
            );

        }

    }


    /* =====================================================
       ERROR SCREEN
    ====================================================== */

    function showError(
        title,
        message
    ) {

        editorLoading
            .classList
            .add(
                "hidden"
            );


        gameEditor
            .classList
            .add(
                "hidden"
            );


        errorScreen
            .classList
            .remove(
                "hidden"
            );


        errorTitle.textContent =
            title;


        errorMessage.textContent =
            message;

    }


    /* =====================================================
       CLEANUP
    ====================================================== */

    function cleanupEditor() {

        if (animationFrame) {

            cancelAnimationFrame(
                animationFrame
            );

        }


        if (resizeObserver) {

            resizeObserver
                .disconnect();

        }


        window.clearTimeout(
            setEditorStatus.timeoutId
        );


        explorerContextMenu
            ?.remove();


        explorerContextMenu =
            null;

    }


})();

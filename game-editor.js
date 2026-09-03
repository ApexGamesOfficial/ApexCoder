/* =========================================================
   APEXCODER GAME EDITOR
   V0.2 — SELECTION + PARTS + TRANSFORM GIZMOS
========================================================= */

(() => {

    "use strict";


    /* =====================================================
       DOM
    ====================================================== */

    const editorLoading =
        document.getElementById("editorLoading");

    const errorScreen =
        document.getElementById("errorScreen");

    const errorTitle =
        document.getElementById("errorTitle");

    const errorMessage =
        document.getElementById("errorMessage");

    const gameEditor =
        document.getElementById("gameEditor");

    const projectName =
        document.getElementById("projectName");

    const explorerProjectName =
        document.getElementById("explorerProjectName");

    const statusProject =
        document.getElementById("statusProject");

    const rendererStatus =
        document.getElementById("rendererStatus");

    const objectCountStatus =
        document.getElementById("objectCountStatus");

    const viewportContainer =
        document.getElementById("viewportContainer");

    const canvas =
        document.getElementById("gameCanvas");

    const resetCameraButton =
        document.getElementById("resetCameraButton");

    const homeCameraButton =
        document.getElementById("homeCameraButton");

    const workspaceTreeItem =
        document.getElementById("workspaceTreeItem");

    const baseplateTreeItem =
        document.getElementById("baseplateTreeItem");

    const cameraTreeItem =
        document.getElementById("cameraTreeItem");

    const lightingTreeItem =
        document.getElementById("lightingTreeItem");

    const propertiesEmpty =
        document.getElementById("propertiesEmpty");

    const propertiesContent =
        document.getElementById("propertiesContent");

    const propertyName =
        document.getElementById("propertyName");

    const propertyType =
        document.getElementById("propertyType");

    const propertyPosition =
        document.getElementById("propertyPosition");

    const propertyRotation =
        document.getElementById("propertyRotation");

    const propertyScale =
        document.getElementById("propertyScale");

    const selectToolButton =
        document.getElementById("selectToolButton");

    const moveToolButton =
        document.getElementById("moveToolButton");

    const rotateToolButton =
        document.getElementById("rotateToolButton");

    const scaleToolButton =
        document.getElementById("scaleToolButton");

    const addPartButton =
        document.getElementById("addPartButton");


    /* =====================================================
       STATE
    ====================================================== */

    let currentSession = null;
    let currentProject = null;

    let THREE = null;
    let OrbitControls = null;
    let TransformControls = null;

    let renderer = null;
    let scene = null;
    let camera = null;
    let controls = null;
    let transformControls = null;

    let baseplate = null;
    let selectedSceneObject = null;

    let resizeObserver = null;
    let animationFrame = null;

    let raycaster = null;
    let pointer = null;

    let selectionHelper = null;

    let currentTool = "select";

    const sceneObjects = [];

    let partCounter = 1;


    /* =====================================================
       BOOT
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

            await loadThree();

            createStudioScene();

            connectInterface();

            renderExplorer();

            showEditor();

        } catch (error) {

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
       HELPERS
    ====================================================== */

    async function waitForSupabase() {

        const maxAttempts = 100;

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

            await sleep(50);

        }

        throw new Error(
            "ApexCoder could not connect to the account system."
        );

    }


    function sleep(milliseconds) {

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
            await supabaseClient.auth.getSession();

        if (error) {
            throw error;
        }

        currentSession =
            data?.session || null;

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
            parameters.get("project");

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
                .from("projects")
                .select(
                    "id, owner_id, name, type, created_at, updated_at"
                )
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
       LOAD THREE.JS
    ====================================================== */

    async function loadThree() {

        rendererStatus.textContent =
            "Loading 3D Engine";


        const threeModule =
            await import("three");

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
            orbitModule.OrbitControls;

        TransformControls =
            transformModule.TransformControls;


        rendererStatus.textContent =
            "Three.js";

    }


    /* =====================================================
       CREATE SCENE
    ====================================================== */

    function createStudioScene() {

        renderer =
            new THREE.WebGLRenderer({
                canvas,
                antialias: true
            });


        renderer.setPixelRatio(
            Math.min(
                window.devicePixelRatio || 1,
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


        camera =
            new THREE.PerspectiveCamera(
                55,
                1,
                0.1,
                1000
            );


        resetCamera();


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


        raycaster =
            new THREE.Raycaster();


        pointer =
            new THREE.Vector2();


        /* GRID */

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


        scene.add(grid);


        /* BASEPLATE */

        const baseplateGeometry =
            new THREE.BoxGeometry(
                40,
                0.5,
                40
            );


        const baseplateMaterial =
            new THREE.MeshStandardMaterial({
                color: 0x64666b,
                roughness: 0.9,
                metalness: 0
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


        scene.add(baseplate);


        registerSceneObject(
            baseplate
        );


        /* LIGHTING */

        const hemisphereLight =
            new THREE.HemisphereLight(
                0xffffff,
                0x35363a,
                1.45
            );


        hemisphereLight.userData.editorOnly =
            true;


        scene.add(
            hemisphereLight
        );


        const sunLight =
            new THREE.DirectionalLight(
                0xffffff,
                2.35
            );


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


        sunLight.userData.editorOnly =
            true;


        scene.add(
            sunLight
        );


        /* DEFAULT PART */

        const starterPart =
            createPartObject(
                "SpawnPart"
            );


        starterPart.position.set(
            0,
            0.5,
            0
        );


        scene.add(
            starterPart
        );


        registerSceneObject(
            starterPart
        );


        /* TRANSFORM CONTROLS */

        transformControls =
            new TransformControls(
                camera,
                renderer.domElement
            );


        transformControls.addEventListener(
            "dragging-changed",
            event => {

                controls.enabled =
                    !event.value;

            }
        );


        transformControls.addEventListener(
            "objectChange",
            () => {

                if (
                    selectedSceneObject
                ) {

                    updateProperties(
                        selectedSceneObject
                    );

                    updateSelectionHelper();

                }

            }
        );


        scene.add(
            transformControls
        );


        /* RESIZE */

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


        animate();


        updateObjectCount();

    }


    /* =====================================================
       PART CREATION
    ====================================================== */

    function createPartObject(
        name = null
    ) {

        const geometry =
            new THREE.BoxGeometry(
                2,
                2,
                2
            );


        const material =
            new THREE.MeshStandardMaterial({
                color: 0xb7b9bd,
                roughness: 0.72,
                metalness: 0
            });


        const part =
            new THREE.Mesh(
                geometry,
                material
            );


        part.name =
            name ||
            `Part${partCounter++}`;


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
                    direction.multiplyScalar(
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

    }


    /* =====================================================
       REGISTER OBJECT
    ====================================================== */

    function registerSceneObject(
        object
    ) {

        if (
            !sceneObjects.includes(
                object
            )
        ) {

            sceneObjects.push(
                object
            );

        }

    }


    /* =====================================================
       VIEWPORT SELECTION
    ====================================================== */

    function handleViewportPointerDown(
        event
    ) {

        if (
            transformControls?.dragging
        ) {
            return;
        }


        const rect =
            renderer.domElement
                .getBoundingClientRect();


        pointer.x =
            (
                (
                    event.clientX -
                    rect.left
                ) /
                rect.width
            ) * 2 - 1;


        pointer.y =
            -(
                (
                    event.clientY -
                    rect.top
                ) /
                rect.height
            ) * 2 + 1;


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
            intersections.length === 0
        ) {

            clearSelection();

            return;

        }


        const hit =
            intersections[0].object;


        selectSceneObject(
            hit
        );

    }


    /* =====================================================
       SELECTION
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
            object.userData?.locked
        ) {

            transformControls.detach();

            setTool(
                "select"
            );

        } else {

            attachTransformForCurrentTool();

        }

    }


    function clearSelection() {

        selectedSceneObject =
            null;


        transformControls.detach();


        removeSelectionHelper();


        clearTreeSelection();


        hideProperties();

    }


    /* =====================================================
       SELECTION HELPER
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


        selectionHelper.material.depthTest =
            false;


        selectionHelper.material.transparent =
            true;


        selectionHelper.material.opacity =
            0.8;


        selectionHelper.renderOrder =
            999;


        scene.add(
            selectionHelper
        );

    }


    function updateSelectionHelper() {

        if (
            selectionHelper &&
            selectedSceneObject
        ) {

            selectionHelper.update();

        }

    }


    function removeSelectionHelper() {

        if (!selectionHelper) {
            return;
        }


        scene.remove(
            selectionHelper
        );


        selectionHelper.geometry?.dispose();


        selectionHelper.material?.dispose();


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

        [
            selectToolButton,
            moveToolButton,
            rotateToolButton,
            scaleToolButton
        ].forEach(
            button => {
                button.classList.remove(
                    "active"
                );
            }
        );


        if (
            currentTool === "select"
        ) {

            selectToolButton.classList.add(
                "active"
            );

        }


        if (
            currentTool === "move"
        ) {

            moveToolButton.classList.add(
                "active"
            );

        }


        if (
            currentTool === "rotate"
        ) {

            rotateToolButton.classList.add(
                "active"
            );

        }


        if (
            currentTool === "scale"
        ) {

            scaleToolButton.classList.add(
                "active"
            );

        }

    }


    function attachTransformForCurrentTool() {

        if (
            !selectedSceneObject ||
            selectedSceneObject.userData?.locked
        ) {

            transformControls.detach();

            return;

        }


        if (
            currentTool === "select"
        ) {

            transformControls.detach();

            return;

        }


        transformControls.attach(
            selectedSceneObject
        );


        if (
            currentTool === "move"
        ) {

            transformControls.setMode(
                "translate"
            );

        }


        if (
            currentTool === "rotate"
        ) {

            transformControls.setMode(
                "rotate"
            );

        }


        if (
            currentTool === "scale"
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


        treeChildren.innerHTML = "";


        sceneObjects.forEach(
            object => {

                const button =
                    document.createElement(
                        "button"
                    );


                button.className =
                    "tree-item child-item";


                button.type =
                    "button";


                button.dataset.objectName =
                    object.name;


                button.innerHTML = `
                    <span class="tree-indent"></span>

                    <span class="tree-icon">
                        ${
                            object.userData
                                ?.objectType ===
                            "Baseplate"
                                ? "▣"
                                : "■"
                        }
                    </span>

                    <span class="tree-name"></span>
                `;


                button
                    .querySelector(
                        ".tree-name"
                    )
                    .textContent =
                    object.name;


                button.addEventListener(
                    "click",
                    () => {

                        selectSceneObject(
                            object
                        );

                    }
                );


                treeChildren.appendChild(
                    button
                );

            }
        );


        /* CAMERA */

        const cameraButton =
            createSpecialTreeItem(
                "◉",
                "Camera"
            );


        cameraButton.addEventListener(
            "click",
            () => {

                clearTreeSelection();

                cameraButton.classList.add(
                    "selected"
                );

                selectedSceneObject =
                    camera;

                transformControls.detach();

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


        /* LIGHTING */

        const lightingButton =
            createSpecialTreeItem(
                "☀",
                "Lighting"
            );


        lightingButton.addEventListener(
            "click",
            () => {

                clearTreeSelection();

                lightingButton.classList.add(
                    "selected"
                );

                selectedSceneObject =
                    null;

                transformControls.detach();

                removeSelectionHelper();

                showLightingProperties();

            }
        );


        treeChildren.appendChild(
            lightingButton
        );

    }


    function createSpecialTreeItem(
        icon,
        name
    ) {

        const button =
            document.createElement(
                "button"
            );


        button.className =
            "tree-item child-item";


        button.type =
            "button";


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


        const items =
            document.querySelectorAll(
                ".tree-item"
            );


        items.forEach(
            item => {

                if (
                    item.dataset.objectName ===
                    object.name
                ) {

                    item.classList.add(
                        "selected"
                    );

                }

            }
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

        } else {

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


        if (controls) {

            controls.update();

        }


        updateSelectionHelper();


        renderer.render(
            scene,
            camera
        );

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
            viewportContainer.clientWidth;


        const height =
            viewportContainer.clientHeight;


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
            width / height;


        camera.updateProjectionMatrix();

    }


    /* =====================================================
       UI EVENTS
    ====================================================== */

    function connectInterface() {

        resetCameraButton.addEventListener(
            "click",
            resetCamera
        );


        homeCameraButton.addEventListener(
            "click",
            resetCamera
        );


        workspaceTreeItem.addEventListener(
            "click",
            () => {

                clearTreeSelection();

                workspaceTreeItem.classList.add(
                    "selected"
                );

                selectedSceneObject =
                    null;

                transformControls.detach();

                removeSelectionHelper();

                showWorkspaceProperties();

            }
        );


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


        selectToolButton.addEventListener(
            "click",
            () => {
                setTool("select");
            }
        );


        moveToolButton.addEventListener(
            "click",
            () => {
                setTool("move");
            }
        );


        rotateToolButton.addEventListener(
            "click",
            () => {
                setTool("rotate");
            }
        );


        scaleToolButton.addEventListener(
            "click",
            () => {
                setTool("scale");
            }
        );


        addPartButton.addEventListener(
            "click",
            addPart
        );


        renderer.domElement.addEventListener(
            "pointerdown",
            handleViewportPointerDown
        );


        renderer.domElement.addEventListener(
            "contextmenu",
            event => {

                event.preventDefault();

            }
        );


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
       SHORTCUTS
    ====================================================== */

    function handleKeyboardShortcuts(
        event
    ) {

        if (
            event.target instanceof
            HTMLInputElement
        ) {
            return;
        }


        const key =
            event.key.toLowerCase();


        if (
            key === "q"
        ) {

            setTool(
                "select"
            );

        }


        if (
            key === "w"
        ) {

            setTool(
                "move"
            );

        }


        if (
            key === "e"
        ) {

            setTool(
                "rotate"
            );

        }


        if (
            key === "r"
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


        propertiesEmpty.classList.add(
            "hidden"
        );


        propertiesContent.classList.remove(
            "hidden"
        );


        propertyName.textContent =
            object.name ||
            "Object";


        propertyType.textContent =
            forcedType ||
            object.userData?.objectType ||
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

        propertiesEmpty.classList.add(
            "hidden"
        );


        propertiesContent.classList.remove(
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

        propertiesEmpty.classList.add(
            "hidden"
        );


        propertiesContent.classList.remove(
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

        propertiesContent.classList.add(
            "hidden"
        );


        propertiesEmpty.classList.remove(
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
            cleanNumber(vector.x),
            cleanNumber(vector.y),
            cleanNumber(vector.z)
        ].join(", ");

    }


    function formatRotation(
        rotation
    ) {

        if (!rotation) {
            return "—";
        }


        return [
            cleanNumber(
                THREE.MathUtils.radToDeg(
                    rotation.x
                )
            ),

            cleanNumber(
                THREE.MathUtils.radToDeg(
                    rotation.y
                )
            ),

            cleanNumber(
                THREE.MathUtils.radToDeg(
                    rotation.z
                )
            )
        ].join(", ");

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
                number * 100
            ) / 100;


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

        objectCountStatus.textContent =
            `${sceneObjects.length} ${
                sceneObjects.length === 1
                    ? "Object"
                    : "Objects"
            }`;

    }


    /* =====================================================
       SHOW EDITOR
    ====================================================== */

    function showEditor() {

        editorLoading.classList.add(
            "hidden"
        );


        errorScreen.classList.add(
            "hidden"
        );


        gameEditor.classList.remove(
            "hidden"
        );


        requestAnimationFrame(
            resizeRenderer
        );


        selectSceneObject(
            sceneObjects[1] ||
            baseplate
        );

    }


    /* =====================================================
       ERROR
    ====================================================== */

    function showError(
        title,
        message
    ) {

        editorLoading.classList.add(
            "hidden"
        );


        gameEditor.classList.add(
            "hidden"
        );


        errorScreen.classList.remove(
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

            resizeObserver.disconnect();

        }

    }


})();

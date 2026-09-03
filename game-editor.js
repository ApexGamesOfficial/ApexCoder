/* =========================================================
   APEXCODER GAME EDITOR
   V0.1 — FOUNDATION
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


    /* =====================================================
       STATE
    ====================================================== */

    let currentSession = null;

    let currentProject = null;

    let THREE = null;

    let OrbitControls = null;

    let renderer = null;

    let scene = null;

    let camera = null;

    let controls = null;

    let baseplate = null;

    let selectedSceneObject = null;

    let resizeObserver = null;

    let animationFrame = null;


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
       WAIT FOR AUTH.JS
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
            await import(
                "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js"
            );


        const controlsModule =
            await import(
                "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/controls/OrbitControls.js"
            );


        THREE =
            threeModule;


        OrbitControls =
            controlsModule.OrbitControls;


        rendererStatus.textContent =
            "Three.js";

    }


    /* =====================================================
       CREATE SCENE
    ====================================================== */

    function createStudioScene() {

        if (
            !THREE ||
            !OrbitControls
        ) {

            throw new Error(
                "The 3D engine did not load correctly."
            );

        }


        /* =================================================
           RENDERER
        ================================================== */

        renderer =
            new THREE.WebGLRenderer({
                canvas,
                antialias: true,
                alpha: false
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


        /* =================================================
           SCENE
        ================================================== */

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


        /* =================================================
           CAMERA
        ================================================== */

        camera =
            new THREE.PerspectiveCamera(
                55,
                1,
                0.1,
                1000
            );


        resetCamera();


        /* =================================================
           ORBIT CONTROLS
        ================================================== */

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


        /* =================================================
           GRID
        ================================================== */

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


        /* =================================================
           BASEPLATE
        ================================================== */

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


        scene.add(
            baseplate
        );


        /* =================================================
           LIGHTING
        ================================================== */

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


        /* =================================================
           ORIGIN MARKER
        ================================================== */

        const originGeometry =
            new THREE.BoxGeometry(
                1,
                1,
                1
            );


        const originMaterial =
            new THREE.MeshStandardMaterial({
                color: 0xb2b4b9,
                roughness: 0.65
            });


        const originPart =
            new THREE.Mesh(
                originGeometry,
                originMaterial
            );


        originPart.name =
            "SpawnPart";


        originPart.position.set(
            0,
            0.5,
            0
        );


        originPart.castShadow =
            true;


        originPart.receiveShadow =
            true;


        originPart.userData.apexObject =
            true;


        originPart.userData.objectType =
            "Part";


        scene.add(
            originPart
        );


        /* =================================================
           RESIZE
        ================================================== */

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


        /* =================================================
           ANIMATION
        ================================================== */

        animate();


        updateObjectCount();

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
       RENDER LOOP
    ====================================================== */

    function animate() {

        animationFrame =
            requestAnimationFrame(
                animate
            );


        if (controls) {
            controls.update();
        }


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
       CONNECT UI
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

                showWorkspaceProperties();

            }
        );


        baseplateTreeItem.addEventListener(
            "click",
            () => {

                selectTreeObject(
                    baseplateTreeItem,
                    baseplate
                );

            }
        );


        cameraTreeItem.addEventListener(
            "click",
            () => {

                clearTreeSelection();

                cameraTreeItem.classList.add(
                    "selected"
                );

                selectedSceneObject =
                    camera;

                updateProperties(
                    camera,
                    "Camera"
                );

            }
        );


        lightingTreeItem.addEventListener(
            "click",
            () => {

                clearTreeSelection();

                lightingTreeItem.classList.add(
                    "selected"
                );

                selectedSceneObject =
                    null;

                showLightingProperties();

            }
        );


        renderer.domElement.addEventListener(
            "contextmenu",
            event => {
                event.preventDefault();
            }
        );


        window.addEventListener(
            "beforeunload",
            cleanupEditor
        );


        /* Default selection */

        baseplateTreeItem.click();

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


    function selectTreeObject(
        treeItem,
        sceneObject
    ) {

        clearTreeSelection();


        treeItem.classList.add(
            "selected"
        );


        selectedSceneObject =
            sceneObject;


        updateProperties(
            sceneObject
        );

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


    function formatVector(vector) {

        if (!vector) {
            return "—";
        }


        return [
            cleanNumber(vector.x),
            cleanNumber(vector.y),
            cleanNumber(vector.z)
        ].join(", ");

    }


    function formatRotation(rotation) {

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


    function cleanNumber(number) {

        if (
            !Number.isFinite(number)
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

        if (
            !scene ||
            !objectCountStatus
        ) {
            return;
        }


        let count = 0;


        scene.traverse(
            object => {

                if (
                    object.userData?.apexObject
                ) {
                    count++;
                }

            }
        );


        objectCountStatus.textContent =
            `${count} ${
                count === 1
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

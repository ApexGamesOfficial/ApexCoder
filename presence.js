let presenceChannel = null;

let presenceUser = null;

let manualStatus = "online";

let realtimeUsers = new Map();


/* =========================
   START PRESENCE
========================= */

async function startPresence() {

    const {
        data: { session }
    } =
        await supabaseClient
            .auth
            .getSession();


    if (!session?.user) {
        return;
    }


    presenceUser =
        session.user;


    await loadManualStatus();


    presenceChannel =
        supabaseClient.channel(
            "apex-online-users",
            {
                config: {
                    presence: {
                        key:
                            presenceUser.id
                    }
                }
            }
        );


    presenceChannel
        .on(
            "presence",
            {
                event: "sync"
            },
            handlePresenceSync
        )
        .on(
            "presence",
            {
                event: "join"
            },
            handlePresenceSync
        )
        .on(
            "presence",
            {
                event: "leave"
            },
            handlePresenceSync
        );


    await presenceChannel.subscribe(
        async status => {

            if (
                status ===
                "SUBSCRIBED"
            ) {

                await updatePresence();
            }
        }
    );
}


/* =========================
   MANUAL STATUS
========================= */

async function loadManualStatus() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("profiles")
            .select("status")
            .eq(
                "id",
                presenceUser.id
            )
            .single();


    if (error || !data) {

        manualStatus =
            "online";

        return;
    }


    manualStatus =
        normalizeManualStatus(
            data.status
        );
}


function normalizeManualStatus(
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


/* =========================
   UPDATE PRESENCE
========================= */

async function updatePresence() {

    if (
        !presenceChannel ||
        !presenceUser
    ) {
        return;
    }


    /*
        "offline" means
        Appear Offline.

        They are connected,
        but we do NOT expose
        them as online.
    */

    if (
        manualStatus ===
        "offline"
    ) {

        await presenceChannel.untrack();

        return;
    }


    await presenceChannel.track({
        user_id:
            presenceUser.id,

        status:
            manualStatus,

        online_at:
            new Date()
                .toISOString()
    });
}


/* =========================
   SET STATUS
========================= */

async function setPresenceStatus(
    newStatus
) {

    const allowed = [
        "online",
        "away",
        "dnd",
        "offline"
    ];


    if (
        !allowed.includes(
            newStatus
        )
    ) {
        return false;
    }


    if (!presenceUser) {
        return false;
    }


    const {
        error
    } =
        await supabaseClient
            .from("profiles")
            .update({
                status:
                    newStatus,

                updated_at:
                    new Date()
                        .toISOString()
            })
            .eq(
                "id",
                presenceUser.id
            );


    if (error) {

        console.error(
            "Unable to update status:",
            error
        );

        return false;
    }


    manualStatus =
        newStatus;


    await updatePresence();


    return true;
}


/* =========================
   PRESENCE SYNC
========================= */

function handlePresenceSync() {

    if (!presenceChannel) {
        return;
    }


    const state =
        presenceChannel
            .presenceState();


    realtimeUsers =
        new Map();


    Object.values(state)
        .flat()
        .forEach(entry => {

            if (
                !entry?.user_id
            ) {
                return;
            }


            realtimeUsers.set(
                entry.user_id,
                {
                    user_id:
                        entry.user_id,

                    status:
                        normalizeLiveStatus(
                            entry.status
                        ),

                    online_at:
                        entry.online_at ||
                        null
                }
            );
        });


    window.dispatchEvent(
        new CustomEvent(
            "apex-presence-updated",
            {
                detail: {
                    users:
                        realtimeUsers
                }
            }
        )
    );
}


/* =========================
   STATUS HELPERS
========================= */

function normalizeLiveStatus(
    status
) {

    if (
        status === "online" ||
        status === "away" ||
        status === "dnd"
    ) {
        return status;
    }


    return "online";
}


function getLiveStatus(
    userId
) {

    const entry =
        realtimeUsers.get(
            userId
        );


    if (!entry) {
        return "offline";
    }


    return entry.status;
}


function isUserOnline(
    userId
) {

    return realtimeUsers.has(
        userId
    );
}


/* =========================
   CLEANUP
========================= */

async function stopPresence() {

    if (!presenceChannel) {
        return;
    }


    try {

        await presenceChannel
            .untrack();

    } catch (error) {

        console.warn(
            "Unable to untrack presence:",
            error
        );
    }


    try {

        await supabaseClient
            .removeChannel(
                presenceChannel
            );

    } catch (error) {

        console.warn(
            "Unable to remove presence channel:",
            error
        );
    }


    presenceChannel =
        null;


    realtimeUsers =
        new Map();
}


/* =========================
   PAGE EXIT
========================= */

window.addEventListener(
    "pagehide",
    () => {

        stopPresence();
    }
);


/* =========================
   START
========================= */

startPresence();

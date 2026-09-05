/* =========================================================
   APEX PRESENCE
   Shared Supabase Realtime Presence system

   Provides:
   - getLiveStatus(userId)
   - setLiveStatus(status)
   - apex-presence-updated event

   Real connection state determines whether somebody
   is actually online. If they disconnect, they become Offline.
========================================================= */


/* =========================================================
   SETTINGS
========================================================= */

const APEX_PRESENCE_CHANNEL =
    "apex-games-global-presence";

const VALID_PRESENCE_STATUSES =
    [
        "online",
        "away",
        "dnd",
        "offline"
    ];

const PRESENCE_STORAGE_KEY =
    "apexPreferredStatus";


/* =========================================================
   STATE
========================================================= */

let apexPresenceChannel =
    null;

let apexPresenceUser =
    null;

let apexPresenceStatus =
    "online";

let apexPresenceReady =
    false;

let apexPresenceState =
    {};


/* =========================================================
   STATUS HELPERS
========================================================= */

function normalizePresenceStatus(
    status
) {

    if (
        VALID_PRESENCE_STATUSES.includes(
            status
        )
    ) {

        return status;
    }


    return "online";
}


/* =========================================================
   PUBLIC LIVE STATUS
========================================================= */

function getLiveStatus(
    userId
) {

    if (!userId) {

        return "offline";
    }


    const entries =
        apexPresenceState[
            userId
        ];


    if (
        !Array.isArray(entries) ||
        entries.length === 0
    ) {

        return "offline";
    }


    /*
        A user can have multiple tabs/devices.

        We use the newest active Presence entry.
    */

    const sortedEntries =
        [...entries].sort(
            (a, b) => {

                const aTime =
                    Number(
                        a.status_updated_at ||
                        a.online_at ||
                        0
                    );


                const bTime =
                    Number(
                        b.status_updated_at ||
                        b.online_at ||
                        0
                    );


                return (
                    bTime -
                    aTime
                );
            }
        );


    const newest =
        sortedEntries[0];


    if (!newest) {

        return "offline";
    }


    const status =
        normalizePresenceStatus(
            newest.status
        );


    /*
        User is technically connected,
        but they chose "Appear Offline".
    */

    if (
        status ===
        "offline"
    ) {

        return "offline";
    }


    return status;
}


/* =========================================================
   EXPOSE PUBLIC FUNCTION
========================================================= */

window.getLiveStatus =
    getLiveStatus;


/* =========================================================
   DISPATCH UPDATE EVENT
========================================================= */

function dispatchPresenceUpdate() {

    window.dispatchEvent(
        new CustomEvent(
            "apex-presence-updated",
            {
                detail: {
                    state:
                        apexPresenceState
                }
            }
        )
    );
}


/* =========================================================
   READ SAVED STATUS
========================================================= */

async function loadPreferredPresenceStatus() {

    /*
        First try localStorage.

        This makes status changes update quickly
        across Apex pages.
    */

    const storedStatus =
        localStorage.getItem(
            PRESENCE_STORAGE_KEY
        );


    if (
        VALID_PRESENCE_STATUSES.includes(
            storedStatus
        )
    ) {

        apexPresenceStatus =
            storedStatus;

        return;
    }


    /*
        If nothing was stored locally,
        read the user's profile preference.
    */

    if (!apexPresenceUser) {

        apexPresenceStatus =
            "online";

        return;
    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from(
                "profiles"
            )
            .select(
                "status"
            )
            .eq(
                "id",
                apexPresenceUser.id
            )
            .maybeSingle();


    if (
        error
    ) {

        console.warn(
            "Unable to load Presence preference:",
            error
        );


        apexPresenceStatus =
            "online";

        return;
    }


    apexPresenceStatus =
        normalizePresenceStatus(
            data?.status ||
            "online"
        );


    localStorage.setItem(
        PRESENCE_STORAGE_KEY,
        apexPresenceStatus
    );
}


/* =========================================================
   CREATE PRESENCE PAYLOAD
========================================================= */

function buildPresencePayload() {

    return {
        user_id:
            apexPresenceUser.id,

        status:
            apexPresenceStatus,

        online_at:
            Date.now(),

        status_updated_at:
            Date.now()
    };
}


/* =========================================================
   TRACK CURRENT USER
========================================================= */

async function trackCurrentPresence() {

    if (
        !apexPresenceChannel ||
        !apexPresenceUser ||
        !apexPresenceReady
    ) {

        return;
    }


    const {
        error
    } =
        await apexPresenceChannel
            .track(
                buildPresencePayload()
            );


    if (
        error
    ) {

        console.error(
            "Unable to track Apex Presence:",
            error
        );
    }
}


/* =========================================================
   UPDATE STATUS
========================================================= */

async function setLiveStatus(
    newStatus
) {

    const normalized =
        normalizePresenceStatus(
            newStatus
        );


    apexPresenceStatus =
        normalized;


    localStorage.setItem(
        PRESENCE_STORAGE_KEY,
        normalized
    );


    /*
        Save preference to profile.

        Presence still decides whether the
        user is ACTUALLY connected.
    */

    if (
        apexPresenceUser
    ) {

        const {
            error
        } =
            await supabaseClient
                .from(
                    "profiles"
                )
                .update({
                    status:
                        normalized,

                    updated_at:
                        new Date()
                            .toISOString()
                })
                .eq(
                    "id",
                    apexPresenceUser.id
                );


        if (
            error
        ) {

            console.warn(
                "Unable to save Presence preference:",
                error
            );
        }
    }


    await trackCurrentPresence();


    dispatchPresenceUpdate();


    return normalized;
}


/* =========================================================
   EXPOSE STATUS SETTER
========================================================= */

window.setLiveStatus =
    setLiveStatus;


/* =========================================================
   SYNC PRESENCE STATE
========================================================= */

function syncPresenceState() {

    if (
        !apexPresenceChannel
    ) {

        return;
    }


    apexPresenceState =
        apexPresenceChannel
            .presenceState() ||
        {};


    dispatchPresenceUpdate();
}


/* =========================================================
   START PRESENCE
========================================================= */

async function startApexPresence() {

    if (
        typeof supabaseClient ===
        "undefined"
    ) {

        console.error(
            "Apex Presence could not start because Supabase is unavailable."
        );

        return;
    }


    const {
        data: {
            session
        },
        error
    } =
        await supabaseClient
            .auth
            .getSession();


    if (
        error
    ) {

        console.error(
            "Unable to read Apex session:",
            error
        );

        return;
    }


    if (
        !session?.user
    ) {

        apexPresenceUser =
            null;

        apexPresenceState =
            {};

        dispatchPresenceUpdate();

        return;
    }


    apexPresenceUser =
        session.user;


    await loadPreferredPresenceStatus();


    /*
        Remove any previous channel before
        creating another one.
    */

    if (
        apexPresenceChannel
    ) {

        try {

            await supabaseClient
                .removeChannel(
                    apexPresenceChannel
                );

        } catch (
            error
        ) {

            console.warn(
                "Unable to remove old Presence channel:",
                error
            );
        }
    }


    apexPresenceChannel =
        supabaseClient.channel(
            APEX_PRESENCE_CHANNEL,
            {
                config: {
                    presence: {
                        key:
                            apexPresenceUser.id
                    }
                }
            }
        );


    /* =====================================================
       PRESENCE SYNC
    ===================================================== */

    apexPresenceChannel.on(
        "presence",
        {
            event:
                "sync"
        },
        () => {

            syncPresenceState();
        }
    );


    /* =====================================================
       PRESENCE JOIN
    ===================================================== */

    apexPresenceChannel.on(
        "presence",
        {
            event:
                "join"
        },
        () => {

            syncPresenceState();
        }
    );


    /* =====================================================
       PRESENCE LEAVE
    ===================================================== */

    apexPresenceChannel.on(
        "presence",
        {
            event:
                "leave"
        },
        () => {

            syncPresenceState();
        }
    );


    /* =====================================================
       SUBSCRIBE
    ===================================================== */

    apexPresenceChannel.subscribe(
        async status => {

            if (
                status ===
                "SUBSCRIBED"
            ) {

                apexPresenceReady =
                    true;


                await trackCurrentPresence();


                syncPresenceState();


                return;
            }


            if (
                status ===
                "CHANNEL_ERROR"
            ) {

                console.error(
                    "Apex Presence channel error."
                );

                apexPresenceReady =
                    false;

                return;
            }


            if (
                status ===
                "TIMED_OUT"
            ) {

                console.warn(
                    "Apex Presence connection timed out."
                );

                apexPresenceReady =
                    false;

                return;
            }


            if (
                status ===
                "CLOSED"
            ) {

                apexPresenceReady =
                    false;
            }
        }
    );
}


/* =========================================================
   CROSS-TAB STATUS SYNC
========================================================= */

window.addEventListener(
    "storage",
    async event => {

        if (
            event.key !==
            PRESENCE_STORAGE_KEY
        ) {

            return;
        }


        apexPresenceStatus =
            normalizePresenceStatus(
                event.newValue
            );


        await trackCurrentPresence();


        dispatchPresenceUpdate();
    }
);


/* =========================================================
   AUTH CHANGES
========================================================= */

supabaseClient.auth.onAuthStateChange(
    async (
        event,
        session
    ) => {

        if (
            event ===
            "SIGNED_OUT"
        ) {

            apexPresenceReady =
                false;

            apexPresenceUser =
                null;

            apexPresenceState =
                {};


            if (
                apexPresenceChannel
            ) {

                try {

                    await apexPresenceChannel
                        .untrack();

                } catch (
                    error
                ) {

                    console.warn(
                        "Unable to untrack Presence:",
                        error
                    );
                }


                try {

                    await supabaseClient
                        .removeChannel(
                            apexPresenceChannel
                        );

                } catch (
                    error
                ) {

                    console.warn(
                        "Unable to close Presence channel:",
                        error
                    );
                }


                apexPresenceChannel =
                    null;
            }


            dispatchPresenceUpdate();

            return;
        }


        if (
            event ===
                "SIGNED_IN" &&
            session?.user &&
            apexPresenceUser?.id !==
                session.user.id
        ) {

            await startApexPresence();
        }
    }
);


/* =========================================================
   PAGE CLEANUP
========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        /*
            Supabase removes the Presence member
            when the realtime connection closes.

            We deliberately DO NOT write "offline"
            into profiles here.

            profiles.status = user preference
            Presence = actual live connection
        */

        if (
            apexPresenceChannel
        ) {

            apexPresenceChannel
                .untrack()
                .catch(
                    () => {}
                );
        }
    }
);


/* =========================================================
   START
========================================================= */

startApexPresence();

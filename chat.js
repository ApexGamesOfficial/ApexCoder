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

const friendSearch =
    document.getElementById(
        "friendSearch"
    );

const friendsList =
    document.getElementById(
        "friendsList"
    );

const conversationEmpty =
    document.getElementById(
        "conversationEmpty"
    );

const conversation =
    document.getElementById(
        "conversation"
    );

const conversationAvatar =
    document.getElementById(
        "conversationAvatar"
    );

const conversationName =
    document.getElementById(
        "conversationName"
    );

const conversationStatus =
    document.getElementById(
        "conversationStatus"
    );

const conversationStatusText =
    document.getElementById(
        "conversationStatusText"
    );

const messages =
    document.getElementById(
        "messages"
    );

const messageForm =
    document.getElementById(
        "messageForm"
    );

const messageInput =
    document.getElementById(
        "messageInput"
    );

const sendButton =
    document.getElementById(
        "sendButton"
    );


let currentUser = null;

let friends = [];

let selectedFriend = null;

let messageRefreshTimer = null;

let lastMessageSignature = "";


/* =========================
   ACCOUNT
========================= */

async function startChat() {

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


    await Promise.all([
        loadAccount(),
        loadFriends()
    ]);


    openFriendFromURL();
}


/* =========================
   LOAD ACCOUNT
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


    if (error || !profile) {

        console.error(
            "Unable to load account:",
            error
        );


        accountGamertag.textContent =
            "Account";


        return;
    }


    accountGamertag.textContent =
        profile.gamertag;


    accountAvatar.src =
        profile.avatar_url ||
        "Default Apex Games Profile Picture.png";
}


/* =========================
   LOAD FRIENDS
========================= */

async function loadFriends() {

    const {
        data: relationships,
        error
    } =
        await supabaseClient
            .from("friend_requests")
            .select(`
                sender_id,
                receiver_id,
                status
            `)
            .eq(
                "status",
                "accepted"
            )
            .or(
                `sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`
            );


    if (error) {

        console.error(
            "Unable to load friends:",
            error
        );


        friendsList.innerHTML = `
            <p class="no-friends">
                Unable to load friends.
            </p>
        `;


        return;
    }


    const friendIds =
        (relationships || [])
            .map(relationship => {

                if (
                    relationship.sender_id ===
                    currentUser.id
                ) {
                    return relationship.receiver_id;
                }


                return relationship.sender_id;
            });


    const uniqueFriendIds =
        [...new Set(friendIds)];


    if (
        uniqueFriendIds.length === 0
    ) {

        friends = [];

        renderFriends();

        return;
    }


    const {
        data: profiles,
        error: profileError
    } =
        await supabaseClient
            .from("profiles")
            .select(`
                id,
                gamertag,
                display_name,
                avatar_url,
                status
            `)
            .in(
                "id",
                uniqueFriendIds
            );


    if (profileError) {

        console.error(
            "Unable to load friend profiles:",
            profileError
        );


        return;
    }


    friends =
        (profiles || [])
            .sort(
                (a, b) =>
                    a.gamertag.localeCompare(
                        b.gamertag
                    )
            );


    renderFriends();
}


/* =========================
   FRIEND LIST
========================= */

function renderFriends() {

    const search =
        friendSearch.value
            .trim()
            .toLowerCase();


    const filtered =
        friends.filter(friend => {

            const searchText =
                `
                    ${friend.gamertag || ""}
                    ${friend.display_name || ""}
                `
                    .toLowerCase();


            return searchText.includes(
                search
            );
        });


    friendsList.innerHTML = "";


    if (
        filtered.length === 0
    ) {

        const empty =
            document.createElement(
                "p"
            );


        empty.className =
            "no-friends";


        empty.textContent =
            friends.length === 0
                ? "No friends yet."
                : "No friends found.";


        friendsList.appendChild(
            empty
        );


        return;
    }


    filtered.forEach(friend => {

        const button =
            document.createElement(
                "button"
            );


        button.type =
            "button";


        button.className =
            "friend-item";


        if (
            selectedFriend?.id ===
            friend.id
        ) {
            button.classList.add(
                "active"
            );
        }


        const avatarWrap =
            document.createElement(
                "div"
            );


        avatarWrap.className =
            "friend-avatar-wrap";


        const avatar =
            document.createElement(
                "img"
            );


        avatar.className =
            "friend-avatar";


        avatar.src =
            friend.avatar_url ||
            "Default Apex Games Profile Picture.png";


        avatar.alt =
            friend.gamertag;


        const status =
            document.createElement(
                "span"
            );


        const presence =
            normalizeStatus(
                friend.status
            );


        status.className =
            `friend-status ${presence}`;


        avatarWrap.append(
            avatar,
            status
        );


        const info =
            document.createElement(
                "div"
            );


        info.className =
            "friend-info";


        const name =
            document.createElement(
                "span"
            );


        name.className =
            "friend-name";


        name.textContent =
            friend.gamertag;


        const statusText =
            document.createElement(
                "span"
            );


        statusText.className =
            "friend-presence";


        statusText.textContent =
            getStatusText(
                presence
            );


        info.append(
            name,
            statusText
        );


        button.append(
            avatarWrap,
            info
        );


        button.addEventListener(
            "click",
            () => {

                selectFriend(
                    friend
                );
            }
        );


        friendsList.appendChild(
            button
        );
    });
}


/* =========================
   STATUS
========================= */

function normalizeStatus(status) {

    if (
        status === "online" ||
        status === "away" ||
        status === "dnd"
    ) {
        return status;
    }


    return "offline";
}


function getStatusText(status) {

    if (status === "dnd") {
        return "Do Not Disturb";
    }


    if (status === "away") {
        return "Away";
    }


    if (status === "online") {
        return "Online";
    }


    return "Offline";
}


/* =========================
   SELECT FRIEND
========================= */

async function selectFriend(friend) {

    selectedFriend =
        friend;


    lastMessageSignature =
        "";


    conversationEmpty.hidden =
        true;


    conversation.hidden =
        false;


    conversationAvatar.src =
        friend.avatar_url ||
        "Default Apex Games Profile Picture.png";


    conversationName.textContent =
        friend.gamertag;


    const status =
        normalizeStatus(
            friend.status
        );


    conversationStatus.className =
        `status-dot ${status}`;


    conversationStatusText.textContent =
        getStatusText(
            status
        );


    renderFriends();


    const url =
        new URL(
            window.location.href
        );


    url.searchParams.set(
        "user",
        friend.id
    );


    window.history.replaceState(
        {},
        "",
        url
    );


    await loadMessages(
        true
    );


    startMessageRefresh();


    messageInput.focus();
}


/* =========================
   OPEN FROM URL
========================= */

function openFriendFromURL() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const friendId =
        params.get(
            "user"
        );


    if (!friendId) {
        return;
    }


    const friend =
        friends.find(
            item =>
                item.id ===
                friendId
        );


    if (friend) {

        selectFriend(
            friend
        );
    }
}


/* =========================
   LOAD MESSAGES
========================= */

async function loadMessages(
    forceScroll = false
) {

    if (
        !selectedFriend ||
        !currentUser
    ) {
        return;
    }


    const friendId =
        selectedFriend.id;


    const {
        data,
        error
    } =
        await supabaseClient
            .from("messages")
            .select(`
                id,
                sender_id,
                receiver_id,
                content,
                created_at
            `)
            .or(
                `and(sender_id.eq.${currentUser.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${currentUser.id})`
            )
            .order(
                "created_at",
                {
                    ascending: true
                }
            )
            .limit(
                500
            );


    if (error) {

        console.error(
            "Unable to load messages:",
            error
        );


        return;
    }


    const conversationMessages =
        data || [];


    const signature =
        conversationMessages
            .map(message =>
                `${message.id}:${message.created_at}`
            )
            .join("|");


    if (
        !forceScroll &&
        signature ===
        lastMessageSignature
    ) {
        return;
    }


    const wasNearBottom =
        messages.scrollHeight -
            messages.scrollTop -
            messages.clientHeight <
        100;


    lastMessageSignature =
        signature;


    renderMessages(
        conversationMessages
    );


    if (
        forceScroll ||
        wasNearBottom
    ) {
        scrollToBottom();
    }
}


/* =========================
   RENDER MESSAGES
========================= */

function renderMessages(
    conversationMessages
) {

    messages.innerHTML = "";


    if (
        conversationMessages.length === 0
    ) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "no-friends";


        empty.textContent =
            "No messages yet. Say hello 👋";


        messages.appendChild(
            empty
        );


        return;
    }


    conversationMessages.forEach(
        message => {

            const row =
                document.createElement(
                    "div"
                );


            const mine =
                message.sender_id ===
                currentUser.id;


            row.className =
                mine
                    ? "message-row mine"
                    : "message-row theirs";


            const bubble =
                document.createElement(
                    "div"
                );


            bubble.className =
                "message";


            const content =
                document.createElement(
                    "span"
                );


            content.textContent =
                message.content;


            const time =
                document.createElement(
                    "span"
                );


            time.className =
                "message-time";


            time.textContent =
                formatTime(
                    message.created_at
                );


            bubble.append(
                content,
                time
            );


            row.appendChild(
                bubble
            );


            messages.appendChild(
                row
            );
        }
    );
}


/* =========================
   TIME
========================= */

function formatTime(timestamp) {

    const date =
        new Date(
            timestamp
        );


    return date.toLocaleTimeString(
        [],
        {
            hour: "numeric",
            minute: "2-digit"
        }
    );
}


/* =========================
   SEND MESSAGE
========================= */

messageForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        if (
            !selectedFriend ||
            !currentUser
        ) {
            return;
        }


        const content =
            messageInput.value.trim();


        if (!content) {
            return;
        }


        if (
            content.length > 2000
        ) {
            return;
        }


        sendButton.disabled =
            true;


        const {
            error
        } =
            await supabaseClient
                .from("messages")
                .insert({
                    sender_id:
                        currentUser.id,

                    receiver_id:
                        selectedFriend.id,

                    content:
                        content
                });


        if (error) {

            console.error(
                "Unable to send message:",
                error
            );


            sendButton.disabled =
                false;


            return;
        }


        messageInput.value =
            "";


        resizeMessageInput();


        updateSendButton();


        await loadMessages(
            true
        );
    }
);


/* =========================
   MESSAGE INPUT
========================= */

function updateSendButton() {

    sendButton.disabled =
        !selectedFriend ||
        messageInput.value
            .trim()
            .length === 0;
}


function resizeMessageInput() {

    messageInput.style.height =
        "auto";


    messageInput.style.height =
        Math.min(
            messageInput.scrollHeight,
            140
        ) + "px";
}


messageInput.addEventListener(
    "input",
    () => {

        resizeMessageInput();

        updateSendButton();
    }
);


messageInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();


            if (
                !sendButton.disabled
            ) {
                messageForm.requestSubmit();
            }
        }
    }
);


/* =========================
   AUTO REFRESH
========================= */

function startMessageRefresh() {

    if (
        messageRefreshTimer
    ) {
        clearInterval(
            messageRefreshTimer
        );
    }


    messageRefreshTimer =
        setInterval(
            () => {

                if (
                    selectedFriend
                ) {
                    loadMessages();
                }
            },
            2500
        );
}


/* =========================
   SCROLL
========================= */

function scrollToBottom() {

    requestAnimationFrame(
        () => {

            messages.scrollTop =
                messages.scrollHeight;
        }
    );
}


/* =========================
   SEARCH
========================= */

friendSearch.addEventListener(
    "input",
    renderFriends
);


/* =========================
   ACCOUNT
========================= */

accountCard.addEventListener(
    "click",
    () => {

        window.location.href =
            "settings.html";
    }
);


/* =========================
   CLEANUP
========================= */

window.addEventListener(
    "beforeunload",
    () => {

        if (
            messageRefreshTimer
        ) {
            clearInterval(
                messageRefreshTimer
            );
        }
    }
);


/* =========================
   START
========================= */

startChat();

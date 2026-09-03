const DEFAULT_AVATAR =
    "Default Apex Games Profile Picture.png";


/* ==========================================
   ELEMENTS
========================================== */

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

const friendCount =
    document.getElementById(
        "friendCount"
    );

const newChatButton =
    document.getElementById(
        "newChatButton"
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


const emojiButton =
    document.getElementById(
        "emojiButton"
    );

const emojiPicker =
    document.getElementById(
        "emojiPicker"
    );

const emojiGrid =
    document.getElementById(
        "emojiGrid"
    );


const gifButton =
    document.getElementById(
        "gifButton"
    );

const voiceButton =
    document.getElementById(
        "voiceButton"
    );

const voiceCallButton =
    document.getElementById(
        "voiceCallButton"
    );

const conversationMoreButton =
    document.getElementById(
        "conversationMoreButton"
    );


const featureNotice =
    document.getElementById(
        "featureNotice"
    );

const featureNoticeText =
    document.getElementById(
        "featureNoticeText"
    );

const closeFeatureNotice =
    document.getElementById(
        "closeFeatureNotice"
    );


/* ==========================================
   STATE
========================================== */

let currentUser = null;

let friends = [];

let selectedFriend = null;

let messageRefreshTimer = null;

let lastMessageSignature = "";


/* ==========================================
   EMOJIS
========================================== */

const EMOJIS = [
    "😀",
    "😃",
    "😄",
    "😁",
    "😂",
    "🤣",
    "😭",

    "😊",
    "😎",
    "🤨",
    "🫡",
    "🤔",
    "😴",
    "💀",

    "🔥",
    "❤️",
    "💙",
    "💯",
    "✨",
    "⚡",
    "🎉",

    "👍",
    "👎",
    "👏",
    "🙏",
    "🤝",
    "💪",
    "✌️",

    "👀",
    "🗿",
    "🤯",
    "😱",
    "😤",
    "🥶",
    "🤖",

    "🎮",
    "💻",
    "⌨️",
    "🖱️",
    "🎧",
    "🎙️",
    "🚀"
];


/* ==========================================
   START
========================================== */

async function startChat() {

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


    buildEmojiPicker();


    await Promise.all([
        loadAccount(),
        loadFriends()
    ]);


    openFriendFromURL();
}


/* ==========================================
   ACCOUNT
========================================== */

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


    if (
        error ||
        !profile
    ) {

        console.error(
            "Unable to load account:",
            error
        );


        accountGamertag.textContent =
            "Account";


        setAvatar(
            accountAvatar,
            null
        );


        return;
    }


    accountGamertag.textContent =
        profile.gamertag ||
        "Account";


    setAvatar(
        accountAvatar,
        profile.avatar_url
    );
}


/* ==========================================
   AVATAR HELPER
========================================== */

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


/* ==========================================
   LOAD FRIENDS
========================================== */

async function loadFriends() {

    friendsList.innerHTML = `
        <div class="sidebar-loading">
            Loading friends...
        </div>
    `;


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
            <div class="no-friends">
                Unable to load friends.
            </div>
        `;


        return;
    }


    const ids =
        (relationships || [])
            .map(
                relationship => {

                    if (
                        relationship.sender_id ===
                        currentUser.id
                    ) {

                        return relationship.receiver_id;
                    }


                    return relationship.sender_id;
                }
            );


    const uniqueIds =
        [...new Set(ids)];


    if (
        uniqueIds.length === 0
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
                avatar_url
            `)
            .in(
                "id",
                uniqueIds
            );


    if (profileError) {

        console.error(
            "Unable to load friend profiles:",
            profileError
        );


        friendsList.innerHTML = `
            <div class="no-friends">
                Unable to load friend profiles.
            </div>
        `;


        return;
    }


    friends =
        (profiles || [])
            .sort(
                (a, b) =>
                    (a.gamertag || "")
                        .localeCompare(
                            b.gamertag || ""
                        )
            );


    renderFriends();
}


/* ==========================================
   LIVE STATUS
========================================== */

function liveStatus(
    userId
) {

    if (
        typeof getLiveStatus ===
        "function"
    ) {

        return normalizeStatus(
            getLiveStatus(
                userId
            )
        );
    }


    return "offline";
}


function normalizeStatus(
    status
) {

    if (
        status === "online" ||
        status === "away" ||
        status === "dnd"
    ) {

        return status;
    }


    return "offline";
}


function statusText(
    status
) {

    if (
        status === "online"
    ) {

        return "Online";
    }


    if (
        status === "away"
    ) {

        return "Away";
    }


    if (
        status === "dnd"
    ) {

        return "Do Not Disturb";
    }


    return "Offline";
}


/* ==========================================
   RENDER FRIENDS
========================================== */

function renderFriends() {

    const search =
        friendSearch
            .value
            .trim()
            .toLowerCase();


    const filtered =
        friends.filter(
            friend => {

                const text =
                    `
                        ${friend.gamertag || ""}
                        ${friend.display_name || ""}
                    `
                        .toLowerCase();


                return text.includes(
                    search
                );
            }
        );


    friendCount.textContent =
        friends.length;


    friendsList.innerHTML =
        "";


    if (
        filtered.length === 0
    ) {

        const empty =
            document.createElement(
                "div"
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


    filtered.forEach(
        friend => {

            const item =
                document.createElement(
                    "button"
                );


            item.type =
                "button";


            item.className =
                "friend-item";


            if (
                selectedFriend?.id ===
                friend.id
            ) {

                item.classList.add(
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


            avatar.alt =
                friend.gamertag ||
                "Friend";


            setAvatar(
                avatar,
                friend.avatar_url
            );


            const status =
                liveStatus(
                    friend.id
                );


            const dot =
                document.createElement(
                    "span"
                );


            dot.className =
                `friend-status ${status}`;


            avatarWrap.append(
                avatar,
                dot
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
                friend.gamertag ||
                "Unknown User";


            const presence =
                document.createElement(
                    "span"
                );


            presence.className =
                "friend-presence";


            presence.textContent =
                statusText(
                    status
                );


            info.append(
                name,
                presence
            );


            item.append(
                avatarWrap,
                info
            );


            item.addEventListener(
                "click",
                () => {

                    selectFriend(
                        friend
                    );
                }
            );


            friendsList.appendChild(
                item
            );
        }
    );
}


/* ==========================================
   SELECT FRIEND
========================================== */

async function selectFriend(
    friend
) {

    selectedFriend =
        friend;


    lastMessageSignature =
        "";


    emojiPicker.hidden =
        true;


    conversationEmpty.hidden =
        true;


    conversation.hidden =
        false;


    conversationName.textContent =
        friend.gamertag ||
        "Friend";


    setAvatar(
        conversationAvatar,
        friend.avatar_url
    );


    updateConversationPresence();


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


    updateSendButton();
}


/* ==========================================
   UPDATE ACTIVE PRESENCE
========================================== */

function updateConversationPresence() {

    if (!selectedFriend) {
        return;
    }


    const status =
        liveStatus(
            selectedFriend.id
        );


    conversationStatus.className =
        `presence-dot ${status}`;


    conversationStatusText.textContent =
        statusText(
            status
        );
}


/* ==========================================
   URL FRIEND
========================================== */

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


/* ==========================================
   PRESENCE EVENTS
========================================== */

window.addEventListener(
    "apex-presence-updated",
    () => {

        renderFriends();


        updateConversationPresence();
    }
);


/* ==========================================
   LOAD MESSAGES
========================================== */

async function loadMessages(
    forceScroll = false
) {

    if (
        !currentUser ||
        !selectedFriend
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
        data ||
        [];


    const signature =
        conversationMessages
            .map(
                message =>
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


    const nearBottom =
        messages.scrollHeight -
        messages.scrollTop -
        messages.clientHeight <
        120;


    lastMessageSignature =
        signature;


    renderMessages(
        conversationMessages
    );


    if (
        forceScroll ||
        nearBottom
    ) {

        scrollToBottom();
    }
}


/* ==========================================
   RENDER MESSAGES
========================================== */

function renderMessages(
    conversationMessages
) {

    messages.innerHTML =
        "";


    if (
        conversationMessages.length ===
        0
    ) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "messages-empty";


        const title =
            document.createElement(
                "strong"
            );


        title.textContent =
            "No messages yet";


        const text =
            document.createElement(
                "span"
            );


        text.textContent =
            "Start the conversation 👋";


        empty.append(
            title,
            text
        );


        messages.appendChild(
            empty
        );


        return;
    }


    conversationMessages.forEach(
        message => {

            const mine =
                message.sender_id ===
                currentUser.id;


            const row =
                document.createElement(
                    "div"
                );


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


/* ==========================================
   TIME
========================================== */

function formatTime(
    timestamp
) {

    const date =
        new Date(
            timestamp
        );


    return date.toLocaleTimeString(
        [],
        {
            hour:
                "numeric",

            minute:
                "2-digit"
        }
    );
}


/* ==========================================
   SEND MESSAGE
========================================== */

messageForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        if (
            !currentUser ||
            !selectedFriend
        ) {

            return;
        }


        const content =
            messageInput
                .value
                .trim();


        if (!content) {
            return;
        }


        if (
            content.length >
            2000
        ) {

            showFeatureNotice(
                "Messages can be up to 2,000 characters."
            );

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


            showFeatureNotice(
                "That message couldn't be sent."
            );


            updateSendButton();


            return;
        }


        messageInput.value =
            "";


        resizeInput();


        updateSendButton();


        emojiPicker.hidden =
            true;


        await loadMessages(
            true
        );
    }
);


/* ==========================================
   MESSAGE INPUT
========================================== */

function updateSendButton() {

    const hasText =
        messageInput
            .value
            .trim()
            .length >
        0;


    sendButton.disabled =
        !selectedFriend ||
        !hasText;
}


function resizeInput() {

    messageInput.style.height =
        "auto";


    const newHeight =
        Math.min(
            messageInput.scrollHeight,
            130
        );


    messageInput.style.height =
        `${newHeight}px`;
}


messageInput.addEventListener(
    "input",
    () => {

        resizeInput();

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


/* ==========================================
   EMOJI PICKER
========================================== */

function buildEmojiPicker() {

    emojiGrid.innerHTML =
        "";


    EMOJIS.forEach(
        emoji => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "emoji-item";


            button.textContent =
                emoji;


            button.addEventListener(
                "click",
                () => {

                    insertEmoji(
                        emoji
                    );
                }
            );


            emojiGrid.appendChild(
                button
            );
        }
    );
}


function insertEmoji(
    emoji
) {

    const start =
        messageInput.selectionStart;


    const end =
        messageInput.selectionEnd;


    const value =
        messageInput.value;


    messageInput.value =
        value.slice(
            0,
            start
        ) +
        emoji +
        value.slice(
            end
        );


    const cursor =
        start +
        emoji.length;


    messageInput.focus();


    messageInput.setSelectionRange(
        cursor,
        cursor
    );


    resizeInput();

    updateSendButton();
}


emojiButton.addEventListener(
    "click",
    () => {

        if (!selectedFriend) {
            return;
        }


        emojiPicker.hidden =
            !emojiPicker.hidden;
    }
);


/* ==========================================
   FUTURE FEATURE NOTICE
========================================== */

function showFeatureNotice(
    text
) {

    featureNoticeText.textContent =
        text;


    featureNotice.hidden =
        false;
}


closeFeatureNotice.addEventListener(
    "click",
    () => {

        featureNotice.hidden =
            true;
    }
);


/* ==========================================
   GIF
========================================== */

gifButton.addEventListener(
    "click",
    () => {

        if (!selectedFriend) {
            return;
        }


        emojiPicker.hidden =
            true;


        showFeatureNotice(
            "GIF search is ready for the next Chat upgrade."
        );
    }
);


/* ==========================================
   VOICE MESSAGE
========================================== */

voiceButton.addEventListener(
    "click",
    () => {

        if (!selectedFriend) {
            return;
        }


        emojiPicker.hidden =
            true;


        showFeatureNotice(
            "Voice messages need the secure audio-storage system we're building next."
        );
    }
);


/* ==========================================
   CALLING
========================================== */

voiceCallButton.addEventListener(
    "click",
    () => {

        if (!selectedFriend) {
            return;
        }


        showFeatureNotice(
            "Calling needs the ApexCoder WebRTC call system before this button can place real calls."
        );
    }
);


/* ==========================================
   OTHER BUTTONS
========================================== */

conversationMoreButton.addEventListener(
    "click",
    () => {

        showFeatureNotice(
            "Conversation options are coming next."
        );
    }
);


newChatButton.addEventListener(
    "click",
    () => {

        friendSearch.focus();

        friendSearch.select();
    }
);


/* ==========================================
   SEARCH
========================================== */

friendSearch.addEventListener(
    "input",
    renderFriends
);


/* ==========================================
   ACCOUNT
========================================== */

accountCard.addEventListener(
    "click",
    () => {

        window.location.href =
            "settings.html";
    }
);


/* ==========================================
   MESSAGE REFRESH
========================================== */

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


/* ==========================================
   SCROLL
========================================== */

function scrollToBottom() {

    requestAnimationFrame(
        () => {

            messages.scrollTop =
                messages.scrollHeight;
        }
    );
}


/* ==========================================
   CLOSE EMOJI PICKER
========================================== */

document.addEventListener(
    "click",
    event => {

        const clickedPicker =
            emojiPicker.contains(
                event.target
            );


        const clickedButton =
            emojiButton.contains(
                event.target
            );


        if (
            !clickedPicker &&
            !clickedButton
        ) {

            emojiPicker.hidden =
                true;
        }
    }
);


/* ==========================================
   CLEANUP
========================================== */

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


/* ==========================================
   GO
========================================== */

startChat();

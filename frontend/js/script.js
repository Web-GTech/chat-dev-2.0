// login elements
const socket = new WebSocket('wss://chat-dev-2-0.onrender.com/ws');
const login = document.querySelector(".login");
const loginForm = login.querySelector(".login__form");
const loginInput = login.querySelector(".login__input");

// chat elements
const chat = document.querySelector(".chat");
const chatForm = chat.querySelector(".chat__form");
const chatInput = chat.querySelector(".chat__input");
const chatMessages = chat.querySelector(".chat__messages");
const typingIndicator = document.createElement("div");
typingIndicator.classList.add("typing-indicator");
chatMessages.prepend(typingIndicator);

// Adicionando favicon e theme-color
document.head.insertAdjacentHTML("beforeend", `
    <link rel="icon" href="./images/favicon.ico" type="image/x-icon">
    <meta name="theme-color" content="#000000">
`);

const chatClearButton = document.querySelector(".chat__clear-button");

let userName = localStorage.getItem("userName") || "";

const addMessage = (message, sender) => {
    const messageElement = document.createElement("div");
    messageElement.classList.add(sender === userName ? "message--self" : "message--other");
    messageElement.innerHTML = sender !== userName ? `<span class="message--sender">${sender}</span>${message}` : message;
    chatMessages.appendChild(messageElement);
    saveMessages();
    chatMessages.scrollTop = chatMessages.scrollHeight;
};

const saveMessages = () => {
    const messages = Array.from(chatMessages.children).map(msg => msg.outerHTML);
    localStorage.setItem("chatMessages", JSON.stringify(messages));
};

const loadMessages = () => {
    const savedMessages = JSON.parse(localStorage.getItem("chatMessages")) || [];
    savedMessages.forEach(msg => {
        chatMessages.innerHTML += msg;
    });
};

if (userName) {
    login.style.display = "none";
    chat.style.display = "flex";
    chatClearButton.style.display = "block";
    loadMessages();
}

loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    userName = loginInput.value.trim();
    
    if (userName) {
        localStorage.setItem("userName", userName);
        login.style.display = "none";
        chat.style.display = "flex";
        chatClearButton.style.display = "block";
        loadMessages();
    }
});

chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = chatInput.value.trim();
    
    if (message) {
        addMessage(message, userName);
        chatInput.value = "";
    }
});

const clearChat = () => {
    const confirmClear = confirm("Iniciar uma nova conversa?");
    if (confirmClear) {
        localStorage.clear();
        location.reload();
    }
};

chatClearButton.addEventListener("click", clearChat);

const colors = [
    "cadetblue",
    "darkgoldenrod",
    "cornflowerblue",
    "darkkhaki",
    "hotpink",
    "gold"
];

const user = { id: "", name: "", color: "" };

let websocket;
let typingTimeout;

const notifyTyping = () => {
    websocket.send(JSON.stringify({ type: "typing", userName: user.name }));
};

const createMessageSelfElement = (content) => {
    const div = document.createElement("div");
    div.classList.add("message--self");
    div.innerHTML = content;
    return div;
};

const createMessageOtherElement = (content, sender, senderColor) => {
    const div = document.createElement("div");
    const span = document.createElement("span");
    div.classList.add("message--other");
    span.classList.add("message--sender");
    span.style.color = senderColor;
    span.innerHTML = sender;
    div.appendChild(span);
    div.innerHTML += content;
    return div;
};

const showPopup = (userName) => {
    const popup = document.createElement("div");
    popup.classList.add("popup-notification");
    popup.innerHTML = `<strong>${userName}</strong> entrou no chat!`;
    document.body.appendChild(popup);

    setTimeout(() => {
        popup.classList.add("show");
    }, 100);

    setTimeout(() => {
        popup.classList.remove("show");
        setTimeout(() => popup.remove(), 300);
    }, 3000);
};

const getRandomColor = () => {
    const randomIndex = Math.floor(Math.random() * colors.length);
    return colors[randomIndex];
};

const scrollScreen = () => {
    window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth"
    });
};

const processMessage = ({ data }) => {
    const { userId, userName, userColor, content, type } = JSON.parse(data);
    
    if (type === "typing") {
        if (userId !== user.id) {
            typingIndicator.innerHTML = `${userName} está digitando...`;
            typingIndicator.style.display = "block";
            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => typingIndicator.style.display = "none", 1500);
        }
        return;
    }

    if (type === "join") {
        showPopup(userName);
        new Audio("join.mp3").play().catch(() => {});
        return;
    }

    const message =
        userId == user.id
            ? createMessageSelfElement(content)
            : createMessageOtherElement(content, userName, userColor);

    chatMessages.appendChild(message);

    if (userId !== user.id) {
        new Audio("message.mp3").play().catch(() => {});
    }

    scrollScreen();
};

loginForm.addEventListener("submit", handleLogin);
chatForm.addEventListener("submit", sendMessage);
chatInput.addEventListener("input", notifyTyping);

// login elements
const socketUrl = 'wss://chat-dev-2-0.onrender.com/ws';
const login = document.querySelector(".login")
const loginForm = login.querySelector(".login__form")
const loginInput = login.querySelector(".login__input")

// chat elements
const chat = document.querySelector(".chat")
const chatForm = chat.querySelector(".chat__form")
const chatInput = chat.querySelector(".chat__input")
const chatMessages = chat.querySelector(".chat__messages")
const typingIndicator = document.createElement("div");
typingIndicator.classList.add("typing-indicator");
chatMessages.prepend(typingIndicator);

const colors = ["cadetblue", "darkgoldenrod", "cornflowerblue", "darkkhaki", "hotpink", "gold"];
let websocket;
let typingTimeout;

// Tenta recuperar usuário salvo
const savedUser = JSON.parse(localStorage.getItem("chatUser"));
const user = savedUser || { id: "", name: "", color: "" };

// Função para tocar áudio de notificação mesmo com aba fechada
const playNotificationSound = (soundFile) => {
    const audio = new Audio(soundFile);
    audio.play().catch(() => {
        console.log("Falha ao tocar o som.");
    });
};

// Pede permissão para exibir notificações
if (Notification.permission === "default") {
    Notification.requestPermission();
}

const showNotification = (title, body) => {
    if (Notification.permission === "granted") {
        new Notification(title, { body });
    }
};

// Salva as mensagens no LocalStorage
const saveMessages = () => {
    localStorage.setItem("chatMessages", chatMessages.innerHTML);
};

// Recupera mensagens ao recarregar a página
const loadMessages = () => {
    const savedMessages = localStorage.getItem("chatMessages");
    if (savedMessages) {
        chatMessages.innerHTML = savedMessages;
    }
};

// Criação de mensagens
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

// Conecta ao WebSocket
const connectWebSocket = () => {
    websocket = new WebSocket(socketUrl);

    websocket.onmessage = processMessage;
    websocket.onopen = () => {
        if (user.name) {
            websocket.send(JSON.stringify({ type: "join", userName: user.name }));
        }
    };

    websocket.onclose = () => {
        console.warn("WebSocket desconectado. Tentando reconectar...");
        setTimeout(connectWebSocket, 3000);
    };
};

// Processa mensagens recebidas
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
        showNotification("Novo usuário", `${userName} entrou no chat!`);
        playNotificationSound("join.mp3");
        return;
    }

    const message =
        userId == user.id
            ? createMessageSelfElement(content)
            : createMessageOtherElement(content, userName, userColor);

    chatMessages.appendChild(message);
    saveMessages(); // Salva mensagens no localStorage

    if (userId !== user.id) {
        showNotification("Nova mensagem", `${userName}: ${content}`);
        playNotificationSound("message.mp3");
    }
};

// Login do usuário
const handleLogin = (event) => {
    event.preventDefault();

    user.id = crypto.randomUUID();
    user.name = loginInput.value;
    user.color = colors[Math.floor(Math.random() * colors.length)];

    localStorage.setItem("chatUser", JSON.stringify(user));

    login.style.display = "none";
    chat.style.display = "flex";

    connectWebSocket();
};

// Envio de mensagem
const sendMessage = (event) => {
    event.preventDefault();

    const message = {
        userId: user.id,
        userName: user.name,
        userColor: user.color,
        content: chatInput.value,
        type: "message"
    };

    websocket.send(JSON.stringify(message));
    chatInput.value = "";
};

// Notificação de digitação
const notifyTyping = () => {
    websocket.send(JSON.stringify({ type: "typing", userId: user.id, userName: user.name }));
};

// Eventos
loginForm.addEventListener("submit", handleLogin);
chatForm.addEventListener("submit", sendMessage);
chatInput.addEventListener("input", notifyTyping);

// Se usuário já estiver logado, conectar automaticamente
if (user.name) {
    login.style.display = "none";
    chat.style.display = "flex";
    loadMessages(); // Carrega mensagens salvas
    connectWebSocket();
}

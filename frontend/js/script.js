// login elements
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
chatMessages.prepend(typingIndicator);  // Coloca o indicador de digitação no topo da lista de mensagens


const colors = [
    "cadetblue",
    "darkgoldenrod",
    "cornflowerblue",
    "darkkhaki",
    "hotpink",
    "gold"
]

const user = { id: "", name: "", color: "" }

let websocket
let typingTimeout;  // Variável para armazenar o timeout do indicador de digitação

const createMessageSelfElement = (content) => {
    const div = document.createElement("div")
    div.classList.add("message--self")
    div.innerHTML = content
    return div
}

const createMessageOtherElement = (content, sender, senderColor) => {
    const div = document.createElement("div")
    const span = document.createElement("span")
    div.classList.add("message--other")
    span.classList.add("message--sender")
    span.style.color = senderColor
    span.innerHTML = sender
    div.appendChild(span)
    div.innerHTML += content
    return div
}

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
    const randomIndex = Math.floor(Math.random() * colors.length)
    return colors[randomIndex]
}

const scrollScreen = () => {
    window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth"
    })
}

// Função para exibir alertas
const showAlert = (message) => {
    const alertBox = document.createElement("div");
    alertBox.textContent = message;
    alertBox.style.position = "absolute";
    alertBox.style.top = "10px";
    alertBox.style.left = "50%";
    alertBox.style.transform = "translateX(-50%)";
    alertBox.style.padding = "10px";
    alertBox.style.backgroundColor = "#4CAF50";
    alertBox.style.color = "white";
    alertBox.style.borderRadius = "5px";
    document.body.appendChild(alertBox);
    setTimeout(() => alertBox.remove(), 3000);
};

const processMessage = ({ data }) => {
    const { userId, userName, userColor, content, type } = JSON.parse(data)
    
    if (type === "typing") {
        if (userId !== user.id) {
            typingIndicator.innerHTML = `${userName} está digitando...`;
            typingIndicator.style.display = "block";
            clearTimeout(typingTimeout); // Limpa o timeout anterior
            typingTimeout = setTimeout(() => typingIndicator.style.display = "none", 1500);
        }
        return;
    }

    if (type === "join") {
        showPopup(userName);
        showAlert(`${userName} entrou no chat`);  // Chama a função de alerta
        new Audio("join.mp3").play().catch(() => {});
        return;
    }

    const message =
        userId == user.id
            ? createMessageSelfElement(content)
            : createMessageOtherElement(content, userName, userColor)

    chatMessages.appendChild(message)

    if (userId !== user.id) {
        new Audio("message.mp3").play().catch(() => {});
    }

    scrollScreen()
}

const handleLogin = (event) => {
    event.preventDefault()

    user.id = crypto.randomUUID()
    user.name = loginInput.value
    user.color = getRandomColor()

    login.style.display = "none"
    chat.style.display = "flex"

    websocket = new WebSocket("ws://localhost:8080")
    websocket.onmessage = processMessage
    
    websocket.onopen = () => {
        websocket.send(JSON.stringify({ type: "join", userName: user.name }));
    }
}

const sendMessage = (event) => {
    event.preventDefault()

    const message = {
        userId: user.id,
        userName: user.name,
        userColor: user.color,
        content: chatInput.value,
        type: "message"
    }

    websocket.send(JSON.stringify(message))
    chatInput.value = ""
}

const notifyTyping = () => {
    websocket.send(JSON.stringify({ type: "typing", userId: user.id, userName: user.name }));
}

loginForm.addEventListener("submit", handleLogin)
chatForm.addEventListener("submit", sendMessage)
chatInput.addEventListener("input", notifyTyping)

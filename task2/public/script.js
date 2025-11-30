const socket = io();

const joinScreen = document.getElementById('join-screen');
const chatScreen = document.getElementById('chat-screen');
const usernameInput = document.getElementById('username');
const joinBtn = document.getElementById('join-btn');
const chatForm = document.getElementById('chat-form');
const msgInput = document.getElementById('msg-input');
const messagesContainer = document.getElementById('messages-container');
const leaveBtn = document.getElementById('leave-btn');

let myUsername = "";

// 1. JOIN CHAT
joinBtn.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    if(username) {
        myUsername = username;
        joinScreen.style.display = 'none';
        chatScreen.style.display = 'flex';
        socket.emit('join', username);
    } else {
        alert("Please enter a name");
    }
});

// 2. SEND MESSAGE
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = msgInput.value.trim();
    
    if(text) {
        socket.emit('chatMessage', {
            user: myUsername,
            text: text
        });
        msgInput.value = '';
        msgInput.focus();
    }
});

// 3. RECEIVE MESSAGE
socket.on('message', (data) => {
    renderMessage(data);
});

// 4. RENDER UI
function renderMessage(data) {
    const div = document.createElement('div');
    
    if(data.type === 'system') {
        div.classList.add('system-msg');
        div.innerText = data.text;
    } else {
        const isMe = data.user === myUsername;
        div.classList.add('message', isMe ? 'my-msg' : 'other-msg');
        
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        div.innerHTML = `
            ${!isMe ? `<div class="username">${data.user}</div>` : ''}
            <div class="bubble">
                ${data.text}
                <div class="timestamp">${time}</div>
            </div>
        `;
    }
    
    messagesContainer.appendChild(div);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 5. LEAVE
leaveBtn.addEventListener('click', () => {
    location.reload();
});
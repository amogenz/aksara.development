let peer;
let conn;
let username;
let roomId = new URLSearchParams(window.location.search).get('room');

function startChat() {
  username = document.getElementById('username').value.trim();
  if (!username) {
    alert('Masukkan nama terlebih dahulu!');
    return;
  }

  document.getElementById('name-section').style.display = 'none';
  document.getElementById('chat-section').style.display = 'block';

  if (!roomId) {
    roomId = generateRoomId();
    // Hanya gunakan pushState jika lingkungan mendukung
    if (window.location.origin !== 'null' && window.location.protocol !== 'file:') {
      try {
        window.history.pushState({}, '', `?room=${roomId}`);
      } catch (e) {
        console.warn('pushState gagal, lanjutkan tanpa mengubah URL:', e);
      }
    }
  }

  peer = new Peer(roomId + '-' + username, {
    debug: 2 // Untuk debugging PeerJS
  });

  peer.on('open', (id) => {
    console.log('Peer ID:', id);
    const inviteLink = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    document.getElementById('invite-link').textContent = `Kirim link ini ke teman: ${inviteLink}`;
  });

  peer.on('connection', (connection) => {
    conn = connection;
    conn.on('data', (data) => {
      displayMessage(data, 'received');
      saveMessage(data);
    });
  });

  // Jika ada roomId, coba hubungkan ke peer lain
  if (roomId && document.getElementById('username').value) {
    conn = peer.connect(roomId + '-' + username);
    conn.on('open', () => {
      console.log('Terhubung ke peer lain');
    });
  }

  loadMessages();
}

function generateInvite() {
  if (!roomId) {
    alert('Room belum dibuat!');
    return;
  }
  const inviteLink = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
  navigator.clipboard.writeText(inviteLink).then(() => {
    alert('Link undangan telah disalin!');
  }).catch(() => {
    alert('Gagal menyalin link, silakan salin manual: ' + inviteLink);
  });
}

function sendMessage() {
  const messageInput = document.getElementById('message-input');
  const message = messageInput.value.trim();
  if (!message) return;

  const data = `${username}: ${message}`;
  if (conn && conn.open) {
    conn.send(data);
    displayMessage(data, 'sent');
    saveMessage(data);
  } else {
    alert('Belum terhubung dengan teman!');
  }
  messageInput.value = '';
}

function displayMessage(message, type) {
  const chatBox = document.getElementById('chat-box');
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${type}`;
  msgDiv.textContent = message;
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function saveMessage(message) {
  const messages = JSON.parse(sessionStorage.getItem(`chat-${roomId}`) || '[]');
  messages.push(message);
  sessionStorage.setItem(`chat-${roomId}`, JSON.stringify(messages));
}

function loadMessages() {
  const messages = JSON.parse(sessionStorage.getItem(`chat-${roomId}`) || '[]');
  messages.forEach(msg => displayMessage(msg, 'received'));
}

function generateRoomId() {
  return 'room-' + Math.random().toString(36).substr(2, 9);
}

// Hubungkan ke peer lain jika ada roomId
if (roomId) {
  setTimeout(() => {
    if (!username) {
      username = prompt('Masukkan nama Anda untuk bergabung:');
      if (username) {
        startChat();
      }
    }
  }, 500);
}
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
  updateConnectionStatus('Menghubungkan...');

  if (!roomId) {
    roomId = generateRoomId();
    if (window.location.origin !== 'null' && window.location.protocol !== 'file:') {
      try {
        window.history.pushState({}, '', `?room=${roomId}`);
      } catch (e) {
        console.warn('pushState gagal, lanjutkan tanpa mengubah URL:', e);
      }
    }
  }

  peer = new Peer(roomId + '-' + username, {
    host: '0.peerjs.com', // Ganti ke server PeerJS default yang lebih andal
    secure: true,
    port: 443,
    debug: 2
  });

  peer.on('open', (id) => {
    console.log('Peer ID:', id);
    const baseUrl = window.location.href.includes('github.io') 
      ? window.location.href.split('?')[0] 
      : `${window.location.origin}${window.location.pathname}`;
    const inviteLink = `${baseUrl}?room=${roomId}`;
    document.getElementById('invite-link').textContent = `Kirim link ini ke teman: ${inviteLink}`;
    updateConnectionStatus('Menunggu teman bergabung...');
  });

  peer.on('connection', (connection) => {
    conn = connection;
    conn.on('open', () => {
      console.log('Terhubung ke peer:', conn.peer);
      updateConnectionStatus('Terhubung dengan teman!');
    });
    conn.on('data', (data) => {
      displayMessage(data, 'received');
      saveMessage(data);
    });
    conn.on('error', (err) => {
      console.error('Koneksi error:', err);
      updateConnectionStatus('Gagal terhubung. Coba lagi.');
    });
  });

  peer.on('error', (err) => {
    console.error('PeerJS error:', err);
    updateConnectionStatus(`Error: ${err.type}. Coba refresh halaman.`);
  });

  // Jika ada roomId, coba hubungkan ke semua peer di room
  if (roomId) {
    setTimeout(() => {
      connectToRoomPeers();
    }, 1000);
  }

  loadMessages();
}

function connectToRoomPeers() {
  // Coba hubungkan ke peer lain di room yang sama
  // Asumsi peer lain menggunakan roomId yang sama
  const otherPeerId = roomId + '-' + (username === 'user1' ? 'user2' : 'user1');
  conn = peer.connect(otherPeerId);
  conn.on('open', () => {
    console.log('Terhubung ke peer:', otherPeerId);
    updateConnectionStatus('Terhubung dengan teman!');
  });
  conn.on('error', (err) => {
    console.error('Gagal terhubung ke peer:', otherPeerId, err);
    updateConnectionStatus('Menunggu teman bergabung...');
  });
}

function generateInvite() {
  if (!roomId) {
    alert('Room belum dibuat!');
    return;
  }
  const baseUrl = window.location.href.includes('github.io') 
    ? window.location.href.split('?')[0] 
    : `${window.location.origin}${window.location.pathname}`;
  const inviteLink = `${baseUrl}?room=${roomId}`;
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
    alert('Belum terhubung dengan teman! Tunggu hingga status "Terhubung".');
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

function updateConnectionStatus(status) {
  const statusElement = document.getElementById('invite-link');
  statusElement.textContent = status;
}

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

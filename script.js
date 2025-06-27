let peer;
let conn;
let username;
let roomId = new URLSearchParams(window.location.search).get('room');
let isInitiator = !roomId;

function startChat() {
  username = document.getElementById('username').value.trim();
  if (!username) {
    alert('Masukkan nama terlebih dahulu!');
    return;
  }

  document.getElementById('name-section').style.display = 'none';
  document.getElementById('chat-section').style.display = 'block';
  updateConnectionStatus('Menghubungkan ke server PeerJS...', 'connecting');

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
    host: 'peerjs-server.herokuapp.com',
    secure: true,
    port: 443,
    debug: 2,
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'turn:global.turn.twilio.com:3478', username: 'guest', credential: 'somepassword' } // Ganti dengan TURN servermu
      ]
    }
  });

  peer.on('open', (id) => {
    console.log('Peer ID:', id);
    const baseUrl = window.location.href.includes('github.io') 
      ? window.location.href.split('?')[0] 
      : `${window.location.origin}${window.location.pathname}`;
    const inviteLink = `${baseUrl}?room=${roomId}`;
    document.getElementById('invite-link').innerHTML = `Kirim link ini ke teman: <a href="${inviteLink}" target="_blank">${inviteLink}</a>`;
    updateConnectionStatus('Menunggu teman bergabung...', 'waiting');

    if (!isInitiator) {
      setTimeout(() => {
        promptForPeerConnection();
      }, 1000);
    }
  });

  peer.on('connection', (connection) => {
    if (!conn || !conn.open) {
      conn = connection;
      conn.on('open', () => {
        console.log('Koneksi masuk dari:', conn.peer);
        updateConnectionStatus('Terhubung dengan teman!', 'connected');
      });
      conn.on('data', (data) => {
        console.log('Pesan diterima:', data);
        displayMessage(data, 'received');
        saveMessage(data);
        const audio = document.getElementById('notification-sound');
        audio.play().catch((err) => console.error('Gagal memutar suara:', err));
      });
      conn.on('error', (err) => {
        console.error('Koneksi error:', err);
        updateConnectionStatus('Gagal terhubung. Coba hubungkan lagi.', 'error');
      });
      conn.on('close', () => {
        console.log('Koneksi ditutup:', conn.peer);
        updateConnectionStatus('Teman terputus. Coba hubungkan lagi.', 'disconnected');
        conn = null;
      });
    }
  });

  peer.on('error', (err) => {
    console.error('PeerJS error:', err);
    updateConnectionStatus(`Error: ${err.type}. Coba refresh halaman atau ganti jaringan.`, 'error');
    alert(`Koneksi bermasalah: ${err.type}. Pastikan nama teman benar dan coba Wi-Fi.`);
    if (err.type === 'peer-unavailable' && !isInitiator) {
      setTimeout(promptForPeerConnection, 2000);
    } else if (err.type === 'network') {
      setTimeout(() => startChat(), 3000); // Retry otomatis
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
      messageInput.addEventListener('keypress', (event) => {
        console.log('Key pressed:', event.key);
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          sendMessage();
          const sendButton = document.querySelector('.send-button');
          sendButton.classList.add('active');
          setTimeout(() => sendButton.classList.remove('active'), 300);
        }
      });
    } else {
      console.error('message-input tidak ditemukan!');
    }
  });

  loadMessages();
}

function promptForPeerConnection() {
  if (!conn || !conn.open) {
    const otherPeerName = prompt('Masukkan nama pengguna teman Anda:');
    if (otherPeerName) {
      const otherPeerId = roomId + '-' + otherPeerName.trim();
      conn = peer.connect(otherPeerId);
      conn.on('open', () => {
        console.log('Terhubung ke peer:', otherPeerId);
        updateConnectionStatus('Terhubung dengan teman!', 'connected');
      });
      conn.on('data', (data) => {
        console.log('Pesan diterima:', data);
        displayMessage(data, 'received');
        saveMessage(data);
        const audio = document.getElementById('notification-sound');
        audio.play().catch((err) => console.error('Gagal memutar suara:', err));
      });
      conn.on('error', (err) => {
        console.error('Gagal terhubung ke peer:', otherPeerId, err);
        updateConnectionStatus('Gagal terhubung. Pastikan nama teman benar.', 'error');
        setTimeout(promptForPeerConnection, 2000);
      });
      conn.on('close', () => {
        console.log('Koneksi ditutup:', otherPeerId);
        updateConnectionStatus('Teman terputus. Coba hubungkan lagi.', 'disconnected');
        conn = null;
        setTimeout(promptForPeerConnection, 2000);
      });
    } else {
      updateConnectionStatus('Menunggu teman bergabung...', 'waiting');
      setTimeout(promptForPeerConnection, 2000);
    }
  }
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

function updateConnectionStatus(status, statusType) {
  const statusElement = document.createElement('p');
  statusElement.id = 'connection-status';
  statusElement.className = `status status-${statusType}`;
  statusElement.textContent = status;
  const inviteLink = document.getElementById('invite-link');
  if (document.getElementById('connection-status')) {
    document.getElementById('connection-status').remove();
  }
  inviteLink.insertAdjacentElement('beforebegin', statusElement);
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

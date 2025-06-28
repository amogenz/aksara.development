let socket;
let pc;
let username;
let roomId = new URLSearchParams(window.location.search).get('room') || generateRoomId();
let isInitiator = !window.location.search;

const signalingServer = 'https://nama-app.herokuapp.com'; // Ganti dengan URL Heroku lo

function startChat() {
  username = document.getElementById('username').value.trim();
  if (!username) {
    alert('Masukkan nama terlebih dahulu!');
    return;
  }

  document.getElementById('name-section').style.display = 'none';
  document.getElementById('chat-section').style.display = 'block';
  updateConnectionStatus('Menghubungkan ke server signaling...', 'connecting');

  socket = io(signalingServer, { transports: ['websocket'], reconnection: true, reconnectionAttempts: 5 });
  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
    socket.emit('join', { room: roomId, name: username });
    const inviteLink = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    document.getElementById('invite-link').innerHTML = `Kirim link ini ke teman: <a href="${inviteLink}" target="_blank">${inviteLink}</a>`;
  });

  socket.on('connect_error', (error) => {
    console.error('Koneksi signaling gagal:', error);
    updateConnectionStatus('Gagal terhubung ke server signaling. Coba lagi.', 'error');
  });

  socket.on('userJoined', (data) => {
    console.log('Users in room:', data.users);
    if (data.users.length === 1 && !isInitiator) {
      createPeerConnection(true);
      sendOffer();
    } else if (data.initiator !== socket.id && !pc) {
      createPeerConnection(false);
    }
  });

  socket.on('signal', (data) => {
    console.log('Signal received:', data);
    if (data.offer) {
      pc.setRemoteDescription(new RTCSessionDescription(data.offer))
        .then(() => pc.createAnswer())
        .then(answer => {
          pc.setLocalDescription(answer);
          socket.emit('signal', { to: data.from, answer });
        })
        .catch(err => console.error('Error handling offer:', err));
    } else if (data.answer) {
      pc.setRemoteDescription(new RTCSessionDescription(data.answer)).catch(err => console.error('Error set answer:', err));
    } else if (data.candidate) {
      pc.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(err => console.error('Error add candidate:', err));
    }
  });

  socket.on('userLeft', (data) => {
    if (pc) pc.close();
    updateConnectionStatus('Teman terputus. Coba hubungkan lagi.', 'disconnected');
    pc = null;
  });

  socket.on('disconnect', () => {
    updateConnectionStatus('Koneksi signaling terputus. Mencoba reconnect...', 'disconnected');
  });

  if (isInitiator) {
    createPeerConnection(false);
  } else {
    setTimeout(() => promptForPeerConnection(), 1000);
  }

  loadMessages();
}

function createPeerConnection(isOfferer) {
  pc = new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'turn:numb.viagenie.ca', credential: 'muazkh', username: 'webrtc@live.com' },
      { urls: 'turn:relay.backups.cz', username: 'webrtc', credential: 'webrtc' } // Tambah TURN alternatif
    ],
    iceTransportPolicy: 'all'
  });

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('signal', { to: getOtherPeerId(), candidate: event.candidate });
    }
  };

  pc.oniceconnectionstatechange = () => {
    console.log('ICE state:', pc.iceConnectionState);
    if (pc.iceConnectionState === 'failed') {
      pc.restartIce();
      updateConnectionStatus('Koneksi ICE gagal, mencoba ulang...', 'error');
    }
  };

  pc.ondatachannel = (event) => {
    const dc = event.channel;
    setupDataChannel(dc);
  };

  if (isOfferer) {
    const dc = pc.createDataChannel('chat');
    setupDataChannel(dc);
  }
}

function setupDataChannel(dc) {
  dc.onopen = () => {
    console.log('Data channel terbuka');
    updateConnectionStatus('Terhubung dengan teman!', 'connected');
  };
  dc.onmessage = (event) => {
    console.log('Pesan diterima:', event.data);
    displayMessage(event.data, 'received');
    saveMessage(event.data);
    document.getElementById('notification-sound').play().catch(err => console.error('Gagal suara:', err));
  };
  dc.onclose = () => updateConnectionStatus('Teman terputus.', 'disconnected');
}

function sendOffer() {
  pc.createOffer({ offerToReceiveAudio: false, offerToReceiveVideo: false })
    .then(offer => {
      pc.setLocalDescription(offer);
      socket.emit('signal', { to: getOtherPeerId(), offer });
    })
    .catch(err => console.error('Error create offer:', err));
}

function getOtherPeerId() {
  const users = Object.keys(socket.rooms).filter(id => id !== socket.id && id !== roomId);
  return users[0] || null;
}

function promptForPeerConnection() {
  if (!pc) {
    const otherPeerName = prompt('Masukkan nama pengguna teman Anda:');
    if (otherPeerName) {
      socket.emit('join', { room: roomId, name: otherPeerName });
    } else {
      updateConnectionStatus('Menunggu teman bergabung...', 'waiting');
      setTimeout(promptForPeerConnection, 2000);
    }
  }
}

function generateInvite() {
  const inviteLink = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
  navigator.clipboard.writeText(inviteLink).then(() => {
    alert('Link undangan telah disalin!');
  }).catch(() => {
    alert('Gagal menyalin, salin manual: ' + inviteLink);
  });
}

function sendMessage() {
  const messageInput = document.getElementById('message-input');
  const message = messageInput.value.trim();
  if (!message || !pc) return;

  const data = `${username}: ${message}`;
  pc.getSenders().forEach(sender => {
    if (sender.track && sender.track.kind === 'data') {
      sender.send(data);
    }
  });
  displayMessage(data, 'sent');
  saveMessage(data);
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
  const existingStatus = document.getElementById('connection-status');
  if (existingStatus) existingStatus.remove();
  const chatBox = document.getElementById('chat-box');
  chatBox.parentNode.insertBefore(statusElement, chatBox.nextSibling);
}

if (roomId) {
  setTimeout(() => {
    if (!username) {
      username = prompt('Masukkan nama Anda untuk bergabung:');
      if (username) startChat();
    }
  }, 500);
}

// Event listener untuk Enter dan send-button
document.getElementById('message-input').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    sendMessage();
    document.querySelector('.send-button').classList.add('active');
    setTimeout(() => document.querySelector('.send-button').classList.remove('active'), 300);
  }
});

document.querySelector('.send-button').addEventListener('click', () => {
  sendMessage();
  document.querySelector('.send-button').classList.add('active');
  setTimeout(() => document.querySelector('.send-button').classList.remove('active'), 300);
});

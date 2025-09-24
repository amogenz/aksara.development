// Initialize elements
const hamburger = document.querySelector('.hamburger');
const sidebar = document.querySelector('.sidebar');
const main = document.querySelector('.main');
const noteTitle = document.querySelector('.note-title');
const noteEditor = document.querySelector('.note-editor');
const doneBtn = document.querySelector('.done-btn');
const newNoteBtn = document.querySelector('.new-note-btn');
const newFolderBtn = document.querySelector('.new-folder-btn');
const toolbar = document.querySelector('.toolbar');
const formatButtons = document.querySelectorAll('.format-btn');
const fontSelect = document.querySelector('.font-select');
const fontSizeSlider = document.querySelector('.font-size-slider');
const foldersContainer = document.querySelector('.folders');
const modal = document.querySelector('.ios-modal');
const modalMessage = document.querySelector('.modal-message');
const modalCancel = document.querySelector('.modal-cancel');
const modalDelete = document.querySelector('.modal-delete');
const toast = document.querySelector('.toast');
let notes = [];
let currentNoteId = null;
let draftTimer = null;

// Load notes from localStorage safely
function loadNotes() {
  try {
    const storedNotes = localStorage.getItem('aksaraNotes');
    notes = storedNotes ? JSON.parse(storedNotes) : [];
    if (!Array.isArray(notes)) {
      notes = [];
      localStorage.setItem('aksaraNotes', JSON.stringify(notes));
    }
  } catch (e) {
    console.error('Error loading notes:', e);
    alert('Gagal memuat catatan. Penyimpanan mungkin korup.');
    notes = [];
    localStorage.setItem('aksaraNotes', JSON.stringify(notes));
  }
}

// Auto-save draft logic with debounce
function saveDraft() {
  clearTimeout(draftTimer);
  draftTimer = setTimeout(() => {
    const content = noteEditor.innerHTML;
    if (!content && !noteTitle.value) return; // Skip saving empty draft
    const draft = {
      id: `draft-${Date.now()}`,
      title: noteTitle.value,
      content: content,
      font: fontSelect.value,
      fontSize: parseInt(fontSizeSlider.value)
    };
    try {
      localStorage.setItem('aksaraDraft', JSON.stringify(draft));
    } catch (e) {
      alert('Gagal menyimpan draft: Penyimpanan penuh.');
    }
  }, 5000);
}

// Save note to localStorage
function saveNote() {
  try {
    const title = noteTitle.value.trim() || new Date().toLocaleString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const note = {
      id: currentNoteId || Date.now(),
      title,
      content: noteEditor.innerHTML,
      dateCreated: currentNoteId ? (notes.find(n => n.id === currentNoteId)?.dateCreated || Date.now()) : Date.now(),
      dateEdited: Date.now(),
      font: fontSelect.value,
      folder: 'Umum', // Default folder
      fontSize: parseInt(fontSizeSlider.value)
    };
    if (currentNoteId) {
      notes = notes.map(n => n.id === currentNoteId ? note : n);
    } else {
      notes.push(note);
    }
    localStorage.setItem('aksaraNotes', JSON.stringify(notes));
    localStorage.removeItem('aksaraDraft');
    currentNoteId = null;
    noteTitle.value = '';
    noteEditor.innerHTML = '';
    fontSelect.value = 'SF Pro';
    fontSizeSlider.value = 16;
    noteEditor.style.fontFamily = 'SF Pro';
    noteEditor.style.fontSize = '16px';
    showToast('Disimpan!');
    renderSidebar(); // Ensure sidebar updates
    updateMainVisibility(); // Update empty state
  } catch (e) {
    alert('Gagal menyimpan: Penyimpanan penuh.');
  }
}

// Update main visibility based on notes
function updateMainVisibility() {
  main.classList.toggle('empty', notes.length === 0 && !noteTitle.value && !noteEditor.innerHTML);
}

// Render sidebar with folders and notes
function renderSidebar() {
  const folders = [...new Set(notes.map(n => n.folder))];
  foldersContainer.innerHTML = '';
  if (folders.length === 0) {
    folders.push('Umum'); // Ensure default folder exists
  }
  folders.forEach(folder => {
    const folderDiv = document.createElement('div');
    folderDiv.className = 'folder';
    folderDiv.innerHTML = `
      <div class="folder-header">
        <svg viewBox="0 0 16 16" fill="none">
          <path d="M4 6L8 10L12 6" stroke="#FFD700" stroke-width="2"/>
        </svg>
        <span>${folder}</span>
      </div>
      <div class="folder-notes"></div>
    `;
    const folderNotes = folderDiv.querySelector('.folder-notes');
    const folderNotesList = notes.filter(n => n.folder === folder).sort((a, b) => b.dateEdited - a.dateEdited);
    folderNotesList.forEach(note => {
      const noteCard = document.createElement('div');
      noteCard.className = 'note-card';
      noteCard.innerHTML = `
        <h3>${note.title}</h3>
        <p>${note.content.replace(/<[^>]+>/g, '').slice(0, 100) || 'Tanpa konten'}</p>
        <div class="note-actions">
          <button class="edit-note" data-id="${note.id}">
            <svg viewBox="0 0 14 14" fill="none">
              <path d="M2 12L5 9L11 15M5 9L11 3L15 7L9 13L5 9Z" stroke="#FFD700" stroke-width="1.5"/>
            </svg>
          </button>
          <button class="delete-note" data-id="${note.id}">
            <svg viewBox="0 0 14 14" fill="none">
              <path d="M4 2H10M2 4H12M5 4V10M9 4V10M6 2L8 2" stroke="#FFD700" stroke-width="1.5"/>
            </svg>
          </button>
        </div>
      `;
      folderNotes.appendChild(noteCard);
    });
    foldersContainer.appendChild(folderDiv);
  });
  updateMainVisibility(); // Update empty state after rendering sidebar
}

// Load draft if exists
function loadDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem('aksaraDraft'));
    if (draft && (draft.title || draft.content)) {
      noteTitle.value = draft.title || '';
      noteEditor.innerHTML = draft.content || '';
      fontSelect.value = draft.font || 'SF Pro';
      fontSizeSlider.value = draft.fontSize || 16;
      noteEditor.style.fontFamily = draft.font || 'SF Pro';
      noteEditor.style.fontSize = `${draft.fontSize || 16}px`;
      showToast('Draft dimuat!');
      updateMainVisibility(); // Update empty state after loading draft
    }
  } catch (e) {
    console.error('Error loading draft:', e);
    localStorage.removeItem('aksaraDraft');
  }
}

// Show toast notification
function showToast(message) {
  toast.textContent = message;
  toast.style.display = 'block';
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.style.display = 'none';
    }, 300); // Wait for fade-out animation
  }, 2000);
}

// Format text with execCommand or fallback
function formatText(command, value = null) {
  noteEditor.focus();
  try {
    if (command === 'createLink') {
      const url = prompt('Masukkan URL:');
      if (url && /^https?:\/\//.test(url)) {
        document.execCommand(command, false, url);
      } else if (url) {
        alert('URL harus dimulai dengan http:// atau https://');
      }
    } else if (command === 'fontName') {
      const selection = window.getSelection();
      if (selection.rangeCount && !selection.isCollapsed) {
        const range = selection.getRangeAt(0);
        const span = document.createElement('span');
        span.style.fontFamily = value;
        range.surroundContents(span);
      }
    } else if (command === 'fontSize') {
      const selection = window.getSelection();
      if (selection.rangeCount && !selection.isCollapsed) {
        const range = selection.getRangeAt(0);
        const span = document.createElement('span');
        span.style.fontSize = `${value}px`;
        range.surroundContents(span);
      }
    } else {
      document.execCommand(command, false, value);
    }
    saveDraft();
  } catch (e) {
    console.error('Formatting error:', e);
    alert('Gagal menerapkan format.');
  }
}

// Event listeners
hamburger.addEventListener('click', () => {
  sidebar.classList.toggle('open');
});

document.addEventListener('click', (e) => {
  if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && !hamburger.contains(e.target)) {
    sidebar.classList.remove('open');
  }
});

noteTitle.addEventListener('focus', () => toolbar.classList.add('show'));
noteEditor.addEventListener('focus', () => toolbar.classList.add('show'));
noteTitle.addEventListener('blur', () => {
  if (!noteEditor.matches(':focus')) {
    setTimeout(() => toolbar.classList.remove('show'), 100);
  }
});
noteEditor.addEventListener('blur', () => {
  if (!noteTitle.matches(':focus')) {
    setTimeout(() => toolbar.classList.remove('show'), 100);
  }
});

noteTitle.addEventListener('input', () => {
  saveDraft();
  updateMainVisibility();
});
noteEditor.addEventListener('input', () => {
  saveDraft();
  updateMainVisibility();
});

doneBtn.addEventListener('click', saveNote);

formatButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const command = btn.dataset.command;
    const value = btn.dataset.value || null;
    formatText(command, value);
  });
});

fontSelect.addEventListener('change', () => {
  formatText('fontName', fontSelect.value);
  noteEditor.style.fontFamily = fontSelect.value;
  saveDraft();
});

fontSizeSlider.addEventListener('input', () => {
  formatText('fontSize', fontSizeSlider.value);
  noteEditor.style.fontSize = `${fontSizeSlider.value}px`;
  saveDraft();
});

newNoteBtn.addEventListener('click', () => {
  currentNoteId = null;
  noteTitle.value = '';
  noteEditor.innerHTML = '';
  fontSelect.value = 'SF Pro';
  fontSizeSlider.value = 16;
  noteEditor.style.fontFamily = 'SF Pro';
  noteEditor.style.fontSize = '16px';
  sidebar.classList.remove('open');
  noteTitle.focus();
  updateMainVisibility();
});

newFolderBtn.addEventListener('click', () => {
  const folderName = prompt('Nama folder:');
  if (folderName && folderName.trim()) {
    const note = {
      id: Date.now(),
      title: 'Catatan Baru',
      content: '',
      dateCreated: Date.now(),
      dateEdited: Date.now(),
      font: 'SF Pro',
      folder: folderName.trim(),
      fontSize: 16
    };
    notes.push(note);
    try {
      localStorage.setItem('aksaraNotes', JSON.stringify(notes));
      renderSidebar();
      showToast(`Folder "${folderName}" dibuat!`);
    } catch (e) {
      alert('Gagal membuat folder: Penyimpanan penuh.');
    }
  }
});

foldersContainer.addEventListener('click', (e) => {
  const folderHeader = e.target.closest('.folder-header');
  const editNote = e.target.closest('.edit-note');
  const deleteNote = e.target.closest('.delete-note');

  if (folderHeader) {
    folderHeader.classList.toggle('open');
    folderHeader.nextElementSibling.classList.toggle('open');
  }
  if (editNote) {
    const id = parseInt(editNote.dataset.id);
    const note = notes.find(n => n.id === id);
    if (note) {
      currentNoteId = id;
      noteTitle.value = note.title;
      noteEditor.innerHTML = note.content;
      fontSelect.value = note.font;
      fontSizeSlider.value = note.fontSize;
      noteEditor.style.fontFamily = note.font;
      noteEditor.style.fontSize = `${note.fontSize}px`;
      sidebar.classList.remove('open');
      noteEditor.focus();
      updateMainVisibility();
    }
  }
  if (deleteNote) {
    const id = parseInt(deleteNote.dataset.id);
    const note = notes.find(n => n.id === id);
    if (note) {
      modalMessage.textContent = `Catatan '${note.title}' akan dihapus. Tindakan ini tidak bisa dibatalkan.`;
      modal.style.display = 'flex';
      modalDelete.dataset.id = id;
    }
  }
});

modalCancel.addEventListener('click', () => {
  modal.style.display = 'none';
});

modalDelete.addEventListener('click', () => {
  const id = parseInt(modalDelete.dataset.id);
  notes = notes.filter(n => n.id !== id);
  try {
    localStorage.setItem('aksaraNotes', JSON.stringify(notes));
    modal.style.display = 'none';
    showToast('Dihapus!');
    renderSidebar();
    if (currentNoteId === id) {
      currentNoteId = null;
      noteTitle.value = '';
      noteEditor.innerHTML = '';
      fontSelect.value = 'SF Pro';
      fontSizeSlider.value = 16;
      noteEditor.style.fontFamily = 'SF Pro';
      noteEditor.style.fontSize = '16px';
    }
    updateMainVisibility();
  } catch (e) {
    alert('Gagal menghapus: Penyimpanan penuh.');
  }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && noteEditor === document.activeElement) {
    e.preventDefault();
    if (e.key === 'b') formatText('bold');
    if (e.key === 'i') formatText('italic');
    if (e.key === 'u') formatText('underline');
  }
});

// Adjust main height for mobile keyboard
function adjustMainHeight() {
  main.style.height = `calc(100vh - ${toolbar.offsetHeight + 60}px)`;
}

window.addEventListener('resize', adjustMainHeight);

// Initial setup
loadNotes();
renderSidebar();
loadDraft();
adjustMainHeight();
sidebar.classList.add('open');
setTimeout(() => sidebar.classList.remove('open'), 1000);

// Prevent default paste behavior to avoid unwanted formatting
noteEditor.addEventListener('paste', (e) => {
  e.preventDefault();
  const text = (e.clipboardData || window.clipboardData).getData('text');
  document.execCommand('insertText', false, text);
});

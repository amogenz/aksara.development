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
      console.warn('Invalid notes data, resetting to empty array');
      notes = [];
      localStorage.setItem('aksaraNotes', JSON.stringify(notes));
    }
  } catch (e) {
    console.error('Error loading notes:', e);
    alert('Gagal memuat catatan. Penyimpanan mungkin korup.');
    notes = [];
    localStorage.setItem('aksaraNotes', JSON.stringify(notes));
  }
  updateMainVisibility();
}

// Auto-save draft logic with debounce
function saveDraft() {
  clearTimeout(draftTimer);
  draftTimer = setTimeout(() => {
    const content = noteEditor.innerHTML.trim();
    const title = noteTitle.value.trim();
    if (!content && !title) return;
    const draft = {
      id: `draft-${Date.now()}`,
      title: title,
      content: content,
      font: fontSelect.value,
      fontSize: parseInt(fontSizeSlider.value)
    };
    try {
      localStorage.setItem('aksaraDraft', JSON.stringify(draft));
      console.log('Draft saved:', draft);
    } catch (e) {
      console.error('Error saving draft:', e);
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
    const content = noteEditor.innerHTML.trim();
    if (!title && !content) {
      showToast('Catatan kosong, tidak disimpan.');
      return;
    }
    const note = {
      id: currentNoteId || Date.now(),
      title,
      content,
      dateCreated: currentNoteId ? (notes.find(n => n.id === currentNoteId)?.dateCreated || Date.now()) : Date.now(),
      dateEdited: Date.now(),
      font: fontSelect.value,
      folder: 'Umum',
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
    renderSidebar();
    updateMainVisibility();
    console.log('Note saved:', note);
  } catch (e) {
    console.error('Error saving note:', e);
    alert('Gagal menyimpan: Penyimpanan penuh.');
  }
}

// Update main visibility based on notes and editor state
function updateMainVisibility() {
  const isEmpty = notes.length === 0 && !noteTitle.value.trim() && !noteEditor.innerHTML.trim();
  main.classList.toggle('empty', isEmpty);
}

// Render sidebar with folders and notes
function renderSidebar() {
  foldersContainer.innerHTML = '';
  const folders = [...new Set(notes.map(n => n.folder))];
  if (folders.length === 0) {
    folders.push('Umum');
  }
  folders.forEach(folder => {
    const folderDiv = document.createElement('div');
    folderDiv.className = 'folder';
    folderDiv.innerHTML = `
      <div class="folder-header">
        <svg class="folder-icon" viewBox="0 0 24 24" fill="none" stroke="#FFD700" stroke-width="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        <span>${folder}</span>
        <svg class="chevron" viewBox="0 0 16 16" fill="none">
          <path d="M4 6L8 10L12 6" stroke="#FFD700" stroke-width="2"/>
        </svg>
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
            <svg viewBox="0 0 24 24" fill="none" stroke="#FFD700" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="delete-note" data-id="${note.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="#FFD700" stroke-width="2">
              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6v15a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6"/>
              <path d="M10 11v6M14 11v6"/>
            </svg>
          </button>
        </div>
      `;
      folderNotes.appendChild(noteCard);
    });
    foldersContainer.appendChild(folderDiv);
  });
  updateMainVisibility();
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
      updateMainVisibility();
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
    }, 300);
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

doneBtn.addEventListener('click', () => {
  saveNote();
});

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
  console.log('New note button clicked');
  currentNoteId = null;
  noteTitle.value = '';
  noteEditor.innerHTML = '';
  fontSelect.value = 'SF Pro';
  fontSizeSlider.value = 16;
  noteEditor.style.fontFamily = 'SF Pro';
  noteEditor.style.fontSize = '16px';
  sidebar.classList.remove('open');
  noteTitle.focus();
  toolbar.classList.add('show');
  updateMainVisibility();
  console.log('Editor reset, focus set to noteTitle');
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
      updateMainVisibility();
    } catch (e) {
      console.error('Error creating folder:', e);
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
      toolbar.classList.add('show');
      updateMainVisibility();
    }
  }
  if (deleteNote) {
    const id = parseInt(deleteNote.dataset.id);
    const note = notes.find(n => n.id === id);
    if (note) {
      modalMessage.textContent = 'Tindakan ini tidak dapat dibatalkan.';
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
    console.error('Error deleting note:', e);
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

// Adjust toolbar position for mobile keyboard
function adjustToolbarPosition() {
  if (window.visualViewport) {
    const viewport = window.visualViewport;
    const isKeyboardVisible = window.innerHeight > viewport.height + 50;
    if (isKeyboardVisible) {
      toolbar.style.position = 'fixed';
      toolbar.style.top = `${viewport.height}px`;
      toolbar.style.bottom = 'auto';
      toolbar.style.transform = 'translateY(0)';
    } else {
      toolbar.style.position = 'fixed';
      toolbar.style.top = 'auto';
      toolbar.style.bottom = '0';
      toolbar.style.transform = 'translateY(100%)';
      if (toolbar.classList.contains('show')) {
        toolbar.style.transform = 'translateY(0)';
      }
    }
  } else {
    toolbar.style.position = 'fixed';
    toolbar.style.top = 'auto';
    toolbar.style.bottom = '0';
  }
}

window.addEventListener('resize', adjustToolbarPosition);
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', adjustToolbarPosition);
}

// Adjust main height
function adjustMainHeight() {
  main.style.height = `calc(100vh - ${toolbar.offsetHeight + 60}px)`;
}

window.addEventListener('resize', adjustMainHeight);

// Initial setup
loadNotes();
renderSidebar();
loadDraft();
adjustMainHeight();
adjustToolbarPosition();
sidebar.classList.add('open');
setTimeout(() => sidebar.classList.remove('open'), 1000);

// Prevent default paste behavior
noteEditor.addEventListener('paste', (e) => {
  e.preventDefault();
  const text = (e.clipboardData || window.clipboardData).getData('text');
  document.execCommand('insertText', false, text);
});

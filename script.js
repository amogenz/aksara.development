/* Reset dan pengaturan dasar */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro', sans-serif;
  background: #1A1A1A;
  color: #fff;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Header */
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: rgba(0, 0, 0, 0.9);
  border-bottom: 1px solid rgba(255, 215, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 1000;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hamburger {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  min-width: 44px;
}

.hamburger svg path {
  transition: stroke 0.3s ease-in-out;
}

.hamburger:hover svg path {
  stroke: #fff;
}

.logo {
  width: 40px;
  height: 40px;
  border-radius: 8px;
}

.app-title {
  font-size: 24px;
  font-weight: 600;
  color: #FFD700;
}

.done-btn {
  background: #FFD700;
  color: #000;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 17px;
  font-weight: 400;
  cursor: pointer;
  min-width: 44px;
  transition: opacity 0.3s ease-in-out;
}

/* Sidebar */
.sidebar {
  position: fixed;
  top: 60px;
  left: -80%;
  width: 80%;
  height: calc(100vh - 60px);
  background: #1C2526;
  border-right: 1px solid rgba(255, 215, 0, 0.2);
  transition: transform 0.3s ease-in-out;
  will-change: transform;
  z-index: 999;
}

.sidebar.open {
  transform: translateX(100%);
}

@media (min-width: 768px) {
  .sidebar {
    width: 50%;
    left: -50%;
  }
}

.folders {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.folder {
  margin-bottom: 12px;
}

.folder-header {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 12px 16px;
  font-size: 17px;
  font-weight: 600;
  color: #FFD700;
  background: rgba(255, 215, 0, 0.05);
  border-radius: 10px;
  transition: background 0.3s ease-in-out;
}

.folder-header:hover {
  background: rgba(255, 215, 0, 0.1);
}

.folder-header svg {
  width: 16px;
  height: 16px;
  margin-right: 12px;
  transition: transform 0.3s ease-in-out;
}

.folder-header.open svg {
  transform: rotate(90deg);
}

.folder-icon {
  width: 20px;
  height: 20px;
  margin-right: 12px;
}

.folder-notes {
  display: none;
  padding: 8px 16px 8px 44px;
}

.folder-notes.open {
  display: block;
}

.note-card {
  background: rgba(255, 255, 255, 0.08);
  padding: 12px 16px;
  margin-bottom: 8px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.3s ease-in-out;
}

.note-card:hover {
  background: rgba(255, 255, 255, 0.12);
}

.note-card h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 400;
  color: #fff;
}

.note-card p {
  margin: 4px 0 0;
  font-size: 15px;
  opacity: 0.7;
  color: #fff;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.note-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.note-actions button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  min-width: 44px;
}

.note-actions svg {
  width: 16px;
  height: 16px;
}

.sidebar-footer {
  position: sticky;
  bottom: 0;
  background: #1C2526;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.new-note-btn, .new-folder-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  background: none;
  border: none;
  color: #FFD700;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 17px;
  font-weight: 400;
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: background 0.3s ease-in-out;
}

.new-note-btn:hover, .new-folder-btn:hover {
  background: rgba(255, 215, 0, 0.1);
}

.new-note-btn svg, .new-folder-btn svg {
  width: 20px;
  height: 20px;
}

/* Main Content */
.main {
  flex: 1;
  margin-top: 60px;
  padding: 16px;
  overflow-y: auto;
  position: relative;
  display: flex;
  flex-direction: column;
}

/* Empty State */
.empty-state {
  display: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.main.empty .empty-state {
  display: flex;
}

.main.empty .note-title,
.main.empty .note-editor {
  display: none;
}

.empty-icon {
  font-size: 32px;
  opacity: 0.6;
}

.empty-state p {
  font-size: 16px;
  opacity: 0.4;
  margin-top: 8px;
}

.note-title {
  width: 100%;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 18px;
  font-style: italic;
  padding: 16px 16px 8px;
  outline: none;
  display: block;
}

.note-editor {
  flex: 1;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 16px;
  padding: 0 16px;
  outline: none;
  line-height: 1.5;
  font-family: 'SF Pro', -apple-system, BlinkMacSystemFont, sans-serif;
  display: block;
}

.note-editor:empty::before {
  content: attr(data-placeholder);
  opacity: 0.2;
  display: block;
}

/* Toolbar */
.toolbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.9);
  border-top: 1px solid rgba(255, 215, 0, 0.2);
  padding: 8px 16px;
  display: flex;
  gap: 8px;
  align-items: center;
  opacity: 0;
  transform: translateY(100%);
  transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
  will-change: opacity, transform;
  z-index: 998;
}

.toolbar.show {
  opacity: 1;
  transform: translateY(0);
}

@media (min-width: 768px) {
  .toolbar {
    position: absolute;
    top: 70px;
    left: 50%;
    transform: translateX(-50%) translateY(-100%);
    bottom: auto;
    border-radius: 20px;
    padding: 8px 16px;
  }

  .toolbar.show {
    transform: translateX(-50%) translateY(0);
  }
}

.format-btn {
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.3);
  color: #FFD700;
  padding: 8px;
  border-radius: 12px;
  cursor: pointer;
  min-width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s ease-in-out;
}

.format-btn:hover {
  background: rgba(255, 215, 0, 0.2);
}

.format-btn svg {
  width: 20px;
  height: 20px;
}

.font-select {
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.3);
  color: #FFD700;
  padding: 8px;
  border-radius: 12px;
  font-size: 16px;
  min-width: 120px;
  cursor: pointer;
}

.font-size-slider {
  width: 100px;
  accent-color: #FFD700;
}

/* Modal */
.ios-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
}

.ios-modal[style*="display: flex"] {
  opacity: 1;
}

.modal-content {
  background: #1C2526;
  border-radius: 13px;
  padding: 16px;
  width: 90%;
  max-width: 300px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.modal-title {
  font-size: 17px;
  font-weight: 600;
  margin: 0 0 8px;
  text-align: center;
  color: #fff;
}

.modal-message {
  font-size: 17px;
  opacity: 0.8;
  margin: 0 0 16px;
  text-align: center;
  color: #fff;
}

.modal-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.modal-cancel {
  background: #8E8E93;
  border: none;
  color: #fff;
  padding: 12px;
  border-radius: 10px;
  font-size: 17px;
  font-weight: 400;
  cursor: pointer;
  text-align: center;
}

.modal-delete {
  background: #FF3B30;
  border: none;
  color: #fff;
  padding: 12px;
  border-radius: 10px;
  font-size: 17px;
  font-weight: 400;
  cursor: pointer;
  text-align: center;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 16px;
  right: 16px;
  background: #FFD700;
  color: #000;
  padding: 8px 16px;
  border-radius: 8px;
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
  z-index: 1002;
}

.toast.show {
  opacity: 1;
}

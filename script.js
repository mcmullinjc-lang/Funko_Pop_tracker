(function() {
  const STORAGE_KEY = 'funko-collection-items';
  const FOLDERS_KEY = 'funko-collection-folders';
  let items = [];
  let folders = [];
  let filter = 'all';
  let activeFolder = 'all';
  let search = '';
  let pendingPhoto = null;

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      items = raw ? JSON.parse(raw) : [];
    } catch (e) { items = []; }
    try {
      const rawF = localStorage.getItem(FOLDERS_KEY);
      folders = rawF ? JSON.parse(rawF) : [];
    } catch (e) { folders = []; }
  }

  function saveFolders() {
    try {
      localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
    } catch (e) { console.error('Could not save folders', e); }
  }

  function ensureFolder(name) {
    const clean = name.trim();
    if (clean && !folders.includes(clean)) {
      folders.push(clean);
      saveFolders();
    }
    return clean;
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) { console.error('Could not save', e); }
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function fileToDataUrl(file, cb) {
    const reader = new FileReader();
    reader.onload = () => cb(reader.result);
    reader.onerror = () => cb(null);
    reader.readAsDataURL(file);
  }

  function renderFolderTabs() {
    const wrap = document.getElementById('folderTabs');
    wrap.innerHTML = '';

    const allBtn = document.createElement('button');
    allBtn.className = 'folder-tab' + (activeFolder === 'all' ? ' active' : '');
    allBtn.textContent = 'All';
    allBtn.addEventListener('click', () => { activeFolder = 'all'; renderFolderTabs(); render(); });
    wrap.appendChild(allBtn);

    folders.forEach(f => {
      const btn = document.createElement('button');
      btn.className = 'folder-tab' + (activeFolder === f ? ' active' : '');
      btn.textContent = f;
      btn.addEventListener('click', () => { activeFolder = f; renderFolderTabs(); render(); });
      wrap.appendChild(btn);
    });

    const hasUnsorted = items.some(it => !it.folder);
    if (hasUnsorted) {
      const btn = document.createElement('button');
      btn.className = 'folder-tab' + (activeFolder === '__unsorted__' ? ' active' : '');
      btn.textContent = 'Unsorted';
      btn.addEventListener('click', () => { activeFolder = '__unsorted__'; renderFolderTabs(); render(); });
      wrap.appendChild(btn);
    }
  }

  function populateFolderSelect() {
    const sel = document.getElementById('folderSelect');
    const current = sel.value;
    sel.innerHTML = '<option value="">No folder</option>';
    folders.forEach(f => {
      const opt = document.createElement('option');
      opt.value = f;
      opt.textContent = f;
      sel.appendChild(opt);
    });
    if ([...sel.options].some(o => o.value === current)) sel.value = current;
    else if (activeFolder !== 'all' && activeFolder !== '__unsorted__') sel.value = activeFolder;
  }

  function render() {
    const list = document.getElementById('list');
    const empty = document.getElementById('emptyState');
    list.innerHTML = '';

    const filtered = items.filter(it => {
      if (filter === 'owned' && !it.owned) return false;
      if (filter === 'missing' && it.owned) return false;
      if (activeFolder !== 'all') {
        const itFolder = it.folder || '';
        if (activeFolder === '__unsorted__') {
          if (itFolder) return false;
        } else if (itFolder !== activeFolder) {
          return false;
        }
      }
      if (search) {
        const hay = (it.name + ' ' + (it.series || '') + ' ' + (it.number || '') + ' ' + (it.tags || []).join(' ')).toLowerCase();
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      empty.style.display = 'block';
      empty.textContent = items.length === 0
        ? "No pops yet — add your first one above! 🌸"
        : "Nothing matches your filter/search. 🔍";
    } else {
      empty.style.display = 'none';
    }

    filtered.forEach(it => {
      const li = document.createElement('li');
      li.className = 'item';

      const thumb = document.createElement('label');
      thumb.className = 'thumb';
      thumb.title = 'Click to add/change photo';
      if (it.image) {
        const img = document.createElement('img');
        img.src = it.image;
        thumb.appendChild(img);
      } else {
        thumb.textContent = '🧸';
      }
      const thumbInput = document.createElement('input');
      thumbInput.type = 'file';
      thumbInput.accept = 'image/*';
      thumbInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        fileToDataUrl(file, (dataUrl) => {
          it.image = dataUrl;
          save();
          render();
        });
      });
      thumb.appendChild(thumbInput);

      const toggle = document.createElement('button');
      toggle.className = 'toggle' + (it.owned ? ' owned' : '');
      toggle.innerHTML = it.owned ? '✓' : '';
      toggle.title = it.owned ? 'Mark as missing' : 'Mark as owned';
      toggle.addEventListener('click', () => {
        it.owned = !it.owned;
        save();
        render();
      });

      const info = document.createElement('div');
      info.className = 'item-info';
      const nameEl = document.createElement('div');
      nameEl.className = 'item-name';
      nameEl.textContent = it.name + (it.number ? ' #' + it.number : '');
      const metaEl = document.createElement('div');
      metaEl.className = 'item-meta';
      metaEl.textContent = it.series || '';
      info.appendChild(nameEl);
      if (it.series) info.appendChild(metaEl);
      const folderBadge = document.createElement('span');
      folderBadge.className = 'folder-badge';
      folderBadge.textContent = '📁 ' + (it.folder || 'No folder');
      folderBadge.title = 'Click to move to a different folder';
      folderBadge.addEventListener('click', () => {
        const input = window.prompt('Move "' + it.name + '" to which folder? (leave blank for none)', it.folder || '');
        if (input === null) return;
        const clean = input.trim();
        it.folder = clean ? ensureFolder(clean) : '';
        save();
        renderFolderTabs();
        render();
      });
      info.appendChild(folderBadge);
      if (it.tags && it.tags.length) {
        const tagRow = document.createElement('div');
        tagRow.className = 'tag-row';
        it.tags.forEach(tag => {
          const pill = document.createElement('span');
          pill.className = 'tag-pill';
          pill.textContent = tag;
          tagRow.appendChild(pill);
        });
        info.appendChild(tagRow);
      }

      const tagEditBtn = document.createElement('button');
      tagEditBtn.className = 'tag-edit-btn';
      tagEditBtn.innerHTML = '🏷️';
      tagEditBtn.title = 'Edit tags';
      tagEditBtn.type = 'button';
      tagEditBtn.addEventListener('click', () => {
        const current = (it.tags || []).join(', ');
        const input = window.prompt('Tags for "' + it.name + '" (comma-separated, e.g. Chase, Store Exclusive):', current);
        if (input === null) return;
        it.tags = input.split(',').map(t => t.trim()).filter(Boolean);
        save();
        render();
      });

      const badge = document.createElement('span');
      badge.className = 'badge ' + (it.owned ? 'owned' : 'missing');
      badge.textContent = it.owned ? 'Owned' : 'Missing';

      const del = document.createElement('button');
      del.className = 'delete-btn';
      del.innerHTML = '✕';
      del.title = 'Remove';
      del.addEventListener('click', () => {
        items = items.filter(x => x.id !== it.id);
        save();
        render();
      });

      li.appendChild(thumb);
      li.appendChild(toggle);
      li.appendChild(info);
      li.appendChild(badge);
      li.appendChild(tagEditBtn);
      li.appendChild(del);
      list.appendChild(li);
    });

    const total = items.length;
    const owned = items.filter(i => i.owned).length;
    document.getElementById('statTotal').textContent = total;
    document.getElementById('statOwned').textContent = owned;
    document.getElementById('statMissing').textContent = total - owned;
    document.getElementById('progressFill').style.width = total ? Math.round((owned / total) * 100) + '%' : '0%';
  }

  function onAddPhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    fileToDataUrl(file, (dataUrl) => {
      pendingPhoto = dataUrl;
      resetAddPhotoUI(dataUrl);
    });
  }

  function resetAddPhotoUI(dataUrl) {
    const btn = document.getElementById('addPhotoBtn');
    btn.innerHTML = '';
    if (dataUrl) {
      const img = document.createElement('img');
      img.src = dataUrl;
      btn.appendChild(img);
    } else {
      const span = document.createElement('span');
      span.id = 'addPhotoIcon';
      span.textContent = '📷';
      btn.appendChild(span);
    }
    const freshInput = document.createElement('input');
    freshInput.type = 'file';
    freshInput.accept = 'image/*';
    freshInput.id = 'addPhotoInput';
    freshInput.addEventListener('change', onAddPhotoChange);
    btn.appendChild(freshInput);
  }

  document.getElementById('addPhotoInput').addEventListener('change', onAddPhotoChange);

  document.getElementById('addFolderForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const input = document.getElementById('newFolderInput');
    const name = input.value.trim();
    if (!name) return;
    const clean = ensureFolder(name);
    if (clean) {
      activeFolder = clean;
      input.value = '';
      renderFolderTabs();
      populateFolderSelect();
      render();
    }
  });

  document.getElementById('addForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const name = (fd.get('name') || '').toString().trim();
    if (!name) return;
    const tagsRaw = (fd.get('tags') || '').toString();
    const tags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean);
    const folder = (fd.get('folder') || '').toString();
    items.push({
      id: uid(),
      name,
      series: (fd.get('series') || '').toString().trim(),
      number: (fd.get('number') || '').toString().trim(),
      owned: false,
      image: pendingPhoto,
      tags,
      folder: folder || ''
    });
    save();
    e.target.reset();
    pendingPhoto = null;
    resetAddPhotoUI(null);
    populateFolderSelect();
    renderFolderTabs();
    render();
  });

  document.getElementById('filters').addEventListener('click', function(e) {
    const btn = e.target.closest('button[data-filter]');
    if (!btn) return;
    filter = btn.dataset.filter;
    document.querySelectorAll('#filters button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    render();
  });

  document.getElementById('searchInput').addEventListener('input', function(e) {
    search = e.target.value;
    render();
  });

  load();
  renderFolderTabs();
  populateFolderSelect();
  render();
})();

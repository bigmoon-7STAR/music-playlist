// --- 1. 変数の宣言（一貫性を持たせる） ---
let db, tracks = [], playlists = [], isEditing = false, currentView = 'library', currentPlaylistId = null;
let editingTrackId = null, selectedTrackIds = [], currentTrackIdx = -1;
const audio = document.getElementById('audio-element');

// --- 2. ピッカーを開く（現在のプレイリストの曲を反映） ---
function openPicker() {
    const pl = playlists.find(p => p.id === currentPlaylistId);
    if (!pl) return;

    // 現在のプレイリストに入っているIDをセット（なければ空配列）
    selectedTrackIds = pl.songIds ? [...pl.songIds] : [];
    
    const list = document.getElementById('picker-list');
    list.innerHTML = tracks.map(t => `
        <div class="list-item" onclick="togglePicker(${t.id}, this)" style="display:flex; align-items:center; padding:12px; border-bottom:1px solid #eee;">
            <img src="${t.cover || ''}" style="width:40px; height:40px; border-radius:4px; margin-right:12px; object-fit:cover;">
            <div style="flex:1;">
                <div style="font-weight:600;">${t.name}</div>
                <div style="font-size:12px; color:#888;">${t.artist}</div>
            </div>
            <i class="fa-solid fa-circle-check picker-check" style="font-size:20px; color:${selectedTrackIds.includes(t.id) ? 'var(--key-color)' : '#ddd'};"></i>
        </div>
    `).join('');

    const modal = document.getElementById('picker-modal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
}

// --- 3. チェックの切り替えロジック ---
function togglePicker(id, el) {
    const icon = el.querySelector('.picker-check');
    if (selectedTrackIds.includes(id)) {
        selectedTrackIds = selectedTrackIds.filter(tid => tid !== id);
        icon.style.color = '#ddd';
    } else {
        selectedTrackIds.push(id);
        icon.style.color = 'var(--key-color)';
    }
}

// --- 4. 重要：保存処理（DBに書き込んでから画面を更新） ---
function savePickerSelection() {
    const pl = playlists.find(p => p.id === currentPlaylistId);
    if (!pl) return;

    // 最新の選択状態をプレイリストオブジェクトに反映
    pl.songIds = selectedTrackIds;

    const tx = db.transaction("playlists", "readwrite");
    const store = tx.objectStore("playlists");
    const request = store.put(pl);

    request.onsuccess = () => {
        console.log("プレイリストを更新しました");
        closePicker(); // モーダルを閉じる
        loadAll();    // IndexedDBから最新データを読み直して再描画
    };

    request.onerror = () => {
        alert("保存に失敗しました。");
    };
}

// --- 5. モーダルを閉じる ---
function closePicker() {
    const modal = document.getElementById('picker-modal');
    modal.classList.remove('active');
    setTimeout(() => { modal.style.display = 'none'; }, 400);
}

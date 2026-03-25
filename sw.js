// --- ヘッダー右ボタン（＋ボタン）の挙動を修正 ---
function handleHeaderRight() {
    if (currentView === 'library') {
        // ライブラリ画面ならファイルアップロード
        document.getElementById('audio-upload').click();
    } else if (currentPlaylistId === null) {
        // プレイリスト一覧画面なら新規作成
        createPlaylist();
    } else {
        // プレイリスト詳細画面なら「曲を追加モーダル」を開く
        openPicker();
    }
}

// --- 曲選択モーダル（ピッカー）の呼び出しを強化 ---
function openPicker() {
    const pl = playlists.find(p => p.id === currentPlaylistId);
    if (!pl) return;

    // 現在のプレイリストに含まれている曲IDを取得（なければ空配列）
    selectedTrackIds = pl.songIds ? [...pl.songIds] : [];
    
    const list = document.getElementById('picker-list');
    // 全楽曲（tracks）を表示し、選択済みにはチェックを入れる
    list.innerHTML = tracks.map(t => `
        <div class="picker-item ${selectedTrackIds.includes(t.id) ? 'selected' : ''}" 
             id="p-item-${t.id}" 
             onclick="togglePicker(${t.id}, this)"
             style="display:flex; align-items:center; padding:12px; border-bottom:1px solid #eee; cursor:pointer;">
            <img src="${t.cover || ''}" style="width:45px; height:45px; border-radius:4px; margin-right:12px; object-fit:cover; background:#f0f0f0;">
            <div style="flex:1;">
                <div style="font-weight:600; font-size:14px;">${t.name}</div>
                <div style="font-size:11px; color:#888;">${t.artist || '不明'}</div>
            </div>
            <i class="fa-solid fa-circle-check picker-check" style="font-size:20px; color:${selectedTrackIds.includes(t.id) ? 'var(--key-color)' : '#ddd'};"></i>
        </div>
    `).join('');

    const modal = document.getElementById('picker-modal');
    modal.style.display = 'flex';
    // アニメーション用に微小な遅延を入れて active クラスを付与
    setTimeout(() => modal.classList.add('active'), 10);
}

// --- チェックの切り替え ---
function togglePicker(id, el) {
    const icon = el.querySelector('.picker-check');
    if (selectedTrackIds.includes(id)) {
        selectedTrackIds = selectedTrackIds.filter(tid => tid !== id);
        el.classList.remove('selected');
        icon.style.color = '#ddd';
    } else {
        selectedTrackIds.push(id);
        el.classList.add('selected');
        icon.style.color = 'var(--key-color)';
    }
}

// --- 保存処理（ここが重要：DB書き込み後に画面更新） ---
function savePickerSelection() {
    const pl = playlists.find(p => p.id === currentPlaylistId);
    if (!pl) return;

    pl.songIds = selectedTrackIds; // 選択したID配列をセット
    
    const tx = db.transaction("playlists", "readwrite");
    const store = tx.objectStore("playlists");
    const request = store.put(pl);

    request.onsuccess = () => {
        console.log("プレイリストを更新しました");
        closePicker();
        loadAll(); // 最新のデータを再読み込みして描画
    };
    
    request.onerror = (err) => {
        console.error("保存失敗:", err);
        alert("保存できませんでした。");
    };
}

function closePicker() {
    const modal = document.getElementById('picker-modal');
    modal.classList.remove('active');
    setTimeout(() => { modal.style.display = 'none'; }, 400);
}

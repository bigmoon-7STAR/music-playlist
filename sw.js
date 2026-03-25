// --- 1. 変数の宣言 ---
let isShuffle = false;  // シャッフル状態
let repeatMode = 0;     // 0:オフ, 1:全曲, 2:1曲
let db, tracks = [], playlists = [], isEditing = false, currentView = 'library', currentPlaylistId = null;
let editingTrackId = null, selectedTrackIds = [], currentTrackIdx = -1;
let playingTracks = [], isShuffle = false, repeatMode = 0; 

let editingTrackId = null, selectedTrackIds = [], currentTrackIdx = -1;
let playingTracks = []; // ← これを追加！今再生している「範囲」を覚えるための変数です
let isShuffle = false;  // ← ついでにシャッフル状態もここで宣言
let repeatMode = 0;     // ← リピート状態もここで宣言
const audio = document.getElementById('audio-element');

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

// --- 6. 再生ロジック (シャッフル・リピート・プレイリスト対応) ---
function playSong(id) {
    // 再生範囲を決定
    if (currentPlaylistId !== null) {
        const pl = playlists.find(p => p.id === currentPlaylistId);
        playingTracks = tracks.filter(t => pl.songIds.includes(t.id));
    } else {
        playingTracks = tracks;
    }

    const t = tracks.find(x => x.id === id);
    if (!t) return;
    
    // 再生リスト内での現在の順番を特定
    currentTrackIdx = playingTracks.findIndex(x => x.id === id);

    if (audio.src) URL.revokeObjectURL(audio.src);
    audio.src = URL.createObjectURL(t.data);

    // ミニプレイヤーの画像制御
    const mImg = document.getElementById('m-img');
    mImg.src = t.cover || '';
    mImg.style.display = t.cover ? 'block' : 'none'; 

    document.getElementById('m-title').innerText = t.name;
    document.getElementById('f-title').innerText = t.name;
    document.getElementById('f-artist').innerText = t.artist || '不明';
    document.getElementById('f-img').src = t.cover || '';
    document.getElementById('bg-blur').style.backgroundImage = t.cover ? `url(${t.cover})` : 'none';
    document.getElementById('mini').style.display = 'flex';
    audio.play();
}

function toggleShuffle() {
    isShuffle = !isShuffle;
    document.getElementById('btn-shuffle').style.color = isShuffle ? 'var(--key-color)' : 'rgba(255,255,255,0.5)';
}

function toggleRepeat() {
    repeatMode = (repeatMode + 1) % 3;
    const btn = document.getElementById('btn-repeat');
    const badge = document.getElementById('repeat-badge');
    if (repeatMode === 0) { btn.style.color = 'rgba(255,255,255,0.5)'; badge.style.display = 'none'; }
    else if (repeatMode === 1) { btn.style.color = 'var(--key-color)'; badge.style.display = 'none'; }
    else { btn.style.color = 'var(--key-color)'; badge.style.display = 'block'; }
}

        function toggleShuffle() {
            isShuffle = !isShuffle;
            document.getElementById('btn-shuffle').style.color = isShuffle ? 'var(--key-color)' : 'rgba(255,255,255,0.5)';
        }

        function toggleRepeat() {
            repeatMode = (repeatMode + 1) % 3;
            const btn = document.getElementById('btn-repeat');
            const badge = document.getElementById('repeat-badge');
            if (repeatMode === 0) { btn.style.color = 'rgba(255,255,255,0.5)'; badge.style.display = 'none'; }
            else if (repeatMode === 1) { btn.style.color = 'var(--key-color)'; badge.style.display = 'none'; }
            else { btn.style.color = 'var(--key-color)'; badge.style.display = 'block'; }
        }

        function next() { 
            if (playingTracks.length === 0) return;
            if (isShuffle) {
                let nextIdx = Math.floor(Math.random() * playingTracks.length);
                if (nextIdx === currentTrackIdx && playingTracks.length > 1) nextIdx = (nextIdx + 1) % playingTracks.length;
                playSong(playingTracks[nextIdx].id);
            } else {
                if (currentTrackIdx < playingTracks.length - 1) playSong(playingTracks[currentTrackIdx + 1].id); 
                else if (repeatMode === 1) playSong(playingTracks[0].id); 
            }
        }

        function prev() { 
            if (audio.currentTime > 3) audio.currentTime = 0; 
            else if (currentTrackIdx > 0) playSong(playingTracks[currentTrackIdx - 1].id); 
            else if (repeatMode === 1) playSong(playingTracks[playingTracks.length - 1].id);
        }

        audio.onended = () => { 
            if (repeatMode === 2) { audio.currentTime = 0; audio.play(); } 
            else { next(); }
        };

audio.onended = () => { 
    if (repeatMode === 2) { audio.currentTime = 0; audio.play(); } 
    else { next(); }
};


// --- 5. モーダルを閉じる ---
function closePicker() {
    const modal = document.getElementById('picker-modal');
    modal.classList.remove('active');
    setTimeout(() => { modal.style.display = 'none'; }, 400);
}
        function playSong(id) {
            // 再生範囲を判定
            if (currentPlaylistId !== null) {
                const pl = playlists.find(p => p.id === currentPlaylistId);
                playingTracks = tracks.filter(t => pl.songIds.includes(t.id));
            } else {
                playingTracks = tracks;
            }

            const t = tracks.find(x => x.id === id);
            if (!t) return;
            currentTrackIdx = playingTracks.findIndex(x => x.id === id);

            if (audio.src) URL.revokeObjectURL(audio.src);
            audio.src = URL.createObjectURL(t.data);

            const mImg = document.getElementById('m-img');
            mImg.src = t.cover || '';
            mImg.style.display = t.cover ? 'block' : 'none'; 

            document.getElementById('m-title').innerText = t.name;
            document.getElementById('f-title').innerText = t.name;
            document.getElementById('f-artist').innerText = t.artist || '不明';
            document.getElementById('f-img').src = t.cover || '';
            document.getElementById('bg-blur').style.backgroundImage = t.cover ? `url(${t.cover})` : 'none';
            document.getElementById('mini').style.display = 'flex';
            audio.play();
        }


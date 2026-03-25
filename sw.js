let db, tracks = [], playlists = [], isEditing = false, currentView = 'library', currentPlaylistId = null;
let selectedTrackIds = []; 
const player = document.getElementById('audio');

// 1. データベースの接続（バージョンを上げて確実に初期化）
const req = indexedDB.open("MusicStudioModernDB", 2); 
req.onupgradeneeded = (e) => {
    let d = e.target.result;
    if(!d.objectStoreNames.contains("songs")) d.createObjectStore("songs", {keyPath:"id", autoIncrement:true});
    if(!d.objectStoreNames.contains("playlists")) d.createObjectStore("playlists", {keyPath:"id", autoIncrement:true});
};
req.onsuccess = (e) => { db = e.target.result; loadAll(); };

// 2. データの読み込み
function loadAll() {
    const tx = db.transaction(["songs", "playlists"], "readonly");
    tx.objectStore("songs").getAll().onsuccess = (e) => tracks = e.target.result;
    tx.objectStore("playlists").getAll().onsuccess = (e) => {
        playlists = e.target.result;
        render();
    };
}

// 3. 画面の切り替えと表示
function switchTab(view) {
    currentView = view; currentPlaylistId = null; isEditing = false;
    document.getElementById('tab-lib').classList.toggle('active', view === 'library');
    document.getElementById('tab-play').classList.toggle('active', view === 'playlist');
    render();
}

function render() {
    const grid = document.getElementById('main-grid');
    const title = document.getElementById('view-title');
    const leftBtn = document.getElementById('left-btn');

    if (currentView === 'library') {
        title.innerText = "ライブラリ";
        leftBtn.innerText = isEditing ? "完了" : "編集";
        grid.innerHTML = tracks.map(t => renderCard(t, 'song')).join('');
    } else if (currentPlaylistId === null) {
        title.innerText = "プレイリスト";
        leftBtn.innerText = isEditing ? "完了" : "編集";
        grid.innerHTML = playlists.map(p => renderCard(p, 'playlist')).join('');
    } else {
        const pl = playlists.find(p => p.id === currentPlaylistId);
        title.innerText = pl.name;
        leftBtn.innerText = "戻る";
        const plSongs = tracks.filter(t => pl.songIds.includes(t.id));
        grid.innerHTML = plSongs.map(t => renderCard(t, 'song')).join('');
    }
}

function renderCard(item, type) {
    const isSong = type === 'song';
    return `
        <div class="card ${isEditing ? 'editing' : ''}" onclick="${isEditing ? '' : (isSong ? `play(${item.id})` : `openPlaylist(${item.id})`)}">
            <div class="del-badge" onclick="event.stopPropagation(); ${isSong ? `deleteTrack(${item.id})` : `deletePlaylist(${item.id})`}"><i class="fa-solid fa-minus"></i></div>
            <img src="${item.cover || ''}" class="card-img">
            <div style="margin-top:8px; font-size:14px; font-weight:600;">${item.name}</div>
            <div style="font-size:11px; color:#8e8e93;">${isSong ? (item.artist || '不明') : item.songIds.length + '曲'}</div>
        </div>`;
}

// 4. 曲選択モーダルのロジック（ここが修正のキモです）
function openPicker() {
    const pl = playlists.find(p => p.id === currentPlaylistId);
    selectedTrackIds = pl.songIds ? [...pl.songIds] : []; // 現在のリストをコピー
    
    const list = document.getElementById('picker-list');
    list.innerHTML = tracks.map(t => `
        <div class="picker-item ${selectedTrackIds.includes(t.id) ? 'selected' : ''}" 
             id="p-item-${t.id}" onclick="togglePickerSelect(${t.id})">
            <img src="${t.cover || ''}">
            <div style="flex:1">
                <div style="font-weight:600;">${t.name}</div>
                <div style="font-size:12px; color:#888;">${t.artist}</div>
            </div>
            <i class="fa-solid fa-circle-check picker-check"></i>
        </div>`).join('');
    
    document.getElementById('picker-modal').style.display = 'flex';
    setTimeout(() => document.getElementById('picker-modal').classList.add('active'), 10);
}

function togglePickerSelect(id) {
    const el = document.getElementById(`p-item-${id}`);
    if (selectedTrackIds.includes(id)) {
        selectedTrackIds = selectedTrackIds.filter(tid => tid !== id);
        el.classList.remove('selected');
    } else {
        selectedTrackIds.push(id);
        el.classList.add('selected');
    }
}

// 完了ボタン：保存処理を確実にする
function savePickerSelection() {
    const pl = playlists.find(p => p.id === currentPlaylistId);
    if (!pl) return;

    pl.songIds = selectedTrackIds;
    
    const tx = db.transaction("playlists", "readwrite");
    const store = tx.objectStore("playlists");
    const req = store.put(pl);

    req.onsuccess = () => {
        closePicker();
        loadAll(); // 再読み込みして画面を更新
    };
}

function closePicker() {
    const modal = document.getElementById('picker-modal');
    modal.classList.remove('active');
    setTimeout(() => { modal.style.display = 'none'; }, 400);
}

// 5. その他の操作（ヘッダー、再生、アップロードなど）
function handleHeaderLeft() {
    if (currentPlaylistId !== null) { currentPlaylistId = null; render(); }
    else { isEditing = !isEditing; render(); }
}

function handleHeaderRight() {
    if (currentView === 'library') document.getElementById('audio-upload').click();
    else if (currentPlaylistId === null) createPlaylist();
    else openPicker();
}

function createPlaylist() {
    const name = prompt("プレイリスト名");
    if (!name) return;
    db.transaction("playlists", "readwrite").objectStore("playlists").add({name, cover: "", songIds: []}).oncomplete = loadAll;
}

function openPlaylist(id) { currentPlaylistId = id; render(); }

function play(id) {
    const t = tracks.find(x => x.id === id);
    player.src = URL.createObjectURL(t.data);
    document.getElementById('m-title').innerText = t.name;
    document.getElementById('m-img').src = t.cover || '';
    document.getElementById('mini').style.display = 'flex';
    player.play();
}

function deleteTrack(id) { if(confirm("削除しますか？")) db.transaction("songs","readwrite").objectStore("songs").delete(id).onsuccess = loadAll; }
function deletePlaylist(id) { if(confirm("削除しますか？")) db.transaction("playlists","readwrite").objectStore("playlists").delete(id).onsuccess = loadAll; }
function toggle() { player.paused ? player.play() : player.pause(); }

document.getElementById('audio-upload').onchange = (e) => {
    for (let f of e.target.files) {
        jsmediatags.read(f, { onSuccess: (tag) => {
            let c = null; if(tag.tags.picture){
                let d = tag.tags.picture.data, s = "";
                for(let i=0; i<d.length; i++) s += String.fromCharCode(d[i]);
                c = `data:${tag.tags.picture.format};base64,${btoa(s)}`;
            }
            db.transaction("songs","readwrite").objectStore("songs").add({ name: tag.tags.title || f.name, artist: tag.tags.artist || "不明", cover: c, data: f }).oncomplete = loadAll;
        }});
    }
};

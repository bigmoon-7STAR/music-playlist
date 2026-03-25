let db, tracks = [], playlists = [], isEditing = false, currentView = 'library', currentPlaylistId = null;
let editingTrackId = null, selectedTrackIds = [], currentTrackIdx = -1;
const audio = document.getElementById('audio-element');

// --- データベース初期化 ---
const req = indexedDB.open("MusicStudioFinalV10", 1);
req.onupgradeneeded = (e) => {
    let d = e.target.result;
    d.createObjectStore("songs", {keyPath:"id", autoIncrement:true});
    d.createObjectStore("playlists", {keyPath:"id", autoIncrement:true});
};
req.onsuccess = (e) => { db = e.target.result; loadAll(); };

function loadAll() {
    const tx = db.transaction(["songs", "playlists"], "readonly");
    tx.objectStore("songs").getAll().onsuccess = (e) => { tracks = e.target.result; render(); };
    tx.objectStore("playlists").getAll().onsuccess = (e) => { playlists = e.target.result; render(); };
}

// --- メイン描画 (検索・削除バッジ・プレイリストカバー対応) ---
function render() {
    const display = document.getElementById('main-display');
    const title = document.getElementById('view-title');
    const search = document.getElementById('search-input').value.toLowerCase();
    const leftBtn = document.getElementById('left-btn');

    document.getElementById('tab-lib').classList.toggle('active', currentView === 'library');
    document.getElementById('tab-play').classList.toggle('active', currentView === 'playlist');

    if (currentView === 'library') {
        title.innerText = "ライブラリ"; leftBtn.innerText = isEditing ? "完了" : "編集";
        display.className = "grid";
        const filtered = tracks.filter(t => t.name.toLowerCase().includes(search) || (t.artist && t.artist.toLowerCase().includes(search)));
        display.innerHTML = filtered.map(t => `
            <div class="card ${isEditing?'editing':''}" onclick="${isEditing?`openEdit(${t.id})`:`playSong(${t.id})`}">
                <div class="del-badge" onclick="event.stopPropagation(); deleteSong(${t.id})"><i class="fa-solid fa-minus"></i></div>
                <img src="${t.cover||''}" class="card-img" style="background:#f0f0f0;">
                <div style="margin-top:8px; font-size:14px; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${t.name}</div>
                <div style="font-size:12px; color:#888;">${t.artist||'不明'}</div>
            </div>`).join('');
    } else if (currentPlaylistId === null) {
        title.innerText = "プレイリスト"; leftBtn.innerText = isEditing ? "完了" : "編集";
        display.className = "grid";
        display.innerHTML = playlists.map(p => {
            // プレイリストの1曲目の画像をカバーにする
            const firstSong = tracks.find(t => p.songIds.includes(t.id));
            const cover = firstSong ? firstSong.cover : '';
            return `
            <div class="card ${isEditing?'editing':''}" onclick="${isEditing?`deletePlaylist(${p.id})`:`openPlaylist(${p.id})`}">
                <div class="del-badge"><i class="fa-solid fa-minus"></i></div>
                <img src="${cover}" class="card-img" style="background:#eee">
                <div style="margin-top:8px; font-size:14px; font-weight:600;">${p.name}</div>
            </div>`;
        }).join('');
    } else {
        const pl = playlists.find(p => p.id === currentPlaylistId);
        title.innerText = pl.name; leftBtn.innerText = "戻る";
        display.className = "list-view";
        const plSongs = tracks.filter(t => pl.songIds.includes(t.id));
        display.innerHTML = plSongs.map(t => `<div class="list-item" onclick="playSong(${t.id})"><img src="${t.cover||''}"><div><div style="font-weight:600;">${t.name}</div><div style="font-size:12px; color:#888;">${t.artist}</div></div></div>`).join('');
    }
}

// --- 再生ロジック (メモリ最適化・自動送り) ---
function playSong(id) {
    const t = tracks.find(x => x.id === id);
    if (!t) return;
    currentTrackIdx = tracks.indexOf(t);

    // 古いメモリを解放
    if (audio.src) URL.revokeObjectURL(audio.src);
    
    audio.src = URL.createObjectURL(t.data);
    document.getElementById('m-title').innerText = t.name;
    document.getElementById('m-img').src = t.cover || '';
    document.getElementById('f-title').innerText = t.name;
    document.getElementById('f-artist').innerText = t.artist || '不明';
    document.getElementById('f-img').src = t.cover || '';
    document.getElementById('bg-blur').style.backgroundImage = `url(${t.cover})`;
    document.getElementById('mini').style.display = 'flex';
    audio.play();
}

function next() {
    if (currentTrackIdx < tracks.length - 1) playSong(tracks[currentTrackIdx + 1].id);
    else playSong(tracks[0].id); // 最初に戻る
}

function prev() {
    if (audio.currentTime > 3) audio.currentTime = 0;
    else if (currentTrackIdx > 0) playSong(tracks[currentTrackIdx - 1].id);
}

// 曲が終わったら自動で次へ
audio.onended = () => { next(); };

audio.ontimeupdate = () => { 
    if(!isNaN(audio.duration)){ 
        const seeker = document.getElementById('seeker');
        seeker.max = audio.duration; 
        seeker.value = audio.currentTime; 
        document.getElementById('cur-time').innerText = formatTime(audio.currentTime); 
        document.getElementById('dur-time').innerText = formatTime(audio.duration); 
    } 
};

// --- その他 以前のUI制御 ---
function formatTime(s) { let m=Math.floor(s/60), sec=Math.floor(s%60); return `${m}:${sec<10?'0':''}${sec}`; }
function togglePlay() { audio.paused ? audio.play() : audio.pause(); }
audio.onplay = () => { document.getElementById('m-pp').className = 'fa-solid fa-pause'; document.getElementById('f-pp').className = 'fa-solid fa-pause'; };
audio.onpause = () => { document.getElementById('m-pp').className = 'fa-solid fa-play'; document.getElementById('f-pp').className = 'fa-solid fa-play'; };
function openFull() { document.getElementById('full').classList.add('active'); }
function closeFull() { document.getElementById('full').classList.remove('active'); }
function toggleLyrics() { document.getElementById('lyrics-display').classList.toggle('active'); const t=tracks[currentTrackIdx]; document.getElementById('lyrics-display').innerText=t.lyrics||"歌詞がありません"; }

function handleHeaderLeft() { if(currentPlaylistId!==null){ currentPlaylistId=null; render(); } else { isEditing=!isEditing; render(); } }
function handleHeaderRight() { if(currentView==='library') document.getElementById('audio-upload').click(); else if(currentPlaylistId===null) createPlaylist(); else openPicker(); }
function switchTab(view) { currentView = view; currentPlaylistId = null; isEditing = false; document.getElementById('search-box').style.display = (view==='library'?'block':'none'); render(); }
function openPlaylist(id) { currentPlaylistId = id; render(); }

// --- 編集・削除 ---
function openEdit(id) {
    editingTrackId = id;
    const t = tracks.find(x => x.id === id);
    document.getElementById('edit-name').value = t.name;
    document.getElementById('edit-artist').value = t.artist || "";
    document.getElementById('edit-lyrics').value = t.lyrics || "";
    const history = document.getElementById('artist-history');
    const artists = [...new Set(tracks.map(x => x.artist).filter(a => a && a !== "不明"))];
    history.innerHTML = artists.map(a => `<span class="suggestion-tag" onclick="document.getElementById('edit-artist').value='${a}'">${a}</span>`).join('');
    document.getElementById('edit-modal').style.display = 'flex';
}
function closeEdit() { document.getElementById('edit-modal').style.display = 'none'; }
function saveEdit() {
    const t = tracks.find(x => x.id === editingTrackId);
    t.name = document.getElementById('edit-name').value;
    t.artist = document.getElementById('edit-artist').value;
    t.lyrics = document.getElementById('edit-lyrics').value;
    db.transaction("songs","readwrite").objectStore("songs").put(t).onsuccess = () => { closeEdit(); loadAll(); };
}
function deleteSong(id) { if(confirm("消去しますか？")) db.transaction("songs","readwrite").objectStore("songs").delete(id).onsuccess = loadAll; }
function deletePlaylist(id) { if(confirm("プレイリストを削除しますか？")) db.transaction("playlists","readwrite").objectStore("playlists").delete(id).onsuccess = loadAll; }
function createPlaylist() { const n = prompt("名前"); if(n) db.transaction("playlists","readwrite").objectStore("playlists").add({name:n, cover:"", songIds:[]}).oncomplete = loadAll; }

// --- ピッカー (提示されたコードをベースに調整) ---
function openPicker() {
    const pl = playlists.find(p => p.id === currentPlaylistId);
    if (!pl) return;
    selectedTrackIds = pl.songIds ? [...pl.songIds] : [];
    document.getElementById('picker-list').innerHTML = tracks.map(t => `
        <div class="list-item" onclick="togglePicker(${t.id}, this)">
            <img src="${t.cover||''}"><div>${t.name}</div>
            <i class="fa-solid fa-circle-check picker-check" style="margin-left:auto; font-size:20px; color:${selectedTrackIds.includes(t.id)?'var(--key-color)':'#ddd'}"></i>
        </div>`).join('');
    const modal = document.getElementById('picker-modal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
}
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
function savePickerSelection() {
    const pl = playlists.find(p => p.id === currentPlaylistId);
    if (!pl) return;
    pl.songIds = selectedTrackIds;
    db.transaction("playlists", "readwrite").objectStore("playlists").put(pl).onsuccess = () => { closePicker(); loadAll(); };
}
function closePicker() {
    const modal = document.getElementById('picker-modal');
    modal.classList.remove('active');
    setTimeout(() => { modal.style.display = 'none'; }, 400);
}

// --- アップロード ---
document.getElementById('audio-upload').onchange = (e) => {
    for (let f of e.target.files) {
        jsmediatags.read(f, { onSuccess: (tag) => {
            let c = null; if(tag.tags.picture){
                let d = tag.tags.picture.data, s = "";
                for(let i=0; i<d.length; i++) s += String.fromCharCode(d[i]);
                c = `data:${tag.tags.picture.format};base64,${btoa(s)}`;
            }
            db.transaction("songs","readwrite").objectStore("songs").add({ name: tag.tags.title || f.name, artist: tag.tags.artist || "不明", cover: c, data: f, lyrics: "" }).oncomplete = loadAll;
        }});
    }
};

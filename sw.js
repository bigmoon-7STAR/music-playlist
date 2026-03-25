// --- 1. 変数の宣言 ---
let isShuffle = false;  // シャッフル状態
let repeatMode = 0;     // 0:オフ, 1:全曲, 2:1曲
// シャッフルボタンを押した時
function toggleShuffle() {
    isShuffle = !isShuffle;
    const btn = document.getElementById('btn-shuffle');
    // オンならピンク、オフなら半透明の白
    btn.style.color = isShuffle ? 'var(--key-color)' : 'rgba(255,255,255,0.5)';
}

// リピートボタンを押した時
function toggleRepeat() {
    repeatMode = (repeatMode + 1) % 3; // 0→1→2→0 と切り替わる
    const btn = document.getElementById('btn-repeat');
    const badge = document.getElementById('repeat-badge');

    if (repeatMode === 0) { // オフ
        btn.style.color = 'rgba(255,255,255,0.5)';
        badge.style.display = 'none';
    } else if (repeatMode === 1) { // 全曲リピート
        btn.style.color = 'var(--key-color)';
        badge.style.display = 'none';
    } else if (repeatMode === 2) { // 1曲リピート
        btn.style.color = 'var(--key-color)';
        badge.style.display = 'block'; // 「1」のバッジを出す
    }
}

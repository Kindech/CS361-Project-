const video = document.getElementById('video');
const snapshotImg = document.getElementById('snapshotImg');
const captureBtn = document.getElementById('captureBtn');
const backBtn = document.getElementById('backBtn');
const canvas = document.getElementById('hiddenCanvas');
const countdownEl = document.getElementById('countdown');

let stream = null;
let countdownTimer = null;
let countdownEnd = null;
const CHECKIN_DURATION_MS = 5 * 60 * 1000; // 5 นาที

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
    video.srcObject = stream;
    startCountdown();
  } catch (err) {
    console.error(err);
    alert('ไม่สามารถเข้าถึงกล้องได้');
  }
}

function captureSnapshot() {
  if (!stream) return;
  const w = video.videoWidth;
  const h = video.videoHeight;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, w, h);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
  snapshotImg.src = dataUrl;
  snapshotImg.classList.remove('hidden');
  video.classList.add('hidden');
}

function backToCamera() {
  snapshotImg.classList.add('hidden');
  video.classList.remove('hidden');
}

function startCountdown() {
  countdownEnd = Date.now() + CHECKIN_DURATION_MS;
  updateCountdown();
  countdownTimer = setInterval(updateCountdown, 500);
}

function updateCountdown() {
  const msLeft = countdownEnd - Date.now();
  if (msLeft <= 0) {
    clearInterval(countdownTimer);
    countdownEl.textContent = "00:00:00";
    alert("หมดเวลาการเช็คชื่อ");
    if (stream) stream.getTracks().forEach(t => t.stop());
    return;
  }
  const totalSec = Math.floor(msLeft / 1000);
  const hrs = String(Math.floor(totalSec / 3600)).padStart(2,'0');
  const mins = String(Math.floor((totalSec % 3600) / 60)).padStart(2,'0');
  const secs = String(totalSec % 60).padStart(2,'0');
  countdownEl.textContent = `${hrs}:${mins}:${secs}`;
}

captureBtn.addEventListener('click', captureSnapshot);
backBtn.addEventListener('click', backToCamera);

startCamera();

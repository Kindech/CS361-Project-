document.addEventListener("DOMContentLoaded", () => {
  // --- โหลดชื่อผู้ใช้ ---
  const username = localStorage.getItem("username") || "";
  const displayName = localStorage.getItem("displayNameTH") || "";
  const h1 = document.getElementById("user-info");
  if (h1) {
    h1.textContent = `${username} ${displayName}`;
  }

  // --- อ้างอิง element ---
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

  // --- ฟังก์ชันเปิดกล้อง ---
  async function startCamera() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }, // กล้องหน้า
        audio: false
      });
      video.srcObject = stream;
      await video.play(); // บังคับเล่น (บาง browser ต้องใส่)
      startCountdown();
    } catch (err) {
      console.error(err);
      alert('ไม่สามารถเข้าถึงกล้องได้: ' + err.message);
    }
  }

  // --- ถ่ายรูป ---
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

  // --- กลับไปที่กล้อง ---
  function backToCamera() {
    snapshotImg.classList.add('hidden');
    video.classList.remove('hidden');
  }

  // --- นับเวลา ---
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

  // --- Event ---
  captureBtn.addEventListener('click', captureSnapshot);

  backBtn.addEventListener('click', () => {
    if (!snapshotImg.classList.contains('hidden')) {
      // ถ้าอยู่ใน snapshot → กลับไปที่กล้อง
      backToCamera();
    } else {
      // ถ้าอยู่ในโหมดกล้อง → ย้อนกลับไปหน้าก่อนหน้า
      window.history.back();
    }
  });

  // --- เริ่มกล้อง ---
  startCamera();
});

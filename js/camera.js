document.addEventListener("DOMContentLoaded", () => {
  // ---------- โหลดชื่อผู้ใช้ ----------
  const username = localStorage.getItem("username") || "";
  const displayName = localStorage.getItem("displayNameTH") || "";
  const userInfoEl = document.getElementById("user-info");
  userInfoEl.textContent = (username || displayName) ? `${username} ${displayName}`.trim() : "ไม่ระบุชื่อผู้ใช้";

  // ---------- อ้างอิง element ----------
  const fileInput = document.getElementById("fileInput");
  const preview = document.getElementById("preview");
  const backBtn = document.getElementById("backBtn");
  const confirmBtn = document.getElementById("confirmBtn");
  const countdownEl = document.getElementById("countdown");
  const noticeEl = document.getElementById("notice");
  const workCanvas = document.getElementById("workCanvas");

  // สถานะ
  let selectedFile = null;         // ไฟล์ต้นฉบับที่ผู้ใช้เลือก
  let processedBlob = null;        // ไฟล์ที่ย่อขนาดแล้ว (Blob)
  let processedDataUrl = null;     // base64 data URL (สำหรับแสดง/ส่งต่อ)
  let countdownTimer = null;
  let countdownEnd = null;
  const CHECKIN_DURATION_MS = 5 * 60 * 1000; // 5 นาที

  // ---------- เริ่มนับถอยหลังตั้งแต่โหลดหน้า ----------
  startCountdown();

  // ---------- เลือกไฟล์ ----------
  fileInput.addEventListener("change", async () => {
    hideNotice();
    processedBlob = null;
    processedDataUrl = null;

    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      return showNotice("กรุณาเลือกรูปภาพเท่านั้น");
    }
    // ตัวอย่างจำกัดขนาดไฟล์ต้นฉบับ 10MB
    if (file.size > 10 * 1024 * 1024) {
      return showNotice("ไฟล์ใหญ่เกินไป (จำกัด ~10MB)");
    }

    selectedFile = file;

    try {
      // โหลดเป็น object URL เพื่อพรีวิวเร็ว ๆ
      const objectUrl = URL.createObjectURL(file);
      preview.src = objectUrl;
      preview.style.display = "block";

      // ประมวลผลย่อภาพสำหรับอัปโหลด (ไม่บังคับ แต่ช่วยลดขนาด)
      const { blob, dataUrl } = await downscaleImage(file, {
        maxWidth: 1280,   // กำหนดกว้าง/สูงสูงสุด
        maxHeight: 1280,
        quality: 0.9      // คุณภาพ JPEG
      });
      processedBlob = blob;
      processedDataUrl = dataUrl;

    } catch (err) {
      console.error(err);
      showNotice("เกิดข้อผิดพลาดระหว่างประมวลผลรูป");
    }
  });

  // ---------- ปุ่มยืนยัน ----------
  confirmBtn.addEventListener("click", async () => {
    if (!selectedFile) {
      return showNotice("กรุณาเลือกรูปก่อนกดยืนยัน");
    }

    try {
      // ตัวอย่าง: ส่งข้อมูลขึ้นเซิร์ฟเวอร์/สตอเรจ
      // คุณสามารถเปลี่ยนไปใช้การอัปโหลด S3 (PUT/POST) หรือเรียก API ได้
      // ด้านล่างเป็นตัวอย่าง placeholder:
      // await uploadToAPI("/api/checkin", processedBlob, selectedFile.name);

      // หรือถ้ายังไม่มี API จะใช้ base64 (processedDataUrl) ส่งไปก่อนก็ได้
      console.log("Ready to upload. Blob size:", processedBlob?.size, "name:", selectedFile.name);
      alert("เลือกรูปและเตรียมส่งเรียบร้อย (เดโม). พร้อมต่อยอดอัปโหลดไป S3/Backend ได้เลย");
    } catch (err) {
      console.error(err);
      showNotice("อัปโหลดไม่สำเร็จ");
    }
  });

  // ---------- ปุ่มย้อนกลับ ----------
  backBtn.addEventListener("click", () => {
    if (preview.style.display === "block") {
      // ล้างพรีวิว/ไฟล์ที่เลือก
      preview.src = "";
      preview.style.display = "none";
      fileInput.value = "";
      selectedFile = null;
      processedBlob = null;
      processedDataUrl = null;
      hideNotice();
    } else {
      window.history.back();
    }
  });

  // ---------- ฟังก์ชันช่วย ----------
  function showNotice(text) {
    noticeEl.textContent = text;
    noticeEl.style.display = "block";
  }
  function hideNotice() {
    noticeEl.textContent = "";
    noticeEl.style.display = "none";
  }

  // ย่อภาพด้วย canvas แล้วคืนทั้ง Blob และ DataURL
  async function downscaleImage(file, { maxWidth = 1280, maxHeight = 1280, quality = 0.9 } = {}) {
    const dataUrl = await readFileAsDataURL(file);
    const img = await loadImage(dataUrl);

    // คำนวณขนาดใหม่รักษาอัตราส่วน
    let { width, height } = img;
    const ratio = Math.min(maxWidth / width, maxHeight / height, 1); // ไม่ขยายเกินของเดิม
    const newW = Math.round(width * ratio);
    const newH = Math.round(height * ratio);

    // วาดลงแคนวาส
    workCanvas.width = newW;
    workCanvas.height = newH;
    const ctx = workCanvas.getContext("2d");
    ctx.clearRect(0, 0, newW, newH);
    ctx.drawImage(img, 0, 0, newW, newH);

    // แปลงเป็น JPEG
    const outDataUrl = workCanvas.toDataURL("image/jpeg", quality);
    const outBlob = dataURLtoBlob(outDataUrl);
    return { blob: outBlob, dataUrl: outDataUrl };
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function dataURLtoBlob(dataUrl) {
    const [meta, base64] = dataUrl.split(",");
    const mime = meta.match(/:(.*?);/)[1] || "image/jpeg";
    const bin = atob(base64);
    const len = bin.length;
    const u8 = new Uint8Array(len);
    for (let i = 0; i < len; i++) u8[i] = bin.charCodeAt(i);
    return new Blob([u8], { type: mime });
  }

  // ตัวอย่างอัปโหลด (แก้ endpoint/headers ตามระบบของคุณ)
  async function uploadToAPI(url, blob, fileName) {
    const form = new FormData();
    form.append("file", blob, fileName.replace(/\.[^.]+$/, "") + ".jpg");
    // form.append("username", username); // แนบข้อมูลอื่น ๆ ได้
    const res = await fetch(url, { method: "POST", body: form });
    if (!res.ok) throw new Error("Upload failed");
    return await res.json();
  }

  // ---------- นับเวลาถอยหลัง ----------
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
      return;
    }
    const totalSec = Math.floor(msLeft / 1000);
    const hrs = String(Math.floor(totalSec / 3600)).padStart(2,'0');
    const mins = String(Math.floor((totalSec % 3600) / 60)).padStart(2,'0');
    const secs = String(totalSec % 60).padStart(2,'0');
    countdownEl.textContent = `${hrs}:${mins}:${secs}`;
  }
});

// === ค่าเริ่มต้น (แก้ได้) ===
const DEFAULT_SECONDS = 300; // 5 นาที
const DEFAULT_COURSE_CODE = "CS333/CS361";
const DEFAULT_COURSE_NAME = "SCALABLE INTERNET SERVICES/CLOUD-BASED SOFTWARE ARCHITECTING";
const DEFAULT_INSTRUCTOR = "อาจารย์ผู้สอน: xxx xxxxx";

// อ่านค่าจาก URL: ?t=วินาที &code= &name= &inst=
const params = new URLSearchParams(location.search);
const durationSeconds = Math.max(0, parseInt(params.get("t") || DEFAULT_SECONDS, 10) || DEFAULT_SECONDS);
const courseCode = params.get("code") || DEFAULT_COURSE_CODE;
const courseName = params.get("name") || DEFAULT_COURSE_NAME;
const instructor = params.get("inst") || DEFAULT_INSTRUCTOR;

// ใส่ค่าเนื้อหา
document.getElementById("courseCode").textContent = courseCode;
document.getElementById("courseName").textContent = courseName;
document.getElementById("instructor").textContent = instructor;

// องค์ประกอบ UI
const mmssEl = document.getElementById("mmss");
const progressEl = document.getElementById("progress");
const captureBtn = document.getElementById("captureBtn");

// ตัวช่วยแปลงเวลา
function fmt(sec){
  const m = String(Math.floor(sec/60)).padStart(2,"0");
  const s = String(Math.floor(sec%60)).padStart(2,"0");
  return `${m} : ${s}`;
}

// นับถอยหลังแบบชดเชย drift
let startedAt = Date.now();
let remaining = durationSeconds;

function tick(){
  const elapsed = Math.floor((Date.now() - startedAt) / 1000);
  remaining = Math.max(0, durationSeconds - elapsed);
  mmssEl.textContent = fmt(remaining);

  const ratio = durationSeconds === 0 ? 0 : (remaining / durationSeconds) * 100;
  progressEl.style.width = Math.max(0, Math.min(100, ratio)) + "%";

  if(remaining === 0){
    captureBtn.disabled = true;
  }
}

tick();
const timerId = setInterval(() => {
  tick();
  if(remaining === 0) clearInterval(timerId);
}, 250);

// ปุ่มย้อนกลับ / ถ่ายภาพ
document.getElementById("backBtn").addEventListener("click", () => {
  if (history.length > 1) history.back();
  else window.location.href = "/";
});

captureBtn.addEventListener("click", () => {
  if (remaining === 0) return;
  // ไปหน้า camera.html (หากมี)
  window.location.href = "camera.html";
});
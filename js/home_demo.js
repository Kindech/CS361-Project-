function checkSubjects() {
  const now = new Date();
  const today = now.getDay(); // อาทิตย์=0 จันทร์=1 ... เสาร์=6
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const cards = document.querySelectorAll(".subject-card");
  cards.forEach((card, idx) => {
    const button = card.querySelector(".btn");
    if (idx === 0) {
      // demo: วิชาแรกเป็นปุ่ม Check สีเขียวเสมอ
      button.textContent = "Check";
      button.className = "btn green";
    } else {
      // ที่เหลือใช้ logic เดิม (ปิดไว้เป็น Close สีเทา)
      button.textContent = "Close";
      button.className = "btn gray";
    }
  });
}

// เรียกตอนโหลด และอัปเดตทุก 1 นาที
checkSubjects();

// เพิ่ม event ให้ปุ่ม Check ทุกปุ่ม เชื่อมไปหน้า checkin.html
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.subject-card .btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      if (btn.textContent.trim().toLowerCase() === 'check') {
        window.location.href = '../html/checkin.html';
      }
    });
  });
});
setInterval(checkSubjects, 60000);

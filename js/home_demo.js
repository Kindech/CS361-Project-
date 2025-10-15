document.addEventListener("DOMContentLoaded", () => {
  // แสดงชื่อผู้ใช้
  const username = localStorage.getItem("username") || "";
  const displayName = localStorage.getItem("displayNameTH") || "";
  const h1 = document.getElementById("user-info");
  if (h1) {
    h1.textContent = `${username} ${displayName}`;
  }

  // ฟังก์ชันตรวจสอบวิชา
  function checkSubjects() {
    const now = new Date();
    const today = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const cards = document.querySelectorAll(".subject-card");
    cards.forEach((card, idx) => {
      const button = card.querySelector(".btn");
      if (idx === 0) {
        button.textContent = "Check";
        button.className = "btn green";
      } else {
        button.textContent = "Close";
        button.className = "btn gray";
      }
    });
  }

  // เรียกตอนโหลด และทุก 1 นาที
  checkSubjects();
  setInterval(checkSubjects, 60000);

  // กดปุ่ม check → ไปหน้า checkin.html
  document.querySelectorAll('.subject-card .btn').forEach(btn => {
    btn.addEventListener('click', function () {
      if (btn.textContent.trim().toLowerCase() === 'check') {
        window.location.href = '../html/checkin.html';
      }
    });
  });
});

function checkSubjects() {
  const now = new Date();
  const today = now.getDay(); // อาทิตย์=0 จันทร์=1 ... เสาร์=6
  const currentTime = now.getHours() * 60 + now.getMinutes();

  document.querySelectorAll(".subject-card").forEach(card => {
    const day = parseInt(card.dataset.day); // วันของวิชานี้
    const [sh, sm] = card.dataset.start.split(":").map(Number);
    const [eh, em] = card.dataset.end.split(":").map(Number);

    const start = sh * 60 + sm;
    const end = eh * 60 + em;

    const button = card.querySelector(".btn");

    if (day === today) {
      if (currentTime >= start && currentTime <= end) {
        button.textContent = "Check";
        button.className = "btn green";
      } else if (currentTime < start) {
        button.textContent = "Close";
        button.className = "btn gray";
      } else {
        button.textContent = "Close";
        button.className = "btn red";
      }
    } else if (day < today) {
      // วันในอดีต
      button.textContent = "Close";
      button.className = "btn red";
    } else {
      // วันในอนาคต
      button.textContent = "Close";
      button.className = "btn gray";
    }
  });
}

// เรียกตอนโหลด และอัปเดตทุก 1 นาที
checkSubjects();
setInterval(checkSubjects, 60000);

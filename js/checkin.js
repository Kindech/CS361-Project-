document.addEventListener("DOMContentLoaded", () => {
  /**
   * ฟังก์ชันหลักที่ทำงานเมื่อหน้าเว็บโหลด
   */
  function initializeCheckinPage() {
      // --- 1. อ่านค่าทั้งหมดจาก URL ---
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get("sessionId");
      const courseId = params.get("courseId");
      const courseName = params.get("courseName");

      // --- 2. ตรวจสอบข้อมูลที่จำเป็น ---
      if (!sessionId || !courseId) {
          alert("ไม่พบข้อมูลคาบเรียน! กรุณากลับไปหน้าหลักอีกครั้ง");
          window.location.href = "home.html";
          return; // หยุดการทำงานทันที
      }

      // --- 3. บันทึก sessionId ไว้เพื่อให้หน้า camera.js ใช้ต่อ ---
      localStorage.setItem('currentSessionId', sessionId);
      localStorage.setItem('currentCourseId', courseId);

      // --- 4. แสดงข้อมูลวิชาที่ถูกต้องบนหน้าเว็บ ---
      document.getElementById("courseCode").textContent = courseId;
      document.getElementById("courseName").textContent = courseName || "ไม่พบชื่อวิชา";
      // (ส่วนชื่ออาจารย์ยังคงเป็นค่าเดิม สามารถปรับแก้ได้ในอนาคต)
      document.getElementById("instructor").textContent = "อาจารย์ผู้สอน: xxx xxxxx";

      // --- 5. ตั้งค่าปุ่ม (ไม่มีการเรียกฟังก์ชันนับถอยหลังแล้ว) ---
      setupButtons();
  }

  /**
   * ตั้งค่า Event Listener ให้กับปุ่มต่างๆ
   */
  function setupButtons() {
      const backBtn = document.getElementById("backBtn");
      const captureBtn = document.getElementById("captureBtn");

      backBtn.addEventListener("click", () => {
          // ถ้ามีประวัติการเข้าเว็บ ให้ย้อนกลับไปหน้าก่อนหน้า (คือ home.html)
          if (window.history.length > 1) {
              window.history.back();
          } else {
              window.location.href = "home.html"; // Fallback
          }
      });

      captureBtn.addEventListener("click", () => {
          // ไปยังหน้า camera.html
          window.location.href = "camera.html";
      });
  }

  // --- เรียกใช้ฟังก์ชันหลักเมื่อหน้าเว็บโหลดเสร็จ ---
  initializeCheckinPage();
});
// --- ❗️ ตั้งค่าที่จำเป็น ---
const API_BASE_URL = 'https://2q9twc0it4.execute-api.us-east-1.amazonaws.com/new4'; // ใส่ Base URL ของ API Gateway

/**
 * ฟังก์ชันสำหรับดึง ID Token จาก Local Storage
 * @returns {string|null} ID Token หรือ null ถ้าไม่พบ
 */
function getIdToken() {
    return localStorage.getItem('id_token');
}

/**
 * ฟังก์ชันหลักที่จะทำงานเมื่อหน้าเว็บโหลด
 */
async function setupStudentHomePage() {
    // --- 1. ตรวจสอบ Token ก่อนเริ่มทำงาน ---
    const token = getIdToken();
    if (!token) {
        alert("ไม่พบข้อมูลการล็อกอิน กรุณาล็อกอินใหม่อีกครั้ง");
        // (ทางเลือก) อาจจะส่งผู้ใช้กลับไปหน้า login
        // window.location.href = 'URL_LOGIN_COGNITO';
        return;
    }

    // --- 2. แสดงชื่อผู้ใช้ (เหมือนเดิม) ---
    const username = localStorage.getItem("username") || "";
    const displayName = localStorage.getItem("displayNameTH") || "";
    const userInfoElement = document.getElementById("user-info");
    if (userInfoElement) {
        userInfoElement.textContent = `${username} ${displayName}`;
    }

    // --- 3. ตรวจสอบสถานะของทุกวิชาจาก Backend ---
    const subjectCards = document.querySelectorAll(".subject-card");
    for (const card of subjectCards) {
        const button = card.querySelector(".btn");
        const courseId = card.dataset.courseId;

        if (!courseId) {
            button.textContent = "N/A";
            button.className = "btn gray";
            continue;
        }

        try {
            // ยิง API ไปถามว่าวิชานี้มีคาบเรียนที่ ACTIVE อยู่หรือไม่
            const response = await fetch(`${API_BASE_URL}/active-session/${courseId}`, {
                // ✅ เพิ่มส่วน Headers สำหรับยืนยันตัวตน
                headers: {
                    'Authorization': token
                }
            });
            
            if (response.ok) {
                // ถ้ามี (response.status === 200)
                const sessionData = await response.json();
                button.textContent = "Check";
                button.className = "btn green";
                button.dataset.sessionId = sessionData.sessionId; // เก็บ sessionId ไว้ที่ปุ่ม
            } else {
                // ถ้าไม่มี (response.status === 404) หรือ Error อื่นๆ
                button.textContent = "Close";
                button.className = "btn gray";
            }
        } catch (error) {
            console.error(`เกิดข้อผิดพลาดในการตรวจสอบวิชา ${courseId}:`, error);
            button.textContent = "Error";
            button.className = "btn red";
        }
    }
}

/**
 * เพิ่ม Event Listener ให้กับปุ่ม Check (เหมือนเดิม)
 */
function addClickListeners() {
    document.querySelectorAll('.subject-card .btn').forEach(button => {
        button.addEventListener('click', function () {
            if (button.textContent.trim().toLowerCase() === 'check') {
                const sessionId = button.dataset.sessionId;
                if (sessionId) {
                    window.location.href = `../html/checkin.html?sessionId=${sessionId}`;
                } else {
                    alert("เกิดข้อผิดพลาด: ไม่พบ Session ID");
                }
            }
        });
    });
}

// --- เรียกใช้ฟังก์ชันทั้งหมดเมื่อหน้าเว็บโหลดเสร็จ ---
document.addEventListener('DOMContentLoaded', async () => {
    await setupStudentHomePage();
    addClickListeners();
});
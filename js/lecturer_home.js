// --- ❗️ ตั้งค่าที่จำเป็น ---
const API_BASE_URL = 'https://2q9twc0it4.execute-api.us-east-1.amazonaws.com/new4'; // ใส่ Base URL ของ API Gateway

function getIdToken() {
    return localStorage.getItem('id_token');
}

async function fetchActiveSession(courseId, token) {
    try {
        const response = await fetch(`${API_BASE_URL}/active-session/${courseId}`, {
            headers: { 'Authorization': token }
        });
        if (response.ok) return await response.json();
        return null;
    } catch (error) {
        console.error(`ไม่สามารถดึงสถานะของวิชา ${courseId} ได้:`, error);
        return null;
    }
}

/**
 * ฟังก์ชันหลักสำหรับตั้งค่าหน้าเว็บของอาจารย์
 */
async function setupLecturerHomePage() {
    const token = getIdToken();
    if (!token) {
        alert("ไม่พบข้อมูลการล็อกอิน กรุณาล็อกอินใหม่อีกครั้ง");
        return;
    }

    // --- ✅ ส่วนที่เพิ่มเข้ามา: แสดงชื่อผู้ใช้ ---
    const username = localStorage.getItem("username") || "Unknown User";
    const userInfoElement = document.getElementById("user-info");
    if (userInfoElement) {
        userInfoElement.textContent = username;
    }
    // -----------------------------------------

    for (const card of document.querySelectorAll(".subject-card")) {
        const sessionBtn = card.querySelector("#session-btn");
        const viewListBtn = card.querySelector("#view-list-btn");
        const courseId = card.dataset.courseId;

        if (!courseId || !sessionBtn) continue;

        sessionBtn.disabled = true;
        sessionBtn.textContent = 'กำลังโหลด...';

        const activeSession = await fetchActiveSession(courseId, token);

        if (activeSession && activeSession.sessionId) {
            sessionBtn.textContent = 'ปิดคาบเรียน';
            sessionBtn.className = 'btn green';
            sessionBtn.dataset.sessionId = activeSession.sessionId;
            viewListBtn.dataset.sessionId = activeSession.sessionId;
            viewListBtn.disabled = false;
            localStorage.setItem(`lastSessionId_${courseId}`, activeSession.sessionId);
        } else {
            sessionBtn.textContent = 'เริ่มสอน';
            sessionBtn.className = 'btn gray';
            const lastSessionId = localStorage.getItem(`lastSessionId_${courseId}`);
            if (lastSessionId) {
                viewListBtn.dataset.sessionId = lastSessionId;
                viewListBtn.disabled = false;
            }
        }
        sessionBtn.disabled = false;
    }

    addEventListeners();
}

/**
 * ฟังก์ชันสำหรับผูก Event Listener ให้กับปุ่มทั้งหมด
 */
function addEventListeners() {
    document.querySelectorAll(".subject-card").forEach(card => {
        const sessionBtn = card.querySelector("#session-btn");
        const viewListBtn = card.querySelector("#view-list-btn");
        const courseId = card.dataset.courseId;

        if (sessionBtn && !sessionBtn.dataset.listenerAttached) {
            sessionBtn.addEventListener('click', handleSessionButtonClick);
            sessionBtn.dataset.listenerAttached = 'true';
        }

        if (viewListBtn && !viewListBtn.dataset.listenerAttached) {
            viewListBtn.addEventListener('click', () => {
                const sessionId = viewListBtn.dataset.sessionId;
                if (sessionId) {
                    window.open(`course.html?sessionId=${sessionId}&courseId=${courseId}`, '_blank');
                } else {
                    alert("ยังไม่มีคาบเรียนให้ดูข้อมูล (กรุณากดเริ่มสอนก่อนอย่างน้อย 1 ครั้ง)");
                }
            });
            viewListBtn.dataset.listenerAttached = 'true';
        }
    });
}

/**
 * ฟังก์ชันจัดการการกดปุ่ม เริ่ม/ปิด คาบเรียน
 */
async function handleSessionButtonClick(event) {
    const sessionBtn = event.target;
    const card = sessionBtn.closest('.subject-card');
    const viewListBtn = card.querySelector('#view-list-btn');
    const courseId = card.dataset.courseId;
    const token = getIdToken();

    if (!token) {
        alert("Session หมดอายุ กรุณาล็อกอินใหม่");
        return;
    }

    if (sessionBtn.textContent === "เริ่มสอน") {
        sessionBtn.disabled = true;
        sessionBtn.textContent = 'กำลังเริ่ม...';
        try {
            const response = await fetch(`${API_BASE_URL}/start-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': token },
                body: JSON.stringify({ courseId: courseId })
            });
            if (!response.ok) throw new Error('API Error');
            const data = await response.json();
            
            sessionBtn.textContent = 'ปิดคาบเรียน';
            sessionBtn.className = 'btn green';
            sessionBtn.dataset.sessionId = data.sessionId;
            
            viewListBtn.dataset.sessionId = data.sessionId;
            viewListBtn.disabled = false;
            localStorage.setItem(`lastSessionId_${courseId}`, data.sessionId);

            alert(`คาบเรียน ${courseId} เริ่มแล้ว!`);
        } catch (error) {
            console.error(error);
            sessionBtn.textContent = 'ลองใหม่อีกครั้ง';
            sessionBtn.className = 'btn red';
        }
        sessionBtn.disabled = false;

    } else if (sessionBtn.textContent === "ปิดคาบเรียน") {
        sessionBtn.disabled = true;
        sessionBtn.textContent = 'กำลังปิด...';
        try {
            const currentSessionId = sessionBtn.dataset.sessionId;
            await fetch(`${API_BASE_URL}/end-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': token },
                body: JSON.stringify({ sessionId: currentSessionId })
            });

            sessionBtn.textContent = 'เริ่มสอน';
            sessionBtn.className = 'btn gray';
            delete sessionBtn.dataset.sessionId;

            alert(`คาบเรียน ${courseId} ได้ปิดลงแล้ว (ยังสามารถดูรายชื่อได้)`);
        } catch (error) {
            console.error(error);
            sessionBtn.textContent = 'ลองอีกครั้ง';
        }
        sessionBtn.disabled = false;
    }
}

// --- เรียกใช้ฟังก์ชันหลักเมื่อหน้าเว็บโหลดเสร็จ ---
document.addEventListener('DOMContentLoaded', setupLecturerHomePage);
// --- ❗️ ตั้งค่า API Endpoint ---
const API_BASE_URL = 'https://2q9twc0it4.execute-api.us-east-1.amazonaws.com/new4';
const token = localStorage.getItem('id_token');

// --- ❗️ ตั้งค่า Polling ---
const REFRESH_INTERVAL = 2000; // รีเฟรชทุกๆ 5 วินาที (2000 ms)
let isLoading = false; // ตัวแปรป้องกันการเรียกซ้ำซ้อน

// --- อ้างอิง Element ---
const tableBody = document.getElementById('attendance-table-body');
const courseIdEl = document.getElementById('course-id-display');
const courseNameEl = document.getElementById('course-name-display');
const userInfoEl = document.getElementById('user-info');
const navBtn = document.getElementById('homeNavBtn');
const exportBtn = document.getElementById('export-csv-btn');
        
// --- อ่านค่าจาก URL (ทำครั้งเดียว) ---
const params = new URLSearchParams(window.location.search);
const sessionId = params.get('sessionId');
const courseId = params.get('courseId');

/**
 * ฟังก์ชันหลัก: ดึงข้อมูลและวาดตารางใหม่ทั้งหมด
 */
async function updateDashboard() {
    // ถ้ากำลังโหลดอยู่ ให้ข้ามไปก่อน
    if (isLoading) return; 
    isLoading = true;

    try {
        const response = await fetch(`${API_BASE_URL}/attendance/${courseId}/${sessionId}`, {
            headers: { 'Authorization': token }
        });
        
        if (!response.ok) {
            if (response.status === 403 || response.status === 401) {
                throw new Error('Session หมดอายุหรือสิทธิ์ไม่เพียงพอ');
            }
            throw new Error(`ไม่สามารถโหลดข้อมูลได้ (Status: ${response.status})`);
        }

        const data = await response.json();
        const courseInfo = data.courseInfo;
        const allStudents = data.allStudents;

        // แสดงข้อมูลวิชา (ทำครั้งเดียวก็พอ แต่ทำซ้ำได้)
        courseIdEl.textContent = courseInfo.courseId || courseId;
        courseNameEl.textContent = courseInfo.courseName || "No course name found";

        // สร้างตารางรายชื่อนักศึกษา (3 คอลัมน์)
        if (allStudents.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="3">ไม่พบรายชื่อนักศึกษาใน Group Students</td></tr>'; 
            isLoading = false;
            return;
        }

        tableBody.innerHTML = ''; 
        let rank = 0;

        allStudents.forEach((student) => {
            const userId = student.Username; 
            const fullName = userId; 
            
            rank++;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${rank}</td>
                <td>${fullName}</td>
                <td>
                    <button class="btn btn-stats blue" data-user-id="${userId}">
                        สถิติ
                    </button>
                </td>
            `;
            
            const statsButton = row.querySelector('.btn-stats');
            statsButton.addEventListener('click', () => {
                window.open(`stats_dashboard.html?courseId=${courseId}&userId=${userId}`, '_blank');
            });
            
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error("เกิดข้อผิดพลาด:", error);
        courseIdEl.textContent = "Error";
        courseNameEl.textContent = error.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล";
        tableBody.innerHTML = '<tr><td colspan="3">ไม่สามารถโหลดข้อมูลรายชื่อได้</td></tr>';
    }
    
    isLoading = false; // โหลดเสร็จแล้ว
}

/**
 * ตั้งค่าการทำงานของหน้า (ทำครั้งเดียวตอนโหลด)
 */
function initializePage() {
    const username = localStorage.getItem('username');

    // 1. แสดง Username อาจารย์
    if (userInfoEl && username) {
        userInfoEl.textContent = username;
    } else if (userInfoEl) {
        userInfoEl.textContent = "อาจารย์ผู้สอน";
    }

    // 2. ตรวจสอบ URL
    if (!sessionId || !courseId) {
        courseIdEl.textContent = "เกิดข้อผิดพลาด";
        courseNameEl.textContent = "ไม่พบข้อมูลคาบเรียน";
        if (exportBtn) exportBtn.disabled = true;
        return;
    }

    // 3. ตั้งค่าปุ่ม Home
    if (navBtn) {
        navBtn.addEventListener('click', () => {
            window.location.href = 'lecturer_home.html'; 
        });
    }

    // 4. ตั้งค่าปุ่ม Export
    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            // (โค้ด Export CSV ของคุณเหมือนเดิม)
        });
    }

    // --- 5. เริ่มการทำงานแบบ Real-time ---
    updateDashboard(); // เรียกครั้งแรกทันที
    setInterval(updateDashboard, REFRESH_INTERVAL); // เรียกซ้ำทุกๆ 5 วินาที
}

// --- เริ่มทำงานเมื่อหน้าเว็บโหลดเสร็จ ---
document.addEventListener('DOMContentLoaded', initializePage);
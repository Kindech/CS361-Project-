// --- ❗️ ตั้งค่า API Endpoint ---
const API_BASE_URL = 'https://2q9twc0it4.execute-api.us-east-1.amazonaws.com/new4'; 
const STATS_ENDPOINT = `${API_BASE_URL}/stats`;
const DELETE_API_ENDPOINT = `${API_BASE_URL}/delete-attendance`;

const token = localStorage.getItem('id_token');

// --- ❗️ ตั้งค่า Polling ---
const REFRESH_INTERVAL = 2000; // รีเฟรชทุก 10 วินาที (10000 ms)
let isLoading = false; // ตัวแปรป้องกันการเรียกซ้ำซ้อน
let myChart = null; // ตัวแปรเก็บกราฟ (สำหรับทำลายก่อนวาดใหม่)

/**
 * ฟังก์ชันสำหรับลบข้อมูลการเช็คชื่อ
 */
async function deleteAttendanceRecord(sessionId, userId, imageUrl, rowElement, courseId) {
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบการเช็คชื่อของรหัส ${userId} ออก? ข้อมูลรูปภาพจะถูกลบถาวร`)) return;

    let imageKey;
    try {
        const url = new URL(imageUrl);
        imageKey = url.pathname.substring(1); 
    } catch (e) {
        console.error("Invalid Image URL:", imageUrl);
        alert("ล้มเหลว: URL ของรูปภาพไม่ถูกต้อง");
        return;
    }
    
    try {
        const response = await fetch(DELETE_API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': token },
            body: JSON.stringify({ sessionId, userId, imageKey }) 
        });

        if (!response.ok) throw new Error(`ไม่สามารถลบข้อมูลได้ (Status: ${response.status})`);

        alert(`ลบข้อมูล ${userId} เรียบร้อยแล้ว`);
        
        // ✅ สั่งอัปเดต Dashboard ทันทีหลังจากลบสำเร็จ
        updateDashboard(courseId, userId); 
        
    } catch (error) {
        console.error('Delete Error:', error);
        alert(`ล้มเหลวในการลบ: ${error.message}`);
    }
}

/**
 * ฟังก์ชันหลัก: ดึงข้อมูลและวาดหน้า Dashboard ใหม่ทั้งหมด
 */
async function updateDashboard(courseId, userId) {
    // ถ้ากำลังโหลดอยู่ ให้ข้ามไปก่อน
    if (isLoading) return; 
    isLoading = true;

    try {
        // --- 1. เรียก API ดึงข้อมูลสถิติ ---
        const response = await fetch(`${STATS_ENDPOINT}/${courseId}/${userId}`, {
            headers: { 'Authorization': token }
        });
        
        if (!response.ok) throw new Error(`ไม่สามารถโหลดสถิติได้ (Status: ${response.status})`);

        const data = await response.json();
        
        const stats = data.stats;
        const allSessions = data.allCourseSessions || []; 
        const checkinRecords = data.studentCheckinRecords || []; 

        // 2. สร้าง Map สำหรับค้นหาการเช็คชื่อ
        const checkinMap = new Map();
        checkinRecords.forEach(record => {
            checkinMap.set(record.sessionNumber, record); 
        });

        // --- 3. สรุปภาพรวมและกราฟ (Pie Chart) ---
        const percentAttended = stats.percentAttended;
        const percentMissed = 100 - percentAttended;

        document.getElementById('total-sessions').textContent = stats.totalSessions;
        document.getElementById('attended-count').textContent = stats.sessionsAttended;
        document.getElementById('percent-attended').textContent = percentAttended;

        const attendanceChartCanvas = document.getElementById('attendanceChart');
        if (attendanceChartCanvas) {
            if (myChart) {
                myChart.destroy(); // ✅ ทำลายกราฟเก่าทิ้งก่อนวาดใหม่
            }
            myChart = new Chart(attendanceChartCanvas.getContext('2d'), {
                type: 'pie',
                data: {
                    labels: ['เข้าเรียนแล้ว', 'ขาดเรียน'],
                    datasets: [{ 
                        data: [percentAttended, percentMissed], 
                        backgroundColor: ['rgba(40, 167, 69, 0.8)', 'rgba(220, 53, 69, 0.8)'], 
                        borderWidth: 1 
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
        
        // --- 4. แสดงผลข้อมูลประวัติ (ตาราง) ---
        const historyTableBody = document.querySelector('#full-history-table tbody');
        historyTableBody.innerHTML = ''; // ✅ ล้างตารางเก่าทุกครั้งที่อัปเดต

        if (allSessions.length > 0) {
            allSessions.sort((a, b) => a.sessionNumber - b.sessionNumber); 
            
            allSessions.forEach((session) => {
                const sessionNumber = session.sessionNumber;
                if (!sessionNumber || sessionNumber === 0) return; 

                const record = checkinMap.get(sessionNumber);
                const isPresent = !!record;
                
                const statusText = isPresent ? 'เข้าเรียนแล้ว' : 'ไม่ได้เข้าเรียน';
                const statusClass = isPresent ? 'table-success' : 'table-danger';
                const checkinTimeText = isPresent ? new Date(record.checkinTime * 1000).toLocaleString('th-TH') : '—';
                const ratingText = isPresent ? (record.rating || 'N/A') : '—';
                const commentText = isPresent ? (record.comment || 'N/A') : '—';

                const row = historyTableBody.insertRow();
                row.className = statusClass;

                row.insertCell().textContent = sessionNumber;
                row.insertCell().textContent = statusText;
                row.insertCell().textContent = checkinTimeText;
                row.insertCell().innerHTML = isPresent ? `<a href="${record.imageUrl}" ...>รูป</a>` : '—';
                row.insertCell().textContent = ratingText;
                row.insertCell().textContent = commentText;
                row.insertCell().innerHTML = isPresent ? `<button class="btn btn-delete ...">ลบ</button>` : '—';

                if (isPresent) {
                    row.querySelector('.btn-delete').addEventListener('click', () => {
                        // ✅ ส่ง courseId และ userId ไปด้วย
                        deleteAttendanceRecord(record.sessionId, userId, record.imageUrl, row, courseId);
                    });
                }
            });
        } else {
            historyTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">ไม่พบประวัติคาบเรียนทั้งหมด</td></tr>';
        }
        
    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการดึงสถิติ:", error);
        document.getElementById('stats-course-title').textContent = "ไม่สามารถโหลดข้อมูลสถิติได้";
        document.getElementById('total-sessions').textContent = "Error";
        historyTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: red;">ไม่สามารถโหลดประวัติการเข้าเรียนได้</td></tr>';
    }
    
    isLoading = false; // โหลดเสร็จแล้ว
}

/**
 * เริ่มการทำงานของหน้า
 */
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const courseId = params.get('courseId');
    const userId = params.get('userId'); 

    if (!courseId || !userId || !token) {
        document.getElementById('stats-course-title').textContent = "ข้อผิดพลาด: ข้อมูลไม่สมบูรณ์";
        return;
    }

    // ตั้งค่าหน้าเว็บ (ทำครั้งเดียว)
    document.getElementById('stats-course-title').textContent = `สถิติวิชา: ${courseId}`;
    document.getElementById('user-display').textContent = userId;

    // --- ✅ 5. เริ่มการทำงานแบบ Polling ---
    updateDashboard(courseId, userId); // เรียกครั้งแรกทันที
    setInterval(() => updateDashboard(courseId, userId), REFRESH_INTERVAL); // เรียกซ้ำทุก 10 วินาที
});
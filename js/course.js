document.addEventListener('DOMContentLoaded', async () => {
    // --- อ้างอิง Element ---
    const tableBody = document.getElementById('attendance-table-body');
    const courseIdEl = document.getElementById('course-id-display');
    const courseNameEl = document.getElementById('course-name-display');
    const userInfoEl = document.getElementById('user-info');
    const navBtn = document.getElementById('homeNavBtn');
    const exportBtn = document.getElementById('export-csv-btn'); // ✅ ปุ่ม Export
    
    // --- ตั้งค่า API ---
    const API_BASE_URL = 'https://2q9twc0it4.execute-api.us-east-1.amazonaws.com/new4'; 
    
    const token = localStorage.getItem('id_token');
    const username = localStorage.getItem('username');

    // --- 1. แสดง Username ของอาจารย์ที่ล็อกอิน ---
    if (userInfoEl && username) {
        userInfoEl.textContent = username;
    } else if (userInfoEl) {
        userInfoEl.textContent = "อาจารย์ผู้สอน";
    }

    // 2. อ่าน sessionId และ courseId จาก URL
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('sessionId');
    const courseId = params.get('courseId');

    if (!sessionId || !courseId) {
        courseIdEl.textContent = "เกิดข้อผิดพลาด";
        courseNameEl.textContent = "ไม่พบข้อมูลคาบเรียน";
        exportBtn.disabled = true; // ปิดปุ่มถ้าข้อมูลไม่ครบ
        return;
    }

    // 3. ตั้งค่าปุ่ม Home
    if (navBtn) {
        navBtn.addEventListener('click', () => {
            window.location.href = 'lecturer_home.html'; 
        });
    }

    // ✅ 4. ตั้งค่าปุ่ม Export CSV (ฉบับอัปเกรด)
    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            exportBtn.disabled = true;
            exportBtn.textContent = 'กำลัง Export...';

            try {
                // ✅✅✅ เรียก API ตัวใหม่สำหรับ "รายงานทั้งหมด" ✅✅✅
                // (เราจะใช้ courseId และไม่ใช้ sessionId)
                const response = await fetch(`${API_BASE_URL}/export/${courseId}`, {
                    headers: { 'Authorization': token }
                });

                if (!response.ok) throw new Error('ไม่สามารถสร้างไฟล์ Report ได้');

                const csvData = await response.text();
                
                // (โค้ดส่วนดาวน์โหลดไฟล์เหมือนเดิม)
                const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement("a");
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", `FullReport_${courseId}.csv`); // ❗️ ตั้งชื่อไฟล์ใหม่
                link.style.visibility = 'hidden';
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
            } catch (error) {
                console.error('Export Error:', error);
                alert(`ล้มเหลวในการ Export: ${error.message}`);
            }
            
            exportBtn.disabled = false;
            exportBtn.textContent = 'Export CSV';
        });
    }

    // 5. เรียก API เพื่อดึงข้อมูลรายชื่อ (สำหรับแสดงในตารางหน้านี้)
    try {
        const response = await fetch(`${API_BASE_URL}/attendance/${courseId}/${sessionId}`, {
            headers: { 'Authorization': token }
        });
        
        if (!response.ok) throw new Error('ไม่สามารถโหลดข้อมูลได้');

        const data = await response.json();
        const courseInfo = data.courseInfo;
        const allStudents = data.allStudents;

        courseIdEl.textContent = courseInfo.courseId || courseId;
        courseNameEl.textContent = courseInfo.courseName || "No course name found";

        // 6. สร้างตารางรายชื่อนักศึกษา (3 คอลัมน์)
        if (allStudents.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="3">ไม่พบรายชื่อนักศึกษาใน Group Students</td></tr>'; 
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
});

    // --- ❗️ ตั้งค่าที่จำเป็น ---
    const API_BASE_URL = "https://2q9twc0it4.execute-api.us-east-1.amazonaws.com/new4";
    const COGNITO_LOGIN_URL = "https://us-east-1jyr9f73t7.auth.us-east-1.amazoncognito.com/login?client_id=to3ao79rkq9stbt2mo0bsqp26&response_type=token&scope=openid+email&redirect_uri=http://localhost:5500/CS361-Project-/html/home.html";

    // --- ฟังก์ชันช่วยเหลือ (เหมือนเดิม) ---
    function parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) { return null; }
    }

    function getIdToken() {
        return localStorage.getItem('id_token');
    }

    // --- ฟังก์ชันสำหรับตั้งค่าหน้า Home ของนักศึกษา ---
    // (โค้ด setupStudentHomePage และ addClickListeners ของคุณเหมือนเดิม)
    async function setupStudentHomePage() {
        const token = getIdToken();
        const username = localStorage.getItem("username") || "Unknown User";
        const userInfoElement = document.getElementById("user-info");
        if (userInfoElement) {
            userInfoElement.textContent = username;
        }

        const subjectCards = document.querySelectorAll(".subject-card");
        for (const card of subjectCards) {
            const button = card.querySelector(".btn");
            const courseId = card.dataset.courseId;

            if (!courseId) {
                button.textContent = "N/A";
                continue;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/active-session/${courseId}`, {
                    headers: { 'Authorization': token }
                });
                
                if (response.ok) {
                    const sessionData = await response.json();
                    button.textContent = "เช็คชื่อ";
                    button.className = "btn green";
                    button.dataset.sessionId = sessionData.sessionId;
                } else {
                    button.textContent = "ปิด";
                    button.className = "btn gray";
                }
            } catch (error) {
                console.error(`เกิดข้อผิดพลาดในการตรวจสอบวิชา ${courseId}:`, error);
                button.textContent = "Error";
                button.className = "btn red";
            }
        }
    }

    function addClickListeners() {
        document.querySelectorAll('.subject-card .btn').forEach(button => {
            button.addEventListener('click', function () {
                if (button.textContent.trim().toLowerCase() === 'เช็คชื่อ') {
                    const card = button.closest('.subject-card');
                    const sessionId = button.dataset.sessionId;
                    const courseId = card.dataset.courseId;
                    const courseName = card.querySelector('span').textContent;

                    if (sessionId && courseId) {
                        const params = new URLSearchParams({
                            sessionId: sessionId,
                            courseId: courseId,
                            courseName: courseName
                        });
                        window.location.href = `../html/checkin.html?${params.toString()}`;
                    } else {
                        alert("เกิดข้อผิดพลาด: ไม่พบ Session ID หรือ Course ID");
                    }
                }
            });
        });
    }

    // --- ฟังก์ชันหลักสำหรับจัดการ Authentication และ Routing ---
    async function handleAuthentication() {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const idToken = params.get("id_token");

        if (idToken) {
            localStorage.setItem('id_token', idToken);
            history.replaceState(null, document.title, window.location.pathname);
        }

        const storedToken = getIdToken();
        if (!storedToken) {
            window.location.href = COGNITO_LOGIN_URL;
            return;
        }

        // ✅ FIX: ล้างข้อมูลที่ไม่จำเป็นของ user เก่าออก
        localStorage.removeItem('displayNameTH'); 
        localStorage.removeItem('userRole'); 
        // ---------------------------------------------
        
        const decodedToken = parseJwt(storedToken);
        if (decodedToken && decodedToken['cognito:username']) {
            // บันทึก username ของผู้ใช้ปัจจุบัน (teacher2 หรือ student1)
            localStorage.setItem('username', decodedToken['cognito:username']); 
        } else {
             localStorage.clear();
             window.location.href = COGNITO_LOGIN_URL;
             return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/me`, {
                headers: { 'Authorization': storedToken }
            });
            if (!response.ok) throw new Error('Token expired or invalid');

            const data = await response.json();
            const groups = data.groups || [];

            if (groups.includes("teacher")) { 
                // อาจารย์: Redirect ไปหน้าอาจารย์
                window.location.href = "lecturer_home.html";
            } else {
                // นักศึกษา: อยู่ที่นี่ต่อ
                await setupStudentHomePage();
                addClickListeners();
            }
        } catch (error) {
            localStorage.clear();
            alert("Session หมดอายุ กรุณาล็อกอินใหม่อีกครั้ง");
            window.location.href = COGNITO_LOGIN_URL;
        }
    }

    // --- เรียกใช้ฟังก์ชันหลักเมื่อหน้าเว็บโหลดเสร็จ ---
    document.addEventListener('DOMContentLoaded', handleAuthentication);
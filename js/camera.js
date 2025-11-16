document.addEventListener("DOMContentLoaded", () => {
    // --- ❗️ ตั้งค่า API Endpoint ---
    const API_ENDPOINT = 'https://2q9twc0it4.execute-api.us-east-1.amazonaws.com/new4/checkin';

    // --- อ้างอิง Element ---
    const fileInput = document.getElementById("fileInput");
    const preview = document.getElementById("preview");
    const confirmBtn = document.getElementById("confirmBtn");
    const backBtn = document.getElementById("backBtn");
    const noticeEl = document.getElementById("notice");
    const userInfoEl = document.getElementById("user-info");
    const workCanvas = document.getElementById("workCanvas");
    const commentEl = document.getElementById("comment");

    let processedBlob = null;

    function getIdToken() {
        return localStorage.getItem('id_token');
    }

    // --- 1. โหลดข้อมูลผู้ใช้ ---
    const username = localStorage.getItem("username") || "";
    userInfoEl.textContent = username;
    // ❌ ไม่มีการเรียก startCountdown() แล้ว

    // --- 2. จัดการเมื่อมีการเลือกไฟล์ ---
    fileInput.addEventListener("change", async () => {
        hideNotice();
        processedBlob = null;
        const file = fileInput.files && fileInput.files[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) return showNotice("กรุณาเลือกไฟล์รูปภาพเท่านั้น", true);
        
        try {
            const objectUrl = URL.createObjectURL(file);
            preview.src = objectUrl;
            preview.style.display = "block";
            const { blob } = await downscaleImage(file);
            processedBlob = blob;
        } catch (err) {
            console.error(err);
            showNotice("เกิดข้อผิดพลาดระหว่างประมวลผลรูป", true);
        }
    });

    // --- 3. จัดการเมื่อกดยืนยัน ---
    confirmBtn.addEventListener("click", async () => {
        
        const rating = document.querySelector('input[name="rating"]:checked')?.value;
        const comment = commentEl.value;
        const sessionId = localStorage.getItem("currentSessionId");
        const courseId = localStorage.getItem("currentCourseId");
        const token = getIdToken();

        if (!rating) {
            return showNotice("กรุณาให้คะแนนความเข้าใจ (1-5 ดาว)", true);
        }
        if (!processedBlob) {
            return showNotice("กรุณาเลือกรูปภาพก่อนกดยืนยัน", true);
        }
        if (!username || !sessionId || !courseId || !token) {
            return showNotice("ข้อมูล Session ไม่สมบูรณ์ กรุณากลับไปหน้าหลัก", true);
        }

        confirmBtn.disabled = true;
        showNotice("กำลังบันทึกข้อมูล...", false);

        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify({
                    username: username,
                    sessionId: sessionId,
                    courseId: courseId,
                    rating: parseInt(rating),
                    comment: comment,
                    fileType: processedBlob.type
                })
            });

            if (!response.ok) {
                if (response.status === 403) throw new Error('สิทธิ์ไม่ถูกต้องหรือ Session หมดอายุ');
                const errorData = await response.json();
                throw new Error(errorData.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
            }
            const data = await response.json();

            const uploadResponse = await fetch(data.uploadUrl, {
                method: 'PUT',
                headers: { 'Content-Type': processedBlob.type },
                body: processedBlob
            });

            if (!uploadResponse.ok) throw new Error('การอัปโหลดไฟล์ล้มเหลว');

            showNotice("✅ เช็คชื่อสำเร็จ!", false);
            alert("เช็คชื่อสำเร็จ!");
            window.location.href = 'home.html';

        } catch (err) {
            console.error(err);
            showNotice(`❌ เช็คชื่อไม่สำเร็จ: ${err.message}`, true);
            confirmBtn.disabled = false;
        }
    });

    // --- 4. ปุ่มย้อนกลับ ---
    backBtn.addEventListener("click", () => window.history.back());

    // --- 5. ฟังก์ชันช่วยเหลือและจัดการรูปภาพ ---
    function showNotice(text, isError = false) {
        noticeEl.textContent = text;
        noticeEl.style.color = isError ? 'red' : 'green';
        noticeEl.style.display = "block";
    }
    function hideNotice() { noticeEl.style.display = "none"; }
    
    // ❌ ลบฟังก์ชัน startCountdown() และ updateCountdown() ออกไป

    // (ฟังก์ชัน downscaleImage, readFileAsDataURL, loadImage, dataURLtoBlob ทั้งหมดเหมือนเดิม)
    async function downscaleImage(file, { maxWidth = 1280, maxHeight = 1280, quality = 0.9 } = {}) {
        const dataUrl = await readFileAsDataURL(file);
        const img = await loadImage(dataUrl);
        let { width, height } = img;
        const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
        const newW = Math.round(width * ratio);
        const newH = Math.round(height * ratio);
        workCanvas.width = newW;
        workCanvas.height = newH;
        const ctx = workCanvas.getContext("2d");
        ctx.drawImage(img, 0, 0, newW, newH);
        const outDataUrl = workCanvas.toDataURL("image/jpeg", quality);
        const outBlob = dataURLtoBlob(outDataUrl);
        return { blob: outBlob, dataUrl: outDataUrl };
    }

    function readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const fr = new FileReader();
            fr.onload = () => resolve(fr.result);
            fr.onerror = reject;
            fr.readAsDataURL(file);
        });
    }

    function loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    function dataURLtoBlob(dataUrl) {
        const [meta, base64] = dataUrl.split(",");
        const mime = meta.match(/:(.*?);/)[1] || "image/jpeg";
        const bin = atob(base64);
        const len = bin.length;
        const u8 = new Uint8Array(len);
        for (let i = 0; i < len; i++) u8[i] = bin.charCodeAt(i);
        return new Blob([u8], { type: mime });
    }
});
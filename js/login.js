let loginAttempts = 0; // ตัวแปรนับจำนวนครั้งที่ล็อกอินผิดพลาด
let isLocked = false; // สถานะการล็อกบัญชี
let lockCountdown = null; // ตัวแปรเก็บ interval สำหรับการนับถอยหลัง
let remainingTime = 0; // เวลาที่เหลือสำหรับการล็อก
let lockDuration = 30; // ระยะเวลาล็อกเริ่มต้น (วินาที)

// ฟังก์ชันเรียกใช้เมื่อโหลดหน้าเว็บ
document.addEventListener('DOMContentLoaded', () => {
    const messageElement = document.getElementById('message');
    const storedLockEndTime = localStorage.getItem('lockEndTime');
    const currentTime = Date.now();

    if (storedLockEndTime && currentTime < storedLockEndTime) {
        // ยังคงล็อกอยู่
        remainingTime = Math.ceil((storedLockEndTime - currentTime) / 1000);
        isLocked = true;

        messageElement.innerHTML = `บัญชีของคุณถูกล็อก <span id="lockTimer">${remainingTime}</span> วินาที`;
        messageElement.style.color = "red";

        startCountdown(); // เริ่มนับถอยหลัง
    }
});

function handleLoginAttempt(success) {
    const messageElement = document.getElementById('message');

    if (isLocked) {
        alert("บัญชีของคุณถูกล็อก โปรดลองใหม่ในภายหลัง");
        return false;
    }

    if (!success) {
        loginAttempts++;

        if (loginAttempts >= 5) {
            // ล็อกบัญชีเมื่อผิดพลาดเกิน 5 ครั้ง
            isLocked = true;
            remainingTime = lockDuration; // ตั้งค่าระยะเวลาล็อก
            const lockEndTime = Date.now() + remainingTime * 1000; // เวลาสิ้นสุดการล็อก
            localStorage.setItem('lockEndTime', lockEndTime); // บันทึกเวลาสิ้นสุดใน LocalStorage

            messageElement.innerHTML = `บัญชีของคุณถูกล็อก <span id="lockTimer">${remainingTime}</span> วินาที`;
            messageElement.style.color = "red";

            startCountdown(); // เริ่มนับถอยหลัง
        } else {
            // แสดงข้อความ "ล็อกอินผิดพลาด" และเปลี่ยนสี
            messageElement.innerHTML = `<span>ล็อกอินผิดพลาด</span> คุณเหลือโอกาสอีก <span>${5 - loginAttempts}</span> ครั้ง`;
            messageElement.style.color = "red";
        }
        return false;
    } else {
        if (isLocked) {
            alert("บัญชีของคุณถูกล็อก โปรดลองใหม่ในภายหลัง");
            return false;
        } else {
            loginAttempts = 0; // รีเซ็ตตัวนับเมื่อสำเร็จ
            lockDuration = 30; // รีเซ็ตระยะเวลาล็อกเป็นค่าเริ่มต้น
            localStorage.removeItem('lockEndTime'); // ลบข้อมูลการล็อกใน LocalStorage
            messageElement.innerText = ""; // ลบข้อความแจ้งเตือน
            return true;
        }
    }
}

function startCountdown() {
    const messageElement = document.getElementById('message');

    if (lockCountdown) {
        clearInterval(lockCountdown); // ป้องกันการซ้อนของตัวจับเวลา
    }

    lockCountdown = setInterval(() => {
        remainingTime--;
        if (remainingTime <= 0) {
            clearInterval(lockCountdown);
            lockCountdown = null;
            isLocked = false;
            loginAttempts = 0; // รีเซ็ตจำนวนครั้งที่พยายามล็อกอิน
            lockDuration += 30; // เพิ่มระยะเวลาล็อกครั้งถัดไปอีก 10 วินาที
            messageElement.innerText = ""; // ลบข้อความเมื่อปลดล็อก
            localStorage.removeItem('lockEndTime'); // ลบข้อมูลการล็อกใน LocalStorage
        } else {
            document.getElementById('lockTimer').innerText = remainingTime;
        }
    }, 1000);
}

function submitLogin() {
    if (isLocked) {
        alert("บัญชีของคุณถูกล็อก โปรดลองใหม่ในภายหลัง");
        return;
    }

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const usernameError = document.getElementById('usernameError');
    const passwordError = document.getElementById('passwordError');

    usernameError.innerText = "";
    passwordError.innerText = "";

    let isValid = true; // ตัวแปรเพื่อตรวจสอบความถูกต้องทั้งหมด

    // ตรวจสอบความยาวของ username
    if (username.length !== 10) {
        usernameError.innerText = "Username ต้องมีความยาว 10 ตัวอักษร";
        usernameError.classList.add("error");  // เพิ่ม class error
        isValid = false;
    }else if (username[2] !== '0' || username[3] !== '9') {
        // ตรวจสอบว่าตัวอักษรที่ 3 เป็น '0' และตัวที่ 4 เป็น '9'
        usernameError.innerText = "Username ไม่ถูกต้อง";
        usernameError.classList.add("error"); 
        isValid = false;
    } else {
        usernameError.classList.remove("error");  // เอา class error ออกถ้าถูกต้อง
    }

    // ตรวจสอบความยาวของ password
    if (password.length !== 13) {
        passwordError.innerText = "Password ต้องมีความยาว 13 ตัวอักษร";
        passwordError.classList.add("error");  // เพิ่ม class error
        isValid = false;
    } else {
        passwordError.classList.remove("error");  // เอา class error ออกถ้าถูกต้อง
    }

    // ถ้ามี error ให้หยุดการทำงาน
    if (!isValid) {
        handleLoginAttempt(false);
        return;
    }

    fetch('https://restapi.tu.ac.th/api/v1/auth/Ad/verify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Application-Key': 'TU5ce4207d6fb3085aba32c5a74e72aa711e9e07ad870eb799d80eb6330f460223e6ddf0d1dabcfca1cf64daecc8900a42'
        },
        body: JSON.stringify({ "UserName" : username, "PassWord" : password })
    })
    .then(response => response.json())
    .then(data => {
        const messageElement = document.getElementById('message');
        
        if (data.status === true && data.message === 'Success') {

            localStorage.setItem('displayNameTH', data.displayname_th);
            localStorage.setItem('username', data.username);

            window.location.href = 'form/main.html';
        } else {
            handleLoginAttempt(false);

        }
        // ทำการบันทึกข้อมูลผู้ใช้ลงในตาราง students
        saveUserToDatabase(data);
    })
    .catch(error => {
        console.error('Error:', error);
        alert(error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');

    });

}
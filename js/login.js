/*
// --- AWS SDK Configuration ---
const REGION = 'us-east-1'; // << แก้ไขเป็น Region ของคุณ
const USER_POOL_ID = 'us-east-1_...'; // << ❗️ ใส่ User Pool ID ของคุณที่นี่
const CLIENT_ID = '...'; // << ❗️ ใส่ App Client ID ของคุณที่นี่

AWS.config.update({ region: REGION });
const cognito = new AWS.CognitoIdentityServiceProvider();

// --- ฟังก์ชันหลักที่ทำงานเมื่อหน้าเว็บโหลดเสร็จ ---
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            submitLogin();
        });
    }
});


 * ฟังก์ชันหลักในการส่งข้อมูลล็อกอิน

async function submitLogin() {
    const messageElement = document.getElementById('message');
    const username = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const usernameError = document.getElementById('usernameError');
    const passwordError = document.getElementById('passwordError');

    usernameError.innerText = "";
    passwordError.innerText = "";
    messageElement.innerText = "";

    // --- ตรวจสอบ Input (Validation) ---
    let isValid = true;
    if (username.length !== 10 || username[2] !== '0' || username[3] !== '9') {
        usernameError.innerText = "รูปแบบรหัสนักศึกษาไม่ถูกต้อง";
        isValid = false;
    }
    if (password.length !== 13) {
        passwordError.innerText = "รหัสผ่านต้องมีความยาว 13 ตัวอักษร";
        isValid = false;
    }
    if (!isValid) {
        messageElement.innerText = 'ข้อมูลที่กรอกไม่ถูกต้อง';
        messageElement.style.color = 'red';
        return;
    }

    try {
        // --- ขั้นตอนที่ 1: เริ่มกระบวนการล็อกอินแบบ Custom Auth กับ Cognito ---
        const authResponse = await cognito.initiateAuth({
            AuthFlow: 'CUSTOM_AUTH',
            ClientId: CLIENT_ID,
            AuthParameters: { 'USERNAME': username }
        }).promise();
        
        const session = authResponse.Session;

        // --- ขั้นตอนที่ 2: ส่งรหัสผ่านเพื่อตอบ Challenge ---
        const challengeResponse = await cognito.respondToAuthChallenge({
            ChallengeName: 'CUSTOM_CHALLENGE',
            ClientId: CLIENT_ID,
            Session: session,
            ChallengeResponses: {
                'USERNAME': username,
                'ANSWER': password
            }
        }).promise();

        // --- ถ้าสำเร็จ จะได้รับ Token กลับมา ---
        if (challengeResponse.AuthenticationResult && challengeResponse.AuthenticationResult.IdToken) {
            const idToken = challengeResponse.AuthenticationResult.IdToken;
            localStorage.setItem('id_token', idToken);
            
            const userInfo = await getUserInfoFromApi(username, password);
            if (userInfo) {
                localStorage.setItem('displayNameTH', userInfo.displayname_th);
                localStorage.setItem('username', userInfo.username);
            }
            
            window.location.href = '../html/home.html';
        } else {
            throw new Error('Authentication failed.');
        }

    } catch (error) {
        console.error('Cognito Login Error:', error);
        messageElement.innerText = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
        messageElement.style.color = 'red';
    }
}

/**
 * ฟังก์ชันเสริมสำหรับดึงข้อมูลผู้ใช้จาก API มหาลัย
 
async function getUserInfoFromApi(username, password) {
    try {
        const response = await fetch('https://restapi.tu.ac.th/api/v1/auth/Ad/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Application-Key': 'TU5ce4207d6fb3085aba32c5a74e72aa711e9e07ad870eb799d80eb6330f460223e6ddf0d1dabcfca1cf64daecc8900a42'
            },
            body: JSON.stringify({ "UserName": username, "PassWord": password })
        });
        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.error("Could not fetch user info after login:", error);
        return null;
    }
}

 */
// GSAP & Firebase (Compat v8) & Cloud Sync Integrated Script

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

let db;
let isFirebaseReal = false;

// KVdb Cloud storage endpoint for persistent communication
const KVDB_URL = 'https://kvdb.io/robothomepage_2026_kim_db_079a77d9/posts';

// Default posts fallback
const DEFAULT_POSTS = [
    { id: "admin-1", author: "휴림로봇", password: "Admin", content: "실시간 클라우드 커뮤니티에 오신 것을 환영합니다! 작성한 글은 다른 기기에서도 사라지지 않고 실시간 동기화됩니다.", createdAt: { seconds: Date.now()/1000 } }
];

window.localPosts = [];

// Attempt to initialize Firebase
try {
    if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        isFirebaseReal = true;
        console.log("Connected to Firebase Firestore.");
    }
} catch (e) {
    console.warn("Firebase Init failed, falling back to Cloud Sync (KVdb) mode.");
}

/* --- Cloud Database Operations (for KVdb) --- */
async function fetchCloudPosts() {
    try {
        const response = await fetch(KVDB_URL);
        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data)) {
                return data;
            }
        }
    } catch (e) {
        console.error("Cloud database fetch failed:", e);
    }
    // Return localStorage fallback or default posts if cloud fails
    return JSON.parse(localStorage.getItem('sim_posts')) || DEFAULT_POSTS;
}

async function saveCloudPosts(posts) {
    try {
        localStorage.setItem('sim_posts', JSON.stringify(posts));
        const response = await fetch(KVDB_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(posts)
        });
        return response.ok;
    } catch (e) {
        console.error("Cloud database save failed:", e);
        return false;
    }
}

// Global actions for onclick access (edit/delete)
window.handlePostAction = async (id, action) => {
    const ADMIN_PW = "Admin";
    let inputPassword = prompt("비밀번호를 입력하세요:");
    if (inputPassword === null) return;
    inputPassword = inputPassword.trim();

    if (isFirebaseReal) {
        try {
            const docRef = db.collection("posts").doc(id);
            const doc = await docRef.get();
            if (doc.exists) {
                const data = doc.data();
                if (inputPassword === ADMIN_PW || (data.password && data.password.trim() === inputPassword)) {
                    if (action === 'delete') {
                        if (confirm("정말로 삭제하시겠습니까?")) {
                            await docRef.delete();
                            alert("삭제가 완료되었습니다.");
                        }
                    } else if (action === 'edit') {
                        const newContent = prompt("수정할 내용을 입력하세요:", data.content);
                        if (newContent !== null) {
                            await docRef.update({ content: newContent });
                            alert("수정이 완료되었습니다.");
                        }
                    }
                } else {
                    alert("비밀번호가 틀렸습니다.");
                }
            }
        } catch (err) { alert("오류 발생: " + err.message); }
    } else {
        // Load latest posts before editing
        window.localPosts = await fetchCloudPosts();
        const index = window.localPosts.findIndex(p => p.id === String(id));
        if (index !== -1) {
            const post = window.localPosts[index];
            if (inputPassword === ADMIN_PW || (post.password && post.password.trim() === inputPassword)) {
                if (action === 'delete') {
                    if (confirm("정말로 삭제하시겠습니까?")) {
                        window.localPosts.splice(index, 1);
                        await saveCloudPosts(window.localPosts);
                        window.refreshPosts();
                        alert("게시물이 삭제되었습니다.");
                    }
                } else if (action === 'edit') {
                    const newContent = prompt("수정할 내용을 입력하세요:", post.content);
                    if (newContent !== null) {
                        window.localPosts[index].content = newContent;
                        await saveCloudPosts(window.localPosts);
                        window.refreshPosts();
                        alert("게시물이 수정되었습니다.");
                    }
                }
            } else {
                alert("비밀번호가 틀렸습니다.");
            }
        }
    }
};

/* --- Inquiry Modal Controls --- */
function openModal() {
    const modal = document.getElementById('inquiryModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scroll
}

function closeModal() {
    const modal = document.getElementById('inquiryModal');
    modal.classList.remove('active');
    document.body.style.overflow = ''; // Restore scroll
}

// Close modal when clicking outside content
window.onclick = function(event) {
    const modal = document.getElementById('inquiryModal');
    if (event.target == modal) {
        closeModal();
    }
}

function handleInquiry(event) {
    event.preventDefault();
    const name = document.getElementById('inquiryName').value;
    const email = document.getElementById('inquiryEmail').value;
    
    // Simulate sending
    const btn = event.target.querySelector('button');
    const originalText = btn.innerText;
    btn.innerText = '전송 중...';
    btn.disabled = true;

    setTimeout(() => {
        alert(`${name}님, 문의가 정상적으로 접수되었습니다.\n등록하신 이메일(${email})로 곧 답변드리겠습니다.`);
        btn.innerText = originalText;
        btn.disabled = false;
        event.target.reset();
        closeModal();
    }, 1500);
}

// GSAP Animations Re-enabled for smoother reveal
document.addEventListener('DOMContentLoaded', async () => {
    gsap.from('.logo', { y: -20, opacity: 0, duration: 1, ease: 'power3.out' });
    gsap.from('nav ul li', { y: -20, opacity: 0, duration: 1, stagger: 0.1, ease: 'power3.out' });

    if (typeof gsap !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
        window.addEventListener('scroll', () => {
            const header = document.querySelector('header');
            if (window.scrollY > 50) header.classList.add('scrolled');
            else header.classList.remove('scrolled');
        });
        gsap.to(".scroll-progress", { width: "100%", ease: "none", scrollTrigger: { scrub: 0.3 } });
        gsap.from(".hero-title", { y: 50, opacity: 0, duration: 1.2, delay: 0.5 });
    }

    const postForm = document.getElementById('community-form');
    const postList = document.getElementById('community-posts');
    const authorInput = document.getElementById('post-author');
    const passwordInput = document.getElementById('post-password');
    const contentInput = document.getElementById('post-content');

    window.refreshPosts = async () => {
        if (!postList) return;
        
        let postsToRender = [];
        if (isFirebaseReal) {
            // Handled dynamically by Firebase onSnapshot listener below
            return;
        } else {
            postsToRender = window.localPosts;
        }
        
        postList.innerHTML = '';
        const sorted = [...postsToRender].sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
        sorted.forEach(renderSinglePost);
    };

    function renderSinglePost(post) {
        const dateStr = new Date(post.createdAt.seconds * 1000).toLocaleString();
        const div = document.createElement('div');
        div.className = 'post-item glass';
        div.innerHTML = `
            <div class="post-header">
                <span style="font-weight: bold; color: var(--accent);">${post.author}</span>
                <span>${dateStr}</span>
            </div>
            <p style="margin-top: 0.5rem; white-space: pre-wrap;">${post.content}</p>
            <div class="post-actions" style="margin-top: 1rem; display: flex; gap: 1rem; font-size: 0.75rem;">
                <a href="javascript:void(0)" onclick="handlePostAction('${post.id}', 'edit')" style="color: var(--accent); text-decoration: none;">수정</a>
                <a href="javascript:void(0)" onclick="handlePostAction('${post.id}', 'delete')" style="color: #ff453a; text-decoration: none;">삭제</a>
            </div>
        `;
        postList.appendChild(div);
    }

    if (isFirebaseReal) {
        db.collection("posts").orderBy("createdAt", "desc").onSnapshot(snapshot => {
            postList.innerHTML = '';
            snapshot.docs.forEach(doc => renderSinglePost({ id: doc.id, ...doc.data() }));
        });
    } else {
        // Initial load from cloud database
        window.localPosts = await fetchCloudPosts();
        window.refreshPosts();

        // 6 seconds interval auto polling for real-time chat feel
        setInterval(async () => {
            const latestPosts = await fetchCloudPosts();
            // Check if there are new/deleted posts
            if (JSON.stringify(latestPosts) !== JSON.stringify(window.localPosts)) {
                window.localPosts = latestPosts;
                window.refreshPosts();
            }
        }, 6000);
    }

    if (postForm) {
        postForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const author = authorInput.value.trim();
            const password = passwordInput.value.trim();
            const content = contentInput.value.trim();

            if (!author || !password || !content) return;

            if (isFirebaseReal) {
                db.collection("posts").add({
                    author, password, content,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                }).then(() => postForm.reset());
            } else {
                const newPost = { 
                    id: Date.now().toString(),
                    author, password, content, 
                    createdAt: { seconds: Date.now()/1000 } 
                };
                
                // Get latest database posts, append new, and push
                const latestPosts = await fetchCloudPosts();
                latestPosts.push(newPost);
                
                window.localPosts = latestPosts;
                await saveCloudPosts(window.localPosts);
                window.refreshPosts();
                
                postForm.reset();
            }
        });
    }
});

// chat.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getDatabase, ref, push, onChildAdded, set, onValue, remove, onChildRemoved } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBBBsr9Zjveq6MYdMuwVgAVGgEP_6AmPU0",
  authDomain: "uzak-media-chat.firebaseapp.com",
  databaseURL: "https://uzak-media-chat-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "uzak-media-chat",
  storageBucket: "uzak-media-chat.appspot.com",
  messagingSenderId: "353010124754",
  appId: "1:353010124754:web:11af752d0bffac765f2a0b"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const messagesRef = ref(db, "messages");
const onlineRef = ref(db, "onlineUsers");
const bannedRef = ref(db, "bannedUsers");

const nickPool = ["elma", "portakal", "mandalina", "avokado", "erik", "mango"];
let nickname = localStorage.getItem("nickname") || `${nickPool[Math.floor(Math.random() * nickPool.length)]}_${Math.floor(Math.random() * 1000)}`;
localStorage.setItem("nickname", nickname);
const userKey = nickname.replace(/[^a-zA-Z0-9]/g, "") + "_" + Math.floor(Math.random() * 10000);

const moderatorList = ["admin", "serhat06", "faruk52", "sinan07"];
let isAdmin = moderatorList.includes(nickname);

document.getElementById("nickname").innerText = `🧑 Takma adınız: ${nickname}`;

document.getElementById("change-nick-button").addEventListener("click", () => {
  const newNick = prompt("Yeni nickinizi girin (en az 3 karakter):");
  if (newNick && newNick.length > 2) {
    nickname = newNick;
    localStorage.setItem("nickname", nickname);
    document.getElementById("nickname").innerText = `🧑 Takma adınız: ${nickname}`;
    isAdmin = moderatorList.includes(nickname);
    setOnline();
  }
});

document.getElementById("admin-login-button").addEventListener("click", () => {
  const pass = prompt("Yönetici parolasını girin:");
  if (pass === "uzakadmin2025") {
    isAdmin = true;
    alert("Admin girişi başarılı.");
  } else {
    alert("Parola hatalı.");
  }
});

function setOnline() {
  set(ref(db, `onlineUsers/${userKey}`), {
    nick: nickname,
    timestamp: Date.now()
  });
}

setOnline();
setInterval(setOnline, 20000);

window.addEventListener("beforeunload", () => {
  remove(ref(db, `onlineUsers/${userKey}`));
});

document.getElementById("chat-form").addEventListener("submit", function(e) {
  e.preventDefault();
  const text = document.getElementById("message-input").value.trim();
  if (text.length > 0) {
    push(messagesRef, {
      user: nickname,
      text: text,
      time: new Date().toLocaleTimeString("tr-TR")
    });
    document.getElementById("message-input").value = "";
  }
});

onChildAdded(messagesRef, function(snapshot) {
  const msg = snapshot.val();
  const msgDiv = document.createElement("div");
  const isMod = moderatorList.includes(msg.user);

  msgDiv.classList.add("message", isMod ? "moderator" : "user");
  msgDiv.innerHTML = `<strong>${msg.user}</strong> <small style="float:right">${msg.time}</small><br>${msg.text}`;

  if (isAdmin) {
    const delBtn = document.createElement("button");
    delBtn.textContent = "Sil";
    delBtn.className = "delete-button";
    delBtn.onclick = () => remove(ref(db, `messages/${snapshot.key}`));

    const banBtn = document.createElement("button");
    banBtn.textContent = "Ban";
    banBtn.className = "ban-button";
    banBtn.onclick = () => set(ref(db, `bannedUsers/${msg.user}`), true);

    msgDiv.appendChild(delBtn);
    msgDiv.appendChild(banBtn);
  }

  document.getElementById("chat-box").appendChild(msgDiv);
  document.getElementById("chat-box").scrollTop = document.getElementById("chat-box").scrollHeight;
});

onChildRemoved(messagesRef, function(snapshot) {
  const chatBox = document.getElementById("chat-box");
  chatBox.innerHTML = "";
});

onValue(onlineRef, function(snapshot) {
  const userList = document.getElementById("user-list");
  userList.innerHTML = "";
  const now = Date.now();

  snapshot.forEach(child => {
    const data = child.val();
    if (now - data.timestamp < 30000) {
      const div = document.createElement("div");
      div.classList.add("user-item");
      div.innerText = data.nick;
      userList.appendChild(div);
    }
  });
});

onValue(bannedRef, function(snapshot) {
  const bannedUsers = snapshot.val() || {};
  if (bannedUsers[nickname]) {
    alert("Bu sohbetten banlandınız.");
    document.getElementById("chat-form").style.display = "none";
    document.getElementById("message-input").disabled = true;
  }
});

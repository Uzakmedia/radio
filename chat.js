// chat.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getDatabase, ref, push, onChildAdded, set, onValue, remove, update } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

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
const banRef = ref(db, "bannedIPs");

const nickPool = ["elma", "portakal", "mandalina", "avokado", "erik", "mango"];
const moderatorList = ["admin", "serhat06", "faruk52", "sinan07"];

let isAdmin = localStorage.getItem("isAdmin") === "true";
let nickname = localStorage.getItem("nickname");

if (!nickname) {
  nickname = nickPool[Math.floor(Math.random() * nickPool.length)] + "_" + Math.floor(Math.random() * 10000);
  localStorage.setItem("nickname", nickname);
}

const userKey = nickname;
const ipKey = `ip_${nickname}`;

document.getElementById("nickname").innerText = `🧑 Takma adınız: ${nickname}`;

function setOnline() {
  set(ref(db, `onlineUsers/${userKey}`), {
    nick: nickname,
    timestamp: Date.now()
  });
}

function getIP() {
  fetch("https://api.ipify.org?format=json")
    .then(response => response.json())
    .then(data => {
      localStorage.setItem("userIP", data.ip);
    });
}

getIP();
setOnline();
setInterval(setOnline, 20000);

window.addEventListener("beforeunload", () => {
  remove(ref(db, `onlineUsers/${userKey}`));
});

document.getElementById("chat-form").addEventListener("submit", function(e) {
  e.preventDefault();
  sendMessage();
});

document.getElementById("message-input").addEventListener("keypress", function(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

function sendMessage() {
  const text = document.getElementById("message-input").value.trim();
  if (text.length > 0) {
    const userIP = localStorage.getItem("userIP") || "unknown";
    set(ref(db, `messages/${Date.now()}`), {
      user: nickname,
      text: text,
      time: new Date().toLocaleTimeString("tr-TR"),
      ip: userIP
    });
    document.getElementById("message-input").value = "";
  }
}

document.getElementById("change-nick-button").addEventListener("click", function() {
  const newNick = prompt("Yeni nickinizi girin:");
  if (newNick && newNick.length > 2) {
    localStorage.setItem("nickname", newNick);
    location.reload();
  }
});

document.getElementById("admin-login-button").addEventListener("click", function() {
  const password = prompt("Admin şifresini girin:");
  if (password === "uzak123!6852") {
    localStorage.setItem("isAdmin", "true");
    isAdmin = true;
    alert("Admin girişi başarılı");
  } else {
    alert("Hatalı şifre");
  }
});

onChildAdded(messagesRef, function(snapshot) {
  const msg = snapshot.val();
  const key = snapshot.key;
  const msgDiv = document.createElement("div");
  const isMod = moderatorList.includes(msg.user);

  msgDiv.classList.add("message");
  if (isMod) msgDiv.classList.add("moderator");
  if (msg.user === "admin") msgDiv.classList.add("admin");
  if (!isMod && msg.user !== "admin") msgDiv.classList.add("user");

  msgDiv.innerHTML = `<strong>${msg.user}</strong> <small style="float:right">${msg.time}</small><br>${msg.text}`;

  // Silme ve Banlama yetkisi: admin VEYA moderator ise
  if (isAdmin || isMod) {
    const delBtn = document.createElement("button");
    delBtn.innerText = "Sil";
    delBtn.className = "delete-button";
    delBtn.onclick = () => {
      remove(ref(db, `messages/${key}`));
    };
    msgDiv.appendChild(delBtn);

    const banBtn = document.createElement("button");
    banBtn.innerText = "Ban";
    banBtn.className = "ban-button";
    banBtn.onclick = () => {
      if (msg.ip) {
        set(ref(db, `bannedIPs/${msg.ip}`), true);
        alert(`${msg.user} banlandı!`);
      }
    };
    msgDiv.appendChild(banBtn);
  }

  const bannedIPsRef = ref(db, `bannedIPs/${msg.ip}`);
  onValue(bannedIPsRef, function(snapshot) {
    if (snapshot.exists()) {
      alert("Bu IP adresi banlı olduğu için mesaj gönderemez.");
      document.getElementById("message-input").disabled = true;
      document.getElementById("send-button").disabled = true;
    }
  });

  document.getElementById("chat-box").appendChild(msgDiv);
  document.getElementById("chat-box").scrollTop = document.getElementById("chat-box").scrollHeight;
});

onValue(onlineRef, function(snapshot) {
  const userList = document.getElementById("user-list");
  userList.innerHTML = "";
  const now = Date.now();

  const users = [];

  snapshot.forEach(child => {
    const data = child.val();
    if (now - data.timestamp < 30000) {
      users.push(data.nick);
    }
  });

  users.forEach(nick => {
    const div = document.createElement("div");
    div.classList.add("user-item");
    div.innerText = nick;
    userList.appendChild(div);
  });
});

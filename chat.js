// chat.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  onChildAdded,
  set,
  onValue,
  remove,
  get,
  child
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

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

const moderatorList = ["admin", "serhat06", "faruk52", "sinan07"];
let currentNick = localStorage.getItem("nickname") || "";
let userKey = localStorage.getItem("userKey") || "";

const nickPool = ["elma", "portakal", "mandalina", "avokado", "erik", "mango"];

function generateNick() {
  let nick;
  do {
    nick = nickPool[Math.floor(Math.random() * nickPool.length)] + Math.floor(Math.random() * 1000);
  } while (localStorage.getItem("usedNicks")?.includes(nick));
  return nick;
}

function initNick() {
  if (!currentNick) {
    currentNick = generateNick();
    localStorage.setItem("nickname", currentNick);
  }
  if (!userKey) {
    userKey = currentNick + "_" + Math.floor(Math.random() * 10000);
    localStorage.setItem("userKey", userKey);
  }
  document.getElementById("nickname").innerText = `🧑 Takma adınız: ${currentNick}`;
  setOnline();
}

function setOnline() {
  set(ref(db, `onlineUsers/${userKey}`), {
    nick: currentNick,
    timestamp: Date.now()
  });
}

function checkBanAndStart() {
  onValue(bannedRef, (snapshot) => {
    const bans = snapshot.val() || {};
    if (bans[currentNick]) {
      alert("Bu kullanıcı adı yasaklanmıştır.");
      return;
    }
    onChildAdded(messagesRef, displayMessage);
    onValue(onlineRef, updateOnlineList);
  });
}

function displayMessage(snapshot) {
  const msg = snapshot.val();
  const msgDiv = document.createElement("div");
  const isMod = moderatorList.includes(msg.user);
  msgDiv.classList.add("message", isMod ? "moderator" : "user");
  if (msg.user === "admin") msgDiv.classList.add("admin");
  msgDiv.innerHTML = `<strong>${msg.user}</strong> <small style="float:right">${msg.time}</small><br>${msg.text}`;
  if (isMod || msg.user === currentNick) {
    const delBtn = document.createElement("button");
    delBtn.className = "delete-button";
    delBtn.innerText = "Sil";
    delBtn.onclick = () => remove(child(messagesRef, snapshot.key));
    msgDiv.appendChild(delBtn);
  }
  document.getElementById("chat-box").appendChild(msgDiv);
  document.getElementById("chat-box").scrollTop = document.getElementById("chat-box").scrollHeight;
}

function updateOnlineList(snapshot) {
  const userList = document.getElementById("user-list");
  userList.innerHTML = "";
  const now = Date.now();
  snapshot.forEach((child) => {
    const data = child.val();
    if (now - data.timestamp < 30000) {
      const div = document.createElement("div");
      div.classList.add("user-item");
      div.innerText = data.nick;
      userList.appendChild(div);
    }
  });
}

function sendMessage(e) {
  e.preventDefault();
  const text = document.getElementById("message-input").value.trim();
  if (text.length > 0) {
    push(messagesRef, {
      user: currentNick,
      text: text,
      time: new Date().toLocaleTimeString("tr-TR")
    });
    document.getElementById("message-input").value = "";
  }
}

function changeNickname() {
  const newNick = prompt("Yeni takma adınız?");
  if (newNick && newNick.length > 2) {
    currentNick = newNick;
    localStorage.setItem("nickname", currentNick);
    document.getElementById("nickname").innerText = `🧑 Takma adınız: ${currentNick}`;
    setOnline();
  }
}

function adminLogin() {
  const pass = prompt("Admin şifresini girin:");
  if (pass === "uzakadmin2025") {
    currentNick = "admin";
    localStorage.setItem("nickname", currentNick);
    alert("Admin girişi başarılı. Artık mesaj silebilir ve banlayabilirsiniz.");
    document.getElementById("nickname").innerText = `🧑 Takma adınız: ${currentNick}`;
    setOnline();
  } else {
    alert("Hatalı şifre.");
  }
}

document.getElementById("chat-form").addEventListener("submit", sendMessage);
document.getElementById("change-nick-button").addEventListener("click", changeNickname);
document.getElementById("admin-login-button").addEventListener("click", adminLogin);
window.addEventListener("beforeunload", () => remove(ref(db, `onlineUsers/${userKey}`)));

initNick();
checkBanAndStart();
setInterval(setOnline, 20000);

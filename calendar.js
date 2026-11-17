// GWU Duquès Hall room reservation calendar (front-end demo).
// Reservations are persisted in localStorage so bookings survive navigation and reloads.
// A real deployment replaces this storage layer with the backend/database described in README.md.

const STORAGE_KEY = "gwuReservations";
const MAX_STUDENT_SLOTS_PER_DAY = 4;   // 4 x 30 min = 2 hours
const MAX_DAYS_AHEAD = 14;             // policy: up to two weeks in advance

const userEmail = localStorage.getItem("userEmail");
const userRole = localStorage.getItem("userRole");

const ALL_ROOMS = ["Room 101", "Room 102", "Room 103", "Faculty Lounge", "Conference Room A", "Admin Office"];
const ROOMS_BY_ROLE = {
  student: ["Room 101", "Room 102", "Room 103"],
  faculty: ["Room 101", "Room 102", "Room 103", "Faculty Lounge", "Conference Room A"],
  admin: ALL_ROOMS,
};
const rooms = ROOMS_BY_ROLE[userRole] || ROOMS_BY_ROLE.student;

const timeSlots = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
  "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM",
  "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM",
  "9:00 PM", "9:30 PM", "10:00 PM",
];

let currentDate = startOfDay(new Date());

// ---------- helpers ----------
function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getDateLabel(date) {
  return date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function slotStart(date, index) {
  const [time, meridiem] = timeSlots[index].split(" ");
  let [h, m] = time.split(":").map(Number);
  if (meridiem === "PM" && h !== 12) h += 12;
  if (meridiem === "AM" && h === 12) h = 0;
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

function showMessage(text, isError = false) {
  const box = document.getElementById("message");
  box.textContent = text;
  box.classList.toggle("error", isError);
  box.hidden = !text;
}

// Small deterministic PRNG so demo data for a given day is stable.
function seededRandom(seedStr) {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return function () {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- storage ----------
function loadStore() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch (e) {
    return {};
  }
}

function saveStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

// Seeds demo reservations (by "other" users) the first time a day is viewed.
function ensureDay(store, key) {
  if (store[key]) return store[key];
  const rand = seededRandom(key);
  const day = {};
  ALL_ROOMS.forEach((room) => {
    day[room] = timeSlots.map(() => {
      if (rand() > 0.3) return null;
      const by = ["student", "faculty", "admin"][Math.floor(rand() * 3)];
      return { by: `${by}@demo.gwu.edu`, role: by };
    });
  });
  store[key] = day;
  return day;
}

// ---------- rendering ----------
function updateDateDisplay() {
  document.getElementById("dayDisplay").textContent = getDateLabel(currentDate);
  const today = startOfDay(new Date());
  const last = new Date(today);
  last.setDate(last.getDate() + MAX_DAYS_AHEAD);
  document.getElementById("prevBtn").disabled = currentDate <= today;
  document.getElementById("nextBtn").disabled = currentDate >= last;
}

function makeCell(text, className) {
  const cell = document.createElement("div");
  cell.className = `cell ${className || ""}`.trim();
  cell.textContent = text;
  return cell;
}

function renderCalendar() {
  const store = loadStore();
  const day = ensureDay(store, dateKey(currentDate));
  saveStore(store);

  const grid = document.getElementById("calendarGrid");
  grid.replaceChildren();
  grid.style.gridTemplateColumns = `150px repeat(${timeSlots.length}, minmax(86px, 1fr))`;

  grid.appendChild(makeCell("Room / Time", "header corner"));
  timeSlots.forEach((slot) => grid.appendChild(makeCell(slot, "header")));

  const now = new Date();
  rooms.forEach((room) => {
    grid.appendChild(makeCell(room, "header room-name"));
    day[room].forEach((slot, index) => {
      const isPast = slotStart(currentDate, index) < now;
      let label, cls;
      if (slot) {
        const mine = slot.by === userEmail;
        label = mine ? "Your booking" : `Reserved (${slot.role})`;
        cls = mine ? "reserved mine" : "reserved";
      } else if (isPast) {
        label = "Past";
        cls = "past";
      } else {
        label = "Available";
        cls = "available";
      }
      const cell = makeCell(label, cls);
      if (cls !== "past") {
        cell.tabIndex = 0;
        cell.setAttribute("role", "button");
        const activate = () => handleClick(room, index);
        cell.addEventListener("click", activate);
        cell.addEventListener("keydown", (ev) => {
          if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); activate(); }
        });
      }
      grid.appendChild(cell);
    });
  });
}

// ---------- actions ----------
function countMyBookings(day) {
  return Object.values(day).reduce(
    (sum, slots) => sum + slots.filter((s) => s && s.by === userEmail).length, 0);
}

function handleClick(room, index) {
  showMessage("");
  const store = loadStore();
  const key = dateKey(currentDate);
  const day = ensureDay(store, key);
  const slot = day[room][index];
  const time = timeSlots[index];

  if (slot) {
    const mine = slot.by === userEmail;
    if (mine || userRole === "admin") {
      if (confirm(`Cancel reservation for ${room} at ${time}?`)) {
        day[room][index] = null;
        saveStore(store);
        renderCalendar();
        showMessage(`Reservation for ${room} at ${time} cancelled.`);
      }
    } else {
      showMessage(`${room} at ${time} is already reserved.`, true);
    }
    return;
  }

  // Booking rules
  if (slotStart(currentDate, index) < new Date()) {
    showMessage("You cannot book a time that has already passed.", true);
    return;
  }
  if (userRole === "student" && countMyBookings(day) >= MAX_STUDENT_SLOTS_PER_DAY) {
    showMessage("You've reached your daily booking limit (2 hours).", true);
    return;
  }

  day[room][index] = { by: userEmail, role: userRole };
  saveStore(store);
  renderCalendar();
  showMessage(`Booked ${room} at ${time} on ${getDateLabel(currentDate)}.`);
}

function csvCell(value) {
  const s = String(value ?? "");
  // Neutralise spreadsheet formula injection, then quote.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

function downloadAllReservations() {
  const store = loadStore();
  const rows = [["Date", "Room", "Time", "Reserved by", "Role"]];
  Object.keys(store).sort().forEach((date) => {
    Object.keys(store[date]).forEach((room) => {
      store[date][room].forEach((slot, index) => {
        if (slot) rows.push([date, room, timeSlots[index], slot.by, slot.role]);
      });
    });
  });
  const csv = rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "reservations.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function changeDay(delta) {
  const next = new Date(currentDate);
  next.setDate(next.getDate() + delta);
  const today = startOfDay(new Date());
  const last = new Date(today);
  last.setDate(last.getDate() + MAX_DAYS_AHEAD);
  if (next < today || next > last) return;
  currentDate = next;
  showMessage("");
  updateDateDisplay();
  renderCalendar();
}

function logout() {
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userRole");
  window.location.href = "loginpage.html";
}

document.addEventListener("DOMContentLoaded", () => {
  if (!userEmail || !userRole) return; // the inline script in <head> is redirecting
  document.getElementById("userInfo").textContent = `${userEmail} (${userRole})`;
  document.getElementById("prevBtn").addEventListener("click", () => changeDay(-1));
  document.getElementById("nextBtn").addEventListener("click", () => changeDay(1));
  document.getElementById("logoutBtn").addEventListener("click", logout);
  if (userRole === "admin") {
    document.getElementById("admin-tools").hidden = false;
    document.getElementById("downloadBtn").addEventListener("click", downloadAllReservations);
  }
  updateDateDisplay();
  renderCalendar();
});

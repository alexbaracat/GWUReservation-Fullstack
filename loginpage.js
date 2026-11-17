// Login page: validates a GWU email and stores the user's email and role.
// NOTE: this is client-side only (demo). Real authentication needs a backend / GWU SSO.

const ROLE_BY_DOMAIN = [
  ["@admin.gwu.edu", "admin"],
  ["@email.gwu.edu", "faculty"],
  ["@gwmail.gwu.edu", "student"],
  ["@gwu.edu", "student"],
];

function getRole(email) {
  const match = ROLE_BY_DOMAIN.find(([domain]) => email.endsWith(domain));
  return match ? match[1] : null;
}

const form = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const errorBox = document.getElementById("loginError");

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}

// Already logged in? Go straight to the calendar.
try {
  if (localStorage.getItem("userEmail") && localStorage.getItem("userRole")) {
    window.location.replace("calendar.html");
  }
} catch (e) { /* storage unavailable: show the login form */ }

form.addEventListener("submit", (e) => {
  e.preventDefault();
  errorBox.hidden = true;

  const email = emailInput.value.trim().toLowerCase();
  const validShape = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const role = validShape ? getRole(email) : null;

  if (!role) {
    showError("Please use your GWU email (for example name@gwu.edu).");
    return;
  }

  try {
    localStorage.setItem("userEmail", email);
    localStorage.setItem("userRole", role);
  } catch (err) {
    showError("Your browser blocked local storage, so login is not possible.");
    return;
  }
  window.location.href = "calendar.html";
});

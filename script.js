// --- Element references ---
const container = document.querySelector(".container");
const signUpLink = document.querySelector(".SignUpLink");
const signInLink = document.querySelector(".SignInLink");

const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");

// --- Toggle between Login and Register ---
signUpLink.addEventListener("click", (e) => {
  e.preventDefault();
  container.classList.add("active"); // show Register form
});

signInLink.addEventListener("click", (e) => {
  e.preventDefault();
  container.classList.remove("active"); // show Login form
});

// --- Handle Registration ---
registerForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const username = this.querySelector("input[type='text']").value.trim();
  const email = this.querySelector("input[type='email']").value.trim();
  const password = this.querySelector("input[type='password']").value.trim();
  const role = this.querySelector("input[name='role']:checked").value;

  if (!username || !email || !password || !role) {
    alert("Please fill in all fields and select a role.");
    return;
  }

  // Save user data in localStorage (for demo only)
  const userData = { username, email, password, role };
  localStorage.setItem("userData", JSON.stringify(userData));

  alert(`Registered successfully as ${role}! Please login.`);

  // Switch to login form
  container.classList.remove("active");
  registerForm.reset();
});

// --- Handle Login ---
loginForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const username = this.querySelector("input[type='text']").value.trim();
  const password = this.querySelector("input[type='password']").value.trim();

  const storedData = JSON.parse(localStorage.getItem("userData"));

  if (!storedData) {
    alert("No user found. Please register first!");
    return;
  }

  if (username === storedData.username && password === storedData.password) {
    alert(`Welcome back, ${storedData.username}!`);

    // Redirect based on role
    if (storedData.role === "donor") {
      window.location.href = "donor.html";
    } else if (storedData.role === "receiver") {
      window.location.href = "receiver.html";
    }
  } else {
    alert("Invalid username or password!");
  }
});
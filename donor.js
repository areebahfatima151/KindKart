// --- Storage Helpers ---
const D_KEY = "donations";

function read(key) {
  return JSON.parse(localStorage.getItem(key)) || [];
}

function write(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

// --- Donor: Add donation ---
function addDonation(food, quantity, time, location) {
  const donations = read(D_KEY);
  donations.push({
    food,
    quantity,
    time,
    location,
    taken: false,
    completed: false,
    photo: null,
  });
  write(D_KEY, donations);
}

// --- Receiver: Get available donations ---
function getDonations() {
  return read(D_KEY).filter((d) => !d.taken); // only untaken
}

// --- Receiver: Accept donation ---
function acceptDonation(index) {
  const donations = read(D_KEY);
  donations[index].taken = true;
  write(D_KEY, donations);
}

// --- Complete donation with photo ---
function completeDonation(index, photoData) {
  const donations = read(D_KEY);
  donations[index].completed = true;
  donations[index].photo = photoData; // attach photo
  write(D_KEY, donations);
}

// --- Tab Switching ---
function setupTabs(tabBtnsSelector, tabContentPrefix) {
  document.querySelectorAll(tabBtnsSelector).forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(tabBtnsSelector)
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const tabName = btn.dataset.tab;
      document
        .querySelectorAll(`.${tabContentPrefix}-tab-content`)
        .forEach((c) => (c.style.display = "none"));
      document.getElementById(
        `${tabContentPrefix}-${tabName}`
      ).style.display = "block";
    });
  });
}

// --- Page specific code ---
document.addEventListener("DOMContentLoaded", () => {
  const page = window.location.pathname.split("/").pop();

  // ----------------- DONOR -----------------
  if (page === "donor.html") {
    setupTabs(".donor-tab-btn", "donor");

    // Handle Add Donation form
    const form = document.getElementById("donor-add-form");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const food = document.getElementById("food").value;
      const quantity = document.getElementById("quantity").value;
      const time = document.getElementById("time").value;
      const location = document.getElementById("location").value;

      addDonation(food, quantity, time, location);
      alert("Donation added!");
      form.reset();
      renderDonorList();
      renderHistory();
      renderStats();
    });

    function renderDonorList() {
      const list = document.getElementById("donor-list");
      list.innerHTML = "";
      const donations = read(D_KEY);
      donations.forEach((d) => {
        const div = document.createElement("div");
        div.className = "card";
        div.textContent = `${d.food} - ${d.quantity} - ${d.time} - ${d.location} [${d.taken ? (d.completed ? "Completed" : "Accepted") : "Pending"}]`;
        list.appendChild(div);
      });
    }

    function renderHistory() {
      const historyDiv = document.getElementById("donor-history-list");
      historyDiv.innerHTML = "";
      const donations = read(D_KEY).filter((d) => d.completed);
      if (donations.length === 0) {
        historyDiv.textContent = "No completed donations yet.";
        return;
      }
      donations.forEach((d) => {
        const card = document.createElement("div");
        card.textContent = `${d.food} (${d.quantity}) at ${d.location} - Completed`;
        if (d.photo) {
          const img = document.createElement("img");
          img.src = d.photo;
          img.style.maxWidth = "120px";
          img.style.display = "block";
          card.appendChild(img);
        }
        historyDiv.appendChild(card);
      });
    }

    function renderStats() {
      const donations = read(D_KEY);
      document.getElementById("stat-total").textContent = donations.length;
      document.getElementById("stat-accepted").textContent = donations.filter(
        (d) => d.taken && !d.completed
      ).length;
      document.getElementById("stat-completed").textContent = donations.filter(
        (d) => d.completed
      ).length;
    }

    // expose functions
    window.renderDonorList = renderDonorList;
    window.renderHistory = renderHistory;
    window.renderStats = renderStats;

    renderDonorList();
    renderHistory();
    renderStats();
  }

  // ----------------- RECEIVER -----------------
  if (page === "receiver.html") {
    setupTabs(".receiver-tab-btn", "receiver");

    function renderAvailable() {
      const div = document.getElementById("receiver-available");
      div.innerHTML = "";
      const donations = getDonations();
      if (donations.length === 0) {
        div.textContent = "No donations available.";
        return;
      }
      donations.forEach((d, idx) => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `${d.food} - ${d.quantity} - ${d.time} - ${d.location} `;
        const btn = document.createElement("button");
        btn.textContent = "Accept";
        btn.onclick = () => {
          const all = read(D_KEY);
          const globalIndex = all.findIndex(
            (x) =>
              x.food === d.food &&
              x.quantity === d.quantity &&
              x.time === d.time &&
              x.location === d.location
          );
          acceptDonation(globalIndex);
          alert("Donation accepted! Upload photo once done to complete.");
          renderAvailable();
          renderHistory();
          renderStatus();
          populatePhotoDropdown(); // NEW: update dropdown after acceptance
        };
        card.appendChild(btn);
        div.appendChild(card);
      });
    }

    function renderHistory() {
      const historyList = document.getElementById("receiver-history-list");
      historyList.innerHTML = "";
      const donations = read(D_KEY).filter((d) => d.taken);
      donations.forEach((d) => {
        const li = document.createElement("li");
        li.textContent = `${d.food} (${d.quantity}) from ${d.location} - ${
          d.completed ? "Completed" : "In Progress"
        }`;

        if (!d.completed) {
          const form = document.createElement("form");
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "image/*";
          const submit = document.createElement("button");
          submit.textContent = "Upload Photo & Complete";
          form.appendChild(input);
          form.appendChild(submit);

          form.addEventListener("submit", (e) => {
            e.preventDefault();
            const file = input.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = function (evt) {
                const all = read(D_KEY);
                const globalIndex = all.findIndex(
                  (x) =>
                    x.food === d.food &&
                    x.quantity === d.quantity &&
                    x.time === d.time &&
                    x.location === d.location
                );
                completeDonation(globalIndex, evt.target.result);
                alert("Donation marked as Completed!");
                renderHistory();
                renderStatus();
                populatePhotoDropdown(); // NEW: update dropdown after completion
              };
              reader.readAsDataURL(file);
            }
          });
          li.appendChild(form);
        } else if (d.photo) {
          const img = document.createElement("img");
          img.src = d.photo;
          img.style.maxWidth = "120px";
          img.style.display = "block";
          li.appendChild(img);
        }

        historyList.appendChild(li);
      });
    }

    function renderStatus() {
      const donations = read(D_KEY);
      document.getElementById("receiver-total").textContent = donations.filter(
        (d) => d.taken && !d.completed
      ).length;
      document.getElementById("receiver-completed").textContent = donations.filter(
        (d) => d.completed
      ).length;
    }

    // expose functions
    window.renderAvailable = renderAvailable;
    window.renderHistory = renderHistory;
    window.renderStatus = renderStatus;

    renderAvailable();
    renderHistory();
    renderStatus();
    populatePhotoDropdown(); // NEW: initial dropdown fill
  }

  // --- Sync between pages ---
  window.addEventListener("storage", (event) => {
    if (event.key === D_KEY) {
      if (page === "donor.html") {
        renderDonorList?.();
        renderHistory?.();
        renderStats?.();
      }
      if (page === "receiver.html") {
        renderAvailable?.();
        renderHistory?.();
        renderStatus?.();
        populatePhotoDropdown?.();
      }
    }
  });
});

// 📸 Handle Photo Upload inside Status tab
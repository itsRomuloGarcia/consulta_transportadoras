const APP_URL =
  "https://script.google.com/macros/s/AKfycbwSbPLvfBYoTqy8XBOLpnZ8SK3GPLGW-inDWSbJ6gWOf0R2M3YHjvyk8GsQOOnWSvvm/exec";

const elements = {
  cidadeInput: document.getElementById("cidadeInput"),
  searchButton: document.getElementById("searchButton"),
  modalFilter: document.getElementById("modalFilter"), // Novo elemento
  estadoFilter: document.getElementById("estadoFilter"),
  transportadoraFilter: document.getElementById("transportadoraFilter"),
  resultsContainer: document.getElementById("resultsContainer"),
  loadingIndicator: document.getElementById("loadingIndicator"),
  noResultsMessage: document.getElementById("noResultsMessage"),
  resultsCount: document.getElementById("resultsCount"),
  themeToggle: document.getElementById("themeToggle"),
};

let currentResults = [];
let currentTheme = "dark";

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("currentYear").textContent = new Date().getFullYear();

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  setTheme(prefersDark ? "dark" : "light");

  elements.searchButton.addEventListener("click", performSearch);
  elements.cidadeInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      performSearch();
    }
  });
  elements.modalFilter.addEventListener("change", filterResults); // Novo listener
  elements.estadoFilter.addEventListener("change", filterResults);
  elements.transportadoraFilter.addEventListener("change", filterResults);
  elements.themeToggle.addEventListener("click", toggleTheme);
});

// Tema (mantido igual)
function toggleTheme() {
  currentTheme = currentTheme === "dark" ? "light" : "dark";
  setTheme(currentTheme);
}

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const icon = elements.themeToggle.querySelector("i");
  icon.className = theme === "dark" ? "fas fa-moon" : "fas fa-sun";

  try {
    localStorage.setItem("themePreference", theme);
  } catch (e) {
    console.warn("Não foi possível salvar a preferência de tema.");
  }
}

async function performSearch() {
  const cidade = elements.cidadeInput.value.trim();

  if (!cidade) {
    displayResults([]);
    return;
  }

  showLoading(true);
  try {
    const modal = elements.modalFilter.value;
    const response = await fetch(
      `${APP_URL}?cidade=${encodeURIComponent(cidade)}&modal=${modal}`
    );
    const data = await response.json();

    currentResults = data;
    populateFilters(currentResults);
    filterResults();
  } catch (error) {
    console.error("Erro ao buscar dados:", error);
    showError("Erro ao buscar dados. Tente novamente.");
  } finally {
    showLoading(false);
  }
}

function populateFilters(data) {
  const estados = [...new Set(data.map((i) => i.estado))].sort();
  const transportadoras = [
    ...new Set(data.map((i) => i.transportadora)),
  ].sort();
  const modais = [...new Set(data.map((i) => i.modal))].sort();

  elements.estadoFilter.innerHTML =
    '<option value="">Todos os estados</option>' +
    estados.map((e) => `<option value="${e}">${e}</option>`).join("");

  elements.transportadoraFilter.innerHTML =
    '<option value="">Todas transportadoras</option>' +
    transportadoras.map((t) => `<option value="${t}">${t}</option>`).join("");
}

function filterResults() {
  const modal = elements.modalFilter.value;
  const estado = elements.estadoFilter.value;
  const transportadora = elements.transportadoraFilter.value;

  const data = currentResults.filter((item) => {
    return (
      (modal === "todos" ||
        item.modal?.toLowerCase() === modal.toLowerCase()) &&
      (!estado || item.estado === estado) &&
      (!transportadora || item.transportadora === transportadora)
    );
  });

  displayResults(data);
}

function displayResults(data) {
  elements.resultsContainer.innerHTML = "";

  if (data.length === 0) {
    elements.noResultsMessage.style.display = "block";
    elements.resultsCount.textContent = "0";
    return;
  }

  elements.noResultsMessage.style.display = "none";
  elements.resultsCount.textContent = data.length;

  const cards = data
    .map(
      (item) => `
    <div class="result-card">
      <h3>${item.cidade} <small>(${item.estado})</small></h3>
      <p><strong>Transportadora:</strong> ${item.transportadora}</p>
      <p><strong>Modal:</strong> ${item.modal || "Não especificado"}</p>
      <p><strong>Prazo de entrega:</strong> <span class="days">${
        item.diasUteis
      } dias úteis</span></p>
    </div>
  `
    )
    .join("");

  elements.resultsContainer.innerHTML = cards;
}

function showLoading(show) {
  elements.loadingIndicator.style.display = show ? "block" : "none";
  elements.resultsContainer.style.display = show ? "none" : "grid";
}

function showError(message) {
  elements.noResultsMessage.innerHTML = `
    <i class="fas fa-exclamation-triangle"></i>
    <p>${message}</p>
  `;
  elements.noResultsMessage.style.display = "block";
}

function debounce(fn, delay = 300) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

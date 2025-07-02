// Configuração
const APP_URL =
  "https://script.google.com/macros/s/AKfycbx67_obUOzi_VuUWrF0DUcTgZV5uMgwPfI2z1TtM7nAVtoD1CtdzEbXkp0pzvQ4H7dH/exec";

// Elementos DOM
const elements = {
  cidadeInput: document.getElementById("cidadeInput"),
  searchButton: document.getElementById("searchButton"),
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

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("currentYear").textContent = new Date().getFullYear();

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  setTheme(prefersDark ? "dark" : "light");

  elements.searchButton.addEventListener("click", performSearch);
  elements.cidadeInput.addEventListener("input", debounce(performSearch, 300));
  elements.estadoFilter.addEventListener("change", filterResults);
  elements.transportadoraFilter.addEventListener("change", filterResults);
  elements.themeToggle.addEventListener("click", toggleTheme);
});

// Tema
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

// Pesquisa por cidade (faz fetch com filtro)
async function performSearch() {
  const cidade = elements.cidadeInput.value.trim();

  if (!cidade) {
    displayResults([]);
    return;
  }

  showLoading(true);
  try {
    const response = await fetch(
      `${APP_URL}?cidade=${encodeURIComponent(cidade)}`
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

// Filtros
function populateFilters(data) {
  const estados = [...new Set(data.map((i) => i.estado))].sort();
  const transportadoras = [
    ...new Set(data.map((i) => i.transportadora)),
  ].sort();

  elements.estadoFilter.innerHTML =
    '<option value="">Todos os estados</option>' +
    estados.map((e) => `<option value="${e}">${e}</option>`).join("");

  elements.transportadoraFilter.innerHTML =
    '<option value="">Todas transportadoras</option>' +
    transportadoras.map((t) => `<option value="${t}">${t}</option>`).join("");
}

function filterResults() {
  const estado = elements.estadoFilter.value;
  const transportadora = elements.transportadoraFilter.value;

  const data = currentResults.filter((item) => {
    return (
      (!estado || item.estado === estado) &&
      (!transportadora || item.transportadora === transportadora)
    );
  });

  displayResults(data);
}

// Exibir resultados
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
      <p><strong>Prazo de entrega:</strong> <span class="days">${item.diasUteis} dias úteis</span></p>
    </div>
  `
    )
    .join("");

  elements.resultsContainer.innerHTML = cards;
}

// Utilitários
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

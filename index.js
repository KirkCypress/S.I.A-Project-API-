let searchHistory = [];

function addSearchToHistory(name) {
    if (!searchHistory.includes(name)) {
        searchHistory.push(name);
        const historyContainer = document.getElementById("searchHistory");
        const historyItem = document.createElement("div");
        historyItem.textContent = name.charAt(0).toUpperCase() + name.slice(1);
        historyItem.classList.add("history-item");
        historyItem.onclick = () => {
            document.getElementById("pokemonName").value = name;
            fetchData();
        };
        historyContainer.appendChild(historyItem);
    }
}

let pokemonNames = [];

function showModal(message) {
    const modal = document.getElementById("errorModal");
    const errorMessage = document.getElementById("errorMessage");
    const overlay = document.querySelector(".modal-overlay");

    // Update the error message
    errorMessage.innerHTML = `<span>Error:</span> ${message}`;

    // Show the modal and overlay
    modal.style.display = "block";
    overlay.style.display = "block";
}

function closeModal() {
    const modal = document.getElementById("errorModal");
    const overlay = document.querySelector(".modal-overlay");

    // Hide the modal and overlay
    modal.style.display = "none";
    overlay.style.display = "none";
}

async function loadPokemonNames() {
    try {
        const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1000");
        if (!response.ok) throw new Error("Failed to fetch Pokémon list.");
        const data = await response.json();
        pokemonNames = data.results.map(pokemon => pokemon.name.toLowerCase());
    } catch (error) {
        console.error("Error loading Pokémon names:", error);
    }
}

async function fetchRandomPokemon() {
    const randomId = Math.floor(Math.random() * 1000) + 1;
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
        if (!response.ok) throw new Error("Pokémon not found.");
        const data = await response.json();

        document.getElementById("pokemonName").value = data.name;
        fetchData();
    } catch (error) {
        showModal("Error fetching random Pokémon.");
        console.error(error);
    }
}

// Fuzzy search to find the closest Pokémon name
function getClosestPokemonName(inputName) {
    const threshold = 3; // Maximum allowed edit distance
    inputName = inputName.toLowerCase();

    let closestMatch = null;
    let minDistance = Infinity;

    for (const name of pokemonNames) {
        const distance = levenshteinDistance(inputName, name);
        if (distance < minDistance && distance <= threshold) {
            minDistance = distance;
            closestMatch = name;
        }
    }

    return closestMatch;
}

// Calculate Levenshtein Distance
function levenshteinDistance(a, b) {
    const dp = Array(a.length + 1)
        .fill(null)
        .map(() => Array(b.length + 1).fill(0));

    for (let i = 0; i <= a.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1, // Deletion
                dp[i][j - 1] + 1, // Insertion
                dp[i - 1][j - 1] + cost // Substitution
            );
        }
    }

    return dp[a.length][b.length];
}

async function fetchData() {
    const pokemonNameInput = document.getElementById("pokemonName").value.trim().toLowerCase();

    if (!pokemonNameInput) {
        showModal("Please enter a Pokémon name.");
        return;
    }

    // Update regex to allow hyphens in Pokémon names
    if (!/^[a-zA-Z-]+$/.test(pokemonNameInput)) {
        showModal("Please enter a valid Pokémon name (letters and hyphens only).");
        return;
    }

    const closestName = getClosestPokemonName(pokemonNameInput);

    if (!closestName) {
        showModal(`No close matches found for "${pokemonNameInput}".`);
        return;
    }

    if (closestName !== pokemonNameInput) {
        showModal(
            `Did you mean <span class="suggestion" onclick="correctName('${closestName}')">${closestName}</span>?`
        );
        return;
    }

    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonNameInput}`);
        if (!response.ok) throw new Error("Pokémon not found.");

        const data = await response.json();

        const pokemonSprite = data.sprites.front_default;
        const name = data.name.charAt(0).toUpperCase() + data.name.slice(1);
        const height = (data.height / 10).toFixed(1);
        const weight = (data.weight / 10).toFixed(1);
        const abilities = data.abilities.map(ability => ability.ability.name).join(", ");
        const stats = data.stats;

        // Update Pokémon details
        document.getElementById("pokemonSprite").src = pokemonSprite;
        document.getElementById("pokemonSprite").style.display = "block";
        document.getElementById("name").textContent = name;
        document.getElementById("height").textContent = height;
        document.getElementById("weight").textContent = weight;
        document.getElementById("abilities").textContent = abilities;

        // Generate stats
        const statsContainer = document.getElementById("stats");
        statsContainer.innerHTML = ""; // Clear previous stats
        stats.forEach(stat => {
            const statElement = document.createElement("div");
            statElement.className = "stat-bar";
            statElement.innerHTML = `
                <span class="stat-name">${stat.stat.name}</span>
                <div class="bar" style="--bar-width: ${stat.base_stat}%;"></div>
                <span class="stat-value">${stat.base_stat}</span>`;
            statsContainer.appendChild(statElement);
        });

        document.getElementById("pokemonInfo").style.display = "block";
    } catch (error) {
        showModal("Error fetching Pokémon data.");
        console.error(error);
    }
}

// Correct the name when a suggestion is clicked
function correctName(name) {
    document.getElementById("pokemonName").value = name;
    closeModal();
    fetchData();
}

document.getElementById('compareButton').addEventListener('click', async () => {
    const pokemon1 = document.getElementById('pokemon1').value.trim().toLowerCase();
    const pokemon2 = document.getElementById('pokemon2').value.trim().toLowerCase();

    if (!pokemon1 || !pokemon2) {
        alert("Please enter both Pokémon names!");
        return;
    }

    const loadingScreen = document.getElementById('loading');
    loadingScreen.classList.remove('hidden');

    try {
        const pokemonData1 = await fetchPokemonData(pokemon1);
        const pokemonData2 = await fetchPokemonData(pokemon2);

        displayPokemonData('1', pokemonData1);
        displayPokemonData('2', pokemonData2);
    } catch (error) {
        alert("Error fetching Pokémon data. Please check the Pokémon names and try again.");
    } finally {
        loadingScreen.classList.add('hidden');
    }
});

async function fetchPokemonData(pokemon) {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon}`);
    if (!response.ok) throw new Error("Pokémon not found");
    return response.json();
}

function displayPokemonData(id, data) {
    const display = document.getElementById(`pokemonDisplay${id}`);
    const image = document.getElementById(`pokemonImage${id}`);
    const name = document.getElementById(`pokemonName${id}`);
    const stats = document.getElementById(`pokemonStats${id}`);

    image.src = data.sprites.other["official-artwork"].front_default || data.sprites.front_default;
    name.textContent = data.name;
    stats.innerHTML = `
        <p>Height: ${data.height}</p>
        <p>Weight: ${data.weight}</p>
        <p>Base Experience: ${data.base_experience}</p>
    `;
    display.style.display = 'block';
}

// Load Pokémon names on page load
window.onload = loadPokemonNames;
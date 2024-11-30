let pokemonNames = []; // To store all Pokémon names for suggestions

// Function to fetch and store all Pokémon names
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

// Function to calculate Levenshtein Distance (Edit Distance)
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

// Function to find the closest Pokémon name
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

// Enhanced fetchData function
async function fetchData() {
    const pokemonNameInput = document.getElementById("pokemonName").value.trim().toLowerCase();

    if (!pokemonNameInput) {
        showModal("Please enter a Pokémon name.");
        return;
    }

    // Validate input
    if (!/^[a-zA-Z-]+$/.test(pokemonNameInput)) {
        showModal("Please enter a valid Pokémon name (letters and hyphens only).");
        return;
    }

    // Suggest closest name if misspelled
    if (!pokemonNames.includes(pokemonNameInput)) {
        const closestName = getClosestPokemonName(pokemonNameInput);
        if (closestName) {
            showModal(
                `Did you mean <span class="suggestion" onclick="correctName('${closestName}')">${closestName}</span>?`
            );
        } else {
            showModal(`No close matches found for "${pokemonNameInput}".`);
        }
        return;
    }

    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonNameInput}`);
        if (!response.ok) throw new Error("Pokémon not found.");
        const data = await response.json();

        const pokemonSprite = data.sprites.front_default;
        const name = data.name.charAt(0).toUpperCase() + data.name.slice(1);
        const type = data.types.map(t => t.type.name).join(", ");
        const baseExperience = data.base_experience;
        const pokemonId = data.id;

        // Fetch location area encounters
        const locationResponse = await fetch(data.location_area_encounters);
        const locationData = await locationResponse.json();
        const locations = locationData.map(loc => loc.location_area.name.replace(/-/g, " ")).join(", ");

        // Update Pokémon details
        document.getElementById("pokemonSprite").src = pokemonSprite;
        document.getElementById("pokemonSprite").style.display = "block";
        document.getElementById("name").textContent = name;
        document.getElementById("type").textContent = type;
        document.getElementById("baseExperience").textContent = baseExperience;
        document.getElementById("pokemonId").textContent = pokemonId;
        document.getElementById("locationEncounter").textContent = locations || "Not available";

        document.getElementById("pokemonInfo").style.display = "block";
    } catch (error) {
        showModal("Error fetching Pokémon data.");
        console.error(error);
    }
}

// Function to correct the name when a suggestion is clicked
function correctName(name) {
    document.getElementById("pokemonName").value = name;
    closeModal();
    fetchData();
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

// Load Pokémon names on page load
window.onload = () => {
    console.log("Pokédex Viewer Loaded");
    loadPokemonNames(); // Fetch Pokémon names for suggestions
};
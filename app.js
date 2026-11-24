const $ = id => document.getElementById(id);
const API = "https://pokeapi.co/api/v2/pokemon";
let pokemones = [];

class Pokemon {
  constructor(datos) {
    this.id = datos.id;
    this.nombre = datos.name;
    this.imagen = datos.sprites.other?.["official-artwork"]?.front_default
      || datos.sprites.front_default;
    this.tipos = datos.types.map(t => t.type.name);
    this.movimientos = datos.moves.map(m => m.move.name);
    this.vida = this.estadistica(datos, "hp");
    this.ataque = this.estadistica(datos, "attack");
    this.defensa = this.estadistica(datos, "defense");
  }

  estadistica(datos, nombre) {
    return datos.stats.find(s => s.stat.name === nombre)?.base_stat ?? 0;
  }
}

async function pedirJSON(url) {
  const respuesta = await fetch(url);

  if (!respuesta.ok) {
    throw new Error("HTTP " + respuesta.status);
  }

  return await respuesta.json();
}

async function cargarPokemones() {
  $("estado").textContent = "Cargando Pokémon...";

  try {
    const lista = await pedirJSON(API + "?limit=25");

    for (const item of lista.results) {
      const detalle = await pedirJSON(item.url);
      pokemones.push(new Pokemon(detalle));
    }

    prepararTipos();
    filtrarPokemones();

  } catch (error) {
    $("estado").textContent = "No se pudo cargar. Recarga e intenta otra vez.";
    console.error(error);
  }
}

const colores = {
  fire: "#e85d3c",
  water: "#4285c5",
  grass: "#438c55",
  electric: "#c79b16",
  poison: "#9956a9",
  normal: "#64748b",
  flying: "#798ec8",
  bug: "#7c9634"
};

function mostrarPokemones(lista) {
  const contenedor = $("catalogo");
  contenedor.replaceChildren();

  for (const p of lista) {
    const tarjeta = document.createElement("article");

    tarjeta.className = "tarjeta";

    tarjeta.style.setProperty(
      "--tipo",
      colores[p.tipos[0]] || "#64748b"
    );

    tarjeta.innerHTML = `
      <small>#${String(p.id).padStart(3, "0")}</small>

      <img src="${p.imagen || ""}" alt="${p.nombre}" loading="lazy">

      <h2>${p.nombre}</h2>

      <p class="tipo">${p.tipos.join(" / ")}</p>

      <label>HP: ${p.vida}
        <progress value="${p.vida}" max="255"></progress>
      </label>

      <label>Ataque: ${p.ataque}
        <progress value="${p.ataque}" max="255"></progress>
      </label>

      <label>Defensa: ${p.defensa}
        <progress value="${p.defensa}" max="255"></progress>
      </label>

      <details>
        <summary>Ver movimientos (${p.movimientos.length})</summary>

        <ul class="movimientos">
          ${p.movimientos.map(m => `<li>${m}</li>`).join("")}
        </ul>
      </details>
    `;

    contenedor.appendChild(tarjeta);
  }

  $("estado").textContent = lista.length
    ? lista.length + " Pokémon encontrados"
    : "No hay coincidencias. Cambia los filtros.";
}

function prepararTipos() {
  const tipos = [...new Set(pokemones.flatMap(p => p.tipos))].sort();

  for (const tipo of tipos) {
    const opcion = document.createElement("option");

    opcion.value = tipo;
    opcion.textContent = tipo;

    $("tipo").appendChild(opcion);
  }
}

function filtrarPokemones() {
  const nombre = $("nombre").value.trim().toLowerCase();

  const mov = $("movimiento").value
    .trim()
    .toLowerCase()
    .replaceAll(" ", "-");

  const tipo = $("tipo").value;

  const minimo = Math.max(0, Number($("minimo").value) || 0);

  const orden = $("orden").value;

  const resultado = pokemones.filter(p =>
    p.nombre.includes(nombre) &&
    (!mov || p.movimientos.some(m => m.includes(mov))) &&
    (!tipo || p.tipos.includes(tipo)) &&
    p.ataque >= minimo
  );

  if (orden === "nombre") {
    resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));

  } else if (orden === "ataque") {
    resultado.sort((a, b) => b.ataque - a.ataque);

  } else {
    resultado.sort((a, b) => a.id - b.id);
  }

  mostrarPokemones(resultado);
}

for (const id of ["nombre", "movimiento", "minimo"]) {
  $(id).addEventListener("input", filtrarPokemones);
}

for (const id of ["tipo", "orden"]) {
  $(id).addEventListener("change", filtrarPokemones);
}

$("limpiar").addEventListener("click", () => {
  $("nombre").value = "";
  $("movimiento").value = "";
  $("tipo").value = "";
  $("minimo").value = "0";
  $("orden").value = "id";

  filtrarPokemones();
});

cargarPokemones();
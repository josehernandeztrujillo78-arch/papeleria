// ================== VARIABLES ==================
let cart = JSON.parse(localStorage.getItem("carrito")) || [];
let productosJSON = [];
let cantidadesPrevias = {};
const phone = "+523313990776"; // formato internacional

// ================== ELEMENTOS DEL DOM ==================
const cartCountEl = document.getElementById("cartCount");
const searchInput = document.getElementById("searchInput");
const productsContainer = document.querySelector(".products");

// ================== UTILIDADES ==================
// Limpiar teléfono
function sanitizePhone(ph) {
  return ph.replace(/\D/g, "");
}
const phoneClean = sanitizePhone(phone);

// Normalizar texto para búsqueda
function normalizeText(text){
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g,"");
}

// ================== CARGA DE PRODUCTOS ==================
function cargarProductos() {
  productsContainer.innerHTML = "";

  productosJSON.forEach(prod => {
    const div = document.createElement("div");
    div.classList.add("product");

    // Opciones de color
    let colorHTML = "";
    if (Array.isArray(prod.colores) && prod.colores.length > 0) {
      colorHTML = `<div class="options">
        <label>Color: </label>
        <select class="color">
          ${prod.colores.map(c => `<option value="${c}">${c}</option>`).join("")}
        </select>
      </div>`;
    }

    div.innerHTML = `
      <img src="${prod.imagen}" alt="${prod.nombre}">
      <h3>${prod.nombre}</h3>
      <p>$${prod.precio || 0}</p>
      ${colorHTML}
      <div class="quantity">
        <label>Cantidad: </label>
        <input type="number" min="0" value="0" class="qty" inputmode="numeric">
      </div>
      <button class="addToCartBtn" aria-label="Agregar ${prod.nombre} al carrito">
        <i class="fas fa-cart-plus"></i> Agregar
      </button>
    `;
    productsContainer.appendChild(div);
  });

  sincronizarCantidades();
}

// ================== FUNCIONES DE CARRITO ==================
function actualizarContador() {
  cartCountEl.innerText = cart.reduce((s,p)=>s+p.qty,0);
  localStorage.setItem("carrito", JSON.stringify(cart));
}

// Sincroniza las cantidades visibles con el carrito
function sincronizarCantidades() {
  document.querySelectorAll(".product").forEach(prod => {
    const nombre = prod.querySelector("h3").innerText.trim();
    const colorSelect = prod.querySelector(".color");
    const key = nombre + (colorSelect ? ` (${colorSelect.value})` : "");

    if (!(key in cantidadesPrevias)) cantidadesPrevias[key] = 0;

    const existing = cart.find(p => p.key === key);
    prod.querySelector(".qty").value = existing ? existing.qty : cantidadesPrevias[key] || 0;
  });

  actualizarContador();
}

// ================== MANEJO DE PRODUCTOS ==================
function agregarAlCarrito(productEl) {
  const qtyInput = productEl.querySelector(".qty");
  const colorSelect = productEl.querySelector(".color");
  const nombre = productEl.querySelector("h3").innerText.trim();
  const price = parseFloat(productEl.querySelector("p").innerText.replace("$","")) || 0;
  const key = nombre + (colorSelect ? ` (${colorSelect.value})` : "");

  let existing = cart.find(p => p.key === key);
  if (!existing) {
    cart.push({ key, item: nombre, color: colorSelect ? colorSelect.value : "", price, qty: 0 });
    existing = cart.find(p => p.key === key);
  }
  existing.qty += 1;
  cantidadesPrevias[key] = existing.qty;
  qtyInput.value = existing.qty;

  actualizarContador();
}

// Maneja cambios manuales de cantidad
function actualizarCantidad(productEl) {
  const qtyInput = productEl.querySelector(".qty");
  const colorSelect = productEl.querySelector(".color");
  const nombre = productEl.querySelector("h3").innerText.trim();
  const price = parseFloat(productEl.querySelector("p").innerText.replace("$","")) || 0;
  const key = nombre + (colorSelect ? ` (${colorSelect.value})` : "");

  let qty = Math.max(0, parseInt(qtyInput.value,10) || 0);
  cantidadesPrevias[key] = qty;

  let existing = cart.find(p => p.key === key);
  if (!existing && qty > 0) {
    cart.push({ key, item: nombre, color: colorSelect ? colorSelect.value : "", price, qty });
  } else if (existing) {
    existing.qty = qty;
  }

  // Eliminar productos con qty=0
  cart = cart.filter(p => p.qty > 0);
  actualizarContador();
}

// Maneja cambio de color
function cambiarColor(productEl) {
  const qtyInput = productEl.querySelector(".qty");
  const colorSelect = productEl.querySelector(".color");
  const nombre = productEl.querySelector("h3").innerText.trim();
  const key = nombre + ` (${colorSelect.value})`;

  if (!(key in cantidadesPrevias)) cantidadesPrevias[key] = 0;
  qtyInput.value = cantidadesPrevias[key];

  qtyInput.dispatchEvent(new Event("input", { bubbles: true }));
}

// ================== EVENTOS ==================
productsContainer.addEventListener("click", e => {
  if (e.target.closest(".addToCartBtn")) {
    const productEl = e.target.closest(".product");
    agregarAlCarrito(productEl);
  }
});

productsContainer.addEventListener("input", e => {
  if (e.target.classList.contains("qty")) {
    const productEl = e.target.closest(".product");
    actualizarCantidad(productEl);
  }
});

productsContainer.addEventListener("change", e => {
  if (e.target.classList.contains("color")) {
    const productEl = e.target.closest(".product");
    cambiarColor(productEl);
  }
});

// ================== BUSCADOR ==================
function buscarProductos(){
  const query = normalizeText(searchInput.value.toLowerCase().trim());
  document.querySelectorAll(".product").forEach(product=>{
    const nameEl = product.querySelector("h3");
    const original = nameEl.innerText;
    const normalized = normalizeText(original.toLowerCase());

    if(query && normalized.includes(query)){
      nameEl.innerHTML = original.replace(new RegExp(query,"gi"), match => `<mark>${match}</mark>`);
      product.style.display = "block";
    } else if(!query){
      nameEl.innerHTML = original;
      product.style.display = "block";
    } else {
      nameEl.innerHTML = original;
      product.style.display = "none";
    }
  });
}
searchInput.addEventListener("input", buscarProductos);

// ================== INICIALIZAR ==================
fetch(`productos.json?cacheBust=${Date.now()}`)
  .then(res => res.json())
  .then(data => {
    productosJSON = data;
    cargarProductos();
  })
  .catch(err => console.error("Error cargando productos:", err));

actualizarContador();

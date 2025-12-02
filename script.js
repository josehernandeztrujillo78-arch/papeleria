// ================== VARIABLES ==================
let cart = [];
const phone = "+523313990776"; // deja el formato internacional; lo saneamos en JS

// Elementos del DOM
const cartSidebar = document.getElementById("cartSidebar");
const cartBtn = document.getElementById("cartBtn");
const closeCart = document.getElementById("closeCart");
const cartList = document.getElementById("cartList");
const totalEl = document.getElementById("total");
const cartCountEl = document.getElementById("cartCount");
const sendWhatsapp = document.getElementById("sendWhatsapp");
const clearCartBtn = document.getElementById("clearCartBtn");
const searchInput = document.getElementById("searchInput");
const products = document.querySelectorAll(".product");

// Sanitizar teléfono para wa.me (solo dígitos)
function sanitizePhone(ph) {
    return ph.replace(/\D/g, "");
}
const phoneClean = sanitizePhone(phone);

// ================== FUNCIONES ==================

// Abrir / cerrar carrito
function openCart() {
    cartSidebar.classList.add("active");
    cartSidebar.setAttribute("aria-hidden", "false");
    cartBtn.setAttribute("aria-expanded", "true");
}
function closeCartFn() {
    cartSidebar.classList.remove("active");
    cartSidebar.setAttribute("aria-hidden", "true");
    cartBtn.setAttribute("aria-expanded", "false");
}
cartBtn.addEventListener("click", (e) => {
    // toggle behavior
    if (cartSidebar.classList.contains("active")) closeCartFn();
    else openCart();
});
closeCart.addEventListener("click", closeCartFn);

// Cerrar al hacer clic fuera del sidebar (mejorado)
window.addEventListener("click", (e) => {
    // si se hizo clic dentro del sidebar o en el botón del carrito, no cerrar
    if (cartSidebar.contains(e.target) || cartBtn.contains(e.target)) return;
    // si el sidebar está abierto y el clic no fue dentro, cerramos
    if (cartSidebar.classList.contains("active")) closeCartFn();
});

// ================== CARRITO ==================

// Agregar productos al carrito (cada clic suma 1)
products.forEach(product => {
    const addBtn = product.querySelector(".addToCartBtn");
    const qtyInput = product.querySelector(".qty");
    const colorSelect = product.querySelector(".color");

    // si existe select de color, al cambiar color sincronizamos (evita inconsistencias)
    if (colorSelect) {
        colorSelect.addEventListener("change", () => {
            // disparar input para recalcular (trigger)
            qtyInput.dispatchEvent(new Event("input", { bubbles: true }));
        });
    }

    addBtn.addEventListener("click", () => {
        const item = product.querySelector("h3").innerText.trim();
        const price = parseFloat(product.querySelector("p").innerText.replace("$", "")) || 0;
        const color = colorSelect ? colorSelect.value : "";
        const key = item + (color ? ` (${color})` : "");

        let existing = cart.find(p => p.key === key);

        if (!existing) {
            cart.push({ key, item, color, price, qty: 0 });
            existing = cart.find(p => p.key === key);
        }

        // Cada clic suma 1
        existing.qty += 1;
        qtyInput.value = existing.qty;

        // limpiar elementos con qty 0 por si hay
        cart = cart.filter(i => i.qty > 0);

        updateCartDisplay();
    });

    // Sincronizar input manual (flechas arriba/abajo o escribir)
    qtyInput.addEventListener("input", () => {
        const item = product.querySelector("h3").innerText.trim();
        const price = parseFloat(product.querySelector("p").innerText.replace("$", "")) || 0;
        const color = colorSelect ? colorSelect.value : "";
        const key = item + (color ? ` (${color})` : "");

        let existing = cart.find(p => p.key === key);
        let newQty = parseInt(qtyInput.value, 10);

        if (isNaN(newQty) || newQty < 0) newQty = 0;

        if (!existing) {
            if (newQty > 0) cart.push({ key, item, color, price, qty: newQty });
        } else {
            existing.qty = newQty;
        }

        // limpiar elementos con qty 0
        cart = cart.filter(i => i.qty > 0);

        updateCartDisplay();
    });
});

// Actualizar carrito y sincronizar inputs
function updateCartDisplay() {
    // primero limpiamos cualquier item con qty <= 0
    cart = cart.filter(p => p.qty > 0);

    cartList.innerHTML = "";
    let total = 0;

    cart.forEach((p, index) => {
        total += p.price * p.qty;

        const li = document.createElement("li");
        li.dataset.index = index;

        // formateo de precios con 2 decimales
        const lineTotal = (p.price * p.qty).toFixed(2);
        const unit = p.price.toFixed(2);

        li.innerHTML = `
            <span class="product-info">
                <span class="name">${p.key}</span>
                <span class="price">$${unit} c/u — <strong>$${lineTotal}</strong></span>
            </span>
            <span class="quantity-buttons" role="group" aria-label="Controles cantidad">
                <button class="changeQtyBtn" data-delta="-1" aria-label="Restar cantidad">-</button>
                <span style="min-width:28px;display:inline-block;text-align:center;">${p.qty}</span>
                <button class="changeQtyBtn" data-delta="1" aria-label="Sumar cantidad">+</button>
            </span>
        `;
        cartList.appendChild(li);
    });

    totalEl.innerText = total.toFixed(2);
    cartCountEl.innerText = cart.reduce((sum, p) => sum + p.qty, 0);

    // Sincronizar todos los inputs de productos (aseguramos que la clave incluya color actual del select)
    products.forEach(prod => {
        const name = prod.querySelector("h3").innerText.trim();
        const colorSelect = prod.querySelector(".color");
        const color = colorSelect ? colorSelect.value : "";
        const key = name + (color ? ` (${color})` : "");
        const existing = cart.find(item => item.key === key);
        prod.querySelector(".qty").value = existing ? existing.qty : 0;
    });

    // Preparar mensaje de WhatsApp (si no hay items, dejar href a chat vacío)
    if (cart.length === 0) {
        sendWhatsapp.href = `https://wa.me/${phoneClean}`;
    } else {
        let msg = "Hola! Me gustaría pedir:\n";
        cart.forEach(p => msg += `- ${p.key} x${p.qty} ($${(p.price).toFixed(2)} c/u) - $${(p.price * p.qty).toFixed(2)}\n`);
        msg += `Total: $${total.toFixed(2)}`;
        sendWhatsapp.href = `https://wa.me/${phoneClean}?text=${encodeURIComponent(msg)}`;
    }
}

// Cambiar cantidad desde carrito
cartList.addEventListener("click", (e) => {
    if (e.target.classList.contains("changeQtyBtn")) {
        const li = e.target.closest("li");
        const index = parseInt(li.dataset.index, 10);
        const delta = parseInt(e.target.dataset.delta, 10);

        if (Number.isFinite(index) && cart[index]) {
            cart[index].qty += delta;
            if (cart[index].qty <= 0) {
                // remover elemento si qty cae a 0 o menos
                cart.splice(index, 1);
            }
            updateCartDisplay();
        }
    }
});

// Vaciar carrito
clearCartBtn.addEventListener("click", () => {
    cart = [];
    products.forEach(prod => prod.querySelector(".qty").value = 0);
    updateCartDisplay();
});

// ================== BUSCADOR ==================
// Función para quitar tildes
function normalizeText(text) {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Guardamos el texto original de cada h3 una sola vez
products.forEach(product => {
    const nameEl = product.querySelector("h3");
    nameEl.dataset.original = nameEl.innerText;
    nameEl.dataset.normalized = normalizeText(nameEl.innerText.toLowerCase());
});

searchInput.addEventListener("input", () => {
    const query = normalizeText(searchInput.value.toLowerCase()).trim();

    products.forEach(product => {
        const nameEl = product.querySelector("h3");

        const original = nameEl.dataset.original;
        const normalized = nameEl.dataset.normalized;

        if (query !== "" && normalized.includes(query)) {

            // Resaltado (conservar original completo en data-original)
            const regex = new RegExp(query, "gi");
            let highlighted = original.replace(regex, match => `<mark>${match}</mark>`);
            nameEl.innerHTML = highlighted;

            // PRODUCTO COINCIDENTE → SE MUESTRA Y SUBE
            product.style.display = "block";
            product.style.order = "0";
            product.style.opacity = "1";
            product.style.transform = "scale(1)";
            product.style.pointerEvents = "auto";

        } else if (query === "") {

            // Restaurar cuando no hay búsqueda
            nameEl.innerHTML = original;

            product.style.display = "block";
            product.style.order = "1";
            product.style.opacity = "1";
            product.style.transform = "scale(1)";
            product.style.pointerEvents = "auto";

        } else {

            // PRODUCTO NO COINCIDENTE → OCULTAR
            nameEl.innerHTML = original;
            product.style.display = "none";
            product.style.order = "2";
        }
    });
});

// Inicializar display por si hay estados guardados
updateCartDisplay();

// ================== VARIABLES ==================
let cart = [];
const phone = "521234567890"; // Cambia por tu número

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

// ================== FUNCIONES ==================

// Abrir / cerrar carrito
cartBtn.onclick = () => cartSidebar.classList.add("active");
closeCart.onclick = () => cartSidebar.classList.remove("active");
window.onclick = (e) => { if (e.target === cartSidebar) cartSidebar.classList.remove("active"); };

// ================== CARRITO ==================

// Agregar productos al carrito (cada clic suma 1)
products.forEach(product => {
    const addBtn = product.querySelector(".addToCartBtn");
    const qtyInput = product.querySelector(".qty");
    const colorSelect = product.querySelector(".color");

    addBtn.addEventListener("click", () => {
        const item = product.querySelector("h3").innerText;
        const price = parseFloat(product.querySelector("p").innerText.replace("$", ""));
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

        updateCartDisplay();
    });

    // Sincronizar input manual (flechas arriba/abajo o escribir)
    qtyInput.addEventListener("input", () => {
        const item = product.querySelector("h3").innerText;
        const price = parseFloat(product.querySelector("p").innerText.replace("$", ""));
        const color = colorSelect ? colorSelect.value : "";
        const key = item + (color ? ` (${color})` : "");

        let existing = cart.find(p => p.key === key);
        const newQty = parseInt(qtyInput.value) || 0;

        if (!existing) {
            cart.push({ key, item, color, price, qty: newQty });
        } else {
            existing.qty = newQty;
        }

        updateCartDisplay();
    });
});

// Actualizar carrito y sincronizar inputs
function updateCartDisplay() {
    cartList.innerHTML = "";
    let total = 0;

    cart.forEach((p, index) => {
        total += p.price * p.qty;

        const li = document.createElement("li");
        li.dataset.index = index;
        li.innerHTML = `
            <span>${p.key} x <span class="qty">${p.qty}</span> ($${p.price} c/u) - $${p.price * p.qty}</span>
            <span>
                <button class="changeQtyBtn" data-delta="1">+</button>
                <button class="changeQtyBtn" data-delta="-1">-</button>
            </span>
        `;
        cartList.appendChild(li);
    });

    totalEl.innerText = total;
    cartCountEl.innerText = cart.reduce((sum, p) => sum + p.qty, 0);

    // Sincronizar todos los inputs de productos
    products.forEach(prod => {
        const name = prod.querySelector("h3").innerText;
        const colorSelect = prod.querySelector(".color");
        const color = colorSelect ? colorSelect.value : "";
        const key = name + (color ? ` (${color})` : "");
        const existing = cart.find(item => item.key === key);
        prod.querySelector(".qty").value = existing ? existing.qty : 0;
    });

    // Preparar mensaje de WhatsApp
    let msg = "Hola! Me gustaría pedir:\n";
    cart.forEach(p => msg += `- ${p.key} x${p.qty} ($${p.price} c/u) - $${p.price * p.qty}\n`);
    msg += `Total: $${total}`;
    sendWhatsapp.href = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}


// Cambiar cantidad desde carrito
cartList.addEventListener("click", (e) => {
    if (e.target.classList.contains("changeQtyBtn")) {
        const li = e.target.closest("li");
        const index = parseInt(li.dataset.index);
        const delta = parseInt(e.target.dataset.delta);

        cart[index].qty += delta;
        if (cart[index].qty < 0) cart[index].qty = 0;

        updateCartDisplay();
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
    const query = normalizeText(searchInput.value.toLowerCase());

    products.forEach(product => {
        const nameEl = product.querySelector("h3");

        const original = nameEl.dataset.original;
        const normalized = nameEl.dataset.normalized;

        if (query !== "" && normalized.includes(query)) {

            // Resaltado
            const regex = new RegExp(query, "gi");
            let highlighted = original.replace(regex, match => `<mark>${match}</mark>`);
            nameEl.innerHTML = highlighted;

            // ⭐ PRODUCTO COINCIDENTE → SE MUESTRA Y SUBE
            product.style.display = "block";   // visible
            product.style.order = "0";         // arriba
            product.style.opacity = "1";
            product.style.transform = "scale(1)";
            product.style.pointerEvents = "auto";

        } else if (query === "") {

            // Restaurar cuando no hay búsqueda
            nameEl.innerHTML = original;

            product.style.display = "block";   // mostrar todos
            product.style.order = "1";
            product.style.opacity = "1";
            product.style.transform = "scale(1)";
            product.style.pointerEvents = "auto";

        } else {

            // ⭐ PRODUCTO NO COINCIDENTE → OCULTAR
            nameEl.innerHTML = original;
            product.style.display = "none";    // oculto
            product.style.order = "2";
        }
    });
});

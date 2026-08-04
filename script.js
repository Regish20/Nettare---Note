const products = [
  {
    id: 1,
    name: "Khamrah",
    family: "Gourmand · Especiado",
    category: "original",
    notes: ["Bergamota, canela y nuez moscada", "Dátiles, praliné y tuberosa", "Vainilla, tonka, mirra y ámbar"],
    price: 120,
    badge: "Disponible",
    image: "./assets/images/products/khamrah-original.png",
    story: "Una apertura cítrica y especiada conduce a un corazón de dátiles y praliné. La vainilla, la tonka y las resinas dejan una estela cálida, rica y envolvente."
  },
  {
    id: 2,
    name: "Khamrah Qahwa",
    family: "Gourmand · Café",
    category: "qahwa",
    notes: ["Jengibre, canela y cardamomo", "Praliné, frutas confitadas y flores blancas", "Café arábica, vainilla y tonka"],
    price: 120,
    badge: "Disponible",
    image: "./assets/images/products/khamrah-qahwa.png",
    story: "La firma Khamrah adquiere un giro más oscuro y tostado. Las especias abren paso al praliné antes de asentarse sobre café arábica, vainilla y haba tonka."
  }
];

const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
const money = value => new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
}).format(value);

const grid = $("#product-grid");
const overlay = $(".overlay");
const modal = $(".product-modal");
const drawer = $(".cart-drawer");
const toast = $(".toast");
let activeProduct = null;
let lastFocused = null;
let toastTimer;
let cart = JSON.parse(localStorage.getItem("nettare-cart") || "[]");
cart = cart.filter(item => products.some(product => product.id === item.id));

function renderProducts(list = products) {
  grid.innerHTML = products.map((product, index) => `
    <article class="product-card ${list.includes(product) ? "" : "is-hidden"}" data-category="${product.category}" data-reveal style="--reveal-delay: ${Math.min(index * 90, 270)}ms">
      <button class="product-visual" type="button" data-product="${product.id}" aria-label="Ver detalles de ${product.name}">
        <img src="${product.image}" alt="Frasco de ${product.name}" loading="lazy" />
        <span class="product-seq">${String(index + 1).padStart(2, "0")} / ${String(products.length).padStart(2, "0")}</span>
        ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ""}
      </button>
      <div class="product-info">
        <p class="product-family">${product.family}</p>
        <h3>${product.name}</h3>
        <span class="product-price">${money(product.price)}</span>
        <p class="product-notes">${product.notes.join(" · ")}</p>
        <div class="product-footer">
        <p class="product-format">Eau de parfum <span>100 ml</span></p>
          <button class="quick-add" type="button" data-add="${product.id}">Añadir <span aria-hidden="true">+</span></button>
        </div>
      </div>
    </article>
  `).join("");
  observeReveals(grid);
}

function openLayer(layer) {
  closeLayers(false);
  lastFocused = document.activeElement;
  document.body.classList.add("layer-open");
  overlay.classList.add("is-open");
  layer.classList.add("is-open");
  layer.setAttribute("aria-hidden", "false");
  setTimeout(() => $("button", layer)?.focus(), 50);
}

function closeLayers(restoreFocus = true) {
  [modal, drawer].forEach(layer => {
    layer.classList.remove("is-open");
    layer.setAttribute("aria-hidden", "true");
  });
  overlay.classList.remove("is-open");
  document.body.classList.remove("layer-open");
  if (restoreFocus && lastFocused) lastFocused.focus();
}

function openProduct(id) {
  activeProduct = products.find(product => product.id === Number(id));
  if (!activeProduct) return;
  $(".modal-image img").src = activeProduct.image;
  $(".modal-image img").alt = `Frasco de ${activeProduct.name}`;
  $(".modal-family").textContent = activeProduct.family;
  $("#modal-title").textContent = activeProduct.name;
  $(".modal-story").textContent = activeProduct.story;
  $(".note-top").textContent = activeProduct.notes[0];
  $(".note-heart").textContent = activeProduct.notes[1];
  $(".note-base").textContent = activeProduct.notes[2];
  $(".modal-price").textContent = money(activeProduct.price);
  openLayer(modal);
}

function addToCart(id) {
  const existing = cart.find(item => item.id === Number(id));
  if (existing) existing.quantity += 1;
  else cart.push({ id: Number(id), quantity: 1 });
  saveCart();
  showToast("Fragancia añadida a tu gabinete");
}

function updateQuantity(id, change) {
  const item = cart.find(entry => entry.id === Number(id));
  if (!item) return;
  item.quantity += change;
  if (item.quantity <= 0) cart = cart.filter(entry => entry.id !== Number(id));
  saveCart();
}

function saveCart() {
  localStorage.setItem("nettare-cart", JSON.stringify(cart));
  renderCart();
}

function renderCart() {
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
  $(".cart-count").textContent = itemCount;
  const itemsContainer = $(".cart-items");
  const empty = $(".cart-empty");
  const summary = $(".cart-summary");
  if (!cart.length) {
    itemsContainer.innerHTML = "";
    empty.classList.add("is-visible");
    summary.hidden = true;
    return;
  }
  empty.classList.remove("is-visible");
  summary.hidden = false;
  itemsContainer.innerHTML = cart.map(item => {
    const product = products.find(entry => entry.id === item.id);
    return `<article class="cart-item">
      <img src="${product.image}" alt="" />
      <div><h3>${product.name}</h3><p>100 ml · ${money(product.price)}</p><div class="qty-control"><button type="button" data-qty="-1" data-id="${item.id}" aria-label="Restar una unidad">−</button><span>${item.quantity}</span><button type="button" data-qty="1" data-id="${item.id}" aria-label="Sumar una unidad">+</button></div></div>
      <button class="remove-item" type="button" data-remove="${item.id}" aria-label="Eliminar ${product.name}">×</button>
    </article>`;
  }).join("");
  const total = cart.reduce((sum, item) => sum + products.find(product => product.id === item.id).price * item.quantity, 0);
  $(".cart-total").textContent = money(total);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2300);
}

grid.addEventListener("click", event => {
  const productButton = event.target.closest("[data-product]");
  const addButton = event.target.closest("[data-add]");
  if (productButton) openProduct(productButton.dataset.product);
  if (addButton) addToCart(addButton.dataset.add);
});

$(".filters").addEventListener("click", event => {
  const button = event.target.closest(".filter");
  if (!button) return;
  $$(".filter").forEach(filter => filter.classList.remove("is-active"));
  button.classList.add("is-active");
  const filtered = button.dataset.filter === "todos" ? products : products.filter(product => product.category === button.dataset.filter);
  renderProducts(filtered);
  $(".result-count").textContent = `${filtered.length} ${filtered.length === 1 ? "pieza" : "piezas"}`;
});

$(".modal-add").addEventListener("click", () => {
  if (activeProduct) addToCart(activeProduct.id);
});
$(".cart-trigger").addEventListener("click", () => openLayer(drawer));
$$('[data-close-layer]').forEach(button => button.addEventListener("click", () => closeLayers()));

$(".cart-items").addEventListener("click", event => {
  const quantityButton = event.target.closest("[data-qty]");
  const removeButton = event.target.closest("[data-remove]");
  if (quantityButton) updateQuantity(quantityButton.dataset.id, Number(quantityButton.dataset.qty));
  if (removeButton) {
    cart = cart.filter(item => item.id !== Number(removeButton.dataset.remove));
    saveCart();
  }
});

// Añade el WhatsApp peruano con prefijo 51 y solo dígitos, por ejemplo: 519XXXXXXXX.
const WHATSAPP_NUMBER = "";
const whatsappOrderForm = $("#whatsapp-order-form");

function openWhatsApp(message) {
  if (!WHATSAPP_NUMBER) {
    showToast("Falta configurar el número de WhatsApp comercial");
    return;
  }
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  const whatsappWindow = window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  if (!whatsappWindow) window.location.href = whatsappUrl;
}

whatsappOrderForm.addEventListener("submit", event => {
  event.preventDefault();
  if (!cart.length) {
    showToast("Añade al menos una fragancia antes de enviar");
    return;
  }

  const formData = new FormData(whatsappOrderForm);
  const orderLines = cart.map((item, index) => {
    const product = products.find(entry => entry.id === item.id);
    const lineTotal = product.price * item.quantity;
    return `${index + 1}. ${product.name}\n   Cantidad: ${item.quantity}\n   Precio: ${money(product.price)} c/u\n   Importe: ${money(lineTotal)}`;
  });
  const total = cart.reduce((sum, item) => {
    const product = products.find(entry => entry.id === item.id);
    return sum + product.price * item.quantity;
  }, 0);
  const customerNote = String(formData.get("customerNote") || "").trim();
  const message = [
    "*NETTARE & NOTE - NUEVO PEDIDO*",
    "--------------------------------",
    "*DATOS DEL CLIENTE*",
    `Nombre: ${String(formData.get("customerName")).trim()}`,
    `Telefono: ${String(formData.get("customerPhone")).trim()}`,
    `Entrega: ${String(formData.get("deliveryMethod")).trim()}`,
    `Direccion / distrito: ${String(formData.get("address")).trim()}`,
    customerNote ? `Indicaciones: ${customerNote}` : "Indicaciones: Sin indicaciones adicionales",
    "",
    "*PRODUCTOS*",
    orderLines.join("\n\n"),
    "--------------------------------",
    `*SUBTOTAL: ${money(total)}*`,
    "",
    "Quedo atento(a) a la confirmacion del pedido y del costo de envio."
  ].join("\n");

  openWhatsApp(message);
});

const menuToggle = $(".menu-toggle");
const mobileNav = $(".mobile-nav");
menuToggle.addEventListener("click", () => {
  const open = menuToggle.classList.toggle("is-open");
  mobileNav.classList.toggle("is-open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
});
$$('.mobile-nav a').forEach(link => link.addEventListener("click", () => {
  menuToggle.classList.remove("is-open");
  mobileNav.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
}));

const assistantPanel = $(".assistant-panel");
const assistantTrigger = $(".assistant-trigger");
function toggleAssistant(force) {
  const open = force ?? !assistantPanel.classList.contains("is-open");
  assistantPanel.classList.toggle("is-open", open);
  assistantPanel.setAttribute("aria-hidden", String(!open));
  assistantTrigger.setAttribute("aria-expanded", String(open));
  assistantTrigger.setAttribute("aria-label", open ? "Cerrar asistente olfativo" : "Abrir asistente olfativo");
}
assistantTrigger.addEventListener("click", () => toggleAssistant());
$(".assistant-close").addEventListener("click", () => toggleAssistant(false));

const assistantAnswers = {
  recommend: "Si prefieres una estela dulce, especiada y resinosa, empieza con Khamrah. Si disfrutas un fondo más oscuro y tostado, con café arábica, Khamrah Qahwa será la mejor elección.",
  lasting: "Nuestras eau de parfum suelen acompañarte entre 7 y 10 horas. Las composiciones de oud y ámbar pueden permanecer aún más sobre prendas.",
  shipping: "El envío es gratuito desde S/ 200. Realizamos entregas en Lima y coordinamos envíos a todo el Perú. Aceptamos devoluciones de productos sin abrir durante los 14 días posteriores a la entrega.",
  samples: "Sí. Cada pedido incluye una muestra a elección para que descubras otra composición antes de abrir tu próximo frasco."
};

$(".quick-questions").addEventListener("click", event => {
  const messages = $(".assistant-messages");
  const advisorButton = event.target.closest("[data-contact-advisor]");
  if (advisorButton) {
    messages.insertAdjacentHTML("beforeend", '<p class="user-message">Contactar con un asesor</p>');
    messages.insertAdjacentHTML("beforeend", '<p class="bot-message">Claro. Abriré WhatsApp para que converses directamente con nuestro equipo.</p>');
    messages.scrollTop = messages.scrollHeight;
    openWhatsApp("Hola, vengo desde la web de Nettare & Note y me gustaría conversar con un asesor sobre sus perfumes.");
    return;
  }

  const button = event.target.closest("[data-answer]");
  if (!button) return;
  messages.insertAdjacentHTML("beforeend", `<p class="user-message">${button.textContent}</p>`);
  setTimeout(() => {
    messages.insertAdjacentHTML("beforeend", `<p class="bot-message">${assistantAnswers[button.dataset.answer]}</p>`);
    messages.scrollTop = messages.scrollHeight;
  }, 220);
  messages.scrollTop = messages.scrollHeight;
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeLayers();
    toggleAssistant(false);
  }
  if (event.key === "Tab") {
    const activeLayer = modal.classList.contains("is-open") ? modal : drawer.classList.contains("is-open") ? drawer : null;
    if (!activeLayer) return;
    const focusables = $$('button, a[href]', activeLayer).filter(element => !element.disabled && element.offsetParent !== null);
    if (!focusables.length) return;
    if (event.shiftKey && document.activeElement === focusables[0]) { event.preventDefault(); focusables.at(-1).focus(); }
    else if (!event.shiftKey && document.activeElement === focusables.at(-1)) { event.preventDefault(); focusables[0].focus(); }
  }
});

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealObserver = !reducedMotion && "IntersectionObserver" in window
  ? new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -7%" })
  : null;

function observeReveals(context = document) {
  $$('[data-reveal]:not(.is-visible)', context).forEach(element => {
    if (revealObserver) revealObserver.observe(element);
    else element.classList.add("is-visible");
  });
}

const hero = $(".hero");
let scrollFrame = null;
function updateScrollEffects() {
  const progress = reducedMotion ? 0 : Math.min(1, window.scrollY / Math.max(hero.offsetHeight * 0.78, 1));
  hero.style.setProperty("--hero-media-opacity", Math.max(.14, 1 - progress * .86).toFixed(3));
  hero.style.setProperty("--hero-media-scale", (1.02 + progress * .05).toFixed(3));
  hero.style.setProperty("--hero-wash-opacity", Math.max(.65, 1 - progress * .35).toFixed(3));
  hero.style.setProperty("--hero-copy-opacity", Math.max(0, 1 - progress * 1.15).toFixed(3));
  hero.style.setProperty("--hero-copy-y", `${Math.round(progress * -60)}px`);
  hero.style.setProperty("--hero-index-opacity", Math.max(0, 1 - progress * 1.3).toFixed(3));
  hero.style.setProperty("--hero-index-y", `${Math.round(progress * -35)}px`);
  $(".site-header").classList.toggle("is-scrolled", window.scrollY > 100);
  document.body.classList.toggle("has-scrolled", window.scrollY > 80);
  scrollFrame = null;
}

window.addEventListener("scroll", () => {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScrollEffects);
}, { passive: true });
updateScrollEffects();

const showPage = () => requestAnimationFrame(() => document.body.classList.add("is-loaded"));
if (document.readyState === "complete") showPage();
else window.addEventListener("load", showPage, { once: true });

renderProducts();
renderCart();
observeReveals(document);
updateScrollEffects();

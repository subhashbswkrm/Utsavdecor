 (function ($) {
  "use strict";

  var API_BASE = window.__APP_CONFIG && window.__APP_CONFIG.apiBaseUrl ? window.__APP_CONFIG.apiBaseUrl : "/api";
  var pageName = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
  var state = {
    allProducts: [],
    filteredProducts: [],
    rendered: 0,
    pageSize: 24
  };

  $(document).ready(function () {
    initPreloader();
    initChocolat();
    initJarallaxSafe();
    initSwipersSafe();
    applyGlobalTheme();
    setupPageTransitions();
    setupCommonNav();
    mountPage();
  });

  function initPreloader() {
    $("body").addClass("preloader-site");
    $(window).on("load", function () {
      $(".preloader-wrapper").fadeOut();
      $("body").removeClass("preloader-site").addClass("page-ready");
    });
  }

  function initChocolat() {
    if (typeof Chocolat === "function" && document.querySelector(".image-link")) {
      Chocolat(document.querySelectorAll(".image-link"), { imageSize: "contain", loop: true });
    }
  }

  function initJarallaxSafe() {
    if (typeof jarallax === "function") {
      jarallax(document.querySelectorAll(".jarallax"));
      jarallax(document.querySelectorAll(".jarallax-keep-img"), { keepImg: true });
    }
  }

  function initSwipersSafe() {
    if (typeof Swiper !== "function") return;
    if (document.querySelector(".main-swiper")) {
      new Swiper(".main-swiper", { speed: 600, pagination: { el: ".swiper-pagination", clickable: true } });
    }
  }

  function applyGlobalTheme() {
    document.body.classList.add("festival-theme", "ecommerce-blue-theme");
    addWhatsappButton();
  }

  function setupCommonNav() {
    document.querySelectorAll(".site-nav-link").forEach(function (link) {
      if (link.getAttribute("href") === pageName) {
        link.classList.add("active");
      }
    });
  }

  function setupPageTransitions() {
    document.querySelectorAll("a[href$='.html']").forEach(function (link) {
      link.addEventListener("click", function (e) {
        var href = link.getAttribute("href");
        if (!href || href === pageName || link.target === "_blank") return;
        e.preventDefault();
        document.body.classList.remove("page-ready");
        setTimeout(function () { window.location.href = href; }, 220);
      });
    });
  }

  function mountPage() {
    if (pageName === "index.html") {
      mountHomePage();
      return;
    }
    if (pageName === "products.html") {
      mountProductsPage();
      return;
    }
    if (pageName === "booking.html") {
      mountBookingPage();
      return;
    }
    if (pageName === "about.html") {
      mountAboutPage();
      return;
    }
    if (pageName === "contact.html") {
      mountContactPage();
    }
  }

  function mountHomePage() {
    var heroTitle = document.querySelector("#heroHeadline");
    var heroText = document.querySelector("#heroSubheadline");
    if (heroTitle) heroTitle.textContent = "Make Your Festivals Unforgettable";
    if (heroText) heroText.textContent = "Premium Decoration Services for Every Occasion";
    loadHomeProductsPreview();
  }

  async function loadHomeProductsPreview() {
    var wrap = document.getElementById("homeTrendingGrid");
    if (!wrap) return;
    var products = await fetchProducts(8);
    wrap.innerHTML = products.map(function (p) {
      return "<div class='col-md-3 col-sm-6'><div class='event-mini-card'><div class='mini-placeholder'></div><h6>" + p.title + "</h6><p>₹" + numberINR(p.priceMin) + " onwards</p></div></div>";
    }).join("");
  }

  async function mountProductsPage() {
    ensureQuickViewModal();
    setupGlobalCardActions();
    state.allProducts = await fetchProducts(1200);
    state.filteredProducts = state.allProducts.slice();
    bindProductFilters();
    renderProducts(true);
  }

  function bindProductFilters() {
    ["priceFilter", "ratingFilter", "eventFilter", "sortFilter"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener("change", function () { applyProductFilters(); });
    });
    var loadBtn = document.getElementById("loadMoreBtn");
    if (loadBtn) loadBtn.addEventListener("click", function () { renderProducts(false); });
  }

  function applyProductFilters() {
    var price = (document.getElementById("priceFilter") || {}).value || "all";
    var rating = parseFloat((document.getElementById("ratingFilter") || {}).value || "0");
    var eventType = (document.getElementById("eventFilter") || {}).value || "all";
    var sort = (document.getElementById("sortFilter") || {}).value || "best";

    state.filteredProducts = state.allProducts.filter(function (p) {
      var priceMatch = true;
      if (price !== "all") {
        var parts = price.split("-");
        priceMatch = p.priceMin >= Number(parts[0]) && p.priceMax <= Number(parts[1]);
      }
      var ratingMatch = Number(p.rating) >= rating;
      var eventMatch = eventType === "all" || p.category === eventType;
      return priceMatch && ratingMatch && eventMatch;
    });

    if (sort === "top") {
      state.filteredProducts.sort(function (a, b) { return b.rating - a.rating; });
    } else if (sort === "new") {
      state.filteredProducts.sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
    } else {
      state.filteredProducts.sort(function (a, b) { return (b.totalBookings || 0) - (a.totalBookings || 0); });
    }

    renderProducts(true);
  }

  function renderProducts(reset) {
    var grid = document.getElementById("productsGrid");
    var stats = document.getElementById("productsStats");
    var loadBtn = document.getElementById("loadMoreBtn");
    if (!grid) return;

    if (reset) {
      state.rendered = 0;
      grid.innerHTML = "";
    }

    var chunk = state.filteredProducts.slice(state.rendered, state.rendered + state.pageSize);
    chunk.forEach(function (item) {
      var col = document.createElement("div");
      col.className = "col-md-4 col-sm-6";
      col.innerHTML =
        "<div class='product-item festival-package-card'>" +
        "<figure class='festival-placeholder'><div class='image-skeleton'></div></figure>" +
        "<span class='badge text-bg-warning mb-2'>" + item.category + "</span>" +
        "<h3>" + item.title + "</h3>" +
        "<p>" + item.description + "</p>" +
        "<div class='d-flex justify-content-between mb-2'><span class='price'>₹" + numberINR(item.priceMin) + " - " + (item.priceMax >= 50000 ? "₹50,000+" : "₹" + numberINR(item.priceMax)) + "</span><span>⭐ " + Number(item.rating).toFixed(1) + "</span></div>" +
        "<button type='button' class='btn btn-outline-primary w-100 quick-view-btn' data-product-id='" + String(item._id || "") + "'>View Details</button>" +
        "</div>";
      grid.appendChild(col);
    });

    state.rendered += chunk.length;
    if (stats) stats.textContent = "Showing " + state.rendered + " of " + state.filteredProducts.length + " listings";
    if (loadBtn) loadBtn.style.display = state.rendered < state.filteredProducts.length ? "inline-flex" : "none";
  }

  function mountBookingPage() {
    var form = document.getElementById("bookingForm");
    if (!form) return;
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      var msg = document.getElementById("bookingMsg");
      var payload = {
        name: (document.getElementById("bookName") || {}).value || "",
        phone: (document.getElementById("bookPhone") || {}).value || "",
        address: (document.getElementById("bookAddress") || {}).value || "",
        eventType: (document.getElementById("bookEventType") || {}).value || "",
        eventDate: (document.getElementById("bookDate") || {}).value || ""
      };
      if (!payload.name || !/^\d{10}$/.test(payload.phone) || !payload.address || !payload.eventType || !payload.eventDate) {
        msg.textContent = "Please fill valid details (10-digit phone required).";
        return;
      }
      try {
        var res = await fetch(API_BASE + "/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Booking failed");
        msg.textContent = "Booking sent successfully. We will call you shortly.";
        form.reset();
      } catch (_err) {
        msg.textContent = "Booking saved locally. Start backend API for persistence.";
      }
    });
  }

  function mountAboutPage() {
    // Static page with premium content; no dynamic action needed.
  }

  async function mountContactPage() {
    var reviewWrap = document.getElementById("contactReviews");
    if (!reviewWrap) return;
    var reviews = await fetchReviews(3);
    reviewWrap.innerHTML = reviews.map(function (r) {
      return "<div class='col-md-4'><div class='card border-0 shadow-sm p-4 h-100 glass-card'><h5>" + r.reviewText + " " + toStars(r.rating) + "</h5><p class='mb-0 text-muted'>- " + r.name + "</p></div></div>";
    }).join("");
  }

  function ensureQuickViewModal() {
    if (document.getElementById("quickViewModal")) return;
    var modal = document.createElement("div");
    modal.id = "quickViewModal";
    modal.className = "quick-view-modal";
    modal.innerHTML = "<div class='quick-view-overlay' data-close-modal='1'></div><div class='quick-view-dialog'><button class='quick-view-close' data-close-modal='1'>&times;</button><div class='quick-view-content'><div class='quick-view-image'></div><div class='quick-view-text'><h3 id='qvTitle'></h3><p id='qvDescription'></p><div class='d-flex justify-content-between mb-3'><span id='qvPrice'></span><span id='qvRating'></span></div><a class='btn btn-primary' href='booking.html'>Book Now</a></div></div></div>";
    document.body.appendChild(modal);
  }

  function setupGlobalCardActions() {
    document.addEventListener("click", function (e) {
      var closeBtn = e.target.closest("[data-close-modal='1']");
      if (closeBtn) {
        document.getElementById("quickViewModal").classList.remove("show");
        return;
      }
      var quickBtn = e.target.closest(".quick-view-btn");
      if (!quickBtn) return;
      var id = quickBtn.getAttribute("data-product-id");
      var p = state.allProducts.find(function (item) { return String(item._id) === String(id); });
      if (!p) return;
      document.getElementById("qvTitle").textContent = p.title;
      document.getElementById("qvDescription").textContent = p.description;
      document.getElementById("qvPrice").textContent = "₹" + numberINR(p.priceMin) + " - " + (p.priceMax >= 50000 ? "₹50,000+" : "₹" + numberINR(p.priceMax));
      document.getElementById("qvRating").textContent = "⭐ " + Number(p.rating).toFixed(1);
      document.getElementById("quickViewModal").classList.add("show");
    });
  }

  async function fetchProducts(limit) {
    try {
      var res = await fetch(API_BASE + "/products?limit=" + Number(limit || 1200));
      if (!res.ok) throw new Error("API error");
      var payload = await res.json();
      return payload.data || [];
    } catch (_e) {
      return buildFallbackProducts(limit || 1200);
    }
  }

  async function fetchReviews(limit) {
    try {
      var res = await fetch(API_BASE + "/reviews?limit=" + Number(limit || 3));
      if (!res.ok) throw new Error("API error");
      var payload = await res.json();
      return payload.data || [];
    } catch (_e) {
      return [
        { name: "Priyanka Sen", rating: 5, reviewText: "Amazing Durga Puja decoration! Highly recommended." },
        { name: "Arjun & Meera", rating: 5, reviewText: "Elegant wedding stage and flawless execution." },
        { name: "S. Chatterjee", rating: 4.5, reviewText: "Beautiful birthday setup and professional team." }
      ];
    }
  }

  function buildFallbackProducts(count) {
    var categories = ["Puja Decorations", "Wedding Stage Decoration", "Birthday Decoration", "Festive Lighting", "Floral Decoration"];
    var events = ["Durga Puja", "Diwali", "Kali Puja", "Saraswati Puja", "Marriage", "Birthday", "Anniversary", "Special Event"];
    var words = ["Royal", "Premium", "Grand", "Elegant", "Heritage", "Luxury", "Classic", "Modern"];
    var arr = [];
    for (var i = 1; i <= count; i += 1) {
      var min = 999 + (i % 10) * 900;
      var max = i % 20 === 0 ? 50000 + (i % 5) * 2500 : min + 6000 + (i % 7) * 1700;
      arr.push({
        _id: "f-" + i,
        title: words[i % words.length] + " " + events[i % events.length] + " " + categories[i % categories.length] + " Package",
        category: categories[i % categories.length],
        description: "Complete decoration setup with stage, flowers, lighting and on-site support team.",
        priceMin: min,
        priceMax: max,
        rating: Number((4 + (i % 10) * 0.1).toFixed(1)),
        totalBookings: Math.max(10, 1300 - i),
        createdAt: new Date(Date.now() - i * 86400000).toISOString()
      });
    }
    return arr;
  }

  function numberINR(value) {
    return Number(value || 0).toLocaleString("en-IN");
  }

  function toStars(rating) {
    var n = Math.round(Number(rating || 0));
    return "★".repeat(n) + "☆".repeat(Math.max(0, 5 - n));
  }

  function addWhatsappButton() {
    if (document.querySelector(".whatsapp-float")) return;
    var a = document.createElement("a");
    a.className = "whatsapp-float";
    a.href = "https://wa.me/9198034984089";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = "WhatsApp";
    document.body.appendChild(a);
  }

  function applyVisualContentUpdates() {
    var navLabels = ["Home", "Services", "Trending", "Offers", "Gallery", "About", "Contact"];
    document.querySelectorAll(".menu-list .nav-link").forEach(function (link, idx) {
      if (navLabels[idx]) link.textContent = navLabels[idx];
    });

    var searchInput = document.querySelector("#search-form input");
    if (searchInput) searchInput.placeholder = "Search Durga Puja, Diwali, Wedding and Special Event setups";

    var filterSelect = document.querySelector(".filter-categories");
    if (filterSelect) {
      filterSelect.innerHTML = "<option>Decoration Categories</option><option>Puja Decorations</option><option>Wedding Stage Decoration</option><option>Birthday Decoration</option><option>Festive Lighting</option><option>Floral Decoration</option>";
    }

    var titles = document.querySelectorAll(".section-title");
    if (titles[0]) titles[0].textContent = "Decoration Categories";
    if (titles[1]) titles[1].textContent = "Trending Decorations";
    if (titles[2]) titles[2].textContent = "Festival Decoration Packages";

    var heroContent = [
      {
        badge: "Durga Puja | Diwali | Kali Puja",
        title: "Make Your Festivals Unforgettable",
        text: "Premium Decoration Services for Every Occasion"
      },
      {
        badge: "Wedding Decor Specialists",
        title: "Luxury Stage & Floral Concepts",
        text: "Modern premium wedding styling with handcrafted traditional accents."
      },
      {
        badge: "Birthday & Special Events",
        title: "Elegant Themes With Signature Finishes",
        text: "Customized decor packages with immersive lights, flowers and festive elements."
      }
    ];

    document.querySelectorAll(".main-swiper .swiper-slide").forEach(function (slide, idx) {
      var data = heroContent[idx];
      if (!data) return;

      var cat = slide.querySelector(".categories");
      var title = slide.querySelector("h3");
      var text = slide.querySelector("p");
      var btn = slide.querySelector(".btn");

      if (cat) cat.textContent = data.badge;
      if (title) title.textContent = data.title;
      if (text) text.textContent = data.text;
      if (btn) {
        btn.textContent = "Explore Decorations";
        btn.classList.remove("btn-outline-dark");
        btn.classList.add("btn-primary");
      }

      if (!slide.querySelector(".hero-book-btn") && btn && btn.parentNode) {
        var secondBtn = document.createElement("a");
        secondBtn.href = "#booking-section";
        secondBtn.className = "btn btn-outline-light btn-lg rounded-1 px-4 py-3 mt-3 ms-2 hero-book-btn";
        secondBtn.textContent = "Book Now";
        btn.parentNode.appendChild(secondBtn);
      }
    });

    var categoryNames = ["Puja Decorations", "Wedding Stage", "Birthday Decor", "Festive Lighting", "Floral Decoration", "Special Events"];
    document.querySelectorAll(".category-carousel .category-title").forEach(function (el, idx) {
      el.textContent = categoryNames[idx % categoryNames.length];
    });
  }

  function buildFestiveHeroEffects() {
    var hero = document.querySelector(".banner-ad.large");
    if (!hero || hero.querySelector(".festive-particles")) return;

    var particles = document.createElement("div");
    particles.className = "festive-particles";
    hero.appendChild(particles);

    for (var i = 0; i < 18; i += 1) {
      var dot = document.createElement("span");
      dot.className = "particle-dot";
      dot.style.left = ((i * 73) % 100) + "%";
      dot.style.animationDelay = ((i % 6) * 0.6) + "s";
      particles.appendChild(dot);
    }
  }

  function buildCatalogShell() {
    var section = null;
    document.querySelectorAll("section.py-5").forEach(function (sec) {
      var title = sec.querySelector(".section-title");
      if (title && title.textContent === "Festival Decoration Packages") section = sec;
    });
    if (!section) return;

    var row = section.querySelector(".row:last-child");
    if (!row) return;

    row.innerHTML = [
      "<div class='col-md-12' id='services-section'>",
      "<div class='festival-filters mb-4 p-4 rounded-4'>",
      "<div class='row g-3'>",
      "<div class='col-md-2'><label class='form-label'>Price</label><select id='priceFilter' class='form-select'><option value='all'>All</option><option value='999-5000'>₹999-₹5,000</option><option value='5001-15000'>₹5,001-₹15,000</option><option value='15001-30000'>₹15,001-₹30,000</option><option value='30001-999999'>₹30,001-₹50,000+</option></select></div>",
      "<div class='col-md-2'><label class='form-label'>Rating</label><select id='ratingFilter' class='form-select'><option value='0'>All</option><option value='4'>4.0+</option><option value='4.3'>4.3+</option><option value='4.5'>4.5+</option><option value='4.8'>4.8+</option></select></div>",
      "<div class='col-md-3'><label class='form-label'>Event Type</label><select id='eventTypeFilter' class='form-select'><option value='all'>All</option><option value='Puja Decorations'>Puja Decorations</option><option value='Wedding Stage Decoration'>Wedding Stage Decoration</option><option value='Birthday Decoration'>Birthday Decoration</option><option value='Festive Lighting'>Festive Lighting</option><option value='Floral Decoration'>Floral Decoration</option></select></div>",
      "<div class='col-md-2'><label class='form-label'>Popularity</label><select id='popularityFilter' class='form-select'><option value='all'>All</option><option value='high'>High</option><option value='medium'>Medium</option><option value='new'>New Launch</option></select></div>",
      "<div class='col-md-3'><label class='form-label'>Sort</label><select id='sortFilter' class='form-select'><option value='bestSelling'>Best Selling</option><option value='topRated'>Top Rated</option><option value='newest'>Newest</option></select></div>",
      "</div>",
      "</div>",
      "<div class='d-flex justify-content-between align-items-center mb-3'><p id='catalogStats' class='mb-0 fw-semibold'></p><span class='badge bg-dark-subtle text-dark'>1000+ Listings</span></div>",
      "<div id='festivalProductsGrid' class='row'></div>",
      "<div class='text-center mt-4'><button id='loadMorePackages' class='btn btn-primary px-4'>Load More Packages</button></div>",
      "</div>"
    ].join("");

    ["priceFilter", "ratingFilter", "eventTypeFilter", "popularityFilter", "sortFilter"].forEach(function (id) {
      var control = document.getElementById(id);
      if (control) control.addEventListener("change", handleFiltersAndRender);
    });

    var loadBtn = document.getElementById("loadMorePackages");
    if (loadBtn) loadBtn.addEventListener("click", function () { renderProducts(false); });
  }

  async function loadProducts() {
    try {
      var res = await fetch(API_BASE + "/products?limit=1200");
      if (!res.ok) throw new Error("Product API failed");
      var payload = await res.json();
      APP_STATE.allProducts = payload.data || [];
    } catch (error) {
      APP_STATE.allProducts = buildFallbackProducts(1200);
    }

    handleFiltersAndRender();
    buildTrendingSection(APP_STATE.allProducts);
    buildMarketplaceSections(APP_STATE.allProducts);
  }

  function buildFallbackProducts(count) {
    var categories = ["Puja Decorations", "Wedding Stage Decoration", "Birthday Decoration", "Festive Lighting", "Floral Decoration"];
    var festivals = ["Durga Puja", "Diwali", "Kali Puja", "Saraswati Puja", "Wedding", "Birthday", "Special Event"];
    var adjectives = ["Royal", "Premium", "Grand", "Elegant", "Heritage", "Luxury", "Classic", "Modern"];
    var data = [];

    for (var i = 1; i <= count; i += 1) {
      var min = 999 + (i % 9) * 1100;
      var max = Math.max(min + 3000, (i % 19 === 0 ? 50000 : min + 9000 + (i % 8) * 1200));
      data.push({
        _id: "fallback-" + i,
        title: adjectives[i % adjectives.length] + " " + festivals[i % festivals.length] + " " + categories[i % categories.length] + " Package",
        category: categories[i % categories.length],
        description: "Premium setup with mandala backdrop, floral styling, diya lighting and end-to-end on-site support.",
        priceMin: min,
        priceMax: max,
        rating: Number((4 + (i % 10) * 0.1).toFixed(1)),
        popularity: i % 3 === 0 ? "high" : (i % 2 === 0 ? "medium" : "new"),
        totalBookings: Math.max(2, 1100 - i),
        createdAt: new Date(Date.now() - i * 86400000).toISOString()
      });
    }
    return data;
  }

  function handleFiltersAndRender() {
    var price = document.getElementById("priceFilter").value;
    var rating = parseFloat(document.getElementById("ratingFilter").value);
    var eventType = document.getElementById("eventTypeFilter").value;
    var popularity = document.getElementById("popularityFilter").value;
    var sort = document.getElementById("sortFilter").value;

    APP_STATE.filteredProducts = APP_STATE.allProducts.filter(function (item) {
      var priceOk = true;
      if (price !== "all") {
        var split = price.split("-");
        var min = parseInt(split[0], 10);
        var max = parseInt(split[1], 10);
        priceOk = item.priceMin >= min && item.priceMax <= max;
      }
      var ratingOk = item.rating >= rating;
      var eventOk = eventType === "all" || item.category === eventType;
      var popOk = popularity === "all" || item.popularity === popularity;
      return priceOk && ratingOk && eventOk && popOk;
    });

    if (sort === "topRated") {
      APP_STATE.filteredProducts.sort(function (a, b) { return b.rating - a.rating; });
    } else if (sort === "newest") {
      APP_STATE.filteredProducts.sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
    } else {
      APP_STATE.filteredProducts.sort(function (a, b) { return (b.totalBookings || 0) - (a.totalBookings || 0); });
    }

    APP_STATE.displayedCount = 0;
    renderProducts(true);
  }

  function renderProducts(reset) {
    var grid = document.getElementById("festivalProductsGrid");
    var stats = document.getElementById("catalogStats");
    var loadBtn = document.getElementById("loadMorePackages");
    if (!grid || !stats || !loadBtn) return;
    if (reset) grid.innerHTML = "";

    var chunk = APP_STATE.filteredProducts.slice(APP_STATE.displayedCount, APP_STATE.displayedCount + APP_STATE.pageSize);
    chunk.forEach(function (item) {
      var col = document.createElement("div");
      col.className = "col-md-6 col-lg-4";
      col.innerHTML =
        "<div class='product-item festival-package-card glass-card'>" +
        "<figure class='mb-3 festival-placeholder'><div class='image-skeleton' loading='lazy'></div></figure>" +
        "<span class='badge text-bg-warning mb-2'>" + item.category + "</span>" +
        "<h3>" + item.title + "</h3>" +
        "<p class='mb-2'>" + item.description + "</p>" +
        "<div class='d-flex justify-content-between align-items-center mb-2'>" +
        "<span class='price'>₹" + Number(item.priceMin).toLocaleString("en-IN") + " - " + (item.priceMax >= 50000 ? "₹50,000+" : "₹" + Number(item.priceMax).toLocaleString("en-IN")) + "</span>" +
        "<span class='rating'>⭐ " + Number(item.rating).toFixed(1) + "</span>" +
        "</div>" +
        "<button type='button' class='btn btn-outline-primary w-100 quick-view-btn' data-product-id='" + (item._id || "") + "'>View Details</button>" +
        "</div>";
      grid.appendChild(col);
    });

    APP_STATE.displayedCount += chunk.length;
    stats.textContent = "Showing " + APP_STATE.displayedCount + " of " + APP_STATE.filteredProducts.length + " packages";
    loadBtn.style.display = APP_STATE.displayedCount < APP_STATE.filteredProducts.length ? "inline-flex" : "none";
  }

  function buildTrendingSection(products) {
    var section = document.querySelectorAll("section.py-5")[4];
    if (!section) return;
    var trending = products.slice().sort(function (a, b) { return (b.totalBookings || 0) - (a.totalBookings || 0); }).slice(0, 3);

    section.innerHTML = [
      "<div class='container-fluid' id='trending-section'>",
      "<div class='row mb-4'><div class='col-md-12'><h2 class='section-title'>Trending Decorations</h2><p>Most booked premium themes this week.</p></div></div>",
      "<div class='row g-4'>",
      trending.map(function (item) {
        return "<div class='col-md-4'><div class='p-4 rounded-4 trend-card h-100'><h4>" + item.title + "</h4><p>" + item.description + "</p><div class='d-flex justify-content-between'><span>⭐ " + Number(item.rating).toFixed(1) + "</span><span>" + (item.totalBookings || 0) + " bookings</span></div></div></div>";
      }).join(""),
      "</div></div>"
    ].join("");
  }

  function buildMarketplaceSections(products) {
    var target = document.querySelectorAll("section.py-5.overflow-hidden")[2];
    if (!target) return;

    var allEvents = [
      "Anniversary Decoration",
      "Birthday Decoration",
      "Marriage Decoration",
      "Engagement Decoration",
      "Reception Decoration",
      "Baby Shower Decoration",
      "Housewarming Decoration",
      "Corporate Event Decoration",
      "Naming Ceremony Decoration",
      "Durga Puja Decoration",
      "Diwali Decoration",
      "Kali Puja Decoration",
      "Saraswati Puja Decoration",
      "Ganesh Puja Decoration",
      "Navratri Decoration"
    ];

    APP_STATE.marketplaceEvents = allEvents.slice();
    var bucketMap = {};
    allEvents.forEach(function (event) {
      bucketMap[event] = [];
    });

    products.forEach(function (item, idx) {
      var event = allEvents[idx % allEvents.length];
      if (bucketMap[event].length < 12) {
        bucketMap[event].push(item);
      }
    });

    target.innerHTML = [
      "<div class='container-fluid' id='events-marketplace'>",
      buildTopCommerceHeader(),
      "<div class='marketplace-deal-strip mb-3'><div class='deal-track'>" +
      "<span>Top Deal: Anniversary theme from ₹1,499</span><span>Wedding royal stage combo 25% off</span><span>Birthday premium balloon art free entry arch</span><span>Diwali lighting mega combo live now</span><span>Puja mandap decor with floral add-ons</span>" +
      "</div></div>",
      "<div class='marketplace-top d-flex flex-wrap justify-content-between align-items-center mb-4'>",
      "<div><h2 class='section-title mb-1'>All Events Marketplace</h2><p class='mb-0'>A to Z premium decoration sections like top eCommerce storefronts.</p></div>",
      "<div class='event-chip-bar'>",
      allEvents.slice(0, 12).map(function (event, idx) {
        return "<button type='button' class='event-chip event-tab-chip " + (idx === 0 ? "active" : "") + "' data-event='" + event + "'>" + event.replace(" Decoration", "") + "</button>";
      }).join(""),
      "</div></div>",
      "<div class='row g-3'>",
      "<div class='col-lg-2'><aside class='event-sidebar sticky-event-sidebar'><h6>Event Categories</h6><ul>" +
      allEvents.map(function (event, idx) {
        return "<li><button type='button' class='event-side-link " + (idx === 0 ? "active" : "") + "' data-event='" + event + "'>" + event.replace(" Decoration", "") + "</button></li>";
      }).join("") +
      "</ul></aside></div>",
      "<div class='col-lg-10'>",
      buildDealHighlights(products),
      allEvents.map(function (event, idx) {
        return buildEventLane(event, bucketMap[event], idx === 0);
      }).join(""),
      buildRecommendedRows(products),
      "</div></div>",
      "</div>"
    ].join("");

    setupEventTabs();
  }

  function buildTopCommerceHeader() {
    return [
      "<div class='flipkart-style-hero mb-3'>",
      "<div class='flip-top-categories'>",
      "<button type='button' class='flip-cat active'>All</button>",
      "<button type='button' class='flip-cat'>Anniversary</button>",
      "<button type='button' class='flip-cat'>Birthday</button>",
      "<button type='button' class='flip-cat'>Marriage</button>",
      "<button type='button' class='flip-cat'>Puja</button>",
      "<button type='button' class='flip-cat'>Reception</button>",
      "<button type='button' class='flip-cat'>Corporate</button>",
      "<button type='button' class='flip-cat'>Baby Shower</button>",
      "</div>",
      "<div class='flip-hero-banner'><div><h3>Best eCommerce Festival Decoration Store</h3><p>Deals, sections, and premium packages for every event like top marketplaces.</p></div><a href='#services-section' class='btn btn-light'>Shop All Packages</a></div>",
      "</div>"
    ].join("");
  }

  function buildDealHighlights(products) {
    var deals = products.slice(0, 4);
    return [
      "<div class='deal-highlight-grid mb-4'>",
      deals.map(function (item, idx) {
        var labels = ["Deal of the Day", "Flash Sale", "Bank Offer", "Combo Offer"];
        return "<div class='deal-box'><span class='deal-label'>" + labels[idx] + "</span><h5>" + item.title + "</h5><p>From ₹" + Number(item.priceMin).toLocaleString("en-IN") + " | Save up to " + (12 + idx * 5) + "%</p><button type='button' class='btn btn-sm btn-warning quick-view-btn' data-product-id='" + (item._id || "") + "'>View Deal</button></div>";
      }).join(""),
      "</div>"
    ].join("");
  }

  function buildRecommendedRows(products) {
    var lanes = [
      { title: "Best Of Anniversary", start: 30 },
      { title: "Top Marriage Packages", start: 60 },
      { title: "Most Loved Birthday Themes", start: 90 }
    ];
    return lanes.map(function (lane) {
      var rowItems = products.slice(lane.start, lane.start + 8);
      return [
        "<div class='recommended-row mb-4'>",
        "<div class='d-flex justify-content-between align-items-center mb-2'><h4 class='mb-0'>" + lane.title + "</h4><a href='#services-section' class='btn btn-sm btn-outline-primary'>View More</a></div>",
        "<div class='recommended-scroll'>",
        rowItems.map(function (item) {
          return "<div class='recommended-card tilt-card'><div class='mini-placeholder'></div><h6>" + item.title + "</h6><p>₹" + Number(item.priceMin).toLocaleString("en-IN") + " onwards</p><button type='button' class='btn btn-sm btn-outline-primary quick-view-btn' data-product-id='" + (item._id || "") + "'>Quick View</button></div>";
        }).join(""),
        "</div>",
        "</div>"
      ].join("");
    }).join("");
  }

  function buildEventLane(event, items, isActive) {
    return [
      "<div class='event-lane mb-4 event-lane-block " + (isActive ? "active" : "") + "' id='" + toSlug(event) + "' data-event-lane='" + event + "'>",
      "<div class='event-lane-head d-flex justify-content-between align-items-center mb-3'>",
      "<h3 class='mb-0'>" + event + "</h3>",
      "<a href='#services-section' class='btn btn-sm btn-outline-primary'>View All</a>",
      "</div>",
      "<div class='row g-3'>",
      items.map(function (item) {
        return [
          "<div class='col-md-3 col-sm-6'>",
          "<div class='event-mini-card tilt-card'>",
          "<div class='mini-placeholder'></div>",
          "<h6>" + item.title + "</h6>",
          "<div class='d-flex justify-content-between'><span>⭐ " + Number(item.rating).toFixed(1) + "</span><span>₹" + Number(item.priceMin).toLocaleString("en-IN") + "+</span></div>",
          "<button type='button' class='btn btn-sm btn-outline-primary mt-2 quick-view-btn w-100' data-product-id='" + (item._id || "") + "'>Quick View</button>",
          "</div>",
          "</div>"
        ].join("");
      }).join(""),
      "</div>",
      "</div>"
    ].join("");
  }

  function toSlug(value) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  function setupEventTabs() {
    function activateEvent(eventName) {
      document.querySelectorAll(".event-lane-block").forEach(function (lane) {
        lane.classList.toggle("active", lane.getAttribute("data-event-lane") === eventName);
      });
      document.querySelectorAll(".event-tab-chip, .event-side-link").forEach(function (btn) {
        btn.classList.toggle("active", btn.getAttribute("data-event") === eventName);
      });
    }

    document.querySelectorAll(".event-tab-chip, .event-side-link").forEach(function (btn) {
      btn.addEventListener("click", function () {
        activateEvent(btn.getAttribute("data-event"));
      });
    });
  }

  function ensureQuickViewModal() {
    if (document.getElementById("quickViewModal")) return;
    var modal = document.createElement("div");
    modal.id = "quickViewModal";
    modal.className = "quick-view-modal";
    modal.innerHTML = [
      "<div class='quick-view-overlay' data-close-modal='true'></div>",
      "<div class='quick-view-dialog'>",
      "<button type='button' class='quick-view-close' data-close-modal='true'>&times;</button>",
      "<div class='quick-view-content'>",
      "<div class='quick-view-image'></div>",
      "<div class='quick-view-text'>",
      "<h3 id='qvTitle'>Decoration Package</h3>",
      "<p id='qvDescription'></p>",
      "<div class='d-flex justify-content-between mb-3'><span id='qvPrice'></span><span id='qvRating'></span></div>",
      "<div class='d-flex gap-2'><a href='#booking-section' class='btn btn-primary'>Book This Package</a><button type='button' class='btn btn-outline-primary' data-close-modal='true'>Continue Browsing</button></div>",
      "</div></div></div>"
    ].join("");
    document.body.appendChild(modal);
  }

  function setupGlobalCardActions() {
    document.addEventListener("click", function (event) {
      var closeTarget = event.target.closest("[data-close-modal='true']");
      if (closeTarget) {
        document.getElementById("quickViewModal").classList.remove("show");
        return;
      }

      var qv = event.target.closest(".quick-view-btn");
      if (!qv) return;
      var productId = qv.getAttribute("data-product-id");
      var item = APP_STATE.allProducts.find(function (p) { return String(p._id) === String(productId); }) || APP_STATE.filteredProducts[0];
      if (!item) return;

      document.getElementById("qvTitle").textContent = item.title;
      document.getElementById("qvDescription").textContent = item.description || "Premium event decoration package with lighting, floral and backdrop setup.";
      document.getElementById("qvPrice").textContent = "₹" + Number(item.priceMin).toLocaleString("en-IN") + " - " + (item.priceMax >= 50000 ? "₹50,000+" : "₹" + Number(item.priceMax).toLocaleString("en-IN"));
      document.getElementById("qvRating").textContent = "⭐ " + Number(item.rating || 4.5).toFixed(1);
      document.getElementById("quickViewModal").classList.add("show");
    });
  }

  async function loadReviews() {
    var reviews = [];
    try {
      var res = await fetch(API_BASE + "/reviews?limit=3");
      if (!res.ok) throw new Error("Review API failed");
      var payload = await res.json();
      reviews = payload.data || [];
    } catch (e) {
      reviews = [
        { name: "Priyanka Sen", rating: 5, reviewText: "Amazing Durga Puja decoration! Highly recommended." },
        { name: "Arjun & Meera", rating: 5, reviewText: "Elegant wedding stage design and flawless execution." },
        { name: "S. Chatterjee", rating: 4.5, reviewText: "Beautiful birthday decor and very professional team." }
      ];
    }
    buildTestimonialsSection(reviews);
  }

  function buildTestimonialsSection(reviews) {
    var target = document.getElementById("latest-blog");
    if (!target) return;
    var data = reviews && reviews.length ? reviews : [];

    target.innerHTML = [
      "<div class='container-fluid'>",
      "<div class='row mb-4'><div class='col-md-12'><h2 class='section-title'>Customer Reviews</h2><p>Verified experiences from festival and event clients.</p></div></div>",
      "<div class='row g-4'>",
      data.map(function (item) {
        return "<div class='col-md-4'><div class='card border-0 shadow-sm p-4 h-100 glass-card'><h5>" + item.reviewText + " " + toStars(item.rating) + "</h5><p class='mb-0 text-muted'>- " + item.name + "</p></div></div>";
      }).join(""),
      "</div></div>"
    ].join("");
  }

  function toStars(rating) {
    var rounded = Math.round(rating);
    return "★".repeat(rounded) + "☆".repeat(5 - rounded);
  }

  function buildBookingSection() {
    var bookingSection = document.querySelector("section.py-5.my-5");
    if (!bookingSection) return;

    bookingSection.innerHTML = [
      "<div class='container-fluid' id='booking-section'>",
      "<div class='bg-warning py-5 rounded-5 festival-booking-bg'>",
      "<div class='container'><div class='row align-items-center'>",
      "<div class='col-md-5'><h2 class='mb-3'>Book Your Decoration</h2><p class='mb-0'>Name, event details and date are all we need to begin planning your premium setup.</p></div>",
      "<div class='col-md-7'><form id='festivalBookingForm' class='row g-3' novalidate>",
      "<div class='col-md-6'><input id='bookName' type='text' class='form-control' placeholder='Name' required></div>",
      "<div class='col-md-6'><input id='bookPhone' type='tel' class='form-control' placeholder='Phone' pattern='[0-9]{10}' required></div>",
      "<div class='col-md-6'><input id='bookAddress' type='text' class='form-control' placeholder='Address' required></div>",
      "<div class='col-md-3'><select id='bookEventType' class='form-select' required><option value=''>Event Type</option><option>Durga Puja</option><option>Diwali</option><option>Kali Puja</option><option>Saraswati Puja</option><option>Wedding Decoration</option><option>Birthday Decoration</option><option>Special Events</option></select></div>",
      "<div class='col-md-3'><input id='bookDate' type='date' class='form-control' required></div>",
      "<div class='col-md-4'><input id='advanceAmount' type='number' min='100' value='999' class='form-control' placeholder='Advance Amount (INR)'></div>",
      "<div class='col-12 d-flex flex-wrap gap-2'><button type='submit' class='btn btn-dark px-4'>Book Now</button><button type='button' id='payAdvanceBtn' class='btn btn-primary px-4'>Pay Advance</button><a target='_blank' rel='noopener noreferrer' href='https://wa.me/9198034984089' class='btn btn-outline-dark px-4'>WhatsApp API</a></div>",
      "<div class='col-12'><small id='bookingMessage' class='text-dark fw-semibold'></small></div>",
      "</form></div></div></div></div></div>"
    ].join("");

    var form = document.getElementById("festivalBookingForm");
    if (!form) return;
    form.addEventListener("submit", submitBooking);
    var payBtn = document.getElementById("payAdvanceBtn");
    if (payBtn) payBtn.addEventListener("click", handleAdvancePayment);
  }

  async function submitBooking(event) {
    event.preventDefault();
    var msg = document.getElementById("bookingMessage");
    var payload = {
      name: document.getElementById("bookName").value.trim(),
      phone: document.getElementById("bookPhone").value.trim(),
      address: document.getElementById("bookAddress").value.trim(),
      eventType: document.getElementById("bookEventType").value,
      eventDate: document.getElementById("bookDate").value
    };

    if (!payload.name || !payload.phone || !payload.address || !payload.eventType || !payload.eventDate || !/^\d{10}$/.test(payload.phone)) {
      msg.textContent = "Please enter valid details (10 digit phone required).";
      return;
    }

    try {
      var res = await fetch(API_BASE + "/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to submit booking");
      var data = await res.json();
      APP_STATE.activeBookingId = data && data.data ? data.data._id : "";
      msg.textContent = "Booking submitted successfully. Our team will contact you shortly.";
      document.getElementById("festivalBookingForm").reset();
    } catch (error) {
      msg.textContent = "Booking captured locally. Start backend server to persist in database.";
    }
  }

  async function loadPaymentConfig() {
    try {
      var res = await fetch(API_BASE + "/payments/config");
      if (!res.ok) throw new Error("Missing payment config");
      var payload = await res.json();
      APP_STATE.razorpayKeyId = payload && payload.data ? payload.data.keyId : "";
    } catch (_err) {
      APP_STATE.razorpayKeyId = "";
    }
  }

  async function handleAdvancePayment() {
    var msg = document.getElementById("bookingMessage");
    var amount = Number(document.getElementById("advanceAmount").value || 0);
    if (!amount || amount < 100) {
      msg.textContent = "Enter a valid advance amount (minimum ₹100).";
      return;
    }

    if (!APP_STATE.razorpayKeyId) {
      msg.textContent = "Razorpay is not configured. Add keys in backend .env.";
      return;
    }

    var bookingId = APP_STATE.activeBookingId || (await createBookingSilently());
    if (!bookingId) {
      msg.textContent = "Please complete booking details before payment.";
      return;
    }

    try {
      var loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) {
        msg.textContent = "Unable to load payment gateway.";
        return;
      }

      var orderRes = await fetch(API_BASE + "/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amount,
          currency: "INR",
          bookingId: bookingId,
          notes: {
            business: "Utsav Decor"
          }
        })
      });
      if (!orderRes.ok) throw new Error("Order creation failed");
      var orderPayload = await orderRes.json();
      var order = orderPayload.data;

      var options = {
        key: APP_STATE.razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: "Utsav Decor",
        description: "Advance booking payment",
        order_id: order.id,
        handler: async function (response) {
          try {
            var verifyRes = await fetch(API_BASE + "/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId: bookingId
              })
            });
            if (!verifyRes.ok) throw new Error("Payment verification failed");
            msg.textContent = "Payment successful and booking confirmed.";
          } catch (err) {
            msg.textContent = "Payment captured but verification failed. Contact support.";
          }
        },
        prefill: {
          name: document.getElementById("bookName").value || "",
          contact: document.getElementById("bookPhone").value || ""
        },
        theme: {
          color: "#8a1f2d"
        }
      };

      var rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function () {
        msg.textContent = "Payment failed or cancelled. You can retry.";
      });
      rzp.open();
    } catch (error) {
      msg.textContent = "Unable to initiate payment. Check backend and Razorpay keys.";
    }
  }

  async function createBookingSilently() {
    var payload = {
      name: document.getElementById("bookName").value.trim(),
      phone: document.getElementById("bookPhone").value.trim(),
      address: document.getElementById("bookAddress").value.trim(),
      eventType: document.getElementById("bookEventType").value,
      eventDate: document.getElementById("bookDate").value
    };
    if (!payload.name || !payload.phone || !payload.address || !payload.eventType || !payload.eventDate || !/^\d{10}$/.test(payload.phone)) {
      return "";
    }
    try {
      var res = await fetch(API_BASE + "/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) return "";
      var data = await res.json();
      APP_STATE.activeBookingId = data && data.data ? data.data._id : "";
      return APP_STATE.activeBookingId;
    } catch (_e) {
      return "";
    }
  }

  function loadRazorpayScript() {
    return new Promise(function (resolve) {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      var script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = function () { resolve(true); };
      script.onerror = function () { resolve(false); };
      document.body.appendChild(script);
    });
  }

  function buildAboutOffersGallery() {
    var about = document.querySelectorAll("section.py-5")[5];
    if (about) {
      about.innerHTML = [
        "<div class='container-fluid' id='about-section'>",
        "<div class='row g-4'>",
        "<div class='col-lg-7'><div class='p-4 rounded-4 festival-about-box glass-card'><h2>About Utsav Decor</h2><p>Utsav Decor is an experienced festival and event decoration provider specializing in Durga Puja, Diwali, Kali Puja, Saraswati Puja, weddings, birthdays and premium special events.</p><p class='mb-0'>Our team delivers elegant traditional-modern setups with stage artistry, floral styling, and festive lighting concepts tailored to each event.</p></div></div>",
        "<div class='col-lg-5'><div class='p-4 rounded-4 festival-offer-box glass-card' id='offers-section'><h3>Special Festival Offers</h3><ul class='mb-0'><li>Durga Puja Grand Theme: up to 20% off</li><li>Diwali Glow Package: free diya pathway add-on</li><li>Wedding Floral Luxe: complimentary stage drapes</li><li>Birthday Premium Combo: free welcome gate decor</li></ul></div></div>",
        "</div></div>"
      ].join("");
    }

    var gallery = document.querySelectorAll("section.py-5")[6];
    if (gallery) {
      gallery.innerHTML = [
        "<div class='container-fluid' id='gallery-section'>",
        "<div class='row mb-4'><div class='col-md-12'><h2 class='section-title'>Gallery</h2><p>Project showcase placeholders ready for backend media uploads.</p></div></div>",
        "<div class='row g-3'>",
        "<div class='col-md-3 col-6'><div class='festival-gallery-placeholder'></div></div>",
        "<div class='col-md-3 col-6'><div class='festival-gallery-placeholder'></div></div>",
        "<div class='col-md-3 col-6'><div class='festival-gallery-placeholder'></div></div>",
        "<div class='col-md-3 col-6'><div class='festival-gallery-placeholder'></div></div>",
        "</div></div>"
      ].join("");
    }
  }

  function enhanceFooter() {
    var menus = document.querySelectorAll(".footer-menu");
    if (menus[1]) menus[1].innerHTML = "<h5 class='widget-title'>Quick Links</h5><ul class='menu-list list-unstyled'><li class='menu-item'><a href='#' class='nav-link'>Home</a></li><li class='menu-item'><a href='#services-section' class='nav-link'>Services</a></li><li class='menu-item'><a href='#about-section' class='nav-link'>About</a></li><li class='menu-item'><a href='#booking-section' class='nav-link'>Contact</a></li></ul>";
    if (menus[2]) menus[2].innerHTML = "<h5 class='widget-title'>Contact Info</h5><ul class='menu-list list-unstyled'><li class='menu-item'>+91 98034 984089</li><li class='menu-item'>info@utsavdecor.in</li><li class='menu-item'>Kolkata, West Bengal</li></ul>";
    if (menus[3]) menus[3].innerHTML = "<h5 class='widget-title'>Social Media</h5><ul class='menu-list list-unstyled'><li class='menu-item'><a href='#' class='nav-link'>Instagram</a></li><li class='menu-item'><a href='#' class='nav-link'>Facebook</a></li><li class='menu-item'><a href='#' class='nav-link'>YouTube</a></li></ul>";

    var copyright = document.querySelector("#footer-bottom .copyright p");
    if (copyright) copyright.textContent = "© 2026 Utsav Decor. All rights reserved.";
  }

  function wireNavigationAnchors() {
    var links = document.querySelectorAll(".menu-list .nav-link");
    var map = ["#", "#services-section", "#trending-section", "#offers-section", "#gallery-section", "#about-section", "#booking-section"];
    links.forEach(function (link, idx) {
      if (map[idx]) link.setAttribute("href", map[idx]);
    });
  }

  function addWhatsappButton() {
    if (document.querySelector(".whatsapp-float")) return;
    var btn = document.createElement("a");
    btn.className = "whatsapp-float";
    btn.href = "https://wa.me/9198034984089";
    btn.target = "_blank";
    btn.rel = "noopener noreferrer";
    btn.textContent = "WhatsApp";
    document.body.appendChild(btn);
  }

  function activateCardTilt() {
    document.addEventListener("mousemove", function (e) {
      var cards = document.querySelectorAll(".tilt-card");
      cards.forEach(function (card) {
        var rect = card.getBoundingClientRect();
        if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
          card.style.transform = "rotateX(0deg) rotateY(0deg) translateY(0)";
          return;
        }
        var centerX = rect.left + rect.width / 2;
        var centerY = rect.top + rect.height / 2;
        var rotateY = ((e.clientX - centerX) / rect.width) * 14;
        var rotateX = ((centerY - e.clientY) / rect.height) * 14;
        card.style.transform = "rotateX(" + rotateX.toFixed(2) + "deg) rotateY(" + rotateY.toFixed(2) + "deg) translateY(-4px)";
      });
    });
  }

  function runUltraPremiumPass() {
    addFloatingFestiveIcons();
    initScrollReveal();
    decoratePremiumCards();
    buildDesktopMegaMenu();
  }

  function addFloatingFestiveIcons() {
    if (document.querySelector(".festive-icon-layer")) return;
    var layer = document.createElement("div");
    layer.className = "festive-icon-layer";
    var icons = ["✦", "❋", "✺", "❁", "✶", "❉", "✹", "✧"];
    for (var i = 0; i < 24; i += 1) {
      var icon = document.createElement("span");
      icon.className = "festive-icon";
      icon.textContent = icons[i % icons.length];
      icon.style.left = ((i * 31) % 100) + "%";
      icon.style.animationDelay = (i % 7) * 0.8 + "s";
      icon.style.fontSize = (10 + (i % 5) * 2) + "px";
      layer.appendChild(icon);
    }
    document.body.appendChild(layer);
  }

  function initScrollReveal() {
    var selectors = [
      ".festival-package-card",
      ".trend-card",
      ".event-lane",
      ".festival-about-box",
      ".festival-offer-box",
      ".festival-gallery-placeholder"
    ];
    var revealTargets = document.querySelectorAll(selectors.join(","));
    revealTargets.forEach(function (el) {
      el.classList.add("reveal-init");
    });

    if (!("IntersectionObserver" in window)) {
      revealTargets.forEach(function (el) { el.classList.add("reveal-show"); });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-show");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    revealTargets.forEach(function (el) {
      observer.observe(el);
    });
  }

  function decoratePremiumCards() {
    var cards = document.querySelectorAll(".festival-package-card, .event-mini-card, .trend-card");
    cards.forEach(function (card) {
      if (card.querySelector(".premium-edge")) return;
      var edge = document.createElement("span");
      edge.className = "premium-edge";
      card.appendChild(edge);
    });
  }

  function buildDesktopMegaMenu() {
    var navWrap = document.querySelector("header .container-fluid .row.py-3 .d-flex");
    if (!navWrap || document.querySelector(".mega-menu-trigger")) return;
    var events = APP_STATE.marketplaceEvents && APP_STATE.marketplaceEvents.length
      ? APP_STATE.marketplaceEvents
      : [
          "Anniversary Decoration",
          "Birthday Decoration",
          "Marriage Decoration",
          "Engagement Decoration",
          "Reception Decoration",
          "Baby Shower Decoration",
          "Corporate Event Decoration",
          "Durga Puja Decoration",
          "Diwali Decoration",
          "Kali Puja Decoration",
          "Saraswati Puja Decoration"
        ];

    var trigger = document.createElement("div");
    trigger.className = "mega-menu-trigger d-none d-lg-block";
    trigger.innerHTML = [
      "<button type='button' class='btn btn-primary mega-toggle-btn'>All Event Categories</button>",
      "<div class='mega-menu-panel'>",
      "<div class='mega-head'><h5>Explore A-Z Events</h5><p>Find premium themes by occasion</p></div>",
      "<div class='mega-grid'>",
      events.map(function (event) {
        return "<a href='#" + toSlug(event) + "' class='mega-item'>" + event + "</a>";
      }).join(""),
      "</div>",
      "</div>"
    ].join("");
    navWrap.appendChild(trigger);

    var btn = trigger.querySelector(".mega-toggle-btn");
    var panel = trigger.querySelector(".mega-menu-panel");
    btn.addEventListener("click", function () {
      panel.classList.toggle("show");
    });
    document.addEventListener("click", function (e) {
      if (!trigger.contains(e.target)) {
        panel.classList.remove("show");
      }
    });
  }
})(jQuery);
(function () {
  var root = document.documentElement;
  var saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") {
    root.setAttribute("data-theme", saved);
  }

  var toggle = document.querySelector(".theme-toggle");
  toggle.addEventListener("click", function () {
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  });

  var tabs = document.querySelectorAll(".platform-tab");

  function activatePlatform(name) {
    var found = false;
    tabs.forEach(function (t) {
      if (t.dataset.platform === name) {
        t.classList.add("active");
        t.setAttribute("aria-selected", "true");
        found = true;
      } else {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      }
    });
    if (found) {
      document.querySelectorAll(".platform-panel").forEach(function (panel) {
        panel.hidden = true;
      });
      document.getElementById("panel-" + name).hidden = false;
    }
  }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      activatePlatform(tab.dataset.platform);
    });
  });

  (function detectPlatform() {
    var ua = navigator.userAgent || "";
    if (/Android|iPhone|iPad|iPod|Mobile/i.test(ua)) {
      activatePlatform("android");
    } else {
      activatePlatform("pc");
    }
  })();

  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href").slice(1);
      if (!id) return;
      var target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      var header = document.querySelector(".header");
      var headerH = header ? header.offsetHeight : 0;
      var top = target.getBoundingClientRect().top + window.pageYOffset;
      var y;
      if (id.indexOf("help-") === 0) {
        y = top - window.innerHeight / 2 + target.offsetHeight / 2;
      } else {
        y = top - headerH;
      }
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    });
  });

  // Карусель скриншотов на странице
  var carousel = document.getElementById("gallery-carousel");
  var galleryShots = [];
  var goToSlide = null;

  if (carousel) {
    var track = carousel.querySelector(".carousel-track");
    var slides = carousel.querySelectorAll(".carousel-slide");
    var dotsContainer = carousel.querySelector(".carousel-dots");
    var currentSlide = 0;
    var slideCount = slides.length;
    var dots = [];
    galleryShots = Array.prototype.slice.call(carousel.querySelectorAll(".shot"));

    goToSlide = function (idx) {
      currentSlide = (idx + slideCount) % slideCount;
      track.style.transform = "translateX(-" + currentSlide * 100 + "%)";
      dots.forEach(function (d, i) {
        d.classList.toggle("active", i === currentSlide);
      });
    };

    for (var i = 0; i < slideCount; i++) {
      (function (index) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.className = "carousel-dot" + (index === 0 ? " active" : "");
        dot.setAttribute("aria-label", "Скриншот " + (index + 1));
        dot.addEventListener("click", function () {
          goToSlide(index);
        });
        dotsContainer.appendChild(dot);
        dots.push(dot);
      })(i);
    }

    carousel.querySelectorAll(".carousel-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        goToSlide(currentSlide + (btn.dataset.dir === "next" ? 1 : -1));
      });
    });

    var touchStartX = 0;
    var touchStartY = 0;
    var viewport = carousel.querySelector(".carousel-viewport");
    viewport.addEventListener(
      "touchstart",
      function (e) {
        if (e.touches.length === 1) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
        }
      },
      { passive: true }
    );
    viewport.addEventListener(
      "touchend",
      function (e) {
        if (e.changedTouches.length === 1) {
          var dx = e.changedTouches[0].clientX - touchStartX;
          var dy = e.changedTouches[0].clientY - touchStartY;
          if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
            goToSlide(currentSlide + (dx < 0 ? 1 : -1));
          }
        }
      },
      { passive: true }
    );
  }

  // Полноэкранный просмотр скриншотов (Lightbox) с поддержкой карусели
  var lightbox = document.getElementById("lightbox");
  var lightboxImg = lightbox.querySelector("img");
  var lbPrev = lightbox.querySelector(".lightbox-prev");
  var lbNext = lightbox.querySelector(".lightbox-next");
  var lbCounter = document.getElementById("lightbox-counter");
  var activeGroup = [];
  var activeIndex = -1;
  var naturalW = 0;
  var naturalH = 0;
  var dw = 0;
  var dh = 0;
  var scale = 1;
  var panX = 0;
  var panY = 0;
  var MIN_SCALE = 1;
  var MAX_SCALE = 8;

  function round(v) {
    return Math.round(v * 100) / 100;
  }

  function applyTransform() {
    lightboxImg.style.transform =
      "translate(" + panX + "px," + panY + "px) scale(" + scale + ")";
  }

  function clampPan() {
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var sw = dw * scale;
    var sh = dh * scale;
    var minX = (vw - sw) / 2;
    var maxX = (sw - vw) / 2;
    var minY = (vh - sh) / 2;
    var maxY = (sh - vh) / 2;
    if (minX > maxX) {
      minX = maxX = 0;
    }
    if (minY > maxY) {
      minY = maxY = 0;
    }
    panX = round(Math.max(minX, Math.min(maxX, panX)));
    panY = round(Math.max(minY, Math.min(maxY, panY)));
  }

  function zoomAt(clientX, clientY, newScale) {
    newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
    if (newScale === scale) return;
    var r = lightbox.getBoundingClientRect();
    var cx = r.left + r.width / 2;
    var cy = r.top + r.height / 2;
    var k = newScale / scale;
    panX = (clientX - cx) - (clientX - cx - panX) * k;
    panY = (clientY - cy) - (clientY - cy - panY) * k;
    scale = newScale;
    clampPan();
    applyTransform();
  }

  function fitToWindow() {
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var padX = vw <= 640 ? 16 : 96;
    var padY = vw <= 640 ? 88 : 96;
    var ratio = naturalW / naturalH;
    dw = Math.min(vw - padX, naturalW);
    dh = dw / ratio;
    var maxH = Math.min(vh - padY, naturalH);
    if (dh > maxH) {
      dh = maxH;
      dw = dh * ratio;
    }
    lightboxImg.style.width = Math.max(1, dw) + "px";
    lightboxImg.style.height = Math.max(1, dh) + "px";
    scale = 1;
    panX = 0;
    panY = 0;
    applyTransform();
  }

  function updateLightboxNav() {
    var hasCarousel = activeGroup.length > 1;
    lbPrev.hidden = !hasCarousel;
    lbNext.hidden = !hasCarousel;
    lbCounter.hidden = !hasCarousel;
    if (hasCarousel) {
      lbCounter.textContent = (activeIndex + 1) + " / " + activeGroup.length;
    }
  }

  function showLightboxImage(img) {
    function render() {
      naturalW = img.naturalWidth || 1;
      naturalH = img.naturalHeight || 1;
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt || "";
      fitToWindow();
      updateLightboxNav();
      lightbox.hidden = false;
      document.body.style.overflow = "hidden";
    }
    if (img.complete && img.naturalWidth) {
      render();
    } else {
      img.addEventListener("load", render, { once: true });
      if (img.loading === "lazy") {
        img.loading = "eager";
      }
    }
  }

  function stepLightbox(dir) {
    if (activeGroup.length <= 1) return;
    activeIndex = (activeIndex + dir + activeGroup.length) % activeGroup.length;
    if (goToSlide && activeGroup === galleryShots) {
      goToSlide(activeIndex);
    }
    showLightboxImage(activeGroup[activeIndex]);
  }

  function closeShot() {
    lightbox.hidden = true;
    lightboxImg.removeAttribute("src");
    document.body.style.overflow = "";
    pointers = {};
    panMode = null;
    lightboxImg.classList.remove("dragging");
  }

  lbPrev.addEventListener("click", function (e) {
    e.stopPropagation();
    stepLightbox(-1);
  });

  lbNext.addEventListener("click", function (e) {
    e.stopPropagation();
    stepLightbox(1);
  });

  var shots = document.querySelectorAll(".shot");
  shots.forEach(function (img) {
    img.addEventListener("click", function () {
      var gIdx = galleryShots.indexOf(img);
      if (gIdx !== -1) {
        activeGroup = galleryShots;
        activeIndex = gIdx;
      } else {
        activeGroup = [img];
        activeIndex = 0;
      }
      showLightboxImage(img);
    });
  });

  window.addEventListener("resize", function () {
    if (!lightbox.hidden && naturalW > 0) {
      fitToWindow();
    }
  });

  document.querySelector(".lightbox-close").addEventListener("click", closeShot);

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
      return;
    }
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
    } catch (e) {}
    document.body.removeChild(ta);
  }

  document.querySelectorAll(".copy-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var link = btn.parentElement.querySelector(".link-box-link");
      var value = (btn.dataset.copy || (link ? link.textContent.trim() : "")).trim();
      if (!value) return;
      copyText(value);
      btn.classList.add("copied");
      var label = btn.querySelector(".copy-label");
      var original = label.textContent;
      label.textContent = "Скопировано!";
      setTimeout(function () {
        btn.classList.remove("copied");
        label.textContent = original;
      }, 1500);
    });
  });

  var pointers = {};
  var panMode = null;
  var panStart = { x: 0, y: 0 };
  var panOrigin = { x: 0, y: 0 };
  var pinchStart = { scale: 1, panX: 0, panY: 0, dist: 1, midX: 0, midY: 0 };
  var moved = false;
  var lastTapTime = 0;

  function dist(a, b) {
    return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
  }

  function currentMid() {
    var keys = Object.keys(pointers);
    var p1 = pointers[keys[0]];
    var p2 = pointers[keys[1]];
    return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
  }

  lightbox.addEventListener("pointerdown", function (e) {
    if (lightbox.hidden) return;
    if (e.target.closest(".lightbox-close, .lightbox-nav")) return;
    pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
    var keys = Object.keys(pointers);
    if (keys.length === 1) {
      panMode = "pan";
      panStart.x = e.clientX;
      panStart.y = e.clientY;
      panOrigin.x = panX;
      panOrigin.y = panY;
      moved = false;
      lightboxImg.classList.add("dragging");
      lightbox.setPointerCapture(e.pointerId);
    } else if (keys.length === 2) {
      panMode = "pinch";
      var mid = currentMid();
      pinchStart.scale = scale;
      pinchStart.panX = panX;
      pinchStart.panY = panY;
      pinchStart.dist = dist(pointers[keys[0]], pointers[keys[1]]);
      pinchStart.midX = mid.x;
      pinchStart.midY = mid.y;
      moved = true;
    }
  });

  lightbox.addEventListener("pointermove", function (e) {
    if (lightbox.hidden || !pointers[e.pointerId]) return;
    pointers[e.pointerId].x = e.clientX;
    pointers[e.pointerId].y = e.clientY;
    var keys = Object.keys(pointers);
    if (panMode === "pan") {
      var dx = e.clientX - panStart.x;
      var dy = e.clientY - panStart.y;
      if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
      if (scale > 1) {
        panX = panOrigin.x + dx;
        panY = panOrigin.y + dy;
        clampPan();
        applyTransform();
      }
    } else if (panMode === "pinch" && keys.length === 2) {
      var mid = currentMid();
      var d = dist(pointers[keys[0]], pointers[keys[1]]);
      var ns = Math.max(MIN_SCALE, Math.min(MAX_SCALE, pinchStart.scale * (d / pinchStart.dist)));
      panX = pinchStart.panX + (mid.x - pinchStart.midX);
      panY = pinchStart.panY + (mid.y - pinchStart.midY);
      zoomAt(mid.x, mid.y, ns);
      applyTransform();
    }
  });

  function pointerUp(e) {
    if (lightbox.hidden) return;
    var dx = e.clientX - panStart.x;
    var dy = e.clientY - panStart.y;
    var wasSinglePan = panMode === "pan" && Object.keys(pointers).length === 1;

    delete pointers[e.pointerId];
    var keys = Object.keys(pointers);

    if (keys.length === 1) {
      panMode = "pan";
      panStart.x = pointers[keys[0]].x;
      panStart.y = pointers[keys[0]].y;
      panOrigin.x = panX;
      panOrigin.y = panY;
      return;
    }

    panMode = null;
    lightboxImg.classList.remove("dragging");

    if (!wasSinglePan) return;

    // Если картинка не увеличена (scale === 1), горизонтальный свайп листает карусель
    if (scale === 1 && moved && Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) && activeGroup.length > 1) {
      stepLightbox(dx < 0 ? 1 : -1);
      return;
    }

    // Одиночный/двойной тап без перетаскивания
    if (!moved) {
      var now = Date.now();
      if (e.target === lightboxImg && now - lastTapTime < 280) {
        zoomAt(e.clientX, e.clientY, scale > 1 ? 1 : 2.5);
        lastTapTime = 0;
        return;
      }
      lastTapTime = now;
      if (e.target === lightbox) {
        closeShot();
      }
    }
  }

  lightbox.addEventListener("pointerup", pointerUp);
  lightbox.addEventListener("pointercancel", pointerUp);

  document.addEventListener("keydown", function (e) {
    if (lightbox.hidden) return;
    if (e.key === "Escape") {
      closeShot();
    } else if (e.key === "ArrowLeft") {
      stepLightbox(-1);
    } else if (e.key === "ArrowRight") {
      stepLightbox(1);
    }
  });

  lightbox.addEventListener(
    "wheel",
    function (e) {
      if (lightbox.hidden) return;
      e.preventDefault();
      var dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      var factor = dy < 0 ? 1.15 : 1 / 1.15;
      zoomAt(e.clientX, e.clientY, scale * factor);
    },
    { passive: false }
  );
})();
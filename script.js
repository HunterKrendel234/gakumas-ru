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

  document.querySelectorAll('a[href^="#help-"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var target = document.getElementById(a.getAttribute("href").slice(1));
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.pageYOffset;
      var y = top - window.innerHeight / 2 + target.offsetHeight / 2;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    });
  });

  var lightbox = document.getElementById("lightbox");
  var lightboxImg = lightbox.querySelector("img");
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
    var pad = 64;
    var ratio = naturalW / naturalH;
    dw = Math.min(vw - pad, naturalW);
    dh = dw / ratio;
    var maxH = Math.min(vh - pad, naturalH);
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

  function closeShot() {
    lightbox.hidden = true;
    lightboxImg.src = "";
    document.body.style.overflow = "";
    pointers = {};
    panMode = null;
    lightboxImg.classList.remove("dragging");
  }

  var shots = document.querySelectorAll(".shot");

  function getEdgeColor(img) {
    var nw = img.naturalWidth;
    var nh = img.naturalHeight;
    if (!nw || !nh) return "";
    var s = Math.min(1, 160 / Math.max(nw, nh));
    var w = Math.max(1, Math.round(nw * s));
    var h = Math.max(1, Math.round(nh * s));
    try {
      var canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      var ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, w, h);
      var depth = Math.max(1, Math.round(Math.min(w, h) * 0.08));
      var strips = [
        ctx.getImageData(0, 0, depth, h).data,
        ctx.getImageData(w - depth, 0, depth, h).data,
        ctx.getImageData(0, 0, w, depth).data,
        ctx.getImageData(0, h - depth, w, depth).data
      ];
      var r = 0, g = 0, b = 0, count = 0;
      for (var k = 0; k < strips.length; k++) {
        var d = strips[k];
        for (var i = 0; i < d.length; i += 4) {
          var a = d[i + 3];
          if (a < 128) continue;
          r += d[i] * a;
          g += d[i + 1] * a;
          b += d[i + 2] * a;
          count += a;
        }
      }
      if (!count) return "";
      return "rgb(" + Math.round(r / count) + "," + Math.round(g / count) + "," + Math.round(b / count) + ")";
    } catch (e) {
      return "";
    }
  }

  shots.forEach(function (img) {
    function applyEdgeGlow() {
      var color = getEdgeColor(img);
      if (color) {
        img.style.setProperty("--shot-glow", color);
      } else {
        enableBlurGlow();
      }
    }
    function enableBlurGlow() {
      var wrap = img.parentElement;
      if (wrap && wrap.classList.contains("shot-wrap")) {
        wrap.classList.add("glow-blur");
      }
    }
    if (!img.parentElement || !img.parentElement.classList.contains("shot-wrap")) {
      var wrap = document.createElement("span");
      wrap.className = "shot-wrap";
      wrap.style.setProperty("--shot-src", "url(\"" + (img.currentSrc || img.src) + "\")");
      img.parentNode.insertBefore(wrap, img);
      wrap.appendChild(img);
    }
    if (img.complete) {
      applyEdgeGlow();
    } else {
      img.addEventListener("load", applyEdgeGlow, { once: true });
    }
    img.addEventListener("click", function () {
      naturalW = img.naturalWidth || 1;
      naturalH = img.naturalHeight || 1;
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt || "";
      fitToWindow();
      lightbox.hidden = false;
      document.body.style.overflow = "hidden";
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

  function dist(a, b) {
    return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
  }

  function currentMid() {
    var keys = Object.keys(pointers);
    var p1 = pointers[keys[0]];
    var p2 = pointers[keys[1]];
    return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
  }

  function endPan(pointerId, target, tap) {
    delete pointers[pointerId];
    var keys = Object.keys(pointers);
    if (keys.length === 1) {
      panMode = "pan";
      panStart.x = pointers[keys[0]].x;
      panStart.y = pointers[keys[0]].y;
      panOrigin.x = panX;
      panOrigin.y = panY;
    } else if (keys.length === 0) {
      panMode = null;
      lightboxImg.classList.remove("dragging");
      if (tap && target === lightbox) {
        closeShot();
      }
    }
  }

  lightbox.addEventListener("pointerdown", function (e) {
    if (lightbox.hidden) return;
    if (e.target.closest(".lightbox-close")) return;
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
      if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
      panX = panOrigin.x + dx;
      panY = panOrigin.y + dy;
      clampPan();
      applyTransform();
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
    var tap = panMode === "pan" && !moved;
    endPan(e.pointerId, e.target, tap);
  }

  lightbox.addEventListener("pointerup", pointerUp);
  lightbox.addEventListener("pointercancel", pointerUp);

  document.addEventListener("keydown", function (e) {
    if (!lightbox.hidden && e.key === "Escape") {
      closeShot();
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
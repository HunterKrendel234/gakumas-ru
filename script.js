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
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");
      document.querySelectorAll(".platform-panel").forEach(function (panel) {
        panel.hidden = true;
      });
      document.getElementById("panel-" + tab.dataset.platform).hidden = false;
    });
  });

  var lightbox = document.getElementById("lightbox");
  var lightboxImg = lightbox.querySelector("img");
  var naturalW = 0;
  var naturalH = 0;
  var scale = 1;

  function applyScale() {
    lightboxImg.style.transform = "scale(" + scale + ")";
  }

  function fitToWindow() {
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var pad = 64;
    var ratio = naturalW / naturalH;
    var dw = Math.min(vw - pad, naturalW);
    var dh = dw / ratio;
    var maxH = Math.min(vh - pad, naturalH);
    if (dh > maxH) {
      dh = maxH;
      dw = dh * ratio;
    }
    lightboxImg.style.width = Math.max(1, dw) + "px";
    lightboxImg.style.height = Math.max(1, dh) + "px";
    scale = 1;
    applyScale();
  }

  function closeShot() {
    lightbox.hidden = true;
    lightboxImg.src = "";
    document.body.style.overflow = "";
  }

  var shots = document.querySelectorAll(".shot");
  shots.forEach(function (img) {
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

  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) {
      closeShot();
    }
  });

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
      var factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      scale = Math.max(0.5, Math.min(8, scale * factor));
      applyScale();
    },
    { passive: false }
  );
})();
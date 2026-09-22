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
  var scale = 1;
  var baseScale = 1;

  function applyScale() {
    lightboxImg.style.transform = "scale(" + scale + ")";
  }

  function closeShot() {
    lightbox.hidden = true;
    lightboxImg.src = "";
    document.body.style.overflow = "";
  }

  var shots = document.querySelectorAll(".shot");
  shots.forEach(function (img) {
    img.addEventListener("click", function () {
      var w = img.naturalWidth || 1;
      var h = img.naturalHeight || 1;
      var vw = window.innerWidth;
      var vh = window.innerHeight;
      baseScale = Math.min(1, (vw - 64) / w, (vh - 64) / h);
      scale = baseScale;
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt || "";
      lightboxImg.style.width = w + "px";
      lightboxImg.style.height = "auto";
      applyScale();
      lightbox.hidden = false;
      document.body.style.overflow = "hidden";
    });
  });

  document.querySelector(".lightbox-close").addEventListener("click", closeShot);

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
      scale = Math.max(baseScale * 0.5, Math.min(baseScale * 8, scale * factor));
      applyScale();
    },
    { passive: false }
  );
})();
(function () {
  try {
    var storedTheme = localStorage.getItem("sts-theme");
    var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    var theme = storedTheme ? storedTheme : (prefersDark ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);

    var prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var introSeen = sessionStorage.getItem("sts-intro-seen");
    if (introSeen || prefersReduced) {
      document.documentElement.classList.add("no-loader");
    }
  } catch (err) {
    // Proceed safely when storage is restricted
  }
})();

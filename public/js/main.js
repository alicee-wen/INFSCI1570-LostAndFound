document.addEventListener("DOMContentLoaded", () => {
  const banner = document.getElementById("welcome-banner");
  if (!banner) return;

  const visited = localStorage.getItem("lf_visited");
  if (!visited) {
    banner.textContent =
      "Welcome! Start by searching or posting a lost or found item.";
    localStorage.setItem("lf_visited", "true");
  } else {
    banner.textContent = "Welcome back! Check if your item has been found.";
  }
});

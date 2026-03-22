// Intersection Observer for scroll animations
document.addEventListener("DOMContentLoaded", () => {
  const reveals = document.querySelectorAll(".reveal");

  const revealOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px" // Trigger slightly before it hits the bottom
  };

  const revealOnScroll = new IntersectionObserver(function(entries, observer) {
    entries.forEach(entry => {
      if (!entry.isIntersecting) {
        return;
      } else {
        entry.target.classList.add("active");
        // Optional: stop observing once revealed
        // observer.unobserve(entry.target);
      }
    });
  }, revealOptions);

  reveals.forEach(reveal => {
    revealOnScroll.observe(reveal);
  });
});

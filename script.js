// Intersection Observer for scroll animations
document.addEventListener("DOMContentLoaded", () => {
  const faders = document.querySelectorAll(".fade-in");

  const appearOptions = {
      threshold: 0.15,
      rootMargin: "0px 0px -50px 0px"
  };

  const appearOnScroll = new IntersectionObserver(function(
      entries,
      appearOnScroll
  ) {
      entries.forEach(entry => {
          if (!entry.isIntersecting) {
              return;
          } else {
              entry.target.classList.add("visible");
              appearOnScroll.unobserve(entry.target);
          }
      });
  }, appearOptions);

  faders.forEach(fader => {
      appearOnScroll.observe(fader);
  });
  
  // Subtle interactive parallax effect for background orbs
  const orb1 = document.querySelector('.orb-1');
  const orb2 = document.querySelector('.orb-2');
  
  document.addEventListener('mousemove', (e) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      
      orb1.style.transform = `translate(${x * 30}px, ${y * 30}px)`;
      orb2.style.transform = `translate(${-x * 30}px, ${-y * 30}px)`;
  });
});

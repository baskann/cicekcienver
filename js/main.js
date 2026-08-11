(function () {
    "use strict";

    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* --- Preloader --- */
    function initPreloader() {
        var preloader = document.getElementById("preloader");
        if (!preloader) return;
        var hide = function () { preloader.classList.add("is-hidden"); };
        window.addEventListener("load", function () { setTimeout(hide, 350); });
        setTimeout(hide, 2500);
    }

    /* --- Navbar & yukarı çık --- */
    function initScrollUI() {
        var navbar = document.getElementById("navbar");
        var backToTop = document.getElementById("back-to-top");
        var update = function () {
            var y = window.scrollY;
            if (navbar) navbar.classList.toggle("is-scrolled", y > 40);
            if (backToTop) backToTop.classList.toggle("is-visible", y > 500);
        };
        window.addEventListener("scroll", update, { passive: true });
        update();
        if (backToTop) {
            backToTop.addEventListener("click", function () {
                window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
            });
        }
    }

    /* --- Scroll spy --- */
    function initScrollSpy() {
        var links = document.querySelectorAll(".nav-link");
        if (!links.length || !("IntersectionObserver" in window)) return;
        var map = {};
        links.forEach(function (link) {
            var id = (link.getAttribute("href") || "").slice(1);
            if (id) map[id] = link;
        });
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                links.forEach(function (l) { l.classList.remove("active"); });
                var link = map[entry.target.id];
                if (link) link.classList.add("active");
            });
        }, { rootMargin: "-40% 0px -55% 0px" });
        Object.keys(map).forEach(function (id) {
            var section = document.getElementById(id);
            if (section) observer.observe(section);
        });
    }

    /* --- Mobil menü --- */
    function initMobileMenu() {
        var toggle = document.getElementById("nav-toggle");
        var menu = document.getElementById("nav-menu");
        if (!toggle || !menu) return;

        var close = function () {
            menu.classList.remove("is-open");
            toggle.classList.remove("is-open");
            toggle.setAttribute("aria-expanded", "false");
            document.body.style.overflow = "";
        };
        var open = function () {
            menu.classList.add("is-open");
            toggle.classList.add("is-open");
            toggle.setAttribute("aria-expanded", "true");
            document.body.style.overflow = "hidden";
        };

        toggle.addEventListener("click", function () {
            menu.classList.contains("is-open") ? close() : open();
        });
        menu.querySelectorAll(".nav-link").forEach(function (link) {
            link.addEventListener("click", close);
        });
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") close();
        });
    }

    /* --- Reveal animasyonları --- */
    function initReveal() {
        var items = document.querySelectorAll("[data-reveal]");
        if (!items.length) return;
        if (reducedMotion || !("IntersectionObserver" in window)) {
            items.forEach(function (el) { el.classList.add("is-revealed"); });
            return;
        }
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-revealed");
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
        items.forEach(function (el) {
            var delay = el.getAttribute("data-reveal-delay");
            if (delay) el.style.setProperty("--reveal-delay", delay + "ms");
            observer.observe(el);
        });
    }

    /* --- Sayaçlar --- */
    function initCounters() {
        var counters = document.querySelectorAll(".stat-number");
        if (!counters.length) return;
        var animate = function (el) {
            var target = parseInt(el.getAttribute("data-count"), 10) || 0;
            if (reducedMotion) { el.textContent = target; return; }
            var duration = 1800;
            var start = null;
            var step = function (ts) {
                if (!start) start = ts;
                var progress = Math.min((ts - start) / duration, 1);
                var eased = 1 - Math.pow(1 - progress, 3);
                el.textContent = Math.floor(eased * target);
                if (progress < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        };
        if (!("IntersectionObserver" in window)) {
            counters.forEach(function (el) { animate(el); });
            return;
        }
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    animate(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.4 });
        counters.forEach(function (el) { observer.observe(el); });
    }

    /* --- Galeri filtresi --- */
    function initGalleryFilter() {
        var buttons = document.querySelectorAll(".filter-btn");
        var items = document.querySelectorAll(".gallery-item");
        if (!buttons.length) return;
        buttons.forEach(function (btn) {
            btn.addEventListener("click", function () {
                buttons.forEach(function (b) {
                    b.classList.remove("active");
                    b.setAttribute("aria-pressed", "false");
                });
                btn.classList.add("active");
                btn.setAttribute("aria-pressed", "true");
                var filter = btn.getAttribute("data-filter");
                items.forEach(function (item) {
                    var show = filter === "all" || item.getAttribute("data-category") === filter;
                    item.classList.toggle("is-hidden", !show);
                });
            });
        });
    }

    /* --- Lightbox --- */
    function initLightbox() {
        var lightbox = document.getElementById("lightbox");
        var image = document.getElementById("lightbox-image");
        var caption = document.getElementById("lightbox-caption");
        var closeBtn = document.getElementById("lightbox-close");
        var prevBtn = document.getElementById("lightbox-prev");
        var nextBtn = document.getElementById("lightbox-next");
        if (!lightbox || !image) return;

        var items = Array.prototype.slice.call(document.querySelectorAll(".gallery-item"));
        var current = -1;
        var lastFocused = null;

        var visibleItems = function () {
            return items.filter(function (item) { return !item.classList.contains("is-hidden"); });
        };

        var show = function (item) {
            image.src = item.getAttribute("data-image") || "";
            image.alt = item.getAttribute("data-title") || "";
            if (caption) {
                caption.textContent = (item.getAttribute("data-title") || "") +
                    " — " + (item.getAttribute("data-sub") || "");
            }
        };

        var openAt = function (item) {
            var list = visibleItems();
            current = list.indexOf(item);
            if (current < 0) return;
            lastFocused = document.activeElement;
            show(item);
            lightbox.hidden = false;
            document.body.style.overflow = "hidden";
            if (closeBtn) closeBtn.focus();
        };

        var close = function () {
            lightbox.hidden = true;
            image.src = "";
            document.body.style.overflow = "";
            if (lastFocused) lastFocused.focus();
        };

        var step = function (dir) {
            var list = visibleItems();
            if (!list.length) return;
            current = (current + dir + list.length) % list.length;
            show(list[current]);
        };

        items.forEach(function (item) {
            item.addEventListener("click", function () { openAt(item); });
        });
        if (closeBtn) closeBtn.addEventListener("click", close);
        if (prevBtn) prevBtn.addEventListener("click", function () { step(-1); });
        if (nextBtn) nextBtn.addEventListener("click", function () { step(1); });

        lightbox.addEventListener("click", function (e) {
            if (e.target === lightbox) close();
        });

        document.addEventListener("keydown", function (e) {
            if (lightbox.hidden) return;
            if (e.key === "Escape") close();
            if (e.key === "ArrowLeft") step(-1);
            if (e.key === "ArrowRight") step(1);
            if (e.key === "Tab") {
                var focusables = lightbox.querySelectorAll("button");
                var first = focusables[0];
                var last = focusables[focusables.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        });
    }

    /* --- Yorum slider'ı --- */
    function initTestimonials() {
        var stage = document.getElementById("testimonial-stage");
        if (!stage) return;
        var slides = Array.prototype.slice.call(stage.querySelectorAll(".testimonial"));
        var dotsWrap = document.getElementById("testimonial-dots");
        var prevBtn = document.getElementById("testimonial-prev");
        var nextBtn = document.getElementById("testimonial-next");
        if (slides.length < 2) return;

        var index = 0;
        var timer = null;

        var dots = slides.map(function (_, i) {
            var dot = document.createElement("button");
            dot.setAttribute("aria-label", "Yorum " + (i + 1));
            if (i === 0) dot.classList.add("active");
            dot.addEventListener("click", function () { goTo(i); restart(); });
            if (dotsWrap) dotsWrap.appendChild(dot);
            return dot;
        });

        function goTo(i) {
            index = (i + slides.length) % slides.length;
            slides.forEach(function (slide, n) {
                slide.classList.toggle("is-active", n === index);
            });
            dots.forEach(function (dot, n) {
                dot.classList.toggle("active", n === index);
            });
        }

        function stop() {
            if (timer) { clearInterval(timer); timer = null; }
        }

        function start() {
            if (reducedMotion || timer) return;
            timer = setInterval(function () { goTo(index + 1); }, 6000);
        }

        function restart() { stop(); start(); }

        if (prevBtn) prevBtn.addEventListener("click", function () { goTo(index - 1); restart(); });
        if (nextBtn) nextBtn.addEventListener("click", function () { goTo(index + 1); restart(); });

        stage.addEventListener("mouseenter", stop);
        stage.addEventListener("mouseleave", start);
        stage.addEventListener("focusin", stop);
        stage.addEventListener("focusout", start);
        document.addEventListener("visibilitychange", function () {
            document.hidden ? stop() : start();
        });

        var touchX = null;
        stage.addEventListener("touchstart", function (e) {
            touchX = e.touches[0].clientX;
            stop();
        }, { passive: true });
        stage.addEventListener("touchend", function (e) {
            if (touchX === null) return;
            var dx = e.changedTouches[0].clientX - touchX;
            if (Math.abs(dx) > 45) goTo(index + (dx < 0 ? 1 : -1));
            touchX = null;
            start();
        }, { passive: true });

        start();
    }

    /* --- WhatsApp iletişim formu --- */
    function initContactForm() {
        var form = document.getElementById("contact-form");
        if (!form) return;

        var fields = ["name", "phone", "subject", "message"];
        var messages = {
            name: "Lütfen adınızı girin.",
            phone: "Lütfen geçerli bir telefon numarası girin.",
            subject: "Lütfen bir konu seçin.",
            message: "Lütfen mesajınızı yazın."
        };

        var setError = function (id, text) {
            var input = document.getElementById(id);
            var error = document.getElementById(id + "-error");
            if (input) input.closest(".form-group").classList.toggle("has-error", !!text);
            if (error) error.textContent = text || "";
        };

        var validate = function () {
            var ok = true;
            fields.forEach(function (id) {
                var input = document.getElementById(id);
                var value = input ? input.value.trim() : "";
                var valid = value.length > 0;
                if (id === "phone" && valid) {
                    valid = /^[\d\s()+-]{7,}$/.test(value);
                }
                setError(id, valid ? "" : messages[id]);
                if (!valid) ok = false;
            });
            return ok;
        };

        form.addEventListener("submit", function (e) {
            e.preventDefault();
            if (!validate()) return;
            var name = document.getElementById("name").value.trim();
            var phone = document.getElementById("phone").value.trim();
            var subject = document.getElementById("subject").value;
            var message = document.getElementById("message").value.trim();
            var text = "Merhaba, ben " + name + ".\nKonu: " + subject +
                "\n" + message + "\nTelefonum: " + phone;
            window.open("https://wa.me/905370581775?text=" + encodeURIComponent(text), "_blank", "noopener");
        });

        fields.forEach(function (id) {
            var input = document.getElementById(id);
            if (input) {
                input.addEventListener("input", function () { setError(id, ""); });
                input.addEventListener("change", function () { setError(id, ""); });
            }
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        initPreloader();
        initScrollUI();
        initScrollSpy();
        initMobileMenu();
        initReveal();
        initCounters();
        initGalleryFilter();
        initLightbox();
        initTestimonials();
        initContactForm();
    });
})();

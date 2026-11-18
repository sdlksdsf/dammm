/* Studio Core v2 - Smooth Theme, Pickup Bag, Live Hours & Mobile UX */
(function () {
  var cfg = window.SHOP_CONFIG || {};
  var root = document.documentElement;
  root.classList.add('js-ready');

  var storageKey = 'theme_' + (cfg.slug || 'shop');
  var currency = cfg.currency || '$';
  var bag = {};

  function applyTheme(next, animate) {
    if (animate) {
      root.classList.add('theme-anim');
      window.clearTimeout(applyTheme._t);
      applyTheme._t = window.setTimeout(function () {
        root.classList.remove('theme-anim');
      }, 420);
    }
    root.setAttribute('data-theme', next);
    try { localStorage.setItem(storageKey, next); } catch (e) {}
    var labels = document.querySelectorAll('.theme-label');
    var labelText = next === 'dark' ? 'Light' : 'Dark';
    for (var i = 0; i < labels.length; i++) labels[i].textContent = labelText;
    var btns = document.querySelectorAll('[data-theme-toggle]');
    for (var j = 0; j < btns.length; j++) {
      btns[j].setAttribute('aria-label', 'Switch to ' + labelText.toLowerCase() + ' theme');
    }
  }

  var saved = null;
  try { saved = localStorage.getItem(storageKey); } catch (e) {}
  applyTheme(saved || root.getAttribute('data-theme') || 'light', false);

  document.addEventListener('click', function (e) {
    var tBtn = e.target.closest('[data-theme-toggle]');
    if (tBtn) {
      var cur = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(cur, true);
      return;
    }

    var burger = e.target.closest('[data-burger]');
    if (burger) {
      var nav = document.getElementById('mobileNav');
      if (!nav) return;
      var open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      return;
    }

    var mLink = e.target.closest('#mobileNav a');
    if (mLink) {
      var mNav = document.getElementById('mobileNav');
      var bBtn = document.querySelector('[data-burger]');
      if (mNav) mNav.classList.remove('open');
      if (bBtn) bBtn.setAttribute('aria-expanded', 'false');
    }

    var tab = e.target.closest('[data-filter]');
    if (tab) {
      var cat = tab.getAttribute('data-filter');
      var tabs = document.querySelectorAll('[data-filter]');
      for (var i = 0; i < tabs.length; i++) {
        var active = tabs[i] === tab;
        tabs[i].classList.toggle('active', active);
        tabs[i].setAttribute('aria-selected', active ? 'true' : 'false');
      }
      var cards = document.querySelectorAll('.menu-card');
      var idx = 0;
      for (var c = 0; c < cards.length; c++) {
        var match = cat === 'all' || cards[c].getAttribute('data-cat') === cat;
        cards[c].hidden = !match;
        if (match) {
          cards[c].style.animation = 'none';
          cards[c].offsetHeight;
          cards[c].style.animation = 'cardIn 0.34s cubic-bezier(0.22,1,0.36,1) ' + Math.min(idx * 35, 210) + 'ms both';
          idx++;
        }
      }
      return;
    }

    var addBtn = e.target.closest('[data-add]');
    if (addBtn) {
      var id = addBtn.getAttribute('data-add');
      var name = addBtn.getAttribute('data-name');
      var price = parseFloat(addBtn.getAttribute('data-price') || '0');
      changeQty(id, name, price, 1);
      showToast('Added ' + name + ' to pickup bag');
      return;
    }

    var qBtn = e.target.closest('[data-qty-id]');
    if (qBtn) {
      var qid = qBtn.getAttribute('data-qty-id');
      var delta = parseInt(qBtn.getAttribute('data-delta'), 10);
      if (bag[qid]) changeQty(qid, bag[qid].name, bag[qid].price, delta);
      return;
    }

    if (e.target.closest('[data-open-bag]')) {
      setDrawer(true);
      return;
    }
    if (e.target.closest('[data-close-bag]') || e.target.id === 'drawerBackdrop') {
      setDrawer(false);
      return;
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setDrawer(false);
  });

  function formatMoney(n) {
    return currency + n.toFixed(2);
  }

  function changeQty(id, name, price, delta) {
    if (!bag[id]) bag[id] = { id: id, name: name, price: price, qty: 0 };
    bag[id].qty += delta;
    if (bag[id].qty <= 0) delete bag[id];
    renderBag();
    syncMenuButtons();
  }

  function syncMenuButtons() {
    var slots = document.querySelectorAll('[data-slot]');
    for (var i = 0; i < slots.length; i++) {
      var el = slots[i];
      var id = el.getAttribute('data-slot');
      var name = el.getAttribute('data-name');
      var price = el.getAttribute('data-price');
      var item = bag[id];
      if (item && item.qty > 0) {
        el.innerHTML =
          '<div class="qty-control" role="group" aria-label="Quantity for ' + escapeHtml(name) + '">' +
          '<button type="button" class="qty-btn" data-qty-id="' + id + '" data-delta="-1" aria-label="Remove one">-</button>' +
          '<span class="qty-num">' + item.qty + '</span>' +
          '<button type="button" class="qty-btn" data-qty-id="' + id + '" data-delta="1" aria-label="Add one more">+</button>' +
          '</div>';
      } else {
        el.innerHTML =
          '<button type="button" class="add-btn" data-add="' + id + '" data-name="' + escapeHtml(name) + '" data-price="' + price + '">+ Add</button>';
      }
    }
  }

  function renderBag() {
    var keys = Object.keys(bag);
    var count = 0;
    var total = 0;
    for (var i = 0; i < keys.length; i++) {
      count += bag[keys[i]].qty;
      total += bag[keys[i]].qty * bag[keys[i]].price;
    }

    var badges = document.querySelectorAll('[data-bag-count]');
    for (var b = 0; b < badges.length; b++) {
      badges[b].textContent = count;
      badges[b].classList.remove('bump');
      badges[b].offsetWidth;
      badges[b].classList.add('bump');
    }

    var subEl = document.getElementById('bagSubtotal');
    if (subEl) subEl.textContent = formatMoney(total);

    var body = document.getElementById('bagItems');
    var foot = document.getElementById('drawerFoot');
    var receipt = document.getElementById('bagReceipt');
    if (receipt) receipt.hidden = true;
    if (!body) return;

    if (keys.length === 0) {
      body.innerHTML =
        '<div class="empty-bag">' +
        '<p>Your pickup bag is empty. Tap any item on the menu to start an order.</p>' +
        '<a href="#menu" class="btn btn-primary" data-close-bag>Browse Menu</a>' +
        '</div>';
      if (foot) foot.hidden = true;
      return;
    }

    if (foot) foot.hidden = false;
    var html = '';
    for (var k = 0; k < keys.length; k++) {
      var it = bag[keys[k]];
      html +=
        '<div class="bag-item">' +
        '<div>' +
        '<div class="bag-item-name">' + escapeHtml(it.name) + '</div>' +
        '<div class="bag-item-price">' + formatMoney(it.price * it.qty) + '</div>' +
        '</div>' +
        '<div class="qty-control">' +
        '<button type="button" class="qty-btn" data-qty-id="' + it.id + '" data-delta="-1" aria-label="Decrease">-</button>' +
        '<span class="qty-num">' + it.qty + '</span>' +
        '<button type="button" class="qty-btn" data-qty-id="' + it.id + '" data-delta="1" aria-label="Increase">+</button>' +
        '</div>' +
        '</div>';
    }
    body.innerHTML = html;
  }

  function setDrawer(open) {
    var d = document.getElementById('bagDrawer');
    var bg = document.getElementById('drawerBackdrop');
    if (!d || !bg) return;
    d.classList.toggle('open', open);
    bg.classList.toggle('open', open);
    d.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.body.classList.toggle('lock-scroll', open);
  }

  var orderForm = document.getElementById('pickupForm');
  if (orderForm) {
    orderForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var keys = Object.keys(bag);
      if (!keys.length) return;
      var nameInput = orderForm.querySelector('[name="customer"]');
      var slotInput = orderForm.querySelector('[name="pickup_time"]');
      var who = (nameInput && nameInput.value.trim()) || 'Guest';
      var when = (slotInput && slotInput.value) || 'In 15 mins';
      var total = 0;
      var count = 0;
      for (var i = 0; i < keys.length; i++) {
        count += bag[keys[i]].qty;
        total += bag[keys[i]].qty * bag[keys[i]].price;
      }
      bag = {};
      syncMenuButtons();
      renderBag();
      var body = document.getElementById('bagItems');
      if (body) {
        body.innerHTML =
          '<div class="confirm-box">' +
          '<strong>Pickup Order Received for ' + escapeHtml(who) + '</strong>' +
          count + ' item' + (count === 1 ? '' : 's') + ' (' + formatMoney(total) + ') scheduled for counter pickup: ' + escapeHtml(when) + '. Pay at the counter or online at checkout.' +
          '</div>';
      }
      orderForm.reset();
    });
  }

  var bookForm = document.getElementById('inquiryForm');
  if (bookForm) {
    bookForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var out = document.getElementById('inquiryConfirm');
      var nameEl = bookForm.querySelector('[name="name"]');
      var typeEl = bookForm.querySelector('[name="type"]');
      var dateEl = bookForm.querySelector('[name="date"]');
      var who = (nameEl && nameEl.value.trim()) || 'there';
      var kind = (typeEl && typeEl.value) || 'your request';
      var when = dateEl && dateEl.value ? ' for ' + dateEl.value : '';
      if (out) {
        out.hidden = false;
        out.innerHTML =
          '<strong>Thanks, ' + escapeHtml(who) + '! Your request is in.</strong>' +
          'We received your details for ' + escapeHtml(kind) + escapeHtml(when) + ' and will get right back to confirm availability.';
      }
      bookForm.reset();
    });
  }

  function showToast(msg) {
    var t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(function () {
      t.classList.remove('show');
    }, 2100);
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Live shop open/closed pill in the business's real local timezone
  function updateLiveStatus() {
    var pill = document.getElementById('liveStatus');
    var txt = document.getElementById('liveStatusText');
    if (!pill || !txt || !cfg.tz || !cfg.hours) return;
    try {
      var now = new Date();
      var parts = new Intl.DateTimeFormat('en-US', {
        timeZone: cfg.tz,
        weekday: 'short',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
      }).formatToParts(now);
      var map = {};
      for (var i = 0; i < parts.length; i++) map[parts[i].type] = parts[i].value;
      var days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      var d = days[map.weekday];
      var h = parseInt(map.hour, 10);
      if (h === 24) h = 0;
      var mins = h * 60 + parseInt(map.minute, 10);
      var slot = cfg.hours[d];
      if (slot && mins >= slot[0] && mins < slot[1]) {
        pill.classList.remove('is-closed');
        txt.textContent = 'Open now · Until ' + fmtTime(slot[1]);
      } else {
        pill.classList.add('is-closed');
        if (slot && mins < slot[0]) {
          txt.textContent = 'Opens today at ' + fmtTime(slot[0]);
        } else {
          var nextDay = null;
          for (var step = 1; step <= 7; step++) {
            var idx = (d + step) % 7;
            if (cfg.hours[idx]) {
              nextDay = { step: step, idx: idx, open: cfg.hours[idx][0] };
              break;
            }
          }
          var names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          txt.textContent = nextDay
            ? 'Opens ' + (nextDay.step === 1 ? 'tomorrow ' : names[nextDay.idx] + ' ') + fmtTime(nextDay.open)
            : (cfg.fallbackHours || 'See hours below');
        }
      }
    } catch (err) {}
  }

  function fmtTime(m) {
    var h = Math.floor(m / 60);
    var min = m % 60;
    var ap = h >= 12 ? 'pm' : 'am';
    var h12 = h % 12 || 12;
    return h12 + (min ? ':' + (min < 10 ? '0' + min : min) : '') + ap;
  }

  updateLiveStatus();

  // Header scroll state + progress bar
  var header = document.querySelector('.site-header');
  var bar = document.querySelector('.scroll-progress');
  function onScroll() {
    var y = window.scrollY || window.pageYOffset || 0;
    if (header) header.classList.toggle('scrolled', y > 16);
    if (bar) {
      var max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      bar.style.transform = 'scaleX(' + Math.min(Math.max(y / max, 0), 1) + ')';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Scroll reveal with safe fallback so nothing ever stays hidden
  var items = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && items.length) {
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          entries[i].target.classList.add('in');
          io.unobserve(entries[i].target);
        }
      }
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0.06 });
    for (var r = 0; r < items.length; r++) io.observe(items[r]);
    window.setTimeout(function () {
      for (var f = 0; f < items.length; f++) {
        var rect = items[f].getBoundingClientRect();
        if (rect.top < window.innerHeight + 120) items[f].classList.add('in');
      }
    }, 700);
  } else {
    for (var a = 0; a < items.length; a++) items[a].classList.add('in');
  }

  renderBag();
})();

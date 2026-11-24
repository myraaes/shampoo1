/* ==========================================================================
   SHAMPOO - Shared Application Logic (product.html, order.html, admin.html)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Product Page Logic (product.html)
  if (document.getElementById('product-list')) {
    initProductPage();
  }

  // 2. Order Page Logic (order.html)
  if (document.getElementById('orderForm')) {
    initOrderPage();
  }

  // 3. Admin Page Logic (admin.html)
  if (document.getElementById('ordersTable')) {
    initAdminPage();
  }
});

/* ==========================================================================
   1. PRODUCT PAGE (product.html)
   ========================================================================== */

let allProducts = [];

async function initProductPage() {
  const filterBar = document.getElementById('filter-bar');
  const productList = document.getElementById('product-list');

  // Read initial mood from URL parameter (?mood=xxx)
  const urlParams = new URLSearchParams(window.location.search);
  const initialMood = (urlParams.get('mood') || 'all').toLowerCase();

  // Render filter buttons if #filter-bar exists
  if (filterBar) {
    const moods = [
      { key: 'all', label: 'ทั้งหมด' },
      { key: 'flower', label: 'Flower' },
      { key: 'fruity', label: 'Fruity' },
      { key: 'herbal', label: 'Herbal' }
    ];

    filterBar.innerHTML = moods
      .map(
        (m) => `
        <button type="button" 
                class="filter-btn ${initialMood === m.key ? 'active' : ''}" 
                data-filter="${m.key}">
          ${m.label}
        </button>
      `
      )
      .join('');

    filterBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;

      const selectedMood = btn.dataset.filter;

      // Update active button state
      filterBar.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      // Update URL parameter without reloading page
      const newUrl = new URL(window.location);
      if (selectedMood === 'all') {
        newUrl.searchParams.delete('mood');
      } else {
        newUrl.searchParams.set('mood', selectedMood);
      }
      window.history.replaceState({}, '', newUrl);

      renderProducts(selectedMood);
    });
  }

  // Fetch products.json
  try {
    const response = await fetch('products.json');
    if (!response.ok) throw new Error('Failed to load products.json');
    allProducts = await response.json();
    renderProducts(initialMood);
  } catch (error) {
    console.error('Error loading products:', error);
    productList.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">ไม่สามารถโหลดรายการสินค้าได้ กรุณาลองใหม่อีกครั้ง</p>';
  }
}

function renderProducts(moodFilter) {
  const productList = document.getElementById('product-list');
  if (!productList) return;

  const filtered =
    moodFilter === 'all'
      ? allProducts
      : allProducts.filter((p) => p.mood && p.mood.toLowerCase() === moodFilter);

  if (filtered.length === 0) {
    productList.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">ไม่พบสินค้าในหมวดหมู่นี้</p>';
    return;
  }

  productList.innerHTML = filtered
    .map((product) => {
      const itemLabel = `${product.name} ${product.size}`;
      const orderUrl = `order.html?item=${encodeURIComponent(itemLabel)}&price=${encodeURIComponent(product.price)}`;
      const moodCapitalized = product.mood
        ? product.mood.charAt(0).toUpperCase() + product.mood.slice(1)
        : '';

      return `
        <article class="product-card" data-mood="${escapeHtml(product.mood || '')}">
          <div class="product-image-wrap">
            <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy">
            <span class="product-size-badge">${escapeHtml(product.size)}</span>
          </div>
          <div class="product-body">
            <div class="mood-indicator">
              <span class="mood-dot"></span>
              <span>${escapeHtml(moodCapitalized)}</span>
            </div>
            <h3 class="product-title">${escapeHtml(product.name)}</h3>
            <div class="mood-underline"></div>
            <p class="product-desc">${escapeHtml(product.description || '')}</p>
            <div class="product-footer">
              <span class="product-price">฿${Number(product.price).toLocaleString()}</span>
              <a href="${orderUrl}" class="btn">สั่งซื้อ</a>
            </div>
          </div>
        </article>
      `;
    })
    .join('');
}

/* ==========================================================================
   2. ORDER PAGE (order.html)
   ========================================================================== */

function initOrderPage() {
  const orderForm = document.getElementById('orderForm');
  const itemsInput = document.getElementById('items');
  const totalInput = document.getElementById('total');

  // Auto-fill item and price from URL parameters immediately on load
  const urlParams = new URLSearchParams(window.location.search);
  const itemParam = urlParams.get('item');
  const priceParam = urlParams.get('price');

  if (itemsInput && itemParam !== null) {
    itemsInput.value = itemParam;
  }
  if (totalInput && priceParam !== null) {
    totalInput.value = priceParam;
  }

  // Handle form submission
  orderForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const submitBtn = orderForm.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'กำลังส่งคำสั่งซื้อ...';
    }

    const payload = {
      customerName: document.getElementById('customerName')?.value.trim() || '',
      contact: document.getElementById('contact')?.value.trim() || '',
      items: document.getElementById('items')?.value.trim() || '',
      total: document.getElementById('total')?.value.trim() || '',
      note: document.getElementById('note')?.value.trim() || ''
    };

    fetch('https://script.google.com/macros/s/AKfycbyIyiGm7rC_EPFluQi6SV4q4Sf4XXESC_gOZBan7xM_nCsYYMbQrOk_lCs_D2LyGhxjrA/exec', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
      .then(() => {
        window.location.href = 'thankyou.html';
      })
      .catch((error) => {
        console.error(error);
        alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'ยืนยันสั่งซื้อ';
        }
      });
  });
}

/* ==========================================================================
   3. ADMIN PAGE (admin.html)
   ========================================================================== */

async function initAdminPage() {
  const tbody = document.querySelector('#ordersTable tbody');
  if (!tbody) return;

  const csvUrl =
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vT1sRSatohaOWduUDWlFfU9XHRkgVCu218qNjE2bb-3UPxHcdyU2AWGM1KZkip_tHux2fUjdUtqDaR_/pub?gid=0&single=true&output=csv';

  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem;">กำลังโหลดข้อมูลคำสั่งซื้อ...</td></tr>';

  try {
    const response = await fetch(csvUrl);
    if (!response.ok) throw new Error('Failed to fetch CSV data');
    const csvText = await response.text();

    const rows = parseCSV(csvText);

    // Expect row 0 to be headers; data starts from row 1
    if (rows.length <= 1) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem;">ยังไม่มีรายการสั่งซื้อ</td></tr>';
      return;
    }

    // Extract data rows and reverse to show latest orders first
    const dataRows = rows
      .slice(1)
      .filter((row) => row.some((cell) => cell.trim() !== ''))
      .reverse();

    tbody.innerHTML = dataRows
      .map((row) => {
        const timestamp = row[0] || '-';
        const customerName = row[1] || '-';
        const contact = row[2] || '-';
        const items = row[3] || '-';
        const total = row[4] || '-';
        const note = row[5] || '-';

        return `
          <tr>
            <td>${escapeHtml(timestamp)}</td>
            <td>${escapeHtml(customerName)}</td>
            <td>${escapeHtml(contact)}</td>
            <td>${escapeHtml(items)}</td>
            <td>${escapeHtml(total)}</td>
            <td>${escapeHtml(note)}</td>
          </tr>
        `;
      })
      .join('');
  } catch (error) {
    console.error('Error loading admin orders:', error);
    tbody.innerHTML =
      '<tr><td colspan="6" style="text-align:center; padding: 2rem; color: #967953;">เกิดข้อผิดพลาดในการโหลดข้อมูลคำสั่งซื้อ</td></tr>';
  }
}

/**
 * Custom CSV Parser (Handles quoted strings, commas inside quotes, and newlines)
 */
function parseCSV(csvText) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped double quote ("")
        currentField += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentField.trim());
      rows.push(currentRow);
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  // Push remaining field/row if file does not end with a newline
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    rows.push(currentRow);
  }

  return rows;
}

/* ==========================================================================
   Utility: HTML Escaping for XSS Protection
   ========================================================================== */

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

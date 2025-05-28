const nf = new Intl.NumberFormat('en-US');

layer.on('status', function (e) {
  if (e.type === 'lock') {
    e.message ? hideResizeHandle() : displayResizeHandle();
  }
});

function displayResizeHandle() {
  document.documentElement.classList.add("resizeHandle");
}

function hideResizeHandle() {
  document.documentElement.classList.remove("resizeHandle");
}

document.addEventListener('DOMContentLoaded', function () {
  const q = new URLSearchParams(this.location.search);
  const overrideStyle = q.get('selfStyle') || null;
  window.overrideStyle = overrideStyle;

  if (q.get('font') === 'kr') {
    document.documentElement.setAttribute('lang', 'kr');
  }

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'customGradients.css';
  link.onload = () => {
    layer.connect();
    layer.on('data', updateDPSMeter);
  };
  document.head.appendChild(link);

  setupZoomControls();
});

let popperInstance = null;

function parseAnyNumberFormat(value) {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'number') return value;
  if (value === '∞') return 0;

  const stringValue = String(value);
  if (stringValue.includes('.') && stringValue.includes(',')) {
    if (stringValue.lastIndexOf('.') < stringValue.lastIndexOf(',')) {
      return Number(stringValue.replace(/\./g, '').replace(',', '.'));
    } else {
      return Number(stringValue.replace(/,/g, ''));
    }
  }
  if (stringValue.includes('.') && !stringValue.includes(',')) {
    if ((stringValue.match(/\./g) || []).length > 1) {
      return Number(stringValue.replace(/\./g, ''));
    }
    return Number(stringValue);
  }
  if (stringValue.includes(',') && !stringValue.includes('.')) {
    if ((stringValue.match(/,/g) || []).length > 1) {
      return Number(stringValue.replace(/,/g, ''));
    }
    return Number(stringValue.replace(',', '.'));
  }
  return Number(stringValue);
}

function styleClassExists(className) {
  return [...document.styleSheets].some(sheet => {
    try {
      return [...sheet.cssRules].some(rule =>
        rule.selectorText === `.${className}`
      );
    } catch (e) {
      return false;
    }
  });
}

function updateDPSMeter(data) {
  document.getElementById('boss-name').innerText = data.Encounter.title || 'No Data';
  let table = document.getElementById('combatantTable');
  table.innerHTML = '';

  let combatants = Object.values(data.Combatant);

  combatants.forEach(combatant => {
    combatant.damageValue = parseAnyNumberFormat(combatant.damage);
    combatant.dpsValue = parseAnyNumberFormat(combatant.DPS || combatant.encdps || 0);
    combatant.damagePercent = parseAnyNumberFormat(String(combatant['damage%'] || '').replace('%', ''));
  });

  combatants.sort((a, b) => b.damageValue - a.damageValue);
  const maxDamage = Math.max(...combatants.map(c => c.damageValue || 0));

  combatants.forEach(combatant => {
    const currentDamage = combatant.damageValue || 0;
    const widthPercentage = maxDamage > 0 ? (currentDamage / maxDamage) * 100 : 0;

    let playerDiv = document.createElement('div');
    playerDiv.setAttribute('data-player', combatant.name);
    playerDiv.classList.add('player');

    let dpsBar = document.createElement('div');
    dpsBar.className = 'dps-bar';

    let gradientBg = document.createElement('div');
    gradientBg.className = 'gradient-bg';


    const hasCustomGradients = style =>
      style?.toLowerCase() === 'ryiki' ||
      style?.toLowerCase() === 'cayreah';

    const override = window.overrideStyle ? window.overrideStyle.toLowerCase() : null;
    const overrideClass = override ? `${override}-gradient` : null;
    const isSelf = combatant.name === 'You';

    if (isSelf && override && hasCustomGradients(override)) {
      gradientBg.classList.add(overrideClass);
    } else if (isSelf) {
      playerDiv.classList.add('you');
    }

    if (
      !isSelf &&
      hasCustomGradients(combatant.name) &&
      combatant.name.toLowerCase() === override
    ) {
      gradientBg.classList.add(overrideClass);
    }

    gradientBg.style.clipPath = `inset(0 ${100 - widthPercentage}% 0 0)`;

    let barContent = document.createElement('div');
    barContent.className = 'bar-content';

    const name = document.createElement('span');
    name.className = 'dps-bar-label';

    if (
      combatant.name === 'Ryiki' || 
      (isSelf && override === 'ryiki')
    ) {
      name.innerHTML = `${combatant.name} <img src="icons/Nerik_logo.png" class="player-icon" />`;
    } else {
      name.textContent = combatant.name;
    }

    const dps = document.createElement('span');
    dps.className = 'dps-bar-value';
    dps.textContent = `${nf.format(combatant.dpsValue)}/sec`;

    barContent.appendChild(name);
    barContent.appendChild(dps);
    dpsBar.appendChild(gradientBg);
    dpsBar.appendChild(barContent);
    playerDiv.appendChild(dpsBar);
    table.appendChild(playerDiv);
  });
}

function setupZoomControls() {
  const zoomOutBtn = document.getElementById('zoom-out');
  const zoomInBtn = document.getElementById('zoom-in');
  const root = document.documentElement;

  let currentZoom = 100;
  const minZoom = 50;
  const maxZoom = 200;
  const zoomStep = 10;

  const savedZoom = localStorage.getItem('dpsMeterZoom');
  if (savedZoom) {
    currentZoom = parseInt(savedZoom);
    applyZoom();
  }

  function applyZoom() {
    root.style.fontSize = `${currentZoom / 100}rem`;
    localStorage.setItem('dpsMeterZoom', currentZoom);
  }

  zoomOutBtn.addEventListener('click', () => {
    currentZoom = Math.max(minZoom, currentZoom - zoomStep);
    applyZoom();
  });

  zoomInBtn.addEventListener('click', () => {
    currentZoom = Math.min(maxZoom, currentZoom + zoomStep);
    applyZoom();
  });

  document.querySelectorAll('.zoom-btn').forEach(element => {
    element.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      e.preventDefault();
    });
  });
}

document.removeEventListener('DOMContentLoaded', setupZoomControls);

const nf = new Intl.NumberFormat('en-US');

const customStyles = {
  "Ryiki": {
    style: 'ryiki-gradient',
    icon: 'icons/Nerik_logo.png'
  },
  "GrimWLock": {
    style: 'grimwlock-gradient',
    icon: 'icons/Grim_icon.png'
  },
  "Kissy": {
    style: 'kircsi-gradient',
    icon: 'icons/Kircsi_icon.png'
  },
  "Gábor": {
    style: 'gabor-gradient',
    //icon: 'icons/Kircsi_icon.png'
  },
  "Tokita Kazu": {
    style: 'tokita-gradient',
    //icon: 'icons/Kircsi_icon.png'
  },
  // bővítés
};

const guildMembers = [
  "NiNl", "Kissy", "Ryiki", "Tokita Kazu", "Leyaress", "Kitsunetsuki", "obzoR", "Lootoneesan",
  "Gábor", "Imfa", "Tokita Kei", "Lupi", "Entaa", "Rlyreen", "GrimWLock"
];


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
  let playerName;

  for (const combatant of combatants) {
    if (combatant.name === 'You') {
      let hit = combatant.maxhit || '';
      let match = hit.match(/\(as ([^)]+)\)/);
      if (match) {
        playerName = match[1];
        if (!guildMembers.includes(playerName)) {
          showPermissionDeny(table);
          return;
        }
      }
    }

    combatant.damageValue = parseAnyNumberFormat(combatant.damage);
    combatant.dpsValue = parseAnyNumberFormat(combatant.DPS || combatant.encdps || 0);
    combatant.damagePercent = parseAnyNumberFormat(String(combatant['damage%'] || '').replace('%', ''));
  }

  combatants.sort((a, b) => b.damageValue - a.damageValue);
  const maxDamage = Math.max(...combatants.map(c => c.damageValue || 0));

  combatants.forEach(combatant => {
    let playerDiv = document.createElement('div');
    playerDiv.setAttribute('data-player', combatant.name);
    playerDiv.classList.add('player');

    const currentDamage = combatant.damageValue || 0;
    const widthPercentage = maxDamage > 0 ? (currentDamage / maxDamage) * 100 : 0;

    let config = customStyles[combatant.name === 'You' ? playerName : combatant.name];
    let dpsBar = document.createElement('div');
    dpsBar.className = 'dps-bar';

    let gradientBg = document.createElement('div');
    gradientBg.className = 'gradient-bg';
    if (config?.style) {
      gradientBg.classList.add(config.style);
    } else if (combatant.name === 'You') {
      playerDiv.classList.add('you');
    }
    gradientBg.style.clipPath = `inset(0 ${100 - widthPercentage}% 0 0)`;

    let barContent = document.createElement('div');
    barContent.className = 'bar-content';

    const name = document.createElement('span');
    name.className = 'dps-bar-label';

    if (config?.icon) {
      name.innerHTML = `${combatant.name} <img src="${config.icon}" class="player-icon" />`;
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
  })
}

function showPermissionDeny(table) {
  let playerDiv = document.createElement('div');
  const warning = document.createElement('div');
  warning.className = 'guild-warning';
  warning.textContent = '© Only For Guild Members — Debauchery Tea Party';
  playerDiv.style.background = 'linear-gradient(to right, #66ad2d, #407508)';
  playerDiv.appendChild(warning);
  table.appendChild(playerDiv);
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

const nf = new Intl.NumberFormat('en-US')

layer.on('status', function (e) {
  if (e.type === 'lock') {
    e.message ? hideResizeHandle() : displayResizeHandle();
  }
});

function displayResizeHandle() {
  document.documentElement.classList.add("resizeHandle")
}

function hideResizeHandle() {
  document.documentElement.classList.remove("resizeHandle")
}

document.addEventListener('DOMContentLoaded', function () {
  const q = new URLSearchParams(this.location.search);

  if (q.get('font') === 'kr') {
    document.documentElement.setAttribute('lang', 'kr')
  }

  const style = document.createElement('style');
  style.textContent = `
    .rgb-gradient {
      background: linear-gradient(-45deg, #ff0000, #ff8000, #ffff00, #00ff00, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff) !important;
      background-size: 200% 200% !important;
      animation: gradientFlow 6s ease infinite;
      opacity: 0.9;
    }

    .ryiki-gradient {
    background: #ff0000;
    background: linear-gradient(
      32deg,
      rgba(255, 0, 0, 1) 0%,
      rgba(255, 102, 102, 1) 50%,
      rgba(255, 255, 255, 1) 100%
    ) !important;
    opacity: 0.9;
  }
    @keyframes gradientFlow {
      0% { background-position: 0% 50%; }
      25% { background-position: 100% 0%; }
      50% { background-position: 100% 100%; }
      75% { background-position: 0% 100%; }
      100% { background-position: 0% 50%; }
    }
  `;
  document.head.appendChild(style);

  layer.connect();
  layer.on('data', updateDPSMeter);

  setupZoomControls();
})

let popperInstance = null

function parseAnyNumberFormat(value) {
  if (value === undefined || value === null || value === '') {
    return 0;
  }
  
  if (typeof value === 'number') {
    return value;
  }
  
  if (value === '∞') {
    return 0;
  }
  
  const stringValue = String(value);
  
  if (stringValue.includes('.') && stringValue.includes(',')) {
    if (stringValue.lastIndexOf('.') < stringValue.lastIndexOf(',')) {
      return Number(stringValue.replace(/\./g, '').replace(',', '.'));
    } 
    else {
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

function updateDPSMeter(data) {
  document.getElementById('boss-name').innerText = data.Encounter.title || 'No Data'

  let table = document.getElementById('combatantTable')
  table.innerHTML = ''

  let combatants = Object.values(data.Combatant)
  
  combatants.forEach(combatant => {
    combatant.damageValue = parseAnyNumberFormat(combatant.damage);
    
    if (combatant.DPS !== undefined) {
      combatant.dpsValue = parseAnyNumberFormat(combatant.DPS);
    } else if (combatant.encdps !== undefined) {
      combatant.dpsValue = parseAnyNumberFormat(combatant.encdps);
    } else {
      combatant.dpsValue = 0;
    }
    
    if (combatant['damage%'] !== undefined) {
      const damagePercentStr = String(combatant['damage%']).replace('%', '');
      combatant.damagePercent = parseAnyNumberFormat(damagePercentStr);
    } else {
      combatant.damagePercent = 0;
    }
  })
  
  combatants.sort((a, b) => b.damageValue - a.damageValue)

  const maxDamage = combatants.length > 0 
    ? Math.max(...combatants.map(c => c.damageValue || 0)) 
    : 0

  combatants.forEach((combatant) => {
    const currentDamage = combatant.damageValue || 0
    const widthPercentage = maxDamage > 0 
      ? (currentDamage / maxDamage) * 100 
      : 0

    let playerDiv = document.createElement('div')
    
    playerDiv.setAttribute('data-player', combatant.name)
    // playerDiv.addEventListener('mouseenter', (event) => showSkills(combatant, event))
    // playerDiv.addEventListener('mouseleave', hideSkills)
    
    playerDiv.classList.add('player')

    const hasCustomGradient = 
      //combatant.name === 'Cayreah' ||
      combatant.name === 'Ryiki';


    if ((combatant.name === 'You' || combatant.isSelf === 'true') && !hasCustomGradient) {
      playerDiv.classList.add('you')
    }

    let dpsBar = document.createElement('div')
    dpsBar.className = 'dps-bar'

    let gradientBg = document.createElement('div')
    gradientBg.className = 'gradient-bg'
    
    if (combatant.name === 'Ryiki') {
      gradientBg.classList.add('ryiki-gradient')
    }

    gradientBg.style.clipPath = `inset(0 ${100 - widthPercentage}% 0 0)`
    
    let barContent = document.createElement('div')
    barContent.className = 'bar-content'

    const name = document.createElement('span')
    name.className = 'dps-bar-label'
    
    if (combatant.name === 'Ryiki') {
      name.innerHTML = combatant.name + ' <img src="./Nerik_logo.png" style="width: 1.5rem; height: 1.5rem; vertical-align: middle;" />'
    }
    else {
      name.textContent = combatant.name
    }

    const dps = document.createElement('span')
    dps.className = 'dps-bar-value'
    dps.textContent = `${nf.format(combatant.dpsValue)}/sec`

    barContent.appendChild(name)
    barContent.appendChild(dps)
    dpsBar.appendChild(gradientBg)
    dpsBar.appendChild(barContent)
    playerDiv.appendChild(dpsBar)
    table.appendChild(playerDiv)
  })
}

function showSkills(combatant, event) {
  const skillDetails = document.getElementById('skill-details')
  const referenceElement = {
    getBoundingClientRect: () => ({
      width: 0,
      height: 0,
      top: event.clientY,
      right: event.clientX,
      bottom: event.clientY,
      left: event.clientX,
    }),
  }

  let skillHTML = `
      <div class="skill-summary">Total Damage: ${combatant['damage-*']} (${combatant['damage%']})</div>
      <div class="skill-summary">Hits: ${combatant['hits']}</div>
      <div class="skill-summary">Total Crit %: ${combatant['crithit%']}</div>
      <div class="skill-summary">Max Hit: ${combatant['maxhit-*']}</div>
      <div class="skill-labels">
          <span>Skill</span>
          <span>Hits</span>
          <span>Crit %</span>
          <span>Damage</span>
      </div>`
      
  skillHTML += `<div class="skill">No skill data available</div>`
  skillDetails.innerHTML = skillHTML
  skillDetails.style.display = 'block'

  if (popperInstance) {
    popperInstance.destroy()
  }

  popperInstance = Popper.createPopper(referenceElement, skillDetails, {
    placement: 'right-start',
    modifiers: [
      {
        name: 'offset',
        options: {
          offset: [0, 10],
        },
      },
      {
        name: 'preventOverflow',
        options: {
          padding: 10,
        },
      },
      {
        name: 'flip',
        options: {
          padding: 10,
        },
      },
    ],
  })
}

function hideSkills() {
  const skillDetails = document.getElementById('skill-details')
  skillDetails.style.display = 'none'
  if (popperInstance) {
    popperInstance.destroy()
    popperInstance = null
  }
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

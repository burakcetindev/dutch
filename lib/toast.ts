export type ToastType = 'success' | 'warning' | 'error';

interface ToastOptions {
  message: string;
  type: ToastType;
  duration?: number;
}

export function showToast({ message, type, duration = 3000 }: ToastOptions) {
  // Color schemes
  const colorConfig = {
    success: {
      gradient: ['bg-green-500', 'bg-emerald-500'],
      icon: '✨',
    },
    warning: {
      gradient: ['bg-yellow-500', 'bg-orange-500'],
      icon: '✏️',
    },
    error: {
      gradient: ['bg-red-500', 'bg-pink-500'],
      icon: '🗑️',
    },
  };

  const { gradient, icon } = colorConfig[type];

  // Create toast container
  const toastContainer = document.createElement('div');
  toastContainer.style.cssText = 'position: fixed; bottom: 24px; right: 24px; z-index: 9999;';

  // Create toast card
  const toastCard = document.createElement('div');
  toastCard.style.cssText = `
    min-width: 280px;
    max-width: 400px;
    padding: 12px 20px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(12px);
  `;
  
  // Set gradient background based on type
  if (type === 'success') {
    toastCard.style.background = 'linear-gradient(to right, #10b981, #059669)';
  } else if (type === 'warning') {
    toastCard.style.background = 'linear-gradient(to right, #f59e0b, #ea580c)';
  } else {
    toastCard.style.background = 'linear-gradient(to right, #ef4444, #ec4899)';
  }
  
  toastCard.classList.add('animate-toast-enter');

  // Create icon span
  const iconSpan = document.createElement('span');
  iconSpan.textContent = icon;
  iconSpan.style.fontSize = '20px';

  // Create message paragraph
  const messagePara = document.createElement('p');
  messagePara.textContent = message;
  messagePara.style.cssText = 'font-weight: 600; color: white; font-size: 14px; margin: 0;';

  // Assemble toast
  toastCard.appendChild(iconSpan);
  toastCard.appendChild(messagePara);
  toastContainer.appendChild(toastCard);
  document.body.appendChild(toastContainer);

  // Exit animation with split effect
  setTimeout(() => {
    toastCard.classList.remove('animate-toast-enter');
    
    // Split the toast into two halves
    const rect = toastCard.getBoundingClientRect();
    const leftHalf = toastCard.cloneNode(true) as HTMLElement;
    const rightHalf = toastCard.cloneNode(true) as HTMLElement;
    
    // Position and animate left half
    leftHalf.style.position = 'fixed';
    leftHalf.style.left = rect.left + 'px';
    leftHalf.style.top = rect.top + 'px';
    leftHalf.style.width = (rect.width / 2) + 'px';
    leftHalf.style.height = rect.height + 'px';
    leftHalf.style.overflow = 'hidden';
    leftHalf.style.animation = 'toastSplitLeft 0.5s ease-out forwards';
    
    // Position and animate right half
    rightHalf.style.position = 'fixed';
    rightHalf.style.left = (rect.left + rect.width / 2) + 'px';
    rightHalf.style.top = rect.top + 'px';
    rightHalf.style.width = (rect.width / 2) + 'px';
    rightHalf.style.height = rect.height + 'px';
    rightHalf.style.overflow = 'hidden';
    rightHalf.style.clipPath = 'inset(0 0 0 50%)';
    rightHalf.style.animation = 'toastSplitRight 0.5s ease-out forwards';
    
    // Hide original and add split halves
    toastCard.style.opacity = '0';
    document.body.appendChild(leftHalf);
    document.body.appendChild(rightHalf);
    
    // Create dust particles
    createDustEffect(toastCard, type);
    
    // Cleanup
    setTimeout(() => {
      toastContainer.remove();
      leftHalf.remove();
      rightHalf.remove();
    }, 500);
  }, duration);
}

function createDustEffect(element: Element, type: ToastType) {
  const rect = element.getBoundingClientRect();
  const particleCount = 12;
  
  const colors = {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  };

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    const angle = (Math.PI * 2 * i) / particleCount;
    const distance = 40 + Math.random() * 20;
    const dustX = Math.cos(angle) * distance;
    const dustY = Math.sin(angle) * distance;
    
    particle.style.cssText = `
      position: fixed;
      left: ${rect.right - 20}px;
      top: ${rect.top + rect.height / 2}px;
      width: 6px;
      height: 6px;
      background: ${colors[type]};
      border-radius: 50%;
      pointer-events: none;
      z-index: 10000;
      --dust-x: ${dustX}px;
      --dust-y: ${dustY}px;
    `;
    
    particle.classList.add('animate-dust-particle');
    document.body.appendChild(particle);
    
    setTimeout(() => particle.remove(), 600);
  }
}

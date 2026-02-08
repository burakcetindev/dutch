export type ToastType = 'success' | 'warning' | 'error';

interface ToastOptions {
  message: string;
  type: ToastType;
  duration?: number;
}

export function showToast({ message, type, duration = 3000 }: ToastOptions) {
  // Create toast container
  const toast = document.createElement('div');
  toast.className = `fixed bottom-6 right-6 z-[9999] max-w-md`;
  
  // Color schemes
  const colors = {
    success: {
      bg: 'from-green-500 to-emerald-500',
      text: 'text-white',
      icon: '✨',
    },
    warning: {
      bg: 'from-yellow-500 to-orange-500',
      text: 'text-white',
      icon: '✏️',
    },
    error: {
      bg: 'from-red-500 to-pink-500',
      text: 'text-white',
      icon: '🗑️',
    },
  };

  const { bg, text, icon } = colors[type];

  toast.innerHTML = `
    <div class="glass-card p-4 bg-gradient-to-r ${bg} backdrop-blur-md animate-toast-enter shadow-2xl">
      <div class="flex items-center gap-3">
        <span class="text-2xl">${icon}</span>
        <p class="font-semibold ${text} text-sm leading-relaxed">${message}</p>
      </div>
    </div>
  `;

  document.body.appendChild(toast);

  // Exit animation
  setTimeout(() => {
    const toastCard = toast.querySelector('div');
    if (toastCard) {
      toastCard.classList.add('animate-toast-exit');
      
      // Create dust particles
      createDustEffect(toastCard, type);
    }
    
    setTimeout(() => toast.remove(), 300);
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

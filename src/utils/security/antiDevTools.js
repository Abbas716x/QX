import { logSecurityEvent } from '../../lib/db/turso';

/**
 * Military-Grade Anti-DevTools & Anti-Tampering Engine
 * Aggressive debugger trap, keyboard shortcut neutralizer, and DOM integrity monitor.
 */

let onViolationCallback = null;
let isViolationActive = false;
let checkInterval = null;
let debuggerInterval = null;

export function registerViolationHandler(callback) {
  onViolationCallback = callback;
}

function triggerViolation(reason) {
  if (isViolationActive) return;
  isViolationActive = true;

  console.clear();
  if (onViolationCallback) {
    onViolationCallback(reason);
  }

  // Report attempt to Cloud DB Audit Log
  try {
    logSecurityEvent(
      "انتهاك أمني (Anti-DevTools)",
      `تم رصد محاولة وصول لأدوات المطورين: [${reason}] - ${new Date().toLocaleString('ar-IQ')}`
    );
  } catch (e) {
    // silent
  }
}

export function resetViolation() {
  isViolationActive = false;
}

export function initializeAntiDevTools() {
  if (typeof window === 'undefined') return;

  // 1. Neutralize Context Menu (Right Click)
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }, true);

  // 2. Neutralize DevTools Shortcuts
  document.addEventListener('keydown', (e) => {
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c', 'K', 'k'].includes(e.key)) ||
      (e.ctrlKey && ['U', 'u', 'S', 's'].includes(e.key)) ||
      (e.metaKey && e.altKey && ['I', 'i'].includes(e.key))
    ) {
      e.preventDefault();
      e.stopImmediatePropagation();
      triggerViolation(`Shortcut [${e.key}] blocked`);
      return false;
    }
  }, true);

  // 3. Window Dimensions Detection (Detect docked DevTools)
  const threshold = 160;
  checkInterval = setInterval(() => {
    const widthDiff = window.outerWidth - window.innerWidth > threshold;
    const heightDiff = window.outerHeight - window.innerHeight > threshold;
    if (widthDiff || heightDiff) {
      triggerViolation("Docked DevTools Dimension Anomaly");
    }
  }, 1200);

  // 4. Aggressive Debugger Loop Trap (Freezes browser if DevTools is opened)
  debuggerInterval = setInterval(() => {
    const startTime = performance.now();
    // eslint-disable-next-line no-debugger
    debugger;
    const endTime = performance.now();
    if (endTime - startTime > 150) {
      triggerViolation("Debugger execution delay detected");
    }
  }, 2000);

  // 5. Console object property trap
  try {
    const element = Object.defineProperties(new Image(), {
      id: {
        get: function () {
          triggerViolation("Console Image-getter inspection trap");
          return 'anti-tamper';
        }
      }
    });
    console.log('%c', element);
  } catch (e) {
    // silent
  }
}

export function cleanupAntiDevTools() {
  if (checkInterval) clearInterval(checkInterval);
  if (debuggerInterval) clearInterval(debuggerInterval);
}

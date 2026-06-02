let scannerInstance = null;

function cleanDigits(str) {
  return str.replace(/\D/g, '');
}

export function parseBoletoCode(code) {
  const digits = cleanDigits(code);
  if (digits.length !== 44 && digits.length !== 47) return null;

  let bankCode, factor, valueRaw;
  if (digits.length === 44) {
    bankCode = digits.substring(0, 3);
    factor = digits.substring(5, 9);
    valueRaw = digits.substring(9, 19);
  } else {
    bankCode = digits.substring(0, 3);
    factor = digits.substring(32, 36);
    valueRaw = digits.substring(37, 47);
  }

  const factorDays = parseInt(factor, 10);
  const value = parseInt(valueRaw, 10) / 100;

  let dueDate = null;
  if (factorDays > 0) {
    const base = new Date(1997, 9, 7);
    dueDate = new Date(base.getTime() + factorDays * 86400000);
  }

  return { bankCode, value, valor: value, dueDate };
}

export async function startScanner(elementId, onDetected) {
  if (scannerInstance) await stopScanner();

  const { Html5Qrcode } = await import('html5-qrcode');
  scannerInstance = new Html5Qrcode(elementId);

  const cameras = await Html5Qrcode.getCameras();
  const rearCam = cameras.find(c => c.label.toLowerCase().includes('back') || c.label.toLowerCase().includes('traseira'));
  const cameraId = rearCam ? rearCam.id : cameras[0]?.id;
  if (!cameraId) throw new Error('Nenhuma câmera encontrada');

  await scannerInstance.start(
    { deviceId: cameraId },
    { fps: 10, qrbox: { width: 300, height: 150 }, formatsToSupport: [1, 4, 8, 16, 64, 128, 256, 2048] },
    (decodedText) => {
      const parsed = parseBoletoCode(decodedText);
      if (parsed) {
        stopScanner();
        onDetected(parsed);
      }
    },
    () => {}
  );

  return scannerInstance;
}

export async function stopScanner() {
  if (scannerInstance) {
    try { await scannerInstance.stop(); } catch {}
    try { scannerInstance.clear(); } catch {}
    scannerInstance = null;
  }
}

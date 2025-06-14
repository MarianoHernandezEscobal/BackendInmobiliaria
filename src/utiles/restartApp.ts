export const restartApplication = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const { exec } = require('child_process');
      exec('pm2 restart all', (err, stdout, stderr) => {
        if (err) {
          console.error('[Facebook] Error al reiniciar la aplicación:', err);
          reject(err);
        } else {
          console.log('[Facebook] Servidor reiniciado con éxito.');
          resolve();
        }
      });
    });
  }
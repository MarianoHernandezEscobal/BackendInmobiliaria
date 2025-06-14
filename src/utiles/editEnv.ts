import { join } from "path";
import { promises as fs } from 'fs';

export const updateEnvFile = async (newValues: Record<string, string>): Promise<void>  =>{
    try {
      const envPath = join(process.cwd(), '.env');
      const envContent = await fs.readFile(envPath, 'utf-8');
      let updatedEnv = envContent;

      for (const [key, value] of Object.entries(newValues)) {
        const regex = new RegExp(`^${key}=.*`, 'm');
        if (regex.test(updatedEnv)) {
          updatedEnv = updatedEnv.replace(regex, `${key}=${value}`);
        } else {
          updatedEnv += `\n${key}=${value}`;
        }

        // 🔹 También actualiza la variable en el entorno actual
        process.env[key] = value;
      }

      await fs.writeFile(envPath, updatedEnv, 'utf-8');
      console.log('[Facebook] Archivo .env actualizado y variables de entorno modificadas.');
    } catch (error) {
      console.error('[Facebook] Error al actualizar .env:', error);
    }
  }
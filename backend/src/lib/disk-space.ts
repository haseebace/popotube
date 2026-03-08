import checkDiskSpace from 'check-disk-space';
import { logger } from './logger';
import path from 'path';

export async function hasEnoughDiskSpace(requiredSpaceBytes: number): Promise<{ hasSpace: boolean; availableSpaceBytes: number; message?: string }> {
  try {
    // Check the directory where qBittorrent saves files. 
    // Usually this matches the volume mount mapping or just the host system if local
    const downloadsPath = path.resolve(__dirname, '../../../downloads'); 
    // Fallback to root or current dir if we want a general system check, but downloads is best.
    
    // checkDiskSpace expects a path. '/' works for linux root. On mac, current dir or root works.
    // For safer cross-platform checks in docker or local, we can check the root '/' or the downloads dir.
    const diskSpace = await checkDiskSpace(downloadsPath).catch(() => checkDiskSpace('/'));

    const availableSpaceBytes = diskSpace.free;
    const paddingBytes = 5 * 1024 * 1024 * 1024; // 5 GB buffer padding for OS stability
    
    const requiredTotal = requiredSpaceBytes + paddingBytes;

    if (availableSpaceBytes < requiredTotal) {
      const msg = `Insufficient disk space. Required: ${(requiredTotal / 1e9).toFixed(2)}GB, Available: ${(availableSpaceBytes / 1e9).toFixed(2)}GB`;
      logger.warn(msg);
      return { hasSpace: false, availableSpaceBytes, message: msg };
    }

    return { hasSpace: true, availableSpaceBytes };
  } catch (error) {
    logger.error({ err: error }, 'Failed to check disk space');
    // If we crash checking space, fail safe by allowing it, or fail hard?
    // Failing safe is better for weird OS permission errors unless we strictly want to block
    return { hasSpace: true, availableSpaceBytes: 0, message: 'Disk space check failed, allowing by default' };
  }
}

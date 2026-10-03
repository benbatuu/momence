import { Queue, Worker } from 'bullmq';
import { redisConnection } from './redis';
import { LoggerService } from './logger';

// 1. Genel Kuyruk Tanımı
export const systemQueue = new Queue('system-events', {
  connection: redisConnection as any,
});

// 2. Local Arka Plan Worker (İş İşleyici)
export const systemWorker = new Worker(
  'system-events',
  async (job) => {
    LoggerService.audit({
      category: 'SYSTEM',
      action: `QUEUE_JOB_STARTED:${job.name}`,
      details: { jobId: job.id, data: job.data },
    });

    switch (job.name) {
      case 'SEND_WELCOME_EMAIL':
        // Local e-posta/SMS mock işlemi
        console.log(`📧 [MOCK EMAIL] Hoş geldin e-postası gönderildi -> ${job.data.email}`);
        break;

      case 'PROCESS_NIGHTLY_EXSPIRATIONS':
        console.log('🌙 Süresi dolan üye paketleri kontrol ediliyor...');
        break;

      default:
        console.log(`⚠️ Tanımlanamayan iş: ${job.name}`);
    }
  },
  { connection: redisConnection as any }
);

systemWorker.on('completed', (job) => {
  console.log(`✅ [Queue Job Completed] ID: ${job.id} - Name: ${job.name}`);
});

systemWorker.on('failed', (job, err) => {
  console.error(`❌ [Queue Job Failed] ID: ${job?.id} - Error: ${err.message}`);
});
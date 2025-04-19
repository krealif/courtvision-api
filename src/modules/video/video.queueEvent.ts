import { eq } from 'drizzle-orm';
import { DbClient } from '@/infra/db';
import { videos } from '@/infra/db/db.schema';
import { QueueManager } from '@/infra/queue/queue.manager';

interface VideoQueueEventDeps {
  db: DbClient;
  queueManager: QueueManager;
}

export default class VideoQueueEvent {
  private readonly db;
  private readonly queueManager;

  constructor({ db, queueManager }: VideoQueueEventDeps) {
    this.db = db;
    this.queueManager = queueManager;
  }

  init() {
    const queue = this.queueManager.getQueueEvent('test1Queue');

    queue.on('completed', ({ jobId }) => {
      void this.handleCompletedEvent(jobId);
    });

    queue.on('failed', ({ jobId }) => {
      void this.handleFailedEvent(jobId);
    });
  }

  private getVideoId(jobId: string) {
    const rgx = /^v(\d+)_/.exec(jobId);
    return rgx?.[1] ? parseInt(rgx[1]) : 0;
  }

  private async handleCompletedEvent(jobId: string) {
    const videoId = this.getVideoId(jobId);

    await this.db
      .update(videos)
      .set({
        status: 'completed',
      })
      .where(eq(videos.id, videoId));
  }

  private async handleFailedEvent(jobId: string) {
    const videoId = this.getVideoId(jobId);

    await this.db
      .update(videos)
      .set({
        status: 'failed',
      })
      .where(eq(videos.id, videoId));
  }
}

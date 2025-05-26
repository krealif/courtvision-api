import { eq } from 'drizzle-orm';
import { Value } from '@sinclair/typebox/value';
import { DbClient } from '@/infra/db';
import { VideoStatus, videos } from '@/infra/db/db.schema';
import { QueueManager } from '@/infra/queue/queue.manager';
import { VideoJobResultSchema } from './video.schema';

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
    const queue = this.queueManager.getQueueEvent('videoQueue');

    queue.on('active', ({ jobId }) => {
      void this.handleActiveEvent(jobId);
    });

    queue.on('completed', ({ jobId, returnvalue }) => {
      void this.handleCompletedEvent(jobId, returnvalue);
    });

    queue.on('failed', ({ jobId }) => {
      void this.handleFailedEvent(jobId);
    });
  }

  private getVideoId(jobId: string) {
    const rgx = /^v(\d+)_/.exec(jobId);
    return rgx?.[1] ? parseInt(rgx[1]) : 0;
  }

  private async handleActiveEvent(jobId: string) {
    const videoId = this.getVideoId(jobId);

    await this.db
      .update(videos)
      .set({
        status: VideoStatus.PROCESSING,
      })
      .where(eq(videos.id, videoId));
  }

  private async handleCompletedEvent(jobId: string, returnvalue: string) {
    const videoId = this.getVideoId(jobId);

    let result: unknown;

    try {
      result = JSON.parse(returnvalue);
    } catch (error) {
      console.error(error);
      await this.db
        .update(videos)
        .set({ status: VideoStatus.FAILED })
        .where(eq(videos.id, videoId));

      return;
    }

    if (!Value.Check(VideoJobResultSchema, result)) {
      await this.db
        .update(videos)
        .set({ status: VideoStatus.FAILED })
        .where(eq(videos.id, videoId));
      return;
    }

    await this.db
      .update(videos)
      .set({
        status: VideoStatus.COMPLETED,
        thumbnail_url: result.thumbnail_url,
        video_result: result.video_result,
        tracking_result: result.tracking_result,
        shot_result: result.shot_result,
      })
      .where(eq(videos.id, videoId));
  }

  private async handleFailedEvent(jobId: string) {
    const videoId = this.getVideoId(jobId);

    await this.db
      .update(videos)
      .set({
        status: VideoStatus.FAILED,
      })
      .where(eq(videos.id, videoId));
  }
}

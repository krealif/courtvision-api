import { JobProgress } from 'bullmq';
import { eq } from 'drizzle-orm';
import hyperid from 'hyperid';
import { DbClient } from '@/infra/db';
import { videos } from '@/infra/db/db.schema';
import { QueueManager } from '@/infra/queue/queue.manager';
import { CreateVideoBody, VideoJobData } from './video.schema';

interface VideoServiceDeps {
  db: DbClient;
  queueManager: QueueManager;
}

interface JobProgressCallbacks {
  onProgress: ({ jobId, data }: { jobId: string; data: JobProgress }) => void;
  onCompleted: ({ jobId }: { jobId: string }) => void;
  onFailed: ({ jobId }: { jobId: string }) => void;
}

export default class VideoService {
  private readonly db;
  private readonly queueManager;

  constructor({ db, queueManager }: VideoServiceDeps) {
    this.db = db;
    this.queueManager = queueManager;
  }

  async createVideo(
    userId: number,
    { title, video_url, date, venue }: CreateVideoBody,
  ) {
    const [result] = await this.db.insert(videos).values({
      user_id: userId,
      title,
      video_url,
      date: date ? new Date(date) : null,
      venue,
      status: 'waiting',
    });

    await this.queueManager.addJob<VideoJobData>('videoQueue', {
      name: 'asd',
      data: {
        id: result.insertId,
        video_url,
      },
      options: {
        jobId: `v${result.insertId}_${userId}-${hyperid()()}`,
      },
    });

    const video = await this.db.query.videos.findFirst({
      where: eq(videos.id, result.insertId),
    });

    return video;
  }

  async getVideosByUserId(userId: number) {
    const userVideos = await this.db.query.videos.findMany({
      where: eq(videos.user_id, userId),
    });

    return userVideos;
  }

  async getVideoById(videoId: number) {
    const video = await this.db.query.videos.findFirst({
      where: eq(videos.id, videoId),
    });

    return video;
  }

  async deleteVideo(videoId: number) {
    const [result] = await this.db.delete(videos).where(eq(videos.id, videoId));

    return result.affectedRows;
  }

  streamAllJobsProgress(callbacks: JobProgressCallbacks) {
    const queueEvents = this.queueManager.getQueueEvent('videoQueue');

    queueEvents.on('progress', callbacks.onProgress);
    queueEvents.on('completed', callbacks.onCompleted);
    queueEvents.on('failed', callbacks.onFailed);

    return () => {
      queueEvents.off('progress', callbacks.onProgress);
      queueEvents.off('completed', callbacks.onCompleted);
      queueEvents.off('failed', callbacks.onFailed);
    };
  }

  parseJobId(jobId: string) {
    const rgx = /^v(\d+)_(\d+)-/;
    const match = rgx.exec(jobId);

    if (match?.[1] && match?.[2]) {
      return {
        videoId: parseInt(match[1]),
        userId: parseInt(match[2]),
      };
    }

    return {
      videoId: 0,
      userId: 0,
    };
  }
}

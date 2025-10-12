import { AxiosInstance } from 'axios';
import { JobProgress, Queue, QueueEvents } from 'bullmq';
import { desc, eq } from 'drizzle-orm';
import hyperid from 'hyperid';
import { DbClient } from '@/infra/db';
import { VideoStatus, videos } from '@/infra/db/db.schema';
import { CreateVideoBody, VideoJobData } from './video.schema';

interface JobProgressCallbacks {
  onProgress: ({ jobId, data }: { jobId: string; data: JobProgress }) => void;
  onCompleted: ({ jobId }: { jobId: string }) => void;
  onFailed: ({ jobId }: { jobId: string }) => void;
}

export default class VideoService {
  constructor(
    private readonly db: DbClient,
    private readonly videoQueue: Queue<VideoJobData>,
    private readonly videoQueueEvents: QueueEvents,
    private readonly http: AxiosInstance,
  ) {}

  async create(
    userId: number,
    { title, video_url, date, venue }: CreateVideoBody,
  ) {
    const pathSegments = new URL(video_url).pathname.split('/').filter(Boolean);
    const objectKey = pathSegments.slice(1).join('/');

    const insertId = await this.db.transaction(async (tx) => {
      const [result] = await tx.insert(videos).values({
        user_id: userId,
        title,
        video_url: objectKey,
        date: date ? new Date(date) : null,
        venue,
        status: VideoStatus.WAITING,
      });

      await this.videoQueue.add(
        'analyse-video',
        {
          id: result.insertId,
          video_url: objectKey,
        },
        {
          jobId: `v${result.insertId}_${userId}-${hyperid()()}`,
        },
      );

      return result.insertId;
    });

    const video = await this.db.query.videos.findFirst({
      where: eq(videos.id, insertId),
    });

    return video;
  }

  async findAll(userId: number) {
    const userVideos = await this.db.query.videos.findMany({
      where: eq(videos.user_id, userId),
      orderBy: desc(videos.created_at),
    });

    return userVideos;
  }

  async findById(videoId: number) {
    const video = await this.db.query.videos.findFirst({
      where: eq(videos.id, videoId),
    });

    return video;
  }

  async findWithResultById(videoId: number) {
    const video = await this.db.query.videos.findFirst({
      where: eq(videos.id, videoId),
      with: {
        result: true,
      },
    });

    return video;
  }

  async delete(videoId: number) {
    const [result] = await this.db.delete(videos).where(eq(videos.id, videoId));

    return result.affectedRows;
  }

  subscribeToJobProgress(callbacks: JobProgressCallbacks) {
    const queueEvents = this.videoQueueEvents;

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

  async createSync(
    userId: number,
    { title, video_url, date, venue }: CreateVideoBody,
  ) {
    const pathSegments = new URL(video_url).pathname.split('/').filter(Boolean);
    const objectKey = pathSegments.slice(1).join('/');

    const [result] = await this.db.insert(videos).values({
      user_id: userId,
      title,
      video_url: objectKey,
      date: date ? new Date(date) : null,
      venue,
      status: VideoStatus.PROCESSING,
    });

    try {
      const job = await this.http.post(
        'http://127.0.0.1:8000/start',
        {
          id: result.insertId,
          url: objectKey,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (job.status == 200) {
        await this.db
          .update(videos)
          .set({
            status: VideoStatus.COMPLETED,
          })
          .where(eq(videos.id, result.insertId));
      } else {
        await this.db
          .update(videos)
          .set({
            status: VideoStatus.FAILED,
          })
          .where(eq(videos.id, result.insertId));
      }
    } catch {
      await this.db
        .update(videos)
        .set({
          status: VideoStatus.FAILED,
        })
        .where(eq(videos.id, result.insertId));
    }

    const video = await this.db.query.videos.findFirst({
      where: eq(videos.id, result.insertId),
    });

    return video;
  }
}

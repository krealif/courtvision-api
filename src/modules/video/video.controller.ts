import { FastifyReply, FastifyRequest } from 'fastify';
import { VideoStatus } from '@/infra/db/db.schema';
import { getDateString } from '@/utils/date.util';
import * as VideoSchema from './video.schema';
import VideoService from './video.service';

interface VideoControllerDeps {
  videoService: VideoService;
}

export default class VideoController {
  private readonly videoService;

  constructor({ videoService }: VideoControllerDeps) {
    this.videoService = videoService;
  }

  async createVideo(
    request: FastifyRequest<{
      Body: VideoSchema.CreateVideoBody;
      Reply: VideoSchema.CreateVideoResponse;
    }>,
    reply: FastifyReply<{ Reply: VideoSchema.CreateVideoResponse }>,
  ) {
    const { id: userId } = request.user;
    const video = await this.videoService.createVideo(userId, request.body);

    if (!video) {
      return reply.internalServerError();
    }

    return reply.code(201).send({
      statusCode: 201,
      message: 'Video created successfully.',
      data: {
        video: {
          ...video,
          date: video.date ? getDateString(video.date) : undefined,
          venue: video.venue ?? undefined,
        },
      },
    });
  }

  async getUserVideos(
    request: FastifyRequest<{ Reply: VideoSchema.GetListVideosResponse }>,
    reply: FastifyReply<{ Reply: VideoSchema.GetListVideosResponse }>,
  ) {
    const { id: userId } = request.user;
    const videos = await this.videoService.getVideosByUserId(userId);

    return reply.code(200).send({
      statusCode: 200,
      message: 'msg',
      data: {
        videos: videos.map((video) => ({
          ...video,
          date: video.date ? getDateString(video.date) : undefined,
          venue: video.venue ?? undefined,
        })),
      },
    });
  }

  async getVideoById(
    request: FastifyRequest<{
      Params: VideoSchema.VideoIdParams;
      Reply: VideoSchema.GetVideoResponse;
    }>,
    reply: FastifyReply<{ Reply: VideoSchema.GetVideoResponse }>,
  ) {
    const { id: videoId } = request.params;
    const { id: userId } = request.user;

    const video = await this.videoService.getVideoById(videoId);

    if (!video) {
      return reply.notFound();
    }

    if (video.user_id !== userId) {
      return reply.forbidden();
    }

    return reply.code(200).send({
      statusCode: 200,
      message: 'msg',
      data: {
        video: {
          ...video,
          date: video.date ? getDateString(video.date) : undefined,
          venue: video.venue ?? undefined,
        },
      },
    });
  }

  async deleteVideo(
    request: FastifyRequest<{ Params: VideoSchema.VideoIdParams }>,
    reply: FastifyReply,
  ) {
    const { id: videoId } = request.params;
    const { id: userId } = request.user;

    const video = await this.videoService.getVideoById(videoId);

    if (!video) {
      return reply.notFound();
    }

    if (video.user_id !== userId) {
      return reply.forbidden();
    }

    await this.videoService.deleteVideo(video.id);

    return reply.code(204).send();
  }

  streamAllJobsProgress(request: FastifyRequest, reply: FastifyReply) {
    const { id: authId } = request.user;

    const handleJobEvent = (
      jobId: string,
      payload: Record<string, unknown>,
    ) => {
      const { videoId, userId } = this.videoService.parseJobId(jobId);
      if (authId == userId)
        reply.sse({
          data: JSON.stringify({ video: { id: videoId, ...payload } }),
        });
    };

    const unsubscribe = this.videoService.streamAllJobsProgress({
      onProgress: ({ jobId, data }) =>
        handleJobEvent(jobId, {
          status: VideoStatus.PROCESSING,
          progress: data,
        }),
      onCompleted: ({ jobId }) =>
        handleJobEvent(jobId, { status: VideoStatus.COMPLETED }),
      onFailed: ({ jobId }) =>
        handleJobEvent(jobId, { status: VideoStatus.FAILED }),
    });

    request.socket.on('close', unsubscribe);
  }
}

import { FastifyReply, FastifyRequest } from 'fastify';
import { CreateVideoBody } from './video.schema';
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
    request: FastifyRequest<{ Body: CreateVideoBody }>,
    reply: FastifyReply,
  ) {
    const { id: userId } = request.user;
    const video = await this.videoService.createVideo(userId, request.body);

    return reply.code(201).send({
      statusCode: 201,
      message: 'Video created successfully.',
      data: {
        video,
      },
    });
  }

  async getUserVideos(request: FastifyRequest, reply: FastifyReply) {
    const { id: userId } = request.user;
    const videos = this.videoService.getVideosByUserId(userId);

    return reply.code(200).send({
      statusCode: 200,
      message: 'msg',
      data: {
        videos,
      },
    });
  }

  async getVideoById(
    request: FastifyRequest<{ Params: { videoId: number } }>,
    reply: FastifyReply,
  ) {
    const { videoId } = request.params;
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
        video,
      },
    });
  }

  async deleteVideo(
    request: FastifyRequest<{ Params: { videoId: number } }>,
    reply: FastifyReply,
  ) {
    const { videoId } = request.params;
    const { id: userId } = request.user;

    const video = await this.videoService.getVideoById(videoId);

    if (!video) {
      return reply.send('aaa');
    }

    if (video.user_id !== userId) {
      return reply.forbidden();
    }

    await this.videoService.deleteVideo(video.id);

    return reply.code(204);
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
        handleJobEvent(jobId, { status: 'processing', progress: data }),
      onCompleted: ({ jobId }) =>
        handleJobEvent(jobId, { status: 'completed' }),
      onFailed: ({ jobId }) => handleJobEvent(jobId, { status: 'failed' }),
    });

    request.socket.on('close', unsubscribe);
  }
}

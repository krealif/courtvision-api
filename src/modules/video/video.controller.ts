import { format } from 'date-fns';
import { FastifyReply, FastifyRequest } from 'fastify';
import { VideoStatus } from '@/infra/db/db.schema';
import S3Service from '../s3/s3.service';
import * as VideoSchema from './video.schema';
import VideoService from './video.service';

export default class VideoController {
  constructor(
    private readonly videoService: VideoService,
    private readonly s3Service: S3Service,
  ) {}

  async create(
    request: FastifyRequest<{
      Body: VideoSchema.CreateVideoBody;
      Reply: VideoSchema.CreateVideoResponse;
    }>,
    reply: FastifyReply<{ Reply: VideoSchema.CreateVideoResponse }>,
  ) {
    const { id: userId } = request.user;
    const video = await this.videoService.create(userId, request.body);

    if (!video) return reply.internalServerError();

    return reply.code(201).send({
      statusCode: 201,
      message: 'Video created successfully.',
      data: {
        video: {
          ...video,
          date: video.date ? format(video.date, 'yyyy-MM-dd') : undefined,
          venue: video.venue ?? undefined,
          video_url: await this.s3Service.getPresignedDownloadUrl(
            video.video_url,
          ),
          created_at: video.created_at.toISOString(),
        },
      },
    });
  }

  async index(
    request: FastifyRequest<{ Reply: VideoSchema.IndexVideosResponse }>,
    reply: FastifyReply<{ Reply: VideoSchema.IndexVideosResponse }>,
  ) {
    const { id: userId } = request.user;
    const videos = await this.videoService.findAll(userId);

    const responseVideos = await Promise.all(
      videos.map(async (video) => ({
        ...video,
        date: video.date ? format(video.date, 'yyyy-MM-dd') : undefined,
        venue: video.venue ?? undefined,
        thumbnail_url: video.thumbnail_url
          ? await this.s3Service.getPresignedDownloadUrl(video.thumbnail_url)
          : undefined,
        created_at: video.created_at.toISOString(),
      })),
    );

    return reply.code(200).send({
      statusCode: 200,
      message: 'Videos retrieved successfully.',
      data: {
        videos: responseVideos,
      },
    });
  }

  async show(
    request: FastifyRequest<{
      Params: VideoSchema.VideoIdParams;
      Reply: VideoSchema.ShowVideoResponse;
    }>,
    reply: FastifyReply<{ Reply: VideoSchema.ShowVideoResponse }>,
  ) {
    const { id: videoId } = request.params;
    const { id: userId } = request.user;

    const video = await this.videoService.findById(videoId);

    if (!video) return reply.notFound();
    if (video.user_id !== userId) return reply.forbidden();

    const [video_url, thumbnail_url] = await Promise.all([
      this.s3Service.getPresignedDownloadUrl(video.video_url),
      video.thumbnail_url
        ? this.s3Service.getPresignedDownloadUrl(video.thumbnail_url)
        : undefined,
    ]);

    return reply.code(200).send({
      statusCode: 200,
      message: 'Video retrieved successfully.',
      data: {
        video: {
          ...video,
          date: video.date ? format(video.date, 'yyyy-MM-dd') : undefined,
          venue: video.venue ?? undefined,
          thumbnail_url,
          video_url,
          created_at: video.created_at.toISOString(),
        },
      },
    });
  }

  async showResult(
    request: FastifyRequest<{
      Params: VideoSchema.VideoIdParams;
      Reply: VideoSchema.ShowResultResponse;
    }>,
    reply: FastifyReply<{ Reply: VideoSchema.ShowResultResponse }>,
  ) {
    const { id: videoId } = request.params;
    const { id: userId } = request.user;

    const video = await this.videoService.findWithResultById(videoId);

    if (!video?.result) return reply.notFound();
    if (video.user_id !== userId) return reply.forbidden();

    const video_url = await this.s3Service.getPresignedDownloadUrl(
      video.result.video_url,
    );

    return reply.code(200).send({
      statusCode: 200,
      message: 'Video result retrieved successfully.',
      data: {
        result: {
          court_length_px: video.result.court_length_px,
          court_width_px: video.result.court_width_px,
          video_url,
          tracking: video.result.tracking,
          shot: video.result.shot,
        },
      },
    });
  }

  async delete(
    request: FastifyRequest<{ Params: VideoSchema.VideoIdParams }>,
    reply: FastifyReply,
  ) {
    const { id: videoId } = request.params;
    const { id: userId } = request.user;

    const video = await this.videoService.findWithResultById(videoId);

    if (!video) return reply.notFound();

    const allowedStatuses = [VideoStatus.COMPLETED, VideoStatus.FAILED];

    if (video.user_id !== userId || !allowedStatuses.includes(video.status))
      return reply.forbidden();

    await Promise.all([
      this.s3Service.deleteObject(video.video_url),
      video.thumbnail_url && this.s3Service.deleteObject(video.thumbnail_url),
      video.result && this.s3Service.deleteObject(video.result.video_url),
    ]);

    await this.videoService.delete(videoId);

    return reply.code(200).send({
      statusCode: 200,
      message: 'Video deleted successfully.',
    });
  }

  streamProgress(request: FastifyRequest, reply: FastifyReply) {
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

    const unsubscribe = this.videoService.subscribeToJobProgress({
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

export const user1 = {
  name: 'Alice',
  email: 'alice2@example.com',
  password: '$2b$10$GPbxrbtKSoyJa/52ECuOH.m1gsDbVNaCPP3t7gvAOS0dIDw0Yclim',
  plainPassword: 'Password123!',
};

export const user2 = {
  name: 'Bob',
  email: 'bob@example.com',
  password: '$2b$10$.yixkzPFJu1J8hwwqIZf5.u4gyODtknU3XLWCDvXMjg.VBuUu0Epu',
  plainPassword: 'Qwerty321!',
};

export const videoResult = {
  court_length_px: 940,
  court_width_px: 500,
  video_url: 'https://example.com/video.mp4',
  tracking: [
    {
      frame: 100,
      player_id: 23,
      team_id: 1,
      x: 320.5,
      y: 250.75,
    },
  ],
  shot: [
    {
      frame: 102,
      player_id: 23,
      team_id: 1,
      result: 'made',
      player_coords: {
        x: 325.0,
        y: 255.0,
      },
      ball_coords: {
        x: 330.0,
        y: 260.0,
      },
    },
  ],
};

import { Router, Request, Response } from 'express';
import openai from './openaiClient';

const router = Router();

// POST /api/story - generate a story based on user input
router.post('/story', (req: Request, res: Response): void => {
  const { briefing, numScenes } = req.body;
  if (!briefing || !numScenes) {
    res
      .status(400)
      .json({ error: 'Missing required fields: briefing, numScenes' });
    return;
  }
  // Prompt engineering for story structure
  const prompt = `Create a linear interactive story based on the following briefing: "${briefing}". The story should have ${numScenes} scenes. For each scene, provide:\n- Scene description\n- Character dialogue (if any)\n- Narration (if any)\nReturn ONLY valid minified JSON (no markdown, no explanation, no code block, no extra text) as a JSON array of scenes, each with a description, dialogue, and narration fields.`;

  openai.chat.completions
    .create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant for creating interactive stories.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
    })
    .then((completion) => {
      const raw = completion.choices[0].message.content || '';
      let story;
      try {
        story = JSON.parse(raw);
      } catch (e) {
        console.error('AI story output parse error. Raw output:', raw);
        res
          .status(500)
          .json({ error: 'Failed to parse story output from AI.', raw });
        return;
      }
      res.json({ story });
    })
    .catch((error: Error) => {
      console.error('OpenAI API error:', error);
      res.status(500).json({ error: error.message });
    });
});

// POST /api/image - generate an image for a scene
router.post('/image', (req: Request, res: Response): void => {
  const { sceneDescription, style } = req.body;
  if (!sceneDescription) {
    res.status(400).json({ error: 'Missing required field: sceneDescription' });
    return;
  }
  // Use OpenAI's image generation API (DALL-E 3)
  openai.images
    .generate({
      model: 'dall-e-3',
      prompt: `${sceneDescription}${style ? ' in the style of ' + style : ''}`,
      n: 1,
      size: '1024x1024',
    })
    .then((response) => {
      if (!response.data || !response.data[0] || !response.data[0].url) {
        res.status(500).json({ error: 'No image URL returned from OpenAI.' });
        return;
      }
      const imageUrl = response.data[0].url;
      res.json({ imageUrl });
    })
    .catch((error: Error) => {
      res.status(500).json({ error: error.message });
    });
});

export default router;

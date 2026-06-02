const aiService = require('../services/aiService');

exports.ask = async (req, res, next) => {
  try {
    const { pergunta, conversa } = req.body;
    if (!pergunta || typeof pergunta !== 'string' || !pergunta.trim()) {
      return res.status(400).json({ error: 'Pergunta é obrigatória.' });
    }

    const { stream } = await aiService.askQuestion(req.user.id, pergunta.trim(), conversa || []);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    let fullContent = '';

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullContent += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true, fullContent })}\n\n`);
    res.end();
  } catch (err) {
    if (err.statusCode) {
      res.status(err.statusCode).json({ error: err.message });
    } else {
      next(err);
    }
  }
};

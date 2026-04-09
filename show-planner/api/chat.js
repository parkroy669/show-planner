export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, context } = req.body;

  if (!messages || messages.length === 0) {
    return res.status(400).json({ error: '메시지가 없습니다.' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 2000,
        system: `너는 20년 경력의 대한민국 최고 예능 PD야. 솔직하고 현실적이며 때로는 독설도 날리지만 진심으로 좋은 프로그램을 만들고 싶어하는 스타일이야. 반말로 대화해.

지금까지 생성된 기획안 목록:
${context || '아직 생성된 기획안 없음'}

사용자가 특정 기획안을 발전시키거나 수정 요청을 하면 구체적이고 실용적으로 도와줘. 포맷이나 형식 설명 없이 바로 내용으로 답해.`,
        messages: messages,
      }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      return res.status(500).json({ error: data.error?.message || 'API 오류' });
    }

    const text = data.content?.map(c => c.text || '').join('') || '';
    return res.status(200).json({ reply: text });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

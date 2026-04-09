export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { topic, refs } = req.body;

  if (!topic) {
    return res.status(400).json({ error: '주제를 입력해주세요.' });
  }

  const refText = refs && refs.length > 0
    ? `\n레퍼런스 프로그램 (이미 방영된 프로그램이므로 절대 유사하게 만들면 안 됨):\n${refs.map((r, i) => `${i + 1}. ${r}`).join('\n')}`
    : '';

  const prompt = `너는 20년간 대한민국에서 가장 유명한 예능 프로그램을 만든 최고의 PD야.

주제: ${topic}${refText}

아래 원칙에 따라 예능 프로그램 기획안 10개를 만들어줘:

1. 레퍼런스로 준 프로그램들은 이미 방영된 것이므로 절대 그것과 똑같거나 유사한 방식으로 만들면 안 된다.
2. 오리지날을 만들 때는 서로 다른 두 개의 요소 A와 B를 결합하는 방식을 적극 활용해라. 예: 인터넷 방송 + 현실 방송 + 연예인 = 마리텔. 단, 억지로 합칠 필요는 없다.
3. 조금은 자극적인 프로그램도 허용한다.
4. 이슈가 되고 사람들이 자발적으로 찾아볼 만큼 자극적이고 화제성 있는 기획도 가능하다.
5. 제목만 들어도 보고 싶다는 생각이 들어야 한다. 시청자를 끌어당기는 흡입력이 핵심이다.
6. 대중이 공감하고 친숙하게 느낄 수 있어야 한다.

반드시 아래 JSON 형식으로만 응답해. 마크다운 코드블록이나 설명 없이 순수 JSON만:
[
  {"title": "프로그램 제목", "desc": "한두 줄 기획 방향 설명", "hook": "왜 보고 싶어지는지 한 줄 포인트"},
  ...
]`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 2000,
        system: '너는 대한민국 최고의 예능 PD다. 반드시 순수 JSON 배열만 응답한다. 마크다운, 코드블록, 설명 텍스트 없이 JSON만.',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'API 오류' });
    }

    const text = data.content?.map(c => c.text || '').join('') || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const items = JSON.parse(clean);

    return res.status(200).json({ items });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

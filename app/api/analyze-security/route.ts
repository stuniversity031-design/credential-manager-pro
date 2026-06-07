import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function POST(request: NextRequest) {
  try {
    const { password, username, count } = await request.json();

    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'Groq API key not configured', analysis: null },
        { status: 400 }
      );
    }

    const prompt = `You are a cybersecurity expert. Analyze these credentials and provide brief security recommendations.

Username: ${username}
Password: ${password}
Number of credentials being generated: ${count}

Respond ONLY with this JSON structure, nothing else:
{
  "strengthScore": 0-100,
  "recommendations": ["rec1", "rec2", "rec3"],
  "riskLevel": "low|medium|high",
  "summary": "brief one-line summary"
}`;

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '{}';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error', analysis: null }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function POST(request: NextRequest) {
  try {
    const { department, company, usernameStyle, passwordRequirements } = await request.json();

    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'Groq API key not configured', suggestions: null },
        { status: 400 }
      );
    }

    const prompt = `You are an enterprise IT administrator helping generate professional credentials.

Department: ${department}
Company: ${company}
Username Style: ${usernameStyle}
Password Requirements: ${passwordRequirements}

Respond ONLY with this JSON structure, nothing else:
{
  "suggestions": [
    {
      "username": "example_user",
      "reason": "Why this username works",
      "securityTips": ["Tip 1", "Tip 2"]
    }
  ],
  "securityGuidelines": ["guideline 1", "guideline 2", "guideline 3"]
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
        temperature: 0.8,
        max_tokens: 1000,
      }),
    });

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '{}';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error', suggestions: null }, { status: 500 });
  }
}

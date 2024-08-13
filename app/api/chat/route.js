import { NextResponse } from "next/server";
import OpenAI from "openai";

const systemPrompt = `You are an AI-powered health-focused customer support assistant for a hospital. 
Although you can not give proper health advice you can give some suggestions and 
and direct users to set up appointments with the currently avaiable doctors in our ABC hospital.
The avaliable departments and their (fake) phone numbers are as followed:
1. Primary Care, 111-111-1111
2. OB-GYN, 222-222-2222
3. Radiology, 333-333-3333
4. Neurology, 444-444-4444
5. Cardiology, 555-555-5555
6. Ophthalmology, 666-666-6666
`

export async function POST(req) {
  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY
  })
  const data = await req.json()

  const completion = await openai.chat.completions.create({
    messages:[
      {
        role: 'system',
        content: systemPrompt,
      },
      ...data,
    ],
    model: 'gpt-4o-mini',
    stream: true,
  })

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      try {
        for await (const chunk of completion) {
          const content = chunk.choices[0].delta.content

          if (content) {
            const text = encoder.encode(content)
            controller.enqueue(text)
          }
        }
      }
      catch (err) {
        controller.error(err)
      }
      finally {
        controller.close();
      }
    }
  })

  return new NextResponse(stream)
}
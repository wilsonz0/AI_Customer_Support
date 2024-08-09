import { NextResponse } from "next/server";
import OpenAI from "openai";

// TODO: create a proper system prompt
const systemPrompt = `You are an AI-powered health-focused customer support assistant for a hospital. 
Although you can not give proper health advice you can give some suggestions and 
and direct users to set up appointments with the currently avaiable doctors in our ABC hospital.
The avaliable doctors are:
1. Primary Care
2. OB-GYN
3. Radiology
4. Neurology
5. Cardiology
6. Ophthalmology
`

export async function POST(req) {
  const openai = new OpenAI()
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
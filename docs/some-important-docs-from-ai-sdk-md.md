Foundations
Prompts
Prompts
Prompts are instructions that you give a large language model (LLM) to tell it what to do. It's like when you ask someone for directions; the clearer your question, the better the directions you'll get.

Many LLM providers offer complex interfaces for specifying prompts. They involve different roles and message types. While these interfaces are powerful, they can be hard to use and understand.

In order to simplify prompting, the AI SDK supports text, message, and system prompts.

Text Prompts
Text prompts are strings. They are ideal for simple generation use cases, e.g. repeatedly generating content for variants of the same prompt text.

You can set text prompts using the prompt property made available by AI SDK functions like streamText or generateText. You can structure the text in any way and inject variables, e.g. using a template literal.


Gateway

Provider

Custom

const result = await generateText({
  model: "anthropic/claude-sonnet-4.5",
  prompt: 'Invent a new holiday and describe its traditions.',
});
You can also use template literals to provide dynamic data to your prompt.


Gateway

Provider

Custom

const result = await generateText({
  model: "anthropic/claude-sonnet-4.5",
  prompt:
    `I am planning a trip to ${destination} for ${lengthOfStay} days. ` +
    `Please suggest the best tourist activities for me to do.`,
});
System Prompts
System prompts are the initial set of instructions given to models that help guide and constrain the models' behaviors and responses. You can set system prompts using the system property. System prompts work with both the prompt and the messages properties. System messages in prompt or messages are allowed by default with a warning; use the system property for system instructions, set allowSystemInMessages: true when you need to send existing message histories that contain system messages, or set allowSystemInMessages: false to reject them.

System messages in prompt or messages can create a prompt injection attack risk, where users can override or set the system prompt by injecting system messages. Ideally, provide system instructions through the system option instead. Set allowSystemInMessages: true to suppress the warning, or allowSystemInMessages: false to throw an error.


Gateway

Provider

Custom

const result = await generateText({
  model: "anthropic/claude-sonnet-4.5",
  system:
    `You help planning travel itineraries. ` +
    `Respond to the users' request with a list ` +
    `of the best stops to make in their destination.`,
  prompt:
    `I am planning a trip to ${destination} for ${lengthOfStay} days. ` +
    `Please suggest the best tourist activities for me to do.`,
});
Message Prompts
A message prompt is an array of user, assistant, and tool messages. They are great for chat interfaces and more complex, multi-modal prompts. You can use the messages property to set message prompts.

Each message has a role and a content property. The content can either be text (for user and assistant messages), or an array of relevant parts (data) for that message type.


Gateway

Provider

Custom

const result = await generateText({
  model: "anthropic/claude-sonnet-4.5",
  messages: [
    { role: 'user', content: 'Hi!' },
    { role: 'assistant', content: 'Hello, how can I help?' },
    { role: 'user', content: 'Where can I buy the best Currywurst in Berlin?' },
  ],
});
Instead of sending a text in the content property, you can send an array of parts that includes a mix of text and other content parts.

Not all language models support all message and content types. For example, some models might not be capable of handling multi-modal inputs or tool messages. Learn more about the capabilities of select models.

Provider Options
You can pass through additional provider-specific metadata to enable provider-specific functionality at 3 levels.

Function Call Level
Functions like streamText or generateText accept a providerOptions property.

Adding provider options at the function call level should be used when you do not need granular control over where the provider options are applied.


const { text } = await generateText({
  model: azure('your-deployment-name'),
  providerOptions: {
    openai: {
      reasoningEffort: 'low',
    },
  },
});
Message Level
For granular control over applying provider options at the message level, you can pass providerOptions to the message object:


Gateway

Provider

Custom

const result = await generateText({
  model: "anthropic/claude-sonnet-4.5",
  system: {
    role: 'system',
    content: 'Cached system message',
    providerOptions: {
      // Sets a cache control breakpoint on the system message
      anthropic: { cacheControl: { type: 'ephemeral' } },
    },
  },
  prompt: 'Invent a new holiday and describe its traditions.',
});
Message Part Level
Certain provider-specific options require configuration at the message part level:


import { ModelMessage } from 'ai';

const messages: ModelMessage[] = [
  {
    role: 'user',
    content: [
      {
        type: 'text',
        text: 'Describe the image in detail.',
        providerOptions: {
          openai: { imageDetail: 'low' },
        },
      },
      {
        type: 'image',
        image:
          'https://github.com/vercel/ai/blob/main/examples/ai-functions/data/comic-cat.png?raw=true',
        // Sets image detail configuration for image part:
        providerOptions: {
          openai: { imageDetail: 'low' },
        },
      },
    ],
  },
];
AI SDK UI hooks like useChat return arrays of UIMessage objects, which do not support provider options. We recommend using the convertToModelMessages function to convert UIMessage objects to ModelMessage objects before applying or appending message(s) or message parts with providerOptions.

User Messages
Text Parts
Text content is the most common type of content. It is a string that is passed to the model.

If you only need to send text content in a message, the content property can be a string, but you can also use it to send multiple content parts.


Gateway

Provider

Custom

const result = await generateText({
  model: "anthropic/claude-sonnet-4.5",
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Where can I buy the best Currywurst in Berlin?',
        },
      ],
    },
  ],
});
Image Parts
User messages can include image parts. An image can be one of the following:

base64-encoded image:
string with base-64 encoded content
data URL string, e.g. data:image/png;base64,...
binary image:
ArrayBuffer
Uint8Array
Buffer
URL:
http(s) URL string, e.g. https://example.com/image.png
URL object, e.g. new URL('https://example.com/image.png')
Example: Binary image (Buffer)

const result = await generateText({
  model,
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Describe the image in detail.' },
        {
          type: 'image',
          image: fs.readFileSync('./data/comic-cat.png'),
        },
      ],
    },
  ],
});
Example: Base-64 encoded image (string)

Gateway

Provider

Custom

const result = await generateText({
  model: "anthropic/claude-sonnet-4.5",
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Describe the image in detail.' },
        {
          type: 'image',
          image: fs.readFileSync('./data/comic-cat.png').toString('base64'),
        },
      ],
    },
  ],
});
Example: Image URL (string)

Gateway

Provider

Custom

const result = await generateText({
  model: "anthropic/claude-sonnet-4.5",
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Describe the image in detail.' },
        {
          type: 'image',
          image:
            'https://github.com/vercel/ai/blob/main/examples/ai-functions/data/comic-cat.png?raw=true',
        },
      ],
    },
  ],
});
File Parts
Only a few providers and models currently support file parts: Google Generative AI, Google Vertex AI, OpenAI (for wav and mp3 audio with gpt-4o-audio-preview), Anthropic, OpenAI (for pdf).

User messages can include file parts. A file can be one of the following:

base64-encoded file:
string with base-64 encoded content
data URL string, e.g. data:image/png;base64,...
binary data:
ArrayBuffer
Uint8Array
Buffer
URL:
http(s) URL string, e.g. https://example.com/some.pdf
URL object, e.g. new URL('https://example.com/some.pdf')
You need to specify the MIME type of the file you are sending.

Example: PDF file from Buffer

import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

const result = await generateText({
  model: google('gemini-2.5-flash'),
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'What is the file about?' },
        {
          type: 'file',
          mediaType: 'application/pdf',
          data: fs.readFileSync('./data/example.pdf'),
          filename: 'example.pdf', // optional, not used by all providers
        },
      ],
    },
  ],
});
Example: mp3 audio file from Buffer

import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

const result = await generateText({
  model: openai('gpt-4o-audio-preview'),
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'What is the audio saying?' },
        {
          type: 'file',
          mediaType: 'audio/mpeg',
          data: fs.readFileSync('./data/galileo.mp3'),
        },
      ],
    },
  ],
});
Custom Download Function (Experimental)
You can use custom download functions to implement throttling, retries, authentication, caching, and more.

The default download implementation automatically downloads files in parallel when they are not supported by the model.

Custom download function can be passed via the experimental_download property:


Gateway

Provider

Custom

const result = await generateText({
  model: "anthropic/claude-sonnet-4.5",
  experimental_download: async (
    requestedDownloads: Array<{
      url: URL;
      isUrlSupportedByModel: boolean;
    }>,
  ): PromiseLike<
    Array<{
      data: Uint8Array;
      mediaType: string | undefined;
    } | null>
  > => {
    // ... download the files and return an array with similar order
  },
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'file',
          data: new URL('https://api.company.com/private/document.pdf'),
          mediaType: 'application/pdf',
        },
      ],
    },
  ],
});
The experimental_download option is experimental and may change in future releases.

Assistant Messages
Assistant messages are messages that have a role of assistant. They are typically previous responses from the assistant and can contain text, reasoning, and tool call parts.

Example: Assistant message with text content

Gateway

Provider

Custom

const result = await generateText({
  model: "anthropic/claude-sonnet-4.5",
  messages: [
    { role: 'user', content: 'Hi!' },
    { role: 'assistant', content: 'Hello, how can I help?' },
  ],
});
Example: Assistant message with text content in array

Gateway

Provider

Custom

const result = await generateText({
  model: "anthropic/claude-sonnet-4.5",
  messages: [
    { role: 'user', content: 'Hi!' },
    {
      role: 'assistant',
      content: [{ type: 'text', text: 'Hello, how can I help?' }],
    },
  ],
});
Example: Assistant message with tool call content

Gateway

Provider

Custom

const result = await generateText({
  model: "anthropic/claude-sonnet-4.5",
  messages: [
    { role: 'user', content: 'How many calories are in this block of cheese?' },
    {
      role: 'assistant',
      content: [
        {
          type: 'tool-call',
          toolCallId: '12345',
          toolName: 'get-nutrition-data',
          input: { cheese: 'Roquefort' },
        },
      ],
    },
  ],
});
Example: Assistant message with file content
This content part is for model-generated files. Only a few models support this, and only for file types that they can generate.


Gateway

Provider

Custom

const result = await generateText({
  model: "anthropic/claude-sonnet-4.5",
  messages: [
    { role: 'user', content: 'Generate an image of a roquefort cheese!' },
    {
      role: 'assistant',
      content: [
        {
          type: 'file',
          mediaType: 'image/png',
          data: fs.readFileSync('./data/roquefort.jpg'),
        },
      ],
    },
  ],
});
Tool messages
Tools (also known as function calling) are programs that you can provide an LLM to extend its built-in functionality. This can be anything from calling an external API to calling functions within your UI. Learn more about Tools in the next section.

For models that support tool calls, assistant messages can contain tool call parts, and tool messages can contain tool output parts. A single assistant message can call multiple tools, and a single tool message can contain multiple tool results.


Gateway

Provider

Custom

const result = await generateText({
  model: "anthropic/claude-sonnet-4.5",
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'How many calories are in this block of cheese?',
        },
        { type: 'image', image: fs.readFileSync('./data/roquefort.jpg') },
      ],
    },
    {
      role: 'assistant',
      content: [
        {
          type: 'tool-call',
          toolCallId: '12345',
          toolName: 'get-nutrition-data',
          input: { cheese: 'Roquefort' },
        },
        // there could be more tool calls here (parallel calling)
      ],
    },
    {
      role: 'tool',
      content: [
        {
          type: 'tool-result',
          toolCallId: '12345', // needs to match the tool call id
          toolName: 'get-nutrition-data',
          output: {
            type: 'json',
            value: {
              name: 'Cheese, roquefort',
              calories: 369,
              fat: 31,
              protein: 22,
            },
          },
        },
        // there could be more tool results here (parallel calling)
      ],
    },
  ],
});
Multi-modal Tool Results
Tool results can be multi-part and multi-modal, e.g. a text and an image. You can use output: { type: 'content', value: [...] } to specify multi-part tool results.


Gateway

Provider

Custom

const result = await generateText({
  model: "anthropic/claude-sonnet-4.5",
  messages: [
    // ...
    {
      role: 'tool',
      content: [
        {
          type: 'tool-result',
          toolCallId: '12345', // needs to match the tool call id
          toolName: 'get-nutrition-data',
          // for models that do not support multi-part tool results,
          // you can include a regular output part:
          output: {
            type: 'json',
            value: {
              name: 'Cheese, roquefort',
              calories: 369,
              fat: 31,
              protein: 22,
            },
          },
        },
        {
          type: 'tool-result',
          toolCallId: '12345', // needs to match the tool call id
          toolName: 'get-nutrition-data',
          // for models that support multi-part tool results,
          // you can include a multi-part content part:
          output: {
            type: 'content',
            value: [
              {
                type: 'text',
                text: 'Here is the nutrition data for the cheese:',
              },
              {
                type: 'image-data',
                data: fs
                  .readFileSync('./data/roquefort-nutrition-data.png')
                  .toString('base64'),
                mediaType: 'image/png',
              },
            ],
          },
        },
      ],
    },
  ],
});
System Messages
System messages are messages that are sent to the model before the user messages to guide the assistant's behavior. You can alternatively use the system property.


Gateway

Provider

Custom

const result = await generateText({
  model: "anthropic/claude-sonnet-4.5",
  messages: [
    { role: 'system', content: 'You help planning travel itineraries.' },
    {
      role: 'user',
      content:
        'I am planning a trip to Berlin for 3 days. Please suggest the best tourist activities for me to do.',
    },
  ],
});
























Foundations
Tools
Tools
While large language models (LLMs) have incredible generation capabilities, they struggle with discrete tasks (e.g. mathematics) and interacting with the outside world (e.g. getting the weather).

Tools are actions that an LLM can invoke. The results of these actions can be reported back to the LLM to be considered in the next response.

For example, when you ask an LLM for the "weather in London", and there is a weather tool available, it could call a tool with London as the argument. The tool would then fetch the weather data and return it to the LLM. The LLM can then use this information in its response.

What is a tool?
A tool is an object that can be called by the model to perform a specific task. You can use tools with generateText and streamText by passing one or more tools to the tools parameter.

A tool consists of three properties:

description: An optional description of the tool that can influence when the tool is picked.
inputSchema: A Zod schema or a JSON schema that defines the input required for the tool to run. The schema is consumed by the LLM, and also used to validate the LLM tool calls.
execute: An optional async function that is called with the arguments from the tool call.
streamUI uses UI generator tools with a generate function that can return React components.

If the LLM decides to use a tool, it will generate a tool call. Tools with an execute function are run automatically when these calls are generated. The output of the tool calls are returned using tool result objects.

You can automatically pass tool results back to the LLM using multi-step calls with streamText and generateText.

Types of Tools
The AI SDK supports three types of tools, each with different trade-offs:

Custom Tools
Custom tools are tools you define entirely yourself, including the description, input schema, and execute function. They are provider-agnostic and give you full control.


import { tool } from 'ai';
import { z } from 'zod';

const weatherTool = tool({
  description: 'Get the weather in a location',
  inputSchema: z.object({
    location: z.string().describe('The location to get the weather for'),
  }),
  execute: async ({ location }) => {
    // Your implementation
    return { temperature: 72, conditions: 'sunny' };
  },
});
When to use: When you need full control, want provider portability, or are implementing application-specific functionality.

Provider-Defined Tools
Provider-defined tools are tools where the provider specifies the tool's inputSchema and description, but you provide the execute function. These are sometimes called "client tools" because execution happens on your side.

Examples include Anthropic's bash and text_editor tools. The model has been specifically trained to use these tools effectively, which can result in better performance for supported tasks.


import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';

const result = await generateText({
  model: anthropic('claude-opus-4-5'),
  tools: {
    bash: anthropic.tools.bash_20250124({
      execute: async ({ command }) => {
        // Your implementation to run the command
        return runCommand(command);
      },
    }),
  },
  prompt: 'List files in the current directory',
});
When to use: When the provider offers a tool the model is trained to use well, and you want better performance for that specific task.

Provider-Executed Tools
Provider-executed tools are tools that run entirely on the provider's servers. You configure them, but the provider handles execution. These are sometimes called "server-side tools".

Examples include OpenAI's web search and Anthropic's code execution. These provide out-of-the-box functionality without requiring you to set up infrastructure.


import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

const result = await generateText({
  model: openai('gpt-5.2'),
  tools: {
    web_search: openai.tools.webSearch(),
  },
  prompt: 'What happened in the news today?',
});
When to use: When you want powerful functionality (like web search or sandboxed code execution) without managing the infrastructure yourself.

Comparison
Aspect	Custom Tools	Provider-Defined Tools	Provider-Executed Tools
Execution	Your code	Your code	Provider's servers
Schema	You define	Provider defines	Provider defines
Portability	Works with any provider	Provider-specific	Provider-specific
Model Training	General tool use	Optimized for the tool	Optimized for the tool
Setup	You implement everything	You implement execute	Configuration only
Provider-defined and provider-executed tools are documented in each provider's page. See Anthropic Provider and OpenAI Provider for examples.

Schemas
Schemas are used to define and validate the tool input, tools outputs, and structured output generation.

The AI SDK supports the following schemas:

Zod v3 and v4 directly or via zodSchema()
Valibot via valibotSchema() from @ai-sdk/valibot
Standard JSON Schema compatible schemas
Raw JSON schemas via jsonSchema()
You can also use schemas for structured output generation with generateText and streamText using the output setting.

Tool Packages
Given tools are JavaScript objects, they can be packaged and distributed through npm like any other library. This makes it easy to share reusable tools across projects and with the community.

Using Ready-Made Tool Packages
Install a tool package and import the tools you need:


pnpm add some-tool-package
Then pass them directly to generateText, streamText, or your agent definition:


import { generateText, stepCountIs } from 'ai';
import { searchTool } from 'some-tool-package';

const { text } = await generateText({
  model: 'anthropic/claude-haiku-4.5',
  prompt: 'When was Vercel Ship AI?',
  tools: {
    webSearch: searchTool,
  },
  stopWhen: stepCountIs(10),
});
Publishing Your Own Tools
You can publish your own tool packages to npm for others to use. Simply export your tool objects from your package:

my-tools/index.ts

import { tool } from 'ai';
import { z } from 'zod';

export const myTool = tool({
  description: 'A helpful tool',
  inputSchema: z.object({
    query: z.string(),
  }),
  execute: async ({ query }) => {
    // your tool logic
    return result;
  },
});
Anyone can then install and use your tools by importing them.

To get started, you can use the AI SDK Tool Package Template which provides a ready-to-use starting point for publishing your own tools.

Toolsets
When you work with tools, you typically need a mix of application-specific tools and general-purpose tools. The community has created various toolsets and resources to help you build and use tools.

Ready-to-Use Tool Packages
These packages provide pre-built tools you can install and use immediately:

@exalabs/ai-sdk - Web search tool that lets AI search the web and get real-time information.
@parallel-web/ai-sdk-tools - Web search and extract tools powered by Parallel Web API for real-time information and content extraction.
@perplexity-ai/ai-sdk - Search the web with real-time results and advanced filtering powered by Perplexity's Search API.
@tavily/ai-sdk - Search, extract, crawl, and map tools for enterprise-grade agents to explore the web in real-time.
Stripe agent tools - Tools for interacting with Stripe.
StackOne ToolSet - Agentic integrations for hundreds of enterprise SaaS platforms.
agentic - A collection of 20+ tools that connect to external APIs such as Exa or E2B.
Amazon Bedrock AgentCore - Fully managed AI agent services including Browser (a fast and secure cloud-based browser runtime to enable agents to interact with web applications, fill forms, navigate websites, and extract information) and Code Interpreter (an isolated sandbox environment for agents to execute code in Python, JavaScript, and TypeScript, enhancing accuracy and expanding ability to solve complex end-to-end tasks).
@airweave/vercel-ai-sdk - Unified semantic search across 35+ data sources (Notion, Slack, Google Drive, databases, and more) for AI agents.
Composio - 250+ tools like GitHub, Gmail, Salesforce and more.
JigsawStack - Over 30+ small custom fine-tuned models available for specific uses.
AI Tools Registry - A Shadcn-compatible tool definitions and components registry for the AI SDK.
Toolhouse - AI function-calling in 3 lines of code for over 25 different actions.
bash-tool - Provides bash, readFile, and writeFile tools for AI agents. Supports @vercel/sandbox for full VM isolation.
MCP Tools
These are pre-built tools available as MCP servers:

Smithery - An open marketplace of 6,000+ MCPs, including Browserbase and Exa.
Pipedream - Developer toolkit that lets you easily add 3,000+ integrations to your app or AI agent.
Apify - Apify provides a marketplace of thousands of tools for web scraping, data extraction, and browser automation.
Tool Building Tutorials
These tutorials and guides help you build your own tools that integrate with specific services:

browserbase - Tutorial for building browser tools that run a headless browser.
browserless - Guide for integrating browser automation (self-hosted or cloud-based).
AI Tool Maker - A CLI utility to generate AI SDK tools from OpenAPI specs.
Interlify - Guide for converting APIs into tools.
DeepAgent - A suite of 50+ AI tools and integrations, seamlessly connecting with APIs like Tavily, E2B, Airtable and more.
Do you have open source tools or tool libraries that are com

























Foundations
Streaming
Streaming
Streaming conversational text UIs (like ChatGPT) have gained massive popularity over the past few months. This section explores the benefits and drawbacks of streaming and blocking interfaces.

Large language models (LLMs) are extremely powerful. However, when generating long outputs, they can be very slow compared to the latency you're likely used to. If you try to build a traditional blocking UI, your users might easily find themselves staring at loading spinners for 5, 10, even up to 40s waiting for the entire LLM response to be generated. This can lead to a poor user experience, especially in conversational applications like chatbots. Streaming UIs can help mitigate this issue by displaying parts of the response as they become available.

Blocking UI

Blocking responses wait until the full response is available before displaying it.

Streaming UI

Streaming responses can transmit parts of the response as they become available.

Real-world Examples
Here are 2 examples that illustrate how streaming UIs can improve user experiences in a real-world setting – the first uses a blocking UI, while the second uses a streaming UI.

Blocking UI
Come up with the first 200 characters of the first book in the Harry Potter series.
Generate
...
Streaming UI
Come up with the first 200 characters of the first book in the Harry Potter series.
Generate
...
As you can see, the streaming UI is able to start displaying the response much faster than the blocking UI. This is because the blocking UI has to wait for the entire response to be generated before it can display anything, while the streaming UI can display parts of the response as they become available.

While streaming interfaces can greatly enhance user experiences, especially with larger language models, they aren't always necessary or beneficial. If you can achieve your desired functionality using a smaller, faster model without resorting to streaming, this route can often lead to simpler and more manageable development processes.

However, regardless of the speed of your model, the AI SDK is designed to make implementing streaming UIs as simple as possible. In the example below, we stream text generation in under 10 lines of code using the SDK's streamText function:


Gateway

Provider

Custom

import { streamText } from 'ai';

const { textStream } = streamText({
  model: "anthropic/claude-sonnet-4.5",
  prompt: 'Write a poem about embedding models.',
});

for await (const textPart of textStream) {
  console.log(textPart);
}





























Next.js App Router Quickstart
The AI SDK is a powerful TypeScript library designed to help developers build AI-powered applications.

In this quickstart tutorial, you'll build a simple agent with a streaming chat user interface. Along the way, you'll learn key concepts and techniques that are fundamental to using the AI SDK in your own projects.

If you are unfamiliar with the concepts of Prompt Engineering and HTTP Streaming, you can optionally read these documents first.

Prerequisites
To follow this quickstart, you'll need:

Node.js 18+ and pnpm installed on your local development machine.
A Vercel AI Gateway  API key.
If you haven't obtained your Vercel AI Gateway API key, you can do so by signing up on the Vercel website.

Create Your Application
Start by creating a new Next.js application. This command will create a new directory named my-ai-app and set up a basic Next.js application inside it.

Be sure to select yes when prompted to use the App Router and Tailwind CSS. If you are looking for the Next.js Pages Router quickstart guide, you can find it here.

pnpm create next-app@latest my-ai-app
Navigate to the newly created directory:

cd my-ai-app
Install dependencies
Install ai and @ai-sdk/react, the AI package and AI SDK's React hooks. The AI SDK's Vercel AI Gateway provider ships with the ai package. You'll also install zod, a schema validation library used for defining tool inputs.

This guide uses the Vercel AI Gateway provider so you can access hundreds of models from different providers with one API key, but you can switch to any provider or model by installing its package. Check out available AI SDK providers for more information.

pnpm
npm
yarn
bun
pnpm add ai @ai-sdk/react zod
Configure your AI Gateway API key
Create a .env.local file in your project root and add your AI Gateway API key. This key authenticates your application with Vercel AI Gateway.

touch .env.local
Edit the .env.local file:

.env.local

AI_GATEWAY_API_KEY=xxxxxxxxx
Replace xxxxxxxxx with your actual Vercel AI Gateway API key.

The AI SDK's Vercel AI Gateway Provider will default to using the AI_GATEWAY_API_KEY environment variable.

Create a Route Handler
Create a route handler, app/api/chat/route.ts and add the following code:


Gateway

Provider

Custom
app/api/chat/route.ts

import { streamText, UIMessage, convertToModelMessages } from 'ai';

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: "anthropic/claude-sonnet-4.5",
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
Let's take a look at what is happening in this code:

Define an asynchronous POST request handler and extract messages from the body of the request. The messages variable contains a history of the conversation between you and the chatbot and provides the chatbot with the necessary context to make the next generation. The messages are of UIMessage type, which are designed for use in application UI - they contain the entire message history and associated metadata like timestamps.
Call streamText, which is imported from the ai package. This function accepts a configuration object that contains a model provider and messages (defined in step 1). You can pass additional settings to further customize the model's behavior. The messages key expects a ModelMessage[] array. This type is different from UIMessage in that it does not include metadata, such as timestamps or sender information. To convert between these types, we use the convertToModelMessages function, which strips the UI-specific metadata and transforms the UIMessage[] array into the ModelMessage[] format that the model expects.
The streamText function returns a StreamTextResult. This result object contains the toUIMessageStreamResponse function which converts the result to a streamed response object.
Finally, return the result to the client to stream the response.
This Route Handler creates a POST request endpoint at /api/chat.

Choosing a Provider
The AI SDK supports dozens of model providers through first-party, OpenAI-compatible, and community packages.

This quickstart uses the Vercel AI Gateway provider, which is the default global provider. This means you can access models using a simple string in the model configuration:


Gateway

Provider

Custom

model: "anthropic/claude-sonnet-4.5";
You can also explicitly import and use the gateway provider in two other equivalent ways:


// Option 1: Import from 'ai' package (included by default)
import { gateway } from 'ai';
model: gateway('anthropic/claude-sonnet-4.5');

// Option 2: Install and import from '@ai-sdk/gateway' package
import { gateway } from '@ai-sdk/gateway';
model: gateway('anthropic/claude-sonnet-4.5');
Using other providers
To use a different provider, install its package and create a provider instance. For example, to use OpenAI directly:

pnpm
npm
yarn
bun
pnpm add @ai-sdk/openai

import { openai } from '@ai-sdk/openai';

model: openai('gpt-5.1');
Updating the global provider
You can change the default global provider so string model references use your preferred provider everywhere in your application. Learn more about provider management.

Pick the approach that best matches how you want to manage providers across your application.

Wire up the UI
Now that you have a Route Handler that can query an LLM, it's time to setup your frontend. The AI SDK's UI package abstracts the complexity of a chat interface into one hook, useChat.

Update your root page (app/page.tsx) with the following code to show a list of chat messages and provide a user message input:

app/page.tsx

'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';

export default function Chat() {
  const [input, setInput] = useState('');
  const { messages, sendMessage } = useChat();
  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {messages.map(message => (
        <div key={message.id} className="whitespace-pre-wrap">
          {message.role === 'user' ? 'User: ' : 'AI: '}
          {message.parts.map((part, i) => {
            switch (part.type) {
              case 'text':
                return <div key={`${message.id}-${i}`}>{part.text}</div>;
            }
          })}
        </div>
      ))}

      <form
        onSubmit={e => {
          e.preventDefault();
          sendMessage({ text: input });
          setInput('');
        }}
      >
        <input
          className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-md p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={e => setInput(e.currentTarget.value)}
        />
      </form>
    </div>
  );
}
Make sure you add the "use client" directive to the top of your file. This allows you to add interactivity with JavaScript.

This page utilizes the useChat hook, which will, by default, use the POST API route you created earlier (/api/chat). The hook provides functions and state for handling user input and form submission. The useChat hook provides multiple utility functions and state variables:

messages - the current chat messages (an array of objects with id, role, and parts properties).
sendMessage - a function to send a message to the chat API.
The component uses local state (useState) to manage the input field value, and handles form submission by calling sendMessage with the input text and then clearing the input field.

The LLM's response is accessed through the message parts array. Each message contains an ordered array of parts that represents everything the model generated in its response. These parts can include plain text, reasoning tokens, and more that you will see later. The parts array preserves the sequence of the model's outputs, allowing you to display or process each component in the order it was generated.

Running Your Application
With that, you have built everything you need for your chatbot! To start your application, use the command:

pnpm run dev
Head to your browser and open http://localhost:3000. You should see an input field. Test it out by entering a message and see the AI chatbot respond in real-time! The AI SDK makes it fast and easy to build AI chat interfaces with Next.js.

Enhance Your Chatbot with Tools
While large language models (LLMs) have incredible generation capabilities, they struggle with discrete tasks (e.g. mathematics) and interacting with the outside world (e.g. getting the weather). This is where tools come in.

Tools are actions that an LLM can invoke. The results of these actions can be reported back to the LLM to be considered in the next response.

For example, if a user asks about the current weather, without tools, the model would only be able to provide general information based on its training data. But with a weather tool, it can fetch and provide up-to-date, location-specific weather information.

Let's enhance your chatbot by adding a simple weather tool.

Update Your Route Handler
Modify your app/api/chat/route.ts file to include the new weather tool:


Gateway

Provider

Custom
app/api/chat/route.ts

import { streamText, UIMessage, convertToModelMessages, tool } from 'ai';
import { z } from 'zod';

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: "anthropic/claude-sonnet-4.5",
    messages: await convertToModelMessages(messages),
    tools: {
      weather: tool({
        description: 'Get the weather in a location (fahrenheit)',
        inputSchema: z.object({
          location: z.string().describe('The location to get the weather for'),
        }),
        execute: async ({ location }) => {
          const temperature = Math.round(Math.random() * (90 - 32) + 32);
          return {
            location,
            temperature,
          };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
In this updated code:

You import the tool function from the ai package and z from zod for schema validation.

You define a tools object with a weather tool. This tool:

Has a description that helps the model understand when to use it.
Defines inputSchema using a Zod schema, specifying that it requires a location string to execute this tool. The model will attempt to extract this input from the context of the conversation. If it can't, it will ask the user for the missing information.
Defines an execute function that simulates getting weather data (in this case, it returns a random temperature). This is an asynchronous function running on the server so you can fetch real data from an external API.
Now your chatbot can "fetch" weather information for any location the user asks about. When the model determines it needs to use the weather tool, it will generate a tool call with the necessary input. The execute function will then be automatically run, and the tool output will be added to the messages as a tool message.

Try asking something like "What's the weather in New York?" and see how the model uses the new tool.

Notice the blank response in the UI? This is because instead of generating a text response, the model generated a tool call. You can access the tool call and subsequent tool result on the client via the tool-weather part of the message.parts array.

Tool parts are always named tool-{toolName}, where {toolName} is the key you used when defining the tool. In this case, since we defined the tool as weather, the part type is tool-weather.

Update the UI
To display the tool invocation in your UI, update your app/page.tsx file:

app/page.tsx

'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';

export default function Chat() {
  const [input, setInput] = useState('');
  const { messages, sendMessage } = useChat();
  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {messages.map(message => (
        <div key={message.id} className="whitespace-pre-wrap">
          {message.role === 'user' ? 'User: ' : 'AI: '}
          {message.parts.map((part, i) => {
            switch (part.type) {
              case 'text':
                return <div key={`${message.id}-${i}`}>{part.text}</div>;
              case 'tool-weather':
                return (
                  <pre key={`${message.id}-${i}`}>
                    {JSON.stringify(part, null, 2)}
                  </pre>
                );
            }
          })}
        </div>
      ))}

      <form
        onSubmit={e => {
          e.preventDefault();
          sendMessage({ text: input });
          setInput('');
        }}
      >
        <input
          className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-md p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={e => setInput(e.currentTarget.value)}
        />
      </form>
    </div>
  );
}
With this change, you're updating the UI to handle different message parts. For text parts, you display the text content as before. For weather tool invocations, you display a JSON representation of the tool call and its result.

Now, when you ask about the weather, you'll see the tool call and its result displayed in your chat interface.

Enabling Multi-Step Tool Calls
You may have noticed that while the tool is now visible in the chat interface, the model isn't using this information to answer your original query. This is because once the model generates a tool call, it has technically completed its generation.

To solve this, you can enable multi-step tool calls using stopWhen. By default, stopWhen is set to stepCountIs(1), which means generation stops after the first step when there are tool results. By changing this condition, you can allow the model to automatically send tool results back to itself to trigger additional generations until your specified stopping condition is met. In this case, you want the model to continue generating so it can use the weather tool results to answer your original question.

Update Your Route Handler
Modify your app/api/chat/route.ts file to include the stopWhen condition:


Gateway

Provider

Custom
app/api/chat/route.ts

import {
  streamText,
  UIMessage,
  convertToModelMessages,
  tool,
  stepCountIs,
} from 'ai';
import { z } from 'zod';

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: "anthropic/claude-sonnet-4.5",
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    tools: {
      weather: tool({
        description: 'Get the weather in a location (fahrenheit)',
        inputSchema: z.object({
          location: z.string().describe('The location to get the weather for'),
        }),
        execute: async ({ location }) => {
          const temperature = Math.round(Math.random() * (90 - 32) + 32);
          return {
            location,
            temperature,
          };
        },
      }),
    },
    onStepFinish: ({ toolResults }) => {
      console.log(toolResults);
    },
  });

  return result.toUIMessageStreamResponse();
}
In this updated code:

You set stopWhen to be when stepCountIs 5, allowing the model to use up to 5 "steps" for any given generation.
You add an onStepFinish callback to log any toolResults from each step of the interaction, helping you understand the model's tool usage.
Head back to the browser and ask about the weather in a location. You should now see the model using the weather tool results to answer your question.

By setting stopWhen: stepCountIs(5), you're allowing the model to use up to 5 "steps" for any given generation. This enables more complex interactions and allows the model to gather and process information over several steps if needed. You can see this in action by adding another tool to convert the temperature from Celsius to Fahrenheit.

Add another tool
Update your app/api/chat/route.ts file to add a new tool to convert the temperature from Fahrenheit to Celsius:


Gateway

Provider

Custom
app/api/chat/route.ts

import {
  streamText,
  UIMessage,
  convertToModelMessages,
  tool,
  stepCountIs,
} from 'ai';
import { z } from 'zod';

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: "anthropic/claude-sonnet-4.5",
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    tools: {
      weather: tool({
        description: 'Get the weather in a location (fahrenheit)',
        inputSchema: z.object({
          location: z.string().describe('The location to get the weather for'),
        }),
        execute: async ({ location }) => {
          const temperature = Math.round(Math.random() * (90 - 32) + 32);
          return {
            location,
            temperature,
          };
        },
      }),
      convertFahrenheitToCelsius: tool({
        description: 'Convert a temperature in fahrenheit to celsius',
        inputSchema: z.object({
          temperature: z
            .number()
            .describe('The temperature in fahrenheit to convert'),
        }),
        execute: async ({ temperature }) => {
          const celsius = Math.round((temperature - 32) * (5 / 9));
          return {
            celsius,
          };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
Update Your Frontend
update your app/page.tsx file to render the new temperature conversion tool:

app/page.tsx

'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';

export default function Chat() {
  const [input, setInput] = useState('');
  const { messages, sendMessage } = useChat();
  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {messages.map(message => (
        <div key={message.id} className="whitespace-pre-wrap">
          {message.role === 'user' ? 'User: ' : 'AI: '}
          {message.parts.map((part, i) => {
            switch (part.type) {
              case 'text':
                return <div key={`${message.id}-${i}`}>{part.text}</div>;
              case 'tool-weather':
              case 'tool-convertFahrenheitToCelsius':
                return (
                  <pre key={`${message.id}-${i}`}>
                    {JSON.stringify(part, null, 2)}
                  </pre>
                );
            }
          })}
        </div>
      ))}

      <form
        onSubmit={e => {
          e.preventDefault();
          sendMessage({ text: input });
          setInput('');
        }}
      >
        <input
          className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-md p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={e => setInput(e.currentTarget.value)}
        />
      </form>
    </div>
  );
}
This update handles the new tool-convertFahrenheitToCelsius part type, displaying the temperature conversion tool calls and results in the UI.

Now, when you ask "What's the weather in New York in celsius?", you should see a more complete interaction:

The model will call the weather tool for New York.
You'll see the tool output displayed.
It will then call the temperature conversion tool to convert the temperature from Fahrenheit to Celsius.
The model will then use that information to provide a natural language response about the weather in New York.
This multi-step approach allows the model to gather information and use it to provide more accurate and contextual responses, making your chatbot considerably more useful.

This simple example demonstrates how tools can expand your model's capabilities. You can create more complex tools to integrate with real APIs, databases, or any other external systems, allowing the model to access and process real-world data in real-time. Tools bridge the gap between the model's knowledge cutoff and current information.

Where to Next?
You've built an AI chatbot using the AI SDK! From here, you have several paths to explore:

To learn more about the AI SDK, read through the documentation.
If you're interested in diving deeper with guides, check out the RAG (retrieval-augmented generation) and multi-modal chatbot guides.
To jumpstart your first AI project, explore available templates.
Previous
Navigating the Library
Ne





import {
  Content,
  EnhancedGenerateContentResponse,
  FunctionCallPart,
  GenerationConfig,
  Tool as GeminiTool,
  GenerateContentResult,
  GenerateContentStreamResult,
  GoogleGenerativeAI,
  Part,
  Schema,
  SchemaType,
} from '@google/generative-ai'
import { v4 as uuidv4 } from 'uuid'

// Gemini's SDK does not export a type for raw candidate parts that include
// thoughtSignature (used for extended thinking). We define a minimal shape here.
interface GeminiRawPart {
  functionCall?: { name: string; args: Record<string, unknown> }
  thoughtSignature?: string
  text?: string
}

// Extends FunctionCallPart to carry thoughtSignature when present
interface FunctionCallPartWithThinking extends FunctionCallPart {
  thoughtSignature?: string
}

import { ChatModel } from '../../types/chat-model.types'
import {
  LLMOptions,
  LLMRequestNonStreaming,
  LLMRequestStreaming,
  RequestMessage,
  RequestTool,
} from '../../types/llm/request'
import {
  LLMResponseNonStreaming,
  LLMResponseStreaming,
} from '../../types/llm/response'
import { LLMProvider } from '../../types/provider.types'
import { parseImageDataUrl } from '../../utils/llm/image'

import { BaseLLMProvider } from './base'
import {
  LLMAPIKeyInvalidException,
  LLMAPIKeyNotSetException,
  LLMRateLimitExceededException,
} from './exception'

/**
 * TODO: Consider future migration from '@google/generative-ai' to '@google/genai' (https://github.com/googleapis/js-genai)
 * - Current '@google/generative-ai' library will not support newest models and features
 * - Not migrating yet as '@google/genai' is still in preview status
 */

/**
 * Note on OpenAI Compatibility API:
 * Gemini provides an OpenAI-compatible endpoint (https://ai.google.dev/gemini-api/docs/openai)
 * which allows using the OpenAI SDK with Gemini models. However, there are currently CORS issues
 * preventing its use in Obsidian. Consider switching to this endpoint in the future once these
 * issues are resolved.
 */
export class GeminiProvider extends BaseLLMProvider<
  Extract<LLMProvider, { type: 'gemini' }>
> {
  private client: GoogleGenerativeAI
  private apiKey: string

  constructor(provider: Extract<LLMProvider, { type: 'gemini' }>) {
    super(provider)
    if (provider.baseUrl) {
      throw new Error('Gemini does not support custom base URL')
    }

    this.client = new GoogleGenerativeAI(provider.apiKey ?? '')
    this.apiKey = provider.apiKey ?? ''
  }

  async generateResponse(
    model: ChatModel,
    request: LLMRequestNonStreaming,
    options?: LLMOptions,
  ): Promise<LLMResponseNonStreaming> {
    if (model.providerType !== 'gemini') {
      throw new Error('Model is not a Gemini model')
    }

    if (!this.apiKey) {
      throw new LLMAPIKeyNotSetException(
        `Provider ${this.provider.id} API key is missing. Please set it in settings menu.`,
      )
    }

    const systemMessages = request.messages.filter((m) => m.role === 'system')
    const systemInstruction: string | undefined =
      systemMessages.length > 0
        ? systemMessages.map((m) => m.content).join('\n')
        : undefined

    try {
      // Gemini 2.5+ thinking models require a `thought_signature` field on every
      // FunctionCallPart when tools are in use. The current SDK (@google/generative-ai
      // v0.24.x) does not propagate thought_signature, so tool calls always fail with
      // a 400 error on these models. Setting thinkingBudget=0 disables thinking mode
      // for this request, which removes the thought_signature requirement and lets tool
      // calls succeed. TODO: migrate to @google/genai SDK (v2+) which has full
      // thought_signature support, so thinking can remain enabled alongside tools.
      const hasTools = (request.tools?.length ?? 0) > 0
      const generationConfig = {
        maxOutputTokens: request.max_tokens,
        temperature: request.temperature,
        topP: request.top_p,
        presencePenalty: request.presence_penalty,
        frequencyPenalty: request.frequency_penalty,
        ...(hasTools ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
      } as Record<string, unknown>

      const model = this.client.getGenerativeModel({
        model: request.model,
        generationConfig: generationConfig as GenerationConfig,
        systemInstruction: systemInstruction,
      })

      const result = await model.generateContent(
        {
          systemInstruction: systemInstruction,
          contents: request.messages
            .map((message) => GeminiProvider.parseRequestMessage(message))
            .filter((m): m is Content => m !== null),
          tools: request.tools?.map((tool) =>
            GeminiProvider.parseRequestTool(tool),
          ),
        },
        {
          signal: options?.signal,
        },
      )

      const messageId = crypto.randomUUID() // Gemini does not return a message id
      return GeminiProvider.parseNonStreamingResponse(
        result,
        request.model,
        messageId,
      )
    } catch (error) {
      const isInvalidApiKey =
        error.message?.includes('API_KEY_INVALID') ||
        error.message?.includes('API key not valid')

      if (isInvalidApiKey) {
        throw new LLMAPIKeyInvalidException(
          `Provider ${this.provider.id} API key is invalid. Please update it in settings menu.`,
          error as Error,
        )
      }

      throw error
    }
  }

  async streamResponse(
    model: ChatModel,
    request: LLMRequestStreaming,
    options?: LLMOptions,
  ): Promise<AsyncIterable<LLMResponseStreaming>> {
    if (model.providerType !== 'gemini') {
      throw new Error('Model is not a Gemini model')
    }

    if (!this.apiKey) {
      throw new LLMAPIKeyNotSetException(
        `Provider ${this.provider.id} API key is missing. Please set it in settings menu.`,
      )
    }

    const systemMessages = request.messages.filter((m) => m.role === 'system')
    const systemInstruction: string | undefined =
      systemMessages.length > 0
        ? systemMessages.map((m) => m.content).join('\n')
        : undefined

    try {
      // Same thinkingBudget=0 workaround as in generateResponse — see comment there.
      const hasTools = (request.tools?.length ?? 0) > 0
      const generationConfig = {
        maxOutputTokens: request.max_tokens,
        temperature: request.temperature,
        topP: request.top_p,
        presencePenalty: request.presence_penalty,
        frequencyPenalty: request.frequency_penalty,
        ...(hasTools ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
      } as Record<string, unknown>

      const model = this.client.getGenerativeModel({
        model: request.model,
        generationConfig: generationConfig as GenerationConfig,
        systemInstruction: systemInstruction,
      })

      const stream = await model.generateContentStream(
        {
          systemInstruction: systemInstruction,
          contents: request.messages
            .map((message) => GeminiProvider.parseRequestMessage(message))
            .filter((m): m is Content => m !== null),
          tools: request.tools?.map((tool) =>
            GeminiProvider.parseRequestTool(tool),
          ),
        },
        {
          signal: options?.signal,
        },
      )

      const messageId = crypto.randomUUID() // Gemini does not return a message id
      return this.streamResponseGenerator(stream, request.model, messageId)
    } catch (error) {
      const isInvalidApiKey =
        error.message?.includes('API_KEY_INVALID') ||
        error.message?.includes('API key not valid')

      if (isInvalidApiKey) {
        throw new LLMAPIKeyInvalidException(
          `Gemini API key is invalid. Please update it in settings menu.`,
          error as Error,
        )
      }

      throw error
    }
  }

  private async *streamResponseGenerator(
    stream: GenerateContentStreamResult,
    model: string,
    messageId: string,
  ): AsyncIterable<LLMResponseStreaming> {
    for await (const chunk of stream.stream) {
      yield GeminiProvider.parseStreamingResponseChunk(chunk, model, messageId)
    }
  }

  static parseRequestMessage(message: RequestMessage): Content | null {
    switch (message.role) {
      case 'system':
        // System messages should be extracted and handled separately
        return null
      case 'user': {
        const contentParts: Part[] = Array.isArray(message.content)
          ? message.content.map((part) => {
              switch (part.type) {
                case 'text':
                  return { text: part.text }
                case 'image_url': {
                  const { mimeType, base64Data } = parseImageDataUrl(
                    part.image_url.url,
                  )
                  GeminiProvider.validateImageType(mimeType)

                  return {
                    inlineData: {
                      data: base64Data,
                      mimeType,
                    },
                  }
                }
              }
            })
          : [{ text: message.content }]

        return {
          role: 'user',
          parts: contentParts,
        }
      }
      case 'assistant': {
        const contentParts: Part[] = [
          ...(message.content === '' ? [] : [{ text: message.content }]),
          ...(message.tool_calls?.map((toolCall): FunctionCallPart => {
            try {
              const args = JSON.parse(toolCall.arguments ?? '{}')
              const part: FunctionCallPartWithThinking = { functionCall: { name: toolCall.name, args } }
              if (toolCall.thought_signature) {
                part.thoughtSignature = toolCall.thought_signature
              }
              return part as FunctionCallPart
            } catch {
              // If the arguments are not valid JSON, return an empty object
              const part: FunctionCallPartWithThinking = {
                functionCall: { name: toolCall.name, args: {} },
              }
              if (toolCall.thought_signature) {
                part.thoughtSignature = toolCall.thought_signature
              }
              return part as FunctionCallPart
            }
          }) ?? []),
        ]

        if (contentParts.length === 0) {
          return null
        }

        return {
          role: 'model',
          parts: contentParts,
        }
      }
      case 'tool': {
        return {
          role: 'user',
          parts: [
            {
              functionResponse: {
                name: message.tool_call.name,
                response: { result: message.content }, // Gemini requires a response object
              },
            },
          ],
        }
      }
    }
  }

  static parseNonStreamingResponse(
    response: GenerateContentResult,
    model: string,
    messageId: string,
  ): LLMResponseNonStreaming {
    return {
      id: messageId,
      choices: [
        {
          finish_reason:
            response.response.candidates?.[0]?.finishReason ?? null,
          message: {
            content: response.response.text(),
            role: 'assistant',
            tool_calls: (() => {
              // Use raw candidates parts so we can capture thoughtSignature.
              // response.response.functionCalls() discards that field.
              const parts = (response.response.candidates?.[0]?.content
                ?.parts ?? []) as GeminiRawPart[]
              const fnParts = parts.filter((p) => p.functionCall)
              if (fnParts.length === 0) return undefined
              return fnParts.map((part) => ({
                id: uuidv4(),
                type: 'function' as const,
                function: {
                  name: part.functionCall!.name,
                  arguments: JSON.stringify(part.functionCall!.args),
                },
                thought_signature: part.thoughtSignature ?? undefined,
              }))
            })(),
          },
        },
      ],
      created: Date.now(),
      model: model,
      object: 'chat.completion',
      usage: response.response.usageMetadata
        ? {
            prompt_tokens: response.response.usageMetadata.promptTokenCount,
            completion_tokens:
              response.response.usageMetadata.candidatesTokenCount,
            total_tokens: response.response.usageMetadata.totalTokenCount,
          }
        : undefined,
    }
  }

  static parseStreamingResponseChunk(
    chunk: EnhancedGenerateContentResponse,
    model: string,
    messageId: string,
  ): LLMResponseStreaming {
    return {
      id: messageId,
      choices: [
        {
          finish_reason: chunk.candidates?.[0]?.finishReason ?? null,
          delta: {
            content: chunk.text(),
            tool_calls: (() => {
              // Use raw candidates parts so we can capture thoughtSignature.
              // chunk.functionCalls() discards that field.
              const parts = (chunk.candidates?.[0]?.content?.parts ??
                []) as GeminiRawPart[]
              const fnParts = parts.filter((p) => p.functionCall)
              if (fnParts.length === 0) return undefined
              return fnParts.map((part, index) => ({
                index,
                id: uuidv4(),
                type: 'function' as const,
                function: {
                  name: part.functionCall!.name,
                  arguments: JSON.stringify(part.functionCall!.args),
                },
                thought_signature: part.thoughtSignature ?? undefined,
              }))
            })(),
          },
        },
      ],
      created: Date.now(),
      model: model,
      object: 'chat.completion.chunk',
      usage: chunk.usageMetadata
        ? {
            prompt_tokens: chunk.usageMetadata.promptTokenCount,
            completion_tokens: chunk.usageMetadata.candidatesTokenCount,
            total_tokens: chunk.usageMetadata.totalTokenCount,
          }
        : undefined,
    }
  }

  private static removeAdditionalProperties(schema: unknown): unknown {
    // TODO: Remove this function when Gemini supports additionalProperties field in JSON schema
    if (typeof schema !== 'object' || schema === null) {
      return schema
    }

    if (Array.isArray(schema)) {
      return schema.map((item) => this.removeAdditionalProperties(item))
    }

    // FIX: Instead of destructuring into an unused variable ('_'),
    // we use filter to exclude the key. This satisfies the linter.
    const record = schema as Record<string, unknown>

    return Object.fromEntries(
      Object.entries(record)
        .filter(([key]) => key !== 'additionalProperties') // Exclude here
        .map(([key, value]) => [key, this.removeAdditionalProperties(value)]),
    )
  }

  private static parseRequestTool(tool: RequestTool): GeminiTool {
    // Gemini does not support additionalProperties field in JSON schema, so we need to clean it
    const cleanedParameters = this.removeAdditionalProperties(
      tool.function.parameters,
    ) as Record<string, unknown>

    return {
      functionDeclarations: [
        {
          name: tool.function.name,
          description: tool.function.description,
          parameters: {
            type: SchemaType.OBJECT,
            properties: (cleanedParameters.properties ?? {}) as Record<
              string,
              Schema
            >,
          },
        },
      ],
    }
  }

  private static validateImageType(mimeType: string) {
    const SUPPORTED_IMAGE_TYPES = [
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/heic',
      'image/heif',
    ]
    if (!SUPPORTED_IMAGE_TYPES.includes(mimeType)) {
      throw new Error(
        `Gemini does not support image type ${mimeType}. Supported types: ${SUPPORTED_IMAGE_TYPES.join(
          ', ',
        )}`,
      )
    }
  }

  async getEmbedding(model: string, text: string): Promise<number[]> {
    if (!this.apiKey) {
      throw new LLMAPIKeyNotSetException(
        `Provider ${this.provider.id} API key is missing. Please set it in settings menu.`,
      )
    }

    try {
      const response = await this.client
        .getGenerativeModel({ model: model })
        .embedContent(text)
      return response.embedding.values
    } catch (error) {
      if (error.status === 429) {
        throw new LLMRateLimitExceededException(
          'Gemini API rate limit exceeded. Please try again later.',
        )
      }
      throw error
    }
  }
}

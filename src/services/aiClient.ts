import { env } from "@/config/env";

const GEMINI_MODEL = "gemini-2.5-flash";

export class AIClientError extends Error {
  status?: number;
  code?: string;
  retryDelay?: string;

  constructor(
    message: string,
    options?: {
      status?: number;
      code?: string;
      retryDelay?: string;
    },
  ) {
    super(message);
    this.name = "AIClientError";
    this.status = options?.status;
    this.code = options?.code;
    this.retryDelay = options?.retryDelay;
  }
}

export function isQuotaExceededError(error: unknown) {
  return error instanceof AIClientError
    && (error.status === 429 || error.code === "RESOURCE_EXHAUSTED");
}

export async function sendPrompt(prompt: string) {
  if (!env.GEMINI_API_KEY) {
    throw new AIClientError("Missing GEMINI_API_KEY");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.8,
          responseMimeType: "application/json",
        },
      }),
    },
  );

  const rawText = await response.text();

  if (!response.ok) {
    try {
      const parsed = JSON.parse(rawText) as {
        error?: {
          message?: string;
          status?: string;
          details?: Array<{
            "@type"?: string;
            retryDelay?: string;
          }>;
        };
      };

      const retryDelay = parsed.error?.details?.find(
        (detail) => detail["@type"] === "type.googleapis.com/google.rpc.RetryInfo",
      )?.retryDelay;

      throw new AIClientError(parsed.error?.message || "Gemini request failed", {
        status: response.status,
        code: parsed.error?.status,
        retryDelay,
      });
    } catch (error) {
      if (error instanceof AIClientError) {
        throw error;
      }

      throw new AIClientError(rawText || "Gemini request failed", {
        status: response.status,
      });
    }
  }

  return JSON.parse(rawText);
}

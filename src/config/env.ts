import Constants from "expo-constants";

type AppEnv = {
  GEMINI_API_KEY: string;
};

const configExtra = Constants.expoConfig?.extra ?? {};

export const env: AppEnv = {
  GEMINI_API_KEY:
    (typeof configExtra.GEMINI_API_KEY === "string" ? configExtra.GEMINI_API_KEY : "")
    || process.env.GEMINI_API_KEY
    || "",
};

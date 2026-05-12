import axios from "axios";

export function getApiErrorMessage(error: unknown, fallbackMessage: string) {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }
    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) => {
          if (!item || typeof item !== "object") {
            return null;
          }

          const message =
            "msg" in item && typeof item.msg === "string" && item.msg.trim() ? item.msg.trim() : null;
          const location =
            "loc" in item && Array.isArray(item.loc)
              ? item.loc.filter((part): part is string | number => typeof part === "string" || typeof part === "number")
              : [];

          if (!message) {
            return null;
          }

          if (location.length === 0) {
            return message;
          }

          return `${location.join(" → ")}: ${message}`;
        })
        .filter((item): item is string => Boolean(item));

      if (messages.length > 0) {
        return messages.join(". ");
      }
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}

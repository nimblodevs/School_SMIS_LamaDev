export function getSecureImageUrl(info: unknown): string | undefined {
  if (
    typeof info === "object" &&
    info !== null &&
    "secure_url" in info &&
    typeof info.secure_url === "string"
  ) {
    return info.secure_url;
  }

  return undefined;
}

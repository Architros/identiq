/** Returns true when response is a service-unavailable signal (caller should use local fallback). */
export function isServiceUnavailableResponse(res: Response): boolean {
  return res.status === 503;
}

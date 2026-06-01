export type IdeasChatSummary = {
  id: string;
  brandId: string;
  title: string;
  /** Optional prompt or context line under the title in history. */
  subtitle?: string;
  updatedAt: string;
  createdAt: string;
};
